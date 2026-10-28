import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { useTimezone } from '../context/TimezoneContext';
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

/**
 * Deterministic Forensic Resource Lineage & Stale/Orphaned Detector.
 * Explains how each resource in the project got created, what active workloads
 * it is currently attached to, and flags leftover/stale resources that remained
 * after their parent compute/migration/demo workflow was removed.
 */
function analyzeResourceLineage(row, allResources = [], projectId = '') {
  const name = String(row?.name || '');
  const lower = name.toLowerCase();
  const type = String(row?.type || '');
  const details = row?.details || {};

  const vms = allResources.filter((r) => r.type === 'Compute Engine VM');
  const cloudRunServices = allResources.filter((r) => r.type === 'Cloud Run Service');
  const buckets = allResources.filter((r) => r.type === 'Cloud Storage Bucket');
  const datasets = allResources.filter((r) => r.type === 'BigQuery Dataset');

  // 0. Enabled GCP Service APIs (Must be checked first so data/AI APIs are never confused with Datasets/Buckets)
  if (type === 'Enabled GCP Service API') {
    const svcName = String(details.serviceName || row?.storageClass || name).toLowerCase();
    const isComputeCore =
      svcName.includes('compute.googleapis.com') ||
      svcName.includes('iam') ||
      svcName.includes('cloudresourcemanager') ||
      svcName.includes('logging') ||
      svcName.includes('monitoring') ||
      svcName.includes('serviceusage');

    const hasBackingResources =
      (svcName.includes('compute') && vms.length > 0) ||
      (svcName.includes('storage') && buckets.length > 0) ||
      (svcName.includes('bigquery.googleapis.com') && datasets.length > 0) ||
      (svcName.includes('run.googleapis.com') && cloudRunServices.length > 0) ||
      isComputeCore;

    if (!hasBackingResources) {
      return {
        isStale: true,
        badgeLabel: 'UNUSED ENABLED API ($0/mo)',
        badgeTone: 'amber',
        targetTab: 'OVERVIEW',
        originTitle: `Enabled Google Cloud API (${svcName})`,
        howCreated: `Enabled on project "${projectId}" when provisioning or testing ${name} workloads.`,
        whyStayed: `In Google Cloud, enabling a Service API (${svcName}) remains active on the project even after all datasets, buckets, or instances using it are deleted.`,
        attachedTo: `0 active ${name.replace(/ API$/i, '')} resources in ${projectId}`,
        recommendation: `No billing charge while idle ($0.00/mo), or click "Disable API" to turn off ${svcName} for strict least-privilege hygiene.`,
      };
    }

    return {
      isStale: false,
      badgeLabel: 'ACTIVE SERVICE API',
      badgeTone: 'emerald',
      targetTab: 'OVERVIEW',
      originTitle: `Active Google Cloud Service API (${svcName})`,
      howCreated: `Enabled on project "${projectId}".`,
      whyStayed: 'Actively required by running project infrastructure.',
      attachedTo: `Backing active workloads in ${projectId}`,
      recommendation: 'Keep enabled — required by your active project resources.',
    };
  }

  // 1. Cloud Storage Buckets
  if (type === 'Cloud Storage Bucket') {
    // Check if this is a VM-to-Cloud Run migration FUSE disk bucket (<projectId>-vmdisk-<vmName>)
    const vmDiskMatch = lower.match(/-vmdisk-(.+)$/);
    if (vmDiskMatch) {
      const targetVmName = vmDiskMatch[1];
      const matchingVm = vms.find((v) => v.name.toLowerCase() === targetVmName);
      const matchingCloudRun = cloudRunServices.find(
        (cr) =>
          cr.name.toLowerCase().includes(targetVmName) ||
          JSON.stringify(cr.details || {}).toLowerCase().includes(lower)
      );

      if (!matchingCloudRun) {
        return {
          isStale: true,
          badgeLabel: 'STALE MIGRATION ARTIFACT',
          badgeTone: 'amber',
          targetTab: 'CLOUD_STORAGE',
          originTitle: 'VM-to-Cloud Run Migration Disk Bucket (MOUNT_GCS_FUSE_DISK)',
          howCreated: `Auto-created when migrating GCE VM "${targetVmName}" to Cloud Run Gen2 (gs://${name}) to hold extracted VM disk files for Cloud Storage FUSE mounting.`,
          whyStayed: `When the migrated Cloud Run service was deleted, Google Cloud preserved this backing Cloud Storage bucket so your extracted disk files would not be lost.`,
          attachedTo: matchingVm
            ? `0 Cloud Run mounts (VM "${matchingVm.name}" runs on its own persistent boot disk, not this bucket)`
            : '0 active workloads',
          recommendation: 'Click "Clean Up" to permanently delete this leftover migration bucket, or "Open Studio" to inspect its files first.',
        };
      }

      return {
        isStale: false,
        badgeLabel: 'ACTIVE FUSE VOLUME',
        badgeTone: 'emerald',
        targetTab: 'CLOUD_STORAGE',
        originTitle: 'Cloud Run Gen2 GCS FUSE Volume Bucket',
        howCreated: `Created by VM-to-Cloud Run Migration for "${targetVmName}".`,
        whyStayed: 'Actively mounted by a live Cloud Run service.',
        attachedTo: `Cloud Run Service: ${matchingCloudRun.name}`,
        recommendation: 'Keep — actively mounted by Cloud Run.',
      };
    }

    // Check if created by Innovation Lab / Flight Deck / Demo provisioners
    if (
      lower.includes('flying-car-telemetry') ||
      lower.includes('starlink') ||
      lower.includes('neuralink') ||
      lower.includes('roadster') ||
      lower.includes('canary- sink') ||
      lower.includes('demo-telemetry')
    ) {
      return {
        isStale: true,
        badgeLabel: 'STALE DEMO BUCKET',
        badgeTone: 'amber',
        targetTab: 'CLOUD_STORAGE',
        originTitle: 'Innovation Lab 1-Click Telemetry Provisioner',
        howCreated: `Created during an Innovation Lab (eVTOL / Telemetry Flight Deck) 1-click provisioning test in project "${projectId}".`,
        whyStayed: 'Cloud Storage buckets are persistent stateful resources and do not auto-delete when you leave or reset a studio demo.',
        attachedTo: '0 active Compute / Cloud Run / Dataflow workloads',
        recommendation: 'Click "Clean Up" to purge all demo objects and delete this bucket.',
      };
    }

    // Check if any Cloud Run service or VM explicitly references this bucket
    const attachedWorkloads = [...cloudRunServices, ...vms].filter((w) =>
      JSON.stringify(w.details || {}).toLowerCase().includes(lower)
    );

    if (attachedWorkloads.length === 0) {
      return {
        isStale: true,
        badgeLabel: 'UNATTACHED BUCKET',
        badgeTone: 'amber',
        targetTab: 'CLOUD_STORAGE',
        originTitle: 'Standalone Cloud Storage Bucket',
        howCreated: `Provisioned via GCP Storage API (${row.region || 'US'}, ${row.storageClass || 'STANDARD'}).`,
        whyStayed: 'Decoupled object storage persists independently of compute VMs or Cloud Run services.',
        attachedTo: '0 active VMs or Cloud Run volume mounts verified',
        recommendation: 'Click "Open Studio" to browse objects in Cloud Storage Studio, or "Clean Up" to delete if no longer needed.',
      };
    }

    return {
      isStale: false,
      badgeLabel: 'ACTIVE BUCKET',
      badgeTone: 'emerald',
      targetTab: 'CLOUD_STORAGE',
      originTitle: 'Attached Cloud Storage Bucket',
      howCreated: `Provisioned in ${row.region || 'US'}.`,
      whyStayed: 'Actively referenced by live compute workloads.',
      attachedTo: attachedWorkloads.map((w) => `${w.type}: ${w.name}`).join(', '),
      recommendation: 'Keep — in active use.',
    };
  }

  // 2. BigQuery Datasets
  if (type === 'BigQuery Dataset') {
    if (
      lower.includes('flying_car_telemetry') ||
      lower.includes('starlink_orbital_failover') ||
      lower.includes('telemetry_lakehouse')
    ) {
      const studioSource = lower.includes('starlink')
        ? 'Global Edge & Prompt-to-DAG Studio (Multi-Region Failover Streamer)'
        : 'Innovation Lab Telemetry & Lakehouse 1-Click Provisioner';
      return {
        isStale: true,
        badgeLabel: 'STALE DEMO DATASET',
        badgeTone: 'amber',
        targetTab: 'BIGQUERY_STUDIO',
        originTitle: studioSource,
        howCreated: `Created via BigQuery REST API when testing ${studioSource} in "${projectId}".`,
        whyStayed: 'BigQuery datasets are persistent analytical schemas that remain in your project after a test stream finishes.',
        attachedTo: '0 active Cloud Run / Dataflow / VM ingestion pipelines',
        recommendation: 'Click "Clean Up" to drop this demo dataset and its tables, or "Open Studio" to query it in BigQuery Studio.',
      };
    }

    const attachedConsumers = [...cloudRunServices, ...vms].filter((w) =>
      JSON.stringify(w.details || {}).toLowerCase().includes(lower)
    );

    if (attachedConsumers.length === 0) {
      return {
        isStale: true,
        badgeLabel: 'STANDALONE DATASET',
        badgeTone: 'amber',
        targetTab: 'BIGQUERY_STUDIO',
        originTitle: 'Standalone BigQuery Analytical Dataset',
        howCreated: `Provisioned in location ${row.region || 'US'}.`,
        whyStayed: 'BigQuery datasets persist independently of compute VMs until explicitly dropped.',
        attachedTo: '0 active compute workloads referencing this dataset ID',
        recommendation: 'Click "Open Studio" to inspect tables in BigQuery Studio, or "Clean Up" to delete the dataset.',
      };
    }

    return {
      isStale: false,
      badgeLabel: 'ACTIVE DATASET',
      badgeTone: 'emerald',
      targetTab: 'BIGQUERY_STUDIO',
      originTitle: 'Connected BigQuery Lakehouse Dataset',
      howCreated: `Provisioned in ${row.region || 'US'}.`,
      whyStayed: 'Referenced by active workloads.',
      attachedTo: attachedConsumers.map((w) => `${w.type}: ${w.name}`).join(', '),
      recommendation: 'Keep — active analytical dataset.',
    };
  }

  // 3. Compute Engine VMs
  if (type === 'Compute Engine VM') {
    const netName = details.network || 'default';
    return {
      isStale: false,
      badgeLabel: 'ACTIVE VM WORKLOAD',
      badgeTone: 'emerald',
      originTitle: `Live GCE Instance (${details.machineType || row.storageClass || 'e2-medium'})`,
      howCreated: `Provisioned in zone ${details.zone || row.region} with persistent boot disk.`,
      whyStayed: `Currently ${row.status || 'RUNNING'} in Compute Engine.`,
      attachedTo: `VPC Network "${netName}" (${details.internalIp || 'nic0'})`,
      recommendation: 'Active compute instance.',
    };
  }

  // 4. VPC Networks & Firewall Rules
  if (type === 'VPC Network' || type === 'VPC Firewall Rule' || row?.category === 'network') {
    const attachedVmNames = vms.map((v) => v.name);
    return {
      isStale: false,
      badgeLabel: attachedVmNames.length > 0 ? 'ACTIVE PERIMETER' : 'DEFAULT VPC PERIMETER',
      badgeTone: 'blue',
      originTitle: type === 'VPC Network' ? 'Project VPC Network Backbone' : 'VPC Firewall Security Rule',
      howCreated:
        lower.startsWith('default')
          ? 'Auto-created by Google Cloud when Compute Engine API was initialized for the project.'
          : `Configured on VPC network (${details.direction || 'INGRESS'} ${details.allowed || ''}).`,
      whyStayed: 'Core VPC network perimeter governing project ingress/egress.',
      attachedTo:
        attachedVmNames.length > 0
          ? `Protecting ${attachedVmNames.length} VM(s): ${attachedVmNames.join(', ')}`
          : 'Project VPC perimeter (0 running VMs)',
      recommendation: 'Core network infrastructure.',
    };
  }

  // 5. Fallback for Cloud Run, GKE, Enabled APIs, etc.
  return {
    isStale: false,
    badgeLabel: 'ACTIVE RESOURCE',
    badgeTone: 'emerald',
    originTitle: `${type || 'GCP Resource'}`,
    howCreated: `Provisioned in ${row.region || 'global'}.`,
    whyStayed: 'Active resource in project inventory.',
    attachedTo: `Project ${projectId}`,
    recommendation: 'Active project resource.',
  };
}

export default function ResourceControlCenter({
  resources = [],
  projectId,
  onTriggerAction,
  onDeleteResource,
  actionLoading,
  onRunInShell,
  onAskCopilot,
  onSelectTab,
}) {
  const { formatShortDate, shortTzName } = useTimezone();
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSource, setSelectedSource] = useState('ALL');
  const [onlyStaleFilter, setOnlyStaleFilter] = useState(false);
  const [lineageDrawerOpen, setLineageDrawerOpen] = useState(false);
  const [lineageDrawerTab, setLineageDrawerTab] = useState('STALE'); // 'STALE' | 'ALL'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [sourceMenuOpen, setSourceMenuOpen] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState(null);
  const [deletingIds, setDeletingIds] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedUri, setCopiedUri] = useState(false);
  const pageSize = 6;

  // Compute lineage & stale analysis for every resource in the project
  const lineageById = useMemo(() => {
    const map = {};
    for (const r of resources) {
      map[r.id] = analyzeResourceLineage(r, resources, projectId);
    }
    return map;
  }, [resources, projectId]);

  const staleResources = useMemo(
    () => resources.filter((r) => lineageById[r.id]?.isStale),
    [resources, lineageById]
  );

  // Filter without deleting raw data
  const filteredResources = useMemo(() => {
    return resources.filter((item) => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }
      if (selectedSource !== 'ALL' && item.source !== selectedSource) {
        return false;
      }
      if (onlyStaleFilter && !lineageById[item.id]?.isStale) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const lin = lineageById[item.id];
        return (
          item.name.toLowerCase().includes(q) ||
          item.type.toLowerCase().includes(q) ||
          item.region.toLowerCase().includes(q) ||
          (lin?.badgeLabel || '').toLowerCase().includes(q) ||
          (lin?.originTitle || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [resources, selectedCategory, selectedSource, onlyStaleFilter, searchQuery, lineageById]);

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
      return `${formatShortDate(isoString)} (${shortTzName})`;
    } catch {
      return format(new Date(), 'MMM dd, yyyy');
    }
  };

  return (
    <div className="space-y-4">
      {/* Big Hero Button & Expandable Drawer: Resource Lineage & Stale/Orphaned Detector */}
      <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <Sparkles className="w-3 h-3" />
                <span>Resource Lineage & Orphan Forensics</span>
              </span>
              {staleResources.length > 0 ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  <AlertTriangle className="w-3 h-3" />
                  <span>
                    {staleResources.length} Stale / Leftover Resource
                    {staleResources.length === 1 ? '' : 's'} Detected
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>0 Stale / Leftover Resources</span>
                </span>
              )}
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-zinc-950 dark:text-zinc-50">
              Why Do I Have These Resources? · Lineage & Stale Detector
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              See exactly how every bucket, dataset, VM, and network rule in{' '}
              <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-200">
                {projectId}
              </span>{' '}
              got created, what it is attached to, and which ones stayed behind after a migration or demo was removed.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              data-feature-id="OVERVIEW_LINEAGE_TOGGLE"
              onClick={() => {
                setLineageDrawerOpen((open) => !open);
                if (!lineageDrawerOpen) {
                  setLineageDrawerTab(staleResources.length > 0 ? 'STALE' : 'ALL');
                }
              }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-xs sm:text-sm font-extrabold transition-all shadow-sm cursor-pointer ${
                lineageDrawerOpen
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {lineageDrawerOpen
                  ? 'Hide Resource Lineage & Stale Detector'
                  : `Inspect Resource Lineage & Stale Leftovers (${staleResources.length} Stale / ${resources.length} Total)`}
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  lineageDrawerOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Expandable Forensic Lineage & Stale Cleanup Drawer */}
        {lineageDrawerOpen && (
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  data-feature-id="OVERVIEW_LINEAGE_TAB_STALE"
                  onClick={() => setLineageDrawerTab('STALE')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    lineageDrawerTab === 'STALE'
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                      : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200/70 dark:hover:bg-zinc-800'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>
                    Stale & Leftover Resources ({staleResources.length})
                  </span>
                </button>
                <button
                  type="button"
                  data-feature-id="OVERVIEW_LINEAGE_TAB_ALL"
                  onClick={() => setLineageDrawerTab('ALL')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    lineageDrawerTab === 'ALL'
                      ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/40'
                      : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200/70 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>
                    All Resource Origins & Attachments ({resources.length})
                  </span>
                </button>
              </div>

              <button
                type="button"
                data-feature-id="OVERVIEW_FILTER_STALE_ONLY"
                onClick={() => {
                  setOnlyStaleFilter((prev) => !prev);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold border transition-colors cursor-pointer ${
                  onlyStaleFilter
                    ? 'bg-amber-500 text-zinc-950 border-amber-400'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                }`}
              >
                {onlyStaleFilter
                  ? 'Showing Stale Only in Table ✓ (Click to Reset)'
                  : 'Filter Table Below to Stale Only'}
              </button>
            </div>

            {lineageDrawerTab === 'STALE' && staleResources.length === 0 ? (
              <div className="p-6 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center space-y-1">
                <div className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                  Zero Stale or Orphaned Resources Found!
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Every resource in {projectId} is either an active compute instance or core network perimeter.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(lineageDrawerTab === 'STALE' ? staleResources : resources).map(
                  (item) => {
                    const lin = lineageById[item.id] || {};
                    const isDeletingThis =
                      Boolean(deletingIds[item.id]) ||
                      item.status === 'DEPROVISIONING';
                    const isServiceApi = item.type === 'Enabled GCP Service API';
                    const canDelete =
                      onDeleteResource &&
                      [
                        'Cloud Storage Bucket',
                        'BigQuery Dataset',
                        'Compute Engine VM',
                        'Cloud Run Service',
                        'VPC Firewall Rule',
                        'Enabled GCP Service API',
                      ].includes(item.type);

                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl border p-4 space-y-2.5 transition-all ${
                          lin.isStale
                            ? 'bg-amber-500/5 dark:bg-amber-950/15 border-amber-500/30'
                            : 'bg-zinc-50/70 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                  lin.isStale
                                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                                    : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                }`}
                              >
                                {lin.badgeLabel}
                              </span>
                              <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                                {item.type} · {item.region}
                              </span>
                            </div>
                            <div className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 mt-1 break-all">
                              {item.name}
                            </div>
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                              {isServiceApi
                                ? `API Endpoint: ${item.details?.serviceName || item.storageClass}`
                                : `Provisioned: ${formatReadableDate(item.createdAt)}`}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {lin.targetTab && lin.targetTab !== 'OVERVIEW' && onSelectTab && (
                              <button
                                type="button"
                                onClick={() => onSelectTab(lin.targetTab)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-[11px] font-bold transition-colors cursor-pointer"
                              >
                                <span>Open Studio →</span>
                              </button>
                            )}
                            {canDelete && lin.isStale && (
                              <div>
                                <button
                                  type="button"
                                  disabled={actionLoading || isDeletingThis}
                                  onClick={async () => {
                                    try {
                                      await onDeleteResource(
                                        {
                                          ...item,
                                          name: isServiceApi
                                            ? item.details?.serviceName || item.storageClass
                                            : item.name,
                                        },
                                        {
                                          onConfirmed: () => {
                                            setDeletingIds((prev) => ({
                                              ...prev,
                                              [item.id]: true,
                                            }));
                                          },
                                        }
                                      );
                                    } finally {
                                      setDeletingIds((prev) => {
                                        const next = { ...prev };
                                        delete next[item.id];
                                        return next;
                                      });
                                    }
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-red-500/15 hover:bg-red-500/25 text-red-600 dark:text-red-400 border border-red-500/30 text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>
                                    {isDeletingThis
                                      ? 'Working...'
                                      : isServiceApi
                                      ? 'Disable API'
                                      : 'Clean Up'}
                                  </span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1.5 text-xs bg-white/80 dark:bg-zinc-950/70 rounded-lg p-3 border border-zinc-200/80 dark:border-zinc-800">
                          <div>
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">
                              How It Got Here:{' '}
                            </span>
                            <span className="text-zinc-600 dark:text-zinc-300">
                              {lin.howCreated}
                            </span>
                          </div>
                          <div>
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">
                              Why It Stayed:{' '}
                            </span>
                            <span className="text-zinc-600 dark:text-zinc-300">
                              {lin.whyStayed}
                            </span>
                          </div>
                          <div>
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">
                              Attached To:{' '}
                            </span>
                            <span className="font-mono text-zinc-700 dark:text-zinc-200">
                              {lin.attachedTo}
                            </span>
                          </div>
                          {lin.recommendation && (
                            <div className="pt-1 border-t border-zinc-200/70 dark:border-zinc-800/80">
                              <span className="font-bold text-blue-600 dark:text-blue-400">
                                Recommended Action:{' '}
                              </span>
                              <span className="text-zinc-700 dark:text-zinc-200">
                                {lin.recommendation}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toolbar with relative z-30 so dropdowns stack above sticky table headers */}
      <div className="relative z-30 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-[#202124] p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setCategoryMenuOpen((o) => !o);
                setSourceMenuOpen(false);
              }}
              className="inline-flex items-center gap-2 bg-white dark:bg-[#202124] hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-[8px] px-[14px] py-[8px] text-xs font-[500] transition-colors shadow-sm"
            >
              <Filter className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span>
                {CATEGORY_OPTIONS.find((c) => c.value === selectedCategory)
                  ?.label || 'Service Type'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {categoryMenuOpen && (
              <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-[#202124] shadow-lg border border-zinc-200 dark:border-zinc-800 rounded-[12px] py-1 z-40">
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
              className="inline-flex items-center gap-2 bg-white dark:bg-[#202124] hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-[8px] px-[14px] py-[8px] text-xs font-[500] transition-colors shadow-sm"
            >
              <Layers className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span>
                {SOURCE_OPTIONS.find((s) => s.value === selectedSource)?.label}
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {sourceMenuOpen && (
              <div className="absolute left-0 mt-2 w-60 bg-white dark:bg-[#202124] shadow-lg border border-zinc-200 dark:border-zinc-800 rounded-[12px] py-1 z-40">
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

          {/* Quick Stale / Leftover Filter Toggle */}
          <button
            type="button"
            onClick={() => {
              setOnlyStaleFilter((prev) => !prev);
              setCurrentPage(1);
            }}
            className={`inline-flex items-center gap-1.5 rounded-[8px] px-[12px] py-[8px] text-xs font-[600] border transition-colors shadow-sm cursor-pointer ${
              onlyStaleFilter
                ? 'bg-amber-500 text-zinc-950 border-amber-400'
                : 'bg-white dark:bg-[#202124] hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Stale / Leftovers ({staleResources.length})</span>
          </button>
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
            className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] pl-9 pr-3 py-[8px] text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-zinc-950 dark:text-zinc-100 transition-all"
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
                          ? 'bg-red-500'
                          : score >= 60
                          ? 'bg-amber-400'
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
                              ? 'opacity-55 grayscale bg-red-500/5 cursor-not-allowed select-none'
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
                                <div className="font-semibold text-zinc-950 dark:text-zinc-50 flex flex-wrap items-center gap-1.5">
                                  <span
                                    className={
                                      isRowDeleting
                                        ? 'line-through text-zinc-400 dark:text-zinc-500'
                                        : ''
                                    }
                                  >
                                    {row.name}
                                  </span>
                                  {lineageById[row.id]?.badgeLabel && !isRowDeleting && (
                                    <span
                                      className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                                        lineageById[row.id]?.isStale
                                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700'
                                      }`}
                                    >
                                      {lineageById[row.id].badgeLabel}
                                    </span>
                                  )}
                                  {isRowDeleting && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30">
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
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
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
                            <span className="font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded-full px-1.5 py-0.5 text-[11px]">
                              {row.region}
                            </span>
                          </td>

                          {/* Horizontal progress bar sparkline */}
                          <td className="py-3.5 px-4 min-w-[140px]">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-sm overflow-hidden">
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
            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-[#202124]">
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
                  className="p-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="Previous page"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                  className="p-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="Last page"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className="p-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Investigation / Details Side Panel (w-1/3 when selected) */}
        {selectedResource && (
          <div className="w-full lg:w-1/3 bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-lg transition-all duration-300 space-y-4">
            <div className="flex items-start justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
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
                className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
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

            {/* Resource Lineage & Origin Forensics Block */}
            {lineageById[selectedResource.id] && (
              <div
                className={`rounded-lg p-3 border space-y-1.5 text-xs ${
                  lineageById[selectedResource.id].isStale
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-emerald-500/5 border-emerald-500/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-zinc-700 dark:text-zinc-200">
                    Why Is This Resource Here?
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      lineageById[selectedResource.id].isStale
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                        : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    {lineageById[selectedResource.id].badgeLabel}
                  </span>
                </div>
                <div className="text-zinc-700 dark:text-zinc-300">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    How Created:{' '}
                  </span>
                  {lineageById[selectedResource.id].howCreated}
                </div>
                <div className="text-zinc-700 dark:text-zinc-300">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    Why It Stayed:{' '}
                  </span>
                  {lineageById[selectedResource.id].whyStayed}
                </div>
                <div className="text-zinc-700 dark:text-zinc-300">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    Attached To:{' '}
                  </span>
                  <span className="font-mono">
                    {lineageById[selectedResource.id].attachedTo}
                  </span>
                </div>
              </div>
            )}

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
                      payload: {
                        resourceName: selectedResource.name,
                        resourceType: selectedResource.type,
                        region: selectedResource.region,
                        zone: selectedResource.zone || selectedResource.details?.zone,
                      },
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
                        resourceName: selectedResource.name,
                        resourceType: selectedResource.type,
                        region: selectedResource.region,
                        zone: selectedResource.zone || selectedResource.details?.zone,
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

              {selectedResource.type === 'Compute Engine VM' && (
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectTab) {
                      onSelectTab('VM_SSH');
                    }
                  }}
                  className="w-full inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[8px] px-[16px] py-[9px] text-xs font-bold transition-colors shadow-sm cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>
                    Migrate VM ({selectedResource.name}) → Cloud Run (Scale-to-$0.00)
                  </span>
                </button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const rType = selectedResource.type || '';
                    const rName = selectedResource.name || '';
                    const rZone =
                      selectedResource.zone ||
                      selectedResource.details?.zone ||
                      selectedResource.region ||
                      'us-east1-b';
                    const rRegion =
                      selectedResource.details?.region ||
                      selectedResource.region ||
                      'us-central1';

                    let inspectCmd = `gcloud services list --enabled --project=${projectId}`;
                    if (rType === 'Cloud Storage Bucket' || selectedResource.category === 'storage') {
                      inspectCmd = `gcloud storage buckets describe gs://${rName} --format=json --project=${projectId}`;
                    } else if (rType === 'Compute Engine VM') {
                      inspectCmd = `gcloud compute instances describe ${rName} --zone=${rZone} --format=json --project=${projectId}`;
                    } else if (rType === 'Cloud Run Service') {
                      inspectCmd = `gcloud run services describe ${rName} --region=${rRegion} --format=json --project=${projectId}`;
                    } else if (rType === 'BigQuery Dataset') {
                      inspectCmd = `bq show --format=prettyjson ${projectId}:${rName}`;
                    } else if (rType === 'VPC Firewall Rule') {
                      inspectCmd = `gcloud compute firewall-rules describe ${rName} --format=json --project=${projectId}`;
                    } else if (rType === 'VPC Network') {
                      inspectCmd = `gcloud compute networks describe ${rName} --format=json --project=${projectId}`;
                    } else if (rType.includes('GKE')) {
                      inspectCmd = `gcloud container clusters describe ${rName} --location=${rRegion} --format=json --project=${projectId}`;
                    } else if (rType === 'Enabled GCP Service API') {
                      const svc = selectedResource.details?.serviceName || selectedResource.storageClass || rName;
                      inspectCmd = `gcloud services list --enabled --filter="config.name:${svc}" --project=${projectId}`;
                    }
                    onRunInShell(inspectCmd);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 bg-white dark:bg-[#202124] hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-[8px] px-3 py-2 text-xs font-[500] transition-colors shadow-sm"
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
                  className="inline-flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-600 text-white rounded-[8px] px-3 py-2 text-xs font-[500] transition-colors shadow-sm"
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
                    <button
                      type="button"
                      disabled={actionLoading || Boolean(deletingIds[selectedResource.id])}
                      onClick={async () => {
                        const targetId = selectedResource.id;
                        try {
                          const deleted = await onDeleteResource(
                            {
                              ...selectedResource,
                              name:
                                selectedResource.type ===
                                'Enabled GCP Service API'
                                  ? selectedResource.details?.serviceName ||
                                    selectedResource.storageClass
                                  : selectedResource.name,
                            },
                            {
                              onConfirmed: () => {
                                setDeletingIds((prev) => ({
                                  ...prev,
                                  [targetId]: true,
                                }));
                              },
                            }
                          );
                          if (deleted) {
                            setSelectedResourceId(null);
                          }
                        } finally {
                          setDeletingIds((prev) => {
                            const next = { ...prev };
                            delete next[targetId];
                            return next;
                          });
                        }
                      }}
                      className="w-full inline-flex items-center justify-center gap-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-600 dark:text-red-400 border border-red-500/30 rounded-md px-3 py-2 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>
                        {deletingIds[selectedResource.id]
                          ? 'Working...'
                          : selectedResource.type === 'Enabled GCP Service API'
                          ? `Emergency Disable API (${
                              selectedResource.details?.serviceName ||
                              selectedResource.storageClass
                            })`
                          : `Delete ${selectedResource.type}`}
                      </span>
                    </button>
                  </div>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
