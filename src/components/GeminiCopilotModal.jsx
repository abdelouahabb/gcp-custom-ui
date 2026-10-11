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
  onRefresh,
  onSelectTab,
  onShowToast,
}) {
  const { meta: pricingMeta } = useLivePricingCatalog();
  const [zombieData, setZombieData] = useState(null);
  const [loadingScan, setLoadingScan] = useState(false);
  const [busyActionId, setBusyActionId] = useState(null);
  const [actionBanner, setActionBanner] = useState('');

  const runLiveProjectAudit = useCallback(async () => {
    if (!projectId) return;
    setLoadingScan(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/zombies`
      );
      setZombieData(res.data);
    } catch {
      // fallback if zombies endpoint times out
    } finally {
      setLoadingScan(false);
    }
  }, [projectId]);

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
        `/api/project/${encodeURIComponent(projectId)}/firewalls/${encodeURIComponent(fw.name)}`,
        {
          sourceRanges: ['35.235.240.0/20'],
          description: `${fw.description || ''} [Locked to Google IAP 35.235.240.0/20 via Health Scanner]`.trim(),
        }
      );
      const msg = `🔒 Locked firewall "${fw.name}" to Google IAP (35.235.240.0/20)!`;
      setActionBanner(msg);
      if (onShowToast) onShowToast(msg);
      if (onRefresh) await onRefresh();
    } catch (err) {
      setActionBanner(
        `⚠️ Failed to lock ${fw.name}: ${err.response?.data?.error || err.message}`
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
        `🧹 Remediated ${zombie.name} (+$${Number(zombie.annualCostUsd || 0).toFixed(2)}/yr saved)!`;
      setActionBanner(msg);
      if (onShowToast) onShowToast(msg);
      await runLiveProjectAudit();
      if (onRefresh) await onRefresh();
    } catch (err) {
      setActionBanner(
        `⚠️ Remediation error: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setBusyActionId(null);
    }
  };

  const totalFindings =
    exposedFirewalls.length + zombies.length + priceDriftCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-violet-500/10">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border font-mono font-extrabold text-sm ${
                healthScore >= 85
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-500'
                  : healthScore >= 65
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-500'
                  : 'bg-rose-500/20 border-rose-500/40 text-rose-500'
              }`}
            >
              {healthScore}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 font-mono">
                  🛡️ 1-Tap Project Health, Drift & FinOps Scanner
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30">
                  {projectId}
                </span>
                <span
                  className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full border ${
                    totalFindings === 0
                      ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                  }`}
                >
                  {totalFindings === 0
                    ? '✅ 0 Active Findings'
                    : `⚠️ ${totalFindings} Actionable Finding${totalFindings > 1 ? 's' : ''}`}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Real-time deterministic scanner for Zombie Waste, Exposed{' '}
                <code className="font-mono">0.0.0.0/0</code> Firewalls, Idle
                Cloud Run Burn, and Live GCP SKU Price Drift.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={runLiveProjectAudit}
              disabled={loadingScan}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 text-white dark:bg-zinc-800 text-xs font-mono font-bold cursor-pointer hover:bg-zinc-700"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loadingScan ? 'animate-spin text-cyan-400' : ''}`}
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
                className="text-zinc-400 hover:text-white"
              >
                ✕
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
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                ${totalAnnualWasteUsd.toFixed(2)}/yr
              </div>
              <div className="text-[10px] text-zinc-500">
                {zombies.length} idle/unattached resource{zombies.length === 1 ? '' : 's'}
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
                {exposedFirewalls.length} Rule{exposedFirewalls.length === 1 ? '' : 's'}
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
                    : 'text-cyan-600 dark:text-cyan-400'
                }`}
              >
                {priceDriftCount} Drift{priceDriftCount === 1 ? '' : 's'}
              </div>
              <div className="text-[10px] text-zinc-500">
                Source: {pricingMeta.source}
              </div>
            </div>
          </div>

          {/* Section 1: Live GCP Billing Catalog & Variable Rate Sync */}
          <div className="space-y-1.5">
            <div className="text-xs font-mono font-extrabold uppercase text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
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
                  className="text-[11px] font-mono font-bold text-cyan-500 hover:underline flex items-center gap-1 cursor-pointer"
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
                          .join(' ' )}{' '}
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
              <div className="text-xs font-mono font-extrabold uppercase text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
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
                  className="text-[11px] font-mono font-bold text-violet-500 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Pre-Crime & 2026 Lab</span>
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
                    className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-rose-500/30 flex flex-wrap items-center justify-between gap-2 text-xs font-mono"
                  >
                    <div>
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">
                        {z.name}{' '}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-500">
                          {z.kind} · {z.location}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-500">{z.reason}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-rose-500">
                        -${Number(z.annualCostUsd || 0).toFixed(2)}/yr
                      </span>
                      <button
                        type="button"
                        disabled={busyActionId === `z-${z.id}`}
                        onClick={() => handleExterminateZombie(z)}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[11px] flex items-center gap-1 cursor-pointer disabled:opacity-50"
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

          {/* Section 4: Live Option 3 AES-256-GCM AI Studio BYOK Vault & Gemini 2.5 SRE Co-Architect */}
          <EngineerMoonshotsWave3
            activeTab="X6"
            projectId={projectId}
            overview={overview}
            onRefreshGlobal={() => {
              fetchDeepAudit();
              if (onRefreshGlobal) onRefreshGlobal();
            }}
          />
        </div>
      </div>
    </div>
  );
}
