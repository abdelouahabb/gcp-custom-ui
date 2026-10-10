import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import {
  PlusCircle,
  X,
  Server,
  HardDrive,
  Cpu,
  Database,
  Sparkles,
  Check,
  Copy,
  Zap,
  ShieldCheck,
  Network,
  Shield,
} from 'lucide-react';

const SERVICE_TABS = [
  {
    id: 'GCS_BUCKET',
    label: 'Cloud Storage',
    icon: HardDrive,
    desc: 'Create real GCS Bucket (storage.googleapis.com)',
  },
  {
    id: 'COMPUTE_VM',
    label: 'Compute VM',
    icon: Server,
    desc: 'Create real GCE VM (compute.googleapis.com)',
  },
  {
    id: 'VPC_NETWORK',
    label: 'VPC Network',
    icon: Network,
    desc: 'Create real VPC Network (global/networks)',
  },
  {
    id: 'VPC_FIREWALL',
    label: 'Firewall Rule',
    icon: Shield,
    desc: 'Create real VPC Firewall Rule (global/firewalls)',
  },
  {
    id: 'BIGQUERY_DATASET',
    label: 'BigQuery Dataset',
    icon: Database,
    desc: 'Create real BQ Dataset (bigquery.googleapis.com)',
  },
  {
    id: 'CLOUD_RUN',
    label: 'Cloud Run',
    icon: Cpu,
    desc: 'Deploy real Cloud Run Service (run.googleapis.com)',
  },
];

export default function ResourceProvisionModal({
  isOpen,
  onClose,
  projectId,
  initialServiceType = 'GCS_BUCKET',
  onProvisionSuccess,
}) {
  const [serviceType, setServiceType] = useState(initialServiceType);
  const [name, setName] = useState('');
  const [region, setRegion] = useState('us-east1');
  const [zone, setZone] = useState('us-east1-b');

  // Compute Engine VM specific (2026 Studio Options)
  const [vmRegion, setVmRegion] = useState('us-east1');
  const [machineFamily, setMachineFamily] = useState('E2');
  const [machineType, setMachineType] = useState('e2-micro');
  const [osImage, setOsImage] = useState('Debian 12 Bookworm');
  const [diskSizeGb, setDiskSizeGb] = useState(20);
  const [diskType, setDiskType] = useState('pd-balanced');
  const [spotInstance, setSpotInstance] = useState(true);
  const [terminationAction, setTerminationAction] = useState('STOP');
  const [vmGpuType, setVmGpuType] = useState('NONE');
  const [vmGpuCount, setVmGpuCount] = useState(1);
  const [vmNetwork, setVmNetwork] = useState('default');
  const [externalIpEnabled, setExternalIpEnabled] = useState(true);
  const [allowHttp, setAllowHttp] = useState(true);
  const [allowHttps, setAllowHttps] = useState(true);
  const [shieldedSecureBoot, setShieldedSecureBoot] = useState(false);
  const [shieldedVtpm, setShieldedVtpm] = useState(true);
  const [deletionProtection, setDeletionProtection] = useState(false);
  const [startupScript, setStartupScript] = useState('');

  const GCP_REGION_ZONES = {
    'us-east1': {
      label: 'us-east1 (South Carolina, USA)',
      zones: ['us-east1-b', 'us-east1-c', 'us-east1-d'],
    },
    'us-central1': {
      label: 'us-central1 (Iowa, USA — Low Carbon)',
      zones: ['us-central1-a', 'us-central1-b', 'us-central1-c', 'us-central1-f'],
    },
    'us-east4': {
      label: 'us-east4 (Northern Virginia, USA)',
      zones: ['us-east4-a', 'us-east4-b', 'us-east4-c'],
    },
    'us-west1': {
      label: 'us-west1 (Oregon, USA — Low Carbon)',
      zones: ['us-west1-a', 'us-west1-b', 'us-west1-c'],
    },
    'us-west4': {
      label: 'us-west4 (Las Vegas, USA)',
      zones: ['us-west4-a', 'us-west4-b', 'us-west4-c'],
    },
    'europe-west1': {
      label: 'europe-west1 (Belgium, EU)',
      zones: ['europe-west1-b', 'europe-west1-c', 'europe-west1-d'],
    },
    'europe-west4': {
      label: 'europe-west4 (Netherlands, EU — AI Hub)',
      zones: ['europe-west4-a', 'europe-west4-b', 'europe-west4-c'],
    },
    'europe-west3': {
      label: 'europe-west3 (Frankfurt, Germany)',
      zones: ['europe-west3-a', 'europe-west3-b', 'europe-west3-c'],
    },
    'europe-west2': {
      label: 'europe-west2 (London, UK)',
      zones: ['europe-west2-a', 'europe-west2-b', 'europe-west2-c'],
    },
    'asia-east1': {
      label: 'asia-east1 (Taiwan, APAC)',
      zones: ['asia-east1-a', 'asia-east1-b', 'asia-east1-c'],
    },
    'asia-northeast1': {
      label: 'asia-northeast1 (Tokyo, Japan)',
      zones: ['asia-northeast1-a', 'asia-northeast1-b', 'asia-northeast1-c'],
    },
    'asia-southeast1': {
      label: 'asia-southeast1 (Singapore, APAC)',
      zones: ['asia-southeast1-a', 'asia-southeast1-b', 'asia-southeast1-c'],
    },
    'me-central1': {
      label: 'me-central1 (Doha, Qatar — MENA)',
      zones: ['me-central1-a', 'me-central1-b', 'me-central1-c'],
    },
    'southamerica-east1': {
      label: 'southamerica-east1 (São Paulo, Brazil)',
      zones: ['southamerica-east1-a', 'southamerica-east1-b', 'southamerica-east1-c'],
    },
  };

  const VM_MACHINE_FAMILIES = {
    E2: {
      badge: 'Cost-Optimized General Purpose',
      types: [
        { id: 'e2-micro', label: 'e2-micro (2 shared vCPU · 1 GB RAM · Free Tier)' },
        { id: 'e2-small', label: 'e2-small (2 shared vCPU · 2 GB RAM)' },
        { id: 'e2-medium', label: 'e2-medium (2 shared vCPU · 4 GB RAM)' },
        { id: 'e2-standard-2', label: 'e2-standard-2 (2 vCPU · 8 GB RAM)' },
        { id: 'e2-standard-4', label: 'e2-standard-4 (4 vCPU · 16 GB RAM)' },
        { id: 'e2-standard-8', label: 'e2-standard-8 (8 vCPU · 32 GB RAM)' },
        { id: 'e2-highmem-4', label: 'e2-highmem-4 (4 vCPU · 32 GB RAM)' },
      ],
    },
    N2: {
      badge: 'Balanced Intel Xeon / AMD EPYC',
      types: [
        { id: 'n2-standard-2', label: 'n2-standard-2 (2 vCPU · 8 GB RAM)' },
        { id: 'n2-standard-4', label: 'n2-standard-4 (4 vCPU · 16 GB RAM)' },
        { id: 'n2-standard-8', label: 'n2-standard-8 (8 vCPU · 32 GB RAM)' },
        { id: 'n2d-standard-4', label: 'n2d-standard-4 (4 vCPU AMD EPYC · 16 GB RAM)' },
        { id: 'n2-highmem-4', label: 'n2-highmem-4 (4 vCPU · 32 GB RAM)' },
      ],
    },
    C3_C4: {
      badge: '2026 Gen-4/5 Compute-Optimized',
      types: [
        { id: 'c3-standard-4', label: 'c3-standard-4 (4 vCPU Sapphire Rapids · 16 GB)' },
        { id: 'c3-standard-8', label: 'c3-standard-8 (8 vCPU Sapphire Rapids · 32 GB)' },
        { id: 'c3d-standard-4', label: 'c3d-standard-4 (4 vCPU AMD Genoa · 16 GB)' },
        { id: 'c4-standard-4', label: 'c4-standard-4 (4 vCPU Emerald Rapids · 15 GB)' },
      ],
    },
    T2A_ARM: {
      badge: 'Ampere Altra Arm64 Cloud-Native',
      types: [
        { id: 't2a-standard-1', label: 't2a-standard-1 (1 Arm64 vCPU · 4 GB RAM)' },
        { id: 't2a-standard-2', label: 't2a-standard-2 (2 Arm64 vCPU · 8 GB RAM)' },
        { id: 't2a-standard-4', label: 't2a-standard-4 (4 Arm64 vCPU · 16 GB RAM)' },
      ],
    },
    G2_A2_GPU: {
      badge: 'AI / CUDA GPU Accelerated VMs',
      types: [
        { id: 'g2-standard-4', label: 'g2-standard-4 (4 vCPU · 16 GB · 1x NVIDIA L4 24GB)' },
        { id: 'g2-standard-8', label: 'g2-standard-8 (8 vCPU · 32 GB · 1x NVIDIA L4 24GB)' },
        { id: 'g2-standard-12', label: 'g2-standard-12 (12 vCPU · 48 GB · 1x NVIDIA L4 24GB)' },
        { id: 'a2-highgpu-1g', label: 'a2-highgpu-1g (12 vCPU · 85 GB · 1x NVIDIA A100 40GB)' },
        { id: 'n1-standard-4', label: 'n1-standard-4 (4 vCPU · 15 GB + Custom T4/V100 GPU)' },
      ],
    },
  };

  const handleSelectVmRegion = (newReg) => {
    setVmRegion(newReg);
    const firstZone = GCP_REGION_ZONES[newReg]?.zones?.[0] || `${newReg}-b`;
    setZone(firstZone);
  };

  const handleSelectMachineFamily = (fam) => {
    setMachineFamily(fam);
    const firstType = VM_MACHINE_FAMILIES[fam]?.types?.[0]?.id || 'e2-micro';
    setMachineType(firstType);
    if (fam === 'G2_A2_GPU') {
      if (diskSizeGb < 50) setDiskSizeGb(50);
    }
  };

  // VPC Network & Firewall specific
  const [autoCreateSubnetworks, setAutoCreateSubnetworks] = useState(true);
  const [routingMode, setRoutingMode] = useState('REGIONAL');
  const [mtu, setMtu] = useState(1460);
  const [firewallNetwork, setFirewallNetwork] = useState('default');
  const [firewallProtocol, setFirewallProtocol] = useState('tcp');
  const [firewallPorts, setFirewallPorts] = useState('80,443');
  const [firewallSourceRanges, setFirewallSourceRanges] = useState('0.0.0.0/0');

  // GCS specific
  const [storageClass, setStorageClass] = useState('STANDARD');

  // Cloud Run specific
  const [containerImage, setContainerImage] = useState(
    'us-docker.pkg.dev/cloudrun/container/hello'
  );
  const [runPort, setRunPort] = useState(8080);
  const [runCpu, setRunCpu] = useState('1');
  const [runMemory, setRunMemory] = useState('512Mi');
  const [runMinInstances, setRunMinInstances] = useState(0);
  const [runMaxInstances, setRunMaxInstances] = useState(10);
  const [runConcurrency, setRunConcurrency] = useState(80);
  const [runTimeout, setRunTimeout] = useState(300);
  const [runIngress, setRunIngress] = useState('INGRESS_TRAFFIC_ALL');
  const [runAllowUnauth, setRunAllowUnauth] = useState(true);
  // 2026 Billing Mode: 'REQUEST_BASED' (cpuIdle: true) vs 'INSTANCE_BASED' (cpuIdle: false)
  const [runBillingMode, setRunBillingMode] = useState('REQUEST_BASED');
  const [runStartupBoost, setRunStartupBoost] = useState(true);
  const [runExecEnv, setRunExecEnv] = useState('EXECUTION_ENVIRONMENT_GEN2');
  const [runEnvVars, setRunEnvVars] = useState('NODE_ENV=production');
  // 2026 Cloud Run GPU Accelerator ('NONE' | 'nvidia-l4' | 'nvidia-rtx-pro-6000')
  const [runGpuAccelerator, setRunGpuAccelerator] = useState('NONE');
  const [runGpuZonalRedundancy, setRunGpuZonalRedundancy] = useState(false);

  const handleSelectGpuAccelerator = (accel) => {
    setRunGpuAccelerator(accel);
    if (accel !== 'NONE') {
      // Cloud Run GPU minimum hardware requirements: 4+ vCPU, 16Gi+ RAM, Gen2, Instance-based billing
      if (Number(runCpu) < 4) setRunCpu('4');
      if (!['16Gi', '32Gi'].includes(runMemory)) setRunMemory('16Gi');
      setRunBillingMode('INSTANCE_BASED');
      setRunExecEnv('EXECUTION_ENVIRONMENT_GEN2');
    }
  };

  // BigQuery specific
  const [bqLocation, setBqLocation] = useState('US');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [copiedCmd, setCopiedCmd] = useState(false);

  const generateDefaultName = (type, proj) => {
    const suffix = Math.floor(1000 + Math.random() * 8999);
    if (type === 'COMPUTE_VM') return `${proj}-vm-${suffix}`;
    if (type === 'VPC_NETWORK') return `${proj}-vpc-${suffix}`;
    if (type === 'VPC_FIREWALL') return `allow-web-${suffix}`;
    if (type === 'GCS_BUCKET') return `${proj}-bucket-${suffix}`;
    if (type === 'CLOUD_RUN') return `${proj}-srv-${suffix}`;
    return `dataset_${suffix}`;
  };

  useEffect(() => {
    if (isOpen) {
      setServiceType(initialServiceType);
      setName(generateDefaultName(initialServiceType, projectId));
      setErrorMsg(null);
    }
  }, [isOpen, initialServiceType, projectId]);

  const handleTabSwitch = (newType) => {
    setServiceType(newType);
    setErrorMsg(null);
    setName(generateDefaultName(newType, projectId));
  };

  const gcloudPreview = useMemo(() => {
    const clean = (name || 'resource').trim().toLowerCase();
    if (serviceType === 'COMPUTE_VM') {
      const tags = [
        ...(allowHttp ? ['http-server'] : []),
        ...(allowHttps ? ['https-server'] : []),
      ];
      const tagFlag = tags.length > 0 ? ` --tags=${tags.join(',')}` : '';
      const spotFlag = spotInstance
        ? ` --provisioning-model=SPOT --instance-termination-action=${terminationAction}`
        : ' --provisioning-model=STANDARD';
      const gpuFlag =
        vmGpuType !== 'NONE' &&
        !machineType.startsWith('g2-') &&
        !machineType.startsWith('a2-')
          ? ` --accelerator=type=${vmGpuType},count=${vmGpuCount} --maintenance-policy=TERMINATE`
          : '';
      const netFlag = ` --network=${vmNetwork}${
        !externalIpEnabled ? ' --no-address' : ''
      }`;
      const shieldFlag = shieldedSecureBoot ? ' --shielded-secure-boot' : '';
      const delProtFlag = deletionProtection ? ' --deletion-protection' : '';
      return `gcloud compute instances create ${clean} --project=${projectId} --zone=${zone} --machine-type=${machineType} --boot-disk-size=${diskSizeGb}GB --boot-disk-type=${diskType}${spotFlag}${gpuFlag}${netFlag}${tagFlag}${shieldFlag}${delProtFlag}`;
    }
    if (serviceType === 'VPC_NETWORK') {
      return `gcloud compute networks create ${clean} --project=${projectId} --subnet-mode=${
        autoCreateSubnetworks ? 'auto' : 'custom'
      } --bgp-routing-mode=${routingMode.toLowerCase()} --mtu=${mtu}`;
    }
    if (serviceType === 'VPC_FIREWALL') {
      return `gcloud compute firewall-rules create ${clean} --project=${projectId} --network=${firewallNetwork} --allow=${firewallProtocol}${
        firewallPorts && firewallProtocol !== 'icmp' ? ':' + firewallPorts : ''
      } --source-ranges=${firewallSourceRanges}`;
    }
    if (serviceType === 'GCS_BUCKET') {
      return `gcloud storage buckets create gs://${clean} --project=${projectId} --location=${region.toUpperCase()} --default-storage-class=${storageClass} --uniform-bucket-level-access`;
    }
    if (serviceType === 'CLOUD_RUN') {
      const ingressFlag =
        runIngress === 'INGRESS_TRAFFIC_INTERNAL_ONLY'
          ? 'internal'
          : runIngress === 'INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER'
          ? 'internal-and-cloud-load-balancing'
          : 'all';
      const hasGpu = runGpuAccelerator !== 'NONE';
      const billingFlag =
        runBillingMode === 'REQUEST_BASED' && !hasGpu
          ? '--billing=request --cpu-throttling'
          : '--billing=instance --no-cpu-throttling';
      const gpuFlags = hasGpu
        ? ` --gpu=1 --gpu-type=${runGpuAccelerator} ${
            runGpuZonalRedundancy
              ? '--gpu-zonal-redundancy'
              : '--no-gpu-zonal-redundancy'
          }`
        : '';
      return `gcloud run deploy ${clean} --project=${projectId} --region=${region} --image=${containerImage} --port=${runPort} --cpu=${runCpu} --memory=${runMemory}${gpuFlags} --min-instances=${runMinInstances} --max-instances=${runMaxInstances} --concurrency=${runConcurrency} --timeout=${runTimeout}s --ingress=${ingressFlag} --execution-environment=${
        runExecEnv === 'EXECUTION_ENVIRONMENT_GEN2' ? 'gen2' : 'gen1'
      } ${billingFlag} ${
        runAllowUnauth ? '--allow-unauthenticated' : '--no-allow-unauthenticated'
      }`;
    }
    const ds = clean.replace(/-/g, '_');
    return `bq --location=${bqLocation} mk --dataset --label datacloud:antigravity ${projectId}:${ds}`;
  }, [
    serviceType,
    name,
    projectId,
    zone,
    machineType,
    diskSizeGb,
    diskType,
    spotInstance,
    terminationAction,
    vmGpuType,
    vmGpuCount,
    vmNetwork,
    externalIpEnabled,
    allowHttp,
    allowHttps,
    shieldedSecureBoot,
    deletionProtection,
    autoCreateSubnetworks,
    routingMode,
    mtu,
    firewallNetwork,
    firewallProtocol,
    firewallPorts,
    firewallSourceRanges,
    region,
    storageClass,
    containerImage,
    runPort,
    runCpu,
    runMemory,
    runMinInstances,
    runMaxInstances,
    runConcurrency,
    runTimeout,
    runIngress,
    runExecEnv,
    runBillingMode,
    runGpuAccelerator,
    runGpuZonalRedundancy,
    runAllowUnauth,
    bqLocation,
  ]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    setErrorMsg(null);

    const hasGpu = runGpuAccelerator !== 'NONE';

    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/provision`,
        {
          serviceType,
          name: name.trim(),
          region: serviceType === 'COMPUTE_VM' ? vmRegion : region,
          zone,
          config: {
            machineType,
            osImage,
            diskSizeGb,
            diskType,
            spotInstance,
            terminationAction,
            vmGpuType,
            vmGpuCount,
            vmNetwork,
            externalIpEnabled,
            allowHttp,
            allowHttps,
            shieldedSecureBoot,
            shieldedVtpm,
            deletionProtection,
            startupScript,
            autoCreateSubnetworks,
            routingMode,
            mtu,
            network: firewallNetwork,
            protocol: firewallProtocol,
            ports: firewallPorts,
            sourceRanges: firewallSourceRanges,
            storageClass,
            containerImage,
            containerPort: runPort,
            cpu: runCpu,
            memory: runMemory,
            minInstances: runMinInstances,
            maxInstances: runMaxInstances,
            concurrency: runConcurrency,
            timeoutSeconds: runTimeout,
            ingress: runIngress,
            allowUnauthenticated: runAllowUnauth,
            billingMode: hasGpu ? 'INSTANCE_BASED' : runBillingMode,
            cpuIdle: runBillingMode === 'REQUEST_BASED' && !hasGpu,
            gpuCount: hasGpu ? 1 : 0,
            gpuType: hasGpu ? runGpuAccelerator : 'nvidia-l4',
            gpuZonalRedundancy: runGpuZonalRedundancy,
            startupCpuBoost: runStartupBoost,
            executionEnvironment: runExecEnv,
            envVars: runEnvVars,
            location: bqLocation,
          },
        }
      );
      onProvisionSuccess(res.data, serviceType);
      onClose();
    } catch (err) {
      setErrorMsg(
        err.response?.data?.error ||
          err.message ||
          'Failed to provision resource on Google Cloud.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#ffffff] dark:bg-[#0c0c0f] rounded-[12px] border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-2xl p-6 space-y-5 my-8">
        <div className="flex items-start justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <span>Provision Real GCP Resource</span>
                <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded">
                  {projectId}
                </span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Executes live Google Cloud REST API calls against your authenticated project.
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close Provisioning Studio"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Service Type Selector Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {SERVICE_TABS.map((t) => {
            const Icon = t.icon;
            const active = serviceType === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTabSwitch(t.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  active
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'bg-zinc-50/70 dark:bg-[#09090b] border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                }`}
              >
                <Icon className="w-4 h-4 mb-1.5" />
                <div className="text-xs font-bold">{t.label}</div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
                  {t.desc}
                </div>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Resource Name / Identifier
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] py-[8px] text-xs font-mono shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-zinc-950 dark:text-zinc-100 transition-all"
              />
            </div>

            {serviceType === 'COMPUTE_VM' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                    GCP Region (13 Global)
                  </label>
                  <select
                    value={vmRegion}
                    onChange={(e) => handleSelectVmRegion(e.target.value)}
                    className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2 py-[8px] text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100"
                  >
                    {Object.entries(GCP_REGION_ZONES).map(([regKey, info]) => (
                      <option key={regKey} value={regKey}>
                        {info.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                    Availability Zone
                  </label>
                  <select
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                    className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2 py-[8px] text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100"
                  >
                    {(GCP_REGION_ZONES[vmRegion]?.zones || [`${vmRegion}-b`]).map(
                      (z) => (
                        <option key={z} value={z}>
                          {z}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>
            )}

            {serviceType === 'VPC_NETWORK' && (
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                  Dynamic BGP Routing Mode
                </label>
                <select
                  value={routingMode}
                  onChange={(e) => setRoutingMode(e.target.value)}
                  className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] py-[8px] text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100"
                >
                  <option value="REGIONAL">REGIONAL (Standard VPC Routing)</option>
                  <option value="GLOBAL">GLOBAL (Multi-Region Cloud Router)</option>
                </select>
              </div>
            )}

            {serviceType === 'VPC_FIREWALL' && (
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                  Target VPC Network
                </label>
                <input
                  type="text"
                  value={firewallNetwork}
                  onChange={(e) => setFirewallNetwork(e.target.value)}
                  placeholder="default"
                  className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] py-[8px] text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100"
                />
              </div>
            )}

            {(serviceType === 'GCS_BUCKET' || serviceType === 'CLOUD_RUN') && (
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                  GCP Region
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] py-[8px] text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100"
                >
                  {Object.entries(GCP_REGION_ZONES).map(([regKey, info]) => (
                    <option key={regKey} value={regKey}>
                      {info.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {serviceType === 'BIGQUERY_DATASET' && (
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                  Dataset Location
                </label>
                <select
                  value={bqLocation}
                  onChange={(e) => setBqLocation(e.target.value)}
                  className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] py-[8px] text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100"
                >
                  <option value="US">US (Multi-Region)</option>
                  <option value="EU">EU (Multi-Region)</option>
                  <option value="us-east1">us-east1 (Single Region)</option>
                  <option value="us-central1">us-central1 (Single Region)</option>
                  <option value="europe-west1">europe-west1 (Single Region)</option>
                  <option value="asia-northeast1">asia-northeast1 (Tokyo)</option>
                </select>
              </div>
            )}
          </div>

          {serviceType === 'VPC_NETWORK' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                  Subnet Creation Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAutoCreateSubnetworks(true)}
                    className={`py-2 px-3 rounded-lg border text-xs font-mono font-semibold transition-colors ${
                      autoCreateSubnetworks
                        ? 'bg-blue-500/15 border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    AUTO SUBNETS
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutoCreateSubnetworks(false)}
                    className={`py-2 px-3 rounded-lg border text-xs font-mono font-semibold transition-colors ${
                      !autoCreateSubnetworks
                        ? 'bg-blue-500/15 border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    CUSTOM SUBNETS
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                  Maximum Transmission Unit (MTU)
                </label>
                <select
                  value={mtu}
                  onChange={(e) => setMtu(Number(e.target.value))}
                  className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] py-[8px] text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100"
                >
                  <option value={1460}>1460 bytes (Standard GCP Default)</option>
                  <option value={1500}>1500 bytes (Standard Ethernet)</option>
                  <option value={8896}>8896 bytes (Jumbo Frames AI/HPC)</option>
                </select>
              </div>
            </div>
          )}

          {serviceType === 'VPC_FIREWALL' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                  IP Protocol
                </label>
                <select
                  value={firewallProtocol}
                  onChange={(e) => setFirewallProtocol(e.target.value)}
                  className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] py-[8px] text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100"
                >
                  <option value="tcp">tcp</option>
                  <option value="udp">udp</option>
                  <option value="icmp">icmp (Ping)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                  Allowed Ports
                </label>
                <input
                  type="text"
                  disabled={firewallProtocol === 'icmp'}
                  value={firewallPorts}
                  onChange={(e) => setFirewallPorts(e.target.value)}
                  placeholder="22,80,443"
                  className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] py-[8px] text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100 disabled:opacity-40"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                  Source IPv4 Ranges (CIDR)
                </label>
                <input
                  type="text"
                  value={firewallSourceRanges}
                  onChange={(e) => setFirewallSourceRanges(e.target.value)}
                  placeholder="0.0.0.0/0"
                  className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] py-[8px] text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100"
                />
              </div>
            </div>
          )}

          {serviceType === 'COMPUTE_VM' && (
            <div className="space-y-3.5 border-t border-zinc-200 dark:border-zinc-800 pt-3">
              {/* Machine Family Selector Pills */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold font-mono uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                    1. Compute Engine Machine Series (E2 · N2 · C3/C4 · Arm64 · GPU)
                  </label>
                  <span className="text-[10px] font-mono text-blue-500">
                    {VM_MACHINE_FAMILIES[machineFamily]?.badge}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {[
                    { id: 'E2', label: 'E2 Series', sub: 'Cost-Saver' },
                    { id: 'N2', label: 'N2 / N2D', sub: 'Balanced' },
                    { id: 'C3_C4', label: 'C3 / C4', sub: 'Gen-4/5 Fast' },
                    { id: 'T2A_ARM', label: 'T2A Arm64', sub: 'Ampere Altra' },
                    { id: 'G2_A2_GPU', label: 'G2 / A2 GPU', sub: 'L4 / A100 AI' },
                  ].map((f) => {
                    const active = machineFamily === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => handleSelectMachineFamily(f.id)}
                        className={`p-2 rounded-lg border text-left transition-all ${
                          active
                            ? 'bg-blue-500/15 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'bg-zinc-50 dark:bg-[#09090b] border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                        }`}
                      >
                        <div className="text-xs font-bold font-mono">{f.label}</div>
                        <div className="text-[10px] text-zinc-500">{f.sub}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Machine Type, OS Image, Provisioning Model */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                    Machine Type Preset
                  </label>
                  <select
                    value={machineType}
                    onChange={(e) => setMachineType(e.target.value)}
                    className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-[8px] text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100"
                  >
                    {(VM_MACHINE_FAMILIES[machineFamily]?.types || []).map((mt) => (
                      <option key={mt.id} value={mt.id}>
                        {mt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                    Boot OS Image Family
                  </label>
                  <select
                    value={osImage}
                    onChange={(e) => setOsImage(e.target.value)}
                    className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-[8px] text-xs shadow-sm text-zinc-950 dark:text-zinc-100"
                  >
                    <option value="Debian 12 Bookworm">Debian 12 Bookworm (Default)</option>
                    <option value="Ubuntu 24.04 LTS">Ubuntu 24.04 LTS Noble</option>
                    <option value="Ubuntu 22.04 LTS">Ubuntu 22.04 LTS Jammy</option>
                    <option value="Container-Optimized OS (COS)">
                      Container-Optimized OS (Docker Ready)
                    </option>
                    <option value="Rocky Linux 9">Rocky Linux 9 Enterprise</option>
                    <option value="Deep Learning VM (PyTorch + CUDA)">
                      Deep Learning VM (PyTorch + CUDA 12.4)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                    Provisioning Model
                  </label>
                  <button
                    type="button"
                    onClick={() => setSpotInstance((s) => !s)}
                    className={`w-full rounded-[8px] px-3 py-[8px] text-xs font-mono font-semibold border flex items-center justify-between transition-colors ${
                      spotInstance
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                        : 'bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    <span>
                      {spotInstance
                        ? 'Spot VM (Up to 91% Off)'
                        : 'Standard VM (24/7 SLA)'}
                    </span>
                    <Zap className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Boot Disk Type, Disk Size, Optional Guest GPU & Spot Termination Action */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                    Boot Disk Type
                  </label>
                  <select
                    value={diskType}
                    onChange={(e) => setDiskType(e.target.value)}
                    className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-[8px] text-xs font-mono text-zinc-950 dark:text-zinc-100"
                  >
                    <option value="pd-balanced">pd-balanced (SSD Balanced)</option>
                    <option value="pd-ssd">pd-ssd (Extreme Low-Latency SSD)</option>
                    <option value="pd-standard">pd-standard (HDD Economical)</option>
                    <option value="hyperdisk-balanced">
                      hyperdisk-balanced (2026 Gen-4/5)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                    Boot Disk Size (GB)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={2000}
                    value={diskSizeGb}
                    onChange={(e) => setDiskSizeGb(Number(e.target.value))}
                    className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-[8px] text-xs font-mono text-zinc-950 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                    Attach Dedicated GPU
                  </label>
                  <select
                    value={vmGpuType}
                    onChange={(e) => setVmGpuType(e.target.value)}
                    className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2 py-[8px] text-xs font-mono text-zinc-950 dark:text-zinc-100"
                  >
                    <option value="NONE">
                      {machineType.startsWith('g2-')
                        ? 'Built-in 1x NVIDIA L4'
                        : machineType.startsWith('a2-')
                        ? 'Built-in 1x NVIDIA A100'
                        : 'No Extra GPU'}
                    </option>
                    <option value="nvidia-tesla-t4">1x NVIDIA T4 (16GB VRAM)</option>
                    <option value="nvidia-l4">1x NVIDIA L4 (24GB VRAM)</option>
                    <option value="nvidia-tesla-v100">1x NVIDIA V100 (16GB)</option>
                    <option value="nvidia-tesla-a100">1x NVIDIA A100 (40GB)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                    VPC Network & NAT
                  </label>
                  <button
                    type="button"
                    onClick={() => setExternalIpEnabled((v) => !v)}
                    className={`w-full rounded-[8px] px-2.5 py-[8px] text-xs font-mono border text-left transition-colors ${
                      externalIpEnabled
                        ? 'bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-400'
                        : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-800 text-zinc-500'
                    }`}
                  >
                    {externalIpEnabled
                      ? 'Public IPv4 + default VPC'
                      : 'Internal IP Only (No NAT)'}
                  </button>
                </div>
              </div>

              {/* Firewall Tags, Shielded VM, Deletion Protection & Spot Action */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setAllowHttp((v) => !v)}
                  className={`p-2 rounded-lg border text-[11px] font-mono text-left transition-colors ${
                    allowHttp
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500'
                  }`}
                >
                  {allowHttp ? '✓ Allow HTTP (Port 80)' : '○ Block HTTP'}
                </button>

                <button
                  type="button"
                  onClick={() => setAllowHttps((v) => !v)}
                  className={`p-2 rounded-lg border text-[11px] font-mono text-left transition-colors ${
                    allowHttps
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500'
                  }`}
                >
                  {allowHttps ? '✓ Allow HTTPS (Port 443)' : '○ Block HTTPS'}
                </button>

                <button
                  type="button"
                  onClick={() => setShieldedSecureBoot((v) => !v)}
                  className={`p-2 rounded-lg border text-[11px] font-mono text-left transition-colors ${
                    shieldedSecureBoot
                      ? 'bg-violet-500/10 border-violet-500/40 text-violet-600 dark:text-violet-400 font-bold'
                      : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500'
                  }`}
                >
                  {shieldedSecureBoot
                    ? '✓ Shielded Secure Boot'
                    : '○ Standard vTPM Boot'}
                </button>

                <button
                  type="button"
                  onClick={() => setDeletionProtection((v) => !v)}
                  className={`p-2 rounded-lg border text-[11px] font-mono text-left transition-colors ${
                    deletionProtection
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400 font-bold'
                      : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500'
                  }`}
                >
                  {deletionProtection
                    ? '🔒 Deletion Protection ON'
                    : '🔓 Deletion Protection OFF'}
                </button>
              </div>

              {/* Startup Script Metadata (Cloud-Init / Bash) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-medium text-zinc-500">
                    Boot Startup Script (`metadata.startup-script` — optional bash executed as root on boot)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setStartupScript(
                          '#!/bin/bash\napt-get update && apt-get install -y nginx docker.io\nsystemctl enable --now nginx'
                        )
                      }
                      className="text-[10px] font-mono text-blue-500 hover:underline"
                    >
                      + NGINX + Docker Preset
                    </button>
                  </div>
                </div>
                <textarea
                  rows={2}
                  value={startupScript}
                  onChange={(e) => setStartupScript(e.target.value)}
                  placeholder="#!/bin/bash&#10;apt-get update && apt-get install -y nginx"
                  className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-3 py-1.5 text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100"
                />
              </div>
            </div>
          )}

          {serviceType === 'GCS_BUCKET' && (
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Default Storage Class
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['STANDARD', 'NEARLINE', 'COLDLINE', 'ARCHIVE'].map((sc) => (
                  <button
                    key={sc}
                    type="button"
                    onClick={() => setStorageClass(sc)}
                    className={`py-2 px-3 rounded-lg border text-xs font-mono font-semibold transition-colors ${
                      storageClass === sc
                        ? 'bg-blue-500/15 border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {sc}
                  </button>
                ))}
              </div>
            </div>
          )}

          {serviceType === 'CLOUD_RUN' && (
            <div className="space-y-3.5 border-t border-zinc-200 dark:border-zinc-800 pt-3">
              {/* Quick Image Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-mono text-zinc-500">
                  Quick Image Preset:
                </span>
                {[
                  {
                    label: 'Cloud Run Hello',
                    uri: 'us-docker.pkg.dev/cloudrun/container/hello',
                    port: 8080,
                  },
                  {
                    label: 'Google Hello Web v1',
                    uri: 'gcr.io/google-samples/hello-app:1.0',
                    port: 8080,
                  },
                  {
                    label: 'NGINX Unprivileged',
                    uri: 'nginxinc/nginx-unprivileged:alpine',
                    port: 8080,
                  },
                ].map((preset) => (
                  <button
                    key={preset.uri}
                    type="button"
                    onClick={() => {
                      setContainerImage(preset.uri);
                      setRunPort(preset.port);
                    }}
                    className={`text-[11px] font-mono px-2.5 py-1 rounded border transition-colors ${
                      containerImage === preset.uri
                        ? 'bg-blue-500/15 border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-zinc-500 mb-1">
                    Container Image URI (Artifact Registry / GCR / Docker)
                  </label>
                  <input
                    type="text"
                    value={containerImage}
                    onChange={(e) => setContainerImage(e.target.value)}
                    className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] py-[8px] text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">
                    Container Port
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={65535}
                    value={runPort}
                    onChange={(e) => setRunPort(Number(e.target.value))}
                    className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] py-[8px] text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* 2026 Cloud Run Billing Mode: Request-based vs Instance-based */}
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label className="text-[11px] font-bold font-mono uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>
                      2026 Cloud Run Billing Mode (Request-based vs Instance-based)
                    </span>
                  </label>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {runGpuAccelerator !== 'NONE'
                      ? 'GPU requires Instance-based Billing'
                      : runBillingMode === 'REQUEST_BASED'
                      ? '--billing=request (--cpu-throttling)'
                      : '--billing=instance (--no-cpu-throttling)'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={runGpuAccelerator !== 'NONE'}
                    onClick={() => setRunBillingMode('REQUEST_BASED')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      runBillingMode === 'REQUEST_BASED' &&
                      runGpuAccelerator === 'NONE'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                        : 'bg-white dark:bg-[#09090b] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 disabled:opacity-45 disabled:cursor-not-allowed'
                    }`}
                  >
                    <div className="text-xs font-bold font-mono flex items-center justify-between">
                      <span>Request-based Billing</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                        $0 Idle
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      CPU allocated only while processing requests + per-request
                      fee. Ideal for web APIs & bursty webhooks.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRunBillingMode('INSTANCE_BASED')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      runBillingMode === 'INSTANCE_BASED' ||
                      runGpuAccelerator !== 'NONE'
                        ? 'bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-300'
                        : 'bg-white dark:bg-[#09090b] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <div className="text-xs font-bold font-mono flex items-center justify-between">
                      <span>Instance-based Billing</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-600 dark:text-blue-400">
                        Always-On CPU/GPU
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      Billed for entire instance lifetime, no per-request fee.
                      Required for GPUs, background workers & async tasks.
                    </p>
                  </button>
                </div>
              </div>

              {/* 2026 Serverless GPU Accelerator (NVIDIA L4 / RTX PRO 6000 Blackwell) */}
              <div className="p-3 rounded-xl bg-violet-500/[0.04] dark:bg-violet-950/20 border border-violet-500/25 space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label className="text-[11px] font-bold font-mono uppercase tracking-wider text-violet-600 dark:text-violet-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>2026 Serverless GPU Accelerator (Gen2 AI Inference)</span>
                  </label>
                  {runGpuAccelerator !== 'NONE' && (
                    <span className="text-[10px] font-mono bg-violet-500/15 text-violet-600 dark:text-violet-300 px-2 py-0.5 rounded-full">
                      Auto-enforced: ≥4 vCPU · ≥16Gi RAM · Instance Billing
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    {
                      id: 'NONE',
                      title: 'No GPU (CPU Only)',
                      sub: 'Standard Serverless Container',
                    },
                    {
                      id: 'nvidia-l4',
                      title: '1x NVIDIA L4 GPU',
                      sub: '24GB VRAM · Ada Lovelace (LLM / Vision)',
                    },
                    {
                      id: 'nvidia-rtx-pro-6000',
                      title: '1x RTX PRO 6000',
                      sub: '96GB VRAM · 2026 Blackwell Max',
                    },
                  ].map((g) => {
                    const active = runGpuAccelerator === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => handleSelectGpuAccelerator(g.id)}
                        className={`p-2 rounded-lg border text-left transition-all ${
                          active
                            ? 'bg-violet-500/15 border-violet-500 text-violet-700 dark:text-violet-300 shadow-sm'
                            : 'bg-white dark:bg-[#09090b] border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-violet-500/40'
                        }`}
                      >
                        <div className="text-xs font-bold font-mono">
                          {g.title}
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                          {g.sub}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {runGpuAccelerator !== 'NONE' && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-violet-500/20">
                    <span className="text-[11px] text-zinc-500">
                      GPU Zonal Redundancy (Reserve GPU capacity across multiple
                      zones):
                    </span>
                    <button
                      type="button"
                      onClick={() => setRunGpuZonalRedundancy((v) => !v)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-mono font-semibold border transition-colors ${
                        runGpuZonalRedundancy
                          ? 'bg-violet-500/15 border-violet-500/40 text-violet-600 dark:text-violet-300'
                          : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {runGpuZonalRedundancy
                        ? 'Zonal Redundancy ON (--gpu-zonal-redundancy)'
                        : 'No Zonal Redundancy (--no-gpu-zonal-redundancy · Lower Cost)'}
                    </button>
                  </div>
                )}
              </div>

              {/* CPU, Memory, Min/Max Instances, Concurrency */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                    vCPU
                  </label>
                  <select
                    value={runCpu}
                    onChange={(e) => setRunCpu(e.target.value)}
                    className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-[8px] text-xs font-mono text-zinc-950 dark:text-zinc-100"
                  >
                    <option
                      value="1"
                      disabled={runGpuAccelerator !== 'NONE'}
                    >
                      1 vCPU
                    </option>
                    <option
                      value="2"
                      disabled={runGpuAccelerator !== 'NONE'}
                    >
                      2 vCPU
                    </option>
                    <option value="4">4 vCPU (GPU Min)</option>
                    <option value="8">8 vCPU</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                    Memory
                  </label>
                  <select
                    value={runMemory}
                    onChange={(e) => setRunMemory(e.target.value)}
                    className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-[8px] text-xs font-mono text-zinc-950 dark:text-zinc-100"
                  >
                    <option
                      value="256Mi"
                      disabled={runGpuAccelerator !== 'NONE'}
                    >
                      256Mi
                    </option>
                    <option
                      value="512Mi"
                      disabled={runGpuAccelerator !== 'NONE'}
                    >
                      512Mi
                    </option>
                    <option value="1Gi" disabled={runGpuAccelerator !== 'NONE'}>
                      1Gi
                    </option>
                    <option value="2Gi" disabled={runGpuAccelerator !== 'NONE'}>
                      2Gi
                    </option>
                    <option value="4Gi" disabled={runGpuAccelerator !== 'NONE'}>
                      4Gi
                    </option>
                    <option value="8Gi" disabled={runGpuAccelerator !== 'NONE'}>
                      8Gi
                    </option>
                    <option value="16Gi">16Gi (GPU Min)</option>
                    <option value="32Gi">32Gi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                    Min Inst (0=$0)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={runMinInstances}
                    onChange={(e) => setRunMinInstances(Number(e.target.value))}
                    className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-[8px] text-xs font-mono text-zinc-950 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                    Max Inst (Cap)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={runMaxInstances}
                    onChange={(e) => setRunMaxInstances(Number(e.target.value))}
                    className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-[8px] text-xs font-mono text-zinc-950 dark:text-zinc-100"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                    Concurrency
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={runConcurrency}
                    onChange={(e) => setRunConcurrency(Number(e.target.value))}
                    className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-[8px] text-xs font-mono text-zinc-950 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Ingress, IAM Public/Private, Startup CPU Boost & Environment Variables */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                    Ingress Control
                  </label>
                  <select
                    value={runIngress}
                    onChange={(e) => setRunIngress(e.target.value)}
                    className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-[8px] text-xs font-mono text-zinc-950 dark:text-zinc-100"
                  >
                    <option value="INGRESS_TRAFFIC_ALL">
                      All Traffic (Public Internet)
                    </option>
                    <option value="INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER">
                      Internal + Load Balancing
                    </option>
                    <option value="INGRESS_TRAFFIC_INTERNAL_ONLY">
                      Internal VPC Only
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                    Authentication (IAM Invoker)
                  </label>
                  <button
                    type="button"
                    onClick={() => setRunAllowUnauth((v) => !v)}
                    className={`w-full rounded-[8px] px-3 py-[8px] text-xs font-mono border text-left transition-colors ${
                      runAllowUnauth
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {runAllowUnauth
                      ? 'Public HTTPS (allUsers)'
                      : 'Private (IAM Auth Only)'}
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                    Cold-Start CPU Boost
                  </label>
                  <button
                    type="button"
                    onClick={() => setRunStartupBoost((v) => !v)}
                    className={`w-full rounded-[8px] px-3 py-[8px] text-xs font-mono border text-left transition-colors ${
                      runStartupBoost
                        ? 'bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-400'
                        : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    {runStartupBoost
                      ? 'Startup CPU Boost ON'
                      : 'Startup CPU Boost OFF'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                  Environment Variables (KEY=VALUE comma or newline separated)
                </label>
                <input
                  type="text"
                  value={runEnvVars}
                  onChange={(e) => setRunEnvVars(e.target.value)}
                  placeholder="NODE_ENV=production, LOG_LEVEL=info"
                  className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] py-[8px] text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100"
                />
              </div>
            </div>
          )}

          {/* Live gcloud CLI Equivalent Preview */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span className="font-mono uppercase tracking-wider text-emerald-400">
                Equivalent gcloud CLI Command
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(gcloudPreview);
                  setCopiedCmd(true);
                  setTimeout(() => setCopiedCmd(false), 1500);
                }}
                className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300"
              >
                {copiedCmd ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy CLI</span>
                  </>
                )}
              </button>
            </div>
            <pre className="text-xs font-mono text-zinc-200 whitespace-pre-wrap break-all">
              $ {gcloudPreview}
            </pre>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-500 leading-relaxed">
              <strong>Google Cloud API Response:</strong> {errorMsg}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Direct Live GCP API Execution ({projectId})</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="bg-[#ffffff] dark:bg-[#262626] hover:bg-[#f8fafc] dark:hover:bg-zinc-800 text-[#334155] dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-[8px] px-[16px] py-[8px] text-xs font-[500] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !name.trim()}
                className="bg-[#059669] hover:bg-[#047857] text-[#000000] rounded-[8px] px-[18px] py-[8px] text-xs font-[700] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting
                  ? 'Creating on Google Cloud...'
                  : `Create Live ${
                      SERVICE_TABS.find((s) => s.id === serviceType)?.label
                    }`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
