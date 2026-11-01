import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  Share2,
  History,
  DollarSign,
  GitBranch,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Trash2,
  Plus,
  Lock,
  Zap,
  Copy,
  Check,
  Clock,
  Activity,
  Terminal,
  Download,
  ExternalLink,
  Database,
  ShieldCheck,
} from 'lucide-react';

export default function Lab2026QuantumNexus({
  projectId,
  initialMode = 'CAUSAL_GRAPH',
  onRefreshGlobal,
  onRunInShell,
  onSelectStudioTab,
  onOpenBigQuerySql,
  onOpenFinOps,
  onShowToast,
  onShowError,
}) {
  const [activeMode, setActiveMode] = useState(initialMode);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState(null);
  const [copiedCmd, setCopiedCmd] = useState(null);

  // 1. Causal Graph state
  const [selectedNodeId, setSelectedNodeId] = useState('node-iam-sa');
  const [simulationType, setSimulationType] = useState('COMPROMISE_CREDENTIAL'); // 'COMPROMISE_CREDENTIAL' | 'OUTAGE_PROPAGATION' | 'COST_RUNAWAY'
  const [containmentBundle, setContainmentBundle] = useState(null);

  // 2. Time-Machine Flight Recorder state
  const [snapshotLabel, setSnapshotLabel] = useState('');
  const [diffLeftId, setDiffLeftId] = useState('');
  const [diffRightId, setDiffRightId] = useState('');
  const [pendingRollbackSnap, setPendingRollbackSnap] = useState(null);
  const [snapshotVerification, setSnapshotVerification] = useState(null);

  // 3. FinOps Circuit-Breaker state
  const [budgetCapUsd, setBudgetCapUsd] = useState(150);
  const [hourlySpikeUsd, setHourlySpikeUsd] = useState(0.35);
  const [autoAction, setAutoAction] = useState('PARK_NIGHT_MODE');
  const [arbitrageSimulation, setArbitrageSimulation] = useState(null);

  // 4. Ephemeral PR Preview state
  const [prNumber, setPrNumber] = useState('PR #409');
  const [branchName, setBranchName] = useState('feat/zero-cold-start-v2');
  const [sourceService, setSourceService] = useState('cloudpulse-api-prod');
  const [shadowPct, setShadowPct] = useState(10);
  const [ttlHours, setTtlHours] = useState(4);
  const [canaryBenchmark, setCanaryBenchmark] = useState(null);

  // 5. Honey-Token Deception Grid state
  const [newHoneyType, setNewHoneyType] = useState('SA_JSON_KEY');
  const [newHoneyName, setNewHoneyName] = useState('');
  const [drillAttackerIp, setDrillAttackerIp] = useState('198.51.100.247');
  const [deceptionForensics, setDeceptionForensics] = useState(null);

  useEffect(() => {
    if (initialMode) setActiveMode(initialMode);
  }, [initialMode]);

  const fetchNexusData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/quantum-nexus/overview`
      );
      setData(res.data);
      const snaps = res.data?.snapshots || [];
      if (snaps.length >= 2) {
        setDiffLeftId((prev) => prev || snaps[1].id);
        setDiffRightId((prev) => prev || snaps[0].id);
      } else if (snaps.length === 1) {
        setDiffLeftId(snaps[0].id);
        setDiffRightId(snaps[0].id);
      }
      if (res.data?.finopsAutopilot?.circuitBreaker) {
        const cb = res.data.finopsAutopilot.circuitBreaker;
        setBudgetCapUsd(cb.maxMonthlyBudgetUsd ?? 150);
        setHourlySpikeUsd(cb.maxHourlySpikeUsd ?? 0.35);
        setAutoAction(cb.autoAction || 'PARK_NIGHT_MODE');
      }
      if (res.data?.liveInventory?.runServices?.[0]?.name) {
        setSourceService(res.data.liveInventory.runServices[0].name);
      }
    } catch (err) {
      onShowError?.(
        err.response?.data?.error ||
          err.message ||
          'Failed to load Quantum Nexus telemetry.'
      );
    } finally {
      setLoading(false);
    }
  }, [projectId, onShowError]);

  useEffect(() => {
    fetchNexusData();
  }, [fetchNexusData]);

  const executeNexusAction = async (action, payload = {}) => {
    if (!projectId) return;
    setBusyAction(action);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/quantum-nexus/action`,
        { action, payload }
      );
      onShowToast?.(res.data?.message || `Completed ${action}`);
      if (res.data?.bundle) setContainmentBundle(res.data.bundle);
      if (res.data?.verification) setSnapshotVerification(res.data.verification);
      if (res.data?.simulation) setArbitrageSimulation(res.data.simulation);
      if (res.data?.benchmark) setCanaryBenchmark(res.data.benchmark);
      if (res.data?.forensicsPackage)
        setDeceptionForensics(res.data.forensicsPackage);
      await fetchNexusData();
      onRefreshGlobal?.();
      return res.data;
    } catch (err) {
      onShowError?.(
        err.response?.data?.error || err.message || `Action ${action} failed.`
      );
    } finally {
      setBusyAction(null);
    }
  };

  const downloadFile = (filename, content, mime = 'text/plain') => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast?.(`Downloaded ${filename}`);
  };

  const nodes = data?.causalGraph?.nodes || [];
  const edges = data?.causalGraph?.edges || [];
  const selectedNode =
    nodes.find((n) => n.id === selectedNodeId) || nodes[0] || null;

  // Compute downstream & upstream causal chain for the selected node
  const causalImpact = useMemo(() => {
    if (!selectedNode)
      return { directDownstream: [], directUpstream: [], affectedIds: new Set() };
    const directDownstream = edges.filter((e) => e.from === selectedNode.id);
    const directUpstream = edges.filter((e) => e.to === selectedNode.id);
    const affectedIds = new Set([selectedNode.id]);
    directDownstream.forEach((e) => affectedIds.add(e.to));
    // 2nd-hop propagation
    edges.forEach((e) => {
      if (affectedIds.has(e.from)) affectedIds.add(e.to);
    });
    return { directDownstream, directUpstream, affectedIds };
  }, [selectedNode, edges]);

  const snapshots = data?.snapshots || [];
  const leftSnap = snapshots.find((s) => s.id === diffLeftId) || snapshots[1] || snapshots[0];
  const rightSnap = snapshots.find((s) => s.id === diffRightId) || snapshots[0];

  const handleCopyCommand = (id, cmd) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const modes = [
    {
      id: 'CAUSAL_GRAPH',
      icon: Share2,
      badge: 'BREAKTHROUGH #1',
      label: 'Causal Blast-Radius Graph (8-Domain Dependency Simulator)',
    },
    {
      id: 'TIME_MACHINE',
      icon: History,
      badge: 'BREAKTHROUGH #2',
      label: 'Time-Machine Flight Recorder (SHA-256 + Ed25519 Rollback)',
    },
    {
      id: 'FINOPS_AUTOPILOT',
      icon: DollarSign,
      badge: 'BREAKTHROUGH #3',
      label: 'FinOps Autopilot (4-Vector Arbitrage & Circuit-Breaker)',
    },
    {
      id: 'EPHEMERAL_PR',
      icon: GitBranch,
      badge: 'BREAKTHROUGH #4',
      label: 'Ephemeral PR Previews & Canary Shadow-Traffic Mirror',
    },
    {
      id: 'HONEY_GRID',
      icon: ShieldAlert,
      badge: 'BREAKTHROUGH #5',
      label: 'Zero-Trust Honey-Token Grid (Security Canary & Tripwires)',
    },
  ];

  const inv = data?.liveInventory || {};

  return (
    <div className="space-y-5">
      {/* Top 5 Resilience Modules Selector Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black shadow-sm">
              <Sparkles className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm sm:text-base font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
                  2026 Quantum Nexus — 5-in-1 Cloud Resilience &amp; Governance Suite
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
                  8-DOMAIN CAUSAL GRAPH · ED25519 STATE MERKLE · CANARY MIRROR
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Causal Dependency Blast-Radius Simulator, Immutable SHA-256 + Ed25519 Project State Time-Machine &amp; Rollback, Autonomous FinOps Circuit-Breaker, Shadow-Traffic PR Previews &amp; Honey-Token Canary Tripwires.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {typeof onSelectStudioTab === 'function' && (
              <>
                <button
                  type="button"
                  onClick={() => onSelectStudioTab('CLOUD_SOC')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-mono font-bold cursor-pointer"
                >
                  <span>Cloud SOC ↗</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectStudioTab('SRE_WAR_ROOM')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 text-xs font-mono font-bold cursor-pointer"
                >
                  <span>SRE War-Room ↗</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={fetchNexusData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 text-xs font-mono font-bold border border-zinc-200 dark:border-zinc-700 cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Sync Live State</span>
            </button>
          </div>
        </div>

        {/* Live 8-Domain GCP Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2 pt-1">
          {[
            {
              label: 'IAM Role Bindings',
              val: inv.iamBindingsCount ?? 15,
              tab: 'SOVEREIGN_STUDIO',
            },
            {
              label: 'Secret Manager',
              val: inv.secretsCount ?? 0,
              tab: 'SOVEREIGN_STUDIO',
            },
            {
              label: 'VPC Firewalls',
              val: `${inv.firewallsCount ?? 0} (${inv.openFirewallsCount ?? 0} Open)`,
              tab: 'VPC_NETWORKS',
            },
            {
              label: 'Cloud Run v2',
              val: inv.runServicesCount ?? 0,
              tab: 'CLOUD_RUN',
            },
            {
              label: 'Compute VMs',
              val: `${inv.vmsCount ?? 0} (${inv.runningVmsCount ?? 0} Up)`,
              tab: 'VM_SSH',
            },
            {
              label: 'GCS Buckets',
              val: inv.bucketsCount ?? 0,
              tab: 'CLOUD_STORAGE',
            },
            {
              label: 'BigQuery Datasets',
              val: inv.datasetsCount ?? 0,
              tab: 'BIGQUERY_STUDIO',
            },
            {
              label: 'State Checkpoints',
              val: snapshots.length,
              tab: null,
            },
          ].map((stat) => (
            <button
              key={stat.label}
              type="button"
              onClick={() =>
                stat.tab && typeof onSelectStudioTab === 'function'
                  ? onSelectStudioTab(stat.tab)
                  : setActiveMode('TIME_MACHINE')
              }
              className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/40 text-left cursor-pointer transition-colors"
            >
              <div className="text-[10px] font-mono text-zinc-500 truncate">
                {stat.label}
              </div>
              <div className="text-xs font-mono font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
                {stat.val}
              </div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2">
          {modes.map((m) => {
            const Icon = m.icon;
            const active = activeMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                data-feature-id={m.id}
                onClick={() => setActiveMode(m.id)}
                className={`text-left p-2.5 rounded-md border transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                  active
                    ? 'bg-blue-50 dark:bg-blue-500/15 border-blue-500 text-blue-900 dark:text-blue-100 shadow-sm'
                    : 'bg-zinc-50 dark:bg-zinc-900/70 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-blue-400 dark:hover:border-blue-500/50'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold">
                    {m.badge}
                  </span>
                  <Icon className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
                </div>
                <div className="text-xs font-bold leading-snug">{m.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          1. UNIFIED CROSS-CLOUD BLAST-RADIUS & CAUSAL GRAPH
      ===================================================================== */}
      {activeMode === 'CAUSAL_GRAPH' && (
        <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div>
              <h4 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <span>
                  Cross-Cloud Causal Blast-Radius &amp; Failure-Propagation Simulator (8 Project Domains)
                </span>
              </h4>
              <p className="text-xs text-zinc-500">
                Click any live node below to trace how an IAM key leak, Secret Manager compromise, firewall change, or service outage cascades across your identity, compute, BigLake data, BigQuery SQL, and billing.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'COMPROMISE_CREDENTIAL', label: 'Simulate Credential Breach' },
                { id: 'OUTAGE_PROPAGATION', label: 'Simulate Cascading Outage' },
                { id: 'COST_RUNAWAY', label: 'Simulate DDoS / Spend Spike' },
              ].map((sim) => (
                <button
                  key={sim.id}
                  type="button"
                  data-feature-id={sim.id}
                  onClick={() => setSimulationType(sim.id)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-mono font-bold border cursor-pointer transition-all ${
                    simulationType === sim.id
                      ? 'bg-red-600 text-white border-red-500'
                      : 'bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  {sim.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Causal Graph Nodes */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {nodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const isAffected = causalImpact.affectedIds.has(node.id);
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`text-left p-4 rounded-xl border-2 transition-all cursor-pointer space-y-2 flex flex-col justify-between ${
                    isSelected
                      ? 'border-red-500 bg-red-500/10 shadow-md'
                      : isAffected
                      ? 'border-amber-500/60 bg-amber-500/5'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white">
                        {node.category}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          isSelected
                            ? 'bg-red-600 text-white'
                            : isAffected
                            ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {isSelected
                          ? 'EPICENTER'
                          : isAffected
                          ? 'IN BLAST RADIUS'
                          : '✓ ISOLATED'}
                      </span>
                    </div>

                    <div className="text-sm font-extrabold text-zinc-950 dark:text-zinc-100">
                      {node.label}
                    </div>
                    <div className="text-xs font-mono text-zinc-500">
                      {node.detail}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-zinc-200/70 dark:border-zinc-800">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-red-500 font-bold">
                        Blast Risk: {node.riskScore}/100
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        Burn: ${(node.costHr || 0).toFixed(4)}/hr
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                      {typeof onSelectStudioTab === 'function' &&
                        node.ownerStudioTab && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectStudioTab(node.ownerStudioTab);
                            }}
                            className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                          >
                            {node.ownerStudioLabel || 'Open Studio'} ↗
                          </button>
                        )}
                      {typeof onRunInShell === 'function' && node.inspectCli && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRunInShell(node.inspectCli);
                          }}
                          className="text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                        >
                          $ Inspect CLI
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Causal Propagation Inspector Panel */}
          {selectedNode && (
            <div className="p-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-red-500 font-bold">
                    Live Causal Propagation Analysis ({simulationType})
                  </span>
                  <h5 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-100">
                    Epicenter: {selectedNode.label} — Affects{' '}
                    {causalImpact.affectedIds.size} of {nodes.length} Project Domains
                  </h5>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 text-xs font-mono font-bold">
                    {simulationType === 'COMPROMISE_CREDENTIAL'
                      ? 'Exfiltration Blast Score: CRITICAL'
                      : simulationType === 'OUTAGE_PROPAGATION'
                      ? 'SLO Availability Impact: 99.95% → 42.0%'
                      : `Runaway Spend Risk: +$${(
                          (selectedNode.costHr || 0.04) * 45
                        ).toFixed(2)}/hr`}
                  </span>
                  <button
                    type="button"
                    disabled={
                      busyAction === 'SYNTHESIZE_BLAST_RADIUS_CONTAINMENT_BUNDLE'
                    }
                    onClick={() =>
                      executeNexusAction(
                        'SYNTHESIZE_BLAST_RADIUS_CONTAINMENT_BUNDLE',
                        {
                          epicenterNodeId: selectedNode.id,
                          epicenterLabel: selectedNode.label,
                          simulationType,
                          affectedCount: causalImpact.affectedIds.size,
                        }
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-extrabold cursor-pointer disabled:opacity-50"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>
                      {busyAction === 'SYNTHESIZE_BLAST_RADIUS_CONTAINMENT_BUNDLE'
                        ? 'Synthesizing Containment...'
                        : 'Synthesize Ed25519 Containment Bundle (.sh + Deny + SQL)'}
                    </span>
                  </button>
                  {typeof onRunInShell === 'function' &&
                    selectedNode.mitigationCli && (
                      <button
                        type="button"
                        onClick={() => onRunInShell(selectedNode.mitigationCli)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-mono font-bold cursor-pointer"
                      >
                        <Terminal className="w-3.5 h-3.5" />
                        <span>$ Run Mitigation in Shell</span>
                      </button>
                    )}
                </div>
              </div>

              <p className="text-xs text-zinc-600 dark:text-zinc-300">
                {selectedNode.blastRadiusSummary}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 space-y-1.5">
                  <div className="text-xs font-bold text-red-600 dark:text-red-400">
                    Downstream Causal Edges ({causalImpact.directDownstream.length})
                  </div>
                  {causalImpact.directDownstream.length === 0 ? (
                    <div className="text-xs text-zinc-500">
                      Terminal sink node — no further downstream dependencies.
                    </div>
                  ) : (
                    causalImpact.directDownstream.map((edge, idx) => {
                      const target = nodes.find((n) => n.id === edge.to);
                      return (
                        <div
                          key={idx}
                          className="text-xs flex items-start justify-between gap-2 p-2 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                        >
                          <div>
                            <span className="font-bold text-zinc-900 dark:text-zinc-100">
                              → {target?.label || edge.to}
                            </span>
                            <div className="text-[11px] text-zinc-500">
                              {edge.relation}
                            </div>
                          </div>
                          <span className="px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-500 font-mono text-[10px] font-bold shrink-0">
                            {edge.impactType}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 space-y-1.5">
                  <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    Upstream Triggers ({causalImpact.directUpstream.length})
                  </div>
                  {causalImpact.directUpstream.length === 0 ? (
                    <div className="text-xs text-zinc-500">
                      Root authority node — originates identity or perimeter trust.
                    </div>
                  ) : (
                    causalImpact.directUpstream.map((edge, idx) => {
                      const src = nodes.find((n) => n.id === edge.from);
                      return (
                        <div
                          key={idx}
                          className="text-xs flex items-start justify-between gap-2 p-2 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                        >
                          <div>
                            <span className="font-bold text-zinc-900 dark:text-zinc-100">
                              ← {src?.label || edge.from}
                            </span>
                            <div className="text-[11px] text-zinc-500">
                              {edge.relation}
                            </div>
                          </div>
                          <span className="px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-500 font-mono text-[10px] font-bold shrink-0">
                            {edge.impactType}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Synthesized Ed25519 Blast-Radius Containment Bundle Drawer */}
              {containmentBundle && (
                <div className="mt-3 p-4 rounded-xl border-2 border-red-500/40 bg-red-500/5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-mono font-extrabold">
                        ED25519 CONTAINMENT BUNDLE
                      </span>
                      <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {containmentBundle.epicenterLabel} ({containmentBundle.simulationType})
                      </span>
                      <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                        {containmentBundle.sha256Digest} · {containmentBundle.ed25519KeyFingerprint}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {typeof onOpenBigQuerySql === 'function' &&
                        containmentBundle.forensicsBigQuerySql && (
                          <button
                            type="button"
                            onClick={() =>
                              onOpenBigQuerySql(
                                containmentBundle.forensicsBigQuerySql,
                                `Blast-Radius Forensics (${containmentBundle.epicenterLabel})`
                              )
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-mono font-bold cursor-pointer"
                          >
                            <Database className="w-3 h-3" />
                            <span>Open Audit SQL in BigQuery Workbench</span>
                          </button>
                        )}
                      {typeof onRunInShell === 'function' &&
                        containmentBundle.containmentRunbookSh && (
                          <button
                            type="button"
                            onClick={() =>
                              onRunInShell(containmentBundle.containmentRunbookSh)
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-mono font-bold cursor-pointer"
                          >
                            <Terminal className="w-3 h-3" />
                            <span>$ Run Runbook in Cloud Shell</span>
                          </button>
                        )}
                      <button
                        type="button"
                        onClick={() =>
                          downloadFile(
                            `${projectId}-blast-containment-${containmentBundle.epicenterId}.sh`,
                            containmentBundle.containmentRunbookSh,
                            'text/x-shellscript'
                          )
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[11px] font-mono font-bold cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download .sh</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-[11px] font-mono">
                    <div className="space-y-1">
                      <div className="font-bold text-zinc-700 dark:text-zinc-300">
                        1. Emergency Containment Runbook (.sh)
                      </div>
                      <pre className="max-h-44 overflow-auto p-2.5 rounded-lg bg-zinc-950 text-emerald-400 whitespace-pre-wrap">
                        {containmentBundle.containmentRunbookSh}
                      </pre>
                    </div>
                    <div className="space-y-1">
                      <div className="font-bold text-zinc-700 dark:text-zinc-300">
                        2. Zero-Trust IAM v2 Deny Policy (JSON)
                      </div>
                      <pre className="max-h-44 overflow-auto p-2.5 rounded-lg bg-zinc-950 text-amber-300 whitespace-pre-wrap">
                        {containmentBundle.iamDenyPolicyJson}
                      </pre>
                    </div>
                    <div className="space-y-1">
                      <div className="font-bold text-zinc-700 dark:text-zinc-300">
                        3. Cloud Audit Log Forensics SQL (BigQuery)
                      </div>
                      <pre className="max-h-44 overflow-auto p-2.5 rounded-lg bg-zinc-950 text-blue-300 whitespace-pre-wrap">
                        {containmentBundle.forensicsBigQuerySql}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          2. TIME-MACHINE FLIGHT RECORDER & 1-CLICK STATE ROLLBACK
      ===================================================================== */}
      {activeMode === 'TIME_MACHINE' && (
        <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div>
              <h4 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <History className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <span>
                  Time-Machine Project State Flight Recorder (SHA-256 + Ed25519 Signed) &amp; Verified 1-Click Rollback
                </span>
              </h4>
              <p className="text-xs text-zinc-500">
                Capture cryptographic SHA-256 + Ed25519 checkpoints of your project&apos;s IAM bindings, VPC Firewalls, Cloud Run revisions, GCS Buckets, Secrets &amp; VM states, verify live drift, and roll back with human approval.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={snapshotLabel}
                onChange={(e) => setSnapshotLabel(e.target.value)}
                placeholder="Checkpoint label (e.g. Pre-IAM Firewall Change)..."
                className="px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 w-64"
              />
              <button
                type="button"
                disabled={busyAction === 'CAPTURE_SNAPSHOT'}
                onClick={async () => {
                  await executeNexusAction('CAPTURE_SNAPSHOT', {
                    label:
                      snapshotLabel.trim() ||
                      `Live Operator Checkpoint (${new Date().toLocaleTimeString()})`,
                  });
                  setSnapshotLabel('');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>
                  {busyAction === 'CAPTURE_SNAPSHOT'
                    ? 'Recording...'
                    : 'Capture Signed State Snapshot'}
                </span>
              </button>
            </div>
          </div>

          {/* Human-in-the-loop Approval Modal for Rollback */}
          {pendingRollbackSnap && (
            <div className="p-4 rounded-xl bg-amber-500/15 border-2 border-amber-500/60 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="text-xs font-extrabold text-amber-600 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>
                    HUMAN APPROVAL REQUIRED: Confirm Project State Rollback
                  </span>
                </div>
                <p className="text-xs text-zinc-700 dark:text-zinc-200">
                  You are about to restore project{' '}
                  <span className="font-mono font-bold">{projectId}</span> to
                  checkpoint{' '}
                  <span className="font-mono font-bold">
                    &quot;{pendingRollbackSnap.label}&quot; (
                    {pendingRollbackSnap.hash})
                  </span>
                  .
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPendingRollbackSnap(null)}
                  className="px-3 py-1.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={busyAction === 'ROLLBACK_SNAPSHOT'}
                  onClick={async () => {
                    await executeNexusAction('ROLLBACK_SNAPSHOT', {
                      snapshotId: pendingRollbackSnap.id,
                    });
                    setPendingRollbackSnap(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Approve &amp; Execute Rollback</span>
                </button>
              </div>
            </div>
          )}

          {/* Side-by-Side 8-Dimension State Diff Engine */}
          {leftSnap && rightSnap && (
            <div className="p-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                  8-Dimension Visual State Diff Engine (Compare Any 2 Checkpoints)
                </span>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <select
                    value={leftSnap.id}
                    onChange={(e) => setDiffLeftId(e.target.value)}
                    className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 font-mono text-xs"
                  >
                    {snapshots.map((s) => (
                      <option key={s.id} value={s.id}>
                        Baseline: {s.label} ({s.hash.slice(0, 13)})
                      </option>
                    ))}
                  </select>
                  <span className="font-mono text-zinc-400">vs</span>
                  <select
                    value={rightSnap.id}
                    onChange={(e) => setDiffRightId(e.target.value)}
                    className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 font-mono text-xs"
                  >
                    {snapshots.map((s) => (
                      <option key={s.id} value={s.id}>
                        Target: {s.label} ({s.hash.slice(0, 13)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                {[
                  {
                    label: 'Open 0.0.0.0/0 Firewalls',
                    before: leftSnap.metrics?.openFirewallsCount ?? 0,
                    after: rightSnap.metrics?.openFirewallsCount ?? 0,
                  },
                  {
                    label: 'IAM Role Bindings',
                    before: leftSnap.metrics?.iamBindingsCount ?? 15,
                    after: rightSnap.metrics?.iamBindingsCount ?? 15,
                  },
                  {
                    label: 'VPC-SC Perimeter Mode',
                    before: leftSnap.configSummary?.vpcPerimeterMode || 'ENFORCED',
                    after: rightSnap.configSummary?.vpcPerimeterMode || 'ENFORCED',
                  },
                  {
                    label: 'Hourly Burn Rate ($/hr)',
                    before: `$${(leftSnap.metrics?.hourlyBurnUsd ?? 0.0).toFixed(3)}`,
                    after: `$${(rightSnap.metrics?.hourlyBurnUsd ?? 0.0).toFixed(3)}`,
                  },
                  {
                    label: 'Compute Engine VMs',
                    before: leftSnap.metrics?.vmsCount ?? 0,
                    after: rightSnap.metrics?.vmsCount ?? 0,
                  },
                  {
                    label: 'Cloud Run v2 Services',
                    before: leftSnap.metrics?.cloudRunCount ?? 0,
                    after: rightSnap.metrics?.cloudRunCount ?? 0,
                  },
                  {
                    label: 'Cloud Storage Buckets',
                    before: leftSnap.metrics?.bucketsCount ?? inv.bucketsCount ?? 0,
                    after: rightSnap.metrics?.bucketsCount ?? inv.bucketsCount ?? 0,
                  },
                  {
                    label: 'Secret Manager Secrets',
                    before: leftSnap.metrics?.secretsCount ?? inv.secretsCount ?? 0,
                    after: rightSnap.metrics?.secretsCount ?? inv.secretsCount ?? 0,
                  },
                ].map((row, i) => {
                  const changed = String(row.before) !== String(row.after);
                  return (
                    <div
                      key={i}
                      className={`p-2.5 rounded-lg border ${
                        changed
                          ? 'border-amber-500/40 bg-amber-500/10'
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900'
                      }`}
                    >
                      <div className="text-[10px] text-zinc-500">{row.label}</div>
                      <div className="mt-1 font-bold flex items-center gap-1.5">
                        <span className="text-zinc-500">{String(row.before)}</span>
                        <span>→</span>
                        <span
                          className={
                            changed
                              ? 'text-amber-600 dark:text-amber-400 underline'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }
                        >
                          {String(row.after)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Live SHA-256 & Ed25519 Drift Verification Scorecard */}
          {snapshotVerification && (
            <div className="p-4 rounded-xl border-2 border-emerald-500/40 bg-emerald-500/5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-mono font-extrabold">
                    {snapshotVerification.status}
                  </span>
                  <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    Checkpoint: {snapshotVerification.snapshotLabel} ({snapshotVerification.checkpointHash})
                  </span>
                  <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                    Live GCP Hash: {snapshotVerification.liveHash} · Ed25519 Verified
                  </span>
                </div>
                {typeof onRunInShell === 'function' &&
                  snapshotVerification.reconcileCli && (
                    <button
                      type="button"
                      onClick={() =>
                        onRunInShell(snapshotVerification.reconcileCli)
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold cursor-pointer"
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      <span>$ Run Drift Audit CLI in Shell</span>
                    </button>
                  )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs font-mono">
                {(snapshotVerification.driftDimensions || []).map((dim) => (
                  <div
                    key={dim.key}
                    className={`p-2 rounded-lg border ${
                      dim.drifted
                        ? 'border-amber-500/40 bg-amber-500/10'
                        : 'border-emerald-500/30 bg-white dark:bg-zinc-950'
                    }`}
                  >
                    <div className="text-[10px] text-zinc-500 truncate">
                      {dim.label}
                    </div>
                    <div className="font-bold mt-0.5 text-zinc-900 dark:text-zinc-100">
                      {dim.checkpointVal} → {dim.liveVal}{' '}
                      <span
                        className={
                          dim.drifted ? 'text-amber-500' : 'text-emerald-500'
                        }
                      >
                        ({dim.drifted ? 'DRIFT' : 'MATCH'})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline of Recorded Checkpoints */}
          <div className="space-y-2">
            {snapshots.map((snap, idx) => (
              <div
                key={snap.id}
                className="p-3.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-300 font-mono text-[10px] font-bold">
                      {idx === 0 ? 'LATEST HEAD' : `CHECKPOINT #${snapshots.length - idx}`}
                    </span>
                    <span className="text-xs font-extrabold text-zinc-950 dark:text-zinc-100">
                      {snap.label}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                      {snap.hash}
                    </span>
                    {snap.ed25519KeyFingerprint && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-700 dark:text-emerald-300">
                        {snap.ed25519KeyFingerprint}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-500 font-mono">
                    Recorded {new Date(snap.createdAt).toLocaleString()} by{' '}
                    {snap.author} · VMs: {snap.metrics?.vmsCount ?? 0} · Cloud Run:{' '}
                    {snap.metrics?.cloudRunCount ?? 0} · Buckets:{' '}
                    {snap.metrics?.bucketsCount ?? inv.bucketsCount ?? 0} · Open FW:{' '}
                    {snap.metrics?.openFirewallsCount ?? 0}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={busyAction === 'VERIFY_SNAPSHOT_INTEGRITY'}
                    onClick={() =>
                      executeNexusAction('VERIFY_SNAPSHOT_INTEGRITY', {
                        snapshotId: snap.id,
                      })
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verify SHA-256 vs Live</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      downloadFile(
                        `${projectId}-checkpoint-${snap.id}.json`,
                        JSON.stringify(snap, null, 2),
                        'application/json'
                      )
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 text-xs font-mono font-bold cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Manifest (.json)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingRollbackSnap(snap)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-300 border border-amber-500/30 text-xs font-mono font-bold cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore This Checkpoint...</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          3. AUTONOMOUS FINOPS AUTOPILOT & COMMITMENT ARBITRAGE ENGINE
      ===================================================================== */}
      {activeMode === 'FINOPS_AUTOPILOT' && (
        <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div>
              <h4 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <span>
                  Autonomous FinOps Autopilot, 4-Vector Spot/Slot/Autoclass Arbitrage &amp; Budget Circuit-Breaker
                </span>
              </h4>
              <p className="text-xs text-zinc-500">
                Continuous arbitrage across Spot VMs, Cloud Run request-only CPU throttling, BigLake/BigQuery slot pricing, GCS Autoclass tiering, and an automated hard-cap circuit-breaker.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-mono font-extrabold">
                Identified Arbitrage Savings: $
                {data?.finopsAutopilot?.totalMonthlySavingsPotentialUsd ?? 126.5}/mo
              </span>
              <button
                type="button"
                disabled={busyAction === 'SIMULATE_FINOPS_ARBITRAGE_BUNDLE'}
                onClick={() =>
                  executeNexusAction('SIMULATE_FINOPS_ARBITRAGE_BUNDLE', {
                    totalMonthlySavingsUsd:
                      data?.finopsAutopilot?.totalMonthlySavingsPotentialUsd ??
                      126.5,
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-extrabold cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {busyAction === 'SIMULATE_FINOPS_ARBITRAGE_BUNDLE'
                    ? 'Simulating 4-Vector ROI...'
                    : 'Run 4-Vector Arbitrage Dry-Run & Carbon ROI'}
                </span>
              </button>
            </div>
          </div>

          {/* 4-Vector FinOps Arbitrage Dry-Run & Carbon ROI Scorecard */}
          {arbitrageSimulation && (
            <div className="p-4 rounded-xl border-2 border-emerald-500/40 bg-emerald-500/5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-mono font-extrabold">
                    4-VECTOR ARBITRAGE DRY-RUN VERIFIED
                  </span>
                  <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    Monthly: -${arbitrageSimulation.monthlySavingsUsd}/mo · Annual: -$
                    {arbitrageSimulation.annualSavingsUsd}/yr · 3-Year: -$
                    {arbitrageSimulation.threeYearSavingsUsd}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    Carbon Saved: ~{arbitrageSimulation.carbonSavedKgCo2Yr} kg CO2e/yr ·{' '}
                    {arbitrageSimulation.slaImpact}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {typeof onRunInShell === 'function' &&
                    arbitrageSimulation.arbitrageScriptSh && (
                      <button
                        type="button"
                        onClick={() =>
                          onRunInShell(arbitrageSimulation.arbitrageScriptSh)
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold cursor-pointer"
                      >
                        <Terminal className="w-3.5 h-3.5" />
                        <span>$ Run Arbitrage Script in Shell</span>
                      </button>
                    )}
                  <button
                    type="button"
                    onClick={() =>
                      downloadFile(
                        `${projectId}-finops-autopilot-arbitrage.sh`,
                        arbitrageSimulation.arbitrageScriptSh,
                        'text/x-shellscript'
                      )
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-mono font-bold cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .sh</span>
                  </button>
                </div>
              </div>
              <pre className="max-h-40 overflow-auto p-2.5 rounded-lg bg-zinc-950 text-emerald-400 text-[11px] font-mono whitespace-pre-wrap">
                {arbitrageSimulation.arbitrageScriptSh}
              </pre>
            </div>
          )}

          {/* Automated Budget Circuit-Breaker Controls */}
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h5 className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Automated Hard-Cap Budget Circuit-Breaker Policy
                </h5>
                <p className="text-xs text-zinc-500 max-w-2xl leading-relaxed mt-0.5">
                  Set both a <strong>Monthly Hard Cap ($/mo)</strong> and a{' '}
                  <strong>Max Hourly Burn Spike ($/hr)</strong> below. Clicking{' '}
                  <strong>Arm Circuit-Breaker &amp; Sync Budget API</strong>{' '}
                  provisions a live Cloud Billing Budget on{' '}
                  <code className="font-mono">billingbudgets.googleapis.com/v1</code>{' '}
                  and arms your chosen tripwire action (such as parking idle VMs
                  and scaling warm Cloud Run instances to zero) the moment spend
                  exceeds your threshold.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {onOpenFinOps && (
                  <button
                    type="button"
                    onClick={onOpenFinOps}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-300 border border-blue-500/30 text-xs font-extrabold cursor-pointer"
                    title="Open Native Per-Service Spend Cap Studio (billingbudgets.googleapis.com/v1)"
                  >
                    <span>Per-Service Spend Caps (FinOps) →</span>
                  </button>
                )}
                <button
                  type="button"
                  disabled={busyAction === 'UPDATE_FINOPS_CIRCUIT_BREAKER'}
                  onClick={() =>
                    executeNexusAction('UPDATE_FINOPS_CIRCUIT_BREAKER', {
                      enabled: true,
                      maxMonthlyBudgetUsd: Number(budgetCapUsd),
                      maxHourlySpikeUsd: Number(hourlySpikeUsd),
                      autoAction,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {busyAction === 'UPDATE_FINOPS_CIRCUIT_BREAKER'
                      ? 'Syncing to Cloud Billing API...'
                      : 'Arm Circuit-Breaker & Sync Budget API'}
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  Monthly Hard Cap ($ USD/mo)
                </label>
                <input
                  type="number"
                  value={budgetCapUsd}
                  onChange={(e) => setBudgetCapUsd(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 font-mono font-bold"
                />
              </div>
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  Max Hourly Burn Spike ($ USD/hr)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={hourlySpikeUsd}
                  onChange={(e) => setHourlySpikeUsd(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 font-mono font-bold"
                />
              </div>
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  Tripwire Automatic Action
                </label>
                <select
                  value={autoAction}
                  onChange={(e) => setAutoAction(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 font-mono font-bold"
                >
                  <option value="PARK_NIGHT_MODE">
                    Park Night-Mode ($0 Idle VM + Run Scale-to-0)
                  </option>
                  <option value="THROTTLE_WARM_INSTANCES">
                    Throttle Cloud Run min-instances=0 &amp; CPU-Idle
                  </option>
                  <option value="ALERT_ONLY">
                    Emit High-Priority FinOps Alert Only
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* 4-Vector Arbitrage Opportunities List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(data?.finopsAutopilot?.arbitrageOpportunities || []).map((opp) => (
              <div
                key={opp.id}
                className="p-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-extrabold">
                      SAVE {opp.discountPct}% (-${opp.monthlySavingsUsd}/mo)
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-zinc-400">
                        ${opp.currentMonthlyUsd}/mo → ${opp.optimizedMonthlyUsd}/mo
                      </span>
                      {typeof onSelectStudioTab === 'function' &&
                        opp.ownerStudioTab && (
                          <button
                            type="button"
                            onClick={() => onSelectStudioTab(opp.ownerStudioTab)}
                            className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                          >
                            {opp.ownerStudioLabel || 'Studio'} ↗
                          </button>
                        )}
                    </div>
                  </div>
                  <div className="text-xs font-extrabold text-zinc-950 dark:text-zinc-100">
                    {opp.title}
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500">
                    Target: {opp.target}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="p-2 rounded bg-zinc-950 text-emerald-400 font-mono text-[10px] overflow-x-auto">
                    $ {opp.command}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyCommand(opp.id, opp.command)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-900 hover:bg-emerald-500/15 text-xs font-mono font-bold cursor-pointer"
                    >
                      {copiedCmd === opp.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Command</span>
                        </>
                      )}
                    </button>
                    {typeof onRunInShell === 'function' && (
                      <button
                        type="button"
                        onClick={() => onRunInShell(opp.command)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold cursor-pointer"
                      >
                        <Terminal className="w-3.5 h-3.5" />
                        <span>$ Run in Shell</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          4. LIVE EPHEMERAL PR PREVIEW ENVIRONMENTS & SHADOW TRAFFIC MIRROR
      ===================================================================== */}
      {activeMode === 'EPHEMERAL_PR' && (
        <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div>
              <h4 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <span>
                  Live Ephemeral PR Preview Stacks &amp; Canary Shadow-Traffic Mirror
                </span>
              </h4>
              <p className="text-xs text-zinc-500">
                Spin up isolated Cloud Run branch previews that mirror 1%–25% of live production requests asynchronously and auto-self-destruct after TTL expiry ($0 zombie bills).
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {typeof onSelectStudioTab === 'function' && (
                <button
                  type="button"
                  onClick={() => onSelectStudioTab('CLOUD_RUN')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-300 border border-blue-500/30 text-xs font-mono font-bold cursor-pointer"
                >
                  <span>Open Cloud Run Studio ↗</span>
                </button>
              )}
              <button
                type="button"
                disabled={busyAction === 'BENCHMARK_EPHEMERAL_PR_ENV'}
                onClick={() =>
                  executeNexusAction('BENCHMARK_EPHEMERAL_PR_ENV', {
                    prNumber,
                    branch: branchName,
                    sourceService,
                    shadowTrafficPct: shadowPct,
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-extrabold cursor-pointer disabled:opacity-50"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>
                  {busyAction === 'BENCHMARK_EPHEMERAL_PR_ENV'
                    ? 'Benchmarking Canary...'
                    : 'Run Canary Latency Benchmark & CI/CD YAML'}
                </span>
              </button>
            </div>
          </div>

          {/* Launch New Ephemeral PR Stack */}
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-6 gap-3 items-end">
            <div>
              <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                Pull Request ID
              </label>
              <input
                type="text"
                value={prNumber}
                onChange={(e) => setPrNumber(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                Git Branch
              </label>
              <input
                type="text"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                Source Cloud Run Service
              </label>
              <input
                type="text"
                value={sourceService}
                onChange={(e) => setSourceService(e.target.value)}
                list="quantum-run-services-list"
                className="w-full px-2.5 py-1.5 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono"
              />
              <datalist id="quantum-run-services-list">
                {(inv.runServices || []).map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name} ({s.region})
                  </option>
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                Shadow Traffic Mirror %
              </label>
              <select
                value={shadowPct}
                onChange={(e) => setShadowPct(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono"
              >
                <option value={5}>5% Shadow Mirror</option>
                <option value={10}>10% Shadow Mirror</option>
                <option value={25}>25% Shadow Mirror</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                Auto Self-Destruct TTL
              </label>
              <select
                value={ttlHours}
                onChange={(e) => setTtlHours(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono"
              >
                <option value={2}>2 Hours TTL</option>
                <option value={4}>4 Hours TTL</option>
                <option value={8}>8 Hours TTL</option>
                <option value={24}>24 Hours TTL</option>
              </select>
            </div>
            <button
              type="button"
              disabled={busyAction === 'CREATE_EPHEMERAL_PR_ENV'}
              onClick={() =>
                executeNexusAction('CREATE_EPHEMERAL_PR_ENV', {
                  prNumber,
                  branch: branchName,
                  sourceService,
                  shadowTrafficPct: shadowPct,
                  ttlHours,
                })
              }
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Spawn PR Shadow Stack</span>
            </button>
          </div>

          {/* Canary Shadow Benchmark & GitHub Actions YAML Drawer */}
          {canaryBenchmark && (
            <div className="p-4 rounded-xl border-2 border-emerald-500/40 bg-emerald-500/5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-mono font-extrabold">
                    {canaryBenchmark.metrics?.verdict}
                  </span>
                  <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {canaryBenchmark.prNumber} ({canaryBenchmark.branch})
                  </span>
                  <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                    Prod P50/P95/P99: {canaryBenchmark.metrics?.prodP50Ms}ms /{' '}
                    {canaryBenchmark.metrics?.prodP95Ms}ms /{' '}
                    {canaryBenchmark.metrics?.prodP99Ms}ms → Shadow:{' '}
                    {canaryBenchmark.metrics?.shadowP50Ms}ms /{' '}
                    {canaryBenchmark.metrics?.shadowP95Ms}ms /{' '}
                    {canaryBenchmark.metrics?.shadowP99Ms}ms
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {typeof onRunInShell === 'function' &&
                    canaryBenchmark.trafficSplitCli && (
                      <button
                        type="button"
                        onClick={() =>
                          onRunInShell(canaryBenchmark.trafficSplitCli)
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold cursor-pointer"
                      >
                        <Terminal className="w-3.5 h-3.5" />
                        <span>$ Run Traffic Split in Shell</span>
                      </button>
                    )}
                  <button
                    type="button"
                    onClick={() =>
                      downloadFile(
                        'ephemeral-pr-preview.yml',
                        canaryBenchmark.githubActionsYaml,
                        'text/yaml'
                      )
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-mono font-bold cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download GitHub Action (.yml)</span>
                  </button>
                </div>
              </div>
              <pre className="max-h-44 overflow-auto p-2.5 rounded-lg bg-zinc-950 text-emerald-400 text-[11px] font-mono whitespace-pre-wrap">
                {canaryBenchmark.githubActionsYaml}
              </pre>
            </div>
          )}

          {/* Active Ephemeral Preview Environments */}
          <div className="space-y-2.5">
            {(data?.ephemeralEnvs || []).map((env) => (
              <div
                key={env.id}
                className="p-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-300 font-mono text-[10px] font-extrabold">
                      {env.prNumber} · {env.branch}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold">
                      MIRRORING {env.shadowTrafficPct}% PROD TRAFFIC
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 font-mono text-[10px] font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Auto-TTL: {env.ttlHours}h (Scale-to-$0)
                    </span>
                  </div>
                  <div className="text-xs font-mono text-blue-500">
                    {env.previewUrl}
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500">
                    Service: <b>{env.sourceService || 'cloudpulse-api-prod'}</b> · Prod P95:{' '}
                    <b>{env.prodP95Ms}ms</b> vs Shadow P95:{' '}
                    <b className="text-emerald-500">{env.shadowP95Ms}ms</b> ·
                    Shadow 5xx Error Rate:{' '}
                    <b className="text-emerald-500">{env.shadowErrorRatePct}%</b>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      executeNexusAction('BENCHMARK_EPHEMERAL_PR_ENV', {
                        envId: env.id,
                      })
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold cursor-pointer"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Benchmark P95</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      executeNexusAction('DELETE_EPHEMERAL_PR_ENV', {
                        envId: env.id,
                      })
                    }
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-red-500/15 hover:bg-red-500/25 text-red-600 dark:text-red-400 border border-red-500/30 text-xs font-mono font-bold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Destroy Now ($0)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          5. ZERO-TRUST HONEY-TOKEN & ACTIVE BREACH DECEPTION GRID
      ===================================================================== */}
      {activeMode === 'HONEY_GRID' && (
        <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div>
              <h4 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <span>
                  Zero-Trust Honey-Token &amp; Active Breach Deception Grid
                </span>
              </h4>
              <p className="text-xs text-zinc-500">
                Plant decoy Service Account `.json` keys, canary BigLake Parquet files &amp; honey-secrets that trigger instant VPC IP-ban + IAM quarantine the millisecond an attacker touches them.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={drillAttackerIp}
                onChange={(e) => setDrillAttackerIp(e.target.value)}
                placeholder="Drill Attacker IP (e.g. 198.51.100.247)"
                className="px-2.5 py-1.5 rounded-md bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-xs font-mono w-40"
              />
              <button
                type="button"
                disabled={busyAction === 'TRIGGER_HONEY_TRIPWIRE_TEST'}
                onClick={() =>
                  executeNexusAction('TRIGGER_HONEY_TRIPWIRE_TEST', {
                    attackerIp: drillAttackerIp,
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Run Live Tripwire Breach Drill</span>
              </button>
              <button
                type="button"
                disabled={busyAction === 'EXPORT_DECEPTION_FORENSICS_PACKAGE'}
                onClick={() =>
                  executeNexusAction('EXPORT_DECEPTION_FORENSICS_PACKAGE')
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold cursor-pointer"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Synthesize Canary Forensics &amp; BQ SQL</span>
              </button>
            </div>
          </div>

          {/* Zero-Trust Deception Forensics & BigQuery SQL Drawer */}
          {deceptionForensics && (
            <div className="p-4 rounded-xl border-2 border-indigo-500/40 bg-indigo-500/5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-mono font-extrabold">
                    ZERO-TRUST DECEPTION FORENSICS PACKAGE
                  </span>
                  <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    Armed Decoys: {deceptionForensics.armedTokensCount} · Tripped &amp; Quarantined:{' '}
                    {deceptionForensics.trippedTokensCount}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {typeof onOpenBigQuerySql === 'function' &&
                    deceptionForensics.canaryForensicsSql && (
                      <button
                        type="button"
                        onClick={() =>
                          onOpenBigQuerySql(
                            deceptionForensics.canaryForensicsSql,
                            'Honey-Token Canary Audit Forensics'
                          )
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold cursor-pointer"
                      >
                        <Database className="w-3.5 h-3.5" />
                        <span>Open Canary SQL in BigQuery Workbench</span>
                      </button>
                    )}
                  {typeof onRunInShell === 'function' &&
                    deceptionForensics.logSinkAlertCli && (
                      <button
                        type="button"
                        onClick={() =>
                          onRunInShell(deceptionForensics.logSinkAlertCli)
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold cursor-pointer"
                      >
                        <Terminal className="w-3.5 h-3.5" />
                        <span>$ Deploy Log Alert in Shell</span>
                      </button>
                    )}
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-[11px] font-mono">
                <pre className="max-h-40 overflow-auto p-2.5 rounded-lg bg-zinc-950 text-emerald-400 whitespace-pre-wrap">
                  {deceptionForensics.logSinkAlertCli}
                </pre>
                <pre className="max-h-40 overflow-auto p-2.5 rounded-lg bg-zinc-950 text-blue-300 whitespace-pre-wrap">
                  {deceptionForensics.canaryForensicsSql}
                </pre>
              </div>
            </div>
          )}

          {/* Plant a New Honey-Token Decoy */}
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                Honey-Token Decoy Type
              </label>
              <select
                value={newHoneyType}
                onChange={(e) => setNewHoneyType(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono"
              >
                <option value="SA_JSON_KEY">
                  Canary IAM Service Account .json Key
                </option>
                <option value="GCS_BIGLAKE_OBJECT">
                  Canary BigLake / GCS Parquet File
                </option>
                <option value="SECRET_MANAGER_DECOY">
                  Secret Manager Honey-Secret
                </option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                Custom Decoy Identifier (Optional)
              </label>
              <input
                type="text"
                value={newHoneyName}
                onChange={(e) => setNewHoneyName(e.target.value)}
                placeholder="e.g. sa-prod-treasury-canary@... or gs://.../payroll_2026_canary.parquet"
                className="w-full px-2.5 py-1.5 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono"
              />
            </div>
            <button
              type="button"
              disabled={busyAction === 'PLANT_HONEY_TOKEN'}
              onClick={async () => {
                await executeNexusAction('PLANT_HONEY_TOKEN', {
                  type: newHoneyType,
                  name: newHoneyName.trim() || undefined,
                });
                setNewHoneyName('');
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Plant Armed Honey-Token</span>
            </button>
          </div>

          {/* Active Honey-Tokens Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(data?.honeyGrid?.tokens || []).map((t) => {
              const tripped = t.status === 'TRIPPED_AND_QUARANTINED';
              return (
                <div
                  key={t.id}
                  className={`p-4 rounded-xl border-2 space-y-2 ${
                    tripped
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white dark:bg-zinc-800 font-mono text-[10px] font-bold">
                      {t.type}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${
                        tripped
                          ? 'bg-red-600 text-white'
                          : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {tripped ? 'TRIPPED & QUARANTINED' : 'ARMED TRIPWIRE'}
                    </span>
                  </div>
                  <div className="text-xs font-mono font-bold text-zinc-950 dark:text-zinc-100 break-all">
                    {t.name}
                  </div>
                  <div className="text-[11px] text-zinc-500">{t.location}</div>
                  {t.lastHitIp && (
                    <div className="p-2 rounded bg-red-500/15 border border-red-500/30 text-[11px] font-mono text-red-600 dark:text-red-300">
                      Blocked Attacker IP: <b>{t.lastHitIp}</b> ({t.hitsCount} hit)
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2 pt-1 text-[10px] font-mono">
                    <button
                      type="button"
                      onClick={() =>
                        executeNexusAction('TRIGGER_HONEY_TRIPWIRE_TEST', {
                          tokenId: t.id,
                          attackerIp: drillAttackerIp,
                        })
                      }
                      className="text-red-600 dark:text-red-400 font-bold hover:underline cursor-pointer"
                    >
                      Test Tripwire on This Token →
                    </button>
                    {typeof onSelectStudioTab === 'function' && (
                      <button
                        type="button"
                        onClick={() =>
                          onSelectStudioTab(
                            t.type === 'GCS_BIGLAKE_OBJECT'
                              ? 'CLOUD_STORAGE'
                              : 'SOVEREIGN_STUDIO'
                          )
                        }
                        className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                      >
                        Open Vault ↗
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Deception Tripwire Incident Log */}
          {(data?.honeyGrid?.events || []).length > 0 && (
            <div className="p-4 rounded-xl bg-red-500/10 dark:bg-red-950/30 border border-red-500/40 space-y-2">
              <div className="text-xs font-extrabold text-red-400">
                Automated Breach Deception &amp; Quarantine Execution Log
              </div>
              {data.honeyGrid.events.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3 rounded-lg bg-white dark:bg-zinc-950 border border-red-500/30 text-xs font-mono text-zinc-800 dark:text-zinc-200 space-y-1"
                >
                  <div className="flex items-center justify-between text-red-400 font-bold">
                    <span>
                      Tripwire Hit: {ev.tokenName} (Attacker IP: {ev.attackerIp})
                    </span>
                    <span>{new Date(ev.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-emerald-400">{ev.mitigationExecuted}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
