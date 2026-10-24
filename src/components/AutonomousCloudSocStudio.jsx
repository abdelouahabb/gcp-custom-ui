import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  RefreshCw,
  Terminal,
  AlertTriangle,
  CheckCircle2,
  Key,
  Layers,
  Eye,
  Crosshair,
  FileCode2,
  Cpu,
  Trash2,
  Zap,
  Activity,
  Server,
  Sparkles,
} from 'lucide-react';

const SOC_PILLARS = [
  {
    id: 'KILL_CHAINS',
    step: '01',
    title: 'MITRE Kill-Chains & SOAR',
    subtitle: 'cloudaudit Behavioral Correlator & /32 IP Quarantine',
    icon: Crosshair,
  },
  {
    id: 'TOXIC_GRAPH',
    step: '02',
    title: 'Toxic Combinations Graph',
    subtitle: 'Public Ingress x Runtime Identity x Crown Jewels',
    icon: ShieldAlert,
  },
  {
    id: 'SUPPLY_CHAIN',
    step: '03',
    title: 'Supply-Chain & SA Keys',
    subtitle: '@sha256 Digest Drift, Secret Refs & .json Key Disabler',
    icon: Key,
  },
  {
    id: 'CANARY_GRID',
    step: '04',
    title: '$0/mo Canary Deception Grid',
    subtitle: 'Honey-Secret, Decoy SA & VPC Recon Trap',
    icon: Eye,
  },
  {
    id: 'AI_COMMANDER',
    step: '05',
    title: 'Gemini SOC Commander & Ed25519',
    subtitle: 'Gemini 3.8 Flash / 3.1 Pro + RFC 8032 Forensic Ledger',
    icon: Sparkles,
  },
];

export default function AutonomousCloudSocStudio({
  projectId,
  onRunInShell,
  onRefreshGlobal,
}) {
  const [activePillar, setActivePillar] = useState('KILL_CHAINS');
  const [lookbackHours, setLookbackHours] = useState(72);
  const [socData, setSocData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionBusy, setActionBusy] = useState('');
  const [statusBanner, setStatusBanner] = useState(null);

  // SOAR IP Quarantine input
  const [quarantineIpInput, setQuarantineIpInput] = useState('');

  // Gemini Incident Commander state
  const [selectedAiModel, setSelectedAiModel] = useState('gemini-3.8-flash');
  const [aiBriefing, setAiBriefing] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchSocOverview = useCallback(
    async (hoursOverride) => {
      if (!projectId) return;
      const hrs = hoursOverride || lookbackHours;
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(
          `/api/project/${encodeURIComponent(projectId)}/soc/overview?hours=${hrs}`
        );
        setSocData(res.data);
      } catch (err) {
        setError(
          err.response?.data?.error ||
            err.message ||
            'Failed to load Autonomous Cloud SOC telemetry.'
        );
      } finally {
        setLoading(false);
      }
    },
    [projectId, lookbackHours]
  );

  useEffect(() => {
    fetchSocOverview();
  }, [fetchSocOverview]);

  const handleExecuteSocAction = async (busyKey, payload) => {
    if (!projectId) return;
    setActionBusy(busyKey);
    setStatusBanner(null);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/soc/action`,
        payload
      );
      setStatusBanner({
        type: 'success',
        message: res.data?.message || 'SOC SOAR action executed.',
        receipt: res.data?.receipt || null,
      });
      await fetchSocOverview();
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err) {
      if (err?.iscloudpulseCanceled || err?.message === 'ACTION_CANCELED_BY_USER') {
        return;
      }
      setStatusBanner({
        type: 'error',
        message:
          err.response?.data?.error ||
          err.message ||
          'SOC containment action failed.',
      });
    } finally {
      setActionBusy('');
    }
  };

  const handleRunAiCommander = async (focusArea = 'FULL_SOC_TRIAGE') => {
    if (!projectId || !socData) return;
    setAiLoading(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/soc/ai-commander`,
        {
          model: selectedAiModel,
          focusArea,
          socSnapshot: socData,
        }
      );
      setAiBriefing(res.data);
      setActivePillar('AI_COMMANDER');
    } catch (err) {
      setStatusBanner({
        type: 'error',
        message:
          err.response?.data?.error ||
          err.message ||
          'Gemini Incident Commander failed.',
      });
    } finally {
      setAiLoading(false);
    }
  };

  const summary = socData?.summary || {
    socPostureScore: 100,
    socGrade: 'A+ (ZERO-TRUST)',
    auditEventsCount: 0,
    killChainsCount: 0,
    criticalChainsCount: 0,
    toxicCombinationsCount: 0,
    totalWorkloadsInspected: 0,
    supplyChainFindingsCount: 0,
    userManagedSaKeysCount: 0,
    deployedCanariesCount: 0,
    canaryHitsCount: 0,
    activeQuarantineRulesCount: 0,
  };

  const killChains = socData?.killChains || [];
  const auditEvents = socData?.auditEvents || [];
  const toxicCombinations = socData?.toxicCombinations || [];
  const supplyChainWorkloads = socData?.supplyChainRadar?.workloads || [];
  const saKeysList = socData?.supplyChainRadar?.serviceAccountKeys || [];
  const canaryGrid = socData?.canaryGrid || [];
  const activeQuarantineRules = socData?.activeQuarantineRules || [];
  const attestation = socData?.cryptographicAttestation || {};

  return (
    <div className="space-y-4">
      {/* Top SOC Command Banner */}
      <div className="p-4 sm:p-5 rounded-2xl border border-cyan-500/35 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-100 shadow-xl space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[10px] font-mono font-extrabold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>WAVE 16 · AUTONOMOUS GOOGLE CLOUD ZERO-TRUST SOC & SOAR WAR-ROOM</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold">
                100% REAL GCP REST APIs · $0.00/MO SIEM LICENSE TAX
              </span>
              {summary.canaryHitsCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-mono font-extrabold animate-pulse">
                  CANARY TRIPWIRE HIT ({summary.canaryHitsCount}) · ACTIVE INTRUSION ALERT
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              Next-Gen Autonomous Cloud Security Operations Center (`{projectId}`)
            </h2>
            <p className="text-xs text-zinc-400 max-w-4xl">
              Correlates live <code className="text-cyan-300">cloudaudit.googleapis.com</code> MITRE ATT&amp;CK kill-chains, maps 3-vector <strong>Toxic Combinations</strong> (<em>Public Ingress &times; Over-Privileged Runtime Identity &times; Crown Jewels</em>), verifies container <code className="text-cyan-300">@sha256</code> supply-chain integrity, arms <strong>$0.00/mo Active Canary Deception Tripwires</strong>, and seals every SOAR containment action in an <strong>Ed25519 (RFC 8032)</strong> cryptographic ledger.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={lookbackHours}
              onChange={(e) => {
                const v = Number(e.target.value);
                setLookbackHours(v);
                fetchSocOverview(v);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-200"
            >
              <option value={24}>Lookback: Last 24 Hours</option>
              <option value={72}>Lookback: Last 72 Hours (3d)</option>
              <option value={168}>Lookback: Last 168 Hours (7d)</option>
            </select>

            <button
              type="button"
              onClick={() => handleRunAiCommander('FULL_SOC_TRIAGE')}
              disabled={aiLoading || loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-extrabold transition-colors cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {aiLoading ? 'Synthesizing Briefing...' : 'Run Gemini SOC Commander'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => fetchSocOverview()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-100 text-xs font-extrabold transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Scanning GCP Control Planes...' : 'Rescan SOC'}</span>
            </button>
          </div>
        </div>

        {/* 5 Live SOC KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800">
            <div className="text-[10px] font-mono text-zinc-400">
              1. Autonomous SOC Posture Grade
            </div>
            <div
              className={`text-lg font-extrabold mt-0.5 ${
                summary.socPostureScore >= 85
                  ? 'text-emerald-400'
                  : summary.socPostureScore >= 65
                  ? 'text-amber-400'
                  : 'text-red-400'
              }`}
            >
              {summary.socPostureScore}/100 · {summary.socGrade}
            </div>
            <div className="text-[10px] font-mono text-zinc-500 mt-0.5 truncate">
              SHA-256: {String(attestation.stateSha256 || '').slice(0, 16) || 'pending'}...
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800">
            <div className="text-[10px] font-mono text-zinc-400">
              2. Behavioral Kill-Chains ({lookbackHours}h)
            </div>
            <div
              className={`text-lg font-extrabold mt-0.5 ${
                summary.criticalChainsCount > 0 ? 'text-red-400' : 'text-cyan-400'
              }`}
            >
              {summary.killChainsCount} Chains ({summary.criticalChainsCount} High/Crit)
            </div>
            <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
              {summary.auditEventsCount} live cloudaudit events correlated
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800">
            <div className="text-[10px] font-mono text-zinc-400">
              3. Toxic Attack-Path Combinations
            </div>
            <div
              className={`text-lg font-extrabold mt-0.5 ${
                summary.toxicCombinationsCount > 0 ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {summary.toxicCombinationsCount} Toxic / {summary.totalWorkloadsInspected} Workloads
            </div>
            <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
              Public Ingress &times; High-Priv SA &times; Data
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800">
            <div className="text-[10px] font-mono text-zinc-400">
              4. Supply-Chain & .json SA Keys
            </div>
            <div
              className={`text-lg font-extrabold mt-0.5 ${
                summary.userManagedSaKeysCount > 0 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {summary.userManagedSaKeysCount} User .json Keys · {summary.supplyChainFindingsCount} Containers
            </div>
            <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
              Checks @sha256 digests &amp; secretKeyRef pins
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800">
            <div className="text-[10px] font-mono text-zinc-400">
              5. $0/mo Active Canary Deception Grid
            </div>
            <div
              className={`text-lg font-extrabold mt-0.5 ${
                summary.canaryHitsCount > 0
                  ? 'text-red-400'
                  : summary.deployedCanariesCount > 0
                  ? 'text-emerald-400'
                  : 'text-zinc-400'
              }`}
            >
              {summary.deployedCanariesCount}/3 Armed · {summary.canaryHitsCount} Tripwire Hits
            </div>
            <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
              {summary.activeQuarantineRulesCount} active /32 IP quarantine rule(s)
            </div>
          </div>
        </div>

        {/* 5-Pillar Navigation Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {SOC_PILLARS.map((p) => {
            const Icon = p.icon;
            const isActive = activePillar === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActivePillar(p.id)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                  isActive
                    ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md'
                    : 'bg-zinc-900/70 hover:bg-zinc-800/80 border-zinc-800 text-zinc-300'
                }`}
              >
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold shrink-0 ${
                    isActive
                      ? 'bg-cyan-400 text-zinc-950'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {p.step}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-extrabold truncate flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                    <span className="truncate">{p.title}</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                    {p.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Status / Receipt Banner */}
      {statusBanner && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-2 ${
            statusBanner.type === 'error'
              ? 'bg-red-500/15 border-red-500/40 text-red-700 dark:text-red-200'
              : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-800 dark:text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusBanner.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span className="font-bold">{statusBanner.message}</span>
            {statusBanner.receipt && (
              <span className="px-2 py-0.5 rounded bg-zinc-900 text-cyan-300 font-mono text-[10px]">
                Ed25519 Signed: {String(statusBanner.receipt.signatureHex || '').slice(0, 20)}...
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="text-[11px] font-mono underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-xs text-red-700 dark:text-red-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ====================================================================
          PILLAR 01: MITRE ATT&CK KILL-CHAINS & 1-CLICK SOAR IP QUARANTINE
         ==================================================================== */}
      {activePillar === 'KILL_CHAINS' && (
        <div className="space-y-4">
          {/* 1-Click SOAR IP/CIDR Perimeter Quarantine Bar */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-red-500" />
                  <span>1-Click SOAR Perimeter IP / CIDR Quarantine (Priority-100 VPC INGRESS DENY ALL)</span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Instantly blocks any suspicious external caller IP or CIDR at the VPC perimeter (<code className="text-red-500">priority: 100, direction: INGRESS, denied: all</code>) with full packet audit logging.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={quarantineIpInput}
                  onChange={(e) => setQuarantineIpInput(e.target.value)}
                  placeholder="e.g. 198.51.100.77/32 or 203.0.113.0/24"
                  className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100 w-64"
                />
                <button
                  type="button"
                  onClick={() =>
                    handleExecuteSocAction('QUARANTINE_IP_MANUAL', {
                      action: 'BLOCK_ATTACKER_IP_CIDR',
                      targetIpCidr: quarantineIpInput,
                    })
                  }
                  disabled={Boolean(actionBusy) || !quarantineIpInput.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>
                    {actionBusy === 'QUARANTINE_IP_MANUAL'
                      ? 'Quarantining IP/CIDR...'
                      : 'Quarantine IP / CIDR Now'}
                  </span>
                </button>
              </div>
            </div>

            {activeQuarantineRules.length > 0 && (
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400">
                  Active SOAR Quarantine Rules in {projectId} ({activeQuarantineRules.length}):
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeQuarantineRules.map((r) => (
                    <div
                      key={r.name}
                      className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-xs font-mono"
                    >
                      <span className="font-bold text-red-600 dark:text-red-300">
                        {r.name}
                      </span>
                      <span className="text-zinc-500">
                        ({(r.sourceRanges || []).join(', ')} · priority {r.priority})
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleExecuteSocAction(`UNBLOCK:${r.name}`, {
                            action: 'DELETE_QUARANTINE_RULE',
                            firewallRuleName: r.name,
                          })
                        }
                        disabled={Boolean(actionBusy)}
                        className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-[10px] text-zinc-700 dark:text-zinc-300 cursor-pointer"
                      >
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Behavioral Kill-Chains Cards */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                  Correlated Actor Behavioral Kill-Chains (`cloudaudit.googleapis.com` · Grouped by Principal &amp; Caller IP)
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Groups raw Cloud Audit API calls by <code className="font-mono">(principalEmail, callerIp)</code> and scores multi-tactic progression across MITRE ATT&amp;CK Cloud matrices.
                </p>
              </div>
              <span className="text-xs font-mono text-zinc-500">
                {killChains.length} Actor Chain(s)
              </span>
            </div>

            {killChains.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500 font-mono">
                No Cloud Audit events found in the selected window.
              </div>
            ) : (
              <div className="space-y-2.5">
                {killChains.map((chain) => {
                  const isCrit =
                    chain.severityLevel === 'CRITICAL' ||
                    chain.severityLevel === 'HIGH';
                  const canBlockIp =
                    chain.callerIp &&
                    chain.callerIp !== 'internal-gcp-backbone' &&
                    chain.callerIp !== '127.0.0.1' &&
                    !chain.callerIp.includes(':');
                  return (
                    <div
                      key={chain.id}
                      className={`p-3.5 rounded-xl border space-y-2 ${
                        chain.hasCanaryHit
                          ? 'border-red-500 bg-red-500/10'
                          : isCrit
                          ? 'border-amber-500/40 bg-amber-500/5'
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-extrabold ${
                              chain.hasCanaryHit
                                ? 'bg-red-600 text-white'
                                : chain.severityLevel === 'CRITICAL'
                                ? 'bg-red-500/20 text-red-600 dark:text-red-300 border border-red-500/40'
                                : chain.severityLevel === 'HIGH'
                                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                            }`}
                          >
                            RISK {chain.riskScore}/100 · {chain.severityLevel}
                          </span>
                          <span className="font-mono text-xs font-extrabold text-zinc-900 dark:text-white">
                            {chain.principalEmail}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono text-[10px]">
                            IP: {chain.callerIp}
                          </span>
                          <span className="text-[11px] font-mono text-zinc-500">
                            {chain.eventsCount} API Call(s)
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {canBlockIp && (
                            <button
                              type="button"
                              onClick={() =>
                                handleExecuteSocAction(`BLOCK_CHAIN:${chain.id}`, {
                                  action: 'BLOCK_ATTACKER_IP_CIDR',
                                  targetIpCidr: `${chain.callerIp}/32`,
                                })
                              }
                              disabled={Boolean(actionBusy)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-mono font-bold cursor-pointer disabled:opacity-50"
                            >
                              <Lock className="w-3 h-3" />
                              <span>Quarantine {chain.callerIp}/32</span>
                            </button>
                          )}
                          {onRunInShell && (
                            <button
                              type="button"
                              onClick={() =>
                                onRunInShell(
                                  `gcloud logging read 'protoPayload.authenticationInfo.principalEmail="${chain.principalEmail}"' --project=${projectId} --limit=15`
                                )
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-[11px] font-mono text-zinc-800 dark:text-zinc-200 cursor-pointer"
                            >
                              <Terminal className="w-3 h-3" />
                              <span>Audit CLI</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                        <span className="text-zinc-400">MITRE Tactics:</span>
                        {(chain.tactics || []).map((t) => (
                          <span
                            key={t}
                            className="px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 text-[10px]"
                          >
                            {t}
                          </span>
                        ))}
                        <span className="text-zinc-400 ml-2">Methods:</span>
                        <span className="text-zinc-600 dark:text-zinc-300 truncate">
                          {(chain.sampleMethods || []).join(' -> ')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          PILLAR 02: TOXIC COMBINATIONS ATTACK-PATH GRAPH ENGINE
         ==================================================================== */}
      {activePillar === 'TOXIC_GRAPH' && (
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                3-Vector &ldquo;Toxic Combination&rdquo; Attack-Path Graph (Public Ingress &times; Runtime Identity &times; Crown Jewels)
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Flags any Cloud Run service, VPC Firewall rule, or App Engine endpoint that combines unauthenticated internet ingress with high-privilege runtime identities and live project data.
              </p>
            </div>
            <span className="text-xs font-mono text-zinc-500">
              {toxicCombinations.length} Workload Entrypoint(s)
            </span>
          </div>

          <div className="space-y-2.5">
            {toxicCombinations.map((item) => {
              const isToxic = item.status === 'TOXIC_EXPOSED_PATH';
              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border space-y-2.5 ${
                    isToxic
                      ? 'border-red-500/50 bg-red-500/5'
                      : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-extrabold ${
                          isToxic
                            ? 'bg-red-600 text-white'
                            : item.severity === 'MEDIUM'
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        {item.status}
                      </span>
                      <span className="font-mono text-xs font-extrabold text-zinc-900 dark:text-white">
                        [{item.workloadType}] {item.workloadName}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-500">
                        ({item.region})
                      </span>
                    </div>

                    {isToxic && (
                      <button
                        type="button"
                        onClick={() =>
                          handleExecuteSocAction(`REMEDIATE:${item.id}`, {
                            action: item.remediationAction,
                            serviceName: item.workloadName,
                            region: item.region,
                            firewallRuleName: item.workloadName,
                          })
                        }
                        disabled={Boolean(actionBusy)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold cursor-pointer disabled:opacity-50"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>
                          {actionBusy === `REMEDIATE:${item.id}`
                            ? 'Applying Zero-Trust Lock...'
                            : item.remediationLabel}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* 3-Vector Attack Path Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 font-mono text-[11px]">
                    <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                      <div className="text-[10px] text-zinc-400">
                        Vector 1 · Network Ingress
                      </div>
                      <div className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                        {item.vector1Ingress}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                      <div className="text-[10px] text-zinc-400">
                        Vector 2 · Runtime Identity &amp; Scope
                      </div>
                      <div className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5 truncate">
                        {item.vector2Identity}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                      <div className="text-[10px] text-zinc-400">
                        Vector 3 · Reachable Crown Jewels
                      </div>
                      <div className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                        {item.vector3CrownJewels}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ====================================================================
          PILLAR 03: SUPPLY-CHAIN INTEGRITY & SERVICE ACCOUNT .JSON KEYS
         ==================================================================== */}
      {activePillar === 'SUPPLY_CHAIN' && (
        <div className="space-y-4">
          {/* User-Managed .json Service Account Keys Table */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3">
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-500" />
              <span>IAM Service Account User-Managed `.json` Key Auditor &amp; 1-Click Disabler (`iam.googleapis.com/v1`)</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              User-managed Service Account `.json` keys never expire by default and are the #1 root cause of cloud breaches. Disable leaked or legacy `.json` keys in 1 click.
            </p>

            <div className="space-y-2">
              {saKeysList.map((sa) => (
                <div
                  key={sa.email}
                  className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/50 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-extrabold text-zinc-900 dark:text-white">
                        {sa.email}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          sa.userManagedKeysCount > 0
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        {sa.userManagedKeysCount} User-Managed .json Key(s)
                      </span>
                    </div>
                  </div>

                  {sa.keys && sa.keys.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {sa.keys.map((k) => (
                        <div
                          key={k.keyId}
                          className="p-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono"
                        >
                          <div>
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">
                              Key ID: {k.keyId.slice(0, 16)}...
                            </span>{' '}
                            <span className="text-zinc-500">
                              · Created: {k.validAfterTime || 'unknown'} · Status:{' '}
                              {k.disabled ? 'DISABLED' : 'ENABLED'}
                            </span>
                          </div>
                          {!k.disabled && (
                            <button
                              type="button"
                              onClick={() =>
                                handleExecuteSocAction(`DISABLE_KEY:${k.keyId}`, {
                                  action: 'DISABLE_SERVICE_ACCOUNT_KEY',
                                  serviceAccountEmail: sa.email,
                                  keyId: k.keyId,
                                })
                              }
                              disabled={Boolean(actionBusy)}
                              className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold cursor-pointer disabled:opacity-50"
                            >
                              Disable .json Key
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Container Supply-Chain Table */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3">
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
              Cloud Run Container Image `@sha256` Digest &amp; `secretKeyRef` Pinning Radar
            </h3>
            <div className="space-y-2">
              {supplyChainWorkloads.map((w) => (
                <div
                  key={w.id}
                  className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/50 flex flex-wrap items-center justify-between gap-2 text-xs font-mono"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          w.posture === 'SLSA_HARDENED'
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                            : 'bg-amber-500/20 text-amber-600 dark:text-amber-300'
                        }`}
                      >
                        {w.posture}
                      </span>
                      <span className="font-extrabold text-zinc-900 dark:text-white">
                        {w.serviceName} ({w.containerName})
                      </span>
                      <span className="text-zinc-500">{w.region}</span>
                    </div>
                    <div className="text-[11px] text-zinc-500 break-all">
                      Image: {w.imageUri} · Digest Pinned:{' '}
                      <strong>{w.isDigestPinned ? 'YES (@sha256)' : 'NO (Mutable Tag)'}</strong>{' '}
                      · Trusted GCP Registry:{' '}
                      <strong>{w.isTrustedGcpRegistry ? 'YES' : 'NO (External)'}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          PILLAR 04: $0.00/MO ACTIVE CANARY & TRIPWIRE DECEPTION GRID
         ==================================================================== */}
      {activePillar === 'CANARY_GRID' && (
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-500" />
                <span>Zero-Cost ($0.00/mo) Active Canary &amp; Tripwire Deception Grid</span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Deploy real, $0.00/mo decoy GCP assets that no legitimate workload ever touches. Any access in <code className="font-mono">cloudaudit.googleapis.com</code> is a 100% confirmed intrusion with 0% false positives.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  handleExecuteSocAction('DEPLOY_ALL_CANARIES', {
                    action: 'DEPLOY_ZERO_COST_CANARY_TRAP',
                    canaryType: 'ALL',
                  })
                }
                disabled={Boolean(actionBusy)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-extrabold cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  {actionBusy === 'DEPLOY_ALL_CANARIES'
                    ? 'Arming All 3 $0/mo Canaries...'
                    : 'Arm All 3 $0.00/mo Canary Tripwires'}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleExecuteSocAction('CANARY_DRILL', {
                    action: 'TRIGGER_LIVE_CANARY_AUDIT_TEST',
                  })
                }
                disabled={Boolean(actionBusy)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-extrabold cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>
                  {actionBusy === 'CANARY_DRILL'
                    ? 'Writing Real Canary Audit Event...'
                    : 'Trigger Live Canary Intrusion Drill (entries:write)'}
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {canaryGrid.map((c) => (
              <div
                key={c.id}
                className={`p-4 rounded-xl border space-y-2.5 flex flex-col justify-between ${
                  c.hitsCount > 0
                    ? 'border-red-500 bg-red-500/10'
                    : c.deployed
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-extrabold ${
                        c.deployed
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40'
                          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {c.deployed ? 'ARMED ($0.00/MO)' : 'NOT DEPLOYED'}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-red-500">
                      {c.hitsCount} Hit(s)
                    </span>
                  </div>
                  <div className="text-xs font-extrabold text-zinc-900 dark:text-white">
                    {c.title}
                  </div>
                  <div className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 break-all">
                    {c.name}
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {c.costExplanation}
                  </p>
                  <p className="text-[10px] font-mono text-zinc-500">
                    {c.detectionSignal}
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  {!c.deployed ? (
                    <button
                      type="button"
                      onClick={() =>
                        handleExecuteSocAction(`ARM:${c.id}`, {
                          action: 'DEPLOY_ZERO_COST_CANARY_TRAP',
                          canaryType: c.id,
                        })
                      }
                      disabled={Boolean(actionBusy)}
                      className="w-full py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-extrabold cursor-pointer disabled:opacity-50"
                    >
                      Arm $0.00/mo Tripwire
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        handleExecuteSocAction(`TEARDOWN:${c.id}`, {
                          action: 'TEARDOWN_CANARY_TRAP',
                          canaryType: c.id,
                        })
                      }
                      disabled={Boolean(actionBusy)}
                      className="w-full py-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-mono font-bold cursor-pointer disabled:opacity-50"
                    >
                      Disarm &amp; Delete Canary
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================
          PILLAR 05: GEMINI 3.8 FLASH / 3.1 PRO INCIDENT COMMANDER & Ed25519
         ==================================================================== */}
      {activePillar === 'AI_COMMANDER' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  <span>Gemini 3.8 Flash &amp; 3.1 Pro Autonomous SOC Incident Commander</span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Synthesizes live <code className="font-mono">cloudaudit</code> kill-chains, toxic attack paths, and canary tripwire status into an Ed25519-signed forensic briefing and containment runbook.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedAiModel}
                  onChange={(e) => setSelectedAiModel(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono"
                >
                  <option value="gemini-3.8-flash">gemini-3.8-flash (Fast SOC Triage)</option>
                  <option value="gemini-3.1-pro">gemini-3.1-pro (Deep Forensic Reasoning)</option>
                </select>
                <button
                  type="button"
                  onClick={() => handleRunAiCommander('FULL_SOC_TRIAGE')}
                  disabled={aiLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-extrabold cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {aiLoading ? 'Generating Briefing...' : 'Generate Signed SOC Briefing'}
                  </span>
                </button>
              </div>
            </div>

            {aiBriefing && (
              <div className="p-4 rounded-xl bg-zinc-950 border border-violet-500/40 text-zinc-100 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-violet-300 border-b border-zinc-800 pb-2">
                  <span>Model: {aiBriefing.model}</span>
                  {aiBriefing.receipt && (
                    <span>
                      Ed25519 Signature: {String(aiBriefing.receipt.signatureHex || '').slice(0, 28)}...
                    </span>
                  )}
                </div>
                <pre className="text-xs font-mono whitespace-pre-wrap text-zinc-200 leading-relaxed overflow-x-auto">
                  {aiBriefing.briefingMarkdown}
                </pre>
              </div>
            )}
          </div>

          {/* Cryptographic Ed25519 Forensic Receipt Ledger */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3">
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
              Ed25519 (RFC 8032) &amp; SHA-256 Hash-Chained SOC Forensic Ledger
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-[11px] font-mono">
              <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div className="text-zinc-400">Canonical State SHA-256 Digest:</div>
                <div className="font-bold text-cyan-600 dark:text-cyan-400 break-all mt-0.5">
                  {attestation.stateSha256 || 'pending'}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div className="text-zinc-400">Ed25519 State Signature (RFC 8032):</div>
                <div className="font-bold text-emerald-600 dark:text-emerald-400 break-all mt-0.5">
                  {attestation.stateEd25519Signature || 'pending'}
                </div>
              </div>
            </div>

            {Array.isArray(attestation.forensicReceipts) &&
              attestation.forensicReceipts.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Signed SOAR Containment &amp; Canary Receipts ({attestation.forensicReceipts.length}):
                  </div>
                  {attestation.forensicReceipts.map((rcpt) => (
                    <div
                      key={rcpt.id}
                      className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono space-y-1"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-extrabold text-zinc-900 dark:text-white">
                          [{rcpt.action}] {rcpt.target}
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          Ed25519 Verified · {rcpt.timestamp}
                        </span>
                      </div>
                      <div className="text-zinc-500">{rcpt.details}</div>
                      <div className="text-[10px] text-zinc-400 break-all">
                        Chain: {rcpt.prevHash.slice(0, 16)}... -&gt; {rcpt.receiptHash.slice(0, 16)}... · Sig: {rcpt.signatureHex.slice(0, 24)}...
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
