import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
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

  // --- Innovation #3: Live Cloud Audit "Who-Changed-What" Activity Timeline State ---
  const [auditData, setAuditData] = useState(null);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditServiceFilter, setAuditServiceFilter] = useState('ALL');
  const [auditCategoryFilter, setAuditCategoryFilter] = useState('ALL');
  const [auditActorFilter, setAuditActorFilter] = useState('ALL');
  const [expandedAuditId, setExpandedAuditId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

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
    fetchAuditTimeline();
  }, [fetchAuditTimeline]);

  const handleCopy = (text, id) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
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
      return formatDateTime(iso, { includeSeconds: true, includeZone: true });
    } catch {
      return format(new Date(), 'MMM dd, yyyy HH:mm:ss');
    }
  };

  const getSeverityBadge = (sev) => {
    if (sev === 'ERROR') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-500/20">
          <AlertCircle className="w-3 h-3" />
          ERROR
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

  return (
    <div className="space-y-6">
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
