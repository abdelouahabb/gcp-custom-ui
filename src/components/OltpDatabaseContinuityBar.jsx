import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  Database,
  ShieldCheck,
  Activity,
  GitBranch,
  History,
  RefreshCw,
  Terminal,
  Copy,
  Check,
  ExternalLink,
  Code2,
  Download,
  ChevronDown,
  ChevronUp,
  Layers,
  Lock,
  Plus,
  Sparkles,
} from 'lucide-react';
import MermaidArchitectureDiagram from './MermaidArchitectureDiagram';

const STAGE_ICONS = {
  STAGE_1_OLTP_ENGINES: Database,
  STAGE_2_IAM_AUTH_PRIVATE_VPC: Lock,
  STAGE_3_REPLICA_QUERY_INSIGHTS: Activity,
  STAGE_4_ZERO_ETL_FEDERATION: GitBranch,
  STAGE_5_PITR_CLONE_HA_VAULT: History,
};

const TAB_TO_STAGE_MAP = {
  CLOUD_SQL_STUDIO: 'STAGE_1_OLTP_ENGINES',
  WAVE10_FRONTIER: 'STAGE_1_OLTP_ENGINES',
};

export default function OltpDatabaseContinuityBar({
  projectId,
  activeTab,
  onSelectTab,
  onOpenProvision,
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
        `/api/project/${encodeURIComponent(projectId)}/oltp-database-pipeline/blueprint`,
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
    openArtifactTab,
    sqlPayload,
    provisionType,
  }) => {
    if (provisionType && typeof onOpenProvision === 'function') {
      onOpenProvision(provisionType);
      return;
    }
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
      return;
    }
    barRef.current?.nextElementSibling?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const stages = blueprint?.stages || [
    {
      id: 'STAGE_1_OLTP_ENGINES',
      stepNumber: 1,
      shortTitle: 'Cloud SQL & Spanner',
      title: '1. Cloud SQL, AlloyDB & Spanner Engines',
      targetTab: 'CLOUD_SQL_STUDIO',
      secondaryTab: 'WAVE10_FRONTIER',
      secondaryLabel: 'Spanner & Frontier DB Studio',
      status: 'OPTIMAL',
      metricBadge: 'Probing Engines...',
      summary: 'Discovering live Cloud SQL PostgreSQL/MySQL and Cloud Spanner instances...',
      stageItems: [],
    },
    {
      id: 'STAGE_2_IAM_AUTH_PRIVATE_VPC',
      stepNumber: 2,
      shortTitle: 'IAM Proxy & Private VPC',
      title: '2. IAM DB Auth Proxy, Private VPC & Secrets',
      targetTab: 'SOVEREIGN_STUDIO',
      targetSubTab: 'SECRETS_KMS_WAF',
      secondaryTab: 'VPC_NETWORKS',
      status: 'OPTIMAL',
      metricBadge: 'mTLS 1.3 · Private IP',
      summary: 'Auditing IAM Service Accounts, Private Service Access VPCs, and Secret Manager...',
      stageItems: [],
    },
    {
      id: 'STAGE_3_REPLICA_QUERY_INSIGHTS',
      stepNumber: 3,
      shortTitle: 'Replicas & Query Insights',
      title: '3. Read Replicas, Query Insights & Pooling',
      targetTab: 'CLOUD_SQL_STUDIO',
      secondaryTab: 'LOGS_SHELL',
      status: 'OPTIMAL',
      metricBadge: 'pg_stat_statements',
      summary: 'Checking read replicas, PID lock-tree, and slow query telemetry...',
      stageItems: [],
    },
    {
      id: 'STAGE_4_ZERO_ETL_FEDERATION',
      stepNumber: 4,
      shortTitle: 'Zero-ETL EXTERNAL_QUERY',
      title: '4. Zero-ETL Federation to BigQuery (EXTERNAL_QUERY)',
      targetTab: 'BIGQUERY_STUDIO',
      secondaryTab: 'BIGLAKE_STUDIO',
      status: 'OPTIMAL',
      metricBadge: 'HTAP Pushdown',
      summary: 'Inspecting BigQuery federated connections and target datasets...',
      stageItems: [],
    },
    {
      id: 'STAGE_5_PITR_CLONE_HA_VAULT',
      stepNumber: 5,
      shortTitle: '35d PITR & HA Vault',
      title: '5. 35-Day PITR Clone, HA Failover & Backup Vault',
      targetTab: 'CLOUD_SQL_STUDIO',
      secondaryTab: 'RECYCLE_BIN',
      status: 'OPTIMAL',
      metricBadge: '35d WAL · 30d Vault',
      summary: 'Verifying continuous WAL Point-In-Time Recovery and 30-Day Recycle Bin...',
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
      ? blueprint?.artifacts?.oltpHaPitrTf || ''
      : activeArtifactTab === 'SQL'
      ? blueprint?.artifacts?.externalQuerySql || ''
      : blueprint?.artifacts?.pitrCloneFailoverSh || '';

  const activeArtifactFilename =
    activeArtifactTab === 'TERRAFORM'
      ? `${projectId || 'gcp'}-oltp-database-ha-pitr.tf`
      : activeArtifactTab === 'SQL'
      ? `${projectId || 'gcp'}-external-query-federation.sql`
      : `${projectId || 'gcp'}-pitr-clone-failover.sh`;

  return (
    <div
      ref={barRef}
      className="rounded-2xl border border-teal-500/30 bg-gradient-to-r from-slate-950/95 via-teal-950/20 to-slate-950/95 p-3.5 shadow-xl"
    >
      {/* Top Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/25 to-cyan-500/25 border border-teal-400/40 text-teal-300">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-black uppercase tracking-wider text-teal-300">
                5-Stage Operational OLTP Database & HTAP Continuity Pipeline
              </span>
              <span className="rounded-full bg-teal-500/15 border border-teal-400/30 px-2 py-0.5 text-[10px] font-bold text-teal-300">
                Cloud SQL / Spanner ➔ IAM mTLS Proxy ➔ Replicas ➔ BigQuery Zero-ETL ➔ 35d PITR Vault
              </span>
              {counts.totalOltpEngines !== undefined && (
                <span className="rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-300">
                  {counts.sqlInstances || 0} Cloud SQL · {counts.spannerInstances || 0} Spanner · {counts.datasets || 0} BQ Datasets
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Purpose-built relational & distributed OLTP lifecycle connecting{' '}
              <strong className="text-slate-200">Cloud SQL / AlloyDB / Spanner</strong>,{' '}
              <strong className="text-slate-200">IAM mTLS Auth Proxy & Private VPC</strong>,{' '}
              <strong className="text-slate-200">Query Insights & Replicas</strong>,{' '}
              <strong className="text-slate-200">BigQuery EXTERNAL_QUERY()</strong>, and{' '}
              <strong className="text-slate-200">35-Day Millisecond PITR Clone</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setDrawerOpen((v) => !v)}
            className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition border ${
              drawerOpen
                ? 'bg-teal-500/20 border-teal-400/50 text-teal-200'
                : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:border-teal-400/40 hover:text-teal-200'
            }`}
            title="Inspect selected OLTP Database stage details & Mermaid flowchart"
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
                : 'bg-slate-900/90 border-slate-700/80 text-slate-200 hover:border-teal-400/40 hover:text-teal-200'
            }`}
            title="Synthesize Regional HA Cloud SQL Terraform, BigQuery EXTERNAL_QUERY() SQL, and 35-Day PITR Clone Runbook"
          >
            <Code2 className="w-3.5 h-3.5 text-teal-400" />
            <span>Synthesize OLTP DB Terraform & SQL</span>
          </button>

          <button
            type="button"
            onClick={fetchBlueprint}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-700/80 bg-slate-900/80 px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 hover:border-teal-500/40 hover:text-teal-200 transition"
            title="Re-probe live Cloud SQL, Spanner, IAM Service Accounts, and BigQuery Connections"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-400' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="inline-flex items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/80 p-1.5 text-slate-400 hover:text-slate-200"
            title={collapsed ? 'Expand OLTP Database Continuity Pipeline' : 'Collapse OLTP Database Continuity Pipeline'}
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {/* 5-Stage Interactive Stepper Row */}
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {stages.map((stage, idx) => {
              const IconComp = STAGE_ICONS[stage.id] || Database;
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
                      ? 'border-teal-400/80 bg-teal-950/40 shadow-md shadow-teal-950/50 ring-1 ring-teal-400/35'
                      : 'border-slate-800/90 bg-slate-900/75 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg text-[10px] font-black ${
                          isSelected
                            ? 'bg-teal-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {stage.stepNumber || idx + 1}
                      </span>
                      <IconComp
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
                          ? 'Stage verified on live project'
                          : '0 resources provisioned ($0 idle) — ready to provision'
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
                  {selectedStageObj.sampleSql && (
                    <button
                      type="button"
                      onClick={() => handleLoadSqlInBigQuery(selectedStageObj.sampleSql)}
                      className="inline-flex items-center gap-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 px-2.5 py-1 text-[11px] font-bold text-amber-200 transition"
                    >
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>Load EXTERNAL_QUERY() in BigQuery</span>
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
                          openArtifactTab: selectedStageObj.openArtifactTab,
                          sqlPayload:
                            selectedStageObj.sampleSql &&
                            selectedStageObj.targetTab === 'BIGQUERY_STUDIO'
                              ? selectedStageObj.sampleSql
                              : null,
                        })
                      }
                      className="inline-flex items-center gap-1 rounded-lg bg-teal-600/25 hover:bg-teal-600/35 border border-teal-400/40 px-2.5 py-1 text-[11px] font-bold text-teal-200 transition"
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
                  <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {selectedStageObj.stageItems.map((item, i) => (
                      <div
                        key={`${item.name}-${i}`}
                        onClick={() =>
                          handleExecuteAction({
                            targetTab: item.targetTab,
                            subTab: item.subTab,
                            openArtifactTab: item.openArtifactTab,
                            sqlPayload: item.sqlPayload,
                            provisionType: item.provisionType,
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
                        {item.provisionType ? (
                          <Plus className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

              {/* Live Stage-Specific Mermaid Diagram (Strictly rendered ONLY when live directed edges exist, and collapsed until user clicks Open Interactive Mermaid Flowchart!) */}
              {selectedStageObj.mermaidDsl &&
                selectedStageObj.mermaidDsl.includes('-->') && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-teal-500/25 bg-slate-900/90 px-3 py-2">
                      <div
                        onClick={() => setMermaidExpanded((prev) => !prev)}
                        className="flex items-center gap-2 flex-wrap cursor-pointer select-none"
                      >
                        <span className="px-2 py-0.5 rounded bg-teal-500 text-slate-950 text-[10px] font-mono font-extrabold uppercase tracking-wider">
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
                            : 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-sm'
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
                        subtitle={`Real-time OLTP database & HTAP continuity graph synthesized from live resources in ${projectId}`}
                      />
                    )}
                  </div>
                )}
            </div>
          )}

          {/* Decoupled OLTP DB Terraform, EXTERNAL_QUERY() SQL & PITR Runbook Drawer */}
          {synthDrawerOpen && (
            <div
              ref={synthDrawerRef}
              className="mt-3 rounded-xl border border-emerald-500/40 bg-slate-950/95 p-3.5 shadow-2xl"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                    Live OLTP Database HA Terraform, Zero-ETL EXTERNAL_QUERY() & 35-Day PITR Clone Runbook ({projectId})
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
                    oltp_database_ha_pitr.tf (Terraform)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveArtifactTab('SQL')}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                      activeArtifactTab === 'SQL'
                        ? 'bg-teal-500/25 text-teal-200 border border-teal-400/50'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    external_query_federation.sql (BigQuery Zero-ETL)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveArtifactTab('PITR_SH')}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                      activeArtifactTab === 'PITR_SH'
                        ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/50'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    pitr_clone_and_failover.sh (35d PITR CLI)
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
                {activeArtifactContent || '# Synthesizing live OLTP Database & HTAP Continuity blueprint...'}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  );
}
