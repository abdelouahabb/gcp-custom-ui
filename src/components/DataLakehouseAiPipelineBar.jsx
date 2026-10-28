import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  Database,
  HardDrive,
  Layers,
  GitMerge,
  Sparkles,
  History,
  ArrowRight,
  Terminal,
  Copy,
  Check,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  FileCode2,
  Play,
} from 'lucide-react';

const STAGE_ICONS = {
  STAGE_1_RAW_INGESTION: HardDrive,
  STAGE_2_BIGLAKE_FEDERATION: Layers,
  STAGE_3_MEDALLION_WAREHOUSE: Database,
  STAGE_4_DATAFORM_AIRFLOW: GitMerge,
  STAGE_5_BQML_VERTEX_AI: Sparkles,
  STAGE_6_TIMETRAVEL_LINEAGE: History,
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
          defaultSg = { id: '__DEFAULT__', label: 'Lakehouse Nodes', nodes: [] };
          subgraphs.push(defaultSg);
        }
        defaultSg.nodes.push(nodeObj);
      }
    }
  }

  return { subgraphs, edges, nodeMap };
}

function inferLakehouseTabFromNodeId(nodeId = '', label = '') {
  const id = String(nodeId).toUpperCase();
  const text = String(label).toUpperCase();
  if (id.startsWith('BKT') || text.includes('GS://')) {
    return { targetTab: 'CLOUD_STORAGE', subtitle: 'Click to open Cloud Storage Studio' };
  }
  if (id.startsWith('PS') || text.includes('PUB/SUB')) {
    return {
      targetTab: 'DATA_ENGINEER_STUDIO',
      subTab: 'PUBSUB_STREAMING',
      subtitle: 'Click to open Pub/Sub & Eventarc Studio',
    };
  }
  if (id.startsWith('BL') || text.includes('BIGLAKE') || text.includes('ICEBERG')) {
    return { targetTab: 'BIGLAKE_STUDIO', subtitle: 'Click to open BigLake Iceberg Studio' };
  }
  if (id.startsWith('SQL')) {
    return { targetTab: 'CLOUD_SQL_STUDIO', subtitle: 'Click to open Cloud SQL & AlloyDB Studio' };
  }
  if (id.startsWith('SPN')) {
    return { targetTab: 'WAVE10_FRONTIER', subtitle: 'Click to open Cloud Spanner Studio' };
  }
  if (id.startsWith('DS') || id.startsWith('TBL') || text.includes('DATASET')) {
    return { targetTab: 'BIGQUERY_STUDIO', subtitle: 'Click to open BigQuery Studio' };
  }
  return null;
}

function LakehouseMermaidFlowchartSvg({ dsl, onNodeClick }) {
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
  if (!subgraphs.length) return null;

  const colW = 280;
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
      const topoHint = inferLakehouseTabFromNodeId(n.id, n.label);

      const parts = String(n.label || '').split(':');
      const primaryTitle =
        parts.length > 1 ? parts[0].trim() : n.label.slice(0, 34);
      const secondarySub =
        parts.length > 1
          ? parts.slice(1).join(':').trim()
          : topoHint?.subtitle || 'Live Lakehouse Telemetry';

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
      sgFill: 'rgba(16, 185, 129, 0.06)',
      sgStroke: 'rgba(16, 185, 129, 0.38)',
      badgeBg: '#047857',
      nodeStroke: '#10b981',
    },
    {
      sgFill: 'rgba(59, 130, 246, 0.06)',
      sgStroke: 'rgba(59, 130, 246, 0.38)',
      badgeBg: '#1d4ed8',
      nodeStroke: '#3b82f6',
    },
    {
      sgFill: 'rgba(139, 92, 246, 0.06)',
      sgStroke: 'rgba(139, 92, 246, 0.38)',
      badgeBg: '#6d28d9',
      nodeStroke: '#8b5cf6',
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
          ✥ Interactive Lakehouse Canvas: Drag any Node or Subgraph to rearrange (click a node without dragging to jump to its Data Studio)
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setZoomPct((z) => Math.max(70, z - 15))}
            className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold cursor-pointer"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => setZoomPct(100)}
            className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-bold cursor-pointer"
          >
            {zoomPct}%
          </button>
          <button
            type="button"
            onClick={() => setZoomPct((z) => Math.min(145, z + 15))}
            className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold cursor-pointer"
          >
            +
          </button>
          {hasCustomLayout && (
            <button
              type="button"
              onClick={() => setOffsets({})}
              className="px-2 py-0.5 rounded bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-500/40 font-bold cursor-pointer"
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
        aria-label="Live Interactive Lakehouse & AI Mermaid Flowchart"
      >
        <defs>
          <marker
            id="lh-mmd-arrow"
            viewBox="0 0 10 10"
            refX="8.5"
            refY="5"
            markerWidth="6.5"
            markerHeight="6.5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#34d399" />
          </marker>
          <pattern
            id="lh-mmd-grid"
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1" fill="rgba(148, 163, 184, 0.12)" />
          </pattern>
        </defs>

        <rect width={svgW} height={svgH} rx="10" fill="url(#lh-mmd-grid)" />

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
                stroke={isDraggingSg ? '#34d399' : pal.sgStroke}
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

        {edges.map((edge, eIdx) => {
          const nA = positionedNodes.get(edge.from);
          const nB = positionedNodes.get(edge.to);
          if (!nA || !nB) return null;

          let pathD = '';
          let labelX = 0;
          let labelY = 0;
          const deltaX = nB.cx - nA.cx;
          const deltaY = nB.cy - nA.cy;

          if (Math.abs(deltaX) < nA.w * 0.65) {
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
              <path
                d={pathD}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeOpacity="0.75"
                markerEnd="url(#lh-mmd-arrow)"
              />
              <path
                d={pathD}
                fill="none"
                stroke="#38bdf8"
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
                    fill="#064e3b"
                    stroke="#10b981"
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="3.5"
                    textAnchor="middle"
                    fill="#d1fae5"
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

        {positionedSubgraphs.flatMap((sg, idx) => {
          const pal = PALETTES[idx % PALETTES.length];
          return sg.nodes.map((node) => {
            const isDraggingNode = activeDragKey === `node:${node.id}`;
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
                  fill="#161b22"
                  stroke={isDraggingNode ? '#34d399' : pal.nodeStroke}
                  strokeWidth={isDraggingNode ? '2.4' : '1.6'}
                />
                <rect
                  x={node.x + 1}
                  y={node.y + 6}
                  width="4"
                  height={node.h - 12}
                  rx="2"
                  fill={pal.nodeStroke}
                />
                <rect
                  x={node.x + node.w - 52}
                  y={node.y + 6}
                  width="44"
                  height="15"
                  rx="4"
                  fill="rgba(16, 185, 129, 0.16)"
                />
                <text
                  x={node.x + node.w - 30}
                  y={node.y + 16.5}
                  textAnchor="middle"
                  fill="#6ee7b7"
                  fontSize="8.5"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  fontWeight="700"
                >
                  {truncate(`✥ ${node.id}`, 8)}
                </text>
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

export default function DataLakehouseAiPipelineBar({
  projectId,
  activeTab,
  onOpenProvision,
  onSelectTab,
  onOpenBigQuerySql,
  onRunInShell,
  onShowToast,
}) {
  const [blueprint, setBlueprint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState(null);
  const [selectedArtifactTab, setSelectedArtifactTab] = useState('dataformSqlx'); // 'dataformSqlx' | 'composerAirflowDagPy' | 'bqmlGeminiSql'
  const [mermaidExpanded, setMermaidExpanded] = useState(false);
  const [mermaidViewMode, setMermaidViewMode] = useState('VISUAL');
  const [copiedKey, setCopiedKey] = useState(null);

  const fetchBlueprint = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/lakehouse-ai-pipeline/blueprint`,
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
      id: 'STAGE_1_RAW_INGESTION',
      stepNumber: 1,
      shortTitle: 'GCS Lake & Pub/Sub',
      targetTab: 'CLOUD_STORAGE',
      secondaryTab: 'DATA_ENGINEER_STUDIO',
      secondarySubTab: 'PUBSUB_STREAMING',
      secondaryLabel: 'Pub/Sub & Eventarc Studio',
      status: 'OPTIMAL',
      metricBadge: 'Raw Lake & Streams',
      summary: 'Cloud Storage raw lake landing zones & Pub/Sub event streams.',
      cliCmd: `gcloud storage buckets list --project=${projectId}`,
      mermaidDsl: null,
    },
    {
      id: 'STAGE_2_BIGLAKE_FEDERATION',
      stepNumber: 2,
      shortTitle: 'BigLake & Federation',
      targetTab: 'BIGLAKE_STUDIO',
      secondaryTab: 'CLOUD_SQL_STUDIO',
      secondaryLabel: 'Cloud SQL & AlloyDB Studio',
      status: 'OPTIMAL',
      metricBadge: 'Iceberg & Zero-Copy',
      summary: 'BigLake Apache Iceberg REST catalog & Cloud SQL / Spanner federation.',
      cliCmd: `gcloud alpha bq connections list --project=${projectId} --location=us`,
      mermaidDsl: null,
    },
    {
      id: 'STAGE_3_MEDALLION_WAREHOUSE',
      stepNumber: 3,
      shortTitle: 'BigQuery Medallion',
      targetTab: 'BIGQUERY_STUDIO',
      secondaryTab: 'DATA_ENGINEER_STUDIO',
      secondarySubTab: 'MEDALLION_ELT',
      secondaryLabel: '3-Tier Medallion Architect',
      status: 'OPTIMAL',
      metricBadge: 'Bronze / Silver / Gold',
      summary: 'BigQuery analytical datasets, Capacitor storage & SQL X-Ray.',
      cliCmd: `bq ls --project_id=${projectId}`,
      mermaidDsl: null,
    },
    {
      id: 'STAGE_4_DATAFORM_AIRFLOW',
      stepNumber: 4,
      shortTitle: 'Dataform & Airflow DAG',
      targetTab: 'DATA_ENGINEER_STUDIO',
      secondaryTab: 'BIGQUERY_STUDIO',
      secondaryLabel: 'Open SQL in BigQuery Studio',
      status: 'OPTIMAL',
      metricBadge: 'SQLX + Airflow DAG',
      summary: 'Synthesizes Dataform incremental SQLX & Cloud Composer Airflow DAG.',
      cliCmd: `gcloud artifacts repositories list --project=${projectId}`,
      mermaidDsl: null,
    },
    {
      id: 'STAGE_5_BQML_VERTEX_AI',
      stepNumber: 5,
      shortTitle: 'BQML & Vertex AI',
      targetTab: 'MCP_HUB',
      secondaryTab: 'BIGQUERY_STUDIO',
      secondaryLabel: 'Run ML.GENERATE_TEXT in BigQuery',
      status: 'OPTIMAL',
      metricBadge: 'Gemini 2.5 Flash SQL',
      summary: 'In-warehouse ML.GENERATE_TEXT, Vector Search & Vertex AI RAG.',
      cliCmd: `gcloud services list --enabled --project=${projectId}`,
      mermaidDsl: null,
    },
    {
      id: 'STAGE_6_TIMETRAVEL_LINEAGE',
      stepNumber: 6,
      shortTitle: '168h Time-Travel & Vault',
      targetTab: 'RECYCLE_BIN',
      secondaryTab: 'BIGQUERY_STUDIO',
      secondaryLabel: 'Run FOR SYSTEM_TIME AS OF in BigQuery',
      status: 'OPTIMAL',
      metricBadge: '168h BQ · 7d GCS',
      summary: '168-hour BigQuery Time-Travel, 7-day GCS Soft-Delete & Column Lineage.',
      cliCmd: `gcloud storage buckets list --project=${projectId}`,
      mermaidDsl: null,
    },
  ];

  const activeStage =
    stages.find((s) => s.id === selectedStageId) ||
    stages.find((s) => s.targetTab === activeTab || s.secondaryTab === activeTab) ||
    stages[0];

  const activeArtifactContent =
    selectedArtifactTab === 'dataformSqlx'
      ? blueprint?.artifacts?.dataformSqlx
      : selectedArtifactTab === 'composerAirflowDagPy'
      ? blueprint?.artifacts?.composerAirflowDagPy
      : blueprint?.artifacts?.bqmlGeminiSql;

  const activeArtifactFilename =
    selectedArtifactTab === 'dataformSqlx'
      ? `medallion_lakehouse_${projectId}.sqlx`
      : selectedArtifactTab === 'composerAirflowDagPy'
      ? `cloudpulse_${projectId}_lakehouse_dag.py`
      : `bqml_gemini_${projectId}.sql`;

  return (
    <div
      data-feature-id="WAVE3_LAKEHOUSE_AI_PIPELINE"
      className="bg-white dark:bg-[#18191b] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-3"
    >
      {/* Top Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Wave 3: 6-Stage Data, Lakehouse & AI Pipeline Glue
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                {blueprint?.counts?.buckets ?? 0} GCS · {blueprint?.counts?.datasets ?? 0} BQ · {blueprint?.counts?.dataAiApis ?? 'Live'} Data/AI APIs
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              End-to-end Lakehouse & GenAI pipeline connecting GCS Raw Lakes, BigLake Iceberg Federation, BigQuery Medallion Marts, Dataform SQLX + Airflow DAGs, BQML Gemini 2.5 Flash, and 168h Time-Travel.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              if (drawerOpen && activeStage?.id === 'STAGE_4_DATAFORM_AIRFLOW') {
                setDrawerOpen(false);
              } else {
                setSelectedStageId('STAGE_4_DATAFORM_AIRFLOW');
                setDrawerOpen(true);
              }
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              drawerOpen && activeStage?.id === 'STAGE_4_DATAFORM_AIRFLOW'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>Step 4: Synthesize Lakehouse Code (`.sqlx` + `dag.py` + `BQML`)</span>
            {drawerOpen && activeStage?.id === 'STAGE_4_DATAFORM_AIRFLOW' ? (
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
            title="Re-scan live GCS, BigLake, BigQuery, Pub/Sub, Cloud SQL, Spanner & Vertex AI inventory"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync Lakehouse</span>
          </button>
        </div>
      </div>

      {/* 6-Stage Interactive Lakehouse & AI Pipeline Chain */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2">
        {stages.map((stage, idx) => {
          const IconComponent = STAGE_ICONS[stage.id] || Database;
          const isCurrentTab =
            activeTab === stage.targetTab || activeTab === stage.secondaryTab;
          const isSelectedStage = activeStage?.id === stage.id && drawerOpen;
          const isActionRecommended = stage.status === 'ACTION_RECOMMENDED';

          return (
            <div
              key={stage.id}
              onClick={() => {
                if (drawerOpen && selectedStageId === stage.id) {
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
                isCurrentTab || isSelectedStage
                  ? 'bg-emerald-50/90 dark:bg-emerald-950/35 border-emerald-500/60 shadow-sm ring-1 ring-emerald-500/30'
                  : 'bg-zinc-50/70 dark:bg-[#202124] hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70 border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-extrabold shrink-0 ${
                      isCurrentTab || isSelectedStage
                        ? 'bg-emerald-600 text-white'
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
                    isCurrentTab || isSelectedStage
                      ? 'text-emerald-600 dark:text-emerald-400'
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
                      onSelectTab(stage.targetTab, stage.secondarySubTab);
                    }}
                    title={`Jump directly to ${stage.shortTitle} Studio`}
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-600 hover:text-white text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold transition-colors shrink-0 cursor-pointer"
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

      {/* Expandable Wave 3 Lakehouse & AI Stage Drawer (Closed by Default) */}
      {drawerOpen && (
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-3 animate-fadeIn">
          {activeStage && (
            <div className="bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                    {activeStage.title || activeStage.shortTitle}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
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
                    onClick={() => onSelectTab(activeStage.targetTab)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Primary Studio ({activeStage.targetTab})</span>
                  </button>
                )}
                {activeStage.sampleSql && onOpenBigQuerySql && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenBigQuerySql(activeStage.sampleSql);
                      onShowToast?.(
                        `Loaded Stage ${activeStage.stepNumber} Lakehouse SQL into BigQuery Studio`
                      );
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Load Stage SQL in BigQuery Studio</span>
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

          {/* Interactive Draggable Mermaid Flowchart (Exclusively for Topology Stages 1–3 when non-zero resources exist; closed by default) */}
          {activeStage &&
            [
              'STAGE_1_RAW_INGESTION',
              'STAGE_2_BIGLAKE_FEDERATION',
              'STAGE_3_MEDALLION_WAREHOUSE',
            ].includes(activeStage.id) &&
            activeStage.mermaidDsl && (
              <div className="rounded-xl border border-emerald-500/25 bg-gradient-to-r from-emerald-500/[0.04] via-teal-500/[0.03] to-blue-500/[0.04] p-3 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div
                    onClick={() => setMermaidExpanded((prev) => !prev)}
                    className="flex items-center gap-2 flex-wrap cursor-pointer select-none"
                  >
                    <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-mono font-extrabold uppercase tracking-wider">
                      Mermaid flowchart LR
                    </span>
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Stage {activeStage.stepNumber} Interactive Lakehouse Topology Diagram
                    </span>
                    <span className="text-[10.5px] font-mono text-zinc-500 dark:text-zinc-400">
                      (Draggable SVG Nodes & Subgraphs · Non-Zero Resources Only)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setMermaidExpanded((prev) => !prev)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-mono font-bold transition-all cursor-pointer ${
                        mermaidExpanded
                          ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
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
                              ? 'bg-emerald-600 text-white shadow-sm'
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
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800'
                          }`}
                        >
                          Mermaid .mmd Code
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              `\`\`\`mermaid\n${activeStage.mermaidDsl}\n\`\`\``,
                              `mmd-lh-${activeStage.id}`
                            )
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10.5px] font-mono font-semibold bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 cursor-pointer"
                        >
                          {copiedKey === `mmd-lh-${activeStage.id}` ? (
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
                              `${projectId}-lakehouse-stage-${activeStage.stepNumber}.mmd`,
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
                  </div>
                </div>

                {mermaidExpanded &&
                  (mermaidViewMode === 'CODE' ? (
                    <pre className="bg-zinc-950 text-emerald-200 border border-zinc-800 rounded-xl p-3 text-[11px] font-mono overflow-x-auto leading-relaxed">
                      {activeStage.mermaidDsl}
                    </pre>
                  ) : (
                    <LakehouseMermaidFlowchartSvg
                      dsl={activeStage.mermaidDsl}
                      onNodeClick={(hint) => {
                        if (hint?.targetTab && onSelectTab) {
                          onSelectTab(hint.targetTab, hint.subTab);
                        }
                      }}
                    />
                  ))}
              </div>
            )}

          {/* Stage-Specific Content: Step 4 shows the Dataform SQLX / Airflow DAG / BQML Code Synthesizer; Steps 1, 2, 3, 5, 6 show Live Cards */}
          {activeStage?.id === 'STAGE_4_DATAFORM_AIRFLOW' ? (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setSelectedArtifactTab('dataformSqlx')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                      selectedArtifactTab === 'dataformSqlx'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    medallion_lakehouse.sqlx (Dataform Incremental)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedArtifactTab('composerAirflowDagPy')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                      selectedArtifactTab === 'composerAirflowDagPy'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    cloudpulse_lakehouse_dag.py (Cloud Composer Airflow)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedArtifactTab('bqmlGeminiSql')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                      selectedArtifactTab === 'bqmlGeminiSql'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    bqml_gemini.sql (BigQuery ML + Gemini 2.5 Flash)
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {selectedArtifactTab === 'bqmlGeminiSql' &&
                    onOpenBigQuerySql &&
                    activeArtifactContent && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenBigQuerySql(activeArtifactContent);
                          onShowToast?.(
                            'Loaded BQML Gemini 2.5 Flash SQL into BigQuery Studio'
                          );
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Open in BigQuery Studio</span>
                      </button>
                    )}

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
                {activeArtifactContent || '# Synthesizing live Lakehouse & AI code...'}
              </pre>
            </div>
          ) : (
            <div className="space-y-2.5">
              {Array.isArray(activeStage?.stageItems) &&
                activeStage.stageItems.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {activeStage.stageItems.map((item, idx) => (
                      <div
                        key={`${item.name}-${idx}`}
                        onClick={() => {
                          if (item.sqlPayload && onOpenBigQuerySql) {
                            onOpenBigQuerySql(item.sqlPayload);
                            onShowToast?.(
                              `Loaded "${item.name}" into BigQuery Studio`
                            );
                          } else if (item.provisionType && onOpenProvision) {
                            onOpenProvision(item.provisionType);
                          } else if (onSelectTab && item.targetTab) {
                            onSelectTab(item.targetTab, item.subTab);
                          }
                        }}
                        className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 transition-colors cursor-pointer flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="text-[10px] font-mono uppercase text-emerald-600 dark:text-emerald-400 font-bold">
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
                        handleCopy(activeStage.cliCmd, `lh-cli-${activeStage.id}`)
                      }
                      className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold cursor-pointer"
                    >
                      {copiedKey === `lh-cli-${activeStage.id}`
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
                        className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer"
                      >
                        Next: Step {activeStage.stepNumber + 1} →
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
