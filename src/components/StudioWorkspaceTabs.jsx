import React, { useState } from 'react';
import { SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Borderless 2026 Open-Canvas Studio Shell.
 * Dissolves the nested box cage: editorial display typography sits directly on
 * the open canvas with generous negative space, crisp underline/pill focus tabs,
 * and an optional "Studio Tools & Playbooks" disclosure drawer.
 */
export default function StudioWorkspaceTabs({
  studioTitle,
  studioSubtitle,
  tabs = [],
  defaultTabId,
  activeTabId: controlledTabId,
  onTabChange,
  secondaryTools = null,
  secondaryToolsLabel = 'Studio Tools & Playbooks',
}) {
  const [internalTabId, setInternalTabId] = useState(
    defaultTabId || tabs[0]?.id || ''
  );
  const [toolsOpen, setToolsOpen] = useState(false);

  const currentTabId = controlledTabId || internalTabId;
  const activeTab = tabs.find((t) => t.id === currentTabId) || tabs[0] || null;

  const handleSelect = (id) => {
    setInternalTabId(id);
    if (onTabChange) onTabChange(id);
  };

  return (
    <div className="space-y-8">
      {/* Open-Canvas Editorial Studio Header (Zero outer box!) */}
      <div className="space-y-5 pb-5 border-b border-zinc-200/80 dark:border-white/[0.08]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0 space-y-1.5">
            {studioTitle && (
              <h1 className="text-2xl sm:text-[1.85rem] font-bold tracking-tight text-zinc-950 dark:text-zinc-50 leading-tight">
                {studioTitle}
              </h1>
            )}
            {studioSubtitle && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-3xl leading-relaxed">
                {studioSubtitle}
              </p>
            )}
          </div>

          {secondaryTools && (
            <button
              type="button"
              onClick={() => setToolsOpen((v) => !v)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer shrink-0 ${
                toolsOpen
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-300'
                  : 'bg-white/70 hover:bg-white dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border-zinc-200/90 dark:border-white/[0.1] text-zinc-600 dark:text-zinc-300'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>{secondaryToolsLabel}</span>
              {toolsOpen ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>

        {tabs.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab?.id === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleSelect(tab.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-zinc-950 font-semibold shadow-sm'
                      : 'bg-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-white/[0.06]'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4 shrink-0" />}
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[11px] font-mono px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? 'bg-zinc-950/15 text-zinc-950'
                          : 'bg-zinc-200/80 dark:bg-white/[0.08] text-zinc-600 dark:text-zinc-300'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {secondaryTools && toolsOpen && (
          <div className="pt-4 space-y-4 cp-studio-enter">
            {secondaryTools}
          </div>
        )}
      </div>

      {/* Unboxed Open-Canvas Workspace */}
      <div className="min-w-0 cp-studio-enter">
        {activeTab ? activeTab.render() : null}
      </div>
    </div>
  );
}
