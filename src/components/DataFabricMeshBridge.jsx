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
    </div>
  );
}
