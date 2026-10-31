import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  GitBranch,
  PackageCheck,
  Rocket,
  Zap,
  Cpu,
  FileCode2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Terminal,
  Copy,
  Check,
  Download,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

const STAGE_ICONS = {
  STAGE_1_GITHUB_CLOUD_BUILD: GitBranch,
  STAGE_2_ARTIFACT_REGISTRY_SBOM: PackageCheck,
  STAGE_3_CLOUD_RUN_CANARY: Rocket,
  STAGE_4_FUNCTIONS_EVENTARC: Zap,
  STAGE_5_GKE_AUTOPILOT_FLEET: Cpu,
  STAGE_6_REVERSE_TERRAFORM_ROLLBACK: ShieldCheck,
};

function parseGitOpsMermaidFlowchartLr(dsl = '') {
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
      /^([A-Za-z0-9_]+)\s*-->\|"([^"]+)"\|\s*([A-Za-z0-9_]+)$/
    );
    if (edgeMatch) {
      edges.push({
        from: edgeMatch[1],
        label: edgeMatch[2],
        to: edgeMatch[3],
      });
      continue;
    }

    const nodeMatch = line.match(/^([A-Za-z0-9_]+)\["([^"]+)"\]$/);
    if (nodeMatch) {
      const node = {
        id: nodeMatch[1],
        label: nodeMatch[2],
        subgraphId: currentSg ? currentSg.id : 'DEFAULT',
      };
      nodeMap.set(node.id, node);
      if (currentSg) currentSg.nodes.push(node);
    }
  }

  return { subgraphs, nodeMap, edges };
}

function GitOpsMermaidFlowchartSvg({ dsl, onNodeClick }) {
  const { subgraphs, nodeMap, edges } = parseGitOpsMermaidFlowchartLr(dsl);
  const svgRef = useRef(null);
  const [dragOffsets, setDragOffsets] = useState({});
  const [activeDrag, setActiveDrag] = useState(null);

  useEffect(() => {
    setDragOffsets({});
    setActiveDrag(null);
  }, [dsl]);

  if (!subgraphs.length || !edges.length) return null;

  const colWidth = 265;
  const colGap = 62;
  const padX = 24;
  const padY = 26;
  const nodeH = 44;
  const nodeGapY = 14;
  const sgHeaderH = 34;

  const maxNodes = Math.max(...subgraphs.map((sg) => sg.nodes.length), 1);
  const svgW =
    padX * 2 +
    subgraphs.length * colWidth +
    Math.max(0, subgraphs.length - 1) * colGap;
  const svgH = Math.max(
    185,
    padY * 2 + sgHeaderH + maxNodes * (nodeH + nodeGapY) + 24
  );

  const baseCoords = new Map();
  const sgBoxes = subgraphs.map((sg, colIdx) => {
    const x = padX + colIdx * (colWidth + colGap);
    const y = padY;
    const h =
      sgHeaderH + Math.max(1, sg.nodes.length) * (nodeH + nodeGapY) + 12;
    sg.nodes.forEach((n, rowIdx) => {
      const nx = x + 14;
      const ny = y + sgHeaderH + rowIdx * (nodeH + nodeGapY);
      baseCoords.set(n.id, {
        x: nx,
        y: ny,
        w: colWidth - 28,
        h: nodeH,
        sgId: sg.id,
      });
    });
    return { ...sg, x, y, w: colWidth, h, colIdx };
  });

  const getNodeBox = (nodeId) => {
    const base = baseCoords.get(nodeId);
    if (!base) return null;
    const sgOff = dragOffsets[`sg:${base.sgId}`] || { dx: 0, dy: 0 };
    const nOff = dragOffsets[`node:${nodeId}`] || { dx: 0, dy: 0 };
    const x = base.x + sgOff.dx + nOff.dx;
    const y = base.y + sgOff.dy + nOff.dy;
    return {
      ...base,
      x,
      y,
      cxLeft: x,
      cy: y + base.h / 2,
      cxRight: x + base.w,
    };
  };

  const toSvgPoint = (clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return { x: clientX, y: clientY };
    const rect = svg.getBoundingClientRect();
    const scaleX = svgW / Math.max(1, rect.width);
    const scaleY = svgH / Math.max(1, rect.height);
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e, key, clickPayload = null) => {
    e.stopPropagation();
    const pt = toSvgPoint(e.clientX, e.clientY);
    const existing = dragOffsets[key] || { dx: 0, dy: 0 };
    setActiveDrag({
      key,
      startX: pt.x,
      startY: pt.y,
      origDx: existing.dx,
      origDy: existing.dy,
      moved: false,
      clickPayload,
    });
  };

  const handlePointerMove = (e) => {
    if (!activeDrag) return;
    const pt = toSvgPoint(e.clientX, e.clientY);
    const deltaX = pt.x - activeDrag.startX;
    const deltaY = pt.y - activeDrag.startY;
    const moved =
      activeDrag.moved || Math.hypot(deltaX, deltaY) > 4;
    setActiveDrag((prev) => (prev ? { ...prev, moved } : null));
    setDragOffsets((prev) => ({
      ...prev,
      [activeDrag.key]: {
        dx: activeDrag.origDx + deltaX,
        dy: activeDrag.origDy + deltaY,
      },
    }));
  };

  const handlePointerUp = () => {
    if (activeDrag && !activeDrag.moved && activeDrag.clickPayload && onNodeClick) {
      onNodeClick(activeDrag.clickPayload);
    }
    setActiveDrag(null);
  };

  const inferNodeTarget = (nodeId = '') => {
    if (nodeId.startsWith('GH') || nodeId.startsWith('TR') || nodeId.startsWith('BLD') || nodeId.startsWith('CB')) {
      return { targetTab: 'WAVE9_STUDIO', subTab: 'CLOUD_BUILD_GITHUB' };
    }
    if (nodeId.startsWith('AR') || nodeId.startsWith('PUB') || nodeId.startsWith('ORPH')) {
      return { targetTab: 'WAVE9_STUDIO', subTab: 'SUPPLY_CHAIN_AR' };
    }
    if (nodeId.startsWith('CR') || nodeId.startsWith('REV') || nodeId.startsWith('LB')) {
      return { targetTab: 'CLOUD_RUN' };
    }
    if (
      nodeId.startsWith('FN') ||
      nodeId.startsWith('TOP') ||
      nodeId.startsWith('ETR') ||
      nodeId.startsWith('BUS') ||
      nodeId.startsWith('EARC') ||
      nodeId.startsWith('SUB')
    ) {
      return { targetTab: 'FUNCTIONS_STUDIO' };
    }
    if (nodeId.startsWith('CL') || nodeId.startsWith('CP')) {
      return { targetTab: 'GKE_STUDIO' };
    }
    return null;
  };

  const hasCustomLayout = Object.keys(dragOffsets).length > 0;

  return (
    <div className="relative overflow-x-auto rounded-xl bg-slate-950 border border-slate-800/90 p-2.5 select-none">
      <div className="flex items-center justify-between gap-2 px-1 pb-1.5 text-[10px] font-mono text-slate-400">
        <span>
          Interactive SVG · Drag any node or subgraph header to rearrange · Click node to jump to studio
        </span>
        {hasCustomLayout && (
          <button
            type="button"
            onClick={() => setDragOffsets({})}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold cursor-pointer"
          >
            Reset Layout
          </button>
        )}
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${svgW} ${svgH}`}
        className="w-full h-auto min-w-[660px]"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <defs>
          <marker
            id="gitops-mermaid-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#818cf8" />
          </marker>
        </defs>

        {sgBoxes.map((sg) => {
          const sgOff = dragOffsets[`sg:${sg.id}`] || { dx: 0, dy: 0 };
          const sx = sg.x + sgOff.dx;
          const sy = sg.y + sgOff.dy;
          return (
            <g key={sg.id}>
              <rect
                x={sx}
                y={sy}
                width={sg.w}
                height={sg.h}
                rx="12"
                fill="rgba(30, 41, 59, 0.55)"
                stroke="rgba(99, 102, 241, 0.35)"
                strokeDasharray="4 4"
              />
              <rect
                x={sx}
                y={sy}
                width={sg.w}
                height={26}
                rx="10"
                fill="rgba(99, 102, 241, 0.14)"
                className="cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => handlePointerDown(e, `sg:${sg.id}`)}
              />
              <text
                x={sx + 12}
                y={sy + 17}
                fill="#a5b4fc"
                fontSize="10.5"
                fontWeight="700"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                className="pointer-events-none"
              >
                {sg.label.length > 34 ? `${sg.label.slice(0, 32)}…` : sg.label}
              </text>
            </g>
          );
        })}

        {edges.map((edge, idx) => {
          const from = getNodeBox(edge.from);
          const to = getNodeBox(edge.to);
          if (!from || !to) return null;
          const x1 = from.cxRight;
          const y1 = from.cy;
          const x2 = to.cxLeft;
          const y2 = to.cy;
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;
          const d = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
          return (
            <g key={`${edge.from}-${edge.to}-${idx}`}>
              <path
                d={d}
                fill="none"
                stroke="#818cf8"
                strokeWidth="1.8"
                markerEnd="url(#gitops-mermaid-arrow)"
              />
              {edge.label && (
                <g transform={`translate(${midX}, ${midY - 8})`}>
                  <rect
                    x={-Math.min(76, edge.label.length * 3.1 + 8)}
                    y={-9}
                    width={Math.min(152, edge.label.length * 6.2 + 16)}
                    height={16}
                    rx="5"
                    fill="#0f172a"
                    stroke="rgba(129, 140, 248, 0.45)"
                  />
                  <text
                    x="0"
                    y="2"
                    textAnchor="middle"
                    fill="#e0e7ff"
                    fontSize="9"
                    fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  >
                    {edge.label.length > 24
                      ? `${edge.label.slice(0, 22)}…`
                      : edge.label}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {Array.from(nodeMap.values()).map((n) => {
          const box = getNodeBox(n.id);
          if (!box) return null;
          const clickTarget = inferNodeTarget(n.id);
          return (
            <g
              key={n.id}
              transform={`translate(${box.x}, ${box.y})`}
              className="cursor-grab active:cursor-grabbing"
              onPointerDown={(e) =>
                handlePointerDown(e, `node:${n.id}`, clickTarget)
              }
            >
              <rect
                width={box.w}
                height={box.h}
                rx="8"
                fill="#0f172a"
                stroke="#6366f1"
                strokeWidth="1.4"
              />
              <text
                x="11"
                y="26"
                fill="#f8fafc"
                fontSize="10.5"
                fontWeight="600"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                className="pointer-events-none"
              >
                {n.label.length > 33 ? `${n.label.slice(0, 31)}…` : n.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

const TAB_TO_STAGE_MAP = {
  WAVE9_STUDIO: 'STAGE_1_GITHUB_CLOUD_BUILD',
  CLOUD_RUN: 'STAGE_3_CLOUD_RUN_CANARY',
  FUNCTIONS_STUDIO: 'STAGE_4_FUNCTIONS_EVENTARC',
  CLOUD_FUNCTIONS: 'STAGE_4_FUNCTIONS_EVENTARC',
  GKE_STUDIO: 'STAGE_5_GKE_AUTOPILOT_FLEET',
  GKE_KUBERNETES: 'STAGE_5_GKE_AUTOPILOT_FLEET',
};

export default function GitOpsReleaseFactoryPipelineBar({
  projectId,
  activeTab = 'WAVE9_STUDIO',
  activeSubTab = null,
  onSelectTab,
  onRunInShell,
}) {
  const [blueprint, setBlueprint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [artifactDrawerOpen, setArtifactDrawerOpen] = useState(false);
  const [activeArtifactTab, setActiveArtifactTab] = useState('CLOUDBUILD_YAML'); // 'CLOUDBUILD_YAML' | 'OIDC_TERRAFORM' | 'CANARY_ROLLBACK_SH'
  const [mermaidExpanded, setMermaidExpanded] = useState(false);
  const [mermaidViewMode, setMermaidViewMode] = useState('VISUAL'); // 'VISUAL' | 'CODE'
  const [copiedKey, setCopiedKey] = useState(null);
  const barRef = useRef(null);
  const artifactDrawerRef = useRef(null);

  const fetchBlueprint = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/gitops-release-pipeline/blueprint`
      );
      setBlueprint(res.data);
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchBlueprint();
  }, [fetchBlueprint]);

  useEffect(() => {
    if (activeTab === 'WAVE9_STUDIO' && activeSubTab === 'SUPPLY_CHAIN_AR') {
      setSelectedStage('STAGE_2_ARTIFACT_REGISTRY_SBOM');
      setDrawerOpen(false);
      setMermaidExpanded(false);
      return;
    }
    const mapped = TAB_TO_STAGE_MAP[activeTab];
    if (mapped) {
      setSelectedStage(mapped);
      setDrawerOpen(false);
      setMermaidExpanded(false);
    }
  }, [activeTab, activeSubTab]);

  const stages = blueprint?.stages || [
    {
      id: 'STAGE_1_GITHUB_CLOUD_BUILD',
      stepNumber: 1,
      shortTitle: 'GitHub & Cloud Build',
      title: '1. GitHub OIDC & Cloud Build CI/CD',
      targetTab: 'WAVE9_STUDIO',
      targetSubTab: 'CLOUD_BUILD_GITHUB',
      secondaryTab: 'SOVEREIGN_STUDIO',
      secondarySubTab: 'IAM_SURGEON',
      secondaryLabel: 'Zero-Key GitHub OIDC WIF',
      status: 'OPTIMAL',
      metricBadge: 'Probing Builds...',
      summary: 'Auditing Cloud Build executions, GitHub triggers, and SLSA-3 provenance...',
      stageItems: [],
      mermaidDsl: null,
    },
    {
      id: 'STAGE_2_ARTIFACT_REGISTRY_SBOM',
      stepNumber: 2,
      shortTitle: 'Artifact Registry & SBOM',
      title: '2. Artifact Registry, SLSA-3 & Orphan Sweeper',
      targetTab: 'WAVE9_STUDIO',
      targetSubTab: 'SUPPLY_CHAIN_AR',
      secondaryTab: 'SOVEREIGN_STUDIO',
      secondarySubTab: 'SECRETS_KMS_WAF',
      secondaryLabel: 'KMS & Binary Authz',
      status: 'OPTIMAL',
      metricBadge: 'Scanning Digests...',
      summary: 'Inspecting Artifact Registry Docker/OCI repositories and untagged orphan digests...',
      stageItems: [],
      mermaidDsl: null,
    },
    {
      id: 'STAGE_3_CLOUD_RUN_CANARY',
      stepNumber: 3,
      shortTitle: 'Cloud Run & Canary',
      title: '3. Cloud Run Revisions, Canary Traffic & Gen2 SSH',
      targetTab: 'CLOUD_RUN',
      secondaryTab: 'WAVE9_STUDIO',
      secondarySubTab: 'CLOUD_BUILD_GITHUB',
      secondaryLabel: 'Deploy GitHub Repo to Cloud Run',
      status: 'OPTIMAL',
      metricBadge: 'Scale-to-Zero',
      summary: 'Checking Cloud Run services, active revisions, traffic splitting, and Gen2 SSH...',
      stageItems: [],
      mermaidDsl: null,
    },
    {
      id: 'STAGE_4_FUNCTIONS_EVENTARC',
      stepNumber: 4,
      shortTitle: 'Functions & Eventarc',
      title: '4. Cloud Functions Gen2, Eventarc & Pub/Sub Triggers',
      targetTab: 'FUNCTIONS_STUDIO',
      secondaryTab: 'CLOUD_STORAGE',
      secondaryLabel: 'GCS Bucket Event Triggers',
      status: 'OPTIMAL',
      metricBadge: 'Gen2 & Pub/Sub',
      summary: 'Scanning Cloud Functions Gen2 and Pub/Sub Eventarc trigger buses...',
      stageItems: [],
      mermaidDsl: null,
    },
    {
      id: 'STAGE_5_GKE_AUTOPILOT_FLEET',
      stepNumber: 5,
      shortTitle: 'GKE Autopilot & Fleet',
      title: '5. GKE Autopilot, Workload Identity & Pod Right-Sizer',
      targetTab: 'GKE_STUDIO',
      secondaryTab: 'INNOVATION_LAB',
      secondarySubTab: 'FIVE_PERSONA_PLATFORM_K8S',
      secondaryLabel: 'K8s Pod Right-Sizer & PDB Audit',
      status: 'OPTIMAL',
      metricBadge: 'Autopilot & K8s',
      summary: 'Auditing GKE clusters, Workload Identity Federation, and Pod resource limits...',
      stageItems: [],
      mermaidDsl: null,
    },
    {
      id: 'STAGE_6_REVERSE_TERRAFORM_ROLLBACK',
      stepNumber: 6,
      shortTitle: 'Terraform & SLO Gate',
      title: '6. Reverse-Terraform HCL & 14.4x SLO Rollback Gate',
      targetTab: 'INNOVATION_LAB',
      targetSubTab: 'TERRAFORM',
      openArtifactTab: 'OIDC_TERRAFORM',
      secondaryTab: 'SRE_WAR_ROOM',
      secondaryLabel: '14.4x SLO Burn Release Freeze Gate',
      status: 'OPTIMAL',
      metricBadge: 'main.tf · 14.4x Gate',
      summary: 'Synthesizing Zero-Key GitHub OIDC Terraform HCL and 14.4x SLO rollback gates...',
      stageItems: [],
      mermaidDsl: null,
    },
  ];

  const defaultMappedStageId =
    activeTab === 'WAVE9_STUDIO' && activeSubTab === 'SUPPLY_CHAIN_AR'
      ? 'STAGE_2_ARTIFACT_REGISTRY_SBOM'
      : TAB_TO_STAGE_MAP[activeTab] || stages[0]?.id;

  const currentStudioStage =
    stages.find((s) => s.id === defaultMappedStageId) || stages[0];
  // Strictly ONE highlighted stage card at a time
  const activeHighlightedStageId =
    selectedStage || currentStudioStage?.id || stages[0]?.id;
  const selectedStageObj =
    stages.find((s) => s.id === activeHighlightedStageId) ||
    currentStudioStage ||
    stages[0];

  const counts = blueprint?.counts || {};
  const activeArtifactContent =
    activeArtifactTab === 'CLOUDBUILD_YAML'
      ? blueprint?.artifacts?.cloudBuildReleaseYaml || ''
      : activeArtifactTab === 'OIDC_TERRAFORM'
      ? blueprint?.artifacts?.githubOidcReleaseTf || ''
      : blueprint?.artifacts?.canaryRollbackSh || '';

  const activeArtifactFilename =
    activeArtifactTab === 'CLOUDBUILD_YAML'
      ? `${projectId || 'gcp'}-cloudbuild-release.yaml`
      : activeArtifactTab === 'OIDC_TERRAFORM'
      ? `${projectId || 'gcp'}-github-oidc-release.tf`
      : `${projectId || 'gcp'}-canary-traffic-rollback.sh`;

  const copyText = (text, key) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const downloadText = (filename, content) => {
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

  const handleExecuteAction = ({
    targetTab,
    subTab,
    openArtifactTab,
    functionsFocus,
  } = {}) => {
    if (openArtifactTab) {
      setActiveArtifactTab(openArtifactTab);
      setArtifactDrawerOpen(true);
      setTimeout(() => {
        artifactDrawerRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }, 60);
      return;
    }

    const isTabSwitch = Boolean(targetTab && targetTab !== activeTab);
    const isWave9SubTabSwitch = Boolean(
      targetTab === 'WAVE9_STUDIO' && subTab && subTab !== activeSubTab
    );

    if (typeof onSelectTab === 'function' && targetTab) {
      onSelectTab(targetTab, subTab);
    }

    if (targetTab === 'WAVE9_STUDIO' && subTab) {
      window.dispatchEvent(
        new CustomEvent('cloudpulse:wave9-subtab', {
          detail: { subTab },
        })
      );
    }

    if (functionsFocus) {
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('cloudpulse:functions-focus', {
            detail: functionsFocus,
          })
        );
      }, 90);
    }

    if (!isTabSwitch && (!subTab || isWave9SubTabSwitch || functionsFocus)) {
      setTimeout(() => {
        const nextStudioEl = barRef.current?.nextElementSibling;
        if (nextStudioEl) {
          nextStudioEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 80);
    }
  };

  return (
    <div
      ref={barRef}
      data-feature-id="WAVE6_GITOPS_RELEASE_FACTORY_PIPELINE"
      className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-slate-950/95 via-indigo-950/25 to-slate-950/95 p-3.5 shadow-xl"
    >
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-300">
            <Rocket className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                Wave 6 · 6-Stage GitOps, Cloud Build, Artifact Registry & Release Factory
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {counts.builds ?? 0} Builds · {counts.arRepos ?? 0} AR Repos ({counts.totalDigests ?? 0} Digests · {counts.orphanDigests ?? 0} Orphans) · {counts.cloudRunSvcs ?? 0} Cloud Run · {counts.eventarcTriggers ?? 0} Eventarc · {counts.pubsubTopics ?? 0} Topics · {counts.gkeClusters ?? 0} GKE
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Zero-Key GitHub OIDC → Cloud Build CI/CD → Artifact Registry SLSA-3 `@sha256` → Cloud Run Canary / Functions Gen2 / GKE Autopilot → 14.4x SLO Rollback Gate
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setArtifactDrawerOpen((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border transition cursor-pointer ${
              artifactDrawerOpen
                ? 'bg-indigo-500/25 text-indigo-200 border-indigo-400/50'
                : 'bg-slate-900/90 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/15'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>Synthesize Release Factory (`.yaml` + `.tf` + `.sh`)</span>
            {artifactDrawerOpen ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {drawerOpen && (
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-700/80 bg-slate-900/90 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
            >
              <span>Close Stage Drawer</span>
            </button>
          )}

          <button
            type="button"
            onClick={fetchBlueprint}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-700/80 bg-slate-900/90 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
            title="Re-probe live Cloud Build, Artifact Registry, Cloud Run, Functions & GKE state"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* 6-Stage Horizontal Pipeline Strip */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
        {stages.map((stage) => {
          const Icon = STAGE_ICONS[stage.id] || Rocket;
          const isSelected = stage.id === activeHighlightedStageId;
          const isOptimal = stage.status === 'OPTIMAL';

          return (
            <div
              key={stage.id}
              onClick={() => {
                if (drawerOpen && stage.id === activeHighlightedStageId) {
                  setDrawerOpen(false);
                } else {
                  setSelectedStage(stage.id);
                  setMermaidExpanded(false);
                  setDrawerOpen(true);
                }
              }}
              className={`group relative rounded-xl border p-2.5 transition-all cursor-pointer select-none ${
                isSelected
                  ? 'border-indigo-400/80 bg-indigo-500/15 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-400/50'
                  : 'border-slate-800/90 bg-slate-900/75 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg text-[10px] font-black ${
                      isSelected
                        ? 'bg-indigo-400 text-slate-950'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {stage.stepNumber}
                  </span>
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isSelected ? 'text-indigo-300' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate text-[11px] font-bold text-slate-100">
                    {stage.shortTitle}
                  </span>
                </div>
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    isOptimal ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                  }`}
                  title={
                    isOptimal
                      ? 'Release pipeline stage verified on live project'
                      : 'Action or orphan cleanup recommended'
                  }
                />
              </div>

              <div className="mt-1.5 flex items-center justify-between gap-1">
                <span className="truncate rounded bg-slate-950/80 px-1.5 py-0.5 text-[10px] font-mono text-indigo-300 border border-slate-800/80">
                  {stage.metricBadge}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExecuteAction({
                      targetTab: stage.targetTab,
                      subTab: stage.targetSubTab,
                      openArtifactTab: stage.openArtifactTab,
                    });
                  }}
                  className="inline-flex items-center gap-0.5 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer"
                  title={`Jump to ${stage.shortTitle}`}
                >
                  <span>Open</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Stage Detail Strip (Closed by default; opens when a stage card is clicked) */}
      {drawerOpen && selectedStageObj && (
        <div className="mt-2.5 rounded-xl border border-slate-800/90 bg-slate-950/90 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-lg bg-indigo-500/20 border border-indigo-400/40 px-2 py-0.5 text-[10px] font-black uppercase text-indigo-300">
                Stage {selectedStageObj.stepNumber}
              </span>
              <h4 className="text-xs font-bold text-slate-100">
                {selectedStageObj.title}
              </h4>
              <span className="text-[11px] text-slate-400">
                — {selectedStageObj.summary}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {selectedStageObj.cliCmd && typeof onRunInShell === 'function' && (
                <button
                  type="button"
                  onClick={() => onRunInShell(selectedStageObj.cliCmd)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-mono text-cyan-300 hover:border-cyan-500/40 cursor-pointer"
                  title={selectedStageObj.cliCmd}
                >
                  <Terminal className="w-3 h-3" />
                  <span>Verify via gcloud CLI</span>
                </button>
              )}

              {selectedStageObj.targetTab && typeof onSelectTab === 'function' && (
                <button
                  type="button"
                  onClick={() =>
                    handleExecuteAction({
                      targetTab: selectedStageObj.targetTab,
                      subTab: selectedStageObj.targetSubTab,
                      openArtifactTab: selectedStageObj.openArtifactTab,
                    })
                  }
                  className="inline-flex items-center gap-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/45 border border-indigo-400/40 px-2.5 py-1 text-[11px] font-bold text-indigo-200 transition cursor-pointer"
                >
                  <span>Jump to Primary Studio</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}

              {selectedStageObj.secondaryTab && typeof onSelectTab === 'function' && (
                <button
                  type="button"
                  onClick={() =>
                    handleExecuteAction({
                      targetTab: selectedStageObj.secondaryTab,
                      subTab: selectedStageObj.secondarySubTab,
                    })
                  }
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-300 transition cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>{selectedStageObj.secondaryLabel || 'Open Companion Studio'}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Stage Items Grid */}
          {Array.isArray(selectedStageObj.stageItems) &&
            selectedStageObj.stageItems.length > 0 && (
              <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {selectedStageObj.stageItems.map((item, i) => (
                  <div
                    key={`${item.name}-${i}`}
                    onClick={() =>
                      handleExecuteAction({
                        targetTab: item.targetTab,
                        subTab: item.subTab,
                        openArtifactTab: item.openArtifactTab,
                        functionsFocus: item.functionsFocus,
                      })
                    }
                    className="cursor-pointer rounded-lg border border-slate-800/90 bg-slate-900/90 px-2.5 py-1.5 hover:border-indigo-500/40 transition flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        {item.kind}
                      </div>
                      <div className="truncate text-xs font-bold text-slate-100">
                        {item.name}
                      </div>
                      <div className="truncate text-[10px] font-mono text-indigo-300/90">
                        {item.meta}
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  </div>
                ))}
              </div>
            )}

          {/* Live Stage-Specific Mermaid Diagram (Strictly rendered ONLY when live directed edges exist, and collapsed until user clicks Open Interactive Mermaid Flowchart) */}
          {selectedStageObj.mermaidDsl &&
            selectedStageObj.mermaidDsl.includes('-->') && (
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-indigo-500/25 bg-slate-900/90 px-3 py-2">
                  <div
                    onClick={() => setMermaidExpanded((prev) => !prev)}
                    className="flex items-center gap-2 flex-wrap cursor-pointer select-none"
                  >
                    <span className="px-2 py-0.5 rounded bg-indigo-500 text-white text-[10px] font-mono font-extrabold uppercase tracking-wider">
                      Mermaid flowchart LR
                    </span>
                    <span className="text-xs font-bold text-slate-100">
                      Stage {selectedStageObj.stepNumber} Live {selectedStageObj.shortTitle} Topology ({projectId})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setMermaidExpanded((prev) => !prev)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-mono font-bold transition cursor-pointer ${
                        mermaidExpanded
                          ? 'bg-slate-800 text-slate-200 border border-slate-700'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
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
                          className={`px-2 py-1 rounded text-[10px] font-mono font-bold cursor-pointer ${
                            mermaidViewMode === 'VISUAL'
                              ? 'bg-indigo-500 text-white'
                              : 'bg-slate-900 text-slate-300 border border-slate-700'
                          }`}
                        >
                          Visual Flowchart DAG
                        </button>
                        <button
                          type="button"
                          onClick={() => setMermaidViewMode('CODE')}
                          className={`px-2 py-1 rounded text-[10px] font-mono font-bold cursor-pointer ${
                            mermaidViewMode === 'CODE'
                              ? 'bg-indigo-500 text-white'
                              : 'bg-slate-900 text-slate-300 border border-slate-700'
                          }`}
                        >
                          Mermaid .mmd Code
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            copyText(
                              `\`\`\`mermaid\n${selectedStageObj.mermaidDsl}\n\`\`\``,
                              `mmd-${selectedStageObj.id}`
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
                        >
                          {copiedKey === `mmd-${selectedStageObj.id}` ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>Copy ```mermaid</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            downloadText(
                              `${projectId}-gitops-stage-${selectedStageObj.stepNumber}.mmd`,
                              selectedStageObj.mermaidDsl
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/40 bg-indigo-500/15 px-2 py-1 text-[10px] font-semibold text-indigo-200 hover:bg-indigo-500/25 cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>.mmd</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {mermaidExpanded &&
                  (mermaidViewMode === 'CODE' ? (
                    <pre className="rounded-lg border border-slate-800 bg-slate-900/95 p-3 text-[11px] font-mono leading-relaxed text-indigo-200 overflow-x-auto">
                      {selectedStageObj.mermaidDsl}
                    </pre>
                  ) : (
                    <GitOpsMermaidFlowchartSvg
                      dsl={selectedStageObj.mermaidDsl}
                      onNodeClick={(target) => {
                        if (target?.targetTab) {
                          handleExecuteAction({
                            targetTab: target.targetTab,
                            subTab: target.subTab,
                          });
                        }
                      }}
                    />
                  ))}
              </div>
            )}

          {/* Stage CLI Verification Bar + Step Progression */}
          {selectedStageObj.cliCmd && (
            <div className="mt-3 bg-slate-900/95 text-slate-100 border border-slate-800 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
              <div className="flex items-center gap-2 min-w-0">
                <Terminal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <code className="text-emerald-300 truncate">
                  {selectedStageObj.cliCmd}
                </code>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    copyText(selectedStageObj.cliCmd, `cli-${selectedStageObj.id}`)
                  }
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold cursor-pointer"
                >
                  {copiedKey === `cli-${selectedStageObj.id}`
                    ? '✓ Copied CLI'
                    : 'Copy CLI'}
                </button>
                {selectedStageObj.stepNumber < 6 && (
                  <button
                    type="button"
                    onClick={() => {
                      const nextStage = stages.find(
                        (s) => s.stepNumber === selectedStageObj.stepNumber + 1
                      );
                      if (nextStage) {
                        setSelectedStage(nextStage.id);
                        setMermaidExpanded(false);
                      }
                    }}
                    className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold cursor-pointer"
                  >
                    Next: Step {selectedStageObj.stepNumber + 1} →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expandable Release Factory Code Synthesizer Drawer (Closed by Default) */}
      {artifactDrawerOpen && (
        <div
          ref={artifactDrawerRef}
          className="mt-3 rounded-xl border border-indigo-500/30 bg-slate-950 p-3.5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                {
                  id: 'CLOUDBUILD_YAML',
                  label: 'cloudbuild_release.yaml (SLSA-3 Canary CI/CD)',
                },
                {
                  id: 'OIDC_TERRAFORM',
                  label: 'github_oidc_release.tf (Zero-Key OIDC WIF + Immutable AR)',
                },
                {
                  id: 'CANARY_ROLLBACK_SH',
                  label: 'canary_traffic_rollback.sh (Canary & 14.4x Rollback CLI)',
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveArtifactTab(tab.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                    activeArtifactTab === tab.id
                      ? 'bg-indigo-500 text-white'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {typeof onRunInShell === 'function' &&
                activeArtifactTab === 'CANARY_ROLLBACK_SH' && (
                  <button
                    type="button"
                    onClick={() =>
                      onRunInShell(
                        `gcloud run services list --project=${projectId}`
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-lg bg-cyan-500/20 border border-cyan-400/40 px-2.5 py-1 text-xs font-bold text-cyan-200 hover:bg-cyan-500/30 cursor-pointer"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Run Cloud Run Audit in Shell</span>
                  </button>
                )}

              <button
                type="button"
                onClick={() => copyText(activeArtifactContent, activeArtifactTab)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-800 cursor-pointer"
              >
                {copiedKey === activeArtifactTab ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>
                  {copiedKey === activeArtifactTab ? 'Copied!' : 'Copy Code'}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  downloadText(activeArtifactFilename, activeArtifactContent)
                }
                className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/40 bg-indigo-500/15 px-2.5 py-1 text-xs font-semibold text-indigo-200 hover:bg-indigo-500/25 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download {activeArtifactFilename}</span>
              </button>
            </div>
          </div>

          <pre className="mt-2.5 max-h-72 overflow-auto rounded-lg border border-slate-800 bg-slate-900/95 p-3 text-[11px] font-mono leading-relaxed text-indigo-200">
            {activeArtifactContent || '# Synthesizing live GitOps & Release Factory blueprint...'}
          </pre>
        </div>
      )}
    </div>
  );
}
