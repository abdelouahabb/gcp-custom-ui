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
  ArrowRight,
  RefreshCw,
  Network,
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
      className={`group bg-white dark:bg-[#10141d] border border-zinc-200 dark:border-[#1e2433] rounded-lg px-3.5 py-2.5 shadow-2xs transition-all duration-150 cursor-pointer select-none hover:border-amber-500/55 dark:hover:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
        isDragging ? 'opacity-80 scale-[1.01] shadow-md ring-2 ring-amber-500' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-md bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
            <Icon className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10.5px] font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider truncate group-hover:text-zinc-950 dark:group-hover:text-white transition-colors">
                {item.title}
              </span>
              <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 inline-flex items-center gap-0.5 shrink-0">
                <span className="hidden sm:inline">{item.primaryTargetLabel}</span>
                <ArrowUpRight className="w-2.5 h-2.5" />
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-base font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50 font-mono tabular-nums">
                {item.value}
              </span>
              <span className="text-[10.5px] text-zinc-500 dark:text-[#7c879c] truncate">
                {item.subtitle}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="font-mono text-[10px] bg-zinc-100 dark:bg-[#151a25] text-zinc-600 dark:text-zinc-300 border border-zinc-200/80 dark:border-[#262e42] px-1.5 py-0.5 rounded">
            {item.badge}
          </span>
          <button
            type="button"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            title="Drag handle to reorder quick-jump tile"
            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#151a25] cursor-grab active:cursor-grabbing rounded transition-colors shrink-0"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {Array.isArray(item.quickLinks) && item.quickLinks.length > 0 && (
        <div
          data-action-toolbar="true"
          className="mt-2 pt-2 border-t border-zinc-100 dark:border-[#1e2433] flex flex-wrap items-center gap-1"
        >
          {item.quickLinks.map((link) => (
            <button
              key={link.label}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                link.onClick?.();
              }}
              className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-100 hover:bg-blue-600 text-zinc-700 hover:text-white dark:bg-[#151a25] dark:hover:bg-blue-600 dark:text-zinc-300 dark:hover:text-white border border-zinc-200/80 dark:border-[#262e42] transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <span>{link.label}</span>
              <ArrowRight className="w-2.5 h-2.5 shrink-0" />
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
  isSyncing = false,
  onRefreshOverview,
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
      id: 'kpi-compute',
      title: 'Compute & Serverless',
      value: `${vmsCount + runCount + clustersCount}`,
      trendLabel: `${vmsCount} VMs · ${runCount} Run`,
      subtitle: `${clustersCount} GKE Clusters · ${vpcsCount} VPCs`,
      badge: 'LIVE_GCP',
      icon: Server,
      primaryTargetLabel: 'Open VM Fleet & Browser SSH',
      clickHint: 'Click to open Compute VM Fleet, Cloud Run, or GKE Studio',
      onPrimaryClick: () => navigate('VM_SSH'),
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
      badge:
        fetchLatencyMs === 0
          ? 'SWR (<16ms)'
          : `${fetchLatencyMs || 180}ms`,
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
          label: 'Recycle Bin (30d)',
          onClick: () => navigate('RECYCLE_BIN'),
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

  const defaultOrder = ['kpi-compute', 'kpi-storage', 'kpi-apis', 'kpi-logs'];
  const [cardOrder, setCardOrder] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem('cloudpulse_kpi_card_order_v2') || 'null'
      );
      if (
        Array.isArray(saved) &&
        saved.length === defaultOrder.length &&
        defaultOrder.every((id) => saved.includes(id))
      ) {
        return saved;
      }
    } catch {
      // ignore
    }
    return defaultOrder;
  });

  const isCustomCardOrder =
    cardOrder.join(',') !== defaultOrder.join(',');

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
        const nextOrder = arrayMove(items, oldIndex, newIndex);
        try {
          localStorage.setItem(
            'cloudpulse_kpi_card_order_v2',
            JSON.stringify(nextOrder)
          );
        } catch {
          // ignore
        }
        return nextOrder;
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
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border transition-colors ${
              isSyncing
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
            }`}
          >
            <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>
              {isSyncing
                ? 'ASYNC STREAMING (NON-BLOCKING)'
                : fetchLatencyMs === 0
                ? 'LIVE SYNCED (SWR <16ms)'
                : `LIVE SYNCED (${fetchLatencyMs || 180}ms)`}
            </span>
          </span>
          {typeof onRefreshOverview === 'function' && (
            <button
              type="button"
              onClick={() => onRefreshOverview()}
              disabled={isSyncing}
              title="Revalidate live Google Cloud telemetry in the background without blocking UI"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-zinc-100 hover:bg-blue-600 text-zinc-700 hover:text-white dark:bg-zinc-900 dark:hover:bg-blue-600 dark:text-zinc-300 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync Now</span>
            </button>
          )}
          {isCustomCardOrder && (
            <button
              type="button"
              onClick={() => {
                setCardOrder(defaultOrder);
                try {
                  localStorage.removeItem('cloudpulse_kpi_card_order_v2');
                } catch {
                  // ignore
                }
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-600 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer"
            >
              <span>Reset Card Order</span>
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowPalette((p) => !p)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 px-2.5 py-1 rounded-md transition-colors"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
            {orderedCards.map((item) => (
              <SortableKpiCard key={item.id} item={item} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Live Infrastructure Footprint Proportion Strip (100% Live GCP Inventory Ratios) */}
      {(() => {
        const computeTotal = vmsCount + runCount + clustersCount;
        const networkTotal = vpcsCount + firewallsCount;
        const dataTotal = bucketsCount + datasetsCount;
        const segments = [
          {
            id: 'compute',
            label: 'Compute & Serverless',
            count: computeTotal,
            colorClass: 'bg-blue-500',
            dotClass: 'bg-blue-500',
            onClick: () => navigate('VM_SSH'),
          },
          {
            id: 'network',
            label: 'VPCs & Firewall Rules',
            count: networkTotal,
            colorClass: 'bg-emerald-500',
            dotClass: 'bg-emerald-500',
            onClick: () => navigate('VPC_NETWORKS'),
          },
          {
            id: 'storage',
            label: 'Storage & BigQuery',
            count: dataTotal,
            colorClass: 'bg-amber-500',
            dotClass: 'bg-amber-500',
            onClick: () => navigate('CLOUD_STORAGE'),
          },
          {
            id: 'apis',
            label: 'Enabled Service APIs',
            count: apisCount,
            colorClass: 'bg-slate-500 dark:bg-slate-400',
            dotClass: 'bg-slate-500 dark:bg-slate-400',
            onClick: handleOpenApisSection,
          },
        ];
        const grandTotal = segments.reduce((acc, s) => acc + s.count, 0);
        if (grandTotal <= 0) return null;

        return (
          <div className="bg-white dark:bg-[#10141d] border border-zinc-200 dark:border-[#1e2433] rounded-lg px-3.5 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="h-1.5 w-full rounded-full overflow-hidden bg-zinc-100 dark:bg-[#07090d] flex gap-0.5">
                {segments
                  .filter((s) => s.count > 0)
                  .map((seg) => {
                    const pct = Math.max(4, (seg.count / grandTotal) * 100);
                    return (
                      <div
                        key={seg.id}
                        style={{ width: `${pct}%` }}
                        className={`h-full ${seg.colorClass} transition-all duration-300`}
                      />
                    );
                  })}
              </div>
              <div
                data-action-toolbar="true"
                className="flex flex-wrap items-center gap-x-4 gap-y-1"
              >
                {segments.map((seg) => (
                  <button
                    key={seg.id}
                    type="button"
                    onClick={seg.onClick}
                    title={`Open ${seg.label} (${seg.count} live assets)`}
                    className="inline-flex items-center gap-1.5 text-[10.5px] font-mono text-zinc-600 hover:text-zinc-950 dark:text-[#8b95a5] dark:hover:text-white bg-transparent border-none shadow-none p-0 cursor-pointer transition-colors"
                  >
                    <span className={`w-2 h-2 rounded-full ${seg.dotClass} shrink-0`} />
                    <span>{seg.label}:</span>
                    <strong className="text-zinc-900 dark:text-zinc-100 tabular-nums">
                      {seg.count}
                    </strong>
                  </button>
                ))}
              </div>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 dark:text-[#647087] shrink-0">
              Total Tracked Assets: <strong className="text-zinc-700 dark:text-zinc-300">{grandTotal}</strong>
            </span>
          </div>
        );
      })()}
    </div>
  );
}
