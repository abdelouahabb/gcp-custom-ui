import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Database,
  ShieldCheck,
  FileSearch,
  Lock,
  RefreshCw,
  Play,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  PackageCheck,
  Terminal,
  Globe,
} from 'lucide-react';

const WAVE15_TABS = [
  {
    id: 'BQ_VECTOR_ANOMALY',
    step: '01',
    title: 'BigQuery Vector & Anomaly SQL',
    subtitle: 'Live Z-Score & Cosine Similarity CTE',
    icon: Database,
  },
  {
    id: 'SLSA_SUPPLY_CHAIN',
    step: '02',
    title: 'SLSA v1.0 Provenance Attestor',
    subtitle: 'Cloud Build + Artifact Digests + DSSE',
    icon: PackageCheck,
  },
  {
    id: 'LOGGING_CORRELATOR',
    step: '03',
    title: 'Cloud Logging Root-Cause Analyzer (RCA)',
    subtitle: 'Live entries:list + Gemini 3.8 Flash RCA',
    icon: FileSearch,
  },
  {
    id: 'TLS_X509_INSPECTOR',
    step: '04',
    title: 'Live TLS 1.3 X.509 Inspector',
    subtitle: 'Real Socket Handshake, SANs & Expiry',
    icon: Lock,
  },
];

function renderInlineMarkdown(text, copyFn) {
  if (!text) return null;
  const parts = String(text).split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-bold text-zinc-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      const codeTxt = part.slice(1, -1);
      return (
        <code
          key={idx}
          onClick={() => copyFn && copyFn(codeTxt)}
          title="Click to copy"
          className="px-1.5 py-0.5 mx-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800 text-cyan-700 dark:text-cyan-300 font-mono text-[11px] cursor-pointer hover:bg-cyan-500/20"
        >
          {codeTxt}
        </code>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

function FormattedMarkdown({ text, onCopy }) {
  if (!text) return null;
  const raw = String(text);
  const segments = raw.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
      {segments.map((seg, sIdx) => {
        if (seg.startsWith('```') && seg.endsWith('```')) {
          const lines = seg.slice(3, -3).trim().split('\n');
          const firstLine = lines[0]?.trim() || '';
          const hasLang = /^[a-zA-Z0-9_-]+$/.test(firstLine);
          const lang = hasLang ? firstLine : 'bash';
          const codeBody = hasLang ? lines.slice(1).join('\n') : lines.join('\n');
          return (
            <div
              key={`code-${sIdx}`}
              className="rounded-xl overflow-hidden border border-zinc-300 dark:border-zinc-800 bg-zinc-950 text-zinc-100 my-2"
            >
              <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 text-[10px] font-mono text-zinc-400">
                <span className="uppercase">{lang}</span>
                <button
                  type="button"
                  onClick={() => onCopy && onCopy(codeBody)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>
              <pre className="p-3 overflow-x-auto font-mono text-[11px] leading-relaxed text-emerald-300">
                <code>{codeBody}</code>
              </pre>
            </div>
          );
        }

        const lines = seg.split('\n');
        const blocks = [];
        let tableBuffer = [];

        const flushTable = (keyPrefix) => {
          if (tableBuffer.length === 0) return;
          const rows = tableBuffer
            .map((r) =>
              r
                .trim()
                .replace(/^\|/, '')
                .replace(/\|$/, '')
                .split('|')
                .map((c) => c.trim())
            )
            .filter((r) => r.length > 0 && !r.every((c) => /^[-:]+$/.test(c)));
          if (rows.length > 0) {
            const header = rows[0];
            const body = rows.slice(1);
            blocks.push(
              <div
                key={`tbl-${keyPrefix}`}
                className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 my-2"
              >
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                      {header.map((h, hIdx) => (
                        <th
                          key={hIdx}
                          className="px-3 py-2 font-mono font-bold text-zinc-800 dark:text-zinc-200"
                        >
                          {renderInlineMarkdown(h, onCopy)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/70">
                    {body.map((r, rIdx) => (
                      <tr
                        key={rIdx}
                        className="bg-white dark:bg-zinc-950/60 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                      >
                        {r.map((c, cIdx) => (
                          <td
                            key={cIdx}
                            className="px-3 py-2 text-zinc-700 dark:text-zinc-300"
                          >
                            {renderInlineMarkdown(c, onCopy)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
          tableBuffer = [];
        };

        lines.forEach((line, lIdx) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            tableBuffer.push(trimmed);
            return;
          }
          flushTable(`${sIdx}-${lIdx}`);
          if (!trimmed) return;
          if (trimmed.startsWith('### ')) {
            blocks.push(
              <h4
                key={`h3-${sIdx}-${lIdx}`}
                className="text-xs font-extrabold uppercase tracking-wider text-cyan-700 dark:text-cyan-300 pt-2"
              >
                {renderInlineMarkdown(trimmed.slice(4), onCopy)}
              </h4>
            );
          } else if (trimmed.startsWith('## ')) {
            blocks.push(
              <h3
                key={`h2-${sIdx}-${lIdx}`}
                className="text-sm font-extrabold text-zinc-900 dark:text-white pt-2"
              >
                {renderInlineMarkdown(trimmed.slice(3), onCopy)}
              </h3>
            );
          } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            blocks.push(
              <div
                key={`li-${sIdx}-${lIdx}`}
                className="flex items-start gap-2 pl-2"
              >
                <span className="text-cyan-500 font-bold mt-0.5">·</span>
                <div className="flex-1">
                  {renderInlineMarkdown(trimmed.slice(2), onCopy)}
                </div>
              </div>
            );
          } else {
            blocks.push(
              <p key={`p-${sIdx}-${lIdx}`}>
                {renderInlineMarkdown(trimmed, onCopy)}
              </p>
            );
          }
        });
        flushTable(`${sIdx}-end`);

        return (
          <div key={`seg-${sIdx}`} className="space-y-2">
            {blocks}
          </div>
        );
      })}
    </div>
  );
}

export default function Wave15DysonSupplyLoggingTlsStudio({
  projectId,
  onShowToast,
}) {
  const [activeTab, setActiveTab] = useState('BQ_VECTOR_ANOMALY');

  // Module 01: Live BigQuery Vector & Statistical Z-Score Anomaly SQL Engine
  const [availableTables, setAvailableTables] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState('');
  const [selectedTable, setSelectedTable] = useState('');
  const [semanticQuery, setSemanticQuery] = useState(
    'orbital failover latency telemetry'
  );
  const [zScoreThreshold, setZScoreThreshold] = useState(0.8);
  const [bqResult, setBqResult] = useState(null);
  const [runningBq, setRunningBq] = useState(false);

  // Module 02: Live Cloud Build & Artifact Registry SLSA v1.0 Provenance Verifier
  const [supplyData, setSupplyData] = useState(null);
  const [loadingSupply, setLoadingSupply] = useState(false);
  const [subjectName, setSubjectName] = useState('');
  const [sha256Digest, setSha256Digest] = useState('');
  const [buildId, setBuildId] = useState('');
  const [uploadBucket, setUploadBucket] = useState('');
  const [slsaAttestation, setSlsaAttestation] = useState(null);
  const [signingSlsa, setSigningSlsa] = useState(false);

  // Module 03: Live Cloud Logging Root-Cause Correlator + Gemini 3.8 Flash Surgeon
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [resourceTypeFilter, setResourceTypeFilter] = useState('ALL');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [hoursBack, setHoursBack] = useState(24);
  const [logData, setLogData] = useState(null);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logAiReport, setLogAiReport] = useState(null);
  const [runningLogAi, setRunningLogAi] = useState(false);

  // Module 04: Live TLS 1.3 X.509 Certificate & Cipher Suite Inspector
  const [customHost, setCustomHost] = useState('');
  const [tlsData, setTlsData] = useState(null);
  const [runningTls, setRunningTls] = useState(false);

  const notify = useCallback(
    (msg) => {
      if (onShowToast) onShowToast(msg);
    },
    [onShowToast]
  );

  const copyText = useCallback(
    (txt) => {
      navigator.clipboard?.writeText(String(txt || ''));
      notify('Copied to clipboard');
    },
    [notify]
  );

  // Read-only discovery of existing BigQuery tables
  const fetchDiscoveredTables = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/wave14/time-travel-tables`
      );
      const list = res.data?.tables || [];
      setAvailableTables(list);
      if (list.length > 0) {
        setSelectedDataset((prev) => prev || list[0].datasetId);
        setSelectedTable((prev) => prev || list[0].tableId);
      }
    } catch {
      // ignore discovery notice
    }
  }, [projectId]);

  const handleRunBqAnomalyVector = async (e) => {
    if (e) e.preventDefault();
    if (!projectId) return;
    if (!selectedDataset || !selectedTable) {
      notify('Please select an existing BigQuery Dataset and Table first.');
      return;
    }
    setRunningBq(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave15/bigquery-anomaly-vector`,
        {
          datasetId: selectedDataset,
          tableId: selectedTable,
          semanticQuery,
          zScoreThreshold: Number(zScoreThreshold) || 0.8,
        }
      );
      setBqResult(res.data);
      notify(
        `BigQuery Z-Score & Cosine Vector SQL evaluated ${res.data?.stats?.rowsEvaluated || 0} rows (${res.data?.stats?.anomalyCount || 0} anomalies) in ${res.data?.latencyMs}ms!`
      );
    } catch (err) {
      notify(
        `BigQuery SQL error: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setRunningBq(false);
    }
  };

  const fetchSupplyChainProvenance = useCallback(async () => {
    if (!projectId) return;
    setLoadingSupply(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/wave15/supply-chain-provenance`
      );
      setSupplyData(res.data);
      const firstImg = res.data?.artifactImages?.[0];
      const firstBuild = res.data?.builds?.[0];
      if (firstImg) {
        setSubjectName((prev) => prev || firstImg.uri.split('@')[0]);
        setSha256Digest((prev) => prev || firstImg.sha256Digest || '');
      }
      if (firstBuild) {
        setBuildId((prev) => prev || firstBuild.id || '');
      }
    } catch (err) {
      notify(
        `Supply-chain inspection notice: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setLoadingSupply(false);
    }
  }, [projectId, notify]);

  const handleSignSlsaAttestation = async (e) => {
    if (e) e.preventDefault();
    if (!projectId) return;
    setSigningSlsa(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave15/attest-slsa-provenance`,
        {
          subjectName,
          sha256Digest,
          buildId,
          uploadToBucket: uploadBucket,
        }
      );
      setSlsaAttestation(res.data);
      notify(
        `Signed SLSA v1.0 In-Toto DSSE Attestation (sha256:${res.data?.statementSha256?.slice(0, 12)}...)${
          res.data?.gcsObjectUri ? ` & uploaded to ${res.data.gcsObjectUri}` : ''
        }!`
      );
    } catch (err) {
      if (err?.message && err.message.includes('cancelled')) return;
      notify(
        `SLSA attestation error: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setSigningSlsa(false);
    }
  };

  const fetchCloudLogs = useCallback(async () => {
    if (!projectId) return;
    setLoadingLogs(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave15/logging-correlator`,
        {
          severityFilter,
          resourceTypeFilter,
          searchQuery: logSearchQuery,
          hoursBack: Number(hoursBack) || 24,
          pageSize: 40,
        }
      );
      setLogData(res.data);
    } catch (err) {
      notify(
        `Cloud Logging query notice: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setLoadingLogs(false);
    }
  }, [
    projectId,
    severityFilter,
    resourceTypeFilter,
    logSearchQuery,
    hoursBack,
    notify,
  ]);

  const handleRunLogAiSurgeon = async () => {
    if (!projectId) return;
    setRunningLogAi(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave15/logging-ai-surgeon`,
        {
          entries: logData?.entries || [],
          filterExecuted: logData?.filterExecuted || '',
        }
      );
      setLogAiReport(res.data);
      notify(
        `Generated live Gemini 3.8 Flash Root-Cause & Remediation Report (${res.data?.latencyMs}ms)!`
      );
    } catch (err) {
      notify(
        `Gemini Log Surgeon notice: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setRunningLogAi(false);
    }
  };

  const handleInspectTlsEndpoints = useCallback(async () => {
    if (!projectId) return;
    setRunningTls(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave15/tls-x509-inspector`,
        {
          customHost,
        }
      );
      setTlsData(res.data);
    } catch (err) {
      notify(
        `TLS X.509 inspection error: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setRunningTls(false);
    }
  }, [projectId, customHost, notify]);

  // Strictly read-only discovery on mount — zero resource creation!
  useEffect(() => {
    fetchDiscoveredTables();
    fetchSupplyChainProvenance();
    fetchCloudLogs();
    handleInspectTlsEndpoints();
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="p-5 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-indigo-500/5 to-emerald-500/10 dark:from-cyan-950/40 dark:via-zinc-900 dark:to-emerald-950/40">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/40">
                SUPPLY-CHAIN &amp; OBSERVABILITY · VECTOR SQL, SLSA v1.0 PROVENANCE, LOG RCA &amp; TLS 1.3 X.509
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                100% LIVE GCP REST &amp; SOCKET CRYPTO · ZERO AUTO-PROVISIONING
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              BigQuery Statistical/Vector Anomaly SQL, SLSA v1.0 Supply-Chain Attestor, Cloud Logging Root-Cause Analyzer &amp; Live TLS 1.3 X.509 Inspector
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 max-w-4xl">
              Execute real BigQuery Standard SQL CTEs computing statistical Z-scores and token cosine similarity on your live tables, inspect Cloud Build &amp; Artifact Registry container SHA-256 digests to sign Ed25519 DSSE SLSA v1.0 provenance statements, correlate live <code>logging.googleapis.com/v2/entries:list</code> streams with Gemini 3.8 Flash, and perform real TCP/TLS 1.3 X.509 certificate handshakes.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 shrink-0">
            <div className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 text-center">
              <div className="text-[10px] font-mono uppercase text-zinc-400">
                Artifact Digests
              </div>
              <div className="text-sm font-mono font-extrabold text-cyan-600 dark:text-cyan-400">
                {supplyData
                  ? `${supplyData.summary?.totalArtifactImages || 0} Images`
                  : 'Scanning...'}
              </div>
            </div>
            <div className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 text-center">
              <div className="text-[10px] font-mono uppercase text-zinc-400">
                Live Log Stream
              </div>
              <div className="text-sm font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
                {logData ? `${logData.totalEntries} Entries` : 'Querying...'}
              </div>
            </div>
            <div className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 text-center">
              <div className="text-[10px] font-mono uppercase text-zinc-400">
                TLS 1.3 Endpoints
              </div>
              <div className="text-sm font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                {tlsData
                  ? `${tlsData.tls13Count}/${tlsData.totalInspected} TLSv1.3`
                  : 'Probing...'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Column Bento Sub-Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {WAVE15_TABS.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                active
                  ? 'bg-cyan-600 text-white border-cyan-500 shadow-lg shadow-cyan-500/20'
                  : 'bg-white dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:border-cyan-500/40'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span
                  className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-md ${
                    active
                      ? 'bg-black/25 text-cyan-100'
                      : 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300'
                  }`}
                >
                  MODULE {t.step}
                </span>
                <Icon className="w-4 h-4 shrink-0" />
              </div>
              <div>
                <div className="text-xs font-extrabold truncate">{t.title}</div>
                <div
                  className={`text-[10px] truncate ${
                    active
                      ? 'text-cyan-100/90'
                      : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  {t.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* =================================================================== */}
      {/* MODULE 01: BIGQUERY VECTOR & STATISTICAL Z-SCORE ANOMALY SQL ENGINE */}
      {/* =================================================================== */}
      {activeTab === 'BQ_VECTOR_ANOMALY' && (
        <div className="space-y-5">
          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-500" />
                  <span>
                    Live BigQuery Statistical Z-Score Anomaly &amp; Cosine Vector Similarity SQL Engine
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Dynamically inspects your existing BigQuery table schema via <code>bigquery.googleapis.com</code> and executes a live Standard SQL CTE computing <code>AVG()</code>, <code>STDDEV_SAMP()</code>, per-row <code>_z_score</code>, and normalized token <code>_cosine_similarity</code>. Strictly read-only — zero datasets or tables are auto-created.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRunBqAnomalyVector}
                disabled={runningBq || !selectedDataset || !selectedTable}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-mono font-extrabold cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm"
              >
                <Play className="w-3.5 h-3.5" />
                <span>
                  {runningBq
                    ? 'Running Live BigQuery Vector CTE...'
                    : 'Run Live Z-Score & Cosine Vector SQL'}
                </span>
              </button>
            </div>

            {availableTables.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono font-bold uppercase text-zinc-400">
                  Existing BigQuery Tables in {projectId} (Click to Target)
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {availableTables.map((t) => {
                    const isSelected =
                      selectedDataset === t.datasetId &&
                      selectedTable === t.tableId;
                    return (
                      <button
                        key={t.fullTableId}
                        type="button"
                        onClick={() => {
                          setSelectedDataset(t.datasetId);
                          setSelectedTable(t.tableId);
                        }}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-cyan-600 text-white border-cyan-500 font-bold'
                            : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-cyan-500/40'
                        }`}
                      >
                        {t.datasetId}.{t.tableId} ({t.location})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <form
              onSubmit={handleRunBqAnomalyVector}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
            >
              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                  BigQuery Dataset ID
                </label>
                <input
                  type="text"
                  value={selectedDataset}
                  onChange={(e) => setSelectedDataset(e.target.value)}
                  placeholder="flying_car_telemetry_lakehouse"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-mono text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                  BigQuery Table ID
                </label>
                <input
                  type="text"
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  placeholder="flying_car_telemetry_events"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-mono text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                  Semantic Vector Search Tokens
                </label>
                <input
                  type="text"
                  value={semanticQuery}
                  onChange={(e) => setSemanticQuery(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                  Anomaly |Z-Score| Threshold (σ)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="5.0"
                  value={zScoreThreshold}
                  onChange={(e) => setZScoreThreshold(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-mono text-zinc-900 dark:text-white"
                />
              </div>
            </form>

            {bqResult && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                    <div className="text-[10px] font-mono uppercase text-zinc-400">
                      Evaluated Column
                    </div>
                    <div className="text-xs font-mono font-extrabold text-cyan-600 dark:text-cyan-400 truncate">
                      {bqResult.metricColumn}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                    <div className="text-[10px] font-mono uppercase text-zinc-400">
                      Sample Mean (μ)
                    </div>
                    <div className="text-sm font-mono font-extrabold text-zinc-900 dark:text-white">
                      {bqResult.stats?.mean}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                    <div className="text-[10px] font-mono uppercase text-zinc-400">
                      StdDev (σ)
                    </div>
                    <div className="text-sm font-mono font-extrabold text-zinc-900 dark:text-white">
                      {bqResult.stats?.stddev}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10">
                    <div className="text-[10px] font-mono uppercase text-amber-700 dark:text-amber-300">
                      Anomalies (|Z| ≥ {bqResult.zScoreThreshold})
                    </div>
                    <div className="text-sm font-mono font-extrabold text-amber-600 dark:text-amber-400">
                      {bqResult.stats?.anomalyCount} / {bqResult.stats?.rowsEvaluated}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                    <div className="text-[10px] font-mono uppercase text-zinc-400">
                      BQ Job Latency
                    </div>
                    <div className="text-sm font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                      {bqResult.latencyMs} ms
                    </div>
                  </div>
                </div>

                {/* Executed SQL CTE */}
                <div className="p-3.5 rounded-xl bg-zinc-950 text-zinc-100 border border-zinc-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                    <span>
                      EXECUTED BIGQUERY STANDARD SQL CTE (JOB ID: {bqResult.jobId || 'live'})
                    </span>
                    <button
                      type="button"
                      onClick={() => copyText(bqResult.executedSql)}
                      className="text-cyan-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy SQL</span>
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                    <code>{bqResult.executedSql}</code>
                  </pre>
                </div>

                {/* Scored Rows Table */}
                <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-100 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-mono uppercase text-zinc-500">
                        <th className="py-2.5 px-3">Verdict</th>
                        <th className="py-2.5 px-3">Z-Score (σ)</th>
                        <th className="py-2.5 px-3">Cosine Similarity</th>
                        <th className="py-2.5 px-3">Metric ({bqResult.metricColumn})</th>
                        <th className="py-2.5 px-3">Corpus Text / Row Payload</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono text-[11px]">
                      {(bqResult.rows || []).map((r, idx) => {
                        const isAnomaly = r._anomaly_verdict === 'ANOMALY_DETECTED';
                        return (
                          <tr
                            key={idx}
                            className={
                              isAnomaly
                                ? 'bg-amber-500/5 hover:bg-amber-500/10'
                                : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                            }
                          >
                            <td className="py-2 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isAnomaly
                                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                                    : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                }`}
                              >
                                {r._anomaly_verdict}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-bold text-zinc-900 dark:text-white">
                              {r._z_score}σ
                            </td>
                            <td className="py-2 px-3 text-cyan-600 dark:text-cyan-400 font-bold">
                              {r._cosine_similarity}
                            </td>
                            <td className="py-2 px-3 text-zinc-700 dark:text-zinc-300">
                              {r._metric_val}
                            </td>
                            <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400 max-w-md truncate">
                              {r.corpus_text}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODULE 02: SLSA v1.0 SUPPLY-CHAIN PROVENANCE & ARTIFACT DIGESTS     */}
      {/* =================================================================== */}
      {activeTab === 'SLSA_SUPPLY_CHAIN' && (
        <div className="space-y-5">
          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-emerald-500" />
                  <span>
                    Live Cloud Build, Artifact Registry SHA-256 Digests &amp; SLSA v1.0 DSSE Provenance Attestor
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Queries <code>cloudbuild.googleapis.com</code>, <code>artifactregistry.googleapis.com</code>, and <code>run.googleapis.com</code> to correlate deployed container images with immutable <code>@sha256</code> digests and sign an Ed25519 Dead Simple Signing Envelope (DSSE) SLSA v1.0 In-Toto attestation.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchSupplyChainProvenance}
                disabled={loadingSupply}
                className="px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loadingSupply ? 'animate-spin' : ''}`}
                />
                <span>Refresh Live Supply Chain</span>
              </button>
            </div>

            {supplyData && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                    <div className="text-[10px] font-mono uppercase text-zinc-400">
                      Cloud Build Runs
                    </div>
                    <div className="text-sm font-mono font-extrabold text-zinc-900 dark:text-white">
                      {supplyData.summary?.successfulBuilds} /{' '}
                      {supplyData.summary?.totalCloudBuilds} SUCCESS
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                    <div className="text-[10px] font-mono uppercase text-zinc-400">
                      Artifact Repositories
                    </div>
                    <div className="text-sm font-mono font-extrabold text-cyan-600 dark:text-cyan-400">
                      {supplyData.summary?.totalRepositories} Repos
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                    <div className="text-[10px] font-mono uppercase text-zinc-400">
                      Container Images
                    </div>
                    <div className="text-sm font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                      {supplyData.summary?.totalArtifactImages} Verified Digests
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                    <div className="text-[10px] font-mono uppercase text-zinc-400">
                      Active Cloud Run Services
                    </div>
                    <div className="text-sm font-mono font-extrabold text-violet-600 dark:text-violet-400">
                      {supplyData.summary?.totalCloudRunServices} Live
                    </div>
                  </div>
                </div>

                {/* Artifact Registry Container Digests Table */}
                {supplyData.artifactImages?.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-mono font-bold uppercase text-zinc-500">
                      Live Artifact Registry Docker Images (Click any row to load into SLSA v1.0 Signer)
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 max-h-60">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-zinc-100 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-mono uppercase text-zinc-500">
                            <th className="py-2 px-3">Repository</th>
                            <th className="py-2 px-3">Image</th>
                            <th className="py-2 px-3">Immutable SHA-256 Digest</th>
                            <th className="py-2 px-3">Size</th>
                            <th className="py-2 px-3 text-right">Select</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono text-[11px]">
                          {supplyData.artifactImages.map((img, i) => (
                            <tr
                              key={i}
                              onClick={() => {
                                setSubjectName(img.uri.split('@')[0]);
                                setSha256Digest(img.sha256Digest || '');
                              }}
                              className="hover:bg-cyan-500/5 cursor-pointer"
                            >
                              <td className="py-2 px-3 font-bold text-zinc-800 dark:text-zinc-200">
                                {img.repository} ({img.location})
                              </td>
                              <td className="py-2 px-3 text-cyan-600 dark:text-cyan-400 truncate max-w-xs">
                                {img.shortImageName}
                              </td>
                              <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">
                                {img.sha256Digest
                                  ? `sha256:${img.sha256Digest.slice(0, 20)}...`
                                  : 'N/A'}
                              </td>
                              <td className="py-2 px-3 text-zinc-500">
                                {(img.imageSizeBytes / (1024 * 1024)).toFixed(1)} MB
                              </td>
                              <td className="py-2 px-3 text-right">
                                <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 text-[10px] font-bold">
                                  Load Digest
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SLSA v1.0 DSSE Attestation Form */}
                <form
                  onSubmit={handleSignSlsaAttestation}
                  className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="text-xs font-extrabold text-zinc-900 dark:text-white">
                      Cryptographic SLSA v1.0 In-Toto DSSE Attestation Signer (Ed25519)
                    </div>
                    <button
                      type="button"
                      onClick={handleSignSlsaAttestation}
                      disabled={signingSlsa}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-mono font-extrabold cursor-pointer flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>
                        {signingSlsa
                          ? 'Signing SLSA v1.0 Statement...'
                          : 'Sign Live SLSA v1.0 DSSE Provenance'}
                      </span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase text-zinc-500 mb-1">
                        Container Subject URI
                      </label>
                      <input
                        type="text"
                        value={subjectName}
                        onChange={(e) => setSubjectName(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-mono text-zinc-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase text-zinc-500 mb-1">
                        Artifact SHA-256 Digest
                      </label>
                      <input
                        type="text"
                        value={sha256Digest}
                        onChange={(e) => setSha256Digest(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-mono text-zinc-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase text-zinc-500 mb-1">
                        Cloud Build Invocation ID
                      </label>
                      <input
                        type="text"
                        value={buildId}
                        onChange={(e) => setBuildId(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-mono text-zinc-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase text-zinc-500 mb-1">
                        Optional GCS Bucket Upload
                      </label>
                      <input
                        type="text"
                        value={uploadBucket}
                        onChange={(e) => setUploadBucket(e.target.value)}
                        placeholder="Leave blank or enter existing bucket"
                        className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-mono text-zinc-900 dark:text-white"
                      />
                    </div>
                  </div>
                </form>

                {slsaAttestation && (
                  <div className="p-4 rounded-xl bg-zinc-950 text-zinc-100 border border-zinc-800 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                      <span className="text-emerald-400 font-bold">
                        VERIFIED ED25519 DSSE ENVELOPE · SHA-256: {slsaAttestation.statementSha256}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          copyText(
                            JSON.stringify(slsaAttestation.inTotoStatement, null, 2)
                          )
                        }
                        className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 cursor-pointer flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy SLSA v1.0 JSON</span>
                      </button>
                    </div>
                    {slsaAttestation.gcsObjectUri && (
                      <div className="text-xs font-mono text-cyan-300">
                        Persisted Live to GCS: {slsaAttestation.gcsObjectUri}
                      </div>
                    )}
                    <pre className="text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-64 leading-relaxed">
                      <code>
                        {JSON.stringify(slsaAttestation.inTotoStatement, null, 2)}
                      </code>
                    </pre>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODULE 03: LIVE CLOUD LOGGING ROOT-CAUSE CORRELATOR & AI SURGEON    */}
      {/* =================================================================== */}
      {activeTab === 'LOGGING_CORRELATOR' && (
        <div className="space-y-5">
          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <FileSearch className="w-4 h-4 text-indigo-500" />
                  <span>
                    Live Cloud Logging Root-Cause Correlator (<code>logging.googleapis.com/v2/entries:list</code>)
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Streams real project audit &amp; service logs directly from Google Cloud Logging, correlates severity &amp; resource bursts, and dispatches Vertex AI Gemini 3.8 Flash to synthesize a Root-Cause Analysis and copy-ready <code>gcloud logging</code> runbook.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={fetchCloudLogs}
                  disabled={loadingLogs}
                  className="px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`}
                  />
                  <span>Query Live Cloud Logs</span>
                </button>
                <button
                  type="button"
                  onClick={handleRunLogAiSurgeon}
                  disabled={runningLogAi || !logData?.entries?.length}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-mono font-extrabold cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {runningLogAi
                      ? 'Synthesizing Gemini 3.8 Flash RCA...'
                      : 'Run Gemini 3.8 Flash Root-Cause Surgeon'}
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                  Minimum Severity Filter
                </label>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-mono text-zinc-900 dark:text-white"
                >
                  <option value="ALL">ALL SEVERITIES</option>
                  <option value="INFO">INFO &amp; ABOVE</option>
                  <option value="NOTICE">NOTICE &amp; ABOVE</option>
                  <option value="WARNING">WARNING &amp; ABOVE</option>
                  <option value="ERROR">ERROR &amp; CRITICAL ONLY</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                  Resource Type Filter
                </label>
                <select
                  value={resourceTypeFilter}
                  onChange={(e) => setResourceTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-mono text-zinc-900 dark:text-white"
                >
                  <option value="ALL">ALL RESOURCE TYPES</option>
                  <option value="cloud_run_revision">cloud_run_revision</option>
                  <option value="bigquery_dataset">bigquery_dataset</option>
                  <option value="bigquery_resource">bigquery_resource</option>
                  <option value="gcs_bucket">gcs_bucket</option>
                  <option value="audited_resource">audited_resource</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                  Lookback Window (Hours)
                </label>
                <select
                  value={hoursBack}
                  onChange={(e) => setHoursBack(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-mono text-zinc-900 dark:text-white"
                >
                  <option value={1}>Last 1 Hour</option>
                  <option value={6}>Last 6 Hours</option>
                  <option value={24}>Last 24 Hours</option>
                  <option value={72}>Last 72 Hours</option>
                  <option value={168}>Last 7 Days</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                  Text / Method Search Filter
                </label>
                <input
                  type="text"
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  placeholder="Optional method or keyword..."
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-mono text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            {logAiReport && (
              <div className="p-4 rounded-2xl border border-indigo-500/40 bg-indigo-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-extrabold text-indigo-700 dark:text-indigo-300">
                    VERTEX AI ({logAiReport.modelUsed}) · ROOT-CAUSE &amp; REMEDIATION REPORT ({logAiReport.latencyMs}ms)
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText(logAiReport.analysisMarkdown)}
                    className="px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-700 dark:text-indigo-200 text-[11px] font-mono cursor-pointer flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Report</span>
                  </button>
                </div>
                <FormattedMarkdown
                  text={logAiReport.analysisMarkdown}
                  onCopy={copyText}
                />
              </div>
            )}

            {logData && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-zinc-500">
                  <span>
                    Filter: <code>{logData.filterExecuted}</code>
                  </span>
                  <span>
                    {logData.totalEntries} entries in {logData.latencyMs}ms
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 max-h-96">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-100 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-mono uppercase text-zinc-500">
                        <th className="py-2 px-3">Timestamp</th>
                        <th className="py-2 px-3">Severity</th>
                        <th className="py-2 px-3">Resource Type</th>
                        <th className="py-2 px-3">Correlated Message / ProtoPayload</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono text-[11px]">
                      {(logData.entries || []).map((e, idx) => {
                        const isErr =
                          e.severity === 'ERROR' || e.severity === 'CRITICAL';
                        const isWarn = e.severity === 'WARNING';
                        return (
                          <tr
                            key={e.insertId || idx}
                            className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                          >
                            <td className="py-2 px-3 text-zinc-500 whitespace-nowrap">
                              {e.timestamp
                                ? new Date(e.timestamp).toLocaleTimeString()
                                : '—'}
                            </td>
                            <td className="py-2 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isErr
                                    ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                                    : isWarn
                                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                                }`}
                              >
                                {e.severity}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-cyan-600 dark:text-cyan-400 whitespace-nowrap">
                              {e.resourceType}
                            </td>
                            <td className="py-2 px-3 text-zinc-700 dark:text-zinc-300 break-all">
                              {e.message}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODULE 04: LIVE TLS 1.3 X.509 CERTIFICATE & CIPHER SUITE INSPECTOR  */}
      {/* =================================================================== */}
      {activeTab === 'TLS_X509_INSPECTOR' && (
        <div className="space-y-5">
          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-500" />
                  <span>
                    Live TLS 1.3 X.509 Certificate Chain, Cipher Suite &amp; Expiration Inspector (Node <code>tls.connect</code>)
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Performs real TCP + TLS 1.3 socket handshakes against your live Cloud Run <code>.run.app</code> services and Google Cloud regional APIs, extracting the real X.509 leaf certificate SHA-256 fingerprint, Subject Alternative Names (SANs), negotiated AEAD cipher suite, ALPN protocol, and days remaining until expiration.
                </p>
              </div>
              <button
                type="button"
                onClick={handleInspectTlsEndpoints}
                disabled={runningTls}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-mono font-extrabold cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${runningTls ? 'animate-spin' : ''}`}
                />
                <span>
                  {runningTls
                    ? 'Executing Live TLS Handshakes...'
                    : 'Probe Live TLS 1.3 & X.509 Chains'}
                </span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={customHost}
                onChange={(e) => setCustomHost(e.target.value)}
                placeholder="Optional additional hostname(s) to probe (e.g., cloud.google.com, vertexai.googleapis.com)"
                className="flex-1 px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-mono text-zinc-900 dark:text-white"
              />
            </div>

            {tlsData && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {(tlsData.endpoints || []).map((ep) => (
                  <div
                    key={ep.host}
                    className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/70 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-cyan-500 shrink-0" />
                        <span className="text-xs font-mono font-extrabold text-zinc-900 dark:text-white">
                          {ep.host}
                        </span>
                      </div>
                      {ep.ok ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                          {ep.protocol} · {ep.alpnProtocol} · {ep.tlsHandshakeMs}ms
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300">
                          {ep.error}
                        </span>
                      )}
                    </div>

                    {ep.ok && (
                      <div className="space-y-1.5 text-[11px] font-mono text-zinc-600 dark:text-zinc-300">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">AEAD Cipher Suite:</span>
                          <span className="font-bold text-cyan-600 dark:text-cyan-400">
                            {ep.cipherStandardName || ep.cipherName}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">Subject CN / Issuer:</span>
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">
                            {ep.subjectCN} ({ep.issuerO} · {ep.issuerCN})
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">Validity / Expiry:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {ep.daysRemaining} Days Left (Until {ep.validTo})
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">Chain Depth / SANs:</span>
                          <span>
                            {ep.chainDepth} Certs · {ep.sanCount} SANs
                          </span>
                        </div>
                        <div className="pt-1 border-t border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-500 break-all">
                          SHA-256 Fingerprint: {ep.fingerprint256}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
