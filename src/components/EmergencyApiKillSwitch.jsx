import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Power,
  RefreshCw,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  Flame,
  CreditCard,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const CORE_WATCHED_APIS = [
  {
    label: 'Compute Engine API',
    service: 'compute.googleapis.com',
    aliases: ['compute.googleapis.com'],
  },
  {
    label: 'Vertex AI API',
    service: 'aiplatform.googleapis.com',
    aliases: ['aiplatform.googleapis.com'],
  },
  {
    label: 'Cloud Run API',
    service: 'run.googleapis.com',
    aliases: ['run.googleapis.com'],
  },
  {
    label: 'BigQuery API',
    service: 'bigquery.googleapis.com',
    aliases: ['bigquery.googleapis.com'],
  },
  {
    label: 'Cloud Storage API',
    service: 'storage.googleapis.com',
    aliases: [
      'storage.googleapis.com',
      'storage-component.googleapis.com',
      'storage-api.googleapis.com',
    ],
  },
  {
    label: 'Kubernetes Engine (GKE)',
    service: 'container.googleapis.com',
    aliases: ['container.googleapis.com'],
  },
];

const HIGH_IMPACT_SET = new Set([
  'compute.googleapis.com',
  'aiplatform.googleapis.com',
  'run.googleapis.com',
  'bigquery.googleapis.com',
  'storage.googleapis.com',
  'container.googleapis.com',
  'generativelanguage.googleapis.com',
  'sqladmin.googleapis.com',
  'alloydb.googleapis.com',
  'spanner.googleapis.com',
  'dataflow.googleapis.com',
  'dataproc.googleapis.com',
  'cloudfunctions.googleapis.com',
]);

export default function EmergencyApiKillSwitch({
  projectId,
  enabledApis = [],
  onRefresh,
  onOpenFinOps,
  onShowToast,
  onShowError,
}) {
  // 1) Project-Wide Billing Kill-Switch State
  const [billingStatus, setBillingStatus] = useState(null);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [confirmKillBilling, setConfirmKillBilling] = useState(false);
  const [stopAllVmsOnKill, setStopAllVmsOnKill] = useState(true);
  const [togglingBilling, setTogglingBilling] = useState(false);
  const [selectedRestoreBillingAccount, setSelectedRestoreBillingAccount] =
    useState('');

  // 1.5) Native Cloud Billing Spend Cap Circuit-Breaker State (`billingbudgets.googleapis.com/v1`)
  const [spendCapCatalog, setSpendCapCatalog] = useState(null);
  const [busySpendCapKey, setBusySpendCapKey] = useState(null);
  const [quickCapAmountUsd, setQuickCapAmountUsd] = useState(15);

  // 2) Individual Service API Kill-Switch State
  const [localApis, setLocalApis] = useState(enabledApis);
  const [loadingApis, setLoadingApis] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDisableApi, setConfirmDisableApi] = useState(null);
  const [busyApis, setBusyApis] = useState({});
  const [enableServiceInput, setEnableServiceInput] = useState('');
  const [enabling, setEnabling] = useState(false);
  const [showAllApis, setShowAllApis] = useState(false);

  // 3) Innovation #4: Live GCP API Quota Saturation & HTTP 429 Outage Early-Warning Radar
  const [quotaRadar, setQuotaRadar] = useState(null);
  const [loadingQuotas, setLoadingQuotas] = useState(false);
  const [copiedQuotaId, setCopiedQuotaId] = useState(null);
  const [showAllQuotas, setShowAllQuotas] = useState(false);

  // Sync when parent overview updates enabledApis
  useEffect(() => {
    if (Array.isArray(enabledApis) && enabledApis.length > 0) {
      setLocalApis(enabledApis);
    }
  }, [enabledApis]);

  const fetchQuotaRadar = useCallback(async () => {
    if (!projectId) return;
    setLoadingQuotas(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/quotas/radar`
      );
      setQuotaRadar(res.data);
    } catch {
      // ignore silent errors
    } finally {
      setLoadingQuotas(false);
    }
  }, [projectId]);

  const fetchBillingStatus = useCallback(async () => {
    if (!projectId) return;
    setLoadingBilling(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/billing`
      );
      setBillingStatus(res.data);
      if (res.data?.previousBillingAccountName) {
        setSelectedRestoreBillingAccount(res.data.previousBillingAccountName);
      } else if (res.data?.openBillingAccounts?.[0]?.name) {
        setSelectedRestoreBillingAccount(res.data.openBillingAccounts[0].name);
      }
    } catch {
      // ignore initial error
    } finally {
      setLoadingBilling(false);
    }
  }, [projectId]);

  const fetchLiveApis = useCallback(
    async (forceRefresh = false) => {
      if (!projectId) return;
      setLoadingApis(true);
      try {
        const res = await axios.get(
          `/api/project/${encodeURIComponent(projectId)}/apis${
            forceRefresh ? '?refresh=true' : ''
          }`
        );
        if (Array.isArray(res.data?.enabledApis)) {
          setLocalApis(res.data.enabledApis);
        }
      } catch {
        // Fallback to prop if request fails
      } finally {
        setLoadingApis(false);
      }
    },
    [projectId]
  );

  const fetchSpendCapCatalog = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(
          projectId
        )}/billing-guardian/spend-cap-catalog`
      );
      if (res.data?.ok) {
        setSpendCapCatalog(res.data);
      }
    } catch {
      // ignore if offline
    }
  }, [projectId]);

  const handleQuickArmServiceSpendCap = async (srvObj, customUsd) => {
    if (!projectId || !srvObj?.name) return;
    const capUsd = Number(customUsd || quickCapAmountUsd || 15);
    setBusySpendCapKey(`ARM:${srvObj.name}`);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/billing-guardian/budgets/create`,
        {
          billingAccountName:
            billingStatus?.billingAccountName ||
            spendCapCatalog?.billingAccountName ||
            '',
          displayName: `${projectId}-${srvObj.key.toLowerCase()}-cap-${capUsd}usd`,
          amountUsd: capUsd,
          currencyCode: billingStatus?.currencyCode || 'USD',
          enableSpendCap: true,
          serviceResourceName: srvObj.name,
          projectResourceName: spendCapCatalog?.projectResourceName || '',
          creditTypesTreatment: 'EXCLUDE_ALL_CREDITS',
          thresholdPercents: [50, 80, 100],
        }
      );
      if (res.data?.ok) {
        if (onShowToast) {
          onShowToast(
            res.data.message ||
              `Armed $${capUsd}/mo Native Spend Cap on ${srvObj.displayName}!`
          );
        }
        await fetchSpendCapCatalog();
      }
    } catch (err) {
      if (err?.__cancelledByUser || err?.response?.status === 499) return;
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            `Failed to arm Spend Cap on ${srvObj.displayName}.`
        );
      }
    } finally {
      setBusySpendCapKey(null);
    }
  };

  const handleQuickToggleBudgetSpendCap = async (budgetName, action) => {
    if (!projectId || !budgetName) return;
    setBusySpendCapKey(`${action}:${budgetName}`);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/billing-guardian/budgets/spend-cap-action`,
        {
          budgetName,
          action,
        }
      );
      if (res.data?.ok) {
        if (onShowToast) {
          onShowToast(res.data.message || `Updated Spend Cap (${action}).`);
        }
        await fetchSpendCapCatalog();
      }
    } catch (err) {
      if (err?.__cancelledByUser || err?.response?.status === 499) return;
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            `Failed to update Spend Cap (${action}).`
        );
      }
    } finally {
      setBusySpendCapKey(null);
    }
  };

  // Load live Billing Account status, Spend Cap Catalog, Quota Radar & Enabled APIs on mount or project change
  useEffect(() => {
    if (projectId) {
      fetchBillingStatus();
      fetchSpendCapCatalog();
      fetchQuotaRadar();
      if (!enabledApis || enabledApis.length === 0) {
        fetchLiveApis(false);
      }
    }
  }, [
    projectId,
    enabledApis,
    fetchBillingStatus,
    fetchSpendCapCatalog,
    fetchQuotaRadar,
    fetchLiveApis,
  ]);

  const handleBillingKillSwitch = async (action) => {
    setTogglingBilling(true);
    setConfirmKillBilling(false);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/billing/kill-switch`,
        {
          action,
          billingAccountName:
            action === 'ENABLE' ? selectedRestoreBillingAccount : '',
          stopAllVms: action === 'DISABLE' ? stopAllVmsOnKill : false,
        }
      );
      if (res.data?.billing) {
        setBillingStatus(res.data.billing);
        if (res.data.billing.previousBillingAccountName) {
          setSelectedRestoreBillingAccount(
            res.data.billing.previousBillingAccountName
          );
        }
      } else {
        await fetchBillingStatus();
      }
      if (onShowToast) {
        onShowToast(
          res.data?.message ||
            (action === 'DISABLE'
              ? `Unlinked Billing Account from ${projectId}!`
              : `Re-linked Billing Account to ${projectId}!`)
        );
      }
      if (onRefresh) await onRefresh();
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            `Failed to ${action.toLowerCase()} Cloud Billing for ${projectId}`
        );
      }
    } finally {
      setTogglingBilling(false);
    }
  };

  const activeApis = useMemo(() => {
    const source =
      localApis && localApis.length > 0 ? localApis : enabledApis || [];
    const hasMainStorage = source.some(
      (a) => a.name === 'storage.googleapis.com'
    );
    return source.filter((a) => {
      if (
        hasMainStorage &&
        (a.name === 'storage-component.googleapis.com' ||
          a.name === 'storage-api.googleapis.com')
      ) {
        return false;
      }
      return true;
    });
  }, [localApis, enabledApis]);

  const enabledNamesSet = useMemo(
    () => new Set(activeApis.map((a) => (a.name || '').toLowerCase())),
    [activeApis]
  );

  // Only show core presets in "Re-Enable" if they are currently NOT enabled!
  const disabledCorePresets = useMemo(() => {
    return CORE_WATCHED_APIS.filter(
      (preset) => !preset.aliases.some((alias) => enabledNamesSet.has(alias))
    );
  }, [enabledNamesSet]);

  const filteredApis = useMemo(() => {
    if (!searchQuery.trim()) return activeApis;
    const q = searchQuery.toLowerCase();
    return activeApis.filter(
      (a) =>
        (a.name || '').toLowerCase().includes(q) ||
        (a.title || '').toLowerCase().includes(q)
    );
  }, [activeApis, searchQuery]);

  const displayedApis = useMemo(() => {
    if (searchQuery.trim() || showAllApis) return filteredApis;
    return filteredApis.slice(0, 18);
  }, [filteredApis, searchQuery, showAllApis]);

  const handleToggleApi = async (serviceName, action) => {
    setBusyApis((prev) => ({ ...prev, [serviceName]: action }));
    setConfirmDisableApi(null);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/apis/toggle`,
        {
          serviceName,
          action,
          disableDependentServices: true,
        }
      );
      if (Array.isArray(res.data?.enabledApis)) {
        setLocalApis(res.data.enabledApis);
      } else if (action === 'DISABLE') {
        setLocalApis((prev) => prev.filter((a) => a.name !== serviceName));
      }
      if (onShowToast) {
        onShowToast(
          res.data?.message ||
            `${action === 'DISABLE' ? 'Disabled' : 'Enabled'} ${serviceName}`
        );
      }
      if (onRefresh) await onRefresh();
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            `Failed to ${action.toLowerCase()} ${serviceName}`
        );
      }
    } finally {
      setTimeout(() => {
        setBusyApis((prev) => {
          const next = { ...prev };
          delete next[serviceName];
          return next;
        });
      }, 2500);
    }
  };

  const handleEnableSubmit = async (e, presetService) => {
    if (e) e.preventDefault();
    const target = (presetService || enableServiceInput).trim().toLowerCase();
    if (!target || enabling) return;
    if (enabledNamesSet.has(target)) {
      if (onShowToast) {
        onShowToast(`${target} is already ENABLED on ${projectId}.`);
      }
      setEnableServiceInput('');
      return;
    }
    setEnabling(true);
    try {
      await handleToggleApi(target, 'ENABLE');
      setEnableServiceInput('');
    } finally {
      setEnabling(false);
    }
  };

  const isBillingEnabled = billingStatus?.billingEnabled !== false;

  return (
    <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-5">
      {/* Plain-English 3-Tier Emergency Cost-Stop Guide */}
      <div className="p-3.5 rounded-xl bg-blue-500/[0.06] dark:bg-blue-500/10 border border-blue-500/25 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
        <strong className="text-zinc-900 dark:text-zinc-100">
          Which Cost-Stop Defense should I use?
        </strong>{' '}
        This panel gives you three graduated ways to stop runaway cloud bills:{' '}
        <strong className="text-red-600 dark:text-red-400">
          (1) DEFCON-1 Project Billing Kill-Switch
        </strong>{' '}
        is the nuclear emergency button—it detaches your Cloud Billing Account
        from the entire project so 100% of billable spend stops immediately
        (best if an admin key is compromised).{' '}
        <strong className="text-emerald-600 dark:text-emerald-400">
          (2) Surgical Per-Service Native Spend Caps
        </strong>{' '}
        let you set a monthly dollar ceiling on individual services like{' '}
        <strong>Gemini API</strong>, <strong>Vertex AI</strong>,{' '}
        <strong>Cloud Run</strong>, or <strong>Cloud Functions</strong> so
        Google Cloud automatically pauses only that service if it hits 100% of
        your cap while the rest of your project stays online.{' '}
        <strong className="text-zinc-900 dark:text-zinc-100">
          (3) Granular Service API Kill-Switch
        </strong>{' '}
        lets you manually disable or re-enable any individual Google Cloud API
        right now via <code className="font-mono">serviceusage.googleapis.com</code>.
      </div>

      {/* ===================================================================== */}
      {/* LEVEL 1: ULTIMATE PROJECT KILL-SWITCH (CLOUD BILLING CIRCUIT BREAKER) */}
      {/* ===================================================================== */}
      <div
        className={`relative overflow-hidden rounded-xl border p-4 transition-all ${
          togglingBilling
            ? 'border-red-500/50 bg-red-500/10 opacity-70 grayscale-[40%]'
            : !billingStatus
            ? 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#131314]'
            : isBillingEnabled
            ? 'border-red-500/35 bg-red-50/50 dark:bg-red-950/20'
            : 'border-emerald-500/40 bg-emerald-500/[0.07] dark:bg-emerald-950/20'
        }`}
      >
        {togglingBilling && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-red-500/20 overflow-hidden">
            <div className="h-full w-1/2 bg-red-500 animate-pulse" />
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              {isBillingEnabled ? (
                <ShieldAlert className="w-5 h-5 text-zinc-500 dark:text-zinc-400 shrink-0" />
              ) : (
                <Lock className="w-5 h-5 text-zinc-500 dark:text-zinc-400 shrink-0" />
              )}
              <span className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
                DEFCON-1 Project Emergency Kill-Switch (Billing Circuit Breaker)
              </span>
              {loadingBilling && !billingStatus ? (
                <span className="text-[10px] font-mono bg-zinc-500/10 text-zinc-400 px-2 py-0.5 rounded-full">
                  CHECKING BILLING...
                </span>
              ) : isBillingEnabled ? (
                <span className="text-[10px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  BILLING ENABLED · SPENDING ACTIVE
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  BILLING UNLINKED · $0.00 LOCKDOWN ACTIVE
                </span>
              )}
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              {isBillingEnabled ? (
                <>
                  Got hacked or leaked an API key? Detach the Cloud Billing
                  Account from{' '}
                  <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-200">
                    {projectId}
                  </span>{' '}
                  via <code className="font-mono">cloudbilling.googleapis.com</code> to{' '}
                  <strong className="text-red-600 dark:text-red-400">
                    immediately stop all money spending ($0.00)
                  </strong>{' '}
                  across the entire project.
                </>
              ) : (
                <>
                  Project{' '}
                  <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-200">
                    {projectId}
                  </span>{' '}
                  is currently detached from Cloud Billing. No billable charges
                  can be incurred by any API key or resource.
                </>
              )}
            </p>

            {/* Current Active Billing Account Badge */}
            {billingStatus && (
              <div className="pt-1 flex flex-wrap items-center gap-3 text-xs">
                <div className="inline-flex items-center gap-1.5 font-mono bg-white/80 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 rounded-md">
                  <CreditCard className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                  <span className="text-zinc-500">Active Billing Account:</span>
                  {billingStatus.billingEnabled ? (
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {billingStatus.billingAccountDisplayName} (
                      {billingStatus.billingAccountName}) ·{' '}
                      {billingStatus.currencyCode}
                    </span>
                  ) : (
                    <span className="font-bold text-red-500">
                      NONE (Unlinked / Disabled)
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Action Area: Kill Billing or Restore Billing */}
          <div className="shrink-0">
            {togglingBilling ? (
              <div className="inline-flex items-center gap-2 bg-red-500/15 text-red-500 border border-red-500/30 px-4 py-2.5 rounded-xl text-xs font-mono font-bold">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>
                  {isBillingEnabled
                    ? 'SEVERING BILLING ACCOUNT...'
                    : 'RE-LINKING BILLING ACCOUNT...'}
                </span>
              </div>
            ) : isBillingEnabled ? (
              !confirmKillBilling ? (
                <button
                  type="button"
                  onClick={() => setConfirmKillBilling(true)}
                  className="w-full lg:w-auto inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <Power className="w-4 h-4" />
                  <span>KILL PROJECT BILLING (STOP SPENDING)</span>
                </button>
              ) : null
            ) : (
              /* Re-Link Billing Controls when project is in $0 lockdown */
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {billingStatus?.openBillingAccounts?.length > 0 && (
                  <select
                    value={selectedRestoreBillingAccount}
                    onChange={(e) =>
                      setSelectedRestoreBillingAccount(e.target.value)
                    }
                    aria-label="Select Billing Account to re-link"
                    className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                  >
                    {billingStatus.openBillingAccounts.map((acct) => (
                      <option key={acct.name} value={acct.name}>
                        {acct.displayName} ({acct.name.replace('billingAccounts/', '')})
                      </option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  onClick={() => handleBillingKillSwitch('ENABLE')}
                  className="inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Restore & Re-Link Billing</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 2-Step Confirmation Drawer for Project Billing Kill-Switch */}
        {confirmKillBilling && isBillingEnabled && (
          <div className="mt-4 pt-3.5 border-t border-red-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-red-500/10 p-3.5 rounded-lg">
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  Confirm Emergency Billing Detachment for &ldquo;{projectId}
                  &rdquo;?
                </span>
              </div>
              <p className="text-[11px] text-zinc-700 dark:text-zinc-300">
                This sends{' '}
                <code className="font-mono">
                  PUT /v1/projects/{projectId}/billingInfo
                </code>{' '}
                with <code className="font-mono">billingAccountName: &quot;&quot;</code> to
                unlink{' '}
                <strong>
                  {billingStatus?.billingAccountDisplayName || 'your billing account'}
                </strong>
                . All billable resources and leaked keys will immediately stop
                spending money. You can re-link the billing account here in 1
                tap anytime.
              </p>
              <label className="inline-flex items-center gap-2 text-xs font-medium text-zinc-900 dark:text-zinc-100 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stopAllVmsOnKill}
                  onChange={(e) => setStopAllVmsOnKill(e.target.checked)}
                  className="rounded border-zinc-400 text-red-600 focus:ring-red-500"
                />
                <span>
                  Also stop all running Compute Engine VMs in {projectId}
                </span>
              </label>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleBillingKillSwitch('DISABLE')}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Yes, Unlink Billing & Freeze Spend
              </button>
              <button
                type="button"
                onClick={() => setConfirmKillBilling(false)}
                className="bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-xs px-3 py-2 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* LEVEL 1.5: SURGICAL PER-SERVICE NATIVE SPEND CAP GUARD (`spendCap`)   */}
      {/* ===================================================================== */}
      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-2.5 font-mono text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-zinc-900 dark:text-zinc-100">
                Surgical Alternative to Unlinking Billing: Native Per-Service Spend Caps (
                <code>GoogleCloudBillingBudgetsV1SpendCap</code>)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                PAUSE 1 SERVICE AT 100% GROSS CAP
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Instead of detaching your entire project&apos;s Billing Account
              above, arm a monthly USD hard cap on individual high-risk APIs (
              <code>EXCLUDE_ALL_CREDITS</code>) so Google Cloud pauses only that
              API if it bleeds money.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 py-1">
              <span className="text-[10px] text-zinc-500">Cap $:</span>
              <input
                type="number"
                min={1}
                value={quickCapAmountUsd}
                onChange={(e) => setQuickCapAmountUsd(e.target.value)}
                className="w-14 text-xs font-extrabold bg-transparent focus:outline-none"
              />
              <span className="text-[10px] text-zinc-500">/mo</span>
            </div>
            {onOpenFinOps && (
              <button
                type="button"
                onClick={onOpenFinOps}
                className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-extrabold cursor-pointer"
              >
                Open Full Spend Cap Studio (FinOps) →
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {(spendCapCatalog?.resolvedServices || [])
            .filter((s) => s.spendCapEligible)
            .map((srv) => {
              const existingBudget = (spendCapCatalog?.budgets || []).find(
                (b) => (b.services || []).includes(srv.name)
              );
              const outState =
                existingBudget?.spendCap?.outputState ||
                (existingBudget?.spendCapConfigured
                  ? 'CONFIGURED'
                  : 'NOT_CONFIGURED');
              return (
                <div
                  key={srv.name}
                  className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-extrabold text-zinc-900 dark:text-zinc-100 truncate">
                        {srv.displayName}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                          outState === 'ENFORCED'
                            ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                            : outState === 'CONFIGURED'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : outState === 'AWAITING_NEXT_PERIOD'
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                            : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                        }`}
                      >
                        {existingBudget
                          ? `${outState} ($${existingBudget.amountUsd}/mo)`
                          : 'NO CAP'}
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate mt-0.5">
                      {srv.apiHost} · {srv.name}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                    {existingBudget ? (
                      outState === 'CONFIGURED' || outState === 'ENFORCED' ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleQuickToggleBudgetSpendCap(
                              existingBudget.name,
                              'LIFT_CAP'
                            )
                          }
                          disabled={
                            busySpendCapKey === `LIFT_CAP:${existingBudget.name}`
                          }
                          className="px-2 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-extrabold cursor-pointer"
                        >
                          Lift Cap (AWAITING_NEXT_PERIOD)
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            handleQuickToggleBudgetSpendCap(
                              existingBudget.name,
                              'ARM_CAP'
                            )
                          }
                          disabled={
                            busySpendCapKey === `ARM_CAP:${existingBudget.name}`
                          }
                          className="px-2 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold cursor-pointer"
                        >
                          Re-Arm Cap (CONFIGURED)
                        </button>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          handleQuickArmServiceSpendCap(srv, quickCapAmountUsd)
                        }
                        disabled={busySpendCapKey === `ARM:${srv.name}`}
                        className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-extrabold cursor-pointer"
                      >
                        {busySpendCapKey === `ARM:${srv.name}`
                          ? 'Arming...'
                          : `+ Arm $${quickCapAmountUsd}/mo Spend Cap`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* LEVEL 2: INDIVIDUAL SERVICE API KILL-SWITCH & MANAGER                 */}
      {/* ===================================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4 pt-1">
        <div>
          <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2 flex-wrap">
            <ShieldCheck className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            <span>
              Granular Service API Kill-Switch (
              {loadingApis && activeApis.length === 0
                ? 'Scanning...'
                : `${activeApis.length} Enabled`}
              )
            </span>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Want to keep the project online but kill a specific service? Inspect
            all enabled APIs on{' '}
            <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">
              {projectId}
            </span>{' '}
            below and disable any individual API in 2 taps.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search enabled APIs (e.g. compute, ai)..."
              aria-label="Filter enabled APIs"
              className="w-full bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] pl-9 pr-3 py-2 text-xs text-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              fetchBillingStatus();
              fetchLiveApis(true);
            }}
            disabled={loadingApis}
            title="Sync live Billing & Enabled APIs from Google Cloud"
            className="inline-flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-3 py-2 text-xs font-semibold transition-colors shrink-0 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loadingApis ? 'animate-spin' : ''}`}
            />
            <span className="hidden sm:inline">Sync Status</span>
          </button>
        </div>
      </div>

      {/* ENABLED APIS GRID (Shown FIRST so user immediately sees active APIs to disable) */}
      {loadingApis && activeApis.length === 0 ? (
        <div className="py-10 text-center text-xs text-zinc-500 flex flex-col items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-zinc-500 dark:text-zinc-400" />
          <span>
            Querying live enabled APIs from{' '}
            <code className="font-mono">serviceusage.googleapis.com</code> for{' '}
            <span className="font-mono font-semibold">{projectId}</span>...
          </span>
        </div>
      ) : filteredApis.length === 0 ? (
        <div className="py-8 text-center text-xs text-zinc-500">
          No enabled Google Cloud APIs match &ldquo;{searchQuery}&rdquo; in{' '}
          <span className="font-mono">{projectId}</span>.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {displayedApis.map((api) => {
              const busyState = busyApis[api.name];
              const isDisabling = busyState === 'DISABLE';
              const isConfirming = confirmDisableApi === api.name;
              const isHighImpact = HIGH_IMPACT_SET.has(api.name);
              const matchedCatalogSrv = (
                spendCapCatalog?.resolvedServices || []
              ).find((s) => s.apiHost === api.name && s.spendCapEligible);
              const matchedSpendCapBudget = matchedCatalogSrv
                ? (spendCapCatalog?.budgets || []).find((b) =>
                    (b.services || []).includes(matchedCatalogSrv.name)
                  )
                : null;

              return (
                <div
                  key={api.name}
                  className={`relative overflow-hidden p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                    isDisabling
                      ? 'border-red-500/40 bg-red-500/5 opacity-55 grayscale select-none pointer-events-none'
                      : isHighImpact
                      ? 'border-emerald-500/30 dark:border-emerald-500/25 bg-emerald-500/[0.03] dark:bg-[#131314]'
                      : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-[#131314]'
                  }`}
                >
                  {isDisabling && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-red-500/20 overflow-hidden">
                      <div className="h-full w-1/2 bg-red-500 animate-pulse" />
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        {isHighImpact && !isDisabling && (
                          <Flame
                            className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0"
                            title="High-impact billable service API"
                          />
                        )}
                        <div
                          className={`text-xs font-bold truncate ${
                            isDisabling
                              ? 'line-through text-zinc-400'
                              : 'text-zinc-900 dark:text-zinc-100'
                          }`}
                        >
                          {api.title}
                        </div>
                      </div>
                      <div className="text-[11px] font-mono text-zinc-500 truncate mt-0.5">
                        {api.name}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${
                        isDisabling
                          ? 'bg-red-500/20 text-red-500'
                          : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                      }`}
                    >
                      {isDisabling ? 'DISABLING...' : 'ENABLED'}
                    </span>
                  </div>

                  {/* Action Footer */}
                  <div className="pt-2 border-t border-zinc-200/70 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                    {isDisabling ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-red-500">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Disabling API on GCP...</span>
                      </span>
                    ) : isConfirming ? (
                      <div className="w-full flex items-center justify-between gap-1.5 bg-red-500/10 border border-red-500/30 rounded-lg px-2.5 py-1">
                        <span className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>Kill API?</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleApi(api.name, 'DISABLE')}
                            className="bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded text-[10px] font-bold"
                          >
                            Yes, Disable
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDisableApi(null)}
                            className="text-[10px] text-zinc-500 px-1"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="text-[10px] font-mono text-zinc-400 truncate">
                          {matchedSpendCapBudget
                            ? `Spend Cap: $${matchedSpendCapBudget.amountUsd}/mo (${
                                matchedSpendCapBudget.spendCap?.outputState ||
                                'CONFIGURED'
                              })`
                            : isHighImpact
                            ? 'Core Billable API'
                            : 'Active Service'}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {matchedCatalogSrv && !matchedSpendCapBudget && (
                            <button
                              type="button"
                              onClick={() =>
                                handleQuickArmServiceSpendCap(
                                  matchedCatalogSrv,
                                  quickCapAmountUsd
                                )
                              }
                              disabled={
                                busySpendCapKey ===
                                `ARM:${matchedCatalogSrv.name}`
                              }
                              className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 px-2 py-1 rounded-md transition-colors cursor-pointer"
                              title={`Arm a $${quickCapAmountUsd}/mo Native Spend Cap on ${matchedCatalogSrv.displayName} without disabling the API now`}
                            >
                              <span>+ Cap ${quickCapAmountUsd}</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setConfirmDisableApi(api.name)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                          >
                            <Power className="w-3 h-3" />
                            <span>Emergency Disable</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Expand / Collapse all enabled APIs */}
          {!searchQuery.trim() && filteredApis.length > 18 && (
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={() => setShowAllApis((prev) => !prev)}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-blue-600 dark:text-blue-400 hover:underline px-3 py-1.5 rounded-lg bg-blue-500/5 border border-blue-500/20"
              >
                {showAllApis ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>Show Top 18 High-Priority APIs</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>
                      View All {filteredApis.length} Enabled APIs on {projectId}
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* RESTORE DISABLED CORE APIS OR ENABLE NEW API */}
      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {disabledCorePresets.length > 0 ? (
            <>
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 mr-1">
                Disabled Core APIs (1-Tap Re-Enable):
              </span>
              {disabledCorePresets.map((preset) => (
                <button
                  key={preset.service}
                  type="button"
                  disabled={enabling || Boolean(busyApis[preset.service])}
                  onClick={() => handleEnableSubmit(null, preset.service)}
                  className="text-[11px] font-mono bg-white dark:bg-zinc-900 hover:bg-emerald-500/15 text-zinc-700 dark:text-zinc-300 hover:text-emerald-500 border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 rounded-md transition-colors disabled:opacity-50"
                >
                  + Re-Enable {preset.label}
                </button>
              ))}
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>
                All core APIs (Compute Engine, Vertex AI, Cloud Run, BigQuery,
                Cloud Storage, GKE) are currently ENABLED above.
              </span>
            </span>
          )}
        </div>

        <form
          onSubmit={(e) => handleEnableSubmit(e)}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={enableServiceInput}
            onChange={(e) => setEnableServiceInput(e.target.value)}
            placeholder="Enable other API (e.g. secretmanager.googleapis.com)"
            className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-3 py-1.5 text-xs font-mono text-zinc-950 dark:text-zinc-100 w-full md:w-72"
          />
          <button
            type="submit"
            disabled={enabling || !enableServiceInput.trim()}
            className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] px-3 py-1.5 text-xs font-bold transition-colors whitespace-nowrap disabled:opacity-50"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Enable New API</span>
          </button>
        </form>
      </div>

      {/* ===================================================================== */}
      {/* LEVEL 3: LIVE GCP API QUOTA SATURATION & HTTP 429 OUTAGE RADAR        */}
      {/* ===================================================================== */}
      <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-[#131314] space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-[10.5px] font-mono font-extrabold">
                LIVE API QUOTA SATURATION & HTTP 429 EARLY-WARNING RADAR
              </span>
              {quotaRadar?.criticalCount > 0 ? (
                <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-mono font-extrabold animate-pulse">
                  {quotaRadar.criticalCount} Quota(s) Near HTTP 429 Exhaustion (&ge;85%)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                  ✓ 0 HTTP 429 Quota Bottlenecks ({quotaRadar?.totalQuotasTracked || 0} Limits Monitored)
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Continuously inspects live Compute Engine Global & Regional quotas (`CPUS`, `IN_USE_ADDRESSES`, `DISKS_TOTAL_GB`, `NVIDIA_L4_GPUS`), Cloud Run Autoscaler max-instance ceilings, Secret Manager Free-Tier version saturation (`6/mo`), and BigQuery concurrency limits before your workloads hit `HTTP 429 RESOURCE_EXHAUSTED`.
            </p>
          </div>

          <button
            type="button"
            disabled={loadingQuotas}
            onClick={fetchQuotaRadar}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 text-xs font-mono font-bold cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loadingQuotas ? 'animate-spin' : ''}`}
            />
            <span>{loadingQuotas ? 'Scanning Quotas...' : 'Scan Live Quotas'}</span>
          </button>
        </div>

        {Array.isArray(quotaRadar?.quotas) && quotaRadar.quotas.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {(showAllQuotas
                ? quotaRadar.quotas
                : quotaRadar.quotas.slice(0, 9)
              ).map((q) => {
                const isCrit = q.status === 'CRITICAL_429_RISK';
                const isWarn = q.status === 'ELEVATED_WARNING';
                return (
                  <div
                    key={q.id}
                    className={`p-3 rounded-lg border space-y-2 ${
                      isCrit
                        ? 'bg-red-500/10 border-red-500/40'
                        : isWarn
                        ? 'bg-amber-500/10 border-amber-500/40'
                        : 'bg-white dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[11px] font-mono font-extrabold text-zinc-900 dark:text-zinc-100 truncate">
                          {q.metric}
                        </div>
                        <div className="text-[10px] font-mono text-zinc-500 truncate">
                          {q.serviceLabel}
                        </div>
                      </div>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold shrink-0 ${
                          isCrit
                            ? 'bg-red-600 text-white'
                            : isWarn
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : 'bg-emerald-500/15 text-emerald-500'
                        }`}
                      >
                        {q.utilizationPct}%
                      </span>
                    </div>

                    {/* Utilization Bar */}
                    <div className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          isCrit
                            ? 'bg-red-500'
                            : isWarn
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{
                          width: `${Math.max(3, Math.min(100, q.utilizationPct))}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                      <span>
                        Usage: <strong>{q.usage}</strong> / {q.limit} {q.unit}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(q.cliIncreaseCmd);
                          setCopiedQuotaId(q.id);
                          if (onShowToast) {
                            onShowToast(`Copied Quota CLI for ${q.metric}`);
                          }
                          setTimeout(() => setCopiedQuotaId(null), 1800);
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer"
                      >
                        {copiedQuotaId === q.id ? '✓ Copied CLI' : 'Quota CLI'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {quotaRadar.quotas.length > 9 && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowAllQuotas((p) => !p)}
                  className="text-xs font-mono text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {showAllQuotas
                    ? 'Show Top 9 Quotas'
                    : `Show All ${quotaRadar.quotas.length} Monitored Project & Regional Quotas`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
