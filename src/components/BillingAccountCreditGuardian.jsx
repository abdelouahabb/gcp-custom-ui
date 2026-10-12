import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Terminal,
  Database,
  Copy,
  Check,
  ShieldAlert,
  TrendingDown,
  DollarSign,
  Filter,
  Building2,
} from 'lucide-react';

function getDaysUntil(dateStr) {
  if (!dateStr) return 0;
  const target = new Date(`${dateStr}T23:59:59`);
  if (Number.isNaN(target.getTime())) return 0;
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    12,
    0,
    0
  );
  const targetNoon = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
    12,
    0,
    0
  );
  const diffDays = Math.round(
    (targetNoon.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diffDays > 0 ? Math.max(1, diffDays - 1) : diffDays;
}

function formatHumanDate(isoDate) {
  if (!isoDate) return '—';
  const parsed = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export const INITIAL_CONSOLE_CREDITS = [];

export function computeGdeGrantMetrics(grant, dailyBurnUsd = 0) {
  const initial = Math.max(0.01, Number(grant.initialAmountUsd) || 0);
  const remaining = Math.max(0, Number(grant.remainingAmountUsd) ?? 0);
  const used = Math.max(0, initial - remaining);
  const remainingPct =
    initial > 0 ? Math.min(100, Math.max(0, (remaining / initial) * 100)) : 0;
  const displayPct = Math.round(remainingPct);
  const daysLeft = getDaysUntil(grant.expirationDate);
  const alertThreshold = Math.max(1, Number(grant.alertDaysThreshold) || 30);
  const isExpired = daysLeft <= 0;

  const safeDailyBurn = Math.max(0, Number(dailyBurnUsd) || 0);
  const projectedSpendUntilExpiry = !isExpired ? safeDailyBurn * daysLeft : 0;
  const strandedMoneyUsd = !isExpired
    ? Math.max(0, remaining - projectedSpendUntilExpiry)
    : remaining;

  const daysUntilExhausted =
    !isExpired && safeDailyBurn > 0.01 ? remaining / safeDailyBurn : Infinity;

  const willExhaustBeforeExpiry =
    !isExpired &&
    remaining > 0 &&
    Number.isFinite(daysUntilExhausted) &&
    daysUntilExhausted < daysLeft;

  let status = 'AVAILABLE';
  let consoleStatusLabel = 'Available';
  if (isExpired) {
    status = 'EXPIRED';
    consoleStatusLabel = 'Expired';
  } else if (remaining <= 0) {
    status = 'DEPLETED';
    consoleStatusLabel = 'Depleted';
  } else if (daysLeft <= alertThreshold) {
    status = daysLeft <= 14 ? 'CRITICAL_EXPIRY' : 'WARNING_EXPIRY';
    consoleStatusLabel = `Expiring in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`;
  }

  const requiredDailyBurnToUseAll =
    !isExpired && daysLeft > 0 ? remaining / daysLeft : 0;

  return {
    initial,
    remaining,
    used,
    remainingPct,
    displayPct,
    daysLeft,
    alertThreshold,
    isExpired,
    projectedSpendUntilExpiry,
    strandedMoneyUsd,
    daysUntilExhausted,
    willExhaustBeforeExpiry,
    requiredDailyBurnToUseAll,
    status,
    consoleStatusLabel,
  };
}

export function summarizeCreditLedger(grants = [], dailyBurnUsd = 0) {
  let activeOriginalUsd = 0;
  let activeRemainingUsd = 0;
  let activeCount = 0;
  let expiringSoonRemainingUsd = 0;
  let expiringSoonCount = 0;
  let expiredUnusedUsd = 0;
  let expiredCount = 0;
  let nearestExpiryDays = Infinity;
  let nearestExpiryGrant = null;
  let urgentWarningsCount = 0;

  for (const raw of grants) {
    const m = raw.metrics || computeGdeGrantMetrics(raw, dailyBurnUsd);
    if (m.isExpired) {
      expiredUnusedUsd += m.remaining;
      expiredCount += 1;
    } else {
      activeOriginalUsd += m.initial;
      activeRemainingUsd += m.remaining;
      activeCount += 1;

      if (m.remaining > 0 && m.daysLeft < nearestExpiryDays) {
        nearestExpiryDays = m.daysLeft;
        nearestExpiryGrant = { ...raw, metrics: m };
      }

      if (m.daysLeft <= m.alertThreshold && m.remaining > 0) {
        expiringSoonRemainingUsd += m.remaining;
        expiringSoonCount += 1;
        urgentWarningsCount += 1;
      }
    }
  }

  return {
    hasImportedCredits: grants.length > 0,
    activeCount,
    totalInitialUsd: activeOriginalUsd,
    totalRemainingUsd: activeRemainingUsd,
    expiringSoonRemainingUsd,
    expiringSoonCount,
    expiredUnusedUsd,
    expiredCount,
    nearestExpiryDays: Number.isFinite(nearestExpiryDays)
      ? nearestExpiryDays
      : null,
    nearestExpiryGrant,
    urgentWarningsCount,
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
    billingAccountName: null,
    billingAccountId: null,
    displayName: 'Loading Billing Account...',
    billingEnabled: false,
    open: false,
    currencyCode: 'USD',
    source: 'cloudbilling.googleapis.com',
  });
  const [billingAccounts, setBillingAccounts] = useState([]);
  const [liveBillingInsights, setLiveBillingInsights] = useState(null);
  const [showAccountsDrawer, setShowAccountsDrawer] = useState(false);
  const [gdeEnvelope, setGdeEnvelope] = useState(() => {
    const saved = localStorage.getItem('cloudpulse_gde_bonus_envelope_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return {
      name: '',
      initialGrantUsd: '',
      startDate: '',
      expirationDate: '',
      alertDaysThreshold: '',
    };
  });
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchFilter, setSearchFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const dailyBurnUsd = Number(liveBurn?.daily || 0);

  const updateGdeEnvelope = (patch) => {
    setGdeEnvelope((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(
        'cloudpulse_gde_bonus_envelope_v2',
        JSON.stringify(next)
      );
      return next;
    });
  };

  const loadBillingGuardian = useCallback(
    async (forceRefresh = false) => {
      if (!projectId) return;
      setLoading(true);
      try {
        const res = await axios.get(
          `/api/project/${encodeURIComponent(projectId)}/billing-guardian${
            forceRefresh ? '?refresh=true' : ''
          }`
        );
        if (res.data?.billingInfo) {
          setBillingInfo(res.data.billingInfo);
        }
        if (Array.isArray(res.data?.billingAccounts)) {
          setBillingAccounts(res.data.billingAccounts);
        }
        if (res.data?.liveBillingInsights) {
          setLiveBillingInsights(res.data.liveBillingInsights);
        }
      } catch {
        // ignore network errors
      } finally {
        setLoading(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    loadBillingGuardian(false);
  }, [loadBillingGuardian]);

  const liveCostMetrics = useMemo(() => {
    const rows = Array.isArray(liveBillingInsights?.costCreditRows)
      ? liveBillingInsights.costCreditRows
      : [];
    let grossUsageUsd = 0;
    let totalCreditUsd = 0;
    let otherSavingsUsd = 0;
    let savingsProgramsUsd = 0;
    let netSubtotalUsd = 0;

    for (const r of rows) {
      grossUsageUsd += Number(r.usage_cost || 0);
      totalCreditUsd += Number(r.total_credit || 0);
      otherSavingsUsd += Number(r.other_savings || 0);
      savingsProgramsUsd += Number(r.savings_programs || 0);
      netSubtotalUsd += Number(r.subtotal || 0);
    }

    const absCreditsUsd = Math.abs(totalCreditUsd);
    const coveragePct =
      grossUsageUsd > 0
        ? Math.min(100, (absCreditsUsd / grossUsageUsd) * 100)
        : 0;

    return {
      hasLiveRows: rows.length > 0,
      rows,
      grossUsageUsd,
      totalCreditUsd,
      absCreditsUsd,
      otherSavingsUsd,
      savingsProgramsUsd,
      netSubtotalUsd,
      coveragePct,
      summary: liveBillingInsights?.summary || '',
      fullAnalysis: liveBillingInsights?.fullAnalysis || '',
      source: liveBillingInsights?.source || '',
      queriedParents: liveBillingInsights?.queriedParents || [],
    };
  }, [liveBillingInsights]);

  // Compute active GDE grant dynamically when the user has entered their Grant Amount,
  // subtracting live API `total_credit` consumed (`liveCostMetrics.absCreditsUsd`).
  const effectiveGrants = useMemo(() => {
    const initAmt = Number(gdeEnvelope.initialGrantUsd) || 0;
    if (initAmt <= 0) return [];
    const liveDeductedRemaining = Math.max(
      0,
      Number((initAmt - liveCostMetrics.absCreditsUsd).toFixed(2))
    );
    return [
      {
        id: 'live-api-deducted-gde-grant',
        name:
          gdeEnvelope.name ||
          billingInfo.displayName ||
          'Promotional Credit Grant',
        grantType: 'GDE_BONUS',
        creditCode: billingInfo.billingAccountId || 'LIVE-API',
        initialAmountUsd: initAmt,
        remainingAmountUsd: liveDeductedRemaining,
        startDate: gdeEnvelope.startDate || '',
        expirationDate: gdeEnvelope.expirationDate || '',
        creditApplication: `Live API Deduction (-$${liveCostMetrics.absCreditsUsd.toFixed(
          2
        )} used)`,
        alertDaysThreshold: Math.max(
          1,
          Number(gdeEnvelope.alertDaysThreshold) || 0
        ),
      },
    ];
  }, [
    gdeEnvelope,
    liveCostMetrics.absCreditsUsd,
    billingInfo.displayName,
    billingInfo.billingAccountId,
  ]);

  const enrichedGrants = useMemo(() => {
    return effectiveGrants.map((g) => ({
      ...g,
      metrics: computeGdeGrantMetrics(g, dailyBurnUsd),
    }));
  }, [effectiveGrants, dailyBurnUsd]);

  const summary = useMemo(() => {
    const base = summarizeCreditLedger(enrichedGrants, dailyBurnUsd);
    return {
      ...base,
      hasImportedCredits: enrichedGrants.length > 0,
      liveCostMetrics,
    };
  }, [enrichedGrants, dailyBurnUsd, liveCostMetrics]);

  useEffect(() => {
    if (onGrantsSummaryChange) {
      onGrantsSummaryChange(summary);
    }
  }, [summary, onGrantsSummaryChange]);

  const filteredGrants = useMemo(() => {
    return enrichedGrants.filter((g) => {
      const m = g.metrics;
      if (statusFilter === 'EXPIRING_SOON') {
        if (m.isExpired || m.daysLeft > m.alertThreshold || m.remaining <= 0) {
          return false;
        }
      } else if (statusFilter === 'AVAILABLE') {
        if (m.isExpired || m.remaining <= 0) return false;
      } else if (statusFilter === 'EXPIRED') {
        if (!m.isExpired) return false;
      }
      if (searchFilter.trim()) {
        const q = searchFilter.trim().toLowerCase();
        const hay = `${g.name} ${g.creditCode || ''} ${
          g.creditApplication || ''
        } ${m.consoleStatusLabel}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [enrichedGrants, statusFilter, searchFilter]);

  const bqCreditExportSql = useMemo(() => {
    const cleanAcct = (billingInfo.billingAccountId || 'XXXXXX_XXXXXX_XXXXXX').replace(
      /-/g,
      '_'
    );
    return `-- BigQuery Cloud Billing Export: Promotional Credits Ledger Audit
SELECT
  c.name AS credit_grant_name,
  c.id AS credit_grant_id,
  c.full_name AS credit_full_name,
  c.type AS credit_type,
  ROUND(SUM(c.amount), 2) AS total_credit_applied_usd,
  MIN(DATE(usage_start_time)) AS first_applied_date,
  MAX(DATE(usage_end_time)) AS latest_applied_date
FROM
  \`${projectId || 'my-gcp-project'}.billing_export.gcp_billing_export_v1_${cleanAcct}\`,
  UNNEST(credits) AS c
WHERE
  c.type IN ('PROMOTIONAL', 'FREE_TIER', 'SUSTAINED_USAGE_DISCOUNT')
GROUP BY
  1, 2, 3, 4
ORDER BY
  latest_applied_date DESC;`;
  }, [projectId, billingInfo.billingAccountId]);

  const budgetAlertCli = useMemo(() => {
    const acctId = billingInfo.billingAccountId || 'YOUR_BILLING_ACCOUNT_ID';
    const targetAmount = Math.max(
      1,
      Math.round(summary.totalRemainingUsd || liveCostMetrics.grossUsageUsd || 1)
    );
    return `gcloud billing budgets create \\
  --billing-account=${acctId} \\
  --display-name="Credit-Expiration-Guard-${projectId || 'gcp'}" \\
  --budget-amount=${targetAmount}USD \\
  --credit-types-treatment=include-all-credits \\
  --threshold-rule=percent=0.5 \\
  --threshold-rule=percent=0.8 \\
  --threshold-rule=percent=0.95 \\
  --filter-projects="projects/${projectId || 'my-gcp-project'}"`;
  }, [
    billingInfo.billingAccountId,
    summary.totalRemainingUsd,
    liveCostMetrics.grossUsageUsd,
    projectId,
  ]);

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
      {/* Header Row: Live Billing Account Identity + Sync Action */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <h2 className="text-sm sm:text-base font-extrabold text-zinc-950 dark:text-zinc-50">
              Cloud Billing Account & Promotional Credits Guardian
            </h2>
            {billingInfo.billingAccountId && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                {billingInfo.displayName} ({billingInfo.billingAccountId})
              </span>
            )}
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                billingInfo.billingEnabled
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20'
              }`}
            >
              {billingInfo.billingEnabled ? 'BILLING ACTIVE' : 'UNLINKED / CLOSED'}
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            Queries live{' '}
            <code className="font-mono text-zinc-700 dark:text-zinc-300">
              gcloud billing accounts list
            </code>
            ,{' '}
            <code className="font-mono text-zinc-700 dark:text-zinc-300">
              gcloud billing projects describe
            </code>
            , and{' '}
            <code className="font-mono text-zinc-700 dark:text-zinc-300">
              cloudbilling.googleapis.com/v1beta:generateInsights
            </code>{' '}
            (<code className="font-mono">cloud_billing_data.public.costs.v2</code>).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {billingAccounts.length > 0 && (
            <button
              type="button"
              onClick={() => setShowAccountsDrawer((p) => !p)}
              className="h-9 px-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 text-xs font-mono font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-all"
            >
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span>Billing Accounts ({billingAccounts.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => loadBillingGuardian(true)}
            disabled={loading}
            className="h-9 px-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 text-xs font-mono font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-all"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 shrink-0 ${loading ? 'animate-spin' : ''}`}
            />
            <span>Sync Live Billing API</span>
          </button>
        </div>
      </div>

      {/* Live Discovered Cloud Billing Accounts Drawer (from gcloud billing accounts list) */}
      {showAccountsDrawer && billingAccounts.length > 0 && (
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-mono font-bold uppercase text-zinc-800 dark:text-zinc-200">
              Live Google Cloud Billing Accounts (`gcloud billing accounts list`)
            </span>
            <span className="text-[11px] font-mono text-zinc-500">
              {billingAccounts.filter((a) => a.open).length} Open ·{' '}
              {billingAccounts.filter((a) => !a.open).length} Closed/Expired
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
            {billingAccounts.map((acct) => {
              const isLinked =
                acct.billingAccountId === billingInfo.billingAccountId;
              return (
                <div
                  key={acct.name}
                  className={`p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between gap-2 ${
                    isLinked
                      ? 'bg-blue-500/10 border-blue-500/30'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {acct.displayName}
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate">
                      {acct.billingAccountId} · {acct.currencyCode}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      acct.open
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {isLinked ? 'LINKED' : acct.open ? 'OPEN' : 'CLOSED'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LIVE CLOUD BILLING DATA MART LEDGER (cloudbilling.googleapis.com/v1beta:generateInsights -> cloud_billing_data.public.costs.v2) */}
      {liveCostMetrics.hasLiveRows && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                <span>LIVE GROSS USAGE COST</span>
                <DollarSign className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
              </div>
              <div className="text-xl font-mono font-extrabold text-zinc-900 dark:text-zinc-100">
                ${liveCostMetrics.grossUsageUsd.toFixed(2)}
                <span className="text-xs font-normal text-zinc-500 ml-1.5">
                  USD
                </span>
              </div>
              <div className="text-[11px] font-mono text-zinc-500">
                Live from `cloud_billing_data.public.costs.v2`
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/30 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                <span>LIVE CREDITS APPLIED (`other_savings`)</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                -${liveCostMetrics.absCreditsUsd.toFixed(2)}
                <span className="text-xs font-normal text-zinc-500 ml-1.5">
                  USD
                </span>
              </div>
              <div className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
                Promotional credits offsetting gross usage
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/30 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-blue-700 dark:text-blue-400 font-bold">
                <span>PROMOTIONAL CREDIT COVERAGE</span>
                <CreditCard className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-xl font-mono font-extrabold text-blue-600 dark:text-blue-400">
                {liveCostMetrics.coveragePct.toFixed(1)}%
              </div>
              <div className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
                Of gross spend covered by promotional credits
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                <span>LIVE NET BILLED SUBTOTAL</span>
                <TrendingDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-xl font-mono font-extrabold text-zinc-900 dark:text-zinc-100">
                ${liveCostMetrics.netSubtotalUsd.toFixed(2)}
                <span className="text-xs font-normal text-zinc-500 ml-1.5">
                  USD
                </span>
              </div>
              <div className="text-[11px] font-mono text-zinc-500">
                Net charge after promotional credits (`subtotal`)
              </div>
            </div>
          </div>

          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-[#131314]">
            <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 bg-zinc-50/70 dark:bg-[#202124]">
              <div className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  Live Cloud Billing Credit Consumption by Service & Project (`cloud_billing_data.public.costs.v2`)
                </span>
              </div>
              <span className="text-[11px] font-mono text-zinc-500">
                Source: `cloudbilling.googleapis.com/v1beta:generateInsights`
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60 text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                    <th className="py-2.5 px-4">Service</th>
                    <th className="py-2.5 px-3">Project</th>
                    <th className="py-2.5 px-3 text-right">Gross Usage (`usage_cost`)</th>
                    <th className="py-2.5 px-3 text-right">Promotional Credits (`other_savings`)</th>
                    <th className="py-2.5 px-3 text-right">Savings Programs</th>
                    <th className="py-2.5 px-3 text-right">Credit Coverage</th>
                    <th className="py-2.5 px-4 text-right">Net Subtotal (`subtotal`)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono">
                  {liveCostMetrics.rows.map((row) => {
                    const usage = Number(row.usage_cost || 0);
                    const credit = Number(row.total_credit || row.other_savings || 0);
                    const savingsProg = Number(row.savings_programs || 0);
                    const net = Number(row.subtotal || 0);
                    const rowCov =
                      usage > 0
                        ? Math.min(100, (Math.abs(credit) / usage) * 100)
                        : 0;
                    return (
                      <tr
                        key={row.id}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                      >
                        <td className="py-2.5 px-4 font-sans font-semibold text-zinc-900 dark:text-zinc-100">
                          {row.service_display_name || row.service_id}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-700 dark:text-zinc-300">
                          {row.project_display_name || row.project_id}{' '}
                          {row.project_id && (
                            <span className="text-[10px] text-zinc-500">
                              ({row.project_id})
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right text-zinc-800 dark:text-zinc-200">
                          ${usage.toFixed(4)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {credit < 0
                            ? `-$${Math.abs(credit).toFixed(4)}`
                            : `$${credit.toFixed(4)}`}
                        </td>
                        <td className="py-2.5 px-3 text-right text-zinc-500">
                          ${savingsProg.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-blue-600 dark:text-blue-400 font-bold">
                          {rowCov.toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-zinc-900 dark:text-zinc-100">
                          ${net.toFixed(4)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* GDE Bonus Grant Baseline Bar (combines your GDE Coupon Amount & Expiry Date with Live API `total_credit` deduction) */}
      <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
            GDE Bonus Grant Baseline + Live Cloud Billing API Deduction (`Remaining = Grant - Live API Credits Used`)
          </div>
          <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">
            Live API Credits Deducted: -${liveCostMetrics.absCreditsUsd.toFixed(2)} USD
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-mono text-zinc-500 mb-1">
              Grant / Bonus Name
            </label>
            <input
              type="text"
              value={gdeEnvelope.name}
              placeholder={billingInfo.displayName || 'Enter Grant Name'}
              onChange={(e) => updateGdeEnvelope({ name: e.target.value })}
              className="w-full h-9 px-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-zinc-500 mb-1">
              Initial GDE Grant Amount ($ USD)
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={gdeEnvelope.initialGrantUsd}
              placeholder="Enter Grant Amount ($)"
              onChange={(e) =>
                updateGdeEnvelope({
                  initialGrantUsd: e.target.value,
                })
              }
              className="w-full h-9 px-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-zinc-500 mb-1">
              Bonus Expiration Date
            </label>
            <input
              type="date"
              value={gdeEnvelope.expirationDate}
              onChange={(e) =>
                updateGdeEnvelope({ expirationDate: e.target.value })
              }
              className="w-full h-9 px-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-zinc-500 mb-1">
              Warn Me Before Expiry (Days)
            </label>
            <input
              type="number"
              min="1"
              value={gdeEnvelope.alertDaysThreshold}
              placeholder="Days"
              onChange={(e) =>
                updateGdeEnvelope({
                  alertDaysThreshold: e.target.value,
                })
              }
              className="w-full h-9 px-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100"
            />
          </div>
        </div>
      </div>

      {/* 4 Dynamically Calculated KPI Cards: Money Remaining, Nearest Expiry Countdown, Stranded/Expired, Required Burn */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                <span>ACTIVE AVAILABLE CREDITS</span>
                <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                $
                {summary.totalRemainingUsd.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                <span className="text-xs font-normal text-zinc-500 ml-1.5">
                  / $
                  {summary.totalInitialUsd.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="text-[11px] font-mono text-zinc-500">
                Across {summary.activeCount} active non-expired credit grant
                {summary.activeCount === 1 ? '' : 's'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/30 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-amber-700 dark:text-amber-400 font-bold">
                <span>
                  {summary.nearestExpiryDays !== null
                    ? `NEAREST EXPIRY (${summary.nearestExpiryDays} DAYS)`
                    : 'EXPIRING SOON (≤ 30D)'}
                </span>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-xl font-mono font-extrabold text-amber-600 dark:text-amber-400">
                $
                {summary.expiringSoonRemainingUsd.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                <span className="text-xs font-normal text-zinc-500 ml-1.5">
                  ({summary.expiringSoonCount} grant
                  {summary.expiringSoonCount === 1 ? '' : 's'})
                </span>
              </div>
              <div className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 truncate">
                {summary.nearestExpiryGrant
                  ? `${summary.nearestExpiryGrant.name} (Ends ${formatHumanDate(
                      summary.nearestExpiryGrant.expirationDate
                    )})`
                  : 'No grants expiring within 30 days'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                <span>EXPIRED UNUSED CREDITS</span>
                <XCircle className="w-3.5 h-3.5 text-red-500" />
              </div>
              <div className="text-xl font-mono font-extrabold text-zinc-500 dark:text-zinc-400">
                $
                {summary.expiredUnusedUsd.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                <span className="text-xs font-normal text-zinc-500 ml-1.5">
                  ({summary.expiredCount} expired)
                </span>
              </div>
              <div className="text-[11px] font-mono text-zinc-500">
                Historical balance left unused at expiration
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                <span>REQUIRED BURN BEFORE EXPIRY</span>
                <TrendingDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-xl font-mono font-extrabold text-zinc-900 dark:text-zinc-100">
                $
                {summary.nearestExpiryGrant
                  ? summary.nearestExpiryGrant.metrics.requiredDailyBurnToUseAll.toFixed(
                      2
                    )
                  : '0.00'}
                /day
                <span className="text-xs font-normal text-zinc-500 ml-1.5">
                  (now ${dailyBurnUsd.toFixed(2)}/d)
                </span>
              </div>
              <div className="text-[11px] font-mono text-zinc-500">
                Target daily spend to use 100% of nearest expiring grant
              </div>
            </div>
          </div>

          {/* Dynamic Urgent Warning Banner when a grant is expiring within threshold */}
          {summary.nearestExpiryGrant &&
            summary.nearestExpiryGrant.metrics.daysLeft <=
              summary.nearestExpiryGrant.metrics.alertThreshold && (
              <div className="rounded-xl p-4 border bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-mono font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>
                      Expiring in {summary.nearestExpiryGrant.metrics.daysLeft}{' '}
                      Days: {summary.nearestExpiryGrant.name}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed">
                    You still have{' '}
                    <span className="font-mono font-bold underline">
                      $
                      {summary.nearestExpiryGrant.metrics.remaining.toLocaleString(
                        'en-US',
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </span>{' '}
                    out of{' '}
                    <span className="font-mono font-bold">
                      $
                      {summary.nearestExpiryGrant.metrics.initial.toLocaleString(
                        'en-US',
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </span>{' '}
                    ({summary.nearestExpiryGrant.metrics.displayPct}% remaining)
                    inside this credit grant, and it expires on{' '}
                    <span className="font-mono font-bold underline">
                      {formatHumanDate(
                        summary.nearestExpiryGrant.expirationDate
                      )}
                    </span>
                    . At your current project burn rate (
                    <span className="font-mono font-bold">
                      ${dailyBurnUsd.toFixed(2)}/day
                    </span>
                    ),{' '}
                    <span className="font-mono font-bold underline">
                      $
                      {summary.nearestExpiryGrant.metrics.strandedMoneyUsd.toLocaleString(
                        'en-US',
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}{' '}
                      is projected to expire unused
                    </span>
                    .
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

          {/* Imported Google Cloud Console Credits Table */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-[#131314]">
            <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 bg-zinc-50/70 dark:bg-[#202124]">
              <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                <Filter className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter credits by name, status, or application..."
                  className="w-full bg-transparent text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'ALL', label: `All (${enrichedGrants.length})` },
                  {
                    id: 'EXPIRING_SOON',
                    label: `Expiring Soon (${summary.expiringSoonCount})`,
                  },
                  {
                    id: 'AVAILABLE',
                    label: `Available (${summary.activeCount})`,
                  },
                  {
                    id: 'EXPIRED',
                    label: `Expired (${summary.expiredCount})`,
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`h-7 px-2.5 rounded-lg text-[11px] font-mono font-bold border transition-all cursor-pointer whitespace-nowrap ${
                      statusFilter === tab.id
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60 text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                    <th className="py-2.5 px-4">Credit name</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Percent remaining</th>
                    <th className="py-2.5 px-3 text-right">Remaining value</th>
                    <th className="py-2.5 px-3 text-right">Original value</th>
                    <th className="py-2.5 px-3">Start date</th>
                    <th className="py-2.5 px-3">End date</th>
                    <th className="py-2.5 px-4">Credit application</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {filteredGrants.map((grant) => {
                    const m = grant.metrics;
                    const isUrgent =
                      m.status === 'CRITICAL_EXPIRY' ||
                      m.status === 'WARNING_EXPIRY';
                    const filledSegments = m.isExpired
                      ? 0
                      : Math.max(1, Math.round((m.remainingPct / 100) * 5));

                    return (
                      <tr
                        key={grant.id}
                        className={`transition-colors ${
                          isUrgent
                            ? 'bg-amber-500/5 hover:bg-amber-500/10'
                            : m.isExpired
                            ? 'opacity-65 hover:opacity-90'
                            : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/40'
                        }`}
                      >
                        <td className="py-3 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                          <div className="font-semibold">{grant.name}</div>
                          {isUrgent && (
                            <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                              Stranded forecast: $
                              {m.strandedMoneyUsd.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{' '}
                              will expire unused at ${dailyBurnUsd.toFixed(2)}/day
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          {m.isExpired ? (
                            <span className="inline-flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 font-medium">
                              <XCircle className="w-4 h-4 text-red-600 dark:text-red-500 shrink-0" />
                              <span>Expired</span>
                            </span>
                          ) : isUrgent ? (
                            <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold">
                              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                              <span>{m.consoleStatusLabel}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200 font-medium">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-500 shrink-0" />
                              <span>Available</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          {m.isExpired ? (
                            <span className="text-zinc-400 font-mono">—</span>
                          ) : (
                            <div className="inline-flex items-center gap-2">
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((seg) => (
                                  <span
                                    key={seg}
                                    className={`w-3.5 h-2 rounded-[1px] ${
                                      seg <= filledSegments
                                        ? 'bg-emerald-600 dark:bg-emerald-500'
                                        : 'bg-zinc-200 dark:bg-zinc-800'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="font-mono text-zinc-700 dark:text-zinc-300">
                                {m.displayPct}%
                              </span>
                            </div>
                          )}
                        </td>

                        <td
                          className={`py-3 px-3 text-right font-mono whitespace-nowrap ${
                            m.isExpired
                              ? 'text-zinc-400 dark:text-zinc-500'
                              : isUrgent
                              ? 'font-extrabold text-amber-600 dark:text-amber-400'
                              : 'font-semibold text-zinc-900 dark:text-zinc-100'
                          }`}
                        >
                          $
                          {m.remaining.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>

                        <td className="py-3 px-3 text-right font-mono text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                          $
                          {m.initial.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>

                        <td className="py-3 px-3 text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                          {formatHumanDate(grant.startDate)}
                        </td>

                        <td
                          className={`py-3 px-3 whitespace-nowrap ${
                            isUrgent
                              ? 'font-bold text-amber-700 dark:text-amber-400'
                              : 'text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          {formatHumanDate(grant.expirationDate)}
                        </td>

                        <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                          {grant.creditApplication || 'Net price'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
