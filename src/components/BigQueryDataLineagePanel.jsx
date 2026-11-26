import React, { useState } from 'react';
import axios from 'axios';
import {
  GitBranch,
  RefreshCw,
  Loader2,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Database,
  AlertTriangle,
  CheckCircle2,
  Search,
} from 'lucide-react';
import MermaidArchitectureDiagram from './MermaidArchitectureDiagram';

export default function BigQueryDataLineagePanel({
  projectId,
  onOpenBigQuerySql,
  onShowToast,
  onShowError,
}) {
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [tracing, setTracing] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [assets, setAssets] = useState([]);
  const [selectedFqn, setSelectedFqn] = useState('');
  const [trace, setTrace] = useState(null);
  const [proposedChange, setProposedChange] = useState('DROP or rename a column / change schema');
  const [aiResult, setAiResult] = useState(null);

  const loadAssets = async () => {
    if (!projectId) return;
    setLoadingAssets(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave27/bq-lineage`,
        { action: 'LIST_ASSETS' }
      );
      const list = res.data?.assets || [];
      setAssets(list);
      if (list.length > 0 && !selectedFqn) {
        setSelectedFqn(list[0].fqn);
      }
      if (onShowToast) {
        onShowToast(`Loaded ${list.length} live BigQuery tables/views across ${res.data?.datasetCount || 0} datasets.`);
      }
    } catch (e) {
      const msg = e.response?.data?.error || e.message || 'Failed to load BigQuery assets';
      if (onShowError) onShowError(msg);
    } finally {
      setLoadingAssets(false);
    }
  };

  const runTrace = async (overrideFqn) => {
    const fqn = overrideFqn || selectedFqn;
    const asset = assets.find((a) => a.fqn === fqn);
    if (!projectId || !asset) return;
    setTracing(true);
    setAiResult(null);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave27/bq-lineage`,
        {
          action: 'TRACE',
          datasetId: asset.datasetId,
          tableId: asset.tableId,
          location: asset.location || 'US',
        }
      );
      setTrace(res.data || null);
      if (onShowToast) {
        onShowToast(
          `Lineage traced for ${asset.datasetId}.${asset.tableId}: ${res.data?.upstream?.length || 0} upstream, ${res.data?.downstream?.length || 0} downstream.`
        );
      }
    } catch (e) {
      const msg = e.response?.data?.error || e.message || 'Data lineage trace failed';
      if (onShowError) onShowError(msg);
    } finally {
      setTracing(false);
    }
  };

  const runAiImpact = async () => {
    if (!projectId || !trace) return;
    setAiLoading(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave27/bq-lineage`,
        {
          action: 'AI_IMPACT',
          fqn: trace.fqn,
          proposedChange,
          upstream: trace.upstream,
          downstream: trace.downstream,
          schemaFields: trace.schemaFields,
          geminiModel: 'gemini-4-neon',
        }
      );
      setAiResult(res.data || null);
      if (onShowToast) {
        onShowToast(`Vertex AI (${res.data?.model || 'gemini-4-neon'}) breaking-change risk brief ready.`);
      }
    } catch (e) {
      if (e?.__cancelledByGatekeeper) return;
      const msg = e.response?.data?.error || e.message || 'Vertex AI impact brief failed';
      if (onShowError) onShowError(msg);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-zinc-200 dark:border-[#1e2433] bg-white dark:bg-[#0d111a] p-4 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              BigQuery Data Lineage & Downstream Blast-Radius Studio
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Live Data Lineage API + `INFORMATION_SCHEMA.VIEWS` dependency tracing with collapsed-by-default lineage DAG and Gemini 4 breaking-change risk brief.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={loadingAssets || !projectId}
          onClick={loadAssets}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium shadow-sm transition"
        >
          {loadingAssets ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {loadingAssets ? 'Loading Assets...' : assets.length ? 'Refresh Tables' : 'Load Tables & Views'}
        </button>
      </div>

      {assets.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[240px]">
            <Database className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedFqn}
              onChange={(e) => setSelectedFqn(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-zinc-200 dark:border-[#1e2433] bg-zinc-50 dark:bg-[#080b12] text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {assets.map((a) => (
                <option key={a.fqn} value={a.fqn}>
                  {a.datasetId}.{a.tableId} ({a.type} · {a.location})
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            disabled={tracing || !selectedFqn}
            onClick={() => runTrace(selectedFqn)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium shadow-sm transition cursor-pointer"
          >
            {tracing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            {tracing ? 'Tracing...' : 'Trace Blast Radius'}
          </button>
          {onOpenBigQuerySql && selectedFqn && (
            <button
              type="button"
              onClick={() =>
                onOpenBigQuerySql(
                  `SELECT * FROM \`${selectedFqn}\` LIMIT 100;`
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-[#1e2433] text-zinc-700 dark:text-zinc-200 hover:border-amber-500 text-xs font-medium transition cursor-pointer"
              title="Open this table directly in BigQuery SQL Workbench"
            >
              Query in SQL Workbench →
            </button>
          )}
        </div>
      )}

      {trace && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-lg border border-zinc-200 dark:border-[#1e2433] bg-zinc-50 dark:bg-[#0a0e17] p-3">
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> Upstream Sources
              </div>
              <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                {trace.upstream.length}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 dark:border-[#1e2433] bg-zinc-50 dark:bg-[#0a0e17] p-3">
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <ArrowDownRight className="w-3.5 h-3.5" /> Downstream Blast Radius
              </div>
              <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                {trace.downstream.length}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 dark:border-[#1e2433] bg-zinc-50 dark:bg-[#0a0e17] p-3">
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Schema & Rows</div>
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                {trace.schemaFields?.length || 0} cols · {Number(trace.numRows || 0).toLocaleString()} rows
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 dark:border-[#1e2433] bg-zinc-50 dark:bg-[#0a0e17] p-3">
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Lineage Engine</div>
              <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-1">
                API: {trace.apiStatus?.dataLineageApi} · SQL: {trace.apiStatus?.informationSchemaFallback}
              </div>
            </div>
          </div>

          <MermaidArchitectureDiagram
            title={`BigQuery Data Lineage & Blast-Radius DAG (${trace.datasetId}.${trace.tableId})`}
            code={trace.mermaidGraph}
            defaultExpanded={false}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-lg border border-zinc-200 dark:border-[#1e2433] p-3 space-y-2">
              <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Upstream Sources ({trace.upstream.length})
              </div>
              {trace.upstream.length === 0 ? (
                <div className="text-xs text-zinc-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Root table / direct ingestion source.
                </div>
              ) : (
                <ul className="space-y-1">
                  {trace.upstream.map((u) => (
                    <li key={u.fqn} className="text-xs font-mono text-zinc-700 dark:text-zinc-300 flex items-center justify-between gap-2">
                      <span className="truncate">{u.short}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 shrink-0">
                        {u.sourceEngine}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-lg border border-zinc-200 dark:border-[#1e2433] p-3 space-y-2">
              <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Downstream Dependents ({trace.downstream.length})
              </div>
              {trace.downstream.length === 0 ? (
                <div className="text-xs text-zinc-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  No active downstream views or lineage links detected.
                </div>
              ) : (
                <ul className="space-y-1">
                  {trace.downstream.map((d) => (
                    <li key={d.fqn} className="text-xs font-mono text-zinc-700 dark:text-zinc-300 flex items-center justify-between gap-2">
                      <span className="truncate flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                        {d.short}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 shrink-0">
                        {d.sourceEngine}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 dark:border-[#1e2433] bg-zinc-50/70 dark:bg-[#0a0e17] p-3 space-y-2.5">
            <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              Vertex AI (`gemini-4-neon`) Breaking-Change Risk Brief
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={proposedChange}
                onChange={(e) => setProposedChange(e.target.value)}
                placeholder="Describe proposed schema change (e.g. DROP COLUMN customer_id)..."
                className="flex-1 min-w-[220px] px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-[#1e2433] bg-white dark:bg-[#080b12] text-xs text-zinc-900 dark:text-zinc-100"
              />
              <button
                type="button"
                disabled={aiLoading}
                onClick={runAiImpact}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium shadow-sm transition"
              >
                {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {aiLoading ? 'Analyzing Blast Radius...' : 'Run AI Impact Brief'}
              </button>
            </div>
            {aiResult?.analysis && (
              <div className="rounded-lg border border-blue-500/30 bg-white dark:bg-[#0d111a] p-3 text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap font-mono leading-relaxed">
                <div className="text-[11px] font-sans font-semibold text-blue-600 dark:text-blue-400 mb-1.5">
                  Synthesized by {aiResult.model} ({aiResult.location})
                </div>
                {aiResult.analysis}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
