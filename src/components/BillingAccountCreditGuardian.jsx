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
  if (!dateStr) return null;
  const target = new Date(`${dateStr}T23:59:59`);
  if (Number.isNaN(target.getTime())) return null;
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
  const isExpired = daysLeft !== null && daysLeft <= 0;

  const safeDailyBurn = Math.max(0, Number(dailyBurnUsd) || 0);
  const projectedSpendUntilExpiry =
    !isExpired && daysLeft !== null ? safeDailyBurn * daysLeft : 0;
  const strandedMoneyUsd =
    !isExpired && daysLeft !== null
      ? Math.max(0, remaining - projectedSpendUntilExpiry)
      : isExpired
      ? remaining
      : 0;

  const daysUntilExhausted =
    !isExpired && safeDailyBurn > 0.01 ? remaining / safeDailyBurn : Infinity;

  const willExhaustBeforeExpiry =
    !isExpired &&
    daysLeft !== null &&
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
  } else if (daysLeft !== null && daysLeft <= alertThreshold) {
    status = daysLeft <= 14 ? 'CRITICAL_EXPIRY' : 'WARNING_EXPIRY';
    consoleStatusLabel = `Expiring in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`;
  }

  const requiredDailyBurnToUseAll =
    !isExpired && daysLeft !== null && daysLeft > 0 ? remaining / daysLeft : 0;

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
  let monthlyBenefitCount = 0;
  let monthlyBenefitRemainingUsd = 0;
  let nearestExpiryDays = Infinity;
  let nearestExpiryGrant = null;
  let urgentWarningsCount = 0;

  for (const raw of grants) {
    const m = raw.metrics || computeGdeGrantMetrics(raw, dailyBurnUsd);
    const isMonthlyBenefit =
      String(raw.grantType || '').includes('MONTHLY') ||
      String(raw.creditApplication || '').includes('MONTHLY') ||
      String(raw.name || '')
        .toLowerCase()
        .includes('developer program premium benefit');

    if (m.isExpired) {
      expiredUnusedUsd += m.remaining;
      expiredCount += 1;
    } else {
      activeOriginalUsd += m.initial;
      activeRemainingUsd += m.remaining;
      activeCount += 1;

      if (isMonthlyBenefit && m.remaining > 0) {
        monthlyBenefitCount += 1;
        monthlyBenefitRemainingUsd += m.remaining;
      }

      if (
        m.remaining > 0 &&
        m.daysLeft !== null &&
        m.daysLeft < nearestExpiryDays
      ) {
        nearestExpiryDays = m.daysLeft;
        nearestExpiryGrant = { ...raw, metrics: m };
      }

      if (
        m.daysLeft !== null &&
        m.daysLeft <= m.alertThreshold &&
        m.remaining > 0
      ) {
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
    monthlyBenefitCount,
    monthlyBenefitRemainingUsd,
    nearestExpiryDays: Number.isFinite(nearestExpiryDays)
      ? nearestExpiryDays
      : null,
    nearestExpiryGrant,
    urgentWarningsCount,
  };
}

const IDB_NAME = 'CloudPulseBillingGuardianDB_v2';
const IDB_VERSION = 1;

function openBillingIndexedDb() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    let settled = false;
    const finish = (val) => {
      if (!settled) {
        settled = true;
        resolve(val);
      }
    };
    const timer = setTimeout(() => finish(null), 1500);
    try {
      const req = window.indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('tempJsonSnapshots')) {
          db.createObjectStore('tempJsonSnapshots', { keyPath: 'projectId' });
        }
        if (!db.objectStoreNames.contains('billingAccounts')) {
          db.createObjectStore('billingAccounts', {
            keyPath: 'billingAccountId',
          });
        }
        if (!db.objectStoreNames.contains('billingBudgets')) {
          db.createObjectStore('billingBudgets', { keyPath: 'name' });
        }
        if (!db.objectStoreNames.contains('consoleCreditGrants')) {
          db.createObjectStore('consoleCreditGrants', { keyPath: 'grantKey' });
        }
        if (!db.objectStoreNames.contains('costLedgerRows')) {
          db.createObjectStore('costLedgerRows', { keyPath: 'rowKey' });
        }
        if (!db.objectStoreNames.contains('aggregatedDecisions')) {
          db.createObjectStore('aggregatedDecisions', { keyPath: 'projectId' });
        }
      };
      req.onsuccess = () => {
        clearTimeout(timer);
        const db = req.result;
        db.onversionchange = () => db.close();
        finish(db);
      };
      req.onerror = () => {
        clearTimeout(timer);
        finish(null);
      };
      req.onblocked = () => {
        clearTimeout(timer);
        finish(null);
      };
    } catch {
      clearTimeout(timer);
      finish(null);
    }
  });
}

export function programmaticallyAggregateBillingData({
  projectId,
  billingInfo = {},
  billingAccounts = [],
  liveBillingInsights = null,
  syncedConsoleCredits = [],
  envelopeOverride = {},
  dailyBurnUsd = 0,
}) {
  const openRows = Array.isArray(liveBillingInsights?.costCreditRows)
    ? liveBillingInsights.costCreditRows
    : [];
  const crossRows = Array.isArray(liveBillingInsights?.crossAccountRows)
    ? liveBillingInsights.crossAccountRows
    : openRows;
  const monthlyRows = Array.isArray(liveBillingInsights?.monthlyTrendRows)
    ? liveBillingInsights.monthlyTrendRows
    : [];
  const billingBudgets = Array.isArray(liveBillingInsights?.billingBudgets)
    ? liveBillingInsights.billingBudgets
    : [];
  const consoleCredits =
    Array.isArray(syncedConsoleCredits) && syncedConsoleCredits.length > 0
      ? syncedConsoleCredits
      : Array.isArray(liveBillingInsights?.consoleCredits)
      ? liveBillingInsights.consoleCredits
      : [];

  let grossUsageUsd = 0;
  let totalCreditUsd = 0;
  let otherSavingsUsd = 0;
  let savingsProgramsUsd = 0;
  let netSubtotalUsd = 0;

  for (const r of openRows) {
    grossUsageUsd += Number(r.usage_cost || 0);
    totalCreditUsd += Number(r.total_credit || 0);
    otherSavingsUsd += Number(r.other_savings || 0);
    savingsProgramsUsd += Number(r.savings_programs || 0);
    netSubtotalUsd += Number(r.subtotal || 0);
  }

  let crossGrossUsd = 0;
  let crossCreditUsd = 0;
  let crossSubtotalUsd = 0;
  for (const r of crossRows) {
    crossGrossUsd += Number(r.usage_cost || 0);
    crossCreditUsd += Number(r.total_credit || 0);
    crossSubtotalUsd += Number(r.subtotal || 0);
  }

  const absCreditsUsd = Math.abs(totalCreditUsd);
  const absCrossCreditsUsd = Math.max(absCreditsUsd, Math.abs(crossCreditUsd));
  const historicalClosedCreditsUsd = Math.max(
    0,
    Number((absCrossCreditsUsd - absCreditsUsd).toFixed(2))
  );
  const coveragePct =
    grossUsageUsd > 0
      ? Math.min(100, (absCreditsUsd / grossUsageUsd) * 100)
      : 0;

  const now = new Date();
  const currentYear = now.getFullYear();
  const lastDayOfCurrentMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  )
    .toISOString()
    .slice(0, 10);

  const temporalWindow = liveBillingInsights?.temporalWindow || {
    derivedStartDate: `${currentYear}-01-01`,
    derivedSprintEndDate: lastDayOfCurrentMonth,
    derivedAnnualEndDate: `${currentYear}-12-31`,
  };

  const effectiveThresholdDays = Math.max(
    1,
    Number(envelopeOverride?.alertDaysThreshold) || 30
  );

  const grants = [];

  // 1. Use the exact Remaining Bonus grants from the user's uploaded/pasted CSV without automatic balance modification, while calculating expiration countdowns dynamically
  if (consoleCredits.length > 0) {
    consoleCredits.forEach((c, idx) => {
      grants.push({
        id: c.id || `console-${c.creditCode || idx}`,
        name: c.name || 'Promotional Credit',
        grantType: c.grantType || 'PROMOTIONAL',
        creditCode: c.creditCode || c.creditId || '',
        initialAmountUsd: Math.max(0, Number(c.initialAmountUsd ?? 0)),
        remainingAmountUsd: Math.max(0, Number(c.remainingAmountUsd ?? 0)),
        startDate: c.startDate || temporalWindow.derivedStartDate,
        expirationDate: c.expirationDate || temporalWindow.derivedAnnualEndDate,
        creditApplication:
          c.creditApplication ||
          `${c.grantType || 'PROMOTIONAL'} · ${c.scope || 'Billing account'}`,
        alertDaysThreshold: effectiveThresholdDays,
      });
    });
  } else if (Number(envelopeOverride?.initialGrantUsd) > 0) {
    const overrideInit = Number(envelopeOverride.initialGrantUsd);
    const derivedRemainingUsd = Math.max(
      0,
      Number((overrideInit - absCreditsUsd).toFixed(2))
    );
    grants.push({
      id: 'idb-custom-envelope-grant',
      name:
        envelopeOverride?.name ||
        (billingInfo?.displayName &&
        !billingInfo.displayName.includes('Loading')
          ? `${billingInfo.displayName} Promotional Credit Pool`
          : 'Active GDE Promotional Credit Pool'),
      grantType: 'GDE_BONUS',
      creditCode: billingInfo?.billingAccountId || 'IDB-CUSTOM',
      initialAmountUsd: overrideInit,
      remainingAmountUsd: derivedRemainingUsd,
      startDate:
        envelopeOverride?.startDate ||
        temporalWindow.derivedStartDate ||
        `${currentYear}-01-01`,
      expirationDate:
        envelopeOverride?.expirationDate ||
        temporalWindow.derivedSprintEndDate ||
        lastDayOfCurrentMonth,
      creditApplication: `Custom Pool (-$${absCreditsUsd.toFixed(
        2
      )} active used from costs.v2)`,
      alertDaysThreshold: effectiveThresholdDays,
    });
  }

  // Also include historical/closed dated or exhausted bonus accounts discovered from `gcloud billing accounts list` if not already in consoleCredits
  const closedBonusAcct = billingAccounts.find(
    (a) =>
      !a.open &&
      (a.parsedDateTag ||
        String(a.displayName || '').toLowerCase().includes('bonus') ||
        String(a.displayName || '').toLowerCase().includes('gdp credit'))
  );
  if (
    consoleCredits.length === 0 &&
    closedBonusAcct &&
    historicalClosedCreditsUsd > 0
  ) {
    grants.push({
      id: `idb-historical-${closedBonusAcct.billingAccountId}`,
      name: closedBonusAcct.displayName,
      grantType: 'HISTORICAL_BONUS',
      creditCode:
        closedBonusAcct.parsedCouponCode || closedBonusAcct.billingAccountId,
      initialAmountUsd: historicalClosedCreditsUsd,
      remainingAmountUsd: 0,
      startDate: temporalWindow.derivedStartDate,
      expirationDate:
        closedBonusAcct.parsedDateTag || temporalWindow.derivedStartDate,
      creditApplication: `Closed Bonus Account (-$${historicalClosedCreditsUsd.toFixed(
        2
      )} consumed in costs.v2)`,
      alertDaysThreshold: effectiveThresholdDays,
    });
  }

  const enrichedGrants = grants.map((g) => ({
    ...g,
    metrics: computeGdeGrantMetrics(g, dailyBurnUsd),
  }));

  const ledgerSummary = summarizeCreditLedger(enrichedGrants, dailyBurnUsd);
  const nearestGrant = ledgerSummary.nearestExpiryGrant;

  let decisionVerdict = 'SYNC_CONSOLE_CREDITS_NEEDED';
  let decisionMessage =
    'Google Cloud OAuth APIs (`costs.v2` & `billingbudgets.googleapis.com/v1`) only expose consumed credits and budgets. Click "Sync Console Credits" to paste your `console.cloud.google.com/billing` Credits table into IndexedDB.';
  if (nearestGrant && nearestGrant.metrics.remaining > 0) {
    const m = nearestGrant.metrics;
    if (m.daysLeft !== null && m.strandedMoneyUsd > 0) {
      decisionVerdict = 'ACCELERATE_WORKLOADS_BEFORE_EXPIRY';
      decisionMessage = `$${m.remaining.toFixed(2)} USD in "${
        nearestGrant.name
      }" expires in ${m.daysLeft} days (${formatHumanDate(
        nearestGrant.expirationDate
      )})${
        ledgerSummary.monthlyBenefitCount > 0
          ? `, plus ${ledgerSummary.monthlyBenefitCount}× monthly benefits ($${ledgerSummary.monthlyBenefitRemainingUsd.toFixed(
              2
            )} USD)`
          : ''
      }. Target $${m.requiredDailyBurnToUseAll.toFixed(
        2
      )}/day before expiry so $${m.strandedMoneyUsd.toFixed(
        2
      )} does not expire unused.`;
    } else if (m.willExhaustBeforeExpiry) {
      decisionVerdict = 'CREDIT_EXHAUSTION_WARNING';
      decisionMessage = `At $${dailyBurnUsd.toFixed(
        2
      )}/day, your remaining $${m.remaining.toFixed(
        2
      )} USD credit grant will exhaust in ~${Math.ceil(
        m.daysUntilExhausted
      )} days before ${formatHumanDate(nearestGrant.expirationDate)}.`;
    } else {
      decisionVerdict = 'OPTIMAL_BURN_PACE';
      decisionMessage = `$${ledgerSummary.totalRemainingUsd.toFixed(
        2
      )} USD active promotional credits available across ${
        ledgerSummary.activeCount
      } grant(s).`;
    }
  }

  const liveCostMetrics = {
    hasLiveRows: openRows.length > 0 || crossRows.length > 0,
    rows: openRows.length > 0 ? openRows : crossRows,
    crossRows,
    monthlyRows,
    billingBudgets,
    consoleCreditsCount: consoleCredits.length,
    grossUsageUsd,
    totalCreditUsd,
    absCreditsUsd,
    absCrossCreditsUsd,
    historicalClosedCreditsUsd,
    otherSavingsUsd,
    savingsProgramsUsd,
    netSubtotalUsd,
    crossGrossUsd,
    crossSubtotalUsd,
    coveragePct,
    derivedPoolUsd: ledgerSummary.totalInitialUsd,
    derivedRemainingUsd: ledgerSummary.totalRemainingUsd,
    effectiveStartDate: temporalWindow.derivedStartDate,
    effectiveExpirationDate:
      nearestGrant?.expirationDate || temporalWindow.derivedSprintEndDate,
    temporalWindow,
    tempJsonPath: liveBillingInsights?.tempJsonPath || '',
    summary: liveBillingInsights?.summary || '',
    fullAnalysis: liveBillingInsights?.fullAnalysis || '',
    source: liveBillingInsights?.source || '',
    queriedParents: liveBillingInsights?.queriedParents || [],
    queriedCrossParents: liveBillingInsights?.queriedCrossParents || [],
    decisionVerdict,
    decisionMessage,
  };

  return {
    ...ledgerSummary,
    hasImportedCredits:
      consoleCredits.length > 0 || Number(envelopeOverride?.initialGrantUsd) > 0,
    enrichedGrants,
    liveCostMetrics,
  };
}

export async function syncAndAggregateBillingIndexedDb({
  projectId,
  billingInfo,
  billingAccounts,
  liveBillingInsights,
  syncedConsoleCredits = [],
  envelopeOverride,
  dailyBurnUsd = 0,
}) {
  const aggregated = programmaticallyAggregateBillingData({
    projectId,
    billingInfo,
    billingAccounts,
    liveBillingInsights,
    syncedConsoleCredits,
    envelopeOverride,
    dailyBurnUsd,
  });

  try {
    const db = await openBillingIndexedDb();
    if (db && projectId) {
      const tx = db.transaction(
        [
          'tempJsonSnapshots',
          'billingAccounts',
          'billingBudgets',
          'consoleCreditGrants',
          'costLedgerRows',
          'aggregatedDecisions',
        ],
        'readwrite'
      );
      tx.objectStore('tempJsonSnapshots').put({
        projectId,
        tempJsonPath: liveBillingInsights?.tempJsonPath || '',
        fetchedAt: liveBillingInsights?.fetchedAt || new Date().toISOString(),
        billingInfo,
        liveBillingInsights,
      });

      const acctStore = tx.objectStore('billingAccounts');
      for (const acct of billingAccounts || []) {
        if (acct.billingAccountId) {
          acctStore.put(acct);
        }
      }

      const budgetStore = tx.objectStore('billingBudgets');
      for (const b of liveBillingInsights?.billingBudgets || []) {
        if (b.name) {
          budgetStore.put({ ...b, projectId });
        }
      }

      const grantStore = tx.objectStore('consoleCreditGrants');
      grantStore.clear();
      const creditsToSave =
        Array.isArray(syncedConsoleCredits) && syncedConsoleCredits.length > 0
          ? syncedConsoleCredits
          : liveBillingInsights?.consoleCredits || [];
      for (const g of creditsToSave) {
        grantStore.put({
          ...g,
          grantKey: `${projectId}-${g.id || g.creditCode}`,
          projectId,
        });
      }

      const rowStore = tx.objectStore('costLedgerRows');
      for (const r of liveBillingInsights?.costCreditRows || []) {
        rowStore.put({
          ...r,
          rowKey: `${projectId}-open-${r.id}`,
          projectId,
          scope: 'OPEN_ACCOUNT',
        });
      }
      for (const r of liveBillingInsights?.crossAccountRows || []) {
        rowStore.put({
          ...r,
          rowKey: `${projectId}-cross-${r.id}`,
          projectId,
          scope: 'CROSS_ACCOUNT',
        });
      }
      for (const r of liveBillingInsights?.monthlyTrendRows || []) {
        rowStore.put({
          ...r,
          rowKey: `${projectId}-month-${r.id}`,
          projectId,
          scope: 'MONTHLY_TREND',
        });
      }

      tx.objectStore('aggregatedDecisions').put({
        projectId,
        updatedAt: new Date().toISOString(),
        totalInitialUsd: aggregated.totalInitialUsd,
        totalRemainingUsd: aggregated.totalRemainingUsd,
        nearestExpiryDays: aggregated.nearestExpiryDays,
        monthlyBenefitCount: aggregated.monthlyBenefitCount,
        monthlyBenefitRemainingUsd: aggregated.monthlyBenefitRemainingUsd,
        decisionVerdict: aggregated.liveCostMetrics.decisionVerdict,
        decisionMessage: aggregated.liveCostMetrics.decisionMessage,
      });
    }
  } catch {
    // Ignore IndexedDB quota/private-mode errors
  }

  return aggregated;
}

export default function BillingAccountCreditGuardian({
  projectId,
  liveBurn,
  gdePrivacyConfig,
  onOpenBigQuerySql,
  onOpenProvision,
  onOpenSecretManagerStudio,
  onRunInShell,
  onShowToast,
  onGrantsSummaryChange,
}) {
  const hideCreditsInGde = Boolean(
    gdePrivacyConfig?.enabled && gdePrivacyConfig?.hideCreditBalances !== false
  );
  const fmtCreditUsd = useCallback(
    (amount) => {
      if (hideCreditsInGde) return '$•••.••';
      return `$${Number(amount || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    },
    [hideCreditsInGde]
  );
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
  const [syncedConsoleCredits, setSyncedConsoleCredits] = useState([]);
  const [showConsoleSyncDrawer, setShowConsoleSyncDrawer] = useState(false);
  const [consolePasteText, setConsolePasteText] = useState('');
  const [syncingConsoleCredits, setSyncingConsoleCredits] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [idbStats, setIdbStats] = useState({
    synced: false,
    accountsCount: 0,
    budgetsCount: 0,
    grantsCount: 0,
    ledgerRowsCount: 0,
    tempJsonPath: '',
  });
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

  // Hydrate cached snapshot & synced console credits from IndexedDB immediately on mount
  useEffect(() => {
    let active = true;
    openBillingIndexedDb()
      .then((db) => {
        if (!db || !projectId) return;
        const tx = db.transaction(
          ['tempJsonSnapshots', 'consoleCreditGrants'],
          'readonly'
        );
        const req = tx.objectStore('tempJsonSnapshots').get(projectId);
        req.onsuccess = () => {
          if (!active || !req.result) return;
          if (req.result.billingInfo) {
            setBillingInfo((prev) =>
              prev.billingAccountId ? prev : req.result.billingInfo
            );
          }
          if (req.result.liveBillingInsights) {
            setLiveBillingInsights((prev) =>
              prev || req.result.liveBillingInsights
            );
            if (
              Array.isArray(req.result.liveBillingInsights.consoleCredits) &&
              req.result.liveBillingInsights.consoleCredits.length > 0
            ) {
              setSyncedConsoleCredits((prev) =>
                prev.length > 0
                  ? prev
                  : req.result.liveBillingInsights.consoleCredits
              );
            }
          }
        };
        const grantsReq = tx.objectStore('consoleCreditGrants').getAll();
        grantsReq.onsuccess = () => {
          if (!active || !Array.isArray(grantsReq.result)) return;
          const matching = grantsReq.result.filter(
            (g) => g.projectId === projectId
          );
          if (matching.length > 0) {
            setSyncedConsoleCredits((prev) =>
              prev.length > 0 ? prev : matching
            );
          }
        };
      })
      .catch(() => null);
    return () => {
      active = false;
    };
  }, [projectId]);

  const loadBillingGuardian = useCallback(
    async (forceRefresh = false) => {
      if (!projectId) return;
      if (forceRefresh) {
        setLoading(true);
      }
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
          if (
            Array.isArray(res.data.liveBillingInsights.consoleCredits) &&
            res.data.liveBillingInsights.consoleCredits.length > 0
          ) {
            setSyncedConsoleCredits(
              res.data.liveBillingInsights.consoleCredits
            );
          }
        }
      } catch {
        // ignore network errors
      } finally {
        if (forceRefresh) {
          setLoading(false);
        }
      }
    },
    [projectId]
  );

  // On page entry: load cached snapshot without triggering live APIs; refresh live APIs automatically every 2 minutes (120,000 ms)
  const [egressRadar, setEgressRadar] = useState(null);
  const [loadingEgressRadar, setLoadingEgressRadar] = useState(false);
  const [harvestRegion, setHarvestRegion] = useState('');
  const [alwaysFreeAudit, setAlwaysFreeAudit] = useState(null);
  const [loadingAlwaysFree, setLoadingAlwaysFree] = useState(false);
  const [alwaysFreeFilter, setAlwaysFreeFilter] = useState('ALL');
  const [enforcerBusy, setEnforcerBusy] = useState(null);

  const scanEgressAndLeftovers = useCallback(async () => {
    if (!projectId) return;
    setLoadingEgressRadar(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(
          projectId
        )}/finops/egress-leftover-radar`
      );
      if (res.data?.ok) {
        setEgressRadar(res.data);
        if (res.data.preferredRegion) {
          setHarvestRegion((prev) => prev || res.data.preferredRegion);
        }
      }
    } catch {
      // ignore if offline
    } finally {
      setLoadingEgressRadar(false);
    }
  }, [projectId]);

  const scanAlwaysFreeAuditor = useCallback(async () => {
    if (!projectId) return;
    setLoadingAlwaysFree(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(
          projectId
        )}/finops/always-free-auditor`
      );
      if (res.data?.ok) {
        setAlwaysFreeAudit(res.data);
      }
    } catch {
      // ignore if offline
    } finally {
      setLoadingAlwaysFree(false);
    }
  }, [projectId]);

  const handleRunAlwaysFreeEnforcer = async (enforcerAction) => {
    if (!projectId) return;
    setEnforcerBusy(enforcerAction);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/finops/always-free-enforcer`,
        { enforcerAction }
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message || `Executed Always Free Enforcer: ${enforcerAction}`
        );
      }
      await scanAlwaysFreeAuditor();
    } catch (err) {
      if (onShowToast) {
        onShowToast(
          err.response?.data?.error ||
            `Failed to execute Always Free Enforcer (${enforcerAction})`
        );
      }
    } finally {
      setEnforcerBusy(null);
    }
  };

  useEffect(() => {
    loadBillingGuardian(false);
    scanEgressAndLeftovers();
    scanAlwaysFreeAuditor();
    const intervalId = setInterval(() => {
      loadBillingGuardian(true);
    }, 2 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [loadBillingGuardian, scanEgressAndLeftovers, scanAlwaysFreeAuditor]);

  const handleSyncConsoleCredits = async (overrideRawText) => {
    const rawToParse =
      typeof overrideRawText === 'string' ? overrideRawText : consolePasteText;
    if (!rawToParse.trim()) {
      setSyncError(
        'Upload your Credits CSV file or paste the CSV / Credits table text from console.cloud.google.com/billing first.'
      );
      return;
    }
    setSyncingConsoleCredits(true);
    setSyncError('');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/billing-guardian/sync-console-credits`,
        { rawText: rawToParse }
      );
      if (res.data?.ok && Array.isArray(res.data.consoleCredits)) {
        setSyncedConsoleCredits(res.data.consoleCredits);
        setLiveBillingInsights((prev) =>
          prev
            ? { ...prev, consoleCredits: res.data.consoleCredits }
            : { consoleCredits: res.data.consoleCredits }
        );
        setConsolePasteText('');
        setShowConsoleSyncDrawer(false);
        if (onShowToast) {
          onShowToast(
            `Parsed & synced ${res.data.consoleCredits.length} credit grants to Temp JSON and IndexedDB.`
          );
        }
      }
    } catch (err) {
      setSyncError(
        err?.response?.data?.error ||
          err.message ||
          'Failed to parse Console Credits CSV / table.'
      );
    } finally {
      setSyncingConsoleCredits(false);
    }
  };

  const [autoGrabbingCsv, setAutoGrabbingCsv] = useState(false);

  const handleAutoGrabCreditsCsv = async () => {
    setAutoGrabbingCsv(true);
    setSyncError('');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/billing-guardian/auto-download-credits-csv`,
        { billingAccountId: billingInfo.billingAccountId }
      );
      if (res.data?.ok && Array.isArray(res.data.consoleCredits)) {
        setSyncedConsoleCredits(res.data.consoleCredits);
        setLiveBillingInsights((prev) =>
          prev
            ? { ...prev, consoleCredits: res.data.consoleCredits }
            : { consoleCredits: res.data.consoleCredits }
        );
        setConsolePasteText('');
        setShowConsoleSyncDrawer(false);
        if (onShowToast) {
          onShowToast(
            `Auto-ingested ${res.data.consoleCredits.length} credit grants from ${res.data.fileName}!`
          );
        }
      }
    } catch (err) {
      setSyncError(
        err?.response?.data?.error ||
          err.message ||
          'Could not auto-detect a downloaded Credits CSV file.'
      );
      setShowConsoleSyncDrawer(true);
    } finally {
      setAutoGrabbingCsv(false);
    }
  };

  const handleUploadCreditsCsvFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = String(ev.target?.result || '');
      if (text.trim()) {
        setConsolePasteText(text);
        handleSyncConsoleCredits(text);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearConsoleCredits = async () => {
    try {
      await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/billing-guardian/reset-console-credits`
      );
    } catch {
      // ignore network error and still reset local + IndexedDB state immediately
    }
    setSyncedConsoleCredits([]);
    setLiveBillingInsights(null);
    setGdeEnvelope({
      name: '',
      initialGrantUsd: '',
      startDate: '',
      expirationDate: '',
      alertDaysThreshold: '',
    });
    localStorage.removeItem('cloudpulse_gde_bonus_envelope_v2');
    try {
      const db = await openBillingIndexedDb();
      if (db) {
        const tx = db.transaction(
          [
            'consoleCreditGrants',
            'costCreditLedger',
            'tempJsonSnapshots',
            'aggregatedDecisions',
          ],
          'readwrite'
        );
        tx.objectStore('consoleCreditGrants').clear();
        tx.objectStore('costCreditLedger').clear();
        tx.objectStore('tempJsonSnapshots').clear();
        tx.objectStore('aggregatedDecisions').clear();
      }
    } catch {
      // ignore
    }
    setConsolePasteText('');
    setSyncError('');
    setShowConsoleSyncDrawer(true);
    if (onShowToast) {
      onShowToast(
        'Reset all Remaining Bonus credits. Upload your Credits CSV file to load your balance.'
      );
    }
  };

  const aggregated = useMemo(() => {
    return programmaticallyAggregateBillingData({
      projectId,
      billingInfo,
      billingAccounts,
      liveBillingInsights,
      syncedConsoleCredits,
      envelopeOverride: gdeEnvelope,
      dailyBurnUsd,
    });
  }, [
    projectId,
    billingInfo,
    billingAccounts,
    liveBillingInsights,
    syncedConsoleCredits,
    gdeEnvelope,
    dailyBurnUsd,
  ]);

  const { enrichedGrants, liveCostMetrics } = aggregated;
  const summary = aggregated;

  useEffect(() => {
    if (!liveBillingInsights && syncedConsoleCredits.length === 0) return;
    syncAndAggregateBillingIndexedDb({
      projectId,
      billingInfo,
      billingAccounts,
      liveBillingInsights,
      syncedConsoleCredits,
      envelopeOverride: gdeEnvelope,
      dailyBurnUsd,
    }).then(() => {
      const openCount = (liveBillingInsights?.costCreditRows || []).length;
      const crossCount = (liveBillingInsights?.crossAccountRows || []).length;
      const monthCount = (liveBillingInsights?.monthlyTrendRows || []).length;
      const budgetsCount = (liveBillingInsights?.billingBudgets || []).length;
      setIdbStats({
        synced: true,
        accountsCount: billingAccounts.length,
        budgetsCount,
        grantsCount: enrichedGrants.length,
        ledgerRowsCount: openCount + crossCount + monthCount,
        tempJsonPath: liveBillingInsights?.tempJsonPath || '',
      });
    });
  }, [
    projectId,
    billingInfo,
    billingAccounts,
    liveBillingInsights,
    syncedConsoleCredits,
    enrichedGrants.length,
    gdeEnvelope,
    dailyBurnUsd,
  ]);

  useEffect(() => {
    if (onGrantsSummaryChange) {
      onGrantsSummaryChange(summary);
    }
  }, [summary, onGrantsSummaryChange]);

  const filteredGrants = useMemo(() => {
    return enrichedGrants.filter((g) => {
      const m = g.metrics;
      if (statusFilter === 'EXPIRING_SOON') {
        if (
          m.isExpired ||
          m.daysLeft === null ||
          m.daysLeft > m.alertThreshold ||
          m.remaining <= 0
        ) {
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
    const cleanAcct = (
      billingInfo.billingAccountId || 'XXXXXX_XXXXXX_XXXXXX'
    ).replace(/-/g, '_');
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

  const consoleCreditsUrl = billingInfo.billingAccountId
    ? `https://console.cloud.google.com/billing/${billingInfo.billingAccountId}/credits`
    : 'https://console.cloud.google.com/billing';

  const consoleDomAutoClickSnippet = `(function(){const b=document.querySelector('button[id$="billingtest-download-credits-csv"]')||document.querySelector('button[cfctooltip="Download CSV"]')||Array.from(document.querySelectorAll('cfc-exposed-filter button,button.cm-button')).find(e=>/Download CSV/i.test(e.textContent||''));if(b){b.click();}else{alert('Open your GCP Billing Credits page first');}})();`;

  return (
    <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-5">
      {/* Header Row: Live Billing Account Identity + Sync Actions */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <h2 className="text-sm sm:text-base font-extrabold text-zinc-950 dark:text-zinc-50">
              Remaining Bonus & Cloud Billing Guardian
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
            {idbStats.synced && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                INDEXEDDB SYNCED ({idbStats.accountsCount} accts ·{' '}
                {idbStats.budgetsCount} budgets · {idbStats.grantsCount} grants ·{' '}
                {idbStats.ledgerRowsCount} rows)
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500">
            <strong>Remaining Bonus</strong> balances can be <strong>auto-grabbed in 1 click</strong> (`Auto-Grab CSV` triggers <code className="font-mono">button[id$=&quot;billingtest-download-credits-csv&quot;]</code> via CDP or ingests the latest Credits <code className="font-mono">.csv</code> from <code className="font-mono">~/Downloads</code> / <code className="font-mono">~/Desktop</code>) or uploaded manually — while <strong>expiration dates & countdowns are calculated automatically</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleAutoGrabCreditsCsv}
            disabled={autoGrabbingCsv}
            className="h-9 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 text-xs font-mono font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-all"
            title='Clicks button[id$="billingtest-download-credits-csv"] via CDP (if enabled) and auto-ingests the latest Credits CSV from ~/Downloads or ~/Desktop'
          >
            <RefreshCw
              className={`w-3.5 h-3.5 shrink-0 ${
                autoGrabbingCsv ? 'animate-spin' : ''
              }`}
            />
            <span>
              {autoGrabbingCsv
                ? 'Auto-Grabbing CSV...'
                : 'Auto-Grab Downloaded CSV'}
            </span>
          </button>

          <label className="h-9 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-all">
            <Database className="w-3.5 h-3.5 shrink-0" />
            <span>Upload Remaining Bonus CSV</span>
            <input
              type="file"
              accept=".csv,text/csv,text/plain"
              onChange={handleUploadCreditsCsvFile}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={() => setShowConsoleSyncDrawer((p) => !p)}
            className="h-9 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white border border-blue-500 text-xs font-mono font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-all"
          >
            <CreditCard className="w-3.5 h-3.5 shrink-0" />
            <span>
              {syncedConsoleCredits.length > 0
                ? `Paste / Update Bonus CSV (${syncedConsoleCredits.length} Rows)`
                : 'Paste Remaining Bonus CSV'}
            </span>
          </button>

          {(syncedConsoleCredits.length > 0 || summary.hasImportedCredits) && (
            <button
              type="button"
              onClick={handleClearConsoleCredits}
              className="h-9 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 text-xs font-mono font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-all"
              title="Clear all uploaded Remaining Bonus rows and upload a new CSV"
            >
              <XCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Reset Bonus CSV</span>
            </button>
          )}

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
            title="Live APIs auto-refresh every 2 minutes in the background without blocking page entry"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 shrink-0 ${loading ? 'animate-spin' : ''}`}
            />
            <span>Refresh Live APIs (Auto 2m)</span>
          </button>
        </div>
      </div>

      {/* Remaining Bonus CSV Sync Drawer: Upload or Paste the CSV exported from `console.cloud.google.com/billing/<id>/credits` */}
      {(showConsoleSyncDrawer || !summary.hasImportedCredits) && (
        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/30 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-0.5">
              <div className="text-xs font-mono font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Automated & Manual Remaining Bonus CSV Sync (`button[id$=&quot;billingtest-download-credits-csv&quot;]`)
                </span>
              </div>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                Click <strong>Auto-Grab Downloaded CSV</strong> to automatically trigger <code className="font-mono">button[id$=&quot;billingtest-download-credits-csv&quot;]</code> (<code className="font-mono">cfctooltip=&quot;Download CSV&quot;</code>) via Chrome CDP or automatically ingest the latest Google Cloud Console Credits <code className="font-mono">.csv</code> file from <code className="font-mono">~/Downloads</code> or <code className="font-mono">~/Desktop</code>. You can also copy the 1-line DOM auto-clicker below or upload the file manually:
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <a
                href={consoleCreditsUrl}
                target="_blank"
                rel="noreferrer"
                className="h-8 px-3 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-xs font-mono font-bold inline-flex items-center justify-center whitespace-nowrap shrink-0"
              >
                1. Open {billingInfo.billingAccountId || 'Billing'} Credits ↗
              </a>
              <button
                type="button"
                onClick={handleAutoGrabCreditsCsv}
                disabled={autoGrabbingCsv}
                className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 shrink-0 ${
                    autoGrabbingCsv ? 'animate-spin' : ''
                  }`}
                />
                <span>
                  {autoGrabbingCsv
                    ? 'Auto-Grabbing...'
                    : '2a. Auto-Grab Latest CSV'}
                </span>
              </button>
              <button
                type="button"
                onClick={() =>
                  handleCopyText(
                    'dom-auto-click-csv',
                    consoleDomAutoClickSnippet,
                    'Console Download CSV Auto-Clicker JS'
                  )
                }
                className="h-8 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-mono font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                title="Copies JS snippet targeting button[id$='billingtest-download-credits-csv']"
              >
                {copiedId === 'dom-auto-click-csv' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Copy className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>2b. Copy Console Auto-Click JS</span>
              </button>
              <label className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer">
                <Database className="w-3.5 h-3.5 shrink-0" />
                <span>2c. Upload .CSV</span>
                <input
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  onChange={handleUploadCreditsCsvFile}
                  className="hidden"
                />
              </label>
              {(syncedConsoleCredits.length > 0 || summary.hasImportedCredits) && (
                <button
                  type="button"
                  onClick={handleClearConsoleCredits}
                  className="h-8 px-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-mono font-bold cursor-pointer"
                >
                  Reset / Clear Bonus ({enrichedGrants.length})
                </button>
              )}
            </div>
          </div>

          <textarea
            rows={5}
            value={consolePasteText}
            onChange={(e) => setConsolePasteText(e.target.value)}
            placeholder={'2b. Or paste your Google Cloud Billing Credits CSV here:\nCredit name,Status,Currency,Percent remaining,Remaining value,Original value,Start date,End date,Credit application type\nPromotional Credit Grant,Available,$,100,500.00,500.00,2026-01-01,2026-12-31,Net pricing,'}
            className="w-full p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
          />

          {syncError && (
            <div className="text-xs font-mono text-red-600 dark:text-red-400">
              {syncError}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-mono text-zinc-500">
              Saves exact CSV Remaining Bonus values (no automatic balance modification) + auto-calculates expiration countdowns.
            </span>
            <button
              type="button"
              onClick={() => handleSyncConsoleCredits()}
              disabled={syncingConsoleCredits}
              className="h-8 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>
                {syncingConsoleCredits
                  ? 'Parsing & Saving Bonus CSV...'
                  : '3. Save Remaining Bonus CSV'}
              </span>
            </button>
          </div>
        </div>
      )}

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

      {/* 4 Dynamically Calculated KPI Cards: Remaining Bonus, Nearest Expiry Countdown, Monthly Benefits / Budgets, Required Burn */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/30 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">
            <span>REMAINING BONUS (FROM CSV)</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          {summary.totalInitialUsd > 0 ? (
            <>
              <div className="text-xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                {fmtCreditUsd(summary.totalRemainingUsd)}
                <span className="text-xs font-normal text-zinc-500 ml-1.5">
                  / {fmtCreditUsd(summary.totalInitialUsd)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 pt-0.5 flex-wrap">
                <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
                  {summary.activeCount} active grant(s)
                  {summary.monthlyBenefitCount > 0
                    ? ` · incl. ${summary.monthlyBenefitCount}× monthly (${fmtCreditUsd(
                        summary.monthlyBenefitRemainingUsd
                      )})`
                    : ''}
                </span>
                <div className="flex items-center gap-1.5">
                  <label className="px-1.5 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold cursor-pointer">
                    Upload CSV
                    <input
                      type="file"
                      accept=".csv,text/csv,text/plain"
                      onChange={handleUploadCreditsCsvFile}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleClearConsoleCredits}
                    className="px-1.5 py-0.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 text-[10px] font-mono font-bold cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>
              <div className="text-[10px] font-mono text-amber-700 dark:text-amber-400 pt-0.5">
                {hideCreditsInGde
                  ? 'GDE Mode Active: Remaining credit balances are masked on screen'
                  : 'Upload fresh Credits CSV frequently to update balance · Expiry dates auto-calculated'}
              </div>
            </>
          ) : (
            <>
              <div className="text-sm font-mono font-bold text-amber-600 dark:text-amber-400">
                Upload Remaining Bonus CSV above
              </div>
              <div className="text-[11px] font-mono text-zinc-500">
                Upload your GCP Billing Credits CSV frequently to track Remaining Bonus
              </div>
            </>
          )}
        </div>

        <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/30 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-amber-700 dark:text-amber-400 font-bold">
            <span>
              {summary.nearestExpiryDays !== null
                ? `EXPIRING IN ${summary.nearestExpiryDays} DAYS`
                : 'NEAREST GRANT EXPIRATION'}
            </span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          {summary.nearestExpiryGrant ? (
            <>
              <div className="text-xl font-mono font-extrabold text-amber-600 dark:text-amber-400">
                {fmtCreditUsd(summary.nearestExpiryGrant.metrics.remaining)}
                <span className="text-xs font-normal text-zinc-500 ml-1.5">
                  ({summary.nearestExpiryDays}d left)
                </span>
              </div>
              <div className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 truncate">
                {summary.nearestExpiryGrant.name} · Ends{' '}
                {formatHumanDate(summary.nearestExpiryGrant.expirationDate)}
              </div>
            </>
          ) : (
            <>
              <div className="text-sm font-mono font-bold text-amber-600 dark:text-amber-400">
                Awaiting Console Credits Sync
              </div>
              <div className="text-[11px] font-mono text-zinc-500">
                Calculates exact days left & expiry warning
              </div>
            </>
          )}
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span>MONTHLY BENEFITS & LIVE BUDGETS</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-xl font-mono font-extrabold text-zinc-900 dark:text-zinc-100">
            {summary.monthlyBenefitCount > 0 ? (
              <>
                {summary.monthlyBenefitCount} ×{' '}
                {fmtCreditUsd(
                  summary.monthlyBenefitRemainingUsd /
                    summary.monthlyBenefitCount
                )}
                <span className="text-xs font-normal text-zinc-500 ml-1.5">
                  ({fmtCreditUsd(summary.monthlyBenefitRemainingUsd)} USD)
                </span>
              </>
            ) : (
              <>
                {liveCostMetrics.billingBudgets.length} Budget
                {liveCostMetrics.billingBudgets.length === 1 ? '' : 's'}
                <span className="text-xs font-normal text-zinc-500 ml-1.5">
                  (`billingbudgets.googleapis.com`)
                </span>
              </>
            )}
          </div>
          <div className="text-[11px] font-mono text-zinc-500 truncate">
            {summary.expiredCount > 0
              ? `${summary.expiredCount} expired grant(s) (${fmtCreditUsd(
                  summary.expiredUnusedUsd
                )} unused)`
              : `${liveCostMetrics.billingBudgets.length} live budget rule(s) active`}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span>REQUIRED BURN BEFORE EXPIRY</span>
            <TrendingDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-xl font-mono font-extrabold text-zinc-900 dark:text-zinc-100">
            {summary.nearestExpiryGrant
              ? fmtCreditUsd(
                  summary.nearestExpiryGrant.metrics.requiredDailyBurnToUseAll
                )
              : '$0.00'}
            /day
            <span className="text-xs font-normal text-zinc-500 ml-1.5">
              (now ${dailyBurnUsd.toFixed(2)}/d)
            </span>
          </div>
          <div className="text-[11px] font-mono text-zinc-500">
            Target daily spend to use expiring grant before end date
          </div>
        </div>
      </div>

      {/* Live Cloud Billing Budgets API Section (`billingbudgets.googleapis.com/v1`) */}
      {liveCostMetrics.billingBudgets.length > 0 && (
        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200">
              Live Cloud Billing Budgets (`billingbudgets.googleapis.com/v1/{billingInfo.billingAccountId}/budgets`)
            </span>
            <span className="text-[11px] font-mono text-zinc-500">
              {liveCostMetrics.billingBudgets.length} configured budget alert(s)
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {liveCostMetrics.billingBudgets.map((b) => (
              <div
                key={b.name}
                className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 text-xs font-mono"
              >
                <div className="min-w-0">
                  <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {b.displayName} — {fmtCreditUsd(b.amountUsd)} {b.currencyCode}/
                    {b.calendarPeriod}
                  </div>
                  <div className="text-[10px] text-zinc-500 truncate">
                    {b.creditTypesTreatment} · Thresholds:{' '}
                    {b.thresholdPercents.map((p) => `${p}%`).join(', ')}
                  </div>
                </div>
                {b.spendCapConfigured && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                    SPEND CAP
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Urgent Warning Banner + "Use-It-Or-Lose-It" Expiring Credit Harvester & Pre-Expiry Auto-Shutdown Guardrail */}
      {summary.nearestExpiryGrant &&
        summary.nearestExpiryGrant.metrics.daysLeft !== null &&
        summary.nearestExpiryGrant.metrics.daysLeft <=
          summary.nearestExpiryGrant.metrics.alertThreshold && (
          <div className="rounded-xl p-4 border bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200 space-y-3.5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
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
                    {fmtCreditUsd(summary.nearestExpiryGrant.metrics.remaining)}
                  </span>{' '}
                  out of{' '}
                  <span className="font-mono font-bold">
                    {fmtCreditUsd(summary.nearestExpiryGrant.metrics.initial)}
                  </span>{' '}
                  ({hideCreditsInGde ? '••' : summary.nearestExpiryGrant.metrics.displayPct}% remaining)
                  inside this credit grant, and it expires on{' '}
                  <span className="font-mono font-bold underline">
                    {formatHumanDate(
                      summary.nearestExpiryGrant.expirationDate
                    )}
                  </span>
                  {summary.monthlyBenefitCount > 0 && (
                    <>
                      {' '}
                      (plus{' '}
                      <span className="font-mono font-bold">
                        {summary.monthlyBenefitCount} ×{' '}
                        {fmtCreditUsd(
                          summary.monthlyBenefitRemainingUsd /
                            summary.monthlyBenefitCount
                        )}{' '}
                        USD = {fmtCreditUsd(summary.monthlyBenefitRemainingUsd)}{' '}
                        USD
                      </span>{' '}
                      in active monthly benefits)
                    </>
                  )}
                  . At your current project burn rate (
                  <span className="font-mono font-bold">
                    ${dailyBurnUsd.toFixed(2)}/day
                  </span>
                  ),{' '}
                  <span className="font-mono font-bold underline">
                    {fmtCreditUsd(
                      summary.nearestExpiryGrant.metrics.strandedMoneyUsd
                    )}{' '}
                    is projected to expire unused
                  </span>
                  .
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    const userscript = `// ==UserScript==
// @name         CloudPulse 2026 — Auto-Sync GCP Billing Credits CSV
// @namespace    https://console.cloud.google.com/
// @version      1.0
// @description  Automatically clicks Download CSV (button[id$="billingtest-download-credits-csv"]) or scrapes Console Credits and syncs to CloudPulse
// @match        https://console.cloud.google.com/billing/*/credits*
// @grant        none
// ==/UserScript==
(function() {
  'use strict';
  setTimeout(() => {
    const btn = document.querySelector('button[id$="billingtest-download-credits-csv"]') || document.querySelector('button[cfctooltip="Download CSV"]');
    if (btn && !window.__cloudpulseCsvDownloaded) {
      window.__cloudpulseCsvDownloaded = true;
      btn.click();
    }
  }, 3500);
})();`;
                    const blob = new Blob([userscript], {
                      type: 'text/javascript;charset=utf-8',
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'cloudpulse-billing-credits-autosync.user.js';
                    a.click();
                    URL.revokeObjectURL(url);
                    if (onShowToast) {
                      onShowToast(
                        'Downloaded cloudpulse-billing-credits-autosync.user.js (Tampermonkey / Violentmonkey Userscript).'
                      );
                    }
                  }}
                  className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-all"
                  title="Downloads a Tampermonkey/Violentmonkey userscript that automatically triggers button[id$='billingtest-download-credits-csv'] whenever you open GCP Billing Credits"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Download Auto-CSV Userscript (.user.js)</span>
                </button>
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

            {/* "Use-It-Or-Lose-It" Expiring Credit Harvester, Shutdown Time Matrix & Hidden Egress Cost Advisory */}
            {summary.nearestExpiryGrant.metrics.strandedMoneyUsd > 5 && (
              <div className="pt-3 border-t border-amber-500/25 space-y-3">
                {(() => {
                  const stranded =
                    summary.nearestExpiryGrant.metrics.strandedMoneyUsd;
                  const days = Math.max(
                    1,
                    summary.nearestExpiryGrant.metrics.daysLeft || 1
                  );
                  const dailyHarvestBudget = stranded / days;
                  const expIso =
                    summary.nearestExpiryGrant.expirationDate || '2026-12-31';

                  // Dynamic capacity math based on actual stranded USD
                  const spotVmHours = Math.floor(stranded / 0.041); // c3-standard-4 Spot ~$0.041/hr
                  const l4GpuVmHours = Math.floor(stranded / 0.28); // g2-standard-4 Spot L4 GPU ~$0.28/hr
                  const gcsStandardTbMonths = Math.max(
                    1,
                    Math.floor(stranded / 20.48)
                  ); // $0.020/GB-mo = $20.48/TB-mo
                  const gkeAutopilotPodHours = Math.floor(stranded / 0.052); // 1 vCPU + 2GB Autopilot pod ~$0.052/hr
                  const l4RunBatchHours = Math.floor(stranded / 0.72); // Cloud Run L4 GPU ~$0.72/hr
                  const bqTibScans = Math.floor(stranded / 6.25); // $6.25/TiB
                  const cloudSqlHours = Math.floor(stranded / 0.19); // db-custom-2-7680 ~$0.19/hr

                  const targetHarvestRegion =
                    harvestRegion ||
                    egressRadar?.preferredRegion ||
                    egressRadar?.activeComputeRegions?.[0] ||
                    egressRadar?.bucketRegions?.[0] ||
                    'europe-west1';
                  const targetHarvestZone = `${targetHarvestRegion}-b`;

                  const vmCreateCmd = `gcloud compute instances create bonus-harvester-vm --project=${
                    projectId || 'my-gcp-project'
                  } --zone=${targetHarvestZone} --machine-type=c3-standard-4 --provisioning-model=SPOT --instance-termination-action=STOP --max-run-duration=${days}d`;
                  const gcsCreateCmd = `gcloud storage buckets create gs://${
                    projectId || 'my-gcp'
                  }-bonus-harvester-lake --location=${targetHarvestRegion} --default-storage-class=STANDARD --uniform-bucket-level-access --public-access-prevention`;
                  const gkeCreateCmd = `gcloud container clusters create-auto bonus-harvester-gke --region=${targetHarvestRegion} --project=${
                    projectId || 'my-gcp-project'
                  }`;
                  const l4BatchCmd = `gcloud run jobs create bonus-credit-l4-harvester --image=us-docker.pkg.dev/cloudrun/container/job:latest --region=${targetHarvestRegion} --cpu=4 --memory=16Gi --gpu=1 --gpu-type=nvidia-l4 --no-gpu-zonal-redundancy --max-retries=0 --project=${
                    projectId || 'my-gcp-project'
                  }`;
                  const bqMaterializeSql = `-- Harvest expiring credits before ${expIso}: Pre-compute & cluster high-value Gold BI tables (~${bqTibScans} TiB scan budget)\nCREATE OR REPLACE TABLE \`${
                    projectId || 'my-gcp-project'
                  }.analytics_gold.precomputed_feature_store\`\nPARTITION BY DATE(event_timestamp)\nCLUSTER BY entity_id AS\nSELECT CURRENT_TIMESTAMP() AS event_timestamp, 'entity-1' AS entity_id;`;
                  const safeCutoffCmd = `gcloud scheduler jobs create http credit-expiry-cutoff-${
                    projectId || 'gcp'
                  } --location=${targetHarvestRegion} --schedule="0 12 * * *" --uri="https://cloudbilling.googleapis.com/v1/projects/${
                    projectId || 'my-gcp-project'
                  }/billingInfo" --http-method=PUT --description="Auto-stop warm VM/GKE/SQL spend 12h before ${expIso} credit expiry"`;

                  const harvestBlueprints = [
                    {
                      id: 'COMPUTE_VM',
                      badge: 'Compute Engine VM / Spot GPU',
                      title: '1. Compute Engine Spot VM or L4 GPU Workstation',
                      capacityLabel: `~${spotVmHours.toLocaleString()} Spot VM hrs (or ~${l4GpuVmHours.toLocaleString()} L4 GPU hrs)`,
                      shutdownTime: 'Shutdown / Stop Time: ~25–45 seconds',
                      shutdownNote:
                        'Notice: Stopping a VM halts vCPU/GPU billing in ~30s, but attached Persistent Disk (`pd-balanced` / `pd-ssd`) and static External IP STILL bill until the VM & disk are deleted (`--max-run-duration` auto-terminates).',
                      hiddenCostWarning:
                        'Hidden Cost Trap: Internet Egress ($0.085–$0.12/GB), Cross-Zone/Region traffic ($0.01–$0.02/GB), and unattached Boot Disks after `STOP`.',
                      desc: `Launch a high-IPC C3/C4 Spot VM or g2-standard-4 L4 GPU VM in ${targetHarvestZone} for CI builds, model fine-tuning, or load testing (~$${dailyHarvestBudget.toFixed(
                        2
                      )}/day harvest budget).`,
                      cliId: 'harvester-vm',
                      cliCmd: vmCreateCmd,
                      cliLabel: 'Spot VM CLI with Auto-Stop',
                      provisionType: 'COMPUTE_VM',
                      provisionBtnLabel: '+ Provision VM',
                    },
                    {
                      id: 'GCS_BUCKET',
                      badge: 'Cloud Storage (GCS)',
                      title: '2. Cloud Storage Staging Lake & Snapshots',
                      capacityLabel: `~${gcsStandardTbMonths.toLocaleString()} TB-Months Standard Storage`,
                      shutdownTime: 'Empty & Delete Time: ~5s (<1k objects) to 1–24h (Lifecycle)',
                      shutdownNote:
                        'Notice: Deleting a bucket requires deleting all objects & noncurrent versions first. Set an Object Lifecycle `Delete` rule before credit expiry for zero-touch cleanup.',
                      hiddenCostWarning:
                        'Hidden Cost Trap: Internet Download Egress ($0.12/GB), Cross-Region Replication/Reads ($0.02/GB), Class A/B Operations, and Nearline/Coldline early-deletion penalties (30–90 day minimum storage duration!).',
                      desc: `Stage large ML datasets, container artifacts, or database backups in a single-region Standard bucket (${targetHarvestRegion}; avoid Nearline/Archive if deleting in <30 days).`,
                      cliId: 'harvester-gcs',
                      cliCmd: gcsCreateCmd,
                      cliLabel: 'GCS Bucket CLI',
                      provisionType: 'GCS_BUCKET',
                      provisionBtnLabel: '+ Provision Bucket',
                    },
                    {
                      id: 'GKE_CLUSTER',
                      badge: 'Kubernetes (GKE)',
                      title: '3. GKE Autopilot or GPU Burst Cluster',
                      capacityLabel: `~${gkeAutopilotPodHours.toLocaleString()} Pod-Hours (1 vCPU · 2 GB)`,
                      shutdownTime: 'Cluster Drain & Delete Time: ~5–12 minutes',
                      shutdownNote:
                        'Notice: GKE cannot simply be "paused"—even with 0 nodes, the GKE Control Plane bills $0.10/hr ($73/mo) after the first free zonal/Autopilot cluster, and LoadBalancers + PersistentVolumeClaims keep billing until the cluster is deleted!',
                      hiddenCostWarning:
                        'Hidden Cost Trap: Cloud NAT Gateway ($0.045/GB + hourly per-VM fee), Multi-Zone Pod-to-Pod Egress ($0.01/GB), and orphaned `LoadBalancer` forwarding rules ($18/mo).',
                      desc: `Spin up a GKE Autopilot cluster in ${targetHarvestRegion} for multi-service Kubernetes staging, service-mesh chaos testing, or distributed Ray/vLLM workloads.`,
                      cliId: 'harvester-gke',
                      cliCmd: gkeCreateCmd,
                      cliLabel: 'GKE Autopilot CLI',
                      provisionType: 'GKE_CLUSTER',
                      provisionBtnLabel: '+ Provision GKE',
                    },
                    {
                      id: 'CLOUD_RUN',
                      badge: 'Cloud Run Serverless L4 GPU',
                      title: '4. Cloud Run Serverless L4 GPU Jobs & Microservices',
                      capacityLabel: `~${l4RunBatchHours.toLocaleString()} L4 GPU-Hours`,
                      shutdownTime: 'Scale-to-Zero / Delete Time: Instant (~0–5 seconds)',
                      shutdownNote:
                        'Notice: Setting `min-instances=0` drops compute & GPU billing to $0.00 the exact second a request or batch job finishes.',
                      hiddenCostWarning:
                        'Hidden Cost Trap: Keeping `min-instances >= 1` warm 24/7, Artifact Registry image storage over 0.5 GB, and VPC Serverless Connector / outbound Internet Egress ($0.12/GB).',
                      desc: `Run batch embeddings, LLM evaluations, or high-concurrency HTTP services in ${targetHarvestRegion} with --no-gpu-zonal-redundancy ($0.72/hr) and $0 idle cost.`,
                      cliId: 'harvester-l4',
                      cliCmd: l4BatchCmd,
                      cliLabel: 'Cloud Run L4 Job CLI',
                      provisionType: 'CLOUD_RUN',
                      provisionBtnLabel: '+ Provision Cloud Run',
                    },
                    {
                      id: 'CLOUD_SQL',
                      badge: 'Cloud SQL / AlloyDB',
                      title: '5. Cloud SQL (Postgres 16 / MySQL 8.4) Read-Replica Lab',
                      capacityLabel: `~${cloudSqlHours.toLocaleString()} DB Instance-Hours`,
                      shutdownTime: 'Stop / Delete Time: ~2–6 minutes',
                      shutdownNote:
                        'Notice: Stopping a Cloud SQL instance halts vCPU/RAM charges in ~3 mins, but SSD storage ($0.17/GB-mo), automated backups, and Public IPv4 idle reservation ($0.01/hr while stopped!) continue billing until deleted.',
                      hiddenCostWarning:
                        'Hidden Cost Trap: Idle Public IPv4 charge while instance is STOPPED, HA Regional standby (2× cost), Point-in-Time Recovery (PITR) transaction logs, and cross-region replica egress.',
                      desc: `Benchmark Postgres 16 pgvector indexes, test schema migrations, or run load tests against a disposable Cloud SQL instance in ${targetHarvestRegion} before credit expiry.`,
                      cliId: 'harvester-sql',
                      cliCmd: `gcloud sql instances create bonus-harvester-pg16 --database-version=POSTGRES_16 --cpu=2 --memory=7680MB --region=${targetHarvestRegion} --deletion-protection=false --project=${
                        projectId || 'my-gcp-project'
                      }`,
                      cliLabel: 'Cloud SQL CLI',
                      provisionType: 'CLOUD_SQL',
                      provisionBtnLabel: '+ Provision Cloud SQL',
                    },
                    {
                      id: 'BIGQUERY_DATASET',
                      badge: 'BigQuery Lakehouse & BQML',
                      title: '6. BigQuery Gold Table Pre-Compute & BQML Training',
                      capacityLabel: `~${bqTibScans.toLocaleString()} TiB On-Demand Scans`,
                      shutdownTime: 'Query Cancel / Drop Time: Instant (<2 seconds)',
                      shutdownNote:
                        'Notice: Queries bill only while running, but materialized tables bill Active Storage ($0.02/GB-mo after 10 GB free). Set a Dataset Default Table Expiration so tables auto-drop before credit expiry.',
                      hiddenCostWarning:
                        'Hidden Cost Trap: Missing `--maximum_bytes_billed` guard on `SELECT *` queries, BigQuery BI Engine reservation hours, and cross-region dataset copy egress.',
                      desc: 'Materialize partitioned & clustered Gold BI tables, backfills, or BigQuery ML models now while covered by your expiring grant ($6.25/TiB).',
                      cliId: 'harvester-bq',
                      cliCmd: bqMaterializeSql,
                      cliLabel: 'BigQuery Materialize SQL',
                      provisionType: 'BIGQUERY_DATASET',
                      provisionBtnLabel: '+ Provision BQ Dataset',
                      isSql: true,
                    },
                  ];

                  const availableRegionOptions = Array.from(
                    new Set([
                      ...(egressRadar?.activeComputeRegions || []),
                      ...(egressRadar?.bucketRegions || []),
                      targetHarvestRegion,
                      'europe-west1',
                      'europe-west4',
                      'europe-west9',
                      'us-east1',
                      'us-central1',
                      'us-west1',
                      'asia-east1',
                      'asia-northeast1',
                    ])
                  ).filter(Boolean);

                  return (
                    <>
                      {/* FinOps Hidden Cost & Egress Traffic Advisory Banner */}
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/35 text-zinc-900 dark:text-zinc-100 space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs font-mono font-extrabold text-red-700 dark:text-red-300">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>
                              FINOPS HIDDEN COST & NETWORK EGRESS WARNING (READ BEFORE HARVESTING CREDITS)
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <label className="inline-flex items-center gap-1.5 text-[10.5px] font-mono font-bold text-zinc-800 dark:text-zinc-200">
                              <span>Target Co-Located Region:</span>
                              <select
                                value={targetHarvestRegion}
                                onChange={(e) =>
                                  setHarvestRegion(e.target.value)
                                }
                                className="h-6 px-2 rounded bg-white dark:bg-zinc-900 border border-red-500/40 text-[10.5px] font-mono text-zinc-900 dark:text-zinc-100 cursor-pointer"
                              >
                                {availableRegionOptions.map((regOpt) => (
                                  <option key={regOpt} value={regOpt}>
                                    {regOpt}
                                    {regOpt === egressRadar?.preferredRegion
                                      ? ' (Detected Project Region)'
                                      : ''}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-800 dark:text-red-200 text-[10px] font-mono font-bold">
                              Shut Off All Resources ≥12h Before {expIso}
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
                          While Compute, Storage, and GKE base rates are covered by your{' '}
                          <strong className="font-mono">
                            ${stranded.toFixed(2)}
                          </strong>{' '}
                          expiring bonus, watch out for **3 hidden billing traps** that drain credits 5× faster or keep billing after you click &ldquo;Stop&rdquo;:
                          {' '}
                          <strong className="font-mono text-red-700 dark:text-red-300">
                            (1) Network Egress Traffic:
                          </strong>{' '}
                          Outbound Internet Egress bills{' '}
                          <code className="font-mono">$0.085–$0.12/GB</code>, Cross-Region traffic bills{' '}
                          <code className="font-mono">$0.02/GB</code>, and Cross-Zone VM/GKE pod traffic bills{' '}
                          <code className="font-mono">$0.01/GB</code> — keep VMs, GKE, GCS buckets, and BigQuery co-located in the **exact same region & zone** (<code className="font-mono">{targetHarvestZone}</code>).
                          {' '}
                          <strong className="font-mono text-red-700 dark:text-red-300">
                            (2) &ldquo;Stopped&rdquo; Resource Leftovers:
                          </strong>{' '}
                          Stopping a VM or Cloud SQL instance does **not** stop billing for Persistent Disks (`$0.10–$0.17/GB-mo`), reserved Static IPs (`$0.01/hr`), or GKE LoadBalancers (`$18/mo`) — you must **Delete** them before{' '}
                          <strong className="font-mono">{expIso}</strong>.
                          {' '}
                          <strong className="font-mono text-red-700 dark:text-red-300">
                            (3) GCS Early-Deletion Penalties:
                          </strong>{' '}
                          Never use `NEARLINE` (30d min), `COLDLINE` (90d min), or `ARCHIVE` (365d min) for short-term credit harvesting — deleting objects early triggers full remaining-duration penalty charges. Always use `STANDARD`.
                        </p>
                      </div>

                      {/* 6 Resource Harvester Blueprints Grid (VM, GCS, GKE, Cloud Run GPU, Cloud SQL, BigQuery) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
                        {harvestBlueprints.map((bp) => (
                          <div
                            key={bp.id}
                            className="p-3 rounded-xl bg-white/90 dark:bg-zinc-900/95 border border-amber-500/35 flex flex-col justify-between space-y-2"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                                  {bp.badge}
                                </span>
                                <span className="text-[10.5px] font-mono font-extrabold text-emerald-700 dark:text-emerald-400">
                                  {bp.capacityLabel}
                                </span>
                              </div>

                              <div className="text-xs font-mono font-extrabold text-zinc-900 dark:text-zinc-100">
                                {bp.title}
                              </div>

                              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug">
                                {bp.desc}
                              </p>

                              {/* Shutdown Time Badge & Decommission Behavior */}
                              <div className="p-2 rounded-lg bg-zinc-100/90 dark:bg-zinc-950/90 border border-zinc-200 dark:border-zinc-800 space-y-1">
                                <div className="text-[10.5px] font-mono font-bold text-blue-700 dark:text-blue-300">
                                  {bp.shutdownTime}
                                </div>
                                <div className="text-[10px] text-zinc-600 dark:text-zinc-400 leading-tight">
                                  {bp.shutdownNote}
                                </div>
                              </div>

                              {/* Resource-Specific Hidden Cost / Egress Reminder */}
                              <div className="p-2 rounded-lg bg-red-500/5 border border-red-500/20 text-[10px] font-mono text-red-700 dark:text-red-300 leading-tight">
                                {bp.hiddenCostWarning}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap pt-1">
                              {onOpenProvision && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onOpenProvision(
                                      bp.provisionType,
                                      targetHarvestRegion
                                    )
                                  }
                                  className="h-7 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-[10px] font-mono font-extrabold cursor-pointer transition-all"
                                >
                                  {bp.provisionBtnLabel} ({targetHarvestRegion})
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  handleCopyText(
                                    bp.cliId,
                                    bp.cliCmd,
                                    bp.cliLabel
                                  )
                                }
                                className="h-7 px-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-mono font-bold cursor-pointer"
                              >
                                {copiedId === bp.cliId
                                  ? 'Copied!'
                                  : bp.isSql
                                  ? 'Copy SQL'
                                  : 'Copy CLI'}
                              </button>

                              {bp.isSql && onOpenBigQuerySql ? (
                                <button
                                  type="button"
                                  onClick={() => onOpenBigQuerySql(bp.cliCmd)}
                                  className="h-7 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-mono font-bold cursor-pointer"
                                >
                                  Open in BigQuery
                                </button>
                              ) : (
                                onRunInShell && (
                                  <button
                                    type="button"
                                    onClick={() => onRunInShell(bp.cliCmd)}
                                    className="h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-mono font-bold cursor-pointer"
                                  >
                                    Run in Shell
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Pre-Expiry Auto-Shutdown Guardrail Bar */}
                      <div className="p-3 rounded-xl bg-white/90 dark:bg-zinc-900/95 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="space-y-0.5">
                          <div className="text-xs font-mono font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            <span>
                              Pre-Expiry Auto-Shutdown Guardrail (Cutoff: 12h before {expIso})
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                            Remember: GKE takes <strong>~5–12 mins</strong> to drain & delete, Cloud SQL takes <strong>~2–6 mins</strong>, and VMs take <strong>~45s</strong>. Schedule this automated Cloud Scheduler cutoff 12 hours before{' '}
                            <strong className="font-mono">{expIso}</strong> so no resource spills into paid billing after your credit expires.
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyText(
                                'harvester-cutoff',
                                safeCutoffCmd,
                                'Pre-Expiry Auto-Shutdown CLI'
                              )
                            }
                            className="h-8 px-3 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10.5px] font-mono font-bold cursor-pointer"
                          >
                            {copiedId === 'harvester-cutoff'
                              ? 'Copied Guard CLI'
                              : 'Copy Cutoff Guard CLI'}
                          </button>
                          {onRunInShell && (
                            <button
                              type="button"
                              onClick={() => onRunInShell(safeCutoffCmd)}
                              className="h-8 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[10.5px] font-mono font-bold cursor-pointer"
                            >
                              Arm 12h Cutoff Guard
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}

      {/* Active Promotional Credit Grant Ledger Table */}
      {filteredGrants.length > 0 && (
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
              <button
                type="button"
                onClick={handleClearConsoleCredits}
                className="h-7 px-2.5 rounded-lg text-[11px] font-mono font-bold border bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30 transition-all cursor-pointer whitespace-nowrap"
              >
                Reset All Credits
              </button>
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
                  <th className="py-2.5 px-4">Credit application type</th>
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
                            Stranded forecast: {fmtCreditUsd(m.strandedMoneyUsd)}{' '}
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
                              {hideCreditsInGde ? '••%' : `${m.displayPct}%`}
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
                        {fmtCreditUsd(m.remaining)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                        {fmtCreditUsd(m.initial)}
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
                        {grant.creditApplication || 'Net pricing'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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

      {/* WAVE 10: LIVE CROSS-REGION EGRESS & STOPPED-RESOURCE LEFTOVER RADAR */}
      <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-xs font-mono font-extrabold text-zinc-900 dark:text-zinc-100">
                Live Cross-Region Egress & &ldquo;Stopped-Resource Leftover&rdquo; FinOps Radar
              </span>
              {egressRadar && (
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    (egressRadar.stoppedLeftovers?.length || 0) === 0 &&
                    (egressRadar.egressWarnings?.length || 0) === 0
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {egressRadar.stoppedLeftovers?.length || 0} Stopped Leftovers ($
                  {Number(egressRadar.totalLeftoverMonthlyUsd || 0).toFixed(2)}
                  /mo) · {egressRadar.egressWarnings?.length || 0} Egress / Penalty Risks
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500">
              Automatically scans `compute.googleapis.com`, `storage.googleapis.com`, and `run.googleapis.com` for STOPPED VMs still billing for Persistent Disks, idle reserved IPv4s ($0.01/hr), Nearline/Coldline early-deletion penalty risks, and cross-region bucket↔compute egress ($0.02/GB).
            </p>
          </div>

          <button
            type="button"
            onClick={scanEgressAndLeftovers}
            disabled={loadingEgressRadar}
            className="h-8 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-mono font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                loadingEgressRadar ? 'animate-spin' : ''
              }`}
            />
            <span>
              {loadingEgressRadar
                ? 'Scanning Project Topology...'
                : 'Scan Egress & Leftovers'}
            </span>
          </button>
        </div>

        {egressRadar &&
          (egressRadar.stoppedLeftovers?.length || 0) === 0 &&
          (egressRadar.egressWarnings?.length || 0) === 0 && (
            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/25 text-xs font-mono text-emerald-700 dark:text-emerald-400">
              ✓ Zero stopped-VM disk leftovers, zero idle static IPs, and zero cross-region compute↔storage egress mismatches detected in `{projectId}`.
            </div>
          )}

        {egressRadar &&
          ((egressRadar.stoppedLeftovers?.length || 0) > 0 ||
            (egressRadar.egressWarnings?.length || 0) > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {(egressRadar.stoppedLeftovers || []).map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-red-500/5 border border-red-500/30 flex flex-col justify-between gap-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-red-700 dark:text-red-300">
                      <span>
                        [{item.type}] {item.name} ({item.location})
                      </span>
                      <span>-${item.monthlyDrainUsd}/mo</span>
                    </div>
                    <p className="text-[11px] text-zinc-700 dark:text-zinc-300">
                      {item.reason}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyText(
                          item.id,
                          item.remediationCli,
                          'Leftover Cleanup CLI'
                        )
                      }
                      className="h-7 px-2.5 rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-mono font-bold cursor-pointer"
                    >
                      {copiedId === item.id ? 'Copied CLI' : 'Copy Cleanup CLI'}
                    </button>
                    {onRunInShell && (
                      <button
                        type="button"
                        onClick={() => onRunInShell(item.remediationCli)}
                        className="h-7 px-2.5 rounded bg-red-600 hover:bg-red-500 text-white text-[10px] font-mono font-bold cursor-pointer"
                      >
                        Delete Leftover in Shell
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {(egressRadar.egressWarnings || []).map((warn) => (
                <div
                  key={warn.id}
                  className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/30 space-y-1"
                >
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-800 dark:text-amber-300">
                    <span>{warn.resource}</span>
                    <span>{warn.rateLabel}</span>
                  </div>
                  <p className="text-[11px] text-zinc-700 dark:text-zinc-300">
                    {warn.detail}
                  </p>
                </div>
              ))}
            </div>
          )}
      </div>

      {/* =====================================================================
          GOOGLE CLOUD "ALWAYS FREE" TIER AUDITOR & $0/MO ARCHITECT
          Official Spec: https://docs.cloud.google.com/free/docs/free-cloud-features#free-tier-usage-limits
         ===================================================================== */}
      <div className="p-4 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/35 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-xs sm:text-sm font-mono font-extrabold text-zinc-900 dark:text-zinc-100">
                Google Cloud &ldquo;Always Free&rdquo; Tier Auditor & $0.00/Mo Architect
              </span>
              {alwaysFreeAudit?.summary && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  {alwaysFreeAudit.summary.withinFreeCount} /{' '}
                  {alwaysFreeAudit.summary.totalCategories} Services Inside Free Tier
                </span>
              )}
              <a
                href="https://docs.cloud.google.com/free/docs/free-cloud-features#free-tier-usage-limits"
                target="_blank"
                rel="noreferrer"
                className="text-[10.5px] font-mono underline text-blue-600 dark:text-blue-400"
              >
                Official Free Tier Usage Limits Docs ↗
              </a>
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
              Even when your promotional credits expire (or on any Paid Billing Account), Google Cloud provides a permanent monthly **Always Free Tier** (`$0.00/mo`, non-rolling monthly limits). Below is your live project audit against the official Free Tier rules, hidden gotchas (`pd-balanced` vs `pd-standard`, US-only regions, GKE node charges), and 1-click `$0.00/mo` deployment commands.
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'ALL', label: 'All Free Tier Services (9)' },
              {
                id: 'ATTENTION',
                label: `Exceeding / Paid SKU (${
                  alwaysFreeAudit?.summary?.attentionCount || 0
                })`,
              },
              {
                id: 'WITHIN_FREE',
                label: `100% Free ($0/mo) (${
                  alwaysFreeAudit?.summary?.withinFreeCount || 0
                })`,
              },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setAlwaysFreeFilter(f.id)}
                className={`h-7 px-2.5 rounded-lg text-[10.5px] font-mono font-bold border transition-colors cursor-pointer ${
                  alwaysFreeFilter === f.id
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
                }`}
              >
                {f.label}
              </button>
            ))}

            <button
              type="button"
              onClick={scanAlwaysFreeAuditor}
              disabled={loadingAlwaysFree}
              className="h-7 px-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-[10.5px] font-mono font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw
                className={`w-3 h-3 ${loadingAlwaysFree ? 'animate-spin' : ''}`}
              />
              <span>
                {loadingAlwaysFree ? 'Auditing...' : 'Audit Always Free'}
              </span>
            </button>
          </div>
        </div>

        {/* 1-Click "$0.00 Free-Tier Micro-Charge Killer" Bar */}
        <div className="p-3 rounded-xl bg-white/90 dark:bg-[#131314] border border-emerald-500/40 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-mono font-extrabold text-emerald-700 dark:text-emerald-300">
              1-Click &ldquo;$0.00 Free-Tier Micro-Charge Killer&rdquo; Enforcers (Prevent Silent $0.10–$2.50/mo Overages)
            </span>
            <span className="text-[10px] font-mono text-zinc-500">
              Executes live REST API policies against Artifact Registry, Cloud Logging & Secret Manager
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[10.5px] font-mono">
            <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between gap-2">
              <div>
                <div className="font-extrabold text-zinc-900 dark:text-zinc-100">
                  1. Artifact Registry `&lt;0.5 GB` Auto-Purge Policy
                </div>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Every `gcloud run deploy --source` leaves old container layers behind that breach the `0.5 GB` Always Free limit ($0.10/GB/mo after). Attaches `keepCount=2` + `delete untagged &gt;7d`.
                </p>
              </div>
              <button
                type="button"
                disabled={Boolean(enforcerBusy)}
                onClick={() =>
                  handleRunAlwaysFreeEnforcer('ENFORCE_ARTIFACT_REGISTRY_CLEANUP')
                }
                className="w-full py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[10px] font-bold cursor-pointer"
              >
                {enforcerBusy === 'ENFORCE_ARTIFACT_REGISTRY_CLEANUP'
                  ? 'Applying Cleanup Policy...'
                  : 'Enforce <0.5 GB Image Cleanup Policy'}
              </button>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between gap-2">
              <div>
                <div className="font-extrabold text-zinc-900 dark:text-zinc-100">
                  2. Cloud Logging `50 GiB/mo` Health-Check Shield
                </div>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Patches the `_Default` log sink to exclude noisy `HTTP 200` `/healthz`, `/readyz`, and `kube-probe` logs so your project stays inside the `50 GiB/mo` Always Free quota.
                </p>
              </div>
              <button
                type="button"
                disabled={Boolean(enforcerBusy)}
                onClick={() =>
                  handleRunAlwaysFreeEnforcer(
                    'ENFORCE_LOGGING_HEALTHCHECK_EXCLUSION'
                  )
                }
                className="w-full py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[10px] font-bold cursor-pointer"
              >
                {enforcerBusy === 'ENFORCE_LOGGING_HEALTHCHECK_EXCLUSION'
                  ? 'Patching _Default Log Sink...'
                  : 'Install 50 GiB/mo Health-Check Log Shield'}
              </button>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between gap-2">
              <div>
                <div className="font-extrabold text-zinc-900 dark:text-zinc-100">
                  3. Secret Manager `≤6 Free Versions` Auto-Trimmer
                </div>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Scans all Secret Manager secrets and auto-disables (`:disable`) older `ENABLED` versions (keeping the newest active version per secret untouched) so old versions cost **$0.00/mo**.
                </p>
              </div>
              <button
                type="button"
                disabled={Boolean(enforcerBusy)}
                onClick={() =>
                  handleRunAlwaysFreeEnforcer('TRIM_EXCESS_SECRET_VERSIONS')
                }
                className="w-full py-1.5 px-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-[10px] font-bold cursor-pointer"
              >
                {enforcerBusy === 'TRIM_EXCESS_SECRET_VERSIONS'
                  ? 'Disabling Redundant Versions...'
                  : ' Auto-Disable Old Secret Versions ($0/mo)'}
              </button>
            </div>
          </div>
        </div>

        {/* 9 Always Free Product Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {(alwaysFreeAudit?.servicesCatalog || [])
            .filter((item) => {
              if (alwaysFreeFilter === 'ATTENTION') {
                return item.liveStatus !== 'WITHIN_FREE_TIER';
              }
              if (alwaysFreeFilter === 'WITHIN_FREE') {
                return item.liveStatus === 'WITHIN_FREE_TIER';
              }
              return true;
            })
            .map((item) => {
              const isFree = item.liveStatus === 'WITHIN_FREE_TIER';
              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border flex flex-col justify-between gap-2.5 ${
                    isFree
                      ? 'bg-white/90 dark:bg-[#131314] border-zinc-200 dark:border-zinc-800'
                      : 'bg-amber-500/[0.06] border-amber-500/40'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <a
                        href={item.docAnchor}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-mono font-extrabold text-zinc-900 dark:text-zinc-100 hover:underline"
                      >
                        {item.product} ↗
                      </a>
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded text-[9.5px] font-mono font-extrabold border ${
                          isFree
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/40'
                        }`}
                      >
                        {isFree ? '$0.00 FREE TIER' : 'PAID SKU ACTIVE'}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/20 text-[10.5px] font-mono text-zinc-800 dark:text-zinc-200">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        Monthly Free Limit:{' '}
                      </span>
                      {item.freeAllowance}
                    </div>

                    <div className="text-[10.5px] font-mono text-blue-700 dark:text-blue-300">
                      <strong>Live Project Status:</strong> {item.liveUsageLabel}
                    </div>

                    <div className="text-[10px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {item.gotchaWarning}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-200/70 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyText(
                          `free-cli-${item.id}`,
                          item.zeroDollarCli,
                          `${item.product} $0/mo CLI`
                        )
                      }
                      className="h-7 px-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-mono font-bold cursor-pointer"
                    >
                      {copiedId === `free-cli-${item.id}`
                        ? '✓ Copied $0 CLI'
                        : 'Copy $0/mo CLI'}
                    </button>

                    {onRunInShell && (
                      <button
                        type="button"
                        onClick={() => onRunInShell(item.zeroDollarCli)}
                        className="h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-mono font-bold cursor-pointer"
                      >
                        Run $0 Spec in Shell
                      </button>
                    )}

                    {item.provisionServiceType === 'SECRET_MANAGER' &&
                    onOpenSecretManagerStudio ? (
                      <button
                        type="button"
                        onClick={() => onOpenSecretManagerStudio()}
                        className="h-7 px-2.5 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 text-blue-700 dark:text-blue-300 border border-blue-500/30 text-[10px] font-mono font-bold cursor-pointer"
                      >
                        Open Secret Studio →
                      </button>
                    ) : (
                      onOpenProvision &&
                      item.provisionServiceType &&
                      item.provisionServiceType !== 'SECRET_MANAGER' && (
                        <button
                          type="button"
                          onClick={() =>
                            onOpenProvision(item.provisionServiceType)
                          }
                          className="h-7 px-2.5 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 text-blue-700 dark:text-blue-300 border border-blue-500/30 text-[10px] font-mono font-bold cursor-pointer"
                        >
                          Open Studio →
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Product-Specific Free Trials Strip (AlloyDB 30d, Spanner 90d, Cloud SQL 30d, Looker 30d) */}
        {alwaysFreeAudit?.productFreeTrials?.length > 0 && (
          <div className="p-3 rounded-xl bg-white/80 dark:bg-[#131314] border border-blue-500/30 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono font-extrabold text-blue-700 dark:text-blue-300">
                Bonus: Product-Specific Free Trials (Separate from Always Free & $300 Welcome Credit)
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                Requires an active Google Cloud Billing Account · Unused Free Tier limits do not roll over month-to-month
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {alwaysFreeAudit.productFreeTrials.map((trial) => (
                <a
                  key={trial.id}
                  href={trial.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 hover:border-blue-500 border border-zinc-200 dark:border-zinc-800 transition-colors block"
                >
                  <div className="text-[11px] font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {trial.name} ↗
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">
                    {trial.allowance}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
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
          <pre className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-[10px] font-mono overflow-x-auto max-h-28">
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
          <pre className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-[10px] font-mono overflow-x-auto max-h-28">
            {budgetAlertCli}
          </pre>
        </div>
      </div>
    </div>
  );
}
