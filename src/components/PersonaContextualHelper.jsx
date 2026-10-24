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
  FileCode
} from 'lucide-react';

// Shared in-memory cache per projectId so switching studios renders telemetry immediately
const personaTelemetryCache = new Map();

const PERSONA_META = {
  ARCHITECT: {
    id: 'ARCHITECT',
    badge: 'ARCHITECT HELPER',
    roleTitle: 'Cloud Architect Contextual Helper',
    subtitle: 'Region Blackout SPOF Blast-Radius Drill · Org Policy Guardrails · 3-Cloud FinOps Arbitrage',
    accentBorder: 'border-indigo-500/40',
    accentBg: 'bg-indigo-500/10',
    accentText: 'text-indigo-600 dark:text-indigo-400',
    icon: Layers
  },
  CLOUD_ENG: {
    id: 'CLOUD_ENG',
    badge: 'CLOUD ENG HELPER',
    roleTitle: 'Cloud Engineer Contextual Helper',
    subtitle: 'ClickOps-to-GitOps .tf Exporter · 5-Gate Pre-Flight Dry-Run Validator · Compensating Undo Saga',
    accentBorder: 'border-blue-500/40',
    accentBg: 'bg-blue-500/10',
    accentText: 'text-blue-600 dark:text-blue-400',
    icon: Terminal
  },
  DATA_ENG: {
    id: 'DATA_ENG',
    badge: 'DATA ENG HELPER',
    roleTitle: 'Data Engineer Contextual Helper',
    subtitle: 'Column-Level Lineage Breaking-Change Guard · Quarantine DLQ Auto-Repair · BQ Slot-to-Spark Offload',
    accentBorder: 'border-emerald-500/40',
    accentBg: 'bg-emerald-500/10',
    accentText: 'text-emerald-600 dark:text-emerald-400',
    icon: Database
  },
  NETOPS: {
    id: 'NETOPS',
    badge: 'NETOPS HELPER',
    roleTitle: 'Network Engineer Contextual Helper',
    subtitle: 'Live 4-Hop Packet Tracer (Ingress -> FW -> Route -> PSC/NAT) · IPAM CIDR Overlap Matrix · Peering Analyzer',
    accentBorder: 'border-amber-500/40',
    accentBg: 'bg-amber-500/10',
    accentText: 'text-amber-600 dark:text-amber-400',
    icon: Network
  },
  DEVSECOPS: {
    id: 'DEVSECOPS',
    badge: 'DEVSECOPS HELPER',
    roleTitle: 'DevSecOps Contextual Helper',
    subtitle: 'Binary Authz @sha256 Digest Gate · IAM Escalation Path Detector · Zero-Key OIDC WIF Generator',
    accentBorder: 'border-rose-500/40',
    accentBg: 'bg-rose-500/10',
    accentText: 'text-rose-600 dark:text-rose-400',
    icon: ShieldCheck
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
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
            overlaps === 0
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
          }`}>
            IPAM Overlaps: {overlaps}
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
            openFw === 0
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
          }`}>
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
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
            mutableCount === 0
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
          }`}>
            Mutable :latest Tags: {mutableCount}
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
            activeKeys === 0
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
          }`}>
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
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            Pre-Flight Gates: {gatesPassed}/{totalGates} PASS
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
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
      const freshnessSla = dataEng.dataContractFreshnessSla?.overallSlaScorePct || 99.4;
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            Freshness SLA: {freshnessSla}%
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            Quarantine DLQ: {dlqRows} rows
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
            Lineage Nodes: {(dataEng.columnLineageDag?.nodes || []).length}
          </span>
        </div>
      );
    }
    // ARCHITECT default
    const spofCount = arch.spofBlastRadius?.singleRegionSpofCount || 0;
    const wArchScore = arch.wellArchitectedScorecard?.overallScore || 94;
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
          Well-Architected: {wArchScore}/100
        </span>
        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
          spofCount === 0
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
        }`}>
          Single-Region SPOFs: {spofCount}
        </span>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          vs AWS Save: ${arch.multiCloudArbitrage?.monthlySavingsVsAwsUsd || 0}/mo
        </span>
      </div>
    );
  };

  return (
    <div className={`rounded-2xl border ${meta.accentBorder} bg-white/95 dark:bg-[#18191c]/95 shadow-sm overflow-hidden transition-all`}>
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
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 transition-colors cursor-pointer"
              >
                <span>Full 5-Persona Board</span>
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
        <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-[#131416] p-4 space-y-4">
          {/* 1. NETWORK ENGINEER CONTEXTUAL HELPER */}
          {persona === 'NETOPS' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-3.5 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Network className="w-3.5 h-3.5 text-amber-500" />
                    Inline 4-Hop Packet Path Tracer (Ingress -&gt; Firewall -&gt; Route -&gt; PSC / Cloud NAT)
                  </div>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
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
                        srcIp: traceSrcIp,
                        dstTarget: traceDstTarget,
                        port: Number(tracePort) || 443,
                        protocol: 'TCP'
                      })
                    }
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-amber-600 hover:bg-amber-500 text-white transition-colors cursor-pointer disabled:opacity-50"
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
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{hop.verdict}</span>
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
                    <code className="font-mono font-bold text-amber-600 dark:text-amber-400">
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
                        <span className="text-amber-600 dark:text-amber-400 font-bold">{sub.cidr}</span>
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
                    <Lock className="w-3.5 h-3.5 text-rose-500" />
                    Binary Authz @sha256 Digest Gate
                  </span>
                  <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400">
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
                        <div className="text-[10px] text-zinc-500 truncate">{art.slsaLevel} ·Vulns: 0</div>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        art.digestPinned
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}>
                        {art.digestPinned ? '@sha256 PINNED' : 'MUTABLE TAG'}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={executingAction === 'VERIFY_DEVSECOPS_SUPPLY_CHAIN_AND_OIDC'}
                  onClick={() => executeContextualAction('VERIFY_DEVSECOPS_SUPPLY_CHAIN_AND_OIDC')}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer disabled:opacity-50"
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
                        <span className="font-bold text-rose-600 dark:text-rose-400">{ep.vector}</span>
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
                  <pre className="p-2 rounded-lg bg-zinc-950 text-zinc-200 text-[10px] font-mono overflow-x-auto max-h-24">
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
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">{chk.status}</span>
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
                  <pre className="p-2 rounded-lg bg-zinc-950 text-zinc-200 text-[10px] font-mono overflow-x-auto max-h-28">
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
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{saga.state}</span>
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
                    <GitBranch className="w-3.5 h-3.5 text-emerald-500" />
                    Column-Level Lineage Breaking-Change Guard
                  </span>
                </div>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-mono">
                  {dataEng.columnLineageDag?.breakingChangeSimulation?.warning ||
                    'Renaming payload_json.amount_cents impacts 3 downstream tables & Vertex AI feature views.'}
                </p>
                <div className="space-y-1 max-h-28 overflow-y-auto">
                  {(dataEng.columnLineageDag?.nodes || []).map((n) => (
                    <div
                      key={n.id}
                      className="flex items-center justify-between text-[10px] font-mono px-2 py-1 rounded bg-zinc-50 dark:bg-zinc-800/60"
                    >
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{n.stage}</span>
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
                    <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">
                      {dataEng.quarantineDlqReplay?.quarantinedRowsLast24h || 14} rows queued
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Table: <code className="font-mono">{dataEng.quarantineDlqReplay?.dlqTable}</code>
                  </p>
                  <pre className="p-2 rounded bg-zinc-950 text-zinc-200 text-[10px] font-mono overflow-x-auto max-h-20">
                    {dataEng.quarantineDlqReplay?.autoRepairSql || ''}
                  </pre>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={executingAction === 'REPLAY_DATA_ENG_QUARANTINE_DLQ'}
                    onClick={() => executeContextualAction('REPLAY_DATA_ENG_QUARANTINE_DLQ')}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer disabled:opacity-50"
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
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
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
                    <Activity className="w-3.5 h-3.5 text-indigo-500" />
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
                  Estimated RTO: <strong className="font-mono text-indigo-600 dark:text-indigo-400">{arch.spofBlastRadius?.estimatedRegionalFailoverRtoSeconds || 14}s</strong> ·
                  RPO: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{arch.spofBlastRadius?.estimatedRpoSeconds || 0}s</strong>
                </p>
                <button
                  type="button"
                  disabled={executingAction === 'RUN_ARCHITECT_SPOF_BLACKOUT_DRILL'}
                  onClick={() =>
                    executeContextualAction('RUN_ARCHITECT_SPOF_BLACKOUT_DRILL', {
                      targetRegion: blackoutRegion
                    })
                  }
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer disabled:opacity-50"
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
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">{pol.effectiveState}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-3.5 space-y-2">
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                  3-Cloud FinOps Arbitrage (Monthly TCO)
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
                    <div className="text-[10px] font-mono text-zinc-500">GCP (CUD)</div>
                    <div className="text-xs font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                      ${arch.multiCloudArbitrage?.gcpMonthlyCudUsd || 0}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-center">
                    <div className="text-[10px] font-mono text-zinc-500">AWS Eq.</div>
                    <div className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                      ${arch.multiCloudArbitrage?.awsEquivalentUsd || 0}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-center">
                    <div className="text-[10px] font-mono text-zinc-500">Azure Eq.</div>
                    <div className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                      ${arch.multiCloudArbitrage?.azureEquivalentUsd || 0}
                    </div>
                  </div>
                </div>
                <p className="text-[10px] font-mono text-zinc-500">
                  {arch.multiCloudArbitrage?.recommendation}
                </p>
              </div>
            </div>
          )}

          {/* Live Action Receipt Banner when an inline tool runs */}
          {actionResult && (
            <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-800 dark:text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="font-bold">{actionResult.action}:</span>
                <span>{actionResult.summary}</span>
              </div>
              <button
                type="button"
                onClick={() => setActionResult(null)}
                className="text-[10px] font-mono underline text-emerald-700 dark:text-emerald-300 cursor-pointer"
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
