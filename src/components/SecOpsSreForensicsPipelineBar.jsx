import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  Shield,
  ShieldAlert,
  KeyRound,
  FileSearch,
  Zap,
  Activity,
  Trash2,
  ArrowRight,
  Terminal,
  Copy,
  Check,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  FileCode2,
} from 'lucide-react';

const STAGE_ICONS = {
  STAGE_1_IAM_KEY_HYGIENE: KeyRound,
  STAGE_2_PERIMETER_TOXIC_GRAPH: ShieldAlert,
  STAGE_3_AUDIT_CHRONO_LOGS: FileSearch,
  STAGE_4_SOAR_QUARANTINE: Zap,
  STAGE_5_SRE_SLO_BURN_GATE: Activity,
  STAGE_6_RECYCLE_DRIFT_VAULT: Trash2,
};

const STUDIO_TAB_LABELS = {
  SOVEREIGN_STUDIO: 'IAM, Secret Vault & Time-Machine Studio',
  CLOUD_SOC: '20-Pillar Autonomous Cloud SOC',
  VPC_NETWORKS: 'VPC & Firewall Studio',
  LOGS_SHELL: 'Cloud Logging & Shell Studio',
  SRE_WAR_ROOM: '12-Pillar SRE War-Room',
  CLOUD_RUN: 'Cloud Run Serverless Studio',
  RECYCLE_BIN: '30-Day Cloud Recycle Bin',
};

function parseMermaidFlowchartLr(dsl = '') {
  const lines = String(dsl || '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('%%') && !l.startsWith('flowchart'));

  const subgraphs = [];
  const nodeMap = new Map();
  const edges = [];
  let currentSg = null;

  for (const line of lines) {
    const sgMatch = line.match(/^subgraph\s+([A-Za-z0-9_]+)(?:\["([^"]+)"\])?/);
    if (sgMatch) {
      currentSg = {
        id: sgMatch[1],
        label: sgMatch[2] || sgMatch[1],
        nodes: [],
      };
      subgraphs.push(currentSg);
      continue;
    }
    if (line === 'end') {
      currentSg = null;
      continue;
    }

    const edgeMatch = line.match(
      /^([A-Za-z0-9_]+)\s*-->(?:\|"([^"]+)"\|)?\s*([A-Za-z0-9_]+)$/
    );
    if (edgeMatch) {
      edges.push({
        from: edgeMatch[1],
        to: edgeMatch[3],
        label: edgeMatch[2] || '',
      });
      continue;
    }

    const nodeMatch = line.match(/^([A-Za-z0-9_]+)\["([^"]+)"\]$/);
    if (nodeMatch) {
      const nodeObj = {
        id: nodeMatch[1],
        label: nodeMatch[2],
      };
      nodeMap.set(nodeObj.id, nodeObj);
      if (currentSg) {
        currentSg.nodes.push(nodeObj);
      } else {
        let defaultSg = subgraphs.find((s) => s.id === '__DEFAULT__');
        if (!defaultSg) {
          defaultSg = { id: '__DEFAULT__', label: 'SecOps Nodes', nodes: [] };
          subgraphs.push(defaultSg);
        }
        defaultSg.nodes.push(nodeObj);
      }
    }
  }

  return { subgraphs, edges, nodeMap };
}

function inferTargetTabFromNodeId(nodeId = '') {
  const id = String(nodeId).toUpperCase();
  if (id.startsWith('ROLE') || id.startsWith('SA')) {
    return { targetTab: 'SOVEREIGN_STUDIO', subTab: 'IAM_SURGEON' };
  }
  if (id.startsWith('SEC')) {
    return { targetTab: 'SOVEREIGN_STUDIO', subTab: 'SECRETS_KMS_WAF' };
  }
  if (id.startsWith('FW') || id.startsWith('VPC') || id === 'PUB' || id === 'IAP') {
    return { targetTab: 'VPC_NETWORKS' };
  }
  if (id.startsWith('ACT') || id.startsWith('LOG')) {
    return { targetTab: 'LOGS_SHELL' };
  }
  return null;
}

function SecOpsMermaidFlowchartSvg({ dsl, onNodeClick }) {
  const { subgraphs, edges } = parseMermaidFlowchartLr(dsl);
  if (!subgraphs.length || !edges.length) return null;

  const colWidth = 250;
  const colGap = 54;
  const nodeWidth = 218;
  const nodeHeight = 46;
  const nodeGapY = 14;
  const padX = 20;
  const padY = 24;

  const positionedNodes = new Map();
  let maxSvgHeight = 170;

  const sgLayouts = subgraphs.map((sg, colIdx) => {
    const sgX = padX + colIdx * (colWidth + colGap);
    const sgY = padY;
    const nodes = sg.nodes.map((n, rowIdx) => {
      const nx = sgX + 16;
      const ny = sgY + 38 + rowIdx * (nodeHeight + nodeGapY);
      const pos = { ...n, x: nx, y: ny, w: nodeWidth, h: nodeHeight };
      positionedNodes.set(n.id, pos);
      return pos;
    });
    const sgH = Math.max(115, 48 + nodes.length * (nodeHeight + nodeGapY));
    if (sgY + sgH + padY > maxSvgHeight) {
      maxSvgHeight = sgY + sgH + padY;
    }
    return { ...sg, x: sgX, y: sgY, w: colWidth, h: sgH, nodes };
  });

  const totalSvgWidth = Math.max(
    680,
    padX * 2 + subgraphs.length * colWidth + Math.max(0, subgraphs.length - 1) * colGap
  );

  return (
    <div className="overflow-x-auto rounded-xl bg-zinc-950 border border-zinc-800 p-3">
      <svg
        viewBox={`0 0 ${totalSvgWidth} ${maxSvgHeight}`}
        className="w-full h-auto min-w-[600px]"
      >
        <defs>
          <marker
            id="secops-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
          </marker>
        </defs>

        {sgLayouts.map((sg) => (
          <g key={sg.id}>
            <rect
              x={sg.x}
              y={sg.y}
              width={sg.w}
              height={sg.h}
              rx="12"
              fill="rgba(24, 24, 27, 0.85)"
              stroke="rgba(244, 63, 94, 0.35)"
              strokeDasharray="4 3"
            />
            <text
              x={sg.x + 12}
              y={sg.y + 20}
              fill="#fda4af"
              fontSize="10"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontWeight="700"
            >
              {sg.label.slice(0, 32)}
            </text>
          </g>
        ))}

        {edges.map((e, idx) => {
          const from = positionedNodes.get(e.from);
          const to = positionedNodes.get(e.to);
          if (!from || !to) return null;
          const x1 = from.x + from.w;
          const y1 = from.y + from.h / 2;
          const x2 = to.x;
          const y2 = to.y + to.h / 2;
          const cx1 = x1 + (x2 - x1) * 0.45;
          const cx2 = x1 + (x2 - x1) * 0.55;
          const d = `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`;
          return (
            <g key={`${e.from}-${e.to}-${idx}`}>
              <path
                d={d}
                fill="none"
                stroke="#f43f5e"
                strokeWidth="1.75"
                markerEnd="url(#secops-arrow)"
                opacity="0.85"
              />
              {e.label && (
                <text
                  x={(x1 + x2) / 2}
                  y={(y1 + y2) / 2 - 6}
                  textAnchor="middle"
                  fill="#fecdd3"
                  fontSize="8.5"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                >
                  {e.label}
                </text>
              )}
            </g>
          );
        })}

        {sgLayouts.map((sg) =>
          sg.nodes.map((node) => {
            const target = inferTargetTabFromNodeId(node.id);
            const isAlert =
              node.id === 'PUB' || node.label.includes('0.0.0.0/0');
            return (
              <g
                key={node.id}
                onClick={() => {
                  if (target && onNodeClick) onNodeClick(target);
                }}
                style={{ cursor: target ? 'pointer' : 'default' }}
              >
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.w}
                  height={node.h}
                  rx="8"
                  fill={isAlert ? 'rgba(127, 29, 29, 0.55)' : '#18181b'}
                  stroke={isAlert ? '#f87171' : '#3f3f46'}
                  strokeWidth="1.25"
                />
                <text
                  x={node.x + 10}
                  y={node.y + 19}
                  fill="#f8fafc"
                  fontSize="10.5"
                  fontFamily="ui-sans-serif, system-ui, sans-serif"
                  fontWeight="700"
                >
                  {node.label.slice(0, 29)}
                </text>
                <text
                  x={node.x + 10}
                  y={node.y + 34}
                  fill="#a1a1aa"
                  fontSize="8.8"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                >
                  {target
                    ? `Click -> ${STUDIO_TAB_LABELS[target.targetTab] || target.targetTab}`
                    : node.id}
                </text>
              </g>
            );
          })
        )}
      </svg>
    </div>
  );
}

export default function SecOpsSreForensicsPipelineBar({
  projectId,
  activeTab,
  onSelectTab,
  onRunInShell,
}) {
  const containerRef = useRef(null);
  const [blueprint, setBlueprint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [playbookDrawerOpen, setPlaybookDrawerOpen] = useState(false);
  const [selectedArtifactTab, setSelectedArtifactTab] = useState('iamZeroTrustTf'); // 'iamZeroTrustTf' | 'soarQuarantineSh' | 'sreSloBurnAlertYaml'
  const [selectedStageId, setSelectedStageId] = useState(null);
  const [mermaidExpanded, setMermaidExpanded] = useState(false);
  const [mermaidViewMode, setMermaidViewMode] = useState('VISUAL');
  const [copiedKey, setCopiedKey] = useState(null);

  const fetchBlueprint = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/secops-sre-pipeline/blueprint`,
        { timeout: 10000 }
      );
      if (res.data && Array.isArray(res.data.stages)) {
        setBlueprint(res.data);
      }
    } catch {
      // Non-blocking fallback
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchBlueprint();
  }, [fetchBlueprint]);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleDownloadArtifact = (filename, content) => {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const stages = blueprint?.stages || [
    {
      id: 'STAGE_1_IAM_KEY_HYGIENE',
      stepNumber: 1,
      shortTitle: 'IAM & Secret Vault',
      targetTab: 'SOVEREIGN_STUDIO',
      targetSubTab: 'IAM_SURGEON',
      secondaryTab: 'SOVEREIGN_STUDIO',
      secondarySubTab: 'SECRETS_KMS_WAF',
      secondaryLabel: 'Secret Manager & KMS Vault',
      status: 'OPTIMAL',
      metricBadge: 'IAM + Secrets',
      summary: 'Service Account key hygiene, least-privilege IAM roles & Secret Manager.',
      cliCmd: `gcloud projects get-iam-policy ${projectId}`,
      mermaidDsl: null,
    },
    {
      id: 'STAGE_2_PERIMETER_TOXIC_GRAPH',
      stepNumber: 2,
      shortTitle: 'Perimeter & Toxic Graph',
      targetTab: 'CLOUD_SOC',
      secondaryTab: 'VPC_NETWORKS',
      secondaryLabel: 'VPC & Firewall Studio',
      status: 'OPTIMAL',
      metricBadge: '0.0.0.0/0 & IAP',
      summary: 'Firewall ingress posture & Toxic Combinations Attack-Path Graph.',
      cliCmd: `gcloud compute firewall-rules list --project=${projectId}`,
      mermaidDsl: null,
    },
    {
      id: 'STAGE_3_AUDIT_CHRONO_LOGS',
      stepNumber: 3,
      shortTitle: 'Cloud Audit & Logs',
      targetTab: 'LOGS_SHELL',
      secondaryTab: 'CLOUD_SOC',
      secondaryLabel: 'Cloud SOC Kill-Chains',
      status: 'OPTIMAL',
      metricBadge: '400d Free Audit',
      summary: '400-day Cloud Audit Admin Activity trail & Neural Chrono-Log explorer.',
      cliCmd: `gcloud logging read 'logName:"cloudaudit.googleapis.com"' --project=${projectId} --limit=10`,
      mermaidDsl: null,
    },
    {
      id: 'STAGE_4_SOAR_QUARANTINE',
      stepNumber: 4,
      shortTitle: 'SOAR & Active Defense',
      targetTab: 'CLOUD_SOC',
      secondaryTab: 'SOVEREIGN_STUDIO',
      secondarySubTab: 'IAM_SURGEON',
      secondaryLabel: 'SA Key Kill-Switch',
      status: 'OPTIMAL',
      metricBadge: 'IAP Lock + Deny',
      summary: 'Automated SOAR /32 quarantine, Cloud IAP bastion lock & SA key revocation.',
      cliCmd: `gcloud compute firewall-rules list --project=${projectId} --filter="direction=INGRESS"`,
      mermaidDsl: null,
    },
    {
      id: 'STAGE_5_SRE_SLO_BURN_GATE',
      stepNumber: 5,
      shortTitle: 'SRE 14.4x Burn Gate',
      targetTab: 'SRE_WAR_ROOM',
      secondaryTab: 'CLOUD_RUN',
      secondaryLabel: 'Cloud Run Traffic Rollback',
      status: 'OPTIMAL',
      metricBadge: '14.4x / 6x SLO',
      summary: 'Multi-window error-budget burn gate, synthetic prober & canary rollback.',
      cliCmd: `gcloud run services list --project=${projectId}`,
      mermaidDsl: null,
    },
    {
      id: 'STAGE_6_RECYCLE_DRIFT_VAULT',
      stepNumber: 6,
      shortTitle: 'Recycle Bin & Time-Machine',
      targetTab: 'RECYCLE_BIN',
      secondaryTab: 'SOVEREIGN_STUDIO',
      secondarySubTab: 'TIME_MACHINE',
      secondaryLabel: 'SHA-256 Drift Time-Machine',
      status: 'OPTIMAL',
      metricBadge: '30d Vault + etag',
      summary: '30-Day Cloud Recycle Bin & cryptographic SHA-256 IAM policy rollback.',
      cliCmd: `gcloud logging read 'protoPayload.methodName=~"(delete|Destroy)"' --project=${projectId} --limit=10`,
      mermaidDsl: null,
    },
  ];

  const homeStage =
    stages.find((s) => s.targetTab === activeTab) ||
    stages.find((s) => s.secondaryTab === activeTab) ||
    stages[0];

  const activeStage =
    (selectedStageId && stages.find((s) => s.id === selectedStageId)) ||
    homeStage;

  // Strict single-stage selection: highlight ONLY the open drawer stage (when drawerOpen)
  // or ONLY the single home stage for the current studio tab.
  const activeHighlightedStageId = drawerOpen ? activeStage?.id : homeStage?.id;

  const activeArtifactContent =
    selectedArtifactTab === 'iamZeroTrustTf'
      ? blueprint?.artifacts?.iamZeroTrustTf
      : selectedArtifactTab === 'soarQuarantineSh'
      ? blueprint?.artifacts?.soarQuarantineSh
      : blueprint?.artifacts?.sreSloBurnAlertYaml;

  const activeArtifactFilename =
    selectedArtifactTab === 'iamZeroTrustTf'
      ? `${projectId}-iam-zero-trust.tf`
      : selectedArtifactTab === 'soarQuarantineSh'
      ? `soar-quarantine-${projectId}.sh`
      : `sre-slo-burn-alert-${projectId}.yaml`;

  return (
    <div
      ref={containerRef}
      data-feature-id="WAVE4_SECOPS_SRE_PIPELINE"
      className="bg-white dark:bg-[#18191b] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-3"
    >
      {/* Top Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-600 to-amber-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Wave 4 · 6-Stage Zero-Trust SecOps, Incident SRE & Forensics Pipeline
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                {blueprint?.counts?.totalSecuritySignals ?? 'Live'} Security & Audit Signals
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              End-to-end detection-to-recovery chain: IAM & Secret Hygiene → Perimeter & Toxic Graph → 400-Day Cloud Audit → SOAR Quarantine → SRE 14.4x Burn Gate → 30-Day Recycle Bin.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setPlaybookDrawerOpen((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              playbookDrawerOpen
                ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>Synthesize SecOps & SOAR Playbooks (`.tf` / `.sh` / `.yaml`)</span>
            {playbookDrawerOpen ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {drawerOpen && (
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
            >
              <span>Close Stage Drawer</span>
            </button>
          )}

          <button
            type="button"
            onClick={fetchBlueprint}
            disabled={loading}
            title="Re-scan live IAM bindings, Service Accounts, Secret Manager, Firewall rules, and Cloud Audit Logs"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync SecOps</span>
          </button>
        </div>
      </div>

      {/* Dedicated SecOps & SOAR Playbook Synthesizer Drawer */}
      {playbookDrawerOpen && (
        <div className="pt-3 border-t border-rose-500/30 bg-rose-500/[0.03] rounded-xl p-3 space-y-3 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-mono font-extrabold uppercase tracking-wider">
                  SecOps, SOAR & SRE Synthesizer
                </span>
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Live Zero-Trust IAM HCL, SOAR Quarantine Script & 14.4x SLO Burn Alert
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Generated directly from live Service Accounts, Firewall Rules, and Cloud Run services in `{projectId}`.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {onSelectTab && (
                <button
                  type="button"
                  onClick={() => onSelectTab('INNOVATION_LAB', 'TERRAFORM')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Full Reverse-Terraform & `imports.tf` Studio ↗</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setPlaybookDrawerOpen(false)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 cursor-pointer"
              >
                Close Playbooks
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setSelectedArtifactTab('iamZeroTrustTf')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                  selectedArtifactTab === 'iamZeroTrustTf'
                    ? 'bg-rose-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                iam_zero_trust.tf (IAM & IAP Bastion HCL)
              </button>
              <button
                type="button"
                onClick={() => setSelectedArtifactTab('soarQuarantineSh')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                  selectedArtifactTab === 'soarQuarantineSh'
                    ? 'bg-rose-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                soar_quarantine.sh (SOAR & Key Audit CLI)
              </button>
              <button
                type="button"
                onClick={() => setSelectedArtifactTab('sreSloBurnAlertYaml')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                  selectedArtifactTab === 'sreSloBurnAlertYaml'
                    ? 'bg-rose-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                sre_slo_burn_alert.yaml (14.4x / 6x Burn Gate)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  handleCopy(activeArtifactContent, selectedArtifactTab)
                }
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
              >
                {copiedKey === selectedArtifactTab ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  handleDownloadArtifact(
                    activeArtifactFilename,
                    activeArtifactContent
                  )
                }
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download {activeArtifactFilename}</span>
              </button>
            </div>
          </div>

          <pre className="bg-zinc-950 text-zinc-100 border border-zinc-800 rounded-xl p-3.5 text-[11px] font-mono overflow-x-auto max-h-72 leading-relaxed">
            {activeArtifactContent || '# Synthesizing live SecOps & SRE playbooks...'}
          </pre>
        </div>
      )}

      {/* 6-Stage Interactive Pipeline Chain */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2">
        {stages.map((stage, idx) => {
          const IconComponent = STAGE_ICONS[stage.id] || Shield;
          const isHighlighted = activeHighlightedStageId === stage.id;
          const isActionRecommended = stage.status === 'ACTION_RECOMMENDED';

          return (
            <div
              key={stage.id}
              onClick={() => {
                if (drawerOpen && activeStage?.id === stage.id) {
                  setDrawerOpen(false);
                } else {
                  setSelectedStageId(stage.id);
                  setDrawerOpen(true);
                }
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedStageId(stage.id);
                  setDrawerOpen(true);
                }
              }}
              className={`group relative rounded-xl p-2.5 border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isHighlighted
                  ? 'bg-rose-50/90 dark:bg-rose-950/35 border-rose-500/60 shadow-sm ring-1 ring-rose-500/30'
                  : 'bg-zinc-50/70 dark:bg-[#202124] hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70 border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-extrabold shrink-0 ${
                      isHighlighted
                        ? 'bg-rose-600 text-white'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {stage.stepNumber || idx + 1}
                  </span>
                  <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {stage.shortTitle}
                  </span>
                </div>
                <IconComponent
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isHighlighted
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200'
                  }`}
                />
              </div>

              <div className="mt-2 flex items-center justify-between gap-1">
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold truncate ${
                    isActionRecommended
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                  }`}
                >
                  {isActionRecommended ? (
                    <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                  )}
                  <span className="truncate">{stage.metricBadge}</span>
                </span>

                {onSelectTab && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const isTabSwitch = Boolean(
                        stage.targetTab && stage.targetTab !== activeTab
                      );
                      if (isTabSwitch || stage.targetSubTab) {
                        onSelectTab(stage.targetTab, stage.targetSubTab);
                      } else {
                        containerRef.current?.nextElementSibling?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'start',
                        });
                      }
                    }}
                    title={`Jump directly to ${
                      STUDIO_TAB_LABELS[stage.targetTab] || stage.shortTitle
                    }`}
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-400 text-[10px] font-mono font-bold transition-colors shrink-0 cursor-pointer"
                  >
                    <span>Go</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Expandable Stage Drawer */}
      {drawerOpen && activeStage && (
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-3 animate-fadeIn">
          <div className="bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                  {activeStage.title || activeStage.shortTitle}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                  {activeStage.metricBadge}
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                {activeStage.summary}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {onSelectTab && (
                <button
                  type="button"
                  onClick={() => {
                    const isTabSwitch = Boolean(
                      activeStage.targetTab && activeStage.targetTab !== activeTab
                    );
                    if (isTabSwitch || activeStage.targetSubTab) {
                      onSelectTab(activeStage.targetTab, activeStage.targetSubTab);
                    } else {
                      containerRef.current?.nextElementSibling?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                      });
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>
                    Open{' '}
                    {STUDIO_TAB_LABELS[activeStage.targetTab] ||
                      activeStage.shortTitle}
                  </span>
                </button>
              )}
              {onSelectTab && activeStage.secondaryTab && (
                <button
                  type="button"
                  onClick={() =>
                    onSelectTab(
                      activeStage.secondaryTab,
                      activeStage.secondarySubTab
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>
                    {activeStage.secondaryLabel ||
                      STUDIO_TAB_LABELS[activeStage.secondaryTab]}
                  </span>
                </button>
              )}
              {onRunInShell && activeStage.cliCmd && (
                <button
                  type="button"
                  onClick={() => onRunInShell(activeStage.cliCmd)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-zinc-700 transition-colors cursor-pointer"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Verify Stage in Cloud Shell</span>
                </button>
              )}
            </div>
          </div>

          {/* Strict Mermaid Guard ("No need to draw if we have nothing to show"): Only render when >= 1 real edge exists */}
          {activeStage.mermaidDsl &&
            parseMermaidFlowchartLr(activeStage.mermaidDsl).edges.length > 0 && (
              <div className="rounded-xl border border-rose-500/25 bg-gradient-to-r from-rose-500/[0.04] via-amber-500/[0.03] to-indigo-500/[0.04] p-3 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div
                    onClick={() => setMermaidExpanded((prev) => !prev)}
                    className="flex items-center gap-2 flex-wrap cursor-pointer select-none"
                  >
                    <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-mono font-extrabold uppercase tracking-wider">
                      Mermaid flowchart LR
                    </span>
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Stage {activeStage.stepNumber} Live Security & Forensic Topology
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setMermaidExpanded((prev) => !prev)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-mono font-bold transition-all cursor-pointer ${
                        mermaidExpanded
                          ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700'
                          : 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm'
                      }`}
                    >
                      <span>
                        {mermaidExpanded
                          ? 'Hide Mermaid Flowchart'
                          : 'Open Interactive Mermaid Flowchart'}
                      </span>
                      {mermaidExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {mermaidExpanded && (
                      <>
                        <button
                          type="button"
                          onClick={() => setMermaidViewMode('VISUAL')}
                          className={`px-2.5 py-1 rounded-md text-[10.5px] font-mono font-bold transition-colors cursor-pointer ${
                            mermaidViewMode === 'VISUAL'
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800'
                          }`}
                        >
                          Visual Flowchart DAG
                        </button>
                        <button
                          type="button"
                          onClick={() => setMermaidViewMode('CODE')}
                          className={`px-2.5 py-1 rounded-md text-[10.5px] font-mono font-bold transition-colors cursor-pointer ${
                            mermaidViewMode === 'CODE'
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800'
                          }`}
                        >
                          Mermaid .mmd Code
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {mermaidExpanded &&
                  (mermaidViewMode === 'CODE' ? (
                    <pre className="bg-zinc-950 text-rose-200 border border-zinc-800 rounded-xl p-3 text-[11px] font-mono overflow-x-auto leading-relaxed">
                      {activeStage.mermaidDsl}
                    </pre>
                  ) : (
                    <SecOpsMermaidFlowchartSvg
                      dsl={activeStage.mermaidDsl}
                      onNodeClick={(target) => {
                        if (onSelectTab && target?.targetTab) {
                          onSelectTab(target.targetTab, target.subTab);
                        }
                      }}
                    />
                  ))}
              </div>
            )}

          {/* Stage Inventory Cards & CLI Verification Bar */}
          <div className="space-y-2.5">
            {Array.isArray(activeStage?.stageItems) &&
              activeStage.stageItems.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {activeStage.stageItems.map((item, idx) => (
                    <div
                      key={`${item.name}-${idx}`}
                      onClick={() => {
                        if (item.openArtifactTab) {
                          setSelectedArtifactTab(item.openArtifactTab);
                          setPlaybookDrawerOpen(true);
                        } else if (onSelectTab && item.targetTab) {
                          const isTabSwitch = item.targetTab !== activeTab;
                          if (isTabSwitch || item.subTab) {
                            onSelectTab(item.targetTab, item.subTab);
                          } else {
                            containerRef.current?.nextElementSibling?.scrollIntoView({
                              behavior: 'smooth',
                              block: 'start',
                            });
                          }
                        }
                      }}
                      className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-rose-500/50 transition-colors cursor-pointer flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-[10px] font-mono uppercase text-rose-600 dark:text-rose-400 font-bold">
                          {item.kind}
                        </div>
                        <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {item.name}
                        </div>
                        <div className="text-[10px] font-mono text-zinc-500 truncate">
                          {item.meta}
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    </div>
                  ))}
                </div>
              )}

            {activeStage?.cliCmd && (
              <div className="bg-zinc-950 text-zinc-100 border border-zinc-800 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                <div className="flex items-center gap-2 min-w-0">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <code className="text-emerald-300 truncate">
                    {activeStage.cliCmd}
                  </code>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(activeStage.cliCmd, `cli-${activeStage.id}`)
                    }
                    className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold cursor-pointer"
                  >
                    {copiedKey === `cli-${activeStage.id}`
                      ? '✓ Copied CLI'
                      : 'Copy CLI'}
                  </button>
                  {activeStage.stepNumber < 6 && (
                    <button
                      type="button"
                      onClick={() => {
                        const nextStage = stages.find(
                          (s) => s.stepNumber === activeStage.stepNumber + 1
                        );
                        if (nextStage) {
                          setSelectedStageId(nextStage.id);
                        }
                      }}
                      className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold cursor-pointer"
                    >
                      Next: Step {activeStage.stepNumber + 1} →
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
