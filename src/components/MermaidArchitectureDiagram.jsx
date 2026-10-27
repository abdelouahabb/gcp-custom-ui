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
        edgeLabels.push((match[1] || '').trim());
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

// Strict Google Cloud Console 4-color + Neutral layer palette
const LAYER_STYLES = [
  {
    badgeBg: '#1a73e8',
    border: '#1a73e8',
    fill: 'rgba(26, 115, 232, 0.06)',
    nodeAccent: '#1a73e8',
  },
  {
    badgeBg: '#1e8e3e',
    border: '#1e8e3e',
    fill: 'rgba(30, 142, 62, 0.06)',
    nodeAccent: '#1e8e3e',
  },
  {
    badgeBg: '#f9ab00',
    border: '#f9ab00',
    fill: 'rgba(249, 171, 0, 0.06)',
    nodeAccent: '#d93025',
  },
  {
    badgeBg: '#5f6368',
    border: '#5f6368',
    fill: 'rgba(95, 99, 104, 0.06)',
    nodeAccent: '#1a73e8',
  },
];

export default function MermaidArchitectureDiagram({
  code = '',
  title = 'Live C4 Mermaid Architecture Diagram (Reverse-Compiled)',
  defaultMode = 'SPLIT', // 'VISUAL' | 'SPLIT' | 'CODE'
  onCopy,
}) {
  const [viewMode, setViewMode] = useState(defaultMode);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [copied, setCopied] = useState(false);
  const svgRef = useRef(null);

  const parsed = useMemo(() => parseMermaidFlowchart(code), [code]);

  // Compute deterministic coordinates for every layer and node in the SVG canvas
  const layout = useMemo(() => {
    const layers = parsed.layers || [];
    const maxCols = Math.max(1, ...layers.map((l) => l.nodes.length));
    const nodeW = 240;
    const nodeH = 62;
    const colGap = 36;
    const layerPadX = 32;
    const layerPadTop = 44;
    const layerPadBottom = 24;
    const layerGapY = 46;

    const canvasW = Math.max(
      760,
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
        const x = startX + idx * (nodeW + colGap);
        const y = currentY + layerPadTop;
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

    const canvasH = Math.max(260, currentY - layerGapY + 24);

    // Compute smooth SVG cubic bezier paths for every edge
    const positionedEdges = (parsed.edges || [])
      .map((edge) => {
        const src = nodeCoords.get(edge.from);
        const dst = nodeCoords.get(edge.to);
        if (!src || !dst) return null;

        let x1 = src.cx;
        let y1 = src.y + src.h;
        let x2 = dst.cx;
        let y2 = dst.y;
        let pathD = '';

        if (src.layerIdx === dst.layerIdx) {
          // Same horizontal layer: connect right edge to left edge (or vice versa)
          const leftToRight = src.x <= dst.x;
          x1 = leftToRight ? src.x + src.w : src.x;
          y1 = src.cy;
          x2 = leftToRight ? dst.x : dst.x + dst.w;
          y2 = dst.cy;
          const dx = Math.abs(x2 - x1) * 0.45;
          pathD = `M ${x1} ${y1} C ${leftToRight ? x1 + dx : x1 - dx} ${y1}, ${
            leftToRight ? x2 - dx : x2 + dx
          } ${y2}, ${x2} ${y2}`;
        } else if (src.y < dst.y) {
          // Top-to-bottom connection
          y1 = src.y + src.h;
          y2 = dst.y - 4;
          const dy = Math.max(24, (y2 - y1) * 0.5);
          pathD = `M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`;
        } else {
          // Bottom-to-top connection
          y1 = src.y;
          y2 = dst.y + dst.h + 4;
          const dy = Math.max(24, Math.abs(y1 - y2) * 0.5);
          pathD = `M ${x1} ${y1} C ${x1} ${y1 - dy}, ${x2} ${y2 + dy}, ${x2} ${y2}`;
        }

        return {
          ...edge,
          x1,
          y1,
          x2,
          y2,
          midX: (x1 + x2) / 2,
          midY: (y1 + y2) / 2,
          pathD,
        };
      })
      .filter(Boolean);

    return {
      canvasW,
      canvasH,
      layers: positionedLayers,
      edges: positionedEdges,
    };
  }, [parsed]);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(code || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
    if (onCopy) onCopy();
  };

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
    <div className="bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5 space-y-3.5 shadow-sm">
      {/* Top Toolbar: Title + View Mode Switcher + Zoom + Export SVG + Copy Mermaid */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Share2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="text-xs font-mono font-extrabold text-zinc-900 dark:text-white truncate">
            {title}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25">
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
              {zoom !== 1 && (
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  title="Reset Zoom to 100%"
                  className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          )}

          {viewMode !== 'CODE' && (
            <button
              type="button"
              onClick={handleDownloadSvg}
              title="Export rendered C4 architecture diagram as a scalable vector graphic (.svg)"
              className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[10px] font-mono font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Download className="w-3 h-3" />
              <span>Export .svg</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyCode}
            title="Copy Mermaid flowchart code to clipboard"
            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-mono font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
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

      {/* Rendered Browser SVG Visualization */}
      {viewMode !== 'CODE' && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 overflow-x-auto p-2">
          <div
            style={{
              minWidth: `${Math.round(layout.canvasW * zoom)}px`,
            }}
          >
            <svg
              ref={svgRef}
              viewBox={`0 0 ${layout.canvasW} ${layout.canvasH}`}
              width="100%"
              height={Math.round(layout.canvasH * zoom)}
              className="block select-none"
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

              {/* 2. Directed Bezier Edges + Animated Flow Particles */}
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
                    {/* Animated packet dot moving along the edge */}
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
                    {edge.label && (
                      <g>
                        <rect
                          x={edge.midX - (edge.label.length * 3.4 + 8)}
                          y={edge.midY - 9}
                          width={edge.label.length * 6.8 + 16}
                          height="18"
                          rx="4"
                          fill="#18181b"
                          stroke="#3f3f46"
                        />
                        <text
                          x={edge.midX}
                          y={edge.midY + 3}
                          textAnchor="middle"
                          fill="#e4e4e7"
                          fontSize="9.5"
                          fontFamily="ui-monospace, monospace"
                        >
                          {edge.label}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* 3. Interactive Architecture Nodes */}
              {layout.layers.flatMap((layer) =>
                layer.nodes.map((node) => {
                  const isHovered = hoveredNodeId === node.id;
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
                    rawLabel.length > 30
                      ? rawLabel.slice(0, 30)
                      : rawLabel;
                  const line2 =
                    rawLabel.length > 30
                      ? rawLabel.slice(30, 62) +
                        (rawLabel.length > 62 ? '…' : '')
                      : '';

                  return (
                    <g
                      key={node.id}
                      onMouseEnter={() => setHoveredNodeId(node.id)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                      style={{
                        cursor: 'pointer',
                        transition: 'opacity 150ms ease',
                      }}
                      opacity={isDimmed ? 0.35 : 1}
                    >
                      <rect
                        x={node.x}
                        y={node.y}
                        width={node.w}
                        height={node.h}
                        rx="10"
                        fill={isHovered ? '#1e293b' : '#18181b'}
                        stroke={
                          isHovered
                            ? '#34d399'
                            : isConnected
                            ? '#60a5fa'
                            : node.accentColor
                        }
                        strokeWidth={isHovered || isConnected ? '2.2' : '1.4'}
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
            </svg>
          </div>
          <div className="px-2 pt-1.5 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-zinc-400">
            <span>
              Hover any node to highlight its upstream &amp; downstream dependency paths.
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
          {code}
        </pre>
      )}
    </div>
  );
}
