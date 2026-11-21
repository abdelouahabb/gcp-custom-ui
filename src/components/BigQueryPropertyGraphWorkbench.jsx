import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  GitBranch,
  RefreshCw,
  Play,
  Sparkles,
  Database,
  CheckCircle2,
  Copy,
  Check,
  Layers,
  Search,
  Wand2,
} from 'lucide-react';
import MermaidArchitectureDiagram from './MermaidArchitectureDiagram';

export default function BigQueryPropertyGraphWorkbench({
  projectId,
  onOpenBigQuerySql,
  onShowToast,
  onShowError,
}) {
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState('');
  const [propertyGraphs, setPropertyGraphs] = useState([]);
  const [graphName, setGraphName] = useState('cloudpulse_entity_graph');
  const [selectedGraphDdl, setSelectedGraphDdl] = useState('');
  const [discovering, setDiscovering] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [bootstrapReceipt, setBootstrapReceipt] = useState(null);

  const [gqlQuery, setGqlQuery] = useState('');
  const [runningMode, setRunningMode] = useState(null); // 'DRY_RUN' | 'LIVE' | null
  const [elapsedMs, setElapsedMs] = useState(0);
  const [gqlResult, setGqlResult] = useState(null);

  const [nlPrompt, setNlPrompt] = useState(
    'Find 1 to 3 hop money flows ending at high-risk entities (risk_score > 0.7) ranked by total transfer amount'
  );
  const [geminiModel, setGeminiModel] = useState('gemini-4-neon');
  const [generatingGql, setGeneratingGql] = useState(false);
  const [copied, setCopied] = useState(false);

  const buildTemplates = useCallback(
    (ds, gName) => {
      const fqn = `\`${projectId}.${ds || 'analytics_lakehouse'}.${gName || 'cloudpulse_entity_graph'}\``;
      return [
        {
          id: 'direct-transfers',
          label: '1. Direct Transfers (GQL Top-N)',
          desc: 'Native standalone GQL pattern match + sorting (zero Cypher)',
          gql: `GRAPH ${fqn}
MATCH (src:Entity)-[t:Transfers]->(dst:Entity)
RETURN
  src.entity_name AS source_name,
  dst.entity_name AS target_name,
  t.channel AS channel,
  t.amount_usd AS amount_usd,
  dst.risk_score AS dst_risk_score
ORDER BY amount_usd DESC
LIMIT 20`,
        },
        {
          id: 'multi-hop-ring',
          label: '2. Multi-Hop 1..3 Fraud Path',
          desc: 'Variable-length path traversal with quantified edges ->{1,3}',
          gql: `GRAPH ${fqn}
MATCH p = (src:Entity)-[t:Transfers]->{1,3}(dst:Entity)
FILTER src.entity_id != dst.entity_id AND dst.risk_score >= 0.7
RETURN
  src.entity_name AS source_name,
  dst.entity_name AS target_name,
  ARRAY_LENGTH(EDGES(p)) AS hops,
  dst.risk_score AS target_risk_score
ORDER BY target_risk_score DESC, hops ASC
LIMIT 20`,
        },
        {
          id: 'high-risk-exists',
          label: '3. High-Risk Counterparties (FILTER EXISTS)',
          desc: 'GQL FILTER EXISTS subquery with re-declared GRAPH scope',
          gql: `GRAPH ${fqn}
MATCH (e:Entity)
FILTER EXISTS {
  GRAPH ${fqn}
  MATCH (e)-[:Transfers]->(risky:Entity)
  FILTER risky.risk_score >= 0.8
}
RETURN
  e.entity_id,
  e.entity_name,
  e.entity_type,
  e.region,
  e.risk_score
ORDER BY e.risk_score DESC`,
        },
        {
          id: 'graph-table-agg',
          label: '4. Entity Outflow Rollup (Implicit GROUP BY)',
          desc: 'Standalone GQL implicit aggregation per entity (no GROUP BY needed)',
          gql: `GRAPH ${fqn}
MATCH (src:Entity)-[t:Transfers]->(:Entity)
RETURN
  src.entity_name AS entity_name,
  src.entity_type AS entity_type,
  COUNT(t) AS transfer_count,
  ROUND(SUM(t.amount_usd), 2) AS total_outflow_usd
ORDER BY total_outflow_usd DESC
LIMIT 15`,
        },
      ];
    },
    [projectId]
  );

  useEffect(() => {
    if (!runningMode) {
      setElapsedMs(0);
      return undefined;
    }
    const start = Date.now();
    const id = setInterval(() => setElapsedMs(Date.now() - start), 100);
    return () => clearInterval(id);
  }, [runningMode]);

  const discoverGraphs = useCallback(
    async (overrideDs = null) => {
      if (!projectId) return;
      setDiscovering(true);
      try {
        const { data } = await axios.post(
          `/api/project/${encodeURIComponent(projectId)}/bigquery/property-graph`,
          {
            action: 'DISCOVER',
            datasetId: overrideDs !== null ? overrideDs : selectedDataset,
          }
        );
        setDatasets(Array.isArray(data?.datasets) ? data.datasets : []);
        const nextDs = data?.selectedDataset || overrideDs || selectedDataset || '';
        if (nextDs && nextDs !== selectedDataset) {
          setSelectedDataset(nextDs);
        }
        const graphs = Array.isArray(data?.propertyGraphs) ? data.propertyGraphs : [];
        setPropertyGraphs(graphs);
        const activeGName = graphs[0]?.property_graph_name || graphName;
        if (graphs[0]?.property_graph_name) {
          setGraphName(graphs[0].property_graph_name);
          setSelectedGraphDdl(graphs[0].ddl || '');
        }
        if (!gqlQuery && nextDs) {
          const tpls = buildTemplates(nextDs, activeGName);
          setGqlQuery(tpls[0].gql);
        }
      } catch (err) {
        onShowError?.(err?.response?.data?.error || err.message || 'Failed to discover BigQuery Property Graphs.');
      } finally {
        setDiscovering(false);
      }
    },
    [projectId, selectedDataset, graphName, gqlQuery, buildTemplates, onShowError]
  );

  useEffect(() => {
    discoverGraphs();
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBootstrapGraph = async () => {
    if (!projectId || !selectedDataset) return;
    setBootstrapping(true);
    try {
      const { data } = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/bigquery/property-graph`,
        {
          action: 'BOOTSTRAP_GRAPH',
          datasetId: selectedDataset,
          graphName,
        }
      );
      setBootstrapReceipt(data);
      setSelectedGraphDdl(data.ddl || '');
      const tpls = buildTemplates(selectedDataset, graphName);
      setGqlQuery(tpls[0].gql);
      onShowToast?.(`Created live BigQuery Property Graph ${data.graphFqn} (${data.durationMs}ms)!`);
      discoverGraphs(selectedDataset);
    } catch (err) {
      if (err?.code === 'CLOUDPULSE_DESTRUCTIVE_CANCELLED') return;
      onShowError?.(err?.response?.data?.error || err.message || 'Failed to bootstrap Property Graph.');
    } finally {
      setBootstrapping(false);
    }
  };

  const handleRunGql = async (isDryRun = true) => {
    if (!projectId || !selectedDataset || !gqlQuery.trim()) return;
    setRunningMode(isDryRun ? 'DRY_RUN' : 'LIVE');
    try {
      const { data } = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/bigquery/property-graph`,
        {
          action: 'RUN_GQL',
          datasetId: selectedDataset,
          graphName,
          gqlQuery,
          dryRun: isDryRun,
        }
      );
      setGqlResult(data);
      onShowToast?.(
        isDryRun
          ? `GQL Dry-Run valid ($0.00 · ${data.totalBytesProcessed} bytes · ${data.durationMs}ms).`
          : `GQL executed live: ${data.totalRows} row(s) returned in ${data.durationMs}ms.`
      );
    } catch (err) {
      if (err?.code === 'CLOUDPULSE_DESTRUCTIVE_CANCELLED') return;
      onShowError?.(err?.response?.data?.error || err.message || 'BigQuery GQL execution failed.');
    } finally {
      setRunningMode(null);
    }
  };

  const handleNl2Gql = async () => {
    if (!projectId || !selectedDataset || !nlPrompt.trim()) return;
    setGeneratingGql(true);
    try {
      const { data } = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/bigquery/property-graph`,
        {
          action: 'AI_NL2GQL',
          datasetId: selectedDataset,
          graphName,
          nlPrompt,
          geminiModel,
          graphDdl: selectedGraphDdl,
        }
      );
      if (data?.gql) {
        setGqlQuery(data.gql);
        onShowToast?.(`Generated GoogleSQL GQL with ${data.modelUsed} (${data.durationMs}ms).`);
      }
    } catch (err) {
      onShowError?.(err?.response?.data?.error || err.message || 'Gemini 4 NL2GQL generation failed.');
    } finally {
      setGeneratingGql(false);
    }
  };

  const templates = buildTemplates(selectedDataset, graphName);

  return (
    <div className="space-y-4">
      {/* Header & Live INFORMATION_SCHEMA.PROPERTY_GRAPHS Discovery */}
      <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#10141d] space-y-3.5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-amber-500 shrink-0" />
              <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                BigQuery Property Graph (GoogleSQL GQL) &amp; Hybrid Topology Workbench
              </h3>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Discovers live <code>INFORMATION_SCHEMA.PROPERTY_GRAPHS</code>, provisions a real <code>CREATE PROPERTY GRAPH</code> schema (nodes + edges), generates native GoogleSQL <strong>GQL</strong> with <strong>Gemini 4</strong>, and renders live topology graphs from query results.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => discoverGraphs(selectedDataset)}
              disabled={discovering}
              className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${discovering ? 'animate-spin' : ''}`} />
              Refresh Graphs
            </button>
            <button
              type="button"
              onClick={handleBootstrapGraph}
              disabled={bootstrapping || !selectedDataset}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              {bootstrapping ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Layers className="w-3.5 h-3.5" />
              )}
              <span>{bootstrapping ? 'Creating Property Graph...' : 'Bootstrap Live Property Graph'}</span>
            </button>
          </div>
        </div>

        {/* Dataset & Graph Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div>
            <label className="block text-[10.5px] font-mono text-zinc-500 mb-1">BigQuery Dataset</label>
            <select
              value={selectedDataset}
              onChange={(e) => {
                setSelectedDataset(e.target.value);
                discoverGraphs(e.target.value);
              }}
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 font-mono text-xs text-zinc-900 dark:text-zinc-100"
            >
              {datasets.length === 0 && <option value="">No datasets found</option>}
              {datasets.map((d) => (
                <option key={d.datasetId} value={d.datasetId}>
                  {d.datasetId} ({d.location})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10.5px] font-mono text-zinc-500 mb-1">Property Graph Name</label>
            <input
              type="text"
              value={graphName}
              onChange={(e) => setGraphName(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 font-mono text-xs text-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="block text-[10.5px] font-mono text-zinc-500 mb-1">
              Discovered Graphs in {selectedDataset || 'Dataset'} ({propertyGraphs.length})
            </label>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {propertyGraphs.length > 0 ? (
                propertyGraphs.map((g) => (
                  <button
                    key={g.property_graph_name}
                    type="button"
                    onClick={() => {
                      setGraphName(g.property_graph_name);
                      setSelectedGraphDdl(g.ddl || '');
                      const tpls = buildTemplates(selectedDataset, g.property_graph_name);
                      setGqlQuery(tpls[0].gql);
                    }}
                    className={`px-2 py-1 rounded-md border font-mono text-[10.5px] font-bold cursor-pointer ${
                      graphName === g.property_graph_name
                        ? 'border-amber-500 bg-amber-500/15 text-amber-800 dark:text-amber-200'
                        : 'border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {g.property_graph_name}
                  </button>
                ))
              ) : (
                <span className="text-[11px] font-mono text-zinc-500">
                  None yet — click <strong>Bootstrap Live Property Graph</strong>.
                </span>
              )}
            </div>
          </div>
        </div>

        {bootstrapReceipt?.ok && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/35 space-y-2 text-xs font-mono">
            <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                Landed Live Property Graph <code>{bootstrapReceipt.graphFqn}</code> (6 Entities · 6 Transfer Edges · {bootstrapReceipt.durationMs}ms)
              </span>
            </div>
            {bootstrapReceipt.mermaidPreview && (
              <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                <MermaidArchitectureDiagram code={bootstrapReceipt.mermaidPreview} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Gemini 4 Natural Language -> GoogleSQL GQL Copilot + 4 Official GQL Templates */}
      <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#10141d] space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            <Wand2 className="w-4 h-4 text-amber-500 shrink-0" />
            Gemini 4 Natural Language → BigQuery GoogleSQL GQL Copilot
          </span>
          <select
            value={geminiModel}
            onChange={(e) => setGeminiModel(e.target.value)}
            className="px-2 py-1 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 font-mono text-[11px] text-zinc-900 dark:text-zinc-100"
          >
            <option value="gemini-4-neon">gemini-4-neon</option>
            <option value="gemini-4-hydrogen">gemini-4-hydrogen</option>
            <option value="gemini-4-carbon">gemini-4-carbon</option>
            <option value="gemini-4-argon">gemini-4-argon</option>
          </select>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={nlPrompt}
            onChange={(e) => setNlPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNl2Gql();
            }}
            placeholder="Describe a graph traversal, fraud ring, or multi-hop rollup in plain English..."
            className="flex-1 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
          />
          <button
            type="button"
            disabled={generatingGql || !selectedDataset}
            onClick={handleNl2Gql}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            {generatingGql ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{generatingGql ? 'Synthesizing GQL...' : 'Generate GQL'}</span>
          </button>
        </div>

        {/* 4 Official DAK v1.3.0 GoogleSQL GQL Templates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setGqlQuery(t.gql)}
              className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 hover:border-amber-500/50 text-left transition-all cursor-pointer space-y-1"
            >
              <div className="text-[11px] font-extrabold text-zinc-900 dark:text-zinc-100">{t.label}</div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400">{t.desc}</div>
            </button>
          ))}
        </div>

        {/* Live GQL Editor & Execution Toolbar */}
        <textarea
          rows={9}
          value={gqlQuery}
          onChange={(e) => setGqlQuery(e.target.value)}
          className="w-full p-3 rounded-xl bg-zinc-950 text-emerald-300 border border-zinc-800 font-mono text-xs focus:outline-none focus:border-amber-500"
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={Boolean(runningMode) || !selectedDataset || !gqlQuery.trim()}
              onClick={() => handleRunGql(true)}
              className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              {runningMode === 'DRY_RUN' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Search className="w-3.5 h-3.5 text-amber-500" />
              )}
              <span>
                {runningMode === 'DRY_RUN'
                  ? `Validating GQL (${(elapsedMs / 1000).toFixed(1)}s)...`
                  : '1. Dry-Run Validate GQL ($0.00)'}
              </span>
            </button>
            <button
              type="button"
              disabled={Boolean(runningMode) || !selectedDataset || !gqlQuery.trim()}
              onClick={() => handleRunGql(false)}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              {runningMode === 'LIVE' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              <span>
                {runningMode === 'LIVE'
                  ? `Executing Live GQL (${(elapsedMs / 1000).toFixed(1)}s)...`
                  : '2. Execute Live GQL'}
              </span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            {typeof onOpenBigQuerySql === 'function' && gqlQuery.trim() && (
              <button
                type="button"
                onClick={() => onOpenBigQuerySql(gqlQuery)}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-mono font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 text-amber-500" />
                Open in BigQuery Studio
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(gqlQuery);
                setCopied(true);
                onShowToast?.('Copied BigQuery GQL');
                setTimeout(() => setCopied(false), 1800);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-mono font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              Copy
            </button>
          </div>
        </div>

        {/* Live Dual Output: Auto-Rendered Mermaid Topology + Tabular Result Rows */}
        {gqlResult && (
          <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <span className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {gqlResult.dryRun
                  ? `GQL Dry-Run Validated ($0.00 · ${gqlResult.totalBytesProcessed} bytes estimated)`
                  : `Live GQL Completed (${gqlResult.totalRows} row(s) · ${gqlResult.durationMs}ms)`}
              </span>
              {gqlResult.bqJobId && (
                <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-[10.5px] text-zinc-500">
                  Job: {gqlResult.bqJobId.slice(0, 22)}
                </span>
              )}
            </div>

            {gqlResult.mermaidGraph && (
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                <div className="text-[10.5px] font-mono font-bold text-amber-600 dark:text-amber-400 mb-2">
                  Live GQL Traversal Topology Graph
                </div>
                <MermaidArchitectureDiagram code={gqlResult.mermaidGraph} />
              </div>
            )}

            {Array.isArray(gqlResult.rows) && gqlResult.rows.length > 0 && (
              <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-xl max-h-72">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 sticky top-0">
                    <tr>
                      {Object.keys(gqlResult.rows[0]).map((col) => (
                        <th key={col} className="px-3 py-2">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {gqlResult.rows.map((r, i) => (
                      <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                        {Object.values(r).map((val, j) => (
                          <td key={j} className="px-3 py-1.5 text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
                            {String(val ?? 'NULL')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
