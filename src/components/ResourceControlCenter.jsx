import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import {
  Filter,
  ChevronDown,
  Search,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  X,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Terminal,
  Copy,
  Check,
  Database,
  HardDrive,
  Cpu,
  Layers,
  Trash2,
  RefreshCw,
  Network,
} from 'lucide-react';

const CATEGORY_OPTIONS = [
  { value: 'ALL', label: 'All Services' },
  { value: 'network', label: 'VPC Networks & Firewalls' },
  { value: 'compute', label: 'Compute VMs & Cloud Run' },
  { value: 'storage', label: 'Cloud Storage (GCS)' },
  { value: 'data', label: 'BigQuery & Data Cloud' },
  { value: 'ai', label: 'Vertex AI & Gemini' },
];

const SOURCE_OPTIONS = [
  { value: 'ALL', label: 'All (Live GCP + Telemetry)' },
  { value: 'LIVE_GCP', label: 'Strict Live GCP Only' },
];

export default function ResourceControlCenter({
  resources = [],
  projectId,
  onTriggerAction,
  onDeleteResource,
  actionLoading,
  onRunInShell,
  onAskCopilot,
}) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSource, setSelectedSource] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [sourceMenuOpen, setSourceMenuOpen] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingIds, setDeletingIds] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedUri, setCopiedUri] = useState(false);
  const pageSize = 6;

  // Filter without deleting raw data
  const filteredResources = useMemo(() => {
    return resources.filter((item) => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }
      if (selectedSource !== 'ALL' && item.source !== selectedSource) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.type.toLowerCase().includes(q) ||
          item.region.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [resources, selectedCategory, selectedSource, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredResources.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRows = filteredResources.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const selectedResource = useMemo(
    () => resources.find((r) => r.id === selectedResourceId) || null,
    [resources, selectedResourceId]
  );

  const handleCopy = (text) => {
    navigator.clipboard?.writeText(text);
    setCopiedUri(true);
    setTimeout(() => setCopiedUri(false), 1800);
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'network':
        return <Network className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />;
      case 'storage':
        return <HardDrive className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />;
      case 'data':
        return <Database className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />;
      case 'ai':
        return <Sparkles className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />;
      default:
        return <Cpu className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />;
    }
  };

  const formatReadableDate = (isoString) => {
    try {
      return format(new Date(isoString), 'MMM dd, yyyy');
    } catch {
      return 'Oct 09, 2026';
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar with relative z-30 so dropdowns stack above sticky table headers */}
      <div className="relative z-30 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-[#0c0c0f] p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setCategoryMenuOpen((o) => !o);
                setSourceMenuOpen(false);
              }}
              className="inline-flex items-center gap-2 bg-[#ffffff] dark:bg-[#262626] hover:bg-[#f8fafc] dark:hover:bg-zinc-800 text-[#334155] dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-[8px] px-[14px] py-[8px] text-xs font-[500] transition-colors shadow-sm"
            >
              <Filter className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span>
                {CATEGORY_OPTIONS.find((c) => c.value === selectedCategory)
                  ?.label || 'Service Type'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {categoryMenuOpen && (
              <div className="absolute left-0 mt-2 w-56 bg-[#ffffff] dark:bg-[#0c0c0f] shadow-lg border border-zinc-200 dark:border-zinc-800 rounded-[12px] py-1 z-40">
                {CATEGORY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(opt.value);
                      setCategoryMenuOpen(false);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs transition-colors flex items-center justify-between ${
                      selectedCategory === opt.value
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {selectedCategory === opt.value && (
                      <Check className="w-3.5 h-3.5" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Data Source Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setSourceMenuOpen((o) => !o);
                setCategoryMenuOpen(false);
              }}
              className="inline-flex items-center gap-2 bg-[#ffffff] dark:bg-[#262626] hover:bg-[#f8fafc] dark:hover:bg-zinc-800 text-[#334155] dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-[8px] px-[14px] py-[8px] text-xs font-[500] transition-colors shadow-sm"
            >
              <Layers className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span>
                {SOURCE_OPTIONS.find((s) => s.value === selectedSource)?.label}
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {sourceMenuOpen && (
              <div className="absolute left-0 mt-2 w-60 bg-[#ffffff] dark:bg-[#0c0c0f] shadow-lg border border-zinc-200 dark:border-zinc-800 rounded-[12px] py-1 z-40">
                {SOURCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSelectedSource(opt.value);
                      setSourceMenuOpen(false);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs transition-colors flex items-center justify-between ${
                      selectedSource === opt.value
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {selectedSource === opt.value && (
                      <Check className="w-3.5 h-3.5" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Filter resources, APIs, regions..."
            aria-label="Filter resources, APIs, regions"
            className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] pl-9 pr-3 py-[8px] text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-zinc-950 dark:text-zinc-100 transition-all"
          />
        </div>
      </div>

      {/* Main Content Split: w-full normal, w-2/3 + w-1/3 when selected */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        <div
          className={`transition-all duration-300 w-full ${
            selectedResource ? 'lg:w-2/3' : 'lg:w-full'
          }`}
        >
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[12px] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-900 z-10 text-zinc-500 dark:text-zinc-400 text-[11px] font-semibold uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="py-3.5 px-4">Resource / Service</th>
                    <th className="py-3.5 px-3">Source</th>
                    <th className="py-3.5 px-3">Region</th>
                    <th className="py-3.5 px-4">Load / Pressure</th>
                    <th className="py-3.5 px-3">MTD Spend</th>
                    <th className="py-3.5 px-4">Provisioned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-10 text-center text-zinc-500 dark:text-zinc-400"
                      >
                        No GCP resources match your current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((row) => {
                      const isSelected = row.id === selectedResourceId;
                      const isRowDeleting =
                        Boolean(deletingIds[row.id]) ||
                        row.status === 'DEPROVISIONING' ||
                        row.status === 'STOPPING';
                      const score = row.utilizationScore || 45;
                      const barColor =
                        score >= 80
                          ? 'bg-rose-500'
                          : score >= 60
                          ? 'bg-orange-400'
                          : 'bg-emerald-500';

                      return (
                        <tr
                          key={row.id}
                          onClick={() =>
                            !isRowDeleting &&
                            setSelectedResourceId(
                              isSelected ? null : row.id
                            )
                          }
                          className={`text-zinc-900 dark:text-zinc-200 border-b border-zinc-100 dark:border-zinc-800 transition-all ${
                            isRowDeleting
                              ? 'opacity-55 grayscale bg-rose-500/5 cursor-not-allowed select-none'
                              : isSelected
                              ? 'bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 cursor-pointer'
                              : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer'
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              {isRowDeleting ? (
                                <RefreshCw className="w-4 h-4 text-zinc-500 dark:text-zinc-400 animate-spin shrink-0" />
                              ) : (
                                getCategoryIcon(row.category)
                              )}
                              <div>
                                <div className="font-semibold text-zinc-950 dark:text-zinc-50 flex items-center gap-1.5">
                                  <span
                                    className={
                                      isRowDeleting
                                        ? 'line-through text-zinc-400 dark:text-zinc-500'
                                        : ''
                                    }
                                  >
                                    {row.name}
                                  </span>
                                  {isRowDeleting && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                                      DELETING...
                                    </span>
                                  )}
                                  {row.status === 'WARNING' && !isRowDeleting && (
                                    <AlertTriangle className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
                                  )}
                                </div>
                                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                  {row.type} ·{' '}
                                  <span className="font-mono">
                                    {row.storageClass}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                                row.source === 'LIVE_GCP'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-500/20'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-500/20'
                              }`}
                            >
                              {row.source === 'LIVE_GCP'
                                ? 'LIVE GCP'
                                : '2026 SIM'}
                            </span>
                          </td>

                          <td className="py-3.5 px-3">
                            <span className="font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded px-1.5 py-0.5 text-[11px]">
                              {row.region}
                            </span>
                          </td>

                          {/* Horizontal progress bar sparkline */}
                          <td className="py-3.5 px-4 min-w-[140px]">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-zinc-700 rounded-sm overflow-hidden">
                                <div
                                  className={`h-full ${barColor} rounded-sm transition-all duration-300`}
                                  style={{ width: `${score}%` }}
                                />
                              </div>
                              <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                                {score}%
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-3 font-mono font-medium">
                            ${(row.monthlyCostUsd || 0).toFixed(2)}
                          </td>

                          <td className="py-3.5 px-4 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                            {formatReadableDate(row.createdAt)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls: strictly icon-only buttons */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-[#0c0c0f]">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Showing{' '}
                <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                  {filteredResources.length === 0
                    ? 0
                    : (safePage - 1) * pageSize + 1}
                </span>{' '}
                to{' '}
                <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                  {Math.min(safePage * pageSize, filteredResources.length)}
                </span>{' '}
                of{' '}
                <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                  {filteredResources.length}
                </span>{' '}
                resources (Click any row to inspect)
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="First page"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage(1)}
                  className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="Previous page"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next page"
                  disabled={safePage >= totalPages}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="Last page"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Investigation / Details Side Panel (w-1/3 when selected) */}
        {selectedResource && (
          <div className="w-full lg:w-1/3 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-lg transition-all duration-300 space-y-4">
            <div className="flex items-start justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  {selectedResource.type}
                </span>
                <h4 className="text-base font-bold text-zinc-950 dark:text-zinc-50 mt-1 break-all">
                  {selectedResource.name}
                </h4>
              </div>
              <button
                type="button"
                aria-label="Close resource details"
                onClick={() => setSelectedResourceId(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stacked Metadata Blocks */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md p-3">
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  P95 Latency
                </div>
                <div className="text-sm font-bold font-mono text-zinc-950 dark:text-zinc-50 mt-0.5">
                  {selectedResource.p95LatencyMs} ms
                </div>
              </div>
              <div className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md p-3">
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Traffic RPM
                </div>
                <div className="text-sm font-bold font-mono text-zinc-950 dark:text-zinc-50 mt-0.5">
                  {selectedResource.requestsPerMin} req/m
                </div>
              </div>
              <div className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md p-3">
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Monthly Burn
                </div>
                <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                  ${(selectedResource.monthlyCostUsd || 0).toFixed(2)}/mo
                </div>
              </div>
              <div className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md p-3">
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Health Status
                </div>
                <div className="text-sm font-bold font-mono text-zinc-950 dark:text-zinc-50 mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                  <span>{selectedResource.status}</span>
                </div>
              </div>
            </div>

            {/* Resource URI & Copy */}
            <div className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md p-3">
              <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                <span>Resource URI / Endpoint</span>
                <button
                  type="button"
                  onClick={() => handleCopy(selectedResource.uri)}
                  className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-400"
                >
                  {copiedUri ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="font-mono text-xs text-zinc-800 dark:text-zinc-200 break-all">
                {selectedResource.uri}
              </div>
            </div>

            {/* Deep Inspection Attributes */}
            {selectedResource.details && (
              <div className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md p-3 space-y-1.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Live Configuration Metadata
                </div>
                {Object.entries(selectedResource.details).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-start justify-between gap-2 text-xs"
                  >
                    <span className="text-zinc-500 dark:text-zinc-400">{k}:</span>
                    <span className="font-mono text-zinc-900 dark:text-zinc-100 text-right">
                      {String(v)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Instant SRE & FinOps Action Buttons */}
            <div className="pt-2 flex flex-col gap-2">
              {selectedResource.status === 'WARNING' ? (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() =>
                    onTriggerAction({
                      actionType: 'ROLLBACK_CANARY',
                      targetId: selectedResource.id,
                    })
                  }
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-[8px] px-[16px] py-[9px] text-xs font-semibold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading
                    ? 'Applying Traffic Shift...'
                    : 'Approve 1-Tap Canary Rollback (100% Stable)'}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() =>
                    onTriggerAction({
                      actionType: 'OPTIMIZE_FINOPS',
                      targetId: selectedResource.id,
                      payload: {
                        newCostUsd: Number(
                          (selectedResource.monthlyCostUsd * 0.72).toFixed(2)
                        ),
                      },
                    })
                  }
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-[8px] px-[16px] py-[9px] text-xs font-semibold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading
                    ? 'Applying Policy...'
                    : 'Apply FinOps Autoclass / Rightsizing (-28% Cost)'}
                </button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onRunInShell(
                      selectedResource.category === 'storage'
                        ? `gcloud storage buckets list --project=${projectId}`
                        : `gcloud services list --enabled --project=${projectId}`
                    )
                  }
                  className="inline-flex items-center justify-center gap-1.5 bg-[#ffffff] dark:bg-[#262626] hover:bg-[#f8fafc] dark:hover:bg-zinc-800 text-[#334155] dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-[8px] px-3 py-2 text-xs font-[500] transition-colors shadow-sm"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Inspect in Shell</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onAskCopilot(
                      `Audit ${selectedResource.name} (${selectedResource.type}) in ${projectId}`
                    )
                  }
                  className="inline-flex items-center justify-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-[8px] px-3 py-2 text-xs font-[500] transition-colors shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Gemini RCA</span>
                </button>
              </div>

              {/* Delete / Emergency Disable Controls for Live Deletable GCP Resources & APIs */}
              {[
                'Compute Engine VM',
                'VPC Network',
                'VPC Firewall Rule',
                'Cloud Storage Bucket',
                'BigQuery Dataset',
                'Cloud Run Service',
                'Enabled GCP Service API',
              ].includes(selectedResource.type) &&
                onDeleteResource && (
                  <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    {confirmDeleteId === selectedResource.id ? (
                      <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 space-y-2">
                        <div className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                          {selectedResource.type === 'Enabled GCP Service API' ? (
                            <>
                              Emergency Kill-Switch: Disable{' '}
                              <span className="font-mono">
                                {selectedResource.details?.serviceName ||
                                  selectedResource.storageClass}
                              </span>{' '}
                              on {projectId}?
                            </>
                          ) : (
                            <>
                              Permanently delete {selectedResource.type}{' '}
                              <span className="font-mono">
                                {selectedResource.name}
                              </span>
                              ?
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={async () => {
                              const targetId = selectedResource.id;
                              setDeletingIds((prev) => ({
                                ...prev,
                                [targetId]: true,
                              }));
                              setConfirmDeleteId(null);
                              setSelectedResourceId(null);
                              await onDeleteResource({
                                ...selectedResource,
                                name:
                                  selectedResource.type ===
                                  'Enabled GCP Service API'
                                    ? selectedResource.details?.serviceName ||
                                      selectedResource.storageClass
                                    : selectedResource.name,
                              });
                            }}
                            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-50"
                          >
                            {actionLoading
                              ? 'Working...'
                              : selectedResource.type ===
                                'Enabled GCP Service API'
                              ? 'Yes, Disable API Now'
                              : 'Yes, Delete Permanently'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-3 py-1.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => setConfirmDeleteId(selectedResource.id)}
                        className="w-full inline-flex items-center justify-center gap-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-[8px] px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>
                          {selectedResource.type === 'Enabled GCP Service API'
                            ? `Emergency Disable API (${
                                selectedResource.details?.serviceName ||
                                selectedResource.storageClass
                              })`
                            : `Delete ${selectedResource.type}`}
                        </span>
                      </button>
                    )}
                  </div>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
