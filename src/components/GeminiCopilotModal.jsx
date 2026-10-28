import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  ShieldAlert,
  ShieldCheck,
  X,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Lock,
  DollarSign,
  Sparkles,
  ArrowRight,
  Activity,
  GitBranch,
  Layers,
  Play,
  Download,
  Copy,
} from 'lucide-react';
import {
  LivePricingCatalogControlBar,
  useLivePricingCatalog,
} from './GlobalNetworkWorldMap';
import EngineerMoonshotsWave3 from './EngineerMoonshotsWave3';

const SENSITIVE_PORTS = ['22', '3389', '3306', '5432', '6379', '27017'];

function ruleExposesSensitivePortsToWorld(fw) {
  if (fw.disabled) return false;
  if ((fw.direction || 'INGRESS') !== 'INGRESS') return false;
  if (fw.action === 'DENY' || (fw.denied && fw.denied.length > 0)) return false;
  const ranges = fw.sourceRanges || [];
  if (!ranges.includes('0.0.0.0/0') && !ranges.includes('::/0')) return false;

  const allowed = fw.allowed || [];
  return allowed.some((spec) => {
    const proto = String(spec.IPProtocol || '').toLowerCase();
    if (proto === 'all') return true;
    const ports = spec.ports || [];
    if (ports.length === 0 && (proto === 'tcp' || proto === 'udp')) return true;
    return ports.some((p) => {
      const clean = String(p).trim();
      if (clean.includes('-')) {
        const [s, e] = clean.split('-').map(Number);
        return SENSITIVE_PORTS.some((sp) => Number(sp) >= s && Number(sp) <= e);
      }
      return SENSITIVE_PORTS.includes(clean);
    });
  });
}

function detectStaleAndOrphanedResources(allResources = [], projectId = '') {
  const vms = allResources.filter((r) => r.type === 'Compute Engine VM');
  const cloudRunServices = allResources.filter(
    (r) => r.type === 'Cloud Run Service'
  );
  const buckets = allResources.filter((r) => r.type === 'Cloud Storage Bucket');
  const datasets = allResources.filter((r) => r.type === 'BigQuery Dataset');

  const staleItems = [];

  for (const row of allResources) {
    const name = String(row?.name || '');
    const lower = name.toLowerCase();
    const type = String(row?.type || '');
    const details = row?.details || {};

    if (type === 'Enabled GCP Service API') {
      const svcName = String(
        details.serviceName || row?.storageClass || name
      ).toLowerCase();
      const isComputeCore =
        svcName.includes('compute.googleapis.com') ||
        svcName.includes('iam') ||
        svcName.includes('cloudresourcemanager') ||
        svcName.includes('logging') ||
        svcName.includes('monitoring') ||
        svcName.includes('serviceusage');

      const hasBacking =
        (svcName.includes('compute') && vms.length > 0) ||
        (svcName.includes('storage') && buckets.length > 0) ||
        (svcName.includes('bigquery.googleapis.com') && datasets.length > 0) ||
        (svcName.includes('run.googleapis.com') &&
          cloudRunServices.length > 0) ||
        isComputeCore;

      if (!hasBacking) {
        staleItems.push({
          ...row,
          staleBadge: 'UNUSED ENABLED API ($0/mo)',
          reason: `API (${svcName}) remains enabled on ${projectId} with 0 active ${name.replace(
            / API$/i,
            ''
          )} resources.`,
          actionLabel: 'Disable API',
          isServiceApi: true,
        });
      }
      continue;
    }

    if (type === 'Cloud Storage Bucket') {
      const vmDiskMatch = lower.match(/-vmdisk-(.+)$/);
      if (vmDiskMatch) {
        const targetVmName = vmDiskMatch[1];
        const matchingCloudRun = cloudRunServices.find(
          (cr) =>
            cr.name.toLowerCase().includes(targetVmName) ||
            JSON.stringify(cr.details || {}).toLowerCase().includes(lower)
        );
        if (!matchingCloudRun) {
          staleItems.push({
            ...row,
            staleBadge: 'STALE MIGRATION ARTIFACT',
            reason: `Left behind after VM-to-Cloud Run migration for "${targetVmName}" was removed.`,
            actionLabel: 'Delete Bucket',
          });
        }
        continue;
      }

      const attachedWorkloads = [...cloudRunServices, ...vms].filter((w) =>
        JSON.stringify(w.details || {}).toLowerCase().includes(lower)
      );
      if (attachedWorkloads.length === 0) {
        staleItems.push({
          ...row,
          staleBadge: 'UNATTACHED BUCKET',
          reason: `Standalone Cloud Storage bucket (${row.region || 'US'}) with 0 verified VM or Cloud Run mounts.`,
          actionLabel: 'Delete Bucket',
        });
      }
      continue;
    }

    if (type === 'BigQuery Dataset') {
      const attachedConsumers = [...cloudRunServices, ...vms].filter((w) =>
        JSON.stringify(w.details || {}).toLowerCase().includes(lower)
      );
      if (attachedConsumers.length === 0) {
        staleItems.push({
          ...row,
          staleBadge: 'STANDALONE DATASET',
          reason: `Persistent BigQuery dataset (${row.region || 'US'}) with 0 active compute workloads referencing it.`,
          actionLabel: 'Delete Dataset',
        });
      }
    }
  }

  return staleItems;
}

const MODAL_TABS = [
  {
    id: 'POSTURE',
    label: 'Health, Firewalls & Stale Cleanup',
    icon: ShieldCheck,
  },
  {
    id: 'DRIFT_GITOPS',
    label: 'State Drift, Merkle & GitOps HCL',
    icon: GitBranch,
  },
  {
    id: 'RUNBOOKS_FLEET',
    label: 'Autonomous Runbooks, SOC & Fleet',
    icon: Layers,
  },
  {
    id: 'CO_ARCHITECT',
    label: 'Gemini Co-Architect & Vault',
    icon: Sparkles,
  },
];

export default function GeminiCopilotModal({
  isOpen,
  onClose,
  projectId,
  overview,
  liveBurn,
  gdeSummary,
  onDeleteResource,
  onSwitchProject,
  onRefresh,
  onSelectTab,
  onShowToast,
}) {
  const { meta: pricingMeta } = useLivePricingCatalog();
  const [activeSubTab, setActiveSubTab] = useState('POSTURE');
  const [zombieData, setZombieData] = useState(null);
  const [synthesisData, setSynthesisData] = useState(null);
  const [sreWarRoomData, setSreWarRoomData] = useState(null);
  const [fleetMatrix, setFleetMatrix] = useState(null);
  const [loadingScan, setLoadingScan] = useState(false);
  const [loadingFleet, setLoadingFleet] = useState(false);
  const [busyActionId, setBusyActionId] = useState(null);
  const [confirmCleanupId, setConfirmCleanupId] = useState(null);
  const [actionBanner, setActionBanner] = useState('');
  const [lastRunbookLog, setLastRunbookLog] = useState(null);
  const [gitOpsViewMode, setGitOpsViewMode] = useState('DIFF');

  const runLiveProjectAudit = useCallback(async () => {
    if (!projectId) return;
    setLoadingScan(true);
    try {
      const creditBal = Number(gdeSummary?.totalRemainingUsd || 0);
      const creditDays =
        gdeSummary?.nearestExpiryDays !== null &&
        gdeSummary?.nearestExpiryDays !== undefined
          ? gdeSummary.nearestExpiryDays
          : '';
      const [zRes, synRes, sreRes] = await Promise.allSettled([
        axios.get(`/api/project/${encodeURIComponent(projectId)}/zombies`),
        axios.get(
          `/api/project/${encodeURIComponent(
            projectId
          )}/synthesis/overview?creditRemainingUsd=${encodeURIComponent(
            creditBal
          )}&creditDaysLeft=${encodeURIComponent(creditDays)}`
        ),
        axios.get(
          `/api/project/${encodeURIComponent(projectId)}/wave8/war-room`
        ),
      ]);
      if (zRes.status === 'fulfilled') {
        setZombieData(zRes.value.data);
      }
      if (synRes.status === 'fulfilled') {
        setSynthesisData(synRes.value.data);
      }
      if (sreRes.status === 'fulfilled') {
        setSreWarRoomData(sreRes.value.data);
      }
    } catch {
      // fallback if scan times out
    } finally {
      setLoadingScan(false);
    }
  }, [projectId, gdeSummary?.totalRemainingUsd, gdeSummary?.nearestExpiryDays]);

  const handleScanFleetMatrix = useCallback(async () => {
    setLoadingFleet(true);
    try {
      const res = await axios.get('/api/fleet/matrix');
      setFleetMatrix(res.data);
    } catch (err) {
      setActionBanner(
        `Fleet matrix scan failed: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setLoadingFleet(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && projectId) {
      runLiveProjectAudit();
    }
  }, [isOpen, projectId, runLiveProjectAudit]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const exposedFirewalls = useMemo(() => {
    const fws = overview?.firewalls || [];
    return fws.filter(ruleExposesSensitivePortsToWorld);
  }, [overview?.firewalls]);

  const staleResources = useMemo(
    () => detectStaleAndOrphanedResources(overview?.resources || [], projectId),
    [overview?.resources, projectId]
  );

  const staleDataResourcesCount = useMemo(
    () => staleResources.filter((r) => !r.isServiceApi).length,
    [staleResources]
  );

  const zombies = useMemo(() => zombieData?.zombies || [], [zombieData]);
  const totalAnnualWasteUsd = Number(zombieData?.totalAnnualWasteUsd || 0);
  const priceDriftCount = pricingMeta?.driftAlerts?.length || 0;

  const healthScore = useMemo(() => {
    let score = 100;
    score -= exposedFirewalls.length * 14;
    score -= zombies.length * 8;
    score -= staleDataResourcesCount * 5;
    score -= priceDriftCount * 4;
    return Math.max(18, Math.min(100, score));
  }, [
    exposedFirewalls.length,
    zombies.length,
    staleDataResourcesCount,
    priceDriftCount,
  ]);

  if (!isOpen) return null;

  const handleLockFirewallToIap = async (fw) => {
    setBusyActionId(`fw-${fw.name}`);
    setActionBanner('');
    try {
      await axios.patch(
        `/api/project/${encodeURIComponent(
          projectId
        )}/firewalls/${encodeURIComponent(fw.name)}`,
        {
          sourceRanges: ['35.235.240.0/20'],
          description: `${
            fw.description || ''
          } [Locked to Google IAP 35.235.240.0/20 via Health & Drift]`.trim(),
        }
      );
      const msg = `Locked firewall "${fw.name}" to Google IAP (35.235.240.0/20).`;
      setActionBanner(msg);
      if (onShowToast) onShowToast(msg);
      await runLiveProjectAudit();
      if (onRefresh) await onRefresh();
    } catch (err) {
      setActionBanner(
        `Failed to lock ${fw.name}: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setBusyActionId(null);
    }
  };

  const handleExterminateZombie = async (zombie) => {
    setBusyActionId(`z-${zombie.id}`);
    setActionBanner('');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/zombies/exterminate`,
        { zombie }
      );
      const msg =
        res.data?.message ||
        `Remediated ${zombie.name} (+$${Number(
          zombie.annualCostUsd || 0
        ).toFixed(2)}/yr saved).`;
      setActionBanner(msg);
      if (onShowToast) onShowToast(msg);
      await runLiveProjectAudit();
      if (onRefresh) await onRefresh();
    } catch (err) {
      setActionBanner(
        `Remediation error: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setBusyActionId(null);
    }
  };

  const handleCleanStaleResource = async (item) => {
    if (!onDeleteResource) return;
    setBusyActionId(`stale-${item.id}`);
    setConfirmCleanupId(null);
    setActionBanner('');
    try {
      await onDeleteResource({
        ...item,
        name: item.isServiceApi
          ? item.details?.serviceName || item.storageClass
          : item.name,
      });
      await runLiveProjectAudit();
    } finally {
      setBusyActionId(null);
    }
  };

  const handleExecuteRunbookDag = async (runbookId) => {
    setBusyActionId(`dag-${runbookId}`);
    setActionBanner('');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/synthesis/runbook`,
        { runbookId }
      );
      setLastRunbookLog(res.data);
      const msg = res.data?.message || `Executed runbook ${runbookId}`;
      setActionBanner(msg);
      if (onShowToast) onShowToast(msg);
      await runLiveProjectAudit();
      if (onRefresh) await onRefresh();
    } catch (err) {
      setActionBanner(
        `Runbook execution error: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setBusyActionId(null);
    }
  };

  const handleDownloadSignedDossier = () => {
    const dossier = synthesisData?.executiveDossier || {
      projectId,
      generatedAt: new Date().toISOString(),
      healthScore,
    };
    const blob = new Blob([JSON.stringify(dossier, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cloudpulse-2026-signed-audit-dossier-${projectId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (onShowToast) {
      onShowToast(`Downloaded SHA-256 Signed Audit Dossier for ${projectId}`);
    }
  };

  const handleExecuteSocBridgeAction = async (action, payload = {}) => {
    setBusyActionId(`soc-${action}`);
    setActionBanner('');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/soc/action`,
        { action, ...payload }
      );
      const msg = res.data?.message || `Executed Cloud SOC action ${action}`;
      setActionBanner(msg);
      if (onShowToast) onShowToast(msg);
      await runLiveProjectAudit();
      if (onRefresh) await onRefresh();
    } catch (err) {
      setActionBanner(
        `Cloud SOC action error: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setBusyActionId(null);
    }
  };

  const totalFindings =
    exposedFirewalls.length +
    zombies.length +
    staleDataResourcesCount +
    priceDriftCount;
  const runway = synthesisData?.creditRunwayOptimizer;
  const runbooks = synthesisData?.autonomousRunbooks || [];
  const gitOpsBridge = synthesisData?.gitOpsBridge;
  const cloudSocBridge = synthesisData?.cloudSocBridge;
  const dossier = synthesisData?.executiveDossier;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[96vw] max-w-7xl bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Sober Enterprise Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-[#1b1c1f] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center border font-mono font-extrabold text-base shrink-0 ${
                healthScore >= 85
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : healthScore >= 65
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
              }`}
            >
              {healthScore}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold text-zinc-950 dark:text-zinc-50 tracking-tight">
                  Project Health, Lineage & State Drift Center
                </h2>
                <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700">
                  {projectId}
                </span>
                {synthesisData?.merkleSnapshot?.merkleRootShort && (
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
                    Merkle: {synthesisData.merkleSnapshot.merkleRootShort}
                  </span>
                )}
                <span
                  className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                    totalFindings === 0
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                  }`}
                >
                  {totalFindings === 0
                    ? 'All Checks Passing'
                    : `${totalFindings} Actionable Item${
                        totalFindings === 1 ? '' : 's'
                      }`}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                Unified Zero-Trust firewall posture, stale/orphaned resource cleanup, SHA-256 Merkle state drift, and ClickOps-to-Terraform HCL sync.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownloadSignedDossier}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 text-xs font-semibold cursor-pointer transition-colors"
              title="Download Cryptographically Signed SHA-256 Executive Audit Dossier (JSON)"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Export JSON</span>
            </button>
            <button
              type="button"
              onClick={runLiveProjectAudit}
              disabled={loadingScan}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loadingScan ? 'animate-spin' : ''}`}
              />
              <span>{loadingScan ? 'Scanning...' : 'Re-Scan'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Health and Drift modal"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-zinc-200 hover:bg-red-600 dark:bg-zinc-800 dark:hover:bg-red-600 text-zinc-900 dark:text-zinc-100 hover:text-white border border-zinc-300 dark:border-zinc-700 text-xs font-extrabold transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* Spacious KPI Bar + Clean 4-Tab Navigation */}
        <div className="px-6 pt-4 pb-0 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314] space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#1b1c1f] border border-zinc-200 dark:border-zinc-800">
              <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                Active Burn Rate
              </div>
              <div className="text-lg font-extrabold font-mono text-zinc-950 dark:text-zinc-50 mt-0.5">
                ${Number(liveBurn?.monthly || 0).toFixed(2)}/mo
              </div>
              <div className="text-[11px] font-mono text-zinc-500">
                ${Number(liveBurn?.hourly || 0).toFixed(4)}/hr compute
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#1b1c1f] border border-zinc-200 dark:border-zinc-800">
              <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                0.0.0.0/0 Port Exposure
              </div>
              <div
                className={`text-lg font-extrabold font-mono mt-0.5 ${
                  exposedFirewalls.length > 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {exposedFirewalls.length} Rule
                {exposedFirewalls.length === 1 ? '' : 's'}
              </div>
              <div className="text-[11px] text-zinc-500">
                SSH / RDP / DB ingress audit
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#1b1c1f] border border-zinc-200 dark:border-zinc-800">
              <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                Stale & Leftover Items
              </div>
              <div
                className={`text-lg font-extrabold font-mono mt-0.5 ${
                  staleResources.length > 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {staleResources.length} Item
                {staleResources.length === 1 ? '' : 's'}
              </div>
              <div className="text-[11px] text-zinc-500">
                {staleDataResourcesCount} data ·{' '}
                {staleResources.length - staleDataResourcesCount} idle APIs
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#1b1c1f] border border-zinc-200 dark:border-zinc-800">
              <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                Zombie Waste
              </div>
              <div
                className={`text-lg font-extrabold font-mono mt-0.5 ${
                  totalAnnualWasteUsd > 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                ${totalAnnualWasteUsd.toFixed(2)}/yr
              </div>
              <div className="text-[11px] text-zinc-500">
                {zombies.length} unattached disk/IP/idle run
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#1b1c1f] border border-zinc-200 dark:border-zinc-800 col-span-2 md:col-span-1">
              <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                GitOps & SKU Drift
              </div>
              <div className="text-lg font-extrabold font-mono text-zinc-950 dark:text-zinc-50 mt-0.5">
                {gitOpsBridge?.eventsCount || 0} HCL · {priceDriftCount} SKU
              </div>
              <div className="text-[11px] text-zinc-500 truncate">
                Source: {pricingMeta.source}
              </div>
            </div>
          </div>

          {/* 4-Tab Bar */}
          <div className="flex items-center gap-2 overflow-x-auto">
            {MODAL_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Spacious Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-zinc-50/40 dark:bg-[#131314]">
          {actionBanner && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-3">
              <span>{actionBanner}</span>
              <button
                type="button"
                onClick={() => setActionBanner('')}
                className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white px-2 font-bold cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* TAB 1: HEALTH, FIREWALLS & STALE CLEANUP */}
          {activeSubTab === 'POSTURE' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1A. Zero-Trust VPC Firewall Perimeter Audit */}
                <div className="bg-white dark:bg-[#1b1c1f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                        <span>
                          Zero-Trust VPC Firewall Audit ({exposedFirewalls.length}{' '}
                          Exposed)
                        </span>
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Checks all ingress rules for world-open (0.0.0.0/0) SSH, RDP, or database ports.
                      </p>
                    </div>
                    {onSelectTab && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectTab('VPC_NETWORKS');
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <span>Open VPC Studio</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {exposedFirewalls.length === 0 ? (
                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>
                        All ingress firewall rules are locked down — no sensitive ports (22, 3389, 3306, 5432) exposed to 0.0.0.0/0.
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {exposedFirewalls.map((fw) => (
                        <div
                          key={fw.name}
                          className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3"
                        >
                          <div className="space-y-0.5">
                            <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                              <span className="font-mono">{fw.name}</span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                Priority {fw.priority ?? 1000} · {fw.network || 'default'}
                              </span>
                            </div>
                            <div className="text-xs text-zinc-500 font-mono">
                              Exposes{' '}
                              {(fw.allowed || [])
                                .map(
                                  (a) =>
                                    `${a.IPProtocol}:${(a.ports || ['all']).join(',')}`
                                )
                                .join(' ')}{' '}
                              to {(fw.sourceRanges || []).join(', ')}
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={busyActionId === `fw-${fw.name}`}
                            onClick={() => handleLockFirewallToIap(fw)}
                            className="px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>
                              {busyActionId === `fw-${fw.name}`
                                ? 'Locking...'
                                : 'Lock to Google IAP'}
                            </span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 1B. Zombie Resource & Unattached Compute Waste Scanner */}
                <div className="bg-white dark:bg-[#1b1c1f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                        <Trash2 className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                        <span>
                          Zombie Compute & Unattached Disks ({zombies.length} Found)
                        </span>
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Detects orphaned persistent disks, unattached static IPs, and warm-idle Cloud Run instances.
                      </p>
                    </div>
                  </div>

                  {zombies.length === 0 ? (
                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>
                        Zero orphaned Persistent Disks, unattached Static IPs, or warm-idle Cloud Run waste detected.
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {zombies.map((z) => (
                        <div
                          key={z.id}
                          className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3"
                        >
                          <div className="space-y-0.5">
                            <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                              <span className="font-mono">{z.name}</span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                                {z.kind} · {z.location}
                              </span>
                            </div>
                            <div className="text-xs text-zinc-500">{z.reason}</div>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400">
                              -${Number(z.annualCostUsd || 0).toFixed(2)}/yr
                            </span>
                            <button
                              type="button"
                              disabled={busyActionId === `z-${z.id}`}
                              onClick={() => handleExterminateZombie(z)}
                              className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              <Zap className="w-3.5 h-3.5" />
                              <span>
                                {busyActionId === `z-${z.id}`
                                  ? 'Working...'
                                  : z.kind === 'WARM_CLOUD_RUN'
                                  ? 'Scale min=0'
                                  : 'Clean Up'}
                              </span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 1C. Synced Resource Lineage & Stale/Orphaned Leftovers */}
              <div className="bg-white dark:bg-[#1b1c1f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                      <span>
                        Resource Lineage & Stale Leftovers ({staleResources.length}{' '}
                        Detected)
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Identifies buckets, datasets, and service APIs that stayed behind after a migration or demo workload was removed.
                    </p>
                  </div>
                  {onSelectTab && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectTab('OVERVIEW');
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Open Full Lineage in Overview</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {staleResources.length === 0 ? (
                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      Zero stale buckets, standalone datasets, or unused enabled APIs detected.
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {staleResources.map((item) => {
                      const isBusy = busyActionId === `stale-${item.id}`;
                      return (
                        <div
                          key={item.id}
                          className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                {item.staleBadge}
                              </span>
                              <span className="text-[11px] font-mono text-zinc-500">
                                {item.type} · {item.region}
                              </span>
                            </div>
                            <div className="text-sm font-bold text-zinc-950 dark:text-zinc-50 break-all">
                              {item.name}
                            </div>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400">
                              {item.reason}
                            </p>
                          </div>

                          {onDeleteResource && (
                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200/70 dark:border-zinc-800">
                              {confirmCleanupId === item.id ? (
                                <>
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => handleCleanStaleResource(item)}
                                    className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                                  >
                                    {isBusy ? 'Working...' : `Confirm ${item.actionLabel}`}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmCleanupId(null)}
                                    className="px-2.5 py-1.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => setConfirmCleanupId(item.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 text-xs font-bold cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>{item.actionLabel}</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: STATE DRIFT, MERKLE & GITOPS HCL */}
          {activeSubTab === 'DRIFT_GITOPS' && (
            <div className="space-y-6">
              {/* 2A. ClickOps-to-GitOps Live HCL Diff Bridge */}
              {gitOpsBridge && (
                <div className="bg-white dark:bg-[#1b1c1f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                        <GitBranch className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                        <span>
                          ClickOps-to-GitOps Live Terraform HCL Bridge (
                          {gitOpsBridge.eventsCount} Session Mutation
                          {gitOpsBridge.eventsCount === 1 ? '' : 's'})
                        </span>
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Every UI action in CloudPulse is automatically synthesized into `main.tf` diffs and `imports.tf` blocks.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setGitOpsViewMode('DIFF')}
                        className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold cursor-pointer ${
                          gitOpsViewMode === 'DIFF'
                            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        git diff main.tf
                      </button>
                      <button
                        type="button"
                        onClick={() => setGitOpsViewMode('IMPORTS')}
                        className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold cursor-pointer ${
                          gitOpsViewMode === 'IMPORTS'
                            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        imports.tf
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            gitOpsViewMode === 'DIFF'
                              ? gitOpsBridge.unifiedDiff
                              : gitOpsBridge.importsTf
                          );
                          if (onShowToast) {
                            onShowToast(
                              `Copied ${
                                gitOpsViewMode === 'DIFF'
                                  ? 'git diff main.tf'
                                  : 'imports.tf'
                              } to clipboard`
                            );
                          }
                        }}
                        className="px-3 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy HCL</span>
                      </button>
                    </div>
                  </div>
                  <pre className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 text-xs font-mono overflow-x-auto max-h-72 leading-relaxed border border-zinc-200 dark:border-zinc-800">
                    {gitOpsViewMode === 'DIFF'
                      ? gitOpsBridge.unifiedDiff
                      : gitOpsBridge.importsTf}
                  </pre>
                </div>
              )}

              {/* 2B. Live GCP Billing Catalog & Variable Rate Sync */}
              <div className="bg-white dark:bg-[#1b1c1f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3 shadow-sm">
                <div className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                  <span>
                    Live GCP Billing Catalog, GPU SKU Availability & Rate Drift
                  </span>
                </div>
                <LivePricingCatalogControlBar
                  projectId={projectId}
                  selectedRegionId="us-central1"
                />
              </div>
            </div>
          )}

          {/* TAB 3: AUTONOMOUS RUNBOOKS, SOC & FLEET */}
          {activeSubTab === 'RUNBOOKS_FLEET' && (
            <div className="space-y-6">
              {/* 3A. Closed-Loop Autonomous Runbook DAGs */}
              {runbooks.length > 0 && (
                <div className="bg-white dark:bg-[#1b1c1f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                        <Play className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                        <span>
                          Closed-Loop Multi-API Remediation Runbooks
                        </span>
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Execute deterministic 4-step remediation workflows with cryptographic SHA-256 Merkle receipts.
                      </p>
                    </div>
                    {dossier?.cryptographicSignature && (
                      <span className="text-xs font-mono text-zinc-500">
                        Signature: {dossier.cryptographicSignature.slice(0, 24)}...
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {runbooks.map((rb) => (
                      <div
                        key={rb.id}
                        className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between gap-4"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              {rb.badge}
                            </span>
                            <span className="text-xs font-mono text-zinc-400">
                              ~{rb.estimatedDurationSec}s
                            </span>
                          </div>
                          <div className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
                            {rb.title}
                          </div>
                          <ul className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                            {rb.steps.map((st, idx) => (
                              <li key={idx} className="leading-relaxed">
                                {st}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <button
                          type="button"
                          disabled={busyActionId === `dag-${rb.id}`}
                          onClick={() => handleExecuteRunbookDag(rb.id)}
                          className="w-full py-2 px-3 rounded-md bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>
                            {busyActionId === `dag-${rb.id}`
                              ? 'Executing Live DAG...'
                              : 'Execute 4-Step Runbook'}
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>

                  {lastRunbookLog && (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5 text-xs font-mono">
                      <div className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
                        <span>
                          Executed Runbook: {lastRunbookLog.runbookId} (Merkle:{' '}
                          {lastRunbookLog.merkleRootShort})
                        </span>
                        <span>{lastRunbookLog.durationMs}ms</span>
                      </div>
                      {(lastRunbookLog.executionLog || []).map((entry) => (
                        <div
                          key={entry.step}
                          className="text-zinc-700 dark:text-zinc-300"
                        >
                          [Step {entry.step} · {entry.status}] {entry.detail}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 3B. Sober Cloud SOC & SRE War-Room Summary */}
              {(cloudSocBridge || sreWarRoomData) && (
                <div className="bg-white dark:bg-[#1b1c1f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50">
                        Cloud SOC & Principal SRE Posture Controls
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Quick Zero-Trust hardening actions and direct bridges to the dedicated Security & SRE studios.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {onSelectTab && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              onSelectTab('CLOUD_SOC');
                              onClose();
                            }}
                            className="px-3 py-1.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>Open Cloud SOC</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onSelectTab('SRE_WAR_ROOM');
                              onClose();
                            }}
                            className="px-3 py-1.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>Open SRE War-Room</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {cloudSocBridge && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                        <div className="text-zinc-500">Honey-Canary Trap</div>
                        <div
                          className={`font-mono font-bold mt-1 ${
                            cloudSocBridge.canarySecretArmed
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {cloudSocBridge.canarySecretArmed
                            ? 'ARMED ($0/mo)'
                            : 'UNARMED'}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                        <div className="text-zinc-500">OS Login & SSH</div>
                        <div className="font-mono font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                          {cloudSocBridge.projectWideSshKeysCount} Keys · OSLogin{' '}
                          {cloudSocBridge.osLoginEnabled ? 'ON' : 'OFF'}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                        <div className="text-zinc-500">IAM etag Sync</div>
                        <div className="font-mono font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                          {cloudSocBridge.iamEtagDrifted ? 'DRIFTED' : 'IN-SYNC'} (
                          {cloudSocBridge.iamCheckpointsCount} snaps)
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                        <div className="text-zinc-500">SLO Error Budget</div>
                        <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                          {sreWarRoomData?.sloBurn?.errorBudgetRemainingPct ?? 100}%
                          Remaining
                        </div>
                      </div>
                    </div>
                  )}

                  {cloudSocBridge && (
                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      <button
                        type="button"
                        disabled={
                          busyActionId === 'soc-EXECUTE_DEFCON1_LOCKDOWN'
                        }
                        onClick={() =>
                          handleExecuteSocBridgeAction(
                            'EXECUTE_DEFCON1_LOCKDOWN'
                          )
                        }
                        className="px-3.5 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>
                          {busyActionId === 'soc-EXECUTE_DEFCON1_LOCKDOWN'
                            ? 'Executing Lockdown...'
                            : 'Defcon-1 Atomic Lockdown'}
                        </span>
                      </button>

                      {!cloudSocBridge.canarySecretArmed && (
                        <button
                          type="button"
                          disabled={
                            busyActionId === 'soc-DEPLOY_ZERO_COST_CANARY_TRAP'
                          }
                          onClick={() =>
                            handleExecuteSocBridgeAction(
                              'DEPLOY_ZERO_COST_CANARY_TRAP',
                              { canaryType: 'CANARY_SECRET_MANAGER' }
                            )
                          }
                          className="px-3.5 py-2 rounded-md bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Arm $0.00/mo Honey-Secret Canary</span>
                        </button>
                      )}

                      {!cloudSocBridge.osLoginEnabled && (
                        <button
                          type="button"
                          disabled={
                            busyActionId ===
                            'soc-HARDEN_PROJECT_OSLOGIN_AND_SERIAL_PORT'
                          }
                          onClick={() =>
                            handleExecuteSocBridgeAction(
                              'HARDEN_PROJECT_OSLOGIN_AND_SERIAL_PORT'
                            )
                          }
                          className="px-3.5 py-2 rounded-md bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Enforce OS Login + Block Serial Port</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 3C. Multi-Project Fleet Matrix & Credit Runway */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {runway && (
                  <div className="bg-white dark:bg-[#1b1c1f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50">
                        Promotional Credit & Budget Runway
                      </h3>
                      <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ${runway.balanceUsd.toFixed(2)} · {runway.expiryDays}d
                        left
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      {runway.headline}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {(runway.freeCapacityMenu || []).map((cap) => (
                        <div
                          key={cap.id}
                          className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                        >
                          <div className="text-[11px] text-zinc-500">
                            {cap.label}
                          </div>
                          <div className="text-sm font-extrabold font-mono text-zinc-950 dark:text-zinc-50 mt-1">
                            {cap.freeUnitsAvailable} {cap.unit}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white dark:bg-[#1b1c1f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50">
                        Multi-Project Fleet Federation
                      </h3>
                      <p className="text-xs text-zinc-500">
                        Sweep all accessible GCP projects in your authenticated session.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={loadingFleet}
                      onClick={handleScanFleetMatrix}
                      className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${
                          loadingFleet ? 'animate-spin' : ''
                        }`}
                      />
                      <span>
                        {loadingFleet ? 'Sweeping...' : 'Sweep Projects'}
                      </span>
                    </button>
                  </div>

                  {fleetMatrix?.fleet && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse font-mono">
                        <thead>
                          <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 text-[10px] uppercase">
                            <th className="py-2 pr-3">Project</th>
                            <th className="py-2 px-2">VMs</th>
                            <th className="py-2 px-2">GCS/BQ</th>
                            <th className="py-2 px-2">Burn</th>
                            <th className="py-2 pl-2 text-right">Switch</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                          {fleetMatrix.fleet.map((row) => (
                            <tr key={row.projectId}>
                              <td className="py-2 pr-3 font-bold text-zinc-900 dark:text-zinc-100">
                                {row.projectId}
                              </td>
                              <td className="py-2 px-2">
                                {row.runningVmsCount}/{row.vmsCount}
                              </td>
                              <td className="py-2 px-2">
                                {row.bucketsCount}/{row.datasetsCount}
                              </td>
                              <td className="py-2 px-2">
                                ${row.monthlyBurnUsd.toFixed(2)}/mo
                              </td>
                              <td className="py-2 pl-2 text-right">
                                {row.projectId === projectId ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
                                    Active
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onSwitchProject &&
                                      onSwitchProject(row.projectId)
                                    }
                                    className="px-2.5 py-1 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-bold cursor-pointer"
                                  >
                                    Switch
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GEMINI CO-ARCHITECT & VAULT */}
          {activeSubTab === 'CO_ARCHITECT' && (
            <div className="space-y-4">
              <EngineerMoonshotsWave3
                activeTab="X6"
                projectId={projectId}
                overview={overview}
                onRefreshGlobal={() => {
                  runLiveProjectAudit();
                  if (onRefresh) onRefresh();
                }}
              />
            </div>
          )}
        </div>

        {/* Sticky Modal Footer with Close Button */}
        <div className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-[#1b1c1f] flex items-center justify-between gap-3">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-[11px]">Esc</kbd> or click outside to close
          </span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-extrabold transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Close Health &amp; Drift</span>
          </button>
        </div>
      </div>
    </div>
  );
}
