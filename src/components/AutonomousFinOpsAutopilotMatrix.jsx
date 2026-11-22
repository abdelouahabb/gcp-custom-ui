import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  DollarSign,
  RefreshCw,
  Sparkles,
  Database,
  Flame,
  FileText,
  Server,
  ShieldCheck,
  Terminal,
  Copy,
  Check,
  Download,
  Zap,
  CheckCircle2,
} from 'lucide-react';

export default function AutonomousFinOpsAutopilotMatrix({
  projectId,
  onRunInShell,
  onShowToast,
  onShowError,
}) {
  const [region, setRegion] = useState('us-central1');
  const [scanning, setScanning] = useState(false);
  const [report, setReport] = useState(null);
  const [engineFilter, setEngineFilter] = useState('ALL');
  const [applyingExclusion, setApplyingExclusion] = useState(false);
  const [exclusionReceipt, setExclusionReceipt] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const runScan = useCallback(
    async (withGemini = false) => {
      if (!projectId) return;
      setScanning(true);
      try {
        const { data } = await axios.post(
          `/api/project/${encodeURIComponent(projectId)}/finops/autopilot-matrix`,
          {
            action: 'SCAN',
            region,
            withGemini,
            geminiModel: 'gemini-4-neon',
          }
        );
        setReport(data);
        if (withGemini) {
          onShowToast?.(
            `Autonomous FinOps + Gemini 4 CFO Plan ready ($${data.totalMonthlySavingsUsd}/mo savings identified).`
          );
        }
      } catch (err) {
        onShowError?.(
          err?.response?.data?.error || err.message || 'Autonomous FinOps Autopilot scan failed.'
        );
      } finally {
        setScanning(false);
      }
    },
    [projectId, region, onShowToast, onShowError]
  );

  useEffect(() => {
    runScan(false);
  }, [runScan]);

  const handleApplyLogExclusion = async () => {
    if (!projectId) return;
    setApplyingExclusion(true);
    try {
      const { data } = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/finops/autopilot-matrix`,
        {
          action: 'APPLY_LOG_EXCLUSION',
          region,
          exclusionName: 'cloudpulse-drop-noisy-debug-healthchecks',
          exclusionFilter: 'severity="DEBUG" OR httpRequest.userAgent:"GoogleHC"',
        }
      );
      setExclusionReceipt(data);
      onShowToast?.(
        `Applied live _Default log exclusion "${data.exclusionName}" (${data.durationMs}ms)!`
      );
      runScan(false);
    } catch (err) {
      if (err?.code === 'CLOUDPULSE_DESTRUCTIVE_CANCELLED') return;
      onShowError?.(
        err?.response?.data?.error || err.message || 'Failed to update _Default Cloud Logging sink.'
      );
    } finally {
      setApplyingExclusion(false);
    }
  };

  const exportTerraformBundle = () => {
    if (!report?.actions?.length) return;
    const hcl = [
      `# CloudPulse 2026 — Autonomous FinOps Autopilot Remediation Bundle`,
      `# Project: ${projectId} | Est. Monthly Savings: $${report.totalMonthlySavingsUsd}/mo`,
      '',
      ...report.actions.map((a) => `# === ${a.engine}: ${a.title} ($${a.estMonthlySavingsUsd}/mo) ===\n${a.terraformHcl}\n`),
    ].join('\n');
    const blob = new Blob([hcl], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cloudpulse-finops-autopilot-${projectId}.tf`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast?.(`Exported cloudpulse-finops-autopilot-${projectId}.tf`);
  };

  const engineMeta = [
    { key: 'bigquery', icon: Database },
    { key: 'spark', icon: Flame },
    { key: 'logging', icon: FileText },
    { key: 'compute', icon: Server },
    { key: 'databases', icon: ShieldCheck },
  ];

  const filteredActions = (report?.actions || []).filter(
    (a) => engineFilter === 'ALL' || a.engine === engineFilter
  );

  return (
    <div className="p-5 rounded-2xl border border-amber-500/35 bg-white dark:bg-[#10141d] shadow-sm space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3.5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500 shrink-0" />
            <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-100">
              Autonomous FinOps Autopilot &amp; 5-Engine Cost-Kill Matrix
            </h3>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Live parallel telemetry across <strong>BigQuery</strong>, <strong>Managed Spark</strong>, <strong>Cloud Logging (_Default)</strong>, <strong>Compute/Disks</strong>, and <strong>AlloyDB / Cloud SQL</strong> — with 1-click live remediation and Terraform export.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 font-mono text-xs text-zinc-900 dark:text-zinc-100"
          >
            <option value="us-central1">us-central1</option>
            <option value="us-east1">us-east1</option>
            <option value="europe-west1">europe-west1</option>
            <option value="europe-west4">europe-west4</option>
          </select>
          <button
            type="button"
            disabled={scanning}
            onClick={() => runScan(false)}
            className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
            <span>Rescan 5 Engines</span>
          </button>
          <button
            type="button"
            disabled={scanning}
            onClick={() => runScan(true)}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{scanning ? 'Scanning...' : 'Scan + Gemini 4 CFO Plan'}</span>
          </button>
          {report?.actions?.length > 0 && (
            <button
              type="button"
              onClick={exportTerraformBundle}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-mono font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export .tf
            </button>
          )}
        </div>
      </div>

      {/* Savings Banner + 5 Live Engine Cards */}
      {report && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/35 flex flex-col justify-between">
              <div className="text-[10px] font-mono uppercase font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                Est. Recoverable Spend
              </div>
              <div className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-300">
                ${report.totalMonthlySavingsUsd}/mo
              </div>
              <div className="text-[10.5px] font-mono text-zinc-600 dark:text-zinc-400">
                ${report.totalAnnualSavingsUsd}/yr annualized
              </div>
            </div>

            {engineMeta.map(({ key, icon: Icon }) => {
              const e = report.engines?.[key];
              if (!e) return null;
              return (
                <div
                  key={key}
                  className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between gap-1"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    <span className="flex items-center gap-1.5 truncate">
                      <Icon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      {e.label}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono font-bold text-zinc-800 dark:text-zinc-200">
                    {e.count}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500 truncate" title={e.wasteSignal}>
                    {e.wasteSignal}
                  </div>
                </div>
              );
            })}
          </div>

          {report.geminiPlan?.text && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/35 space-y-1 text-xs">
              <div className="text-[10.5px] font-mono font-bold uppercase text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Gemini 4 Executive CFO Action Plan ({report.geminiPlan.modelUsed})</span>
              </div>
              <div className="text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap leading-relaxed">
                {report.geminiPlan.text}
              </div>
            </div>
          )}

          {exclusionReceipt?.ok && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/35 text-xs font-mono text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>
                Live _Default sink updated: exclusion <code>{exclusionReceipt.exclusionName}</code> active ({exclusionReceipt.totalExclusions} total exclusions).
              </span>
            </div>
          )}

          {/* Engine Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {['ALL', ...Array.from(new Set((report.actions || []).map((a) => a.engine)))].map((eng) => (
              <button
                key={eng}
                type="button"
                onClick={() => setEngineFilter(eng)}
                className={`px-2.5 py-1 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                  engineFilter === eng
                    ? 'border-amber-500 bg-amber-500/15 text-amber-900 dark:text-amber-100'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {eng}
              </button>
            ))}
          </div>

          {/* Prioritized Cost-Kill Remediation Queue */}
          <div className="space-y-2.5">
            {filteredActions.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-800 dark:text-amber-200 text-[10px] font-mono font-bold">
                      {item.engine}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-extrabold">
                      Save ~${item.estMonthlySavingsUsd}/mo
                    </span>
                    <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                      {item.title}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-600 dark:text-zinc-400">{item.reason}</div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {item.canApplyLive && (
                    <button
                      type="button"
                      disabled={applyingExclusion}
                      onClick={handleApplyLogExclusion}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      {applyingExclusion ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Zap className="w-3.5 h-3.5" />
                      )}
                      <span>1-Click Apply Live</span>
                    </button>
                  )}
                  {typeof onRunInShell === 'function' && item.gcloudCmd && (
                    <button
                      type="button"
                      onClick={() => onRunInShell(item.gcloudCmd)}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-mono font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Terminal className="w-3.5 h-3.5 text-amber-500" />
                      Run CLI
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(item.gcloudCmd || item.terraformHcl || '');
                      setCopiedId(item.id);
                      onShowToast?.(`Copied remediation command for ${item.engine}`);
                      setTimeout(() => setCopiedId(null), 1600);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-mono font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    Copy
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
