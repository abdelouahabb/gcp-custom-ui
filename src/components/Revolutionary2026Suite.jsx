import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  DollarSign,
  Share2,
  FileCode2,
  ShieldAlert,
  ShieldCheck,
  Moon,
  Sun,
  Zap,
  Globe,
  Lock,
  Server,
  Rocket,
  HardDrive,
  Database,
  Network,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  PlusCircle,
  AlertTriangle,
  Sparkles,
  Leaf,
} from 'lucide-react';
import EngineerWishlistWave2 from './EngineerWishlistWave2';
import AutonomousCloudBrain from './AutonomousCloudBrain';
import EngineerMoonshotsWave3 from './EngineerMoonshotsWave3';

//Hourly base pricing lookup (USD/hr) for real-time burn-rate estimation
const VM_HOURLY_RATES = {
  'e2-micro': 0.0084,
  'e2-small': 0.0168,
  'e2-medium': 0.0335,
  'e2-standard-2': 0.067,
  'e2-standard-4': 0.134,
  'e2-standard-8': 0.268,
  'n2-standard-2': 0.0971,
  'n2-standard-4': 0.1942,
  'n2-standard-8': 0.3884,
  'c3-standard-4': 0.2088,
  'c4-standard-4': 0.235,
  't2a-standard-1': 0.0385,
  't2a-standard-2': 0.077,
  'g2-standard-4': 0.706,
  'g2-standard-8': 0.854,
  'a2-highgpu-1g': 3.673,
};

export function calculateLiveBurnRate(overview, vms = []) {
  const resources = overview?.resources || [];
  const cloudRunServices = overview?.cloudRunServices || [];
  const vpcs = overview?.vpcs || [];

  let hourlyTotal = 0;
  const breakdown = [];

  // 1. Compute Engine VMs
  const activeVms =
    vms.length > 0
      ? vms
      : resources.filter((r) => r.type === 'Compute Engine VM');

  activeVms.forEach((vm) => {
    const rawStatus = vm.details?.status || vm.status || 'RUNNING';
    const isRunning = rawStatus === 'RUNNING' || rawStatus === 'HEALTHY';
    const mType = vm.machineType || vm.details?.machineType || 'e2-micro';
    const isSpot = Boolean(vm.spotInstance || vm.details?.spotInstance);
    const baseHr = VM_HOURLY_RATES[mType] || 0.0335;
    const spotFactor = isSpot ? 0.32 : 1.0;
    const computeHr = isRunning ? baseHr * spotFactor : 0;
    const diskGb = Number(vm.diskSizeGb || vm.details?.diskSizeGb || 20);
    const diskHr = (diskGb * 0.1) / 730; // ~$0.10/GB-month pd-balanced
    const totalVmHr = computeHr + diskHr;
    hourlyTotal += totalVmHr;
    breakdown.push({
      name: vm.name,
      category: 'Compute VM',
      detail: `${mType}${isSpot ? ' (Spot -68%)' : ''} · ${
        isRunning ? 'RUNNING' : 'STOPPED (Disk Only)'
      }`,
      hourly: totalVmHr,
      monthly: totalVmHr * 730,
    });
  });

  // 2. Cloud Run Services
  cloudRunServices.forEach((srv) => {
    const minInst = Number(srv.minInstances || 0);
    const hasGpu = Number(srv.gpuCount || 0) > 0;
    const gpuHr = hasGpu
      ? srv.gpuType === 'nvidia-rtx-pro-6000'
        ? 1.85
        : 0.67
      : 0;
    const cpuHr = Number(srv.cpu || 1) * 0.024;
    const memHr = (parseFloat(srv.memory || '0.5') || 0.5) * 0.0025;
    // If minInstances === 0, idle cost is $0.00/hr
    const instHr = minInst > 0 ? minInst * (cpuHr + memHr + gpuHr) : 0;
    hourlyTotal += instHr;
    breakdown.push({
      name: srv.name,
      category: 'Cloud Run',
      detail:
        minInst === 0
          ? `Scale-to-$0 (${
              srv.cpuIdle ? 'Request-based' : 'Instance-based'
            }${hasGpu ? ` · ${srv.gpuType}` : ''})`
          : `${minInst} Warm Instance(s) (${srv.cpu} vCPU, ${srv.memory}${
              hasGpu ? `, ${srv.gpuType}` : ''
            })`,
      hourly: instHr,
      monthly: instHr * 730,
    });
  });

  // 3. GKE Clusters
  const gkeClusters = resources.filter(
    (r) => r.type && r.type.includes('GKE')
  );
  gkeClusters.forEach((c) => {
    const gkeHr = 0.1; // $0.10/hr cluster management fee
    hourlyTotal += gkeHr;
    breakdown.push({
      name: c.name,
      category: 'GKE Cluster',
      detail: `${c.region} · ${c.storageClass || 'Kubernetes Control Plane'}`,
      hourly: gkeHr,
      monthly: gkeHr * 730,
    });
  });

  // 4. Cloud Storage Buckets (baseline metadata/storage estimate)
  const buckets = resources.filter((r) => r.type === 'Cloud Storage Bucket');
  buckets.forEach((b) => {
    const bHr = 0.00035; // ~$0.25/mo baseline
    hourlyTotal += bHr;
    breakdown.push({
      name: b.name,
      category: 'Cloud Storage',
      detail: `${b.region} · ${b.storageClass || 'STANDARD'} Object Storage`,
      hourly: bHr,
      monthly: bHr * 730,
    });
  });

  // 5. BigQuery Datasets
  const datasets = resources.filter((r) => r.type === 'BigQuery Dataset');
  datasets.forEach((d) => {
    breakdown.push({
      name: d.name,
      category: 'BigQuery Lakehouse',
      detail: `${d.region} · Serverless On-Demand SQL ($0.00 Idle)`,
      hourly: 0,
      monthly: 0,
    });
  });

  return {
    hourly: hourlyTotal,
    daily: hourlyTotal * 24,
    monthly: hourlyTotal * 730,
    breakdown,
    vpcCount: vpcs.length,
  };
}

export default function Revolutionary2026Suite({
  projectId,
  overview,
  initialSubTab = 'DREAM_BRAIN',
  onRefreshOverview,
  onOpenProvision,
  onDeleteResource,
  onShowToast,
  onShowError,
}) {
  const [subTab, setSubTab] = useState(
    initialSubTab === 'TOPOLOGY' ? 'DREAM_BRAIN' : initialSubTab || 'DREAM_BRAIN'
  );
  const [vms, setVms] = useState([]);
  const [auditData, setAuditData] = useState(null);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [hibernateBusy, setHibernateBusy] = useState(false);
  const [copiedType, setCopiedType] = useState(null);
  const [iacFormat, setIacFormat] = useState('TERRAFORM'); // 'TERRAFORM' | 'GCLOUD_SH'

  useEffect(() => {
    if (initialSubTab) setSubTab(initialSubTab);
  }, [initialSubTab]);

  const fetchExtraData = useCallback(async () => {
    if (!projectId) return;
    setLoadingAudit(true);
    try {
      const [vmRes, secRes] = await Promise.all([
        axios
          .get(`/api/project/${encodeURIComponent(projectId)}/vms`)
          .catch(() => ({ data: { vms: [] } })),
        axios
          .get(`/api/project/${encodeURIComponent(projectId)}/security-audit`)
          .catch(() => ({ data: null })),
      ]);
      setVms(vmRes.data?.vms || []);
      setAuditData(secRes.data);
    } finally {
      setLoadingAudit(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchExtraData();
  }, [fetchExtraData, overview]);

  const burn = useMemo(
    () => calculateLiveBurnRate(overview, vms),
    [overview, vms]
  );

  const handleHibernateToggle = async (mode) => {
    if (hibernateBusy) return;
    setHibernateBusy(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/hibernate`,
        { mode }
      );
      if (onShowToast) onShowToast(res.data?.message);
      await fetchExtraData();
      if (onRefreshOverview) onRefreshOverview();
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            'Failed to toggle Night-Mode Hibernate.'
        );
      }
    } finally {
      setHibernateBusy(false);
    }
  };

  // Generate 100% live Reverse-Terraform (main.tf) & Reproducible gcloud Script from live GCP resources
  const generatedTerraform = useMemo(() => {
    const vpcs = overview?.vpcs || [];
    const firewalls = overview?.firewalls || [];
    const runServices = overview?.cloudRunServices || [];
    const buckets = (overview?.resources || []).filter(
      (r) => r.type === 'Cloud Storage Bucket'
    );
    const datasets = (overview?.resources || []).filter(
      (r) => r.type === 'BigQuery Dataset'
    );

    const lines = [
      `# ============================================================================`,
      `# Reverse-Engineered Terraform Blueprint (main.tf)`,
      `# Generated Live by CloudPulse 2026 from GCP Project: ${projectId}`,
      `# Timestamp: ${new Date().toISOString()}`,
      `# ============================================================================`,
      ``,
      `terraform {`,
      `  required_providers {`,
      `    google = {`,
      `      source  = "hashicorp/google"`,
      `      version = "~> 6.0"`,
      `    }`,
      `  }`,
      `}`,
      ``,
      `provider "google" {`,
      `  project = "${projectId}"`,
      `  region  = "us-east1"`,
      `}`,
      ``,
    ];

    vpcs.forEach((v) => {
      const tfId = v.name.replace(/[^a-zA-Z0-9_]/g, '_');
      lines.push(
        `resource "google_compute_network" "${tfId}" {`,
        `  name                    = "${v.name}"`,
        `  auto_create_subnetworks = ${v.autoCreateSubnetworks}`,
        `  routing_mode            = "${v.routingMode || 'REGIONAL'}"`,
        `  mtu                     = ${v.mtu || 1460}`,
        `}`,
        ``
      );
    });

    firewalls.forEach((fw) => {
      const tfId = fw.name.replace(/[^a-zA-Z0-9_]/g, '_');
      const proto = fw.allowed?.[0]?.IPProtocol || 'tcp';
      const ports = fw.allowed?.[0]?.ports || [];
      lines.push(
        `resource "google_compute_firewall" "${tfId}" {`,
        `  name    = "${fw.name}"`,
        `  network = "${fw.network || 'default'}"`,
        `  allow {`,
        `    protocol = "${proto}"`,
        ...(ports.length > 0
          ? [`    ports    = ${JSON.stringify(ports)}`]
          : []),
        `  }`,
        `  source_ranges = ${JSON.stringify(
          fw.sourceRanges?.length ? fw.sourceRanges : ['0.0.0.0/0']
        )}`,
        `}`,
        ``
      );
    });

    vms.forEach((vm) => {
      const tfId = vm.name.replace(/[^a-zA-Z0-9_]/g, '_');
      lines.push(
        `resource "google_compute_instance" "${tfId}" {`,
        `  name         = "${vm.name}"`,
        `  machine_type = "${vm.machineType}"`,
        `  zone         = "${vm.zone}"`,
        `  boot_disk {`,
        `    initialize_params {`,
        `      size = ${vm.diskSizeGb || 20}`,
        `      type = "${vm.diskType || 'pd-balanced'}"`,
        `    }`,
        `  }`,
        `  network_interface {`,
        `    network = "${vm.network || 'default'}"`,
        ...(vm.externalIp !== 'None' ? [`    access_config {}`] : []),
        `  }`,
        ...(vm.spotInstance
          ? [
              `  scheduling {`,
              `    provisioning_model          = "SPOT"`,
              `    instance_termination_action = "STOP"`,
              `    automatic_restart           = false`,
              `    on_host_maintenance         = "TERMINATE"`,
              `  }`,
            ]
          : []),
        `}`,
        ``
      );
    });

    runServices.forEach((srv) => {
      const tfId = srv.name.replace(/[^a-zA-Z0-9_]/g, '_');
      lines.push(
        `resource "google_cloud_run_v2_service" "${tfId}" {`,
        `  name     = "${srv.name}"`,
        `  location = "${srv.region}"`,
        `  ingress  = "${srv.ingress}"`,
        `  template {`,
        `    execution_environment = "${srv.executionEnvironment}"`,
        `    scaling {`,
        `      min_instance_count = ${srv.minInstances}`,
        `      max_instance_count = ${srv.maxInstances}`,
        `    }`,
        ...(Number(srv.gpuCount || 0) > 0
          ? [
              `    node_selector {`,
              `      accelerator = "${srv.gpuType || 'nvidia-l4'}"`,
              `    }`,
              `    gpu_zonal_redundancy_disabled = ${!srv.gpuZonalRedundancy}`,
            ]
          : []),
        `    containers {`,
        `      image = "${srv.containerImage}"`,
        `      resources {`,
        `        cpu_idle          = ${srv.cpuIdle}`,
        `        startup_cpu_boost = ${Boolean(srv.startupCpuBoost)}`,
        `        limits = {`,
        `          cpu    = "${srv.cpu}"`,
        `          memory = "${srv.memory}"`,
        ...(Number(srv.gpuCount || 0) > 0
          ? [`          "nvidia.com/gpu" = "${srv.gpuCount}"`]
          : []),
        `        }`,
        `      }`,
        `    }`,
        `  }`,
        `}`,
        ``
      );
    });

    buckets.forEach((b) => {
      const tfId = b.name.replace(/[^a-zA-Z0-9_]/g, '_');
      lines.push(
        `resource "google_storage_bucket" "${tfId}" {`,
        `  name                        = "${b.name}"`,
        `  location                    = "${(b.region || 'US').toUpperCase()}"`,
        `  uniform_bucket_level_access = true`,
        `}`,
        ``
      );
    });

    datasets.forEach((d) => {
      const cleanDs = d.name.split('.').pop();
      const tfId = cleanDs.replace(/[^a-zA-Z0-9_]/g, '_');
      lines.push(
        `resource "google_bigquery_dataset" "${tfId}" {`,
        `  dataset_id = "${cleanDs}"`,
        `  location   = "${d.region || 'US'}"`,
        `}`,
        ``
      );
    });

    return lines.join('\n');
  }, [overview, vms, projectId]);

  const generatedGcloudScript = useMemo(() => {
    const vpcs = overview?.vpcs || [];
    const firewalls = overview?.firewalls || [];
    const runServices = overview?.cloudRunServices || [];
    const buckets = (overview?.resources || []).filter(
      (r) => r.type === 'Cloud Storage Bucket'
    );

    const lines = [
      `#!/usr/bin/env bash`,
      `# ============================================================================`,
      `# Reproducible gcloud Infrastructure Clone Script (deploy-${projectId}.sh)`,
      `# Generated Live from GCP Project: ${projectId}`,
      `# ============================================================================`,
      `set -euo pipefail`,
      `PROJECT_ID="\${1:-${projectId}}"`,
      `echo "Replicating infrastructure onto project: $PROJECT_ID"`,
      ``,
    ];

    vpcs
      .filter((v) => v.name !== 'default')
      .forEach((v) => {
        lines.push(
          `gcloud compute networks create ${v.name} --project="$PROJECT_ID" --subnet-mode=${
            v.autoCreateSubnetworks ? 'auto' : 'custom'
          } --bgp-routing-mode=${(v.routingMode || 'regional').toLowerCase()} --mtu=${
            v.mtu || 1460
          }`
        );
      });

    firewalls.forEach((fw) => {
      const proto = fw.allowed?.[0]?.IPProtocol || 'tcp';
      const ports = fw.allowed?.[0]?.ports || [];
      const allowSpec = ports.length ? `${proto}:${ports.join(',')}` : proto;
      lines.push(
        `gcloud compute firewall-rules create ${fw.name} --project="$PROJECT_ID" --network=${
          fw.network || 'default'
        } --allow=${allowSpec} --source-ranges=${(
          fw.sourceRanges || ['0.0.0.0/0']
        ).join(',')}`
      );
    });

    vms.forEach((vm) => {
      lines.push(
        `gcloud compute instances create ${vm.name} --project="$PROJECT_ID" --zone=${
          vm.zone
        } --machine-type=${vm.machineType} --boot-disk-size=${
          vm.diskSizeGb || 20
        }GB --boot-disk-type=${vm.diskType || 'pd-balanced'}${
          vm.spotInstance ? ' --provisioning-model=SPOT' : ''
        }`
      );
    });

    runServices.forEach((srv) => {
      const hasGpu = Number(srv.gpuCount || 0) > 0;
      lines.push(
        `gcloud run deploy ${srv.name} --project="$PROJECT_ID" --region=${
          srv.region
        } --image=${srv.containerImage} --cpu=${srv.cpu} --memory=${
          srv.memory
        } --min-instances=${srv.minInstances} --max-instances=${
          srv.maxInstances
        } ${
          srv.cpuIdle
            ? '--billing=request --cpu-throttling'
            : '--billing=instance --no-cpu-throttling'
        }${
          hasGpu
            ? ` --gpu=1 --gpu-type=${srv.gpuType} --no-gpu-zonal-redundancy`
            : ''
        } ${
          srv.allowUnauthenticated
            ? '--allow-unauthenticated'
            : '--no-allow-unauthenticated'
        }`
      );
    });

    buckets.forEach((b) => {
      lines.push(
        `gcloud storage buckets create gs://${b.name} --project="$PROJECT_ID" --location=${(
          b.region || 'US'
        ).toUpperCase()} --uniform-bucket-level-access`
      );
    });

    return lines.join('\n');
  }, [overview, vms, projectId]);

  const vpcs = overview?.vpcs || [];
  const firewalls = overview?.firewalls || [];
  const runServices = overview?.cloudRunServices || [];
  const buckets = (overview?.resources || []).filter(
    (r) => r.type === 'Cloud Storage Bucket'
  );
  const publicFirewalls = firewalls.filter(
    (f) => !f.disabled && (f.sourceRanges || []).includes('0.0.0.0/0')
  );
  const publicRun = runServices.filter((s) => s.allowUnauthenticated);

  return (
    <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-5">
      {/* Header & Live Wallet Burn-Rate Ticker */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 via-blue-500/20 to-emerald-500/20 border border-violet-500/30 flex items-center justify-center text-violet-500">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-base font-extrabold text-zinc-950 dark:text-zinc-50">
              2026 Beyond-Console Innovation Lab
            </h3>
            <span className="text-[10px] font-mono font-bold bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/30 px-2 py-0.5 rounded-full">
              EXCLUSIVE TO CLOUDPULSE 2026
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Live Attack-Surface Topology Graph, Real-Time Wallet Burn-Rate Radar,
            1-Tap Night-Mode Hibernate, Reverse-Terraform Exporter & Zero-Trust
            Security Scanner.
          </p>
        </div>

        {/* Live Burn Rate Radar Pill */}
        <div className="flex flex-wrap items-center gap-2.5 bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-zinc-400">
                Live Run-Rate Radar
              </div>
              <div className="text-xs font-mono font-extrabold text-zinc-950 dark:text-zinc-50">
                ${burn.hourly.toFixed(4)}/hr ·{' '}
                <span className="text-emerald-600 dark:text-emerald-400">
                  ~${burn.monthly.toFixed(2)}/mo
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={hibernateBusy}
            onClick={() => handleHibernateToggle('SLEEP')}
            title="Stop all running VMs and scale warm Cloud Run instances to 0 ($0 idle)"
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <Moon className="w-3.5 h-3.5" />
            <span>{hibernateBusy ? 'Parking...' : 'Park Night-Mode ($0)'}</span>
          </button>

          <button
            type="button"
            disabled={hibernateBusy}
            onClick={() => handleHibernateToggle('WAKE')}
            title="Wake parked Compute VMs and restore warm instances"
            className="inline-flex items-center gap-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Wake</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-4 gap-2">
        {[
          {
            id: 'DREAM_BRAIN',
            label: '🔮 1. Pre-Crime Bill & Dream Stack Compiler (NEW)',
            icon: Sparkles,
          },
          {
            id: 'TOPOLOGY',
            label: '2. Live Cloud Topology & Blast Radius',
            icon: Share2,
          },
          {
            id: 'FINOPS_SLEEP',
            label: '3. Burn-Rate Radar & Night-Mode Sleep',
            icon: DollarSign,
          },
          {
            id: 'TERRAFORM',
            label: '4. Reverse-Terraform (main.tf) Exporter',
            icon: FileCode2,
          },
          {
            id: 'SECURITY',
            label: `5. Zero-Trust Security Scanner (${
              (auditData?.findings?.length || 0) + publicRun.length
            })`,
            icon: ShieldAlert,
          },
          {
            id: 'BENCHMARK',
            label: '6. ⚡ Latency & HTTP X-Ray Arena',
            icon: Zap,
          },
          {
            id: 'ZOMBIES',
            label: '7. 🧟 Zombie Resource & Waste Hunter',
            icon: AlertTriangle,
          },
          {
            id: 'TELEPORT_DIFF',
            label: '8. 🌍 Cross-Region Teleport, FinOps & GPU SKU',
            icon: Leaf,
          },
          {
            id: 'X1',
            label: '9. 🧬 Storage DLP, Secret Leak & PII X-Ray (NEW)',
            icon: ShieldAlert,
          },
          {
            id: 'X2',
            label: '10. ⚡ Serverless Cold-Start & Diet Surgeon (NEW)',
            icon: Zap,
          },
          {
            id: 'X3',
            label: '11. 🕸️ Hidden Egress & Data-Gravity Tollbooth (NEW)',
            icon: DollarSign,
          },
          {
            id: 'X4',
            label: '12. 🔐 Ransomware Air-Gap & Clean-Room Auditor (NEW)',
            icon: Lock,
          },
          {
            id: 'X5',
            label: '13. ⏱️ 12-Metropolis Speed-of-Light UX Matrix (NEW)',
            icon: Globe,
          },
          {
            id: 'X6',
            label: '14. 🤖 AES-256-GCM AI Studio Vault (Option 3 · NEW)',
            icon: Sparkles,
          },
        ].map((t) => {
          const Icon = t.icon;
          const active = subTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id)}
              className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                active
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-zinc-50 dark:bg-[#09090b] border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-blue-500/50'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="text-xs font-bold leading-snug">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: INTERACTIVE LIVE CLOUD TOPOLOGY & BLAST-RADIUS GRAPH */}
      {subTab === 'TOPOLOGY' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-zinc-950 text-zinc-100 border border-zinc-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-mono uppercase tracking-wider text-blue-400 flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                <span>
                  Live Multi-Layer Architecture & Exposure Graph — {projectId}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="inline-flex items-center gap-1 text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  Public Internet Exposed (
                  {publicFirewalls.length + publicRun.length})
                </span>
                <span className="inline-flex items-center gap-1 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  IAM / VPC Protected ({vpcs.length + buckets.length})
                </span>
              </div>
            </div>

            {/* 4-Column Interactive Architecture Graph */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch pt-2">
              {/* Layer 1: Public Internet & Edge Ingress */}
              <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-amber-500/30 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="text-[10px] font-mono uppercase text-amber-400 font-bold flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Layer 1 · Public Internet Edge</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs font-mono">
                    <div className="font-bold text-amber-300">
                      0.0.0.0/0 · Global Ingress
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-1">
                      {publicFirewalls.length} Open Firewall Rule(s) ·{' '}
                      {publicRun.length} Public HTTPS Run Endpoint(s)
                    </div>
                  </div>

                  {publicFirewalls.map((fw) => (
                    <div
                      key={fw.id}
                      className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] font-mono flex items-center justify-between gap-2"
                    >
                      <div className="truncate">
                        <span className="text-amber-400 font-bold">
                          {fw.name}
                        </span>
                        <div className="text-[10px] text-zinc-500">
                          Allow{' '}
                          {(fw.allowed || [])
                            .map(
                              (a) =>
                                `${a.IPProtocol}${
                                  a.ports ? ':' + a.ports.join(',') : ''
                                }`
                            )
                            .join(' ')}
                        </div>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 shrink-0">
                        0.0.0.0/0
                      </span>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] font-mono text-zinc-500">
                  → Routes into Layer 2 VPCs & Serverless Edge
                </div>
              </div>

              {/* Layer 2: VPC Networks & Subnets */}
              <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-blue-500/30 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="text-[10px] font-mono uppercase text-blue-400 font-bold flex items-center gap-1.5">
                    <Network className="w-3.5 h-3.5" />
                    <span>Layer 2 · VPC Backbone ({vpcs.length})</span>
                  </div>
                  {vpcs.map((vpc) => (
                    <div
                      key={vpc.id}
                      className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs font-mono space-y-1"
                    >
                      <div className="font-bold text-blue-300 flex items-center justify-between">
                        <span>vpc/{vpc.name}</span>
                        <span className="text-[10px] bg-blue-500/20 px-1.5 py-0.5 rounded">
                          MTU {vpc.mtu}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {vpc.routingMode} BGP · {vpc.subnetsCount} Regional
                        Subnets
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => onOpenProvision && onOpenProvision('VPC_NETWORK')}
                  className="w-full py-1.5 rounded-lg border border-blue-500/30 hover:bg-blue-500/15 text-[11px] font-mono text-blue-400 cursor-pointer"
                >
                  + Provision VPC Network
                </button>
              </div>

              {/* Layer 3: Compute VMs & Cloud Run Serverless */}
              <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-violet-500/30 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="text-[10px] font-mono uppercase text-violet-400 font-bold flex items-center gap-1.5">
                    <Rocket className="w-3.5 h-3.5" />
                    <span>
                      Layer 3 · Compute & Serverless (
                      {vms.length + runServices.length})
                    </span>
                  </div>

                  {vms.length === 0 && runServices.length === 0 ? (
                    <div className="p-3 rounded-lg bg-zinc-950 border border-dashed border-zinc-800 text-[11px] font-mono text-zinc-400">
                      0 Active VMs or Cloud Run Services ($0.00/hr compute burn)
                    </div>
                  ) : (
                    <>
                      {vms.map((vm) => (
                        <div
                          key={vm.id}
                          className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] font-mono"
                        >
                          <div className="font-bold text-emerald-400 flex items-center justify-between">
                            <span>VM: {vm.name}</span>
                            <span className="text-[9px] bg-zinc-800 px-1.5 py-0.5 rounded">
                              {vm.zone}
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            {vm.machineType} · Ext IP: {vm.externalIp}
                          </div>
                        </div>
                      ))}
                      {runServices.map((srv) => (
                        <div
                          key={srv.id}
                          className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] font-mono"
                        >
                          <div className="font-bold text-blue-400 flex items-center justify-between">
                            <span>Run: {srv.name}</span>
                            <span className="text-[9px] bg-zinc-800 px-1.5 py-0.5 rounded">
                              {srv.region}
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            {srv.cpu} vCPU · {srv.memory} ·{' '}
                            {srv.cpuIdle ? 'Request Billing' : 'Instance Billing'}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onOpenProvision && onOpenProvision('CLOUD_RUN')}
                    className="py-1.5 rounded-lg border border-violet-500/30 hover:bg-violet-500/15 text-[10px] font-mono text-violet-300 cursor-pointer"
                  >
                    + Deploy Run
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenProvision && onOpenProvision('COMPUTE_VM')
                    }
                    className="py-1.5 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/15 text-[10px] font-mono text-emerald-300 cursor-pointer"
                  >
                    + Launch VM
                  </button>
                </div>
              </div>

              {/* Layer 4: Data & Object Storage */}
              <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-emerald-500/30 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5" />
                    <span>Layer 4 · Storage & Lakehouse ({buckets.length})</span>
                  </div>
                  {buckets.map((b) => (
                    <div
                      key={b.id}
                      className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-mono"
                    >
                      <div className="font-bold text-emerald-300 truncate">
                        gs://{b.name}
                      </div>
                      <div className="text-[10px] text-zinc-400 flex items-center justify-between mt-0.5">
                        <span>{b.region}</span>
                        <span className="text-emerald-400">
                          Uniform IAM Enforced
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => onOpenProvision && onOpenProvision('GCS_BUCKET')}
                  className="w-full py-1.5 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/15 text-[11px] font-mono text-emerald-400 cursor-pointer"
                >
                  + Create GCS Bucket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE WALLET BURN-RATE RADAR & NIGHT-MODE FINOPS SLEEP SWITCH */}
      {subTab === 'FINOPS_SLEEP' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] font-mono uppercase text-zinc-400">
                Hourly Burn Rate
              </div>
              <div className="text-2xl font-extrabold font-mono text-zinc-950 dark:text-zinc-50 mt-1">
                ${burn.hourly.toFixed(4)}
                <span className="text-xs font-normal text-zinc-500"> / hr</span>
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
                Real-time active compute & storage ticker
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] font-mono uppercase text-zinc-400">
                Projected 30-Day Run Rate
              </div>
              <div className="text-2xl font-extrabold font-mono text-blue-600 dark:text-blue-400 mt-1">
                ${burn.monthly.toFixed(2)}
                <span className="text-xs font-normal text-zinc-500"> / mo</span>
              </div>
              <div className="text-[11px] text-zinc-500 mt-1">
                Assuming current instances run 730 hrs/mo
              </div>
            </div>

            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-mono uppercase text-indigo-500 font-bold">
                  Night-Mode FinOps Sleep Switch
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1">
                  Stops all running Compute VMs and scales all warm Cloud Run
                  services down to <code className="font-mono">minInstances=0</code>{' '}
                  without detaching your billing account.
                </p>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  disabled={hibernateBusy}
                  onClick={() => handleHibernateToggle('SLEEP')}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-3 rounded-lg inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Park Project for Night</span>
                </button>
                <button
                  type="button"
                  disabled={hibernateBusy}
                  onClick={() => handleHibernateToggle('WAKE')}
                  className="bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold py-2 px-3 rounded-lg inline-flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Wake All</span>
                </button>
              </div>
            </div>
          </div>

          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            <div className="bg-zinc-100 dark:bg-zinc-900 px-4 py-2.5 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
              Line-Item Hourly & Monthly Cost Breakdown ({burn.breakdown.length}{' '}
              Active Resources)
            </div>
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {burn.breakdown.map((item, idx) => (
                <div
                  key={idx}
                  className="px-4 py-2.5 flex items-center justify-between text-xs font-mono"
                >
                  <div>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {item.name}
                    </span>{' '}
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {item.category}
                    </span>
                    <div className="text-[11px] text-zinc-500">
                      {item.detail}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-zinc-900 dark:text-zinc-100">
                      ${item.hourly.toFixed(4)}/hr
                    </div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                      ${item.monthly.toFixed(2)}/mo
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: 1-TAP REVERSE-TERRAFORM & GCLOUD BLUEPRINT EXPORTER */}
      {subTab === 'TERRAFORM' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIacFormat('TERRAFORM')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border cursor-pointer ${
                  iacFormat === 'TERRAFORM'
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
                }`}
              >
                Terraform HCL (main.tf)
              </button>
              <button
                type="button"
                onClick={() => setIacFormat('GCLOUD_SH')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border cursor-pointer ${
                  iacFormat === 'GCLOUD_SH'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
                }`}
              >
                Master gcloud Clone Script (deploy.sh)
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                const text =
                  iacFormat === 'TERRAFORM'
                    ? generatedTerraform
                    : generatedGcloudScript;
                navigator.clipboard?.writeText(text);
                setCopiedType(iacFormat);
                setTimeout(() => setCopiedType(null), 1800);
              }}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-bold px-3.5 py-1.5 rounded-lg cursor-pointer"
            >
              {copiedType === iacFormat ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied Blueprint!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>
                    Copy{' '}
                    {iacFormat === 'TERRAFORM' ? 'main.tf' : 'deploy-stack.sh'}
                  </span>
                </>
              )}
            </button>
          </div>

          <pre className="bg-zinc-950 text-zinc-200 border border-zinc-800 rounded-xl p-4 text-xs font-mono overflow-x-auto max-h-[420px] leading-relaxed">
            {iacFormat === 'TERRAFORM'
              ? generatedTerraform
              : generatedGcloudScript}
          </pre>
        </div>
      )}

      {/* TAB 4: ZERO-TRUST SECURITY & IAM POSTURE SCANNER */}
      {subTab === 'SECURITY' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-zinc-500">
              Live audit of open <code className="font-mono">0.0.0.0/0</code>{' '}
              VPC Firewall rules, unauthenticated Cloud Run endpoints, and IAM
              Service Accounts in <strong className="font-mono">{projectId}</strong>.
            </div>
            <button
              type="button"
              onClick={fetchExtraData}
              disabled={loadingAudit}
              className="inline-flex items-center gap-1.5 text-xs font-mono bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loadingAudit ? 'animate-spin' : ''}`}
              />
              <span>Re-Scan Posture</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(auditData?.findings || []).map((f) => (
              <div
                key={f.id}
                className={`p-3.5 rounded-xl border space-y-2 ${
                  f.severity === 'HIGH'
                    ? 'bg-rose-500/5 border-rose-500/30'
                    : 'bg-amber-500/5 border-amber-500/30'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      f.severity === 'HIGH'
                        ? 'bg-rose-500/20 text-rose-500'
                        : 'bg-amber-500/20 text-amber-500'
                    }`}
                  >
                    {f.severity} RISK · {f.category}
                  </span>
                  <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {f.resourceName}
                  </span>
                </div>
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  {f.title}
                </div>
                <p className="text-[11px] text-zinc-500">{f.recommendation}</p>
                {onDeleteResource && f.resourceName !== 'default-allow-ssh' && (
                  <button
                    type="button"
                    onClick={() =>
                      onDeleteResource({
                        type: 'VPC Firewall Rule',
                        name: f.resourceName,
                        region: 'global',
                      })
                    }
                    className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-rose-500 hover:underline"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>1-Tap Delete Open Firewall Rule</span>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* IAM Service Accounts Inventory */}
          {auditData?.serviceAccounts?.length > 0 && (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
              <div className="bg-zinc-100 dark:bg-zinc-900 px-4 py-2 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                Active IAM Service Accounts ({auditData.serviceAccounts.length})
              </div>
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {auditData.serviceAccounts.map((sa) => (
                  <div
                    key={sa.email}
                    className="px-4 py-2.5 flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">
                        {sa.displayName}
                      </div>
                      <div className="text-[11px] text-zinc-500">{sa.email}</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      {sa.disabled ? 'DISABLED' : 'ACTIVE IAM SA'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TABS 5, 6, 7: WAVE 2 GOOGLE ENGINEER'S SECRET WISHLIST */}
      {['BENCHMARK', 'ZOMBIES', 'TELEPORT_DIFF'].includes(subTab) && (
        <EngineerWishlistWave2
          activeMode={subTab}
          projectId={projectId}
          overview={overview}
          vms={vms}
          onRefreshOverview={() => {
            fetchExtraData();
            if (onRefreshOverview) onRefreshOverview();
          }}
          onShowToast={onShowToast}
          onShowError={onShowError}
        />
      )}

      {/* TAB 1 (NEW WAVE 5): AUTONOMOUS CLOUD BRAIN — PRE-CRIME BILLING & DREAM STACK COMPILER */}
      {subTab === 'DREAM_BRAIN' && (
        <AutonomousCloudBrain
          projectId={projectId}
          overview={overview}
          vms={vms}
          burn={burn}
          onHibernateSleep={() => handleHibernateToggle('SLEEP')}
          onOpenProvision={onOpenProvision}
          onShowToast={onShowToast}
        />
      )}

      {/* TABS 9..14: WAVE 3 MOONSHOT CLOUD ENGINEERING DREAMS (X1..X6) */}
      {['X1', 'X2', 'X3', 'X4', 'X5', 'X6'].includes(subTab) && (
        <EngineerMoonshotsWave3
          activeTab={subTab}
          projectId={projectId}
          overview={overview}
          onRefreshGlobal={() => {
            fetchExtraData();
            if (onRefreshOverview) onRefreshOverview();
          }}
          onShowToast={onShowToast}
          onShowError={onShowError}
        />
      )}
    </div>
  );
}
