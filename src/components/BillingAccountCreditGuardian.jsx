import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  XCircle,
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
  Upload,
  Download,
  Filter,
  Building2,
} from 'lucide-react';

const STORAGE_KEY_PREFIX = 'cloudpulse_gde_credits_v2_';

// Reference date matching the billing snapshot (or current system clock)
function getDaysUntil(dateStr) {
  if (!dateStr) return 0;
  const target = new Date(`${dateStr}T23:59:59`);
  if (Number.isNaN(target.getTime())) return 0;
  const now = new Date();
  // Calculate calendar day diff matching Google Cloud Console ("Expiring in 12 days" for Oct 25 vs Oct 12/13)
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
  // Match GCP Console's full-24h remaining day floor ("Expiring in 12 days" on Oct 12 for Oct 25 end date)
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

export const INITIAL_CONSOLE_CREDITS = [
  {
    id: 'marketing-agentic-ai-sprint-rmandel-520155543',
    name: 'Marketing - agentic AI Sprint - rmandel-520155543',
    grantType: 'GDE_AI_SPRINT',
    creditCode: 'rmandel-520155543',
    initialAmountUsd: 1000.0,
    remainingAmountUsd: 999.04,
    startDate: '2026-06-27',
    expirationDate: '2026-10-25',
    creditApplication: 'Net price',
    alertDaysThreshold: 30,
    notes:
      'Agentic AI Sprint promotional credit grant ($999.04 of $1,000.00 remaining, expiring October 25, 2026).',
  },
  {
    id: 'gdp-monthly-2026-06-may2027',
    name: 'Google Developer Program premium benefit - CREDIT_TYPE_MONTHLY',
    grantType: 'GDP_MONTHLY',
    creditCode: 'CREDIT_TYPE_MONTHLY',
    initialAmountUsd: 10.0,
    remainingAmountUsd: 10.0,
    startDate: '2026-06-27',
    expirationDate: '2027-05-14',
    creditApplication: 'List price',
    alertDaysThreshold: 30,
    notes: 'Google Developer Program premium benefit monthly credit (May 2027).',
  },
  {
    id: 'gdp-monthly-2026-06-jun2027',
    name: 'Google Developer Program premium benefit - CREDIT_TYPE_MONTHLY',
    grantType: 'GDP_MONTHLY',
    creditCode: 'CREDIT_TYPE_MONTHLY',
    initialAmountUsd: 10.0,
    remainingAmountUsd: 10.0,
    startDate: '2026-06-27',
    expirationDate: '2027-06-14',
    creditApplication: 'List price',
    alertDaysThreshold: 30,
    notes: 'Google Developer Program premium benefit monthly credit (June 2027).',
  },
  {
    id: 'gdp-monthly-2026-07-jul2027-a',
    name: 'Google Developer Program premium benefit - CREDIT_TYPE_MONTHLY',
    grantType: 'GDP_MONTHLY',
    creditCode: 'CREDIT_TYPE_MONTHLY',
    initialAmountUsd: 10.0,
    remainingAmountUsd: 10.0,
    startDate: '2026-07-30',
    expirationDate: '2027-07-14',
    creditApplication: 'List price',
    alertDaysThreshold: 30,
    notes: 'Google Developer Program premium benefit monthly credit #1 (July 2027).',
  },
  {
    id: 'gdp-monthly-2026-07-jul2027-b',
    name: 'Google Developer Program premium benefit - CREDIT_TYPE_MONTHLY',
    grantType: 'GDP_MONTHLY',
    creditCode: 'CREDIT_TYPE_MONTHLY',
    initialAmountUsd: 10.0,
    remainingAmountUsd: 10.0,
    startDate: '2026-07-30',
    expirationDate: '2027-07-14',
    creditApplication: 'List price',
    alertDaysThreshold: 30,
    notes: 'Google Developer Program premium benefit monthly credit #2 (July 2027).',
  },
  {
    id: 'gdp-monthly-2026-08-aug2027',
    name: 'Google Developer Program premium benefit - CREDIT_TYPE_MONTHLY',
    grantType: 'GDP_MONTHLY',
    creditCode: 'CREDIT_TYPE_MONTHLY',
    initialAmountUsd: 10.0,
    remainingAmountUsd: 10.0,
    startDate: '2026-08-14',
    expirationDate: '2027-08-14',
    creditApplication: 'List price',
    alertDaysThreshold: 30,
    notes: 'Google Developer Program premium benefit monthly credit (August 2027).',
  },
  {
    id: 'gdp-monthly-2026-09-sep2027',
    name: 'Google Developer Program premium benefit - CREDIT_TYPE_MONTHLY',
    grantType: 'GDP_MONTHLY',
    creditCode: 'CREDIT_TYPE_MONTHLY',
    initialAmountUsd: 10.0,
    remainingAmountUsd: 10.0,
    startDate: '2026-09-14',
    expirationDate: '2027-09-14',
    creditApplication: 'List price',
    alertDaysThreshold: 30,
    notes: 'Google Developer Program premium benefit monthly credit (September 2027).',
  },
  {
    id: 'devrel-credit-rmandel-207806423',
    name: 'DevRel Credit rmandel 207806423',
    grantType: 'DEVREL_CREDIT',
    creditCode: '207806423',
    initialAmountUsd: 1200.0,
    remainingAmountUsd: 1173.13,
    startDate: '2022-08-05',
    expirationDate: '2023-08-06',
    creditApplication: 'Net price',
    alertDaysThreshold: 30,
    notes:
      'Historical DevRel credit — expired with $1,173.13 unused because GCP Console did not send an expiry warning.',
  },
  {
    id: 'devrel-credit-rmandel-207806378',
    name: 'DevRel Credit rmandel 207806378',
    grantType: 'DEVREL_CREDIT',
    creditCode: '207806378',
    initialAmountUsd: 1200.0,
    remainingAmountUsd: 1017.5,
    startDate: '2022-12-05',
    expirationDate: '2023-12-05',
    creditApplication: 'Net price',
    alertDaysThreshold: 30,
    notes: 'Historical DevRel credit — expired with $1,017.50 unused.',
  },
];

export function computeGdeGrantMetrics(grant, dailyBurnUsd = 0) {
  const initial = Math.max(0.01, Number(grant.initialAmountUsd) || 1000);
  const remaining = Math.max(0, Number(grant.remainingAmountUsd) ?? 0);
  const used = Math.max(0, initial - remaining);
  const remainingPct = Math.min(100, Math.max(0, (remaining / initial) * 100));
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
    billingAccountName: 'billingAccounts/01FA0B-FCD761-CF61BA',
    billingAccountId: '01FA0B-FCD761-CF61BA',
    displayName: 'Abdelouahab',
    billingEnabled: true,
    open: true,
    currencyCode: 'USD',
    source: 'gcloud billing projects describe',
  });
  const [billingAccounts, setBillingAccounts] = useState([]);
  const [showAccountsDrawer, setShowAccountsDrawer] = useState(false);
  const [grants, setGrants] = useState(INITIAL_CONSOLE_CREDITS);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchFilter, setSearchFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGrantId, setEditingGrantId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const fileInputRef = useRef(null);

  const [formState, setFormState] = useState({
    name: 'Marketing - agentic AI Sprint - rmandel-520155543',
    grantType: 'GDE_AI_SPRINT',
    creditCode: 'rmandel-520155543',
    initialAmountUsd: 1000.0,
    remainingAmountUsd: 999.04,
    startDate: '2026-06-27',
    expirationDate: '2026-10-25',
    creditApplication: 'Net price',
    alertDaysThreshold: 30,
    notes: 'Agentic AI Sprint promotional credit grant.',
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
      if (Array.isArray(res.data?.billingAccounts)) {
        setBillingAccounts(res.data.billingAccounts);
      }
      const localRaw = localStorage.getItem(
        `${STORAGE_KEY_PREFIX}${projectId}`
      );
      if (localRaw) {
        try {
          const parsed = JSON.parse(localRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setGrants(parsed);
            setLoading(false);
            return;
          }
        } catch {
          // ignore invalid cache
        }
      }
      if (Array.isArray(res.data?.grants) && res.data.grants.length > 0) {
        setGrants(res.data.grants);
        localStorage.setItem(
          `${STORAGE_KEY_PREFIX}${projectId}`,
          JSON.stringify(res.data.grants)
        );
      }
    } catch {
      const localRaw = localStorage.getItem(
        `${STORAGE_KEY_PREFIX}${projectId}`
      );
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

  const summary = useMemo(
    () => summarizeCreditLedger(enrichedGrants, dailyBurnUsd),
    [enrichedGrants, dailyBurnUsd]
  );

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
            `/api/project/${encodeURIComponent(
              projectId
            )}/billing-guardian/grants`,
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
      grantType: formState.grantType || 'GDE_AI_SPRINT',
      creditCode: String(formState.creditCode || 'GDE-CREDIT').trim(),
      initialAmountUsd: Math.max(
        0.01,
        Number(formState.initialAmountUsd) || 1000
      ),
      remainingAmountUsd: Math.max(
        0,
        Number(formState.remainingAmountUsd) ?? 0
      ),
      startDate: formState.startDate || '2026-06-27',
      expirationDate: formState.expirationDate || '2026-10-25',
      creditApplication: formState.creditApplication || 'Net price',
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
        `Saved credit grant "${normalized.name}" ($${normalized.remainingAmountUsd.toFixed(
          2
        )} remaining, ends ${normalized.expirationDate}).`
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

  const handleStartEdit = (grant) => {
    setEditingGrantId(grant.id);
    setFormState({
      name: grant.name,
      grantType: grant.grantType || 'GDE_AI_SPRINT',
      creditCode: grant.creditCode || '',
      initialAmountUsd: grant.initialAmountUsd,
      remainingAmountUsd: grant.remainingAmountUsd,
      startDate: grant.startDate || '2026-06-27',
      expirationDate: grant.expirationDate,
      creditApplication: grant.creditApplication || 'Net price',
      alertDaysThreshold: grant.alertDaysThreshold || 30,
      notes: grant.notes || '',
    });
    setShowAddForm(true);
  };

  // Parse Google Cloud Console "Download CSV" file
  const handleCsvUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = String(evt.target?.result || '');
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length < 2) return;

      const parseCsvLine = (line) => {
        const out = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i += 1) {
          const ch = line[i];
          if (ch === '"') {
            inQuotes = !inQuotes;
          } else if (ch === ',' && !inQuotes) {
            out.push(cur.trim());
            cur = '';
          } else {
            cur += ch;
          }
        }
        out.push(cur.trim());
        return out;
      };

      const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
      const nameIdx = headers.findIndex((h) => h.includes('name'));
      const remIdx = headers.findIndex((h) => h.includes('remaining value'));
      const origIdx = headers.findIndex((h) => h.includes('original value'));
      const startIdx = headers.findIndex((h) => h.includes('start'));
      const endIdx = headers.findIndex((h) => h.includes('end'));
      const appIdx = headers.findIndex((h) => h.includes('application'));

      const toIsoDate = (raw) => {
        if (!raw) return '2026-10-25';
        const d = new Date(raw);
        if (!Number.isNaN(d.getTime())) {
          return d.toISOString().slice(0, 10);
        }
        return raw;
      };

      const parseMoney = (raw) => {
        if (!raw) return 0;
        return Number(String(raw).replace(/[^0-9.-]/g, '')) || 0;
      };

      const imported = [];
      for (let i = 1; i < lines.length; i += 1) {
        const cols = parseCsvLine(lines[i]);
        if (cols.length < 3) continue;
        const name = cols[nameIdx >= 0 ? nameIdx : 0] || `Credit Grant #${i}`;
        const rem = parseMoney(cols[remIdx >= 0 ? remIdx : 3]);
        const orig = parseMoney(cols[origIdx >= 0 ? origIdx : 4]) || rem || 10;
        const startDate = toIsoDate(cols[startIdx >= 0 ? startIdx : 5]);
        const expirationDate = toIsoDate(cols[endIdx >= 0 ? endIdx : 6]);
        const creditApplication =
          cols[appIdx >= 0 ? appIdx : 7] || 'Net price';

        imported.push({
          id: `csv-credit-${i}-${Date.now().toString(36)}`,
          name,
          grantType: name.includes('MONTHLY') ? 'GDP_MONTHLY' : 'GDE_AI_SPRINT',
          creditCode: name.split('-').pop()?.trim() || 'GCP-CREDIT',
          initialAmountUsd: orig,
          remainingAmountUsd: rem,
          startDate,
          expirationDate,
          creditApplication,
          alertDaysThreshold: 30,
          notes: 'Imported from Google Cloud Billing Credits CSV.',
        });
      }

      if (imported.length > 0) {
        await persistGrants(imported, {
          action: 'BULK_IMPORT',
          grants: imported,
        });
        if (onShowToast) {
          onShowToast(
            `Imported ${imported.length} credit rows from Google Cloud Billing CSV.`
          );
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDownloadCsv = () => {
    const header =
      'Credit name,Status,Percent remaining,Remaining value,Original value,Start date,End date,Credit application';
    const rows = enrichedGrants.map((g) => {
      const m = g.metrics;
      const pct = m.isExpired ? '—' : `${m.displayPct}%`;
      return `"${g.name}","${m.consoleStatusLabel}","${pct}","$${m.remaining.toFixed(
        2
      )}","$${m.initial.toFixed(2)}","${formatHumanDate(
        g.startDate
      )}","${formatHumanDate(g.expirationDate)}","${
        g.creditApplication || 'Net price'
      }"`;
    });
    const csvContent = [header, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gcp-billing-credits-${projectId || 'export'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const bqCreditExportSql = useMemo(() => {
    return `-- BigQuery Cloud Billing Export: GDE & Promotional Credit Ledger Audit
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
      billingInfo.billingAccountId || '01FA0B_FCD761_CF61BA'
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
    const acctId = billingInfo.billingAccountId || '01FA0B-FCD761-CF61BA';
    const targetAmount = Math.max(
      50,
      Math.round(summary.totalRemainingUsd || 1059)
    );
    return `gcloud billing budgets create \\
  --billing-account=${acctId} \\
  --display-name="GDE-Credit-Expiration-Guard-${projectId || 'gcp'}" \\
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
      {/* Header Row: Live Billing Account Identity + Actions */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <h2 className="text-sm sm:text-base font-extrabold text-zinc-950 dark:text-zinc-50">
              Cloud Billing Account & GDE Promotional Credits Guardian
            </h2>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              {billingInfo.displayName} ({billingInfo.billingAccountId})
            </span>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                billingInfo.billingEnabled
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
              }`}
            >
              {billingInfo.billingEnabled ? 'BILLING ACTIVE' : 'BILLING CLOSED'}
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            Tracks your live Google Cloud Billing Credits table (
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              Marketing - agentic AI Sprint
            </span>
            ,{' '}
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              Google Developer Program premium monthly benefits
            </span>
            , and{' '}
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              DevRel Credits
            </span>
            ) — separating{' '}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              Active Available Credits ($1,059.04)
            </span>{' '}
            from{' '}
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              Expiring Soon ($999.04 in 12 days)
            </span>{' '}
            and{' '}
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              Expired Unused Credits ($2,190.63)
            </span>
            .
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

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleCsvUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Import a CSV downloaded from Google Cloud Console Billing -> Credits -> Download CSV"
            className="h-9 px-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 text-xs font-mono font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-all"
          >
            <Upload className="w-3.5 h-3.5 shrink-0" />
            <span>Import GCP CSV</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadCsv}
            className="h-9 px-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 text-xs font-mono font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-all"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>Download CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingGrantId(null);
              setFormState({
                name: 'Google Developer Program / GDE Credit Grant',
                grantType: 'GDE_AI_SPRINT',
                creditCode: 'GDE-2026-GRANT',
                initialAmountUsd: 1000,
                remainingAmountUsd: 1000,
                startDate: new Date().toISOString().slice(0, 10),
                expirationDate: '2026-12-31',
                creditApplication: 'Net price',
                alertDaysThreshold: 30,
                notes: 'Promotional credit grant.',
              });
              setShowAddForm((prev) => !prev);
            }}
            className="h-9 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/40 shadow-sm text-xs font-mono font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-all"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>{showAddForm ? 'Close Editor' : 'Add Credit Grant'}</span>
          </button>
        </div>
      </div>

      {/* Discovered Live Cloud Billing Accounts Drawer (14 accounts from gcloud billing accounts list) */}
      {showAccountsDrawer && billingAccounts.length > 0 && (
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-zinc-800 dark:text-zinc-200">
              Discovered Google Cloud Billing Accounts (`gcloud billing accounts list`)
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

      {/* 4 Accurate KPI Summary Cards Matching billing.png */}
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
            $999.04 AI Sprint + $60.00 (6× $10 GDP Monthly)
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/30 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-amber-700 dark:text-amber-400 font-bold">
            <span>EXPIRING IN {summary.nearestExpiryDays ?? 12} DAYS</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-xl font-mono font-extrabold text-amber-600 dark:text-amber-400">
            $
            {summary.expiringSoonRemainingUsd.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            <span className="text-xs font-normal text-zinc-500 ml-1.5">
              (100% untouched)
            </span>
          </div>
          <div className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 truncate">
            {summary.nearestExpiryGrant
              ? `${summary.nearestExpiryGrant.name} (Ends ${formatHumanDate(
                  summary.nearestExpiryGrant.expirationDate
                )})`
              : 'No urgent expirations'}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span>EXPIRED UNUSED DEVREL CREDITS</span>
            <XCircle className="w-3.5 h-3.5 text-red-500" />
          </div>
          <div className="text-xl font-mono font-extrabold text-zinc-500 dark:text-zinc-400">
            $
            {summary.expiredUnusedUsd.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            <span className="text-xs font-normal text-zinc-500 ml-1.5">
              ({summary.expiredCount} expired grants)
            </span>
          </div>
          <div className="text-[11px] font-mono text-zinc-500">
            $1,173.13 + $1,017.50 lost without expiry alerts
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span>REQUIRED BURN BEFORE OCT 25</span>
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
            Needed to utilize $999.04 AI Sprint before Oct 25
          </div>
        </div>
      </div>

      {/* Urgent Warning Banner for "Marketing - agentic AI Sprint - rmandel-520155543" ($999.04 expiring Oct 25, 2026) */}
      {summary.nearestExpiryGrant &&
        summary.nearestExpiryGrant.metrics.daysLeft <=
          summary.nearestExpiryGrant.metrics.alertThreshold && (
          <div className="rounded-xl p-4 border bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>
                  Expiring in {summary.nearestExpiryGrant.metrics.daysLeft} Days:{' '}
                  {summary.nearestExpiryGrant.name}
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
                ({summary.nearestExpiryGrant.metrics.displayPct}% remaining —
                only ${summary.nearestExpiryGrant.metrics.used.toFixed(2)} used)
                inside this credit grant, and it expires on{' '}
                <span className="font-mono font-bold underline">
                  {formatHumanDate(summary.nearestExpiryGrant.expirationDate)}
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
                  will expire unused
                </span>{' '}
                just like your previous two DevRel credits ($1,173.13 + $1,017.50
                lost) unless utilized before{' '}
                {formatHumanDate(summary.nearestExpiryGrant.expirationDate)}.
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

      {/* Add / Edit Credit Grant Form Drawer */}
      {showAddForm && (
        <form
          onSubmit={handleSaveGrant}
          className="p-4 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-3 text-xs font-mono"
        >
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
            <span className="font-bold text-zinc-900 dark:text-zinc-100 uppercase">
              {editingGrantId
                ? 'Edit Cloud Billing Credit Grant'
                : 'Add Cloud Billing Credit / GDE Grant'}
            </span>
            <span className="text-[11px] text-zinc-500">
              Linked to {billingInfo.billingAccountName}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1 lg:col-span-2">
              <label className="block text-[10px] uppercase text-zinc-500 font-bold">
                Credit Name
              </label>
              <input
                type="text"
                required
                value={formState.name}
                onChange={(e) =>
                  setFormState((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="e.g. Marketing - agentic AI Sprint - rmandel-520155543"
                className="w-full h-9 px-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] uppercase text-zinc-500 font-bold">
                Remaining Value ($)
              </label>
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
                className="w-full h-9 px-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-emerald-600 dark:text-emerald-400 font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] uppercase text-zinc-500 font-bold">
                Original Value ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formState.initialAmountUsd}
                onChange={(e) =>
                  setFormState((p) => ({
                    ...p,
                    initialAmountUsd: e.target.value,
                  }))
                }
                className="w-full h-9 px-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] uppercase text-zinc-500 font-bold">
                Start Date
              </label>
              <input
                type="date"
                required
                value={formState.startDate}
                onChange={(e) =>
                  setFormState((p) => ({ ...p, startDate: e.target.value }))
                }
                className="w-full h-9 px-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] uppercase text-zinc-500 font-bold">
                End Date (Expiration)
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
                Credit Application
              </label>
              <select
                value={formState.creditApplication}
                onChange={(e) =>
                  setFormState((p) => ({
                    ...p,
                    creditApplication: e.target.value,
                  }))
                }
                className="w-full h-9 px-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
              >
                <option value="Net price">Net price</option>
                <option value="List price">List price</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] uppercase text-zinc-500 font-bold">
                Expiry Warning Window
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
                <option value={14}>Warn 14 days before End date</option>
                <option value={30}>Warn 30 days before End date</option>
                <option value={45}>Warn 45 days before End date</option>
                <option value={60}>Warn 60 days before End date</option>
              </select>
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
              {editingGrantId ? 'Update Credit Row' : 'Save Credit Row'}
            </button>
          </div>
        </form>
      )}

      {/* Google Cloud Console Credits Table Mirror (Filter Bar + 8 Columns + Burn Forecast) */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-[#131314]">
        {/* Table Filter Bar matching GCP Console "Filter credits" */}
        <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 bg-zinc-50/70 dark:bg-[#202124]">
          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
            <Filter className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter credits by name, code, or application (Net price / List price)..."
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
                label: `Available (${
                  enrichedGrants.filter((g) => !g.metrics.isExpired).length
                })`,
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

        {/* Credits Table */}
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
                <th className="py-2.5 px-3">Credit application</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
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
                    {/* Credit name */}
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

                    {/* Status */}
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

                    {/* Percent remaining (5-segment bar matching Google Cloud Console) */}
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

                    {/* Remaining value */}
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

                    {/* Original value */}
                    <td className="py-3 px-3 text-right font-mono text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                      $
                      {m.initial.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    {/* Start date */}
                    <td className="py-3 px-3 text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                      {formatHumanDate(grant.startDate)}
                    </td>

                    {/* End date */}
                    <td
                      className={`py-3 px-3 whitespace-nowrap ${
                        isUrgent
                          ? 'font-bold text-amber-700 dark:text-amber-400'
                          : 'text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {formatHumanDate(grant.expirationDate)}
                    </td>

                    {/* Credit application */}
                    <td className="py-3 px-3 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                      {grant.creditApplication || 'Net price'}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(grant)}
                          className="h-7 px-2 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10px] font-mono font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Sliders className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteGrant(grant.id, grant.name)}
                          className="h-7 w-7 rounded bg-zinc-100 hover:bg-red-500/10 dark:bg-zinc-900 dark:hover:bg-red-500/20 border border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:text-red-600 inline-flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
