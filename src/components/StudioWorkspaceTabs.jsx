import React, { useState } from 'react';
import { SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Calm, Linear/Vercel-inspired studio sub-navigation shell.
 * Displays ONE focused panel at a time (eliminating vertical rush-hour stacking)
 * and tucks secondary chrome (architecture chains, GCP advantage bars, persona helpers)
 * into an optional "Studio Tools" collapsible drawer that stays closed by default.
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
    <div className="space-y-7">
      {/* Calm Studio Header + Single-Row Focus Tabs */}
      <div className="rounded-xl border border-zinc-200/80 dark:border-[#1e2433] bg-white dark:bg-[#0d111a] px-5 sm:px-6 pt-5 pb-4 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            {studioTitle && (
              <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 truncate">
                {studioTitle}
              </h2>
            )}
            {studioSubtitle && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {studioSubtitle}
              </p>
            )}
          </div>

          {secondaryTools && (
            <button
              type="button"
              onClick={() => setToolsOpen((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer shrink-0 ${
                toolsOpen
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-300'
                  : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-[#131824] dark:hover:bg-[#1a2233] border-zinc-200 dark:border-[#242c3f] text-zinc-600 dark:text-zinc-300'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
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
          <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-zinc-100 dark:border-[#181f2e]">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab?.id === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleSelect(tab.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-zinc-950 font-semibold shadow-2xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/80 dark:hover:bg-[#151c2c]'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? 'bg-zinc-950/15 text-zinc-950'
                          : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
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
          <div className="pt-3 mt-1 border-t border-zinc-200/80 dark:border-[#1e2433] space-y-3 cp-studio-enter">
            {secondaryTools}
          </div>
        )}
      </div>

      {/* Focused Single-Workspace Canvas */}
      <div className="min-w-0 cp-studio-enter">
        {activeTab ? activeTab.render() : null}
      </div>
    </div>
  );
}
