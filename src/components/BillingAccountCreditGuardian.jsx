import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  RefreshCw,
  Terminal,
  Database,
  Copy,
  Check,
  ShieldAlert,
  TrendingDown,
  DollarSign,
  Calendar,
  Sliders,
} from 'lucide-react';

const STORAGE_KEY_PREFIX = 'cloudpulse_gde_grants_v1_';

function getDaysUntil(dateStr) {
  if (!dateStr) return 0;
  const target = new Date(`${dateStr}T23:59:59`);
  if (Number.isNaN(target.getTime())) return 0;
  const diffMs = target.getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function computeGdeGrantMetrics(grant, dailyBurnUsd = 0) {
  const initial = Math.max(1, Number(grant.initialAmountUsd) || 1000);
  const remaining = Math.max(0, Number(grant.remainingAmountUsd) ?? 0);
  const used = Math.max(0, initial - remaining);
  const remainingPct = Math.min(100, Math.max(0, (remaining / initial) * 100));
  const usedPct = Math.min(100, Math.max(0, 100 - remainingPct));
  const daysLeft = getDaysUntil(grant.expirationDate);
  const alertThreshold = Math.max(1, Number(grant.alertDaysThreshold) || 30);

  const safeDailyBurn = Math.max(0, Number(dailyBurnUsd) || 0);
  const projectedSpendUntilExpiry =
    daysLeft > 0 ? safeDailyBurn * daysLeft : 0;
  const strandedMoneyUsd =
    daysLeft > 0
      ? Math.max(0, remaining - projectedSpendUntilExpiry)
      : remaining;

  const daysUntilExhausted =
    safeDailyBurn > 0.01 ? remaining / safeDailyBurn : Infinity;

  const willExhaustBeforeExpiry =
    daysLeft > 0 &&
    remaining > 0 &&
    Number.isFinite(daysUntilExhausted) &&
    daysUntilExhausted < daysLeft;

  let status = 'HEALTHY';
  if (daysLeft <= 0 && remaining > 0) {
    status = 'EXPIRED_WITH_BALANCE';
  } else if (daysLeft <= 0) {
    status = 'EXPIRED';
  } else if (remaining <= 0) {
    status = 'DEPLETED';
  } else if (daysLeft <= 14) {
    status = 'CRITICAL_EXPIRY';
  } else if (daysLeft <= alertThreshold) {
    status = 'WARNING_EXPIRY';
  } else if (willExhaustBeforeExpiry && daysUntilExhausted <= 14) {
    status = 'WARNING_EARLY_DEPLETION';
  }

  const requiredDailyBurnToUseAll =
    daysLeft > 0 ? remaining / daysLeft : remaining;

  return {
    initial,
    remaining,
    used,
    remainingPct,
    usedPct,
    daysLeft,
    alertThreshold,
    projectedSpendUntilExpiry,
    strandedMoneyUsd,
    daysUntilExhausted,
    willExhaustBeforeExpiry,
    requiredDailyBurnToUseAll,
    status,
  };
}

export default function BillingAccountCreditGuardian({
  projectId,
  liveBurn,
  onOpenBigQuerySql,
  onRunInShell,
  onShowToast,
  onGrantsSummaryChange,
}) {
  const [billingInfo, setBillingInfo] = useState({
    billingAccountName: 'billingAccounts/01A9F2-88C4E1-3B7D09',
    billingAccountId: '01A9F2-88C4E1-3B7D09',
    displayName: 'Google Cloud GDE & Developer Billing Account',
    billingEnabled: true,
    open: true,
    currencyCode: 'USD',
    source: 'cloudbilling.googleapis.com',
  });
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGrantId, setEditingGrantId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const defaultExpiry30d = useMemo(
    () => new Date(Date.now() + 25 * 86400 * 1000).toISOString().slice(0, 10),
    []
  );

  const [formState, setFormState] = useState({
    name: 'Google Developer Expert (GDE) Cloud Bonus Grant',
    grantType: 'GDE_BONUS',
    creditCode: 'GDE-2026-BONUS',
    initialAmountUsd: 1000,
    remainingAmountUsd: 450,
    expirationDate: defaultExpiry30d,
    alertDaysThreshold: 30,
    notes: 'Annual GDE promotional credit grant on Cloud Billing Account.',
  });

  const dailyBurnUsd = Number(liveBurn?.daily || 0);
  const hourlyBurnUsd = Number(liveBurn?.hourly || 0);
  const monthlyBurnUsd = Number(liveBurn?.monthly || 0);

  const loadBillingGuardian = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/billing-guardian`
      );
      if (res.data?.billingInfo) {
        setBillingInfo(res.data.billingInfo);
      }
      const localRaw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${projectId}`);
      if (localRaw) {
        try {
          const parsed = JSON.parse(localRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setGrants(parsed);
            setLoading(false);
            return;
          }
        } catch {
          // ignore invalid local cache
        }
      }
      if (Array.isArray(res.data?.grants)) {
        setGrants(res.data.grants);
        localStorage.setItem(
          `${STORAGE_KEY_PREFIX}${projectId}`,
          JSON.stringify(res.data.grants)
        );
      }
    } catch {
      // Fallback to localStorage if backend is unreachable
      const localRaw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${projectId}`);
      if (localRaw) {
        try {
          setGrants(JSON.parse(localRaw));
        } catch {
          // ignore
        }
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadBillingGuardian();
  }, [loadBillingGuardian]);

  const enrichedGrants = useMemo(() => {
    return grants.map((g) => ({
      ...g,
      metrics: computeGdeGrantMetrics(g, dailyBurnUsd),
    }));
  }, [grants, dailyBurnUsd]);

  const summary = useMemo(() => {
    let totalInitialUsd = 0;
    let totalRemainingUsd = 0;
    let totalStrandedUsd = 0;
    let nearestExpiryDays = Infinity;
    let nearestExpiryGrant = null;
    let urgentWarningsCount = 0;

    for (const item of enrichedGrants) {
      totalInitialUsd += item.metrics.initial;
      totalRemainingUsd += item.metrics.remaining;
      totalStrandedUsd += item.metrics.strandedMoneyUsd;

      if (
        item.metrics.remaining > 0 &&
        item.metrics.daysLeft > 0 &&
        item.metrics.daysLeft < nearestExpiryDays
      ) {
        nearestExpiryDays = item.metrics.daysLeft;
        nearestExpiryGrant = item;
      }

      if (
        item.metrics.status === 'CRITICAL_EXPIRY' ||
        item.metrics.status === 'WARNING_EXPIRY' ||
        item.metrics.status === 'EXPIRED_WITH_BALANCE' ||
        item.metrics.status === 'WARNING_EARLY_DEPLETION'
      ) {
        urgentWarningsCount += 1;
      }
    }

    return {
      totalInitialUsd,
      totalRemainingUsd,
      totalStrandedUsd,
      nearestExpiryDays: Number.isFinite(nearestExpiryDays)
        ? nearestExpiryDays
        : null,
      nearestExpiryGrant,
      urgentWarningsCount,
    };
  }, [enrichedGrants]);

  useEffect(() => {
    if (onGrantsSummaryChange) {
      onGrantsSummaryChange(summary);
    }
  }, [summary, onGrantsSummaryChange]);

  const persistGrants = async (nextGrants, payloadForServer) => {
    setGrants(nextGrants);
    if (projectId) {
      localStorage.setItem(
        `${STORAGE_KEY_PREFIX}${projectId}`,
        JSON.stringify(nextGrants)
      );
      if (payloadForServer) {
        await axios
          .post(
            `/api/project/${encodeURIComponent(projectId)}/billing-guardian/grants`,
            payloadForServer
          )
          .catch(() => null);
      }
    }
  };

  const handleSaveGrant = async (e) => {
    e.preventDefault();
    const normalized = {
      id: editingGrantId || `gde-grant-${Date.now().toString(36)}`,
      name: String(formState.name || 'GDE Promotional Credit Grant').trim(),
      grantType: formState.grantType || 'GDE_BONUS',
      creditCode: String(formState.creditCode || 'GDE-CREDIT').trim(),
      initialAmountUsd: Math.max(1, Number(formState.initialAmountUsd) || 500),
      remainingAmountUsd: Math.max(
        0,
        Number(formState.remainingAmountUsd) ?? 0
      ),
      expirationDate: formState.expirationDate || defaultExpiry30d,
      alertDaysThreshold: Math.max(
        1,
        Number(formState.alertDaysThreshold) || 30
      ),
      notes: String(formState.notes || '').trim(),
    };

    const next = [...grants];
    const idx = next.findIndex((g) => g.id === normalized.id);
    if (idx >= 0) {
      next[idx] = normalized;
    } else {
      next.unshift(normalized);
    }

    await persistGrants(next, { action: 'UPSERT', grant: normalized });
    setShowAddForm(false);
    setEditingGrantId(null);
    if (onShowToast) {
      onShowToast(
        `Saved GDE credit grant "${normalized.name}" ($${normalized.remainingAmountUsd.toFixed(
          2
        )} remaining, expires ${normalized.expirationDate}).`
      );
    }
  };

  const handleDeleteGrant = async (grantId, grantName) => {
    const next = grants.filter((g) => g.id !== grantId);
    await persistGrants(next, { action: 'DELETE', grantId });
    if (onShowToast) {
      onShowToast(`Removed credit grant "${grantName}".`);
    }
  };

  const handleQuickAdjustBalance = async (grant, deltaUsd) => {
    const nextRemaining = Math.max(
      0,
      Math.min(
        Number(grant.initialAmountUsd) || 10000,
        Number((Number(grant.remainingAmountUsd) + deltaUsd).toFixed(2))
      )
    );
    const updated = { ...grant, remainingAmountUsd: nextRemaining };
    const next = grants.map((g) => (g.id === grant.id ? updated : g));
    await persistGrants(next, { action: 'UPSERT', grant: updated });
  };

  const handleStartEdit = (grant) => {
    setEditingGrantId(grant.id);
    setFormState({
      name: grant.name,
      grantType: grant.grantType || 'GDE_BONUS',
      creditCode: grant.creditCode || 'GDE-2026-CREDITS',
      initialAmountUsd: grant.initialAmountUsd,
      remainingAmountUsd: grant.remainingAmountUsd,
      expirationDate: grant.expirationDate,
      alertDaysThreshold: grant.alertDaysThreshold || 30,
      notes: grant.notes || '',
    });
    setShowAddForm(true);
  };

  const bqCreditExportSql = useMemo(() => {
    return `-- BigQuery Cloud Billing Export: GDE Promotional Credit & Bonus Ledger Audit
-- Note: Standard Cloud Billing Console hides credit expiration dates & stranded balances.
-- Query your BigQuery Billing Export table to inspect exact promotional credit consumption:
SELECT
  c.name AS credit_grant_name,
  c.id AS credit_grant_id,
  c.full_name AS credit_full_name,
  c.type AS credit_type,
  ROUND(SUM(c.amount), 2) AS total_credit_applied_usd,
  MIN(DATE(usage_start_time)) AS first_applied_date,
  MAX(DATE(usage_end_time)) AS latest_applied_date
FROM
  \`${projectId || 'my-gcp-project'}.billing_export.gcp_billing_export_v1_${(
      billingInfo.billingAccountId || '01A9F2_88C4E1_3B7D09'
    ).replace(/-/g, '_')}\`,
  UNNEST(credits) AS c
WHERE
  c.type IN ('PROMOTIONAL', 'FREE_TIER', 'SUSTAINED_USAGE_DISCOUNT')
GROUP BY
  1, 2, 3, 4
ORDER BY
  latest_applied_date DESC;`;
  }, [projectId, billingInfo.billingAccountId]);

  const budgetAlertCli = useMemo(() => {
    const acctId = billingInfo.billingAccountId || '01A9F2-88C4E1-3B7D09';
    const targetAmount = Math.max(
      50,
      Math.round(summary.totalRemainingUsd || 500)
    );
    return `gcloud billing budgets create \\
  --billing-account=${acctId} \\
  --display-name="GDE-Bonus-Credit-Burn-Alert-${projectId || 'gcp'}" \\
  --budget-amount=${targetAmount}USD \\
  --credit-types-treatment=include-all-credits \\
  --threshold-rule=percent=0.5 \\
  --threshold-rule=percent=0.8 \\
  --threshold-rule=percent=0.95 \\
  --filter-projects="projects/${projectId || 'my-gcp-project'}"`;
  }, [billingInfo.billingAccountId, summary.totalRemainingUsd, projectId]);

  const handleCopyText = (id, text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    if (onShowToast) {
      onShowToast(`Copied ${label} to clipboard.`);
    }
  };

  return (
    <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-5">
      {/* Header Row: Billing Account Identity + Add GDE Grant Action */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <h2 className="text-sm sm:text-base font-extrabold text-zinc-950 dark:text-zinc-50">
              Cloud Billing Account & GDE Promotional Credit Guardian
            </h2>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              {billingInfo.billingAccountName}
            </span>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                billingInfo.billingEnabled
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
              }`}
            >
              {billingInfo.billingEnabled ? 'BILLING ACTIVE' : 'BILLING DISABLED'}
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            Solves the missing GCP Console gap for Google Developer Experts (GDEs) & credit holders: tracks{' '}
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              how much money remains inside each GDE bonus grant
            </span>
            , warns before the{' '}
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              expiration cliff date
            </span>
            , and calculates whether your current burn rate will leave{' '}
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              unspent credits stranded
            </span>{' '}
            or exhaust early onto your credit card.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={loadBillingGuardian}
            disabled={loading}
            className="h-9 px-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 text-xs font-mono font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-all"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 shrink-0 ${loading ? 'animate-spin' : ''}`}
            />
            <span>Sync Billing API</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingGrantId(null);
              setFormState({
                name: 'GDE Cloud / Vertex AI Bonus Grant',
                grantType: 'GDE_BONUS',
                creditCode: `GDE-${new Date().getFullYear()}-CREDITS`,
                initialAmountUsd: 1000,
                remainingAmountUsd: 500,
                expirationDate: defaultExpiry30d,
                alertDaysThreshold: 30,
                notes: 'Annual Google Developer Expert promotional credit grant.',
              });
              setShowAddForm((prev) => !prev);
            }}
            className="h-9 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/40 shadow-sm text-xs font-mono font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-all"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>{showAddForm ? 'Close Grant Editor' : 'Add GDE Bonus / Credit'}</span>
          </button>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span>REMAINING GDE BONUS MONEY</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
            ${summary.totalRemainingUsd.toFixed(2)}
            <span className="text-xs font-normal text-zinc-500 ml-1.5">
              / ${summary.totalInitialUsd.toFixed(0)} granted
            </span>
          </div>
          <div className="text-[11px] font-mono text-zinc-500">
            Active across {grants.length} promotional credit grant
            {grants.length === 1 ? '' : 's'}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span>NEAREST EXPIRATION CLIFF</span>
            <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div
            className={`text-xl font-mono font-extrabold ${
              summary.nearestExpiryDays !== null && summary.nearestExpiryDays <= 14
                ? 'text-red-600 dark:text-red-400'
                : summary.nearestExpiryDays !== null &&
                  summary.nearestExpiryDays <= 30
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-zinc-900 dark:text-zinc-100'
            }`}
          >
            {summary.nearestExpiryDays !== null
              ? `${summary.nearestExpiryDays} days left`
              : 'No active expiry'}
          </div>
          <div className="text-[11px] font-mono text-zinc-500 truncate">
            {summary.nearestExpiryGrant
              ? `${summary.nearestExpiryGrant.name} (${summary.nearestExpiryGrant.expirationDate})`
              : 'All grants healthy'}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span>STRANDED / UNSPENT AT EXPIRY</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div
            className={`text-xl font-mono font-extrabold ${
              summary.totalStrandedUsd > 50
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-zinc-900 dark:text-zinc-100'
            }`}
          >
            ${summary.totalStrandedUsd.toFixed(2)}
            <span className="text-xs font-normal text-zinc-500 ml-1.5">
              at ${dailyBurnUsd.toFixed(2)}/day
            </span>
          </div>
          <div className="text-[11px] font-mono text-zinc-500">
            Money inside bonus projected to expire unused
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span>PROJECT RUN-RATE VS CREDITS</span>
            <TrendingDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-xl font-mono font-extrabold text-zinc-900 dark:text-zinc-100">
            ${dailyBurnUsd.toFixed(2)}/day
            <span className="text-xs font-normal text-zinc-500 ml-1.5">
              (${monthlyBurnUsd.toFixed(0)}/mo)
            </span>
          </div>
          <div className="text-[11px] font-mono text-zinc-500">
            {dailyBurnUsd > 0.01
              ? `Covers ~${Math.round(
                  summary.totalRemainingUsd / dailyBurnUsd
                )} days of current project burn`
              : `Current hourly burn: $${hourlyBurnUsd.toFixed(3)}/hr`}
          </div>
        </div>
      </div>

      {/* Proactive Urgent Warning Banner when a GDE bonus is close to expiration or has stranded balance */}
      {summary.nearestExpiryGrant &&
        summary.nearestExpiryGrant.metrics.daysLeft <=
          summary.nearestExpiryGrant.metrics.alertThreshold && (
          <div
            className={`rounded-xl p-4 border flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${
              summary.nearestExpiryGrant.metrics.daysLeft <= 14
                ? 'bg-red-500/10 border-red-500/30 text-red-900 dark:text-red-200'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono font-extrabold uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>
                  GDE Bonus Expiration & Stranded Balance Alert:{' '}
                  {summary.nearestExpiryGrant.name}
                </span>
              </div>
              <p className="text-xs leading-relaxed">
                You still have{' '}
                <span className="font-mono font-bold underline">
                  ${summary.nearestExpiryGrant.metrics.remaining.toFixed(2)}
                </span>{' '}
                ({summary.nearestExpiryGrant.metrics.remainingPct.toFixed(0)}% of
                grant) inside this bonus, and it expires in{' '}
                <span className="font-mono font-bold underline">
                  {summary.nearestExpiryGrant.metrics.daysLeft} days
                </span>{' '}
                on{' '}
                <span className="font-mono font-bold">
                  {summary.nearestExpiryGrant.expirationDate}
                </span>
                .{' '}
                {summary.nearestExpiryGrant.metrics.strandedMoneyUsd > 5 ? (
                  <>
                    At your current project burn rate (
                    <span className="font-mono font-bold">
                      ${dailyBurnUsd.toFixed(2)}/day
                    </span>
                    ), you will only consume{' '}
                    <span className="font-mono font-bold">
                      $
                      {summary.nearestExpiryGrant.metrics.projectedSpendUntilExpiry.toFixed(
                        2
                      )}
                    </span>{' '}
                    before the cutoff — leaving{' '}
                    <span className="font-mono font-bold underline">
                      $
                      {summary.nearestExpiryGrant.metrics.strandedMoneyUsd.toFixed(
                        2
                      )}{' '}
                      of free GDE bonus money to expire unused!
                    </span>{' '}
                    (Target burn to utilize 100% before expiry:{' '}
                    <span className="font-mono font-bold">
                      $
                      {summary.nearestExpiryGrant.metrics.requiredDailyBurnToUseAll.toFixed(
                        2
                      )}
                      /day
                    </span>
                    ).
                  </>
                ) : (
                  <>
                    At your current burn rate (
                    <span className="font-mono font-bold">
                      ${dailyBurnUsd.toFixed(2)}/day
                    </span>
                    ), this credit balance will be fully utilized in{' '}
                    <span className="font-mono font-bold">
                      {summary.nearestExpiryGrant.metrics.daysUntilExhausted.toFixed(
                        1
                      )}{' '}
                      days
                    </span>
                    .
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onOpenBigQuerySql && (
                <button
                  type="button"
                  onClick={() => onOpenBigQuerySql(bqCreditExportSql)}
                  className="h-8 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-mono font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-all"
                >
                  <Database className="w-3.5 h-3.5 shrink-0" />
                  <span>Audit Credits in BigQuery</span>
                </button>
              )}
            </div>
          </div>
        )}

      {/* Add / Edit GDE Grant Form Drawer */}
      {showAddForm && (
        <form
          onSubmit={handleSaveGrant}
          className="p-4 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-3 text-xs font-mono"
        >
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
            <span className="font-bold text-zinc-900 dark:text-zinc-100 uppercase">
              {editingGrantId
                ? 'Edit GDE Promotional Credit Grant'
                : 'Register New GDE Bonus / Promotional Credit Grant'}
            </span>
            <span className="text-[11px] text-zinc-500">
              Persisted to project {projectId}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="block text-[10px] uppercase text-zinc-500 font-bold">
                Grant Display Name
              </label>
              <input
                type="text"
                required
                value={formState.name}
                onChange={(e) =>
                  setFormState((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="e.g. GDE Annual Cloud Bonus 2026"
                className="w-full h-9 px-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] uppercase text-zinc-500 font-bold">
                Grant Category & Promo Code
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={formState.grantType}
                  onChange={(e) =>
                    setFormState((p) => ({ ...p, grantType: e.target.value }))
                  }
                  className="h-9 px-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                >
                  <option value="GDE_BONUS">GDE Annual Bonus</option>
                  <option value="GENAI_GRANT">GDE GenAI / Vertex Grant</option>
                  <option value="STARTUP_CREDIT">Startup / Research Credit</option>
                  <option value="FREE_TRIAL">GCP Promotional Grant</option>
                </select>
                <input
                  type="text"
                  value={formState.creditCode}
                  onChange={(e) =>
                    setFormState((p) => ({ ...p, creditCode: e.target.value }))
                  }
                  placeholder="Promo Code / ID"
                  className="h-9 px-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] uppercase text-zinc-500 font-bold">
                Initial Grant ($) vs Remaining Balance ($)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={formState.initialAmountUsd}
                  onChange={(e) =>
                    setFormState((p) => ({
                      ...p,
                      initialAmountUsd: e.target.value,
                    }))
                  }
                  placeholder="Initial USD"
                  className="h-9 px-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formState.remainingAmountUsd}
                  onChange={(e) =>
                    setFormState((p) => ({
                      ...p,
                      remainingAmountUsd: e.target.value,
                    }))
                  }
                  placeholder="Remaining USD"
                  className="h-9 px-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-emerald-600 dark:text-emerald-400 font-bold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] uppercase text-zinc-500 font-bold">
                Expiration Date (Cliff Date)
              </label>
              <input
                type="date"
                required
                value={formState.expirationDate}
                onChange={(e) =>
                  setFormState((p) => ({
                    ...p,
                    expirationDate: e.target.value,
                  }))
                }
                className="w-full h-9 px-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] uppercase text-zinc-500 font-bold">
                Early Warning Window (Days Before Expiry)
              </label>
              <select
                value={formState.alertDaysThreshold}
                onChange={(e) =>
                  setFormState((p) => ({
                    ...p,
                    alertDaysThreshold: Number(e.target.value),
                  }))
                }
                className="w-full h-9 px-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
              >
                <option value={14}>Warn 14 days before expiration</option>
                <option value={30}>Warn 30 days before expiration</option>
                <option value={45}>Warn 45 days before expiration</option>
                <option value={60}>Warn 60 days before expiration</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] uppercase text-zinc-500 font-bold">
                Notes / Eligible Workloads
              </label>
              <input
                type="text"
                value={formState.notes}
                onChange={(e) =>
                  setFormState((p) => ({ ...p, notes: e.target.value }))
                }
                placeholder="e.g. Covers Compute, BigQuery, Vertex AI"
                className="w-full h-9 px-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setEditingGrantId(null);
              }}
              className="h-8 px-3 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-8 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer"
            >
              {editingGrantId ? 'Update Credit Grant' : 'Save Credit Grant'}
            </button>
          </div>
        </form>
      )}

      {/* Active GDE Bonus & Promotional Credit Grant Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {enrichedGrants.map((grant) => {
          const m = grant.metrics;
          const isCritical =
            m.status === 'CRITICAL_EXPIRY' ||
            m.status === 'EXPIRED_WITH_BALANCE';
          const isWarning =
            m.status === 'WARNING_EXPIRY' ||
            m.status === 'WARNING_EARLY_DEPLETION';

          return (
            <div
              key={grant.id}
              className={`rounded-xl p-4 border space-y-3 transition-all ${
                isCritical
                  ? 'bg-red-500/5 border-red-500/30'
                  : isWarning
                  ? 'bg-amber-500/5 border-amber-500/30'
                  : 'bg-zinc-50/70 dark:bg-[#131314] border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-extrabold text-zinc-950 dark:text-zinc-100 truncate">
                      {grant.name}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      {grant.creditCode}
                    </span>
                  </div>
                  {grant.notes && (
                    <p className="text-[11px] text-zinc-500 truncate">
                      {grant.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border whitespace-nowrap ${
                      isCritical
                        ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
                        : isWarning
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {m.daysLeft <= 0
                      ? 'EXPIRED'
                      : `${m.daysLeft}d left (${grant.expirationDate})`}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleStartEdit(grant)}
                    title="Edit credit balance or expiration date"
                    className="h-7 px-2 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-[10px] font-mono font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteGrant(grant.id, grant.name)}
                    title="Remove credit grant"
                    className="h-7 w-7 rounded-md bg-zinc-100 hover:bg-red-500/10 dark:bg-zinc-900 dark:hover:bg-red-500/20 border border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:text-red-600 dark:hover:text-red-400 inline-flex items-center justify-center cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Balance Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Money Inside Bonus:{' '}
                    <strong className="text-emerald-600 dark:text-emerald-400 text-sm">
                      ${m.remaining.toFixed(2)}
                    </strong>{' '}
                    remaining ({m.remainingPct.toFixed(1)}%)
                  </span>
                  <span className="text-zinc-500">
                    Used: ${m.used.toFixed(2)} / ${m.initial.toFixed(2)}
                  </span>
                </div>

                <div className="w-full h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isCritical
                        ? 'bg-red-600'
                        : isWarning
                        ? 'bg-amber-500'
                        : 'bg-emerald-600'
                    }`}
                    style={{ width: `${m.remainingPct}%` }}
                  />
                </div>
              </div>

              {/* Burn-Rate vs Expiration Forecast Box */}
              <div className="p-2.5 rounded-lg bg-white/90 dark:bg-zinc-950/80 border border-zinc-200/80 dark:border-zinc-800 text-[11px] font-mono space-y-1">
                {m.daysLeft <= 0 && m.remaining > 0 ? (
                  <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Grant expired on {grant.expirationDate} with $
                      {m.remaining.toFixed(2)} unused balance.
                    </span>
                  </div>
                ) : m.willExhaustBeforeExpiry ? (
                  <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Early Exhaustion Warning: At ${dailyBurnUsd.toFixed(2)}
                      /day, this bonus hits $0.00 in{' '}
                      {m.daysUntilExhausted.toFixed(1)} days (
                      {Math.max(0, Math.round(m.daysLeft - m.daysUntilExhausted))}d
                      before expiry) — billing will spill over to your card.
                    </span>
                  </div>
                ) : m.strandedMoneyUsd > 5 ? (
                  <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>
                      Stranded Bonus Forecast: At ${dailyBurnUsd.toFixed(2)}/day,{' '}
                      <strong>${m.strandedMoneyUsd.toFixed(2)}</strong> inside
                      this grant will remain unspent when it expires in{' '}
                      <strong>{m.daysLeft}d</strong> (need $
                      {m.requiredDailyBurnToUseAll.toFixed(2)}/day to use 100%).
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Healthy utilization pace — ${m.remaining.toFixed(2)}{' '}
                      available for {m.daysLeft} days.
                    </span>
                  </div>
                )}
              </div>

              {/* Quick 1-Tap Balance Adjuster Buttons */}
              <div className="flex items-center justify-between gap-2 pt-1 flex-wrap text-[11px] font-mono">
                <span className="text-zinc-500">Quick sync balance:</span>
                <div className="flex items-center gap-1.5">
                  {[-50, -10, +10, +50].map((delta) => (
                    <button
                      key={delta}
                      type="button"
                      onClick={() => handleQuickAdjustBalance(grant, delta)}
                      className="h-7 px-2 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold cursor-pointer whitespace-nowrap"
                    >
                      {delta > 0 ? `+$${delta}` : `-$${Math.abs(delta)}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Automation Strip: BigQuery Billing Export SQL + Cloud Billing Budget CLI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>BigQuery Billing Export: Promotional Credits Ledger SQL</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() =>
                  handleCopyText(
                    'bq-credits-sql',
                    bqCreditExportSql,
                    'BigQuery Promotional Credits SQL'
                  )
                }
                className="h-7 px-2.5 rounded-lg bg-zinc-200/80 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[11px] font-mono font-bold inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copiedId === 'bq-credits-sql' ? (
                  <Check className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>{copiedId === 'bq-credits-sql' ? 'Copied' : 'Copy SQL'}</span>
              </button>
              {onOpenBigQuerySql && (
                <button
                  type="button"
                  onClick={() => onOpenBigQuerySql(bqCreditExportSql)}
                  className="h-7 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-mono font-bold inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Open in BigQuery Studio</span>
                </button>
              )}
            </div>
          </div>
          <pre className="p-2.5 rounded-lg bg-zinc-900 text-zinc-200 text-[10px] font-mono overflow-x-auto max-h-28">
            {bqCreditExportSql}
          </pre>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Cloud Billing Budget Alert CLI (Include Promotional Credits)</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() =>
                  handleCopyText(
                    'gcloud-budget-cli',
                    budgetAlertCli,
                    'gcloud billing budgets create CLI'
                  )
                }
                className="h-7 px-2.5 rounded-lg bg-zinc-200/80 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[11px] font-mono font-bold inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copiedId === 'gcloud-budget-cli' ? (
                  <Check className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>
                  {copiedId === 'gcloud-budget-cli' ? 'Copied' : 'Copy CLI'}
                </span>
              </button>
              {onRunInShell && (
                <button
                  type="button"
                  onClick={() => onRunInShell(budgetAlertCli)}
                  className="h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-mono font-bold inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Run in Cloud Shell</span>
                </button>
              )}
            </div>
          </div>
          <pre className="p-2.5 rounded-lg bg-zinc-900 text-zinc-200 text-[10px] font-mono overflow-x-auto max-h-28">
            {budgetAlertCli}
          </pre>
        </div>
      </div>
    </div>
  );
}
