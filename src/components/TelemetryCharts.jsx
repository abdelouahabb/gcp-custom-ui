import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useTheme } from '../context/ThemeContext';
import { BarChart3, Sparkles } from 'lucide-react';

export default function TelemetryCharts({ telemetry, projectId, onOpenCopilot }) {
  const { isDark, chartColors } = useTheme();
  const finopsSeries = telemetry?.finopsSeries || [];

  const axisColor = isDark ? '#71717a' : '#64748b';
  const splitLineColor = isDark ? '#1e1e24' : '#f1f5f9';

  const inventoryOption = {
    color: chartColors,
    textStyle: { fontFamily: 'DM Sans, Inter, sans-serif' },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.96)',
      borderColor: '#e2e8f0',
      textStyle: { color: '#0f172a', fontSize: 12 },
      axisPointer: { type: 'shadow' },
    },
    grid: {
      left: '2%',
      right: '3%',
      bottom: '4%',
      top: '12%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: finopsSeries.map((d) => d.date),
      axisLine: { lineStyle: { color: splitLineColor } },
      axisLabel: { color: axisColor, fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      name: 'Live Count',
      nameTextStyle: { color: axisColor, fontSize: 11 },
      splitLine: { lineStyle: { color: splitLineColor, type: 'dashed' } },
      axisLabel: { color: axisColor },
    },
    series: [
      {
        name: 'Provisioned / Enabled Count',
        type: 'bar',
        barMaxWidth: 44,
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: chartColors[0] || '#1a73e8',
        },
        data: finopsSeries.map((d) => d.count ?? 0),
      },
    ],
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="bg-white dark:bg-[#202124] rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              <h3 className="text-base font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                Live GCP Resource & API Footprint —{' '}
                <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded-full">
                  {projectId}
                </span>
              </h3>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Real-time count of active Storage Buckets, BigQuery Datasets, Compute Engine VMs, Cloud Run Services, GKE Clusters, and Enabled APIs.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              onOpenCopilot(`Audit live resources and APIs in ${projectId}`)
            }
            className="inline-flex items-center gap-1.5 text-xs font-medium bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/25 px-3 py-1.5 rounded-md transition-colors self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Audit Project with Gemini</span>
          </button>
        </div>

        <div className="h-[260px] w-full">
          <ReactECharts
            option={inventoryOption}
            style={{ height: '100%', width: '100%' }}
            notMerge={true}
          />
        </div>
      </div>
    </div>
  );
}
