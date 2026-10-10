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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm transition-all duration-300 hover:border-blue-500/40 ${
        isDragging ? 'opacity-80 scale-[1.02] shadow-xl ring-2 ring-blue-500' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            {item.title}
          </span>
        </div>
        <button
          type="button"
          {...attributes}
          {...listeners}
          title="Drag to reorder KPI card"
          className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-grab active:cursor-grabbing rounded transition-colors"
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
        <span>{item.subtitle}</span>
        <span className="font-mono text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-1.5 py-0.5 rounded">
          {item.badge}
        </span>
      </div>
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

export default function SortableKpiRow({ summary, fetchLatencyMs }) {
  const { chartColors, setChartColors } = useTheme();
  const [showPalette, setShowPalette] = useState(false);

  const initialCards = [
    {
      id: 'kpi-storage',
      title: 'Storage & Datasets',
      value: `${(summary?.liveBucketsCount || 0) + (summary?.liveDatasetsCount || 0)}`,
      trendLabel: `${summary?.liveBucketsCount || 0} GCS · ${summary?.liveDatasetsCount || 0} BQ`,
      subtitle: 'storage & bigquery APIs',
      badge: 'LIVE_GCP',
      icon: HardDrive,
    },
    {
      id: 'kpi-compute',
      title: 'Compute & Serverless',
      value: `${(summary?.liveVmsCount || 0) + (summary?.liveRunCount || 0) + (summary?.liveClustersCount || 0)}`,
      trendLabel: `${summary?.liveVmsCount || 0} VMs · ${summary?.liveRunCount || 0} Run`,
      subtitle: `${summary?.liveClustersCount || 0} GKE Clusters`,
      badge: 'LIVE_GCP',
      icon: Server,
    },
    {
      id: 'kpi-apis',
      title: 'Enabled Service APIs',
      value: `${summary?.enabledApisCount || 0}`,
      trendLabel: 'Active Quota',
      subtitle: 'serviceusage.googleapis.com',
      badge: 'ENABLED',
      icon: ShieldCheck,
    },
    {
      id: 'kpi-logs',
      title: 'Cloud Audit Stream',
      value: `${summary?.liveLogsCount || 0} events`,
      trendLabel: 'Live Tail Ready',
      subtitle: 'logging.googleapis.com',
      badge: `${fetchLatencyMs || 240}ms`,
      icon: Activity,
    },
  ];

  const [cardOrder, setCardOrder] = useState([
    'kpi-storage',
    'kpi-compute',
    'kpi-apis',
    'kpi-logs',
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
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
      <div className="flex items-center justify-between">
        <h6 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          100% Live Google Cloud Project Telemetry (Drag Cards to Reorder)
        </h6>
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
        <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 transition-all duration-300">
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
