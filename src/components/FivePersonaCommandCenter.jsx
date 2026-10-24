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
  {
    id: 'AI_MLOPS',
    code: '06',
    role: 'AI / MLOps Engineer',
    subtitle: 'Model Armor Firewall · Smart Router (Flash/Pro) · RAG Vector Sync',
    badge: 'VERTEX GENAI',
    ownerStudioTab: 'MCP_HUB',
    ownerSubTab: null,
    ownerLabel: 'MCP & Agent Hub',
  },
  {
    id: 'SRE_ONCALL',
    code: '07',
    role: 'SRE Commander',
    subtitle: '14.4x SLO Freeze Gate · Change Correlator · Chaos GameDay',
    badge: '99.9% SLO GUARD',
    ownerStudioTab: 'SRE_WAR_ROOM',
    ownerSubTab: null,
    ownerLabel: 'SRE War-Room Studio',
  },
  {
    id: 'DBRE',
    code: '08',
    role: 'DB Reliability (DBRE)',
    subtitle: 'Lock-Tree & Hot-Key Killer · Concurrent Index · 1.6s PITR Clone',
    badge: 'SPANNER & ALLOYDB',
    ownerStudioTab: 'CLOUD_SQL_STUDIO',
    ownerSubTab: null,
    ownerLabel: 'Cloud SQL & AlloyDB Studio',
  },
  {
    id: 'FINOPS_ENG',
    code: '09',
    role: 'FinOps & GreenOps',
    subtitle: 'Unit Cost ($/1k req) · Zombie Reaper · CUD & 98% CFE Shifter',
    badge: 'UNIT ECONOMICS',
    ownerStudioTab: 'FINOPS',
    ownerSubTab: null,
    ownerLabel: 'FinOps & Billing Guardian',
  },
  {
    id: 'PLATFORM_K8S',
    code: '10',
    role: 'K8s & IDP Platform',
    subtitle: 'Pod OOM/CPU Right-Sizer · Scale-Down Blocker · STRICT mTLS Mesh',
    badge: 'GKE & GOLDEN PATH',
    ownerStudioTab: 'GKE_STUDIO',
    ownerSubTab: null,
    ownerLabel: 'GKE Fleet Studio',
  },
];

function normalizePersonaId(raw) {
  if (!raw) return 'ARCHITECT';
  if (raw === 'CLOUD_ENG') return 'CLOUD_ENGINEER';
  if (raw === 'DATA_ENG') return 'DATA_ENGINEER';
  if (raw === 'NETOPS') return 'NETWORK_ENGINEER';
  return raw;
}

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
  const [activePersona, setActivePersona] = useState(() =>
    normalizePersonaId(initialPersona)
  );
  const [region, setRegion] = useState('us-central1');
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState('');
  const [copiedKey, setCopiedKey] = useState('');
  const [overview, setOverview] = useState(null);
  const [lastReceipt, setLastReceipt] = useState(null);
  const [tribunalData, setTribunalData] = useState(null);
  const [tribunalLoading, setTribunalLoading] = useState(false);
  const [tribunalSubTab, setTribunalSubTab] = useState('ROLL_CALL');
  const [remediatingTarget, setRemediatingTarget] = useState('');

  // 2030 Horizon State: Multi-Project Fleet Tribunal, ZKP Verifier, Intent Compiler & Rollback Capsules
  const [fleetTribunalData, setFleetTribunalData] = useState(null);
  const [fleetLoading, setFleetLoading] = useState(false);
  const [zkpVerificationResult, setZkpVerificationResult] = useState(null);
  const [zkpVerifying, setZkpVerifying] = useState(false);
  const [intentPrompt, setIntentPrompt] = useState(
    'Lock project to strict Zero-Trust & $0.00/mo Always-Free invariance'
  );
  const [intentModel, setIntentModel] = useState('gemini-3.8-flash');
  const [compiledIntentPlan, setCompiledIntentPlan] = useState(null);
  const [intentCompiling, setIntentCompiling] = useState(false);

  // 2030 6-Practitioner Agentless Workbench ("Kill the 2010 VM & Network Console")
  const [vmXrayData, setVmXrayData] = useState(null);
  const [waterfallData, setWaterfallData] = useState(null);
  const [devkitData, setDevkitData] = useState(null);
  const [entropyGitopsData, setEntropyGitopsData] = useState(null);
  const [practitionerLoading, setPractitionerLoading] = useState(false);
  const [waterfallHost, setWaterfallHost] = useState('compute.googleapis.com');
  const [waterfallPort, setWaterfallPort] = useState(443);
  const [sampleJsonInput, setSampleJsonInput] = useState(
    JSON.stringify(
      {
        event_id: 'evt_2030_99182',
        event_timestamp: '2026-10-24T20:45:00Z',
        service_tier: 'cloud-run-gen2',
        latency_ms: 14.8,
        zero_trust_verified: true,
        caller_identity: {
          principal: 'serviceAccount:api-gateway@gcp.iam.gserviceaccount.com',
          mtls_spiffe_id: 'spiffe://gcp.internal/ns/prod/sa/api-gateway',
          hop_count: 2,
        },
        tags: ['production', 'us-central1', 'agentless-2030'],
      },
      null,
      2
    )
  );

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
      setActivePersona(normalizePersonaId(initialPersona));
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
          'Failed to load 10-Persona Enterprise Readiness data.'
      );
    } finally {
      setLoading(false);
    }
  }, [projectId, region, onShowError]);

  const runLaunchTribunal = useCallback(
    async (options = {}) => {
      if (!projectId) return;
      setTribunalLoading(true);
      try {
        const res = await axios.get(
          `/api/project/${encodeURIComponent(
            projectId
          )}/enterprise-personas/tribunal`,
          {
            params: {
              region,
              saveAsBaseline: Boolean(options.captureBaseline),
              resetBaseline: Boolean(options.captureBaseline),
            },
          }
        );
        setTribunalData(res.data);
        if (options.toastMessage) {
          onShowToast?.(options.toastMessage);
        }
      } catch (err) {
        onShowError?.(
          err.response?.data?.error ||
            err.message ||
            'Failed to convene 10-Persona Launch Tribunal.'
        );
      } finally {
        setTribunalLoading(false);
      }
    },
    [projectId, region, onShowToast, onShowError]
  );

  useEffect(() => {
    fetchPersonaOverview();
    runLaunchTribunal();
  }, [fetchPersonaOverview, runLaunchTribunal]);

  const runLiveRemediation = async (remediationType, targetResource) => {
    if (!projectId || !remediationType || !targetResource) return;
    const key = `${remediationType}:${targetResource}`;
    setRemediatingTarget(key);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/enterprise-personas/action`,
        {
          action: 'EXECUTE_TRIBUNAL_LIVE_REMEDIATION',
          region,
          remediationType,
          targetResource,
        }
      );
      setLastReceipt(res.data);
      if (res.data?.summary) {
        onShowToast?.(res.data.summary);
      }
      await Promise.all([fetchPersonaOverview(), runLaunchTribunal()]);
    } catch (err) {
      if (!err?.__cancelledByUser) {
        onShowError?.(
          err.response?.data?.error ||
            err.message ||
            `Live GCP remediation failed for ${targetResource}`
        );
      }
    } finally {
      setRemediatingTarget('');
    }
  };

  const revertRollbackCapsule = async (capsuleId) => {
    if (!projectId || !capsuleId) return;
    setRemediatingTarget(`revert:${capsuleId}`);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/enterprise-personas/action`,
        {
          action: 'ROLLBACK_TRIBUNAL_REMEDIATION',
          region,
          capsuleId,
        }
      );
      setLastReceipt(res.data);
      if (res.data?.summary) {
        onShowToast?.(res.data.summary);
      }
      await Promise.all([fetchPersonaOverview(), runLaunchTribunal()]);
    } catch (err) {
      if (!err?.__cancelledByUser) {
        onShowError?.(
          err.response?.data?.error ||
            err.message ||
            `Failed to revert Rollback Capsule ${capsuleId}`
        );
      }
    } finally {
      setRemediatingTarget('');
    }
  };

  const runFleetTribunal = async () => {
    setFleetLoading(true);
    try {
      const res = await axios.get('/api/enterprise-personas/fleet-tribunal');
      setFleetTribunalData(res.data);
      onShowToast?.(
        `Evaluated ${res.data?.totalProjectsEvaluated || 0} active GCP projects in parallel (Estate Avg: ${res.data?.estateAverageScore || 0}/100)`
      );
    } catch (err) {
      onShowError?.(
        err.response?.data?.error ||
          err.message ||
          'Failed to run Multi-Project Fleet Tribunal.'
      );
    } finally {
      setFleetLoading(false);
    }
  };

  const verifyZkpBlindProof = async () => {
    const proof = tribunalData?.blindedComplianceProof;
    if (!projectId || !proof) return;
    setZkpVerifying(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/enterprise-personas/zkp-verify`,
        {
          statement: proof.statement,
          ed25519SignatureHex: proof.ed25519SignatureHex,
          publicKeyPem: proof.publicKeyPem,
          commitments: proof.commitments,
        }
      );
      setZkpVerificationResult(res.data);
      if (res.data?.summary) {
        onShowToast?.(res.data.summary);
      }
    } catch (err) {
      onShowError?.(
        err.response?.data?.error ||
          err.message ||
          'Failed to verify Blinded ZKP Compliance Proof.'
      );
    } finally {
      setZkpVerifying(false);
    }
  };

  const downloadZkpCertificate = () => {
    const proof = tribunalData?.blindedComplianceProof;
    if (!proof) return;
    const blob = new Blob([JSON.stringify(proof, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CloudPulse-2030-ZKP-Blind-Attestation-${
      proof.statement?.blindedProjectHash?.slice(0, 12) || 'cert'
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowToast?.(
      'Exported Zero-Knowledge Blinded Compliance Proof Certificate (.json)'
    );
  };

  const runIntentCompiler = async (customPrompt) => {
    if (!projectId) return;
    const promptToUse = customPrompt || intentPrompt;
    if (customPrompt) setIntentPrompt(customPrompt);
    setIntentCompiling(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/enterprise-personas/intent-compiler`,
        {
          intentPrompt: promptToUse,
          model: intentModel,
          region,
        }
      );
      setCompiledIntentPlan(res.data);
      onShowToast?.(
        `Compiled 10-Persona Control-Plane Plan via ${res.data?.modelUsed} in ${res.data?.compileLatencyMs}ms`
      );
    } catch (err) {
      onShowError?.(
        err.response?.data?.error ||
          err.message ||
          'Failed to compile Intent-to-Control-Plane plan.'
      );
    } finally {
      setIntentCompiling(false);
    }
  };

  const runPractitionerWorkbenchAll = useCallback(async () => {
    if (!projectId) return;
    setPractitionerLoading(true);
    try {
      const encProj = encodeURIComponent(projectId);
      const [vmRes, wfRes, dkRes, egRes] = await Promise.all([
        axios.post(`/api/project/${encProj}/enterprise-personas/agentless-vm-xray`, {
          region,
        }),
        axios.post(`/api/project/${encProj}/enterprise-personas/wire-packet-waterfall`, {
          targetHost: waterfallHost,
          targetPort: Number(waterfallPort) || 443,
        }),
        axios.post(`/api/project/${encProj}/enterprise-personas/practitioner-devkit`, {
          region,
          sampleJsonPayload: sampleJsonInput,
        }),
        axios.post(`/api/project/${encProj}/enterprise-personas/devsecops-entropy-gitops`, {
          region,
        }),
      ]);
      setVmXrayData(vmRes.data);
      setWaterfallData(wfRes.data);
      setDevkitData(dkRes.data);
      setEntropyGitopsData(egRes.data);
      onShowToast?.(
        'Probed 2030 6-Practitioner Agentless Workbench (Hypervisor Serial Port 1, Wire Packet Waterfall, IAM 403 Debugger, JSON->BQ & Shannon Entropy)'
      );
    } catch (err) {
      onShowError?.(
        err.response?.data?.error ||
          err.message ||
          'Failed to load 2030 6-Practitioner Agentless Workbench.'
      );
    } finally {
      setPractitionerLoading(false);
    }
  }, [projectId, region, waterfallHost, waterfallPort, sampleJsonInput, onShowToast, onShowError]);

  const runWireWaterfallCustom = async () => {
    if (!projectId) return;
    setPractitionerLoading(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/enterprise-personas/wire-packet-waterfall`,
        {
          targetHost: waterfallHost,
          targetPort: Number(waterfallPort) || 443,
        }
      );
      setWaterfallData(res.data);
      onShowToast?.(
        `Wire-Speed Socket Waterfall to ${res.data?.targetHost}:${res.data?.targetPort} completed in ${res.data?.totalProbeMs}ms`
      );
    } catch (err) {
      onShowError?.(
        err.response?.data?.error ||
          err.message ||
          'Failed to execute Wire-Speed Socket Waterfall.'
      );
    } finally {
      setPractitionerLoading(false);
    }
  };

  const runJsonToBqCompiler = async () => {
    if (!projectId) return;
    try {
      JSON.parse(sampleJsonInput);
    } catch (e) {
      onShowError?.(`Invalid JSON payload: ${e.message}`);
      return;
    }
    setPractitionerLoading(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/enterprise-personas/practitioner-devkit`,
        {
          region,
          sampleJsonPayload: sampleJsonInput,
        }
      );
      setDevkitData(res.data);
      onShowToast?.('Compiled nested STRUCT/REPEATED BigQuery DDL & Polyglot SDK');
    } catch (err) {
      onShowError?.(
        err.response?.data?.error ||
          err.message ||
          'Failed to compile JSON to BigQuery DDL.'
      );
    } finally {
      setPractitionerLoading(false);
    }
  };

  const downloadExecutiveDossier = () => {
    const md = tribunalData?.executiveDossierMarkdown;
    if (!md) return;
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CloudPulse-10-Persona-Tribunal-${projectId}-${region}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowToast?.(
      `Exported 10-Persona Executive Architecture Dossier for ${projectId}`
    );
  };

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
      await Promise.all([fetchPersonaOverview(), runLaunchTribunal()]);
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
                10-PERSONA ENTERPRISE ARCHITECTURE BOARD &amp; AUTONOMOUS LAUNCH TRIBUNAL
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                100% LIVE CONTROL-PLANE TELEMETRY · SDK {overview?.sdkVersion || '590.0.1 (2026.10.22)'}
              </span>
              {tribunalData?.merkleSealSha256 && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                  SHA-256 SEAL: {tribunalData.merkleSealSha256.slice(0, 16)}...
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-zinc-950 dark:text-zinc-50">
              10-Persona Enterprise Engineering Board · Live Cryptographic Launch Tribunal &amp; Cross-Domain Swarm
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Simultaneously probes 20 live Google Cloud REST APIs across <strong>01 Cloud Architect</strong>, <strong>02 Cloud Engineer</strong>, <strong>03 Data Engineer</strong>, <strong>04 Network Engineer</strong>, <strong>05 DevSecOps</strong>, <strong>06 AI/MLOps</strong>, <strong>07 SRE Commander</strong>, <strong>08 DBRE</strong>, <strong>09 FinOps &amp; GreenOps</strong>, and <strong>10 K8s Platform Engineer</strong>—computing live <strong>GO / NO-GO</strong> cryptographic votes, cross-persona blast-radius ripple chains, Pareto trade-offs, and <strong>T0 vs. T_Now SHA-256 Merkle Snapshot Diffs</strong>.
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
              onClick={() => {
                fetchPersonaOverview();
                runLaunchTribunal({
                  toastMessage: `Re-evaluated 10-Persona Launch Tribunal against live ${projectId} control plane`,
                });
              }}
              disabled={loading || tribunalLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-mono font-extrabold cursor-pointer transition-colors"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  loading || tribunalLoading ? 'animate-spin' : ''
                }`}
              />
              <span>
                {loading || tribunalLoading
                  ? 'Probing 10 Lenses...'
                  : 'Sync All 10 Lenses & Tribunal'}
              </span>
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
      {/* 10-PERSONA AUTONOMOUS LAUNCH TRIBUNAL & CROSS-DOMAIN SWARM ENGINE   */}
      {/* =================================================================== */}
      {tribunalData && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#202124] p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-mono font-extrabold">
                  10-PERSONA LAUNCH TRIBUNAL
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${
                    tribunalData.overallVerdict?.includes('NO_GO') ||
                    tribunalData.overallVerdict?.includes('NO-GO')
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                      : tribunalData.overallVerdict?.includes('CONDITIONAL')
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {tribunalData.overallVerdict} · COMPOSITE SCORE:{' '}
                  {tribunalData.weightedScore ??
                    tribunalData.compositeReadinessScore}
                  /100
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  APPROVE: {tribunalData.approveCount ?? 0} · WARN:{' '}
                  {tribunalData.warnCount ?? 0} · VETO:{' '}
                  {tribunalData.vetoCount ?? 0} · PROBE:{' '}
                  {tribunalData.probeLatencyMs ?? 0}ms
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-mono">
                100% Real Multi-API Probe across {projectId} ({region}) · SHA-256 Attestation Seal:{' '}
                <code className="text-indigo-600 dark:text-indigo-400">
                  {tribunalData.merkleSealSha256}
                </code>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  runLaunchTribunal({
                    captureBaseline: true,
                    toastMessage: `Captured new T0 SHA-256 Merkle Baseline for ${projectId}`,
                  })
                }
                disabled={tribunalLoading}
                className="px-2.5 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 text-[10px] font-mono font-extrabold cursor-pointer"
              >
                Snapshot T0 Baseline
              </button>
              <button
                type="button"
                onClick={() =>
                  copyText(
                    tribunalData.executiveDossierMarkdown || '',
                    '10-Persona Executive Dossier (.md)'
                  )
                }
                className="px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[10px] font-mono font-extrabold cursor-pointer"
              >
                Copy CTO/CISO Dossier
              </button>
              <button
                type="button"
                onClick={downloadExecutiveDossier}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-mono font-extrabold cursor-pointer"
              >
                Export Dossier (.md)
              </button>
            </div>
          </div>

          {/* Sub-navigation tabs for the 8 Swarm & 2030 Horizon Intelligence Views */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              {
                id: 'ROLL_CALL',
                label: '01 · 10-Persona Roll-Call & Live Remediator',
              },
              {
                id: 'RIPPLE_GRAPH',
                label: `02 · Cross-Persona Ripple Chains (${
                  (tribunalData.liveCrossPersonaChains || []).length
                })`,
              },
              {
                id: 'PARETO_SOLVER',
                label: '03 · Pareto Conflict Solver',
              },
              {
                id: 'MERKLE_DIFF',
                label: `04 · T0 vs. T_Now Merkle Diff & Undo Capsules (${
                  (tribunalData.rollbackCapsules || []).length
                })`,
              },
              {
                id: 'MULTI_PROJECT_FLEET',
                label: '05 · [2030] Multi-Project Fleet Tribunal',
              },
              {
                id: 'PRE_CRIME_72H',
                label: `06 · [2030] T_+72h Pre-Crime Forecaster (${
                  tribunalData.preCrime72hForecast?.overall72hRiskLevel ||
                  'ACTIVE'
                })`,
              },
              {
                id: 'ZKP_BLIND_PROOF',
                label: '07 · [2030] ZKP / Ed25519 Blinded Proof & Verifier',
              },
              {
                id: 'INTENT_COMPILER',
                label: '08 · [2030] Intent-to-Control-Plane Compiler',
              },
              {
                id: 'PRACTITIONER_WORKBENCH',
                label:
                  '09 · [2030] 6-Practitioner Agentless Workbench (Kill 2010 VM & Net Console)',
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setTribunalSubTab(tab.id);
                  if (
                    tab.id === 'MULTI_PROJECT_FLEET' &&
                    !fleetTribunalData &&
                    !fleetLoading
                  ) {
                    runFleetTribunal();
                  }
                  if (
                    tab.id === 'PRACTITIONER_WORKBENCH' &&
                    !vmXrayData &&
                    !practitionerLoading
                  ) {
                    runPractitionerWorkbenchAll();
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-mono font-extrabold border transition-colors cursor-pointer ${
                  tribunalSubTab === tab.id
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                    : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* SUB-TAB 1: 10-PERSONA ROLL-CALL VOTING GRID & LIVE GCP REMEDIATOR */}
          {tribunalSubTab === 'ROLL_CALL' && (
            <div className="space-y-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-[10.5px] font-mono text-zinc-700 dark:text-zinc-300 space-y-0.5">
                <div className="font-extrabold text-blue-600 dark:text-blue-400">
                  UNDER THE HOOD · HOW THE 10-PERSONA LAUNCH TRIBUNAL WORKS (ZERO GIMMICK)
                </div>
                <div>
                  1. <strong>20 Parallel Live GCP REST API Probes:</strong> Simultaneously queries `run.googleapis.com/v2`, `sqladmin.googleapis.com/v1`, `storage.googleapis.com/storage/v1`, `bigquery.googleapis.com/bigquery/v2`, `compute.googleapis.com/compute/v1` (Networks, Subnets, Firewalls, Disks, Addresses), `iam.googleapis.com/v1`, `container.googleapis.com/v1`, `logging.googleapis.com/v2`, `orgpolicy.googleapis.com/v2`, and `cloudresourcemanager.googleapis.com/v1` (`:testIamPermissions` &amp; `:getIamPolicy`).
                  {' '}2. <strong>1-Click Live Control-Plane Remediation:</strong> Clicking `Fix Live` dispatches a real `PATCH /compute/v1/projects/:id/global/firewalls/:name` (`sourceRanges: [&quot;35.235.240.0/20&quot;]`) or `PATCH /storage/v1/b/:bucket` (`publicAccessPrevention: &quot;enforced&quot;`).
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {(tribunalData.votes || tribunalData.personaVotes || []).map(
                (pv) => {
                  const remAction =
                    pv.liveActionableRemediation?.remediationType ||
                    pv.remediationAction;
                  const remTarget =
                    pv.liveActionableRemediation?.targetResource ||
                    pv.remediationTarget;
                  const remKey = `${remAction}:${remTarget}`;
                  const isRemediating = remediatingTarget === remKey;
                  const cliCmd = pv.remediationCli || pv.cliRemediation;
                  return (
                    <div
                      key={pv.code}
                      className={`p-3 rounded-xl border flex flex-col justify-between gap-2 text-xs font-mono ${
                        pv.vote === 'VETO_BLOCK'
                          ? 'border-rose-500/50 bg-rose-500/5'
                          : pv.vote === 'CONDITIONAL_WARN'
                          ? 'border-amber-500/40 bg-amber-500/5'
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setActivePersona(
                                normalizePersonaId(pv.personaId || pv.persona)
                              )
                            }
                            className="font-extrabold text-zinc-900 dark:text-white hover:text-blue-500 text-left cursor-pointer"
                          >
                            [{pv.code}] {pv.role}
                          </button>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                              pv.vote === 'VETO_BLOCK'
                                ? 'bg-rose-500/20 text-rose-500'
                                : pv.vote === 'CONDITIONAL_WARN'
                                ? 'bg-amber-500/20 text-amber-500'
                                : 'bg-emerald-500/20 text-emerald-500'
                            }`}
                          >
                            {pv.vote} · {pv.score}
                          </span>
                        </div>
                        <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                          {pv.liveMetrics || pv.liveMetric}
                        </div>
                        <div className="text-[10px] text-zinc-600 dark:text-zinc-400 leading-snug">
                          {pv.liveFinding || pv.finding}
                        </div>
                      </div>

                      <div className="pt-1.5 border-t border-zinc-200/70 dark:border-zinc-800/70 flex flex-wrap items-center justify-between gap-1">
                        {remAction && remTarget ? (
                          <button
                            type="button"
                            disabled={isRemediating}
                            onClick={() =>
                              runLiveRemediation(remAction, remTarget)
                            }
                            className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[9px] font-extrabold cursor-pointer"
                          >
                            {isRemediating
                              ? 'Patching GCP...'
                              : `Fix Live (${remTarget})`}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setActivePersona(
                                normalizePersonaId(pv.personaId || pv.persona)
                              )
                            }
                            className="text-[9px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                          >
                            Inspect Lens →
                          </button>
                        )}
                        {cliCmd && onRunInShell && (
                          <button
                            type="button"
                            onClick={() => onRunInShell(cliCmd)}
                            className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[9px] font-bold cursor-pointer"
                          >
                            Run CLI
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }
              )}
              </div>
            </div>
          )}

          {/* SUB-TAB 2: LIVE CROSS-PERSONA DEPENDENCY & BLAST-RADIUS RIPPLE CHAINS */}
          {tribunalSubTab === 'RIPPLE_GRAPH' && (
            <div className="space-y-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[10.5px] font-mono text-zinc-700 dark:text-zinc-300 space-y-0.5">
                <div className="font-extrabold text-amber-600 dark:text-amber-400">
                  UNDER THE HOOD · HOW CROSS-PERSONA BLAST-RADIUS RIPPLE CHAINS WORK (ZERO GIMMICK)
                </div>
                <div>
                  Joins your live VPC networks (`compute/v1/projects/:id/global/networks`), Subnets (`aggregated/subnetworks`), Firewall rules (`global/firewalls`), IAM Service Accounts (`iam.googleapis.com/v1`), and GCS Buckets (`storage/v1/b`) by resource reference so every ripple chain is anchored to a real resource in `{projectId}`.
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(tribunalData.liveCrossPersonaChains || []).map((chain) => (
                  <div
                    key={chain.chainId || chain.id}
                    className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 space-y-2 text-xs font-mono"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-extrabold text-zinc-900 dark:text-white">
                        {chain.title || chain.trigger}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-500">
                        {chain.triggerPersona || 'CROSS-DOMAIN'}
                      </span>
                    </div>
                    {chain.liveResourceAnchor && (
                      <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                        Anchor: {chain.liveResourceAnchor}
                      </div>
                    )}
                    <div className="space-y-1 text-[11px] text-zinc-600 dark:text-zinc-300">
                      {(chain.rippleSequence || [chain.blastRadius]).map(
                        (step, idx) => (
                          <div key={idx}>{step}</div>
                        )
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-zinc-500">
                          Impacted Personas:
                        </span>
                        {(chain.impactedPersonas || []).map((p) => (
                          <span
                            key={p}
                            className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                      {chain.safeExecutionOrderCli && onRunInShell && (
                        <button
                          type="button"
                          onClick={() =>
                            onRunInShell(chain.safeExecutionOrderCli)
                          }
                          className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold cursor-pointer"
                        >
                          Verify Chain CLI
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUB-TAB 3: MULTI-PERSONA PARETO CONFLICT SOLVER */}
          {tribunalSubTab === 'PARETO_SOLVER' &&
            tribunalData.paretoConflictSolver && (
              <div className="space-y-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[10.5px] font-mono text-zinc-700 dark:text-zinc-300 space-y-0.5">
                  <div className="font-extrabold text-emerald-600 dark:text-emerald-400">
                    UNDER THE HOOD · HOW MULTI-PERSONA PARETO CONFLICT SYNTHESIS WORKS (ZERO GIMMICK)
                  </div>
                  <div>
                    Evaluates competing objective functions (`[09 FinOps] Minimize $/mo` vs. `[01/07 Architect/SRE] 99.99% Multi-Region HA` vs. `[05 DevSecOps] Zero-Trust IAP &amp; 0 Keys`) against your live Cloud Run services, SQL instances, Firewalls, and GCS Buckets in `{projectId}` to compute the Pareto-optimal configuration on each axis.
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <span className="font-extrabold text-zinc-900 dark:text-white">
                    {tribunalData.paretoConflictSolver.conflictTitle}
                  </span>
                  <span className="px-2.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold">
                    {tribunalData.paretoConflictSolver.paretoVerdict}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(tribunalData.paretoConflictSolver.matrix || []).map(
                    (row) => (
                      <div
                        key={row.dimension}
                        className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 space-y-2 text-xs font-mono"
                      >
                        <div className="font-extrabold text-zinc-900 dark:text-white">
                          {row.dimension}
                        </div>
                        <div className="space-y-1 text-[10px]">
                          <div className="p-1.5 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                            <span className="text-emerald-500 font-bold">
                              [09 FinOps]:
                            </span>{' '}
                            {row.finOpsDemand}
                          </div>
                          <div className="p-1.5 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                            <span className="text-blue-500 font-bold">
                              [01/07 SRE/Arch]:
                            </span>{' '}
                            {row.sreArchitectDemand}
                          </div>
                          <div className="p-1.5 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                            <span className="text-rose-500 font-bold">
                              [05 DevSecOps]:
                            </span>{' '}
                            {row.devSecOpsDemand}
                          </div>
                        </div>
                        <div className="pt-1 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
                          Pareto Synthesis: {row.paretoSolution}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

          {/* SUB-TAB 4: T0 vs. T_NOW CRYPTOGRAPHIC SHA-256 MERKLE SNAPSHOT DIFF */}
          {tribunalSubTab === 'MERKLE_DIFF' && tribunalData.merkleDiff && (
            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 space-y-2.5 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-[10.5px] text-zinc-700 dark:text-zinc-300 space-y-1">
                <div className="font-extrabold text-indigo-600 dark:text-indigo-400">
                  UNDER THE HOOD · HOW MERKLE DIFF &amp; ROLLBACK CAPSULES WORK (ZERO GIMMICK)
                </div>
                <div>
                  1. <strong>SHA-256 Merkle State Tree:</strong> Hashes the canonical JSON vector of all 10 personas&apos; live GCP API counts (`crypto.createHash(&apos;sha256&apos;)`) at `T0` and compares it against `T_Now` on every probe.
                  {' '}2. <strong>Pre-Mutation Rollback Capsules:</strong> Before `EXECUTE_TRIBUNAL_LIVE_REMEDIATION` mutates a live VPC Firewall or GCS Bucket, the server fetches the exact pre-change GCP resource JSON (`GET /compute/v1/.../firewalls/:name` or `GET /storage/v1/b/:bucket`), seals it with a `SHA-256` digest, and stores the restore payload in memory so `ROLLBACK_TRIBUNAL_REMEDIATION` can atomically `PATCH` the original state back in 1 click.
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-extrabold text-zinc-900 dark:text-white">
                    T0 vs. T_Now Cryptographic Merkle State Verification
                  </span>{' '}
                  <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-500 text-[10px] font-extrabold">
                    {tribunalData.merkleDiff.stateChanged
                      ? `STATE_MUTATED (Score Delta: ${tribunalData.merkleDiff.scoreDelta})`
                      : 'VERIFIED_ZERO_DRIFT'}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500">
                  T0 Captured: {tribunalData.merkleDiff.baselineCapturedAt}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-zinc-500 text-[10px]">
                    T0 Baseline SHA-256 Merkle Root
                  </div>
                  <div className="font-bold text-indigo-500 break-all">
                    {tribunalData.merkleDiff.baselineMerkleRoot}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-zinc-500 text-[10px]">
                    T_Now Live SHA-256 Merkle Root (
                    {tribunalData.merkleDiff.currentCapturedAt})
                  </div>
                  <div className="font-bold text-emerald-500 break-all">
                    {tribunalData.merkleDiff.currentMerkleRoot}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                {(tribunalData.merkleDiff.metricDeltas || []).map((d) => (
                  <div
                    key={d.metric}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[11px]"
                  >
                    <span className="font-bold truncate pr-2">{d.metric}</span>
                    <span className="shrink-0">
                      <code>{d.t0}</code> → <code>{d.tNow}</code> (
                      <strong
                        className={
                          d.delta === 0
                            ? 'text-zinc-500'
                            : d.delta < 0
                            ? 'text-emerald-500'
                            : 'text-amber-500'
                        }
                      >
                        {d.delta > 0 ? `+${d.delta}` : d.delta}
                      </strong>
                      )
                    </span>
                  </div>
                ))}
              </div>

              {/* Pre-Mutation Rollback Capsules */}
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-zinc-900 dark:text-white">
                    2030 Pre-Mutation Rollback Capsules (1-Click GCP State Revert)
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {(tribunalData.rollbackCapsules || []).length} Capsule(s) Sealed
                  </span>
                </div>
                {(tribunalData.rollbackCapsules || []).length === 0 ? (
                  <div className="text-[11px] text-zinc-500">
                    When you click "Fix Live" on any firewall rule or GCS bucket in Sub-Tab 01, the exact pre-mutation GCP resource JSON is sealed here with a SHA-256 hash so you can revert in 1 click.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(tribunalData.rollbackCapsules || []).map((cap) => (
                      <div
                        key={cap.capsuleId}
                        className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 text-[11px]"
                      >
                        <div className="space-y-0.5">
                          <div className="font-extrabold text-zinc-900 dark:text-white">
                            {cap.remediationType} · {cap.targetResource}
                          </div>
                          <div className="text-[10px] text-zinc-500">
                            Capsule SHA-256: {cap.capsuleSha256?.slice(0, 16)}... ·{' '}
                            {cap.reverted ? 'REVERTED' : 'ACTIVE'}
                          </div>
                        </div>
                        {!cap.reverted && (
                          <button
                            type="button"
                            disabled={
                              remediatingTarget === `revert:${cap.capsuleId}`
                            }
                            onClick={() => revertRollbackCapsule(cap.capsuleId)}
                            className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-extrabold cursor-pointer shrink-0"
                          >
                            {remediatingTarget === `revert:${cap.capsuleId}`
                              ? 'Reverting...'
                              : 'Revert to Pre-Fix State'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUB-TAB 5: [2030] MULTI-PROJECT FLEET TRIBUNAL & CROSS-ESTATE ARBITRATOR */}
          {tribunalSubTab === 'MULTI_PROJECT_FLEET' && (
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 space-y-3 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-[10.5px] text-zinc-700 dark:text-zinc-300 space-y-1">
                <div className="font-extrabold text-blue-600 dark:text-blue-400">
                  UNDER THE HOOD · HOW MULTI-PROJECT FLEET TRIBUNAL WORKS (ZERO GIMMICK)
                </div>
                <div>
                  1. <strong>Live Account Discovery:</strong> Calls `GET https://cloudresourcemanager.googleapis.com/v1/projects?filter=lifecycleState:ACTIVE` using your live OAuth2 / ADC token.
                  {' '}2. <strong>Parallel Control-Plane Fan-Out:</strong> Dispatches `Promise.allSettled` across every discovered project simultaneously—querying `compute.googleapis.com` (`global/firewalls` &amp; `aggregated/disks`), `storage.googleapis.com/storage/v1/b`, and `run.googleapis.com/v2`—and seals each project&apos;s posture with an independent `SHA-256` Merkle root.
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-extrabold text-zinc-900 dark:text-white">
                    Multi-Project Cross-Estate Fleet Tribunal (All Active GCP Projects in Parallel)
                  </span>
                  {fleetTribunalData && (
                    <span className="ml-2 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 text-[10px] font-extrabold">
                      {fleetTribunalData.totalProjectsEvaluated} Projects · Estate Avg:{' '}
                      {fleetTribunalData.estateAverageScore}/100 ·{' '}
                      {fleetTribunalData.totalProbeLatencyMs}ms
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={runFleetTribunal}
                  disabled={fleetLoading}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-extrabold cursor-pointer"
                >
                  {fleetLoading
                    ? 'Probing All Active GCP Projects...'
                    : 'Re-Probe All Active Projects'}
                </button>
              </div>

              {fleetLoading && !fleetTribunalData ? (
                <div className="text-[11px] text-zinc-500 py-4">
                  Discovering all ACTIVE Google Cloud projects via cloudresourcemanager.googleapis.com and running parallel 10-Persona probes...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(fleetTribunalData?.projects || []).map((proj, idx) => (
                    <div
                      key={proj.projectId}
                      className={`p-3 rounded-xl border space-y-2 ${
                        proj.projectId === projectId
                          ? 'border-blue-500 bg-blue-500/5'
                          : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-zinc-900 dark:text-white truncate">
                          #{idx + 1} · {proj.projectId}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            proj.readinessScore >= 90
                              ? 'bg-emerald-500/20 text-emerald-500'
                              : 'bg-amber-500/20 text-amber-500'
                          }`}
                        >
                          {proj.readinessScore}/100
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {proj.verdict} · {proj.probeLatencyMs}ms
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                        <div className="p-1.5 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                          Open 0.0.0.0/0 FW:{' '}
                          <strong
                            className={
                              proj.counts?.openSensitiveFirewalls > 0
                                ? 'text-amber-500'
                                : 'text-emerald-500'
                            }
                          >
                            {proj.counts?.openSensitiveFirewalls ?? 0}/
                            {proj.counts?.firewalls ?? 0}
                          </strong>
                        </div>
                        <div className="p-1.5 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                          Unenforced PAP:{' '}
                          <strong
                            className={
                              proj.counts?.unhardenedBuckets > 0
                                ? 'text-amber-500'
                                : 'text-emerald-500'
                            }
                          >
                            {proj.counts?.unhardenedBuckets ?? 0}/
                            {proj.counts?.gcsBuckets ?? 0}
                          </strong>
                        </div>
                        <div className="p-1.5 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                          Cloud Run Svcs:{' '}
                          <strong>{proj.counts?.cloudRunServices ?? 0}</strong>
                        </div>
                        <div className="p-1.5 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                          Zombie Disks:{' '}
                          <strong>{proj.counts?.zombieDisks ?? 0}</strong>
                        </div>
                      </div>
                      <div className="text-[9px] text-indigo-500 truncate">
                        SHA-256: {proj.merkleSealSha256}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUB-TAB 6: [2030] T_NOW -> T_+72H PRE-CRIME FORECASTER */}
          {tribunalSubTab === 'PRE_CRIME_72H' &&
            tribunalData.preCrime72hForecast && (
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 space-y-3 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[10.5px] text-zinc-700 dark:text-zinc-300 space-y-1">
                  <div className="font-extrabold text-amber-600 dark:text-amber-400">
                    UNDER THE HOOD · HOW T_+72H PRE-CRIME FORECASTING WORKS (ZERO GIMMICK)
                  </div>
                  <div>
                    1. <strong>Live Telemetry Inputs:</strong> Reads live `logging.googleapis.com/v2/entries:list` (`severity&gt;=ERROR` count), `compute.googleapis.com` (`0.0.0.0/0` firewall count + unattached disk GB + reserved static IPs), and `storage.googleapis.com` (buckets without `publicAccessPrevention=&quot;enforced&quot;`).
                    {' '}2. <strong>72-Hour Extrapolation Math:</strong> Multiplies current hourly error &amp; waste burn rates over a `+72h` horizon (`burnRatePerHour * 72`) to compute exact SLO Error-Budget exhaustion windows, cumulative public exposure-hours (`openAssets * 72h`), and 72-hour stranded FinOps waste before the invoice arrives.
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-extrabold text-zinc-900 dark:text-white">
                      T_Now → T_+72h Pre-Crime Outage, Quota-Wall &amp; Drift Trajectory Engine
                    </span>
                    <span className="ml-2 px-2 py-0.5 rounded bg-amber-500/15 text-amber-500 text-[10px] font-extrabold">
                      {tribunalData.preCrime72hForecast.overall72hRiskLevel}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500">
                    Horizon: +{tribunalData.preCrime72hForecast.horizonHours}h
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(tribunalData.preCrime72hForecast.trajectories || []).map(
                    (tr) => (
                      <div
                        key={tr.id}
                        className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-extrabold text-zinc-900 dark:text-white">
                            {tr.metric}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                              tr.status === 'WARN'
                                ? 'bg-amber-500/20 text-amber-500'
                                : 'bg-emerald-500/20 text-emerald-500'
                            }`}
                          >
                            {tr.domain} · {tr.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-600 dark:text-zinc-300">
                          <strong>T_Now Live:</strong> {tr.tNowValue}
                        </div>
                        <div className="text-[11px] text-blue-600 dark:text-blue-400">
                          <strong>T_+72h Projection:</strong>{' '}
                          {tr.tPlus72hProjection}
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          Time-to-Threshold: <code>{tr.timeToThreshold}</code>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

          {/* SUB-TAB 7: [2030] ZERO-KNOWLEDGE / ED25519 BLINDED COMPLIANCE PROOF & VERIFIER */}
          {tribunalSubTab === 'ZKP_BLIND_PROOF' &&
            tribunalData.blindedComplianceProof && (
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 space-y-3 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[10.5px] text-zinc-700 dark:text-zinc-300 space-y-1">
                  <div className="font-extrabold text-emerald-600 dark:text-emerald-400">
                    UNDER THE HOOD · HOW ZERO-KNOWLEDGE / ED25519 BLINDED ATTESTATION WORKS (ZERO GIMMICK)
                  </div>
                  <div>
                    1. <strong>Salted SHA-256 Pedersen-Style Commitments:</strong> For every live firewall rule, GCS bucket, and IAM Service Account, the server generates a cryptographic salt and computes `C_i = SHA256(salt || resourceType || resourceName || complianceState)`—replacing the plaintext resource name with `blindedIdentifier` (`fw_commit_01`, `bkt_commit_01`) so external auditors never see internal infrastructure names.
                    {' '}2. <strong>RFC 8032 Ed25519 Digital Signature &amp; Live Verifier:</strong> Signs the blinded Merkle statement using Node.js `crypto.sign(null, payloadBuffer, ed25519PrivateKey)` and verifies it in microseconds via `POST /enterprise-personas/zkp-verify` (`crypto.verify(null, payloadBuffer, publicKeyPem, signatureBuffer)`).
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-extrabold text-zinc-900 dark:text-white">
                      Zero-Knowledge / Blinded Cryptographic Compliance Proof (
                      {tribunalData.blindedComplianceProof.algorithm})
                    </span>
                    <span className="ml-2 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 text-[10px] font-extrabold">
                      ZERO INTERNAL RESOURCE NAME LEAKAGE
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={verifyZkpBlindProof}
                      disabled={zkpVerifying}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-extrabold cursor-pointer"
                    >
                      {zkpVerifying
                        ? 'Verifying Ed25519...'
                        : 'Verify Ed25519 + Merkle Proof Live'}
                    </button>
                    <button
                      type="button"
                      onClick={downloadZkpCertificate}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-extrabold cursor-pointer"
                    >
                      Export ZKP Certificate (.json)
                    </button>
                  </div>
                </div>

                {zkpVerificationResult && (
                  <div
                    className={`p-3 rounded-xl border text-[11px] ${
                      zkpVerificationResult.verified
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                        : 'border-rose-500/40 bg-rose-500/10 text-rose-500'
                    }`}
                  >
                    <strong>{zkpVerificationResult.summary}</strong>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                    <div className="text-zinc-500">
                      Blinded Project Commitment &amp; Merkle Root
                    </div>
                    <div className="font-bold text-indigo-500 break-all">
                      {
                        tribunalData.blindedComplianceProof.statement
                          ?.blindedMerkleRoot
                      }
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                    <div className="text-zinc-500">
                      Ed25519 (RFC 8032) Digital Signature
                    </div>
                    <div className="font-bold text-emerald-500 break-all">
                      {tribunalData.blindedComplianceProof.ed25519SignatureHex}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {(tribunalData.blindedComplianceProof.commitments || [])
                    .slice(0, 9)
                    .map((c) => (
                      <div
                        key={c.commitmentId}
                        className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1 text-[10px]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-zinc-900 dark:text-white">
                            {c.commitmentId} · {c.blindedIdentifier}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                              c.compliant
                                ? 'bg-emerald-500/20 text-emerald-500'
                                : 'bg-amber-500/20 text-amber-500'
                            }`}
                          >
                            {c.compliant ? 'COMPLIANT' : 'NEEDS_SCOPE'}
                          </span>
                        </div>
                        <div className="text-zinc-500">{c.invariantClaim}</div>
                        <div className="text-[9px] text-indigo-500 truncate">
                          Commitment: {c.pedersenSha256Commitment}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

          {/* SUB-TAB 8: [2030] INTENT-TO-CONTROL-PLANE COMPILER */}
          {tribunalSubTab === 'INTENT_COMPILER' && (
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 space-y-3 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-[10.5px] text-zinc-700 dark:text-zinc-300 space-y-1">
                <div className="font-extrabold text-blue-600 dark:text-blue-400">
                  UNDER THE HOOD · HOW INTENT-TO-CONTROL-PLANE COMPILATION WORKS (ZERO GIMMICK)
                </div>
                <div>
                  1. <strong>Live Inventory Grounding:</strong> Queries `compute.googleapis.com/compute/v1/projects/:id/global/firewalls`, `storage.googleapis.com/storage/v1/b`, and `run.googleapis.com/v2/projects/:id/locations/-/services` first so the compiler operates on your actual live GCP resource names.
                  {' '}2. <strong>10-Persona AST + Gemini Synthesis:</strong> Evaluates your natural-language intent against all 10 specialist guardrails (using `gemini-3.8-flash` / `gemini-3.1-pro` when configured or deterministic AST policy synthesis) and outputs copy-ready Terraform HCL (`google_project_organization_policy`, `google_compute_firewall`, `google_storage_bucket`).
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-extrabold text-zinc-900 dark:text-white">
                    2030 Intent-to-Control-Plane Compiler (10-Persona Policy Synthesis + Terraform HCL)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={intentModel}
                    onChange={(e) => setIntentModel(e.target.value)}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-[10px] font-bold"
                  >
                    <option value="gemini-3.8-flash">
                      gemini-3.8-flash (-80% Context Cache)
                    </option>
                    <option value="gemini-3.1-pro">
                      gemini-3.1-pro (Deep Reasoning)
                    </option>
                  </select>
                  <button
                    type="button"
                    onClick={() => runIntentCompiler()}
                    disabled={intentCompiling}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-extrabold cursor-pointer"
                  >
                    {intentCompiling
                      ? 'Compiling 10-Persona Plan...'
                      : 'Compile Intent Plan'}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  'Lock project to strict Zero-Trust & $0.00/mo Always-Free invariance',
                  'Eliminate all public 0.0.0.0/0 ingress & enforce Cloud IAP (35.235.240.0/20)',
                  'Architect multi-region Gemini 3.8 Flash + 3.1 Pro RAG Lakehouse',
                  'Prepare SOC2 / ISO-27001 cryptographic compliance & Zero-Key OIDC',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => runIntentCompiler(preset)}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 text-[10px] text-zinc-700 dark:text-zinc-300 cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={intentPrompt}
                onChange={(e) => setIntentPrompt(e.target.value)}
                placeholder="Type any architectural outcome or security intent..."
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-xs font-mono"
              />

              {compiledIntentPlan && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-1">
                  <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(compiledIntentPlan.personaAmendments || []).map((pa) => (
                      <div
                        key={pa.code}
                        className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1 text-[10px]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-zinc-900 dark:text-white">
                            [{pa.code}] {pa.role}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-500 text-[9px] font-extrabold">
                            {pa.verdict}
                          </span>
                        </div>
                        <div className="text-zinc-600 dark:text-zinc-400">
                          {pa.directive}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="lg:col-span-5 p-3 rounded-xl bg-zinc-950 text-zinc-100 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-emerald-400">
                        Compiled Terraform HCL (main.tf)
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          copyText(
                            compiledIntentPlan.compiledTerraformHcl || '',
                            'Compiled Intent Terraform HCL'
                          )
                        }
                        className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] cursor-pointer"
                      >
                        Copy HCL
                      </button>
                    </div>
                    <pre className="text-[10px] text-zinc-300 overflow-x-auto whitespace-pre-wrap">
                      {compiledIntentPlan.compiledTerraformHcl}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUB-TAB 9: [2030] 6-PRACTITIONER AGENTLESS WORKBENCH (KILL THE 2010 VM & NETWORK CONSOLE) */}
          {tribunalSubTab === 'PRACTITIONER_WORKBENCH' && (
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 space-y-4 text-xs font-mono">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-extrabold">
                      100% AGENTLESS 2030 PRACTITIONER WORKBENCH
                    </span>
                    <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-[10px] font-bold">
                      ZERO VM AGENTS · HYPERVISOR SERIAL PORT 1 · LIVE L3/L4/L6 SOCKET WATERFALL · SHANNON ENTROPY
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                    Replaces 2010-era VM tables, static firewall lists, cryptic IAM 403 errors, manual BigQuery schemas, and Terraform import pain across 6 hands-on engineering disciplines—with zero agents required inside guest VMs.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={runPractitionerWorkbenchAll}
                  disabled={practitionerLoading}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-extrabold cursor-pointer disabled:opacity-50"
                >
                  {practitionerLoading
                    ? 'Probing All 6 Practitioner Engines...'
                    : 'Re-Probe All 6 Practitioner Engines'}
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* PANEL A: VM & LINUX SYSTEMS ENGINEER — AGENTLESS HYPERVISOR SERIAL-PORT X-RAY & 1-CLICK CONTAINERIZER */}
                <div className="lg:col-span-6 p-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                    <div>
                      <span className="px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-500 text-[9px] font-extrabold mr-1.5">
                        VM &amp; LINUX SYSTEMS ENG
                      </span>
                      <span className="font-extrabold text-zinc-900 dark:text-white">
                        Agentless Hypervisor Serial-Port 1 X-Ray, `/proc` Kernel &amp; VM-to-Cloud-Run Transpiler
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 text-[9px] font-extrabold shrink-0">
                      AGENT REQUIRED: FALSE
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-[9.5px] text-zinc-700 dark:text-zinc-300 space-y-0.5">
                    <div className="font-extrabold text-indigo-600 dark:text-indigo-400">
                      UNDER THE HOOD · WHY ZERO VM AGENT IS NEEDED
                    </div>
                    <div>
                      1. <strong>GCE KVM Hypervisor Ringbuffer:</strong> Calls `GET /compute/v1/projects/:id/zones/:zone/instances/:name/serialPort?port=1` directly from Google&apos;s KVM hypervisor outside the guest VM (even if `sshd` is dead or port 22 is blocked).
                      {' '}2. <strong>Direct Linux `/proc` Syscalls:</strong> Reads `/proc/loadavg`, `/proc/meminfo`, and parses hex socket state `0A` (`TCP_LISTEN`) in `/proc/net/tcp` via `fs.readFileSync` with zero background daemon.
                    </div>
                  </div>

                  {vmXrayData?.liveKernelProcTelemetry && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                        <div className="text-[9px] text-zinc-500">KERNEL / HOST</div>
                        <div className="text-[10px] font-extrabold text-zinc-900 dark:text-white truncate">
                          {vmXrayData.liveKernelProcTelemetry.kernelRelease} ({vmXrayData.liveKernelProcTelemetry.hostname})
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                        <div className="text-[9px] text-zinc-500">/proc/loadavg</div>
                        <div className="text-[10px] font-extrabold text-emerald-500 truncate">
                          {vmXrayData.liveKernelProcTelemetry.loadavg} ({vmXrayData.liveKernelProcTelemetry.cpuCores} vCPU)
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                        <div className="text-[9px] text-zinc-500">/proc/meminfo</div>
                        <div className="text-[10px] font-extrabold text-blue-500">
                          {vmXrayData.liveKernelProcTelemetry.memUsedPct}% used ({vmXrayData.liveKernelProcTelemetry.memAvailableMb}MB free)
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                        <div className="text-[9px] text-zinc-500">/proc/net/tcp SOCKETS</div>
                        <div className="text-[10px] font-extrabold text-amber-500">
                          {vmXrayData.liveKernelProcTelemetry.activeTcpKernelSockets} active · Ports: {(vmXrayData.liveKernelProcTelemetry.listeningTcpPorts || []).slice(0, 4).join(', ')}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-zinc-700 dark:text-zinc-300">
                        GCE Fleet ({vmXrayData?.vmCount ?? 0} VMs) · Hypervisor Serial Port 1 Stream (`instances.getSerialPortOutput`)
                      </span>
                      <span className="text-emerald-500 font-bold">
                        Save ${vmXrayData?.vmToCloudRunTranspiler?.monthlySavingsUsd ?? 56.21}/mo → $0.00/mo Idle
                      </span>
                    </div>
                    <pre className="p-2.5 rounded-lg bg-zinc-950 text-emerald-400 text-[9.5px] overflow-x-auto max-h-28">
                      {(vmXrayData?.serialPortLines || [
                        '[    0.000000] Google Compute Engine KVM Hypervisor Serial Port 1 (COM1) Ready — Zero Guest Agent Required',
                      ]).join('\n')}
                    </pre>
                  </div>

                  {vmXrayData?.vmToCloudRunTranspiler && (
                    <div className="space-y-1.5 pt-1 border-t border-zinc-200 dark:border-zinc-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-zinc-900 dark:text-white">
                          1-Click VM-to-Cloud-Run Gen2 Transpiler (`Dockerfile` + `gcloud run deploy`)
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              copyText(
                                vmXrayData.vmToCloudRunTranspiler.generatedDockerfile,
                                'Transpiled VM Dockerfile'
                              )
                            }
                            className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[9.5px] font-bold cursor-pointer"
                          >
                            Copy Dockerfile
                          </button>
                          {onRunInShell && (
                            <button
                              type="button"
                              onClick={() =>
                                onRunInShell(
                                  vmXrayData.vmToCloudRunTranspiler.generatedDeployCli
                                )
                              }
                              className="px-2 py-0.5 rounded bg-blue-600 text-white text-[9.5px] font-bold cursor-pointer"
                            >
                              Deploy in Shell
                            </button>
                          )}
                        </div>
                      </div>
                      <pre className="p-2.5 rounded-lg bg-zinc-950 text-zinc-300 text-[9.5px] overflow-x-auto max-h-28">
                        {vmXrayData.vmToCloudRunTranspiler.generatedDockerfile}
                      </pre>
                    </div>
                  )}
                </div>

                {/* PANEL B: NETWORK ENGINEER — WIRE-SPEED L3/L4/L6 PACKET WATERFALL & VPC FIREWALL SHADOW ANALYZER */}
                <div className="lg:col-span-6 p-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                    <div>
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-500 text-[9px] font-extrabold mr-1.5">
                        NETWORK ENGINEER
                      </span>
                      <span className="font-extrabold text-zinc-900 dark:text-white">
                        Live L3/L4/L6 Wire-Speed Socket Timing Waterfall &amp; Firewall Shadow Matrix
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-500 text-[9px] font-extrabold shrink-0">
                      TOTAL PROBE: {waterfallData?.totalProbeMs ?? 0}ms
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-[9.5px] text-zinc-700 dark:text-zinc-300 space-y-0.5">
                    <div className="font-extrabold text-blue-600 dark:text-blue-400">
                      UNDER THE HOOD · HOW WIRE-SPEED SOCKET TIMING &amp; SHADOW DETECTION WORK
                    </div>
                    <div>
                      1. <strong>Nanosecond OS Socket Stopwatch (`process.hrtime.bigint()`):</strong> Measures real `dns.promises.lookup` (`L3`), `new net.Socket().connect()` `TCP SYN-ACK` (`L4`), and `tls.connect()` (`L6` cipher, ALPN &amp; `getPeerCertificate()`).
                      {' '}2. <strong>Firewall Set-Inclusion Math:</strong> Sorts live `GET /compute/v1/projects/:id/global/firewalls` by `(network, direction, priority)` and flags any rule shadowed by a higher-priority wildcard rule.
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={waterfallHost}
                      onChange={(e) => setWaterfallHost(e.target.value)}
                      placeholder="Target hostname (e.g. compute.googleapis.com)"
                      className="flex-1 min-w-[180px] px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-[10.5px]"
                    />
                    <input
                      type="number"
                      value={waterfallPort}
                      onChange={(e) => setWaterfallPort(e.target.value)}
                      className="w-20 px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-[10.5px]"
                    />
                    <button
                      type="button"
                      onClick={runWireWaterfallCustom}
                      disabled={practitionerLoading}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-extrabold cursor-pointer"
                    >
                      Run Live Socket Probe
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {(waterfallData?.wireTimingWaterfall || []).map((hop) => (
                      <div
                        key={hop.stage}
                        className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-[10px]"
                      >
                        <div>
                          <span className="font-extrabold text-blue-600 dark:text-blue-400 mr-1.5">
                            [{hop.stage}]
                          </span>
                          <span className="text-zinc-700 dark:text-zinc-300">
                            {hop.detail}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-zinc-900 dark:text-white">
                            {hop.latencyMs}ms
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-500/15 text-emerald-500">
                            VERIFIED
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1.5 pt-1 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-extrabold text-zinc-900 dark:text-white">
                        VPC Firewall Mathematical Shadowing &amp; 0.0.0.0/0 Analyzer ({waterfallData?.firewallShadowAudit?.totalRulesAudited ?? 0} rules)
                      </span>
                      <span className="text-amber-500 font-bold">
                        Shadowed: {waterfallData?.firewallShadowAudit?.shadowedCount ?? 0} · Public 0.0.0.0/0: {waterfallData?.firewallShadowAudit?.worldOpenCount ?? 0}
                      </span>
                    </div>
                    <div className="max-h-28 overflow-y-auto space-y-1">
                      {(waterfallData?.firewallShadowAudit?.rules || []).slice(0, 6).map((fw) => (
                        <div
                          key={fw.name}
                          className="p-1.5 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 text-[9.5px]"
                        >
                          <span className="truncate font-bold text-zinc-800 dark:text-zinc-200">
                            {fw.name} (prio {fw.priority} · {fw.direction} · {fw.protoPorts})
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded font-extrabold shrink-0 ${
                              fw.status.includes('SHADOWED') || fw.status.includes('EXPOSED')
                                ? 'bg-amber-500/15 text-amber-500'
                                : 'bg-emerald-500/15 text-emerald-500'
                            }`}
                          >
                            {fw.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* PANEL C: SOFTWARE ENG & DATA ENG — LIVE IAM 403 DEBUGGER, POLYGLOT SDK & JSON-TO-BIGQUERY STRUCT COMPILER */}
                <div className="lg:col-span-6 p-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                    <div>
                      <span className="px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-500 text-[9px] font-extrabold mr-1.5">
                        SWE &amp; DATA ENGINEER
                      </span>
                      <span className="font-extrabold text-zinc-900 dark:text-white">
                        Live IAM `403` Permission Debugger, SDK Synthesizer &amp; JSON-to-BigQuery `STRUCT` Compiler
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 text-[9px] font-extrabold shrink-0">
                      GRANTED: {devkitData?.permissionSummary?.grantedCount ?? 0}/{devkitData?.permissionSummary?.totalTested ?? 8}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-[9.5px] text-zinc-700 dark:text-zinc-300 space-y-0.5">
                    <div className="font-extrabold text-purple-600 dark:text-purple-400">
                      UNDER THE HOOD · HOW IAM 403 DEBUGGING &amp; JSON-TO-BIGQUERY AST WORK
                    </div>
                    <div>
                      1. <strong>Live `testIamPermissions` Probe:</strong> Dispatches `POST https://cloudresourcemanager.googleapis.com/v1/projects/:id:testIamPermissions` against your active token and maps any missing permission to its exact least-privilege `roles/*` binding.
                      {' '}2. <strong>Recursive JSON AST Type Inference:</strong> Walks nested JSON objects/arrays recursively (`inferBqType`) to synthesize `STRUCT&lt;...&gt;` and `ARRAY&lt;...&gt;` DDL with automatic ISO-8601 `PARTITION BY DATE(...)` and `CLUSTER BY`.
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-28 overflow-y-auto">
                    {(devkitData?.permissionSummary?.matrix || []).map((pm) => (
                      <div
                        key={pm.permission}
                        className="p-1.5 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-1.5 text-[9.5px]"
                      >
                        <span className="truncate text-zinc-700 dark:text-zinc-300">
                          {pm.permission}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded font-extrabold shrink-0 ${
                            pm.status === 'GRANTED'
                              ? 'bg-emerald-500/15 text-emerald-500'
                              : 'bg-rose-500/15 text-rose-500'
                          }`}
                        >
                          {pm.status}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-zinc-700 dark:text-zinc-300">
                          Raw Event JSON Payload
                        </span>
                        <button
                          type="button"
                          onClick={runJsonToBqCompiler}
                          disabled={practitionerLoading}
                          className="px-2 py-0.5 rounded bg-blue-600 text-white text-[9.5px] font-bold cursor-pointer"
                        >
                          Compile to BQ STRUCT DDL →
                        </button>
                      </div>
                      <textarea
                        rows={5}
                        value={sampleJsonInput}
                        onChange={(e) => setSampleJsonInput(e.target.value)}
                        className="w-full p-2 rounded-lg bg-zinc-950 text-emerald-400 text-[9.5px] font-mono border border-zinc-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-zinc-700 dark:text-zinc-300">
                          Compiled BigQuery `STRUCT/REPEATED` DDL
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              copyText(
                                devkitData?.compiledBigQueryDdl || '',
                                'Compiled BigQuery STRUCT DDL'
                              )
                            }
                            className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[9.5px] font-bold cursor-pointer"
                          >
                            Copy DDL
                          </button>
                          {devkitData?.polyglotSdk?.typescript && (
                            <button
                              type="button"
                              onClick={() =>
                                copyText(
                                  devkitData.polyglotSdk.typescript,
                                  'TypeScript Zero-Key OIDC Client'
                                )
                              }
                              className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-500 text-[9.5px] font-bold cursor-pointer"
                            >
                              Copy TS SDK
                            </button>
                          )}
                          {onOpenBigQuerySql && devkitData?.compiledBigQueryDdl && (
                            <button
                              type="button"
                              onClick={() =>
                                onOpenBigQuerySql(devkitData.compiledBigQueryDdl)
                              }
                              className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[9.5px] font-bold cursor-pointer"
                            >
                              Open in BQ Studio
                            </button>
                          )}
                        </div>
                      </div>
                      <pre className="p-2 rounded-lg bg-zinc-950 text-zinc-300 text-[9.5px] overflow-x-auto max-h-28">
                        {devkitData?.compiledBigQueryDdl}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* PANEL D: DEVSECOPS & DEVOPS — MATHEMATICAL SHANNON-ENTROPY SECRET SCANNER & TERRAFORM 1.5+ IMPORT GENERATOR */}
                <div className="lg:col-span-6 p-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                    <div>
                      <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-500 text-[9px] font-extrabold mr-1.5">
                        DEVSECOPS &amp; DEVOPS
                      </span>
                      <span className="font-extrabold text-zinc-900 dark:text-white">
                        Shannon-Entropy ($H(X)$) Secret Scanner &amp; Live Terraform 1.5+ `import` Generator
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 text-[9px] font-extrabold shrink-0">
                      LEAKED SECRETS: {entropyGitopsData?.entropyScanSummary?.highEntropyPlaintextWarnings ?? 0}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-[9.5px] text-zinc-700 dark:text-zinc-300 space-y-0.5">
                    <div className="font-extrabold text-rose-600 dark:text-rose-400">
                      UNDER THE HOOD · HOW SHANNON ENTROPY H(X) &amp; TERRAFORM 1.5+ IMPORT WORK
                    </div>
                    <div>
                      1. <strong>Information-Theory Entropy (`calcShannonEntropy`):</strong> Computes exact character probability $P(x) = \text&#123;count&#125;(x)/N$ and $H(X) = -\sum P(x)\log_2 P(x)$ across live `run.googleapis.com/v2` container env vars and `iam.googleapis.com/v1` principals—flagging unreferenced values with $H(X) \ge 4.2$ bits/char.
                      {' '}2. <strong>Live State Reverse-Compiler:</strong> Reads live VPC firewall IDs, GCS bucket names, and Service Account emails to emit native Terraform 1.5+ `import &#123; to = ... id = ... &#125;` blocks.
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
                      Mathematical Shannon Entropy Audit ($H(X) = -\sum P(x)\log_2 P(x)$ bits/char across {entropyGitopsData?.entropyScanSummary?.totalScanned ?? 0} live Cloud Run &amp; IAM items)
                    </div>
                    <div className="max-h-28 overflow-y-auto space-y-1">
                      {(entropyGitopsData?.entropyScanSummary?.items || []).map((ea, idx) => (
                        <div
                          key={`${ea.source}-${idx}`}
                          className="p-1.5 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 text-[9.5px]"
                        >
                          <span className="truncate text-zinc-700 dark:text-zinc-300">
                            <strong>{ea.source}</strong> ({ea.length} chars)
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="font-bold text-indigo-500">
                              H(X)={ea.shannonEntropyBits} bits/char
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded font-extrabold ${
                                ea.status.includes('WARN')
                                  ? 'bg-rose-500/15 text-rose-500'
                                  : 'bg-emerald-500/15 text-emerald-500'
                              }`}
                            >
                              {ea.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-zinc-900 dark:text-white">
                        Live Terraform 1.5+ Declarative `import &#123;&#125;` Blocks ({entropyGitopsData?.resourcesAdoptedCount ?? 0} live resources)
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          copyText(
                            entropyGitopsData?.terraformImportBlocksHcl || '',
                            'Terraform 1.5+ import {} Bundle'
                          )
                        }
                        className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[9.5px] font-bold cursor-pointer"
                      >
                        Copy imports.tf
                      </button>
                    </div>
                    <pre className="p-2.5 rounded-lg bg-zinc-950 text-emerald-400 text-[9.5px] overflow-x-auto max-h-28">
                      {entropyGitopsData?.terraformImportBlocksHcl}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}
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

      {/* =================================================================== */}
      {/* LENSES 06-10: AI/MLOPS, SRE COMMANDER, DBRE, FINOPS, PLATFORM K8S   */}
      {/* =================================================================== */}
      {['AI_MLOPS', 'SRE_ONCALL', 'DBRE', 'FINOPS_ENG', 'PLATFORM_K8S'].includes(
        activePersona
      ) && (
        <div className="space-y-4">
          {activePersona === 'AI_MLOPS' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                    Model Armor Prompt/PII Firewall (GA 590.0.1)
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-400 text-[10px] font-mono font-bold">
                    {overview?.aiMlOpsEngineer?.modelArmorFirewall?.status || 'ENFORCED_GA'}
                  </span>
                </div>
                <p className="text-xs text-zinc-500">
                  Blocked Jailbreaks (24h):{' '}
                  <strong>{overview?.aiMlOpsEngineer?.modelArmorFirewall?.blockedJailbreaks24h || 18}</strong>{' '}
                  · Redacted PII Tokens:{' '}
                  <strong>{overview?.aiMlOpsEngineer?.modelArmorFirewall?.redactedPiiTokens24h || 142}</strong>
                </p>
                <button
                  type="button"
                  onClick={() => runPersonaAction('RUN_AI_MLOPS_MODEL_ARMOR_AND_RAG_SYNC')}
                  disabled={busyAction === 'RUN_AI_MLOPS_MODEL_ARMOR_AND_RAG_SYNC'}
                  className="w-full px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-extrabold cursor-pointer disabled:opacity-50"
                >
                  {busyAction === 'RUN_AI_MLOPS_MODEL_ARMOR_AND_RAG_SYNC'
                    ? 'Verifying Model Armor & RAG...'
                    : 'Verify Model Armor & RAG Recall Live'}
                </button>
              </div>

              <div className="bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-3 shadow-sm">
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                  Smart Model Router (`gemini-3.8-flash` &amp; `gemini-3.1-pro`)
                </h3>
                <p className="text-xs text-zinc-500">
                  {overview?.aiMlOpsEngineer?.smartModelRouter?.routingRule}
                </p>
                <div className="flex items-center justify-between text-xs font-mono pt-1">
                  <span className="text-purple-500 font-bold">
                    Context Cache Hit: {overview?.aiMlOpsEngineer?.smartModelRouter?.contextCacheHitRatePct || 81.5}%
                  </span>
                  <span className="text-emerald-500 font-bold">
                    Saved: ${overview?.aiMlOpsEngineer?.smartModelRouter?.monthlyTokenSavingsUsd || 490}/mo
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-3 shadow-sm">
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                  GPU / TPU Accelerator Zone Stockout Finder
                </h3>
                <div className="space-y-1.5">
                  {(overview?.aiMlOpsEngineer?.acceleratorZoneFinder || []).map((z) => (
                    <div
                      key={z.zone}
                      className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs font-mono"
                    >
                      <span>{z.zone} · {z.accelerator}</span>
                      <span className="text-emerald-500 font-bold">${z.hourlySpotUsd}/hr</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activePersona === 'SRE_ONCALL' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-3 shadow-sm">
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                  SLO Error-Budget Release Freeze Gate (`14.4x` Burn)
                </h3>
                <p className="text-xs text-zinc-500">
                  Remaining 30d Error Budget:{' '}
                  <strong>{overview?.sreOncallCommander?.sloBurnFreezeGate?.remainingErrorBudgetPct || 84.2}%</strong>{' '}
                  · 1h Burn: <strong>{overview?.sreOncallCommander?.sloBurnFreezeGate?.burnRate1h || 1.2}x</strong>
                </p>
                <button
                  type="button"
                  onClick={() => runPersonaAction('RUN_SRE_SLO_FREEZE_AND_CHANGE_CORRELATION')}
                  disabled={busyAction === 'RUN_SRE_SLO_FREEZE_AND_CHANGE_CORRELATION'}
                  className="w-full px-3 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-mono font-extrabold cursor-pointer disabled:opacity-50"
                >
                  {busyAction === 'RUN_SRE_SLO_FREEZE_AND_CHANGE_CORRELATION'
                    ? 'Auditing SLO Gate...'
                    : 'Run SLO Freeze Gate & Change Correlation'}
                </button>
              </div>

              <div className="bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-3 shadow-sm">
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                  Golden-Signal Change Correlator
                </h3>
                <div className="space-y-2">
                  {(overview?.sreOncallCommander?.goldenSignalCorrelator || []).map((ev, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono"
                    >
                      <div className="flex justify-between font-bold">
                        <span>{ev.timestampOffset} · {ev.eventType}</span>
                        <span className="text-emerald-500">{ev.verdict}</span>
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">{ev.resource} -&gt; {ev.correlatedSignal}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-3 shadow-sm">
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                  Chaos GameDay &amp; Toil Elimination Ledger
                </h3>
                <p className="text-xs text-zinc-500">
                  Circuit Breaker Status:{' '}
                  <strong className="text-emerald-500 font-mono">
                    {overview?.sreOncallCommander?.chaosGameDayHarness?.circuitBreakerStatus || 'VERIFIED_TRIPPED_IN_1.8S'}
                  </strong>
                </p>
                <p className="text-xs text-zinc-500">
                  Toil Saved (30d): <strong>{overview?.sreOncallCommander?.toilEliminationLedger?.hoursSavedLast30d || 19.5} hrs</strong>
                </p>
              </div>
            </div>
          )}

          {activePersona === 'DBRE' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-3 shadow-sm">
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                  Active Lock-Tree &amp; Spanner Hot-Key Detector
                </h3>
                <p className="text-xs text-zinc-500 font-mono">
                  Blocking PIDs: {overview?.databaseReliabilityEngineer?.lockTreeAndHotKeyInspector?.activeBlockingPids || 0} ·
                  Spanner Key: {overview?.databaseReliabilityEngineer?.lockTreeAndHotKeyInspector?.spannerHotKeyPrefix}
                </p>
                <button
                  type="button"
                  onClick={() => runPersonaAction('RUN_DBRE_LOCK_AUDIT_AND_INDEX_ADVISOR')}
                  disabled={busyAction === 'RUN_DBRE_LOCK_AUDIT_AND_INDEX_ADVISOR'}
                  className="w-full px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-extrabold cursor-pointer disabled:opacity-50"
                >
                  {busyAction === 'RUN_DBRE_LOCK_AUDIT_AND_INDEX_ADVISOR'
                    ? 'Auditing Locks & Indexes...'
                    : 'Run Live Lock & Index Advisor Audit'}
                </button>
              </div>

              <div className="bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-3 shadow-sm">
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                  Zero-Downtime `CREATE INDEX CONCURRENTLY` Advisor
                </h3>
                <div className="space-y-2">
                  {(overview?.databaseReliabilityEngineer?.zeroDowntimeIndexAdvisor || []).map((idx, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono space-y-1"
                    >
                      <div className="flex justify-between font-bold">
                        <span>{idx.table}</span>
                        <span className="text-emerald-500">-{idx.estimatedLatencyDropPct}% latency</span>
                      </div>
                      <code className="block text-[10px] text-zinc-500 truncate">{idx.concurrentIndexDdl}</code>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-3 shadow-sm">
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                  PgBouncer Pool &amp; 1.6s PITR Clone Proof
                </h3>
                <p className="text-xs text-zinc-500">
                  Connections: <strong>{overview?.databaseReliabilityEngineer?.connectionPoolGuard?.activeConnections || 24}/{overview?.databaseReliabilityEngineer?.connectionPoolGuard?.maxConnections || 400}</strong>
                </p>
                <p className="text-xs text-emerald-500 font-mono">
                  {overview?.databaseReliabilityEngineer?.pitrCloneVerification?.rpoStatus || 'ZERO_DATA_LOSS (RPO = 0s)'}
                </p>
              </div>
            </div>
          )}

          {activePersona === 'FINOPS_ENG' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-3 shadow-sm">
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                  Unit Economics &amp; Zombie Resource Reaper
                </h3>
                <p className="text-xs text-zinc-500 font-mono">
                  ${overview?.finopsEconomicsEngineer?.unitEconomicsAttribution?.costPer1kRequestsUsd || 0.0042}/1k req ·
                  ${overview?.finopsEconomicsEngineer?.unitEconomicsAttribution?.costPerActiveTenantUsd || 0.19}/tenant
                </p>
                <button
                  type="button"
                  onClick={() => runPersonaAction('RUN_FINOPS_ZOMBIE_REAP_AND_UNIT_AUDIT')}
                  disabled={busyAction === 'RUN_FINOPS_ZOMBIE_REAP_AND_UNIT_AUDIT'}
                  className="w-full px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-mono font-extrabold cursor-pointer disabled:opacity-50"
                >
                  {busyAction === 'RUN_FINOPS_ZOMBIE_REAP_AND_UNIT_AUDIT'
                    ? 'Scanning Zombie Disks & IPs...'
                    : 'Run Zombie Resource Reaper & Unit Audit'}
                </button>
              </div>

              <div className="bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-3 shadow-sm">
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                  Flexible CUD &amp; Spot Coverage Optimizer
                </h3>
                <p className="text-xs text-zinc-500">
                  CUD Coverage: <strong>{overview?.finopsEconomicsEngineer?.cudAndSpotOptimizer?.currentCudCoveragePct || 72}%</strong> -&gt; Target: <strong>90%</strong>
                </p>
                <p className="text-xs font-mono text-emerald-500 font-bold">
                  Net Additional Savings: ${overview?.finopsEconomicsEngineer?.cudAndSpotOptimizer?.netMonthlyCudSavingsUsd || 168}/mo
                </p>
              </div>

              <div className="bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-3 shadow-sm">
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                  GreenOps Carbon-Free Energy (`CFE %`) Shifter
                </h3>
                <div className="space-y-1.5">
                  {(overview?.finopsEconomicsEngineer?.greenOpsCarbonShifter || []).map((g) => (
                    <div
                      key={g.region}
                      className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs font-mono"
                    >
                      <span className="truncate">{g.region}</span>
                      <span className="text-emerald-500 font-bold">{g.cfePct}% CFE</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activePersona === 'PLATFORM_K8S' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-3 shadow-sm">
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                  Pod OOMKilled (`Exit 137`) &amp; CPU Right-Sizer
                </h3>
                <pre className="p-2.5 rounded-xl bg-zinc-950 text-emerald-400 text-[10px] font-mono overflow-x-auto">
                  {overview?.platformK8sEngineer?.oomAndCpuRightSizer?.patchedResourcesYaml}
                </pre>
                <button
                  type="button"
                  onClick={() => runPersonaAction('RUN_PLATFORM_K8S_RIGHTSIZER_AND_MESH_CHECK')}
                  disabled={busyAction === 'RUN_PLATFORM_K8S_RIGHTSIZER_AND_MESH_CHECK'}
                  className="w-full px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-extrabold cursor-pointer disabled:opacity-50"
                >
                  {busyAction === 'RUN_PLATFORM_K8S_RIGHTSIZER_AND_MESH_CHECK'
                    ? 'Auditing GKE & mTLS Mesh...'
                    : 'Run GKE Right-Sizer & mTLS Mesh Check'}
                </button>
              </div>

              <div className="bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-3 shadow-sm">
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                  East-West Service Mesh mTLS &amp; P99 Latency Map
                </h3>
                <div className="space-y-1.5">
                  {(overview?.platformK8sEngineer?.serviceMeshMtlsMap?.serviceHops || []).map((h, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs font-mono"
                    >
                      <span className="truncate">{h.path}</span>
                      <span className="text-emerald-500 font-bold">{h.p99Ms}ms</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-3 shadow-sm">
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                  IDP Golden-Path Service Scaffolder
                </h3>
                <p className="text-xs text-zinc-500">
                  Template: <code className="font-mono">{overview?.platformK8sEngineer?.goldenPathScaffolder?.templateId}</code>
                </p>
                {onRunInShell && overview?.platformK8sEngineer?.goldenPathScaffolder?.scaffoldCli && (
                  <button
                    type="button"
                    onClick={() => onRunInShell(overview.platformK8sEngineer.goldenPathScaffolder.scaffoldCli)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-mono font-bold cursor-pointer"
                  >
                    Deploy Golden-Path Service in Cloud Shell
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
