import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  FileText,
  RefreshCw,
  Loader2,
  Trash2,
  Download,
  Search,
  Power,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

const LOG_LEVELS = [
  {
    id: 'ERRORS_ONLY',
    label: 'Errors Only',
    desc: 'Only log failed API actions (HTTP 4xx/5xx).',
  },
  {
    id: 'MUTATIONS_ONLY',
    label: 'Mutations Only',
    desc: 'Log creates, updates, deletes & errors (skip read-only scans).',
  },
  {
    id: 'ALL_API',
    label: 'All API Calls',
    desc: 'Log every POST/PATCH/PUT/DELETE including scans & AI queries.',
  },
];

function formatBytes(bytes) {
  const b = Number(bytes || 0);
  if (b >= 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(2)} MB`;
  if (b >= 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${b} B`;
}

export default function LocalAuditLogPanel({ onShowToast, onShowError }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(null);
  const [query, setQuery] = useState('');

  const fetchLog = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/local-audit-log?limit=80');
      setData(res.data || null);
    } catch (e) {
      onShowError?.(e.response?.data?.error || e.message || 'Failed to load local audit log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLog();
  }, []);

  const updateConfig = async (patch) => {
    if (!data?.config) return;
    setSaving(true);
    try {
      const next = { ...data.config, ...patch };
      const res = await axios.post('/api/local-audit-log/config', next);
      setData((prev) => (prev ? { ...prev, config: res.data?.config || next } : prev));
      onShowToast?.(
        res.data?.config?.enabled
          ? `Local action logging ON (${res.data?.config?.level}).`
          : 'Local action logging paused (OFF).'
      );
    } catch (e) {
      onShowError?.(e.response?.data?.error || e.message || 'Failed to update logger settings');
    } finally {
      setSaving(false);
    }
  };

  const handleClearLog = async () => {
    setSaving(true);
    try {
      await axios.post('/api/local-audit-log/config', { action: 'CLEAR' });
      onShowToast?.('Cleared local .cloudpulse-logs/cloud-actions.log.');
      fetchLog();
    } catch (e) {
      if (e?.__cancelledByGatekeeper) return;
      onShowError?.(e.response?.data?.error || e.message || 'Failed to clear local audit log');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadJsonl = () => {
    const entries = data?.entries || [];
    const blob = new Blob([entries.map((e) => JSON.stringify(e)).join('\n') + '\n'], {
      type: 'application/x-ndjson',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cloudpulse-actions-${new Date().toISOString().slice(0, 10)}.jsonl`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cfg = data?.config || { enabled: true, level: 'MUTATIONS_ONLY' };
  const pctUsed = data?.maxBytes ? Math.min(100, (data.fileSizeBytes / data.maxBytes) * 100) : 0;
  const filteredEntries = (data?.entries || []).filter((e) => {
    if (!query.trim()) return true;
    return JSON.stringify(e).toLowerCase().includes(query.trim().toLowerCase());
  });

  return (
    <section className="rounded-xl border border-zinc-200 dark:border-[#1e2433] bg-white dark:bg-[#0d111a] p-5 shadow-2xs space-y-5">
      {/* Header + Master ON/OFF Control */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Local Cloud Actions Audit Log (10 MB Rotating · Git-Ignored)
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Saved locally to <code className="font-mono">.cloudpulse-logs/cloud-actions.log</code> with secrets redacted. Choose whether to log and at which verbosity level.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => updateConfig({ enabled: !cfg.enabled })}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition cursor-pointer ${
              cfg.enabled
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{cfg.enabled ? 'Logging: ON' : 'Logging: OFF'}</span>
          </button>

          <button
            type="button"
            onClick={fetchLog}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-[#242c3f] text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#161e2e] cursor-pointer"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Refresh
          </button>

          <button
            type="button"
            onClick={handleDownloadJsonl}
            disabled={!data?.entries?.length}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-[#242c3f] text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#161e2e] disabled:opacity-40 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export .jsonl
          </button>

          <button
            type="button"
            onClick={handleClearLog}
            disabled={saving || !data?.entries?.length}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-red-500/30 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 disabled:opacity-40 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* Level Picker (3 Clear Options) + 10MB Rotation Meter */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {LOG_LEVELS.map((lvl) => {
          const active = cfg.level === lvl.id;
          return (
            <button
              key={lvl.id}
              type="button"
              disabled={saving || !cfg.enabled}
              onClick={() => updateConfig({ level: lvl.id })}
              className={`text-left rounded-lg border p-3 transition cursor-pointer disabled:opacity-45 ${
                active && cfg.enabled
                  ? 'border-amber-500 bg-amber-500/12'
                  : 'border-zinc-200 dark:border-[#1e2433] bg-zinc-50/70 dark:bg-[#0a0e17] hover:border-zinc-300 dark:hover:border-[#2c364d]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{lvl.label}</span>
                {active && cfg.enabled && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-amber-500 text-zinc-950">
                    Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">{lvl.desc}</p>
            </button>
          );
        })}

        <div className="rounded-lg border border-zinc-200 dark:border-[#1e2433] bg-zinc-50/70 dark:bg-[#0a0e17] p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Rotation Budget
            </span>
            <span>{data?.archiveCount || 0} / {data?.maxRotations || 5} archives</span>
          </div>
          <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-1">
            {formatBytes(data?.fileSizeBytes)} / 10 MB
          </div>
          <div className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden mt-1.5">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.max(2, pctUsed)}%` }} />
          </div>
        </div>
      </div>

      {/* Filter + Live Entries Table */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter logged actions by project, endpoint, cluster name, or status..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-zinc-200 dark:border-[#1e2433] bg-zinc-50 dark:bg-[#080b12] text-xs text-zinc-900 dark:text-zinc-100"
          />
        </div>

        {filteredEntries.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 dark:border-[#242c3f] p-4 text-xs text-zinc-500 text-center">
            {cfg.enabled
              ? 'No matching local audit entries yet. Actions you run in CloudPulse (creating clusters, VMs, IAM updates, etc.) will appear here automatically.'
              : 'Local action logging is currently paused (OFF). Toggle Logging: ON above to record actions.'}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-[#1e2433]">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-[#0a0e17] text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-[#1e2433]">
                <tr>
                  <th className="px-3 py-2 font-medium">Time</th>
                  <th className="px-3 py-2 font-medium">Level</th>
                  <th className="px-3 py-2 font-medium">Method &amp; Endpoint</th>
                  <th className="px-3 py-2 font-medium">Action / Target</th>
                  <th className="px-3 py-2 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-[#1e2433]">
                {filteredEntries.map((e, idx) => {
                  const isErr = Number(e.status) >= 400;
                  return (
                    <tr key={`${e.ts}-${idx}`} className="hover:bg-zinc-50/70 dark:hover:bg-[#111726]">
                      <td className="px-3 py-2 font-mono text-[11px] text-zinc-500 whitespace-nowrap">
                        {String(e.ts || '').slice(0, 19).replace('T', ' ')}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isErr
                              ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                              : e.level === 'MUTATION'
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                          }`}
                        >
                          {isErr ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                          {e.level || (isErr ? 'ERROR' : 'API')}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-zinc-800 dark:text-zinc-200">
                        <span className="font-bold mr-1.5">{e.method}</span>
                        <span>{e.path}</span>
                      </td>
                      <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                        {e.action && <span className="font-semibold mr-1.5">{e.action}</span>}
                        {e.target && <span className="text-zinc-500">{e.target}</span>}
                        {!e.action && !e.target && <span className="text-zinc-400">—</span>}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] whitespace-nowrap">
                        <span className={isErr ? 'text-red-500 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-semibold'}>
                          HTTP {e.status}
                        </span>
                        <span className="text-zinc-400 ml-1.5">{e.durationMs}ms</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
