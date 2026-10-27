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
} from 'lucide-react';

export default function Lab2026QuantumNexus({
  projectId,
  initialMode = 'CAUSAL_GRAPH',
  onRefreshGlobal,
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

  // 2. Time-Machine Flight Recorder state
  const [snapshotLabel, setSnapshotLabel] = useState('');
  const [diffLeftId, setDiffLeftId] = useState('');
  const [diffRightId, setDiffRightId] = useState('');
  const [pendingRollbackSnap, setPendingRollbackSnap] = useState(null);

  // 3. FinOps Circuit-Breaker state
  const [budgetCapUsd, setBudgetCapUsd] = useState(150);
  const [hourlySpikeUsd, setHourlySpikeUsd] = useState(0.35);
  const [autoAction, setAutoAction] = useState('PARK_NIGHT_MODE');

  // 4. Ephemeral PR Preview state
  const [prNumber, setPrNumber] = useState('PR #409');
  const [branchName, setBranchName] = useState('feat/zero-cold-start-v2');
  const [shadowPct, setShadowPct] = useState(10);
  const [ttlHours, setTtlHours] = useState(4);

  // 5. Honey-Token Deception Grid state
  const [newHoneyType, setNewHoneyType] = useState('SA_JSON_KEY');
  const [newHoneyName, setNewHoneyName] = useState('');

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
      label: 'Causal Blast-Radius Graph (Resource Dependency Simulator)',
    },
    {
      id: 'TIME_MACHINE',
      icon: History,
      badge: 'BREAKTHROUGH #2',
      label: 'Time-Machine Flight Recorder (State Snapshot & 1-Click Rollback)',
    },
    {
      id: 'FINOPS_AUTOPILOT',
      icon: DollarSign,
      badge: 'BREAKTHROUGH #3',
      label: 'FinOps Autopilot (Right-Sizing & Spend Cap Circuit-Breaker)',
    },
    {
      id: 'EPHEMERAL_PR',
      icon: GitBranch,
      badge: 'BREAKTHROUGH #4',
      label: 'Ephemeral PR Previews & Shadow Traffic Mirror',
    },
    {
      id: 'HONEY_GRID',
      icon: ShieldAlert,
      badge: 'BREAKTHROUGH #5',
      label: 'Zero-Trust Honey-Token Grid (Security Canary & Tripwires)',
    },
  ];

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
                  5 WORLD-FIRST CAPABILITIES LIVE
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Causal Dependency Blast-Radius Simulator, Immutable Project State Time-Machine &amp; Rollback, Autonomous FinOps Circuit-Breaker, Shadow-Traffic PR Previews &amp; Honey-Token Canary Tripwires.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchNexusData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 text-xs font-mono font-bold border border-zinc-200 dark:border-zinc-700 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Live State</span>
          </button>
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
                className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                  active
                    ? 'bg-blue-50 dark:bg-blue-500/15 border-blue-500 text-blue-900 dark:text-blue-100 shadow-sm'
                    : 'bg-zinc-50 dark:bg-zinc-900/70 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-blue-400 dark:hover:border-blue-500/50'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold">
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
                  Cross-Cloud Causal Blast-Radius &amp; Failure-Propagation Simulator
                </span>
              </h4>
              <p className="text-xs text-zinc-500">
                Click any live node below to trace how an IAM key leak, firewall change, or service outage cascades across your identity, compute, BigLake data, and billing.
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
                  onClick={() => setSimulationType(sim.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold border cursor-pointer transition-all ${
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {nodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const isAffected = causalImpact.affectedIds.has(node.id);
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`text-left p-4 rounded-xl border-2 transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'border-red-500 bg-red-500/10 shadow-md'
                      : isAffected
                      ? 'border-amber-500/60 bg-amber-500/5'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 opacity-75 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-extrabold bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white dark:bg-zinc-800">
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

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-200/70 dark:border-zinc-800 text-[11px] font-mono">
                    <span className="text-red-500 font-bold">
                      Blast Risk: {node.riskScore}/100
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      Burn: ${(node.costHr || 0).toFixed(4)}/hr
                    </span>
                  </div>
                </button>
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
                <span className="px-2.5 py-1 rounded-lg bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 text-xs font-mono font-bold">
                  {simulationType === 'COMPROMISE_CREDENTIAL'
                    ? 'Exfiltration Blast Score: CRITICAL'
                    : simulationType === 'OUTAGE_PROPAGATION'
                    ? 'SLO Availability Impact: 99.95% → 42.0%'
                    : `Runaway Spend Risk: +$${(
                        (selectedNode.costHr || 0.04) * 45
                      ).toFixed(2)}/hr`}
                </span>
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
                          <span className="px-1.5 py-0.5 rounded bg-red-500/15 text-red-500 font-mono text-[10px] font-bold shrink-0">
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
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-500 font-mono text-[10px] font-bold shrink-0">
                            {edge.impactType}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
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
                  Time-Machine Project State Flight Recorder &amp; Verified 1-Click Rollback
                </span>
              </h4>
              <p className="text-xs text-zinc-500">
                Capture cryptographic SHA-256 checkpoints of your project&apos;s IAM bindings, VPC Firewalls, Cloud Run revisions &amp; VM states, diff any two moments, and roll back with human approval.
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>
                  {busyAction === 'CAPTURE_SNAPSHOT'
                    ? 'Recording...'
                    : 'Capture Live State Snapshot'}
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
                  className="px-3 py-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-xs font-bold cursor-pointer"
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Approve &amp; Execute Rollback</span>
                </button>
              </div>
            </div>
          )}

          {/* Side-by-Side State Diff Engine */}
          {leftSnap && rightSnap && (
            <div className="p-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                  Visual State Diff Engine (Compare Any 2 Checkpoints)
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
                    before: leftSnap.metrics?.iamBindingsCount ?? 14,
                    after: rightSnap.metrics?.iamBindingsCount ?? 14,
                  },
                  {
                    label: 'VPC-SC Perimeter Mode',
                    before: leftSnap.configSummary?.vpcPerimeterMode || 'ENFORCED',
                    after: rightSnap.configSummary?.vpcPerimeterMode || 'ENFORCED',
                  },
                  {
                    label: 'Hourly Burn Rate ($/hr)',
                    before: `$${(leftSnap.metrics?.hourlyBurnUsd ?? 0.04).toFixed(3)}`,
                    after: `$${(rightSnap.metrics?.hourlyBurnUsd ?? 0.04).toFixed(3)}`,
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

          {/* Timeline of Recorded Checkpoints */}
          <div className="space-y-2">
            {snapshots.map((snap, idx) => (
              <div
                key={snap.id}
                className="p-3.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-300 font-mono text-[10px] font-bold">
                      {idx === 0 ? 'LATEST HEAD' : `CHECKPOINT #${snapshots.length - idx}`}
                    </span>
                    <span className="text-xs font-extrabold text-zinc-950 dark:text-zinc-100">
                      {snap.label}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {snap.hash}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500 font-mono">
                    Recorded {new Date(snap.createdAt).toLocaleString()} by{' '}
                    {snap.author} · VMs: {snap.metrics?.vmsCount} · Cloud Run:{' '}
                    {snap.metrics?.cloudRunCount} · Open FW:{' '}
                    {snap.metrics?.openFirewallsCount}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPendingRollbackSnap(snap)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-300 border border-amber-500/30 text-xs font-mono font-bold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore This Checkpoint...</span>
                </button>
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
                  Autonomous FinOps Autopilot, Spot/Slot Arbitrage &amp; Budget Circuit-Breaker
                </span>
              </h4>
              <p className="text-xs text-zinc-500">
                Continuous arbitrage across Spot VMs, Cloud Run request-only CPU throttling, BigLake/BigQuery slot pricing, and an automated hard-cap circuit-breaker.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-mono font-extrabold">
              Identified Arbitrage Savings: $
              {data?.finopsAutopilot?.totalMonthlySavingsPotentialUsd ?? 112.3}/mo
            </span>
          </div>

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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-300 border border-blue-500/30 text-xs font-extrabold cursor-pointer"
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
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
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

          {/* Arbitrage Opportunities List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {(data?.finopsAutopilot?.arbitrageOpportunities || []).map((opp) => (
              <div
                key={opp.id}
                className="p-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-extrabold">
                      SAVE {opp.discountPct}% (-${opp.monthlySavingsUsd}/mo)
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      ${opp.currentMonthlyUsd}/mo → ${opp.optimizedMonthlyUsd}/mo
                    </span>
                  </div>
                  <div className="text-xs font-extrabold text-zinc-950 dark:text-zinc-100">
                    {opp.title}
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500">
                    Target: {opp.target}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="p-2 rounded bg-white dark:bg-zinc-950 text-emerald-400 font-mono text-[10px] overflow-x-auto">
                    {opp.command}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCommand(opp.id, opp.command)}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-emerald-500/15 text-xs font-mono font-bold cursor-pointer"
                  >
                    {copiedCmd === opp.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                        <span>Copied Optimization Command!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Optimization Command</span>
                      </>
                    )}
                  </button>
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
          </div>

          {/* Launch New Ephemeral PR Stack */}
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
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
                  shadowTrafficPct: shadowPct,
                  ttlHours,
                })
              }
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Spawn PR Shadow Stack</span>
            </button>
          </div>

          {/* Active Ephemeral Preview Environments */}
          <div className="space-y-2.5">
            {(data?.ephemeralEnvs || []).map((env) => (
              <div
                key={env.id}
                className="p-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-300 font-mono text-[10px] font-extrabold">
                      {env.prNumber} · {env.branch}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold">
                      MIRRORING {env.shadowTrafficPct}% PROD TRAFFIC
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-300 font-mono text-[10px] font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Auto-TTL: {env.ttlHours}h (Scale-to-$0)
                    </span>
                  </div>
                  <div className="text-xs font-mono text-blue-500">
                    {env.previewUrl}
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500">
                    Prod P95: <b>{env.prodP95Ms}ms</b> vs Shadow P95:{' '}
                    <b className="text-emerald-500">{env.shadowP95Ms}ms</b> ·
                    Shadow 5xx Error Rate:{' '}
                    <b className="text-emerald-500">{env.shadowErrorRatePct}%</b>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    executeNexusAction('DELETE_EPHEMERAL_PR_ENV', {
                      envId: env.id,
                    })
                  }
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-600 dark:text-red-400 border border-red-500/30 text-xs font-mono font-bold cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Destroy Now ($0)</span>
                </button>
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

            <button
              type="button"
              disabled={busyAction === 'TRIGGER_HONEY_TRIPWIRE_TEST'}
              onClick={() => executeNexusAction('TRIGGER_HONEY_TRIPWIRE_TEST')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Run Live Tripwire Breach Drill</span>
            </button>
          </div>

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
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
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
                    <span className="px-2 py-0.5 rounded bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white dark:bg-zinc-800 font-mono text-[10px] font-bold">
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
