import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as echarts from 'echarts';
import {
  FileBarChart2,
  RefreshCw,
  Loader2,
  Filter,
  Terminal,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Database,
  DollarSign,
  SlidersHorizontal,
} from 'lucide-react';

export default function LoggingFinOpsAuditorPanel({
  projectId,
  onRunInShell,
  onShowToast,
  onShowError,
}) {
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [applyingId, setApplyingId] = useState(null);
  const [data, setData] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [showSinksDrawer, setShowSinksDrawer] = useState(false);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const runAudit = async (lookbackDays = days) => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave27/logging-finops`,
        { action: 'AUDIT', days: lookbackDays }
      );
      setData(res.data || null);
      if (onShowToast) {
        onShowToast(
          `Cloud Logging FinOps audit complete (${res.data?.summary?.projected30dGb ?? 0} GiB/mo projected).`
        );
      }
    } catch (e) {
      const msg = e.response?.data?.error || e.message || 'Logging FinOps audit failed';
      if (onShowError) onShowError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyExclusion = async (stream) => {
    if (!projectId || !stream) return;
    setApplyingId(stream.suggestedExclusionName);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave27/logging-finops`,
        {
          action: 'APPLY_EXCLUSION',
          sinkName: '_Default',
          exclusionName: stream.suggestedExclusionName,
          filter: stream.suggestedFilter,
          description: `CloudPulse FinOps noise filter for ${stream.resourceType}`,
        }
      );
      if (onShowToast) {
        onShowToast(
          `Exclusion "${res.data?.exclusionName}" applied to _Default sink (${res.data?.totalExclusions} active).`
        );
      }
      runAudit(days);
    } catch (e) {
      if (e?.__cancelledByGatekeeper) return;
      const msg = e.response?.data?.error || e.message || 'Failed to apply log exclusion';
      if (onShowError) onShowError(msg);
    } finally {
      setApplyingId(null);
    }
  };

  useEffect(() => {
    if (!chartRef.current || !data?.dailySeries?.length) return;
    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current);
    }
    const isDark = document.documentElement.classList.contains('dark');
    chartInstanceRef.current.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        textStyle: { color: isDark ? '#f8fafc' : '#0f172a', fontSize: 12 },
      },
      grid: { left: 48, right: 16, top: 20, bottom: 28 },
      xAxis: {
        type: 'category',
        data: data.dailySeries.map((d) => d.date),
        axisLabel: { color: isDark ? '#94a3b8' : '#475569', fontSize: 11 },
        axisLine: { lineStyle: { color: isDark ? '#1e293b' : '#cbd5e1' } },
      },
      yAxis: {
        type: 'value',
        name: 'MB',
        nameTextStyle: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 10 },
        axisLabel: { color: isDark ? '#94a3b8' : '#475569', fontSize: 11 },
        splitLine: { lineStyle: { color: isDark ? '#1e293b' : '#e2e8f0' } },
      },
      series: [
        {
          name: 'Ingested MB',
          type: 'bar',
          data: data.dailySeries.map((d) => d.mb),
          itemStyle: { color: '#2563eb', borderRadius: [4, 4, 0, 0] },
          barMaxWidth: 28,
        },
      ],
    });
    const onResize = () => chartInstanceRef.current?.resize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [data]);

  useEffect(() => {
    return () => {
      chartInstanceRef.current?.dispose();
      chartInstanceRef.current = null;
    };
  }, []);

  const copyCmd = (id, text) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1600);
  };

  return (
    <section className="rounded-xl border border-zinc-200 dark:border-[#1e2433] bg-white dark:bg-[#0d111a] p-4 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400">
            <FileBarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Cloud Logging FinOps Auditor & Log-Sink Exclusion Studio
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Live Cloud Monitoring ingestion volume (`bytes_ingested`), noisy log streams, and 1-click `_Default` sink exclusion filters.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-zinc-200 dark:border-[#1e2433] bg-zinc-50 dark:bg-[#080b12] p-0.5">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  setDays(d);
                  if (data) runAudit(d);
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                  days === d
                    ? 'bg-amber-500 text-zinc-950 font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={loading || !projectId}
            onClick={() => runAudit(days)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium shadow-sm transition"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {loading ? 'Auditing Logs...' : 'Audit Log Spend'}
          </button>
        </div>
      </div>

      {!data && !loading && (
        <div className="rounded-lg border border-dashed border-zinc-300 dark:border-[#242c3f] p-4 text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-between gap-3">
          <span>
            Click <strong>Audit Log Spend</strong> to query live Cloud Monitoring ingestion bytes, log entry counts by severity, and active Cloud Logging sinks.
          </span>
          <SlidersHorizontal className="w-4 h-4 shrink-0 text-zinc-400" />
        </div>
      )}

      {data && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => {
                const next = days === 7 ? 14 : days === 14 ? 30 : 7;
                setDays(next);
                runAudit(next);
              }}
              className="text-left rounded-lg border border-zinc-200 dark:border-[#1e2433] hover:border-blue-500/50 bg-zinc-50 dark:bg-[#0a0e17] p-3 transition cursor-pointer"
              title="Click to cycle lookback window (7d → 14d → 30d)"
            >
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <Database className="w-3.5 h-3.5" /> Projected 30d Volume
              </div>
              <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                {data.summary.projected30dGb} GiB
              </div>
              <div className="text-[11px] text-zinc-500">Free tier: 50 GiB/mo · Cycle {days}d</div>
            </button>
            <button
              type="button"
              onClick={() => runAudit(days)}
              className="text-left rounded-lg border border-zinc-200 dark:border-[#1e2433] hover:border-blue-500/50 bg-zinc-50 dark:bg-[#0a0e17] p-3 transition cursor-pointer"
              title="Click to refresh live Cloud Logging cost estimate"
            >
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" /> Est. Monthly Bill
              </div>
              <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                ${data.summary.estimatedMonthlyUsd.toFixed(2)}/mo
              </div>
              <div className="text-[11px] text-zinc-500">
                Billable: {data.summary.billable30dGb} GiB @ $0.50/GiB
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                if (onRunInShell) {
                  onRunInShell(`gcloud logging read --project=${projectId} --limit=25`);
                }
              }}
              className="text-left rounded-lg border border-zinc-200 dark:border-[#1e2433] hover:border-blue-500/50 bg-zinc-50 dark:bg-[#0a0e17] p-3 transition cursor-pointer"
              title="Click to tail recent log entries in Cloud Shell"
            >
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Window Entries ({data.days}d)
              </div>
              <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                {Number(data.summary.totalEntriesWindow || 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-zinc-500">
                {data.summary.totalGbWindow} GiB · Tail in Shell →
              </div>
            </button>
            <button
              type="button"
              onClick={() => setShowSinksDrawer((v) => !v)}
              className={`text-left rounded-lg border p-3 transition cursor-pointer ${
                showSinksDrawer
                  ? 'border-amber-500 bg-amber-500/12'
                  : 'border-zinc-200 dark:border-[#1e2433] hover:border-amber-500/60 bg-zinc-50 dark:bg-[#0a0e17]'
              }`}
              title="Click to inspect active Cloud Logging sinks and exclusion rules"
            >
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Sinks &amp; Exclusions
              </div>
              <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                {data.summary.activeSinks} sinks · {data.summary.activeExclusions} rules
              </div>
              <div className="text-[11px] text-zinc-500">
                Buckets: {(data.buckets || []).length} · {showSinksDrawer ? 'Hide details' : 'Inspect →'}
              </div>
            </button>
          </div>

          {showSinksDrawer && (
            <div className="rounded-lg border border-zinc-200 dark:border-[#1e2433] bg-zinc-50/70 dark:bg-[#080b12] p-3.5 space-y-2 cp-studio-enter">
              <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Active Cloud Logging Sinks ({(data.sinks || []).length})
              </div>
              {(data.sinks || []).map((sk) => (
                <div
                  key={sk.name}
                  className="text-xs rounded-md border border-zinc-200 dark:border-[#1e2433] bg-white dark:bg-[#0d111a] p-2.5 flex flex-wrap items-center justify-between gap-2"
                >
                  <div>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{sk.name}</span>
                    <span className="text-zinc-500 ml-2">{sk.destination}</span>
                  </div>
                  <span className="text-[11px] text-zinc-500">
                    {(sk.exclusions || []).length} exclusion{(sk.exclusions || []).length === 1 ? '' : 's'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {data.dailySeries?.length > 0 && (
            <div className="rounded-lg border border-zinc-200 dark:border-[#1e2433] p-3 bg-zinc-50/50 dark:bg-[#080b12]">
              <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Daily Cloud Logging Ingestion (MB / Day)
              </div>
              <div ref={chartRef} className="w-full h-44" />
            </div>
          )}

          <div className="space-y-2">
            <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              Top Log Streams & One-Click Exclusion Recommendations ({data.topStreams?.length || 0})
            </div>
            {(!data.topStreams || data.topStreams.length === 0) ? (
              <div className="text-xs text-zinc-500 dark:text-zinc-400 rounded-lg border border-zinc-200 dark:border-[#1e2433] p-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                No billable log streams detected in the last {data.days} days (API status: {data.apiStatus?.monitoringBytes}).
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-[#1e2433]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-[#0a0e17] text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-[#1e2433]">
                    <tr>
                      <th className="px-3 py-2 font-medium">Resource / Stream</th>
                      <th className="px-3 py-2 font-medium">Volume ({data.days}d)</th>
                      <th className="px-3 py-2 font-medium">30d Proj.</th>
                      <th className="px-3 py-2 font-medium">Low-Sev Noise</th>
                      <th className="px-3 py-2 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-[#1e2433]">
                    {data.topStreams.slice(0, 10).map((s) => (
                      <tr key={`${s.resourceType}-${s.logName}`} className="hover:bg-zinc-50/70 dark:hover:bg-[#111726]">
                        <td className="px-3 py-2">
                          <div className="font-medium text-zinc-900 dark:text-zinc-100">{s.resourceType}</div>
                          <div className="text-[11px] text-zinc-500 font-mono truncate max-w-[260px]" title={s.suggestedFilter}>
                            {s.suggestedFilter}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                          {s.mbWindow} MB
                          <div className="text-[10px] text-zinc-500">{s.entries.toLocaleString()} entries</div>
                        </td>
                        <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                          {s.projected30dGb} GiB
                          <div className="text-[10px] text-zinc-500">${s.estMonthlyUsd.toFixed(2)}/mo</div>
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              s.noiseRatio >= 0.7
                                ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                                : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                            }`}
                          >
                            {s.noiseRatio >= 0.7 && <AlertTriangle className="w-3 h-3" />}
                            {Math.round(s.noiseRatio * 100)}% INFO/DEBUG
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={applyingId === s.suggestedExclusionName}
                              onClick={() => handleApplyExclusion(s)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[11px] font-medium"
                            >
                              {applyingId === s.suggestedExclusionName ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Filter className="w-3 h-3" />
                              )}
                              Apply Exclusion
                            </button>
                            <button
                              type="button"
                              onClick={() => copyCmd(s.suggestedExclusionName, s.gcloudCmd)}
                              className="p-1.5 rounded-md border border-zinc-200 dark:border-[#1e2433] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#161e2e]"
                              title="Copy gcloud exclusion command"
                            >
                              {copiedId === s.suggestedExclusionName ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            {onRunInShell && (
                              <button
                                type="button"
                                onClick={() => onRunInShell(s.gcloudCmd)}
                                className="p-1.5 rounded-md border border-zinc-200 dark:border-[#1e2433] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#161e2e]"
                                title="Run gcloud in Cloud Shell"
                              >
                                <Terminal className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
