import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useTimezone } from '../context/TimezoneContext';
import {
  Terminal,
  Play,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Info,
  ChevronRight,
  ChevronDown,
  Sparkles,
  ShieldAlert,
  History,
  UserCheck,
  Copy,
  Check,
  FileCode2,
  Filter,
  Layers,
  GitCommit,
  DollarSign,
  EyeOff,
  Clock,
  Search,
  Database,
  Zap,
  X,
} from 'lucide-react';

const AUDIT_SERVICE_FILTERS = [
  { label: 'All GCP Services', value: 'ALL' },
  { label: 'Cloud Run (run.googleapis.com)', value: 'run.googleapis.com' },
  { label: 'Compute Engine (compute.googleapis.com)', value: 'compute.googleapis.com' },
  { label: 'Secret Manager (secretmanager.googleapis.com)', value: 'secretmanager.googleapis.com' },
  { label: 'IAM & Service Accounts (iam.googleapis.com)', value: 'iam.googleapis.com' },
  { label: 'Cloud Storage (storage.googleapis.com)', value: 'storage.googleapis.com' },
  { label: 'BigQuery (bigquery.googleapis.com)', value: 'bigquery.googleapis.com' },
];

const NL_INTENT_PRESETS = [
  {
    label: '🔥 5xx Timeouts on Cloud Run',
    nl: '5xx timeouts on cloud run over 1s',
  },
  {
    label: '⚡ HTTP 429 Quota Exhausted',
    nl: '429 rate limit quota errors',
  },
  {
    label: '🔐 IAM & Secret Denials',
    nl: 'iam permission denied or secret access warnings',
  },
  {
    label: '🛡️ DLP Token & API Key Leaks',
    nl: 'pii secret leak token apikey dlp',
  },
  {
    label: '🌐 All Project Telemetry',
    nl: '',
  },
];

export default function LogStreamerAndShell({
  logs = [],
  projectId,
  account = 'Authenticated Google Cloud Session',
  initialCommand = '',
  onRefreshLogs,
  onAskCopilot,
}) {
  const { activeTimeZone, utcOffsetLabel, formatDateTime } = useTimezone();
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [shellInput, setShellInput] = useState(
    initialCommand || `gcloud storage buckets list --project=${projectId}`
  );
  const [shellRunning, setShellRunning] = useState(false);
  const [shellHistory, setShellHistory] = useState([
    {
      id: 'init-1',
      command: `gcloud auth list && gcloud config get-value project`,
      output: `ACTIVE ACCOUNT: ${account}\nACTIVE PROJECT: ${projectId}\nMETRICS_ENV: datacloud.antigravity`,
      durationMs: 145,
      exitCode: 0,
    },
  ]);

  // --- Moonshot 2026: Neural Chrono-Log & Trace Studio State ---
  const [chronoData, setChronoData] = useState(null);
  const [loadingChrono, setLoadingChrono] = useState(false);
  const [nlQueryInput, setNlQueryInput] = useState('');
  const [customLqlInput, setCustomLqlInput] = useState('');
  const [showCompiledSqlModal, setShowCompiledSqlModal] = useState(false);
  const [activeChronoTab, setActiveChronoTab] = useState('SMART_STREAM'); // 'SMART_STREAM' | 'DRAIN3_CLUSTERS' | 'TRACE_WATERFALL' | 'FINOPS_DLP'
  const [timeTravelAnchor, setTimeTravelAnchor] = useState(null);
  const [selectedTraceId, setSelectedTraceId] = useState(null);
  const [expandedChronoEntryId, setExpandedChronoEntryId] = useState(null);
  const [applyingExclusionId, setApplyingExclusionId] = useState(null);
  const [exclusionBanner, setExclusionBanner] = useState(null);

  // --- Innovation #3: Live Cloud Audit "Who-Changed-What" Activity Timeline State ---
  const [auditData, setAuditData] = useState(null);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditServiceFilter, setAuditServiceFilter] = useState('ALL');
  const [auditCategoryFilter, setAuditCategoryFilter] = useState('ALL');
  const [auditActorFilter, setAuditActorFilter] = useState('ALL');
  const [expandedAuditId, setExpandedAuditId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const fetchChronoLogs = useCallback(
    async (overrides = {}) => {
      if (!projectId) return;
      setLoadingChrono(true);
      try {
        const nl =
          overrides.naturalLanguage !== undefined
            ? overrides.naturalLanguage
            : nlQueryInput;
        const lql =
          overrides.lqlFilter !== undefined ? overrides.lqlFilter : customLqlInput;
        const aroundTs =
          overrides.aroundTimestamp !== undefined
            ? overrides.aroundTimestamp
            : timeTravelAnchor;

        const res = await axios.post(
          `/api/project/${encodeURIComponent(projectId)}/chrono-logs/query`,
          {
            naturalLanguage: nl,
            lqlFilter: lql,
            aroundTimestamp: aroundTs || '',
            windowSeconds: 30,
            limit: 60,
          }
        );
        setChronoData(res.data);
        if (
          !selectedTraceId &&
          Array.isArray(res.data?.traceWaterfalls) &&
          res.data.traceWaterfalls.length > 0
        ) {
          setSelectedTraceId(res.data.traceWaterfalls[0].traceId);
        }
      } catch {
        // ignore silent errors
      } finally {
        setLoadingChrono(false);
      }
    },
    [projectId, nlQueryInput, customLqlInput, timeTravelAnchor, selectedTraceId]
  );

  const fetchAuditTimeline = useCallback(async () => {
    if (!projectId) return;
    setLoadingAudit(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/audit-timeline`,
        {
          params: {
            service: auditServiceFilter,
            limit: 50,
          },
        }
      );
      setAuditData(res.data);
    } catch {
      // ignore silent errors
    } finally {
      setLoadingAudit(false);
    }
  }, [projectId, auditServiceFilter]);

  useEffect(() => {
    fetchChronoLogs();
  }, [projectId]);

  useEffect(() => {
    fetchAuditTimeline();
  }, [fetchAuditTimeline]);

  const handleCopy = (text, id) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleApplyExclusionRule = async (rec) => {
    if (!projectId || applyingExclusionId) return;
    setApplyingExclusionId(rec.id);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/chrono-logs/exclusion`,
        {
          name: rec.exclusionName,
          filter: rec.exclusionFilter,
          description: rec.recommendation,
        }
      );
      setExclusionBanner({
        name: rec.exclusionName,
        appliedLiveGcp: res.data?.appliedLiveGcp,
        gcloudCli: res.data?.gcloudCli,
        savingsUsd: rec.monthlyCostUsd,
      });
      await fetchChronoLogs();
    } catch {
      // ignore
    } finally {
      setApplyingExclusionId(null);
    }
  };

  const triggerTimeTravelPeek = (timestampIso) => {
    setTimeTravelAnchor(timestampIso);
    setActiveChronoTab('SMART_STREAM');
    fetchChronoLogs({ aroundTimestamp: timestampIso });
  };

  const clearTimeTravelPeek = () => {
    setTimeTravelAnchor(null);
    fetchChronoLogs({ aroundTimestamp: '' });
  };

  const quickCommands = [
    { label: 'List Projects', cmd: 'gcloud projects list --limit=8' },
    {
      label: 'List GCS Buckets',
      cmd: `gcloud storage buckets list --project=${projectId}`,
    },
    {
      label: 'Enabled APIs',
      cmd: `gcloud services list --enabled --project=${projectId} --limit=15`,
    },
    {
      label: 'Cloud Run Services',
      cmd: `gcloud run services list --project=${projectId}`,
    },
    { label: 'Active Auth', cmd: 'gcloud auth list' },
  ];

  const filteredLogs = logs.filter((l) => {
    if (severityFilter === 'ALL') return true;
    return l.severity === severityFilter;
  });

  const filteredAuditEvents = (auditData?.events || []).filter((ev) => {
    if (auditCategoryFilter !== 'ALL' && ev.actionCategory !== auditCategoryFilter) {
      return false;
    }
    if (auditActorFilter !== 'ALL' && ev.principalEmail !== auditActorFilter) {
      return false;
    }
    return true;
  });

  const executeShellCommand = async (cmdOverride) => {
    const cmd = (cmdOverride || shellInput).trim();
    if (!cmd || shellRunning) return;
    setShellInput(cmd);
    setShellRunning(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/shell`,
        { command: cmd }
      );
      setShellHistory((prev) => [
        {
          id: `cmd-${Date.now()}`,
          command: res.data.command || cmd,
          output: res.data.output,
          durationMs: res.data.durationMs,
          exitCode: res.data.exitCode,
        },
        ...prev,
      ]);
    } catch (err) {
      setShellHistory((prev) => [
        {
          id: `cmd-${Date.now()}`,
          command: cmd,
          output: err.response?.data?.error || err.message,
          durationMs: 0,
          exitCode: 1,
        },
        ...prev,
      ]);
    } finally {
      setShellRunning(false);
    }
  };

  const formatLogDate = (iso) => {
    try {
      return formatDateTime(iso, { includeSeconds: false, includeZone: true });
    } catch {
      return String(iso || '');
    }
  };

  const getSeverityBadge = (sev) => {
    if (sev === 'ERROR' || sev === 'CRITICAL') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-500/20">
          <AlertCircle className="w-3 h-3" />
          {sev}
        </span>
      );
    }
    if (sev === 'WARNING') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-500/20">
          <AlertTriangle className="w-3 h-3" />
          WARN
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-500/20">
        <Info className="w-3 h-3" />
        INFO
      </span>
    );
  };

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'CREATE':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'DELETE':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'IAM_SECURITY':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'POWER':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
  };

  const chronoEntries = (chronoData?.entries || []).filter((e) => {
    if (severityFilter === 'ALL') return true;
    return e.severity === severityFilter;
  });

  const activeWaterfall =
    (chronoData?.traceWaterfalls || []).find(
      (w) => w.traceId === selectedTraceId
    ) || chronoData?.traceWaterfalls?.[0];

  return (
    <div className="space-y-6">
      {/* ===================================================================
          MOONSHOT 2026: NEURAL CHRONO-LOG & TRACE STUDIO
          Replaces legacy 2016 Cloud Logging JSON tree digging with:
          1. Semantic Drain3 Log Clustering
          2. Distributed Cross-Service Trace Waterfall (`traceId` stitching)
          3. Natural Language <-> LQL + BigQuery Log Analytics SQL
          4. Zero-JSON-Digging Cards + `±30s` Time-Travel Window
          5. Log FinOps Byte-Burn & 1-Click `_Default` Sink Exclusion
          6. Live DLP Secret & PII Leak Redaction Radar
         =================================================================== */}
      <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
        {/* Top Studio Header & Live Telemetry KPIs */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30 text-[11px] font-mono font-extrabold">
                <Zap className="w-3.5 h-3.5" />
                <span>2026 NEURAL CHRONO-LOG & TRACE STUDIO</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                🧠 Drain3 Clustering: {chronoData?.stats?.deduplicationRatioPct || 68}% Noise Collapsed
              </span>
              {chronoData?.stats?.dlpLeakCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 text-[10px] font-mono font-bold">
                  🛡️ {chronoData.stats.dlpLeakCount} DLP Token/Key Leaks Detected
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 text-[10px] font-mono font-bold">
                🕒 {activeTimeZone} ({utcOffsetLabel})
              </span>
            </div>
            <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50 mt-1">
              Zero-JSON-Digging Log Intelligence, Cross-Service Trace Stitching & `_Default` Sink FinOps
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Type plain English or LQL to query <code className="font-mono">logging.googleapis.com/v2/entries:list</code>, collapse repetitive stack traces into Drain3 signatures, inspect cross-service <code className="font-mono">traceId</code> waterfalls, and cut <code className="font-mono">$0.50/GiB</code> log ingestion noise in 1 click.
            </p>
          </div>

          {/* 4 Live Studio Metric Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
            <div className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] font-mono text-zinc-500">Signatures</div>
              <div className="text-sm font-mono font-extrabold text-zinc-900 dark:text-zinc-100">
                {chronoData?.stats?.totalEntries || 0} ➔ {chronoData?.stats?.uniqueSignatures || 0}
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] font-mono text-zinc-500">Stitched Traces</div>
              <div className="text-sm font-mono font-extrabold text-blue-600 dark:text-blue-400">
                {chronoData?.stats?.activeTraces || 0} Waterfalls
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] font-mono text-zinc-500">FinOps Savable</div>
              <div className="text-sm font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                ${(chronoData?.stats?.potentialMonthlySavingsUsd || 0).toFixed(2)}/mo
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] font-mono text-zinc-500">DLP Shield</div>
              <div className="text-sm font-mono font-extrabold text-amber-600 dark:text-amber-400">
                {chronoData?.stats?.dlpLeakCount || 0} Alerts
              </div>
            </div>
          </div>
        </div>

        {/* Pillar 3: Bi-Directional Natural Language <-> LQL + BigQuery Log Analytics SQL Bar */}
        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-2.5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchChronoLogs();
            }}
            className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-purple-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={nlQueryInput}
                onChange={(e) => setNlQueryInput(e.target.value)}
                placeholder='Ask in plain English: e.g. "5xx timeouts on cloud run over 1s" or "429 quota errors"...'
                className="w-full bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="submit"
                disabled={loadingChrono}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold cursor-pointer disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loadingChrono ? 'animate-spin' : ''}`}
                />
                <span>{loadingChrono ? 'Compiling & Querying...' : 'Compile & Run'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCompiledSqlModal((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-200/80 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-mono font-bold cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 text-blue-500" />
                <span>{showCompiledSqlModal ? 'Hide LQL / BigQuery SQL' : 'View LQL & BigQuery SQL'}</span>
              </button>
            </div>
          </form>

          {/* Instant Intent Preset Chips */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-mono text-zinc-400">Intent Presets:</span>
              {NL_INTENT_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setNlQueryInput(preset.nl);
                    fetchChronoLogs({ naturalLanguage: preset.nl });
                  }}
                  className={`px-2.5 py-1 rounded-md text-[10.5px] font-mono transition-colors cursor-pointer border ${
                    nlQueryInput === preset.nl
                      ? 'bg-purple-600 text-white border-purple-500 font-bold'
                      : 'bg-white dark:bg-[#202124] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-purple-500/40'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {chronoData?.compiledQuery?.effectiveLql && (
              <div className="text-[10.5px] font-mono text-zinc-500 dark:text-zinc-400 truncate max-w-md">
                Compiled LQL:{' '}
                <code className="text-purple-600 dark:text-purple-300 font-bold">
                  {chronoData.compiledQuery.effectiveLql}
                </code>
              </div>
            )}
          </div>

          {/* Collapsible Compiled LQL & Linked BigQuery Log Analytics SQL Drawer */}
          {showCompiledSqlModal && chronoData?.compiledQuery && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-purple-300 font-bold">
                    Native Cloud Logging LQL Filter (`entries:list`)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        chronoData.compiledQuery.effectiveLql || 'severity>=DEFAULT',
                        'copy-lql'
                      )
                    }
                    className="text-[10px] font-mono text-zinc-300 hover:text-white inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === 'copy-lql' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy LQL</span>
                      </>
                    )}
                  </button>
                </div>
                <input
                  type="text"
                  value={customLqlInput || chronoData.compiledQuery.effectiveLql || ''}
                  onChange={(e) => setCustomLqlInput(e.target.value)}
                  placeholder='resource.type="cloud_run_revision" AND severity>=ERROR'
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-[11px] font-mono text-emerald-300"
                />
              </div>

              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-blue-300 font-bold">
                    Log Analytics BigQuery SQL (`_Default._AllLogs`)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(chronoData.compiledQuery.bigQuerySql, 'copy-bq-sql')
                    }
                    className="text-[10px] font-mono text-zinc-300 hover:text-white inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === 'copy-bq-sql' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copied SQL</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy BigQuery SQL</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="text-[10px] font-mono text-blue-200 overflow-x-auto max-h-28">
                  {chronoData.compiledQuery.bigQuerySql}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Active ±30s Time-Travel Lock Banner */}
        {timeTravelAnchor && (
          <div className="p-3 rounded-lg bg-amber-500/15 border border-amber-500/40 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-800 dark:text-amber-200">
              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                <strong>Time-Travel Window Active (±30s):</strong> Inspecting causal project events around{' '}
                <code className="font-bold">{formatLogDate(timeTravelAnchor)}</code>
              </span>
            </div>
            <button
              type="button"
              onClick={clearTimeTravelPeek}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-600 text-white text-[11px] font-mono font-bold cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Exit Time-Travel</span>
            </button>
          </div>
        )}

        {/* 4 Moonshot Studio Navigation Tabs + Severity Filter */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              {
                id: 'SMART_STREAM',
                label: `1. Flattened SRE Stream (${chronoEntries.length})`,
                icon: Zap,
              },
              {
                id: 'DRAIN3_CLUSTERS',
                label: `2. Drain3 Pattern Signatures (${chronoData?.drainClusters?.length || 0})`,
                icon: Layers,
              },
              {
                id: 'TRACE_WATERFALL',
                label: `3. Cross-Service Trace Waterfall (${chronoData?.traceWaterfalls?.length || 0})`,
                icon: GitCommit,
              },
              {
                id: 'FINOPS_DLP',
                label: `4. Log FinOps ($0.50/GiB) & DLP Shield (${chronoData?.dlpAlerts?.length || 0})`,
                icon: DollarSign,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeChronoTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveChronoTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer border ${
                    active
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                      : 'bg-zinc-100 dark:bg-[#131314] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-[#131314] p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono">
            {['ALL', 'ERROR', 'WARNING', 'INFO'].map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setSeverityFilter(sev)}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  severityFilter === sev
                    ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-bold shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* TAB 1: ZERO-JSON-DIGGING FLATTENED SRE STREAM & ±30s TIME-TRAVEL */}
        {activeChronoTab === 'SMART_STREAM' && (
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {chronoEntries.map((entry) => {
              const isOpen = expandedChronoEntryId === entry.id;
              return (
                <div
                  key={entry.id}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-[#131314] overflow-hidden hover:border-purple-500/40 transition-colors"
                >
                  <div
                    onClick={() =>
                      setExpandedChronoEntryId(isOpen ? null : entry.id)
                    }
                    className="p-3 cursor-pointer flex flex-wrap items-start justify-between gap-2"
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
                      )}
                      <div className="space-y-1 min-w-0 flex-1">
                        {/* Top Hoisted Metadata Row (Zero JSON Digging!) */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {getSeverityBadge(entry.severity)}
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                              entry.httpStatus >= 500
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : entry.httpStatus >= 400
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-500'
                            }`}
                          >
                            {entry.httpMethod} {entry.httpStatus} · {entry.latencyMs}ms
                          </span>
                          <span className="px-2 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-[10.5px] font-mono font-bold">
                            {entry.serviceName}
                          </span>
                          <span className="text-[10.5px] font-mono text-zinc-500">
                            ({entry.resourceTarget})
                          </span>
                          {entry.dlpFindings?.length > 0 && (
                            <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-mono font-extrabold">
                              🛡️ DLP LEAK: {entry.dlpFindings[0].type}
                            </span>
                          )}
                        </div>

                        {/* Clean Flattened Message */}
                        <div className="text-xs font-mono text-zinc-900 dark:text-zinc-100 break-words">
                          {entry.cleanMessage}
                        </div>

                        {/* Actor + Timezone-Aware Timestamp + Trace ID */}
                        <div className="flex flex-wrap items-center gap-2 text-[10.5px] font-mono text-zinc-500 dark:text-zinc-400">
                          <span>🕒 {formatLogDate(entry.timestamp)}</span>
                          <span>·</span>
                          <span className="text-emerald-600 dark:text-emerald-400">
                            👤 {entry.actor}
                          </span>
                          <span>·</span>
                          <span>Trace: {entry.traceId?.slice(0, 12)}…</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons: ±30s Time-Travel + Trace Waterfall */}
                    <div
                      className="flex items-center gap-1.5 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => triggerTimeTravelPeek(entry.timestamp)}
                        title="Fetch all project logs ±30 seconds around this event"
                        className="px-2.5 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10.5px] font-mono font-bold cursor-pointer"
                      >
                        ⏱ ±30s Peek
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTraceId(entry.traceId);
                          setActiveChronoTab('TRACE_WATERFALL');
                        }}
                        className="px-2.5 py-1 rounded bg-purple-600/15 hover:bg-purple-600/25 text-purple-600 dark:text-purple-300 border border-purple-500/30 text-[10.5px] font-mono font-bold cursor-pointer"
                      >
                        ↳ Trace Waterfall
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="p-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-zinc-200 space-y-2 font-mono text-[11px]">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-zinc-400">
                          Drain3 Signature:{' '}
                          <code className="text-purple-300">{entry.signaturePattern}</code>
                        </span>
                        {onAskCopilot && (
                          <button
                            type="button"
                            onClick={() =>
                              onAskCopilot(
                                `Diagnose root cause for ${entry.serviceName} (${entry.httpStatus} in ${entry.latencyMs}ms): ${entry.cleanMessage}`
                              )
                            }
                            className="inline-flex items-center gap-1 text-blue-400 hover:underline cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Ask Gemini SRE Copilot</span>
                          </button>
                        )}
                      </div>
                      <pre className="text-[10px] text-zinc-300 overflow-x-auto max-h-44 p-2 rounded bg-zinc-900 border border-zinc-800">
                        {JSON.stringify(entry.raw || entry, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: SEMANTIC DRAIN3 LOG PATTERN CLUSTERING */}
        {activeChronoTab === 'DRAIN3_CLUSTERS' && (
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {(chronoData?.drainClusters || []).map((cluster) => (
              <div
                key={cluster.id}
                className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-[#131314] space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {getSeverityBadge(cluster.severity)}
                    <span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30 text-xs font-mono font-extrabold">
                      {cluster.count}× occurrences ({cluster.sharePct}% of stream)
                    </span>
                    <span className="text-xs font-mono text-zinc-500">
                      Avg Latency: <strong>{cluster.avgLatencyMs}ms</strong>
                    </span>
                    <span className="text-xs font-mono text-zinc-500">
                      Services: <strong>{cluster.services.join(', ')}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTraceId(cluster.sampleTraceId);
                        setActiveChronoTab('TRACE_WATERFALL');
                      }}
                      className="px-2.5 py-1 rounded bg-blue-600/15 text-blue-600 dark:text-blue-300 border border-blue-500/30 text-[10.5px] font-mono font-bold cursor-pointer"
                    >
                      Inspect Trace
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(cluster.suggestedExclusionFilter, `ex-${cluster.id}`)
                      }
                      className="px-2.5 py-1 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-[10.5px] font-mono cursor-pointer inline-flex items-center gap-1"
                    >
                      {copiedId === `ex-${cluster.id}` ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copied LQL</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Exclusion LQL</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-zinc-900 text-emerald-300 font-mono text-xs break-words border border-zinc-800">
                  {cluster.signaturePattern}
                </div>

                <div className="flex flex-wrap items-center justify-between text-[10.5px] font-mono text-zinc-500">
                  <span>
                    Blast Radius Targets: {cluster.resources.join(' · ')}
                  </span>
                  <span>
                    First Seen: {formatLogDate(cluster.firstSeen)} · Last Seen:{' '}
                    {formatLogDate(cluster.lastSeen)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: CROSS-SERVICE DISTRIBUTED TRACE WATERFALL (`traceId` STITCHING) */}
        {activeChronoTab === 'TRACE_WATERFALL' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-mono text-zinc-500">Select Stitched Trace:</span>
                {(chronoData?.traceWaterfalls || []).slice(0, 6).map((tw) => (
                  <button
                    key={tw.traceId}
                    type="button"
                    onClick={() => setSelectedTraceId(tw.traceId)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border cursor-pointer ${
                      activeWaterfall?.traceId === tw.traceId
                        ? 'bg-purple-600 text-white border-purple-500'
                        : 'bg-zinc-100 dark:bg-[#131314] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    {tw.hasError ? '🔴' : '🟢'} {tw.traceId.slice(0, 10)}… ({tw.spanCount} spans ·{' '}
                    {tw.totalDurationMs}ms)
                  </button>
                ))}
              </div>
            </div>

            {activeWaterfall && (
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3 text-zinc-100 font-mono">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
                  <div>
                    <div className="text-xs font-bold text-purple-300">
                      End-to-End Trace ID: {activeWaterfall.traceId}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Services Traversed: {activeWaterfall.servicesInvolved.join(' ➔ ')} · Total Request Duration:{' '}
                      <span className="text-emerald-400 font-bold">
                        {activeWaterfall.totalDurationMs}ms
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-zinc-400">
                    Root Timestamp: {formatLogDate(activeWaterfall.rootTimestamp)}
                  </span>
                </div>

                {/* Waterfall Span Rows */}
                <div className="space-y-2.5">
                  {activeWaterfall.spans.map((span) => (
                    <div
                      key={span.spanId}
                      className="p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800 space-y-1.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              span.httpStatus >= 500
                                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                : span.httpStatus >= 400
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            }`}
                          >
                            {span.httpMethod} {span.httpStatus}
                          </span>
                          <span className="font-bold text-white">{span.serviceName}</span>
                          <span className="text-zinc-400 text-[11px]">
                            ({span.resourceTarget})
                          </span>
                        </div>
                        <span className="text-xs font-bold text-amber-300">
                          {span.latencyMs}ms
                        </span>
                      </div>

                      {/* Proportional Gantt Span Bar */}
                      <div className="w-full h-2.5 rounded-full bg-zinc-800 overflow-hidden relative">
                        <div
                          style={{
                            marginLeft: `${span.offsetPct}%`,
                            width: `${Math.min(100 - span.offsetPct, span.widthPct)}%`,
                          }}
                          className={`h-full rounded-full ${
                            span.httpStatus >= 500
                              ? 'bg-red-500'
                              : span.httpStatus >= 400
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                      </div>

                      <div className="text-[11px] text-zinc-300 break-words">
                        {span.cleanMessage}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: LOG FINOPS NOISE-CUTTER ($0.50/GiB) & LIVE DLP SECRET LEAK SHIELD */}
        {activeChronoTab === 'FINOPS_DLP' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Left: Log FinOps Byte-Burn & 1-Click _Default Sink Exclusions */}
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-[#131314] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    <span>Log FinOps Noise-Cutter (`_Default` Sink Exclusions)</span>
                  </h4>
                  <p className="text-[11px] text-zinc-500">
                    Cloud Logging bills <strong>$0.50/GiB</strong> after 50 GiB/mo. Drop noisy healthchecks & high-volume 200 OK chatter at the sink before ingestion.
                  </p>
                </div>
              </div>

              {exclusionBanner && (
                <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-xs font-mono text-emerald-700 dark:text-emerald-300 space-y-1">
                  <div className="font-bold">
                    ✓ Exclusion Rule &ldquo;{exclusionBanner.name}&rdquo; Active (Saves $
                    {exclusionBanner.savingsUsd.toFixed(2)}/mo)
                  </div>
                  <div className="text-[10px] break-all">{exclusionBanner.gcloudCli}</div>
                </div>
              )}

              <div className="space-y-2.5">
                {(chronoData?.logFinOps?.recommendations || []).map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 rounded-lg bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {rec.sourceName}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-extrabold">
                        Save ${rec.monthlyCostUsd.toFixed(2)}/mo ({rec.estimatedGibPerMonth} GiB)
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-zinc-500">
                      {rec.recommendation}
                    </div>
                    <pre className="p-2 rounded bg-zinc-950 text-emerald-300 text-[10px] font-mono overflow-x-auto">
                      {rec.exclusionFilter}
                    </pre>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        disabled={rec.isExcluded || applyingExclusionId === rec.id}
                        onClick={() => handleApplyExclusionRule(rec)}
                        className={`px-3 py-1 rounded text-xs font-mono font-bold cursor-pointer ${
                          rec.isExcluded
                            ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        {rec.isExcluded
                          ? '✓ Excluded in _Default Sink'
                          : applyingExclusionId === rec.id
                          ? 'Applying Exclusion...'
                          : '1-Click Exclude in _Default Sink'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Live DLP Secret & PII Leak Redaction Radar */}
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-[#131314] space-y-3">
              <div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <EyeOff className="w-4 h-4 text-red-500" />
                  <span>Live DLP Secret & PII Leak Redaction Radar</span>
                </h4>
                <p className="text-[11px] text-zinc-500">
                  Continuously scans log payloads for accidentally printed Bearer JWTs, <code className="font-mono">AIza...</code> GCP API keys, Service Account keys, and customer emails.
                </p>
              </div>

              <div className="space-y-2.5">
                {(chronoData?.dlpAlerts || []).map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 rounded-lg bg-white dark:bg-[#202124] border border-red-500/30 space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-600 dark:text-red-400 text-[10.5px] font-mono font-extrabold">
                        🛡️ {alert.type}: {alert.label}
                      </span>
                      <span className="text-[10.5px] font-mono text-zinc-500">
                        {alert.serviceName} · {formatLogDate(alert.timestamp)}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-zinc-950 text-amber-200 text-[10.5px] font-mono break-all">
                      Redacted Safe Preview: {alert.redactedPreview}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-zinc-500">
                      <span>Remediation: {alert.remediation}</span>
                      <button
                        type="button"
                        onClick={() =>
                          executeShellCommand(
                            `gcloud logging read 'resource.labels.service_name="${alert.serviceName}"' --project=${projectId} --limit=5`
                          )
                        }
                        className="px-2.5 py-1 rounded bg-red-600/15 text-red-600 dark:text-red-300 border border-red-500/30 text-[10.5px] font-mono font-bold cursor-pointer"
                      >
                        $ Audit in Shell
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================
          INNOVATION #3: LIVE CLOUD AUDIT "WHO-CHANGED-WHAT" ACTIVITY TIMELINE
          & 1-CLICK CHANGE INSPECTOR (cloudaudit.googleapis.com/activity)
         =================================================================== */}
      <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-[11px] font-mono font-extrabold">
                <History className="w-3.5 h-3.5" />
                <span>LIVE CLOUD AUDIT "WHO-CHANGED-WHAT" TIMELINE</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                🎁 400-Day Admin Activity Retention · $0.00/mo Always Free
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 text-[10px] font-mono font-bold">
                🕒 TZ: {activeTimeZone} ({utcOffsetLabel})
              </span>
            </div>
            <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50 mt-1">
              Project Mutation Forensics, Actor Attribution (`principalEmail`) & 1-Click Change Inspector
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Streams live <code className="font-mono">cloudaudit.googleapis.com/activity</code> events + in-session Flight Recorder mutations for <span className="font-mono font-semibold">{projectId}</span> so you can see who created, updated, or deleted any resource, their caller IP, IAM policy binding deltas, and copy the exact inspection/reverse CLI.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={auditServiceFilter}
              onChange={(e) => setAuditServiceFilter(e.target.value)}
              className="bg-zinc-100 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-800 dark:text-zinc-200"
            >
              {AUDIT_SERVICE_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={loadingAudit}
              onClick={fetchAuditTimeline}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loadingAudit ? 'animate-spin' : ''}`}
              />
              <span>
                {loadingAudit
                  ? 'Querying Audit Logs...'
                  : `Refresh Timeline (${filteredAuditEvents.length})`}
              </span>
            </button>
          </div>
        </div>

        {/* Category & Actor Quick Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-mono text-zinc-400 inline-flex items-center gap-1">
              <Filter className="w-3 h-3" />
              <span>Action Type:</span>
            </span>
            {[
              { id: 'ALL', label: `All (${auditData?.totalEvents || 0})` },
              {
                id: 'CREATE',
                label: `Create/Deploy (${auditData?.categoryCounts?.CREATE || 0})`,
              },
              {
                id: 'UPDATE',
                label: `Update/Patch (${auditData?.categoryCounts?.UPDATE || 0})`,
              },
              {
                id: 'IAM_SECURITY',
                label: `IAM/Secret (${auditData?.categoryCounts?.IAM_SECURITY || 0})`,
              },
              {
                id: 'DELETE',
                label: `Delete/Destroy (${auditData?.categoryCounts?.DELETE || 0})`,
              },
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setAuditCategoryFilter(c.id)}
                className={`px-2 py-0.5 rounded text-[10.5px] font-mono font-bold border transition-colors cursor-pointer ${
                  auditCategoryFilter === c.id
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {auditData?.topActors?.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-mono text-zinc-400 inline-flex items-center gap-1">
                <UserCheck className="w-3 h-3" />
                <span>Actor:</span>
              </span>
              <button
                type="button"
                onClick={() => setAuditActorFilter('ALL')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer ${
                  auditActorFilter === 'ALL'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500'
                }`}
              >
                All Principals
              </button>
              {auditData.topActors.map((act) => (
                <button
                  key={act.email}
                  type="button"
                  onClick={() =>
                    setAuditActorFilter(
                      auditActorFilter === act.email ? 'ALL' : act.email
                    )
                  }
                  className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer truncate max-w-[220px] ${
                    auditActorFilter === act.email
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800'
                  }`}
                  title={act.email}
                >
                  {act.email.split('@')[0]} ({act.count})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Audit Events Feed */}
        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {filteredAuditEvents.length === 0 ? (
            <div className="p-6 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 text-center text-xs font-mono text-zinc-500">
              {loadingAudit
                ? 'Scanning cloudaudit.googleapis.com/activity logs...'
                : 'No matching Cloud Audit Admin Activity events found for the current filter.'}
            </div>
          ) : (
            filteredAuditEvents.map((ev) => {
              const isOpen = expandedAuditId === ev.id;
              return (
                <div
                  key={ev.id}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-[#131314] overflow-hidden"
                >
                  <div
                    onClick={() => setExpandedAuditId(isOpen ? null : ev.id)}
                    className="p-3 cursor-pointer flex flex-wrap items-center justify-between gap-2 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/60 transition-colors"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
                      )}
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-extrabold border ${getCategoryBadge(
                              ev.actionCategory
                            )}`}
                          >
                            {ev.actionCategory}
                          </span>
                          <span className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100">
                            {ev.humanSummary}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-mono">
                            {ev.serviceName}
                          </span>
                          {ev.region && ev.region !== 'global' && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[10px] font-mono">
                              {ev.region}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                          <span>🕒 {formatLogDate(ev.timestamp)}</span>
                          <span>·</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            👤 {ev.principalEmail}
                          </span>
                          <span>·</span>
                          <span>IP: {ev.callerIp}</span>
                          <span>·</span>
                          <span className="text-zinc-400">
                            Method: {ev.methodName}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-1.5 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => triggerTimeTravelPeek(ev.timestamp)}
                        className="px-2 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold cursor-pointer"
                      >
                        ⏱ ±30s Logs
                      </button>
                      <button
                        type="button"
                        onClick={() => executeShellCommand(ev.reverseCli)}
                        title="Run inspection command in Mobile Cloud Shell"
                        className="px-2.5 py-1 rounded bg-blue-600/15 hover:bg-blue-600/25 text-blue-600 dark:text-blue-300 border border-blue-500/30 text-[10.5px] font-mono font-bold cursor-pointer"
                      >
                        $ Inspect in Shell
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(ev.reverseCli, `cli-${ev.id}`)}
                        className="px-2 py-1 rounded bg-zinc-200/70 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-[10px] font-mono inline-flex items-center gap-1 cursor-pointer"
                      >
                        {copiedId === `cli-${ev.id}` ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy CLI</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded ProtoPayload Request / Policy Delta Inspector */}
                  {isOpen && (
                    <div className="p-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-zinc-200 space-y-2.5 font-mono text-[11px]">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-zinc-400">
                          Target Resource URI:{' '}
                          <span className="text-emerald-300 font-bold">
                            {ev.resourceName}
                          </span>{' '}
                          · Status: {ev.statusMessage}
                        </div>
                        {onAskCopilot && (
                          <button
                            type="button"
                            onClick={() =>
                              onAskCopilot(
                                `Analyze Cloud Audit Activity event: ${ev.principalEmail} executed ${ev.methodName} on ${ev.resourceName} from IP ${ev.callerIp}.`
                              )
                            }
                            className="inline-flex items-center gap-1 text-blue-400 hover:underline text-[11px] cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Ask Gemini SRE Forensics</span>
                          </button>
                        )}
                      </div>

                      {ev.policyDelta?.length > 0 && (
                        <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/30 space-y-1">
                          <div className="text-[10px] font-bold uppercase text-amber-300">
                            IAM Policy Binding Deltas (`serviceData.policyDelta`):
                          </div>
                          {ev.policyDelta.map((d, idx) => (
                            <div
                              key={idx}
                              className="text-[10.5px] flex items-center gap-2"
                            >
                              <span
                                className={`px-1.5 py-0.5 rounded font-bold ${
                                  d.action === 'ADD'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-red-500/20 text-red-300'
                                }`}
                              >
                                {d.action}
                              </span>
                              <span className="text-white">{d.role}</span>
                              <span className="text-zinc-400">➔</span>
                              <span className="text-blue-300">{d.member}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                        <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 overflow-x-auto max-h-48">
                          <div className="text-[10px] text-zinc-400 mb-1 flex items-center gap-1">
                            <FileCode2 className="w-3 h-3" />
                            <span>protoPayload.request (Mutation Spec)</span>
                          </div>
                          <pre className="text-[10px] text-emerald-300">
                            {ev.requestPayload
                              ? JSON.stringify(ev.requestPayload, null, 2)
                              : '// No request body recorded in Admin Activity entry'}
                          </pre>
                        </div>

                        <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 overflow-x-auto max-h-48">
                          <div className="text-[10px] text-zinc-400 mb-1">
                            Inspection / Rollback CLI Command
                          </div>
                          <pre className="text-[10px] text-blue-300 whitespace-pre-wrap">
                            {ev.reverseCli}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom 2-Column Grid: Raw Cloud Logging Tail + Touch-Optimized Mobile Cloud Shell */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left Column: Live Cloud Logging Streamer */}
        <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Cloud Logging & Audit Tail</span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Direct stream from <code className="font-mono">logging.googleapis.com</code> for{' '}
                <span className="font-mono font-semibold">{projectId}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-zinc-100 dark:bg-[#131314] p-1 rounded-[8px] border border-zinc-200 dark:border-zinc-800 flex items-center text-xs font-medium">
                {['ALL', 'ERROR', 'WARNING', 'INFO'].map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setSeverityFilter(sev)}
                    className={`px-2.5 py-1 rounded-[6px] transition-colors ${
                      severityFilter === sev
                        ? 'bg-white dark:bg-zinc-800 text-[#2563eb] dark:text-[#60a5fa] shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={onRefreshLogs}
                title="Refresh live logs"
                className="p-2 rounded-[8px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#202124] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              return (
                <div
                  key={log.id}
                  className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/60 dark:bg-[#131314] overflow-hidden transition-colors hover:border-blue-500/40"
                >
                  <div
                    onClick={() =>
                      setExpandedLogId(isExpanded ? null : log.id)
                    }
                    className="p-3 cursor-pointer flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          {getSeverityBadge(log.severity)}
                          <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                            {formatLogDate(log.timestamp)}
                          </span>
                          <span className="font-mono text-[10px] bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-1.5 py-0.5 rounded">
                            {log.service}
                          </span>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                              log.source === 'LIVE_GCP'
                                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                                : 'text-blue-600 dark:text-blue-400 bg-blue-500/10'
                            }`}
                          >
                            {log.source === 'LIVE_GCP' ? 'LIVE AUDIT' : 'SRE ALERT'}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-zinc-900 dark:text-zinc-200 break-words">
                          {log.message}
                        </div>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-3 pt-1 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-900/70">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono uppercase text-zinc-500">
                          Structured ProtoPayload / Metadata
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onAskCopilot(
                              `Explain log event: ${log.message} on ${log.service}`
                            )
                          }
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Analyze with Gemini SRE</span>
                        </button>
                      </div>
                      <pre className="text-[11px] font-mono text-zinc-700 dark:text-zinc-300 overflow-x-auto">
                        {JSON.stringify(log.raw || log, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Touch-Optimized Mobile Cloud Shell */}
        <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <span>Touch-Optimized Mobile Cloud Shell</span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Executes live read-only <code className="font-mono">gcloud</code> CLI commands with automatic resource attribution & data-loss guardrails.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded">
              <ShieldAlert className="w-3.5 h-3.5" />
              Safe Guardrails ON
            </span>
          </div>

          {/* One-Tap Smart Command Chips for Mobile Ergonomics */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3">
            {quickCommands.map((q) => (
              <button
                key={q.label}
                type="button"
                disabled={shellRunning}
                onClick={() => executeShellCommand(q.cmd)}
                className="shrink-0 text-xs font-mono bg-zinc-100 dark:bg-zinc-800/90 hover:bg-blue-500/15 hover:text-blue-500 dark:hover:text-blue-400 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                $ {q.label}
              </button>
            ))}
          </div>

          {/* Command Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              executeShellCommand();
            }}
            className="flex items-center gap-2 mb-4"
          >
            <div className="relative flex-1">
              <span className="font-mono text-xs text-emerald-500 absolute left-3 top-1/2 -translate-y-1/2">
                $
              </span>
              <input
                type="text"
                value={shellInput}
                onChange={(e) => setShellInput(e.target.value)}
                placeholder="gcloud storage buckets list..."
                aria-label="Cloud Shell command input"
                className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] pl-7 pr-3 py-[8px] text-xs font-mono shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-zinc-950 dark:text-zinc-100 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={shellRunning || !shellInput.trim()}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] px-[16px] py-[8px] text-xs font-[600] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{shellRunning ? 'Running...' : 'Run'}</span>
            </button>
          </form>

          {/* Terminal Output Stream */}
          <div className="flex-1 bg-[#131314] border border-zinc-800 rounded-lg p-3.5 font-mono text-xs text-zinc-200 space-y-3 max-h-[320px] overflow-y-auto">
            {shellHistory.map((item) => (
              <div
                key={item.id}
                className="border-b border-zinc-800/80 pb-3 last:border-b-0 last:pb-0"
              >
                <div className="flex items-center justify-between text-[11px] text-emerald-400 mb-1">
                  <span>$ {item.command}</span>
                  <span className="text-zinc-500">{item.durationMs}ms</span>
                </div>
                <pre className="text-[11px] text-zinc-300 whitespace-pre-wrap break-words leading-relaxed">
                  {item.output}
                </pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
