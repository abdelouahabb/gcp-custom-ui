import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import * as echarts from 'echarts';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Download,
  Gauge,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Terminal,
  Clock,
  Flame,
} from 'lucide-react';

const PROMISE_TIERS = [
  {
    slo: 99.0,
    label: '99.0%',
    name: 'Standard',
    desc: 'Internal tools & early pilots.',
  },
  {
    slo: 99.5,
    label: '99.5%',
    name: 'Business',
    desc: 'Balanced promise for growing teams.',
  },
  {
    slo: 99.9,
    label: '99.9%',
    name: 'Enterprise',
    desc: 'High reliability for customer apps.',
  },
  {
    slo: 99.95,
    label: '99.95%',
    name: 'Mission-Critical',
    desc: 'Strictest promise — rapid response.',
  },
];

function formatAllowedDowntime(slo, hours) {
  const totalMinutes = hours * 60;
  const allowedMinutes = (totalMinutes * Math.max(0, 100 - slo)) / 100;
  const unit = hours === 24 ? '24h' : hours === 168 ? '7d' : 'mo';
  const unitLong = hours === 24 ? '24 hours' : hours === 168 ? '7 days' : 'month (30d SLA)';
  let shortVal;
  if (allowedMinutes >= 60) {
    shortVal = `${(allowedMinutes / 60).toFixed(1)} hrs`;
  } else if (allowedMinutes >= 1) {
    shortVal = `${allowedMinutes.toFixed(1)} mins`;
  } else {
    shortVal = `${Math.round(allowedMinutes * 60)} secs`;
  }
  return {
    short: `${shortVal} / ${unit}`,
    long: `${shortVal} / ${unitLong} allowed`,
  };
}

function windowLabel(hours) {
  if (hours === 24) return 'Last 24h';
  if (hours === 168) return 'Last 7d';
  return 'Last 30d (Monthly SLA)';
}

function computeCushion(sliPercent, targetSlo, totalEvents = 0, errorEvents = 0) {
  const allowedErrorPct = Math.max(0.001, 100 - targetSlo);
  const actualErrorPct = Math.max(0, 100 - sliPercent);
  const burnMultiplier = actualErrorPct / allowedErrorPct;
  const burnedPct = Math.round(burnMultiplier * 100);
  const remainingPct = Math.max(0, Math.min(100, Math.round(100 - burnedPct)));
  const allowedErrorsInWindow = Math.round(((totalEvents * allowedErrorPct) / 100) * 10) / 10;
  const reached = sliPercent >= targetSlo;
  return {
    reached,
    remainingPct,
    burnedPct,
    burnMultiplier: Math.round(burnMultiplier * 10) / 10,
    allowedErrorsInWindow,
    actualErrors: errorEvents,
    isOverBudget: burnedPct > 100,
    status: remainingPct >= 50 ? 'healthy' : remainingPct >= 20 ? 'caution' : 'exhausted',
  };
}

export default function SreSliSloCockpitPanel({
  projectId,
  onNavigateTab,
  onRunInShell,
  onShowToast,
  onShowError,
}) {
  const [hours, setHours] = useState(720);
  const [targetSlo, setTargetSlo] = useState(() => {
    try {
      const saved = Number(localStorage.getItem('cloudpulse_sre_target_slo'));
      if ([99.0, 99.5, 99.9, 99.95].includes(saved)) return saved;
    } catch {
      // ignore
    }
    return 99.5;
  });
  const [loading, setLoading] = useState(false);
  const [advising, setAdvising] = useState(false);
  const [data, setData] = useState(null);
  const [advice, setAdvice] = useState(null);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem('cloudpulse_sre_target_slo', String(targetSlo));
    } catch {
      // ignore
    }
  }, [targetSlo]);

  const loadHealth = async (overrideHours = hours) => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave27/sre-slo`,
        { action: 'HEALTH', hours: overrideHours }
      );
      setData(res.data || null);
    } catch (e) {
      const msg = e.response?.data?.error || e.message || 'Failed to load live SLI/SLO telemetry';
      if (onShowError) onShowError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      setAdvice(null);
      loadHealth(hours);
    }
  }, [projectId, hours]);

  const overall = data?.overall || {
    totalEvents: 0,
    goodEvents: 0,
    errorEvents: 0,
    warningEvents: 0,
    sliPercent: 100,
    windows: { h1: { errorRate: 0 }, h6: { errorRate: 0 } },
  };

  const selectedTier = PROMISE_TIERS.find((t) => t.slo === targetSlo) || PROMISE_TIERS[1];

  const overallCushion = useMemo(
    () =>
      computeCushion(
        overall.sliPercent,
        targetSlo,
        overall.totalEvents,
        overall.errorEvents
      ),
    [overall.sliPercent, overall.totalEvents, overall.errorEvents, targetSlo]
  );

  // Google SRE Workbook Multi-Window Burn Rates (1h vs 14.4x, 6h vs 6x)
  const burnRates = useMemo(() => {
    const allowedErrFrac = Math.max(0.0001, (100 - targetSlo) / 100);
    const h1Burn = +((overall.windows?.h1?.errorRate || 0) / allowedErrFrac).toFixed(1);
    const h6Burn = +((overall.windows?.h6?.errorRate || 0) / allowedErrFrac).toFixed(1);
    const daysToExhaust =
      overallCushion.burnMultiplier > 0
        ? +(30 / overallCushion.burnMultiplier).toFixed(1)
        : null;
    return {
      h1Burn,
      h6Burn,
      fastBurnAlert: h1Burn >= 14.4,
      slowBurnAlert: h6Burn >= 6.0,
      daysToExhaust,
    };
  }, [overall, targetSlo, overallCushion.burnMultiplier]);

  // ECharts Daily SLI % vs SLO Target Line
  useEffect(() => {
    if (!chartRef.current || !data?.dailyTrend?.length) return;
    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current);
    }
    const isDark = document.documentElement.classList.contains('dark');
    const minVal = Math.min(
      targetSlo - 0.5,
      ...data.dailyTrend.map((d) => Number(d.sliPercent || 100))
    );
    chartInstanceRef.current.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        textStyle: { color: isDark ? '#f8fafc' : '#0f172a', fontSize: 12 },
      },
      grid: { left: 52, right: 20, top: 20, bottom: 28 },
      xAxis: {
        type: 'category',
        data: data.dailyTrend.map((d) => d.date),
        axisLabel: { color: isDark ? '#94a3b8' : '#475569', fontSize: 11 },
        axisLine: { lineStyle: { color: isDark ? '#1e293b' : '#cbd5e1' } },
      },
      yAxis: {
        type: 'value',
        min: Math.max(0, Math.floor(minVal)),
        max: 100,
        axisLabel: {
          color: isDark ? '#94a3b8' : '#475569',
          fontSize: 11,
          formatter: '{value}%',
        },
        splitLine: { lineStyle: { color: isDark ? '#1e293b' : '#e2e8f0' } },
      },
      series: [
        {
          name: 'Live SLI %',
          type: 'line',
          smooth: true,
          symbolSize: 6,
          data: data.dailyTrend.map((d) => d.sliPercent),
          lineStyle: { color: '#2563eb', width: 2.5 },
          itemStyle: { color: '#2563eb' },
          areaStyle: { color: 'rgba(37, 99, 235, 0.12)' },
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { color: '#f59e0b', type: 'dashed', width: 2 },
            label: {
              formatter: `SLO ${targetSlo}%`,
              color: '#f59e0b',
              fontSize: 11,
              fontWeight: 'bold',
            },
            data: [{ yAxis: targetSlo }],
          },
        },
      ],
    });
    const onResize = () => chartInstanceRef.current?.resize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [data, targetSlo]);

  useEffect(() => {
    return () => {
      chartInstanceRef.current?.dispose();
      chartInstanceRef.current = null;
    };
  }, []);

  const handleAskAdvisor = async () => {
    if (!projectId || advising || !data) return;
    setAdvising(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave27/sre-slo`,
        {
          action: 'ADVISE',
          targetSlo,
          hours,
          overall: data.overall,
          services: data.services,
          geminiModel: 'gemini-4-neon',
        }
      );
      setAdvice(res.data || null);
      if (onShowToast) {
        onShowToast(`SRE Advisor (${res.data?.model || 'gemini-4-neon'}) verdict ready: ${res.data?.decision}.`);
      }
    } catch (e) {
      if (e?.__cancelledByGatekeeper) return;
      const msg = e.response?.data?.error || e.message || 'SRE Advisor failed';
      if (onShowError) onShowError(msg);
    } finally {
      setAdvising(false);
    }
  };

  const handleExportMarkdown = () => {
    if (!data) return;
    const md = [
      `# CloudPulse SRE SLI/SLO Reliability Report — ${projectId}`,
      `Generated: ${new Date().toISOString()} · Window: ${windowLabel(hours)} · Target SLO: ${selectedTier.label} (${selectedTier.name})`,
      '',
      `## Executive Summary`,
      `- **SLO Status**: ${overallCushion.reached ? 'REACHED' : 'BREACHED'}`,
      `- **Live Performance (SLI)**: ${overall.sliPercent.toFixed(2)}% (${overall.goodEvents} succeeded / ${overall.errorEvents} errors)`,
      `- **Allowed Downtime (SLO)**: ${formatAllowedDowntime(selectedTier.slo, hours).long}`,
      `- **Error Budget Remaining**: ${overallCushion.isOverBudget ? `${overallCushion.burnMultiplier}x over budget` : `${overallCushion.remainingPct}% left`}`,
      `- **Multi-Window Burn Rate**: 1h=${burnRates.h1Burn}x (14.4x alert), 6h=${burnRates.h6Burn}x (6.0x alert)`,
      '',
      `## Per-Service Reliability Scorecards`,
      `| Service | Live SLI | Status | Events | Errors | Safety Cushion |`,
      `| --- | --- | --- | --- | --- | --- |`,
      ...(data.services || []).map((s) => {
        const c = computeCushion(s.sliPercent, targetSlo, s.totalEvents, s.errorEvents);
        return `| ${s.service} | ${s.sliPercent.toFixed(2)}% | ${c.reached ? 'REACHED' : 'BREACHED'} | ${s.totalEvents} | ${s.errorEvents} | ${c.isOverBudget ? `${c.burnMultiplier}x over` : `${c.remainingPct}% left`} |`;
      }),
    ].join('\n');
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sre-slo-report-${projectId}.md`;
    a.click();
    URL.revokeObjectURL(url);
    if (onShowToast) onShowToast(`Downloaded sre-slo-report-${projectId}.md`);
  };

  return (
    <div className="space-y-5">
      {loading && (
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-xs text-blue-700 dark:text-blue-300 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
            <span>
              Scanning live Google Cloud logs &amp; Monitoring SLOs for <strong>{windowLabel(hours)}</strong>…
            </span>
          </span>
          <span className="text-[10px] font-mono uppercase">Live Sync</span>
        </div>
      )}

      {/* Row 1: 3-Card Plain-English SRE Translation + Live Fuel Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-200 dark:border-[#1e2433] bg-white dark:bg-[#0d111a] p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <span>Live Performance (SLI)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                overallCushion.reached
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                  : 'bg-red-500/15 text-red-700 dark:text-red-300'
              }`}
            >
              {overallCushion.reached ? 'SLO Reached' : 'SLO Breached'}
            </span>
          </div>
          <div className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50 tabular-nums">
            {overall.sliPercent.toFixed(2)}%
          </div>
          <div className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            {overall.goodEvents.toLocaleString()} succeeded ·{' '}
            <span className={overall.errorEvents > 0 ? 'font-semibold text-red-600 dark:text-red-400' : ''}>
              {overall.errorEvents.toLocaleString()} error{overall.errorEvents === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-[#1e2433] bg-white dark:bg-[#0d111a] p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <span>Allowed Downtime (SLO)</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 text-[10px] font-semibold">
              {selectedTier.name} · {selectedTier.label}
            </span>
          </div>
          <div className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
            {formatAllowedDowntime(selectedTier.slo, hours).short}
          </div>
          <div className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            {formatAllowedDowntime(selectedTier.slo, hours).long}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-[#1e2433] bg-white dark:bg-[#0d111a] p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <span>Safety Cushion (Error Budget)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                overallCushion.status === 'healthy'
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                  : overallCushion.status === 'caution'
                    ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                    : 'bg-red-500/15 text-red-700 dark:text-red-300'
              }`}
            >
              {overallCushion.status === 'healthy'
                ? 'Safe to Ship'
                : overallCushion.status === 'caution'
                  ? 'Watch Closely'
                  : 'Stabilize First'}
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tabular-nums">
              {overallCushion.isOverBudget
                ? `${overallCushion.burnMultiplier}x over`
                : `${overallCushion.remainingPct}% left`}
            </span>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
              {overallCushion.actualErrors} / {overallCushion.allowedErrorsInWindow} allowed
            </span>
          </div>
          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-[#1a2233]">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                overallCushion.status === 'healthy'
                  ? 'bg-emerald-500'
                  : overallCushion.status === 'caution'
                    ? 'bg-amber-500'
                    : 'bg-red-500'
              }`}
              style={{
                width: overallCushion.isOverBudget
                  ? `${Math.min(100, Math.max(15, overallCushion.burnMultiplier * 10))}%`
                  : `${Math.max(4, overallCushion.remainingPct)}%`,
              }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1">
              <Flame className="w-3 h-3" /> 1h: {burnRates.h1Burn}x · 6h: {burnRates.h6Burn}x
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />{' '}
              {burnRates.daysToExhaust ? `~${burnRates.daysToExhaust}d runway` : 'Infinite runway'}
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Interactive Uptime Promise Simulator + Actions */}
      <div className="rounded-xl border border-zinc-200 dark:border-[#1e2433] bg-white dark:bg-[#0d111a] p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Interactive Uptime Promise Simulator (SLI vs. SLO Attainment)
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Select an SLO promise tier to test in real time whether your live Google Cloud services meet it.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={hours}
              disabled={loading}
              onChange={(e) => setHours(Number(e.target.value))}
              className="rounded-md border border-zinc-200 dark:border-[#242c3f] bg-zinc-50 dark:bg-[#080b12] px-2.5 py-1.5 text-xs font-medium text-zinc-800 dark:text-zinc-200"
            >
              <option value={24}>Last 24 Hours</option>
              <option value={168}>Last 7 Days</option>
              <option value={720}>Last 30 Days (Monthly SLA)</option>
            </select>

            <button
              type="button"
              onClick={handleAskAdvisor}
              disabled={advising || !data}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium shadow-sm transition cursor-pointer"
            >
              {advising ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {advising ? 'Evaluating…' : 'Ask SRE Advisor (Gemini 4)'}
            </button>

            <button
              type="button"
              onClick={handleExportMarkdown}
              disabled={!data}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-[#242c3f] text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#161e2e] text-xs font-medium transition cursor-pointer disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              Report (.md)
            </button>

            <button
              type="button"
              onClick={() => loadHealth(hours)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-[#242c3f] text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#161e2e] text-xs font-medium transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {PROMISE_TIERS.map((tier) => {
            const active = targetSlo === tier.slo;
            return (
              <button
                key={tier.slo}
                type="button"
                onClick={() => setTargetSlo(tier.slo)}
                className={`rounded-lg border p-3.5 text-left transition cursor-pointer ${
                  active
                    ? 'border-amber-500 bg-amber-500/12 shadow-2xs'
                    : 'border-zinc-200 dark:border-[#1e2433] bg-zinc-50/50 dark:bg-[#0a0e17] hover:border-zinc-300 dark:hover:border-[#2c364d]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base font-bold text-zinc-900 dark:text-zinc-50">{tier.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      active
                        ? 'bg-amber-500 text-zinc-950'
                        : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    {tier.name}
                  </span>
                </div>
                <div className="mt-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                  {formatAllowedDowntime(tier.slo, hours).long}
                </div>
                <div className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">{tier.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Gemini 4 Ship vs. Stabilize Verdict */}
      {advice && (
        <div
          className={`rounded-xl border p-5 space-y-3 ${
            advice.decision === 'Pause & Stabilize'
              ? 'border-red-500/40 bg-red-500/5'
              : advice.decision === 'Proceed with Caution'
                ? 'border-amber-500/40 bg-amber-500/5'
                : 'border-emerald-500/40 bg-emerald-500/5'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {advice.decision === 'Pause & Stabilize' ? (
                <AlertCircle className="w-4 h-4 text-red-500" />
              ) : advice.decision === 'Proceed with Caution' ? (
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              )}
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{advice.headline}</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-white dark:bg-[#0d111a] border border-zinc-200 dark:border-[#242c3f] text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">
              Verdict: {advice.decision} · {advice.model || 'gemini-4-neon'}
            </span>
          </div>
          <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">{advice.explanation}</p>
          {advice.keyTakeaways?.length > 0 && (
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {advice.keyTakeaways.map((t, idx) => (
                <li
                  key={idx}
                  className="rounded-lg bg-white/80 dark:bg-[#0d111a] border border-zinc-200/80 dark:border-[#1e2433] px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 flex items-start gap-2"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            Recommended Action:{' '}
            <span className="font-normal text-zinc-700 dark:text-zinc-300">{advice.recommendedAction}</span>
          </div>
        </div>
      )}

      {/* Row 3: Live Daily SLI % vs SLO Target Chart */}
      {data?.dailyTrend?.length > 0 && (
        <div className="rounded-xl border border-zinc-200 dark:border-[#1e2433] bg-white dark:bg-[#0d111a] p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-500" />
              Daily Live SLI Trend vs. {selectedTier.label} SLO Target Line
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">
              Native GCP SLOs: {data.nativeSlos?.length || 0} · Uptime Checks: {data.uptimeChecks?.length || 0}
            </span>
          </div>
          <div ref={chartRef} className="w-full h-48" />
        </div>
      )}

      {/* Row 4: Per-Service Reliability Scorecards */}
      <div className="space-y-2.5">
        <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
          Per-Service Live SLI / SLO Attainment ({data?.services?.length || 0} active services)
        </div>
        {data && (!data.services || data.services.length === 0) ? (
          <div className="rounded-xl border border-zinc-200 dark:border-[#1e2433] bg-white dark:bg-[#0d111a] p-4 text-xs text-zinc-500">
            No Cloud Logging activity recorded in the last {windowLabel(hours)} (API: {data.apiStatus?.cloudLogging}).
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {(data?.services || []).map((svc) => {
              const cushion = computeCushion(
                svc.sliPercent,
                targetSlo,
                svc.totalEvents,
                svc.errorEvents
              );
              return (
                <div
                  key={svc.service}
                  className="rounded-xl border border-zinc-200 dark:border-[#1e2433] bg-white dark:bg-[#0d111a] p-4 shadow-2xs flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{svc.service}</div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {svc.totalEvents.toLocaleString()} events · {svc.errorEvents} error
                        {svc.errorEvents === 1 ? '' : 's'}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        cushion.reached
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'bg-red-500/15 text-red-700 dark:text-red-300'
                      }`}
                    >
                      {svc.sliPercent.toFixed(2)}% · {cushion.reached ? 'REACHED' : 'BREACHED'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-zinc-600 dark:text-zinc-400">
                      <span>Error Budget</span>
                      <span className={cushion.isOverBudget ? 'font-semibold text-red-600 dark:text-red-400' : 'font-semibold text-zinc-800 dark:text-zinc-200'}>
                        {cushion.isOverBudget
                          ? `${cushion.burnMultiplier}x over`
                          : `${cushion.remainingPct}% left`}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-[#1a2233]">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          cushion.status === 'healthy'
                            ? 'bg-emerald-500'
                            : cushion.status === 'caution'
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                        }`}
                        style={{
                          width: cushion.isOverBudget
                            ? `${Math.min(100, Math.max(15, cushion.burnMultiplier * 10))}%`
                            : `${Math.max(4, cushion.remainingPct)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {svc.lastErrorSummary && (
                    <div className="truncate rounded-md bg-red-500/10 px-2.5 py-1.5 text-[11px] text-red-700 dark:text-red-300 font-mono">
                      Latest: {svc.lastErrorSummary}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-zinc-100 dark:border-[#181f2e]">
                    {onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateTab('LOGS_SHELL')}
                        className="px-2 py-1 rounded text-[11px] font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#161e2e] cursor-pointer"
                      >
                        Inspect Logs
                      </button>
                    )}
                    {onRunInShell && (
                      <button
                        type="button"
                        onClick={() =>
                          onRunInShell(
                            `gcloud logging read 'resource.type="${svc.resourceType}" AND severity>=ERROR' --project=${projectId} --limit=20`
                          )
                        }
                        className="inline-flex items-center gap-1 px-2 py-1 rounded border border-zinc-200 dark:border-[#242c3f] text-[11px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#161e2e] cursor-pointer"
                      >
                        <Terminal className="w-3 h-3" /> Tail Errors
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
