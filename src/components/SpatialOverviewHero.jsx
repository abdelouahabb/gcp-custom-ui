import React from 'react';
import {
  Server,
  Database,
  ShieldCheck,
  DollarSign,
  ArrowUpRight,
  PlusCircle,
  Search,
  Maximize2,
  Activity,
  Cloud,
  Layers,
} from 'lucide-react';

/**
 * 2026 Spatial Mission Control Hero for OVERVIEW.
 * Breaks out of nested boxes: floating editorial KPI numerals on an open canvas
 * + 4 generous, tactile Domain Portals with live GCP telemetry.
 */
export default function SpatialOverviewHero({
  projectId,
  overview,
  liveBurn,
  onNavigateTab,
  onOpenProvision,
  onOpenCommandPalette,
  onToggleZenMode,
}) {
  const vmCount =
    overview?.summary?.liveVmsCount ?? overview?.summary?.totalVms ?? 0;
  const runCount = overview?.cloudRunServices?.length || 0;
  const bucketCount =
    overview?.summary?.liveBucketsCount ?? overview?.summary?.storageBuckets ?? 0;
  const vpcCount = overview?.vpcs?.length || 0;
  const apiCount = overview?.enabledApis?.length || 0;
  const totalResources = overview?.resources?.length || 0;
  const monthlyBurn = Number(liveBurn?.monthly || 0);

  const portals = [
    {
      id: 'VM_SSH',
      title: 'Compute & Global Edge',
      tagline: 'GCE VMs, IAP SSH, Cloud Run, GKE & VPC Firewalls',
      icon: Server,
      accent: 'from-blue-500/10 via-transparent to-transparent',
      iconColor: 'text-blue-600 dark:text-blue-400',
      metrics: `${vmCount} VMs · ${runCount} Cloud Run · ${vpcCount} VPCs`,
      quickLinks: [
        { label: 'GCE VMs & CVEs', tab: 'VM_SSH' },
        { label: 'Cloud Run', tab: 'CLOUD_RUN' },
        { label: 'GKE Fleet', tab: 'GKE_STUDIO' },
        { label: 'VPC & Firewalls', tab: 'VPC_NETWORKS' },
      ],
    },
    {
      id: 'BIGQUERY_STUDIO',
      title: 'Data, Lakehouse & Gemini AI',
      tagline: 'BigQuery SQL & Lineage, AlloyDB, Managed Spark & Storage',
      icon: Database,
      accent: 'from-emerald-500/10 via-transparent to-transparent',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      metrics: `${bucketCount} Buckets · Gemini 4 · Live Lineage`,
      quickLinks: [
        { label: 'BigQuery & Lineage', tab: 'BIGQUERY_STUDIO' },
        { label: 'AlloyDB Mastery', tab: 'ALLOYDB_STUDIO' },
        { label: 'Data Fabric & GQL', tab: 'DATA_ENGINEER_STUDIO' },
        { label: 'Cloud Storage', tab: 'CLOUD_STORAGE' },
      ],
    },
    {
      id: 'SRE_WAR_ROOM',
      title: 'SRE Reliability & Security',
      tagline: 'Live SLI/SLO Attainment, SCC v2 Vulnerabilities & IAM/PAM JIT',
      icon: ShieldCheck,
      accent: 'from-amber-500/10 via-transparent to-transparent',
      iconColor: 'text-amber-600 dark:text-amber-400',
      metrics: 'SLI/SLO Fuel Gauge · Zero-Org SCC · PAM JIT',
      quickLinks: [
        { label: 'SLI / SLO Cockpit', tab: 'SRE_WAR_ROOM' },
        { label: 'Sovereign IAM', tab: 'SOVEREIGN_STUDIO' },
        { label: 'Cloud SOC', tab: 'CLOUD_SOC' },
      ],
    },
    {
      id: 'FINOPS',
      title: 'FinOps, Logging & Operations',
      tagline: 'Burn-Rate Guardian, Logging Spend Auditor & Idle-Zombie Executor',
      icon: DollarSign,
      accent: 'from-sky-500/10 via-transparent to-transparent',
      iconColor: 'text-sky-600 dark:text-sky-400',
      metrics: `$${monthlyBurn.toFixed(2)}/mo Run-Rate · ${apiCount} Active APIs`,
      quickLinks: [
        { label: 'FinOps & Zombies', tab: 'FINOPS' },
        { label: 'Logs & Shell', tab: 'LOGS_SHELL' },
        { label: 'Global Map', tab: 'GLOBAL_MAP' },
      ],
    },
  ];

  return (
    <div className="space-y-10">
      {/* Open-Canvas Live Telemetry Ribbon (Zero Box Cage!) */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-zinc-200/80 dark:border-white/[0.08]">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-12 flex-1">
          <button
            type="button"
            onClick={() => onNavigateTab('VM_SSH')}
            className="text-left group cursor-pointer bg-transparent border-none p-0"
          >
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-blue-500" />
              Active Fleet
            </div>
            <div className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-white tabular-nums group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {totalResources}
            </div>
            <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {vmCount} VMs · {runCount} Run · {bucketCount} GCS
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('FINOPS')}
            className="text-left group cursor-pointer bg-transparent border-none p-0"
          >
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              Projected Run-Rate
            </div>
            <div className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-white tabular-nums group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              ${monthlyBurn.toFixed(0)}
              <span className="text-base font-medium text-zinc-400">/mo</span>
            </div>
            <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              ${Number(liveBurn?.hourly || 0).toFixed(4)}/hr live burn
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('SRE_WAR_ROOM')}
            className="text-left group cursor-pointer bg-transparent border-none p-0"
          >
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-500" />
              Reliability &amp; SLOs
            </div>
            <div className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-white tabular-nums group-hover:text-amber-500 transition-colors">
              Live
            </div>
            <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Open SLI / SLO Cockpit →
            </div>
          </button>

          <div className="text-left">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
              Enabled GCP APIs
            </div>
            <div className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-white tabular-nums">
              {apiCount}
            </div>
            <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 font-mono truncate">
              {projectId}
            </div>
          </div>
        </div>

        {/* Clean Action Cluster */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onOpenProvision('COMPUTE_VM')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Provision Resource</span>
          </button>
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.04] hover:bg-zinc-50 dark:hover:bg-white/[0.08] text-zinc-800 dark:text-zinc-200 text-xs font-medium transition cursor-pointer"
          >
            <Search className="w-4 h-4 text-zinc-400" />
            <span>Command Palette</span>
            <kbd className="cp-kbd">⌘K</kbd>
          </button>
          <button
            type="button"
            onClick={onToggleZenMode}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.04] hover:bg-zinc-50 dark:hover:bg-white/[0.08] text-zinc-800 dark:text-zinc-200 text-xs font-medium transition cursor-pointer"
            title="Enter Full-Bleed Zen Canvas (Alt+Z)"
          >
            <Maximize2 className="w-4 h-4 text-zinc-400" />
            <span>Zen Canvas</span>
          </button>
        </div>
      </div>

      {/* 4 Spacious Visual Domain Portals (2x2 Airy Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {portals.map((portal) => {
          const Icon = portal.icon;
          return (
            <div
              key={portal.id}
              className="group relative rounded-2xl border border-zinc-200/80 dark:border-white/[0.09] bg-white dark:bg-[#0e131e] p-6 sm:p-7 transition-all duration-200 hover:border-zinc-300 dark:hover:border-white/[0.18] hover:shadow-lg flex flex-col justify-between gap-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-white/[0.05]">
                      <Icon className={`w-5 h-5 ${portal.iconColor}`} />
                    </div>
                    <h3 className="text-lg font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                      {portal.title}
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-md">
                    {portal.tagline}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateTab(portal.id)}
                  className="p-2 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition cursor-pointer shrink-0"
                  title={`Open ${portal.title}`}
                >
                  <ArrowUpRight className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                  {portal.metrics}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {portal.quickLinks.map((ql) => (
                    <button
                      key={ql.tab}
                      type="button"
                      onClick={() => onNavigateTab(ql.tab)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100/90 hover:bg-amber-500 hover:text-zinc-950 dark:bg-white/[0.05] dark:hover:bg-amber-500 dark:hover:text-zinc-950 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer"
                    >
                      {ql.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
