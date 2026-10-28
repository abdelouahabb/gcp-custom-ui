import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useTheme } from '../context/ThemeContext';
import { BarChart3, Sparkles, ArrowUpRight } from 'lucide-react';

const BAR_STUDIO_MAP = {
  'Storage (GCS)': 'CLOUD_STORAGE',
  'BigQuery Datasets': 'BIGQUERY_STUDIO',
  'Compute VMs': 'VM_SSH',
  'VPC Networks': 'VPC_NETWORKS',
  'Firewall Rules': 'VPC_NETWORKS',
  'Cloud Run': 'CLOUD_RUN',
  'GKE Clusters': 'GKE_STUDIO',
  'Enabled APIs': 'OVERVIEW',
};

export default function TelemetryCharts({
  telemetry,
  projectId,
  onOpenCopilot,
  onSelectTab,
}) {
  const { isDark, chartColors } = useTheme();
  const finopsSeries = telemetry?.finopsSeries || [];

  const axisColor = isDark ? '#a1a1aa' : '#64748b';
  const splitLineColor = isDark ? '#27272a' : '#f1f5f9';

  const inventoryOption = {
    color: chartColors,
    textStyle: { fontFamily: 'DM Sans, Inter, sans-serif' },
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark
        ? 'rgba(24, 24, 27, 0.96)'
        : 'rgba(255, 255, 255, 0.96)',
      borderColor: isDark ? '#3f3f46' : '#e2e8f0',
      textStyle: { color: isDark ? '#f4f4f5' : '#0f172a', fontSize: 12 },
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
        cursor: 'pointer',
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: chartColors[0] || '#1a73e8',
        },
        data: finopsSeries.map((d) => d.count ?? 0),
      },
    ],
  };

  const handleBarClick = (params) => {
    if (!onSelectTab) return;
    const categoryName = params?.name || '';
    const targetStudio = BAR_STUDIO_MAP[categoryName];
    if (targetStudio) {
      onSelectTab(targetStudio);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="bg-white dark:bg-[#202124] rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 transition-all duration-300 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
              Real-time count of active Storage Buckets, BigQuery Datasets, Compute Engine VMs, Cloud Run Services, VPC Firewalls, and Enabled APIs. Click any bar or pill to open its studio.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              onOpenCopilot(`Audit live resources and APIs in ${projectId}`)
            }
            className="inline-flex items-center gap-1.5 text-xs font-medium bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/25 px-3 py-1.5 rounded-md transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Audit Project with Health & Drift Hub</span>
          </button>
        </div>

        {finopsSeries.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {finopsSeries.map((item) => {
              const targetStudio = BAR_STUDIO_MAP[item.date];
              return (
                <button
                  key={item.date}
                  type="button"
                  onClick={() => targetStudio && onSelectTab && onSelectTab(targetStudio)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono transition-colors cursor-pointer"
                >
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {item.date}:
                  </span>
                  <span className="font-bold text-zinc-950 dark:text-zinc-100">
                    {item.count ?? 0}
                  </span>
                  {targetStudio && (
                    <ArrowUpRight className="w-3 h-3 text-zinc-400" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="h-[260px] w-full">
          <ReactECharts
            option={inventoryOption}
            style={{ height: '100%', width: '100%' }}
            notMerge={true}
            onEvents={onSelectTab ? { click: handleBarClick } : undefined}
          />
        </div>
      </div>
    </div>
  );
}
