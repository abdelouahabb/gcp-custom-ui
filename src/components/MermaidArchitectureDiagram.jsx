import React, { useState, useMemo, useRef } from 'react';
import {
  Share2,
  Code2,
  Eye,
  Columns,
  Copy,
  Check,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';

/**
 * Parses Mermaid `flowchart TB` / `flowchart LR` / `graph TD` syntax into:
 * - direction ('TB' | 'LR')
 * - subgraphs: [{ id, title, nodes: [{ id, label }] }]
 * - standaloneNodes: [{ id, label }]
 * - edges: [{ from, to, label }]
 */
export function parseMermaidFlowchart(rawCode = '') {
  const lines = String(rawCode || '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('%%'));

  let direction = 'TB';
  const subgraphs = [];
  const nodeMap = new Map(); // id -> { id, label, subgraphId }
  const edges = [];

  let currentSubgraph = null;

  for (const line of lines) {
    // Header line: flowchart TB / graph TD / flowchart LR
    const dirMatch = line.match(/^(?:flowchart|graph)\s+(TB|TD|BT|RL|LR)/i);
    if (dirMatch) {
      const d = dirMatch[1].toUpperCase();
      direction = d === 'LR' || d === 'RL' ? 'LR' : 'TB';
      continue;
    }

    // Subgraph start: subgraph ID["Title"] or subgraph Title
    const subMatch = line.match(
      /^subgraph\s+([A-Za-z0-9_-]+)(?:\s*\["?([^"\]]+)"?\])?/i
    );
    if (subMatch) {
      const id = subMatch[1];
      const title = (subMatch[2] || subMatch[1]).trim();
      currentSubgraph = { id, title, nodes: [] };
      subgraphs.push(currentSubgraph);
      continue;
    }

    if (/^end$/i.test(line)) {
      currentSubgraph = null;
      continue;
    }

    // Check if line contains edge arrows: A --> B or A -->|label| B or A --> B --> C
    if (line.includes('-->') || line.includes('---') || line.includes('-.->')) {
      // Split chained edges like `Client --> Armor --> Run`
      const arrowRegex = /\s*(?:-->|---|\.-?>)(?:\|([^|]*)\|)?\s*/g;
      const parts = [];
      const edgeLabels = [];
      let lastIndex = 0;
      let match;

      while ((match = arrowRegex.exec(line)) !== null) {
        parts.push(line.slice(lastIndex, match.index).trim());
        edgeLabels.push(
          (match[1] || '').trim().replace(/^["']+|["']+$/g, '').trim()
        );
        lastIndex = match.index + match[0].length;
      }
      parts.push(line.slice(lastIndex).trim());

      const extractNode = (token) => {
        const nm = token.match(/^([A-Za-z0-9_-]+)(?:\s*\[["']?([^"'\]]+)["']?\])?/);
        if (!nm) return null;
        const id = nm[1];
        const label = nm[2] ? nm[2].trim() : null;
        if (!nodeMap.has(id)) {
          const nodeObj = {
            id,
            label: label || id,
            subgraphId: currentSubgraph ? currentSubgraph.id : null,
          };
          nodeMap.set(id, nodeObj);
          if (currentSubgraph) currentSubgraph.nodes.push(nodeObj);
        } else if (label) {
          nodeMap.get(id).label = label;
        }
        return id;
      };

      for (let i = 0; i < parts.length - 1; i++) {
        const fromId = extractNode(parts[i]);
        const toId = extractNode(parts[i + 1]);
        if (fromId && toId) {
          edges.push({
            id: `${fromId}->${toId}-${i}`,
            from: fromId,
            to: toId,
            label: edgeLabels[i] || '',
          });
        }
      }
      continue;
    }

    // Standalone node definition: Run["Cloud Run v2 Fleet (3 Services)"]
    const nodeMatch = line.match(
      /^([A-Za-z0-9_-]+)\s*(?:\[\s*["']?([^"'\]]+)["']?\s*\]|\(\s*["']?([^"'\)]+)["']?\s*\))/
    );
    if (nodeMatch) {
      const id = nodeMatch[1];
      const label = (nodeMatch[2] || nodeMatch[3] || id).trim();
      if (!nodeMap.has(id)) {
        const nodeObj = {
          id,
          label,
          subgraphId: currentSubgraph ? currentSubgraph.id : null,
        };
        nodeMap.set(id, nodeObj);
        if (currentSubgraph) {
          currentSubgraph.nodes.push(nodeObj);
        }
      } else {
        nodeMap.get(id).label = label;
      }
    }
  }

  // Group any nodes not inside a subgraph into a default layer if needed
  const standaloneNodes = Array.from(nodeMap.values()).filter(
    (n) => !n.subgraphId
  );

  const layers =
    subgraphs.length > 0
      ? [
          ...subgraphs,
          ...(standaloneNodes.length > 0
            ? [
                {
                  id: 'Standalone',
                  title: 'Connected Cloud Services',
                  nodes: standaloneNodes,
                },
              ]
            : []),
        ]
      : [
          {
            id: 'Architecture',
            title: 'Live Cloud Architecture Topology',
            nodes: Array.from(nodeMap.values()),
          },
        ];

  return {
    direction,
    layers: layers.filter((l) => l.nodes.length > 0),
    nodes: Array.from(nodeMap.values()),
    edges,
  };
}

// Strict Google Cloud Console Blue + Neutral layer palette (Zero Rainbow Layer Cycling)
const LAYER_STYLES = [
  {
    badgeBg: '#1a73e8',
    border: '#1a73e8',
    fill: 'rgba(26, 115, 232, 0.05)',
    nodeAccent: '#1a73e8',
  },
  {
    badgeBg: '#5f6368',
    border: '#5f6368',
    fill: 'rgba(95, 99, 104, 0.05)',
    nodeAccent: '#1a73e8',
  },
  {
    badgeBg: '#1a73e8',
    border: '#1a73e8',
    fill: 'rgba(26, 115, 232, 0.05)',
    nodeAccent: '#1a73e8',
  },
  {
    badgeBg: '#5f6368',
    border: '#5f6368',
    fill: 'rgba(95, 99, 104, 0.05)',
    nodeAccent: '#1a73e8',
  },
];

export default function MermaidArchitectureDiagram({
  code = '',
  chart = '',
  title = 'Live C4 Mermaid Architecture Diagram (Reverse-Compiled)',
  defaultMode = 'VISUAL', // 'VISUAL' | 'SPLIT' | 'CODE'
  onCopy,
}) {
  const effectiveCode = code || chart || '';
  const [viewMode, setViewMode] = useState(defaultMode);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [copied, setCopied] = useState(false);
  const [nodeOffsets, setNodeOffsets] = useState({}); // { [nodeId]: { dx, dy } }
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const dragOriginRef = useRef(null);
  const svgRef = useRef(null);

  const parsed = useMemo(
    () => parseMermaidFlowchart(effectiveCode),
    [effectiveCode]
  );

  // Convert client mouse coordinates into SVG viewBox coordinates
  const clientToSvgPoint = (clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return { x: clientX, y: clientY };
    const rect = svg.getBoundingClientRect();
    const vb = svg.viewBox?.baseVal;
    const vbW = vb?.width || 1200;
    const vbH = vb?.height || 450;
    const scaleX = vbW / Math.max(rect.width, 1);
    const scaleY = vbH / Math.max(rect.height, 1);
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handleNodeMouseDown = (e, nodeId) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const pt = clientToSvgPoint(e.clientX, e.clientY);
    const cur = nodeOffsets[nodeId] || { dx: 0, dy: 0 };
    dragOriginRef.current = {
      nodeId,
      startSvgX: pt.x,
      startSvgY: pt.y,
      origDx: cur.dx,
      origDy: cur.dy,
    };
    setDraggingNodeId(nodeId);
  };

  const handleSvgMouseMove = (e) => {
    if (!dragOriginRef.current) return;
    const pt = clientToSvgPoint(e.clientX, e.clientY);
    const { nodeId, startSvgX, startSvgY, origDx, origDy } = dragOriginRef.current;
    const nextDx = Math.round(origDx + (pt.x - startSvgX));
    const nextDy = Math.round(origDy + (pt.y - startSvgY));
    setNodeOffsets((prev) => ({
      ...prev,
      [nodeId]: { dx: nextDx, dy: nextDy },
    }));
  };

  const handleSvgMouseUp = () => {
    if (dragOriginRef.current) {
      dragOriginRef.current = null;
      setDraggingNodeId(null);
    }
  };

  // Compute deterministic coordinates for every layer and node in the full-width SVG canvas
  // plus apply any interactive user drag offsets (`nodeOffsets`)
  const layout = useMemo(() => {
    const layers = parsed.layers || [];
    const maxCols = Math.max(1, ...layers.map((l) => l.nodes.length));
    const nodeW = 340;
    const nodeH = 68;
    const colGap = 156;
    const layerPadX = 36;
    const layerPadTop = 48;
    const layerPadBottom = 28;
    const layerGapY = 82;

    const canvasW = Math.max(
      1200,
      maxCols * nodeW + Math.max(0, maxCols - 1) * colGap + layerPadX * 2 + 48
    );

    const positionedLayers = [];
    const nodeCoords = new Map();
    let currentY = 24;

    layers.forEach((layer, layerIdx) => {
      const count = layer.nodes.length;
      const layerH = layerPadTop + nodeH + layerPadBottom;
      const totalRowW = count * nodeW + Math.max(0, count - 1) * colGap;
      const startX = (canvasW - totalRowW) / 2;
      const style = LAYER_STYLES[layerIdx % LAYER_STYLES.length];

      const positionedNodes = layer.nodes.map((n, idx) => {
        const drag = nodeOffsets[n.id] || { dx: 0, dy: 0 };
        const x = startX + idx * (nodeW + colGap) + drag.dx;
        const y = currentY + layerPadTop + drag.dy;
        const coord = {
          ...n,
          x,
          y,
          w: nodeW,
          h: nodeH,
          cx: x + nodeW / 2,
          cy: y + nodeH / 2,
          layerIdx,
          accentColor: style.badgeBg,
        };
        nodeCoords.set(n.id, coord);
        return coord;
      });

      positionedLayers.push({
        ...layer,
        x: 24,
        y: currentY,
        w: canvasW - 48,
        h: layerH,
        style,
        nodes: positionedNodes,
      });

      currentY += layerH + layerGapY;
    });

    const canvasH = Math.max(320, currentY - layerGapY + 28);

    // Compute smooth SVG cubic bezier paths for every edge with de-collided label coordinates
    const rawEdges = (parsed.edges || [])
      .map((edge) => {
        const src = nodeCoords.get(edge.from);
        const dst = nodeCoords.get(edge.to);
        if (!src || !dst) return null;

        let x1 = src.cx;
        let y1 = src.y + src.h;
        let x2 = dst.cx;
        let y2 = dst.y;
        let pathD = '';
        let midX = (x1 + x2) / 2;
        let midY = (y1 + y2) / 2;

        if (src.layerIdx === dst.layerIdx && Math.abs(src.cy - dst.cy) < 40) {
          // Same horizontal layer: connect right edge to left edge with a gentle arc so label never collides
          const leftToRight = src.x <= dst.x;
          x1 = leftToRight ? src.x + src.w : src.x;
          y1 = src.cy;
          x2 = leftToRight ? dst.x : dst.x + dst.w;
          y2 = dst.cy;
          const dx = Math.max(30, Math.abs(x2 - x1) * 0.45);
          pathD = `M ${x1} ${y1} C ${leftToRight ? x1 + dx : x1 - dx} ${y1}, ${
            leftToRight ? x2 - dx : x2 + dx
          } ${y2}, ${x2} ${y2}`;
          midX = (x1 + x2) / 2;
          midY = (y1 + y2) / 2;
        } else if (src.cy <= dst.cy) {
          // Top-to-bottom connection: spread x1 slightly toward destination so multiple outgoing edges fan out cleanly
          const spreadX = Math.max(-48, Math.min(48, (dst.cx - src.cx) * 0.14));
          x1 = src.cx + spreadX;
          y1 = src.y + src.h;
          x2 = dst.cx;
          y2 = dst.y - 4;
          const dy = Math.max(28, (y2 - y1) * 0.5);
          pathD = `M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`;
          // Position label closer to destination branch (t=0.58) so fanned-out edges are already separated horizontally
          midX = x1 * 0.36 + x2 * 0.64;
          midY = (y1 + y2) / 2;
        } else {
          // Bottom-to-top connection
          y1 = src.y;
          y2 = dst.y + dst.h + 4;
          const dy = Math.max(28, Math.abs(y1 - y2) * 0.5);
          pathD = `M ${x1} ${y1} C ${x1} ${y1 - dy}, ${x2} ${y2 + dy}, ${x2} ${y2}`;
          midX = (x1 + x2) / 2;
          midY = (y1 + y2) / 2;
        }

        const labelW = edge.label ? edge.label.length * 6.4 + 18 : 0;
        return {
          ...edge,
          x1,
          y1,
          x2,
          y2,
          midX,
          midY,
          labelW,
          pathD,
        };
      })
      .filter(Boolean);

    // De-collide any sibling edge labels whose bounding boxes overlap
    for (let i = 0; i < rawEdges.length; i++) {
      for (let j = i + 1; j < rawEdges.length; j++) {
        const a = rawEdges[i];
        const b = rawEdges[j];
        if (!a.label || !b.label) continue;
        const minSepX = (a.labelW + b.labelW) / 2 + 12;
        const minSepY = 22;
        if (
          Math.abs(a.midY - b.midY) < minSepY &&
          Math.abs(a.midX - b.midX) < minSepX
        ) {
          // Stagger vertically and nudge horizontally so neither label covers the other
          a.midY -= 12;
          b.midY += 12;
          if (a.midX <= b.midX) {
            a.midX -= 14;
            b.midX += 14;
          } else {
            a.midX += 14;
            b.midX -= 14;
          }
        }
      }
    }

    return {
      canvasW,
      canvasH,
      layers: positionedLayers,
      edges: rawEdges,
    };
  }, [parsed, nodeOffsets]);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(effectiveCode || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
    if (onCopy) onCopy();
  };

  // Global Zero-Empty-Diagram Guard: Never render an empty Mermaid container if there are 0 nodes or 0 edges
  if (!effectiveCode || parsed.nodes.length === 0 || parsed.edges.length === 0) {
    return null;
  }

  const handleDownloadSvg = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svgRef.current);
    if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
      svgString = svgString.replace(
        '<svg',
        '<svg xmlns="http://www.w3.org/2000/svg"'
      );
    }
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cloudpulse-c4-architecture.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5 space-y-4 shadow-sm">
      {/* Top Toolbar: Title + View Mode Switcher + Zoom + Export SVG + Copy Mermaid */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Share2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="text-xs font-mono font-extrabold text-zinc-900 dark:text-white truncate">
            {title}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25">
            {parsed.layers.length} Layers · {parsed.nodes.length} Nodes ·{' '}
            {parsed.edges.length} Flows
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* View Mode Switcher */}
          <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('VISUAL')}
              title="Show rendered interactive SVG C4 diagram"
              className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                viewMode === 'VISUAL'
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Visual</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('SPLIT')}
              title="Show both rendered SVG diagram and Mermaid source code"
              className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                viewMode === 'SPLIT'
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Columns className="w-3 h-3" />
              <span>Visual + Code</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('CODE')}
              title="Show raw Mermaid flowchart syntax"
              className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                viewMode === 'CODE'
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Code2 className="w-3 h-3" />
              <span>Code</span>
            </button>
          </div>

          {/* Zoom Controls when Visual is visible */}
          {viewMode !== 'CODE' && (
            <div className="inline-flex items-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-1 py-0.5 gap-0.5">
              <button
                type="button"
                onClick={() =>
                  setZoom((z) => Math.max(0.65, Number((z - 0.15).toFixed(2))))
                }
                title="Zoom Out"
                className="p-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
              >
                <ZoomOut className="w-3 h-3" />
              </button>
              <span className="text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-400 px-1">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() =>
                  setZoom((z) => Math.min(1.6, Number((z + 0.15).toFixed(2))))
                }
                title="Zoom In"
                className="p-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
              {(zoom !== 1 || Object.keys(nodeOffsets).length > 0) && (
                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setNodeOffsets({});
                  }}
                  title="Reset Zoom & Node Positions"
                  className="px-1.5 py-0.5 text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Reset Layout</span>
                </button>
              )}
            </div>
          )}

          {viewMode !== 'CODE' && (
            <button
              type="button"
              onClick={handleDownloadSvg}
              title="Export rendered C4 architecture diagram as a scalable vector graphic (.svg)"
              className="px-2.5 py-1 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[10px] font-mono font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Download className="w-3 h-3" />
              <span>Export .svg</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyCode}
            title="Copy Mermaid flowchart code to clipboard"
            className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-mono font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                <span>Copied Mermaid</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy Mermaid</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Rendered Browser SVG Visualization (Full Width & Draggable Nodes) */}
      {viewMode !== 'CODE' && (
        <div className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 overflow-x-auto p-3">
          <div
            className="w-full"
            style={{
              minWidth: zoom > 1 ? `${Math.round(layout.canvasW * zoom)}px` : '100%',
            }}
          >
            <svg
              ref={svgRef}
              viewBox={`0 0 ${layout.canvasW} ${layout.canvasH}`}
              preserveAspectRatio="xMidYMid meet"
              width="100%"
              onMouseMove={handleSvgMouseMove}
              onMouseUp={handleSvgMouseUp}
              onMouseLeave={handleSvgMouseUp}
              style={{
                width: '100%',
                height: 'auto',
                minHeight: `${Math.round(layout.canvasH * 0.85 * zoom)}px`,
                cursor: draggingNodeId ? 'grabbing' : 'default',
              }}
              className="block w-full select-none"
            >
              <defs>
                <marker
                  id="mermaid-arrow-default"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#60a5fa" />
                </marker>
                <marker
                  id="mermaid-arrow-active"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#34d399" />
                </marker>
                <pattern
                  id="mermaid-grid-dots"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="2" cy="2" r="1" fill="rgba(255,255,255,0.06)" />
                </pattern>
              </defs>

              {/* Subtle architectural dot-grid canvas background */}
              <rect
                x="0"
                y="0"
                width={layout.canvasW}
                height={layout.canvasH}
                rx="12"
                fill="#09090b"
              />
              <rect
                x="0"
                y="0"
                width={layout.canvasW}
                height={layout.canvasH}
                rx="12"
                fill="url(#mermaid-grid-dots)"
              />

              {/* 1. Subgraph Architectural Boundary Swimlanes */}
              {layout.layers.map((layer, idx) => (
                <g key={layer.id}>
                  <rect
                    x={layer.x}
                    y={layer.y}
                    width={layer.w}
                    height={layer.h}
                    rx="12"
                    fill={layer.style.fill}
                    stroke={layer.style.border}
                    strokeWidth="1.25"
                    strokeDasharray="5 4"
                  />
                  {/* Subgraph Header Pill */}
                  <rect
                    x={layer.x + 14}
                    y={layer.y + 10}
                    width={Math.min(
                      layer.w - 28,
                      Math.max(190, layer.title.length * 7.2 + 56)
                    )}
                    height="22"
                    rx="6"
                    fill="#18181b"
                    stroke={layer.style.border}
                    strokeWidth="1"
                  />
                  <circle
                    cx={layer.x + 26}
                    cy={layer.y + 21}
                    r="4"
                    fill={layer.style.badgeBg}
                  />
                  <text
                    x={layer.x + 36}
                    y={layer.y + 25}
                    fill="#f4f4f5"
                    fontSize="11"
                    fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
                    fontWeight="700"
                  >
                    L{idx + 1} · {layer.title}
                  </text>
                </g>
              ))}

              {/* 2. Directed Bezier Edge Curves + Animated Flow Particles */}
              {layout.edges.map((edge) => {
                const isHighlighted =
                  hoveredNodeId &&
                  (edge.from === hoveredNodeId || edge.to === hoveredNodeId);
                const isDimmed = hoveredNodeId && !isHighlighted;
                return (
                  <g
                    key={edge.id}
                    opacity={isDimmed ? 0.25 : 1}
                    style={{ transition: 'opacity 150ms ease' }}
                  >
                    <path
                      d={edge.pathD}
                      fill="none"
                      stroke={isHighlighted ? '#34d399' : '#60a5fa'}
                      strokeWidth={isHighlighted ? '2.5' : '1.75'}
                      markerEnd={
                        isHighlighted
                          ? 'url(#mermaid-arrow-active)'
                          : 'url(#mermaid-arrow-default)'
                      }
                    />
                    <circle
                      r={isHighlighted ? '3.5' : '2.5'}
                      fill={isHighlighted ? '#34d399' : '#93c5fd'}
                    >
                      <animateMotion
                        dur={isHighlighted ? '1.6s' : '2.8s'}
                        repeatCount="indefinite"
                        path={edge.pathD}
                      />
                    </circle>
                  </g>
                );
              })}

              {/* 3. Interactive & Draggable Architecture Nodes */}
              {layout.layers.flatMap((layer) =>
                layer.nodes.map((node) => {
                  const isHovered = hoveredNodeId === node.id;
                  const isDraggingThis = draggingNodeId === node.id;
                  const isConnected =
                    hoveredNodeId &&
                    layout.edges.some(
                      (e) =>
                        (e.from === hoveredNodeId && e.to === node.id) ||
                        (e.to === hoveredNodeId && e.from === node.id)
                    );
                  const isDimmed =
                    hoveredNodeId && !isHovered && !isConnected;

                  const rawLabel = String(node.label || node.id);
                  const line1 =
                    rawLabel.length > 44
                      ? rawLabel.slice(0, 44)
                      : rawLabel;
                  const line2 =
                    rawLabel.length > 44
                      ? rawLabel.slice(44, 88) +
                        (rawLabel.length > 88 ? '…' : '')
                      : '';

                  return (
                    <g
                      key={node.id}
                      onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                      onMouseEnter={() => setHoveredNodeId(node.id)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                      style={{
                        cursor: isDraggingThis ? 'grabbing' : 'grab',
                        transition: isDraggingThis ? 'none' : 'opacity 150ms ease',
                      }}
                      opacity={isDimmed ? 0.35 : 1}
                    >
                      <rect
                        x={node.x}
                        y={node.y}
                        width={node.w}
                        height={node.h}
                        rx="10"
                        fill={isHovered || isDraggingThis ? '#1e293b' : '#18181b'}
                        stroke={
                          isHovered || isDraggingThis
                            ? '#34d399'
                            : isConnected
                            ? '#60a5fa'
                            : node.accentColor
                        }
                        strokeWidth={isHovered || isConnected || isDraggingThis ? '2.2' : '1.4'}
                      />
                      {/* Top-left Node ID pill */}
                      <rect
                        x={node.x + 10}
                        y={node.y + 8}
                        width={Math.min(
                          node.w - 20,
                          Math.max(44, node.id.length * 6.8 + 14)
                        )}
                        height="16"
                        rx="4"
                        fill={node.accentColor}
                      />
                      <text
                        x={node.x + 17}
                        y={node.y + 19}
                        fill="#ffffff"
                        fontSize="9.5"
                        fontFamily="ui-monospace, monospace"
                        fontWeight="700"
                      >
                        {node.id}
                      </text>

                      {/* Drag Hint on Hover */}
                      {(isHovered || isDraggingThis) && (
                        <text
                          x={node.x + node.w - 12}
                          y={node.y + 19}
                          textAnchor="end"
                          fill="#34d399"
                          fontSize="8.5"
                          fontFamily="ui-monospace, monospace"
                          fontWeight="700"
                        >
                          {isDraggingThis ? 'DRAGGING…' : '⇄ DRAG'}
                        </text>
                      )}

                      {/* Node Label Line 1 & 2 */}
                      <text
                        x={node.x + 12}
                        y={line2 ? node.y + 39 : node.y + 44}
                        fill="#f4f4f5"
                        fontSize="11"
                        fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
                        fontWeight="700"
                      >
                        {line1}
                      </text>
                      {line2 && (
                        <text
                          x={node.x + 12}
                          y={node.y + 53}
                          fill="#a1a1aa"
                          fontSize="10"
                          fontFamily="ui-monospace, monospace"
                        >
                          {line2}
                        </text>
                      )}
                    </g>
                  );
                })
              )}

              {/* 4. Top-Layer Edge Label Pills (Rendered above nodes so labels are never hidden behind boxes) */}
              {layout.edges.map((edge) => {
                if (!edge.label) return null;
                const isHighlighted =
                  hoveredNodeId &&
                  (edge.from === hoveredNodeId || edge.to === hoveredNodeId);
                const isDimmed = hoveredNodeId && !isHighlighted;
                const pillW = edge.label.length * 6.2 + 16;
                return (
                  <g
                    key={`lbl-${edge.id}`}
                    opacity={isDimmed ? 0.25 : 1}
                    style={{ pointerEvents: 'none', transition: 'opacity 150ms ease' }}
                  >
                    <rect
                      x={edge.midX - pillW / 2}
                      y={edge.midY - 9.5}
                      width={pillW}
                      height="19"
                      rx="4.5"
                      fill="#09090b"
                      fillOpacity="0.96"
                      stroke={isHighlighted ? '#34d399' : '#3f3f46'}
                      strokeWidth={isHighlighted ? '1.3' : '1'}
                    />
                    <text
                      x={edge.midX}
                      y={edge.midY + 3.2}
                      textAnchor="middle"
                      fill={isHighlighted ? '#a7f3d0' : '#e4e4e7'}
                      fontSize="9.5"
                      fontFamily="ui-monospace, monospace"
                      fontWeight={isHighlighted ? '700' : '500'}
                    >
                      {edge.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="px-2 pt-1.5 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-zinc-400">
            <span>
              Drag any node to reposition it · Hover any node to highlight upstream &amp; downstream paths.
            </span>
            <span>
              Rendered natively in browser SVG · Zero external runtime bloat
            </span>
          </div>
        </div>
      )}

      {/* Raw Mermaid Code Block (shown in SPLIT or CODE mode) */}
      {viewMode !== 'VISUAL' && (
        <pre className="p-3 rounded-xl bg-zinc-950 text-emerald-400 border border-zinc-800 text-[10.5px] font-mono overflow-x-auto max-h-48">
          {effectiveCode}
        </pre>
      )}
    </div>
  );
}
