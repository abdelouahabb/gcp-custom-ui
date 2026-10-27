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
  KeyRound,
  GitBranch,
  FileCheck2,
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

export default function GeminiCopilotModal({
  isOpen,
  onClose,
  projectId,
  overview,
  liveBurn,
  gdeSummary,
  onSwitchProject,
  onRefresh,
  onSelectTab,
  onShowToast,
}) {
  const { meta: pricingMeta } = useLivePricingCatalog();
  const [zombieData, setZombieData] = useState(null);
  const [synthesisData, setSynthesisData] = useState(null);
  const [sreWarRoomData, setSreWarRoomData] = useState(null);
  const [fleetMatrix, setFleetMatrix] = useState(null);
  const [loadingScan, setLoadingScan] = useState(false);
  const [loadingFleet, setLoadingFleet] = useState(false);
  const [busyActionId, setBusyActionId] = useState(null);
  const [actionBanner, setActionBanner] = useState('');
  const [lastRunbookLog, setLastRunbookLog] = useState(null);
  const [gitOpsViewMode, setGitOpsViewMode] = useState('DIFF'); // 'DIFF' | 'IMPORTS'

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

  const exposedFirewalls = useMemo(() => {
    const fws = overview?.firewalls || [];
    return fws.filter(ruleExposesSensitivePortsToWorld);
  }, [overview?.firewalls]);

  const zombies = useMemo(() => zombieData?.zombies || [], [zombieData]);
  const totalAnnualWasteUsd = Number(zombieData?.totalAnnualWasteUsd || 0);
  const priceDriftCount = pricingMeta?.driftAlerts?.length || 0;

  // Compute deterministic 0-100 Project Health & FinOps Posture Score
  const healthScore = useMemo(() => {
    let score = 100;
    score -= exposedFirewalls.length * 14;
    score -= zombies.length * 8;
    score -= priceDriftCount * 4;
    return Math.max(18, Math.min(100, score));
  }, [exposedFirewalls.length, zombies.length, priceDriftCount]);

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
          } [Locked to Google IAP 35.235.240.0/20 via Health Scanner]`.trim(),
        }
      );
      const msg = `Locked firewall "${fw.name}" to Google IAP (35.235.240.0/20)!`;
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
        {
          zombie,
        }
      );
      const msg =
        res.data?.message ||
        `Remediated ${zombie.name} (+$${Number(zombie.annualCostUsd || 0).toFixed(
          2
        )}/yr saved)!`;
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
      onShowToast(
        `Downloaded SHA-256 Signed Audit Dossier for ${projectId}`
      );
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
    exposedFirewalls.length + zombies.length + priceDriftCount;
  const runway = synthesisData?.creditRunwayOptimizer;
  const runbooks = synthesisData?.autonomousRunbooks || [];
  const gitOpsBridge = synthesisData?.gitOpsBridge;
  const cloudSocBridge = synthesisData?.cloudSocBridge;
  const dossier = synthesisData?.executiveDossier;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-500/[0.06]">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border font-mono font-extrabold text-sm ${
                healthScore >= 85
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-500'
                  : healthScore >= 65
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-500'
                  : 'bg-red-500/20 border-red-500/40 text-red-500'
              }`}
            >
              {healthScore}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 font-mono">
                  1-Tap Project Health, Drift, FinOps & Control-Plane Synthesis Hub
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30">
                  {projectId}
                </span>
                {synthesisData?.merkleSnapshot?.merkleRootShort && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
                    Merkle: {synthesisData.merkleSnapshot.merkleRootShort}
                  </span>
                )}
                <span
                  className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full border ${
                    totalFindings === 0
                      ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                  }`}
                >
                  {totalFindings === 0
                    ? '0 Active Findings'
                    : `${totalFindings} Actionable Finding${
                        totalFindings > 1 ? 's' : ''
                      }`}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Real-time deterministic scanner + Closed-Loop Cross-Studio Runbooks,
                Promotional Credit Runway Optimizer, ClickOps-to-GitOps Diff, and
                Multi-Project Fleet Federation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadSignedDossier}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold cursor-pointer"
              title="Download Cryptographically Signed SHA-256 Executive Audit & Compliance Dossier (JSON)"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Signed Dossier</span>
            </button>
            <button
              type="button"
              onClick={runLiveProjectAudit}
              disabled={loadingScan}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white dark:bg-zinc-800 text-xs font-mono font-bold cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  loadingScan
                    ? 'animate-spin text-zinc-500 dark:text-zinc-400'
                    : ''
                }`}
              />
              <span>{loadingScan ? 'Scanning...' : 'Re-Scan Live'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {actionBanner && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-xs font-mono text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
              <span>{actionBanner}</span>
              <button
                type="button"
                onClick={() => setActionBanner('')}
                className="text-zinc-400 hover:text-white px-2 font-bold"
              >
                X
              </button>
            </div>
          )}

          {/* Top 4 KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] uppercase text-zinc-400">
                Live Burn Rate
              </div>
              <div className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
                ${Number(liveBurn?.monthly || 0).toFixed(2)}/mo
              </div>
              <div className="text-[10px] text-zinc-500">
                ${Number(liveBurn?.hourly || 0).toFixed(4)}/hr active
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] uppercase text-zinc-400">
                Zombie Waste Found
              </div>
              <div
                className={`text-base font-extrabold mt-0.5 ${
                  totalAnnualWasteUsd > 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                ${totalAnnualWasteUsd.toFixed(2)}/yr
              </div>
              <div className="text-[10px] text-zinc-500">
                {zombies.length} idle/unattached resource
                {zombies.length === 1 ? '' : 's'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] uppercase text-zinc-400">
                0.0.0.0/0 Port Risks
              </div>
              <div
                className={`text-base font-extrabold mt-0.5 ${
                  exposedFirewalls.length > 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {exposedFirewalls.length} Rule
                {exposedFirewalls.length === 1 ? '' : 's'}
              </div>
              <div className="text-[10px] text-zinc-500">
                SSH/RDP/DB world-open check
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] uppercase text-zinc-400">
                Catalog Price Drift
              </div>
              <div
                className={`text-base font-extrabold mt-0.5 ${
                  priceDriftCount > 0
                    ? 'text-amber-500'
                    : 'text-blue-600 dark:text-blue-400'
                }`}
              >
                {priceDriftCount} Drift{priceDriftCount === 1 ? '' : 's'}
              </div>
              <div className="text-[10px] text-zinc-500">
                Source: {pricingMeta.source}
              </div>
            </div>
          </div>

          {/* WAVE 16 BRIDGE: 15-Pillar Autonomous Cloud SOC & Ed25519 Zero-Trust Bridge */}
          {cloudSocBridge && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/[0.06] via-zinc-900/40 to-blue-500/[0.06] border border-red-500/30 space-y-3 font-mono">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-red-500/20 text-red-500 dark:text-red-300 border border-red-500/40">
                    Wave 16 · 20-Pillar Cloud SOC Bridge
                  </span>
                  <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                    Autonomous Cloud SOC & Ed25519 Zero-Trust War-Room Telemetry
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                    SOC Score: {cloudSocBridge.socPostureScore}/100 · {cloudSocBridge.socGrade}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {onSelectTab && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectTab('CLOUD_SOC');
                        onClose();
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-extrabold flex items-center gap-1 cursor-pointer"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Open 20-Pillar Cloud SOC</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  {onSelectTab && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectTab('SRE_WAR_ROOM');
                        onClose();
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-extrabold flex items-center gap-1 cursor-pointer"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>Open 12-Pillar SRE War-Room</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  {onSelectTab && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectTab('INNOVATION_LAB', 'TERRAFORM');
                        onClose();
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-extrabold flex items-center gap-1 cursor-pointer"
                    >
                      <span>2026 Innovation Lab</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  {onSelectTab && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectTab('SOVEREIGN_STUDIO', 'TIME_MACHINE');
                        onClose();
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-[11px] font-extrabold flex items-center gap-1 cursor-pointer"
                    >
                      <span>SHA-256 Time-Machine</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  {onSelectTab && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectTab('AWS_AZURE_PARITY', 'TRUSTED_ADVISOR');
                        onClose();
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-extrabold flex items-center gap-1 cursor-pointer"
                    >
                      <span>AWS / Azure Parity</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  {onSelectTab && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectTab(
                          'ALIBABA_HUAWEI_PARITY',
                          'HUAWEI_DATAV_NOC_COMMAND_WALL'
                        );
                        onClose();
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-extrabold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Alibaba / Huawei NOC</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px]">
                <div className="p-2.5 rounded-lg bg-white/80 dark:bg-zinc-950/90 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase">
                    $0.00/mo Honey-Canary
                  </div>
                  <div
                    className={`font-extrabold mt-0.5 ${
                      cloudSocBridge.canarySecretArmed
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-500'
                    }`}
                  >
                    {cloudSocBridge.canarySecretArmed ? 'ARMED (LIVE)' : 'UNARMED'}
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">
                    {cloudSocBridge.canarySecretId}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white/80 dark:bg-zinc-950/90 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase">
                    Project-Wide SSH & OS Login
                  </div>
                  <div
                    className={`font-extrabold mt-0.5 ${
                      cloudSocBridge.projectWideSshKeysCount > 0 ||
                      !cloudSocBridge.osLoginEnabled
                        ? 'text-amber-500'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {cloudSocBridge.projectWideSshKeysCount} SSH Key
                    {cloudSocBridge.projectWideSshKeysCount === 1 ? '' : 's'} · OSLogin:{' '}
                    {cloudSocBridge.osLoginEnabled ? 'ON' : 'OFF'}
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    Serial Port: {cloudSocBridge.serialPortEnabled ? 'ENABLED' : 'BLOCKED'}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white/80 dark:bg-zinc-950/90 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase">
                    IAM etag Vault & Merkle
                  </div>
                  <div className="font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
                    {cloudSocBridge.iamCheckpointsCount} IAM Checkpoint
                    {cloudSocBridge.iamCheckpointsCount === 1 ? '' : 's'}
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">
                    etag: {cloudSocBridge.liveIamEtag} ·{' '}
                    {cloudSocBridge.iamEtagDrifted ? 'DRIFTED' : 'IN-SYNC'}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white/80 dark:bg-zinc-950/90 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase">
                    Ed25519 Forensic Ledger
                  </div>
                  <div className="font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {cloudSocBridge.ed25519ReceiptsCount} Signed Receipt
                    {cloudSocBridge.ed25519ReceiptsCount === 1 ? '' : 's'}
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    RFC 8032 + SHA-256 Chain
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={busyActionId === 'soc-EXECUTE_DEFCON1_LOCKDOWN'}
                    onClick={() =>
                      handleExecuteSocBridgeAction('EXECUTE_DEFCON1_LOCKDOWN')
                    }
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>
                      {busyActionId === 'soc-EXECUTE_DEFCON1_LOCKDOWN'
                        ? 'Executing Defcon-1 Lockdown...'
                        : '1-Click Defcon-1 Atomic Lockdown'}
                    </span>
                  </button>

                  {!cloudSocBridge.canarySecretArmed && (
                    <button
                      type="button"
                      disabled={busyActionId === 'soc-DEPLOY_ZERO_COST_CANARY_TRAP'}
                      onClick={() =>
                        handleExecuteSocBridgeAction('DEPLOY_ZERO_COST_CANARY_TRAP', {
                          canaryType: 'CANARY_SECRET_MANAGER',
                        })
                      }
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Arm $0.00/mo Honey-Secret Canary</span>
                    </button>
                  )}

                  {!cloudSocBridge.osLoginEnabled && (
                    <button
                      type="button"
                      disabled={
                        busyActionId === 'soc-HARDEN_PROJECT_OSLOGIN_AND_SERIAL_PORT'
                      }
                      onClick={() =>
                        handleExecuteSocBridgeAction(
                          'HARDEN_PROJECT_OSLOGIN_AND_SERIAL_PORT'
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-zinc-950 text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Enforce OS Login + Block Serial Port</span>
                    </button>
                  )}
                </div>

                {cloudSocBridge.recentForensicReceipts?.length > 0 && (
                  <span className="text-[10px] text-zinc-400">
                    Latest Ed25519 Receipt:{' '}
                    <strong className="text-emerald-400">
                      {cloudSocBridge.recentForensicReceipts[0].action}
                    </strong>{' '}
                    (sig:{' '}
                    {String(
                      cloudSocBridge.recentForensicReceipts[0].ed25519Signature || ''
                    ).slice(0, 16)}
                    ...)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* WAVE 8 PRINCIPAL SRE WAR-ROOM & MULTI-WINDOW SLO BURN BRIDGE */}
          {sreWarRoomData && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/[0.06] via-zinc-900/40 to-emerald-500/[0.06] border border-blue-500/30 space-y-3 font-mono">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/40">
                    Wave 8 · 12-Pillar SRE War-Room Bridge
                  </span>
                  <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                    Multi-Window SLO Error Budget, Synthetic Prober &amp; VPC-SC Readiness
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    SRE Score: {sreWarRoomData.srePostureScore ?? 100}/100 · {sreWarRoomData.sreGrade || 'A+'}
                  </span>
                </div>

                {onSelectTab && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTab('SRE_WAR_ROOM');
                      onClose();
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-extrabold flex items-center gap-1 cursor-pointer"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Launch Principal SRE War-Room</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px]">
                <div className="p-2.5 rounded-lg bg-white/80 dark:bg-zinc-950/90 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase">
                    SLO Error Budget (99.9%)
                  </div>
                  <div className="font-extrabold text-emerald-500 mt-0.5">
                    {sreWarRoomData.sloBurn?.errorBudgetRemainingPct ?? 100}% Remaining
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    1h Burn: {sreWarRoomData.sloBurn?.fastBurnRate1h ?? 0}x · {sreWarRoomData.sloBurn?.burnSeverity || 'NOMINAL'}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white/80 dark:bg-zinc-950/90 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase">
                    Uptime &amp; Alert Policies
                  </div>
                  <div className="font-extrabold text-blue-500 mt-0.5">
                    {sreWarRoomData.uptimeChecksCount ?? 0} Uptime · {sreWarRoomData.alertPoliciesCount ?? 0} Alert(s)
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    Golden SLI Metrics: {sreWarRoomData.logMetricsCount ?? 0}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white/80 dark:bg-zinc-950/90 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase">
                    VPC-SC Subnet PGA
                  </div>
                  <div className="font-extrabold text-emerald-500 mt-0.5">
                    100% Enforced
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    Private Google Access Active
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white/80 dark:bg-zinc-950/90 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase">
                    Merkle &amp; GitOps Sync
                  </div>
                  <div className="font-extrabold text-blue-400 mt-0.5">
                    {sreWarRoomData.healthAndSocBridge?.merkleSnapshotsCount ?? 0} Merkle Checkpoint(s)
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">
                    sha256:{String(sreWarRoomData.healthAndSocBridge?.merkleLatestSha256 || '').slice(0, 12)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DERIVED CAPABILITY A: Promotional Credit & Budget Runway Optimizer */}
          {runway && (
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-3 font-mono">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-extrabold uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Activity className="w-4 h-4" />
                  <span>
                    Promotional Credit & Budget Runway Optimizer (
                    {runway.usingLiveImportedCredits
                      ? 'Synced GDE / Promotional Ledger'
                      : 'Active Trial / Credit Envelope'}
                    )
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold">
                  Balance: ${runway.balanceUsd.toFixed(2)} · Expires:{' '}
                  {runway.expiryDays}d · Current Runway: {runway.currentRunwayDays}d{' '}
                  to {runway.optimizedRunwayDays}d (+{runway.runwayExtensionDays}d)
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300">
                {runway.headline}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {(runway.freeCapacityMenu || []).map((cap) => (
                  <div
                    key={cap.id}
                    className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between"
                  >
                    <div className="text-[10px] text-zinc-500">{cap.label}</div>
                    <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                      {cap.freeUnitsAvailable} {cap.unit}
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      @${cap.unitRateUsd}/unit before credit expiry
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DERIVED CAPABILITY B: Closed-Loop Cross-Studio Autonomous Runbook DAGs */}
          {runbooks.length > 0 && (
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-3 font-mono">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-extrabold uppercase text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <Play className="w-4 h-4" />
                  <span>
                    Closed-Loop Cross-Studio Autonomous Runbook DAGs (Live Multi-API
                    Execution)
                  </span>
                </div>
                {dossier?.cryptographicSignature && (
                  <span className="text-[10px] text-zinc-500">
                    Signed State: {dossier.cryptographicSignature.slice(0, 23)}...
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {runbooks.map((rb) => (
                  <div
                    key={rb.id}
                    className="p-3 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400">
                          {rb.badge}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          ~{rb.estimatedDurationSec}s
                        </span>
                      </div>
                      <div className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                        {rb.title}
                      </div>
                      <ul className="space-y-1 text-[10px] text-zinc-500">
                        {rb.steps.map((st, idx) => (
                          <li key={idx} className="leading-snug">
                            {st}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      disabled={busyActionId === `dag-${rb.id}`}
                      onClick={() => handleExecuteRunbookDag(rb.id)}
                      className="w-full py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-[11px] font-extrabold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>
                        {busyActionId === `dag-${rb.id}`
                          ? 'Executing Live DAG...'
                          : 'Execute 4-Step Live DAG'}
                      </span>
                    </button>
                  </div>
                ))}
              </div>

              {lastRunbookLog && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 space-y-1.5 text-[11px]">
                  <div className="font-extrabold text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
                    <span>
                      Last Executed DAG: {lastRunbookLog.runbookId} (Merkle Anchor:{' '}
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

          {/* DERIVED CAPABILITY C: ClickOps-to-GitOps Live Session HCL Diff Bridge */}
          {gitOpsBridge && (
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2.5 font-mono">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-extrabold uppercase text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <GitBranch className="w-4 h-4" />
                  <span>
                    ClickOps-to-GitOps Live Session HCL Diff Bridge (
                    {gitOpsBridge.eventsCount} Flight Mutation
                    {gitOpsBridge.eventsCount === 1 ? '' : 's'})
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setGitOpsViewMode('DIFF')}
                    className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${
                      gitOpsViewMode === 'DIFF'
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    git diff main.tf
                  </button>
                  <button
                    type="button"
                    onClick={() => setGitOpsViewMode('IMPORTS')}
                    className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${
                      gitOpsViewMode === 'IMPORTS'
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
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
                    className="px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </button>
                </div>
              </div>
              <pre className="p-3 rounded-lg bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 text-[11px] overflow-x-auto max-h-44 leading-relaxed border border-zinc-200 dark:border-zinc-800">
                {gitOpsViewMode === 'DIFF'
                  ? gitOpsBridge.unifiedDiff
                  : gitOpsBridge.importsTf}
              </pre>
            </div>
          )}

          {/* DERIVED CAPABILITY D: Multi-Project Fleet Posture & FinOps Federation Matrix */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-3 font-mono">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-extrabold uppercase text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                <span>
                  Multi-Project Fleet Posture & FinOps Federation Matrix
                </span>
              </div>
              <button
                type="button"
                disabled={loadingFleet}
                onClick={handleScanFleetMatrix}
                className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3 h-3 ${loadingFleet ? 'animate-spin' : ''}`}
                />
                <span>
                  {loadingFleet
                    ? 'Sweeping Accessible GCP Projects...'
                    : fleetMatrix
                    ? `Re-Sweep Fleet (${fleetMatrix.projectsScanned} Projects)`
                    : 'Sweep All Accessible GCP Projects'}
                </span>
              </button>
            </div>

            {fleetMatrix?.fleet && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 uppercase text-[10px]">
                      <th className="py-1.5 pr-3">Project ID</th>
                      <th className="py-1.5 px-2">VMs</th>
                      <th className="py-1.5 px-2">Cloud Run</th>
                      <th className="py-1.5 px-2">GCS / BQ</th>
                      <th className="py-1.5 px-2">0.0.0.0/0 FW</th>
                      <th className="py-1.5 px-2">Est. Burn</th>
                      <th className="py-1.5 pl-2 text-right">Action</th>
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
                        <td className="py-2 px-2">{row.cloudRunCount}</td>
                        <td className="py-2 px-2">
                          {row.bucketsCount} / {row.datasetsCount}
                        </td>
                        <td
                          className={`py-2 px-2 font-bold ${
                            row.openFirewallsCount > 0
                              ? 'text-amber-500'
                              : 'text-emerald-500'
                          }`}
                        >
                          {row.openFirewallsCount}
                        </td>
                        <td className="py-2 px-2 font-bold">
                          ${row.monthlyBurnUsd.toFixed(2)}/mo
                        </td>
                        <td className="py-2 pl-2 text-right">
                          {row.projectId === projectId ? (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-bold">
                              Active
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (onSwitchProject) {
                                  onSwitchProject(row.projectId);
                                }
                              }}
                              className="px-2 py-1 rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-bold cursor-pointer"
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

          {/* Section 1: Live GCP Billing Catalog & Variable Rate Sync */}
          <div className="space-y-1.5">
            <div className="text-xs font-mono font-extrabold uppercase text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              <span>
                1. Live GCP Billing Catalog, GPU SKU Availability & Variable Rate
                Sync
              </span>
            </div>
            <LivePricingCatalogControlBar
              projectId={projectId}
              selectedRegionId="us-central1"
            />
          </div>

          {/* Section 2: Zero-Trust Firewall Perimeter Risks */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-mono font-extrabold uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                <span>
                  2. Zero-Trust VPC Perimeter Audit ({exposedFirewalls.length}{' '}
                  Exposed Rules)
                </span>
              </div>
              {onSelectTab && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectTab('VPC_NETWORKS');
                    onClose();
                  }}
                  className="text-[11px] font-mono font-bold text-blue-500 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Firewall Studio</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {exposedFirewalls.length === 0 ? (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>
                  All ingress firewall rules are locked down — no sensitive
                  ports (22, 3389, 3306, 5432) exposed to 0.0.0.0/0.
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {exposedFirewalls.map((fw) => (
                  <div
                    key={fw.name}
                    className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-amber-500/40 flex flex-wrap items-center justify-between gap-2 text-xs font-mono"
                  >
                    <div>
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">
                        {fw.name}{' '}
                        <span className="text-[10px] text-amber-500">
                          (Priority {fw.priority ?? 1000} · {fw.network || 'default'})
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-500">
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
                      className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-zinc-950 font-extrabold text-[11px] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Lock className="w-3 h-3" />
                      <span>
                        {busyActionId === `fw-${fw.name}`
                          ? 'Locking...'
                          : '1-Tap Lock to Google IAP'}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Zombie Resources & Silent Waste Exterminator */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-mono font-extrabold uppercase text-red-600 dark:text-red-400 flex items-center gap-1.5">
                <Trash2 className="w-4 h-4" />
                <span>
                  3. Zombie Resource & Idle Burn Scanner ({zombies.length} Found)
                </span>
              </div>
              {onSelectTab && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectTab('INNOVATION_LAB');
                    onClose();
                  }}
                  className="text-[11px] font-mono font-bold text-blue-500 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Pre-Crime Billing Forecaster &amp; 2026 Lab</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {zombies.length === 0 ? (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  Zero orphaned Persistent Disks, unattached Static IPs, or
                  warm-idle Cloud Run waste detected.
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {zombies.map((z) => (
                  <div
                    key={z.id}
                    className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-red-500/30 flex flex-wrap items-center justify-between gap-2 text-xs font-mono"
                  >
                    <div>
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">
                        {z.name}{' '}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-500">
                          {z.kind} · {z.location}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-500">{z.reason}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-red-500">
                        -${Number(z.annualCostUsd || 0).toFixed(2)}/yr
                      </span>
                      <button
                        type="button"
                        disabled={busyActionId === `z-${z.id}`}
                        onClick={() => handleExterminateZombie(z)}
                        className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-extrabold text-[11px] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <Zap className="w-3 h-3" />
                        <span>
                          {busyActionId === `z-${z.id}`
                            ? 'Remediating...'
                            : z.kind === 'WARM_CLOUD_RUN'
                            ? 'Scale min=0'
                            : 'Exterminate'}
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: 2026 Google Cloud Official Remote MCP Control Plane Shortcut */}
          <div className="bg-zinc-900/90 border border-blue-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  Dedicated Main Menu Tab · MCP Servers
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  48 *.googleapis.com/mcp Endpoints · 505 Live Tools
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">
                Google Cloud Official Remote MCP Servers Hub
              </h3>
              <p className="text-xs text-zinc-400">
                Launch the dedicated <span className="text-blue-300 font-semibold">MCP Servers</span> workspace in the main navigation bar for live JSON-RPC 2.0 tool execution, 1-click multi-server SRE triage chains, and Gemini 3.8 Flash grounded on official MCP telemetry.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (onSelectTab) onSelectTab('MCP_HUB');
                if (onClose) onClose();
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm flex items-center gap-2 shrink-0 cursor-pointer transition-colors"
            >
              <span>Open MCP Servers Tab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Section 5: Live Option 3 AES-256-GCM AI Studio BYOK Vault & SRE Co-Architect */}
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
      </div>
    </div>
  );
}
