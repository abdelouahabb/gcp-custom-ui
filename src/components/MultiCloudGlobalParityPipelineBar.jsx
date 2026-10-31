import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  Globe,
  ShieldCheck,
  FolderKanban,
  Rocket,
  Users,
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
} from 'lucide-react';

const STAGE_ICONS = {
  STAGE_1_GLOBAL_SUBSEA_BACKBONE: Globe,
  STAGE_2_AWS_PARITY_BRIDGE: ShieldCheck,
  STAGE_3_AZURE_ENTERPRISE_PARITY: FolderKanban,
  STAGE_4_ALIBABA_HUAWEI_HYPERSCALE: Rocket,
  STAGE_5_TEN_PERSONA_COUNCIL: Users,
  STAGE_6_SDK_591_FRONTIER_TERRAFORM: FileCode2,
};

const AZURE_GOVERNANCE_SUBTABS = new Set([
  'RESOURCE_GROUPS',
  'SPEND_FUSE',
  'GLOBAL_LB_WIZARD',
  'CFN_ARM_STACKS',
  'ROUTE53_FRONTDOOR_TRAFFIC',
  'RAM_LIGHTHOUSE_ORG_SHARING',
  'MULTI_BRAND_OAUTH',
]);

function parseMultiCloudMermaidFlowchartLr(dsl = '') {
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

function MultiCloudMermaidFlowchartSvg({ dsl, onNodeClick }) {
  const { subgraphs, nodeMap, edges } = parseMultiCloudMermaidFlowchartLr(dsl);
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
    const moved = activeDrag.moved || Math.hypot(deltaX, deltaY) > 4;
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
    if (
      activeDrag &&
      !activeDrag.moved &&
      activeDrag.clickPayload &&
      onNodeClick
    ) {
      onNodeClick(activeDrag.clickPayload);
    }
    setActiveDrag(null);
  };

  const inferNodeTarget = (nodeId = '') => {
    if (
      nodeId.startsWith('EDGE') ||
      nodeId.startsWith('CFE') ||
      nodeId.startsWith('VPC') ||
      nodeId.startsWith('FW') ||
      nodeId.startsWith('VM') ||
      nodeId.startsWith('REG')
    ) {
      return { targetTab: 'GLOBAL_MAP' };
    }
    if (
      nodeId.startsWith('AWS_IAM') ||
      nodeId.startsWith('GCP_SIM') ||
      nodeId.startsWith('PR')
    ) {
      return { targetTab: 'AWS_AZURE_PARITY', subTab: 'IAM_SIMULATOR' };
    }
    if (nodeId.startsWith('AWS_SSM') || nodeId.startsWith('GCP_IAP')) {
      return { targetTab: 'AWS_AZURE_PARITY', subTab: 'SSM_FLEET_COMMAND' };
    }
    if (nodeId.startsWith('AWS_CT') || nodeId.startsWith('GCP_AUD')) {
      return {
        targetTab: 'AWS_AZURE_PARITY',
        subTab: 'CLOUDTRAIL_ACTIVITY_TIME_DETECTIVE',
      };
    }
    if (nodeId.startsWith('SEC0')) {
      return { targetTab: 'AWS_AZURE_PARITY', subTab: 'KEYVAULT_ROTATION' };
    }
    if (nodeId === 'ARCH') {
      return { targetTab: 'INNOVATION_LAB', subTab: 'FIVE_PERSONA_NETOPS' };
    }
    if (nodeId === 'SEC') {
      return { targetTab: 'INNOVATION_LAB', subTab: 'FIVE_PERSONA_DEVSECOPS' };
    }
    if (nodeId === 'FIN') {
      return { targetTab: 'INNOVATION_LAB', subTab: 'FIVE_PERSONA_FINOPS_ENG' };
    }
    if (nodeId.startsWith('SEC')) {
      return { targetTab: 'AWS_AZURE_PARITY', subTab: 'KEYVAULT_ROTATION' };
    }
    if (
      nodeId.startsWith('AZ_RG') ||
      nodeId.startsWith('GCP_RG') ||
      nodeId.startsWith('RG')
    ) {
      return { targetTab: 'AWS_AZURE_PARITY', subTab: 'RESOURCE_GROUPS' };
    }
    if (nodeId.startsWith('AZ_FUSE') || nodeId.startsWith('GCP_FUSE')) {
      return { targetTab: 'AWS_AZURE_PARITY', subTab: 'SPEND_FUSE' };
    }
    if (nodeId.startsWith('AZ_FD') || nodeId.startsWith('GCP_ARMOR')) {
      return { targetTab: 'AWS_AZURE_PARITY', subTab: 'GLOBAL_LB_WIZARD' };
    }
    if (nodeId.startsWith('PTS')) {
      return {
        targetTab: 'ALIBABA_HUAWEI_PARITY',
        subTab: 'ALIYUN_PTS_MSE_FLASH_SALE_SURGE',
      };
    }
    if (nodeId.startsWith('CEN')) {
      return {
        targetTab: 'ALIBABA_HUAWEI_PARITY',
        subTab: 'ALIYUN_CEN_GA_BANDWIDTH_PACKAGE',
      };
    }
    if (nodeId.startsWith('VOLC')) {
      return {
        targetTab: 'ALIBABA_HUAWEI_PARITY',
        subTab: 'HUAWEI_CCE_MODELARTS_AI_POOL',
      };
    }
    if (nodeId.startsWith('RMQ')) {
      return {
        targetTab: 'ALIBABA_HUAWEI_PARITY',
        subTab: 'ALIYUN_ROCKETMQ_TRANSACTIONAL_DELAY',
      };
    }
    if (nodeId.startsWith('HTAP')) {
      return {
        targetTab: 'ALIBABA_HUAWEI_PARITY',
        subTab: 'POLARDB_GAUSSDB_HTAP_TIME_TRAVEL',
      };
    }
    if (nodeId.startsWith('NOC')) {
      return {
        targetTab: 'ALIBABA_HUAWEI_PARITY',
        subTab: 'HUAWEI_DATAV_NOC_COMMAND_WALL',
      };
    }
    if (
      nodeId.startsWith('INV') ||
      nodeId.startsWith('PERIM') ||
      nodeId.startsWith('ARCH') ||
      nodeId.startsWith('FIN') ||
      nodeId.startsWith('GATE')
    ) {
      return { targetTab: 'INNOVATION_LAB', subTab: 'FIVE_PERSONA_COUNCIL' };
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
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold cursor-pointer"
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
            id="multicloud-mermaid-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#2dd4bf" />
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
                fill="rgba(15, 23, 42, 0.65)"
                stroke="rgba(45, 212, 191, 0.35)"
                strokeDasharray="4 4"
              />
              <rect
                x={sx}
                y={sy}
                width={sg.w}
                height={26}
                rx="10"
                fill="rgba(45, 212, 191, 0.14)"
                className="cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => handlePointerDown(e, `sg:${sg.id}`)}
              />
              <text
                x={sx + 12}
                y={sy + 17}
                fill="#5eead4"
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
                stroke="#2dd4bf"
                strokeWidth="1.8"
                markerEnd="url(#multicloud-mermaid-arrow)"
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
                    stroke="rgba(45, 212, 191, 0.45)"
                  />
                  <text
                    x="0"
                    y="2"
                    textAnchor="middle"
                    fill="#ccfbf1"
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
                stroke="#14b8a6"
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

function resolveMappedStageId(activeTab, activeSubTab) {
  if (activeTab === 'GLOBAL_MAP') {
    return 'STAGE_1_GLOBAL_SUBSEA_BACKBONE';
  }
  if (activeTab === 'AWS_AZURE_PARITY') {
    if (activeSubTab && AZURE_GOVERNANCE_SUBTABS.has(activeSubTab)) {
      return 'STAGE_3_AZURE_ENTERPRISE_PARITY';
    }
    return 'STAGE_2_AWS_PARITY_BRIDGE';
  }
  if (activeTab === 'ALIBABA_HUAWEI_PARITY') {
    return 'STAGE_4_ALIBABA_HUAWEI_HYPERSCALE';
  }
  if (activeTab === 'INNOVATION_LAB') {
    if (String(activeSubTab || '').startsWith('FIVE_PERSONA_')) {
      return 'STAGE_5_TEN_PERSONA_COUNCIL';
    }
    return 'STAGE_6_SDK_591_FRONTIER_TERRAFORM';
  }
  return 'STAGE_1_GLOBAL_SUBSEA_BACKBONE';
}

export default function MultiCloudGlobalParityPipelineBar({
  projectId,
  activeTab = 'GLOBAL_MAP',
  activeSubTab = null,
  onSelectTab,
  onTestRuleOnGlobalMap,
  onRunInShell,
}) {
  const [blueprint, setBlueprint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [artifactDrawerOpen, setArtifactDrawerOpen] = useState(false);
  const [activeArtifactTab, setActiveArtifactTab] = useState(
    'MULTICLOUD_PARITY_TF'
  ); // 'MULTICLOUD_PARITY_TF' | 'GLOBAL_BACKBONE_YAML' | 'SDK_591_RUNBOOK_SH'
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
        `/api/project/${encodeURIComponent(projectId)}/multicloud-global-parity/blueprint`
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
    const mapped = resolveMappedStageId(activeTab, activeSubTab);
    if (mapped) {
      setSelectedStage(mapped);
      setDrawerOpen(false);
      setMermaidExpanded(false);
    }
  }, [activeTab, activeSubTab]);

  const stages = blueprint?.stages || [
    {
      id: 'STAGE_1_GLOBAL_SUBSEA_BACKBONE',
      stepNumber: 1,
      shortTitle: 'Global Subsea Map',
      title: '1. 40-Region Subsea Backbone, Firewall X-Ray & Carbon CFE',
      targetTab: 'GLOBAL_MAP',
      secondaryTab: 'VPC_NETWORKS',
      secondaryLabel: 'Open VPC & Firewall Perimeter Studio',
      status: 'OPTIMAL',
      metricBadge: '40 Regions · Subsea X-Ray',
      summary:
        'Probing active GCP regions, subsea fiber peers, VPC firewall perimeter, and Carbon-Free Energy CFE%...',
      stageItems: [],
      mermaidDsl: null,
    },
    {
      id: 'STAGE_2_AWS_PARITY_BRIDGE',
      stepNumber: 2,
      shortTitle: 'AWS Parity Bridge',
      title: '2. AWS to GCP Parity Bridge (IAM Sim, S3 Presigned, SSM & CloudTrail)',
      targetTab: 'AWS_AZURE_PARITY',
      targetSubTab: 'IAM_SIMULATOR',
      secondaryTab: 'SOVEREIGN_STUDIO',
      secondarySubTab: 'IAM_SURGEON',
      secondaryLabel: 'Autonomous IAM Surgeon',
      status: 'OPTIMAL',
      metricBadge: 'IAM Sim · S3 · SSM · CloudTrail',
      summary:
        'Mapping live IAM principals, Compute VMs, GCS Buckets, Secrets, and Cloud Audit Logs to AWS equivalents...',
      stageItems: [],
      mermaidDsl: null,
    },
    {
      id: 'STAGE_3_AZURE_ENTERPRISE_PARITY',
      stepNumber: 3,
      shortTitle: 'Azure Governance',
      title: '3. Azure Enterprise Parity (Resource Groups, Spend Fuse & Front Door WAF)',
      targetTab: 'AWS_AZURE_PARITY',
      targetSubTab: 'RESOURCE_GROUPS',
      secondaryTab: 'FINOPS',
      secondaryLabel: 'Open FinOps & Credit Guardian',
      status: 'OPTIMAL',
      metricBadge: 'Resource Groups · Spend Fuse',
      summary:
        'Synthesizing logical Azure-style Resource Groups, Hard-Spend Stop-Loss Fuse, and Global LB + Cloud Armor WAF...',
      stageItems: [],
      mermaidDsl: null,
    },
    {
      id: 'STAGE_4_ALIBABA_HUAWEI_HYPERSCALE',
      stepNumber: 4,
      shortTitle: 'Alibaba & Huawei',
      title: '4. Alibaba & Huawei Hyperscale Parity (11.11 Surge, CEN QoS & vGPU)',
      targetTab: 'ALIBABA_HUAWEI_PARITY',
      targetSubTab: 'ALIYUN_PTS_MSE_FLASH_SALE_SURGE',
      secondaryTab: 'GKE_STUDIO',
      secondaryLabel: 'GKE Autopilot & GPU Fleet',
      status: 'OPTIMAL',
      metricBadge: '11.11 Surge · 0.25x vGPU',
      summary:
        'Configuring 11.11 PTS + MSE Sentinel QPS Shedder, CEN QoS Slicer, PolarDB/GaussDB 1.6s Clone, and Volcano vGPU...',
      stageItems: [],
      mermaidDsl: null,
    },
    {
      id: 'STAGE_5_TEN_PERSONA_COUNCIL',
      stepNumber: 5,
      shortTitle: '10-Persona Board',
      title: '5. 10-Persona Enterprise Architecture Council & Pre-Flight War-Room',
      targetTab: 'INNOVATION_LAB',
      targetSubTab: 'FIVE_PERSONA_COUNCIL',
      secondaryTab: 'STARTUP_10X',
      secondaryLabel: 'Startup 10X Scale Radar',
      status: 'OPTIMAL',
      metricBadge: '10 Personas · 5-Gate Audit',
      summary:
        'Convening Cloud Architect, Cloud Engineer, Data Engineer, NetOps, DevSecOps, AI/MLOps, SRE, DBRE, FinOps & K8s...',
      stageItems: [],
      mermaidDsl: null,
    },
    {
      id: 'STAGE_6_SDK_591_FRONTIER_TERRAFORM',
      stepNumber: 6,
      shortTitle: 'SDK 591.0.0 & .tf',
      title: '6. gcloud SDK 591.0.0 Frontier Lab, Quantum Nexus & Multi-Cloud .tf',
      targetTab: 'INNOVATION_LAB',
      targetSubTab: 'GCLOUD_ALPHA_BETA',
      openArtifactTab: 'MULTICLOUD_PARITY_TF',
      secondaryTab: 'INNOVATION_LAB',
      secondarySubTab: 'TERRAFORM',
      secondaryLabel: 'Open Reverse-Terraform Exporter',
      status: 'OPTIMAL',
      metricBadge: 'SDK 591.0.0 · Multi-Cloud .tf',
      summary:
        'Synthesizing Multi-Cloud Parity Terraform HCL, Global Subsea Anycast YAML, and gcloud SDK 591.0.0 runbooks...',
      stageItems: [],
      mermaidDsl: null,
    },
  ];

  const defaultMappedStageId = resolveMappedStageId(activeTab, activeSubTab);
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
    activeArtifactTab === 'MULTICLOUD_PARITY_TF'
      ? blueprint?.artifacts?.multicloudParityTf || ''
      : activeArtifactTab === 'GLOBAL_BACKBONE_YAML'
      ? blueprint?.artifacts?.globalBackboneYaml || ''
      : blueprint?.artifacts?.gcloud591RunbookSh || '';

  const activeArtifactFilename =
    activeArtifactTab === 'MULTICLOUD_PARITY_TF'
      ? `${projectId || 'gcp'}-multicloud-parity-bridge.tf`
      : activeArtifactTab === 'GLOBAL_BACKBONE_YAML'
      ? `${projectId || 'gcp'}-global-subsea-anycast.yaml`
      : `${projectId || 'gcp'}-sdk-591-frontier-runbook.sh`;

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
    globalMapXRay,
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

    if (globalMapXRay && typeof onTestRuleOnGlobalMap === 'function') {
      onTestRuleOnGlobalMap(globalMapXRay);
      setTimeout(() => {
        const nextStudioEl = barRef.current?.nextElementSibling;
        if (nextStudioEl) {
          nextStudioEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 90);
      return;
    }

    const isTabSwitch = Boolean(targetTab && targetTab !== activeTab);

    if (typeof onSelectTab === 'function' && targetTab) {
      onSelectTab(targetTab, subTab);
    }

    if (
      (targetTab === 'AWS_AZURE_PARITY' ||
        targetTab === 'ALIBABA_HUAWEI_PARITY') &&
      subTab
    ) {
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('cloudpulse:parity-subtab', {
            detail: { cloudFamily: targetTab, subTab },
          })
        );
      }, 60);
    }

    if (targetTab === 'INNOVATION_LAB' && subTab) {
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('cloudpulse:innovation-subtab', {
            detail: { subTab },
          })
        );
      }, 60);
    }

    if (!isTabSwitch) {
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
      data-feature-id="WAVE7_MULTICLOUD_GLOBAL_PARITY_PIPELINE"
      className="rounded-2xl border border-teal-500/30 bg-gradient-to-r from-slate-950/95 via-teal-950/25 to-slate-950/95 p-3.5 shadow-xl"
    >
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500/20 border border-teal-400/40 text-teal-300">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30">
                Wave 7 · 6-Stage Global Subsea Backbone, Multi-Cloud Parity & 2026 Frontier
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {counts.activeRegions ?? 1} Active Region(s) ({counts.avgCfePct ?? 93}% CFE) · {counts.principals ?? 0} IAM · {counts.vms ?? 0} VMs · {counts.firewalls ?? 0} Firewalls · {counts.secrets ?? 0} Secrets · {counts.auditEvents ?? 0} Audit Events · {counts.enabledApis ?? 0} APIs
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              40-Region Subsea Fiber & Firewall X-Ray → AWS Parity Bridge → Azure Governance & Spend Fuse → Alibaba/Huawei Hyperscale → 10-Persona War-Room → SDK 591.0.0 & `.tf`
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setArtifactDrawerOpen((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border transition cursor-pointer ${
              artifactDrawerOpen
                ? 'bg-teal-500/25 text-teal-200 border-teal-400/50'
                : 'bg-slate-900/90 text-teal-300 border-teal-500/30 hover:bg-teal-500/15'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>Synthesize Multi-Cloud Bridge (`.tf` + `.yaml` + `.sh`)</span>
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
            title="Re-probe live Global Subsea regions, IAM principals, VPC firewalls, Secrets & Cloud Audit Logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* 6-Stage Horizontal Pipeline Strip */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
        {stages.map((stage) => {
          const Icon = STAGE_ICONS[stage.id] || Globe;
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
                  ? 'border-teal-400/80 bg-teal-500/15 shadow-lg shadow-teal-500/10 ring-1 ring-teal-400/50'
                  : 'border-slate-800/90 bg-slate-900/75 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg text-[10px] font-black ${
                      isSelected
                        ? 'bg-teal-400 text-slate-950'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {stage.stepNumber}
                  </span>
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isSelected ? 'text-teal-300' : 'text-slate-400'
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
                      ? 'Multi-Cloud & Global Backbone stage verified on live project'
                      : 'Public admin firewall or posture action recommended'
                  }
                />
              </div>

              <div className="mt-1.5 flex items-center justify-between gap-1">
                <span className="truncate rounded bg-slate-950/80 px-1.5 py-0.5 text-[10px] font-mono text-teal-300 border border-slate-800/80">
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
              <span className="rounded-lg bg-teal-500/20 border border-teal-400/40 px-2 py-0.5 text-[10px] font-black uppercase text-teal-300">
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
                  className="inline-flex items-center gap-1 rounded-lg bg-teal-600/30 hover:bg-teal-600/45 border border-teal-400/40 px-2.5 py-1 text-[11px] font-bold text-teal-200 transition cursor-pointer"
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
                  <span>
                    {selectedStageObj.secondaryLabel || 'Open Companion Studio'}
                  </span>
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
                        globalMapXRay: item.globalMapXRay,
                      })
                    }
                    className="cursor-pointer rounded-lg border border-slate-800/90 bg-slate-900/90 px-2.5 py-1.5 hover:border-teal-500/40 transition flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        {item.kind}
                      </div>
                      <div className="truncate text-xs font-bold text-slate-100">
                        {item.name}
                      </div>
                      <div className="truncate text-[10px] font-mono text-teal-300/90">
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
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-teal-500/25 bg-slate-900/90 px-3 py-2">
                  <div
                    onClick={() => setMermaidExpanded((prev) => !prev)}
                    className="flex items-center gap-2 flex-wrap cursor-pointer select-none"
                  >
                    <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-mono font-bold">
                      LIVE MERMAID ARCHITECTURE
                    </span>
                    <span className="text-xs font-extrabold text-slate-200">
                      {selectedStageObj.shortTitle} Topology (`flowchart LR`)
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      — Synthesized from live `{projectId}` resources
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {mermaidExpanded && (
                      <>
                        <div className="inline-flex rounded-lg border border-slate-700 bg-slate-950 p-0.5">
                          <button
                            type="button"
                            onClick={() => setMermaidViewMode('VISUAL')}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold cursor-pointer ${
                              mermaidViewMode === 'VISUAL'
                                ? 'bg-teal-600 text-white'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            Visual Diagram
                          </button>
                          <button
                            type="button"
                            onClick={() => setMermaidViewMode('CODE')}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold cursor-pointer ${
                              mermaidViewMode === 'CODE'
                                ? 'bg-teal-600 text-white'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            Mermaid DSL
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            copyText(
                              selectedStageObj.mermaidDsl,
                              `MERMAID_${selectedStageObj.id}`
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-[10px] font-mono font-bold text-slate-200 hover:bg-slate-800 cursor-pointer"
                        >
                          {copiedKey === `MERMAID_${selectedStageObj.id}` ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>
                            {copiedKey === `MERMAID_${selectedStageObj.id}`
                              ? 'Copied'
                              : 'Copy .mmd'}
                          </span>
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => setMermaidExpanded((prev) => !prev)}
                      className="inline-flex items-center gap-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-400/40 px-2.5 py-1 text-[10px] font-mono font-bold text-teal-200 cursor-pointer"
                    >
                      <span>
                        {mermaidExpanded
                          ? 'Collapse Flowchart'
                          : 'Open Interactive Mermaid Flowchart'}
                      </span>
                      {mermaidExpanded ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                {mermaidExpanded &&
                  (mermaidViewMode === 'VISUAL' ? (
                    <MultiCloudMermaidFlowchartSvg
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
                  ) : (
                    <pre className="max-h-56 overflow-auto rounded-xl bg-slate-950 border border-slate-800/90 p-3 text-[11px] font-mono text-teal-200 leading-relaxed">
                      {selectedStageObj.mermaidDsl}
                    </pre>
                  ))}
              </div>
            )}
        </div>
      )}

      {/* Collapsible Multi-Cloud Parity Artifact Drawer (.tf + .yaml + .sh) */}
      {artifactDrawerOpen && (
        <div
          ref={artifactDrawerRef}
          className="mt-3 rounded-xl border border-teal-500/30 bg-slate-950/95 p-3.5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                {
                  id: 'MULTICLOUD_PARITY_TF',
                  label: '1. multicloud_aws_azure_to_gcp.tf (Tags + Cloud Armor WAF)',
                },
                {
                  id: 'GLOBAL_BACKBONE_YAML',
                  label: '2. global_backbone_anycast_waf.yaml (Subsea Anycast)',
                },
                {
                  id: 'SDK_591_RUNBOOK_SH',
                  label: '3. gcloud_591_frontier_runbook.sh (SDK 591.0.0 CLI)',
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveArtifactTab(tab.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                    activeArtifactTab === tab.id
                      ? 'bg-teal-500/25 text-teal-200 border border-teal-400/40'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => copyText(activeArtifactContent, activeArtifactTab)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-800 cursor-pointer"
              >
                {copiedKey === activeArtifactTab ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Blueprint</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  downloadText(activeArtifactFilename, activeArtifactContent)
                }
                className="inline-flex items-center gap-1 rounded-lg bg-teal-600/30 hover:bg-teal-600/45 border border-teal-400/40 px-2.5 py-1 text-xs font-bold text-teal-200 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download {activeArtifactFilename}</span>
              </button>
            </div>
          </div>

          <pre className="mt-2.5 max-h-64 overflow-auto rounded-lg bg-slate-900/95 p-3 text-[11px] font-mono text-teal-200 leading-relaxed border border-slate-800">
            {activeArtifactContent || 'Synthesizing live Multi-Cloud Parity artifact...'}
          </pre>
        </div>
      )}
    </div>
  );
}
