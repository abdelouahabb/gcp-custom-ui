import React, { useState, useEffect, useCallback } from 'react';
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

export default function EnterpriseStackPipelineBar({
  projectId,
  activeTab,
  overview,
  onOpenProvision,
  onSelectTab,
  onRunInShell,
}) {
  const [blueprint, setBlueprint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedArtifactTab, setSelectedArtifactTab] = useState('mainTf'); // 'mainTf' | 'cloudBuildYaml' | 'pipelineDeploySh' | 'architectureMermaid'
  const [selectedStageId, setSelectedStageId] = useState(null);
  const [mermaidViewMode, setMermaidViewMode] = useState('VISUAL'); // 'VISUAL' | 'CODE'
  const [copiedKey, setCopiedKey] = useState(null);

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
    },
    {
      id: 'STAGE_3_COMPUTE_SERVERLESS',
      stepNumber: 3,
      shortTitle: 'VMs & Cloud Run',
      targetTab: 'CLOUD_RUN',
      secondaryTab: 'VM_SSH',
      secondaryLabel: 'Compute Engine VMs',
      status: 'OPTIMAL',
      metricBadge: 'Compute & Serverless',
      summary: 'GCE VM Fleet & Cloud Run scale-to-zero containers.',
      cliCmd: `gcloud run services list --project=${projectId}`,
    },
    {
      id: 'STAGE_4_CICD_TERRAFORM',
      stepNumber: 4,
      shortTitle: 'Terraform & CI/CD',
      targetTab: 'WAVE9_STUDIO',
      secondaryTab: 'INNOVATION_LAB',
      secondarySubTab: 'REVERSE_TERRAFORM',
      secondaryLabel: 'Reverse-Terraform Exporter',
      status: 'OPTIMAL',
      metricBadge: 'main.tf + SLSA-3',
      summary: 'Live Terraform HCL & Cloud Build canary pipeline synthesizer.',
      cliCmd: `gcloud builds list --project=${projectId} --limit=10`,
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
      cliCmd: `gcloud logging read 'protoPayload.methodName=~"(delete|Destroy|DisableService)"' --project=${projectId} --limit=10`,
    },
  ];

  const activeStage =
    stages.find((s) => s.id === selectedStageId) ||
    stages.find((s) => s.targetTab === activeTab || s.secondaryTab === activeTab) ||
    stages[0];

  const activeArtifactContent =
    selectedArtifactTab === 'mainTf'
      ? blueprint?.artifacts?.mainTf
      : selectedArtifactTab === 'cloudBuildYaml'
      ? blueprint?.artifacts?.cloudBuildYaml
      : selectedArtifactTab === 'architectureMermaid'
      ? blueprint?.artifacts?.architectureMermaid
      : blueprint?.artifacts?.pipelineDeploySh;

  const activeArtifactFilename =
    selectedArtifactTab === 'mainTf'
      ? `${projectId}-enterprise-stack.tf`
      : selectedArtifactTab === 'cloudBuildYaml'
      ? `cloudbuild.yaml`
      : selectedArtifactTab === 'architectureMermaid'
      ? `${projectId}-6stage-architecture.mmd`
      : `pipeline-deploy-${projectId}.sh`;

  return (
    <div
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
              End-to-end enterprise workflow connecting Zero-Trust VPCs, Lakehouse Storage, Compute/Cloud Run, Live Terraform + SLSA-3 CI/CD, FinOps Quota Radar, and 30-Day Recycle Bin.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              if (drawerOpen && activeStage?.id === 'STAGE_4_CICD_TERRAFORM') {
                setDrawerOpen(false);
              } else {
                setSelectedStageId('STAGE_4_CICD_TERRAFORM');
                setDrawerOpen(true);
              }
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              drawerOpen && activeStage?.id === 'STAGE_4_CICD_TERRAFORM'
                ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>Step 4: Synthesize Stack IaC (`main.tf` + `cloudbuild.yaml`)</span>
            {drawerOpen && activeStage?.id === 'STAGE_4_CICD_TERRAFORM' ? (
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

      {/* 6-Stage Interactive Pipeline Chain */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2">
        {stages.map((stage, idx) => {
          const IconComponent = STAGE_ICONS[stage.id] || Layers;
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
                  ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-500/60 shadow-sm ring-1 ring-blue-500/30'
                  : 'bg-zinc-50/70 dark:bg-[#202124] hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70 border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-extrabold shrink-0 ${
                      isCurrentTab || isSelectedStage
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
                    isCurrentTab || isSelectedStage
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
                      onSelectTab(stage.targetTab);
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
                    onClick={() => onSelectTab(activeStage.targetTab)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Primary Studio ({activeStage.targetTab})</span>
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

          {/* Live Mermaid Architecture & Dataflow Topology (Active across all 6 Stages) */}
          {activeStage && (activeStage.mermaidTopology || activeStage.mermaidDsl) && (
            <div className="rounded-xl border border-indigo-500/25 bg-gradient-to-r from-indigo-500/[0.04] via-blue-500/[0.03] to-emerald-500/[0.04] p-3 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[10px] font-mono font-extrabold uppercase tracking-wider">
                    Mermaid flowchart LR
                  </span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Stage {activeStage.stepNumber} Live Architecture & Dataflow Topology
                  </span>
                  <span className="text-[10.5px] font-mono text-zinc-500 dark:text-zinc-400">
                    (Click any subgraph node to inspect or provision)
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
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
                </div>
              </div>

              {mermaidViewMode === 'CODE' ? (
                <pre className="bg-zinc-950 text-indigo-200 border border-zinc-800 rounded-xl p-3 text-[11px] font-mono overflow-x-auto leading-relaxed">
                  {activeStage.mermaidDsl}
                </pre>
              ) : (
                Array.isArray(activeStage.mermaidTopology) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 items-stretch">
                    {activeStage.mermaidTopology.map((node, nIdx) => (
                      <div
                        key={node.id}
                        onClick={() => {
                          if (node.provisionType && onOpenProvision) {
                            onOpenProvision(node.provisionType);
                          } else if (node.targetTab && onSelectTab) {
                            onSelectTab(node.targetTab);
                          }
                        }}
                        className="relative group/node rounded-xl border border-indigo-500/30 bg-white dark:bg-[#141518] hover:border-indigo-500 p-2.5 transition-all cursor-pointer flex flex-col justify-between shadow-sm"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1.5 mb-1">
                            <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 truncate">
                              subgraph: {node.subgraph}
                            </span>
                            <span className="text-[9.5px] font-mono text-zinc-400 shrink-0">
                              N{nIdx + 1}
                            </span>
                          </div>
                          <div className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 truncate">
                            {node.title}
                          </div>
                          <div className="text-[10.5px] font-mono text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                            {node.subtitle}
                          </div>
                        </div>

                        <div className="mt-2 pt-1.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-1">
                          <span className="text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                            {node.badge}
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 group-hover/node:translate-x-0.5 transition-transform">
                            <span>{ nIdx < activeStage.mermaidTopology.length - 1 ? '──▶' : 'Inspect ↗' }</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          )}

          {/* Stage-Specific Content: Steps 1, 2, 3, 5, 6 show Live Stage Inventory & CLI; ONLY Step 4 shows the Terraform/CI-CD Editor */}
          {activeStage?.id === 'STAGE_4_CICD_TERRAFORM' ? (
            <div className="space-y-3">
              {/* Artifact Tabs + Actions (Exclusively in Step 4: Terraform & CI/CD) */}
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
                  <button
                    type="button"
                    onClick={() => setSelectedArtifactTab('architectureMermaid')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                      selectedArtifactTab === 'architectureMermaid'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    architecture.mmd (Full 6-Stage Mermaid Graph)
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
          ) : (
            <div className="space-y-2.5">
              {/* Stage-Specific Live Inventory Cards for Steps 1, 2, 3, 5, 6 */}
              {Array.isArray(activeStage?.stageItems) &&
                activeStage.stageItems.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {activeStage.stageItems.map((item, idx) => (
                      <div
                        key={`${item.name}-${idx}`}
                        onClick={() => {
                          if (item.provisionType && onOpenProvision) {
                            onOpenProvision(item.provisionType);
                          } else if (onSelectTab && item.targetTab) {
                            onSelectTab(item.targetTab, item.subTab);
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
          )}
        </div>
      )}
    </div>
  );
}
