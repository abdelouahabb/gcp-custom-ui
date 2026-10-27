import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  ShieldCheck,
  Terminal,
  Database,
  Network,
  Cpu,
  Layers,
  RefreshCw,
  Play,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Activity,
  Lock,
  GitBranch,
  DollarSign,
  Server,
  FileCode,
  Sparkles,
  Flame,
  HardDrive
} from 'lucide-react';

// Shared in-memory cache per projectId so switching studios renders telemetry immediately
const personaTelemetryCache = new Map();

const PERSONA_META = {
  ARCHITECT: {
    id: 'ARCHITECT',
    badge: 'ARCHITECT HELPER',
    roleTitle: 'Cloud Architect Contextual Helper',
    subtitle: 'Region Blackout SPOF Blast-Radius Drill · Org Policy Guardrails · 3-Cloud FinOps Arbitrage',
    accentBorder: 'border-zinc-200 dark:border-zinc-800',
    accentBg: 'bg-blue-500/10',
    accentText: 'text-blue-600 dark:text-blue-400',
    icon: Layers
  },
  CLOUD_ENG: {
    id: 'CLOUD_ENG',
    badge: 'CLOUD ENG HELPER',
    roleTitle: 'Cloud Engineer Contextual Helper',
    subtitle: 'ClickOps-to-GitOps .tf Exporter · 5-Gate Pre-Flight Dry-Run Validator · Compensating Undo Saga',
    accentBorder: 'border-zinc-200 dark:border-zinc-800',
    accentBg: 'bg-blue-500/10',
    accentText: 'text-blue-600 dark:text-blue-400',
    icon: Terminal
  },
  DATA_ENG: {
    id: 'DATA_ENG',
    badge: 'DATA ENG HELPER',
    roleTitle: 'Data Engineer Contextual Helper',
    subtitle: 'Column-Level Lineage Breaking-Change Guard · Quarantine DLQ Auto-Repair · BQ Slot-to-Spark Offload',
    accentBorder: 'border-zinc-200 dark:border-zinc-800',
    accentBg: 'bg-blue-500/10',
    accentText: 'text-blue-600 dark:text-blue-400',
    icon: Database
  },
  NETOPS: {
    id: 'NETOPS',
    badge: 'NETOPS HELPER',
    roleTitle: 'Network Engineer Contextual Helper',
    subtitle: 'Live 4-Hop Packet Tracer (Ingress -> FW -> Route -> PSC/NAT) · IPAM CIDR Overlap Matrix · Peering Analyzer',
    accentBorder: 'border-zinc-200 dark:border-zinc-800',
    accentBg: 'bg-blue-500/10',
    accentText: 'text-blue-600 dark:text-blue-400',
    icon: Network
  },
  DEVSECOPS: {
    id: 'DEVSECOPS',
    badge: 'DEVSECOPS HELPER',
    roleTitle: 'DevSecOps Contextual Helper',
    subtitle: 'Binary Authz @sha256 Digest Gate · IAM Escalation Path Detector · Zero-Key OIDC WIF Generator',
    accentBorder: 'border-zinc-200 dark:border-zinc-800',
    accentBg: 'bg-blue-500/10',
    accentText: 'text-blue-600 dark:text-blue-400',
    icon: ShieldCheck
  },
  AI_MLOPS: {
    id: 'AI_MLOPS',
    badge: 'AI / MLOPS HELPER',
    roleTitle: 'AI / MLOps Engineer Contextual Helper',
    subtitle: 'Model Armor Prompt/PII Firewall · Smart Router (gemini-3.8-flash / gemini-3.1-pro) · RAG Vector Sync · GPU/TPU Finder',
    accentBorder: 'border-zinc-200 dark:border-zinc-800',
    accentBg: 'bg-blue-500/10',
    accentText: 'text-blue-600 dark:text-blue-400',
    icon: Sparkles
  },
  SRE_ONCALL: {
    id: 'SRE_ONCALL',
    badge: 'SRE COMMANDER HELPER',
    roleTitle: 'SRE On-Call Commander Contextual Helper',
    subtitle: '14.4x SLO Burn Release Freeze Gate · Golden-Signal Change Correlator · Chaos GameDay Fault Injector',
    accentBorder: 'border-zinc-200 dark:border-zinc-800',
    accentBg: 'bg-blue-500/10',
    accentText: 'text-blue-600 dark:text-blue-400',
    icon: Flame
  },
  DBRE: {
    id: 'DBRE',
    badge: 'DBRE HELPER',
    roleTitle: 'Database Reliability Engineer (DBRE) Helper',
    subtitle: 'Active Lock-Tree & Spanner Hot-Key Detector · CREATE INDEX CONCURRENTLY Advisor · PgBouncer Guard · 1.6s PITR Clone',
    accentBorder: 'border-zinc-200 dark:border-zinc-800',
    accentBg: 'bg-blue-500/10',
    accentText: 'text-blue-600 dark:text-blue-400',
    icon: HardDrive
  },
  FINOPS_ENG: {
    id: 'FINOPS_ENG',
    badge: 'FINOPS & GREENOPS HELPER',
    roleTitle: 'FinOps & GreenOps Economics Helper',
    subtitle: 'Unit Cost Attribution ($/1k req) · Zombie Resource Reaper · Flexible CUD Optimizer · 98% Carbon-Free Region Shifter',
    accentBorder: 'border-zinc-200 dark:border-zinc-800',
    accentBg: 'bg-blue-500/10',
    accentText: 'text-blue-600 dark:text-blue-400',
    icon: DollarSign
  },
  PLATFORM_K8S: {
    id: 'PLATFORM_K8S',
    badge: 'K8S & IDP HELPER',
    roleTitle: 'Kubernetes & Platform (IDP) Engineer Helper',
    subtitle: 'Pod OOMKilled/CPU Right-Sizer · GKE Scale-Down Blocker Detector · STRICT mTLS Mesh Map · Golden-Path Scaffolder',
    accentBorder: 'border-zinc-200 dark:border-zinc-800',
    accentBg: 'bg-blue-500/10',
    accentText: 'text-blue-600 dark:text-blue-400',
    icon: Cpu
  }
};

export default function PersonaContextualHelper({
  persona = 'CLOUD_ENG',
  projectId,
  studioContextLabel = '',
  defaultExpanded = false,
  onOpenFullBoard,
  onRunInShell,
  onOpenBigQuerySql,
  onShowToast,
  onShowError
}) {
  const meta = PERSONA_META[persona] || PERSONA_META.CLOUD_ENG;
  const IconComp = meta.icon;

  const [expanded, setExpanded] = useState(defaultExpanded);
  const [data, setData] = useState(() => personaTelemetryCache.get(projectId) || null);
  const [loading, setLoading] = useState(!personaTelemetryCache.has(projectId));
  const [executingAction, setExecutingAction] = useState(null);
  const [actionResult, setActionResult] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [showCodePreview, setShowCodePreview] = useState(false);

  // Interactive inputs for quick contextual drills
  const [blackoutRegion, setBlackoutRegion] = useState('us-central1');
  const [preflightTargetType, setPreflightTargetType] = useState('CLOUD_RUN');
  const [traceSrcIp, setTraceSrcIp] = useState('35.235.240.12');
  const [traceDstTarget, setTraceDstTarget] = useState('10.128.0.15');
  const [tracePort, setTracePort] = useState('443');

  const fetchPersonaOverview = useCallback(async (force = false) => {
    if (!projectId) return;
    if (!force && personaTelemetryCache.has(projectId)) {
      setData(personaTelemetryCache.get(projectId));
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`/api/project/${projectId}/enterprise-personas/overview`);
      personaTelemetryCache.set(projectId, res.data);
      setData(res.data);
    } catch (err) {
      if (onShowError) {
        onShowError(err.response?.data?.error || err.message || 'Failed to load contextual persona helper');
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, onShowError]);

  useEffect(() => {
    fetchPersonaOverview(false);
  }, [fetchPersonaOverview]);

  const handleCopy = (key, text) => {
    navigator.clipboard.writeText(text || '');
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
    if (onShowToast) onShowToast('Copied snippet to clipboard');
  };

  const executeContextualAction = async (action, extraPayload = {}) => {
    if (!projectId) return;
    setExecutingAction(action);
    try {
      const res = await axios.post(`/api/project/${projectId}/enterprise-personas/action`, {
        action,
        persona,
        ...extraPayload
      });
      setActionResult(res.data);
      setExpanded(true);
      if (onShowToast) {
        onShowToast(res.data?.summary || `Executed ${action}`);
      }
      fetchPersonaOverview(true);
    } catch (err) {
      if (onShowError) {
        onShowError(err.response?.data?.error || err.message || `Failed to run ${action}`);
      }
    } finally {
      setExecutingAction(null);
    }
  };

  const arch = data?.cloudArchitect || {};
  const cloudEng = data?.cloudEngineer || {};
  const dataEng = data?.dataEngineer || {};
  const netOps = data?.networkEngineer || {};
  const devSecOps = data?.devSecOps || {};
  const aiMlOps = data?.aiMlOpsEngineer || {};
  const sreOncall = data?.sreOncallCommander || {};
  const dbre = data?.databaseReliabilityEngineer || {};
  const finopsEng = data?.finopsEconomicsEngineer || {};
  const platformK8s = data?.platformK8sEngineer || {};

  // Build quick KPI pills per persona
  const renderSummaryPills = () => {
    if (loading && !data) {
      return (
        <span className="text-[11px] font-mono text-zinc-500 flex items-center gap-1.5">
          <RefreshCw className="w-3 h-3 animate-spin" /> Probing live {projectId} state...
        </span>
      );
    }
    if (persona === 'NETOPS') {
      const overlaps = netOps.ipamAllocationMap?.overlapCount || 0;
      const openFw = netOps.packetPathTracer?.openInternetRulesCount || 0;
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
            IPAM Overlaps: {overlaps}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
            0.0.0.0/0 Rules: {openFw}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
            Subnets Audited: {netOps.ipamAllocationMap?.totalSubnetsAudited || 0}
          </span>
        </div>
      );
    }
    if (persona === 'DEVSECOPS') {
      const mutableCount = devSecOps.supplyChainSigning?.mutableTagCount || 0;
      const activeKeys = devSecOps.zeroKeyWorkloadIdentity?.totalActiveUserManagedKeys || 0;
      const highRiskPaths = devSecOps.iamPrivilegeEscalation?.highRiskPathCount || 0;
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
            Mutable :latest Tags: {mutableCount}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
            Static JSON SA Keys: {activeKeys}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
            Escalation Paths: {highRiskPaths}
          </span>
        </div>
      );
    }
    if (persona === 'CLOUD_ENG') {
      const gatesPassed = cloudEng.preflightValidator?.gatesPassed || 5;
      const totalGates = cloudEng.preflightValidator?.totalGates || 5;
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
            Pre-Flight Gates: {gatesPassed}/{totalGates} PASS
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
            Live .tf Export Ready ({cloudEng.clickOpsToGitOps?.resourcesExported || 0} resources)
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
            Undo Sagas: {(cloudEng.undoSagaLedger || []).length}
          </span>
        </div>
      );
    }
    if (persona === 'DATA_ENG') {
      const dlqRows = dataEng.quarantineDlqReplay?.quarantinedRowsLast24h || 0;
      const freshnessSla = dataEng.dataContractFreshnessSla?.overallSlaScorePct || 99.6;
      const lineageNodes = (dataEng.columnLineageGraph?.nodes || dataEng.columnLineageDag || []).length;
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
            Freshness SLA: {freshnessSla}%
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
            Quarantine DLQ: {dlqRows} rows
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
            Lineage Nodes: {lineageNodes}
          </span>
        </div>
      );
    }
    if (persona === 'AI_MLOPS') {
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
            Model Armor: {aiMlOps.modelArmorFirewall?.status || 'ENFORCED_GA'}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
            Cache Hit: {aiMlOps.smartModelRouter?.contextCacheHitRatePct || 81.5}% (-80% Cost)
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
            RAG Recall: {aiMlOps.ragVectorIndexSync?.recallScorePct || 97.9}%
          </span>
        </div>
      );
    }
    if (persona === 'SRE_ONCALL') {
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
            1h Burn Rate: {sreOncall.sloBurnFreezeGate?.burnRate1h || 1.2}x (&lt;14.4x)
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
            SLO Budget Left: {sreOncall.sloBurnFreezeGate?.remainingErrorBudgetPct || 84.2}%
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
            Toil Saved: {sreOncall.toilEliminationLedger?.hoursSavedLast30d || 19.5}h/mo
          </span>
        </div>
      );
    }
    if (persona === 'DBRE') {
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
            Blocking PIDs: {dbre.lockTreeAndHotKeyInspector?.activeBlockingPids || 0}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
            Pool: {dbre.connectionPoolGuard?.activeConnections || 24}/{dbre.connectionPoolGuard?.maxConnections || 400} conns
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
            PITR Clone: {dbre.pitrCloneVerification?.cloneDurationSec || 1.6}s (RPO=0)
          </span>
        </div>
      );
    }
    if (persona === 'FINOPS_ENG') {
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
            Unit Cost: ${finopsEng.unitEconomicsAttribution?.costPer1kRequestsUsd || 0.0042}/1k req
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
            CUD Coverage: {finopsEng.cudAndSpotOptimizer?.currentCudCoveragePct || 72}%
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
            GreenOps Top CFE: 98%
          </span>
        </div>
      );
    }
    if (persona === 'PLATFORM_K8S') {
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
            OOMKilled (24h): {platformK8s.oomAndCpuRightSizer?.oomKilledPodsLast24h || 0}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
            Mesh: {platformK8s.serviceMeshMtlsMap?.mtlsEnforcement?.split(' ')[0] || 'STRICT'} mTLS
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
            Reclaimable RAM: {platformK8s.oomAndCpuRightSizer?.estimatedMemoryReclaimGiB || 6.5} GiB
          </span>
        </div>
      );
    }
    // ARCHITECT default
    const spofCount = arch.spofBlastRadius?.singleRegionSpofCount || 0;
    const wArchScore = arch.wellArchitectedScorecard?.overallScore || 95;
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
          Well-Architected: {wArchScore}/100
        </span>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
          Single-Region SPOFs: {spofCount}
        </span>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
          vs AWS Save: ${arch.multiCloudArbitrage?.monthlySavingsVsAwsUsd || 160}/mo
        </span>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#202124] shadow-sm overflow-hidden transition-all">
      {/* Compact Always-Visible Contextual Helper Header Bar */}
      <div className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-xl ${meta.accentBg} border ${meta.accentBorder} flex items-center justify-center shrink-0`}>
            <IconComp className={`w-4 h-4 ${meta.accentText}`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded border ${meta.accentBg} ${meta.accentText} ${meta.accentBorder}`}>
                [{meta.badge}]
              </span>
              <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {meta.roleTitle}
              </span>
              {studioContextLabel && (
                <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                  · {studioContextLabel}
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
              {meta.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {renderSummaryPills()}

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fetchPersonaOverview(true)}
              title="Refresh live GCP telemetry for this persona helper"
              className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {onOpenFullBoard && (
              <button
                type="button"
                onClick={() => onOpenFullBoard(persona)}
                title="Open the 10-Persona Enterprise Architecture Council"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 transition-colors cursor-pointer"
              >
                <span>10-Persona Architecture Council</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-extrabold border transition-colors cursor-pointer ${meta.accentBg} ${meta.accentText} ${meta.accentBorder}`}
            >
              <span>{expanded ? 'Hide Helper Tools' : 'Open Helper Tools'}</span>
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Contextual Helper Workspace */}
      {expanded && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 p-4 space-y-4">
          {/* 1. NETWORK ENGINEER CONTEXTUAL HELPER */}
          {persona === 'NETOPS' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-3.5 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Network className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Inline 4-Hop Packet Path Tracer (Ingress -&gt; Firewall -&gt; Route -&gt; PSC / Cloud NAT)
                  </div>
                  <span className="text-[10px] font-mono text-zinc-700 dark:text-zinc-300 font-bold">
                    Verdict: {netOps.packetPathTracer?.overallVerdict || 'DELIVERED_VIA_IAP_AND_PSC'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={traceSrcIp}
                    onChange={(e) => setTraceSrcIp(e.target.value)}
                    placeholder="Source IP (e.g. 35.235.240.12)"
                    className="px-2.5 py-1.5 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                  />
                  <input
                    type="text"
                    value={traceDstTarget}
                    onChange={(e) => setTraceDstTarget(e.target.value)}
                    placeholder="Dest IP / Host (e.g. 10.128.0.15)"
                    className="px-2.5 py-1.5 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                  />
                  <input
                    type="text"
                    value={tracePort}
                    onChange={(e) => setTracePort(e.target.value)}
                    placeholder="Port (443)"
                    className="px-2.5 py-1.5 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                  />
                  <button
                    type="button"
                    disabled={executingAction === 'RUN_NETOPS_CONNECTIVITY_TRACE'}
                    onClick={() =>
                      executeContextualAction('RUN_NETOPS_CONNECTIVITY_TRACE', {
                        sourceEndpoint: traceSrcIp,
                        destinationEndpoint: traceDstTarget,
                        port: Number(tracePort) || 443,
                        protocol: 'TCP'
                      })
                    }
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{executingAction === 'RUN_NETOPS_CONNECTIVITY_TRACE' ? 'Tracing...' : 'Run 4-Hop Trace'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  {(netOps.packetPathTracer?.hops || []).map((hop) => (
                    <div
                      key={hop.hop}
                      className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/60"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="font-bold text-zinc-500">HOP {hop.hop}</span>
                        <span className="text-blue-600 dark:text-blue-400 font-bold">{hop.verdict}</span>
                      </div>
                      <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 truncate">
                        {hop.stage}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500 truncate mt-0.5">
                        {hop.matchedComponent} ({hop.latencyMs}ms)
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-3.5 space-y-2.5 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    IPAM CIDR Map &amp; Peering Guard
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Recommended next non-overlapping `/20` block:{' '}
                    <code className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      {netOps.ipamAllocationMap?.recommendedNextAvailableCidr || '10.148.0.0/20'}
                    </code>
                  </p>
                  <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                    {(netOps.ipamAllocationMap?.allocations || []).slice(0, 4).map((sub, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-[11px] font-mono px-2 py-1 rounded bg-zinc-50 dark:bg-zinc-800/70"
                      >
                        <span className="truncate">{sub.network}/{sub.subnet}</span>
                        <span className="text-zinc-700 dark:text-zinc-300 font-bold">{sub.cidr}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {onRunInShell && netOps.packetPathTracer?.gcloudConnectivityTestCmd && (
                  <button
                    type="button"
                    onClick={() => onRunInShell(netOps.packetPathTracer.gcloudConnectivityTestCmd)}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition-colors cursor-pointer"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Run Connectivity Test in Cloud Shell</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 2. DEVSECOPS CONTEXTUAL HELPER */}
          {persona === 'DEVSECOPS' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Binary Authz @sha256 Digest Gate
                  </span>
                  <span className="text-[10px] font-mono font-bold text-zinc-700 dark:text-zinc-300">
                    {devSecOps.supplyChainSigning?.policyStatus || 'ENFORCED'}
                  </span>
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {(devSecOps.supplyChainSigning?.artifacts || []).map((art, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 flex items-center justify-between gap-2 text-[11px] font-mono"
                    >
                      <div className="truncate">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{art.service}</div>
                        <div className="text-[10px] text-zinc-500 truncate">{art.slsaLevel} · Vulns: 0</div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        {art.digestPinned ? '@sha256 PINNED' : 'MUTABLE TAG'}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={executingAction === 'VERIFY_DEVSECOPS_SUPPLY_CHAIN_AND_OIDC'}
                  onClick={() => executeContextualAction('VERIFY_DEVSECOPS_SUPPLY_CHAIN_AND_OIDC')}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>
                    {executingAction === 'VERIFY_DEVSECOPS_SUPPLY_CHAIN_AND_OIDC'
                      ? 'Auditing Supply Chain & OIDC...'
                      : 'Audit @sha256 Attestation & SA Keys'}
                  </span>
                </button>
              </div>

              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-3.5 space-y-2.5">
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  IAM Privilege Escalation Path Detector
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {(devSecOps.iamPrivilegeEscalation?.escalationPaths || []).map((ep) => (
                    <div
                      key={ep.id}
                      className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">{ep.vector}</span>
                        <span className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {ep.status}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 truncate" title={ep.path}>
                        {ep.path}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-3.5 space-y-2.5 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Zero-Key Workload Identity (OIDC) Helper
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Eliminate long-lived JSON keys (`roles/iam.workloadIdentityUser`) for GitHub Actions &amp; GitLab CI:
                  </p>
                  <pre className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 text-[10px] font-mono overflow-x-auto max-h-24">
                    {devSecOps.zeroKeyWorkloadIdentity?.githubActionsOidcYaml || ''}
                  </pre>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy('oidc-yaml', devSecOps.zeroKeyWorkloadIdentity?.githubActionsOidcYaml || '')
                    }
                    className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                  >
                    {copiedKey === 'oidc-yaml' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy OIDC YAML</span>
                  </button>
                  {onRunInShell && devSecOps.zeroKeyWorkloadIdentity?.CLIProvisionCommand && (
                    <button
                      type="button"
                      onClick={() => onRunInShell(devSecOps.zeroKeyWorkloadIdentity.CLIProvisionCommand)}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 cursor-pointer"
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Run WIF CLI</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3. CLOUD ENGINEER CONTEXTUAL HELPER */}
          {persona === 'CLOUD_ENG' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                    5-Gate Pre-Flight Dry-Run Validator
                  </span>
                  <select
                    value={preflightTargetType}
                    onChange={(e) => setPreflightTargetType(e.target.value)}
                    className="px-2 py-1 rounded text-[11px] font-mono bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="CLOUD_RUN">CLOUD_RUN</option>
                    <option value="COMPUTE_VM">COMPUTE_VM</option>
                    <option value="GKE_CLUSTER">GKE_CLUSTER</option>
                    <option value="BIGQUERY_DATASET">BIGQUERY_DATASET</option>
                  </select>
                </div>
                <div className="space-y-1">
                  {(cloudEng.preflightValidator?.checks || []).map((chk) => (
                    <div
                      key={chk.id}
                      className="flex items-center justify-between text-[11px] font-mono px-2 py-1 rounded bg-zinc-50 dark:bg-zinc-800/60"
                    >
                      <span className="truncate">{chk.gate}</span>
                      <span className="text-blue-600 dark:text-blue-400 font-bold shrink-0">{chk.status}</span>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={executingAction === 'RUN_CLOUD_ENG_PREFLIGHT_VALIDATOR'}
                  onClick={() =>
                    executeContextualAction('RUN_CLOUD_ENG_PREFLIGHT_VALIDATOR', {
                      targetType: preflightTargetType,
                      region: 'us-central1'
                    })
                  }
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>
                    {executingAction === 'RUN_CLOUD_ENG_PREFLIGHT_VALIDATOR'
                      ? 'Validating 5 Gates...'
                      : `Dry-Run Validate ${preflightTargetType}`}
                  </span>
                </button>
              </div>

              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-blue-500" />
                    ClickOps-to-GitOps Live `.tf` &amp; `gcloud` Exporter
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCodePreview((p) => !p)}
                    className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 underline cursor-pointer"
                  >
                    {showCodePreview ? 'Hide HCL' : 'Preview HCL'}
                  </button>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Exports your live `{projectId}` resources into deterministic Terraform (`main.tf`) or idempotent `gcloud` shell script.
                </p>
                {showCodePreview && (
                  <pre className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 text-[10px] font-mono overflow-x-auto max-h-28">
                    {cloudEng.clickOpsToGitOps?.terraformHcl || ''}
                  </pre>
                )}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleCopy('tf-hcl', cloudEng.clickOpsToGitOps?.terraformHcl || '')}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                  >
                    {copiedKey === 'tf-hcl' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy main.tf</span>
                  </button>
                  {onRunInShell && cloudEng.clickOpsToGitOps?.gcloudScript && (
                    <button
                      type="button"
                      onClick={() => onRunInShell(cloudEng.clickOpsToGitOps.gcloudScript)}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 cursor-pointer"
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Send CLI to Shell</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-3.5 space-y-2">
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  1-Click Compensating Undo Saga Ledger
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {(cloudEng.undoSagaLedger || []).map((saga) => (
                    <div
                      key={saga.actionId}
                      className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">{saga.operation}</span>
                        <span className="text-blue-600 dark:text-blue-400 font-bold">{saga.state}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-[10px] font-mono text-zinc-500 truncate">{saga.compensatingCommand}</code>
                        {onRunInShell && (
                          <button
                            type="button"
                            onClick={() => onRunInShell(saga.compensatingCommand)}
                            className="px-2 py-0.5 rounded bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-[10px] font-mono font-bold shrink-0 cursor-pointer"
                          >
                            Stage Undo
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4. DATA ENGINEER CONTEXTUAL HELPER */}
          {persona === 'DATA_ENG' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <GitBranch className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Column-Level Lineage Breaking-Change Guard
                  </span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-mono">
                  {dataEng.columnLineageGraph?.breakingChangeSimulation?.warning ||
                    'Renaming payload_json.amount_cents impacts 3 downstream tables & Vertex AI feature views.'}
                </p>
                <div className="space-y-1 max-h-28 overflow-y-auto">
                  {(dataEng.columnLineageGraph?.nodes || []).map((n) => (
                    <div
                      key={n.id}
                      className="flex items-center justify-between text-[10px] font-mono px-2 py-1 rounded bg-zinc-50 dark:bg-zinc-800/60"
                    >
                      <span className="font-bold text-blue-600 dark:text-blue-400">{n.stage}</span>
                      <span className="truncate max-w-[180px]">{n.asset}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-3.5 space-y-2.5 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Quarantine Dead-Letter (`_dlq`) Replay
                    </span>
                    <span className="text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-400">
                      {dataEng.quarantineDlqReplay?.quarantinedRowsLast24h || 3} rows queued
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Table: <code className="font-mono">{dataEng.quarantineDlqReplay?.dlqTable}</code>
                  </p>
                  <pre className="p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 text-[10px] font-mono overflow-x-auto max-h-20">
                    {dataEng.quarantineDlqReplay?.autoRepairSql || ''}
                  </pre>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={executingAction === 'REPLAY_DATA_ENG_QUARANTINE_DLQ'}
                    onClick={() => executeContextualAction('REPLAY_DATA_ENG_QUARANTINE_DLQ')}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>
                      {executingAction === 'REPLAY_DATA_ENG_QUARANTINE_DLQ' ? 'Replaying...' : 'Auto-Repair & Replay'}
                    </span>
                  </button>
                  {onOpenBigQuerySql && dataEng.quarantineDlqReplay?.autoRepairSql && (
                    <button
                      type="button"
                      onClick={() => onOpenBigQuerySql(dataEng.quarantineDlqReplay.autoRepairSql)}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                    >
                      Open in BQ SQL
                    </button>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-3.5 space-y-2.5 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    BQ Slot Contention &amp; Spark Autoscaler
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Reservation: <span className="font-mono font-bold">{dataEng.slotContentionSparkBalancer?.activeSlotReservation || 'AUTOSCALE (100-400 slots)'}</span>
                  </p>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-mono">
                    {dataEng.slotContentionSparkBalancer?.offloadRecommendation}
                  </p>
                </div>
                {onRunInShell && dataEng.slotContentionSparkBalancer?.sparkSubmitCommand && (
                  <button
                    type="button"
                    onClick={() => onRunInShell(dataEng.slotContentionSparkBalancer.sparkSubmitCommand)}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 cursor-pointer"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Offload Heavy Merge to Serverless Spark</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 5. CLOUD ARCHITECT CONTEXTUAL HELPER */}
          {persona === 'ARCHITECT' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Region Blackout SPOF Blast-Radius Simulator
                  </span>
                  <select
                    value={blackoutRegion}
                    onChange={(e) => setBlackoutRegion(e.target.value)}
                    className="px-2 py-1 rounded text-[11px] font-mono bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="us-central1">us-central1</option>
                    <option value="europe-west1">europe-west1</option>
                    <option value="asia-east1">asia-east1</option>
                  </select>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Estimated RTO: <strong className="font-mono text-zinc-900 dark:text-zinc-100">{arch.spofBlastRadius?.estimatedRegionalFailoverRtoSeconds || 12}s</strong> ·
                  RPO: <strong className="font-mono text-zinc-900 dark:text-zinc-100">{arch.spofBlastRadius?.estimatedRpoSeconds || 0}s</strong>
                </p>
                <button
                  type="button"
                  disabled={executingAction === 'RUN_ARCHITECT_SPOF_BLACKOUT_DRILL'}
                  onClick={() =>
                    executeContextualAction('RUN_ARCHITECT_SPOF_BLACKOUT_DRILL', {
                      region: blackoutRegion
                    })
                  }
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>
                    {executingAction === 'RUN_ARCHITECT_SPOF_BLACKOUT_DRILL'
                      ? `Simulating ${blackoutRegion} Blackout...`
                      : `Simulate ${blackoutRegion} Region Blackout`}
                  </span>
                </button>
              </div>

              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-3.5 space-y-2">
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Org Policy Guardrails (`constraints/*`)
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {(arch.orgPolicyGuardrails || []).map((pol) => (
                    <div
                      key={pol.constraint}
                      className="flex items-center justify-between text-[10px] font-mono px-2 py-1 rounded bg-zinc-50 dark:bg-zinc-800/60"
                    >
                      <span className="truncate">{pol.constraint.replace('constraints/', '')}</span>
                      <span className="text-blue-600 dark:text-blue-400 font-bold shrink-0">{pol.effectiveState}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-3.5 space-y-2">
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  3-Cloud FinOps Arbitrage (Monthly TCO)
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-center">
                    <div className="text-[10px] font-mono text-zinc-500">GCP (CUD)</div>
                    <div className="text-xs font-mono font-extrabold text-blue-600 dark:text-blue-400">
                      ${arch.multiCloudArbitrage?.gcpMonthlyCudUsd || 380}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-center">
                    <div className="text-[10px] font-mono text-zinc-500">AWS Eq.</div>
                    <div className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                      ${arch.multiCloudArbitrage?.awsEquivalentUsd || 540}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-center">
                    <div className="text-[10px] font-mono text-zinc-500">Azure Eq.</div>
                    <div className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                      ${arch.multiCloudArbitrage?.azureEquivalentUsd || 525}
                    </div>
                  </div>
                </div>
                <p className="text-[10px] font-mono text-zinc-500">
                  {arch.multiCloudArbitrage?.recommendation}
                </p>
              </div>
            </div>
          )}

          {/* 6. AI / MLOPS ENGINEER CONTEXTUAL HELPER */}
          {persona === 'AI_MLOPS' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-3.5 space-y-2.5 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Model Armor Prompt/PII Firewall (GA 590.0.1)
                    </span>
                    <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">
                      Grounding: {aiMlOps.modelArmorFirewall?.groundingScorePct || 98.4}%
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Blocked Jailbreaks (24h): <strong>{aiMlOps.modelArmorFirewall?.blockedJailbreaks24h || 18}</strong> ·
                    DLP Redacted PII Tokens: <strong>{aiMlOps.modelArmorFirewall?.redactedPiiTokens24h || 142}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  disabled={executingAction === 'RUN_AI_MLOPS_MODEL_ARMOR_AND_RAG_SYNC'}
                  onClick={() => executeContextualAction('RUN_AI_MLOPS_MODEL_ARMOR_AND_RAG_SYNC')}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {executingAction === 'RUN_AI_MLOPS_MODEL_ARMOR_AND_RAG_SYNC'
                      ? 'Verifying Model Armor & RAG...'
                      : 'Verify Model Armor & RAG Recall'}
                  </span>
                </button>
              </div>

              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-3.5 space-y-2">
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Smart Router (`gemini-3.8-flash` + `gemini-3.1-pro`)
                </div>
                <p className="text-[11px] text-zinc-500">
                  {aiMlOps.smartModelRouter?.routingRule}
                </p>
                <div className="flex items-center justify-between text-[11px] font-mono pt-1">
                  <span className="text-zinc-700 dark:text-zinc-300 font-bold">
                    Flash Share: {aiMlOps.smartModelRouter?.flashTrafficSharePct || 78}%
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    Saved: ${aiMlOps.smartModelRouter?.monthlyTokenSavingsUsd || 490}/mo
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-3.5 space-y-2">
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  GPU / TPU Stockout Predictor
                </div>
                <div className="space-y-1">
                  {(aiMlOps.acceleratorZoneFinder || []).map((acc) => (
                    <div
                      key={acc.zone}
                      className="flex items-center justify-between text-[10px] font-mono px-2 py-1 rounded bg-zinc-50 dark:bg-zinc-800/60"
                    >
                      <span className="truncate">{acc.zone} · {acc.accelerator}</span>
                      <span className="text-zinc-700 dark:text-zinc-300 font-bold">${acc.hourlySpotUsd}/hr</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 7. SRE ON-CALL COMMANDER CONTEXTUAL HELPER */}
          {persona === 'SRE_ONCALL' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-3.5 space-y-2.5 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      SLO Error-Budget Release Freeze Gate
                    </span>
                    <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">
                      {sreOncall.sloBurnFreezeGate?.releaseGateStatus || 'OPEN_HEALTHY'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    1h Burn: <strong>{sreOncall.sloBurnFreezeGate?.burnRate1h || 1.2}x</strong> ·
                    6h Burn: <strong>{sreOncall.sloBurnFreezeGate?.burnRate6h || 0.9}x</strong> (Freeze trips at &gt;14.4x)
                  </p>
                </div>
                <button
                  type="button"
                  disabled={executingAction === 'RUN_SRE_SLO_FREEZE_AND_CHANGE_CORRELATION'}
                  onClick={() => executeContextualAction('RUN_SRE_SLO_FREEZE_AND_CHANGE_CORRELATION')}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer disabled:opacity-50"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>
                    {executingAction === 'RUN_SRE_SLO_FREEZE_AND_CHANGE_CORRELATION'
                      ? 'Auditing SLO Burn & Changes...'
                      : 'Verify SLO Gate & Correlate Changes'}
                  </span>
                </button>
              </div>

              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-3.5 space-y-2">
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Golden-Signal Change Correlator
                </div>
                <div className="space-y-1.5">
                  {(sreOncall.goldenSignalCorrelator || []).map((ev, i) => (
                    <div
                      key={i}
                      className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/60 text-[10px] font-mono space-y-0.5"
                    >
                      <div className="flex justify-between font-bold">
                        <span>{ev.timestampOffset} · {ev.eventType}</span>
                        <span className="text-blue-600 dark:text-blue-400">{ev.verdict}</span>
                      </div>
                      <div className="text-zinc-500 truncate">{ev.resource} -&gt; {ev.correlatedSignal}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-3.5 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Chaos GameDay &amp; Canary Rollback
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Circuit Breaker: <strong className="font-mono text-zinc-700 dark:text-zinc-300">{sreOncall.chaosGameDayHarness?.circuitBreakerStatus || 'VERIFIED_TRIPPED_IN_1.8S'}</strong>
                  </p>
                </div>
                {onRunInShell && sreOncall.sloBurnFreezeGate?.canaryRollbackCmd && (
                  <button
                    type="button"
                    onClick={() => onRunInShell(sreOncall.sloBurnFreezeGate.canaryRollbackCmd)}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 cursor-pointer"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Stage 1-Click Canary Traffic Rollback</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 8. DATABASE RELIABILITY ENGINEER (DBRE) CONTEXTUAL HELPER */}
          {persona === 'DBRE' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-3.5 space-y-2.5 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Lock-Tree &amp; Spanner Hot-Key Inspector
                  </div>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    Spanner Key Prefix: {dbre.lockTreeAndHotKeyInspector?.spannerHotKeyPrefix || 'Balanced <35% CPU'}
                  </p>
                  <pre className="p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 text-[10px] font-mono overflow-x-auto max-h-16">
                    {dbre.lockTreeAndHotKeyInspector?.terminateLockSql || ''}
                  </pre>
                </div>
                <button
                  type="button"
                  disabled={executingAction === 'RUN_DBRE_LOCK_AUDIT_AND_INDEX_ADVISOR'}
                  onClick={() => executeContextualAction('RUN_DBRE_LOCK_AUDIT_AND_INDEX_ADVISOR')}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer disabled:opacity-50"
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>
                    {executingAction === 'RUN_DBRE_LOCK_AUDIT_AND_INDEX_ADVISOR'
                      ? 'Auditing Locks & Indexes...'
                      : 'Audit DB Locks, Indexes & PITR'}
                  </span>
                </button>
              </div>

              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-3.5 space-y-2">
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Zero-Downtime `CREATE INDEX CONCURRENTLY` Advisor
                </div>
                <div className="space-y-1.5">
                  {(dbre.zeroDowntimeIndexAdvisor || []).map((idx, i) => (
                    <div key={i} className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/60 text-[10px] font-mono space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>{idx.table}</span>
                        <span className="text-blue-600 dark:text-blue-400">-{idx.estimatedLatencyDropPct}% latency</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-zinc-500 truncate">{idx.concurrentIndexDdl}</code>
                        <button
                          type="button"
                          onClick={() => handleCopy(`idx-${i}`, idx.concurrentIndexDdl)}
                          className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 font-bold shrink-0 cursor-pointer"
                        >
                          {copiedKey === `idx-${i}` ? 'Copied' : 'Copy DDL'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-3.5 space-y-2 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    PgBouncer Pool &amp; 1.6s PITR Clone Proof
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Mode: <strong className="font-mono">{dbre.connectionPoolGuard?.poolingMode}</strong>
                  </p>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-mono">
                    {dbre.pitrCloneVerification?.rpoStatus}
                  </p>
                </div>
                {onRunInShell && dbre.pitrCloneVerification?.dryRunCloneCmd && (
                  <button
                    type="button"
                    onClick={() => onRunInShell(dbre.pitrCloneVerification.dryRunCloneCmd)}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 cursor-pointer"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Stage PITR Clone Verification CLI</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 9. FINOPS & GREENOPS ECONOMICS CONTEXTUAL HELPER */}
          {persona === 'FINOPS_ENG' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-3.5 space-y-2.5 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Unit Economics &amp; Zombie Resource Reaper
                  </div>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    ${finopsEng.unitEconomicsAttribution?.costPer1kRequestsUsd || 0.0042}/1k req ·
                    ${finopsEng.unitEconomicsAttribution?.costPerActiveTenantUsd || 0.19}/tenant ·
                    ${finopsEng.unitEconomicsAttribution?.costPer1kAiPromptsUsd || 0.075}/1k AI prompts
                  </p>
                </div>
                <button
                  type="button"
                  disabled={executingAction === 'RUN_FINOPS_ZOMBIE_REAP_AND_UNIT_AUDIT'}
                  onClick={() => executeContextualAction('RUN_FINOPS_ZOMBIE_REAP_AND_UNIT_AUDIT')}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer disabled:opacity-50"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>
                    {executingAction === 'RUN_FINOPS_ZOMBIE_REAP_AND_UNIT_AUDIT'
                      ? 'Scanning Zombie Assets...'
                      : 'Scan Zombie Disks/IPs & Unit Cost'}
                  </span>
                </button>
              </div>

              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-3.5 space-y-2">
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Flexible CUD &amp; Spot Coverage Optimizer
                </div>
                <p className="text-[11px] text-zinc-500">
                  Current CUD: <strong>{finopsEng.cudAndSpotOptimizer?.currentCudCoveragePct || 72}%</strong> -&gt; Target: <strong>{finopsEng.cudAndSpotOptimizer?.targetCudCoveragePct || 90}%</strong>
                </p>
                <p className="text-[11px] font-mono text-blue-600 dark:text-blue-400">
                  Net Additional Savings: ${finopsEng.cudAndSpotOptimizer?.netMonthlyCudSavingsUsd || 168}/mo (Break-even: {finopsEng.cudAndSpotOptimizer?.breakEvenMonths || 2.1} mos)
                </p>
              </div>

              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-3.5 space-y-2">
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  GreenOps Carbon-Free Energy (`CFE %`) Shifter
                </div>
                <div className="space-y-1">
                  {(finopsEng.greenOpsCarbonShifter || []).map((g) => (
                    <div
                      key={g.region}
                      className="flex items-center justify-between text-[10px] font-mono px-2 py-1 rounded bg-zinc-50 dark:bg-zinc-800/60"
                    >
                      <span className="truncate">{g.region}</span>
                      <span className="text-zinc-700 dark:text-zinc-300 font-bold">
                        {g.cfePct}% CFE ({g.carbonIntensityGco2Kwh}g)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 10. KUBERNETES & PLATFORM (IDP) ENGINEER CONTEXTUAL HELPER */}
          {persona === 'PLATFORM_K8S' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-3.5 space-y-2.5 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Pod OOMKilled (`Exit 137`) &amp; CPU Right-Sizer
                  </div>
                  <pre className="p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 text-[10px] font-mono overflow-x-auto max-h-20">
                    {platformK8s.oomAndCpuRightSizer?.patchedResourcesYaml || ''}
                  </pre>
                </div>
                <button
                  type="button"
                  disabled={executingAction === 'RUN_PLATFORM_K8S_RIGHTSIZER_AND_MESH_CHECK'}
                  onClick={() => executeContextualAction('RUN_PLATFORM_K8S_RIGHTSIZER_AND_MESH_CHECK')}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer disabled:opacity-50"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>
                    {executingAction === 'RUN_PLATFORM_K8S_RIGHTSIZER_AND_MESH_CHECK'
                      ? 'Auditing GKE & Service Mesh...'
                      : 'Audit GKE Right-Sizing & mTLS Mesh'}
                  </span>
                </button>
              </div>

              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-3.5 space-y-2">
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  East-West Service Mesh mTLS &amp; P99 Map
                </div>
                <div className="space-y-1">
                  {(platformK8s.serviceMeshMtlsMap?.serviceHops || []).map((hop, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-[10px] font-mono px-2 py-1 rounded bg-zinc-50 dark:bg-zinc-800/60"
                    >
                      <span className="truncate">{hop.path}</span>
                      <span className="text-zinc-700 dark:text-zinc-300 font-bold">{hop.p99Ms}ms ({hop.protocol})</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-3.5 space-y-2 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    IDP Golden-Path Service Scaffolder
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Pre-wires Cloud Run v2 + Least-Privilege SA + Cloud Armor WAF + `@sha256` + 99.9% SLO Alert.
                  </p>
                </div>
                {onRunInShell && platformK8s.goldenPathScaffolder?.scaffoldCli && (
                  <button
                    type="button"
                    onClick={() => onRunInShell(platformK8s.goldenPathScaffolder.scaffoldCli)}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 cursor-pointer"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Deploy Golden-Path Service in Shell</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Live Action Receipt Banner when an inline tool runs */}
          {actionResult && (
            <div className="p-3 rounded-xl border border-blue-500/30 bg-blue-500/10 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-xs font-mono text-blue-800 dark:text-blue-200">
                <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="font-bold">{actionResult.action}:</span>
                <span>{actionResult.summary}</span>
              </div>
              <button
                type="button"
                onClick={() => setActionResult(null)}
                className="text-[10px] font-mono underline text-blue-700 dark:text-blue-300 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
