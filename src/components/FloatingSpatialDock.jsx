import React from 'react';
import {
  Search,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import {
  GcpLogoIcon,
  GcpComputeEngineIcon,
  GcpBigQueryIcon,
  GcpSecurityIcon,
  GcpBillingIcon,
  GcpLoggingIcon,
} from './GcpProductIcons';

/**
 * 2026 Floating Frosted-Glass Spatial Dock.
 * Anchored cleanly at bottom-center when Zen Focus Canvas (Alt+Z) is active,
 * giving instant 1-click navigation without side/top chrome walls.
 */
export default function FloatingSpatialDock({
  activeTab,
  zenMode,
  onSelectTab,
  onOpenCommandPalette,
  onToggleZenMode,
}) {
  const dockItems = [
    { id: 'OVERVIEW', label: 'Overview', icon: GcpLogoIcon },
    { id: 'VM_SSH', label: 'GCE VMs', icon: GcpComputeEngineIcon },
    { id: 'BIGQUERY_STUDIO', label: 'BigQuery', icon: GcpBigQueryIcon },
    { id: 'SRE_WAR_ROOM', label: 'SRE & SLOs', icon: GcpSecurityIcon },
    { id: 'FINOPS', label: 'FinOps', icon: GcpBillingIcon },
    { id: 'LOGS_SHELL', label: 'Logs & Shell', icon: GcpLoggingIcon },
  ];

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[110] pointer-events-auto">
      <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-2xl bg-white/85 dark:bg-[#0d121d]/85 backdrop-blur-xl border border-zinc-200/90 dark:border-white/[0.12] shadow-2xl">
        {dockItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              title={item.label}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-zinc-950 font-semibold shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-white/[0.08]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">{item.label}</span>
            </button>
          );
        })}

        <div className="w-px h-5 bg-zinc-200 dark:bg-white/[0.12] mx-1" />

        <button
          type="button"
          onClick={onOpenCommandPalette}
          title="Command Palette (⌘K / Alt+P)"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-white/[0.08] transition cursor-pointer"
        >
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline font-mono">⌘K</span>
        </button>

        <button
          type="button"
          onClick={onToggleZenMode}
          title={zenMode ? 'Exit Full-Bleed Zen Canvas (Alt+Z)' : 'Enter Full-Bleed Zen Canvas (Alt+Z)'}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
            zenMode
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-white/[0.08]'
          }`}
        >
          {zenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          <span className="hidden sm:inline">{zenMode ? 'Exit Zen' : 'Zen'}</span>
        </button>
      </div>
    </div>
  );
}
