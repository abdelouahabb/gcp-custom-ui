import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  Trash2,
  RotateCcw,
  RefreshCw,
  Search,
  Terminal,
  Copy,
  Check,
  ShieldAlert,
  Database,
  HardDrive,
  Server,
  Cpu,
  KeyRound,
  Zap,
  ChevronDown,
  ChevronUp,
  Clock,
  Filter,
  CheckCircle2,
} from 'lucide-react';

const CATEGORY_TABS = [
  { id: 'ALL', label: 'All Destroyed & Disabled' },
  { id: 'DISABLED_API', label: 'Disabled GCP APIs' },
  { id: 'STORAGE', label: 'Buckets & Objects' },
  { id: 'BIGQUERY', label: 'BigQuery Tables & Datasets' },
  { id: 'COMPUTE_VPC', label: 'VMs, Disks & VPC' },
  { id: 'SERVERLESS_DB', label: 'Cloud Run, GKE & SQL' },
  { id: 'IAM_SECRETS', label: 'IAM, SA Keys & Secrets' },
];

function formatRelativeAge(ageHours) {
  const h = Number(ageHours || 0);
  if (h < 1) {
    const mins = Math.max(1, Math.round(h * 60));
    return `${mins}m ago`;
  }
  if (h < 24) {
    return `${h.toFixed(1)}h ago`;
  }
  const days = (h / 24).toFixed(1);
  return `${days}d ago`;
}

export default function CloudRecycleBinStudio({
  projectId,
  initialCategory = 'ALL',
  subTabNonce = 0,
  onRunInShell,
  onShowToast,
  onShowError,
  onRefreshParent,
  compact = false,
}) {
  const [windowDays, setWindowDays] = useState(30);
  const [binData, setBinData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categoryTab, setCategoryTab] = useState(initialCategory || 'ALL');
  const [actorFilter, setActorFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [restoringId, setRestoringId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [showLqlFilter, setShowLqlFilter] = useState(false);

  useEffect(() => {
    if (initialCategory) {
      setCategoryTab(initialCategory);
    }
  }, [initialCategory, subTabNonce]);

  const fetchRecycleBin = useCallback(
    async (daysOverride) => {
      if (!projectId) return;
      const targetDays = daysOverride || windowDays;
      setLoading(true);
      try {
        const res = await axios.get(
          `/api/project/${encodeURIComponent(projectId)}/recycle-bin`,
          { params: { days: targetDays } }
        );
        setBinData(res.data);
      } catch (err) {
        if (onShowError) {
          onShowError(
            err.response?.data?.error ||
              err.message ||
              'Failed to scan 30-Day Cloud Recycle Bin.'
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [projectId, windowDays, onShowError]
  );

  useEffect(() => {
    fetchRecycleBin(windowDays);
  }, [fetchRecycleBin, windowDays]);

  const handleCopy = (text, key) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(key);
    if (onShowToast) onShowToast('Copied command to clipboard.');
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleRestoreItem = async (item) => {
    if (!projectId || !item) return;

    const directApiTypes = [
      'RESTORE_API',
      'RESTORE_GCS_BUCKET',
      'RESTORE_BQ_DATASET',
      'UNDELETE_SERVICE_ACCOUNT',
      'UNDELETE_API_KEY',
    ];

    if (!directApiTypes.includes(item.restoreActionType)) {
      if (onRunInShell && item.restoreCli && !item.restoreCli.startsWith('#')) {
        onRunInShell(item.restoreCli);
        if (onShowToast) {
          onShowToast(
            `Sent restore command for ${item.shortName} to Cloud Shell.`
          );
        }
      } else {
        handleCopy(item.restoreCli, `restore-${item.id}`);
      }
      return;
    }

    setRestoringId(item.id);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/recycle-bin/restore`,
        {
          restoreActionType: item.restoreActionType,
          restoreTarget: item.restoreTarget,
          location: item.location,
          generation: item.generation || '',
        }
      );
      if (onShowToast) {
        onShowToast(res.data?.message || `Restored ${item.shortName}!`);
      }
      await fetchRecycleBin(windowDays);
      if (onRefreshParent) onRefreshParent();
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            `Failed to restore ${item.shortName}`
        );
      }
    } finally {
      setRestoringId(null);
    }
  };

  const uniqueActors = useMemo(() => {
    const set = new Set();
    (binData?.items || []).forEach((i) => {
      if (i.actor) set.add(i.actor);
    });
    return Array.from(set);
  }, [binData?.items]);

  const filteredItems = useMemo(() => {
    const list = binData?.items || [];
    return list.filter((it) => {
      if (categoryTab === 'DISABLED_API' && it.category !== 'DISABLED_API') {
        return false;
      }
      if (
        categoryTab === 'STORAGE' &&
        !['STORAGE_BUCKET', 'STORAGE_OBJECT'].includes(it.category)
      ) {
        return false;
      }
      if (
        categoryTab === 'BIGQUERY' &&
        !['BIGQUERY_TABLE', 'BIGQUERY_DATASET'].includes(it.category)
      ) {
        return false;
      }
      if (
        categoryTab === 'COMPUTE_VPC' &&
        !['COMPUTE_VM', 'COMPUTE_DISK', 'VPC_FIREWALL', 'VPC_SUBNET'].includes(
          it.category
        )
      ) {
        return false;
      }
      if (
        categoryTab === 'SERVERLESS_DB' &&
        !['CLOUD_RUN', 'GKE_CLUSTER', 'CLOUD_SQL'].includes(it.category)
      ) {
        return false;
      }
      if (
        categoryTab === 'IAM_SECRETS' &&
        !['IAM_RESOURCE', 'SECRET_KMS'].includes(it.category)
      ) {
        return false;
      }
      if (actorFilter !== 'ALL' && it.actor !== actorFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          String(it.shortName || '')
            .toLowerCase()
            .includes(q) ||
          String(it.rawResourceName || '')
            .toLowerCase()
            .includes(q) ||
          String(it.serviceName || '')
            .toLowerCase()
            .includes(q) ||
          String(it.methodName || '')
            .toLowerCase()
            .includes(q) ||
          String(it.actor || '')
            .toLowerCase()
            .includes(q) ||
          String(it.categoryLabel || '')
            .toLowerCase()
            .includes(q)
        );
      }
      return true;
    });
  }, [binData?.items, categoryTab, actorFilter, searchQuery]);

  const getCategoryIcon = (cat) => {
    if (cat === 'DISABLED_API') return Zap;
    if (cat === 'STORAGE_BUCKET' || cat === 'STORAGE_OBJECT') return HardDrive;
    if (cat === 'BIGQUERY_TABLE' || cat === 'BIGQUERY_DATASET') return Database;
    if (
      ['COMPUTE_VM', 'COMPUTE_DISK', 'VPC_FIREWALL', 'VPC_SUBNET'].includes(cat)
    )
      return Server;
    if (['CLOUD_RUN', 'GKE_CLUSTER', 'CLOUD_SQL'].includes(cat)) return Cpu;
    if (['IAM_RESOURCE', 'SECRET_KMS'].includes(cat)) return KeyRound;
    return Trash2;
  };

  const getRecoverabilityBadgeStyle = (rec) => {
    if (
      rec === 'INSTANT_REENABLE' ||
      rec === 'CAPACITOR_7D_UNDELETE' ||
      rec === 'IAM_30D_UNDELETE' ||
      rec === 'KMS_24H_RESTORE'
    ) {
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
    }
    return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
  };

  const getDataRecoveryReality = (item) => {
    if (item.category === 'DISABLED_API') {
      return {
        tone: 'emerald',
        pill: 'Control-Plane API Re-Enable',
        note: 'Re-enables the Google Cloud API endpoint on this project. Does not recover resources that were manually deleted before disabling the API.',
        buttonLabel: 'Re-Enable API Now',
      };
    }
    if (item.source === 'GCS_SOFT_DELETE_VAULT') {
      return {
        tone: 'emerald',
        pill: 'Soft-Delete Vault (Data Restorable Before Hard-Delete)',
        note: 'This bucket is currently in Google Cloud Storage Soft-Delete retention. Restoring it before hardDeleteTime recovers its soft-deleted objects.',
        buttonLabel: 'Restore Soft-Deleted Bucket',
      };
    }
    if (item.recoverability === 'CAPACITOR_7D_UNDELETE') {
      return {
        tone: 'emerald',
        pill: '7-Day Capacitor Time-Travel (Data Restorable if Dataset Exists)',
        note: 'Uses BigQuery FOR SYSTEM_TIME AS OF / bq cp @-timestamp to recover table rows ONLY if the parent dataset was not deleted and <7 days have elapsed.',
        buttonLabel: 'Run 7d Time-Travel Undrop in Shell',
      };
    }
    if (item.recoverability === 'IAM_30D_UNDELETE') {
      return {
        tone: 'emerald',
        pill: '30-Day Native GCP Undelete (Identity Restorable)',
        note: 'Google Cloud retains deleted Service Accounts and API Keys in a 30-day undelete vault and restores the exact UID/principal.',
        buttonLabel: 'Undelete Principal / Key Now',
      };
    }
    if (
      item.category === 'STORAGE_BUCKET' ||
      item.category === 'STORAGE_OBJECT'
    ) {
      return {
        tone: 'amber',
        pill: 'No Data Guarantee (Empty Bucket Unless Soft-Delete Was Active)',
        note: 'Attempts gcloud storage restore first (which only recovers data if Soft-Delete retention was enabled and unexpired); otherwise re-creates a brand-new EMPTY bucket with 0 objects.',
        buttonLabel: 'Attempt Soft-Restore / Re-Create Empty Bucket',
      };
    }
    if (item.category === 'BIGQUERY_DATASET') {
      return {
        tone: 'amber',
        pill: 'Re-Creates Empty Dataset Only (0 Tables / No Data)',
        note: 'Deleting a BigQuery Dataset with deleteContents=true permanently destroys its tables. This action only re-creates an EMPTY dataset shell with the same name.',
        buttonLabel: 'Re-Create Empty Dataset Shell',
      };
    }
    return {
      tone: 'amber',
      pill: 'Re-Creates Empty Resource Only (No Data Guarantee)',
      note: 'Google Cloud permanently wipes underlying disk blocks, database rows, and container state upon deletion (unless you took a prior Snapshot/Backup). This command only provisions a new, EMPTY resource with the same name and location.',
      buttonLabel: onRunInShell
        ? 'Re-Create Empty Resource in Shell'
        : 'Copy Re-Creation CLI',
    };
  };

  return (
    <div className="space-y-4">
      {/* Top Executive Header Card */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#202124] p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-[10px] font-mono font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              <Trash2 className="w-3.5 h-3.5" />
              <span>
                CLOUD RECYCLE BIN · 30-DAY DESTROYED RESOURCES &amp; DISABLED APIS LEDGER
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">
              Google Cloud Recycle Bin — What Was Deleted &amp; Which APIs Were Disabled ({projectId})
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 max-w-4xl">
              Just like the Windows Recycle Bin, this view filters live{' '}
              <code className="font-mono text-blue-600 dark:text-blue-400">
                cloudaudit.googleapis.com/activity
              </code>{' '}
              logs, Cloud Storage Soft-Delete vaults, and{' '}
              <code className="font-mono text-blue-600 dark:text-blue-400">
                serviceusage.googleapis.com
              </code>{' '}
              over the past <strong>{windowDays} days</strong> strictly for{' '}
              <strong>deleted resources</strong> and{' '}
              <strong>disabled Google Cloud APIs</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Time Window Selector */}
            <div className="inline-flex items-center rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 p-0.5 text-xs font-mono">
              {[
                { days: 7, label: '7 Days' },
                { days: 14, label: '14 Days' },
                { days: 30, label: '30 Days (1 Mo)' },
                { days: 90, label: '90 Days' },
              ].map((w) => (
                <button
                  key={w.days}
                  type="button"
                  onClick={() => setWindowDays(w.days)}
                  className={`px-2.5 py-1 rounded-md font-bold cursor-pointer transition-colors ${
                    windowDays === w.days
                      ? 'bg-blue-600 text-white'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowLqlFilter((p) => !p)}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{showLqlFilter ? 'Hide LQL Filter' : 'View Audit LQL'}</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => fetchRecycleBin(windowDays)}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 text-xs font-mono font-extrabold shadow-sm cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
              />
              <span>
                {loading
                  ? `Scanning ${windowDays}d Destruction Logs...`
                  : `Rescan ${windowDays}-Day Recycle Bin`}
              </span>
            </button>
          </div>
        </div>

        {showLqlFilter && binData?.auditFilterUsed && (
          <div className="p-3 rounded-xl bg-zinc-950 text-emerald-400 border border-zinc-800 font-mono text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-zinc-400">
                Live Cloud Audit Log Filter (logging.googleapis.com/v2/entries:list · {windowDays} Days)
              </span>
              <button
                type="button"
                onClick={() =>
                  handleCopy(binData.auditFilterUsed, 'lql-filter')
                }
                className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 text-[10px] cursor-pointer"
              >
                {copiedId === 'lql-filter' ? 'Copied!' : 'Copy LQL Filter'}
              </button>
            </div>
            <pre className="whitespace-pre-wrap text-[11px]">
              {binData.auditFilterUsed}
            </pre>
          </div>
        )}

        {/* Honest Engineering Notice: Data Recovery vs. Empty Resource Re-Creation */}
        <div className="p-3.5 rounded-xl bg-amber-500/[0.08] border border-amber-500/35 text-xs space-y-1.5">
          <div className="font-mono font-extrabold text-amber-700 dark:text-amber-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              IMPORTANT: Resource Re-Creation vs. Actual Data Recovery (No Guarantee of Data Inside)
            </span>
          </div>
          <p className="text-[11.5px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
            In Google Cloud, once a resource (Compute VM, Persistent Disk, Cloud SQL instance, BigQuery Dataset, or Bucket without Soft-Delete) is deleted, its underlying storage blocks are{' '}
            <strong>permanently destroyed by Google Cloud</strong> unless you had a prior Snapshot, Backup, or Soft-Delete policy. For those items, the action below{' '}
            <strong>only re-creates a new, empty resource with the same name and location — with NO guarantee of restoring the data that was inside</strong>. Native state/data recovery is only possible for{' '}
            <strong>Disabled APIs</strong>,{' '}
            <strong>IAM Service Accounts / API Keys (&lt;30 days)</strong>,{' '}
            <strong>Dropped BigQuery Tables (&lt;7 days if parent dataset still exists)</strong>, and{' '}
            <strong>Cloud Storage Buckets/Objects with an active Soft-Delete retention policy</strong>.
          </p>
        </div>

        {/* 4 Summary Telemetry Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="text-zinc-500">
              Total Destroyed / Disabled ({windowDays}d)
            </div>
            <div className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
              {binData?.summary?.totalItems ?? 0} Items
            </div>
            <div className="text-[10px] text-zinc-500">
              From live cloudaudit.googleapis.com/activity
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="text-zinc-500">Disabled Google Cloud APIs</div>
            <div className="text-lg font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
              {binData?.summary?.disabledApisCount ?? 0} APIs Disabled
            </div>
            <div className="text-[10px] text-zinc-500">
              1-Click Re-Enable via serviceusage.googleapis.com
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="text-zinc-500">1-Click Native Restorable</div>
            <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {binData?.summary?.instantRestorableCount ?? 0} Recoverable
            </div>
            <div className="text-[10px] text-zinc-500">
              Soft-Delete, 7d BQ Time-Travel, 30d IAM Undelete &amp; APIs
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="text-zinc-500">Storage / BQ / Compute / IAM</div>
            <div className="text-lg font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
              {(binData?.summary?.storageCount ?? 0) +
                (binData?.summary?.bigqueryCount ?? 0) +
                (binData?.summary?.computeVpcCount ?? 0) +
                (binData?.summary?.serverlessGkeSqlCount ?? 0)}{' '}
              Infra Items
            </div>
            <div className="text-[10px] text-zinc-500">
              Across {binData?.summary?.uniqueActorsCount ?? 0} unique principal(s)
            </div>
          </div>
        </div>

        {/* Category Filter Pills + Search & Actor Filter */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {CATEGORY_TABS.map((tab) => {
              const active = categoryTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCategoryTab(tab.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold border cursor-pointer transition-all ${
                    active
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-blue-500/40'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[240px] flex-1">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search deleted resource, disabled API, method, actor..."
                className="w-full h-8 pl-8 pr-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs font-mono text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <select
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              className="h-8 px-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200"
            >
              <option value="ALL">All Actors ({uniqueActors.length})</option>
              {uniqueActors.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Recycle Bin List */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#202124] overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 bg-zinc-50/70 dark:bg-zinc-900/50 text-xs font-mono">
          <div className="font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-blue-500" />
            <span>
              Recycle Bin Contents ({filteredItems.length} of{' '}
              {binData?.items?.length || 0} destroyed/disabled items in last{' '}
              {windowDays} days)
            </span>
          </div>
          <span className="text-[11px] text-zinc-500">
            Cutoff: {binData?.cutoffIso ? binData.cutoffIso.slice(0, 10) : '30d'} → Now
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-zinc-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
            <span>
              Querying Cloud Audit Logs (cloudaudit.googleapis.com/activity) &amp; Soft-Delete Vaults for the last {windowDays} days...
            </span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-10 text-center space-y-2 font-mono">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
              Recycle Bin is Clean for This Filter ({windowDays}-Day Window)
            </div>
            <p className="text-xs text-zinc-500 max-w-xl mx-auto">
              No matching resource deletions or disabled APIs were recorded in{' '}
              <code>cloudaudit.googleapis.com/activity</code> over the last{' '}
              {windowDays} days. Try switching the category filter to{' '}
              <strong>All Destroyed &amp; Disabled</strong> or expanding the
              window to <strong>90 Days</strong>.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800 max-h-[640px] overflow-y-auto">
            {filteredItems.map((item) => {
              const Icon = getCategoryIcon(item.category);
              const isExpanded = expandedItemId === item.id;
              const reality = getDataRecoveryReality(item);

              return (
                <div
                  key={item.id}
                  className="p-4 hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40 transition-colors space-y-2.5 font-mono text-xs"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${
                          item.category === 'DISABLED_API'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-sm text-zinc-900 dark:text-white break-all">
                            {item.shortName}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold">
                            {item.categoryLabel}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                              reality.tone === 'emerald'
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {reality.pill}
                          </span>
                        </div>

                        <div className="text-[11px] text-amber-700 dark:text-amber-300/90 font-sans">
                          {reality.note}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500">
                          <span>
                            Service:{' '}
                            <strong className="text-zinc-700 dark:text-zinc-300">
                              {item.serviceName}
                            </strong>
                          </span>
                          <span>·</span>
                          <span>
                            Method:{' '}
                            <code className="text-rose-600 dark:text-rose-400 font-bold">
                              {item.methodName}
                            </code>
                          </span>
                          <span>·</span>
                          <span>
                            Location:{' '}
                            <strong className="text-zinc-700 dark:text-zinc-300">
                              {item.location}
                            </strong>
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500">
                          <span>
                            Deleted By:{' '}
                            <strong className="text-zinc-800 dark:text-zinc-200">
                              {item.actor}
                            </strong>{' '}
                            ({item.callerIp})
                          </span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-zinc-400" />
                            <span>
                              {new Date(item.timestamp).toLocaleString()} (
                              <strong>{formatRelativeAge(item.ageHours)}</strong>)
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={restoringId === item.id}
                        onClick={() => handleRestoreItem(item)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-white text-[11px] font-extrabold cursor-pointer disabled:opacity-50 shadow-sm ${
                          reality.tone === 'emerald'
                            ? 'bg-emerald-600 hover:bg-emerald-500'
                            : 'bg-amber-600 hover:bg-amber-500'
                        }`}
                      >
                        <RotateCcw
                          className={`w-3.5 h-3.5 ${
                            restoringId === item.id ? 'animate-spin' : ''
                          }`}
                        />
                        <span>
                          {restoringId === item.id
                            ? 'Working...'
                            : reality.buttonLabel}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(item.restoreCli, `cli-${item.id}`)
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-[11px] font-bold cursor-pointer"
                      >
                        {copiedId === `cli-${item.id}` ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy CLI</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedItemId(isExpanded ? null : item.id)
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-[11px] font-bold cursor-pointer"
                      >
                        <span>{isExpanded ? 'Hide Log' : 'Audit Log'}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Restore Command Preview */}
                  <div className="px-3 py-1.5 rounded-lg bg-zinc-100/80 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between gap-2 text-[11px]">
                    <code className="text-emerald-700 dark:text-emerald-400 truncate">
                      $ {item.restoreCli}
                    </code>
                    {onRunInShell && !item.restoreCli.startsWith('#') && (
                      <button
                        type="button"
                        onClick={() => onRunInShell(item.restoreCli)}
                        className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-bold shrink-0 cursor-pointer"
                      >
                        <Terminal className="w-3 h-3" />
                        <span>Run in Shell</span>
                      </button>
                    )}
                  </div>

                  {isExpanded && (
                    <pre className="p-3 rounded-xl bg-zinc-950 text-zinc-200 border border-zinc-800 text-[11px] overflow-x-auto max-h-64">
                      {JSON.stringify(item.rawAuditPayload, null, 2)}
                    </pre>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
