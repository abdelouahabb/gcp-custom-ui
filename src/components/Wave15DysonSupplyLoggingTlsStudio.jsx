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
  Download,
  ExternalLink,
  Zap,
} from 'lucide-react';
import ZeroSniffingWebCryptoEnclaveBar, {
  getSharedActiveModel,
  getSharedPreferredProvider,
} from './ZeroSniffingWebCryptoEnclaveBar';

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
    title: 'Cloud Logging Surgeon — Root-Cause Analyzer (RCA)',
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
          className="px-1.5 py-0.5 mx-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800 text-blue-700 dark:text-blue-300 font-mono text-[11px] cursor-pointer hover:bg-blue-500/20"
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
                className="text-xs font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-300 pt-2"
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
                <span className="text-blue-500 font-bold mt-0.5">·</span>
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
  onRunInShell,
  onSelectStudioTab,
  onOpenBigQuerySql,
  onShowToast,
}) {
  const [activeTab, setActiveTab] = useState('BQ_VECTOR_ANOMALY');

  // Module 01: Live BigQuery Vector & Statistical Z-Score Anomaly SQL Engine
  const [availableTables, setAvailableTables] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState('');
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedMetricColumn, setSelectedMetricColumn] = useState('');
  const [semanticQuery, setSemanticQuery] = useState(
    'orbital failover latency telemetry'
  );
  const [zScoreThreshold, setZScoreThreshold] = useState(0.8);
  const [bqResult, setBqResult] = useState(null);
  const [runningBq, setRunningBq] = useState(false);
  const [bqAiBrief, setBqAiBrief] = useState(null);
  const [runningBqAi, setRunningBqAi] = useState(false);

  // Module 02: Live Cloud Build & Artifact Registry SLSA v1.0 Provenance Verifier
  const [supplyData, setSupplyData] = useState(null);
  const [loadingSupply, setLoadingSupply] = useState(false);
  const [subjectName, setSubjectName] = useState('');
  const [sha256Digest, setSha256Digest] = useState('');
  const [buildId, setBuildId] = useState('');
  const [uploadBucket, setUploadBucket] = useState('');
  const [slsaAttestation, setSlsaAttestation] = useState(null);
  const [signingSlsa, setSigningSlsa] = useState(false);
  const [dsseVerifyResult, setDsseVerifyResult] = useState(null);
  const [verifyingDsse, setVerifyingDsse] = useState(false);

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
    (txt, label = 'Copied to clipboard') => {
      navigator.clipboard?.writeText(String(txt || ''));
      notify(label);
    },
    [notify]
  );

  const downloadFile = useCallback(
    (filename, content, mimeType = 'application/json') => {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      notify(`Downloaded ${filename}`);
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
          metricColumn: selectedMetricColumn,
          semanticQuery,
          zScoreThreshold: Number(zScoreThreshold) || 0.8,
        }
      );
      setBqResult(res.data);
      if (res.data?.metricColumn && !selectedMetricColumn) {
        setSelectedMetricColumn(res.data.metricColumn);
      }
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

  const handleRunBqAiBrief = async () => {
    if (!projectId || !bqResult) return;
    setRunningBqAi(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave15/bigquery-anomaly-ai-brief`,
        {
          datasetId: bqResult.datasetId,
          tableId: bqResult.tableId,
          metricColumn: bqResult.metricColumn,
          zScoreThreshold: bqResult.zScoreThreshold,
          stats: bqResult.stats,
          sampleRows: bqResult.rows || [],
          model: getSharedActiveModel(),
          preferredProvider: getSharedPreferredProvider(),
        }
      );
      setBqAiBrief(res.data);
      notify(
        `Synthesized live Gemini 3.8 Flash Anomaly Forensics Brief (${res.data?.latencyMs}ms)!`
      );
    } catch (err) {
      notify(
        `BigQuery AI Brief notice: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setRunningBqAi(false);
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
    setDsseVerifyResult(null);
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

  const handleVerifySlsaDsse = async () => {
    if (!projectId || !slsaAttestation?.dsseEnvelope) return;
    setVerifyingDsse(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave15/verify-slsa-dsse`,
        {
          dsseEnvelope: slsaAttestation.dsseEnvelope,
        }
      );
      setDsseVerifyResult(res.data);
      notify(res.data?.proofSummary || 'Verified Ed25519 DSSE signature & 1-byte tamper rejection!');
    } catch (err) {
      notify(
        `DSSE verification error: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setVerifyingDsse(false);
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
          model: getSharedActiveModel(),
          preferredProvider: getSharedPreferredProvider(),
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
      <div className="p-5 rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-emerald-500/10 dark:from-blue-950/40 dark:via-zinc-900 dark:to-emerald-950/40">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/40">
                SUPPLY-CHAIN SLSA &amp; LOG RCA STUDIO (VECTOR SQL, SLSA v1.0 PROVENANCE, LOG RCA &amp; TLS 1.3 X.509)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                100% LIVE GCP REST &amp; SOCKET CRYPTO · ZERO AUTO-PROVISIONING
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              Supply-Chain SLSA &amp; Log RCA Studio — BigQuery Vector/Anomaly SQL, SLSA v1.0 Supply-Chain Attestor, Cloud Logging Root-Cause Surgeon &amp; Live TLS 1.3 X.509 Inspector
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
              <div className="text-sm font-mono font-extrabold text-blue-600 dark:text-blue-400">
                {supplyData
                  ? `${supplyData.summary?.totalArtifactImages || 0} Images`
                  : 'Scanning...'}
              </div>
            </div>
            <div className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 text-center">
              <div className="text-[10px] font-mono uppercase text-zinc-400">
                Live Log Stream
              </div>
              <div className="text-sm font-mono font-extrabold text-blue-600 dark:text-blue-400">
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
              data-feature-id={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`p-3.5 rounded-md border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                active
                  ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                  : 'bg-white dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:border-blue-500/40'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span
                  className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full ${
                    active
                      ? 'bg-black/25 text-blue-100'
                      : 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                  }`}
                >
                  MODULE
                </span>
                <Icon className="w-4 h-4 shrink-0" />
              </div>
              <div>
                <div className="text-xs font-extrabold truncate">{t.title}</div>
                <div
                  className={`text-[10px] truncate ${
                    active
                      ? 'text-blue-100/90'
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
                  <Database className="w-4 h-4 text-blue-500" />
                  <span>
                    Live BigQuery Statistical Z-Score, IQR Quantile &amp; Cosine Vector Similarity SQL Engine
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Dynamically inspects your existing BigQuery table schema via <code>bigquery.googleapis.com</code> and executes a live Standard SQL CTE computing <code>AVG()</code>, <code>STDDEV_SAMP()</code>, <code>APPROX_QUANTILES()</code> (Q1, Median Q2, Q3, IQR), per-row <code>_z_score</code>, and normalized token <code>_cosine_similarity</code>. Strictly read-only — zero datasets or tables are auto-created.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {onSelectStudioTab && (
                  <button
                    type="button"
                    onClick={() => onSelectStudioTab('BIGQUERY_STUDIO', 'TABLES_SQL')}
                    className="px-3 py-2 rounded-md border border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs font-mono font-bold cursor-pointer flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>BigQuery Studio</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleRunBqAnomalyVector}
                  disabled={runningBq || !selectedDataset || !selectedTable}
                  className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-mono font-extrabold cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>
                    {runningBq
                      ? 'Running Live BigQuery Vector CTE...'
                      : 'Run Live Z-Score & Cosine Vector SQL'}
                  </span>
                </button>
              </div>
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
                          setSelectedMetricColumn('');
                        }}
                        className={`px-2.5 py-1 rounded-md border text-[11px] font-mono cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-500 font-bold'
                            : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-blue-500/40'
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
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
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
                  Evaluated Numeric Metric Column
                </label>
                {(bqResult?.availableNumericColumns || []).length > 0 ? (
                  <select
                    value={selectedMetricColumn || bqResult.metricColumn || ''}
                    onChange={(e) => setSelectedMetricColumn(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-mono text-zinc-900 dark:text-white"
                  >
                    {bqResult.availableNumericColumns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={selectedMetricColumn}
                    onChange={(e) => setSelectedMetricColumn(e.target.value)}
                    placeholder="Auto-detect first numeric column"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-mono text-zinc-900 dark:text-white"
                  />
                )}
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                    <div className="text-[10px] font-mono uppercase text-zinc-400">
                      Evaluated Column
                    </div>
                    <div className="text-xs font-mono font-extrabold text-blue-600 dark:text-blue-400 truncate">
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
                  <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                    <div className="text-[10px] font-mono uppercase text-zinc-400">
                      Median (Q2) / IQR
                    </div>
                    <div className="text-xs font-mono font-extrabold text-zinc-900 dark:text-white">
                      {bqResult.stats?.median ?? 0} (IQR: {bqResult.stats?.iqr ?? 0})
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

                {/* Executed SQL CTE + Cross-UI Workbench & Cloud Shell Bar */}
                <div className="p-3.5 rounded-xl bg-zinc-950 text-zinc-100 border border-zinc-800 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-zinc-400">
                    <span>
                      EXECUTED BIGQUERY STANDARD SQL CTE (JOB ID: {bqResult.jobId || 'live'} · {bqResult.location || 'US'})
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {onOpenBigQuerySql && (
                        <button
                          type="button"
                          onClick={() => onOpenBigQuerySql(bqResult.executedSql)}
                          className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer flex items-center gap-1"
                        >
                          <Database className="w-3 h-3" />
                          <span>Open in BigQuery SQL Workbench</span>
                        </button>
                      )}
                      {onRunInShell && bqResult.cliEquivalent && (
                        <button
                          type="button"
                          onClick={() => onRunInShell(bqResult.cliEquivalent)}
                          className="px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold cursor-pointer flex items-center gap-1"
                        >
                          <Terminal className="w-3 h-3" />
                          <span>Run bq query in Cloud Shell</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          copyText(bqResult.executedSql, 'Copied BigQuery Standard SQL CTE')
                        }
                        className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 cursor-pointer flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy SQL</span>
                      </button>
                    </div>
                  </div>
                  <pre className="text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                    <code>{bqResult.executedSql}</code>
                  </pre>
                </div>

                {/* Live Gemini 3.8 Flash Anomaly Forensics Brief */}
                <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-extrabold text-zinc-900 dark:text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                        <span>
                          Live Gemini 3.8 Flash Statistical Anomaly &amp; Vector Forensics Surgeon
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Synthesizes an operational root-cause diagnosis and production <code>ML.DETECT_ANOMALIES</code> / <code>VECTOR_SEARCH</code> SQL from your live scored rows.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRunBqAiBrief}
                      disabled={runningBqAi}
                      className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-mono font-extrabold cursor-pointer flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>
                        {runningBqAi
                          ? 'Synthesizing Anomaly Brief...'
                          : 'Synthesize Gemini 3.8 Flash Anomaly Brief'}
                      </span>
                    </button>
                  </div>

                  <ZeroSniffingWebCryptoEnclaveBar
                    projectId={projectId}
                    onShowToast={notify}
                    compact
                  />

                  {bqAiBrief && (
                    <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[10.5px] font-mono">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full font-extrabold border ${
                              bqAiBrief.isLiveLlm
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                                : 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/40'
                            }`}
                          >
                            {bqAiBrief.isLiveLlm
                              ? `LIVE GEMINI LLM (${bqAiBrief.executionMode})`
                              : 'LIVE GEMINI LLM NOT REACHED'}
                          </span>
                          <span className="text-zinc-500">
                            {bqAiBrief.modelUsed} · {bqAiBrief.latencyMs}ms
                          </span>
                          {bqAiBrief.tokenUsage?.totalTokens > 0 && (
                            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-300">
                              Tokens: {bqAiBrief.tokenUsage.totalTokens}
                            </span>
                          )}
                        </div>
                        {bqAiBrief.analysisMarkdown && (
                          <button
                            type="button"
                            onClick={() =>
                              copyText(
                                bqAiBrief.analysisMarkdown,
                                'Copied Anomaly Forensics Brief'
                              )
                            }
                            className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy Brief</span>
                          </button>
                        )}
                      </div>
                      {bqAiBrief.isLiveLlm && bqAiBrief.analysisMarkdown ? (
                        <FormattedMarkdown
                          text={bqAiBrief.analysisMarkdown}
                          onCopy={copyText}
                        />
                      ) : (
                        <div className="text-xs font-mono text-rose-600 dark:text-rose-300">
                          {(bqAiBrief.diagnostics || []).join(' · ')}
                        </div>
                      )}
                    </div>
                  )}
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
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                            <td className="py-2 px-3 text-blue-600 dark:text-blue-400 font-bold">
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
                    Live Cloud Build, Artifact Registry SHA-256 Digests, Cloud Run Pinning &amp; SLSA v1.0 DSSE Provenance Attestor
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Queries <code>cloudbuild.googleapis.com</code>, <code>artifactregistry.googleapis.com</code>, and <code>run.googleapis.com</code> to audit whether deployed Cloud Run containers are pinned to immutable <code>@sha256</code> digests vs mutable tags, and signs an Ed25519 Dead Simple Signing Envelope (DSSE) SLSA v1.0 In-Toto attestation.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {onSelectStudioTab && (
                  <>
                    <button
                      type="button"
                      onClick={() => onSelectStudioTab('WAVE9_STUDIO')}
                      className="px-3 py-2 rounded-md border border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs font-mono font-bold cursor-pointer flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Cloud Build Studio</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectStudioTab('CLOUD_RUN')}
                      className="px-3 py-2 rounded-md border border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs font-mono font-bold cursor-pointer flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Cloud Run Studio</span>
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={fetchSupplyChainProvenance}
                  disabled={loadingSupply}
                  className="px-3.5 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${loadingSupply ? 'animate-spin' : ''}`}
                  />
                  <span>Refresh Live Supply Chain</span>
                </button>
              </div>
            </div>

            {supplyData && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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
                    <div className="text-sm font-mono font-extrabold text-blue-600 dark:text-blue-400">
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
                    <div className="text-sm font-mono font-extrabold text-blue-600 dark:text-blue-400">
                      {supplyData.summary?.totalCloudRunServices} Live
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
                    <div className="text-[10px] font-mono uppercase text-emerald-700 dark:text-emerald-300">
                      Digest-Pinned Services
                    </div>
                    <div className="text-sm font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                      {supplyData.summary?.digestPinnedServices ?? 0} Pinned /{' '}
                      {supplyData.summary?.mutableTagServices ?? 0} Mutable Tag
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
                            <th className="py-2 px-3 text-right">Actions</th>
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
                              className="hover:bg-blue-500/5 cursor-pointer"
                            >
                              <td className="py-2 px-3 font-bold text-zinc-800 dark:text-zinc-200">
                                {img.repository} ({img.location})
                              </td>
                              <td className="py-2 px-3 text-blue-600 dark:text-blue-400 truncate max-w-xs">
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
                              <td className="py-2 px-3 text-right space-x-1.5">
                                <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                                  Load Digest
                                </span>
                                {onRunInShell && img.cliEquivalent && (
                                  <button
                                    type="button"
                                    onClick={(ev) => {
                                      ev.stopPropagation();
                                      onRunInShell(img.cliEquivalent);
                                    }}
                                    className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold cursor-pointer"
                                  >
                                    CLI
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Active Cloud Run Services Image Provenance & Digest Pinning Radar */}
                {(supplyData.runServices || []).length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-mono font-bold uppercase text-zinc-500">
                      Active Cloud Run Gen2 Services — Container Image Digest Pinning &amp; SLSA Posture
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 max-h-56">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-zinc-100 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-mono uppercase text-zinc-500">
                            <th className="py-2 px-3">Cloud Run Service</th>
                            <th className="py-2 px-3">Active Revision</th>
                            <th className="py-2 px-3">Deployed Container Image</th>
                            <th className="py-2 px-3">SLSA Digest Posture</th>
                            <th className="py-2 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono text-[11px]">
                          {supplyData.runServices.map((svc) => {
                            const isPinned = Boolean(svc.pinnedSha256);
                            return (
                              <tr
                                key={`${svc.location}-${svc.serviceName}`}
                                className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                              >
                                <td className="py-2 px-3 font-bold text-zinc-900 dark:text-white">
                                  {svc.serviceName}{' '}
                                  <span className="text-zinc-400 font-normal">
                                    ({svc.location})
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-zinc-500">
                                  {svc.latestReadyRevision || '—'}
                                </td>
                                <td className="py-2 px-3 text-blue-600 dark:text-blue-400 max-w-xs truncate">
                                  {svc.containerImage}
                                </td>
                                <td className="py-2 px-3">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      isPinned
                                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                                    }`}
                                  >
                                    {isPinned
                                      ? `PINNED (@sha256:${svc.pinnedSha256.slice(0, 10)}...)`
                                      : 'MUTABLE TAG (:latest)'}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-right space-x-1.5 whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSubjectName(
                                        String(svc.containerImage || '').split('@')[0]
                                      );
                                      if (svc.pinnedSha256) {
                                        setSha256Digest(svc.pinnedSha256);
                                      }
                                    }}
                                    className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-700 dark:text-blue-300 text-[10px] font-bold cursor-pointer"
                                  >
                                    Attest Service
                                  </button>
                                  {onRunInShell && svc.cliEquivalent && (
                                    <button
                                      type="button"
                                      onClick={() => onRunInShell(svc.cliEquivalent)}
                                      className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold cursor-pointer"
                                    >
                                      Inspect CLI
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Recent Cloud Build Invocations Quick-Picker */}
                {(supplyData.builds || []).length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-mono font-bold uppercase text-zinc-400">
                      Recent Cloud Build Invocations (Click to Bind Build ID to SLSA Provenance)
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {supplyData.builds.slice(0, 8).map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setBuildId(b.id)}
                          className={`px-2.5 py-1 rounded-md border text-[10.5px] font-mono cursor-pointer ${
                            buildId === b.id
                              ? 'bg-blue-600 text-white border-blue-500 font-bold'
                              : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          {b.id.slice(0, 12)}... [{b.status}] ({b.stepsCount} steps)
                        </button>
                      ))}
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
                      className="px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-mono font-extrabold cursor-pointer flex items-center gap-1.5"
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
                        placeholder="Leave blank or pick existing bucket below"
                        className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-mono text-zinc-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {(supplyData.availableBuckets || []).length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] font-mono">
                      <span className="text-zinc-500">Quick-Pick Existing GCS Bucket:</span>
                      <button
                        type="button"
                        onClick={() => setUploadBucket('')}
                        className={`px-2 py-0.5 rounded cursor-pointer ${
                          !uploadBucket
                            ? 'bg-zinc-800 text-white font-bold'
                            : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                        }`}
                      >
                        In-Memory Only ($0.00)
                      </button>
                      {supplyData.availableBuckets.slice(0, 6).map((b) => (
                        <button
                          key={b.name}
                          type="button"
                          onClick={() => setUploadBucket(b.name)}
                          className={`px-2 py-0.5 rounded cursor-pointer ${
                            uploadBucket === b.name
                              ? 'bg-emerald-600 text-white font-bold'
                              : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          }`}
                        >
                          gs://{b.name}
                        </button>
                      ))}
                    </div>
                  )}
                </form>

                {slsaAttestation && (
                  <div className="p-4 rounded-xl bg-zinc-950 text-zinc-100 border border-zinc-800 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                      <span className="text-emerald-400 font-bold">
                        VERIFIED ED25519 DSSE ENVELOPE · SHA-256: {slsaAttestation.statementSha256}
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          disabled={verifyingDsse}
                          onClick={handleVerifySlsaDsse}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer flex items-center gap-1 disabled:opacity-50"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>
                            {verifyingDsse
                              ? 'Verifying DSSE...'
                              : 'Verify Ed25519 DSSE & 1-Byte Tamper Rejection'}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            downloadFile(
                              `slsa-v1-${(slsaAttestation.sha256Digest || 'attestation').slice(0, 12)}.intoto.jsonl`,
                              JSON.stringify(slsaAttestation.dsseEnvelope, null, 2)
                            )
                          }
                          className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download .intoto.jsonl</span>
                        </button>
                        {onRunInShell && slsaAttestation.cosignCliEquivalent && (
                          <button
                            type="button"
                            onClick={() => onRunInShell(slsaAttestation.cosignCliEquivalent)}
                            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-emerald-300 cursor-pointer flex items-center gap-1"
                          >
                            <Terminal className="w-3 h-3" />
                            <span>Provenance CLI</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            copyText(
                              JSON.stringify(slsaAttestation.inTotoStatement, null, 2),
                              'Copied SLSA v1.0 In-Toto Statement JSON'
                            )
                          }
                          className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 cursor-pointer flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy SLSA v1.0 JSON</span>
                        </button>
                      </div>
                    </div>

                    {dsseVerifyResult && (
                      <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-xs font-mono text-emerald-200 space-y-1">
                        <div className="font-extrabold flex items-center justify-between">
                          <span>
                            CRYPTOGRAPHIC DSSE PAE + RFC 8032 ED25519 VERIFICATION RECEIPT
                          </span>
                          <span>{dsseVerifyResult.latencyMs}ms</span>
                        </div>
                        <div>{dsseVerifyResult.proofSummary}</div>
                        <div className="text-[10.5px] text-emerald-300/80">
                          Key ID: {dsseVerifyResult.keyId} · Authentic Verified:{' '}
                          {String(dsseVerifyResult.authenticVerified)} · Tampered Payload Valid:{' '}
                          {String(dsseVerifyResult.tamperedSignatureValid)}
                        </div>
                      </div>
                    )}

                    {slsaAttestation.gcsObjectUri && (
                      <div className="text-xs font-mono text-blue-300">
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
                  <FileSearch className="w-4 h-4 text-blue-500" />
                  <span>
                    Live Cloud Logging Root-Cause Correlator (<code>logging.googleapis.com/v2/entries:list</code>)
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Streams real project audit &amp; service logs directly from Google Cloud Logging, correlates severity, API method, and IAM principal bursts, and dispatches Vertex AI Gemini 3.8 Flash to synthesize a Root-Cause Analysis and copy-ready <code>gcloud logging</code> runbook.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {onSelectStudioTab && (
                  <button
                    type="button"
                    onClick={() => onSelectStudioTab('LOGS_SHELL')}
                    className="px-3 py-2 rounded-md border border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs font-mono font-bold cursor-pointer flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Logs &amp; Cloud Shell Studio</span>
                  </button>
                )}
                {onRunInShell && logData?.cliEquivalent && (
                  <button
                    type="button"
                    onClick={() => onRunInShell(logData.cliEquivalent)}
                    className="px-3 py-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-bold cursor-pointer flex items-center gap-1"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Run gcloud logging in Shell</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={fetchCloudLogs}
                  disabled={loadingLogs}
                  className="px-3.5 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer flex items-center gap-1.5"
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
                  className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-mono font-extrabold cursor-pointer flex items-center gap-1.5 shadow-sm"
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

            <ZeroSniffingWebCryptoEnclaveBar
              projectId={projectId}
              onShowToast={notify}
              compact
            />

            {/* 1-Click Incident Investigation Filter Presets */}
            <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] font-mono">
              <span className="text-zinc-400 font-bold">1-Click Presets:</span>
              {[
                { label: 'All Live Activity', sev: 'ALL', rType: 'ALL', q: '' },
                { label: 'Errors & Criticals', sev: 'ERROR', rType: 'ALL', q: '' },
                { label: 'IAM SetIamPolicy Audits', sev: 'ALL', rType: 'ALL', q: 'SetIamPolicy' },
                { label: 'Cloud Run Revisions', sev: 'ALL', rType: 'cloud_run_revision', q: '' },
                { label: 'BigQuery Jobs', sev: 'ALL', rType: 'bigquery_resource', q: '' },
                { label: 'GCS Buckets', sev: 'ALL', rType: 'gcs_bucket', q: '' },
              ].map((pr) => (
                <button
                  key={pr.label}
                  type="button"
                  onClick={() => {
                    setSeverityFilter(pr.sev);
                    setResourceTypeFilter(pr.rType);
                    setLogSearchQuery(pr.q);
                  }}
                  className="px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 hover:border-blue-500/40 text-zinc-700 dark:text-zinc-300 font-bold cursor-pointer"
                >
                  {pr.label}
                </button>
              ))}
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
              <div className="p-4 rounded-2xl border border-blue-500/40 bg-blue-500/5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold border ${
                        logAiReport.isLiveLlm
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                          : 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/40'
                      }`}
                    >
                      {logAiReport.isLiveLlm
                        ? `LIVE GEMINI LLM (${logAiReport.executionMode})`
                        : 'LIVE GEMINI LLM NOT REACHED (ZERO SYNTHETIC OUTPUT)'}
                    </span>
                    <span className="text-xs font-mono font-extrabold text-blue-700 dark:text-blue-300">
                      {logAiReport.modelUsed} · ROOT-CAUSE &amp; REMEDIATION REPORT ({logAiReport.latencyMs}ms)
                    </span>
                    {logAiReport.tokenUsage?.totalTokens > 0 && (
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/30 text-[10px] font-mono font-bold">
                        Tokens: {logAiReport.tokenUsage.totalTokens}
                      </span>
                    )}
                  </div>
                  {logAiReport.analysisMarkdown && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          downloadFile(
                            `cloud-logging-rca-${projectId}-${Date.now()}.md`,
                            logAiReport.analysisMarkdown,
                            'text/markdown'
                          )
                        }
                        className="px-2.5 py-1 rounded bg-zinc-900 dark:bg-zinc-800 text-white text-[11px] font-mono cursor-pointer flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>Export (.md)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          copyText(logAiReport.analysisMarkdown, 'Copied RCA Report')
                        }
                        className="px-2.5 py-1 rounded bg-blue-500/20 text-blue-700 dark:text-blue-200 text-[11px] font-mono cursor-pointer flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy Report</span>
                      </button>
                    </div>
                  )}
                </div>
                {logAiReport.isLiveLlm && logAiReport.analysisMarkdown ? (
                  <FormattedMarkdown
                    text={logAiReport.analysisMarkdown}
                    onCopy={copyText}
                  />
                ) : (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 space-y-1.5 text-xs font-mono">
                    <div className="font-extrabold text-rose-600 dark:text-rose-300">
                      Live Gemini Inference Did Not Complete (Zero Synthetic Fallback Policy)
                    </div>
                    {(logAiReport.diagnostics || []).map((d, i) => (
                      <div key={i} className="text-zinc-700 dark:text-zinc-300">
                        • {d}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {logData && (
              <div className="space-y-3">
                {/* Live Severity & API Method / Principal Correlation Strip */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase text-zinc-400">
                      Severity Distribution ({logData.totalEntries} Entries)
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(logData.severityCounts || {}).map(
                        ([sev, cnt]) => (
                          <span
                            key={sev}
                            className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
                              sev === 'ERROR' && cnt > 0
                                ? 'bg-red-500/20 text-red-700 dark:text-red-300'
                                : sev === 'WARNING' && cnt > 0
                                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                            }`}
                          >
                            {sev}: {cnt}
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase text-zinc-400">
                      Top Audited API Methods (Click to Filter)
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(logData.topMethods || []).length > 0 ? (
                        logData.topMethods.map((m) => (
                          <button
                            key={m.method}
                            type="button"
                            onClick={() => setLogSearchQuery(m.method)}
                            className="px-2 py-0.5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-300 text-[10px] font-bold cursor-pointer truncate max-w-[220px]"
                          >
                            {m.method.split('.').slice(-2).join('.')} ({m.count})
                          </button>
                        ))
                      ) : (
                        <span className="text-zinc-500 text-[10.5px]">
                          No protoPayload method calls in window
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase text-zinc-400">
                      Top Calling IAM Principals (Click to Filter)
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(logData.topPrincipals || []).length > 0 ? (
                        logData.topPrincipals.map((p) => (
                          <button
                            key={p.principal}
                            type="button"
                            onClick={() => setLogSearchQuery(p.principal)}
                            className="px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold cursor-pointer truncate max-w-[220px]"
                          >
                            {p.principal} ({p.count})
                          </button>
                        ))
                      ) : (
                        <span className="text-zinc-500 text-[10.5px]">
                          System / unauthenticated telemetry entries
                        </span>
                      )}
                    </div>
                  </div>
                </div>

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
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isErr
                                    ? 'bg-red-500/20 text-red-700 dark:text-red-300'
                                    : isWarn
                                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                                }`}
                              >
                                {e.severity}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-blue-600 dark:text-blue-400 whitespace-nowrap">
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
                  Performs real TCP + TLS 1.3 socket handshakes against your live Cloud Run <code>.run.app</code> services and Google Cloud regional APIs, extracting the full X.509 certificate chain (Leaf &rarr; Intermediate CA &rarr; Root CA), Subject Alternative Names (SANs), negotiated AEAD cipher suite, ALPN protocol, and days remaining until expiration.
                </p>
              </div>
              <button
                type="button"
                onClick={handleInspectTlsEndpoints}
                disabled={runningTls}
                className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-mono font-extrabold cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${runningTls ? 'animate-spin' : ''}`}
                />
                <span className="inline-flex items-center gap-1">
                  {runningTls ? (
                    'Executing Live TLS Handshakes...'
                  ) : (
                    <>
                      Probe Live TLS 1.3 &amp; X.509 Chains (<Zap className="w-3 h-3 shrink-0" /> Socket · No gcloud)
                    </>
                  )}
                </span>
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] font-mono">
                <span className="text-zinc-400 font-bold">Quick-Add Target Hosts:</span>
                {[
                  'aiplatform.googleapis.com, compute.googleapis.com',
                  'cloudbuild.googleapis.com, artifactregistry.googleapis.com',
                  'cloud.google.com, console.cloud.google.com',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCustomHost(preset)}
                    className="px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 hover:border-emerald-500/40 text-zinc-700 dark:text-zinc-300 cursor-pointer"
                  >
                    + {preset}
                  </button>
                ))}
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
            </div>

            {tlsData && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {(tlsData.endpoints || []).map((ep) => (
                  <div
                    key={ep.host}
                    className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/70 space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-500 shrink-0" />
                        <span className="text-xs font-mono font-extrabold text-zinc-900 dark:text-white">
                          {ep.host}
                        </span>
                      </div>
                      {ep.ok ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                            {ep.pfsGrade || 'A+ TLS 1.3'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            {ep.protocol} · {ep.alpnProtocol} · {ep.tlsHandshakeMs}ms
                          </span>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/15 text-red-700 dark:text-red-300">
                          {ep.error}
                        </span>
                      )}
                    </div>

                    {ep.ok && (
                      <div className="space-y-2 text-[11px] font-mono text-zinc-600 dark:text-zinc-300">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">AEAD Cipher Suite:</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            {ep.cipherStandardName || ep.cipherName}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">TCP vs TLS Handshake Split:</span>
                          <span>
                            TCP {ep.tcpConnectMs}ms + TLS Crypto{' '}
                            {ep.tlsCryptoOverheadMs ?? Math.max(1, ep.tlsHandshakeMs - ep.tcpConnectMs)}ms ={' '}
                            <strong className="text-zinc-900 dark:text-white">
                              {ep.tlsHandshakeMs}ms
                            </strong>
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">Subject CN / Issuer:</span>
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">
                            {ep.subjectCN} ({ep.issuerO} · {ep.issuerCN})
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">Public Key / Validity:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {ep.pubkeyCurve || 'ECDSA'} ({ep.pubkeyBits || 256}b) ·{' '}
                            {ep.daysRemaining} Days Left (Until {ep.validTo})
                          </span>
                        </div>

                        {/* Full Certificate Chain Hierarchy (Leaf -> Intermediate -> Root) */}
                        {(ep.certChain || []).length > 0 && (
                          <div className="pt-1.5 border-t border-zinc-200 dark:border-zinc-800 space-y-1">
                            <div className="text-[10px] font-bold uppercase text-zinc-400">
                              X.509 Certificate Chain ({ep.chainDepth} Certs · {ep.sanCount} SANs):
                            </div>
                            <div className="space-y-1">
                              {ep.certChain.map((c) => (
                                <div
                                  key={`${c.depth}-${c.fingerprint256}`}
                                  className="px-2 py-1 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 text-[10px]"
                                >
                                  <span className="truncate">
                                    <strong className="text-blue-600 dark:text-blue-400">
                                      [{c.role}]
                                    </strong>{' '}
                                    {c.subjectCN} &rarr; {c.issuerCN}
                                  </span>
                                  <span className="text-zinc-400 shrink-0">
                                    {c.fingerprint256?.slice(0, 14)}...
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Sample SANs */}
                        {(ep.sampleSans || []).length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 pt-0.5">
                            <span className="text-[10px] text-zinc-400">SANs:</span>
                            {ep.sampleSans.slice(0, 5).map((san) => (
                              <span
                                key={san}
                                className="px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 text-[10px] text-zinc-700 dark:text-zinc-300"
                              >
                                {san}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="pt-1.5 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[10px] text-zinc-500 truncate max-w-[260px]">
                            SHA-256: {ep.fingerprint256}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {onRunInShell && ep.opensslCli && (
                              <button
                                type="button"
                                onClick={() => onRunInShell(ep.opensslCli)}
                                className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold cursor-pointer flex items-center gap-1"
                              >
                                <Terminal className="w-3 h-3" />
                                <span>Run openssl</span>
                              </button>
                            )}
                            {ep.opensslCli && (
                              <button
                                type="button"
                                onClick={() =>
                                  copyText(ep.opensslCli, `Copied openssl command for ${ep.host}`)
                                }
                                className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold cursor-pointer flex items-center gap-1"
                              >
                                <Copy className="w-3 h-3" />
                                <span>Copy openssl</span>
                              </button>
                            )}
                          </div>
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
