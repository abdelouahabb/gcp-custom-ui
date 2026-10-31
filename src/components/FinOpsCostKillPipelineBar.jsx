import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  DollarSign,
  ShieldAlert,
  Database,
  BellRing,
  Leaf,
  Zap,
  RefreshCw,
  Terminal,
  Copy,
  Check,
  ExternalLink,
  Code2,
  Download,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import MermaidArchitectureDiagram from './MermaidArchitectureDiagram';

const STAGE_ICONS = {
  STAGE_1_BILLING_CREDITS_STARTUP: DollarSign,
  STAGE_2_FREE_TIER_ZOMBIE_REAPER: Zap,
  STAGE_3_BQ_BILLING_EXPORT_SQL: Database,
  STAGE_4_PAID_API_QUOTA_GUARD: ShieldAlert,
  STAGE_5_PUBSUB_BUDGET_COST_KILL: BellRing,
  STAGE_6_GREENOPS_CLOUD_ARBITRAGE: Leaf,
};

const TAB_TO_STAGE_MAP = {
  FINOPS: 'STAGE_1_BILLING_CREDITS_STARTUP',
  STARTUP_10X: 'STAGE_1_BILLING_CREDITS_STARTUP',
};

export default function FinOpsCostKillPipelineBar({
  projectId,
  activeTab,
  onSelectTab,
  onOpenBigQuerySql,
  onRunInShell,
}) {
  const [blueprint, setBlueprint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mermaidExpanded, setMermaidExpanded] = useState(false);
  const [synthDrawerOpen, setSynthDrawerOpen] = useState(false);
  const [activeArtifactTab, setActiveArtifactTab] = useState('TERRAFORM');
  const [copiedKey, setCopiedKey] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const barRef = useRef(null);
  const synthDrawerRef = useRef(null);

  const fetchBlueprint = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/finops-cost-kill-pipeline/blueprint`,
        { timeout: 15000 }
      );
      setBlueprint(res.data);
    } catch {
      // Non-fatal fallback
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchBlueprint();
  }, [fetchBlueprint]);

  const copyText = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const downloadFile = (content, filename, mimeType = 'text/plain;charset=utf-8') => {
    if (!content) return;
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLoadSqlInBigQuery = (sqlText) => {
    if (!sqlText) return;
    if (typeof onOpenBigQuerySql === 'function') {
      onOpenBigQuerySql(sqlText);
      return;
    }
    if (typeof onSelectTab === 'function') {
      onSelectTab('BIGQUERY_STUDIO');
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('cloudpulse:bigquery-load-sql', {
            detail: { sql: sqlText, projectId },
          })
        );
      }, 140);
    }
  };

  const handleExecuteAction = ({
    targetTab,
    subTab,
    scrollToId,
    triggerEvent,
    openArtifactTab,
    sqlPayload,
  }) => {
    if (sqlPayload) {
      handleLoadSqlInBigQuery(sqlPayload);
      return;
    }
    if (openArtifactTab) {
      setActiveArtifactTab(openArtifactTab);
      setSynthDrawerOpen(true);
      setTimeout(() => {
        synthDrawerRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }, 80);
      return;
    }
    const isTabSwitch = Boolean(targetTab && targetTab !== activeTab);
    if (typeof onSelectTab === 'function' && (isTabSwitch || subTab)) {
      onSelectTab(targetTab || activeTab, subTab);
    }
    const performScrollAndTrigger = () => {
      if (scrollToId) {
        const el = document.getElementById(scrollToId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else if (!isTabSwitch && !subTab) {
        barRef.current?.nextElementSibling?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
      if (triggerEvent) {
        window.dispatchEvent(
          new CustomEvent(triggerEvent, { detail: { projectId } })
        );
      }
    };
    if (isTabSwitch || subTab) {
      setTimeout(performScrollAndTrigger, 160);
    } else {
      performScrollAndTrigger();
    }
  };

  const stages = blueprint?.stages || [
    {
      id: 'STAGE_1_BILLING_CREDITS_STARTUP',
      stepNumber: 1,
      shortTitle: 'Billing & Credits',
      title: '1. Billing Account, Credits & Startup 10X Tier',
      targetTab: 'FINOPS',
      secondaryTab: 'STARTUP_10X',
      status: 'OPTIMAL',
      metricBadge: 'Probing Billing...',
      summary: 'Auditing Cloud Billing linkage, GDE/Trial credit ledger, and Startup 10X tier...',
      stageItems: [],
    },
    {
      id: 'STAGE_2_FREE_TIER_ZOMBIE_REAPER',
      stepNumber: 2,
      shortTitle: 'Free Tier & Zombie Reaper',
      title: '2. Always-Free Tier & Idle Zombie Reaper',
      targetTab: 'FINOPS',
      secondaryTab: 'VM_SSH',
      status: 'OPTIMAL',
      metricBadge: 'Auditing VMs & GCS...',
      summary: 'Checking running vs stopped VMs, GCS Free Tier eligibility, and idle zombies...',
      stageItems: [],
    },
    {
      id: 'STAGE_3_BQ_BILLING_EXPORT_SQL',
      stepNumber: 3,
      shortTitle: 'BQ Billing Export SQL',
      title: '3. BigQuery Billing Export & FOCUS FinOps SQL',
      targetTab: 'BIGQUERY_STUDIO',
      secondaryTab: 'FINOPS',
      status: 'OPTIMAL',
      metricBadge: 'FOCUS SKU SQL',
      summary: 'Checking BigQuery datasets for Cloud Billing Detailed Export...',
      stageItems: [],
    },
    {
      id: 'STAGE_4_PAID_API_QUOTA_GUARD',
      stepNumber: 4,
      shortTitle: 'API & Quota Guardrails',
      title: '4. Paid API & GPU Quota Guardrails',
      targetTab: 'OVERVIEW',
      secondaryTab: 'FINOPS',
      status: 'OPTIMAL',
      metricBadge: 'Auditing APIs...',
      summary: 'Scanning enabled service APIs for high-burn compute, AI, and database meters...',
      stageItems: [],
    },
    {
      id: 'STAGE_5_PUBSUB_BUDGET_COST_KILL',
      stepNumber: 5,
      shortTitle: 'Budget Alert & Cost-Kill',
      title: '5. Pub/Sub Budget Alert & Autonomous Cost-Kill',
      targetTab: 'FINOPS',
      secondaryTab: 'CLOUD_FUNCTIONS',
      status: 'OPTIMAL',
      metricBadge: '50/80/100% Gate',
      summary: 'Wiring Pub/Sub budget notifications to non-destructive cost-freeze actions...',
      stageItems: [],
    },
    {
      id: 'STAGE_6_GREENOPS_CLOUD_ARBITRAGE',
      stepNumber: 6,
      shortTitle: 'GreenOps & 3-Cloud Arbitrage',
      title: '6. 98% Carbon-Free GreenOps & 3-Cloud Arbitrage',
      targetTab: 'GLOBAL_MAP',
      secondaryTab: 'AWS_AZURE_PARITY',
      status: 'OPTIMAL',
      metricBadge: '98% CFE · CUD',
      summary: 'Evaluating 24/7 Carbon-Free Energy regions and cross-cloud SKU arbitrage...',
      stageItems: [],
    },
  ];

  const mappedStageId = TAB_TO_STAGE_MAP[activeTab] || stages[0]?.id;
  const currentStudioStage =
    stages.find((s) => s.id === mappedStageId) || stages[0];
  // Strictly ONE highlighted stage card at a time
  const activeHighlightedStageId =
    selectedStage || currentStudioStage?.id || stages[0]?.id;
  const selectedStageObj =
    stages.find((s) => s.id === activeHighlightedStageId) ||
    currentStudioStage ||
    stages[0];

  const counts = blueprint?.counts || {};
  const activeArtifactContent =
    activeArtifactTab === 'TERRAFORM'
      ? blueprint?.artifacts?.billingBudgetGuardTf || ''
      : activeArtifactTab === 'SQL'
      ? blueprint?.artifacts?.finopsSkuBurnSql || ''
      : blueprint?.artifacts?.emergencyCostKillSh || '';

  const activeArtifactFilename =
    activeArtifactTab === 'TERRAFORM'
      ? `${projectId || 'gcp'}-billing-budget-guard.tf`
      : activeArtifactTab === 'SQL'
      ? `${projectId || 'gcp'}-finops-sku-burn-audit.sql`
      : `${projectId || 'gcp'}-emergency-cost-kill.sh`;

  return (
    <div
      ref={barRef}
      className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-slate-950/95 via-amber-950/20 to-slate-950/95 p-3.5 shadow-xl"
    >
      {/* Top Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/25 to-emerald-500/25 border border-amber-400/40 text-amber-300">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">
                6-Stage FinOps, Quota Guard & Startup 10X Cost-Kill Pipeline
              </span>
              <span className="rounded-full bg-amber-500/15 border border-amber-400/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                Billing & Credits ➔ Free Tier & Zombies ➔ BQ Export SQL ➔ API Quota Cap ➔ Pub/Sub Cost-Kill ➔ GreenOps
              </span>
              {counts.enabledApis !== undefined && (
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-300">
                  {counts.runningVms || 0} Running VMs · {counts.highBurnApis || 0} Paid APIs · {counts.buckets || 0} GCS · {counts.datasets || 0} BQ
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              End-to-end zero-surprise financial guardrail connecting{' '}
              <strong className="text-slate-200">Billing & Startup 10X Credits</strong>,{' '}
              <strong className="text-slate-200">Always-Free & Zombie Reaper</strong>,{' '}
              <strong className="text-slate-200">BigQuery Billing Export SQL</strong>,{' '}
              <strong className="text-slate-200">Paid API Quota Guards</strong>, and{' '}
              <strong className="text-slate-200">Pub/Sub Autonomous Cost-Kill</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setDrawerOpen((v) => !v)}
            className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition border ${
              drawerOpen
                ? 'bg-amber-500/20 border-amber-400/50 text-amber-200'
                : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:border-amber-400/40 hover:text-amber-200'
            }`}
            title="Inspect selected FinOps stage details & Mermaid flowchart"
          >
            <span>{drawerOpen ? 'Close Stage' : 'Inspect Stage'}</span>
            {drawerOpen ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setSynthDrawerOpen((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition border ${
              synthDrawerOpen
                ? 'bg-emerald-500/25 border-emerald-400/50 text-emerald-200 shadow-sm'
                : 'bg-slate-900/90 border-slate-700/80 text-slate-200 hover:border-amber-400/40 hover:text-amber-200'
            }`}
            title="Synthesize Cloud Billing Budget Terraform, BigQuery SKU Burn SQL, and Emergency Cost-Kill Script"
          >
            <Code2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Synthesize FinOps Budget Terraform & Cost-Kill CLI</span>
          </button>

          <button
            type="button"
            onClick={fetchBlueprint}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-700/80 bg-slate-900/80 px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 hover:border-amber-500/40 hover:text-amber-200 transition"
            title="Re-probe live Cloud Billing status, VMs, GCS, BigQuery datasets, and enabled APIs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="inline-flex items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/80 p-1.5 text-slate-400 hover:text-slate-200"
            title={collapsed ? 'Expand FinOps Cost-Kill Pipeline' : 'Collapse FinOps Cost-Kill Pipeline'}
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {/* 6-Stage Interactive Stepper Row */}
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {stages.map((stage, idx) => {
              const IconComp = STAGE_ICONS[stage.id] || DollarSign;
              const isSelected = activeHighlightedStageId === stage.id;
              const isOptimal = stage.status === 'OPTIMAL';

              return (
                <div
                  key={stage.id}
                  onClick={() => {
                    if (selectedStage === stage.id && drawerOpen) {
                      setDrawerOpen(false);
                    } else {
                      if (selectedStage !== stage.id) {
                        setMermaidExpanded(false);
                      }
                      setSelectedStage(stage.id);
                      setDrawerOpen(true);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedStage(stage.id);
                      setDrawerOpen(true);
                    }
                  }}
                  className={`group relative cursor-pointer rounded-xl border p-2.5 transition-all ${
                    isSelected
                      ? 'border-amber-400/80 bg-amber-950/40 shadow-md shadow-amber-950/50 ring-1 ring-amber-400/35'
                      : 'border-slate-800/90 bg-slate-900/75 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg text-[10px] font-black ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {stage.stepNumber || idx + 1}
                      </span>
                      <IconComp
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isSelected ? 'text-amber-300' : 'text-slate-400'
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
                          ? 'FinOps guardrail verified on live project'
                          : 'Action or inspection recommended'
                      }
                    />
                  </div>

                  <div className="mt-1.5 flex items-center justify-between gap-1">
                    <span className="truncate rounded bg-slate-950/80 px-1.5 py-0.5 text-[10px] font-mono text-amber-300 border border-slate-800/80">
                      {stage.metricBadge}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExecuteAction({
                          targetTab: stage.targetTab,
                          subTab: stage.targetSubTab,
                          scrollToId: stage.scrollToId,
                          triggerEvent: stage.triggerEvent,
                          openArtifactTab: stage.openArtifactTab,
                          sqlPayload:
                            stage.sampleSql && stage.targetTab === 'BIGQUERY_STUDIO'
                              ? stage.sampleSql
                              : null,
                        });
                      }}
                      className="inline-flex items-center gap-0.5 text-[10px] font-bold text-cyan-400 hover:text-cyan-300"
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
                  <span className="rounded-lg bg-amber-500/20 border border-amber-400/40 px-2 py-0.5 text-[10px] font-black uppercase text-amber-300">
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
                  {selectedStageObj.sampleSql && (
                    <button
                      type="button"
                      onClick={() => handleLoadSqlInBigQuery(selectedStageObj.sampleSql)}
                      className="inline-flex items-center gap-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 px-2.5 py-1 text-[11px] font-bold text-amber-200 transition"
                    >
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>Load FinOps SQL in BigQuery</span>
                    </button>
                  )}

                  {selectedStageObj.cliCmd && typeof onRunInShell === 'function' && (
                    <button
                      type="button"
                      onClick={() => onRunInShell(selectedStageObj.cliCmd)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-mono text-cyan-300 hover:border-cyan-500/40"
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
                          scrollToId: selectedStageObj.scrollToId,
                          triggerEvent: selectedStageObj.triggerEvent,
                          openArtifactTab: selectedStageObj.openArtifactTab,
                          sqlPayload:
                            selectedStageObj.sampleSql &&
                            selectedStageObj.targetTab === 'BIGQUERY_STUDIO'
                              ? selectedStageObj.sampleSql
                              : null,
                        })
                      }
                      className="inline-flex items-center gap-1 rounded-lg bg-amber-600/25 hover:bg-amber-600/35 border border-amber-400/40 px-2.5 py-1 text-[11px] font-bold text-amber-200 transition"
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
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-300 transition"
                    >
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
                            scrollToId: item.scrollToId,
                            triggerEvent: item.triggerEvent,
                            openArtifactTab: item.openArtifactTab,
                            sqlPayload: item.sqlPayload,
                          })
                        }
                        className="cursor-pointer rounded-lg border border-slate-800/90 bg-slate-900/90 px-2.5 py-1.5 hover:border-amber-500/40 transition flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            {item.kind}
                          </div>
                          <div className="truncate text-xs font-bold text-slate-100">
                            {item.name}
                          </div>
                          <div className="truncate text-[10px] font-mono text-amber-300/90">
                            {item.meta}
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      </div>
                    ))}
                  </div>
                )}

              {/* Live Stage-Specific Mermaid Diagram (Strictly rendered ONLY when live directed edges exist, and collapsed until user clicks Open Interactive Mermaid Flowchart!) */}
              {selectedStageObj.mermaidDsl &&
                selectedStageObj.mermaidDsl.includes('-->') && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/25 bg-slate-900/90 px-3 py-2">
                      <div
                        onClick={() => setMermaidExpanded((prev) => !prev)}
                        className="flex items-center gap-2 flex-wrap cursor-pointer select-none"
                      >
                        <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-mono font-extrabold uppercase tracking-wider">
                          Mermaid flowchart LR
                        </span>
                        <span className="text-xs font-bold text-slate-100">
                          Stage {selectedStageObj.stepNumber} Live {selectedStageObj.shortTitle} Topology ({projectId})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMermaidExpanded((prev) => !prev)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-mono font-bold transition cursor-pointer ${
                          mermaidExpanded
                            ? 'bg-slate-800 text-slate-200 border border-slate-700'
                            : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm'
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
                    </div>

                    {mermaidExpanded && (
                      <MermaidArchitectureDiagram
                        code={selectedStageObj.mermaidDsl}
                        chart={selectedStageObj.mermaidDsl}
                        defaultMode="VISUAL"
                        title={`Live ${selectedStageObj.shortTitle} Topology (${projectId})`}
                        subtitle={`Real-time FinOps, quota & cost-guardrail topology synthesized from live resources in ${projectId}`}
                      />
                    )}
                  </div>
                )}
            </div>
          )}

          {/* Decoupled FinOps Budget Terraform, BigQuery SQL & Cost-Kill CLI Drawer */}
          {synthDrawerOpen && (
            <div
              ref={synthDrawerRef}
              className="mt-3 rounded-xl border border-emerald-500/40 bg-slate-950/95 p-3.5 shadow-2xl"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                    Live FinOps Budget Guardrail Terraform, BigQuery SKU Burn SQL & Emergency Cost-Kill Runbook ({projectId})
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setActiveArtifactTab('TERRAFORM')}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                      activeArtifactTab === 'TERRAFORM'
                        ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/50'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    billing_budget_guard.tf (50/80/100% Budget)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveArtifactTab('SQL')}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                      activeArtifactTab === 'SQL'
                        ? 'bg-amber-500/25 text-amber-200 border border-amber-400/50'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    finops_sku_burn_audit.sql (BigQuery FinOps)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveArtifactTab('KILL_SH')}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                      activeArtifactTab === 'KILL_SH'
                        ? 'bg-rose-500/25 text-rose-200 border border-rose-400/50'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    emergency_cost_kill.sh (Cost-Freeze CLI)
                  </button>

                  {activeArtifactTab === 'SQL' && (
                    <button
                      type="button"
                      onClick={() => handleLoadSqlInBigQuery(activeArtifactContent)}
                      className="inline-flex items-center gap-1 rounded-lg border border-amber-400/40 bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold text-amber-200 hover:bg-amber-500/25"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Open in BigQuery Studio</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => copyText(activeArtifactContent, activeArtifactTab)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-emerald-400/40"
                  >
                    {copiedKey === activeArtifactTab ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadFile(activeArtifactContent, activeArtifactFilename)}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600/25 border border-emerald-500/40 px-2.5 py-1 text-[11px] font-bold text-emerald-200 hover:bg-emerald-600/35"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download {activeArtifactFilename}</span>
                  </button>
                </div>
              </div>

              <pre className="mt-2.5 max-h-72 overflow-auto rounded-lg border border-slate-800 bg-slate-900/95 p-3 text-[11px] font-mono leading-relaxed text-emerald-200">
                {activeArtifactContent || '# Synthesizing live FinOps Budget & Cost-Kill blueprint...'}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  );
}
