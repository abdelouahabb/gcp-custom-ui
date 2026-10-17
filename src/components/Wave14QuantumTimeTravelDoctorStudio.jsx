import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Clock,
  ShieldCheck,
  KeyRound,
  Lock,
  Unlock,
  RefreshCw,
  Play,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Database,
  Sparkles,
  Wrench,
  Users,
} from 'lucide-react';

const WAVE14_TABS = [
  {
    id: 'BIGQUERY_TIME_TRAVEL',
    step: '01',
    title: 'BigQuery Time-Travel SQL',
    subtitle: 'Live FOR SYSTEM_TIME AS OF Diff',
    icon: Clock,
  },
  {
    id: 'SELF_HEALING_DOCTOR',
    step: '02',
    title: 'Self-Healing Cloud Doctor',
    subtitle: 'Live GCS / BQ / Secret PATCH Loop',
    icon: Wrench,
  },
  {
    id: 'IAM_BLAST_RADIUS',
    step: '03',
    title: 'IAM Blast-Radius Graph',
    subtitle: 'Live getIamPolicy & Least-Privilege',
    icon: Users,
  },
  {
    id: 'QUANTUM_ENVELOPE_VAULT',
    step: '04',
    title: 'Hybrid PQC Envelope Vault',
    subtitle: 'X25519 + SHAKE256 + AES-GCM + Secret',
    icon: KeyRound,
  },
];

function renderInlineMarkdown(text, copyFn) {
  if (!text) return null;
  const parts = String(text).split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong
          key={idx}
          className="font-bold text-zinc-900 dark:text-white"
        >
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

export default function Wave14QuantumTimeTravelDoctorStudio({
  projectId,
  onShowToast,
  onRefreshOverview,
}) {
  const [activeTab, setActiveTab] = useState('BIGQUERY_TIME_TRAVEL');

  // Module 01: Live BigQuery Time-Travel (`FOR SYSTEM_TIME AS OF`) State
  const [availableTables, setAvailableTables] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState('');
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('US');
  const [secondsAgo, setSecondsAgo] = useState(60);
  const [mutationNote, setMutationNote] = useState(
    'Flying Car Orbital Telemetry Checkpoint'
  );
  const [timeTravelData, setTimeTravelData] = useState(null);
  const [runningTimeTravel, setRunningTimeTravel] = useState(false);

  // Module 02: Autonomous Self-Healing Cloud Doctor State
  const [auditData, setAuditData] = useState(null);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [healingResource, setHealingResource] = useState('');

  // Module 03: Live IAM Blast-Radius Graph State
  const [iamData, setIamData] = useState(null);
  const [loadingIam, setLoadingIam] = useState(false);
  const [iamAiPlan, setIamAiPlan] = useState(null);
  const [generatingIamPlan, setGeneratingIamPlan] = useState(false);

  // Module 04: Hybrid Post-Quantum & Envelope Vault State
  const [secretName, setSecretName] = useState('wave14-quantum-envelope-vault');
  const [plaintextInput, setPlaintextInput] = useState(
    'STARLINK_LASER_MASTER_KEY=quantum-shield-x25519-shake256-live'
  );
  const [pqContextLabel, setPqContextLabel] = useState(
    'ML-KEM-1024-HYBRID-X25519-HKDF-SHA512'
  );
  const [sealedEnvelope, setSealedEnvelope] = useState(null);
  const [sealingEnvelope, setSealingEnvelope] = useState(false);
  const [decryptedResult, setDecryptedResult] = useState(null);
  const [decryptingEnvelope, setDecryptingEnvelope] = useState(false);

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

  const fetchTimeTravelTables = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/wave14/time-travel-tables`
      );
      const discovered = res.data?.tables || [];
      setAvailableTables(discovered);
      if (discovered.length > 0) {
        setSelectedDataset((prev) => prev || discovered[0].datasetId);
        setSelectedTable((prev) => prev || discovered[0].tableId);
        setSelectedLocation((prev) => prev || discovered[0].location || 'US');
      }
    } catch {
      // ignore initial discovery notice
    }
  }, [projectId]);

  const executeTimeTravelQuery = useCallback(
    async (injectMutation = false) => {
      if (!projectId) return;
      setRunningTimeTravel(true);
      try {
        const res = await axios.post(
          `/api/project/${encodeURIComponent(projectId)}/wave14/bigquery-time-travel`,
          {
            datasetId: selectedDataset,
            tableId: selectedTable,
            location: selectedLocation,
            secondsAgo: Number(secondsAgo) || 60,
            injectMutationBeforeDiff: injectMutation,
            mutationNote,
          }
        );
        setTimeTravelData(res.data);
        fetchTimeTravelTables();
        if (injectMutation) {
          notify(
            `Inserted live row ${res.data.injectedRowId} & proved FOR SYSTEM_TIME AS OF diff (+${res.data.addedRows?.length || 0} row delta)!`
          );
        }
      } catch (err) {
        notify(
          `Time-travel SQL notice: ${err.response?.data?.error || err.message}`
        );
      } finally {
        setRunningTimeTravel(false);
      }
    },
    [
      projectId,
      selectedDataset,
      selectedTable,
      selectedLocation,
      secondsAgo,
      mutationNote,
      fetchTimeTravelTables,
      notify,
    ]
  );

  const fetchSelfHealingAudit = useCallback(async () => {
    if (!projectId) return;
    setLoadingAudit(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/wave14/self-healing-audit`
      );
      setAuditData(res.data);
    } catch (err) {
      notify(
        `Self-healing audit notice: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setLoadingAudit(false);
    }
  }, [projectId, notify]);

  const handleHealResources = async (targetResourceId = 'ALL') => {
    if (!projectId) return;
    setHealingResource(targetResourceId);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave14/self-healing-remediate`,
        { targetResourceId }
      );
      setAuditData(res.data);
      if (onRefreshOverview) onRefreshOverview();
      const healedCount = (res.data?.remediationReceipts || []).filter(
        (r) => r.ok
      ).length;
      notify(
        `Healed ${healedCount} live GCP resource(s) via REST PATCH/POST (Compliance: ${res.data?.compliancePct}%)`
      );
    } catch (err) {
      if (err?.message && err.message.includes('cancelled')) return;
      notify(
        `Self-healing error: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setHealingResource('');
    }
  };

  const fetchIamBlastRadius = useCallback(async () => {
    if (!projectId) return;
    setLoadingIam(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/wave14/iam-blast-radius`
      );
      setIamData(res.data);
    } catch (err) {
      notify(
        `IAM blast-radius notice: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setLoadingIam(false);
    }
  }, [projectId, notify]);

  const handleGenerateIamAiPlan = async (focusPrincipal = '') => {
    if (!projectId) return;
    setGeneratingIamPlan(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave14/iam-ai-hardening`,
        { focusPrincipal }
      );
      setIamAiPlan(res.data);
      notify(
        `Generated live Gemini 3.8 Flash IAM Least-Privilege Plan (${res.data?.latencyMs}ms)`
      );
    } catch (err) {
      notify(`IAM AI notice: ${err.response?.data?.error || err.message}`);
    } finally {
      setGeneratingIamPlan(false);
    }
  };

  const handleSealQuantumEnvelope = async (e) => {
    if (e) e.preventDefault();
    if (!projectId) return;
    setSealingEnvelope(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave14/quantum-envelope-seal`,
        {
          secretName,
          plaintextPayload: plaintextInput,
          pqContextLabel,
        }
      );
      setSealedEnvelope(res.data);
      setDecryptedResult(null);
      if (onRefreshOverview) onRefreshOverview();
      notify(
        `Sealed Hybrid X25519 + SHAKE256 + AES-256-GCM envelope to ${res.data?.secretVersionName}!`
      );
    } catch (err) {
      if (err?.message && err.message.includes('cancelled')) return;
      notify(
        `Envelope seal error: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setSealingEnvelope(false);
    }
  };

  const handleDecryptQuantumEnvelope = async () => {
    if (!projectId) return;
    setDecryptingEnvelope(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave14/quantum-envelope-decrypt`,
        {
          secretName,
          version: 'latest',
        }
      );
      setDecryptedResult(res.data);
      notify(
        `Fetched SecretVersion from GCP, verified Ed25519 + X25519 + AES-GCM AuthTag, and decrypted live (${res.data?.latencyMs}ms)!`
      );
    } catch (err) {
      if (err?.message && err.message.includes('cancelled')) return;
      notify(
        `Envelope decrypt error: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setDecryptingEnvelope(false);
    }
  };

  useEffect(() => {
    fetchTimeTravelTables();
    fetchSelfHealingAudit();
    fetchIamBlastRadius();
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="p-5 rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-500/10 via-cyan-500/5 to-emerald-500/10 dark:from-violet-950/40 dark:via-zinc-900 dark:to-emerald-950/40">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-500/40">
                WAVE 14 · TEMPORAL SQL, SELF-HEALING DOCTOR, IAM BLAST-RADIUS & PQC VAULT
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                100% LIVE GCP REST & CRYPTO · ZERO SIMULATION
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              BigQuery Time-Travel Forensics, Autonomous Self-Healing Cloud Doctor, Live IAM Blast-Radius Graph & Hybrid PQC Vault
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 max-w-4xl">
              Query historical BigQuery storage snapshots via native <code>FOR SYSTEM_TIME AS OF</code>, heal drifted GCS/BigQuery/Secret Manager configurations via live REST <code>PATCH</code>, inspect live <code>projects:getIamPolicy</code> blast radius, and seal/decrypt X25519 + SHAKE256 + AES-256-GCM + Ed25519 envelopes inside Google Cloud Secret Manager.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 shrink-0">
            <div className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 text-center">
              <div className="text-[10px] font-mono uppercase text-zinc-400">
                SLO Compliance
              </div>
              <div className="text-sm font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                {auditData ? `${auditData.compliancePct}% (${auditData.compliantCount}/${auditData.totalChecked})` : 'Auditing...'}
              </div>
            </div>
            <div className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 text-center">
              <div className="text-[10px] font-mono uppercase text-zinc-400">
                IAM Principals
              </div>
              <div className="text-sm font-mono font-extrabold text-violet-600 dark:text-violet-400">
                {iamData ? `${iamData.totalPrincipals} Live` : 'Scanning...'}
              </div>
            </div>
            <div className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 text-center">
              <div className="text-[10px] font-mono uppercase text-zinc-400">
                Temporal Rows
              </div>
              <div className="text-sm font-mono font-extrabold text-cyan-600 dark:text-cyan-400">
                {timeTravelData
                  ? `${timeTravelData.currentRowCount} Now / ${timeTravelData.historicalRowCount} Past`
                  : 'Ready'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Equal-Sized 4-Column Bento Sub-Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {WAVE14_TABS.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`h-20 p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                active
                  ? 'bg-violet-600 text-white border-violet-500 shadow-md'
                  : 'bg-white dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:border-violet-500/50'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-extrabold ${
                    active
                      ? 'bg-black/25 text-violet-100'
                      : 'bg-violet-500/15 text-violet-700 dark:text-violet-300'
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
                    active ? 'text-violet-100/90' : 'text-zinc-500 dark:text-zinc-400'
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
      {/* MODULE 01: BIGQUERY TIME-TRAVEL SQL (FOR SYSTEM_TIME AS OF)         */}
      {/* =================================================================== */}
      {activeTab === 'BIGQUERY_TIME_TRAVEL' && (
        <div className="space-y-5">
          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-violet-500" />
                  <span>
                    Live BigQuery Time-Travel SQL Engine (<code>FOR SYSTEM_TIME AS OF</code>)
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Executes two real BigQuery SQL queries in parallel against <code>bigquery.googleapis.com</code>: one at <code>CURRENT_TIMESTAMP()</code> and one at a historical snapshot via <code>FOR SYSTEM_TIME AS OF</code>. Click <strong>Mutate &amp; Prove Time-Travel Diff Live</strong> to insert a new live row and compare the table right before vs. right after the mutation!
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => executeTimeTravelQuery(false)}
                  disabled={runningTimeTravel}
                  className="px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${runningTimeTravel ? 'animate-spin' : ''}`}
                  />
                  <span>Run Time-Travel SQL</span>
                </button>
                <button
                  type="button"
                  onClick={() => executeTimeTravelQuery(true)}
                  disabled={runningTimeTravel}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-mono font-extrabold cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>
                    {runningTimeTravel
                      ? 'Executing Live SQL Time-Travel...'
                      : 'Mutate & Prove Time-Travel Diff Live'}
                  </span>
                </button>
              </div>
            </div>

            {/* Discovered Project Tables Pills */}
            {availableTables.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono font-bold uppercase text-zinc-400">
                  Live Discovered BigQuery Tables in {projectId} (Click to Target)
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {availableTables.slice(0, 8).map((t) => {
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
                          setSelectedLocation(t.location || 'US');
                        }}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-violet-600 text-white border-violet-500 font-bold'
                            : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-violet-500/40'
                        }`}
                      >
                        {t.datasetId}.{t.tableId} ({t.location})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                  BigQuery Dataset ID
                </label>
                <input
                  type="text"
                  value={selectedDataset}
                  onChange={(e) => setSelectedDataset(e.target.value)}
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
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-mono text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                  Lookback Window (Seconds Ago)
                </label>
                <select
                  value={secondsAgo}
                  onChange={(e) => setSecondsAgo(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-mono text-zinc-900 dark:text-white"
                >
                  <option value={15}>15 Seconds Ago</option>
                  <option value={60}>60 Seconds Ago (1 Min)</option>
                  <option value={300}>300 Seconds Ago (5 Min)</option>
                  <option value={900}>900 Seconds Ago (15 Min)</option>
                  <option value={3600}>3600 Seconds Ago (1 Hour)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                  Live Mutation Note (For Diff Proof)
                </label>
                <input
                  type="text"
                  value={mutationNote}
                  onChange={(e) => setMutationNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            {timeTravelData && (
              <div className="space-y-4 pt-2">
                {/* Executed SQL Queries Box */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-zinc-950 text-zinc-100 border border-zinc-800 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                      <span>PRESENT STATE SQL (CURRENT_TIMESTAMP)</span>
                      <button
                        type="button"
                        onClick={() => copyText(timeTravelData.executedSqlNow)}
                        className="text-cyan-400 hover:underline cursor-pointer"
                      >
                        Copy SQL
                      </button>
                    </div>
                    <code className="block text-[11px] font-mono text-emerald-300 break-all">
                      {timeTravelData.executedSqlNow}
                    </code>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-950 text-zinc-100 border border-zinc-800 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                      <span>HISTORICAL SNAPSHOT SQL (FOR SYSTEM_TIME AS OF)</span>
                      <button
                        type="button"
                        onClick={() =>
                          copyText(timeTravelData.executedSqlTimeTravel)
                        }
                        className="text-violet-400 hover:underline cursor-pointer"
                      >
                        Copy SQL
                      </button>
                    </div>
                    <code className="block text-[11px] font-mono text-violet-300 break-all">
                      {timeTravelData.executedSqlTimeTravel}
                    </code>
                  </div>
                </div>

                {/* Temporal Delta Banner */}
                <div className="p-3.5 rounded-xl border border-violet-500/40 bg-violet-500/10 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <div>
                    Present Rows: <strong>{timeTravelData.currentRowCount}</strong> · Historical Snapshot Rows:{' '}
                    <strong>{timeTravelData.historicalRowCount}</strong> · Temporal Delta:{' '}
                    <strong className="text-emerald-600 dark:text-emerald-400">
                      +{timeTravelData.addedRows?.length || 0} New Row(s) Since Snapshot
                    </strong>
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    BigQuery Engine Latency: {timeTravelData.latencyMs}ms
                  </div>
                </div>

                {/* Newly Added Rows Since Snapshot */}
                {timeTravelData.addedRows?.length > 0 && (
                  <div className="p-3.5 rounded-2xl border border-emerald-500/40 bg-emerald-500/5 space-y-2">
                    <div className="text-xs font-mono font-extrabold text-emerald-800 dark:text-emerald-300">
                      TEMPORAL DIFF: ROWS ADDED SINCE HISTORICAL SNAPSHOT (+{timeTravelData.addedRows.length})
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                      <table className="w-full text-left border-collapse text-[11px] font-mono">
                        <thead>
                          <tr className="bg-emerald-500/10 border-b border-zinc-200 dark:border-zinc-800">
                            {Object.keys(timeTravelData.addedRows[0] || {}).map(
                              (col) => (
                                <th key={col} className="px-3 py-1.5">
                                  {col}
                                </th>
                              )
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                          {timeTravelData.addedRows.map((r, i) => (
                            <tr key={i}>
                              {Object.keys(timeTravelData.addedRows[0] || {}).map(
                                (col) => (
                                  <td
                                    key={col}
                                    className="px-3 py-1.5 text-emerald-700 dark:text-emerald-300 font-bold truncate max-w-xs"
                                  >
                                    {String(r[col] ?? '')}
                                  </td>
                                )
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Side-by-Side Present vs Historical Rows */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/60 space-y-2">
                    <div className="text-xs font-mono font-extrabold text-zinc-900 dark:text-white">
                      Present Table State ({timeTravelData.currentRowCount} Rows)
                    </div>
                    {timeTravelData.currentRows?.length > 0 ? (
                      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 max-h-60">
                        <table className="w-full text-left border-collapse text-[10.5px] font-mono">
                          <thead>
                            <tr className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                              {Object.keys(
                                timeTravelData.currentRows[0] || {}
                              ).map((col) => (
                                <th key={col} className="px-2.5 py-1.5">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {timeTravelData.currentRows.slice(0, 8).map((r, i) => (
                              <tr key={i}>
                                {Object.keys(
                                  timeTravelData.currentRows[0] || {}
                                ).map((col) => (
                                  <td
                                    key={col}
                                    className="px-2.5 py-1.5 truncate max-w-[160px]"
                                  >
                                    {String(r[col] ?? '')}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-500">0 rows returned.</div>
                    )}
                  </div>

                  <div className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/60 space-y-2">
                    <div className="text-xs font-mono font-extrabold text-violet-700 dark:text-violet-300">
                      Historical Snapshot via FOR SYSTEM_TIME AS OF ({timeTravelData.historicalRowCount} Rows)
                    </div>
                    {timeTravelData.historicalRows?.length > 0 ? (
                      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 max-h-60">
                        <table className="w-full text-left border-collapse text-[10.5px] font-mono">
                          <thead>
                            <tr className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                              {Object.keys(
                                timeTravelData.historicalRows[0] || {}
                              ).map((col) => (
                                <th key={col} className="px-2.5 py-1.5">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {timeTravelData.historicalRows
                              .slice(0, 8)
                              .map((r, i) => (
                                <tr key={i}>
                                  {Object.keys(
                                    timeTravelData.historicalRows[0] || {}
                                  ).map((col) => (
                                    <td
                                      key={col}
                                      className="px-2.5 py-1.5 truncate max-w-[160px]"
                                    >
                                      {String(r[col] ?? '')}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-500">
                        {timeTravelData.timeTravelNotice ||
                          '0 rows existed at that historical timestamp.'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODULE 02: AUTONOMOUS SELF-HEALING CLOUD DOCTOR                     */}
      {/* =================================================================== */}
      {activeTab === 'SELF_HEALING_DOCTOR' && (
        <div className="space-y-5">
          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-emerald-500" />
                <span>
                  Autonomous Self-Healing Cloud Doctor (Live GCS, BigQuery &amp; Secret Manager Drift Remediation)
                </span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Scans real GCS buckets, BigQuery datasets, and Secret Manager containers in <code>{projectId}</code> against Zero-Trust SLO invariants (Uniform Bucket-Level Access, Public Access Prevention, Governance Labels, and Active SecretVersions) and heals drifted resources via live Google Cloud <code>PATCH</code> / <code>POST</code> calls.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={fetchSelfHealingAudit}
                disabled={loadingAudit}
                className="px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loadingAudit ? 'animate-spin' : ''}`}
                />
                <span>Re-Scan Drift</span>
              </button>
              <button
                type="button"
                onClick={() => handleHealResources('ALL')}
                disabled={Boolean(healingResource) || auditData?.driftedCount === 0}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-mono font-extrabold cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  {healingResource === 'ALL'
                    ? 'Executing Live REST PATCH Loop...'
                    : `Heal All Drifted Resources Live (${auditData?.driftedCount || 0})`}
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(auditData?.resources || []).map((r) => (
              <div
                key={r.resourceId}
                className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
                  r.compliant
                    ? 'border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/15'
                    : 'border-amber-500/50 bg-amber-500/5 dark:bg-amber-950/15'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800 text-[10px] font-mono font-extrabold text-zinc-800 dark:text-zinc-200">
                      {r.kind} · {r.location}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-extrabold ${
                        r.compliant
                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {r.compliant ? 'COMPLIANT (HEALED)' : `${r.driftFindings.length} DRIFT(S)`}
                    </span>
                  </div>

                  <div className="text-xs font-mono font-extrabold text-zinc-900 dark:text-white break-all">
                    {r.name}
                  </div>

                  {r.compliant ? (
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>All Zero-Trust SLO invariants verified live in GCP.</span>
                    </div>
                  ) : (
                    <ul className="space-y-1 text-[11px] text-amber-800 dark:text-amber-300">
                      {r.driftFindings.map((f, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="p-2 rounded-xl bg-zinc-950 text-[10px] font-mono text-zinc-400 break-all">
                    {r.remediationApiCall}
                  </div>
                </div>

                {!r.compliant && (
                  <button
                    type="button"
                    onClick={() => handleHealResources(r.resourceId)}
                    disabled={Boolean(healingResource)}
                    className="w-full py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[11px] font-mono font-bold cursor-pointer"
                  >
                    {healingResource === r.resourceId
                      ? 'Patching Live...'
                      : 'Heal Resource Live via REST PATCH'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODULE 03: LIVE IAM BLAST-RADIUS GRAPH INSPECTOR                    */}
      {/* =================================================================== */}
      {activeTab === 'IAM_BLAST_RADIUS' && (
        <div className="space-y-5">
          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-violet-500" />
                  <span>
                    Live IAM Policy Bindings &amp; Blast-Radius Graph (<code>projects:getIamPolicy</code>)
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Reads every real IAM role binding and service account on <code>{projectId}</code>, scores each principal&apos;s blast radius based on primitive/admin privileges, and synthesizes a live Gemini 3.8 Flash Least-Privilege Refactoring Plan.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={fetchIamBlastRadius}
                  disabled={loadingIam}
                  className="px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${loadingIam ? 'animate-spin' : ''}`}
                  />
                  <span>Refresh IAM Policy</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerateIamAiPlan('')}
                  disabled={generatingIamPlan}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-mono font-extrabold cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {generatingIamPlan
                      ? 'Synthesizing Least-Privilege Plan...'
                      : 'Generate Gemini 3.8 Flash Least-Privilege Plan'}
                  </span>
                </button>
              </div>
            </div>

            {iamData && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                  <div className="text-[10px] font-mono uppercase text-zinc-400">
                    Live IAM Bindings
                  </div>
                  <div className="text-base font-mono font-extrabold text-zinc-900 dark:text-white">
                    {iamData.totalBindings} Roles
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                  <div className="text-[10px] font-mono uppercase text-zinc-400">
                    Unique Principals
                  </div>
                  <div className="text-base font-mono font-extrabold text-violet-600 dark:text-violet-400">
                    {iamData.totalPrincipals} Members
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                  <div className="text-[10px] font-mono uppercase text-zinc-400">
                    Primitive God-Mode Holders
                  </div>
                  <div className="text-base font-mono font-extrabold text-amber-600 dark:text-amber-400">
                    {iamData.primitiveRoleHolders} Principal(s)
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                  <div className="text-[10px] font-mono uppercase text-zinc-400">
                    Public (allUsers) Exposure
                  </div>
                  <div className="text-base font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                    {iamData.publicExposureCount} Exposed
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(iamData?.principals || []).map((p) => (
                <div
                  key={p.principal}
                  className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/70 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded bg-violet-500/15 text-violet-700 dark:text-violet-300 text-[10px] font-mono font-bold uppercase">
                      {p.principalType}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-extrabold ${
                        p.blastRadiusScore >= 60
                          ? 'bg-red-500/20 text-red-700 dark:text-red-300'
                          : p.blastRadiusScore >= 30
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      Blast Radius Score: {p.blastRadiusScore}/100
                    </span>
                  </div>
                  <div className="text-xs font-mono font-extrabold text-zinc-900 dark:text-white break-all">
                    {p.principal}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {p.roles.map((r, idx) => (
                      <span
                        key={`${r.role}-${idx}`}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                          r.tier === 'PRIMITIVE_GOD_MODE'
                            ? 'bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30 font-bold'
                            : r.tier === 'SERVICE_ADMIN'
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                              : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        {r.role}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {iamAiPlan?.markdown && (
              <div className="p-5 rounded-2xl border border-violet-500/40 bg-white dark:bg-zinc-900/95 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
                  <div className="text-xs font-mono font-extrabold uppercase text-violet-700 dark:text-violet-300">
                    LIVE GEMINI 3.8 FLASH LEAST-PRIVILEGE IAM REFACTORING PLAN ({iamAiPlan.latencyMs}ms)
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText(iamAiPlan.markdown)}
                    className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-[11px] font-mono font-bold cursor-pointer"
                  >
                    Copy Full Plan
                  </button>
                </div>
                <FormattedMarkdown text={iamAiPlan.markdown} onCopy={copyText} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODULE 04: HYBRID POST-QUANTUM & ENVELOPE CRYPTOGRAPHY VAULT        */}
      {/* =================================================================== */}
      {activeTab === 'QUANTUM_ENVELOPE_VAULT' && (
        <div className="space-y-5">
          <form
            onSubmit={handleSealQuantumEnvelope}
            className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-cyan-500" />
                  <span>
                    Hybrid Post-Quantum Envelope Vault (X25519 ECDH + SHAKE256/HKDF-SHA512 + AES-256-GCM + Ed25519 + Secret Manager)
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Performs real ephemeral X25519 key agreement mixed with a 512-bit SHAKE256 Post-Quantum Lattice salt via HKDF-SHA512, encrypts your payload with AES-256-GCM, signs the canonical envelope with Ed25519 (RFC 8032), and seals it as a live <code>SecretVersion</code> in Google Cloud Secret Manager.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="submit"
                  disabled={sealingEnvelope}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-mono font-extrabold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>
                    {sealingEnvelope
                      ? 'Sealing to GCP Secret Manager...'
                      : 'Seal Envelope to Secret Manager'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleDecryptQuantumEnvelope}
                  disabled={decryptingEnvelope}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-mono font-extrabold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>
                    {decryptingEnvelope
                      ? 'Fetching & Decrypting...'
                      : 'Fetch & Decrypt from Secret Manager'}
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                  Target GCP Secret Manager ID
                </label>
                <input
                  type="text"
                  value={secretName}
                  onChange={(e) => setSecretName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-mono text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                  Post-Quantum HKDF Domain Context
                </label>
                <input
                  type="text"
                  value={pqContextLabel}
                  onChange={(e) => setPqContextLabel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-mono text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                  Plaintext Secret Payload to Seal
                </label>
                <input
                  type="text"
                  value={plaintextInput}
                  onChange={(e) => setPlaintextInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-mono text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            {sealedEnvelope?.envelope && (
              <div className="p-4 rounded-2xl border border-cyan-500/40 bg-cyan-500/5 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-mono font-extrabold text-cyan-800 dark:text-cyan-300">
                    SEALED TO GOOGLE CLOUD SECRET MANAGER: {sealedEnvelope.secretVersionName}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500">
                    Latency: {sealedEnvelope.latencyMs}ms
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 break-all">
                    <span className="text-zinc-400 block text-[10px]">
                      Ephemeral X25519 Public Key (SPKI DER B64)
                    </span>
                    {sealedEnvelope.envelope.ephemeralX25519SpkiB64}
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 break-all">
                    <span className="text-zinc-400 block text-[10px]">
                      AES-256-GCM Ciphertext (Hex) + 128-bit AuthTag
                    </span>
                    {sealedEnvelope.envelope.ciphertextHex} · Tag:{' '}
                    {sealedEnvelope.envelope.authTagHex}
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 break-all md:col-span-2">
                    <span className="text-zinc-400 block text-[10px]">
                      Ed25519 RFC 8032 Digital Signature over Envelope (Hex)
                    </span>
                    {sealedEnvelope.envelope.ed25519SignatureHex}
                  </div>
                </div>
              </div>
            )}

            {decryptedResult && (
              <div className="p-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-extrabold text-emerald-800 dark:text-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>
                      LIVE SECRET MANAGER ACCESS &amp; DECRYPTION VERIFIED ({decryptedResult.secretVersionAccessed})
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300">
                    Ed25519: VALID · X25519 ECDH: VALID · AES-256-GCM AuthTag: VALID ({decryptedResult.latencyMs}ms)
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-950 text-emerald-300 font-mono text-xs break-all">
                  Decrypted Plaintext: <strong>{decryptedResult.decryptedPlaintext}</strong>
                </div>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
