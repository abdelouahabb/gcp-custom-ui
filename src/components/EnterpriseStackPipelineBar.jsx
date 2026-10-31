import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  Layers,
  Shield,
  Database,
  Cpu,
  GitBranch,
  DollarSign,
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
  STAGE_1_PERIMETER_IAM: Shield,
  STAGE_2_STORAGE_LAKEHOUSE: Database,
  STAGE_3_COMPUTE_SERVERLESS: Cpu,
  STAGE_4_CICD_TERRAFORM: GitBranch,
  STAGE_5_FINOPS_QUOTA_GUARD: DollarSign,
  STAGE_6_SRE_RECYCLE_RECOVERY: Trash2,
};

const STUDIO_TAB_LABELS = {
  VPC_NETWORKS: 'VPC & Firewall Studio',
  CLOUD_STORAGE: 'Cloud Storage Studio',
  VM_SSH: 'Compute VM & SSH Studio',
  CLOUD_RUN: 'Cloud Run Serverless Studio',
  WAVE9_STUDIO: 'Cloud Build & Artifact Registry Studio',
  FINOPS: 'FinOps & Billing Studio',
  RECYCLE_BIN: '30-Day Cloud Recycle Bin',
};

/**
 * Deterministic Mermaid `flowchart LR` Parser & Interactive SVG Vector Renderer.
 * Parses `subgraph ID["Title"] ... end`, `NODE["Label"]`, and `A -->|"Label"| B`
 * into a crisp, zero-dependency interactive SVG diagram with Subgraph clusters,
 * cubic-Bezier arrows, arrowheads, animated dataflow pulses, and edge label pills.
 */
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

    // Check for edge first: A -->|"label"| B or A --> B
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

    // Node definition: ID["Label"]
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
          defaultSg = { id: '__DEFAULT__', label: 'Pipeline Nodes', nodes: [] };
          subgraphs.push(defaultSg);
        }
        defaultSg.nodes.push(nodeObj);
      }
    }
  }

  return { subgraphs, edges, nodeMap };
}

function inferTargetTabFromNodeId(nodeId = '', label = '') {
  const id = String(nodeId).toUpperCase();
  const text = String(label).toUpperCase();
  if (id.startsWith('VPC') || id.startsWith('FW') || id === 'PUB' || id === 'IAP' || id === 'INT') {
    return { targetTab: 'VPC_NETWORKS', subtitle: 'Click to open VPC & Firewall Studio' };
  }
  if (id.startsWith('BKT') || text.includes('GS://')) {
    return { targetTab: 'CLOUD_STORAGE', subtitle: 'Click to open Cloud Storage Studio' };
  }
  if (id.startsWith('DS') || text.includes('DATASET')) {
    return { targetTab: 'BIGQUERY_STUDIO', subtitle: 'Click to open BigQuery Studio' };
  }
  if (id.startsWith('VM') || id.startsWith('DISK')) {
    return { targetTab: 'VM_SSH', subtitle: 'Click to open Compute VM & Disk Studio' };
  }
  if (id.startsWith('CR')) {
    return { targetTab: 'CLOUD_RUN', subtitle: 'Click to open Cloud Run Studio' };
  }
  if (id.startsWith('FN')) {
    return { targetTab: 'FUNCTIONS_STUDIO', subtitle: 'Click to open Cloud Functions & Eventarc Studio' };
  }
  if (id.startsWith('AR')) {
    return { targetTab: 'WAVE9_STUDIO', subtitle: 'Click to open Artifact Registry & Supply Chain Studio' };
  }
  if (id.startsWith('GKE')) {
    return { targetTab: 'GKE_STUDIO', subtitle: 'Click to open GKE Cluster Studio' };
  }
  return null;
}

function MermaidFlowchartSvg({ dsl, topology = [], onNodeClick }) {
  const svgRef = useRef(null);
  const dragRef = useRef(null);
  const [offsets, setOffsets] = useState({});
  const [activeDragKey, setActiveDragKey] = useState(null);
  const [zoomPct, setZoomPct] = useState(100);

  useEffect(() => {
    setOffsets({});
    setActiveDragKey(null);
    setZoomPct(100);
  }, [dsl]);

  const { subgraphs, edges } = parseMermaidFlowchartLr(dsl);

  if (!subgraphs.length) {
    return null;
  }

  const colW = 276;
  const colGap = 112;
  const padX = 24;
  const padY = 22;
  const sgHeaderH = 32;
  const sgPad = 14;
  const nodeH = 60;
  const nodeGapY = 48;

  const maxNodes = Math.max(1, ...subgraphs.map((sg) => sg.nodes.length));
  const maxSgH =
    sgHeaderH +
    sgPad * 2 +
    maxNodes * nodeH +
    Math.max(0, maxNodes - 1) * nodeGapY;

  const svgW =
    padX * 2 +
    subgraphs.length * colW +
    Math.max(0, subgraphs.length - 1) * colGap;
  const svgH = Math.max(220, padY * 2 + maxSgH + 8);

  const handleStartDrag = (e, key) => {
    e.stopPropagation();
    const current = offsets[key] || { dx: 0, dy: 0 };
    dragRef.current = {
      key,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startDx: current.dx,
      startDy: current.dy,
      moved: false,
    };
    setActiveDragKey(key);
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag) return;
    const rawDx = e.clientX - drag.startClientX;
    const rawDy = e.clientY - drag.startClientY;
    if (Math.abs(rawDx) > 4 || Math.abs(rawDy) > 4) {
      drag.moved = true;
    }
    const ctm = svgRef.current?.getScreenCTM?.();
    const scaleX = ctm?.a || 1;
    const scaleY = ctm?.d || 1;
    const nextDx = Math.round(drag.startDx + rawDx / scaleX);
    const nextDy = Math.round(drag.startDy + rawDy / scaleY);
    setOffsets((prev) => ({
      ...prev,
      [drag.key]: { dx: nextDx, dy: nextDy },
    }));
  };

  const handlePointerUp = () => {
    dragRef.current = null;
    setActiveDragKey(null);
  };

  const positionedNodes = new Map();
  let globalNodeIdx = 0;

  const positionedSubgraphs = subgraphs.map((sg, gIdx) => {
    const sgOffset = offsets[`sg:${sg.id}`] || { dx: 0, dy: 0 };
    const sgX = padX + gIdx * (colW + colGap) + sgOffset.dx;
    const sgH =
      sgHeaderH +
      sgPad * 2 +
      sg.nodes.length * nodeH +
      Math.max(0, sg.nodes.length - 1) * nodeGapY;
    const sgY = Math.round((svgH - sgH) / 2) + sgOffset.dy;

    const nodes = sg.nodes.map((n, nIdx) => {
      const nodeOffset = offsets[`node:${n.id}`] || { dx: 0, dy: 0 };
      const x = sgX + sgPad + nodeOffset.dx;
      const w = colW - sgPad * 2;
      const y =
        sgY + sgHeaderH + sgPad + nIdx * (nodeH + nodeGapY) + nodeOffset.dy;
      const h = nodeH;
      const topoHint =
        topology[globalNodeIdx] ||
        topology[gIdx] ||
        inferTargetTabFromNodeId(n.id, n.label);
      globalNodeIdx += 1;

      const parts = String(n.label || '').split(':');
      const primaryTitle =
        parts.length > 1 ? parts[0].trim() : n.label.slice(0, 34);
      const secondarySub =
        parts.length > 1
          ? parts.slice(1).join(':').trim()
          : topoHint?.subtitle || 'Live GCP Telemetry';
      const isPublicExposure =
        n.id === 'PUB' ||
        String(n.label || '').includes('0.0.0.0/0') ||
        String(n.label || '').includes('Unattached Zombie');

      const posNode = {
        ...n,
        gIdx,
        nIdx,
        x,
        y,
        w,
        h,
        cx: x + w / 2,
        cy: y + h / 2,
        leftX: x,
        rightX: x + w,
        topY: y,
        bottomY: y + h,
        primaryTitle,
        secondarySub,
        topoHint,
        isPublicExposure,
      };
      positionedNodes.set(n.id, posNode);
      return posNode;
    });

    return {
      ...sg,
      gIdx,
      x: sgX,
      y: sgY,
      w: colW,
      h: sgH,
      nodes,
    };
  });

  const PALETTES = [
    {
      sgFill: 'rgba(59, 130, 246, 0.06)',
      sgStroke: 'rgba(59, 130, 246, 0.38)',
      badgeBg: '#1d4ed8',
      nodeStroke: '#3b82f6',
    },
    {
      sgFill: 'rgba(99, 102, 241, 0.06)',
      sgStroke: 'rgba(99, 102, 241, 0.38)',
      badgeBg: '#4338ca',
      nodeStroke: '#6366f1',
    },
    {
      sgFill: 'rgba(16, 185, 129, 0.06)',
      sgStroke: 'rgba(16, 185, 129, 0.38)',
      badgeBg: '#047857',
      nodeStroke: '#10b981',
    },
    {
      sgFill: 'rgba(245, 158, 11, 0.06)',
      sgStroke: 'rgba(245, 158, 11, 0.38)',
      badgeBg: '#b45309',
      nodeStroke: '#f59e0b',
    },
  ];

  const truncate = (str, max = 32) =>
    String(str || '').length > max
      ? `${String(str).slice(0, max - 1)}…`
      : String(str || '');

  const hasCustomLayout = Object.keys(offsets).length > 0;

  return (
    <div className="w-full overflow-x-auto rounded-xl bg-[#0d1117] border border-zinc-800 p-2.5 shadow-inner space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[10.5px] font-mono text-zinc-400">
        <span>
          ✥ Interactive Canvas: Drag any Node or Subgraph container to move it (click a node without dragging to open its Studio)
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setZoomPct((z) => Math.max(70, z - 15))}
            className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold cursor-pointer"
            title="Zoom Out Mermaid SVG"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => setZoomPct(100)}
            className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-bold cursor-pointer"
            title="Reset Zoom to 100%"
          >
            {zoomPct}%
          </button>
          <button
            type="button"
            onClick={() => setZoomPct((z) => Math.min(145, z + 15))}
            className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold cursor-pointer"
            title="Zoom In Mermaid SVG"
          >
            +
          </button>
          {hasCustomLayout && (
            <button
              type="button"
              onClick={() => setOffsets({})}
              className="px-2 py-0.5 rounded bg-indigo-600/20 hover:bg-indigo-600/35 text-indigo-300 border border-indigo-500/40 font-bold cursor-pointer"
            >
              ↺ Reset Node Positions
            </button>
          )}
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${svgW} ${svgH}`}
        style={{ width: `${zoomPct}%` }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="h-auto min-w-[780px] select-none touch-none transition-[width] duration-150"
        role="img"
        aria-label="Live Interactive Mermaid Architecture Flowchart"
      >
        <defs>
          <marker
            id="mmd-arrow"
            viewBox="0 0 10 10"
            refX="8.5"
            refY="5"
            markerWidth="6.5"
            markerHeight="6.5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#818cf8" />
          </marker>
          <pattern
            id="mmd-grid"
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1" fill="rgba(148, 163, 184, 0.12)" />
          </pattern>
        </defs>

        {/* Subtle Engineering Grid Background */}
        <rect width={svgW} height={svgH} rx="10" fill="url(#mmd-grid)" />

        {/* 1. Render Draggable Mermaid Subgraph Cluster Containers */}
        {positionedSubgraphs.map((sg, idx) => {
          const pal = PALETTES[idx % PALETTES.length];
          const isDraggingSg = activeDragKey === `sg:${sg.id}`;
          return (
            <g
              key={sg.id}
              onPointerDown={(e) => handleStartDrag(e, `sg:${sg.id}`)}
              className={isDraggingSg ? 'cursor-grabbing' : 'cursor-grab'}
            >
              <rect
                x={sg.x}
                y={sg.y}
                width={sg.w}
                height={sg.h}
                rx="12"
                fill={pal.sgFill}
                stroke={isDraggingSg ? '#818cf8' : pal.sgStroke}
                strokeWidth={isDraggingSg ? '2.2' : '1.5'}
                strokeDasharray="5 4"
              />
              <rect
                x={sg.x + 10}
                y={sg.y + 7}
                width={sg.w - 20}
                height={20}
                rx="6"
                fill={pal.badgeBg}
                fillOpacity="0.85"
              />
              <text
                x={sg.x + sg.w / 2}
                y={sg.y + 20.5}
                textAnchor="middle"
                fill="#f8fafc"
                fontSize="10.5"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                fontWeight="700"
              >
                {truncate(`✥ subgraph: ${sg.label}`, 35)}
              </text>
            </g>
          );
        })}

        {/* 2. Render Mermaid Directed Edges (Dynamic Cubic Bezier + Animated Flow + Label Pills) */}
        {edges.map((edge, eIdx) => {
          const nA = positionedNodes.get(edge.from);
          const nB = positionedNodes.get(edge.to);
          if (!nA || !nB) return null;

          let pathD = '';
          let labelX = 0;
          let labelY = 0;

          // Dynamically pick vertical vs horizontal anchor points based on live dragged coordinates
          const deltaX = nB.cx - nA.cx;
          const deltaY = nB.cy - nA.cy;

          if (Math.abs(deltaX) < nA.w * 0.65) {
            // Vertical or near-vertical connector
            const goingDown = deltaY >= 0;
            const x1 = nA.cx;
            const y1 = goingDown ? nA.bottomY : nA.topY;
            const x2 = nB.cx;
            const y2 = goingDown ? nB.topY - 3 : nB.bottomY + 3;
            const dy = Math.max(24, Math.abs(y2 - y1) * 0.45);
            pathD = `M ${x1} ${y1} C ${x1} ${
              goingDown ? y1 + dy : y1 - dy
            }, ${x2} ${goingDown ? y2 - dy : y2 + dy}, ${x2} ${y2}`;
            labelX = (x1 + x2) / 2;
            labelY = (y1 + y2) / 2;
          } else {
            // Horizontal cubic Bezier connector (supports dragging left or right)
            const goingRight = deltaX >= 0;
            const x1 = goingRight ? nA.rightX : nA.leftX;
            const y1 = nA.cy;
            const x2 = goingRight ? nB.leftX - 3 : nB.rightX + 3;
            const y2 = nB.cy;
            const dx = Math.max(42, Math.abs(x2 - x1) * 0.46);
            pathD = `M ${x1} ${y1} C ${goingRight ? x1 + dx : x1 - dx} ${y1}, ${
              goingRight ? x2 - dx : x2 + dx
            } ${y2}, ${x2} ${y2}`;
            labelX = (x1 + x2) / 2;
            labelY = (y1 + y2) / 2;
          }

          const cleanLabel = truncate(edge.label, 24);
          const pillW = cleanLabel ? Math.max(68, cleanLabel.length * 5.9 + 14) : 0;

          return (
            <g key={`${edge.from}-${edge.to}-${eIdx}`} className="pointer-events-none">
              {/* Base solid Mermaid connector */}
              <path
                d={pathD}
                fill="none"
                stroke="#6366f1"
                strokeWidth="2"
                strokeOpacity="0.75"
                markerEnd="url(#mmd-arrow)"
              />
              {/* Animated telemetry pulse overlay */}
              <path
                d={pathD}
                fill="none"
                stroke="#34d399"
                strokeWidth="2"
                strokeDasharray="5 9"
                strokeOpacity="0.85"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="28"
                  to="0"
                  dur="1.8s"
                  repeatCount="indefinite"
                />
              </path>

              {cleanLabel && (
                <g transform={`translate(${labelX}, ${labelY})`}>
                  <rect
                    x={-pillW / 2}
                    y={-9.5}
                    width={pillW}
                    height={19}
                    rx="9.5"
                    fill="#1e1b4b"
                    stroke="#6366f1"
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="3.5"
                    textAnchor="middle"
                    fill="#e0e7ff"
                    fontSize="9.5"
                    fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                    fontWeight="600"
                  >
                    {cleanLabel}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* 3. Render Draggable & Clickable Mermaid Nodes */}
        {positionedSubgraphs.flatMap((sg, idx) => {
          const pal = PALETTES[idx % PALETTES.length];
          return sg.nodes.map((node) => {
            const isDraggingNode = activeDragKey === `node:${node.id}`;
            const nodeAccentColor = node.isPublicExposure ? '#f59e0b' : pal.nodeStroke;
            return (
              <g
                key={node.id}
                onPointerDown={(e) => handleStartDrag(e, `node:${node.id}`)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (dragRef.current?.moved) return;
                  if (onNodeClick && node.topoHint) {
                    onNodeClick(node.topoHint);
                  }
                }}
                className={isDraggingNode ? 'cursor-grabbing' : 'cursor-grab'}
              >
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.w}
                  height={node.h}
                  rx="9"
                  fill={node.isPublicExposure ? '#1f1912' : '#161b22'}
                  stroke={isDraggingNode ? '#34d399' : nodeAccentColor}
                  strokeWidth={isDraggingNode ? '2.4' : '1.6'}
                />
                {/* Left accent bar */}
                <rect
                  x={node.x + 1}
                  y={node.y + 6}
                  width="4"
                  height={node.h - 12}
                  rx="2"
                  fill={nodeAccentColor}
                />
                {/* Node ID + Drag Handle badge */}
                <rect
                  x={node.x + node.w - 52}
                  y={node.y + 6}
                  width="44"
                  height="15"
                  rx="4"
                  fill={
                    node.isPublicExposure
                      ? 'rgba(245, 158, 11, 0.22)'
                      : 'rgba(99, 102, 241, 0.16)'
                  }
                />
                <text
                  x={node.x + node.w - 30}
                  y={node.y + 16.5}
                  textAnchor="middle"
                  fill={node.isPublicExposure ? '#fcd34d' : '#a5b4fc'}
                  fontSize="8.5"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  fontWeight="700"
                >
                  {truncate(`✥ ${node.id}`, 8)}
                </text>

                {/* Primary Node Title */}
                <text
                  x={node.x + 12}
                  y={node.y + 23}
                  fill="#f8fafc"
                  fontSize="11"
                  fontFamily="ui-sans-serif, system-ui, sans-serif"
                  fontWeight="700"
                >
                  {truncate(node.primaryTitle, 26)}
                </text>

                {/* Secondary Node Subtitle / Live Inventory Value */}
                <text
                  x={node.x + 12}
                  y={node.y + 42}
                  fill="#94a3b8"
                  fontSize="9.8"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                >
                  {truncate(node.secondarySub, 34)}
                </text>
              </g>
            );
          });
        })}
      </svg>
    </div>
  );
}

export default function EnterpriseStackPipelineBar({
  projectId,
  activeTab,
  overview,
  onOpenProvision,
  onSelectTab,
  onRunInShell,
}) {
  const containerRef = useRef(null);
  const iacDrawerRef = useRef(null);
  const [blueprint, setBlueprint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [iacDrawerOpen, setIacDrawerOpen] = useState(false);
  const [selectedArtifactTab, setSelectedArtifactTab] = useState('mainTf'); // 'mainTf' | 'cloudBuildYaml' | 'pipelineDeploySh' | 'architectureMermaid'
  const [selectedStageId, setSelectedStageId] = useState(null);
  const [mermaidExpanded, setMermaidExpanded] = useState(false);
  const [mermaidViewMode, setMermaidViewMode] = useState('VISUAL'); // 'VISUAL' | 'CODE'
  const [copiedKey, setCopiedKey] = useState(null);

  const navigateOrScrollToStudio = useCallback(
    (targetTab, subTab) => {
      if (!targetTab) return;
      onSelectTab?.(targetTab, subTab);
      if (targetTab === activeTab && !subTab) {
        containerRef.current?.nextElementSibling?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    },
    [activeTab, onSelectTab]
  );

  useEffect(() => {
    const handleOpenTerraformDrawer = (evt) => {
      const targetTab = evt?.detail?.artifactTab || 'mainTf';
      setSelectedArtifactTab(targetTab);
      setIacDrawerOpen(true);
      if (containerRef.current) {
        containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    window.addEventListener(
      'cloudpulse:open-terraform-drawer',
      handleOpenTerraformDrawer
    );
    return () => {
      window.removeEventListener(
        'cloudpulse:open-terraform-drawer',
        handleOpenTerraformDrawer
      );
    };
  }, []);

  const fetchBlueprint = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/enterprise-pipeline/blueprint`,
        { timeout: 10000 }
      );
      if (res.data && Array.isArray(res.data.stages)) {
        setBlueprint(res.data);
      }
    } catch {
      // Non-blocking fallback if server is restarting
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchBlueprint();
  }, [fetchBlueprint, overview?.resources?.length]);

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
      id: 'STAGE_1_PERIMETER_IAM',
      stepNumber: 1,
      shortTitle: 'VPC & IAP Perimeter',
      targetTab: 'VPC_NETWORKS',
      secondaryTab: 'SOVEREIGN_STUDIO',
      secondaryLabel: 'Sovereign IAM Studio',
      status: 'OPTIMAL',
      metricBadge: 'Zero-Trust VPC',
      summary: 'VPC firewall rules & IAP TCP-22 SSH bastion.',
      cliCmd: `gcloud compute firewall-rules list --project=${projectId}`,
      mermaidDsl: null,
    },
    {
      id: 'STAGE_2_STORAGE_LAKEHOUSE',
      stepNumber: 2,
      shortTitle: 'Storage & Lakehouse',
      targetTab: 'CLOUD_STORAGE',
      secondaryTab: 'BIGQUERY_STUDIO',
      secondaryLabel: 'BigQuery Studio',
      status: 'OPTIMAL',
      metricBadge: 'GCS + BigQuery',
      summary: 'Stateful Cloud Storage buckets & BigQuery analytical datasets.',
      cliCmd: `gcloud storage buckets list --project=${projectId}`,
      mermaidDsl: null,
    },
    {
      id: 'STAGE_3_COMPUTE_SERVERLESS',
      stepNumber: 3,
      shortTitle: 'VMs & Cloud Run',
      targetTab: 'VM_SSH',
      secondaryTab: 'CLOUD_RUN',
      secondaryLabel: 'Cloud Run Serverless Studio',
      status: 'OPTIMAL',
      metricBadge: 'Compute & Serverless',
      summary: 'GCE VM Fleet & Cloud Run scale-to-zero containers.',
      cliCmd: `gcloud run services list --project=${projectId}`,
      mermaidDsl: null,
    },
    {
      id: 'STAGE_4_CICD_TERRAFORM',
      stepNumber: 4,
      shortTitle: 'Cloud Build & Registry',
      targetTab: 'WAVE9_STUDIO',
      secondaryTab: 'INNOVATION_LAB',
      secondarySubTab: 'TERRAFORM',
      secondaryLabel: 'Reverse-Terraform Exporter (main.tf + imports.tf)',
      status: 'OPTIMAL',
      metricBadge: 'Cloud Build + SLSA-3',
      summary: 'GitHub -> Google Cloud Build CI/CD, Artifact Registry SBOM & stack IaC.',
      cliCmd: `gcloud builds list --project=${projectId} --limit=10`,
      mermaidDsl: null,
    },
    {
      id: 'STAGE_5_FINOPS_QUOTA_GUARD',
      stepNumber: 5,
      shortTitle: 'FinOps & Quota Radar',
      targetTab: 'FINOPS',
      secondaryTab: 'STARTUP_10X',
      secondaryLabel: 'Startup 10X Quota Drafter',
      status: 'OPTIMAL',
      metricBadge: 'Spend & HTTP 429',
      summary: 'Autonomous spend caps, API kill-switch & Startup 10X quota drafter.',
      cliCmd: `gcloud services list --enabled --project=${projectId}`,
      mermaidDsl: null,
    },
    {
      id: 'STAGE_6_SRE_RECYCLE_RECOVERY',
      stepNumber: 6,
      shortTitle: 'SRE & Recycle Bin',
      targetTab: 'RECYCLE_BIN',
      secondaryTab: 'SRE_WAR_ROOM',
      secondaryLabel: 'SRE Incident War-Room',
      status: 'OPTIMAL',
      metricBadge: '30d Recovery Vault',
      summary: '14.4x SLO burn gate & 30-Day Cloud Recycle Bin recovery.',
      cliCmd: `gcloud logging read logName:cloudaudit.googleapis.com --project=${projectId} --limit=10 --format=json`,
      mermaidDsl: null,
    },
  ];

  const homeStage =
    stages.find((s) => s.targetTab === activeTab) ||
    ([
      'CLOUD_RUN',
      'FUNCTIONS_STUDIO',
      'CLOUD_FUNCTIONS',
      'GKE_STUDIO',
      'GKE_KUBERNETES',
    ].includes(activeTab)
      ? stages.find((s) => s.id === 'STAGE_3_COMPUTE_SERVERLESS')
      : stages.find((s) => s.secondaryTab === activeTab)) ||
    stages[0];

  const activeStage =
    (selectedStageId && stages.find((s) => s.id === selectedStageId)) ||
    homeStage;

  // Strict single-selection: highlight ONLY the open drawer stage (when drawerOpen)
  // or ONLY the single primary home stage for the current studio tab.
  const activeHighlightedStageId = drawerOpen ? activeStage?.id : homeStage?.id;

  const activeArtifactContent =
    selectedArtifactTab === 'mainTf'
      ? blueprint?.artifacts?.mainTf
      : selectedArtifactTab === 'importsTf'
      ? blueprint?.artifacts?.importsTf
      : selectedArtifactTab === 'cloudBuildYaml'
      ? blueprint?.artifacts?.cloudBuildYaml
      : blueprint?.artifacts?.pipelineDeploySh;

  const activeArtifactFilename =
    selectedArtifactTab === 'mainTf'
      ? `${projectId}-enterprise-stack.tf`
      : selectedArtifactTab === 'importsTf'
      ? `${projectId}-imports.tf`
      : selectedArtifactTab === 'cloudBuildYaml'
      ? `cloudbuild.yaml`
      : `pipeline-deploy-${projectId}.sh`;

  return (
    <div
      ref={containerRef}
      data-feature-id="ENTERPRISE_STACK_PIPELINE"
      className="bg-white dark:bg-[#18191b] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-3"
    >
      {/* Top Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Enterprise 6-Stage Production Stack & Pipeline Glue
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                {blueprint?.counts?.totalResources ?? 'Live'} Resources Linked
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              End-to-end enterprise workflow connecting Zero-Trust VPCs, Lakehouse Storage, Compute/Cloud Run, Cloud Build & Artifact Registry CI/CD, FinOps Quota Radar, and 30-Day Recycle Bin.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setIacDrawerOpen((prev) => !prev);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              iacDrawerOpen
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>Reverse-Engineer Stack to .tf (`main.tf`)</span>
            {iacDrawerOpen ? (
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
            title="Re-scan live GCP project inventory and regenerate Terraform + Cloud Build pipeline blueprint"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync Stack</span>
          </button>
        </div>
      </div>

      {/* Dedicated Reverse-Terraform (`main.tf`) & CI/CD Blueprint Synthesizer Drawer */}
      {iacDrawerOpen && (
        <div
          ref={iacDrawerRef}
          className="pt-3 border-t border-indigo-500/30 bg-indigo-500/[0.03] rounded-xl p-3 space-y-3 animate-fadeIn"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[10px] font-mono font-extrabold uppercase tracking-wider">
                  Reverse-Terraform & IaC Synthesizer
                </span>
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Live Project Infrastructure Codified into `{projectId}-enterprise-stack.tf`
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Synthesizes live VPCs, Firewall Rules, GCS Buckets, BigQuery Datasets, Compute VMs, Persistent Disks, Cloud Run services, Functions, and Artifact Registry repos into ready-to-apply HashiCorp Terraform HCL.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {onSelectTab && (
                <button
                  type="button"
                  onClick={() => onSelectTab('INNOVATION_LAB', 'TERRAFORM')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Full Reverse-Terraform & `imports.tf` Studio ↗</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIacDrawerOpen(false)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 cursor-pointer"
              >
                Close .tf View
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setSelectedArtifactTab('mainTf')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                  selectedArtifactTab === 'mainTf'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                main.tf (Live Terraform HCL)
              </button>
              <button
                type="button"
                onClick={() => setSelectedArtifactTab('importsTf')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                  selectedArtifactTab === 'importsTf'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                imports.tf (Terraform 1.5+ State Imports)
              </button>
              <button
                type="button"
                onClick={() => setSelectedArtifactTab('cloudBuildYaml')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                  selectedArtifactTab === 'cloudBuildYaml'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                cloudbuild.yaml (SLSA-3 Canary CI/CD)
              </button>
              <button
                type="button"
                onClick={() => setSelectedArtifactTab('pipelineDeploySh')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                  selectedArtifactTab === 'pipelineDeploySh'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                pipeline-deploy.sh (6-Stage Verifier)
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
            {activeArtifactContent || '# Synthesizing live project infrastructure...'}
          </pre>
        </div>
      )}

      {/* 6-Stage Interactive Pipeline Chain */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2">
        {stages.map((stage, idx) => {
          const IconComponent = STAGE_ICONS[stage.id] || Layers;
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
                  setMermaidExpanded(false);
                  setDrawerOpen(true);
                }
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedStageId(stage.id);
                  setMermaidExpanded(false);
                  setDrawerOpen(true);
                }
              }}
              className={`group relative rounded-xl p-2.5 border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isHighlighted
                  ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-500/60 shadow-sm ring-1 ring-blue-500/30'
                  : 'bg-zinc-50/70 dark:bg-[#202124] hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70 border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-extrabold shrink-0 ${
                      isHighlighted
                        ? 'bg-blue-600 text-white'
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
                      ? 'text-blue-600 dark:text-blue-400'
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
                      navigateOrScrollToStudio(stage.targetTab);
                    }}
                    title={`Jump directly to ${stage.shortTitle} Studio`}
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-500/10 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-400 text-[10px] font-mono font-bold transition-colors shrink-0 cursor-pointer"
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

      {/* Expandable Enterprise Stack IaC & Cross-Studio Handoff Drawer */}
      {drawerOpen && (
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-3 animate-fadeIn">
          {/* Active Stage Details & Quick Studio Jump Bar */}
          {activeStage && (
            <div className="bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                    {activeStage.title || activeStage.shortTitle}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
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
                    onClick={() => navigateOrScrollToStudio(activeStage.targetTab)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors cursor-pointer"
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
                      navigateOrScrollToStudio(
                        activeStage.secondaryTab,
                        activeStage.secondarySubTab
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>
                      {activeStage.secondaryLabel ||
                        `Companion Studio (${activeStage.secondaryTab})`}
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
          )}

          {/* Live Mermaid Architecture & Dataflow Topology (Only for Infrastructure Topology Stages 1–3 when >=1 edge connects real resources; closed by default) */}
          {activeStage &&
            ['STAGE_1_PERIMETER_IAM', 'STAGE_2_STORAGE_LAKEHOUSE', 'STAGE_3_COMPUTE_SERVERLESS'].includes(
              activeStage.id
            ) &&
            activeStage.mermaidDsl &&
            parseMermaidFlowchartLr(activeStage.mermaidDsl).edges.length > 0 && (
            <div className="rounded-xl border border-indigo-500/25 bg-gradient-to-r from-indigo-500/[0.04] via-blue-500/[0.03] to-emerald-500/[0.04] p-3 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div
                  onClick={() => setMermaidExpanded((prev) => !prev)}
                  className="flex items-center gap-2 flex-wrap cursor-pointer select-none"
                >
                  <span className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[10px] font-mono font-extrabold uppercase tracking-wider">
                    Mermaid flowchart LR
                  </span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Stage {activeStage.stepNumber} Interactive Architecture & Dataflow Diagram
                  </span>
                  <span className="text-[10.5px] font-mono text-zinc-500 dark:text-zinc-400">
                    (Draggable SVG Nodes & Subgraphs)
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setMermaidExpanded((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-mono font-bold transition-all cursor-pointer ${
                      mermaidExpanded
                        ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700'
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
                        className={`px-2.5 py-1 rounded-md text-[10.5px] font-mono font-bold transition-colors cursor-pointer ${
                          mermaidViewMode === 'VISUAL'
                            ? 'bg-indigo-600 text-white shadow-sm'
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
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800'
                        }`}
                      >
                        Mermaid .mmd Code
                      </button>
                      {activeStage.mermaidDsl && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(
                                `\`\`\`mermaid\n${activeStage.mermaidDsl}\n\`\`\``,
                                `mmd-stage-${activeStage.id}`
                              )
                            }
                            title="Copy Stage Mermaid diagram wrapped in ```mermaid markdown block for GitHub / Notion / Docs"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10.5px] font-mono font-semibold bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 cursor-pointer"
                          >
                            {copiedKey === `mmd-stage-${activeStage.id}` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-500" />
                                <span>Copied ```mermaid</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy ```mermaid</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleDownloadArtifact(
                                `${projectId}-stage-${activeStage.stepNumber}-${activeStage.id.toLowerCase()}.mmd`,
                                activeStage.mermaidDsl
                              )
                            }
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10.5px] font-mono font-semibold bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            <span>.mmd</span>
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>

              {mermaidExpanded && (
                mermaidViewMode === 'CODE' ? (
                  <pre className="bg-zinc-950 text-indigo-200 border border-zinc-800 rounded-xl p-3 text-[11px] font-mono overflow-x-auto leading-relaxed">
                    {activeStage.mermaidDsl}
                  </pre>
                ) : (
                  <MermaidFlowchartSvg
                    dsl={activeStage.mermaidDsl}
                    topology={activeStage.mermaidTopology}
                    onNodeClick={(node) => {
                      if (node.provisionType && onOpenProvision) {
                        onOpenProvision(node.provisionType);
                      } else if (node.targetTab && onSelectTab) {
                        navigateOrScrollToStudio(node.targetTab);
                      }
                    }}
                  />
                )
              )}
            </div>
          )}

          {/* Stage-Specific Live Inventory Cards & CLI Verification Bar for all 6 Stages */}
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
                          setIacDrawerOpen(true);
                          setTimeout(() => {
                            iacDrawerRef.current?.scrollIntoView({
                              behavior: 'smooth',
                              block: 'nearest',
                            });
                          }, 80);
                        } else if (item.provisionType && onOpenProvision) {
                          onOpenProvision(item.provisionType);
                        } else if (onSelectTab && item.targetTab) {
                          navigateOrScrollToStudio(item.targetTab, item.subTab);
                        }
                      }}
                      className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 transition-colors cursor-pointer flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-[10px] font-mono uppercase text-blue-600 dark:text-blue-400 font-bold">
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

            {/* Stage-Specific CLI Verification Bar + Step Progression */}
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
                          setMermaidExpanded(false);
                        }
                      }}
                      className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold cursor-pointer"
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
