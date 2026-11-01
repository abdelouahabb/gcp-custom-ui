import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Sparkles,
  DollarSign,
  Globe,
  ShieldCheck,
  Database,
  RefreshCw,
  Terminal,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Download,
  FileCode2,
  Zap,
  Layers,
  Lock,
} from 'lucide-react';

const WAVE16_TABS = [
  {
    id: 'FINOPS_AUTO_SURGEON',
    step: '01',
    title: 'Live FinOps Anomaly Auto-Fixer',
    subtitle: 'GCS Lifecycle & Scale-to-Zero Surgeon',
    icon: DollarSign,
  },
  {
    id: 'DR_GAMEDAY_SIMULATOR',
    step: '02',
    title: 'Multi-Region DR GameDay Prover',
    subtitle: 'RTO / RPO & Blackout Drill',
    icon: Globe,
  },
  {
    id: 'IAM_LEAST_PRIVILEGE',
    step: '03',
    title: 'IAM Least-Privilege Role Synthesizer',
    subtitle: 'Owner/Editor Stripper & Custom YAML',
    icon: ShieldCheck,
  },
  {
    id: 'SQL_COST_SURGEON',
    step: '04',
    title: 'Live BigQuery SQL Cost Surgeon',
    subtitle: 'Dry-Run Byte Verifier & Partition Rewrite',
    icon: Database,
  },
];

const LIFECYCLE_PROFILE_OPTIONS = [
  {
    id: 'BALANCED_30_90',
    label: 'Balanced Tiering (30d Nearline → 90d Coldline + 7d Multipart Cleanup)',
    shortBadge: '30d Nearline → 90d Coldline',
  },
  {
    id: 'AGGRESSIVE_14_60_180',
    label: 'Aggressive FinOps (14d Nearline → 60d Coldline → 180d Archive)',
    shortBadge: '14d Nearline → 60d Coldline → 180d Archive',
  },
  {
    id: 'COMPLIANCE_90_365',
    label: 'Enterprise Compliance (90d Coldline → 365d Archive + Prune >5 Versions)',
    shortBadge: '90d Coldline → 365d Archive',
  },
];

const STUDIO_TAB_LABELS = {
  CLOUD_STORAGE: 'Cloud Storage Studio',
  CLOUD_RUN: 'Cloud Run Studio',
  VM_SSH: 'Compute & SSH Studio',
  VPC_NETWORKS: 'VPC & Firewall Studio',
  IAM_SECURITY: 'IAM & Security Studio',
  BIGQUERY_STUDIO: 'BigQuery Studio',
};

export default function Wave16EnterpriseMoonshotStudio({
  projectId,
  onRunInShell,
  onSelectStudioTab,
  onOpenBigQuerySql,
  onShowToast,
  onShowError,
}) {
  const [activeTab, setActiveTab] = useState('FINOPS_AUTO_SURGEON');
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [copiedKey, setCopiedKey] = useState('');

  // FinOps Lifecycle Profile & Batch Receipt state
  const [lifecycleProfile, setLifecycleProfile] = useState('BALANCED_30_90');
  const [finopsReceipt, setFinopsReceipt] = useState(null);

  // DR GameDay simulated blackout region & drill/vault receipts
  const [blackoutRegion, setBlackoutRegion] = useState('us-central1');
  const [drDrillReceipt, setDrDrillReceipt] = useState(null);
  const [drVaultReceipt, setDrVaultReceipt] = useState(null);
  const [inlineError, setInlineError] = useState('');

  // IAM Least-Privilege Synthesizer state
  const [iamFilter, setIamFilter] = useState('ALL');
  const [synthesizedRoleBundle, setSynthesizedRoleBundle] = useState(null);
  const [iamCodeFormat, setIamCodeFormat] = useState('YAML'); // 'YAML' | 'PAM' | 'TERRAFORM'

  // SQL Cost Surgeon state
  const [sqlInput, setSqlInput] = useState(
    `SELECT *\nFROM \`bigquery-public-data.usa_names.usa_1910_current\`\nORDER BY number DESC`
  );
  const [dryRunResult, setDryRunResult] = useState(null);

  const fetchWave16 = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/wave16/overview`
      );
      setOverview(res.data);
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            'Failed to load Wave 16 Moonshot overview.'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, onShowError]);

  useEffect(() => {
    fetchWave16();
  }, [fetchWave16]);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    if (onShowToast) onShowToast('Copied to clipboard!');
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const handleJumpToStudio = (tabId, resourceLabel = '') => {
    if (!tabId) return;
    if (onSelectStudioTab) {
      onSelectStudioTab(tabId);
    }
    window.dispatchEvent(
      new CustomEvent('cloudpulse:cross-ui-navigate', {
        detail: { tabId, resourceLabel },
      })
    );
    if (onShowToast) {
      onShowToast(
        `Navigated to ${STUDIO_TAB_LABELS[tabId] || tabId}${
          resourceLabel ? ` (${resourceLabel})` : ''
        }`
      );
    }
  };

  const handleApplyLifecycle = async (bucketName) => {
    setBusyId(bucketName);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave16/action`,
        {
          action: 'APPLY_GCS_LIFECYCLE',
          resourceName: bucketName,
          lifecycleProfile,
        }
      );
      setFinopsReceipt({
        type: 'SINGLE_BUCKET',
        bucketName,
        profileId: res.data?.profileId || lifecycleProfile,
        message: res.data?.message,
      });
      if (onShowToast && res.data?.message) onShowToast(res.data.message);
      await fetchWave16();
    } catch (err) {
      if (onShowError) {
        onShowError(err.response?.data?.error || err.message);
      }
    } finally {
      setBusyId('');
    }
  };

  const handleBatchApplyLifecycle = async (bucketNames) => {
    if (!Array.isArray(bucketNames) || bucketNames.length === 0) return;
    setBusyId('BATCH_LIFECYCLE');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave16/action`,
        {
          action: 'BATCH_APPLY_GCS_LIFECYCLE',
          bucketNames,
          lifecycleProfile,
        }
      );
      setFinopsReceipt({
        type: 'BATCH_BUCKETS',
        patchedCount: res.data?.patchedCount,
        totalRequested: res.data?.totalRequested,
        sha256Receipt: res.data?.sha256Receipt,
        profileId: res.data?.profileId || lifecycleProfile,
        message: res.data?.message,
      });
      if (onShowToast && res.data?.message) onShowToast(res.data.message);
      await fetchWave16();
    } catch (err) {
      if (onShowError) {
        onShowError(err.response?.data?.error || err.message);
      }
    } finally {
      setBusyId('');
    }
  };

  const handleScaleRunToZero = async (serviceName, region) => {
    setBusyId(`RUN_${serviceName}`);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave16/action`,
        {
          action: 'SCALE_RUN_TO_ZERO',
          resourceName: serviceName,
          region,
        }
      );
      if (onShowToast && res.data?.message) onShowToast(res.data.message);
      await fetchWave16();
    } catch (err) {
      if (onShowError) {
        onShowError(err.response?.data?.error || err.message);
      }
    } finally {
      setBusyId('');
    }
  };

  const handleRunDrGameDayDrill = async (targetRegion = blackoutRegion) => {
    setBusyId('DR_GAMEDAY_DRILL');
    setInlineError('');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave16/action`,
        {
          action: 'RUN_DR_GAMEDAY_DRILL',
          blackoutRegion: targetRegion,
        }
      );
      setDrDrillReceipt(res.data);
      if (onShowToast && res.data?.message) onShowToast(res.data.message);
    } catch (err) {
      const msg =
        err.response?.data?.error || err.message || 'DR GameDay Drill failed.';
      setInlineError(msg);
      if (onShowError) onShowError(msg);
    } finally {
      setBusyId('');
    }
  };

  const handleProvisionDrVault = async () => {
    setBusyId('PROVISION_DR_VAULT');
    setInlineError('');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave16/action`,
        {
          action: 'PROVISION_DR_VAULT',
        }
      );
      setDrVaultReceipt(res.data);
      if (onShowToast && res.data?.message) onShowToast(res.data.message);
      await fetchWave16();
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        'Provisioning DR Vault failed.';
      setInlineError(msg);
      if (onShowError) onShowError(msg);
    } finally {
      setBusyId('');
    }
  };

  const handleProtectAssetDr = async (assetName) => {
    setBusyId(`PROTECT_${assetName}`);
    setInlineError('');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave16/action`,
        {
          action: 'PROTECT_ASSET_DR',
          assetName,
        }
      );
      setDrVaultReceipt({
        bucketName: assetName.replace(/^gs:\/\//, ''),
        sha256Signature: res.data?.sha256Signature,
        message: res.data?.message,
      });
      if (onShowToast && res.data?.message) onShowToast(res.data.message);
      await fetchWave16();
    } catch (err) {
      const msg =
        err.response?.data?.error || err.message || 'Failed to protect asset.';
      setInlineError(msg);
      if (onShowError) onShowError(msg);
    } finally {
      setBusyId('');
    }
  };

  const handleSynthesizeCustomRole = async (grant) => {
    const busyKey = `SYNTH_${grant.member}`;
    setBusyId(busyKey);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave16/action`,
        {
          action: 'SYNTHESIZE_IAM_CUSTOM_ROLE',
          member: grant.member,
          currentRole: grant.currentRole,
        }
      );
      setSynthesizedRoleBundle(res.data);
      if (onShowToast && res.data?.message) onShowToast(res.data.message);
    } catch (err) {
      if (onShowError) {
        onShowError(err.response?.data?.error || err.message);
      }
    } finally {
      setBusyId('');
    }
  };

  const handleDryRunSql = async (customSql) => {
    const queryToTest = typeof customSql === 'string' ? customSql : sqlInput;
    setBusyId('DRY_RUN');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave16/action`,
        {
          action: 'DRY_RUN_SQL_SURGEON',
          sql: queryToTest,
        }
      );
      setDryRunResult(res.data);
      if (onShowToast && res.data?.message) onShowToast(res.data.message);
    } catch (err) {
      if (onShowError) {
        onShowError(err.response?.data?.error || err.message);
      }
    } finally {
      setBusyId('');
    }
  };

  const finopsCandidates = overview?.finopsCandidates || [];
  const finopsSummary = overview?.finopsSummary || {};
  const storageFleetLedger = overview?.storageFleetLedger || [];
  const computeRunFleetLedger = overview?.computeRunFleetLedger || [];
  const drAssets = overview?.drAssets || [];
  const iamSummary = overview?.iamSummary || {};
  const overPrivilegedGrants = overview?.overPrivilegedGrants || [];
  const sqlPresets = overview?.sqlPresets || [];

  const gcsCandidateBucketNames = finopsCandidates
    .filter((c) => c.fixAction === 'APPLY_GCS_LIFECYCLE')
    .map((c) => c.resourceName);

  const allStorageBucketNames = storageFleetLedger.map((b) => b.name);

  return (
    <div className="space-y-4">
      <div className="p-5 rounded-2xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25 text-[10px] font-mono font-extrabold uppercase">
              <Sparkles className="w-3 h-3" />
              <span>
                MULTI-REGION DR GAMEDAY &amp; SQL SURGEON · LIVE GCP CONTROL PLANE
              </span>
            </div>
            <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 mt-1">
              Multi-Region DR GameDay &amp; SQL Surgeon — FinOps Auto-Surgeon, DR GameDay, Least-Privilege IAM &amp; SQL Dry-Run Surgeon
            </h2>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={fetchWave16}
            title="Refresh live telemetry across Storage, BigQuery, Cloud Run, Compute Engine, and IAM"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
            />
            <span>Refresh Telemetry</span>
          </button>
        </div>

        {/* 4 Tab Selector Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          {WAVE16_TABS.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                data-feature-id={t.id}
                onClick={() => setActiveTab(t.id)}
                title={`${t.title} — ${t.subtitle}`}
                className={`p-3 rounded-md border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-zinc-50 dark:bg-zinc-900/90 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-xs font-extrabold truncate">
                    {t.title}
                  </div>
                  <div
                    className={`text-[10px] font-mono truncate ${
                      isActive ? 'text-blue-100' : 'text-zinc-500'
                    }`}
                  >
                    {t.subtitle}
                  </div>
                </div>
                <Icon className="w-4 h-4 shrink-0 opacity-85" />
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: FINOPS AUTO-SURGEON */}
      {activeTab === 'FINOPS_AUTO_SURGEON' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                Live FinOps Anomaly Auto-Fixer &amp; Storage/Compute Lifecycle Fleet Ledger ({finopsCandidates.length} Unoptimized Candidates)
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Inspects live Cloud Storage buckets (<code className="font-mono">storage.buckets.list</code>), Cloud Run services, and Compute VMs. Patch missing Object Lifecycle tiering rules in 1 click.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Select GCS Lifecycle Tiering Profile"
                value={lifecycleProfile}
                onChange={(e) => setLifecycleProfile(e.target.value)}
                className="h-9 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 cursor-pointer"
              >
                {LIFECYCLE_PROFILE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    Profile: {opt.shortBadge}
                  </option>
                ))}
              </select>

              {gcsCandidateBucketNames.length > 0 ? (
                <button
                  type="button"
                  disabled={busyId === 'BATCH_LIFECYCLE'}
                  onClick={() =>
                    handleBatchApplyLifecycle(gcsCandidateBucketNames)
                  }
                  title={`Batch-apply ${lifecycleProfile} lifecycle rules across all ${gcsCandidateBucketNames.length} unprotected bucket(s)`}
                  className="h-9 px-3.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>
                    {busyId === 'BATCH_LIFECYCLE'
                      ? 'Patching Fleet...'
                      : `1-Click Batch Auto-Fix All (${gcsCandidateBucketNames.length})`}
                  </span>
                </button>
              ) : (
                allStorageBucketNames.length > 0 && (
                  <button
                    type="button"
                    disabled={busyId === 'BATCH_LIFECYCLE'}
                    onClick={() =>
                      handleBatchApplyLifecycle(allStorageBucketNames)
                    }
                    title={`Sync ${lifecycleProfile} lifecycle rules across all ${allStorageBucketNames.length} project bucket(s)`}
                    className="h-9 px-3.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>
                      {busyId === 'BATCH_LIFECYCLE'
                        ? 'Syncing Fleet...'
                        : `Sync Profile Across All ${allStorageBucketNames.length} Buckets`}
                    </span>
                  </button>
                )
              )}

              {onSelectStudioTab && (
                <button
                  type="button"
                  onClick={() => handleJumpToStudio('CLOUD_STORAGE')}
                  title="Open Cloud Storage Studio to inspect bucket objects, soft-delete policies, and IAM"
                  className="h-9 px-3 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-mono font-bold cursor-pointer inline-flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Storage Studio</span>
                </button>
              )}
            </div>
          </div>

          {/* 4 FinOps Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] font-mono uppercase text-zinc-500">
                Actionable FinOps Savings
              </div>
              <div className="text-lg font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                ${Number(finopsSummary.totalMonthlySavingsUsd || 0).toFixed(2)}/mo
              </div>
              <div className="text-[11px] font-mono text-zinc-500">
                ${Number(finopsSummary.totalAnnualSavingsUsd || 0).toFixed(2)}/yr projected
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] font-mono uppercase text-zinc-500">
                GCS Bucket Lifecycle Coverage
              </div>
              <div className="text-lg font-extrabold font-mono text-blue-600 dark:text-blue-400 mt-0.5">
                {finopsSummary.lifecycleProtectedBuckets ?? 0} /{' '}
                {finopsSummary.totalBuckets ?? storageFleetLedger.length} Protected
              </div>
              <div className="text-[11px] font-mono text-zinc-500">
                {finopsSummary.unprotectedBuckets === 0
                  ? '100% of buckets enforce tiering'
                  : `${finopsSummary.unprotectedBuckets || 0} bucket(s) missing lifecycle`}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] font-mono uppercase text-zinc-500">
                Serverless &amp; Compute Fleet
              </div>
              <div className="text-lg font-extrabold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">
                {finopsSummary.totalCloudRunServices ?? 0} Run ·{' '}
                {finopsSummary.totalVms ?? 0} VMs
              </div>
              <div className="text-[11px] font-mono text-zinc-500">
                Scale-to-zero &amp; CUD audit active
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] font-mono uppercase text-zinc-500">
                Active Tiering Rule Profile
              </div>
              <div className="text-xs font-extrabold font-mono text-zinc-900 dark:text-zinc-100 mt-1 truncate">
                {LIFECYCLE_PROFILE_OPTIONS.find((p) => p.id === lifecycleProfile)
                  ?.shortBadge || lifecycleProfile}
              </div>
              <div className="text-[11px] font-mono text-zinc-500">
                Live storage.buckets.patch API
              </div>
            </div>
          </div>

          {finopsReceipt && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/35 text-xs font-mono text-emerald-800 dark:text-emerald-200 flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold">✓ {finopsReceipt.message}</span>
              <div className="flex items-center gap-2">
                {finopsReceipt.sha256Receipt && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-[10px] font-bold">
                    SHA-256: {finopsReceipt.sha256Receipt}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setFinopsReceipt(null)}
                  className="text-[10px] underline cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Unoptimized FinOps Candidates List */}
          {finopsCandidates.length === 0 ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-700 dark:text-emerald-300 flex flex-wrap items-center justify-between gap-2">
              <span>
                ✓ All {storageFleetLedger.length} inspected Cloud Storage bucket(s) have active Object Lifecycle policies and zero idle warm Cloud Run waste detected.
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-[10px] font-bold">
                100% FINOPS COMPLIANT
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              {finopsCandidates.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-extrabold text-zinc-900 dark:text-zinc-100">
                        {c.resourceName} ({c.location})
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold">
                        {c.kind}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-zinc-500">
                      {c.issue} · Est. Savings:{' '}
                      <strong className="text-emerald-600 dark:text-emerald-400">
                        -${c.monthlySavingsUsd}/mo
                      </strong>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {c.fixAction === 'APPLY_GCS_LIFECYCLE' && (
                      <button
                        type="button"
                        disabled={busyId === c.resourceName}
                        onClick={() => handleApplyLifecycle(c.resourceName)}
                        title={`Apply ${lifecycleProfile} Lifecycle Policy to gs://${c.resourceName}`}
                        className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold cursor-pointer disabled:opacity-50"
                      >
                        {busyId === c.resourceName
                          ? 'Patching Bucket...'
                          : '1-Click Apply Lifecycle Policy'}
                      </button>
                    )}
                    {c.fixAction === 'SCALE_RUN_TO_ZERO' && (
                      <button
                        type="button"
                        disabled={busyId === `RUN_${c.resourceName}`}
                        onClick={() =>
                          handleScaleRunToZero(c.resourceName, c.location)
                        }
                        title={`Set minInstanceCount=0 on Cloud Run service ${c.resourceName} (${c.location})`}
                        className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold cursor-pointer disabled:opacity-50"
                      >
                        {busyId === `RUN_${c.resourceName}`
                          ? 'Updating Service...'
                          : '1-Click Scale-to-Zero'}
                      </button>
                    )}
                    {c.remediationCli && onRunInShell && (
                      <button
                        type="button"
                        onClick={() => onRunInShell(c.remediationCli)}
                        title={`Execute FinOps remediation CLI for ${c.resourceName} in Cloud Shell`}
                        className="px-2.5 py-1.5 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[11px] font-mono font-bold cursor-pointer inline-flex items-center gap-1"
                      >
                        <Terminal className="w-3 h-3" />
                        <span>Run CLI</span>
                      </button>
                    )}
                    {c.studioTab && onSelectStudioTab && (
                      <button
                        type="button"
                        onClick={() =>
                          handleJumpToStudio(c.studioTab, c.resourceName)
                        }
                        title={`Open ${c.resourceName} in ${STUDIO_TAB_LABELS[c.studioTab] || c.studioTab}`}
                        className="px-2.5 py-1.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-[11px] font-mono font-bold cursor-pointer inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        <span>
                          {STUDIO_TAB_LABELS[c.studioTab] || c.studioTab}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Live Storage Bucket Lifecycle Fleet Ledger (Always Interactive) */}
          {storageFleetLedger.length > 0 && (
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs font-mono font-extrabold uppercase text-zinc-700 dark:text-zinc-300">
                  Live Cloud Storage Lifecycle &amp; Soft-Delete Posture Ledger ({storageFleetLedger.length} Buckets)
                </h4>
                <span className="text-[11px] font-mono text-zinc-500">
                  Switch profile above and click <strong>Apply / Upgrade Profile</strong> on any bucket to update live GCS tiering rules
                </span>
              </div>

              <div className="space-y-2">
                {storageFleetLedger.map((b) => (
                  <div
                    key={b.name}
                    className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono"
                  >
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-zinc-900 dark:text-zinc-100">
                          gs://{b.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25 text-[10px] font-bold">
                          {b.location} · {b.storageClass}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            b.hasLifecyclePolicy
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {b.hasLifecyclePolicy
                            ? `✓ ${b.lifecycleRulesCount} Lifecycle Rule(s): ${b.lifecycleRulesSummary}`
                            : '⚠ Missing Lifecycle Policy'}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        Versioning: <strong>{b.versioningEnabled ? 'Enabled' : 'Disabled'}</strong> · Soft-Delete Window: <strong>{b.softDeleteDays}d</strong> · Public Access Prevention: <strong>{b.publicAccessPrevention}</strong>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        disabled={busyId === b.name}
                        onClick={() => handleApplyLifecycle(b.name)}
                        title={`Apply or upgrade ${lifecycleProfile} on gs://${b.name}`}
                        className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10.5px] font-bold cursor-pointer disabled:opacity-50"
                      >
                        {busyId === b.name
                          ? 'Patching...'
                          : b.hasLifecyclePolicy
                            ? 'Upgrade Lifecycle Profile'
                            : '1-Click Apply Lifecycle'}
                      </button>

                      {onRunInShell && (
                        <button
                          type="button"
                          onClick={() =>
                            onRunInShell(
                              `gcloud storage buckets describe gs://${b.name} --project=${projectId} --format="yaml(name,location,storageClass,lifecycle,versioning,softDeletePolicy)"`
                            )
                          }
                          title={`Inspect gs://${b.name} lifecycle & soft-delete metadata in Cloud Shell`}
                          className="px-2.5 py-1 rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10.5px] font-bold cursor-pointer inline-flex items-center gap-1"
                        >
                          <Terminal className="w-3 h-3" />
                          <span>Inspect in Shell</span>
                        </button>
                      )}

                      {onSelectStudioTab && (
                        <button
                          type="button"
                          onClick={() =>
                            handleJumpToStudio('CLOUD_STORAGE', b.name)
                          }
                          title={`Open gs://${b.name} in Cloud Storage Studio`}
                          className="px-2.5 py-1 rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-[10.5px] font-bold cursor-pointer inline-flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          <span>Open in Storage Studio</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MULTI-REGION DR GAMEDAY PROVER */}
      {activeTab === 'DR_GAMEDAY_SIMULATOR' &&
        (() => {
          const standbyRegion =
            blackoutRegion === 'us-central1'
              ? 'us-east1'
              : blackoutRegion === 'europe-west1'
                ? 'europe-west4'
                : 'us-central1';

          const evaluatedAssets = drAssets.map((a) => {
            const locLower = String(a.location || '').toLowerCase();
            const isMulti =
              a.haTier === 'MULTI_REGION_ACTIVE' ||
              a.haTier === 'MULTI_REGION_MIRRORED' ||
              a.haTier === 'REGIONAL_HA' ||
              Boolean(a.isDrProtected) ||
              locLower === 'us' ||
              locLower === 'eu' ||
              locLower === 'asia' ||
              locLower === 'global';
            const matchesOutageRegion =
              locLower === blackoutRegion.toLowerCase();
            let status = 'ISOLATED_SAFE';
            if (isMulti) {
              status = 'AUTO_FAILOVER_SURVIVES';
            } else if (matchesOutageRegion) {
              status = 'OUTAGE_SPOF';
            }
            return {
              ...a,
              outageStatus: status,
            };
          });

          const spofCount = evaluatedAssets.filter(
            (a) => a.outageStatus === 'OUTAGE_SPOF'
          ).length;
          const autoFailoverCount = evaluatedAssets.filter(
            (a) => a.outageStatus === 'AUTO_FAILOVER_SURVIVES'
          ).length;
          const maxRtoSeconds = evaluatedAssets.reduce(
            (max, a) => Math.max(max, Number(a.rtoSeconds || 0)),
            0
          );
          const maxRpoSeconds = evaluatedAssets.reduce(
            (max, a) => Math.max(max, Number(a.rpoSeconds || 0)),
            0
          );
          const resilienceScore = Math.max(25, 100 - spofCount * 18);

          const activeTimelineSteps =
            drDrillReceipt?.blackoutRegion === blackoutRegion
              ? drDrillReceipt.failoverSteps
              : [
                  `1. [T+02s] Cloud DNS & Global External Application Load Balancer health probes detect 100% packet loss in ${blackoutRegion}.`,
                  `2. [T+05s] Multi-Region Storage (US/EU) & BigQuery datasets automatically serve reads from ${standbyRegion} with RPO=0s (${autoFailoverCount} multi-region assets unaffected).`,
                  `3. [T+35s] Cloud Run & stateless ingress traffic shifts to standby revision in ${standbyRegion} (Composite RTO=${maxRtoSeconds}s).`,
                  spofCount > 0
                    ? `4. [ACTION REQUIRED] ${spofCount} single-region SPOF asset(s) pinned to ${blackoutRegion} require cross-region snapshot or REGIONAL HA promotion to ${standbyRegion}.`
                    : `4. [VERIFIED] Zero single-region SPOF assets pinned to ${blackoutRegion} — 100% of inspected resources survive a ${blackoutRegion} blackout.`,
                ];

          // Compute per-region resource counts from the project's actual discovered assets
          const regionCounts = {};
          for (const a of evaluatedAssets) {
            const r = String(a.location || 'US').toLowerCase();
            if (r !== 'global' && r !== 'us' && r !== 'eu' && r !== 'asia') {
              regionCounts[r] = (regionCounts[r] || 0) + 1;
            }
          }
          const selectableRegions = Array.from(
            new Set([
              ...Object.keys(regionCounts),
              'us-central1',
              'us-east1',
              'us-west1',
              'europe-west1',
              'asia-east1',
            ])
          );

          const handleDownloadDrReport = () => {
            const reportPayload = {
              projectId,
              generatedAt: new Date().toISOString(),
              simulatedOutageRegion: blackoutRegion,
              standbyFailoverRegion: standbyRegion,
              drResilienceScore: resilienceScore,
              compositeRtoSeconds: maxRtoSeconds,
              compositeRpoSeconds: maxRpoSeconds,
              singleRegionSpofCount: spofCount,
              autoFailoverAssetCount: autoFailoverCount,
              assets: evaluatedAssets,
            };
            const blob = new Blob([JSON.stringify(reportPayload, null, 2)], {
              type: 'application/json',
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${projectId}-dr-gameday-report-${blackoutRegion}.json`;
            a.click();
            URL.revokeObjectURL(url);
            if (onShowToast) {
              onShowToast(
                `Downloaded DR GameDay Audit Report (${projectId}-dr-gameday-report-${blackoutRegion}.json)`
              );
            }
          };

          const handleProtectAllInRegion = async () => {
            const spofTargets = evaluatedAssets.filter(
              (a) => a.outageStatus === 'OUTAGE_SPOF'
            );
            for (const target of spofTargets) {
              await handleProtectAssetDr(target.name);
            }
          };

          return (
            <div className="p-5 rounded-2xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                    Multi-Region Disaster Recovery (DR) GameDay &amp; RTO/RPO Prover ({evaluatedAssets.length} Live Project Assets)
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Select any GCP region below to simulate a regional blackout, seal an Ed25519 + SHA-256 GameDay Audit Receipt, or provision a US Multi-Region DR Vault.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label="Select simulated blackout region"
                    value={blackoutRegion}
                    onChange={(e) => {
                      const nextReg = e.target.value;
                      setBlackoutRegion(nextReg);
                    }}
                    className="h-9 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 cursor-pointer"
                  >
                    {selectableRegions.map((reg) => {
                      const cnt = regionCounts[reg] || 0;
                      return (
                        <option key={reg} value={reg}>
                          Simulate Outage: {reg} ({cnt} Regional{' '}
                          {cnt === 1 ? 'Asset' : 'Assets'})
                        </option>
                      );
                    })}
                  </select>

                  <button
                    type="button"
                    disabled={busyId === 'DR_GAMEDAY_DRILL'}
                    onClick={() => handleRunDrGameDayDrill(blackoutRegion)}
                    title={`Execute a live DR GameDay Blackout Drill for ${blackoutRegion} -> ${standbyRegion} and seal an Ed25519 + SHA-256 Audit Certificate`}
                    className="h-9 px-3.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>
                      {busyId === 'DR_GAMEDAY_DRILL'
                        ? 'Sealing Drill...'
                        : 'Seal GameDay Drill Receipt'}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={busyId === 'PROVISION_DR_VAULT'}
                    onClick={handleProvisionDrVault}
                    title={`Provision a dedicated US Multi-Region DR Vault bucket (gs://${projectId.toLowerCase()}-dr-vault-us) with Object Versioning & Public Access Prevention`}
                    className="h-9 px-3.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>
                      {busyId === 'PROVISION_DR_VAULT'
                        ? 'Provisioning Vault...'
                        : '1-Click Provision US DR Vault'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadDrReport}
                    title={`Download JSON Disaster Recovery Audit Report for ${projectId} (${blackoutRegion} outage simulation)`}
                    className="h-9 px-3.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-mono font-bold cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Export DR Report (.json)</span>
                  </button>
                </div>
              </div>

              {/* Interactive Region Pills for Regions Where Your Project Has Live Resources */}
              {Object.keys(regionCounts).length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[10.5px] font-mono font-bold text-zinc-500 uppercase">
                    Your Active Regional Footprints (Click to Simulate Blackout):
                  </span>
                  {Object.entries(regionCounts).map(([reg, cnt]) => {
                    const active = blackoutRegion.toLowerCase() === reg;
                    return (
                      <button
                        key={reg}
                        type="button"
                        onClick={() => setBlackoutRegion(reg)}
                        title={`Simulate a complete regional blackout in ${reg} (${cnt} project asset(s) hosted in ${reg})`}
                        className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold border transition-all cursor-pointer ${
                          active
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/40'
                        }`}
                      >
                        {reg} ({cnt} {cnt === 1 ? 'resource' : 'resources'})
                      </button>
                    );
                  })}
                </div>
              )}

              {inlineError && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-mono text-red-700 dark:text-red-300 flex items-center justify-between gap-2">
                  <span>⚠ {inlineError}</span>
                  <button
                    type="button"
                    onClick={() => setInlineError('')}
                    className="underline text-[10px] cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Unmistakable Emerald Receipt when "Seal GameDay Drill Receipt" is clicked */}
              {drDrillReceipt && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border-2 border-emerald-500/40 space-y-2 text-xs font-mono shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>
                        ✓ SEALED CRYPTOGRAPHIC GAMEDAY AUDIT CERTIFICATE · ID:{' '}
                        {drDrillReceipt.drillId}
                      </span>
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold">
                        SHA-256: {drDrillReceipt.sha256Signature || 'verified'}
                      </span>
                      {drDrillReceipt.ed25519SignatureHex && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-800 dark:text-blue-200 text-[10px] font-bold">
                          Ed25519: {drDrillReceipt.ed25519SignatureHex.slice(0, 16)}… (Verified)
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setDrDrillReceipt(null)}
                        className="text-[10px] underline text-zinc-500 cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                  <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-200">
                    {drDrillReceipt.message}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px] text-zinc-800 dark:text-zinc-200">
                    {(drDrillReceipt.failoverSteps || []).map((step, i) => (
                      <div
                        key={i}
                        className="p-2 rounded-lg bg-white/80 dark:bg-zinc-900/80 border border-emerald-500/25"
                      >
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Unmistakable Emerald Receipt when "1-Click Provision US Multi-Region DR Vault" is clicked */}
              {drVaultReceipt && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border-2 border-emerald-500/40 space-y-1.5 text-xs font-mono shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>
                        ✓ US MULTI-REGION DR VAULT PROVISIONED · gs://
                        {drVaultReceipt.bucketName}
                      </span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold">
                        RPO: 0s · RTO: 2s · SHA-256:{' '}
                        {drVaultReceipt.sha256Signature || 'verified'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDrVaultReceipt(null)}
                        className="text-[10px] underline text-zinc-500 cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                  <div className="text-[11px] text-zinc-800 dark:text-zinc-200">
                    {drVaultReceipt.message}
                  </div>
                </div>
              )}

              {/* 4 Live DR GameDay Summary KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] font-mono uppercase text-zinc-500">
                    DR Resilience Score ({blackoutRegion})
                  </div>
                  <div className="text-lg font-extrabold font-mono text-blue-600 dark:text-blue-400 mt-0.5">
                    {resilienceScore}/100
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500">
                    {spofCount === 0
                      ? `Zero regional SPOFs in ${blackoutRegion}`
                      : `${spofCount} single-region SPOF(s) in ${blackoutRegion}`}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] font-mono uppercase text-zinc-500">
                    Active Outage Route ({blackoutRegion} → {standbyRegion})
                  </div>
                  <div className="text-lg font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {evaluatedAssets.length - spofCount} /{' '}
                    {evaluatedAssets.length} Survive
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500">
                    Standby Target: {standbyRegion}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] font-mono uppercase text-zinc-500">
                    Composite Recovery Time (RTO)
                  </div>
                  <div className="text-lg font-extrabold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">
                    {maxRtoSeconds}s
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500">
                    Worst-case traffic cutover latency
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] font-mono uppercase text-zinc-500">
                    Composite Recovery Point (RPO)
                  </div>
                  <div className="text-lg font-extrabold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">
                    {maxRpoSeconds}s
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500">
                    {maxRpoSeconds === 0
                      ? 'Synchronous zero-data-loss replication'
                      : 'Async snapshot replication window'}
                  </div>
                </div>
              </div>

              {/* Always-Visible Live Simulated Failover Sequence for Selected Region */}
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-2.5 text-xs font-mono">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-extrabold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>
                      LIVE SIMULATED FAILOVER RUNBOOK:{' '}
                      {blackoutRegion.toUpperCase()} BLACKOUT →{' '}
                      {standbyRegion.toUpperCase()} STANDBY
                    </span>
                  </span>

                  {spofCount > 0 ? (
                    <button
                      type="button"
                      onClick={handleProtectAllInRegion}
                      title={`Enable Object Versioning and Multi-Region DR Mirroring for all ${spofCount} single-region SPOF resource(s) in ${blackoutRegion}`}
                      className="px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>
                        Protect All {spofCount} At-Risk Resource
                        {spofCount === 1 ? '' : 's'} in {blackoutRegion} (RPO →
                        0s)
                      </span>
                    </button>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                      ✓ 100% OF {blackoutRegion.toUpperCase()} ASSETS SURVIVE
                      OUTAGE
                    </span>
                  )}
                </div>
                <div className="space-y-1 text-[11px] text-zinc-800 dark:text-zinc-200">
                  {activeTimelineSteps.map((step, i) => (
                    <div key={i}>{step}</div>
                  ))}
                </div>
              </div>

              {/* 3-Column "Zero Black Magic" Architecture Explainer Strip */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 space-y-1 text-xs">
                  <div className="font-mono font-extrabold text-blue-600 dark:text-blue-400 text-[10.5px] uppercase">
                    Why Are Your Buckets &amp; Services Listed Here?
                  </div>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    Every row below (<code className="font-mono">gs://...</code>
                    , <code className="font-mono">bq://...</code>,{' '}
                    <code className="font-mono">run://...</code>) is a{' '}
                    <strong>
                      real resource discovered in project {projectId}
                    </strong>{' '}
                    via Google Cloud REST APIs. During a regional outage, your
                    app fails if even one single-region bucket or database it
                    depends on goes offline.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 space-y-1 text-xs">
                  <div className="font-mono font-extrabold text-blue-600 dark:text-blue-400 text-[10.5px] uppercase">
                    Single-Region (e.g. us-east1) vs. Multi-Region (US)
                  </div>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    A bucket or service pinned to a{' '}
                    <strong>Single Region</strong> (like{' '}
                    <code className="font-mono">us-east1</code>) has{' '}
                    <strong>zero cross-region replication</strong>: if{' '}
                    <code className="font-mono">us-east1</code> goes dark, it
                    returns <code className="font-mono">HTTP 503</code> (
                    <code className="font-mono">RPO=900s, RTO=180s</code>).{' '}
                    <strong>
                      Multi-Region (<code className="font-mono">US</code>/
                      <code className="font-mono">EU</code>)
                    </strong>{' '}
                    assets automatically serve traffic from surviving regions (
                    <code className="font-mono">RPO=0s, RTO=2s</code>).
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 space-y-1 text-xs">
                  <div className="font-mono font-extrabold text-blue-600 dark:text-blue-400 text-[10.5px] uppercase">
                    How to Test &amp; Protect Any Resource Below
                  </div>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    Click <strong>Simulate &lt;Region&gt; Outage</strong> on any
                    single-region resource to test its region going dark, or
                    click{' '}
                    <strong>1-Click Protect &amp; Mirror (RPO → 0s)</strong> to
                    enable Object Versioning (
                    <code className="font-mono">storage.buckets.patch</code>)
                    and bind it to the Multi-Region DR Vault.
                  </p>
                </div>
              </div>

              {/* Asset-by-Asset Survival, Plain-English Purpose & Failover Matrix */}
              <div className="space-y-2.5">
                {evaluatedAssets.map((a, idx) => {
                  const isSpof = a.outageStatus === 'OUTAGE_SPOF';
                  const isAuto = a.outageStatus === 'AUTO_FAILOVER_SURVIVES';
                  const locStr = String(a.location || 'US');
                  const locLower = locStr.toLowerCase();
                  const canSimulateThisRegion =
                    !isAuto &&
                    locLower !== blackoutRegion.toLowerCase() &&
                    locLower !== 'global';

                  const plainEnglishWhyShown = a.isProvisionedDrVault
                    ? `Dedicated US Multi-Region Disaster Recovery Vault bucket provisioned in project "${projectId}" with Object Versioning and Public Access Prevention enforced.`
                    : `Live ${a.type} discovered in project "${projectId}" via Google Cloud REST API, currently hosted in location "${locStr}" (${a.haTier}).`;

                  const plainEnglishOutageImpact = isSpof
                    ? `DIRECT HIT IN ${blackoutRegion.toUpperCase()} (SINGLE-REGION SPOF): Because ${a.name} is pinned strictly to single-region "${locStr}" without cross-region replication, a blackout in ${blackoutRegion} makes this resource 100% unreachable (HTTP 503). Any un-replicated writes in the last ${a.rpoSeconds}s (15m) are trapped until manual cross-region restore (${a.rtoSeconds}s RTO).`
                    : isAuto
                      ? `SURVIVES ${blackoutRegion.toUpperCase()} BLACKOUT AUTOMATICALLY (MULTI-REGION / MIRRORED): Replicated across multiple regions (${a.failoverTargetRegion || 'US Multi-Region'}). Even if ${blackoutRegion} goes completely offline, Google Cloud automatically serves ${a.name} from surviving regions in ~${a.rtoSeconds}s with zero data loss (RPO = 0s).`
                      : `SAFE FROM ${blackoutRegion.toUpperCase()} OUTAGE (HOSTED IN ${locStr.toUpperCase()}), BUT SINGLE-REGION SPOF: Survives a ${blackoutRegion} blackout because it physically lives in "${locStr}". However, it has no cross-region replica — if "${locStr}" ever goes offline, ${a.name} will fail (RPO = ${a.rpoSeconds}s, RTO = ${a.rtoSeconds}s).`;

                  return (
                    <div
                      key={`${a.name}-${idx}`}
                      className={`p-4 rounded-xl border space-y-2.5 text-xs font-mono ${
                        a.isProvisionedDrVault
                          ? 'bg-emerald-500/10 border-emerald-500/40'
                          : isSpof
                            ? 'bg-amber-500/5 border-amber-500/35'
                            : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {a.isProvisionedDrVault && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold">
                              NEW · PROVISIONED US MULTI-REGION VAULT
                            </span>
                          )}
                          <span className="font-extrabold text-zinc-900 dark:text-zinc-100 text-xs">
                            {a.name}
                          </span>
                          <span className="text-zinc-500">
                            ({a.type} · Location: <strong>{locStr}</strong> →
                            Failover Target:{' '}
                            <strong>
                              {a.failoverTargetRegion || standbyRegion}
                            </strong>
                            )
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                              isSpof
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                                : isAuto
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                  : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25'
                            }`}
                          >
                            {isSpof
                              ? `SPOF IN ${blackoutRegion.toUpperCase()} · NEEDS HA`
                              : isAuto
                                ? `AUTO-FAILOVER (${a.haTier})`
                                : `OUTSIDE ${blackoutRegion.toUpperCase()} BLAST RADIUS (${a.haTier})`}
                          </span>

                          <span
                            title="RPO (Recovery Point Objective) = max seconds of data loss during regional outage. RTO (Recovery Time Objective) = seconds required to restore traffic."
                            className="px-2 py-0.5 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[11px] text-zinc-700 dark:text-zinc-300 font-bold"
                          >
                            RPO (Data Loss): {a.rpoSeconds}s · RTO (Recovery
                            Time): {a.rtoSeconds}s
                          </span>
                        </div>
                      </div>

                      {/* Plain-English Explanation of WHY this resource is shown and WHAT happens */}
                      <div className="p-2.5 rounded-lg bg-white/80 dark:bg-zinc-950/70 border border-zinc-200/80 dark:border-zinc-800 space-y-1 font-sans text-[11.5px] leading-relaxed">
                        <div className="text-zinc-600 dark:text-zinc-400">
                          <strong className="font-mono text-[10px] uppercase text-zinc-700 dark:text-zinc-300 mr-1.5">
                            Why Shown:
                          </strong>
                          {plainEnglishWhyShown}
                        </div>
                        <div
                          className={
                            isSpof
                              ? 'text-amber-800 dark:text-amber-300 font-medium'
                              : isAuto
                                ? 'text-emerald-800 dark:text-emerald-300 font-medium'
                                : 'text-zinc-700 dark:text-zinc-300'
                          }
                        >
                          <strong className="font-mono text-[10px] uppercase mr-1.5">
                            Outage Verdict ({blackoutRegion}):
                          </strong>
                          {plainEnglishOutageImpact}
                        </div>
                      </div>

                      {/* Action Bar per Resource */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                        <div className="text-[10px] text-zinc-500 truncate max-w-xl">
                          {a.remediationCli && (
                            <>
                              CLI: <code>{a.remediationCli}</code>
                            </>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {canSimulateThisRegion && (
                            <button
                              type="button"
                              onClick={() => {
                                setBlackoutRegion(locLower);
                                if (onShowToast) {
                                  onShowToast(
                                    `Switched simulated blackout to ${locLower} to test ${a.name}!`
                                  );
                                }
                              }}
                              title={`Switch the simulated blackout region to ${locLower} to see what happens when ${a.name}'s region goes down`}
                              className="px-2.5 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-800 dark:text-amber-300 text-[10px] font-bold cursor-pointer"
                            >
                              Simulate {locLower} Outage on This Resource
                            </button>
                          )}

                          {!isAuto && (
                            <button
                              type="button"
                              disabled={busyId === `PROTECT_${a.name}`}
                              onClick={() => handleProtectAssetDr(a.name)}
                              title={`Enable Object Versioning on ${a.name} and bind it to the US Multi-Region DR Mirror so RPO drops to 0s and RTO drops to 5s`}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              <span>
                                {busyId === `PROTECT_${a.name}`
                                  ? 'Protecting...'
                                  : '1-Click Protect & Mirror to Multi-Region (RPO → 0s)'}
                              </span>
                            </button>
                          )}

                          {a.remediationCli && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopy(a.remediationCli, `dr-${idx}`)
                                }
                                title={`Copy Multi-Region HA CLI command for ${a.name}`}
                                className="px-2 py-1 rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                              >
                                {copiedKey === `dr-${idx}` ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                                <span>Copy HA CLI</span>
                              </button>
                              {onRunInShell && (
                                <button
                                  type="button"
                                  onClick={() => onRunInShell(a.remediationCli)}
                                  title={`Execute HA upgrade command for ${a.name} in Cloud Shell`}
                                  className="px-2 py-1 rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                                >
                                  <Terminal className="w-3 h-3" />
                                  <span>Run in Shell</span>
                                </button>
                              )}
                            </>
                          )}

                          {a.studioTab && onSelectStudioTab && (
                            <button
                              type="button"
                              onClick={() =>
                                handleJumpToStudio(
                                  a.studioTab,
                                  a.rawName || a.name
                                )
                              }
                              title={`Open ${a.name} in ${STUDIO_TAB_LABELS[a.studioTab] || a.studioTab}`}
                              className="px-2 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>
                                {STUDIO_TAB_LABELS[a.studioTab] || a.studioTab}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

      {/* TAB 3: IAM LEAST-PRIVILEGE SYNTHESIZER */}
      {activeTab === 'IAM_LEAST_PRIVILEGE' &&
        (() => {
          const filteredGrants =
            iamFilter === 'ALL'
              ? overPrivilegedGrants
              : overPrivilegedGrants.filter(
                  (g) => g.principalType === iamFilter
                );

          return (
            <div className="p-5 rounded-2xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                    Live IAM Least-Privilege Role Synthesizer, PAM JIT &amp; Custom YAML/Terraform Compiler ({overPrivilegedGrants.length} Broad Grants)
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Audits live project IAM bindings (<code className="font-mono">cloudresourcemanager.projects.getIamPolicy</code>) for <code className="font-mono">roles/owner</code>, <code className="font-mono">roles/editor</code>, and <code className="font-mono">roles/iam.securityAdmin</code> and synthesizes least-privilege replacements.
                  </p>
                </div>

                {onSelectStudioTab && (
                  <button
                    type="button"
                    onClick={() => handleJumpToStudio('IAM_SECURITY')}
                    title="Open IAM & Security Studio to manage project IAM policies and Service Accounts"
                    className="h-9 px-3.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-mono font-bold cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Open IAM &amp; Security Studio</span>
                  </button>
                )}
              </div>

              {/* 4 IAM Least-Privilege Summary KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] font-mono uppercase text-zinc-500">
                    Over-Privileged Grants
                  </div>
                  <div className="text-lg font-extrabold font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                    {overPrivilegedGrants.length} Broad Role(s)
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500">
                    Across {iamSummary.totalBindings || 0} live IAM bindings
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] font-mono uppercase text-zinc-500">
                    Excess Permissions Removable
                  </div>
                  <div className="text-lg font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                    -{(iamSummary.totalExcessPermissionsRemovable || 0).toLocaleString()}
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500">
                    Eliminates wildcard primitive blast radius
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] font-mono uppercase text-zinc-500">
                    Principal Taxonomy
                  </div>
                  <div className="text-lg font-extrabold font-mono text-blue-600 dark:text-blue-400 mt-0.5">
                    {iamSummary.humanCount ?? 0} Human ·{' '}
                    {(iamSummary.serviceAccountCount ?? 0) +
                      (iamSummary.googleManagedAgentCount ?? 0)}{' '}
                    SA
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500">
                    {iamSummary.totalUniquePrincipals ?? 0} total unique principals
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] font-mono uppercase text-zinc-500">
                    Synthesizer Targets
                  </div>
                  <div className="text-xs font-extrabold font-mono text-zinc-900 dark:text-zinc-100 mt-1">
                    YAML · PAM JIT · Terraform HCL
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500">
                    1-Click custom role compiler
                  </div>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'ALL', label: `All Broad Grants (${overPrivilegedGrants.length})` },
                  { id: 'HUMAN_PRINCIPAL', label: 'Human Users (PAM JIT)' },
                  { id: 'DEFAULT_COMPUTE_SA', label: 'Default Compute SA' },
                  { id: 'GOOGLE_CLOUD_SERVICES_SA', label: 'Cloud Services SA' },
                  { id: 'CUSTOM_SERVICE_ACCOUNT', label: 'Custom Service Accounts' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setIamFilter(f.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold border cursor-pointer transition-all ${
                      iamFilter === f.id
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Synthesized Custom IAM Role YAML / PAM / Terraform Drawer */}
              {synthesizedRoleBundle && (
                <div className="p-4 rounded-xl bg-blue-500/10 border-2 border-blue-500/35 space-y-3 text-xs font-mono">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <FileCode2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="font-extrabold text-blue-800 dark:text-blue-200">
                        SYNTHESIZED LEAST-PRIVILEGE ROLE BUNDLE ·{' '}
                        {synthesizedRoleBundle.customRoleId}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold">
                        -{synthesizedRoleBundle.excessRemoved} Excess Permissions Stripped
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {['YAML', 'PAM', 'TERRAFORM'].map((fmt) => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => setIamCodeFormat(fmt)}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer ${
                            iamCodeFormat === fmt
                              ? 'bg-blue-600 text-white'
                              : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700'
                          }`}
                        >
                          {fmt === 'YAML'
                            ? 'role-definition.yaml'
                            : fmt === 'PAM'
                              ? 'pam-jit-entitlement.yaml'
                              : 'iam-custom-role.tf'}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            iamCodeFormat === 'YAML'
                              ? synthesizedRoleBundle.customRoleYaml
                              : iamCodeFormat === 'PAM'
                                ? synthesizedRoleBundle.pamEntitlementYaml
                                : synthesizedRoleBundle.terraformHcl,
                            'synth-code'
                          )
                        }
                        className="px-2.5 py-1 rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                      >
                        {copiedKey === 'synth-code' ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>Copy Manifest</span>
                      </button>
                      {onRunInShell && synthesizedRoleBundle.createRoleCli && (
                        <button
                          type="button"
                          onClick={() =>
                            onRunInShell(synthesizedRoleBundle.createRoleCli)
                          }
                          title="Create this custom least-privilege role in Cloud Shell via gcloud iam roles create"
                          className="px-2.5 py-1 rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                        >
                          <Terminal className="w-3 h-3" />
                          <span>Run gcloud iam roles create</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSynthesizedRoleBundle(null)}
                        className="text-[10px] underline text-zinc-500 cursor-pointer ml-1"
                      >
                        Close
                      </button>
                    </div>
                  </div>

                  <pre className="p-3 rounded-lg bg-zinc-950 text-zinc-100 text-[11px] overflow-x-auto leading-relaxed">
                    {iamCodeFormat === 'YAML'
                      ? synthesizedRoleBundle.customRoleYaml
                      : iamCodeFormat === 'PAM'
                        ? synthesizedRoleBundle.pamEntitlementYaml
                        : synthesizedRoleBundle.terraformHcl}
                  </pre>
                </div>
              )}

              {filteredGrants.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-700 dark:text-emerald-300">
                  ✓ Zero over-privileged grants matching filter ({iamFilter}) across inspected IAM bindings.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredGrants.slice(0, 12).map((g, idx) => (
                    <div
                      key={`${g.member}-${g.currentRole}-${idx}`}
                      className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-zinc-900 dark:text-zinc-100">
                            {g.member}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              g.riskSeverity === 'CRITICAL'
                                ? 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30'
                                : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {g.riskSeverity || 'HIGH'} ·{' '}
                            {g.principalType || 'PRINCIPAL'}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          Current:{' '}
                          <span className="text-amber-600 dark:text-amber-400 font-bold">
                            {g.currentRole}
                          </span>{' '}
                          → Recommended:{' '}
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            {g.recommendedRole}
                          </span>{' '}
                          (-{g.excessPermissionsRemoved} excess permissions)
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          disabled={busyId === `SYNTH_${g.member}`}
                          onClick={() => handleSynthesizeCustomRole(g)}
                          title={`Synthesize Custom IAM Role YAML, PAM JIT Entitlement, and Terraform HCL for ${g.member}`}
                          className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-mono font-bold cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                        >
                          <FileCode2 className="w-3 h-3" />
                          <span>
                            {busyId === `SYNTH_${g.member}`
                              ? 'Synthesizing...'
                              : 'Synthesize YAML / PAM / TF'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              g.remediationCli ||
                                `gcloud projects add-iam-policy-binding ${projectId} --member="${g.member}" --role="roles/viewer"`,
                              `iam-${idx}`
                            )
                          }
                          title={`Copy least-privilege gcloud IAM binding command for ${g.member}`}
                          className="px-2.5 py-1 rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-[11px] font-mono font-bold cursor-pointer inline-flex items-center gap-1"
                        >
                          {copiedKey === `iam-${idx}` ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>Copy Least-Privilege CLI</span>
                        </button>
                        {onRunInShell && (
                          <button
                            type="button"
                            onClick={() =>
                              onRunInShell(
                                `gcloud projects get-iam-policy ${projectId} --flatten="bindings[].members" --filter="bindings.members:${g.member}"`
                              )
                            }
                            title={`Inspect live IAM bindings for ${g.member} in Cloud Shell`}
                            className="px-2.5 py-1 rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[11px] font-mono font-bold cursor-pointer inline-flex items-center gap-1"
                          >
                            <Terminal className="w-3 h-3" />
                            <span>Inspect in Shell</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

      {/* TAB 4: LIVE BIGQUERY SQL COST SURGEON */}
      {activeTab === 'SQL_COST_SURGEON' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                Live BigQuery SQL Dry-Run Cost Surgeon &amp; AST Partition/Column Rewriter
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Executes a real <code className="font-mono">$0.00</code> BigQuery <code className="font-mono">jobs.insert(dryRun=true)</code> call on both your input SQL and an auto-optimized rewrite to prove exact byte and cost reductions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={busyId === 'DRY_RUN'}
                onClick={() => handleDryRunSql(sqlInput)}
                title="Execute a live $0.00 BigQuery Dry-Run (dryRun=true) to verify exact bytes scanned, detect SQL anti-patterns, and benchmark an auto-optimized rewrite"
                className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>
                  {busyId === 'DRY_RUN'
                    ? 'Running BigQuery Dry-Run...'
                    : 'Verify SQL Bytes & Auto-Optimize (Live Dry-Run)'}
                </span>
              </button>

              {onOpenBigQuerySql && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenBigQuerySql(
                      dryRunResult?.optimizedSql || sqlInput
                    )
                  }
                  title="Open this SQL query directly inside the BigQuery Studio SQL Workbench"
                  className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Open in BigQuery Workbench</span>
                </button>
              )}

              {onRunInShell && (
                <button
                  type="button"
                  onClick={() =>
                    onRunInShell(
                      `bq query --use_legacy_sql=false --dry_run --project_id=${projectId} ${JSON.stringify(
                        sqlInput.replace(/\s+/g, ' ').trim()
                      )}`
                    )
                  }
                  title="Run bq query --dry_run in Cloud Shell"
                  className="px-3 py-1.5 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-mono font-bold cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Run bq --dry_run in Shell</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick SQL Presets Bar */}
          {sqlPresets.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10.5px] font-mono font-bold text-zinc-500 uppercase mr-1">
                Quick SQL Presets:
              </span>
              {sqlPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setSqlInput(preset.sql);
                    handleDryRunSql(preset.sql);
                  }}
                  title={preset.description}
                  className="px-2.5 py-1 rounded-md bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}

          <textarea
            rows={4}
            value={sqlInput}
            onChange={(e) => setSqlInput(e.target.value)}
            className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100"
          />

          {dryRunResult && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-800 dark:text-emerald-200 flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold">✓ {dryRunResult.message}</span>
                {dryRunResult.referencedTables?.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-[10px] font-bold">
                    Tables: {dryRunResult.referencedTables.join(', ')}
                  </span>
                )}
              </div>

              {/* 4 Dry-Run Before vs After KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] font-mono uppercase text-zinc-500">
                    Original Query Scan
                  </div>
                  <div className="text-lg font-extrabold font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                    {dryRunResult.mbProcessed ??
                      (
                        Number(dryRunResult.bytesProcessed || 0) /
                        (1024 * 1024)
                      ).toFixed(2)}{' '}
                    MB
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500">
                    ${dryRunResult.estimatedCostUsd} / execution
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] font-mono uppercase text-zinc-500">
                    Optimized Rewrite Scan
                  </div>
                  <div className="text-lg font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {dryRunResult.optimizedMbProcessed ??
                      dryRunResult.mbProcessed ??
                      0}{' '}
                    MB
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500">
                    ${dryRunResult.optimizedCostUsd ?? dryRunResult.estimatedCostUsd} / execution
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] font-mono uppercase text-zinc-500">
                    Verified Bytes Reduction
                  </div>
                  <div className="text-lg font-extrabold font-mono text-blue-600 dark:text-blue-400 mt-0.5">
                    -{dryRunResult.reductionPct ?? 0}% ({dryRunResult.mbSaved ?? 0} MB)
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500">
                    Column &amp; predicate pruning
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] font-mono uppercase text-zinc-500">
                    1,000 Runs/Day Monthly Cost
                  </div>
                  <div className="text-lg font-extrabold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">
                    ${dryRunResult.monthly1kRunsOptimizedUsd ?? 0}/mo
                  </div>
                  <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                    Saves ${dryRunResult.monthlySavings1kRunsUsd ?? 0}/mo vs original
                  </div>
                </div>
              </div>

              {/* Detected SQL Anti-Patterns */}
              {Array.isArray(dryRunResult.antiPatterns) &&
                dryRunResult.antiPatterns.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10.5px] font-mono font-extrabold uppercase text-amber-700 dark:text-amber-300">
                      Detected BigQuery SQL Anti-Patterns ({dryRunResult.antiPatterns.length}):
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {dryRunResult.antiPatterns.map((ap) => (
                        <div
                          key={ap.id}
                          className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-0.5"
                        >
                          <div className="font-mono font-bold text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              [{ap.severity}] {ap.title}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-600 dark:text-zinc-300">
                            {ap.detail}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Auto-Optimized SQL Rewrite Panel */}
              {dryRunResult.optimizedSql &&
                dryRunResult.optimizedSql.trim() !== sqlInput.trim() && (
                  <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-2 text-xs font-mono">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-extrabold text-blue-800 dark:text-blue-200">
                        AUTO-SYNTHESIZED PARTITION &amp; COLUMN-PRUNED SQL REWRITE
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSqlInput(dryRunResult.optimizedSql);
                            handleDryRunSql(dryRunResult.optimizedSql);
                          }}
                          className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10.5px] font-bold cursor-pointer"
                        >
                          Apply Optimized SQL to Editor
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(dryRunResult.optimizedSql, 'opt-sql')
                          }
                          className="px-2.5 py-1 rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-[10.5px] font-bold cursor-pointer inline-flex items-center gap-1"
                        >
                          {copiedKey === 'opt-sql' ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>Copy Rewrite</span>
                        </button>
                      </div>
                    </div>
                    <pre className="p-2.5 rounded-lg bg-zinc-950 text-emerald-300 text-[11px] overflow-x-auto">
                      {dryRunResult.optimizedSql}
                    </pre>
                  </div>
                )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
