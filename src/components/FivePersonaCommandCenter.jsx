import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  ShieldCheck,
  Layers,
  Database,
  Globe,
  Terminal,
  RefreshCw,
  Play,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Lock,
  GitBranch,
  FileCode,
  Workflow,
  ArrowRight,
  Key,
  Activity,
} from 'lucide-react';

const PERSONA_TABS = [
  {
    id: 'ARCHITECT',
    code: '01',
    role: 'Cloud Architect',
    subtitle: 'Org Policies · Region Blackout SPOF Drill · C4 & Terraform',
    badge: 'WELL-ARCHITECTED',
    ownerStudioTab: 'INNOVATION_LAB',
    ownerSubTab: 'TOPOLOGY',
    ownerLabel: '3D Topology & DR Studio',
  },
  {
    id: 'CLOUD_ENGINEER',
    code: '02',
    role: 'Cloud Engineer',
    subtitle: 'ClickOps-to-GitOps .tf Exporter · Preflight Gate · Undo Saga',
    badge: 'GITOPS & SRE',
    ownerStudioTab: 'INNOVATION_LAB',
    ownerSubTab: 'GCLOUD_ALPHA_BETA',
    ownerLabel: 'SDK 590.0.1 & GitOps Lab',
  },
  {
    id: 'DATA_ENGINEER',
    code: '03',
    role: 'Data Engineer',
    subtitle: 'Column Lineage AST DAG · Quarantine DLQ Replay · Chargeback',
    badge: 'LAKEHOUSE MESH',
    ownerStudioTab: 'DATA_ENGINEER_STUDIO',
    ownerSubTab: 'MEDALLION_ELT',
    ownerLabel: 'Data Engineering Studio',
  },
  {
    id: 'NETWORK_ENGINEER',
    code: '04',
    role: 'Network Engineer',
    subtitle: '4-Hop Packet Tracer · IPAM CIDR Collision Map · FW Surgeon',
    badge: 'NETOPS & NIC',
    ownerStudioTab: 'VPC_FIREWALL',
    ownerSubTab: null,
    ownerLabel: 'VPC & Firewall Studio',
  },
  {
    id: 'DEVSECOPS',
    code: '05',
    role: 'DevSecOps Lead',
    subtitle: 'Binary Authz @sha256 · Multi-Hop IAM Escalation · Zero-Key OIDC',
    badge: 'ZERO-TRUST SEC',
    ownerStudioTab: 'CLOUD_SOC',
    ownerSubTab: null,
    ownerLabel: 'Autonomous Cloud SOC',
  },
];

export default function FivePersonaCommandCenter({
  projectId,
  initialPersona = 'ARCHITECT',
  onNavigateTab,
  onOpenBigQuerySql,
  onRunInShell,
  onOpenHealthAndDrift,
  onOpenTimeMachine,
  onShowToast,
  onShowError,
}) {
  const [activePersona, setActivePersona] = useState(initialPersona);
  const [region, setRegion] = useState('us-central1');
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState('');
  const [copiedKey, setCopiedKey] = useState('');
  const [overview, setOverview] = useState(null);
  const [lastReceipt, setLastReceipt] = useState(null);

  // Network Engineer interactive Connectivity Trace inputs
  const [traceSource, setTraceSource] = useState(
    'Cloud Run v2 Service (us-central1)'
  );
  const [traceDest, setTraceDest] = useState(
    '10.128.0.10:5432 (AlloyDB / Cloud SQL Private IP)'
  );
  const [traceProtocol, setTraceProtocol] = useState('TCP');
  const [tracePort, setTracePort] = useState(5432);

  // DevSecOps OIDC pool input
  const [wifPoolId, setWifPoolId] = useState('github-actions-zero-key-pool');

  useEffect(() => {
    if (initialPersona) {
      setActivePersona(initialPersona);
    }
  }, [initialPersona]);

  const copyText = (text, key) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    onShowToast?.(`Copied ${key} to clipboard`);
    setTimeout(() => setCopiedKey(''), 1800);
  };

  const fetchPersonaOverview = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(
          projectId
        )}/enterprise-personas/overview?region=${encodeURIComponent(region)}`
      );
      setOverview(res.data);
    } catch (err) {
      onShowError?.(
        err.response?.data?.error ||
          err.message ||
          'Failed to load 5-Persona Enterprise Readiness data.'
      );
    } finally {
      setLoading(false);
    }
  }, [projectId, region, onShowError]);

  useEffect(() => {
    fetchPersonaOverview();
  }, [fetchPersonaOverview]);

  const runPersonaAction = async (action, extraPayload = {}) => {
    if (!projectId) return;
    setBusyAction(action);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/enterprise-personas/action`,
        {
          action,
          region,
          ...extraPayload,
        }
      );
      setLastReceipt(res.data);
      if (res.data?.summary) {
        onShowToast?.(res.data.summary);
      }
      await fetchPersonaOverview();
    } catch (err) {
      if (!err?.__cancelledByUser) {
        onShowError?.(
          err.response?.data?.error ||
            err.message ||
            `Failed to execute ${action}`
        );
      }
    } finally {
      setBusyAction('');
    }
  };

  const arch = overview?.architect || {};
  const ceng = overview?.cloudEngineer || {};
  const deng = overview?.dataEngineer || {};
  const net = overview?.networkEngineer || {};
  const sec = overview?.devSecOps || {};
  const activeTabMeta =
    PERSONA_TABS.find((t) => t.id === activePersona) || PERSONA_TABS[0];

  return (
    <div className="space-y-5">
      {/* Top Executive Header Banner */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#202124] p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[10px] font-mono font-extrabold uppercase tracking-wider">
                5-PERSONA ENTERPRISE ARCHITECTURE BOARD &amp; PRE-FLIGHT WAR-ROOM
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                100% LIVE CONTROL-PLANE TELEMETRY · SDK {overview?.sdkVersion || '590.0.1 (2026.10.22)'}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-zinc-950 dark:text-zinc-50">
              Cloud Architect · Cloud Engineer · Data Engineer · Network Engineer · DevSecOps Lead
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Every specialist lens below answers the exact production sign-off questions demanded by enterprise engineering boards: <strong>Region Blackout SPOF Drills &amp; Org Policies</strong>, <strong>ClickOps-to-GitOps `.tf` Import &amp; Undo Sagas</strong>, <strong>Column-Level Lineage &amp; Quarantine DLQ Replay</strong>, <strong>4-Hop Packet Reachability &amp; IPAM CIDR Collision Maps</strong>, and <strong>Binary Authorization `@sha256` + Multi-Hop IAM Escalation + Zero-Key OIDC</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100"
            >
              <option value="us-central1">us-central1 (Iowa)</option>
              <option value="us-east1">us-east1 (S. Carolina)</option>
              <option value="europe-west1">europe-west1 (Belgium)</option>
              <option value="asia-east1">asia-east1 (Taiwan)</option>
            </select>
            <button
              type="button"
              onClick={fetchPersonaOverview}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-mono font-extrabold cursor-pointer transition-colors"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
              />
              <span>{loading ? 'Probing 5 Lenses...' : 'Sync All 5 Lenses'}</span>
            </button>
          </div>
        </div>

        {/* 5-Persona Role Switcher Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          {PERSONA_TABS.map((p) => {
            const isActive = activePersona === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActivePersona(p.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-zinc-50 dark:bg-zinc-900/90 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold ${
                      isActive
                        ? 'bg-black/25 text-white'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {p.code}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-extrabold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {p.badge}
                  </span>
                </div>
                <div className="text-xs font-mono font-extrabold truncate">
                  {p.role}
                </div>
                <div
                  className={`text-[10px] font-mono line-clamp-2 ${
                    isActive ? 'text-blue-100' : 'text-zinc-500'
                  }`}
                >
                  {p.subtitle}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Persona Owning-Studio Cross-Bridge Bar */}
        <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] font-mono text-zinc-600 dark:text-zinc-300">
            Active Specialist Lens:{' '}
            <strong className="text-blue-600 dark:text-blue-400">
              [{activeTabMeta.code}] {activeTabMeta.role}
            </strong>{' '}
            · Companion Studio: <strong>{activeTabMeta.ownerLabel}</strong>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {onNavigateTab && (
              <button
                type="button"
                onClick={() =>
                  onNavigateTab(
                    activeTabMeta.ownerStudioTab,
                    activeTabMeta.ownerSubTab
                  )
                }
                className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-extrabold bg-blue-500/15 hover:bg-blue-500/25 text-blue-700 dark:text-blue-300 border border-blue-500/30 cursor-pointer"
              >
                Open {activeTabMeta.ownerLabel} →
              </button>
            )}
            {onNavigateTab && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    onNavigateTab('DATA_ENGINEER_STUDIO', 'ICEBERG_50_MATRIX')
                  }
                  className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-extrabold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 cursor-pointer"
                >
                  50 Iceberg Playbooks →
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('SRE_WAR_ROOM')}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-extrabold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 cursor-pointer"
                >
                  SRE War-Room →
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('CLOUD_SOC')}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-extrabold bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 cursor-pointer"
                >
                  Cloud SOC →
                </button>
              </>
            )}
            {onOpenTimeMachine && (
              <button
                type="button"
                onClick={onOpenTimeMachine}
                className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-extrabold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 cursor-pointer"
              >
                SHA-256 Time-Machine
              </button>
            )}
            {onOpenHealthAndDrift && (
              <button
                type="button"
                onClick={onOpenHealthAndDrift}
                className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
              >
                1-Tap Health &amp; Drift Hub
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Live Execution Receipt Banner */}
      {lastReceipt && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 space-y-2 text-xs font-mono">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
              [{lastReceipt.persona}] LIVE ACTION RECEIPT · {lastReceipt.action}
            </span>
            <button
              type="button"
              onClick={() => setLastReceipt(null)}
              className="text-[10px] text-zinc-500 hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
          <div className="text-zinc-800 dark:text-zinc-200">
            {lastReceipt.summary}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* LENS 01: CLOUD ARCHITECT (Org Policies, Region Blackout SPOF & C4)  */}
      {/* =================================================================== */}
      {activePersona === 'ARCHITECT' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left 7 Cols: Multi-Region Blackout SPOF Simulator */}
          <div className="lg:col-span-7 bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-500" />
                  <span>
                    Multi-Region Blackout Simulator &amp; Single-Point-of-Failure (SPOF) Ledger (`{region}`)
                  </span>
                </h3>
                <p className="text-xs text-zinc-500">
                  Evaluates every live Cloud Run service, Cloud SQL instance, and GCS bucket if `{region}` goes dark—computing RTO, RPO, and 1-tap multi-region promotion commands.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  runPersonaAction('RUN_ARCHITECT_SPOF_BLACKOUT_DRILL')
                }
                disabled={busyAction === 'RUN_ARCHITECT_SPOF_BLACKOUT_DRILL'}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-mono font-extrabold cursor-pointer disabled:opacity-50"
              >
                {busyAction === 'RUN_ARCHITECT_SPOF_BLACKOUT_DRILL'
                  ? `Simulating ${region} Blackout...`
                  : `Run Live "${region}" Blackout Drill`}
              </button>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto">
              {(arch.spofMatrix || []).map((item, idx) => {
                const isRisk =
                  item.spofRisk.includes('SPOF') ||
                  item.spofRisk.includes('AT_RISK');
                return (
                  <div
                    key={`${item.name}-${idx}`}
                    className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5 text-xs font-mono"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-extrabold text-zinc-900 dark:text-white">
                        {item.resourceType} · {item.name} ({item.location})
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isRisk
                            ? 'bg-red-500/15 text-red-500 border border-red-500/30'
                            : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                        }`}
                      >
                        {item.spofRisk}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      Tier: <strong>{item.resiliencyTier}</strong> · Est. RTO:{' '}
                      <strong>{item.rtoEstimate}</strong> · Est. RPO:{' '}
                      <strong>{item.rpoEstimate}</strong>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-200 dark:border-zinc-800">
                      <code className="text-[10px] text-blue-600 dark:text-blue-400 truncate max-w-md">
                        {item.failoverCmd}
                      </code>
                      <div className="flex items-center gap-1.5">
                        {onRunInShell && (
                          <button
                            type="button"
                            onClick={() => onRunInShell(item.failoverCmd)}
                            className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold cursor-pointer"
                          >
                            Promote in Shell
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            copyText(item.failoverCmd, `spof_${idx}`)
                          }
                          className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-[10px] cursor-pointer"
                        >
                          {copiedKey === `spof_${idx}` ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 5 Cols: Org Policies & C4 Mermaid Architecture */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-3 shadow-sm">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                  Organization Policy &amp; Sovereign Residency Scorecard (`orgpolicy.googleapis.com`)
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Verifies live Landing-Zone guardrails across identity, external IPs, and regional data residency.
                </p>
              </div>
              <div className="space-y-2">
                {(arch.canonicalConstraints || []).map((c) => (
                  <div
                    key={c.constraint}
                    className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 text-xs font-mono"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-zinc-900 dark:text-white truncate">
                        {c.title}
                      </div>
                      <div className="text-[10px] text-blue-500 truncate">
                        {c.constraint} · Recommended: {c.recommended}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 shrink-0">
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-extrabold text-zinc-900 dark:text-white">
                  Live C4 Mermaid Architecture Diagram (Reverse-Compiled)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyText(arch.mermaidC4Diagram || '', 'C4_MERMAID')
                  }
                  className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[10px] font-mono font-bold cursor-pointer"
                >
                  {copiedKey === 'C4_MERMAID' ? 'Copied C4' : 'Copy Mermaid'}
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-zinc-950 text-emerald-400 text-[10.5px] font-mono overflow-x-auto max-h-48">
                {arch.mermaidC4Diagram}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* LENS 02: CLOUD ENGINEER (ClickOps-to-GitOps .tf, Preflight & Undo)  */}
      {/* =================================================================== */}
      {activePersona === 'CLOUD_ENGINEER' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left 7 Cols: ClickOps-to-GitOps Terraform + Import Bundle */}
          <div className="lg:col-span-7 bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-emerald-500" />
                  <span>
                    &ldquo;ClickOps-to-GitOps&rdquo; Live Terraform 1.8+ `import` &amp; HCL Exporter
                  </span>
                </h3>
                <p className="text-xs text-zinc-500">
                  Reverse-compiles live Cloud Run v2 services and BigQuery datasets in `{projectId}` into declarative Terraform `import {}` blocks so ClickOps and GitOps never drift.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    copyText(ceng.terraformExportHcl || '', 'TF_EXPORT')
                  }
                  className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-mono font-bold cursor-pointer"
                >
                  {copiedKey === 'TF_EXPORT' ? 'Copied .tf' : 'Copy main.tf'}
                </button>
                {onRunInShell && ceng.bulkExportCli && (
                  <button
                    type="button"
                    onClick={() => onRunInShell(ceng.bulkExportCli)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-extrabold cursor-pointer"
                  >
                    Run bulk-export in Shell
                  </button>
                )}
              </div>
            </div>

            <pre className="p-3.5 rounded-xl bg-zinc-950 text-cyan-300 text-[11px] font-mono overflow-x-auto max-h-[380px] leading-relaxed">
              {ceng.terraformExportHcl}
            </pre>
          </div>

          {/* Right 5 Cols: Pre-Flight Validator & Compensating Undo Ledger */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
                <div>
                  <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                    Pre-Deployment Quota &amp; IAM Gatekeeper
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Verifies IAM permissions (`testIamPermissions`), Quotas (`cloudquotas`), and 39 GitOps schemas before any deploy.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    runPersonaAction('RUN_CLOUD_ENG_PREFLIGHT_VALIDATOR')
                  }
                  disabled={busyAction === 'RUN_CLOUD_ENG_PREFLIGHT_VALIDATOR'}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-extrabold cursor-pointer disabled:opacity-50"
                >
                  {busyAction === 'RUN_CLOUD_ENG_PREFLIGHT_VALIDATOR'
                    ? 'Checking...'
                    : 'Run Preflight Check'}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(ceng.grantedPermissions || []).map((perm) => (
                  <span
                    key={perm}
                    className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold"
                  >
                    ✓ {perm}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-3 shadow-sm">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                  Transactional Saga &amp; 1-Click Compensating Undo Ledger
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Instant compensating rollback commands for live Cloud Run revisions and BigQuery datasets.
                </p>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {(ceng.compensatingUndoLedger || []).map((u) => (
                  <div
                    key={u.id}
                    className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-900 dark:text-white">
                        {u.resource}
                      </span>
                      <span className="text-[10px] text-amber-500">
                        {u.lastMutation}
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      {u.compensatingAction}
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <code className="text-[10px] text-emerald-600 dark:text-emerald-400 truncate max-w-xs">
                        {u.undoCli}
                      </code>
                      <div className="flex items-center gap-1">
                        {onRunInShell && (
                          <button
                            type="button"
                            onClick={() => onRunInShell(u.undoCli)}
                            className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold cursor-pointer"
                          >
                            Execute Undo
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => copyText(u.undoCli, u.id)}
                          className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-[10px] cursor-pointer"
                        >
                          {copiedKey === u.id ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* LENS 03: DATA ENGINEER (Column Lineage DAG, Quarantine DLQ, FinOps) */}
      {/* =================================================================== */}
      {activePersona === 'DATA_ENGINEER' && (
        <div className="space-y-5">
          {/* Top Card: End-to-End Column-Level Lineage AST DAG */}
          <div className="bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Workflow className="w-4 h-4 text-blue-500" />
                  <span>
                    End-to-End Column-Level Lineage AST DAG (`Source OLTP/GCS ➔ Bronze ➔ Silver SQLX ➔ Gold Mart ➔ BI / Vertex RAG`)
                  </span>
                </h3>
                <p className="text-xs text-zinc-500">
                  Traces every column transformation (`QUALIFY ROW_NUMBER()`, `SHA256` PII masking, `ROUND_HALF_EVEN`) and highlights downstream BI &amp; ML feature consumers before schema changes.
                </p>
              </div>
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() =>
                    onNavigateTab('DATA_ENGINEER_STUDIO', 'SCHEMA_CONTRACTS')
                  }
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-extrabold cursor-pointer"
                >
                  Open Schema Contract Firewall →
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {(deng.columnLineageDag || []).map((col) => (
                <div
                  key={col.columnId}
                  className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs font-mono"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-extrabold text-zinc-900 dark:text-white">
                      {col.sourceSystem}: <code className="text-amber-500">{col.sourceColumn}</code>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-500 text-[10px] font-bold">
                        {col.piiClassification}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-500 text-[10px] font-bold">
                        {col.breakingChangeRisk}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/25">
                      Bronze: {col.bronzeColumn}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/25">
                      Silver SQL: {col.silverTransform}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/25">
                      Gold: {col.goldMartColumn}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    Protected Downstream Consumers:{' '}
                    <strong className="text-zinc-800 dark:text-zinc-200">
                      {(col.downstreamConsumers || []).join(' · ')}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Grid: Bad-Record Quarantine DLQ Vault + Query FinOps Chargeback */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 6 Cols: Quarantine DLQ Vault */}
            <div className="lg:col-span-6 bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                    Bad-Record Quarantine DLQ Vault (`_quarantine_dlq`) &amp; 1-Click Replay
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Inspects malformed rows caught by `SAFE_CAST` or `QUALIFY ROW_NUMBER() &gt; 1` and replays them with auto-synthesized SQL healing rules.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    runPersonaAction('REPLAY_DATA_ENG_QUARANTINE_DLQ')
                  }
                  disabled={busyAction === 'REPLAY_DATA_ENG_QUARANTINE_DLQ'}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-extrabold cursor-pointer disabled:opacity-50"
                >
                  {busyAction === 'REPLAY_DATA_ENG_QUARANTINE_DLQ'
                    ? 'Replaying on BigQuery...'
                    : '1-Click Heal & Replay DLQ on BigQuery'}
                </button>
              </div>

              <div className="space-y-2.5">
                {(deng.quarantineDlqRecords || []).map((rec) => (
                  <div
                    key={rec.quarantineId}
                    className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-500">
                        {rec.quarantineId} · Column `{rec.failedColumn}`
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {rec.sourceTable}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-700 dark:text-zinc-300">
                      Raw Payload: <code>{rec.rawValue}</code>
                    </div>
                    <div className="text-[10px] text-amber-500">
                      Reason: {rec.failureReason}
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-200 dark:border-zinc-800">
                      <code className="text-[10px] text-emerald-500 truncate max-w-xs">
                        {rec.autoHealSqlExpression}
                      </code>
                      {onOpenBigQuerySql && (
                        <button
                          type="button"
                          onClick={() =>
                            onOpenBigQuerySql(
                              `-- Quarantine DLQ Self-Healing Replay (${rec.quarantineId})\nSELECT\n  ${rec.autoHealSqlExpression} AS healed_${rec.failedColumn}\nFROM \`${rec.sourceTable}\`\nLIMIT 50;`
                            )
                          }
                          className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30 text-[10px] font-bold cursor-pointer shrink-0"
                        >
                          Open Heal SQL in BQ →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 6 Cols: BigQuery FinOps Chargeback & Materialized View Rewriter */}
            <div className="lg:col-span-6 bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4 shadow-sm">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                  BigQuery FinOps Chargeback by Team &amp; 1-Click Materialized View Accelerator
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Attributes live BigQuery job bytes &amp; slot-ms to engineering teams and synthesizes `CREATE MATERIALIZED VIEW` rewrites (-90% recurring scan cost).
                </p>
              </div>
              <div className="space-y-2.5 max-h-80 overflow-y-auto">
                {(deng.queryChargeback || []).map((q) => (
                  <div
                    key={q.jobId}
                    className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-zinc-900 dark:text-white">
                        Team: <span className="text-blue-500">{q.teamLabel}</span> · {q.statementType}
                      </span>
                      <span className="text-[10px] text-emerald-500 font-bold">
                        {q.bytesBilled} B · {q.slotMs} slot-ms (${q.estCostUsd})
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate">
                      {q.sqlSnippet}
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-zinc-200 dark:border-zinc-800">
                      <span className="text-[10px] text-zinc-400">
                        Principal: {q.userEmail}
                      </span>
                      {onOpenBigQuerySql && (
                        <button
                          type="button"
                          onClick={() =>
                            onOpenBigQuerySql(q.materializedViewRewrite)
                          }
                          className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold cursor-pointer"
                        >
                          Create Materialized View (-90%) →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* LENS 04: NETWORK ENGINEER (4-Hop Packet Tracer, IPAM CIDR & FW)     */}
      {/* =================================================================== */}
      {activePersona === 'NETWORK_ENGINEER' && (
        <div className="space-y-5">
          {/* Top Card: Interactive 4-Hop Packet Reachability Tracer */}
          <div className="bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <span>
                    Live 4-Hop Packet Reachability Tracer (`networkmanagement.googleapis.com` + VPC Route &amp; Firewall Evaluator)
                  </span>
                </h3>
                <p className="text-xs text-zinc-500">
                  Traces packet flow across Source Egress, VPC Routing Table, Ingress/Egress Firewall Rules, and Destination Endpoints.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  runPersonaAction('RUN_NETOPS_CONNECTIVITY_TRACE', {
                    sourceEndpoint: traceSource,
                    destinationEndpoint: traceDest,
                    protocol: traceProtocol,
                    port: Number(tracePort || 443),
                  })
                }
                disabled={busyAction === 'RUN_NETOPS_CONNECTIVITY_TRACE'}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-extrabold cursor-pointer disabled:opacity-50"
              >
                {busyAction === 'RUN_NETOPS_CONNECTIVITY_TRACE'
                  ? 'Tracing Packet Path...'
                  : 'Run 4-Hop Connectivity Trace'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                  Source Workload / IP
                </label>
                <input
                  type="text"
                  value={traceSource}
                  onChange={(e) => setTraceSource(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                  Destination IP / Service
                </label>
                <input
                  type="text"
                  value={traceDest}
                  onChange={(e) => setTraceDest(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                  Protocol
                </label>
                <select
                  value={traceProtocol}
                  onChange={(e) => setTraceProtocol(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono"
                >
                  <option value="TCP">TCP</option>
                  <option value="UDP">UDP</option>
                  <option value="ICMP">ICMP</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                  Destination Port
                </label>
                <input
                  type="number"
                  value={tracePort}
                  onChange={(e) => setTracePort(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono"
                />
              </div>
            </div>

            {lastReceipt?.traceReceipt?.hops && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2">
                {lastReceipt.traceReceipt.hops.map((h) => (
                  <div
                    key={h.hop}
                    className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-emerald-500/40 space-y-1 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-blue-500">
                        HOP {h.hop} · {h.stage}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 text-[9px] font-bold">
                        {h.status}
                      </span>
                    </div>
                    <div className="font-extrabold text-zinc-900 dark:text-white truncate">
                      {h.node}
                    </div>
                    <div className="text-[10px] text-zinc-500">{h.detail}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Grid: IPAM CIDR Collision Map + Firewall Exposure Surgeon */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-6 bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-3 shadow-sm">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                  Live IPAM Subnet CIDR Allocation &amp; Peering Collision Map ({net.subnetsCount || 0} Subnets)
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Audits regional subnets for overlapping RFC1918 ranges and Private Google Access (`privateIpGoogleAccess`).
                </p>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {(net.ipamCidrMap || []).map((sn, i) => (
                  <div
                    key={`${sn.name}-${sn.region}-${i}`}
                    className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 text-xs font-mono"
                  >
                    <div>
                      <div className="font-bold text-zinc-900 dark:text-white">
                        {sn.network} / {sn.name} ({sn.region})
                      </div>
                      <div className="text-[10px] text-blue-500">
                        CIDR: <strong>{sn.ipCidrRange}</strong> · PGA:{' '}
                        {sn.privateIpGoogleAccess ? 'ENABLED' : 'OFF'}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 text-[9px] font-bold">
                      {sn.collisionStatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6 bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-3 shadow-sm">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                  Firewall `0.0.0.0/0` Exposure &amp; Zero-Trust Micro-Segmentation Surgeon
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Flags permissive ingress rules and generates Cloud IAP (`35.235.240.0/20`) zero-trust replacements.
                </p>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {(net.firewallSurgeonFindings || []).map((fw) => (
                  <div
                    key={fw.name}
                    className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-900 dark:text-white">
                        {fw.name} ({fw.network})
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          fw.riskLevel === 'CRITICAL_WORLD_OPEN'
                            ? 'bg-red-500/15 text-red-500 border border-red-500/30'
                            : fw.riskLevel === 'PUBLIC_INGRESS'
                            ? 'bg-amber-500/15 text-amber-500'
                            : 'bg-emerald-500/15 text-emerald-500'
                        }`}
                      >
                        {fw.riskLevel}
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      Sources: {(fw.sourceRanges || []).join(', ') || 'internal'} · Allowed: {fw.allowedPorts}
                    </div>
                    {fw.riskLevel !== 'ZERO_TRUST_SCOPED' && (
                      <div className="flex items-center justify-between pt-1">
                        <code className="text-[10px] text-blue-500 truncate max-w-xs">
                          {fw.zeroTrustRewriteCli}
                        </code>
                        {onRunInShell && (
                          <button
                            type="button"
                            onClick={() =>
                              onRunInShell(fw.zeroTrustRewriteCli)
                            }
                            className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold cursor-pointer"
                          >
                            Lock to IAP
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* LENS 05: DEVSECOPS LEAD (BinAuthz @sha256, IAM Escalation & OIDC)   */}
      {/* =================================================================== */}
      {activePersona === 'DEVSECOPS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left 6 Cols: Multi-Hop IAM Privilege Escalation Graph */}
          <div className="lg:col-span-6 bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-rose-500" />
                  <span>
                    Multi-Hop IAM Privilege Escalation Path Finder (`getIamPolicy`)
                  </span>
                </h3>
                <p className="text-xs text-zinc-500">
                  Detects `serviceAccountTokenCreator`, `actAs`, and high-privilege escalation chains across `{projectId}`.
                </p>
              </div>
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() =>
                    onNavigateTab('SOVEREIGN_STUDIO', 'IAM_SURGEON')
                  }
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-extrabold cursor-pointer"
                >
                  Open IAM Surgeon →
                </button>
              )}
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto">
              {(sec.escalationChains || []).map((ch, idx) => (
                <div
                  key={`${ch.principal}-${ch.role}-${idx}`}
                  className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5 text-xs font-mono"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-zinc-900 dark:text-white truncate">
                      {ch.principal}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        ch.severity === 'CRITICAL'
                          ? 'bg-red-500/15 text-red-500 border border-red-500/30'
                          : 'bg-amber-500/15 text-amber-500'
                      }`}
                    >
                      {ch.severity}
                    </span>
                  </div>
                  <div className="text-[10px] text-rose-500 font-bold">
                    {ch.escalationVector}
                  </div>
                  <div className="text-[10px] text-zinc-500">{ch.hopChain}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right 6 Cols: Binary Authorization @sha256 Gatekeeper & Zero-Key OIDC */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-3 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
                <div>
                  <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                    Binary Authorization &amp; `@sha256` Container Digest Gatekeeper
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Policy Mode: <strong>{sec.binAuthzEnforcementMode}</strong> · Active OIDC Pools: <strong>{sec.wifPoolsCount || 0}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    runPersonaAction('VERIFY_DEVSECOPS_SUPPLY_CHAIN_AND_OIDC', {
                      wifPoolId,
                    })
                  }
                  disabled={
                    busyAction === 'VERIFY_DEVSECOPS_SUPPLY_CHAIN_AND_OIDC'
                  }
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-extrabold cursor-pointer disabled:opacity-50"
                >
                  {busyAction === 'VERIFY_DEVSECOPS_SUPPLY_CHAIN_AND_OIDC'
                    ? 'Auditing...'
                    : 'Verify BinAuthz & OIDC Live'}
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(sec.containerSupplyChain || []).map((c) => (
                  <div
                    key={`${c.serviceName}-${c.region}`}
                    className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 text-xs font-mono"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-zinc-900 dark:text-white">
                        {c.serviceName} ({c.region})
                      </div>
                      <div className="text-[10px] text-zinc-500 truncate max-w-xs">
                        {c.imageUri}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                        c.digestPinned
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : 'bg-amber-500/15 text-amber-500'
                      }`}
                    >
                      {c.slsaStatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-extrabold text-zinc-900 dark:text-white">
                  Zero-Key OIDC Workload Identity Federation Generator (`gcloud iam workload-identity-pools`)
                </span>
                <div className="flex items-center gap-1.5">
                  {onRunInShell && sec.oidcWorkloadIdentityBlueprint && (
                    <button
                      type="button"
                      onClick={() =>
                        onRunInShell(sec.oidcWorkloadIdentityBlueprint)
                      }
                      className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-mono font-bold cursor-pointer"
                    >
                      Run in Cloud Shell
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      copyText(
                        sec.oidcWorkloadIdentityBlueprint || '',
                        'OIDC_WIF'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[10px] font-mono font-bold cursor-pointer"
                  >
                    {copiedKey === 'OIDC_WIF' ? 'Copied' : 'Copy OIDC CLI'}
                  </button>
                </div>
              </div>
              <pre className="p-3 rounded-xl bg-zinc-950 text-emerald-400 text-[10.5px] font-mono overflow-x-auto max-h-44">
                {sec.oidcWorkloadIdentityBlueprint}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
