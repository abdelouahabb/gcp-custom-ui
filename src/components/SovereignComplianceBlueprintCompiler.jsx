import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  ShieldCheck,
  RefreshCw,
  Download,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Lock,
} from 'lucide-react';

export default function SovereignComplianceBlueprintCompiler({
  projectId,
  onShowToast,
  onShowError,
}) {
  const [region, setRegion] = useState('europe-west1');
  const [scanning, setScanning] = useState(false);
  const [report, setReport] = useState(null);
  const [copiedTf, setCopiedTf] = useState(false);

  const runAudit = useCallback(async () => {
    if (!projectId) return;
    setScanning(true);
    try {
      const { data } = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/sovereign/compliance-blueprint`,
        { region }
      );
      setReport(data);
    } catch (err) {
      onShowError?.(
        err?.response?.data?.error || err.message || 'Sovereign Compliance Blueprint scan failed.'
      );
    } finally {
      setScanning(false);
    }
  }, [projectId, region, onShowError]);

  useEffect(() => {
    runAudit();
  }, [runAudit]);

  const downloadFile = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast?.(`Exported ${filename}`);
  };

  return (
    <div className="p-5 rounded-2xl border border-amber-500/35 bg-white dark:bg-[#10141d] shadow-sm space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3.5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-500 shrink-0" />
            <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-100">
              Live Sovereign Cloud &amp; DORA / GDPR Compliance Blueprint Compiler
            </h3>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Audits 5 live controls (<strong>Cloud KMS CMEK/EKM</strong>, <strong>GCS PAP/UBLA</strong>, <strong>VPC Private Access</strong>, <strong>IAM Least-Privilege</strong>, <strong>BigQuery Residency</strong>) and compiles a board-ready Dossier (<code>.md</code>) + Terraform bundle (<code>.tf</code>).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 font-mono text-xs text-zinc-900 dark:text-zinc-100"
          >
            <option value="europe-west1">europe-west1 (EU)</option>
            <option value="europe-west3">europe-west3 (Frankfurt)</option>
            <option value="europe-west9">europe-west9 (Paris)</option>
            <option value="us-central1">us-central1</option>
          </select>
          <button
            type="button"
            disabled={scanning}
            onClick={runAudit}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
            <span>{scanning ? 'Auditing 5 Controls...' : 'Run Sovereign Audit'}</span>
          </button>
          {report?.dossierMarkdown && (
            <button
              type="button"
              onClick={() => downloadFile(report.dossierMarkdown, `sovereign-dossier-${projectId}.md`)}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-mono font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              Dossier .md
            </button>
          )}
          {report?.terraformBundle && (
            <button
              type="button"
              onClick={() => downloadFile(report.terraformBundle, `sovereign-remediation-${projectId}.tf`)}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-mono font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-500" />
              Terraform .tf
            </button>
          )}
        </div>
      </div>

      {report && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 text-xs font-mono">
            <span className="flex items-center gap-2 font-extrabold text-zinc-900 dark:text-zinc-100">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              Sovereign Readiness Score: {report.score}/100 ({report.passedCount}/{report.totalControls} controls passing in {report.region})
            </span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(report.terraformBundle || '');
                setCopiedTf(true);
                onShowToast?.('Copied Sovereign Terraform HCL');
                setTimeout(() => setCopiedTf(false), 1600);
              }}
              className="px-2 py-1 rounded bg-zinc-200/70 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              {copiedTf ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              Copy HCL
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {(report.controls || []).map((c) => {
              const pass = c.status === 'PASS';
              return (
                <div
                  key={c.id}
                  className={`p-3 rounded-xl border space-y-1.5 text-xs ${
                    pass
                      ? 'border-emerald-500/35 bg-emerald-500/[0.05]'
                      : 'border-amber-500/35 bg-amber-500/[0.05]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold text-zinc-500">{c.regulation}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold ${
                        pass
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-500/20 text-amber-800 dark:text-amber-200'
                      }`}
                    >
                      {pass ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {c.status}
                    </span>
                  </div>
                  <div className="font-extrabold text-zinc-900 dark:text-zinc-100">{c.title}</div>
                  <div className="font-mono text-[10.5px] text-zinc-700 dark:text-zinc-300">{c.evidence}</div>
                  {!pass && (
                    <div className="text-[10.5px] text-amber-800 dark:text-amber-300">{c.remediation}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
