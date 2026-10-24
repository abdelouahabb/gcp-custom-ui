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
  {
    id: 'IAM_TIME_MACHINE',
    step: '06',
    title: 'IAM Policy Time-Machine',
    subtitle: 'Ed25519 etag Vault & 1-Click Atomic setIamPolicy Rollback',
    icon: Layers,
  },
  {
    id: 'EXFILTRATION_RADAR',
    step: '07',
    title: 'Exfiltration & Log Tampering',
    subtitle: 'Log Sinks, Audit Exclusions & GCS Public Access Lock',
    icon: FileCode2,
  },
  {
    id: 'WIF_IDENTITY_FREEZE',
    step: '08',
    title: 'WIF & Service Account Freeze',
    subtitle: 'OIDC Federation Pools & 1-Click SA Freeze/Unfreeze',
    icon: Cpu,
  },
  {
    id: 'FLEET_SOC_MATRIX',
    step: '09',
    title: 'Multi-Project SOC Federation',
    subtitle: 'Cross-Estate Posture Matrix Across All Active Projects',
    icon: Server,
  },
  {
    id: 'DEFCON1_LOCKDOWN',
    step: '10',
    title: 'Defcon-1 Atomic Lockdown',
    subtitle: '1-Click 5-Stage Coordinated Project Perimeter Seal',
    icon: Lock,
  },
  {
    id: 'IAM_ESCALATION_SOLVER',
    step: '11',
    title: 'Transitive IAM Escalation',
    subtitle: 'actAs / TokenCreator / setIamPolicy Graph & 1-Click Sever',
    icon: ShieldAlert,
  },
  {
    id: 'VM_METADATA_SHIELDED',
    step: '12',
    title: 'VM vTPM & 169.254.169.254',
    subtitle: 'OS Login, Serial-Port Backdoor & SSH-Key Forensics',
    icon: Terminal,
  },
  {
    id: 'TLS_HEADER_DEEP_PROBE',
    step: '13',
    title: 'Live TLS 1.3 & HTTP Headers',
    subtitle: 'Real X.509 Socket Handshake, HSTS/CSP & Unauth Probe',
    icon: Activity,
  },
  {
    id: 'DATA_DLP_SECRET_HYGIENE',
    step: '14',
    title: 'BigQuery DLP & Secret Rotation',
    subtitle: 'PII Schema Classifier, Public ACLs & 1-Click Secret Rotate',
    icon: Key,
  },
  {
    id: 'PURPLE_TEAM_BAS_ARENA',
    step: '15',
    title: 'Purple-Team BAS Stopwatch',
    subtitle: '4-Stage Live MITRE Attack Simulation & SIEM Latency Proof',
    icon: Zap,
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
  const [checkpointLabelInput, setCheckpointLabelInput] = useState('');

  // Multi-Project SOC Federation Matrix (Pillar 09)
  const [fleetMatrix, setFleetMatrix] = useState(null);
  const [fleetLoading, setFleetLoading] = useState(false);

  // Live TLS 1.3 & HTTP Header Deep Probe (Pillar 13)
  const [deepProbeResult, setDeepProbeResult] = useState(null);
  const [deepProbeLoading, setDeepProbeLoading] = useState(false);

  // Purple-Team Breach & Attack Simulation Stopwatch (Pillar 15)
  const [purpleDrillResult, setPurpleDrillResult] = useState(null);
  const [purpleDrillLoading, setPurpleDrillLoading] = useState(false);

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

  const fetchFleetSocMatrix = useCallback(async () => {
    setFleetLoading(true);
    try {
      const res = await axios.get('/api/soc/fleet-matrix');
      setFleetMatrix(res.data);
    } catch (err) {
      setStatusBanner({
        type: 'error',
        message:
          err.response?.data?.error ||
          err.message ||
          'Failed to load Multi-Project SOC Federation Matrix.',
      });
    } finally {
      setFleetLoading(false);
    }
  }, []);

  const handleRunDeepProbe = useCallback(async () => {
    if (!projectId) return;
    setDeepProbeLoading(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/soc/deep-probe`
      );
      setDeepProbeResult(res.data);
    } catch (err) {
      setStatusBanner({
        type: 'error',
        message:
          err.response?.data?.error ||
          err.message ||
          'Failed to execute live TLS 1.3 & HTTP header deep probe.',
      });
    } finally {
      setDeepProbeLoading(false);
    }
  }, [projectId]);

  const handleRunPurpleTeamDrill = async () => {
    if (!projectId) return;
    setPurpleDrillLoading(true);
    setStatusBanner(null);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/soc/purple-team-drill`
      );
      setPurpleDrillResult(res.data);
      setStatusBanner({
        type: 'success',
        message: res.data?.message || 'Purple-Team BAS drill completed!',
        receipt: res.data?.receipt || null,
      });
      await fetchSocOverview();
    } catch (err) {
      setStatusBanner({
        type: 'error',
        message:
          err.response?.data?.error ||
          err.message ||
          'Purple-Team BAS drill failed.',
      });
    } finally {
      setPurpleDrillLoading(false);
    }
  };

  useEffect(() => {
    fetchSocOverview();
  }, [fetchSocOverview]);

  useEffect(() => {
    if (activePillar === 'FLEET_SOC_MATRIX' && !fleetMatrix && !fleetLoading) {
      fetchFleetSocMatrix();
    }
    if (
      activePillar === 'TLS_HEADER_DEEP_PROBE' &&
      !deepProbeResult &&
      !deepProbeLoading
    ) {
      handleRunDeepProbe();
    }
  }, [
    activePillar,
    fleetMatrix,
    fleetLoading,
    fetchFleetSocMatrix,
    deepProbeResult,
    deepProbeLoading,
    handleRunDeepProbe,
  ]);

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
  const iamTimeMachine = socData?.iamTimeMachine || {
    liveEtag: 'unknown',
    totalBindingsCount: 0,
    totalPrincipalsCount: 0,
    privilegedBindings: [],
    driftDetected: false,
    addedBindings: [],
    removedBindings: [],
    checkpoints: [],
  };
  const exfiltrationRadar = socData?.exfiltrationRadar || {
    logSinks: [],
    logExclusions: [],
    gcsBuckets: [],
    externalSinksCount: 0,
    suspiciousExclusionsCount: 0,
    unhardenedBucketsCount: 0,
  };
  const wifAndIdentityRadar = socData?.wifAndIdentityRadar || {
    wifPools: [],
    serviceAccounts: [],
    activeWifPoolsCount: 0,
    frozenServiceAccountsCount: 0,
    highPrivilegeSaCount: 0,
  };
  const iamEscalationGraph = socData?.iamEscalationGraph || {
    totalPathsCount: 0,
    criticalPathsCount: 0,
    customPrincipalPathsCount: 0,
    paths: [],
  };
  const vmMetadataAndShieldedRadar = socData?.vmMetadataAndShieldedRadar || {
    projectOsLoginEnabled: false,
    projectSerialPortEnabled: false,
    projectWideSshKeysCount: 0,
    projectWideSshKeys: [],
    hasProjectStartupScript: false,
    vmsInspectedCount: 0,
    vms: [],
    postureStatus: 'METADATA_HARDENING_RECOMMENDED',
  };
  const dataDlpAndSecretHygiene = socData?.dataDlpAndSecretHygiene || {
    datasets: [],
    secrets: [],
    publicDatasetsCount: 0,
    piiColumnsCount: 0,
    staleSecretsCount: 0,
  };
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
                <span>WAVE 16 · 15-PILLAR AUTONOMOUS GOOGLE CLOUD ZERO-TRUST SOC &amp; PURPLE-TEAM SOAR WAR-ROOM</span>
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
              onClick={() => setActivePillar('DEFCON1_LOCKDOWN')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Defcon-1 Lockdown</span>
            </button>

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

      {/* ====================================================================
          PILLAR 06: IAM POLICY TIME-MACHINE & CRYPTOGRAPHIC ETAG SNAPSHOT VAULT
         ==================================================================== */}
      {activePillar === 'IAM_TIME_MACHINE' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-500" />
                  <span>
                    IAM Policy Time-Machine, Cryptographic `etag` Vault &amp; 1-Click Atomic `setIamPolicy` Rollback
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Snapshots <code className="font-mono">cloudresourcemanager.googleapis.com/v1/projects/{projectId}:getIamPolicy</code> with an <strong>Ed25519 signature</strong>, computes live binding-level drift, and executes 1-click atomic rollback while strictly preserving your authenticated <code className="font-mono">roles/owner</code> binding.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={checkpointLabelInput}
                  onChange={(e) => setCheckpointLabelInput(e.target.value)}
                  placeholder="Checkpoint label (e.g. Pre-Deploy Golden IAM)"
                  className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100 w-64"
                />
                <button
                  type="button"
                  onClick={() => {
                    handleExecuteSocAction('CAPTURE_IAM_CP', {
                      action: 'CAPTURE_IAM_CHECKPOINT',
                      checkpointLabel:
                        checkpointLabelInput.trim() ||
                        `Golden IAM Snapshot (${new Date().toLocaleTimeString()})`,
                    });
                    setCheckpointLabelInput('');
                  }}
                  disabled={Boolean(actionBusy)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-extrabold cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>
                    {actionBusy === 'CAPTURE_IAM_CP'
                      ? 'Snapshotting IAM Policy...'
                      : 'Capture Signed IAM Checkpoint'}
                  </span>
                </button>
              </div>
            </div>

            {/* Live IAM Metadata & Drift Status */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs font-mono">
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div className="text-[10px] text-zinc-400">Live IAM Policy etag</div>
                <div className="font-bold text-cyan-600 dark:text-cyan-400 truncate mt-0.5">
                  {iamTimeMachine.liveEtag}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div className="text-[10px] text-zinc-400">Role Bindings &amp; Principals</div>
                <div className="font-bold text-zinc-900 dark:text-white mt-0.5">
                  {iamTimeMachine.totalBindingsCount} Roles · {iamTimeMachine.totalPrincipalsCount} Grants
                </div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div className="text-[10px] text-zinc-400">Drift vs Baseline Snapshot</div>
                <div
                  className={`font-bold mt-0.5 ${
                    iamTimeMachine.driftDetected
                      ? 'text-amber-500'
                      : 'text-emerald-500'
                  }`}
                >
                  {iamTimeMachine.driftDetected
                    ? `+${iamTimeMachine.addedBindings.length} / -${iamTimeMachine.removedBindings.length} Bindings Drifted`
                    : '0 Drift (Matches Baseline)'}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div className="text-[10px] text-zinc-400">Signed Vault Checkpoints</div>
                <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {iamTimeMachine.checkpoints.length} Ed25519 Checkpoint(s)
                </div>
              </div>
            </div>

            {/* Checkpoints List & 1-Click Rollback */}
            <div className="space-y-2 pt-2">
              <div className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200">
                Cryptographic IAM Policy Checkpoints (`socIamCheckpointsByProject`):
              </div>
              {iamTimeMachine.checkpoints.map((cp) => (
                <div
                  key={cp.checkpointId}
                  className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 flex flex-wrap items-center justify-between gap-2 text-xs font-mono"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 font-bold text-[10px]">
                        {cp.checkpointId}
                      </span>
                      <span className="font-extrabold text-zinc-900 dark:text-white">
                        {cp.label}
                      </span>
                      <span className="text-zinc-500">
                        etag: {cp.etag} · {cp.bindingsCount} roles · {cp.membersCount} principals
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-500 break-all">
                      Captured: {cp.capturedAt} by {cp.actor} · SHA-256: {String(cp.sha256 || '').slice(0, 20)}... · Ed25519: {String(cp.ed25519Signature || '').slice(0, 24)}...
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleExecuteSocAction(`RESTORE_IAM:${cp.checkpointId}`, {
                        action: 'RESTORE_IAM_CHECKPOINT',
                        checkpointId: cp.checkpointId,
                      })
                    }
                    disabled={Boolean(actionBusy)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-extrabold cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>
                      {actionBusy === `RESTORE_IAM:${cp.checkpointId}`
                        ? 'Rolling Back IAM...'
                        : 'Atomic Rollback to Checkpoint'}
                    </span>
                  </button>
                </div>
              ))}
            </div>

            {/* Privileged Role Bindings Inspector */}
            <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <div className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200">
                Live High-Privilege IAM Role Bindings (`roles/owner`, `roles/editor`, `roles/*.admin`):
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {iamTimeMachine.privilegedBindings.map((b) => (
                  <div
                    key={b.role}
                    className={`p-2.5 rounded-lg border text-xs font-mono space-y-1 ${
                      b.isCriticalAdmin
                        ? 'border-amber-500/40 bg-amber-500/5'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40'
                    }`}
                  >
                    <div className="font-extrabold text-zinc-900 dark:text-white flex items-center justify-between">
                      <span>{b.role}</span>
                      <span className="text-[10px] text-zinc-500">
                        {b.members.length} member(s)
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-600 dark:text-zinc-300 space-y-0.5">
                      {b.members.map((m) => (
                        <div key={m} className="truncate">
                          &bull; {m}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          PILLAR 07: EXFILTRATION, LOGGING SINK TAMPERING & GCS FIREWALL
         ==================================================================== */}
      {activePillar === 'EXFILTRATION_RADAR' && (
        <div className="space-y-4">
          {/* GCS Public Access Prevention & Uniform Access Lock */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                  GCS Crown-Jewel Exfiltration Firewall (`publicAccessPrevention` &amp; `uniformBucketLevelAccess`)
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Inspects every Cloud Storage bucket in <code className="font-mono">{projectId}</code> and enforces <code className="font-mono">publicAccessPrevention: &quot;enforced&quot;</code> + Uniform Bucket-Level Access in 1 click.
                </p>
              </div>
              <span className="text-xs font-mono text-zinc-500">
                {exfiltrationRadar.gcsBuckets.length} Bucket(s)
              </span>
            </div>

            {exfiltrationRadar.gcsBuckets.length === 0 ? (
              <div className="p-4 text-xs font-mono text-zinc-500">
                No Cloud Storage buckets provisioned in {projectId}.
              </div>
            ) : (
              <div className="space-y-2">
                {exfiltrationRadar.gcsBuckets.map((b) => {
                  const isLocked = b.status === 'ZERO_TRUST_LOCKED';
                  return (
                    <div
                      key={b.name}
                      className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-2 text-xs font-mono ${
                        isLocked
                          ? 'border-emerald-500/30 bg-emerald-500/5'
                          : 'border-amber-500/40 bg-amber-500/5'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              isLocked
                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                                : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                            }`}
                          >
                            {b.status}
                          </span>
                          <span className="font-extrabold text-zinc-900 dark:text-white">
                            gs://{b.name}
                          </span>
                          <span className="text-zinc-500">
                            ({b.location} · {b.storageClass})
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          publicAccessPrevention: <strong>{b.publicAccessPrevention}</strong> · uniformBucketLevelAccess: <strong>{b.uniformBucketLevelAccess ? 'true' : 'false'}</strong>
                        </div>
                      </div>

                      {!isLocked && (
                        <button
                          type="button"
                          onClick={() =>
                            handleExecuteSocAction(`LOCK_BUCKET:${b.name}`, {
                              action: 'LOCK_GCS_BUCKET_PUBLIC_ACCESS',
                              bucketName: b.name,
                            })
                          }
                          disabled={Boolean(actionBusy)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold cursor-pointer disabled:opacity-50"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>
                            {actionBusy === `LOCK_BUCKET:${b.name}`
                              ? 'Locking Bucket...'
                              : 'Enforce Zero-Trust Bucket Lock'}
                          </span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cloud Logging Sinks & Audit Exclusions Tampering Detector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-2.5">
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                Cloud Logging Sinks (`logging.googleapis.com/v2/sinks`)
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Detects unauthorized cross-project log export sinks used for silent telemetry exfiltration.
              </p>
              <div className="space-y-2">
                {exfiltrationRadar.logSinks.map((s) => (
                  <div
                    key={s.name}
                    className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-xs font-mono space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-zinc-900 dark:text-white">
                        {s.name}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.isExternalExfiltrationRisk
                            ? 'bg-red-500/20 text-red-500'
                            : 'bg-emerald-500/20 text-emerald-500'
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500 break-all">
                      Destination: {s.destination || 'Internal Cloud Logging Bucket'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-2.5">
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                Audit Log Suppression / Exclusions (`logging.googleapis.com/v2/exclusions`)
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Attackers create log exclusions to blind SIEMs during privilege escalation. Delete suspicious exclusions in 1 click.
              </p>
              {exfiltrationRadar.logExclusions.length === 0 ? (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-600 dark:text-emerald-300">
                  0 Log Exclusions Active — 100% of Cloud Audit Logs are retained without suppression.
                </div>
              ) : (
                <div className="space-y-2">
                  {exfiltrationRadar.logExclusions.map((ex) => (
                    <div
                      key={ex.name}
                      className="p-2.5 rounded-lg border border-amber-500/40 bg-amber-500/5 text-xs font-mono flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-zinc-900 dark:text-white">
                          {ex.name} ({ex.status})
                        </div>
                        <div className="text-[10px] text-zinc-500 break-all">
                          Filter: {ex.filter}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleExecuteSocAction(`DEL_EXCL:${ex.name}`, {
                            action: 'DELETE_LOG_EXCLUSION',
                            exclusionName: ex.name,
                          })
                        }
                        disabled={Boolean(actionBusy)}
                        className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold cursor-pointer"
                      >
                        Delete Exclusion
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          PILLAR 08: WORKLOAD IDENTITY FEDERATION (WIF) & SERVICE ACCOUNT FREEZE
         ==================================================================== */}
      {activePillar === 'WIF_IDENTITY_FREEZE' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-500" />
                  <span>
                    1-Click Service Account In-Place Freeze / Unfreeze (`serviceAccounts:disable` &amp; `:enable`)
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Halts all OAuth2/JWT token minting for a compromised or over-privileged Service Account in-place without deleting the identity or breaking IAM policy references.
                </p>
              </div>
              <span className="text-xs font-mono text-zinc-500">
                {wifAndIdentityRadar.serviceAccounts.length} Service Account(s) · {wifAndIdentityRadar.frozenServiceAccountsCount} Frozen
              </span>
            </div>

            <div className="space-y-2">
              {wifAndIdentityRadar.serviceAccounts.map((sa) => (
                <div
                  key={sa.email}
                  className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-2 text-xs font-mono ${
                    sa.disabled
                      ? 'border-zinc-500/40 bg-zinc-500/10'
                      : sa.isHighPrivilege
                      ? 'border-amber-500/40 bg-amber-500/5'
                      : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          sa.disabled
                            ? 'bg-zinc-700 text-zinc-200'
                            : sa.isHighPrivilege
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                        }`}
                      >
                        {sa.status}
                      </span>
                      <span className="font-extrabold text-zinc-900 dark:text-white">
                        {sa.email}
                      </span>
                      <span className="text-zinc-500">({sa.displayName})</span>
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      Roles:{' '}
                      {sa.roles.length > 0
                        ? sa.roles.join(', ')
                        : 'No direct project-level roles'}{' '}
                      · User .json Keys: <strong>{sa.userManagedKeysCount}</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleExecuteSocAction(`SA_FREEZE:${sa.email}`, {
                        action: 'TOGGLE_SERVICE_ACCOUNT_FREEZE',
                        serviceAccountEmail: sa.email,
                        freeze: !sa.disabled,
                      })
                    }
                    disabled={Boolean(actionBusy)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer disabled:opacity-50 ${
                      sa.disabled
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-red-600 hover:bg-red-500 text-white'
                    }`}
                  >
                    {sa.disabled ? (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Unfreeze Service Account</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Freeze SA In-Place (:disable)</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Workload Identity Federation (WIF) Pools */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-2.5">
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
              Workload Identity Federation (WIF) OIDC / AWS / GitHub Pools (`workloadIdentityPools`)
            </h3>
            {wifAndIdentityRadar.wifPools.length === 0 ? (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-600 dark:text-emerald-300">
                0 External Workload Identity Federation Pools configured — Zero external OIDC/GitHub repository trust surface.
              </div>
            ) : (
              <div className="space-y-2">
                {wifAndIdentityRadar.wifPools.map((p) => (
                  <div
                    key={p.fullName}
                    className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-mono flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-zinc-900 dark:text-white">
                        {p.displayName} ({p.name})
                      </div>
                      <div className="text-[11px] text-zinc-500">{p.description}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-[10px] font-bold">
                      {p.state}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          PILLAR 09: MULTI-PROJECT SOC FEDERATION MATRIX
         ==================================================================== */}
      {activePillar === 'FLEET_SOC_MATRIX' && (
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-cyan-500" />
                <span>
                  Cross-Project Multi-Estate SOC Federation Matrix (`cloudresourcemanager.googleapis.com/v1/projects`)
                </span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Discovers all <code className="font-mono">ACTIVE</code> Google Cloud projects on your authenticated account and probes VPC Firewalls, GCS Buckets, IAM Service Accounts, and App Engine edge firewalls in parallel.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchFleetSocMatrix}
              disabled={fleetLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-extrabold cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${fleetLoading ? 'animate-spin' : ''}`} />
              <span>
                {fleetLoading ? 'Probing Multi-Project Estate...' : 'Rescan All GCP Projects'}
              </span>
            </button>
          </div>

          {fleetMatrix ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                <span className="px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-600 dark:text-cyan-300 font-bold">
                  Active Projects Scanned: {fleetMatrix.projectsCount}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 font-bold">
                  Fleet Average SOC Posture: {fleetMatrix.fleetAverageScore}/100
                </span>
                <span className="text-zinc-500">
                  Latency: {fleetMatrix.latencyMs}ms
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(fleetMatrix.projects || []).map((proj) => (
                  <div
                    key={proj.projectId}
                    className={`p-3.5 rounded-xl border space-y-2 font-mono text-xs ${
                      proj.projectId === projectId
                        ? 'border-cyan-500/50 bg-cyan-500/5'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="font-extrabold text-zinc-900 dark:text-white text-sm">
                          {proj.projectId}
                        </span>
                        <span className="text-zinc-500 ml-2">
                          (#{proj.projectNumber})
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          proj.socPostureScore >= 85
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                            : proj.socPostureScore >= 65
                            ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300'
                            : 'bg-red-500/20 text-red-600 dark:text-red-300'
                        }`}
                      >
                        {proj.socPostureScore}/100 · {proj.socGrade}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div className="p-2 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                        <div className="text-zinc-400">0.0.0.0/0 Firewalls</div>
                        <div
                          className={`font-bold ${
                            proj.openAdminFirewallsCount > 0
                              ? 'text-red-500'
                              : 'text-emerald-500'
                          }`}
                        >
                          {proj.openAdminFirewallsCount} Open / {proj.totalFirewallsCount} Rules
                        </div>
                      </div>
                      <div className="p-2 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                        <div className="text-zinc-400">GCS Public Prevention</div>
                        <div
                          className={`font-bold ${
                            proj.unhardenedBucketsCount > 0
                              ? 'text-amber-500'
                              : 'text-emerald-500'
                          }`}
                        >
                          {proj.unhardenedBucketsCount} Unhardened / {proj.totalBucketsCount} Buckets
                        </div>
                      </div>
                      <div className="p-2 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                        <div className="text-zinc-400">Service Accounts</div>
                        <div className="font-bold text-zinc-800 dark:text-zinc-200">
                          {proj.serviceAccountsCount} Total ({proj.frozenSaCount} Frozen)
                        </div>
                      </div>
                      <div className="p-2 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                        <div className="text-zinc-400">App Engine Edge</div>
                        <div className="font-bold text-cyan-600 dark:text-cyan-400">
                          {proj.appEngineState}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs font-mono text-zinc-500">
              {fleetLoading
                ? 'Probing all active Google Cloud projects in parallel...'
                : 'Click "Rescan All GCP Projects" to load the Multi-Project SOC Matrix.'}
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          PILLAR 10: 1-CLICK DEFCON-1 ATOMIC PROJECT LOCKDOWN PLAYBOOK
         ==================================================================== */}
      {activePillar === 'DEFCON1_LOCKDOWN' && (
        <div className="p-5 rounded-2xl border-2 border-red-500/50 bg-gradient-to-br from-zinc-950 via-red-950/20 to-zinc-950 text-zinc-100 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] font-mono font-extrabold">
                <Lock className="w-3.5 h-3.5" />
                <span>PILLAR 10 · COORDINATED ATOMIC SOAR CONTAINMENT PLAYBOOK</span>
              </div>
              <h3 className="text-lg font-extrabold text-white">
                1-Click &ldquo;Defcon-1 Atomic Project Lockdown&rdquo; (`{projectId}`)
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Executes a coordinated 5-stage zero-trust perimeter seal across Compute Engine VPC, Cloud Storage, App Engine, Secret Manager, and IAM Resource Manager in a single atomic transaction — while preserving your authenticated Owner access and sealing an <strong>Ed25519 (RFC 8032)</strong> forensic receipt.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                handleExecuteSocAction('DEFCON1_LOCKDOWN_EXEC', {
                  action: 'EXECUTE_DEFCON1_LOCKDOWN',
                })
              }
              disabled={Boolean(actionBusy)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-extrabold shadow-lg shadow-red-600/30 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>
                {actionBusy === 'DEFCON1_LOCKDOWN_EXEC'
                  ? 'Executing 5-Stage Defcon-1 Lockdown...'
                  : 'EXECUTE DEFCON-1 PROJECT LOCKDOWN NOW'}
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 text-xs font-mono">
            <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <div className="text-cyan-400 font-extrabold">Stage 1 · IAM Vault</div>
              <div className="text-[11px] text-zinc-300">
                Captures an Ed25519-signed <code className="text-cyan-300">getIamPolicy</code> snapshot with Zero-Lockout Owner Guard.
              </div>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <div className="text-red-400 font-extrabold">Stage 2 · VPC IAP Seal</div>
              <div className="text-[11px] text-zinc-300">
                Rewrites all world-open <code className="text-red-300">0.0.0.0/0</code> ingress rules to Google Cloud IAP (<code className="text-emerald-300">35.235.240.0/20</code>).
              </div>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <div className="text-amber-400 font-extrabold">Stage 3 · GCS Shield</div>
              <div className="text-[11px] text-zinc-300">
                Enforces <code className="text-amber-300">publicAccessPrevention: enforced</code> &amp; Uniform Access on all project buckets.
              </div>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <div className="text-violet-400 font-extrabold">Stage 4 · App Engine</div>
              <div className="text-[11px] text-zinc-300">
                Locks App Engine Edge Firewall default rule (<code className="text-violet-300">*</code>) to <code className="text-red-300">DENY</code>.
              </div>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <div className="text-emerald-400 font-extrabold">Stage 5 · $0 Canary</div>
              <div className="text-[11px] text-zinc-300">
                Arms the <code className="text-emerald-300">$0.00/mo</code> Secret Manager Honey-Secret Canary Tripwire.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          PILLAR 11: TRANSITIVE IAM IMPERSONATION & PRIVILEGE-ESCALATION SOLVER
         ==================================================================== */}
      {activePillar === 'IAM_ESCALATION_SOLVER' && (
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                <span>
                  Transitive IAM Impersonation &amp; Privilege-Escalation Graph Solver (`actAs` / `TokenCreator` / `setIamPolicy`)
                </span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Solves 1-hop and 2-hop transitive privilege escalation vectors across Project IAM (<code className="font-mono">projects:getIamPolicy</code>) and per-Service-Account resource IAM policies (<code className="font-mono">serviceAccounts:getIamPolicy</code>). Sever any risky escalation edge in 1 click (with automatic IAM Vault backup).
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded bg-red-500/15 border border-red-500/30 text-red-500 font-bold">
                {iamEscalationGraph.criticalPathsCount} Critical Vector(s)
              </span>
              <span className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500">
                {iamEscalationGraph.totalPathsCount} Total Escalation Paths
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {iamEscalationGraph.paths.map((p) => (
              <div
                key={p.id}
                className={`p-3 rounded-xl border text-xs font-mono space-y-1.5 ${
                  p.severity === 'CRITICAL'
                    ? 'border-red-500/40 bg-red-500/5'
                    : p.severity === 'HIGH'
                    ? 'border-amber-500/40 bg-amber-500/5'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        p.severity === 'CRITICAL'
                          ? 'bg-red-600 text-white'
                          : p.severity === 'HIGH'
                          ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                      }`}
                    >
                      {p.severity} · {p.scope}
                    </span>
                    <span className="font-extrabold text-zinc-900 dark:text-white">
                      {p.sourceMember}
                    </span>
                    <span className="text-cyan-600 dark:text-cyan-400 font-bold">
                      --[{p.role}]--&gt;
                    </span>
                    <span className="text-zinc-600 dark:text-zinc-300">
                      {p.targetResource}
                    </span>
                  </div>

                  {p.canSeverSafely && !p.isGoogleManagedAgent && (
                    <button
                      type="button"
                      onClick={() =>
                        handleExecuteSocAction(`SEVER:${p.id}`, {
                          action: 'SEVER_IAM_ESCALATION_BINDING',
                          roleToSever: p.role,
                          memberToSever: p.sourceMember,
                          scopeToSever: p.scope,
                        })
                      }
                      disabled={Boolean(actionBusy)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Sever Escalation Edge</span>
                    </button>
                  )}
                </div>

                <div className="text-[11px] text-zinc-500">
                  <strong>{p.technique}:</strong> {p.mechanism}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================
          PILLAR 12: COMPUTE VM SHIELDED INTEGRITY (vTPM), SSRF 169.254.169.254 & SSH-KEY FORENSICS
         ==================================================================== */}
      {activePillar === 'VM_METADATA_SHIELDED' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-500" />
                  <span>
                    Compute Engine Project Metadata (`commonInstanceMetadata`), IAM OS Login, Serial-Port Backdoor &amp; SSH-Key Forensics
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Audits <code className="font-mono">compute.googleapis.com/compute/v1/projects/{projectId}</code> for injected project-wide SSH keys, interactive serial-port backdoors, startup-script persistence hooks, and VM <code className="font-mono">vTPM</code> / <code className="font-mono">169.254.169.254</code> SSRF token exposure.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  handleExecuteSocAction('HARDEN_OSLOGIN', {
                    action: 'HARDEN_PROJECT_OSLOGIN_AND_SERIAL_PORT',
                  })
                }
                disabled={Boolean(actionBusy)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  {actionBusy === 'HARDEN_OSLOGIN'
                    ? 'Hardening Project Metadata...'
                    : '1-Click Enforce IAM OS Login & Disable Serial Port'}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs font-mono">
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div className="text-[10px] text-zinc-400">IAM OS Login (`enable-oslogin`)</div>
                <div
                  className={`font-bold mt-0.5 ${
                    vmMetadataAndShieldedRadar.projectOsLoginEnabled
                      ? 'text-emerald-500'
                      : 'text-amber-500'
                  }`}
                >
                  {vmMetadataAndShieldedRadar.projectOsLoginEnabled
                    ? 'ENABLED (TRUE · IAM Enforced)'
                    : 'NOT ENFORCED (Legacy SSH Keys Active)'}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div className="text-[10px] text-zinc-400">Serial Port (`serial-port-enable`)</div>
                <div
                  className={`font-bold mt-0.5 ${
                    vmMetadataAndShieldedRadar.projectSerialPortEnabled
                      ? 'text-red-500'
                      : 'text-emerald-500'
                  }`}
                >
                  {vmMetadataAndShieldedRadar.projectSerialPortEnabled
                    ? 'ENABLED (Interactive Backdoor Risk)'
                    : 'DISABLED (Hardened)'}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div className="text-[10px] text-zinc-400">Project-Wide Static SSH Keys</div>
                <div
                  className={`font-bold mt-0.5 ${
                    vmMetadataAndShieldedRadar.projectWideSshKeysCount > 0
                      ? 'text-amber-500'
                      : 'text-emerald-500'
                  }`}
                >
                  {vmMetadataAndShieldedRadar.projectWideSshKeysCount} Injected Key(s)
                </div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div className="text-[10px] text-zinc-400">Zonal VMs Inspected</div>
                <div className="font-bold text-zinc-900 dark:text-white mt-0.5">
                  {vmMetadataAndShieldedRadar.vmsInspectedCount} VM(s)
                </div>
              </div>
            </div>

            {vmMetadataAndShieldedRadar.projectWideSshKeys.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <div className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200">
                  Project-Wide `commonInstanceMetadata.items[ssh-keys]` Inventory:
                </div>
                {vmMetadataAndShieldedRadar.projectWideSshKeys.map((k, idx) => (
                  <div
                    key={`${k.username}-${idx}`}
                    className="p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/5 text-xs font-mono flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-bold text-zinc-900 dark:text-white">
                        User: {k.username}
                      </span>{' '}
                      <span className="text-cyan-500">({k.algorithm})</span>
                    </div>
                    <span className="text-zinc-500 truncate max-w-md">
                      {k.fingerprintPreview}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          PILLAR 13: LIVE ENDPOINT TLS 1.3 X.509, HTTP HEADERS & UNAUTH PROBER
         ==================================================================== */}
      {activePillar === 'TLS_HEADER_DEEP_PROBE' && (
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-500" />
                <span>
                  Live Endpoint TLS 1.3 X.509 Cipher, HTTP Security Headers (`HSTS`/`CSP`/`CORS`) &amp; Unauthenticated Surface Prober
                </span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Performs real Node.js <code className="font-mono">https.request</code> + <code className="font-mono">tls.connect</code> handshakes against your project&apos;s live Cloud Run, App Engine, GCS, and Vertex AI endpoints without credentials to verify edge authentication and TLS 1.3 X.509 certificates.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRunDeepProbe}
              disabled={deepProbeLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-extrabold cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${deepProbeLoading ? 'animate-spin' : ''}`}
              />
              <span>
                {deepProbeLoading
                  ? 'Probing Live TLS 1.3 Sockets...'
                  : 'Run Live TLS 1.3 & Header Socket Probe'}
              </span>
            </button>
          </div>

          {deepProbeResult ? (
            <div className="space-y-2.5">
              {(deepProbeResult.endpoints || []).map((ep) => (
                <div
                  key={ep.url}
                  className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 text-xs font-mono space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 text-[10px] font-extrabold">
                        {ep.type}
                      </span>
                      <span className="font-extrabold text-zinc-900 dark:text-white">
                        {ep.name}
                      </span>
                      <span className="text-zinc-500">({ep.latencyMs}ms)</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        ep.unauthPosture.includes('UNAUTHENTICATED_PUBLIC_200')
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                      }`}
                    >
                      {ep.unauthPosture} · Score {ep.hardeningScore}/100
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
                    <div className="p-2 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                      <div className="text-zinc-400">TLS &amp; AEAD Cipher</div>
                      <div className="font-bold text-emerald-600 dark:text-emerald-400 truncate">
                        {ep.tlsProtocol} · {ep.cipherName}
                      </div>
                    </div>
                    <div className="p-2 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                      <div className="text-zinc-400">X.509 Issuer &amp; Expiry</div>
                      <div className="font-bold text-zinc-800 dark:text-zinc-200 truncate">
                        {ep.certIssuer} ({ep.certDaysRemaining ?? '?'}d left)
                      </div>
                    </div>
                    <div className="p-2 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                      <div className="text-zinc-400">X.509 SHA-256 Fingerprint</div>
                      <div className="font-bold text-cyan-600 dark:text-cyan-400 truncate">
                        {ep.certFingerprint256}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs font-mono text-zinc-500">
              {deepProbeLoading
                ? 'Performing live TLS 1.3 X.509 socket handshakes...'
                : 'Click "Run Live TLS 1.3 & Header Socket Probe" to inspect live endpoints.'}
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          PILLAR 14: BIGQUERY DLP PII CLASSIFIER & SECRET ROTATION HYGIENE
         ==================================================================== */}
      {activePillar === 'DATA_DLP_SECRET_HYGIENE' && (
        <div className="space-y-4">
          {/* BigQuery Dataset ACL & PII Column Classifier */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3">
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
              BigQuery Lakehouse Dataset ACLs &amp; Schema PII/Credential Column Classifier (`bigquery.googleapis.com/v2`)
            </h3>
            {dataDlpAndSecretHygiene.datasets.length === 0 ? (
              <div className="text-xs font-mono text-zinc-500">
                No BigQuery datasets found in {projectId}.
              </div>
            ) : (
              <div className="space-y-2">
                {dataDlpAndSecretHygiene.datasets.map((ds) => (
                  <div
                    key={ds.datasetId}
                    className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 text-xs font-mono space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            ds.isPublicAcl
                              ? 'bg-red-600 text-white'
                              : ds.sensitiveColumnsCount > 0
                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300'
                              : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                          }`}
                        >
                          {ds.status}
                        </span>
                        <span className="font-extrabold text-zinc-900 dark:text-white">
                          {projectId}:{ds.datasetId}
                        </span>
                        <span className="text-zinc-500">
                          ({ds.location} · {ds.tablesCount} tables · {ds.accessGrantsCount} ACL grants)
                        </span>
                      </div>

                      {ds.isPublicAcl && (
                        <button
                          type="button"
                          onClick={() =>
                            handleExecuteSocAction(`LOCK_BQ:${ds.datasetId}`, {
                              action: 'LOCK_BIGQUERY_DATASET_PUBLIC_ACL',
                              datasetId: ds.datasetId,
                            })
                          }
                          disabled={Boolean(actionBusy)}
                          className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold cursor-pointer"
                        >
                          Strip Public Dataset ACL
                        </button>
                      )}
                    </div>

                    {ds.sensitiveColumns.length > 0 && (
                      <div className="text-[11px] text-amber-600 dark:text-amber-300">
                        Sensitive / PII Columns Detected ({ds.sensitiveColumnsCount}):{' '}
                        {ds.sensitiveColumns
                          .map((c) => `${c.tableId}.${c.columnName} (${c.type})`)
                          .join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Secret Manager Active Version Rotation Hygiene */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3">
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
              Secret Manager Active Version Age &amp; 1-Click 256-Bit Cryptographic Rotation (`secretmanager.googleapis.com/v1`)
            </h3>
            {dataDlpAndSecretHygiene.secrets.length === 0 ? (
              <div className="text-xs font-mono text-zinc-500">
                No Secret Manager secrets provisioned in {projectId}.
              </div>
            ) : (
              <div className="space-y-2">
                {dataDlpAndSecretHygiene.secrets.map((sec) => (
                  <div
                    key={sec.secretId}
                    className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 text-xs font-mono flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 text-[10px] font-bold">
                          {sec.rotationStatus}
                        </span>
                        <span className="font-extrabold text-zinc-900 dark:text-white">
                          {sec.secretId}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        Enabled Versions: <strong>{sec.enabledVersionsCount}</strong> / {sec.totalVersionsCount} · Latest Version Age: <strong>{sec.latestVersionAgeDays} day(s)</strong>
                      </div>
                    </div>

                    {!sec.isCanary && (
                      <button
                        type="button"
                        onClick={() =>
                          handleExecuteSocAction(`ROTATE_SEC:${sec.secretId}`, {
                            action: 'ROTATE_SECRET_VERSION_NOW',
                            secretId: sec.secretId,
                          })
                        }
                        disabled={Boolean(actionBusy)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-extrabold cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Rotate Secret Version (:addVersion)</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          PILLAR 15: AUTONOMOUS PURPLE-TEAM BREACH & ATTACK SIMULATION (BAS) STOPWATCH
         ==================================================================== */}
      {activePillar === 'PURPLE_TEAM_BAS_ARENA' && (
        <div className="p-4 rounded-xl border border-violet-500/40 bg-white dark:bg-zinc-950 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>
                  Autonomous 4-Stage Purple-Team Breach &amp; Attack Simulation (BAS) + SIEM Detection Stopwatch
                </span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Executes a live, non-destructive 4-stage MITRE ATT&amp;CK validation against real Google Cloud APIs (<code className="font-mono">T1526</code> Service Discovery -&gt; <code className="font-mono">T1098</code> <code className="font-mono">:testIamPermissions</code> Blast-Radius Recon -&gt; <code className="font-mono">T1552.005</code> Honey-Secret Canary Fire -&gt; <code className="font-mono">entries:list</code> Round-Trip SIEM Verification) and seals an Ed25519 scorecard.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRunPurpleTeamDrill}
              disabled={purpleDrillLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-extrabold cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>
                {purpleDrillLoading
                  ? 'Executing 4-Stage Live BAS Drill...'
                  : 'Launch 4-Stage Purple-Team BAS Drill Now'}
              </span>
            </button>
          </div>

          {purpleDrillResult ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-extrabold">
                  Detection Coverage: {purpleDrillResult.detectionCoveragePct}%
                </span>
                <span className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 font-bold">
                  Total Stopwatch Latency: {purpleDrillResult.totalDrillLatencyMs}ms
                </span>
                <span className="text-zinc-500">
                  Correlation ID: {purpleDrillResult.drillCorrelationId}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {(purpleDrillResult.stages || []).map((st) => (
                  <div
                    key={st.stage}
                    className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 text-xs font-mono space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-zinc-900 dark:text-white">
                        Stage {st.stage} · [{st.mitreId}] {st.tactic}
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {st.latencyMs}ms
                      </span>
                    </div>
                    <div className="text-[10px] text-cyan-600 dark:text-cyan-400 break-all">
                      API: {st.apiProbed}
                    </div>
                    <div className="text-[11px] text-zinc-600 dark:text-zinc-300">
                      {st.finding}
                    </div>
                    <div className="text-[10px] font-bold text-emerald-500">
                      Status: {st.detectionStatus}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs font-mono text-zinc-500">
              Click &ldquo;Launch 4-Stage Purple-Team BAS Drill Now&rdquo; to benchmark your project&apos;s end-to-end SIEM detection latency in milliseconds.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
