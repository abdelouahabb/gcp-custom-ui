import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  HardDrive,
  Server,
  Activity,
  ShieldCheck,
  TrendingUp,
  GripVertical,
  Palette,
  ArrowUpRight,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

function SortableKpiCard({ item }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 40 : 'auto',
  };

  const Icon = item.icon;

  const handleCardKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      item.onPrimaryClick?.();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      role="button"
      tabIndex={0}
      onClick={() => item.onPrimaryClick?.()}
      onKeyDown={handleCardKeyDown}
      title={item.clickHint || `Click to open ${item.title}`}
      className={`group bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm transition-all duration-200 cursor-pointer select-none hover:border-blue-500/60 dark:hover:border-blue-400/60 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
        isDragging ? 'opacity-80 scale-[1.02] shadow-xl ring-2 ring-blue-500' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
            <Icon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider block truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {item.title}
            </span>
            <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 flex items-center gap-0.5">
              <span>{item.primaryTargetLabel}</span>
              <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>
        </div>
        <button
          type="button"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          title="Drag handle to reorder KPI card"
          className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-grab active:cursor-grabbing rounded-lg transition-colors shrink-0"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50 font-mono">
          {item.value}
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          <TrendingUp className="w-3 h-3" />
          {item.trendLabel}
        </span>
      </div>

      <div className="mt-2.5 text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
        <span className="truncate">{item.subtitle}</span>
        <span className="font-mono text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-1.5 py-0.5 rounded shrink-0">
          {item.badge}
        </span>
      </div>

      {Array.isArray(item.quickLinks) && item.quickLinks.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-wrap items-center gap-1.5">
          {item.quickLinks.map((link) => (
            <button
              key={link.label}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                link.onClick?.();
              }}
              className="px-2 py-1 rounded-md text-[10px] font-mono font-bold bg-zinc-100 hover:bg-blue-600 text-zinc-700 hover:text-white dark:bg-zinc-900 dark:hover:bg-blue-600 dark:text-zinc-300 dark:hover:text-white border border-zinc-200/80 dark:border-zinc-800 transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <span>{link.label}</span>
              <span>→</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SortableColorSwatch({ color }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: color });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    backgroundColor: color,
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      type="button"
      {...attributes}
      {...listeners}
      title={`Drag to reorder series color ${color}`}
      className="w-6 h-6 rounded-md border border-white/20 shadow-sm cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
    />
  );
}

export default function SortableKpiRow({
  summary,
  fetchLatencyMs,
  onNavigateTab,
  onScrollToApis,
}) {
  const { chartColors, setChartColors } = useTheme();
  const [showPalette, setShowPalette] = useState(false);

  const bucketsCount = summary?.liveBucketsCount ?? summary?.storageBuckets ?? 0;
  const datasetsCount =
    summary?.liveDatasetsCount ?? summary?.bigqueryDatasets ?? 0;
  const vmsCount = summary?.liveVmsCount ?? summary?.totalVms ?? 0;
  const runCount = summary?.liveRunCount ?? summary?.cloudRunServices ?? 0;
  const clustersCount = summary?.liveClustersCount ?? summary?.gkeClusters ?? 0;
  const apisCount = summary?.enabledApisCount ?? 0;
  const logsCount = summary?.liveLogsCount ?? 0;
  const vpcsCount = summary?.liveVpcsCount ?? summary?.vpcNetworks ?? 0;
  const firewallsCount =
    summary?.liveFirewallsCount ?? summary?.firewallRules ?? 0;

  const navigate = (tabId) => {
    if (typeof onNavigateTab === 'function') {
      onNavigateTab(tabId);
    }
  };

  const handleOpenApisSection = () => {
    if (typeof onScrollToApis === 'function') {
      onScrollToApis();
      return;
    }
    const el = document.getElementById('emergency-api-killswitch-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      navigate('MCP_HUB');
    }
  };

  const initialCards = [
    {
      id: 'kpi-storage',
      title: 'Storage & Datasets',
      value: `${bucketsCount + datasetsCount}`,
      trendLabel: `${bucketsCount} GCS · ${datasetsCount} BQ`,
      subtitle: 'storage & bigquery APIs',
      badge: 'LIVE_GCP',
      icon: HardDrive,
      primaryTargetLabel:
        bucketsCount === 0 && datasetsCount > 0
          ? 'Open BigQuery Studio'
          : 'Open Cloud Storage Studio',
      clickHint: 'Click to open Cloud Storage or BigQuery Studio',
      onPrimaryClick: () =>
        navigate(
          bucketsCount === 0 && datasetsCount > 0
            ? 'BIGQUERY_STUDIO'
            : 'CLOUD_STORAGE'
        ),
      quickLinks: [
        {
          label: `GCS (${bucketsCount})`,
          onClick: () => navigate('CLOUD_STORAGE'),
        },
        {
          label: `BigQuery (${datasetsCount})`,
          onClick: () => navigate('BIGQUERY_STUDIO'),
        },
        {
          label: 'BigLake',
          onClick: () => navigate('BIGLAKE_STUDIO'),
        },
      ],
    },
    {
      id: 'kpi-compute',
      title: 'Compute & Serverless',
      value: `${vmsCount + runCount + clustersCount}`,
      trendLabel: `${vmsCount} VMs · ${runCount} Run`,
      subtitle: `${clustersCount} GKE Clusters · ${vpcsCount} VPCs`,
      badge: 'LIVE_GCP',
      icon: Server,
      primaryTargetLabel:
        vmsCount === 0 && runCount > 0
          ? 'Open Cloud Run Fleet'
          : 'Open VM Fleet & Browser SSH',
      clickHint: 'Click to open Compute VM Fleet, Cloud Run, or GKE Studio',
      onPrimaryClick: () =>
        navigate(
          vmsCount === 0 && runCount > 0
            ? 'CLOUD_RUN'
            : vmsCount === 0 && clustersCount > 0
            ? 'GKE_STUDIO'
            : 'VM_SSH'
        ),
      quickLinks: [
        {
          label: `VMs & SSH (${vmsCount})`,
          onClick: () => navigate('VM_SSH'),
        },
        {
          label: `Cloud Run (${runCount})`,
          onClick: () => navigate('CLOUD_RUN'),
        },
        {
          label: `GKE (${clustersCount})`,
          onClick: () => navigate('GKE_STUDIO'),
        },
      ],
    },
    {
      id: 'kpi-apis',
      title: 'Enabled Service APIs',
      value: `${apisCount}`,
      trendLabel: 'Active Quota',
      subtitle: 'serviceusage.googleapis.com',
      badge: 'ENABLED',
      icon: ShieldCheck,
      primaryTargetLabel: 'Jump to API Kill-Switch & Quotas',
      clickHint:
        'Click to jump to the live Service API Kill-Switch & Quota Manager',
      onPrimaryClick: handleOpenApisSection,
      quickLinks: [
        {
          label: `API Kill-Switch (${apisCount})`,
          onClick: handleOpenApisSection,
        },
        {
          label: '48 MCP Servers',
          onClick: () => navigate('MCP_HUB'),
        },
        {
          label: `VPC & FW (${firewallsCount})`,
          onClick: () => navigate('VPC_NETWORKS'),
        },
      ],
    },
    {
      id: 'kpi-logs',
      title: 'Cloud Audit Stream',
      value: `${logsCount} events`,
      trendLabel: 'Live Tail Ready',
      subtitle: 'logging.googleapis.com',
      badge: `${fetchLatencyMs || 240}ms`,
      icon: Activity,
      primaryTargetLabel: 'Open Live Logs & Cloud Shell',
      clickHint:
        'Click to open Live Cloud Logging Streamer, Trace Waterfall & Cloud Shell',
      onPrimaryClick: () => navigate('LOGS_SHELL'),
      quickLinks: [
        {
          label: 'Live Logs & Shell',
          onClick: () => navigate('LOGS_SHELL'),
        },
        {
          label: 'Cloud SOC',
          onClick: () => navigate('CLOUD_SOC'),
        },
        {
          label: 'SRE War-Room',
          onClick: () => navigate('SRE_WAR_ROOM'),
        },
      ],
    },
  ];

  const [cardOrder, setCardOrder] = useState([
    'kpi-storage',
    'kpi-compute',
    'kpi-apis',
    'kpi-logs',
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const orderedCards = cardOrder
    .map((id) => initialCards.find((c) => c.id === id))
    .filter(Boolean);

  const handleCardDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCardOrder((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSwatchDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setChartColors((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h6 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            100% Live Google Cloud Project Telemetry (Click Card to Open Studio · Drag Handle to Reorder)
          </h6>
        </div>
        <button
          type="button"
          onClick={() => setShowPalette((p) => !p)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 px-2.5 py-1 rounded-lg transition-colors"
        >
          <Palette className="w-3.5 h-3.5" />
          <span>{showPalette ? 'Hide Palette' : 'Customize Chart Palette'}</span>
        </button>
      </div>

      {showPalette && (
        <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 transition-all duration-300">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Drag color swatches to reorder Apache ECharts telemetry series palette:
          </span>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleSwatchDragEnd}
          >
            <SortableContext
              items={chartColors}
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex items-center gap-2">
                {chartColors.map((color) => (
                  <SortableColorSwatch key={color} color={color} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleCardDragEnd}
      >
        <SortableContext items={cardOrder} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {orderedCards.map((item) => (
              <SortableKpiCard key={item.id} item={item} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
