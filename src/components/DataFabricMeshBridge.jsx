import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Workflow,
  RefreshCw,
  Database,
  Layers,
  Flame,
  HardDrive,
  Sparkles,
  Copy,
  Check,
  Download,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Play,
  Terminal,
  UploadCloud,
  Search,
  Zap,
} from 'lucide-react';
import MermaidArchitectureDiagram from './MermaidArchitectureDiagram';

const FABRIC_BRIDGES = [
  {
    id: 'ALLOYDB_BIGQUERY_FEDERATION',
    title: '1. AlloyDB ⇄ BigQuery Zero-ETL & AI Sync',
    badge: 'OLTP ⇄ Warehouse',
    desc: 'Federated EXTERNAL_QUERY from BigQuery into live AlloyDB + reverse-ETL back to SCaNN.',
  },
  {
    id: 'GCS_SPARK_BIGLAKE_BQ',
    title: '2. GCS → Spark 3.5 Lightning → BigLake Iceberg → BQ',
    badge: 'Open Lakehouse',
    desc: '$0.00/GB same-region Bronze Parquet → C++ Lightning Engine → ACID Iceberg → BigQuery.',
  },
  {
    id: 'GCS_BQ_GEMINI4_ALLOYDB_RAG',
    title: '3. GCS Docs → BigQuery Gemini 4 → AlloyDB SCaNN RAG',
    badge: 'End-to-End GenAI',
    desc: 'Object Tables → Gemini 4 enrichment & embeddings → sub-5ms operational SCaNN serving.',
  },
  {
    id: 'CLOUDSQL_PGLOGICAL_ALLOYDB_SOVEREIGN',
    title: '4. Cloud SQL / RDS → AlloyDB (pglogical) + Sovereign CMEK',
    badge: 'Zero Lock-in',
    desc: 'Zero-downtime logical replication cutover + Vertex AI & Sovereign KMS authorization.',
  },
];

export default function DataFabricMeshBridge({
  projectId,
  onNavigateTab,
  onOpenBigQuerySql,
  onRunInShell,
  onShowToast,
  onShowError,
}) {
  const [mesh, setMesh] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeBridgeId, setActiveBridgeId] = useState('ALLOYDB_BIGQUERY_FEDERATION');
  const [selectedBucket, setSelectedBucket] = useState('');
  const [selectedAlloy, setSelectedAlloy] = useState('');
  const [selectedDataset, setSelectedDataset] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('us-central1');
  const [geminiModel, setGeminiModel] = useState('gemini-4-neon');
  const [bridgeResult, setBridgeResult] = useState(null);
  const [synthesizing, setSynthesizing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Live End-to-End 4-Stage RAG Demo Loop state (GCS -> BigQuery Gemini 4 -> AlloyDB Omni SCaNN -> Live Search)
  const [ragDocFilename, setRagDocFilename] = useState('alloydb-express-rag-brief.md');
  const [ragDocTitle, setRagDocTitle] = useState('AlloyDB Express PG 18 & 6-Engine Data Fabric Architecture');
  const [ragDocContent, setRagDocContent] = useState(
    'AlloyDB Express delivers PostgreSQL 18 with scale-to-zero economics (1 vCPU / 4 GB RAM), auto-storage up to 20 GB, and 1-command in-place upgrade (--no-enable-express) to Enterprise HA with 1:8 RAM ratio and up to 288 vCPUs. Combined with Google SCaNN vector indexing (alloydb_scann), it serves sub-5ms operational RAG directly inside PostgreSQL with zero external vector database, while BigQuery Gemini 4 and Managed Spark 3.5 Lightning handle petabyte-scale enrichment over Cloud Storage.'
  );
  const [ragRunningStage, setRagRunningStage] = useState(null);
  const [ragStage1, setRagStage1] = useState(null);
  const [ragStage2, setRagStage2] = useState(null);
  const [ragStage3, setRagStage3] = useState(null);
  const [ragSearchQuery, setRagSearchQuery] = useState(
    'How does AlloyDB Express upgrade to Enterprise and serve sub-5ms RAG?'
  );
  const [ragSearchResult, setRagSearchResult] = useState(null);

  const runRagStage1Upload = async () => {
    if (!projectId) return null;
    setRagRunningStage('UPLOAD_GCS_DOC');
    try {
      const { data } = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/data-fabric/rag-loop`,
        {
          stage: 'UPLOAD_GCS_DOC',
          bucketName: selectedBucket,
          region: selectedRegion,
          docFilename: ragDocFilename,
          docTitle: ragDocTitle,
          docContent: ragDocContent,
        }
      );
      setRagStage1(data);
      onShowToast?.(`Stage 1 complete: Uploaded ${data.gcsUri} (${data.sizeBytes} bytes in ${data.durationMs}ms).`);
      return data;
    } catch (err) {
      if (err?.code === 'CLOUDPULSE_DESTRUCTIVE_CANCELLED') return null;
      onShowError?.(err?.response?.data?.error || err.message || 'Stage 1 GCS upload failed.');
      return null;
    } finally {
      setRagRunningStage(null);
    }
  };

  const runRagStage2BqGemini = async (overrideUri = null) => {
    if (!projectId) return null;
    setRagRunningStage('RUN_BQ_GEMINI4');
    try {
      const { data } = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/data-fabric/rag-loop`,
        {
          stage: 'RUN_BQ_GEMINI4',
          bucketName: selectedBucket,
          datasetId: selectedDataset,
          region: selectedRegion,
          geminiModel,
          docFilename: ragDocFilename,
          docTitle: ragDocTitle,
          docContent: ragDocContent,
          docUri: overrideUri || ragStage1?.gcsUri || `gs://${selectedBucket}/docs/${ragDocFilename}`,
        }
      );
      setRagStage2(data);
      onShowToast?.(
        `Stage 2 complete: ${data.modelUsed} enriched + 768-d embedded & persisted to ${data.bigqueryTable} (${data.durationMs}ms).`
      );
      return data;
    } catch (err) {
      if (err?.code === 'CLOUDPULSE_DESTRUCTIVE_CANCELLED') return null;
      onShowError?.(err?.response?.data?.error || err.message || 'Stage 2 BigQuery + Gemini 4 enrichment failed.');
      return null;
    } finally {
      setRagRunningStage(null);
    }
  };

  const runRagStage3LoadScann = async (overrideUri = null, overrideStage2 = null) => {
    if (!projectId) return null;
    const s2 = overrideStage2 || ragStage2;
    if (!s2?.embedding) {
      onShowError?.('Run Stage 2 (BigQuery + Gemini 4 + 768-d Embedding) first.');
      return null;
    }
    setRagRunningStage('LOAD_ALLOYDB_SCANN');
    try {
      const { data } = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/data-fabric/rag-loop`,
        {
          stage: 'LOAD_ALLOYDB_SCANN',
          bucketName: selectedBucket,
          docFilename: ragDocFilename,
          docTitle: ragDocTitle,
          docContent: ragDocContent,
          docUri: overrideUri || ragStage1?.gcsUri || `gs://${selectedBucket}/docs/${ragDocFilename}`,
          summary: s2.summary,
          embedding: s2.embedding,
        }
      );
      setRagStage3(data);
      onShowToast?.(
        `Stage 3 complete: Indexed into ${data.table} (${data.indexName} · ${data.totalDocsIndexed} docs in ${data.durationMs}ms).`
      );
      return data;
    } catch (err) {
      if (err?.code === 'CLOUDPULSE_DESTRUCTIVE_CANCELLED') return null;
      onShowError?.(err?.response?.data?.error || err.message || 'Stage 3 AlloyDB Omni SCaNN indexing failed.');
      return null;
    } finally {
      setRagRunningStage(null);
    }
  };

  const runRagStage4Search = async () => {
    if (!projectId || !ragSearchQuery.trim()) return;
    setRagRunningStage('QUERY_SCANN_RAG');
    try {
      const { data } = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/data-fabric/rag-loop`,
        {
          stage: 'QUERY_SCANN_RAG',
          region: selectedRegion,
          geminiModel,
          searchQuery: ragSearchQuery,
          topK: 5,
        }
      );
      setRagSearchResult(data);
      onShowToast?.(
        `SCaNN vector search completed in ${data.pgExecutionMs !== null ? `${data.pgExecutionMs.toFixed(2)}ms` : `${data.totalDurationMs}ms`} (${data.matches?.length || 0} matches).`
      );
    } catch (err) {
      onShowError?.(err?.response?.data?.error || err.message || 'Stage 4 SCaNN semantic search failed.');
    } finally {
      setRagRunningStage(null);
    }
  };

  const fetchMesh = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const { data } = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/data-fabric/mesh`
      );
      setMesh(data);
      if (data?.engines?.gcs?.items?.[0]?.id && !selectedBucket) {
        setSelectedBucket(data.engines.gcs.items[0].id);
      }
      if (data?.engines?.alloydb?.items?.[0]?.id && !selectedAlloy) {
        setSelectedAlloy(data.engines.alloydb.items[0].id);
      }
      if (data?.engines?.bigquery?.items?.[0]?.id && !selectedDataset) {
        setSelectedDataset(data.engines.bigquery.items[0].id);
      }
      if (data?.dominantRegion && data.dominantRegion.includes('-')) {
        setSelectedRegion(data.dominantRegion);
      }
    } catch (err) {
      if (typeof onShowError === 'function') {
        onShowError(err?.response?.data?.error || err.message || 'Failed to discover Data Fabric Mesh.');
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, selectedBucket, selectedAlloy, selectedDataset, onShowError]);

  useEffect(() => {
    fetchMesh();
  }, [fetchMesh]);

  const synthesizeBridge = useCallback(
    async (overrideBridgeId = null) => {
      if (!projectId) return;
      const targetId = overrideBridgeId || activeBridgeId;
      setSynthesizing(true);
      try {
        const { data } = await axios.post(
          `/api/project/${encodeURIComponent(projectId)}/data-fabric/synthesize-bridge`,
          {
            bridgeId: targetId,
            bucketName: selectedBucket || 'bronze-landing-bucket',
            alloyClusterId: selectedAlloy || 'alloydb-express-app',
            datasetId: selectedDataset || 'gold_lakehouse_ai',
            region: selectedRegion || 'us-central1',
            geminiModel,
          }
        );
        setBridgeResult(data);
      } catch (err) {
        if (typeof onShowError === 'function') {
          onShowError(err?.response?.data?.error || err.message || 'Bridge synthesis failed.');
        }
      } finally {
        setSynthesizing(false);
      }
    },
    [projectId, activeBridgeId, selectedBucket, selectedAlloy, selectedDataset, selectedRegion, geminiModel, onShowError]
  );

  useEffect(() => {
    synthesizeBridge(activeBridgeId);
  }, [activeBridgeId, selectedBucket, selectedAlloy, selectedDataset, selectedRegion, geminiModel, synthesizeBridge]);

  const copyCode = () => {
    if (!bridgeResult?.code) return;
    navigator.clipboard?.writeText(bridgeResult.code);
    setCopied(true);
    if (typeof onShowToast === 'function') onShowToast(`Copied ${bridgeResult.filename}`);
    setTimeout(() => setCopied(false), 1800);
  };

  const downloadCode = () => {
    if (!bridgeResult?.code) return;
    const blob = new Blob([bridgeResult.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = bridgeResult.filename || 'data-fabric-bridge.sql';
    a.click();
    URL.revokeObjectURL(url);
    if (typeof onShowToast === 'function') onShowToast(`Downloaded ${bridgeResult.filename}`);
  };

  const engineCards = [
    { id: 'gcs', label: 'Cloud Storage', tab: 'CLOUD_STORAGE', icon: HardDrive, count: mesh?.engines?.gcs?.count ?? '—' },
    { id: 'alloydb', label: 'AlloyDB PG 18', tab: 'ALLOYDB_STUDIO', icon: Database, count: mesh?.engines?.alloydb?.count ?? '—' },
    { id: 'cloudsql', label: 'Cloud SQL', tab: 'CLOUD_SQL_STUDIO', icon: Database, count: mesh?.engines?.cloudsql?.count ?? '—' },
    { id: 'spark', label: 'Managed Spark', tab: 'MANAGED_SPARK_STUDIO', icon: Flame, count: mesh?.engines?.spark?.count ?? '—' },
    { id: 'biglake', label: 'BigLake Iceberg', tab: 'BIGLAKE_STUDIO', icon: Layers, count: mesh?.engines?.biglake?.count ?? '—' },
    { id: 'bigquery', label: 'BigQuery AI', tab: 'BIGQUERY_STUDIO', icon: Sparkles, count: mesh?.engines?.bigquery?.count ?? '—' },
  ];

  return (
    <div className="space-y-4">
      {/* Live 6-Engine Discovery & Data-Gravity Header */}
      <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#10141d] space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Workflow className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                Live 6-Engine Google Cloud Data Fabric Mesh &amp; Autonomous Cross-Studio Bridge
              </h3>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Unifies your live <strong>Cloud Storage</strong>, <strong>AlloyDB</strong>, <strong>Cloud SQL</strong>, <strong>Managed Spark 3.5 Lightning</strong>, <strong>BigLake Iceberg</strong>, and <strong>BigQuery Gemini 4 AI</strong> assets into runnable cross-engine pipelines.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchMesh}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh 6-Engine Mesh
          </button>
        </div>

        {/* 6 Live Clickable Engine Nodes */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {engineCards.map((eng) => {
            const Icon = eng.icon;
            return (
              <button
                key={eng.id}
                type="button"
                onClick={() => typeof onNavigateTab === 'function' && onNavigateTab(eng.tab)}
                className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 hover:border-amber-500/50 text-left transition-all cursor-pointer flex flex-col justify-between gap-1"
              >
                <div className="flex items-center justify-between gap-1">
                  <Icon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <ArrowUpRight className="w-3 h-3 text-zinc-400 shrink-0" />
                </div>
                <div className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {eng.label}
                </div>
                <div className="text-xs font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                  {eng.count} live
                </div>
              </button>
            );
          })}
        </div>

        {/* Same-Region $0.00/GB Data-Gravity Verdict */}
        {mesh?.egressVerdict && (
          <div
            className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
              mesh.hasCrossRegionEgressRisk
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200'
                : 'border-emerald-500/35 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200'
            }`}
          >
            {mesh.hasCrossRegionEgressRisk ? (
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            )}
            <span className="font-mono text-[11px]">{mesh.egressVerdict}</span>
          </div>
        )}

        {/* Live Auto-Generated End-to-End Fabric Topology */}
        {mesh?.mermaidCode && (
          <div className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
            <MermaidArchitectureDiagram code={mesh.mermaidCode} />
          </div>
        )}
      </div>

      {/* Interactive 4-Bridge Synthesizer Wired to Live Discovered Assets */}
      <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#10141d] space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {FABRIC_BRIDGES.map((b) => {
            const active = activeBridgeId === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setActiveBridgeId(b.id)}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  active
                    ? 'border-amber-500 bg-amber-500/15 text-amber-900 dark:text-amber-100'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 text-zinc-700 dark:text-zinc-300 hover:border-amber-500/40'
                }`}
              >
                <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold self-start bg-amber-500/20 text-amber-800 dark:text-amber-200">
                  {b.badge}
                </span>
                <div className="text-xs font-extrabold leading-snug">{b.title}</div>
                <div className="text-[10.5px] text-zinc-500 dark:text-zinc-400">{b.desc}</div>
              </button>
            );
          })}
        </div>

        {/* Live Asset Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
          <div>
            <label className="block text-[10.5px] font-mono text-zinc-500 mb-1">GCS Bronze Bucket</label>
            <input
              type="text"
              value={selectedBucket}
              onChange={(e) => setSelectedBucket(e.target.value)}
              placeholder="bronze-landing-bucket"
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 font-mono text-xs text-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="block text-[10.5px] font-mono text-zinc-500 mb-1">AlloyDB Cluster</label>
            <input
              type="text"
              value={selectedAlloy}
              onChange={(e) => setSelectedAlloy(e.target.value)}
              placeholder="alloydb-express-app"
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 font-mono text-xs text-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="block text-[10.5px] font-mono text-zinc-500 mb-1">BigQuery Dataset</label>
            <input
              type="text"
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value)}
              placeholder="gold_lakehouse_ai"
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 font-mono text-xs text-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="block text-[10.5px] font-mono text-zinc-500 mb-1">Target Region</label>
            <input
              type="text"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 font-mono text-xs text-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="block text-[10.5px] font-mono text-zinc-500 mb-1">Gemini 4 Model</label>
            <select
              value={geminiModel}
              onChange={(e) => setGeminiModel(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 font-mono text-xs text-zinc-900 dark:text-zinc-100"
            >
              <option value="gemini-4-neon">gemini-4-neon</option>
              <option value="gemini-4-hydrogen">gemini-4-hydrogen</option>
              <option value="gemini-4-carbon">gemini-4-carbon</option>
              <option value="gemini-4-argon">gemini-4-argon</option>
            </select>
          </div>
        </div>

        {/* Synthesized Runnable Bridge Artifact + 1-Click Cross-Studio Launchers */}
        {bridgeResult && (
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                  {bridgeResult.title}
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {bridgeResult.summary}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {bridgeResult.artifactLanguage === 'sql' && typeof onOpenBigQuerySql === 'function' && (
                  <button
                    type="button"
                    onClick={() => onOpenBigQuerySql(bridgeResult.code)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Execute in BigQuery Studio →
                  </button>
                )}
                {bridgeResult.artifactLanguage === 'bash' && typeof onRunInShell === 'function' && (
                  <button
                    type="button"
                    onClick={() => onRunInShell(bridgeResult.code)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    Run in Cloud Shell →
                  </button>
                )}
                {bridgeResult.primaryTargetTab && typeof onNavigateTab === 'function' && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab(bridgeResult.primaryTargetTab)}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-mono font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    Open {bridgeResult.primaryTargetTab.replace(/_STUDIO$/, '').replace(/_/g, ' ')}
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={copyCode}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-mono font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy
                </button>
                <button
                  type="button"
                  onClick={downloadCode}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-mono font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  {bridgeResult.filename}
                </button>
              </div>
            </div>
            <pre className="p-3.5 rounded-lg bg-zinc-950 text-emerald-300 font-mono text-[10.5px] max-h-80 overflow-auto whitespace-pre-wrap">
              {synthesizing ? '// Synthesizing cross-engine pipeline...' : bridgeResult.code}
            </pre>
          </div>
        )}
      </div>

      {/* Live End-to-End 4-Stage RAG Demo Loop: GCS -> BigQuery Gemini 4 -> AlloyDB Omni SCaNN -> Sub-5ms Semantic Search */}
      <div className="p-4 rounded-xl border border-amber-500/35 bg-white dark:bg-[#10141d] space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              <h4 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                Live End-to-End 4-Stage RAG Demo Loop (GCS → BigQuery Gemini 4 → AlloyDB Omni SCaNN)
              </h4>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              100% real execution: uploads a real Markdown doc to <strong>{selectedBucket || 'GCS'}</strong>, enriches &amp; embeds (768-d <code>text-embedding-005</code>) into <strong>{selectedDataset || 'BigQuery'}</strong>, builds a live <code>alloydb_scann</code> index in your local <strong>AlloyDB Omni</strong> container, and runs sub-5ms semantic search.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-1 rounded-md bg-amber-500/15 border border-amber-500/35 text-amber-800 dark:text-amber-200 text-[10.5px] font-mono font-bold">
              Model: {geminiModel} · 768-d SCaNN
            </span>
          </div>
        </div>

        {/* Source Document Editor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
          <div>
            <label className="block text-[10.5px] font-mono text-zinc-500 mb-1">
              GCS Object Filename (uploaded to <code>docs/</code>)
            </label>
            <input
              type="text"
              value={ragDocFilename}
              onChange={(e) => setRagDocFilename(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 font-mono text-xs text-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="block text-[10.5px] font-mono text-zinc-500 mb-1">
              Document Title
            </label>
            <input
              type="text"
              value={ragDocTitle}
              onChange={(e) => setRagDocTitle(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100"
            />
          </div>
        </div>
        <div>
          <label className="block text-[10.5px] font-mono text-zinc-500 mb-1">
            Document Content (Markdown / Architecture Brief)
          </label>
          <textarea
            rows={3}
            value={ragDocContent}
            onChange={(e) => setRagDocContent(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 font-mono text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* 3 Live Ingestion & Indexing Stages */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Stage 1: Upload GCS */}
          <div
            className={`p-3 rounded-xl border space-y-2.5 ${
              ragStage1?.ok
                ? 'border-emerald-500/40 bg-emerald-500/[0.06]'
                : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <UploadCloud className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                Stage 1 · Upload to GCS
              </span>
              {ragStage1?.ok && (
                <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {ragStage1.durationMs}ms
                </span>
              )}
            </div>
            <button
              type="button"
              disabled={Boolean(ragRunningStage) || !selectedBucket}
              onClick={runRagStage1Upload}
              className="w-full px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {ragRunningStage === 'UPLOAD_GCS_DOC' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <UploadCloud className="w-3.5 h-3.5" />
              )}
              <span>
                {ragRunningStage === 'UPLOAD_GCS_DOC'
                  ? 'Uploading to GCS...'
                  : '1. Upload Doc to GCS'}
              </span>
            </button>
            {ragStage1?.ok && (
              <div className="text-[10.5px] font-mono text-emerald-700 dark:text-emerald-300 break-all space-y-0.5">
                <div>{ragStage1.gcsUri}</div>
                <div className="text-zinc-500">{ragStage1.sizeBytes} bytes · gen {ragStage1.generation}</div>
              </div>
            )}
          </div>

          {/* Stage 2: BigQuery + Gemini 4 + 768-d Embed */}
          <div
            className={`p-3 rounded-xl border space-y-2.5 ${
              ragStage2?.ok
                ? 'border-emerald-500/40 bg-emerald-500/[0.06]'
                : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                Stage 2 · BQ + Gemini 4 Embed
              </span>
              {ragStage2?.ok && (
                <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {ragStage2.durationMs}ms
                </span>
              )}
            </div>
            <button
              type="button"
              disabled={Boolean(ragRunningStage) || !selectedDataset}
              onClick={() => runRagStage2BqGemini()}
              className="w-full px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {ragRunningStage === 'RUN_BQ_GEMINI4' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>
                {ragRunningStage === 'RUN_BQ_GEMINI4'
                  ? 'Enriching & Embedding...'
                  : '2. Enrich & Persist in BQ'}
              </span>
            </button>
            {ragStage2?.ok && (
              <div className="text-[10.5px] font-mono text-emerald-700 dark:text-emerald-300 space-y-1">
                <div className="truncate" title={ragStage2.bigqueryTable}>
                  Table: {ragStage2.bigqueryTable.split('.').slice(-2).join('.')}
                </div>
                <div className="text-zinc-600 dark:text-zinc-300 font-sans line-clamp-2">
                  {ragStage2.summary}
                </div>
                <div className="text-zinc-500">{ragStage2.embeddingDims}-d vector ready</div>
              </div>
            )}
          </div>

          {/* Stage 3: Load into AlloyDB Omni SCaNN */}
          <div
            className={`p-3 rounded-xl border space-y-2.5 ${
              ragStage3?.ok
                ? 'border-emerald-500/40 bg-emerald-500/[0.06]'
                : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                Stage 3 · AlloyDB SCaNN Index
              </span>
              {ragStage3?.ok && (
                <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {ragStage3.durationMs}ms
                </span>
              )}
            </div>
            <button
              type="button"
              disabled={Boolean(ragRunningStage) || !ragStage2?.embedding}
              onClick={() => runRagStage3LoadScann()}
              className="w-full px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {ragRunningStage === 'LOAD_ALLOYDB_SCANN' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Database className="w-3.5 h-3.5" />
              )}
              <span>
                {ragRunningStage === 'LOAD_ALLOYDB_SCANN'
                  ? 'Indexing in SCaNN...'
                  : '3. Load AlloyDB SCaNN'}
              </span>
            </button>
            {ragStage3?.ok && (
              <div className="text-[10.5px] font-mono text-emerald-700 dark:text-emerald-300 space-y-0.5">
                <div>{ragStage3.indexName} ({ragStage3.indexMethod})</div>
                <div className="text-zinc-500">
                  {ragStage3.totalDocsIndexed} doc(s) indexed · {ragStage3.container}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stage 4: Sub-5ms Live SCaNN Semantic Search + Gemini 4 Grounded Answer */}
        <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/70 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              Stage 4 · Live Sub-5ms AlloyDB Omni SCaNN Semantic Search + Gemini 4 Grounded RAG
            </span>
            {ragSearchResult?.pgExecutionMs !== null && ragSearchResult?.pgExecutionMs !== undefined && (
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/35 text-emerald-700 dark:text-emerald-300 text-[11px] font-mono font-extrabold">
                PostgreSQL SCaNN Execution: {Number(ragSearchResult.pgExecutionMs).toFixed(2)} ms
              </span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={ragSearchQuery}
              onChange={(e) => setRagSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') runRagStage4Search();
              }}
              placeholder="Ask any natural-language question against your AlloyDB SCaNN index..."
              className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
            />
            <button
              type="button"
              disabled={Boolean(ragRunningStage) || !ragSearchQuery.trim()}
              onClick={runRagStage4Search}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              {ragRunningStage === 'QUERY_SCANN_RAG' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Search className="w-3.5 h-3.5" />
              )}
              <span>
                {ragRunningStage === 'QUERY_SCANN_RAG' ? 'Querying SCaNN...' : '4. Query AlloyDB SCaNN'}
              </span>
            </button>
          </div>

          {ragSearchResult && (
            <div className="space-y-2.5 pt-1">
              {ragSearchResult.groundedAnswer && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/35 space-y-1">
                  <div className="text-[10.5px] font-mono font-bold uppercase text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>Gemini 4 Grounded RAG Answer ({ragSearchResult.modelUsed})</span>
                  </div>
                  <div className="text-xs text-zinc-900 dark:text-zinc-100 leading-relaxed whitespace-pre-wrap">
                    {ragSearchResult.groundedAnswer}
                  </div>
                </div>
              )}

              {Array.isArray(ragSearchResult.matches) && ragSearchResult.matches.length > 0 ? (
                <div className="space-y-1.5">
                  <div className="text-[10.5px] font-mono font-bold text-zinc-500">
                    Top-{ragSearchResult.matches.length} Live AlloyDB SCaNN Matches ({ragSearchResult.dsnMasked})
                  </div>
                  {ragSearchResult.matches.map((m, idx) => (
                    <div
                      key={`${m.docUri}-${idx}`}
                      className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">{m.title}</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono text-[10.5px] font-bold">
                          Cosine: {Number(m.cosineSimilarity || 0).toFixed(4)}
                        </span>
                      </div>
                      <div className="font-mono text-[10.5px] text-amber-700 dark:text-amber-300 break-all">
                        {m.docUri}
                      </div>
                      <div className="text-[11px] text-zinc-600 dark:text-zinc-300">{m.summary}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs font-mono text-zinc-500">
                  No documents indexed in <code>public.cloudpulse_rag_docs</code> yet — run Stages 1 → 3 above first.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
