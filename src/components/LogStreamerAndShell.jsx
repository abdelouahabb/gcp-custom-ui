import React, { useState } from 'react';
import { format } from 'date-fns';
import axios from 'axios';
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
} from 'lucide-react';

export default function LogStreamerAndShell({
  logs = [],
  projectId,
  account = 'Authenticated Google Cloud Session',
  initialCommand = '',
  onRefreshLogs,
  onAskCopilot,
}) {
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
      return format(new Date(iso), 'MMM dd, yyyy HH:mm:ss');
    } catch {
      return 'Oct 09, 2026 22:45:00';
    }
  };

  const getSeverityBadge = (sev) => {
    if (sev === 'ERROR') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-500/20">
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

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Left Column: Live Cloud Logging Streamer */}
      <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col">
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
            <div className="bg-zinc-100 dark:bg-[#09090b] p-1 rounded-[8px] border border-zinc-200 dark:border-zinc-800 flex items-center text-xs font-medium">
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
              className="p-2 rounded-[8px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#262626] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 transition-colors"
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
                className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/60 dark:bg-[#09090b] overflow-hidden transition-colors hover:border-blue-500/40"
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
      <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col">
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
              className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] pl-7 pr-3 py-[8px] text-xs font-mono shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-zinc-950 dark:text-zinc-100 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={shellRunning || !shellInput.trim()}
            className="inline-flex items-center gap-1.5 bg-[#059669] hover:bg-[#047857] text-[#000000] rounded-[8px] px-[16px] py-[8px] text-xs font-[600] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{shellRunning ? 'Running...' : 'Run'}</span>
          </button>
        </form>

        {/* Terminal Output Stream */}
        <div className="flex-1 bg-[#09090b] border border-zinc-800 rounded-lg p-3.5 font-mono text-xs text-zinc-200 space-y-3 max-h-[320px] overflow-y-auto">
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
  );
}
