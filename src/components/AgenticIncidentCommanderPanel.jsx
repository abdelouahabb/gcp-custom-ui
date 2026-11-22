import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  ShieldAlert,
  RefreshCw,
  Sparkles,
  Activity,
  Database,
  Server,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import MermaidArchitectureDiagram from './MermaidArchitectureDiagram';

export default function AgenticIncidentCommanderPanel({
  projectId,
  onRunInShell,
  onShowToast,
  onShowError,
}) {
  const [lookbackHours, setLookbackHours] = useState(24);
  const [geminiModel, setGeminiModel] = useState('gemini-4-neon');
  const [scanning, setScanning] = useState(false);
  const [report, setReport] = useState(null);
  const [fixingId, setFixingId] = useState(null);

  const runCommander = useCallback(
    async (withGemini = false) => {
      if (!projectId) return;
      setScanning(true);
      try {
        const { data } = await axios.post(
          `/api/project/${encodeURIComponent(projectId)}/sre/agentic-commander`,
          { lookbackHours, withGemini, geminiModel }
        );
        setReport(data);
        if (withGemini) {
          onShowToast?.(
            `Gemini 4 Incident Commander SITREP ready (${data.counts?.logErrors || 0} log errors · ${data.counts?.failedBqJobs || 0} failed BQ jobs · ${data.durationMs}ms).`
          );
        }
      } catch (err) {
        onShowError?.(
          err?.response?.data?.error || err.message || 'Agentic Incident Commander scan failed.'
        );
      } finally {
        setScanning(false);
      }
    },
    [projectId, lookbackHours, geminiModel, onShowToast, onShowError]
  );

  useEffect(() => {
    runCommander(false);
  }, [runCommander]);

  const handleAutoFixBqSa = async (rem) => {
    if (!projectId || !rem?.serviceAccountEmail) return;
    setFixingId(rem.id);
    try {
      const { data } = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/bigquery/grant-connection-sa-roles`,
        {
          serviceAccountEmail: rem.serviceAccountEmail,
          roles: ['roles/aiplatform.user', 'roles/storage.objectViewer'],
        }
      );
      onShowToast?.(data?.message || `Granted IAM roles to ${rem.serviceAccountEmail}.`);
    } catch (err) {
      if (err?.code === 'CLOUDPULSE_DESTRUCTIVE_CANCELLED') return;
      onShowError?.(err?.response?.data?.error || err.message || 'IAM auto-remediation failed.');
    } finally {
      setFixingId(null);
    }
  };

  return (
    <div className="p-5 rounded-2xl border border-amber-500/35 bg-white dark:bg-[#10141d] shadow-sm space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3.5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
            <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-100">
              Live Agentic Incident War-Room (Gemini 4 3-Stream Root-Cause Commander)
            </h3>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Correlates live <strong>Cloud Logging Errors</strong>, <strong>Failed BigQuery Jobs</strong>, and <strong>Cloud Run Revision Drift</strong> into a causal Mermaid graph with 1-click IAM &amp; rollback remediation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={lookbackHours}
            onChange={(e) => setLookbackHours(Number(e.target.value))}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 font-mono text-xs text-zinc-900 dark:text-zinc-100"
          >
            <option value={1}>Last 1h</option>
            <option value={6}>Last 6h</option>
            <option value={24}>Last 24h</option>
            <option value={72}>Last 72h</option>
          </select>
          <select
            value={geminiModel}
            onChange={(e) => setGeminiModel(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 font-mono text-xs text-zinc-900 dark:text-zinc-100"
          >
            <option value="gemini-4-neon">gemini-4-neon</option>
            <option value="gemini-3.8-flash-cyber">gemini-3.8-flash-cyber</option>
            <option value="gemini-4-carbon">gemini-4-carbon</option>
            <option value="gemini-4-argon">gemini-4-argon</option>
          </select>
          <button
            type="button"
            disabled={scanning}
            onClick={() => runCommander(false)}
            className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
            <span>Correlate Streams</span>
          </button>
          <button
            type="button"
            disabled={scanning}
            onClick={() => runCommander(true)}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{scanning ? 'Correlating...' : 'Generate Gemini 4 SITREP'}</span>
          </button>
        </div>
      </div>

      {report && (
        <div className="space-y-3.5">
          {/* 3-Stream KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-zinc-700 dark:text-zinc-300">
                <Activity className="w-3.5 h-3.5 text-amber-500" />
                Cloud Logging Errors ({report.lookbackHours}h)
              </span>
              <span className={`text-sm font-black ${report.counts.logErrors > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                {report.counts.logErrors}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-zinc-700 dark:text-zinc-300">
                <Database className="w-3.5 h-3.5 text-amber-500" />
                Failed BigQuery Jobs
              </span>
              <span className={`text-sm font-black ${report.counts.failedBqJobs > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                {report.counts.failedBqJobs}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-zinc-700 dark:text-zinc-300">
                <Server className="w-3.5 h-3.5 text-amber-500" />
                Cloud Run Degraded / Total
              </span>
              <span className={`text-sm font-black ${report.counts.degradedRunServices > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                {report.counts.degradedRunServices} / {report.counts.totalRunServices}
              </span>
            </div>
          </div>

          {report.mermaidCausalGraph && (
            <MermaidArchitectureDiagram
              code={report.mermaidCausalGraph}
              title="Live Causal Incident Topology"
            />
          )}

          {report.sitrep?.text && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/35 space-y-1 text-xs">
              <div className="text-[10.5px] font-mono font-bold uppercase text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Gemini 4 Incident Commander SITREP ({report.sitrep.modelUsed})</span>
              </div>
              <div className="text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap leading-relaxed">
                {report.sitrep.text}
              </div>
            </div>
          )}

          {Array.isArray(report.detectedRemediations) && report.detectedRemediations.length > 0 ? (
            <div className="space-y-2">
              <div className="text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400">
                Automated 1-Click Remediations ({report.detectedRemediations.length})
              </div>
              {report.detectedRemediations.map((rem) => (
                <div
                  key={rem.id}
                  className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{rem.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {rem.type === 'IAM_AUTO_FIX' && (
                      <button
                        type="button"
                        disabled={fixingId === rem.id}
                        onClick={() => handleAutoFixBqSa(rem)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{fixingId === rem.id ? 'Granting...' : '1-Click Grant IAM'}</span>
                      </button>
                    )}
                    {typeof onRunInShell === 'function' && rem.gcloudCmd && (
                      <button
                        type="button"
                        onClick={() => onRunInShell(rem.gcloudCmd)}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-mono font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Terminal className="w-3.5 h-3.5 text-amber-500" />
                        Run Rollback CLI
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Zero critical Cloud Run revision drift or BigQuery IAM blockers detected in the last {report.lookbackHours}h.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
