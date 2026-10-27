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
import VisualCronScheduleBuilder, {
  describeCronInPlainEnglish,
} from './VisualCronScheduleBuilder';

const SERVICE_TABS = [
  {
    id: 'CLOUD_RUN',
    label: 'Cloud Run',
    icon: Cpu,
    desc: 'Deploy Cloud Run Service (run.googleapis.com)',
  },
  {
    id: 'GKE_CLUSTER',
    label: 'GKE Cluster',
    icon: Sparkles,
    desc: 'Create GKE Autopilot or Standard GPU Cluster (container.googleapis.com)',
  },
  {
    id: 'COMPUTE_VM',
    label: 'Compute VM',
    icon: Server,
    desc: 'Create Compute Engine VM (compute.googleapis.com)',
  },
  {
    id: 'VPC_NETWORK',
    label: 'VPC Network',
    icon: Network,
    desc: 'Create VPC Network (global/networks)',
  },
  {
    id: 'VPC_FIREWALL',
    label: 'Firewall Rule',
    icon: Shield,
    desc: 'Create VPC Firewall Rule (global/firewalls)',
  },
  {
    id: 'GCS_BUCKET',
    label: 'Cloud Storage',
    icon: HardDrive,
    desc: 'Create Cloud Storage Bucket (storage.googleapis.com)',
  },
  {
    id: 'BIGQUERY_DATASET',
    label: 'BigQuery Dataset',
    icon: Database,
    desc: 'Create BigQuery Dataset (bigquery.googleapis.com)',
  },
  {
    id: 'CLOUD_SQL',
    label: 'Cloud SQL / AlloyDB',
    icon: Database,
    desc: 'Create MySQL 8.4 / Postgres 16 Cloud SQL or AlloyDB Cluster',
  },
];

export default function ResourceProvisionModal({
  isOpen,
  onClose,
  projectId,
  initialServiceType = 'GCS_BUCKET',
  initialLocation = null,
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
  const [diskType, setDiskType] = useState('pd-standard');
  const [spotInstance, setSpotInstance] = useState(false);
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
  const [firewallAction, setFirewallAction] = useState('ALLOW');
  const [firewallDirection, setFirewallDirection] = useState('INGRESS');
  const [firewallPriority, setFirewallPriority] = useState(1000);
  const [firewallProtocol, setFirewallProtocol] = useState('tcp');
  const [firewallPorts, setFirewallPorts] = useState('80,443');
  const [firewallSourceRanges, setFirewallSourceRanges] = useState('0.0.0.0/0');
  const [firewallTargetTags, setFirewallTargetTags] = useState('');
  const [firewallEnableLogging, setFirewallEnableLogging] = useState(false);
  const [firewallDisabled, setFirewallDisabled] = useState(false);
  const [firewallDescription, setFirewallDescription] = useState('');

  // GCS Fine-Grained Console + Enterprise Compliance Studio Options
  const [storageClass, setStorageClass] = useState('STANDARD');
  const [gcsLocationType, setGcsLocationType] = useState('REGIONAL'); // REGIONAL | DUAL_REGION | MULTI_REGION
  const [gcsMultiRegion, setGcsMultiRegion] = useState('US'); // US | EU | ASIA
  const [gcsDualPreset, setGcsDualPreset] = useState('CUSTOM'); // CUSTOM | NAM4 | EUR4 | ASIA1
  const [gcsDualContinent, setGcsDualContinent] = useState('us'); // us | europe | asia
  const [gcsDualRegionA, setGcsDualRegionA] = useState('us-central1');
  const [gcsDualRegionB, setGcsDualRegionB] = useState('us-east1');
  const [gcsRpo, setGcsRpo] = useState('DEFAULT'); // DEFAULT | ASYNC_TURBO
  const [gcsAutoclass, setGcsAutoclass] = useState(false);
  const [gcsAutoclassTerminal, setGcsAutoclassTerminal] = useState('NEARLINE');
  const [gcsPublicAccessPrevention, setGcsPublicAccessPrevention] =
    useState('enforced');
  const [gcsUniformAccess, setGcsUniformAccess] = useState(true); // true = Uniform IAM, false = Fine-grained Object ACLs
  const [gcsSoftDeleteEnabled, setGcsSoftDeleteEnabled] = useState(true);
  const [gcsSoftDeleteDays, setGcsSoftDeleteDays] = useState(7); // 7..90 days (or 0 if disabled)
  const [gcsVersioning, setGcsVersioning] = useState(false);
  const [gcsMaxNumVersions, setGcsMaxNumVersions] = useState(0); // 0 = unlimited
  const [gcsPurgeNoncurrentDays, setGcsPurgeNoncurrentDays] = useState(30);
  const [gcsRetentionEnabled, setGcsRetentionEnabled] = useState(false);
  const [gcsRetentionValue, setGcsRetentionValue] = useState(30);
  const [gcsRetentionUnit, setGcsRetentionUnit] = useState('days'); // seconds | days | months | years
  const [gcsHierarchicalNamespace, setGcsHierarchicalNamespace] =
    useState(false);
  const [gcsEncryptionType, setGcsEncryptionType] =
    useState('GOOGLE_MANAGED'); // GOOGLE_MANAGED | CMEK
  const [gcsCmekKeyName, setGcsCmekKeyName] = useState('');
  const [gcsEnableSmartLifecycle, setGcsEnableSmartLifecycle] = useState(false);
  const [gcsNearlineDays, setGcsNearlineDays] = useState(30);
  const [gcsColdlineDays, setGcsColdlineDays] = useState(90);
  const [gcsArchiveDays, setGcsArchiveDays] = useState(365);
  const [gcsDeleteAfterDays, setGcsDeleteAfterDays] = useState(0);
  const [gcsAbortMultipartDays, setGcsAbortMultipartDays] = useState(7);
  const [gcsRequesterPays, setGcsRequesterPays] = useState(false);
  const [gcsEnableCors, setGcsEnableCors] = useState(false);
  const [gcsCustomLabels, setGcsCustomLabels] = useState(
    'env=production,team=platform'
  );
  const [gcsComplianceRegime, setGcsComplianceRegime] = useState('custom');
  const [gcsDataClassification, setGcsDataClassification] =
    useState('internal');

  const gcsRetentionDays = useMemo(() => {
    if (!gcsRetentionEnabled) return 0;
    const v = Math.max(1, Number(gcsRetentionValue || 1));
    if (gcsRetentionUnit === 'seconds') return Math.max(1, Math.ceil(v / 86400));
    if (gcsRetentionUnit === 'months') return v * 30;
    if (gcsRetentionUnit === 'years') return v * 365;
    return v;
  }, [gcsRetentionEnabled, gcsRetentionValue, gcsRetentionUnit]);

  const gcsRetentionSeconds = useMemo(() => {
    if (!gcsRetentionEnabled) return 0;
    const v = Math.max(1, Number(gcsRetentionValue || 1));
    if (gcsRetentionUnit === 'seconds') return v;
    if (gcsRetentionUnit === 'months') return v * 30 * 86400;
    if (gcsRetentionUnit === 'years') return v * 365 * 86400;
    return v * 86400;
  }, [gcsRetentionEnabled, gcsRetentionValue, gcsRetentionUnit]);

  const applyGcsCompliancePreset = (presetId) => {
    setGcsComplianceRegime(presetId);
    if (presetId === 'sec-17a4-worm') {
      // SEC Rule 17a-4 / FINRA Immutable WORM Vault
      setGcsLocationType('MULTI_REGION');
      setGcsMultiRegion('US');
      setGcsRpo('DEFAULT');
      setStorageClass('COLDLINE');
      setGcsAutoclass(false);
      setGcsPublicAccessPrevention('enforced');
      setGcsUniformAccess(true);
      setGcsRetentionEnabled(true);
      setGcsRetentionValue(1);
      setGcsRetentionUnit('years');
      setGcsVersioning(false); // WORM Retention replaces Versioning per GCP spec
      setGcsSoftDeleteEnabled(true);
      setGcsSoftDeleteDays(30);
      setGcsHierarchicalNamespace(false);
      setGcsEnableSmartLifecycle(true);
      setGcsDataClassification('restricted');
    } else if (presetId === 'gdpr-eu-sovereign') {
      // GDPR EU Data Sovereignty Dual-Region + Turbo Replication
      setGcsLocationType('DUAL_REGION');
      setGcsDualPreset('EUR4');
      setGcsDualContinent('europe');
      setGcsDualRegionA('europe-west4');
      setGcsDualRegionB('europe-north1');
      setGcsRpo('ASYNC_TURBO');
      setStorageClass('STANDARD');
      setGcsAutoclass(false);
      setGcsPublicAccessPrevention('enforced');
      setGcsUniformAccess(true);
      setGcsRetentionEnabled(false);
      setGcsVersioning(true);
      setGcsSoftDeleteEnabled(true);
      setGcsSoftDeleteDays(14);
      setGcsHierarchicalNamespace(false);
      setGcsEnableSmartLifecycle(true);
      setGcsDataClassification('restricted');
    } else if (presetId === 'hipaa-soc2-vault') {
      // HIPAA / SOC2 Healthcare & Audit Vault
      setGcsLocationType('REGIONAL');
      setRegion('us-central1');
      setStorageClass('STANDARD');
      setGcsAutoclass(false);
      setGcsPublicAccessPrevention('enforced');
      setGcsUniformAccess(true);
      setGcsRetentionEnabled(false);
      setGcsVersioning(true);
      setGcsSoftDeleteEnabled(true);
      setGcsSoftDeleteDays(30);
      setGcsPurgeNoncurrentDays(90);
      setGcsHierarchicalNamespace(false);
      setGcsEnableSmartLifecycle(true);
      setGcsDataClassification('restricted');
    } else if (presetId === 'ai-lakehouse-hns') {
      // AI / Spark / Dataflow Lakehouse with Hierarchical Namespace (HNS)
      setGcsLocationType('REGIONAL');
      setRegion('us-central1');
      setStorageClass('STANDARD');
      setGcsAutoclass(false);
      setGcsPublicAccessPrevention('enforced');
      setGcsUniformAccess(true);
      setGcsRetentionEnabled(false);
      setGcsVersioning(false);
      setGcsSoftDeleteEnabled(true);
      setGcsSoftDeleteDays(7);
      setGcsHierarchicalNamespace(true);
      setGcsEnableSmartLifecycle(false);
      setGcsDataClassification('internal');
    } else {
      // GCP Console Default / Zero-Trust Standard
      setGcsLocationType('REGIONAL');
      setStorageClass('STANDARD');
      setGcsAutoclass(false);
      setGcsPublicAccessPrevention('enforced');
      setGcsUniformAccess(true);
      setGcsRetentionEnabled(false);
      setGcsVersioning(false);
      setGcsSoftDeleteEnabled(true);
      setGcsSoftDeleteDays(7);
      setGcsHierarchicalNamespace(false);
      setGcsEnableSmartLifecycle(false);
      setGcsDataClassification('internal');
    }
  };

  // Cloud Run specific + 3-Way Container Source (Artifact Registry | GitHub Repo | Public URI)
  const [runWorkloadKind, setRunWorkloadKind] = useState('SERVICE'); // 'SERVICE' | 'JOB'
  const [runJobTaskCount, setRunJobTaskCount] = useState(4);
  const [runJobMaxRetries, setRunJobMaxRetries] = useState(3);
  const [runJobTimeoutSec, setRunJobTimeoutSec] = useState(3600);
  const [runJobExecuteNow, setRunJobExecuteNow] = useState(true);
  const [runJobAttachScheduler, setRunJobAttachScheduler] = useState(true);
  const [runJobSchedule, setRunJobSchedule] = useState('0 * * * *');
  const [runJobCommandScript, setRunJobCommandScript] = useState('');
  const [runSourceMode, setRunSourceMode] = useState('PUBLIC_URI'); // ARTIFACT_REGISTRY | GITHUB_REPO | PUBLIC_URI
  const [arImages, setArImages] = useState([]);
  const [runGhRepoUrl, setRunGhRepoUrl] = useState(
    'https://github.com/GoogleCloudPlatform/golang-samples.git'
  );
  const [runGhBranch, setRunGhBranch] = useState('main');
  const [runGhContextDir, setRunGhContextDir] = useState('run/helloworld');
  const [runGhBuildMethod, setRunGhBuildMethod] = useState('BUILDPACKS'); // DOCKERFILE | BUILDPACKS
  const [runGhArRepo, setRunGhArRepo] = useState('cloudpulse-containers');

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
  const [runEnableIap, setRunEnableIap] = useState(false);
  // 2026 Billing Mode: 'REQUEST_BASED' (cpuIdle: true) vs 'INSTANCE_BASED' (cpuIdle: false)
  const [runBillingMode, setRunBillingMode] = useState('REQUEST_BASED');
  const [runStartupBoost, setRunStartupBoost] = useState(true);
  const [runExecEnv, setRunExecEnv] = useState('EXECUTION_ENVIRONMENT_GEN2');
  const [runEnvVars, setRunEnvVars] = useState('NODE_ENV=production');
  // 2026 Cloud Run GPU Accelerator ('NONE' | 'nvidia-l4' | 'nvidia-rtx-pro-6000')
  const [runGpuAccelerator, setRunGpuAccelerator] = useState('NONE');
  const [runGpuZonalRedundancy, setRunGpuZonalRedundancy] = useState(false);

  // 2026 Cloud Run Direct VPC Egress Network (`template.vpcAccess`)
  const [runEnableDirectVpc, setRunEnableDirectVpc] = useState(false);
  const [runVpcNetwork, setRunVpcNetwork] = useState('default');
  const [runVpcSubnetwork, setRunVpcSubnetwork] = useState('default');
  const [runVpcEgress, setRunVpcEgress] = useState('PRIVATE_RANGES_ONLY'); // PRIVATE_RANGES_ONLY | ALL_TRAFFIC
  const [runVpcTags, setRunVpcTags] = useState('cloud-run-egress');

  // 2026 Cloud Run Storage Volume Mounts (Beta — `template.volumes` + `volumeMounts`)
  const [runStorageVolumeType, setRunStorageVolumeType] = useState('NONE'); // NONE | GCS_BUCKET | IN_MEMORY | NFS_FILESTORE
  const [runStorageVolumeName, setRunStorageVolumeName] =
    useState('cloudrun-vol-1');
  const [runStorageMountPath, setRunStorageMountPath] = useState('/mnt/gcs');
  const [runStorageGcsBucket, setRunStorageGcsBucket] = useState('');
  const [runStorageReadOnly, setRunStorageReadOnly] = useState(false);
  const [runStorageMemorySizeLimit, setRunStorageMemorySizeLimit] =
    useState('1Gi');
  const [runStorageNfsServer, setRunStorageNfsServer] = useState('10.0.0.2');
  const [runStorageNfsPath, setRunStorageNfsPath] = useState('/vol1');
  const [projectVpcs, setProjectVpcs] = useState(['default']);
  const [projectBuckets, setProjectBuckets] = useState([]);

  const handleSelectRunStorageType = (newVolType) => {
    setRunStorageVolumeType(newVolType);
    if (newVolType === 'GCS_BUCKET') {
      setRunStorageMountPath('/mnt/gcs');
      setRunExecEnv('EXECUTION_ENVIRONMENT_GEN2');
      if (!runStorageGcsBucket && projectBuckets.length > 0) {
        setRunStorageGcsBucket(projectBuckets[0]);
      }
    } else if (newVolType === 'IN_MEMORY') {
      setRunStorageMountPath('/mnt/ramdisk');
    } else if (newVolType === 'NFS_FILESTORE') {
      setRunStorageMountPath('/mnt/nfs');
      setRunExecEnv('EXECUTION_ENVIRONMENT_GEN2');
      setRunEnableDirectVpc(true);
    }
  };

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

  // BigQuery 2026 Enterprise Compliance & Lakehouse Studio State
  const [bqLocationType, setBqLocationType] = useState('MULTI_REGION'); // MULTI_REGION | REGIONAL
  const [bqLocation, setBqLocation] = useState('US');
  const [bqComplianceRegime, setBqComplianceRegime] = useState('standard');
  const [bqStorageBillingModel, setBqStorageBillingModel] = useState('PHYSICAL'); // LOGICAL | PHYSICAL
  const [bqMaxTimeTravelHours, setBqMaxTimeTravelHours] = useState(168); // 48..168
  const [bqDefaultTableExpirationDays, setBqDefaultTableExpirationDays] =
    useState(0); // 0 = never expire
  const [bqDefaultPartitionExpirationDays, setBqDefaultPartitionExpirationDays] =
    useState(90); // 0 = never expire
  const [bqIsCaseInsensitive, setBqIsCaseInsensitive] = useState(false);
  const [bqDefaultCollation, setBqDefaultCollation] = useState(''); // '' | 'und:ci'
  const [bqDefaultRoundingMode, setBqDefaultRoundingMode] = useState(
    'ROUND_HALF_AWAY_FROM_ZERO'
  ); // ROUND_HALF_AWAY_FROM_ZERO | ROUND_HALF_EVEN
  const [bqEncryptionType, setBqEncryptionType] = useState('GOOGLE_MANAGED'); // GOOGLE_MANAGED | CMEK
  const [bqCmekKeyName, setBqCmekKeyName] = useState('');
  const [bqDataClassification, setBqDataClassification] = useState('internal');
  const [bqCustomLabels, setBqCustomLabels] = useState(
    'env=production,domain=analytics'
  );
  const [bqDescription, setBqDescription] = useState(
    'Enterprise BigQuery Analytical Lakehouse'
  );

  const applyBqCompliancePreset = (presetId) => {
    setBqComplianceRegime(presetId);
    if (presetId === 'sec-finra-ledger') {
      // SEC Rule 17a-4 / FINRA Financial Ledger (Banker's Rounding ROUND_HALF_EVEN + Physical Billing + 7-Day Time Travel)
      setBqLocationType('MULTI_REGION');
      setBqLocation('US');
      setBqStorageBillingModel('PHYSICAL');
      setBqMaxTimeTravelHours(168);
      setBqDefaultTableExpirationDays(0);
      setBqDefaultPartitionExpirationDays(2555); // 7 years
      setBqIsCaseInsensitive(false);
      setBqDefaultCollation('');
      setBqDefaultRoundingMode('ROUND_HALF_EVEN');
      setBqDataClassification('restricted');
      setBqDescription(
        'SEC 17a-4 / FINRA Financial Ledger (ROUND_HALF_EVEN Banker Rounding · Physical Billing · 7yr Partition Retention)'
      );
    } else if (presetId === 'gdpr-eu-sovereign') {
      // GDPR EU Sovereign Analytics (EU Multi-Region + 90d Partition Expiration + 48h Time-Travel Minimization)
      setBqLocationType('MULTI_REGION');
      setBqLocation('EU');
      setBqStorageBillingModel('PHYSICAL');
      setBqMaxTimeTravelHours(48);
      setBqDefaultTableExpirationDays(365);
      setBqDefaultPartitionExpirationDays(90);
      setBqIsCaseInsensitive(false);
      setBqDefaultCollation('und:ci');
      setBqDefaultRoundingMode('ROUND_HALF_AWAY_FROM_ZERO');
      setBqDataClassification('restricted');
      setBqDescription(
        'GDPR EU Sovereign Analytics Lakehouse (EU Residency · 90d Right-to-Erasure Partition TTL · 48h Time-Travel)'
      );
    } else if (presetId === 'hipaa-soc2- clinical') {
      // HIPAA / SOC2 Healthcare Vault
      setBqLocationType('REGIONAL');
      setBqLocation('us-central1');
      setBqStorageBillingModel('PHYSICAL');
      setBqMaxTimeTravelHours(168);
      setBqDefaultTableExpirationDays(0);
      setBqDefaultPartitionExpirationDays(365);
      setBqIsCaseInsensitive(false);
      setBqDefaultCollation('');
      setBqDefaultRoundingMode('ROUND_HALF_AWAY_FROM_ZERO');
      setBqDataClassification('restricted');
      setBqDescription(
        'HIPAA / SOC2 BAA Healthcare Analytical Vault (us-central1 · Physical Compressed Billing · 168h Time-Travel)'
      );
    } else if (presetId === 'ai-vector-biglake') {
      // AI Vector & High-Compression BigLake Iceberg Warehouse
      setBqLocationType('REGIONAL');
      setBqLocation('us-central1');
      setBqStorageBillingModel('PHYSICAL');
      setBqMaxTimeTravelHours(72);
      setBqDefaultTableExpirationDays(0);
      setBqDefaultPartitionExpirationDays(180);
      setBqIsCaseInsensitive(true);
      setBqDefaultCollation('und:ci');
      setBqDefaultRoundingMode('ROUND_HALF_AWAY_FROM_ZERO');
      setBqDataClassification('confidential');
      setBqDescription(
        'AI Vector Embeddings & BigLake Iceberg Warehouse (5x Physical Capacitor Compression · 72h Time-Travel)'
      );
    } else {
      // GCP Console Standard
      setBqLocationType('MULTI_REGION');
      setBqLocation('US');
      setBqStorageBillingModel('LOGICAL');
      setBqMaxTimeTravelHours(168);
      setBqDefaultTableExpirationDays(0);
      setBqDefaultPartitionExpirationDays(0);
      setBqIsCaseInsensitive(false);
      setBqDefaultCollation('');
      setBqDefaultRoundingMode('ROUND_HALF_AWAY_FROM_ZERO');
      setBqDataClassification('internal');
      setBqDescription('Standard BigQuery Analytical Dataset');
    }
  };

  // GKE 2026 Autopilot & Standard GPU Cluster Compliance Studio State
  const [gkeComplianceRegime, setGkeComplianceRegime] = useState('custom');
  const [gkeMode, setGkeMode] = useState('AUTOPILOT'); // AUTOPILOT | STANDARD
  const [gkeLocation, setGkeLocation] = useState('us-central1');
  const [gkeReleaseChannel, setGkeReleaseChannel] = useState('REGULAR'); // RAPID | REGULAR | STABLE
  const [gkeNetwork, setGkeNetwork] = useState('default');
  const [gkeEnablePrivateNodes, setGkeEnablePrivateNodes] = useState(true);
  const [gkeEnableWorkloadIdentity, setGkeEnableWorkloadIdentity] = useState(true);
  const [gkeEnableShieldedNodes, setGkeEnableShieldedNodes] = useState(true);
  const [gkeEnableBinaryAuth, setGkeEnableBinaryAuth] = useState(false);
  const [gkeNodeMachineType, setGkeNodeMachineType] = useState('e2-standard-4');
  const [gkeInitialNodeCount, setGkeInitialNodeCount] = useState(2);
  const [gkeSpotNodes, setGkeSpotNodes] = useState(true);
  const [gkeGpuAcceleratorType, setGkeGpuAcceleratorType] = useState('NONE'); // NONE | nvidia-l4 | nvidia-tesla-t4 | nvidia-a100-80gb
  const [gkeGpuAcceleratorCount, setGkeGpuAcceleratorCount] = useState(1);

  const applyGkeCompliancePreset = (presetId) => {
    setGkeComplianceRegime(presetId);
    if (presetId === 'sec-fedramp-gke') {
      // SEC / FedRAMP Zero-Trust Enclave
      setGkeMode('AUTOPILOT');
      setGkeLocation('us-east4');
      setGkeReleaseChannel('STABLE');
      setGkeEnablePrivateNodes(true);
      setGkeEnableWorkloadIdentity(true);
      setGkeEnableShieldedNodes(true);
      setGkeEnableBinaryAuth(true);
      setGkeGpuAcceleratorType('NONE');
    } else if (presetId === 'gdpr-eu-gke') {
      // GDPR EU Sovereign Cluster
      setGkeMode('AUTOPILOT');
      setGkeLocation('europe-west4');
      setGkeReleaseChannel('REGULAR');
      setGkeEnablePrivateNodes(true);
      setGkeEnableWorkloadIdentity(true);
      setGkeEnableShieldedNodes(true);
      setGkeEnableBinaryAuth(true);
      setGkeGpuAcceleratorType('NONE');
    } else if (presetId === 'hipaa-clinical-gke') {
      // HIPAA / BAA Clinical K8s Enclave
      setGkeMode('AUTOPILOT');
      setGkeLocation('us-central1');
      setGkeReleaseChannel('STABLE');
      setGkeEnablePrivateNodes(true);
      setGkeEnableWorkloadIdentity(true);
      setGkeEnableShieldedNodes(true);
      setGkeEnableBinaryAuth(true);
      setGkeGpuAcceleratorType('NONE');
    } else if (presetId === 'ai-gpu-cluster') {
      // AI / Spot GPU Training & Inference Cluster
      setGkeMode('STANDARD');
      setGkeLocation('us-central1');
      setGkeReleaseChannel('RAPID');
      setGkeNodeMachineType('g2-standard-4');
      setGkeInitialNodeCount(1);
      setGkeSpotNodes(true);
      setGkeGpuAcceleratorType('nvidia-l4');
      setGkeGpuAcceleratorCount(1);
      setGkeEnablePrivateNodes(false);
      setGkeEnableWorkloadIdentity(true);
      setGkeEnableShieldedNodes(true);
      setGkeEnableBinaryAuth(false);
    } else {
      // Custom Mode
      setGkeMode('AUTOPILOT');
      setGkeLocation('us-central1');
      setGkeReleaseChannel('REGULAR');
      setGkeEnablePrivateNodes(true);
      setGkeEnableWorkloadIdentity(true);
      setGkeEnableShieldedNodes(true);
      setGkeEnableBinaryAuth(false);
      setGkeGpuAcceleratorType('NONE');
    }
  };

  // Cloud SQL (MySQL & PostgreSQL) + Google Cloud AlloyDB Studio State
  const [sqlComplianceRegime, setSqlComplianceRegime] = useState('custom');
  const [sqlEngineFamily, setSqlEngineFamily] = useState('POSTGRES'); // POSTGRES | MYSQL
  const [sqlArchitecture, setSqlArchitecture] = useState('CLOUD_SQL'); // CLOUD_SQL | ALLOYDB (for POSTGRES)
  const [sqlDatabaseVersion, setSqlDatabaseVersion] = useState('POSTGRES_16');
  const [sqlEdition, setSqlEdition] = useState('ENTERPRISE_PLUS');
  const [sqlTier, setSqlTier] = useState('db-perf-optimized-N-2');
  const [sqlRegion, setSqlRegion] = useState('us-central1');
  const [sqlAvailabilityType, setSqlAvailabilityType] = useState('REGIONAL');
  const [sqlStorageSizeGb, setSqlStorageSizeGb] = useState(100);
  const [sqlNetworkMode, setSqlNetworkMode] = useState('PRIVATE_VPC_ONLY');
  const [sqlSslMode, setSqlSslMode] = useState('ENCRYPTED_ONLY');
  const [sqlPitrDays, setSqlPitrDays] = useState(14);
  const [sqlIamAuth, setSqlIamAuth] = useState(true);
  const [sqlEnableVectorScann, setSqlEnableVectorScann] = useState(true);
  const [sqlEnableColumnarEngine, setSqlEnableColumnarEngine] = useState(true);

  const handleSelectModalSqlEngine = (family) => {
    setSqlEngineFamily(family);
    if (family === 'MYSQL') {
      setSqlArchitecture('CLOUD_SQL');
      setSqlDatabaseVersion('MYSQL_8_4');
      setSqlTier(
        sqlEdition === 'ENTERPRISE_PLUS'
          ? 'db-perf-optimized-N-2'
          : 'db-custom-2-8192'
      );
      if (sqlComplianceRegime === 'ai-vector-alloydb') {
        setSqlComplianceRegime('custom');
      }
    } else {
      setSqlDatabaseVersion('POSTGRES_16');
    }
  };

  const handleSelectModalSqlArchitecture = (arch) => {
    if (arch === 'ALLOYDB' && sqlEngineFamily === 'MYSQL') return;
    setSqlArchitecture(arch);
    if (arch === 'ALLOYDB') {
      setSqlEngineFamily('POSTGRES');
      setSqlDatabaseVersion('POSTGRES_16');
      setSqlAvailabilityType('REGIONAL');
      setSqlNetworkMode('PRIVATE_VPC_ONLY');
      setSqlSslMode('ENCRYPTED_ONLY');
      setSqlTier('alloydb-4vcpu-32gb');
    } else {
      setSqlTier(
        sqlEdition === 'ENTERPRISE_PLUS'
          ? 'db-perf-optimized-N-2'
          : 'db-custom-2-8192'
      );
    }
  };

  const applySqlCompliancePreset = (presetId) => {
    setSqlComplianceRegime(presetId);
    if (presetId === 'pci-sec-ledger') {
      setSqlRegion('us-east4');
      setSqlEdition('ENTERPRISE_PLUS');
      setSqlAvailabilityType('REGIONAL');
      setSqlNetworkMode('PRIVATE_VPC_ONLY');
      setSqlSslMode('TRUSTED_CLIENT_CERTIFICATE_REQUIRED');
      setSqlPitrDays(35);
      setSqlIamAuth(true);
    } else if (presetId === 'gdpr-eu-db') {
      setSqlRegion('europe-west1');
      setSqlAvailabilityType('REGIONAL');
      setSqlNetworkMode('PRIVATE_VPC_ONLY');
      setSqlSslMode('ENCRYPTED_ONLY');
      setSqlPitrDays(14);
      setSqlIamAuth(true);
    } else if (presetId === 'hipaa-clinical-db') {
      setSqlRegion('us-central1');
      setSqlEdition('ENTERPRISE_PLUS');
      setSqlAvailabilityType('REGIONAL');
      setSqlNetworkMode('PRIVATE_VPC_ONLY');
      setSqlSslMode('TRUSTED_CLIENT_CERTIFICATE_REQUIRED');
      setSqlPitrDays(30);
      setSqlIamAuth(true);
    } else if (presetId === 'ai-vector-alloydb') {
      setSqlEngineFamily('POSTGRES');
      setSqlArchitecture('ALLOYDB');
      setSqlDatabaseVersion('POSTGRES_16');
      setSqlTier('alloydb-4vcpu-32gb');
      setSqlRegion('us-central1');
      setSqlAvailabilityType('REGIONAL');
      setSqlNetworkMode('PRIVATE_VPC_ONLY');
      setSqlSslMode('ENCRYPTED_ONLY');
      setSqlPitrDays(14);
      setSqlIamAuth(true);
      setSqlEnableVectorScann(true);
      setSqlEnableColumnarEngine(true);
    } else {
      setSqlAvailabilityType('REGIONAL');
      setSqlNetworkMode('PRIVATE_VPC_ONLY');
      setSqlSslMode('ENCRYPTED_ONLY');
      setSqlPitrDays(7);
      setSqlIamAuth(true);
    }
  };

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [copiedCmd, setCopiedCmd] = useState(false);

  // Universal Runtime Service Account (iam.serviceAccounts.actAs) Discovery
  const [serviceAccounts, setServiceAccounts] = useState([]);
  const [selectedServiceAccount, setSelectedServiceAccount] = useState('');
  const [defaultComputeSaMissing, setDefaultComputeSaMissing] = useState(false);
  const [loadingSa, setLoadingSa] = useState(false);

  // Wave 10: Pre-Provision Dry-Run IAM (`testIamPermissions`), `actAs` & Egress Preflight Simulator
  const [preflightData, setPreflightData] = useState(null);
  const [loadingPreflight, setLoadingPreflight] = useState(false);
  const [grantingActAs, setGrantingActAs] = useState(false);

  const runPreflightSimulation = async (
    overrideType = serviceType,
    overrideSa = selectedServiceAccount
  ) => {
    if (!projectId) return;
    setLoadingPreflight(true);
    try {
      const targetRegion =
        overrideType === 'COMPUTE_VM'
          ? vmRegion
          : overrideType === 'GKE_CLUSTER'
          ? gkeLocation
          : overrideType === 'CLOUD_SQL'
          ? sqlRegion
          : region;
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/provision/preflight`,
        {
          serviceType: overrideType,
          region: targetRegion,
          serviceAccountEmail: overrideSa,
        }
      );
      setPreflightData(res.data);
    } catch (err) {
      setPreflightData({
        ok: false,
        ready: false,
        error:
          err.response?.data?.error ||
          err.message ||
          'Preflight simulation failed',
      });
    } finally {
      setLoadingPreflight(false);
    }
  };

  const handleGrantActAsOnSelectedSa = async (targetSaEmail) => {
    const saToBind = targetSaEmail || selectedServiceAccount;
    if (!projectId || !saToBind) return;
    setGrantingActAs(true);
    try {
      await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/service-accounts/grant-act-as`,
        { serviceAccountEmail: saToBind }
      );
      await runPreflightSimulation(serviceType, saToBind);
    } catch (err) {
      setErrorMsg(
        err.response?.data?.error ||
          `Failed to grant roles/iam.serviceAccountUser on ${saToBind}`
      );
    } finally {
      setGrantingActAs(false);
    }
  };

  const fetchServiceAccounts = async (forceRefresh = false) => {
    if (!projectId) return;
    setLoadingSa(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/service-accounts${
          forceRefresh ? '?refresh=true' : ''
        }`
      );
      const list = res.data?.serviceAccounts || res.data?.accounts || [];
      setServiceAccounts(list);
      setDefaultComputeSaMissing(Boolean(res.data?.defaultComputeSaMissing));
      if (res.data?.recommendedServiceAccount) {
        setSelectedServiceAccount((prev) => {
          if (prev && list.some((sa) => sa.email === prev && !sa.disabled)) {
            return prev;
          }
          return res.data.recommendedServiceAccount;
        });
      } else if (list.length > 0) {
        const firstActive = list.find((sa) => !sa.disabled) || list[0];
        if (firstActive?.email) {
          setSelectedServiceAccount((prev) => prev || firstActive.email);
        }
      }
    } catch {
      // ignore if offline
    } finally {
      setLoadingSa(false);
    }
  };

  const generateDefaultName = (type, proj) => {
    const suffix = Math.floor(1000 + Math.random() * 8999);
    if (type === 'COMPUTE_VM') return `${proj}-vm-${suffix}`;
    if (type === 'GKE_CLUSTER') return `${proj}-gke-${suffix}`;
    if (type === 'CLOUD_SQL') return `${proj}-db-${suffix}`;
    if (type === 'VPC_NETWORK') return `${proj}-vpc-${suffix}`;
    if (type === 'VPC_FIREWALL') return `allow-web-${suffix}`;
    if (type === 'GCS_BUCKET') return `${proj}-bucket-${suffix}`;
    if (type === 'CLOUD_RUN') return `${proj}-srv-${suffix}`;
    return `lakehouse_${suffix}`;
  };

  useEffect(() => {
    if (isOpen) {
      setServiceType(initialServiceType);
      setName(generateDefaultName(initialServiceType, projectId));
      if (initialLocation?.region) {
        setRegion(initialLocation.region);
        setVmRegion(initialLocation.region);
        setGkeLocation(initialLocation.region);
        setSqlRegion(initialLocation.region);
        setBqLocationType('REGIONAL');
        setBqLocation(initialLocation.region);
      }
      if (initialLocation?.zone) {
        setZone(initialLocation.zone);
      } else if (initialLocation?.region) {
        const firstZone =
          GCP_REGION_ZONES[initialLocation.region]?.zones?.[0] ||
          `${initialLocation.region}-a`;
        setZone(firstZone);
      }
      setErrorMsg(null);
      if (projectId) {
        fetchServiceAccounts(false);

        axios
          .get(
            `/api/project/${encodeURIComponent(projectId)}/wave9/supply-chain`
          )
          .then((res) => {
            const imgs = res.data?.images || [];
            setArImages(imgs);
            if (imgs.length > 0) {
              setRunSourceMode('ARTIFACT_REGISTRY');
              const firstTag = imgs[0].tags?.[0] || 'latest';
              setContainerImage(`${imgs[0].uri}:${firstTag}`);
            }
          })
          .catch(() => {});

        axios
          .get(`/api/project/${encodeURIComponent(projectId)}/overview`)
          .then((res) => {
            const resources = res.data?.resources || [];
            const vpcs = resources
              .filter((r) => r.type === 'VPC Network' && r.name)
              .map((r) => r.name);
            setProjectVpcs(vpcs.length > 0 ? vpcs : ['default']);
            const buckets = resources
              .filter((r) => r.type === 'Cloud Storage Bucket' && r.name)
              .map((r) => r.name);
            setProjectBuckets(buckets);
            if (buckets.length > 0) {
              setRunStorageGcsBucket((prev) => prev || buckets[0]);
            }
          })
          .catch(() => {});
      }
    }
  }, [isOpen, initialServiceType, initialLocation, projectId]);

  const handleTabSwitch = (newType) => {
    setServiceType(newType);
    setErrorMsg(null);
    setName(generateDefaultName(newType, projectId));
  };

  const gcloudPreview = useMemo(() => {
    const clean = (name || 'resource').trim().toLowerCase();
    const saFlag = selectedServiceAccount
      ? ` --service-account=${selectedServiceAccount}`
      : '';
    if (serviceType === 'GKE_CLUSTER') {
      const cleanGke = clean.replace(/[^a-z0-9-]/g, '-');
      const secFlags = [
        `--release-channel=${gkeReleaseChannel.toLowerCase()}`,
        `--network=${gkeNetwork}`,
        gkeEnablePrivateNodes ? '--enable-private-nodes' : '',
        gkeEnableWorkloadIdentity
          ? `--workload-pool=${projectId}.svc.id.goog`
          : '',
        gkeEnableBinaryAuth ? '--binauthz-evaluation-mode=PROJECT_SINGLETON_POLICY_ENFORCE' : '',
      ]
        .filter(Boolean)
        .join(' ');
      if (gkeMode === 'AUTOPILOT') {
        return `gcloud container clusters create-auto ${cleanGke} --project=${projectId} --region=${gkeLocation}${saFlag} ${secFlags}`;
      }
      const spotFlag = gkeSpotNodes ? ' --spot' : '';
      const shieldFlag = gkeEnableShieldedNodes
        ? ' --enable-shielded-nodes --shielded-secure-boot --shielded-integrity-monitoring'
        : '';
      const gpuFlag =
        gkeGpuAcceleratorType !== 'NONE'
          ? ` --accelerator=type=${gkeGpuAcceleratorType},count=${gkeGpuAcceleratorCount}`
          : '';
      return `gcloud container clusters create ${cleanGke} --project=${projectId} --location=${gkeLocation} --machine-type=${gkeNodeMachineType} --num-nodes=${gkeInitialNodeCount}${saFlag}${spotFlag}${gpuFlag}${shieldFlag} ${secFlags}`;
    }
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
      return `gcloud compute instances create ${clean} --project=${projectId} --zone=${zone} --machine-type=${machineType}${saFlag} --boot-disk-size=${diskSizeGb}GB --boot-disk-type=${diskType}${spotFlag}${gpuFlag}${netFlag}${tagFlag}${shieldFlag}${delProtFlag}`;
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
      const locFlag =
        gcsLocationType === 'MULTI_REGION'
          ? gcsMultiRegion
          : gcsLocationType === 'DUAL_REGION'
          ? gcsDualPreset === 'CUSTOM'
            ? `${gcsDualRegionA.toUpperCase()}+${gcsDualRegionB.toUpperCase()}`
            : gcsDualPreset
          : region.toUpperCase();
      const flags = [
        `--project=${projectId}`,
        `--location=${locFlag}`,
        gcsAutoclass
          ? `--enable-autoclass --autoclass-terminal-storage-class=${gcsAutoclassTerminal}`
          : `--default-storage-class=${storageClass}`,
        gcsUniformAccess || gcsHierarchicalNamespace
          ? '--uniform-bucket-level-access'
          : '--no-uniform-bucket-level-access',
        gcsPublicAccessPrevention === 'enforced'
          ? '--public-access-prevention'
          : '--no-public-access-prevention',
      ];
      if (gcsLocationType === 'DUAL_REGION' && gcsDualPreset === 'CUSTOM') {
        flags.push(
          `--placement=${gcsDualRegionA.toUpperCase()},${gcsDualRegionB.toUpperCase()}`
        );
      }
      if (
        (gcsLocationType === 'DUAL_REGION' ||
          gcsLocationType === 'MULTI_REGION') &&
        gcsRpo === 'ASYNC_TURBO'
      ) {
        flags.push('--recovery-point-objective=ASYNC_TURBO');
      }
      if (Number(gcsRetentionDays) > 0) {
        flags.push(`--retention-period=${Number(gcsRetentionDays)}d`);
      }
      if (gcsSoftDeleteDays !== 7) {
        flags.push(`--soft-delete-duration=${Number(gcsSoftDeleteDays)}d`);
      }
      if (gcsHierarchicalNamespace) {
        flags.push('--enable-hierarchical-namespace');
      }
      if (gcsCmekKeyName.trim()) {
        flags.push(`--default-encryption-key=${gcsCmekKeyName.trim()}`);
      }
      return `gcloud storage buckets create gs://${clean} ${flags.join(' ')}`;
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
      const vpcFlags = runEnableDirectVpc
        ? ` --network=${runVpcNetwork || 'default'}${
            runVpcSubnetwork ? ` --subnet=${runVpcSubnetwork}` : ''
          } --vpc-egress=${
            runVpcEgress === 'ALL_TRAFFIC'
              ? 'all-traffic'
              : 'private-ranges-only'
          }${
            runVpcTags.trim()
              ? ` --network-tags=${runVpcTags.trim().replace(/\s+/g, '')}`
              : ''
          }`
        : '';
      const volName = (runStorageVolumeName || 'cloudrun-vol-1')
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-');
      const volFlags =
        runStorageVolumeType === 'GCS_BUCKET'
          ? ` --add-volume=name=${volName},type=cloud-storage,bucket=${
              runStorageGcsBucket || `${projectId}-bucket`
            },readonly=${runStorageReadOnly} --add-volume-mount=volume=${volName},mount-path=${
              runStorageMountPath || '/mnt/gcs'
            }`
          : runStorageVolumeType === 'IN_MEMORY'
          ? ` --add-volume=name=${volName},type=in-memory,size-limit=${
              runStorageMemorySizeLimit || '1Gi'
            } --add-volume-mount=volume=${volName},mount-path=${
              runStorageMountPath || '/mnt/ramdisk'
            }`
          : runStorageVolumeType === 'NFS_FILESTORE'
          ? ` --add-volume=name=${volName},type=nfs,location=${
              runStorageNfsServer || '10.0.0.2'
            }:${
              runStorageNfsPath || '/vol1'
            },readonly=${runStorageReadOnly} --add-volume-mount=volume=${volName},mount-path=${
              runStorageMountPath || '/mnt/nfs'
            }`
          : '';
      const cmdPrefix =
        runStorageVolumeType !== 'NONE' || runEnableDirectVpc || runEnableIap
          ? 'gcloud beta run deploy'
          : 'gcloud run deploy';
      const iapFlag = runEnableIap ? ' --iap' : '';
      if (runWorkloadKind === 'JOB') {
        return `gcloud run jobs create ${clean} --project=${projectId} --region=${region}${saFlag} --image=${containerImage} --tasks=${runJobTaskCount} --max-retries=${runJobMaxRetries} --task-timeout=${runJobTimeoutSec}s --cpu=${runCpu} --memory=${runMemory}${gpuFlags}${vpcFlags}${volFlags}${
          runJobExecuteNow ? ' --execute-now' : ''
        }`;
      }
      return `${cmdPrefix} ${clean} --project=${projectId} --region=${region}${saFlag} --image=${containerImage} --port=${runPort} --cpu=${runCpu} --memory=${runMemory}${gpuFlags}${vpcFlags}${volFlags}${iapFlag} --min-instances=${runMinInstances} --max-instances=${runMaxInstances} --concurrency=${runConcurrency} --timeout=${runTimeout}s --ingress=${ingressFlag} --execution-environment=${
        runExecEnv === 'EXECUTION_ENVIRONMENT_GEN2' ? 'gen2' : 'gen1'
      } ${billingFlag} ${
        runAllowUnauth && !runEnableIap
          ? '--allow-unauthenticated'
          : '--no-allow-unauthenticated'
      }`;
    }
    if (serviceType === 'CLOUD_SQL') {
      const cleanSql = clean.replace(/[^a-z0-9-]/g, '-');
      if (sqlArchitecture === 'ALLOYDB' && sqlEngineFamily === 'POSTGRES') {
        const cpuCount = sqlTier === 'alloydb-8vcpu-64gb' ? 8 : sqlTier === 'alloydb-2vcpu-16gb' ? 2 : 4;
        return `gcloud alloydb clusters create ${cleanSql} --region=${sqlRegion} --database-version=${sqlDatabaseVersion} --network=projects/${projectId}/global/networks/default --continuous-backup-recovery-window-days=${sqlPitrDays} --project=${projectId} && gcloud alloydb instances create ${cleanSql}-primary --cluster=${cleanSql} --region=${sqlRegion} --instance-type=PRIMARY --cpu-count=${cpuCount} --availability-type=${sqlAvailabilityType} --ssl-mode=${sqlSslMode} --database-flags=alloydb.iam_authentication=${sqlIamAuth ? 'on' : 'off'},alloydb.enable_pgaudit=on${sqlEnableColumnarEngine ? ',google_columnar_engine.enabled=on' : ''} --project=${projectId}`;
      }
      return `gcloud sql instances create ${cleanSql} --database-version=${sqlDatabaseVersion} --edition=${sqlEdition} --tier=${sqlTier} --region=${sqlRegion} --availability-type=${sqlAvailabilityType} --storage-type=SSD --storage-size=${sqlStorageSizeGb}GB ${sqlNetworkMode === 'PRIVATE_VPC_ONLY' ? `--no-assign-ip --network=projects/${projectId}/global/networks/default` : '--assign-ip'} --ssl-mode=${sqlSslMode} --enable-point-in-time-recovery --retained-backups-count=${sqlPitrDays} --database-flags=${sqlEngineFamily === 'POSTGRES' ? 'cloudsql.iam_authentication' : 'cloudsql_iam_authentication'}=${sqlIamAuth ? 'on' : 'off'} --deletion-protection --project=${projectId}`;
    }
    const ds = clean.replace(/[^a-zA-Z0-9_]/g, '_');
    const bqFlags = [
      `--location=${bqLocation}`,
      '--dataset',
      `--storage_billing_model=${bqStorageBillingModel}`,
      `--max_time_travel_hours=${bqMaxTimeTravelHours}`,
      `--default_rounding_mode=${bqDefaultRoundingMode}`,
      '--label=datacloud:antigravity',
      `--label=compliance_regime:${bqComplianceRegime}`,
    ];
    if (Number(bqDefaultTableExpirationDays) > 0) {
      bqFlags.push(
        `--default_table_expiration=${Number(bqDefaultTableExpirationDays) * 86400}`
      );
    }
    if (Number(bqDefaultPartitionExpirationDays) > 0) {
      bqFlags.push(
        `--default_partition_expiration=${Number(bqDefaultPartitionExpirationDays) * 86400}`
      );
    }
    if (bqIsCaseInsensitive) {
      bqFlags.push('--is_case_insensitive=true');
    }
    if (bqDefaultCollation) {
      bqFlags.push(`--default_collation=${bqDefaultCollation}`);
    }
    if (bqEncryptionType === 'CMEK' && bqCmekKeyName.trim()) {
      bqFlags.push(`--default_kms_key=${bqCmekKeyName.trim()}`);
    }
    return `bq ${bqFlags.join(' ')} mk ${projectId}:${ds}`;
  }, [
    serviceType,
    name,
    projectId,
    sqlArchitecture,
    sqlEngineFamily,
    sqlDatabaseVersion,
    sqlEdition,
    sqlTier,
    sqlRegion,
    sqlAvailabilityType,
    sqlStorageSizeGb,
    sqlNetworkMode,
    sqlSslMode,
    sqlPitrDays,
    sqlIamAuth,
    sqlEnableColumnarEngine,
    gkeMode,
    gkeLocation,
    gkeReleaseChannel,
    gkeNetwork,
    gkeEnablePrivateNodes,
    gkeEnableWorkloadIdentity,
    gkeEnableShieldedNodes,
    gkeEnableBinaryAuth,
    gkeNodeMachineType,
    gkeInitialNodeCount,
    gkeSpotNodes,
    gkeGpuAcceleratorType,
    gkeGpuAcceleratorCount,
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
    gcsLocationType,
    gcsMultiRegion,
    gcsDualPreset,
    gcsDualRegionA,
    gcsDualRegionB,
    gcsRpo,
    gcsAutoclass,
    gcsAutoclassTerminal,
    gcsUniformAccess,
    gcsPublicAccessPrevention,
    gcsRetentionDays,
    gcsSoftDeleteDays,
    gcsHierarchicalNamespace,
    gcsCmekKeyName,
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
    runEnableIap,
    runEnableDirectVpc,
    runVpcNetwork,
    runVpcSubnetwork,
    runVpcEgress,
    runVpcTags,
    runStorageVolumeType,
    runStorageVolumeName,
    runStorageMountPath,
    runStorageGcsBucket,
    runStorageReadOnly,
    runStorageMemorySizeLimit,
    runStorageNfsServer,
    runStorageNfsPath,
    bqLocation,
    bqStorageBillingModel,
    bqMaxTimeTravelHours,
    bqDefaultTableExpirationDays,
    bqDefaultPartitionExpirationDays,
    bqIsCaseInsensitive,
    bqDefaultCollation,
    bqDefaultRoundingMode,
    bqEncryptionType,
    bqCmekKeyName,
    bqComplianceRegime,
    selectedServiceAccount,
  ]);

  const liveCostEstimate = useMemo(() => {
    const baseRates = {
      'e2-micro': 0.0084,
      'e2-small': 0.0168,
      'e2-medium': 0.0335,
      'e2-standard-2': 0.067,
      'e2-standard-4': 0.134,
      'e2-standard-8': 0.268,
      'n2-standard-2': 0.0971,
      'n2-standard-4': 0.1942,
      'n2-standard-8': 0.3885,
      'n2d-standard-4': 0.1685,
      'c3-standard-4': 0.2088,
      'c3-highcpu-8': 0.3456,
      'c4-standard-4': 0.231,
      't2a-standard-2': 0.077,
      't2a-standard-4': 0.154,
      'g2-standard-4': 0.7068,
      'g2-standard-8': 0.853,
      'a2-highgpu-1g': 3.673,
    };

    if (serviceType === 'CLOUD_SQL') {
      const sqlTierRates = {
        'db-f1-micro': 0.015,
        'db-custom-2-8192': 0.138,
        'db-custom-4-16384': 0.276,
        'db-perf-optimized-N-2': 0.278,
        'db-perf-optimized-N-4': 0.556,
        'alloydb-2vcpu-16gb': 0.276,
        'alloydb-4vcpu-32gb': 0.552,
        'alloydb-8vcpu-64gb': 1.104,
      };
      const baseHr = sqlTierRates[sqlTier] || 0.278;
      const haMult = sqlAvailabilityType === 'REGIONAL' ? 2.0 : 1.0;
      const storageHourly = (Number(sqlStorageSizeGb || 100) * 0.17) / 730;
      const hourly = baseHr * haMult + storageHourly;
      return {
        hourly,
        monthly: hourly * 730,
        badge:
          sqlArchitecture === 'ALLOYDB'
            ? `GOOGLE CLOUD ALLOYDB · ${sqlDatabaseVersion} · 99.99% SLA`
            : `CLOUD SQL (${sqlEdition}) · ${sqlDatabaseVersion} · ${sqlAvailabilityType}`,
        detail: `${sqlTier} (${sqlAvailabilityType}) + ${sqlStorageSizeGb} GB SSD + ${sqlPitrDays}d PITR (${sqlNetworkMode})`,
      };
    }

    if (serviceType === 'GKE_CLUSTER') {
      // GKE Free Tier provides $74.40/mo credit covering 1 cluster management fee ($0.10/hr)
      if (gkeMode === 'AUTOPILOT') {
        return {
          hourly: 0,
          monthly: 0,
          badge: 'GKE AUTOPILOT ($0.00 EMPTY CLUSTER · POD-LEVEL BILLING)',
          detail:
            '1st cluster management fee ($74.40/mo) covered by GKE Free Tier · Billed strictly per running Pod vCPU/GiB request',
        };
      }
      const nodeRate = baseRates[gkeNodeMachineType] || 0.134;
      const gpuRate =
        gkeGpuAcceleratorType !== 'NONE' &&
        !gkeNodeMachineType.startsWith('g2-') &&
        !gkeNodeMachineType.startsWith('a2-')
          ? (gkeGpuAcceleratorType === 'nvidia-a100-80gb'
              ? 3.67
              : gkeGpuAcceleratorType === 'nvidia-l4'
              ? 0.56
              : 0.35) * Number(gkeGpuAcceleratorCount || 1)
          : 0;
      const singleNodeHr = (nodeRate + gpuRate) * (gkeSpotNodes ? 0.32 : 1.0);
      const totalHr = singleNodeHr * Number(gkeInitialNodeCount || 1);
      return {
        hourly: totalHr,
        monthly: totalHr * 730,
        badge: gkeSpotNodes
          ? `GKE STANDARD · ${gkeInitialNodeCount}x SPOT NODE(S) (-68% SAVED)`
          : `GKE STANDARD · ${gkeInitialNodeCount}x ON-DEMAND NODE(S)`,
        detail: `${gkeInitialNodeCount}x ${gkeNodeMachineType}${
          gkeGpuAcceleratorType !== 'NONE' ? ` + ${gkeGpuAcceleratorCount}x ${gkeGpuAcceleratorType}` : ''
        } (${gkeSpotNodes ? 'Spot VM Nodes' : 'On-Demand'})`,
      };
    }

    if (serviceType === 'COMPUTE_VM') {
      const baseMachine = baseRates[machineType] || 0.067;
      const extraGpuRate =
        vmGpuType !== 'NONE' &&
        !machineType.startsWith('g2-') &&
        !machineType.startsWith('a2-')
          ? (vmGpuType.includes('l4') ? 0.56 : vmGpuType.includes('v100') ? 2.48 : 0.35) *
            Number(vmGpuCount || 1)
          : 0;
      const computeRaw = baseMachine + extraGpuRate;
      const computeEffective = spotInstance ? computeRaw * 0.32 : computeRaw;
      const diskRatePerGbMonth =
        diskType === 'pd-extreme' || diskType === 'hyperdisk-balanced'
          ? 0.125
          : diskType === 'pd-ssd'
          ? 0.17
          : diskType === 'pd-balanced'
          ? 0.1
          : 0.04;
      const diskHourly = (Number(diskSizeGb || 20) * diskRatePerGbMonth) / 730;
      const hourly = computeEffective + diskHourly;
      return {
        hourly,
        monthly: hourly * 730,
        badge: spotInstance ? 'SPOT VM (-68% SAVED)' : 'ON-DEMAND VM',
        detail: `${machineType} (${spotInstance ? 'Spot' : 'Standard'}) + ${diskSizeGb}GB ${diskType}`,
      };
    }

    if (serviceType === 'CLOUD_RUN') {
      const hasGpu = runGpuAccelerator !== 'NONE';
      const gpuHr =
        runGpuAccelerator === 'nvidia-rtx-pro-6000'
          ? 1.85
          : runGpuAccelerator === 'nvidia-l4'
          ? 0.67
          : 0;
      const cpuHr = Number(runCpu || 1) * 0.0864;
      const memGb = String(runMemory).includes('Mi')
        ? parseFloat(runMemory) / 1024
        : parseFloat(runMemory) || 0.5;
      const memHr = memGb * 0.009;
      const singleInstHr = cpuHr + memHr + gpuHr;
      const minInst = Number(runMinInstances || 0);

      if (minInst === 0 && runBillingMode === 'REQUEST_BASED' && !hasGpu) {
        return {
          hourly: 0,
          monthly: 0,
          activeInstanceHourly: singleInstHr,
          badge: '$0.00 IDLE (SCALE-TO-ZERO)',
          detail: `Billed only per active request (~$${singleInstHr.toFixed(3)}/active-instance-hr)`,
        };
      }
      const effectiveInst = Math.max(minInst, hasGpu ? 1 : minInst);
      const hourly = singleInstHr * effectiveInst;
      return {
        hourly,
        monthly: hourly * 730,
        activeInstanceHourly: singleInstHr,
        badge: hasGpu ? `SERVERLESS GPU (${runGpuAccelerator})` : `${minInst} WARM INSTANCE(S)`,
        detail: `${runCpu} vCPU · ${runMemory} RAM${hasGpu ? ` · ${runGpuAccelerator}` : ''} (${
          runBillingMode === 'REQUEST_BASED' ? 'Request-based' : 'Instance-based'
        })`,
      };
    }

    if (serviceType === 'GCS_BUCKET') {
      const basePerGb = gcsAutoclass
        ? 0.02
        : storageClass === 'STANDARD'
        ? 0.02
        : storageClass === 'NEARLINE'
        ? 0.01
        : storageClass === 'COLDLINE'
        ? 0.004
        : 0.0012;
      const topologyMult =
        gcsLocationType === 'MULTI_REGION'
          ? 1.3
          : gcsLocationType === 'DUAL_REGION'
          ? 1.8
          : 1.0;
      const perGb = +(basePerGb * topologyMult).toFixed(4);
      const badgeLabel =
        Number(gcsRetentionDays) > 0
          ? `WORM LOCK (${gcsRetentionDays}d) · ${gcsLocationType}`
          : gcsAutoclass
          ? `AUTOCLASS → ${gcsAutoclassTerminal}`
          : `${storageClass} · ${gcsLocationType}`;
      return {
        hourly: 0,
        monthly: perGb * 50,
        badge: badgeLabel,
        detail: `$${perGb}/GB-month (${gcsLocationType}${
          gcsRpo === 'ASYNC_TURBO' ? ' + 15m Turbo RPO' : ''
        } · est. $${(perGb * 50).toFixed(2)}/mo for 50 GB)`,
      };
    }

    if (serviceType === 'BIGQUERY_DATASET') {
      // Compare 1 TB Logical Uncompressed ($20/TB-mo) vs Physical Compressed (~5x compression at $40/TB-mo = ~$8/TB-mo effective!)
      const isPhysical = bqStorageBillingModel === 'PHYSICAL';
      const timeTravelFactor =
        bqMaxTimeTravelHours <= 48
          ? 1.04
          : bqMaxTimeTravelHours <= 72
          ? 1.07
          : 1.12;
      // Estimate for 100 GB logical analytical dataset (First 10 GB free every month)
      const logicalMonthly100Gb = 90 * 0.02; // $1.80/mo for 100 GB logical
      const physicalMonthly100Gb = +(
        20 *
        0.04 *
        timeTravelFactor
      ).toFixed(2); // 5:1 Capacitor compression -> 20 GB physical * $0.04 = ~$0.83/mo
      const monthly = isPhysical ? physicalMonthly100Gb : logicalMonthly100Gb;
      return {
        hourly: 0,
        monthly,
        badge: isPhysical
          ? `PHYSICAL COMPRESSED (-54% SAVED · ${bqMaxTimeTravelHours}h TT)`
          : `LOGICAL UNCOMPRESSED (${bqMaxTimeTravelHours}h TT)`,
        detail: isPhysical
          ? `$0.00 empty dataset · Est. $${physicalMonthly100Gb}/mo per 100 GB logical data (5:1 Capacitor compression @ $0.04/physical-GB + ${bqMaxTimeTravelHours}h Time-Travel)`
          : `$0.00 empty dataset · Est. $${logicalMonthly100Gb.toFixed(2)}/mo per 100 GB logical data ($0.02/logical-GB, first 10 GB/mo free)`,
      };
    }

    return {
      hourly: 0,
      monthly: 0,
      badge: 'FREE CONTROL PLANE',
      detail: 'No fixed hourly idle charge for VPCs or Firewall rules',
    };
  }, [
    serviceType,
    sqlArchitecture,
    sqlEdition,
    sqlDatabaseVersion,
    sqlTier,
    sqlAvailabilityType,
    sqlStorageSizeGb,
    sqlPitrDays,
    sqlNetworkMode,
    gkeMode,
    gkeNodeMachineType,
    gkeInitialNodeCount,
    gkeSpotNodes,
    gkeGpuAcceleratorType,
    gkeGpuAcceleratorCount,
    machineType,
    spotInstance,
    vmGpuType,
    vmGpuCount,
    diskSizeGb,
    diskType,
    runCpu,
    runMemory,
    runMinInstances,
    runBillingMode,
    runGpuAccelerator,
    storageClass,
    gcsLocationType,
    gcsRpo,
    gcsAutoclass,
    gcsAutoclassTerminal,
    gcsRetentionDays,
    bqStorageBillingModel,
    bqMaxTimeTravelHours,
  ]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    setErrorMsg(null);

    const hasGpu = runGpuAccelerator !== 'NONE';

    try {
      if (serviceType === 'CLOUD_RUN' && runSourceMode === 'GITHUB_REPO') {
        const res = await axios.post(
          `/api/project/${encodeURIComponent(projectId)}/cloud-build/trigger-github`,
          {
            repoUrl: runGhRepoUrl.trim(),
            branch: runGhBranch.trim() || 'main',
            contextDir: runGhContextDir.trim() || '.',
            buildMethod: runGhBuildMethod,
            arLocation: region,
            arRepository: runGhArRepo.trim() || 'cloudpulse-containers',
            imageName: name.trim(),
            imageTag: 'latest',
            deployTarget: 'CLOUD_RUN',
            cloudRunService: name.trim(),
            cloudRunRegion: region,
            cloudRunPort: Number(runPort || 8080),
            cloudRunAllowUnauth: runAllowUnauth,
            serviceAccount: selectedServiceAccount,
          }
        );
        onProvisionSuccess(res.data, serviceType);
        onClose();
        return;
      }

      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/provision`,
        {
          serviceType,
          name: name.trim(),
          region:
            serviceType === 'COMPUTE_VM'
              ? vmRegion
              : serviceType === 'GKE_CLUSTER'
              ? gkeLocation
              : serviceType === 'CLOUD_SQL'
              ? sqlRegion
              : region,
          zone,
          config: {
            serviceAccount: selectedServiceAccount,
            sqlArchitecture,
            sqlEngineFamily,
            databaseVersion: sqlDatabaseVersion,
            edition: sqlEdition,
            tier: sqlTier,
            availabilityType: sqlAvailabilityType,
            storageSizeGb: Number(sqlStorageSizeGb || 100),
            networkMode: sqlNetworkMode,
            sslMode: sqlSslMode,
            pitrDays: Number(sqlPitrDays || 14),
            iamAuth: sqlIamAuth,
            enablePgAudit: true,
            enableVectorScann: sqlEnableVectorScann,
            enableColumnarEngine: sqlEnableColumnarEngine,
            gkeMode,
            gkeLocation,
            releaseChannel: gkeReleaseChannel,
            enablePrivateNodes: gkeEnablePrivateNodes,
            enableWorkloadIdentity: gkeEnableWorkloadIdentity,
            enableShieldedNodes: gkeEnableShieldedNodes,
            enableBinaryAuth: gkeEnableBinaryAuth,
            nodeMachineType: gkeNodeMachineType,
            initialNodeCount: Number(gkeInitialNodeCount || 1),
            spotNodes: gkeSpotNodes,
            gpuAcceleratorType: gkeGpuAcceleratorType,
            gpuAcceleratorCount: Number(gkeGpuAcceleratorCount || 1),
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
            network:
              serviceType === 'GKE_CLUSTER' ? gkeNetwork : firewallNetwork,
            action: firewallAction,
            direction: firewallDirection,
            priority: Number(firewallPriority),
            protocol: firewallProtocol,
            ports: firewallPorts,
            sourceRanges: firewallSourceRanges,
            destinationRanges: firewallSourceRanges,
            targetTags: firewallTargetTags,
            enableLogging: firewallEnableLogging,
            disabled: firewallDisabled,
            description:
              serviceType === 'BIGQUERY_DATASET'
                ? bqDescription
                : firewallDescription,
            storageClass,
            locationType: gcsLocationType,
            multiRegion: gcsMultiRegion,
            dualRegionPreset: gcsDualPreset,
            dualRegionA: gcsDualRegionA,
            dualRegionB: gcsDualRegionB,
            rpo: gcsRpo,
            autoclassEnabled: gcsAutoclass,
            autoclassTerminalClass: gcsAutoclassTerminal,
            publicAccessPrevention: gcsPublicAccessPrevention,
            uniformBucketLevelAccess: gcsUniformAccess,
            versioningEnabled: gcsVersioning,
            maxNumVersions: Number(gcsMaxNumVersions || 0),
            softDeleteRetentionDays: gcsSoftDeleteEnabled
              ? Number(gcsSoftDeleteDays || 7)
              : 0,
            retentionPeriodDays: gcsRetentionDays,
            retentionPeriodSeconds: gcsRetentionSeconds,
            hierarchicalNamespaceEnabled: gcsHierarchicalNamespace,
            kmsKeyName:
              serviceType === 'BIGQUERY_DATASET'
                ? bqEncryptionType === 'CMEK'
                  ? bqCmekKeyName.trim()
                  : ''
                : gcsEncryptionType === 'CMEK'
                ? gcsCmekKeyName.trim()
                : '',
            enableSmartLifecycle: gcsEnableSmartLifecycle,
            nearlineAfterDays: Number(gcsNearlineDays || 0),
            coldlineAfterDays: Number(gcsColdlineDays || 0),
            archiveAfterDays: Number(gcsArchiveDays || 0),
            deleteAfterDays: Number(gcsDeleteAfterDays || 0),
            purgeNoncurrentDays: Number(gcsPurgeNoncurrentDays || 0),
            abortIncompleteMultipartDays: Number(gcsAbortMultipartDays || 0),
            requesterPays: gcsRequesterPays,
            enableCors: gcsEnableCors,
            customLabels:
              serviceType === 'BIGQUERY_DATASET'
                ? bqCustomLabels
                : gcsCustomLabels,
            complianceRegime:
              serviceType === 'BIGQUERY_DATASET'
                ? bqComplianceRegime
                : serviceType === 'GKE_CLUSTER'
                ? gkeComplianceRegime
                : gcsComplianceRegime,
            dataClassification:
              serviceType === 'BIGQUERY_DATASET'
                ? bqDataClassification
                : gcsDataClassification,
            containerImage,
            cloudRunWorkloadKind: runWorkloadKind,
            jobTaskCount: Number(runJobTaskCount || 1),
            jobMaxRetries: Number(runJobMaxRetries ?? 3),
            jobTimeoutSec: Number(runJobTimeoutSec || 3600),
            jobExecuteNow: Boolean(runJobExecuteNow),
            jobAttachScheduler: Boolean(runJobAttachScheduler),
            jobSchedule: runJobSchedule,
            jobCommandScript: runJobCommandScript,
            containerPort: runPort,
            cpu: runCpu,
            memory: runMemory,
            minInstances: runMinInstances,
            maxInstances: runMaxInstances,
            concurrency: runConcurrency,
            timeoutSeconds: runTimeout,
            ingress: runIngress,
            allowUnauthenticated: runEnableIap ? false : runAllowUnauth,
            iapEnabled: runEnableIap,
            billingMode: hasGpu ? 'INSTANCE_BASED' : runBillingMode,
            cpuIdle: runBillingMode === 'REQUEST_BASED' && !hasGpu,
            gpuCount: hasGpu ? 1 : 0,
            gpuType: hasGpu ? runGpuAccelerator : 'nvidia-l4',
            gpuZonalRedundancy: runGpuZonalRedundancy,
            startupCpuBoost: runStartupBoost,
            executionEnvironment: runExecEnv,
            enableDirectVpc: runEnableDirectVpc,
            vpcNetwork: runVpcNetwork,
            vpcSubnetwork: runVpcSubnetwork,
            vpcEgress: runVpcEgress,
            vpcNetworkTags: runVpcTags,
            storageVolumeType: runStorageVolumeType,
            storageVolumeName: runStorageVolumeName,
            storageMountPath: runStorageMountPath,
            storageGcsBucket: runStorageGcsBucket,
            storageReadOnly: runStorageReadOnly,
            storageMemorySizeLimit: runStorageMemorySizeLimit,
            storageNfsServer: runStorageNfsServer,
            storageNfsPath: runStorageNfsPath,
            envVars: runEnvVars,
            location: bqLocation,
            storageBillingModel: bqStorageBillingModel,
            maxTimeTravelHours: Number(bqMaxTimeTravelHours || 168),
            defaultTableExpirationDays: Number(
              bqDefaultTableExpirationDays || 0
            ),
            defaultPartitionExpirationDays: Number(
              bqDefaultPartitionExpirationDays || 0
            ),
            isCaseInsensitive: bqIsCaseInsensitive,
            defaultCollation: bqDefaultCollation,
            defaultRoundingMode: bqDefaultRoundingMode,
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
    <div
      className="fixed inset-0 z-[100] bg-zinc-950/60 backdrop-blur-sm flex items-start justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div className="bg-white dark:bg-[#202124] rounded-[14px] border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-[1220px] max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden my-auto">
        <div className="shrink-0 flex items-start justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 px-6 pt-4 pb-3.5 bg-white dark:bg-[#202124]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <span>Provision GCP Resource</span>
                <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded">
                  {projectId}
                </span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Configure and create resources in your active Google Cloud project.
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close Provisioning Studio"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Service Type Selector Grid (8 Services: 4x2 on tablet/laptop, 8x1 on wide desktop) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2">
            {SERVICE_TABS.map((t) => {
              const Icon = t.icon;
              const active = serviceType === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTabSwitch(t.id)}
                  title={t.desc}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer min-w-0 ${
                    active
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'bg-zinc-50/70 dark:bg-[#131314] border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                  }`}
                >
                  <Icon className="w-4 h-4 mb-1" />
                  <div className="text-xs font-bold truncate whitespace-nowrap">{t.label}</div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate whitespace-nowrap">
                    {t.desc}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Google Cloud "Always Free" ($0.00/mo) Guardrail Preset Bar (https://docs.cloud.google.com/free/docs/free-cloud-features#free-tier-usage-limits) */}
          <div className="p-3 rounded-xl bg-emerald-500/[0.07] border border-emerald-500/35 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="space-y-0.5 text-xs">
              <div className="font-mono font-extrabold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 flex-wrap">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  Google Cloud &ldquo;Always Free&rdquo; Tier Guardrail (`$0.00/mo` Spec)
                </span>
                <a
                  href="https://docs.cloud.google.com/free/docs/free-cloud-features#free-tier-usage-limits"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] underline text-blue-600 dark:text-blue-400"
                >
                  Official Free Tier Limits ↗
                </a>
              </div>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-300">
                {serviceType === 'COMPUTE_VM' &&
                  'Always Free VM Rule: 1 non-preemptible e2-micro in us-west1, us-central1, or us-east1 + up to 30 GB Standard Persistent Disk (pd-standard, NOT pd-balanced) + 1 GB North America egress/mo.'}
                {serviceType === 'CLOUD_RUN' &&
                  'Always Free Cloud Run Rule: Request-based billing (--cpu-throttling) with minInstances=0, no GPU → 2M requests + 180,000 vCPU-sec + 360,000 GB-sec FREE every month.'}
                {serviceType === 'GCS_BUCKET' &&
                  'Always Free Cloud Storage Rule: 5 GB-months Regional STANDARD storage in us-east1, us-west1, or us-central1 ONLY (Multi-region US/EU is NOT free) + 5k Class A & 50k Class B ops/mo.'}
                {serviceType === 'BIGQUERY_DATASET' &&
                  'Always Free BigQuery Rule: 1 TiB SQL querying/mo + 10 GiB storage/mo FREE across all datasets.'}
                {serviceType === 'GKE_CLUSTER' &&
                  'GKE Free Tier Trap: 1 Autopilot or Zonal Standard cluster waives the $74.40/mo cluster management fee, Ready-to-run, but worker nodes, pods, disks & LoadBalancers STILL BILL compute/network!'}
                {serviceType === 'CLOUD_SQL' &&
                  'Cloud SQL / AlloyDB has NO Always-Free tier, but Google Cloud offers a 30-Day Free Trial instance for Cloud SQL and AlloyDB (8 vCPU + 1 TB for 30 days).'}
                {(serviceType === 'VPC_NETWORK' ||
                  serviceType === 'VPC_FIREWALL') &&
                  'VPC Networks and Firewall Rules have $0.00 control-plane cost (only Cloud NAT, VPN, or cross-region/internet egress incur charges).'}
              </p>
            </div>

            {['COMPUTE_VM', 'CLOUD_RUN', 'GCS_BUCKET', 'BIGQUERY_DATASET', 'GKE_CLUSTER'].includes(
              serviceType
            ) && (
              <button
                type="button"
                onClick={() => {
                  if (serviceType === 'COMPUTE_VM') {
                    setVmRegion('us-central1');
                    setZone('us-central1-a');
                    setMachineFamily('E2');
                    setMachineType('e2-micro');
                    setDiskType('pd-standard');
                    setDiskSizeGb(30);
                    setSpotInstance(false);
                    setVmGpuType('NONE');
                  } else if (serviceType === 'CLOUD_RUN') {
                    setRegion('us-central1');
                    setRunBillingMode('REQUEST_BASED');
                    setRunMinInstances(0);
                    setRunMaxInstances(3);
                    setRunCpu('1');
                    setRunMemory('512Mi');
                    setRunGpuAccelerator('NONE');
                  } else if (serviceType === 'GCS_BUCKET') {
                    setGcsComplianceRegime('custom');
                    setGcsLocationType('REGIONAL');
                    setRegion('us-central1');
                    setStorageClass('STANDARD');
                    setGcsAutoclass(false);
                    setGcsHierarchicalNamespace(false);
                  } else if (serviceType === 'BIGQUERY_DATASET') {
                    applyBqCompliancePreset('standard');
                  } else if (serviceType === 'GKE_CLUSTER') {
                    setGkeComplianceRegime('custom');
                    setGkeMode('AUTOPILOT');
                    setGkeLocation('us-central1');
                    setGkeGpuAcceleratorType('NONE');
                  }
                }}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-mono font-extrabold shadow-sm cursor-pointer transition-colors"
              >
                {serviceType === 'COMPUTE_VM'
                  ? 'Lock Always Free VM (e2-micro + 30GB pd-standard)'
                  : serviceType === 'CLOUD_RUN'
                  ? 'Lock Always Free Cloud Run ($0 Idle · 2M req/mo)'
                  : serviceType === 'GCS_BUCKET'
                  ? 'Lock Always Free Bucket (us-central1 STANDARD)'
                  : serviceType === 'GKE_CLUSTER'
                  ? 'Use Free Cluster Mgmt Fee (Autopilot)'
                  : 'Lock Always Free BigQuery Spec'}
              </button>
            )}
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
                className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] py-[8px] text-xs font-mono shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-zinc-950 dark:text-zinc-100 transition-all"
              />
            </div>

            {serviceType === 'COMPUTE_VM' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                    GCP Region (40 Global Ready)
                  </label>
                  <select
                    value={vmRegion}
                    onChange={(e) => handleSelectVmRegion(e.target.value)}
                    className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2 py-[8px] text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100"
                  >
                    {!GCP_REGION_ZONES[vmRegion] && (
                      <option value={vmRegion}>
                        {vmRegion} (Map Drop-Pod Target)
                      </option>
                    )}
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
                    className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2 py-[8px] text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100"
                  >
                    {(
                      GCP_REGION_ZONES[vmRegion]?.zones || [
                        `${vmRegion}-a`,
                        `${vmRegion}-b`,
                        `${vmRegion}-c`,
                      ]
                    ).map((z) => (
                      <option key={z} value={z}>
                        {z}
                      </option>
                    ))}
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
                  className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] py-[8px] text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100"
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
                  className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] py-[8px] text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100"
                />
              </div>
            )}

            {serviceType === 'CLOUD_RUN' && (
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                  GCP Region (40 Global Ready)
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] py-[8px] text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100"
                >
                  {!GCP_REGION_ZONES[region] && (
                    <option value={region}>
                      {region} (Map Drop-Pod Target)
                    </option>
                  )}
                  {Object.entries(GCP_REGION_ZONES).map(([regKey, info]) => (
                    <option key={regKey} value={regKey}>
                      {info.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {serviceType === 'GKE_CLUSTER' && (
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                  Active GKE Control Plane Posture
                </label>
                <div className="w-full bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] py-[8px] text-xs font-mono text-zinc-800 dark:text-zinc-200 flex items-center justify-between gap-2">
                  <span className="truncate font-bold text-blue-600 dark:text-blue-400">
                    {gkeMode} · {gkeLocation} ({gkeReleaseChannel})
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                    {gkeEnableWorkloadIdentity ? 'WI + ' : ''}
                    {gkeEnablePrivateNodes ? 'PRIVATE' : 'PUBLIC'}
                  </span>
                </div>
              </div>
            )}

            {serviceType === 'GCS_BUCKET' && (
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5 flex items-center justify-between">
                  <span>Location Topology & Geo-Redundancy</span>
                  {gcsComplianceRegime !== 'custom' && (
                    <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400">
                      Enforced by {gcsComplianceRegime.toUpperCase()}
                    </span>
                  )}
                </label>
                <select
                  value={gcsLocationType}
                  disabled={
                    gcsComplianceRegime === 'sec-17a4-worm' ||
                    gcsComplianceRegime === 'gdpr-eu-sovereign'
                  }
                  onChange={(e) => setGcsLocationType(e.target.value)}
                  title={
                    gcsComplianceRegime === 'sec-17a4-worm'
                      ? 'Locked to MULTI_REGION (US) by SEC Rule 17a-4 WORM Compliance'
                      : gcsComplianceRegime === 'gdpr-eu-sovereign'
                      ? 'Locked to DUAL_REGION (EUR4) by GDPR EU Data Sovereignty'
                      : 'Select Cloud Storage location topology'
                  }
                  className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] py-[8px] text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option
                    value="REGIONAL"
                    disabled={
                      gcsComplianceRegime === 'sec-17a4-worm' ||
                      gcsComplianceRegime === 'gdpr-eu-sovereign'
                    }
                  >
                    REGIONAL — Single Region Low Latency (99.99% SLA)
                  </option>
                  <option
                    value="DUAL_REGION"
                    disabled={
                      gcsComplianceRegime === 'sec-17a4-worm' ||
                      gcsComplianceRegime === 'ai-lakehouse-hns'
                    }
                  >
                    DUAL_REGION — 2-Region Sovereign Pair + 15m RPO (99.999% SLA)
                  </option>
                  <option
                    value="MULTI_REGION"
                    disabled={
                      gcsComplianceRegime === 'gdpr-eu-sovereign' ||
                      gcsComplianceRegime === 'ai-lakehouse-hns'
                    }
                  >
                    MULTI_REGION — Continental Geo-Redundant (US / EU / ASIA)
                  </option>
                </select>
              </div>
            )}

            {serviceType === 'BIGQUERY_DATASET' && (
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5 flex items-center justify-between">
                  <span>Active Compliance & Residency Guardrail</span>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                    --location={bqLocation} · {bqStorageBillingModel}
                  </span>
                </label>
                <div className="w-full bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] py-[8px] text-xs font-mono text-zinc-800 dark:text-zinc-200 flex items-center justify-between">
                  <span>
                    {bqComplianceRegime === 'standard'
                      ? 'Custom / GCP Console Standard (All Options Unlocked)'
                      : `Enforcing ${bqComplianceRegime.toUpperCase()} Guardrails`}
                  </span>
                  {bqComplianceRegime !== 'standard' && (
                    <button
                      type="button"
                      onClick={() => applyBqCompliancePreset('standard')}
                      title="Switch back to Custom / GCP Console Standard to unlock all controls"
                      className="text-[10px] font-mono text-blue-500 hover:underline cursor-pointer"
                    >
                      Unlock Custom
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Universal Runtime Service Account (iam.serviceAccounts.actAs) Selector */}
          {['CLOUD_RUN', 'COMPUTE_VM', 'GKE_CLUSTER'].includes(serviceType) && (
            <div className="p-3 rounded-xl border border-blue-500/30 bg-blue-500/5 dark:bg-blue-950/20 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Runtime Service Account (iam.serviceAccounts.actAs)
                  </span>
                  {defaultComputeSaMissing && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      Default Compute SA Deleted · Auto-Bound Custom SA
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      runPreflightSimulation(serviceType, selectedServiceAccount)
                    }
                    disabled={loadingPreflight}
                    title="Run live Google Cloud testIamPermissions + Service Account actAs + Cross-Region Egress Preflight before deploying"
                    className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 px-2.5 py-1 rounded border border-blue-500/30 bg-blue-500/5 cursor-pointer"
                  >
                    {loadingPreflight
                      ? 'Simulating IAM & Egress...'
                      : 'Dry-Run IAM & Egress Preflight'}
                  </button>
                  <button
                    type="button"
                    onClick={() => fetchServiceAccounts(true)}
                    disabled={loadingSa}
                    className="text-[11px] font-mono text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314] cursor-pointer"
                  >
                    {loadingSa ? 'Syncing IAM...' : '↻ Refresh SAs'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                <div className="sm:col-span-2">
                  <select
                    value={selectedServiceAccount}
                    onMouseDown={() => {
                      if (serviceAccounts.length === 0 && !loadingSa) {
                        fetchServiceAccounts(true);
                      }
                    }}
                    onFocus={() => {
                      if (serviceAccounts.length === 0 && !loadingSa) {
                        fetchServiceAccounts(true);
                      }
                    }}
                    onChange={(e) => {
                      const nextSa = e.target.value;
                      setSelectedServiceAccount(nextSa);
                      if (preflightData) {
                        runPreflightSimulation(serviceType, nextSa);
                      }
                    }}
                    className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-3 py-2 text-xs font-mono text-zinc-950 dark:text-zinc-100 shadow-sm cursor-pointer"
                  >
                    {serviceAccounts.filter((sa) => !sa.disabled).length === 0 && (
                      <option value="">
                        {loadingSa
                          ? `Loading Service Accounts from ${projectId}...`
                          : `Select Available Service Account (${projectId})`}
                      </option>
                    )}
                    {serviceAccounts
                      .filter((sa) => !sa.disabled)
                      .map((sa) => (
                        <option key={sa.email} value={sa.email}>
                          {sa.isCustom ? '★ [CUSTOM SA] ' : '[DEFAULT SA] '}
                          {sa.email}
                          {sa.displayName ? ` — ${sa.displayName}` : ''}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
                  {selectedServiceAccount ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      ✓ Explicit SA attached (prevents Compute SA 403)
                    </span>
                  ) : (
                    <span>Select an existing project Service Account</span>
                  )}
                </div>
              </div>

              {preflightData && Array.isArray(preflightData.checks) && (
                <div className="mt-2 p-2.5 rounded-lg bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      Live Pre-Provision Simulation (`projects.testIamPermissions` + `actAs` + Egress)
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        preflightData.ready
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {preflightData.ready
                        ? 'ALL CRITICAL CHECKS PASSED'
                        : 'ACTION NEEDED BEFORE DEPLOY'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                    {preflightData.checks.map((chk) => (
                      <div
                        key={chk.id}
                        className={`p-2 rounded border text-[10.5px] font-mono flex items-start justify-between gap-2 ${
                          chk.passed
                            ? 'bg-emerald-500/5 border-emerald-500/25 text-zinc-800 dark:text-zinc-200'
                            : chk.isAdvisory
                            ? 'bg-amber-500/5 border-amber-500/25 text-amber-800 dark:text-amber-300'
                            : 'bg-red-500/5 border-red-500/30 text-red-800 dark:text-red-300'
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="font-bold truncate">
                            {chk.passed ? '✓ ' : chk.isAdvisory ? '' : '✗ '}
                            {chk.label}
                          </div>
                          <div className="text-[10px] opacity-85 leading-snug">
                            {chk.detail}
                          </div>
                        </div>
                        {chk.canAutoGrantActAs && (
                          <button
                            type="button"
                            disabled={grantingActAs}
                            onClick={() =>
                              handleGrantActAsOnSelectedSa(
                                chk.serviceAccountEmail
                              )
                            }
                            className="shrink-0 px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 text-[10px] font-extrabold cursor-pointer"
                          >
                            {grantingActAs
                              ? 'Granting...'
                              : '1-Click Grant actAs'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

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
                  className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] py-[8px] text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100"
                >
                  <option value={1460}>1460 bytes (Standard GCP Default)</option>
                  <option value={1500}>1500 bytes (Standard Ethernet)</option>
                  <option value={8896}>8896 bytes (Jumbo Frames AI/HPC)</option>
                </select>
              </div>
            </div>
          )}

          {serviceType === 'VPC_FIREWALL' && (
            <div className="space-y-3 border-t border-zinc-200 dark:border-zinc-800 pt-3">
              {/* Row 1: Action (ALLOW vs DENY), Direction (INGRESS vs EGRESS), Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                    Action on Match
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFirewallAction('ALLOW')}
                      className={`py-2 px-2.5 rounded-lg border text-xs font-mono font-bold transition-colors cursor-pointer ${
                        firewallAction === 'ALLOW'
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'
                      }`}
                    >
                      ✓ ALLOW
                    </button>
                    <button
                      type="button"
                      onClick={() => setFirewallAction('DENY')}
                      className={`py-2 px-2.5 rounded-lg border text-xs font-mono font-bold transition-colors cursor-pointer ${
                        firewallAction === 'DENY'
                          ? 'bg-red-500/15 border-red-500 text-red-600 dark:text-red-400'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'
                      }`}
                    >
                      ✕ DENY
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                    Traffic Direction
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFirewallDirection('INGRESS')}
                      className={`py-2 px-2.5 rounded-lg border text-xs font-mono font-bold transition-colors cursor-pointer ${
                        firewallDirection === 'INGRESS'
                          ? 'bg-blue-500/15 border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'
                      }`}
                    >
                      ↙ INGRESS
                    </button>
                    <button
                      type="button"
                      onClick={() => setFirewallDirection('EGRESS')}
                      className={`py-2 px-2.5 rounded-lg border text-xs font-mono font-bold transition-colors cursor-pointer ${
                        firewallDirection === 'EGRESS'
                          ? 'bg-blue-500/15 border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'
                      }`}
                    >
                      ↗ EGRESS
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                    Rule Priority (0 – 65535)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={65535}
                    value={firewallPriority}
                    onChange={(e) => setFirewallPriority(Number(e.target.value))}
                    className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] py-[8px] text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Row 2: Protocol, Ports, Source/Destination CIDR */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                    IP Protocol
                  </label>
                  <select
                    value={firewallProtocol}
                    onChange={(e) => setFirewallProtocol(e.target.value)}
                    className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] py-[8px] text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100"
                  >
                    <option value="tcp">tcp</option>
                    <option value="udp">udp</option>
                    <option value="icmp">icmp (Ping)</option>
                    <option value="all">all (All Protocols)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                    {firewallAction === 'DENY' ? 'Blocked Ports' : 'Allowed Ports'}
                  </label>
                  <input
                    type="text"
                    disabled={firewallProtocol === 'icmp' || firewallProtocol === 'all'}
                    value={firewallPorts}
                    onChange={(e) => setFirewallPorts(e.target.value)}
                    placeholder="22,80,443 or 8000-9000"
                    className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] py-[8px] text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100 disabled:opacity-40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                    {firewallDirection === 'EGRESS'
                      ? 'Destination IPv4 CIDR'
                      : 'Source IPv4 CIDR'}
                  </label>
                  <input
                    type="text"
                    value={firewallSourceRanges}
                    onChange={(e) => setFirewallSourceRanges(e.target.value)}
                    placeholder="0.0.0.0/0"
                    className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] py-[8px] text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* 1-Tap Zero-Trust CIDR Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-mono text-zinc-400">
                  CIDR Presets:
                </span>
                {[
                  { label: 'IAP Zero-Trust (35.235.240.0/20)', cidr: '35.235.240.0/20' },
                  { label: 'GCLB Health Checks', cidr: '130.211.0.0/22, 35.191.0.0/16' },
                  { label: 'VPC Internal (10.128.0.0/9)', cidr: '10.128.0.0/9' },
                  { label: 'Any Public IPv4 (0.0.0.0/0)', cidr: '0.0.0.0/0' },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setFirewallSourceRanges(preset.cidr)}
                    className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 hover:bg-blue-500/15 text-[10px] font-mono text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Row 3: Target Network Tags, Description, and Firewall Logging */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                    Target Network Tags (Optional — blank = all instances)
                  </label>
                  <input
                    type="text"
                    value={firewallTargetTags}
                    onChange={(e) => setFirewallTargetTags(e.target.value)}
                    placeholder="web-server, https-server"
                    className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] py-[8px] text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                    Rule Description & Audit Options
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={firewallDescription}
                      onChange={(e) => setFirewallDescription(e.target.value)}
                      placeholder="Zero-trust firewall rule..."
                      className="flex-1 bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] py-[8px] text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100"
                    />
                    <label className="inline-flex items-center gap-1.5 text-[11px] font-mono text-zinc-600 dark:text-zinc-300 shrink-0 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={firewallEnableLogging}
                        onChange={(e) => setFirewallEnableLogging(e.target.checked)}
                      />
                      <span>Logs</span>
                    </label>
                  </div>
                </div>
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
                            : 'bg-zinc-50 dark:bg-[#131314] border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
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
                    className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-[8px] text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100"
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
                    className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-[8px] text-xs shadow-sm text-zinc-950 dark:text-zinc-100"
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
                    className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-[8px] text-xs font-mono text-zinc-950 dark:text-zinc-100"
                  >
                    <option value="pd-standard">
                      pd-standard (Standard HDD — Included in 30GB Always Free Tier)
                    </option>
                    <option value="pd-balanced">
                      pd-balanced (SSD Balanced — Billed $/GB)
                    </option>
                    <option value="pd-ssd">
                      pd-ssd (Extreme Low-Latency SSD — Billed $/GB)
                    </option>
                    <option value="hyperdisk-balanced">
                      hyperdisk-balanced (2026 Gen-4/5 — Billed $/GB)
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
                    className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-[8px] text-xs font-mono text-zinc-950 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                    Attach Dedicated GPU
                  </label>
                  <select
                    value={vmGpuType}
                    onChange={(e) => setVmGpuType(e.target.value)}
                    className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2 py-[8px] text-xs font-mono text-zinc-950 dark:text-zinc-100"
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
                      ? 'bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-400 font-bold'
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
                    ? 'Deletion Protection ON'
                    : 'Deletion Protection OFF'}
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
                  className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-3 py-1.5 text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100"
                />
              </div>
            </div>
          )}

          {serviceType === 'GCS_BUCKET' && (() => {
            const isGcsCustom = gcsComplianceRegime === 'custom';
            const isGcsSec = gcsComplianceRegime === 'sec-17a4-worm';
            const isGcsGdpr = gcsComplianceRegime === 'gdpr-eu-sovereign';
            const isGcsHipaa = gcsComplianceRegime === 'hipaa-soc2-vault';
            const isGcsAiHns = gcsComplianceRegime === 'ai-lakehouse-hns';

            // Enforced constraints when a non-custom compliance blueprint is chosen:
            const lockGcsPapAndUniform = !isGcsCustom; // All regulatory & HNS blueprints enforce PAP + Uniform IAM
            const lockGcsWorm = isGcsSec; // SEC 17a-4 locks WORM retention ON (>=1 yr)
            const minGcsSoftDeleteDays =
              isGcsSec || isGcsHipaa ? 30 : isGcsGdpr ? 14 : 7;

            return (
              <div className="space-y-4 border-t border-zinc-200 dark:border-zinc-800 pt-3">
                {/* 1-Tap Regulatory & Compliance Blueprints */}
                <div className="p-3 rounded-[10px] border border-emerald-500/30 bg-emerald-500/5 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      1-Tap Cloud Storage Regulatory Blueprints (Strict Guardrail Enforcement)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                      {isGcsCustom
                        ? 'Custom Mode: All Options Unlocked'
                        : `Enforcing ${gcsComplianceRegime.toUpperCase()} · ${gcsDataClassification.toUpperCase()}`}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-1.5">
                    {[
                      {
                        id: 'custom',
                        title: 'GCP Console Standard',
                        desc: 'All Options Unlocked · Custom Topology & ACLs',
                      },
                      {
                        id: 'sec-17a4-worm',
                        title: 'SEC 17a-4 / FINRA WORM',
                        desc: 'Locks: ≥1-Yr WORM · US Only · PAP + Uniform · ≥30d Soft-Delete',
                      },
                      {
                        id: 'gdpr-eu-sovereign',
                        title: 'GDPR EU Dual-Region',
                        desc: 'Locks: EU Only (EUR4/Europe) · 15m Turbo RPO · PAP + Uniform',
                      },
                      {
                        id: 'hipaa-soc2-vault',
                        title: 'HIPAA / SOC2 Vault',
                        desc: 'Locks: US BAA Region · PAP + Uniform · ≥30d Soft-Delete · Versioning',
                      },
                      {
                        id: 'ai-lakehouse-hns',
                        title: 'AI / Spark HNS Tree',
                        desc: 'Locks: Single Region · Hierarchical Namespace ON · Uniform IAM',
                      },
                    ].map((bp) => {
                      const active = gcsComplianceRegime === bp.id;
                      return (
                        <button
                          key={bp.id}
                          type="button"
                          onClick={() => applyGcsCompliancePreset(bp.id)}
                          title={`Select ${bp.title} (${bp.desc})`}
                          className={`text-left p-2 rounded-[8px] border transition-all cursor-pointer ${
                            active
                              ? 'bg-emerald-500/15 border-emerald-500 text-zinc-950 dark:text-zinc-100 shadow-sm'
                              : 'bg-white dark:bg-[#131314] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'
                          }`}
                        >
                          <div className="text-[11px] font-bold flex items-center justify-between">
                            <span>{bp.title}</span>
                            {active && bp.id !== 'custom' && (
                              <span className="text-[9px] font-mono px-1 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300">
                                LOCKED
                              </span>
                            )}
                          </div>
                          <div className="text-[9.5px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5 leading-tight">
                            {bp.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {!isGcsCustom && (
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-amber-800 dark:text-amber-300">
                      <div>
                        <strong>Active Regulatory Lock ({gcsComplianceRegime.toUpperCase()}):</strong>{' '}
                        {isGcsSec &&
                          'Non-US locations, disabling WORM Retention Lock (<365d), Legacy Object ACLs, Public Access, and Soft-Delete <30d are strictly disabled.'}
                        {isGcsGdpr &&
                          'Non-EU regions (US/Asia), disabling 15m Turbo Replication RPO, Legacy Object ACLs, and Public Access are strictly disabled.'}
                        {isGcsHipaa &&
                          'Non-US regions, Legacy Object ACLs, Public Access, and Soft-Delete <30d are strictly disabled.'}
                        {isGcsAiHns &&
                          'Multi/Dual-Region high-latency placement, Legacy Object ACLs, and disabling Hierarchical Namespace are strictly disabled.'}
                      </div>
                      <button
                        type="button"
                        onClick={() => applyGcsCompliancePreset('custom')}
                        title="Switch to GCP Console Standard mode to unlock all options"
                        className="shrink-0 px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-[10px] font-bold cursor-pointer"
                      >
                        Switch to Custom Mode to Unlock
                      </button>
                    </div>
                  )}
                </div>

                {/* STEP 1: Choose where to store your data */}
                <div className="p-3.5 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                      1. Choose where to store your data (Location type)
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {!isGcsCustom
                        ? `Restricted by ${gcsComplianceRegime.toUpperCase()}`
                        : 'Permanent after bucket creation'}
                    </span>
                  </div>

                  {/* 3 GCP Console Location Type Radio Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      {
                        id: 'REGIONAL',
                        title: 'Region',
                        subtitle: 'Lowest latency within a single region',
                        sla: '99.99% Availability SLA · 40 Regions',
                        disabled: isGcsSec || isGcsGdpr,
                        lockReason:
                          'Disabled: SEC 17a-4 & GDPR Sovereign blueprints require Multi-Region or Dual-Region geo-redundancy',
                      },
                      {
                        id: 'DUAL_REGION',
                        title: 'Dual-region',
                        subtitle: 'High availability and low latency across 2 regions',
                        sla: '99.999% SLA · Custom Pair or Predefined + 15m Turbo RPO',
                        disabled: isGcsSec || isGcsAiHns,
                        lockReason:
                          'Disabled under current blueprint',
                      },
                      {
                        id: 'MULTI_REGION',
                        title: 'Multi-region',
                        subtitle: 'Highest availability across largest area',
                        sla: '99.999% SLA · Geo-redundant across US, EU, or ASIA',
                        disabled: isGcsGdpr || isGcsAiHns,
                        lockReason:
                          'Disabled under current blueprint',
                      },
                    ].map((locCard) => {
                      const selected = gcsLocationType === locCard.id;
                      return (
                        <button
                          key={locCard.id}
                          type="button"
                          disabled={locCard.disabled}
                          onClick={() => {
                            if (!locCard.disabled) setGcsLocationType(locCard.id);
                          }}
                          title={
                            locCard.disabled
                              ? locCard.lockReason
                              : `${locCard.title}: ${locCard.subtitle}`
                          }
                          className={`text-left p-3 rounded-[10px] border transition-all flex items-start gap-2.5 ${
                            locCard.disabled
                              ? 'opacity-40 cursor-not-allowed bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400'
                              : selected
                              ? 'bg-blue-500/12 border-blue-500 text-zinc-950 dark:text-zinc-50 shadow-sm cursor-pointer'
                              : 'bg-white dark:bg-[#131314] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 cursor-pointer'
                          }`}
                        >
                          <span
                            className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              selected
                                ? 'border-blue-500 bg-blue-500/20'
                                : 'border-zinc-400 dark:border-zinc-600'
                            }`}
                          >
                            {selected && (
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                            )}
                          </span>
                          <div>
                            <div className="text-xs font-extrabold">
                              {locCard.disabled ? '[LOCKED] ' : ''}
                              {locCard.title}
                            </div>
                            <div className="text-[10.5px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">
                              {locCard.subtitle}
                            </div>
                            <div className="text-[9.5px] font-mono text-blue-600 dark:text-blue-400 mt-1">
                              {locCard.sla}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Single Region Configuration */}
                  {gcsLocationType === 'REGIONAL' && (
                    <div className="pt-1">
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                        Location (Select Single Region — 40 Global Regions)
                      </label>
                      <select
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-3 py-2 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                      >
                        {Object.entries(GCP_REGION_ZONES).map(
                          ([regKey, info]) => {
                            const blockedByHipaa =
                              isGcsHipaa && !regKey.startsWith('us-');
                            return (
                              <option
                                key={regKey}
                                value={regKey}
                                disabled={blockedByHipaa}
                              >
                                {blockedByHipaa ? '[LOCKED] ' : ''}
                                {regKey} — {info.label}
                                {blockedByHipaa
                                  ? ' (Blocked by US HIPAA Jurisdiction)'
                                  : ''}
                              </option>
                            );
                          }
                        )}
                      </select>
                    </div>
                  )}

                  {/* Dual-Region Fine-Grained Configuration */}
                  {gcsLocationType === 'DUAL_REGION' && (
                    <div className="space-y-3 pt-1 border-t border-zinc-200/70 dark:border-zinc-800/70">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                            Dual-Region Pairing Mode
                          </label>
                          <select
                            value={gcsDualPreset}
                            onChange={(e) => setGcsDualPreset(e.target.value)}
                            className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                          >
                            <option value="CUSTOM">
                              Custom Dual-Region Pair (Pick Any 2 Regions in Continent)
                            </option>
                            <option value="NAM4" disabled={isGcsGdpr}>
                              {isGcsGdpr ? '[LOCKED] ' : ''}Predefined NAM4 (us-central1 Iowa + us-east1 South Carolina)
                            </option>
                            <option value="EUR4" disabled={isGcsHipaa || isGcsSec}>
                              {isGcsHipaa || isGcsSec ? '[LOCKED] ' : ''}Predefined EUR4 (europe-west4 Netherlands + europe-north1 Finland)
                            </option>
                            <option
                              value="ASIA1"
                              disabled={isGcsGdpr || isGcsHipaa || isGcsSec}
                            >
                              {isGcsGdpr || isGcsHipaa || isGcsSec ? '[LOCKED] ' : ''}Predefined ASIA1 (asia-northeast1 Tokyo + asia-northeast2 Osaka)
                            </option>
                          </select>
                        </div>

                        {gcsDualPreset === 'CUSTOM' && (
                          <div>
                            <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                              Location Continent Filter
                            </label>
                            <select
                              value={gcsDualContinent}
                              disabled={isGcsGdpr || isGcsHipaa}
                              onChange={(e) => {
                                const cont = e.target.value;
                                setGcsDualContinent(cont);
                                if (cont === 'europe') {
                                  setGcsDualRegionA('europe-west1');
                                  setGcsDualRegionB('europe-west4');
                                } else if (cont === 'asia') {
                                  setGcsDualRegionA('asia-northeast1');
                                  setGcsDualRegionB('asia-northeast2');
                                } else {
                                  setGcsDualRegionA('us-central1');
                                  setGcsDualRegionB('us-east1');
                                }
                              }}
                              className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-950 dark:text-zinc-100 disabled:opacity-50"
                            >
                              <option value="us" disabled={isGcsGdpr}>
                                Americas (United States / North America)
                              </option>
                              <option value="europe" disabled={isGcsHipaa}>
                                Europe (European Union & EEA)
                              </option>
                              <option
                                value="asia"
                                disabled={isGcsGdpr || isGcsHipaa}
                              >
                                Asia Pacific
                              </option>
                            </select>
                          </div>
                        )}
                      </div>

                      {gcsDualPreset === 'CUSTOM' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10.5px] font-mono text-zinc-500 mb-1">
                              Region 1 (Primary Placement)
                            </label>
                            <select
                              value={gcsDualRegionA}
                              onChange={(e) => setGcsDualRegionA(e.target.value)}
                              className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                            >
                              {Object.entries(GCP_REGION_ZONES)
                                .filter(([regKey]) =>
                                  gcsDualContinent === 'europe'
                                    ? regKey.startsWith('europe-')
                                    : gcsDualContinent === 'asia'
                                    ? regKey.startsWith('asia-') ||
                                      regKey.startsWith('australia-')
                                    : regKey.startsWith('us-') ||
                                      regKey.startsWith('northamerica-') ||
                                      regKey.startsWith('southamerica-')
                                )
                                .map(([regKey, info]) => (
                                  <option key={regKey} value={regKey}>
                                    {regKey} — {info.label}
                                  </option>
                                ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10.5px] font-mono text-zinc-500 mb-1">
                              Region 2 (Secondary Sovereign Placement)
                            </label>
                            <select
                              value={gcsDualRegionB}
                              onChange={(e) => setGcsDualRegionB(e.target.value)}
                              className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                            >
                              {Object.entries(GCP_REGION_ZONES)
                                .filter(([regKey]) =>
                                  gcsDualContinent === 'europe'
                                    ? regKey.startsWith('europe-')
                                    : gcsDualContinent === 'asia'
                                    ? regKey.startsWith('asia-') ||
                                      regKey.startsWith('australia-')
                                    : regKey.startsWith('us-') ||
                                      regKey.startsWith('northamerica-') ||
                                      regKey.startsWith('southamerica-')
                                )
                                .map(([regKey, info]) => (
                                  <option key={regKey} value={regKey}>
                                    {regKey} — {info.label}
                                  </option>
                                ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Turbo Replication RPO */}
                      <div className="p-2.5 rounded-[8px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314] flex flex-wrap items-center justify-between gap-2">
                        <label
                          className={`flex items-start gap-2 text-xs ${
                            isGcsGdpr ? 'cursor-not-allowed' : 'cursor-pointer'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={gcsRpo === 'ASYNC_TURBO'}
                            disabled={isGcsGdpr}
                            onChange={(e) =>
                              setGcsRpo(
                                e.target.checked ? 'ASYNC_TURBO' : 'DEFAULT'
                              )
                            }
                            className="mt-0.5 rounded border-zinc-400"
                          />
                          <div>
                            <div className="font-bold text-zinc-900 dark:text-zinc-100">
                              Enable Turbo Replication (15-minute RPO SLA)
                              {isGcsGdpr ? ' — Enforced by GDPR Blueprint' : ''}
                            </div>
                            <div className="text-[10px] font-mono text-zinc-500">
                              Replicates 100% of newly written objects across both regions within 15 minutes (`rpo: ASYNC_TURBO`).
                            </div>
                          </div>
                        </label>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                          RPO: {gcsRpo}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Multi-Region Fine-Grained Configuration */}
                  {gcsLocationType === 'MULTI_REGION' && (
                    <div className="space-y-3 pt-1 border-t border-zinc-200/70 dark:border-zinc-800/70">
                      <div>
                        <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-300 mb-1.5">
                          Multi-Region Location (Choose Continental Geo-Redundancy)
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {[
                            {
                              id: 'US',
                              label: 'us (multiple regions in United States)',
                              desc: 'Geo-redundant across US data centers',
                              disabled: isGcsGdpr,
                            },
                            {
                              id: 'EU',
                              label: 'eu (multiple regions in European Union)',
                              desc: 'Strict EU member-state data residency',
                              disabled: isGcsSec || isGcsHipaa,
                            },
                            {
                              id: 'ASIA',
                              label: 'asia (multiple regions in Asia)',
                              desc: 'Geo-redundant across Asia-Pacific hubs',
                              disabled: isGcsSec || isGcsHipaa || isGcsGdpr,
                            },
                          ].map((mr) => (
                            <button
                              key={mr.id}
                              type="button"
                              disabled={mr.disabled}
                              onClick={() => {
                                if (!mr.disabled) setGcsMultiRegion(mr.id);
                              }}
                              className={`text-left p-2.5 rounded-[8px] border transition-all ${
                                mr.disabled
                                  ? 'opacity-40 cursor-not-allowed bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400'
                                  : gcsMultiRegion === mr.id
                                  ? 'bg-blue-500/15 border-blue-500 text-zinc-950 dark:text-zinc-100 cursor-pointer'
                                  : 'bg-white dark:bg-[#131314] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 cursor-pointer'
                              }`}
                            >
                              <div className="text-xs font-mono font-bold">
                                {mr.disabled ? '[LOCKED] ' : ''}
                                {mr.label}
                              </div>
                              <div className="text-[10px] text-zinc-500 mt-0.5">
                                {mr.desc}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* STEP 2: Choose a storage class for your data */}
                <div className="p-3.5 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 space-y-3">
                  <div className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                    2. Choose a storage class for your data
                  </div>

                  {/* Radio Mode: Autoclass vs Set a default class */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      disabled={isGcsSec || isGcsAiHns}
                      onClick={() => {
                        if (!isGcsSec && !isGcsAiHns) setGcsAutoclass(true);
                      }}
                      className={`text-left p-2.5 rounded-[8px] border transition-all flex items-start gap-2.5 ${
                        isGcsSec || isGcsAiHns
                          ? 'opacity-40 cursor-not-allowed border-zinc-200 dark:border-zinc-800'
                          : gcsAutoclass
                          ? 'bg-blue-500/12 border-blue-500 text-zinc-950 dark:text-zinc-50 cursor-pointer'
                          : 'bg-white dark:bg-[#131314] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 cursor-pointer'
                      }`}
                    >
                      <span
                        className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          gcsAutoclass ? 'border-blue-500 bg-blue-500/20' : 'border-zinc-400'
                        }`}
                      >
                        {gcsAutoclass && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                      </span>
                      <div>
                        <div className="text-xs font-bold">
                          {isGcsSec || isGcsAiHns ? '[LOCKED] ' : ''}Autoclass (Automatic Tiering)
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                          Automatically transitions each object to hotter or colder classes based on access patterns
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setGcsAutoclass(false)}
                      className={`text-left p-2.5 rounded-[8px] border transition-all cursor-pointer flex items-start gap-2.5 ${
                        !gcsAutoclass
                          ? 'bg-blue-500/12 border-blue-500 text-zinc-950 dark:text-zinc-50'
                          : 'bg-white dark:bg-[#131314] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      <span
                        className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          !gcsAutoclass ? 'border-blue-500 bg-blue-500/20' : 'border-zinc-400'
                        }`}
                      >
                        {!gcsAutoclass && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                      </span>
                      <div>
                        <div className="text-xs font-bold">
                          Set a default class (Manual Selection)
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                          Choose Standard, Nearline, Coldline, or Archive as the default class for new objects
                        </div>
                      </div>
                    </button>
                  </div>

                  {!gcsAutoclass ? (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      {[
                        {
                          id: 'STANDARD',
                          rate: '$0.020/GB-mo',
                          minDur: 'None (0d min)',
                          desc: 'Best for short-term storage and frequently accessed hot data',
                          disabled: isGcsSec,
                        },
                        {
                          id: 'NEARLINE',
                          rate: '$0.010/GB-mo',
                          minDur: '30-day min duration',
                          desc: 'Best for backups and data accessed less than once a month',
                          disabled: isGcsSec || isGcsAiHns,
                        },
                        {
                          id: 'COLDLINE',
                          rate: '$0.004/GB-mo',
                          minDur: '90-day min duration',
                          desc: 'Best for disaster recovery accessed less than once a quarter',
                          disabled: isGcsAiHns,
                        },
                        {
                          id: 'ARCHIVE',
                          rate: '$0.0012/GB-mo',
                          minDur: '365-day min duration',
                          desc: 'Best for long-term digital preservation (< once a year)',
                          disabled: isGcsAiHns,
                        },
                      ].map((sc) => (
                        <button
                          key={sc.id}
                          type="button"
                          disabled={sc.disabled}
                          onClick={() => {
                            if (!sc.disabled) setStorageClass(sc.id);
                          }}
                          className={`p-2.5 rounded-[8px] border text-left transition-all ${
                            sc.disabled
                              ? 'opacity-40 cursor-not-allowed bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400'
                              : storageClass === sc.id
                              ? 'bg-blue-500/15 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm cursor-pointer'
                              : 'bg-white dark:bg-[#131314] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-extrabold">
                              {sc.disabled ? '[LOCKED] ' : ''}
                              {sc.id}
                            </span>
                            <span className="text-[10px] font-mono opacity-85">{sc.rate}</span>
                          </div>
                          <div className="text-[9.5px] font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                            {sc.minDur}
                          </div>
                          <div className="text-[9.5px] opacity-75 mt-1 leading-tight">
                            {sc.desc}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center bg-blue-500/5 border border-blue-500/20 rounded-[8px] p-2.5">
                      <div className="text-[11px] text-zinc-600 dark:text-zinc-300">
                        Objects enter as <strong>STANDARD</strong> and transition to colder tiers automatically with <strong>$0 retrieval fees</strong>.
                      </div>
                      <div>
                        <label className="block text-[10.5px] font-mono text-zinc-500 mb-1">
                          Terminal Storage Class (Coldest Tier)
                        </label>
                        <select
                          value={gcsAutoclassTerminal}
                          onChange={(e) => setGcsAutoclassTerminal(e.target.value)}
                          className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                        >
                          <option value="NEARLINE">Nearline ($0.010/GB — default GCP floor)</option>
                          <option value="ARCHIVE">Archive ($0.0012/GB — maximum cold savings)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Hierarchical Namespace (HNS) Option */}
                  <label
                    className={`flex items-start gap-2.5 p-2.5 rounded-[8px] border text-xs ${
                      gcsRetentionEnabled || isGcsAiHns
                        ? 'opacity-65 cursor-not-allowed border-zinc-200 dark:border-zinc-800'
                        : 'cursor-pointer border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={gcsHierarchicalNamespace}
                      disabled={gcsRetentionEnabled || isGcsAiHns}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setGcsHierarchicalNamespace(checked);
                        if (checked) {
                          setGcsUniformAccess(true);
                          setGcsVersioning(false);
                        }
                      }}
                      className="mt-0.5 rounded border-zinc-400"
                    />
                    <div>
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">
                        Enable Hierarchical Namespace (HNS) on this bucket
                        {isGcsAiHns ? ' — Enforced by AI/Spark HNS Blueprint' : ''}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500">
                        Organizes objects into a true file-system folder tree for atomic directory renames and 8× faster listing on Spark, Hadoop, Dataflow, and AI workloads (Requires Uniform access).
                      </div>
                    </div>
                  </label>
                </div>

                {/* STEP 3: Choose how to control access to objects */}
                <div className="p-3.5 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                      3. Choose how to control access to objects
                    </div>
                    {lockGcsPapAndUniform && (
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        Enforced by {gcsComplianceRegime.toUpperCase()}: Zero-Trust PAP + Uniform IAM
                      </span>
                    )}
                  </div>

                  {/* Prevent Public Access Checkbox */}
                  <div className="p-2.5 rounded-[8px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314] flex flex-wrap items-center justify-between gap-2">
                    <label
                      className={`flex items-start gap-2.5 text-xs ${
                        lockGcsPapAndUniform ? 'cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={gcsPublicAccessPrevention === 'enforced'}
                        disabled={lockGcsPapAndUniform}
                        onChange={(e) =>
                          setGcsPublicAccessPrevention(
                            e.target.checked ? 'enforced' : 'inherited'
                          )
                        }
                        className="mt-0.5 rounded border-zinc-400"
                      />
                      <div>
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">
                          Prevent public access — Enforce public access prevention on this bucket
                          {lockGcsPapAndUniform ? ' (Locked ON)' : ''}
                        </div>
                        <div className="text-[10px] font-mono text-zinc-500">
                          Blocks allUsers & allAuthenticatedUsers IAM bindings (Zero-Trust Mandatory under Compliance Blueprints)
                        </div>
                      </div>
                    </label>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                      PAP: {gcsPublicAccessPrevention.toUpperCase()}
                    </span>
                  </div>

                  {/* Access Control Model: Uniform vs Fine-grained */}
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-300 mb-1.5">
                      Access control model (Bucket-level IAM vs Object-level ACLs)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setGcsUniformAccess(true)}
                        className={`text-left p-2.5 rounded-[8px] border transition-all cursor-pointer flex items-start gap-2.5 ${
                          gcsUniformAccess || gcsHierarchicalNamespace
                            ? 'bg-blue-500/12 border-blue-500 text-zinc-950 dark:text-zinc-50'
                            : 'bg-white dark:bg-[#131314] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        <span
                          className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            gcsUniformAccess || gcsHierarchicalNamespace
                              ? 'border-blue-500 bg-blue-500/20'
                              : 'border-zinc-400'
                          }`}
                        >
                          {(gcsUniformAccess || gcsHierarchicalNamespace) && (
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                          )}
                        </span>
                        <div>
                          <div className="text-xs font-bold">
                            Uniform (Recommended)
                          </div>
                          <div className="text-[10px] text-zinc-500 mt-0.5">
                            Ensure uniform access to all objects in the bucket by using only bucket-level permissions (IAM).
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        disabled={gcsHierarchicalNamespace || lockGcsPapAndUniform}
                        onClick={() => {
                          if (!gcsHierarchicalNamespace && !lockGcsPapAndUniform) {
                            setGcsUniformAccess(false);
                          }
                        }}
                        title={
                          lockGcsPapAndUniform
                            ? `Disabled: ${gcsComplianceRegime.toUpperCase()} forbids legacy object-level ACLs`
                            : 'Enable Fine-grained object-level ACLs'
                        }
                        className={`text-left p-2.5 rounded-[8px] border transition-all flex items-start gap-2.5 ${
                          gcsHierarchicalNamespace || lockGcsPapAndUniform
                            ? 'opacity-40 cursor-not-allowed border-zinc-200 dark:border-zinc-800'
                            : !gcsUniformAccess
                            ? 'bg-blue-500/12 border-blue-500 text-zinc-950 dark:text-zinc-50 cursor-pointer'
                            : 'bg-white dark:bg-[#131314] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 cursor-pointer'
                        }`}
                      >
                        <span
                          className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            !gcsUniformAccess && !gcsHierarchicalNamespace
                              ? 'border-blue-500 bg-blue-500/20'
                              : 'border-zinc-400'
                          }`}
                        >
                          {!gcsUniformAccess && !gcsHierarchicalNamespace && (
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                          )}
                        </span>
                        <div>
                          <div className="text-xs font-bold">
                            {lockGcsPapAndUniform ? '[LOCKED] ' : ''}Fine-grained (Legacy Object ACLs)
                          </div>
                          <div className="text-[10px] text-zinc-500 mt-0.5">
                            Disabled under Zero-Trust Compliance Blueprints.
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* STEP 4: Choose how to protect object data */}
                <div className="p-3.5 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 space-y-3">
                  <div className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                    4. Choose how to protect object data
                  </div>

                  {/* 4A. Soft Delete Policy */}
                  <div className="p-2.5 rounded-[8px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314] space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label
                        className={`flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-zinc-100 ${
                          !isGcsCustom ? 'cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={gcsSoftDeleteEnabled}
                          disabled={!isGcsCustom}
                          onChange={(e) => {
                            setGcsSoftDeleteEnabled(e.target.checked);
                            if (
                              e.target.checked &&
                              gcsSoftDeleteDays < minGcsSoftDeleteDays
                            ) {
                              setGcsSoftDeleteDays(minGcsSoftDeleteDays);
                            }
                          }}
                          className="rounded border-zinc-400"
                        />
                        Soft delete policy (For data recovery)
                        {!isGcsCustom ? ` — Min ${minGcsSoftDeleteDays}d Enforced` : ''}
                      </label>
                      <span className="text-[10px] font-mono text-zinc-500">
                        Retains deleted objects so they can be restored
                      </span>
                    </div>

                    {gcsSoftDeleteEnabled && (
                      <div className="flex flex-wrap items-center gap-2 pt-1 pl-6">
                        <span className="text-[11px] font-mono text-zinc-500">
                          Retention duration ({minGcsSoftDeleteDays} to 90 days):
                        </span>
                        <input
                          type="number"
                          min={minGcsSoftDeleteDays}
                          max={90}
                          value={gcsSoftDeleteDays}
                          onChange={(e) =>
                            setGcsSoftDeleteDays(
                              Math.max(
                                minGcsSoftDeleteDays,
                                Math.min(90, Number(e.target.value || minGcsSoftDeleteDays))
                              )
                            )
                          }
                          className="w-20 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                        />
                        <span className="text-[11px] font-mono text-zinc-500">days</span>
                        <div className="flex items-center gap-1 ml-auto">
                          {[7, 14, 30, 60, 90].map((d) => {
                            const disabledDay = d < minGcsSoftDeleteDays;
                            return (
                              <button
                                key={d}
                                type="button"
                                disabled={disabledDay}
                                onClick={() => {
                                  if (!disabledDay) setGcsSoftDeleteDays(d);
                                }}
                                className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                                  disabledDay
                                    ? 'opacity-35 cursor-not-allowed border-zinc-200 dark:border-zinc-800 text-zinc-400'
                                    : gcsSoftDeleteDays === d
                                    ? 'bg-blue-500/15 border-blue-500 text-blue-600 dark:text-blue-400 font-bold cursor-pointer'
                                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 cursor-pointer'
                                }`}
                              >
                                {disabledDay ? '[LOCKED]' : ''}
                                {d}d
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 4B. Object Versioning */}
                  <div className="p-2.5 rounded-[8px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314] space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label
                        className={`flex items-center gap-2 text-xs font-bold ${
                          gcsRetentionEnabled || isGcsGdpr || isGcsHipaa
                            ? 'opacity-65 cursor-not-allowed text-zinc-500'
                            : 'cursor-pointer text-zinc-900 dark:text-zinc-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={gcsVersioning && !gcsRetentionEnabled}
                          disabled={
                            gcsRetentionEnabled ||
                            isGcsGdpr ||
                            isGcsHipaa ||
                            isGcsAiHns
                          }
                          onChange={(e) => setGcsVersioning(e.target.checked)}
                          className="rounded border-zinc-400"
                        />
                        Object versioning (For version control)
                        {isGcsGdpr || isGcsHipaa ? ' — Enforced ON' : ''}
                      </label>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {gcsRetentionEnabled
                          ? 'Cannot be combined with Retention Policy'
                          : 'Keeps noncurrent versions when objects are overwritten or deleted'}
                      </span>
                    </div>

                    {gcsVersioning && !gcsRetentionEnabled && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 pl-6">
                        <div>
                          <label className="block text-[10.5px] font-mono text-zinc-500 mb-1">
                            Max number of versions per object (0 = Unlimited)
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={1000}
                            value={gcsMaxNumVersions}
                            onChange={(e) =>
                              setGcsMaxNumVersions(
                                Math.max(0, Number(e.target.value || 0))
                              )
                            }
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2.5 py-1 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                          />
                        </div>
                        <div>
                          <label className="block text-[10.5px] font-mono text-zinc-500 mb-1">
                            Expire noncurrent versions after (Days, 0 = Never)
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={3650}
                            value={gcsPurgeNoncurrentDays}
                            onChange={(e) =>
                              setGcsPurgeNoncurrentDays(
                                Math.max(0, Number(e.target.value || 0))
                              )
                            }
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2.5 py-1 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 4C. Retention Policy / Bucket Lock */}
                  <div className="p-2.5 rounded-[8px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314] space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label
                        className={`flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-zinc-100 ${
                          lockGcsWorm || isGcsAiHns
                            ? 'cursor-not-allowed'
                            : 'cursor-pointer'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={gcsRetentionEnabled}
                          disabled={lockGcsWorm || isGcsAiHns}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setGcsRetentionEnabled(checked);
                            if (checked) {
                              setGcsVersioning(false);
                              setGcsHierarchicalNamespace(false);
                            }
                          }}
                          className="rounded border-zinc-400"
                        />
                        Retention policy / Bucket Lock (For WORM compliance)
                        {lockGcsWorm
                          ? ' — Locked ON by SEC Rule 17a-4 (Min 1 Year)'
                          : ''}
                      </label>
                      <span className="text-[10px] font-mono text-zinc-500">
                        Prevents deletion or modification of objects until retention duration expires
                      </span>
                    </div>

                    {gcsRetentionEnabled && (
                      <div className="flex flex-wrap items-center gap-2 pt-1 pl-6">
                        <span className="text-[11px] font-mono text-zinc-500">
                          Duration:
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={36500}
                          value={gcsRetentionValue}
                          onChange={(e) =>
                            setGcsRetentionValue(
                              Math.max(1, Number(e.target.value || 1))
                            )
                          }
                          className="w-24 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                        />
                        <select
                          value={gcsRetentionUnit}
                          disabled={lockGcsWorm}
                          onChange={(e) => setGcsRetentionUnit(e.target.value)}
                          className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-xs font-mono text-zinc-950 dark:text-zinc-100 disabled:opacity-50"
                        >
                          <option value="seconds" disabled={lockGcsWorm}>
                            Seconds
                          </option>
                          <option value="days" disabled={lockGcsWorm}>
                            Days
                          </option>
                          <option value="months" disabled={lockGcsWorm}>
                            Months (30d)
                          </option>
                          <option value="years">Years (365d)</option>
                        </select>
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                          (= {gcsRetentionDays} days /{' '}
                          {gcsRetentionSeconds.toLocaleString()}s)
                        </span>
                      </div>
                    )}
                  </div>

                {/* 4D. Data Encryption (Google-managed vs Customer-managed KMS Key) */}
                <div className="space-y-2 pt-1">
                  <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                    Data encryption
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setGcsEncryptionType('GOOGLE_MANAGED')}
                      className={`text-left p-2.5 rounded-[8px] border transition-all cursor-pointer flex items-start gap-2.5 ${
                        gcsEncryptionType === 'GOOGLE_MANAGED'
                          ? 'bg-blue-500/12 border-blue-500 text-zinc-950 dark:text-zinc-50'
                          : 'bg-white dark:bg-[#131314] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      <span
                        className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          gcsEncryptionType === 'GOOGLE_MANAGED'
                            ? 'border-blue-500 bg-blue-500/20'
                            : 'border-zinc-400'
                        }`}
                      >
                        {gcsEncryptionType === 'GOOGLE_MANAGED' && (
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                        )}
                      </span>
                      <div>
                        <div className="text-xs font-bold">
                          Google-managed encryption key
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                          Default AES-256 server-side encryption — no configuration required
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setGcsEncryptionType('CMEK')}
                      className={`text-left p-2.5 rounded-[8px] border transition-all cursor-pointer flex items-start gap-2.5 ${
                        gcsEncryptionType === 'CMEK'
                          ? 'bg-blue-500/12 border-blue-500 text-zinc-950 dark:text-zinc-50'
                          : 'bg-white dark:bg-[#131314] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      <span
                        className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          gcsEncryptionType === 'CMEK'
                            ? 'border-blue-500 bg-blue-500/20'
                            : 'border-zinc-400'
                        }`}
                      >
                        {gcsEncryptionType === 'CMEK' && (
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                        )}
                      </span>
                      <div>
                        <div className="text-xs font-bold">
                          Customer-managed encryption key (CMEK)
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                          Manage encryption & key rotation through Google Cloud KMS
                        </div>
                      </div>
                    </button>
                  </div>

                  {gcsEncryptionType === 'CMEK' && (
                    <div className="pt-1">
                      <label className="block text-[10.5px] font-mono text-zinc-500 mb-1">
                        Cloud KMS Key Resource Name (`projects/.../locations/.../keyRings/.../cryptoKeys/...`)
                      </label>
                      <input
                        type="text"
                        value={gcsCmekKeyName}
                        onChange={(e) => setGcsCmekKeyName(e.target.value)}
                        placeholder={`projects/${projectId}/locations/${region}/keyRings/my-ring/cryptoKeys/my-key`}
                        className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* STEP 5: Fine-Grained Object Lifecycle Rules, Labels, Requester Pays & CORS */}
              <div className="p-3.5 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                    5. Fine-Grained Lifecycle Rules, Labels & Billing Options
                  </span>
                  <label
                    className={`flex items-center gap-2 text-xs font-mono text-blue-600 dark:text-blue-400 ${
                      !isGcsCustom ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={gcsEnableSmartLifecycle}
                      disabled={!isGcsCustom}
                      onChange={(e) => setGcsEnableSmartLifecycle(e.target.checked)}
                      className="rounded border-zinc-400"
                    />
                    Enable Custom Storage Class Transition Rules
                    {!isGcsCustom
                      ? isGcsAiHns
                        ? ' — Locked OFF (Hot Tensor I/O)'
                        : ' — Locked ON by Compliance'
                      : ''}
                  </label>
                </div>

                {gcsEnableSmartLifecycle && !gcsAutoclass && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-2.5 rounded-[8px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314]">
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                        → Nearline after (Days)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={gcsNearlineDays}
                        onChange={(e) =>
                          setGcsNearlineDays(Math.max(0, Number(e.target.value || 0)))
                        }
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                        → Coldline after (Days)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={gcsColdlineDays}
                        onChange={(e) =>
                          setGcsColdlineDays(Math.max(0, Number(e.target.value || 0)))
                        }
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                        → Archive after (Days)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={gcsArchiveDays}
                        onChange={(e) =>
                          setGcsArchiveDays(Math.max(0, Number(e.target.value || 0)))
                        }
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                        Delete objects after{' '}
                        {isGcsSec || isGcsHipaa
                          ? '(0 = WORM Protected)'
                          : isGcsGdpr
                          ? '(1–365d GDPR Cap)'
                          : '(0=Off)'}
                      </label>
                      <input
                        type="number"
                        min={isGcsGdpr ? 1 : 0}
                        max={isGcsGdpr ? 365 : 36500}
                        disabled={isGcsSec || isGcsHipaa}
                        value={gcsDeleteAfterDays}
                        onChange={(e) => {
                          const raw = Number(e.target.value || 0);
                          if (isGcsGdpr) {
                            setGcsDeleteAfterDays(Math.max(1, Math.min(365, raw)));
                          } else {
                            setGcsDeleteAfterDays(Math.max(0, raw));
                          }
                        }}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-xs font-mono text-zinc-950 dark:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                      Bucket Labels (Comma-separated `key=value` pairs)
                    </label>
                    <input
                      type="text"
                      value={gcsCustomLabels}
                      onChange={(e) => setGcsCustomLabels(e.target.value)}
                      placeholder="env=production,team=data-eng,cost-center=ai"
                      className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                      Abort Incomplete Multipart Uploads After (Days, 0 = Disabled)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={365}
                      value={gcsAbortMultipartDays}
                      onChange={(e) =>
                        setGcsAbortMultipartDays(
                          Math.max(0, Number(e.target.value || 0))
                        )
                      }
                      className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer p-2 rounded-[8px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314]">
                    <input
                      type="checkbox"
                      checked={gcsRequesterPays}
                      onChange={(e) => setGcsRequesterPays(e.target.checked)}
                      className="rounded border-zinc-400"
                    />
                    <div>
                      <div className="font-bold">Requester Pays (`billing.requesterPays`)</div>
                      <div className="text-[10px] font-mono text-zinc-500">
                        Requesters pay for data access & network egress costs
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 p-2 rounded-[8px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314] ${
                      isGcsSec || isGcsGdpr || isGcsHipaa
                        ? 'opacity-50 cursor-not-allowed'
                        : 'cursor-pointer'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={gcsEnableCors}
                      disabled={isGcsSec || isGcsGdpr || isGcsHipaa}
                      onChange={(e) => setGcsEnableCors(e.target.checked)}
                      className="rounded border-zinc-400"
                    />
                    <div>
                      <div className="font-bold">
                        Browser Direct Upload CORS Policy
                        {isGcsSec || isGcsGdpr || isGcsHipaa ? ' [LOCKED]' : ''}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500">
                        {isGcsSec || isGcsGdpr || isGcsHipaa
                          ? 'Disabled for regulated SEC/GDPR/HIPAA compliance vaults'
                          : 'Allow signed URL / browser PUT & POST uploads'}
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
            );
          })()}

          {serviceType === 'CLOUD_RUN' && (
            <div className="space-y-3.5 border-t border-zinc-200 dark:border-zinc-800 pt-3">
              {/* Cloud Run Workload Kind Selector: SERVICE vs BATCH JOB */}
              <div className="p-3 rounded-[10px] border border-blue-500/35 bg-blue-500/5 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-[11px] font-extrabold font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Cloud Run v2 Workload Kind (HTTP Service vs. Parallel Batch Job)
                  </label>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {runWorkloadKind === 'JOB'
                      ? 'run.googleapis.com/v2/.../jobs · Up to 24h Timeout'
                      : 'run.googleapis.com/v2/.../services · Scale 0→1000'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    {
                      id: 'SERVICE',
                      label: 'Cloud Run v2 Service (HTTP / gRPC / WebSockets)',
                      sub: 'Exposes HTTPS .run.app URL · Auto-scales 0→1000 on requests (max 60m request timeout)',
                    },
                    {
                      id: 'JOB',
                      label: 'Cloud Run v2 Batch Job (Parallel Shards + Cron :run)',
                      sub: 'Zero open ports · Runs to Exit(0) · Up to 24h (86,400s) timeout · 1–100 CLOUD_RUN_TASK_INDEX shards',
                    },
                  ].map((wk) => {
                    const active = runWorkloadKind === wk.id;
                    return (
                      <button
                        key={wk.id}
                        type="button"
                        onClick={() => {
                          setRunWorkloadKind(wk.id);
                          if (wk.id === 'JOB') {
                            setName((prev) =>
                              prev.includes('-srv-')
                                ? prev.replace('-srv-', '-job-')
                                : prev
                            );
                          } else {
                            setName((prev) =>
                              prev.includes('-job-')
                                ? prev.replace('-job-', '-srv-')
                                : prev
                            );
                          }
                        }}
                        className={`p-2.5 rounded-[8px] border text-left transition-all cursor-pointer ${
                          active
                            ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                            : 'bg-white dark:bg-[#131314] border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <div className="text-[11px] font-bold">{wk.label}</div>
                        <div
                          className={`text-[10px] mt-0.5 ${
                            active ? 'text-blue-100' : 'text-zinc-500'
                          }`}
                        >
                          {wk.sub}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {runWorkloadKind === 'JOB' && (
                  <div className="pt-2 border-t border-blue-500/20 space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">
                          Parallel Task Shards
                        </label>
                        <select
                          value={runJobTaskCount}
                          onChange={(e) =>
                            setRunJobTaskCount(Number(e.target.value))
                          }
                          className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2 py-1.5 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                        >
                          <option value={1}>1 Shard</option>
                          <option value={2}>2 Shards</option>
                          <option value={4}>4 Shards</option>
                          <option value={8}>8 Shards</option>
                          <option value={16}>16 Shards</option>
                          <option value={50}>50 Shards</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">
                          Max Batch Timeout
                        </label>
                        <select
                          value={runJobTimeoutSec}
                          onChange={(e) =>
                            setRunJobTimeoutSec(Number(e.target.value))
                          }
                          className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2 py-1.5 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                        >
                          <option value={1800}>30m (1,800s)</option>
                          <option value={3600}>1 Hour (3,600s)</option>
                          <option value={14400}>4 Hours (14,400s)</option>
                          <option value={43200}>12 Hours (43,200s)</option>
                          <option value={86400}>24 Hours (86,400s Max)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">
                          Max Task Retries
                        </label>
                        <select
                          value={runJobMaxRetries}
                          onChange={(e) =>
                            setRunJobMaxRetries(Number(e.target.value))
                          }
                          className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2 py-1.5 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                        >
                          <option value={0}>0 Retries</option>
                          <option value={1}>1 Retry</option>
                          <option value={3}>3 Retries</option>
                          <option value={5}>5 Retries</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-zinc-700 dark:text-zinc-300">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={Boolean(runJobExecuteNow)}
                          onChange={(e) => setRunJobExecuteNow(e.target.checked)}
                          className="rounded border-blue-400 text-blue-600"
                        />
                        <span>
                          Execute First Run Immediately (<code>:run</code>)
                        </span>
                      </label>

                      <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={Boolean(runJobAttachScheduler)}
                          onChange={(e) =>
                            setRunJobAttachScheduler(e.target.checked)
                          }
                          className="rounded border-blue-400 text-blue-600"
                        />
                        <span>
                          Attach Cloud Scheduler Trigger (
                          <strong>{describeCronInPlainEnglish(runJobSchedule)}</strong> → <code>:run</code> API)
                        </span>
                      </label>
                    </div>

                    {runJobAttachScheduler && (
                      <VisualCronScheduleBuilder
                        compact
                        value={runJobSchedule}
                        onChange={(newCron) => setRunJobSchedule(newCron)}
                        label="Visual Schedule Picker (No Cron Syntax Needed)"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* 3-Way Container Source Selector: Artifact Registry | GitHub Repo | Public URI */}
              <div className="p-3 rounded-[10px] border border-blue-500/30 bg-blue-500/5 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-[11px] font-extrabold font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Container Source (Artifact Registry · GitHub Repo · Custom URI)
                  </label>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {arImages.length} Image(s) in `{projectId}` Artifact Registry
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    {
                      id: 'ARTIFACT_REGISTRY',
                      label: 'Project Artifact Registry',
                      sub: `Pick from ${arImages.length} live GCP image(s)`,
                    },
                    {
                      id: 'GITHUB_REPO',
                      label: 'Build & Deploy from GitHub',
                      sub: 'Cloud Build → AR → Cloud Run',
                    },
                    {
                      id: 'PUBLIC_URI',
                      label: 'Public / Custom URI',
                      sub: 'Docker Hub / GCR / Quick Presets',
                    },
                  ].map((m) => {
                    const active = runSourceMode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setRunSourceMode(m.id)}
                        className={`p-2 rounded-[8px] border text-left transition-all cursor-pointer ${
                          active
                            ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                            : 'bg-white dark:bg-[#131314] border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <div className="text-[11px] font-bold">{m.label}</div>
                        <div
                          className={`text-[9.5px] mt-0.5 ${
                            active ? 'text-blue-100' : 'text-zinc-500'
                          }`}
                        >
                          {m.sub}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {runSourceMode === 'ARTIFACT_REGISTRY' && (
                  <div className="space-y-2">
                    {arImages.length > 0 ? (
                      <div>
                        <label className="block text-[10.5px] font-mono text-zinc-500 mb-1">
                          Select Container from `{projectId}` Artifact Registry:
                        </label>
                        <select
                          value={containerImage}
                          onChange={(e) => setContainerImage(e.target.value)}
                          className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-2 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                        >
                          {arImages.map((img, i) => {
                            const tag = img.tags?.[0] || 'latest';
                            const fullUri = `${img.uri}:${tag}`;
                            return (
                              <option key={`${img.uri}-${i}`} value={fullUri}>
                                {fullUri} ({img.sizeMb} MB · {img.location})
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-[8px] border border-dashed border-zinc-300 dark:border-zinc-700 text-[11px] font-mono text-zinc-500 flex items-center justify-between gap-2">
                        <span>
                          No container images found in `{projectId}` Artifact Registry yet.
                        </span>
                        <button
                          type="button"
                          onClick={() => setRunSourceMode('GITHUB_REPO')}
                          className="px-2.5 py-1 rounded bg-blue-600 text-white text-[10px] font-bold cursor-pointer shrink-0"
                        >
                          Build from GitHub →
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {runSourceMode === 'GITHUB_REPO' && (
                  <div className="space-y-2.5 pt-1 border-t border-blue-500/20">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                      <div className="sm:col-span-2 min-w-0">
                        <label
                          title="GitHub Repository HTTPS URL"
                          className="block text-[10.5px] font-mono text-zinc-500 mb-1 truncate whitespace-nowrap"
                        >
                          GitHub Repository HTTPS URL
                        </label>
                        <input
                          type="text"
                          value={runGhRepoUrl}
                          onChange={(e) => setRunGhRepoUrl(e.target.value)}
                          placeholder="https://github.com/owner/repo.git"
                          className="w-full h-[34px] bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                        />
                      </div>
                      <div className="min-w-0">
                        <label
                          title="Git Branch & Context Directory"
                          className="block text-[10.5px] font-mono text-zinc-500 mb-1 truncate whitespace-nowrap"
                        >
                          Branch & Context Dir
                        </label>
                        <div className="grid grid-cols-2 gap-1">
                          <input
                            type="text"
                            value={runGhBranch}
                            onChange={(e) => setRunGhBranch(e.target.value)}
                            placeholder="main"
                            className="w-full h-[34px] bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                          />
                          <input
                            type="text"
                            value={runGhContextDir}
                            onChange={(e) => setRunGhContextDir(e.target.value)}
                            placeholder="."
                            className="w-full h-[34px] bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-end">
                      <div className="min-w-0">
                        <label
                          title="Cloud Build Containerization Method"
                          className="block text-[10.5px] font-mono text-zinc-500 mb-1 truncate whitespace-nowrap"
                        >
                          Cloud Build Method
                        </label>
                        <select
                          value={runGhBuildMethod}
                          onChange={(e) => setRunGhBuildMethod(e.target.value)}
                          className="w-full h-[34px] bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                        >
                          <option value="BUILDPACKS">
                            Zero-Dockerfile Google Cloud Buildpacks
                          </option>
                          <option value="DOCKERFILE">
                            Standard Dockerfile (`docker build`)
                          </option>
                        </select>
                      </div>
                      <div className="min-w-0">
                        <label
                          title="Target Artifact Registry Repository (Auto-Created)"
                          className="block text-[10.5px] font-mono text-zinc-500 mb-1 truncate whitespace-nowrap"
                        >
                          Artifact Registry Repo (Auto-Created)
                        </label>
                        <input
                          type="text"
                          value={runGhArRepo}
                          onChange={(e) => setRunGhArRepo(e.target.value)}
                          className="w-full h-[34px] bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {runSourceMode === 'PUBLIC_URI' && (
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
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div className="sm:col-span-2 min-w-0">
                    <label
                      title={
                        runSourceMode === 'GITHUB_REPO'
                          ? 'Target Artifact Registry Image URI (Auto-Built by Cloud Build)'
                          : 'Container Image URI (Artifact Registry / GCR / Docker)'
                      }
                      className="block text-xs font-medium text-zinc-500 mb-1 truncate whitespace-nowrap"
                    >
                      {runSourceMode === 'GITHUB_REPO'
                        ? 'Target Artifact Registry Image URI (Auto-Built)'
                        : 'Container Image URI (Artifact Registry / Docker)'}
                    </label>
                    <input
                      type="text"
                      value={
                        runSourceMode === 'GITHUB_REPO'
                          ? `${region}-docker.pkg.dev/${projectId}/${runGhArRepo}/${name}:latest`
                          : containerImage
                      }
                      readOnly={runSourceMode === 'GITHUB_REPO'}
                      onChange={(e) => setContainerImage(e.target.value)}
                      className="w-full h-[34px] bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100"
                    />
                  </div>
                  <div className="min-w-0">
                    <label
                      title="Container Listening Port (PORT)"
                      className="block text-xs font-medium text-zinc-500 mb-1 truncate whitespace-nowrap"
                    >
                      Container Port
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={65535}
                      value={runPort}
                      onChange={(e) => setRunPort(Number(e.target.value))}
                      className="w-full h-[34px] bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100"
                    />
                  </div>
                </div>
              </div>

              {/* 2026 Cloud Run Billing Mode: Request-based vs Instance-based */}
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label className="text-[11px] font-bold font-mono uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
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
                        : 'bg-white dark:bg-[#131314] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 disabled:opacity-45 disabled:cursor-not-allowed'
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
                        : 'bg-white dark:bg-[#131314] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
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
              <div className="p-3 rounded-xl bg-blue-500/[0.04] dark:bg-blue-950/20 border border-blue-500/25 space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label className="text-[11px] font-bold font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>2026 Serverless GPU Accelerator (Gen2 AI Inference)</span>
                  </label>
                  {runGpuAccelerator !== 'NONE' && (
                    <span className="text-[10px] font-mono bg-blue-500/15 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full">
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
                            ? 'bg-blue-500/15 border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm'
                            : 'bg-white dark:bg-[#131314] border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-blue-500/40'
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-blue-500/20">
                    <span className="text-[11px] text-zinc-500">
                      GPU Zonal Redundancy (Reserve GPU capacity across multiple
                      zones):
                    </span>
                    <button
                      type="button"
                      onClick={() => setRunGpuZonalRedundancy((v) => !v)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-mono font-semibold border transition-colors ${
                        runGpuZonalRedundancy
                          ? 'bg-blue-500/15 border-blue-500/40 text-blue-600 dark:text-blue-300'
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
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 items-end">
                <div className="min-w-0">
                  <label
                    title="vCPU Allocation per Container Instance"
                    className="block text-[11px] font-medium text-zinc-500 mb-1 truncate whitespace-nowrap"
                  >
                    vCPU
                  </label>
                  <select
                    value={runCpu}
                    onChange={(e) => setRunCpu(e.target.value)}
                    className="w-full h-[34px] bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 text-xs font-mono text-zinc-950 dark:text-zinc-100"
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

                <div className="min-w-0">
                  <label
                    title="Memory Limit per Container Instance"
                    className="block text-[11px] font-medium text-zinc-500 mb-1 truncate whitespace-nowrap"
                  >
                    Memory
                  </label>
                  <select
                    value={runMemory}
                    onChange={(e) => setRunMemory(e.target.value)}
                    className="w-full h-[34px] bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 text-xs font-mono text-zinc-950 dark:text-zinc-100"
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

                <div className="min-w-0">
                  <label
                    title="Minimum Instances (0 = Scale to $0 Idle)"
                    className="block text-[11px] font-medium text-zinc-500 mb-1 truncate whitespace-nowrap"
                  >
                    Min Inst (0=$0)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={runMinInstances}
                    onChange={(e) => setRunMinInstances(Number(e.target.value))}
                    className="w-full h-[34px] bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                  />
                </div>

                <div className="min-w-0">
                  <label
                    title="Maximum Instances (Cost & Scaling Cap)"
                    className="block text-[11px] font-medium text-zinc-500 mb-1 truncate whitespace-nowrap"
                  >
                    Max Inst (Cap)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={runMaxInstances}
                    onChange={(e) => setRunMaxInstances(Number(e.target.value))}
                    className="w-full h-[34px] bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1 min-w-0">
                  <label
                    title="Max Concurrent Requests per Instance"
                    className="block text-[11px] font-medium text-zinc-500 mb-1 truncate whitespace-nowrap"
                  >
                    Concurrency
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={runConcurrency}
                    onChange={(e) => setRunConcurrency(Number(e.target.value))}
                    className="w-full h-[34px] bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Ingress, IAM Public/Private, Startup CPU Boost & Environment Variables */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div className="min-w-0">
                  <label
                    title="Ingress Network Traffic Control"
                    className="block text-[11px] font-medium text-zinc-500 mb-1 truncate whitespace-nowrap"
                  >
                    Ingress Control
                  </label>
                  <select
                    value={runIngress}
                    onChange={(e) => setRunIngress(e.target.value)}
                    className="w-full h-[34px] bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 text-xs font-mono text-zinc-950 dark:text-zinc-100"
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

                <div className="min-w-0">
                  <label
                    title="Authentication & Direct Cloud IAP (App Engine-Style Google Sign-In · $0/mo Zero-LB)"
                    className="block text-[11px] font-medium text-zinc-500 mb-1 truncate whitespace-nowrap"
                  >
                    Auth &amp; Direct Cloud IAP
                  </label>
                  <select
                    value={
                      runEnableIap
                        ? 'DIRECT_CLOUD_IAP'
                        : runAllowUnauth
                        ? 'PUBLIC_ALL_USERS'
                        : 'PRIVATE_IAM'
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'DIRECT_CLOUD_IAP') {
                        setRunAllowUnauth(false);
                        setRunEnableIap(true);
                      } else if (val === 'PUBLIC_ALL_USERS') {
                        setRunAllowUnauth(true);
                        setRunEnableIap(false);
                      } else {
                        setRunAllowUnauth(false);
                        setRunEnableIap(false);
                      }
                    }}
                    className={`w-full h-[34px] rounded-[8px] px-2.5 text-xs font-mono border transition-colors cursor-pointer ${
                      runEnableIap
                        ? 'bg-blue-500/15 border-blue-500/50 text-blue-600 dark:text-blue-300 font-bold'
                        : runAllowUnauth
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    <option value="PUBLIC_ALL_USERS" className="bg-white dark:bg-[#131314] text-zinc-950 dark:text-zinc-100">
                      Public HTTPS (allUsers)
                    </option>
                    <option value="DIRECT_CLOUD_IAP" className="bg-white dark:bg-[#131314] text-zinc-950 dark:text-zinc-100">
                      Direct Cloud IAP ($0/mo Sign-In)
                    </option>
                    <option value="PRIVATE_IAM" className="bg-white dark:bg-[#131314] text-zinc-950 dark:text-zinc-100">
                      Private (IAM Auth Only)
                    </option>
                  </select>
                </div>

                <div className="min-w-0">
                  <label
                    title="Cold-Start Startup CPU Boost"
                    className="block text-[11px] font-medium text-zinc-500 mb-1 truncate whitespace-nowrap"
                  >
                    Cold-Start CPU Boost
                  </label>
                  <button
                    type="button"
                    onClick={() => setRunStartupBoost((v) => !v)}
                    className={`w-full h-[34px] rounded-[8px] px-3 text-xs font-mono border text-left transition-colors flex items-center truncate ${
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

              {/* 2026 Direct VPC Egress Network (`template.vpcAccess`) */}
              <div className="p-3 rounded-xl bg-blue-500/[0.05] border border-blue-500/30 space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Network className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                    <span className="text-[11px] font-extrabold font-mono uppercase tracking-wider text-blue-700 dark:text-blue-300">
                      2026 Direct VPC Egress Network (`template.vpcAccess`)
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-blue-500/20 text-blue-600 dark:text-blue-300">
                      $0.00 Connector Tax
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setRunEnableDirectVpc((v) => !v)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-mono font-bold border transition-all cursor-pointer ${
                      runEnableDirectVpc
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                        : 'bg-white dark:bg-[#131314] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {runEnableDirectVpc
                      ? '✓ Direct VPC Egress Enabled'
                      : '+ Attach VPC Network'}
                  </button>
                </div>

                <p className="text-[10.5px] text-zinc-500">
                  Sends outbound traffic directly into your VPC subnetwork without legacy Serverless VPC Access Connector VMs — ideal for Private-IP Cloud SQL, AlloyDB, Memorystore Redis & NFS Filestore.
                </p>

                {runEnableDirectVpc && (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end pt-1 border-t border-blue-500/20">
                    <div className="min-w-0">
                      <label
                        title="VPC Network (--network)"
                        className="block text-[10.5px] font-mono text-zinc-500 mb-1 truncate whitespace-nowrap"
                      >
                        VPC Network
                      </label>
                      <select
                        value={runVpcNetwork}
                        onChange={(e) => setRunVpcNetwork(e.target.value)}
                        className="w-full h-[34px] bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                      >
                        {projectVpcs.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="min-w-0">
                      <label
                        title="Subnetwork (--subnet)"
                        className="block text-[10.5px] font-mono text-zinc-500 mb-1 truncate whitespace-nowrap"
                      >
                        Subnetwork
                      </label>
                      <input
                        type="text"
                        value={runVpcSubnetwork}
                        onChange={(e) => setRunVpcSubnetwork(e.target.value)}
                        placeholder="default"
                        className="w-full h-[34px] bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                      />
                    </div>

                    <div className="min-w-0">
                      <label
                        title="VPC Egress Routing (--vpc-egress)"
                        className="block text-[10.5px] font-mono text-zinc-500 mb-1 truncate whitespace-nowrap"
                      >
                        Egress Routing
                      </label>
                      <select
                        value={runVpcEgress}
                        onChange={(e) => setRunVpcEgress(e.target.value)}
                        className="w-full h-[34px] bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                      >
                        <option value="PRIVATE_RANGES_ONLY">
                          private-ranges-only (Private IPs)
                        </option>
                        <option value="ALL_TRAFFIC">
                          all-traffic (100% via VPC / NAT)
                        </option>
                      </select>
                    </div>

                    <div className="min-w-0">
                      <label
                        title="Firewall Network Tags (--network-tags)"
                        className="block text-[10.5px] font-mono text-zinc-500 mb-1 truncate whitespace-nowrap"
                      >
                        Network Tags
                      </label>
                      <input
                        type="text"
                        value={runVpcTags}
                        onChange={(e) => setRunVpcTags(e.target.value)}
                        placeholder="cloud-run-egress,internal-api"
                        className="w-full h-[34px] bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 2026 Cloud Run Storage Volume Mounts (Beta — `template.volumes` + `volumeMounts`) */}
              <div className="p-3 rounded-xl bg-amber-500/[0.05] border border-amber-500/30 space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                    <span className="text-[11px] font-extrabold font-mono uppercase tracking-wider text-amber-700 dark:text-amber-300">
                      2026 Cloud Run Attached Storage Volume Mounts
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-amber-500/20 text-amber-600 dark:text-amber-300">
                      BETA · Gen2 FUSE / RAM / NFS
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {runStorageVolumeType === 'NONE'
                      ? 'Stateless Container Filesystem'
                      : `Mounted at ${runStorageMountPath}`}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    {
                      id: 'NONE',
                      title: 'No Volume',
                      sub: 'Stateless container',
                    },
                    {
                      id: 'GCS_BUCKET',
                      title: 'Cloud Storage',
                      sub: `FUSE (${projectBuckets.length} buckets)`,
                    },
                    {
                      id: 'IN_MEMORY',
                      title: 'RAM Disk',
                      sub: 'In-memory /mnt/ramdisk',
                    },
                    {
                      id: 'NFS_FILESTORE',
                      title: 'NFS Filestore',
                      sub: 'POSIX NFSv3 over VPC',
                    },
                  ].map((volOpt) => {
                    const active = runStorageVolumeType === volOpt.id;
                    return (
                      <button
                        key={volOpt.id}
                        type="button"
                        onClick={() => handleSelectRunStorageType(volOpt.id)}
                        className={`p-2 rounded-[8px] border text-left transition-all cursor-pointer flex flex-col justify-between min-w-0 ${
                          active
                            ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300 shadow-sm'
                            : 'bg-white dark:bg-[#131314] border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <div className="text-[11px] font-bold font-mono truncate">
                          {volOpt.title}
                        </div>
                        <div className="text-[9.5px] text-zinc-500 mt-0.5 truncate">
                          {volOpt.sub}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {runStorageVolumeType === 'GCS_BUCKET' && (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end pt-1 border-t border-amber-500/20">
                    <div className="sm:col-span-2 min-w-0">
                      <label
                        title="Target Cloud Storage Bucket (gcs.bucket)"
                        className="block text-[10.5px] font-mono text-zinc-500 mb-1 truncate whitespace-nowrap"
                      >
                        Cloud Storage Bucket (`gcs.bucket`)
                      </label>
                      {projectBuckets.length > 0 ? (
                        <select
                          value={runStorageGcsBucket}
                          onChange={(e) =>
                            setRunStorageGcsBucket(e.target.value)
                          }
                          className="w-full h-[34px] bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                        >
                          {projectBuckets.map((b) => (
                            <option key={b} value={b}>
                              gs://{b}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={runStorageGcsBucket}
                          onChange={(e) =>
                            setRunStorageGcsBucket(e.target.value)
                          }
                          placeholder={`${projectId}-models-bucket`}
                          className="w-full h-[34px] bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                        />
                      )}
                    </div>

                    <div className="min-w-0">
                      <label
                        title="Container Mount Path (volumeMounts[].mountPath)"
                        className="block text-[10.5px] font-mono text-zinc-500 mb-1 truncate whitespace-nowrap"
                      >
                        Mount Path
                      </label>
                      <input
                        type="text"
                        value={runStorageMountPath}
                        onChange={(e) => setRunStorageMountPath(e.target.value)}
                        placeholder="/mnt/gcs"
                        className="w-full h-[34px] bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                      />
                    </div>

                    <div className="min-w-0">
                      <label
                        title="Mount Mode (gcs.readOnly)"
                        className="block text-[10.5px] font-mono text-zinc-500 mb-1 truncate whitespace-nowrap"
                      >
                        Access Mode
                      </label>
                      <button
                        type="button"
                        onClick={() => setRunStorageReadOnly((v) => !v)}
                        className={`w-full h-[34px] rounded-[8px] px-2.5 text-xs font-mono border text-left cursor-pointer truncate ${
                          runStorageReadOnly
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-300'
                            : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-300'
                        }`}
                      >
                        {runStorageReadOnly
                          ? 'Read-Only (RO)'
                          : 'Read-Write (RW)'}
                      </button>
                    </div>
                  </div>
                )}

                {runStorageVolumeType === 'IN_MEMORY' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end pt-1 border-t border-amber-500/20">
                    <div className="min-w-0">
                      <label
                        title="Volume Name (volumes[].name)"
                        className="block text-[10.5px] font-mono text-zinc-500 mb-1 truncate whitespace-nowrap"
                      >
                        Volume Name
                      </label>
                      <input
                        type="text"
                        value={runStorageVolumeName}
                        onChange={(e) =>
                          setRunStorageVolumeName(e.target.value)
                        }
                        className="w-full h-[34px] bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                      />
                    </div>

                    <div className="min-w-0">
                      <label
                        title="RAM Disk Size Limit (emptyDir.sizeLimit)"
                        className="block text-[10.5px] font-mono text-zinc-500 mb-1 truncate whitespace-nowrap"
                      >
                        RAM Size Limit
                      </label>
                      <select
                        value={runStorageMemorySizeLimit}
                        onChange={(e) =>
                          setRunStorageMemorySizeLimit(e.target.value)
                        }
                        className="w-full h-[34px] bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                      >
                        <option value="256Mi">256Mi RAM Disk</option>
                        <option value="512Mi">512Mi RAM Disk</option>
                        <option value="1Gi">1Gi RAM Disk</option>
                        <option value="2Gi">2Gi RAM Disk</option>
                        <option value="4Gi">4Gi RAM Disk</option>
                        <option value="8Gi">8Gi RAM Disk</option>
                      </select>
                    </div>

                    <div className="min-w-0">
                      <label
                        title="Container Mount Path (volumeMounts[].mountPath)"
                        className="block text-[10.5px] font-mono text-zinc-500 mb-1 truncate whitespace-nowrap"
                      >
                        Mount Path
                      </label>
                      <input
                        type="text"
                        value={runStorageMountPath}
                        onChange={(e) => setRunStorageMountPath(e.target.value)}
                        placeholder="/mnt/ramdisk"
                        className="w-full h-[34px] bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                )}

                {runStorageVolumeType === 'NFS_FILESTORE' && (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end pt-1 border-t border-amber-500/20">
                    <div className="min-w-0">
                      <label
                        title="NFS / Filestore Server IP (nfs.server)"
                        className="block text-[10.5px] font-mono text-zinc-500 mb-1 truncate whitespace-nowrap"
                      >
                        NFS Server IP
                      </label>
                      <input
                        type="text"
                        value={runStorageNfsServer}
                        onChange={(e) => setRunStorageNfsServer(e.target.value)}
                        placeholder="10.0.0.2"
                        className="w-full h-[34px] bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                      />
                    </div>

                    <div className="min-w-0">
                      <label
                        title="Export Path (nfs.path)"
                        className="block text-[10.5px] font-mono text-zinc-500 mb-1 truncate whitespace-nowrap"
                      >
                        Export Path
                      </label>
                      <input
                        type="text"
                        value={runStorageNfsPath}
                        onChange={(e) => setRunStorageNfsPath(e.target.value)}
                        placeholder="/vol1"
                        className="w-full h-[34px] bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                      />
                    </div>

                    <div className="min-w-0">
                      <label
                        title="Container Mount Path (volumeMounts[].mountPath)"
                        className="block text-[10.5px] font-mono text-zinc-500 mb-1 truncate whitespace-nowrap"
                      >
                        Mount Path
                      </label>
                      <input
                        type="text"
                        value={runStorageMountPath}
                        onChange={(e) => setRunStorageMountPath(e.target.value)}
                        placeholder="/mnt/nfs"
                        className="w-full h-[34px] bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                      />
                    </div>

                    <div className="min-w-0">
                      <label
                        title="Mount Mode (nfs.readOnly)"
                        className="block text-[10.5px] font-mono text-zinc-500 mb-1 truncate whitespace-nowrap"
                      >
                        Access Mode
                      </label>
                      <button
                        type="button"
                        onClick={() => setRunStorageReadOnly((v) => !v)}
                        className={`w-full h-[34px] rounded-[8px] px-2.5 text-xs font-mono border text-left cursor-pointer truncate ${
                          runStorageReadOnly
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-300'
                            : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-300'
                        }`}
                      >
                        {runStorageReadOnly
                          ? 'Read-Only (RO)'
                          : 'Read-Write (RW)'}
                      </button>
                    </div>
                  </div>
                )}
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
                  className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] py-[8px] text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100"
                />
              </div>
            </div>
          )}

          {serviceType === 'BIGQUERY_DATASET' && (() => {
            const isBqCustom = bqComplianceRegime === 'standard';
            const isSecFinra = bqComplianceRegime === 'sec-finra-ledger';
            const isGdprEu = bqComplianceRegime === 'gdpr-eu-sovereign';
            const isHipaa = bqComplianceRegime === 'hipaa-soc2- clinical';
            const isAiVector = bqComplianceRegime === 'ai-vector-biglake';

            // Enforced constraints per compliance blueprint:
            const lockPhysicalBilling = !isBqCustom; // All 4 regulatory/AI blueprints require Physical Compressed Billing
            const lockBankerRounding = isSecFinra; // SEC 17a-4 / FINRA requires ROUND_HALF_EVEN
            const lockTimeTravel168 = isSecFinra || isHipaa; // SEC & HIPAA require full 168h 7-day point-in-time audit trail
            const lockTimeTravelMax72 = isGdprEu; // GDPR data minimization caps time-travel at <= 72h (48h default)
            const minPartitionTtlDays = isSecFinra
              ? 2555
              : isHipaa
              ? 365
              : isGdprEu
              ? 30
              : 0;
            const maxPartitionTtlDays = isGdprEu ? 90 : 36500;

            return (
              <div className="space-y-4 border-t border-zinc-200 dark:border-zinc-800 pt-3">
                {/* 1-Tap Regulatory, Financial & AI Lakehouse Blueprints */}
                <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-500/[0.08] border border-blue-500/25 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>
                        1-Tap BigQuery Regulatory, FinOps & Lakehouse Blueprints (Strict Guardrail Enforcement)
                      </span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30">
                      {isBqCustom
                        ? 'Custom Mode: All Controls Unlocked'
                        : `Strict Enforcement Active: ${bqComplianceRegime.toUpperCase()}`}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                    {[
                      {
                        id: 'standard',
                        title: 'GCP Console Standard',
                        sub: 'All Options Unlocked · Custom Location & Billing',
                      },
                      {
                        id: 'sec-finra-ledger',
                        title: 'SEC 17a-4 / FINRA Ledger',
                        sub: 'Locks: US Only · Physical Billing · ROUND_HALF_EVEN · ≥7yr TTL · 168h TT',
                      },
                      {
                        id: 'gdpr-eu-sovereign',
                        title: 'GDPR EU Sovereign',
                        sub: 'Locks: EU Only (Blocks US/Asia) · Physical Billing · 30–90d Erasure TTL · ≤72h TT',
                      },
                      {
                        id: 'hipaa-soc2- clinical',
                        title: 'HIPAA / SOC2 Vault',
                        sub: 'Locks: BAA Region · Physical Billing · 168h Audit Time-Travel · ≥365d TTL',
                      },
                      {
                        id: 'ai-vector-biglake',
                        title: 'AI Vector & Iceberg',
                        sub: 'Locks: Single Region Co-Location · Physical 5x Compression · und:ci Collation',
                      },
                    ].map((bp) => {
                      const active = bqComplianceRegime === bp.id;
                      return (
                        <button
                          key={bp.id}
                          type="button"
                          onClick={() => applyBqCompliancePreset(bp.id)}
                          title={`Select ${bp.title} (${bp.sub})`}
                          className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                            active
                              ? 'bg-blue-500/15 border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm'
                              : 'bg-white dark:bg-[#131314] border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-blue-500/40'
                          }`}
                        >
                          <div className="text-[11px] font-bold font-mono flex items-center justify-between">
                            <span>{bp.title}</span>
                            {active && bp.id !== 'standard' && (
                              <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300">
                                LOCKED
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-500 mt-0.5 line-clamp-2">
                            {bp.sub}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Compliance Guardrail Summary Banner */}
                  {!isBqCustom && (
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-amber-800 dark:text-amber-300">
                      <div>
                        <strong>Active Regulatory Lock ({bqComplianceRegime.toUpperCase()}):</strong>{' '}
                        {isSecFinra &&
                          'Non-US regions, Logical uncompressed billing, Standard rounding, Time-Travel <168h, and Partition TTL <2555d (7 yrs) are strictly disabled.'}
                        {isGdprEu &&
                          'Non-EU regions (US/Asia), Logical billing, Time-Travel >72h, and Partition Retention >90 days (Right-to-Erasure violation) are strictly disabled.'}
                        {isHipaa &&
                          'Logical uncompressed billing, Time-Travel <168h, Case-Insensitive PHI collation, and Partition TTL <365d are strictly disabled.'}
                        {isAiVector &&
                          'Multi-Region high-latency placement, Logical uncompressed billing, and Case-Sensitive binary collation are strictly disabled.'}
                      </div>
                      <button
                        type="button"
                        onClick={() => applyBqCompliancePreset('standard')}
                        title="Switch to GCP Console Standard mode to unlock all options"
                        className="shrink-0 px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-[10px] font-bold cursor-pointer"
                      >
                        Switch to Custom Mode to Unlock
                      </button>
                    </div>
                  )}
                </div>

                {/* Step 1: Location Topology & 40-Region Sovereign Residency */}
                <div className="p-3.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 font-mono text-[10px]">
                        STEP 1
                      </span>
                      <span>Dataset Residency & Geo-Redundancy Topology</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {isGdprEu
                        ? 'GDPR Lock: Only EU Multi-Region or europe-* Single Regions permitted'
                        : isSecFinra
                        ? 'SEC/FINRA Lock: Only US Multi-Region or us-* Single Regions permitted'
                        : isAiVector
                        ? 'AI Vector Lock: Single Region required for low-latency GPU co-location'
                        : 'Immutable after creation · Choose Multi-Region (US/EU) or Single Region'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                        Residency Scope
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={isAiVector}
                          onClick={() => {
                            if (isAiVector) return;
                            setBqLocationType('MULTI_REGION');
                            if (isGdprEu) {
                              setBqLocation('EU');
                            } else if (isSecFinra || isHipaa) {
                              setBqLocation('US');
                            } else if (!['US', 'EU'].includes(bqLocation)) {
                              setBqLocation('US');
                            }
                          }}
                          title={
                            isAiVector
                              ? 'Disabled: AI Vector & Iceberg blueprint requires Single Region placement for low-latency GPU co-location'
                              : 'Multi-Region Continental Geo-Redundancy (US or EU)'
                          }
                          className={`p-2 rounded-lg border text-left text-xs font-mono transition-all ${
                            isAiVector
                              ? 'opacity-40 cursor-not-allowed border-zinc-200 dark:border-zinc-800 text-zinc-400'
                              : bqLocationType === 'MULTI_REGION'
                              ? 'bg-blue-500/15 border-blue-500 text-blue-700 dark:text-blue-300 font-bold cursor-pointer'
                              : 'bg-white dark:bg-[#131314] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 cursor-pointer'
                          }`}
                        >
                          {isAiVector ? '[LOCKED] ' : ''}MULTI_REGION (US / EU)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setBqLocationType('REGIONAL');
                            if (isGdprEu) {
                              if (!bqLocation.startsWith('europe-')) {
                                setBqLocation('europe-west4');
                              }
                            } else if (isSecFinra || isHipaa) {
                              if (!bqLocation.startsWith('us-')) {
                                setBqLocation('us-central1');
                              }
                            } else if (['US', 'EU'].includes(bqLocation)) {
                              setBqLocation('us-central1');
                            }
                          }}
                          title="Single Region Low-Latency Co-Location with Cloud Run & Compute VMs"
                          className={`p-2 rounded-lg border text-left text-xs font-mono transition-all cursor-pointer ${
                            bqLocationType === 'REGIONAL'
                              ? 'bg-blue-500/15 border-blue-500 text-blue-700 dark:text-blue-300 font-bold'
                              : 'bg-white dark:bg-[#131314] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                          }`}
                        >
                          SINGLE REGION (Sovereign)
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                        Target BigQuery Location (`--location={bqLocation}`)
                      </label>
                      {bqLocationType === 'MULTI_REGION' ? (
                        <select
                          value={bqLocation}
                          onChange={(e) => setBqLocation(e.target.value)}
                          className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-3 py-2 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                        >
                          <option
                            value="US"
                            disabled={isGdprEu}
                          >
                            {isGdprEu ? '[LOCKED] ' : ''}US Multi-Region (Continental United States · 99.99% SLA)
                            {isGdprEu ? ' — Blocked by GDPR EU Sovereignty' : ''}
                          </option>
                          <option
                            value="EU"
                            disabled={isSecFinra || isHipaa}
                          >
                            {isSecFinra || isHipaa ? '[LOCKED] ' : ''}EU Multi-Region (European Union Sovereign Member States · GDPR)
                            {isSecFinra || isHipaa ? ' — Blocked by US Regulatory Mandate' : ''}
                          </option>
                        </select>
                      ) : (
                        <select
                          value={bqLocation}
                          onChange={(e) => setBqLocation(e.target.value)}
                          className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-3 py-2 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                        >
                          {Object.entries(GCP_REGION_ZONES).map(
                            ([regKey, info]) => {
                              const blockedByGdpr =
                                isGdprEu && !regKey.startsWith('europe-');
                              const blockedByUsMandate =
                                (isSecFinra || isHipaa) &&
                                !regKey.startsWith('us-');
                              const isDisabled =
                                blockedByGdpr || blockedByUsMandate;
                              return (
                                <option
                                  key={regKey}
                                  value={regKey}
                                  disabled={isDisabled}
                                >
                                  {isDisabled ? '[LOCKED] ' : ''}
                                  {info.label}
                                  {blockedByGdpr
                                    ? ' (Blocked by GDPR EU Residency)'
                                    : blockedByUsMandate
                                    ? ' (Blocked by US Jurisdiction Mandate)'
                                    : ''}
                                </option>
                              );
                            }
                          )}
                        </select>
                      )}
                    </div>
                  </div>
                </div>

                {/* Step 2: 2026 Storage Billing Model (LOGICAL Uncompressed vs PHYSICAL Compressed Capacitor) */}
                <div className="p-3.5 rounded-xl bg-emerald-500/[0.04] dark:bg-emerald-950/15 border border-emerald-500/25 space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">
                        STEP 2
                      </span>
                      <span>
                        2026 Storage Billing Model (`storageBillingModel`)
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      {lockPhysicalBilling
                        ? `Enforced by ${bqComplianceRegime.toUpperCase()}: PHYSICAL Compressed Billing Required`
                        : 'Physical Billing shrinks high-compression analytical & JSON tables by 50%–75%'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setBqStorageBillingModel('PHYSICAL')}
                      title="Bill on compressed Capacitor bytes stored on disk ($0.04/GB active, $0.02/GB long-term) — saves 50%-75% on analytical tables with >2:1 compression ratio"
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        bqStorageBillingModel === 'PHYSICAL'
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-sm'
                          : 'bg-white dark:bg-[#131314] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono">
                          PHYSICAL (Compressed Bytes)
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold">
                          {lockPhysicalBilling
                            ? 'Enforced by Blueprint'
                            : 'Recommended (-54% Cost)'}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-1">
                        Billed on actual **Capacitor compressed bytes** on disk (`$0.04/GB` active · `$0.02/GB` 90d long-term) + time-travel delta. A 5:1 compressed table costs effectively **`$0.008/logical-GB`**!
                      </p>
                    </button>

                    <button
                      type="button"
                      disabled={lockPhysicalBilling}
                      onClick={() => {
                        if (!lockPhysicalBilling) {
                          setBqStorageBillingModel('LOGICAL');
                        }
                      }}
                      title={
                        lockPhysicalBilling
                          ? `Disabled: ${bqComplianceRegime.toUpperCase()} enforces PHYSICAL compressed storage billing. Switch to GCP Console Standard to unlock Logical billing.`
                          : 'Bill on uncompressed logical bytes ($0.02/GB active, $0.01/GB long-term)'
                      }
                      className={`p-3 rounded-xl border text-left transition-all ${
                        lockPhysicalBilling
                          ? 'opacity-40 cursor-not-allowed bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400'
                          : bqStorageBillingModel === 'LOGICAL'
                          ? 'bg-blue-500/15 border-blue-500 text-blue-800 dark:text-blue-300 shadow-sm cursor-pointer'
                          : 'bg-white dark:bg-[#131314] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono">
                          {lockPhysicalBilling ? '[LOCKED] ' : ''}LOGICAL (Uncompressed Bytes)
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-500/15 text-zinc-500">
                          {lockPhysicalBilling
                            ? 'Blocked by Compliance'
                            : 'Free Time-Travel Bytes'}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-1">
                        Billed on uncompressed logical table size (`$0.02/GB` active · `$0.01/GB` 90d long-term). Disabled under enterprise FinOps & regulatory blueprints.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Step 3: Time-Travel Window & Automated Table/Partition Lifecycle */}
                <div className="p-3.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 font-mono text-[10px]">
                        STEP 3
                      </span>
                      <span>
                        Time-Travel Recovery Window (`FOR SYSTEM_TIME AS OF`) & Lifecycle Expiration
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {lockTimeTravel168
                        ? 'Enforced: 168h (7-Day) Full Audit Time-Travel Window'
                        : lockTimeTravelMax72
                        ? 'GDPR Minimization: Time-Travel capped at ≤72h & Partition TTL 30–90d'
                        : 'Plus automatic 7-day Fail-Safe disaster recovery air-gap'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                        Time-Travel Window (`maxTimeTravelHours`)
                      </label>
                      <select
                        value={bqMaxTimeTravelHours}
                        disabled={lockTimeTravel168}
                        onChange={(e) =>
                          setBqMaxTimeTravelHours(Number(e.target.value))
                        }
                        title={
                          lockTimeTravel168
                            ? `Locked to 168 hours (7 days) by ${bqComplianceRegime.toUpperCase()} audit recovery mandate`
                            : 'Select BigQuery Time-Travel retention window (48h to 168h)'
                        }
                        className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-2 text-xs font-mono text-zinc-950 dark:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value={48} disabled={lockTimeTravel168}>
                          {lockTimeTravel168 ? '[LOCKED] ' : ''}48 Hours (2 Days · Min Physical Storage Overhead)
                        </option>
                        <option value={72} disabled={lockTimeTravel168}>
                          {lockTimeTravel168 ? '[LOCKED] ' : ''}72 Hours (3 Days · Balanced FinOps Recovery)
                        </option>
                        <option
                          value={120}
                          disabled={lockTimeTravel168 || lockTimeTravelMax72}
                        >
                          {lockTimeTravel168 || lockTimeTravelMax72 ? '[LOCKED] ' : ''}120 Hours (5 Days · Workweek Recovery)
                        </option>
                        <option
                          value={168}
                          disabled={lockTimeTravelMax72}
                        >
                          {lockTimeTravelMax72 ? '[LOCKED] ' : ''}168 Hours (7 Days · Maximum Point-in-Time Rewind)
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                        Default Partition TTL (
                        {minPartitionTtlDays > 0
                          ? `Range: ${minPartitionTtlDays}–${maxPartitionTtlDays}d`
                          : 'Days, 0 = Keep Forever'}
                        )
                      </label>
                      <input
                        type="number"
                        min={minPartitionTtlDays}
                        max={maxPartitionTtlDays}
                        value={bqDefaultPartitionExpirationDays}
                        onChange={(e) => {
                          const raw = Number(e.target.value || 0);
                          const clamped = Math.max(
                            minPartitionTtlDays,
                            Math.min(maxPartitionTtlDays, raw)
                          );
                          setBqDefaultPartitionExpirationDays(clamped);
                        }}
                        title={
                          minPartitionTtlDays > 0
                            ? `Enforced by ${bqComplianceRegime.toUpperCase()}: Partition TTL must be between ${minPartitionTtlDays} and ${maxPartitionTtlDays} days`
                            : 'Default partition expiration in days (0 = never expire)'
                        }
                        className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-2 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                        Default Table TTL (
                        {isSecFinra
                          ? 'Locked: 0 (No Auto-Drop)'
                          : isGdprEu
                          ? 'Max 365 Days'
                          : 'Days, 0 = Keep Forever'}
                        )
                      </label>
                      <input
                        type="number"
                        min={isGdprEu ? 30 : 0}
                        max={isGdprEu ? 365 : 36500}
                        disabled={isSecFinra}
                        value={bqDefaultTableExpirationDays}
                        onChange={(e) => {
                          const raw = Math.max(0, Number(e.target.value || 0));
                          setBqDefaultTableExpirationDays(
                            isGdprEu ? Math.min(365, Math.max(30, raw)) : raw
                          );
                        }}
                        title={
                          isSecFinra
                            ? 'Locked to 0 (Keep Tables) under SEC 17a-4 / FINRA so ledger tables cannot auto-drop'
                            : 'Default table expiration in days'
                        }
                        className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-2 text-xs font-mono text-zinc-950 dark:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Step 4: Financial Rounding Mode, Collation & Cloud KMS CMEK Encryption */}
                <div className="p-3.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono text-[10px]">
                        STEP 4
                      </span>
                      <span>
                        NUMERIC Rounding Mode, String Collation, Cloud KMS CMEK & Governance Labels
                      </span>
                    </div>
                    {lockBankerRounding && (
                      <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold">
                        SEC/FINRA Lock: ROUND_HALF_EVEN (Banker&apos;s Rounding) Enforced
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                        NUMERIC / BIGNUMERIC Rounding Mode
                      </label>
                      <select
                        value={bqDefaultRoundingMode}
                        disabled={lockBankerRounding}
                        onChange={(e) =>
                          setBqDefaultRoundingMode(e.target.value)
                        }
                        title={
                          lockBankerRounding
                            ? 'Locked to ROUND_HALF_EVEN (IEEE 754 Banker Rounding) by SEC 17a-4 / FINRA Financial Ledger compliance'
                            : 'Select default rounding mode for NUMERIC and BIGNUMERIC columns'
                        }
                        className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-2 text-xs font-mono text-zinc-950 dark:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option
                          value="ROUND_HALF_AWAY_FROM_ZERO"
                          disabled={lockBankerRounding}
                        >
                          {lockBankerRounding ? '[LOCKED] ' : ''}ROUND_HALF_AWAY_FROM_ZERO (Standard Arithmetic)
                        </option>
                        <option value="ROUND_HALF_EVEN">
                          ROUND_HALF_EVEN (IEEE 754 Banker&apos;s Rounding · GAAP/FINRA)
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                        Default String Collation
                      </label>
                      <select
                        value={bqDefaultCollation}
                        disabled={isSecFinra || isHipaa || isAiVector}
                        onChange={(e) => setBqDefaultCollation(e.target.value)}
                        title={
                          isSecFinra || isHipaa
                            ? 'Locked to Binary Case-Sensitive Collation for deterministic financial/clinical identifier matching'
                            : isAiVector
                            ? 'Locked to Unicode Case-Insensitive (und:ci) for natural-language AI search'
                            : 'Choose default string collation'
                        }
                        className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-2 text-xs font-mono text-zinc-950 dark:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="" disabled={isAiVector}>
                          {isAiVector ? '[LOCKED] ' : ''}Binary Case-Sensitive (`&apos;&apos;` · Exact ID Match)
                        </option>
                        <option
                          value="und:ci"
                          disabled={isSecFinra || isHipaa}
                        >
                          {isSecFinra || isHipaa ? '[LOCKED] ' : ''}Unicode Case-Insensitive (`und:ci` · Human Search)
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                        Encryption Key Management
                      </label>
                      <select
                        value={bqEncryptionType}
                        onChange={(e) => setBqEncryptionType(e.target.value)}
                        className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-2 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                      >
                        <option value="GOOGLE_MANAGED">
                          Google-Managed AES-256 Envelope Key
                        </option>
                        <option value="CMEK">
                          Cloud KMS Customer-Managed Key (CMEK)
                        </option>
                      </select>
                    </div>
                  </div>

                  {bqEncryptionType === 'CMEK' && (
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                        Cloud KMS CryptoKey Resource Path (`defaultEncryptionConfiguration.kmsKeyName`)
                      </label>
                      <input
                        type="text"
                        value={bqCmekKeyName}
                        onChange={(e) => setBqCmekKeyName(e.target.value)}
                        placeholder={`projects/${projectId}/locations/${bqLocation.toLowerCase()}/keyRings/bq-vault/cryptoKeys/lakehouse-key`}
                        className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-3 py-2 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                        Custom FinOps & Governance Labels (`datacloud=antigravity` auto-enforced)
                      </label>
                      <input
                        type="text"
                        value={bqCustomLabels}
                        onChange={(e) => setBqCustomLabels(e.target.value)}
                        placeholder="env=production,domain=analytics,cost_center=finops"
                        className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-3 py-2 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                        Dataset Governance Description
                      </label>
                      <input
                        type="text"
                        value={bqDescription}
                        onChange={(e) => setBqDescription(e.target.value)}
                        className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-3 py-2 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {serviceType === 'GKE_CLUSTER' && (() => {
            const isSecGke = gkeComplianceRegime === 'sec-fedramp-gke';
            const isGdprGke = gkeComplianceRegime === 'gdpr-eu-gke';
            const isHipaaGke = gkeComplianceRegime === 'hipaa-clinical-gke';
            const isAiGpuGke = gkeComplianceRegime === 'ai-gpu-cluster';
            const isZeroTrustEnclave = isSecGke || isGdprGke || isHipaaGke;

            const lockModeAutopilot = isZeroTrustEnclave;
            const lockModeStandard = isAiGpuGke;
            const lockPrivateNodesOn = isZeroTrustEnclave;
            const lockWorkloadIdentityOn = isZeroTrustEnclave || isAiGpuGke;
            const lockBinaryAuthOn = isZeroTrustEnclave;
            const lockStableChannel = isSecGke || isHipaaGke;

            const allowedGkeRegions = Object.entries(GCP_REGION_ZONES).filter(
              ([regKey]) => {
                if (isGdprGke) return regKey.startsWith('europe-');
                if (isSecGke || isHipaaGke) return regKey.startsWith('us-');
                return true;
              }
            );

            return (
              <div className="space-y-4">
                {/* STEP 0: 1-Click GKE Sovereign & AI Cluster Compliance Blueprints */}
                <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-500/[0.08] border border-blue-500/30 space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                      <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                        Step 0 · 2026 GKE Sovereign & AI Cluster Compliance Blueprints
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30 font-bold">
                      {gkeComplianceRegime === 'custom'
                        ? 'UNLOCKED CUSTOM ARCHITECTURE'
                        : `ENFORCING ${gkeComplianceRegime.toUpperCase()}`}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                    {[
                      {
                        id: 'sec-fedramp-gke',
                        title: 'SEC / FedRAMP Enclave',
                        sub: 'Autopilot · Private Nodes · BinaryAuth · STABLE · US',
                      },
                      {
                        id: 'gdpr-eu-gke',
                        title: 'GDPR EU Sovereign',
                        sub: 'Autopilot · EU Residency Lock · Workload ID · BinaryAuth',
                      },
                      {
                        id: 'hipaa-clinical-gke',
                        title: 'HIPAA Clinical K8s',
                        sub: 'Autopilot · Shielded + Private Nodes · STABLE · US BAA',
                      },
                      {
                        id: 'ai-gpu-cluster',
                        title: 'AI / Spot GPU Cluster',
                        sub: 'Standard Mode · g2-standard-4 (NVIDIA L4) · Spot -68%',
                      },
                      {
                        id: 'custom',
                        title: 'Custom Mode (Unlocked)',
                        sub: 'Full manual control over Autopilot vs Standard & GPUs',
                      },
                    ].map((preset) => {
                      const active = gkeComplianceRegime === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => applyGkeCompliancePreset(preset.id)}
                          title={`Activate ${preset.title}: ${preset.sub}`}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            active
                              ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                              : 'bg-white dark:bg-[#131314] border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:border-blue-500/50'
                          }`}
                        >
                          <div className="text-[11px] font-extrabold flex items-center justify-between gap-1">
                            <span className="truncate">{preset.title}</span>
                            {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                          </div>
                          <div
                            className={`text-[10px] mt-0.5 line-clamp-2 ${
                              active
                                ? 'text-blue-100'
                                : 'text-zinc-500 dark:text-zinc-400'
                            }`}
                          >
                            {preset.sub}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* STEP 1: GKE Architecture Mode (Autopilot vs Standard Node Pool) */}
                <div className="p-3.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                      Step 1 · Control Plane & Operation Mode (`autopilot.enabled`)
                    </span>
                    <span className="text-[10px] font-mono text-emerald-500 font-bold">
                      $74.40/mo GKE Free Tier Credit Included
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      disabled={lockModeStandard}
                      onClick={() => !lockModeStandard && setGkeMode('AUTOPILOT')}
                      title={
                        lockModeStandard
                          ? 'Locked by AI / Spot GPU Blueprint: Direct GPU node pool tuning requires GKE Standard mode'
                          : 'Google manages all nodes, security hardening, and auto-provisioning. Billed strictly per running Pod vCPU/GiB.'
                      }
                      className={`p-3 rounded-xl border text-left transition-all ${
                        lockModeStandard
                          ? 'opacity-45 cursor-not-allowed border-zinc-200 dark:border-zinc-800'
                          : gkeMode === 'AUTOPILOT'
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 cursor-pointer shadow-sm'
                          : 'bg-white dark:bg-[#131314] border-zinc-200 dark:border-zinc-800 cursor-pointer hover:border-emerald-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold">
                          GKE Autopilot (Serverless K8s · Zero Idle Node Cost)
                        </span>
                        {lockModeStandard && <span>[LOCKED]</span>}
                      </div>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                        $0.00/hr empty cluster · Google manages nodes, Seccomp, Shielded VMs & Workload Identity automatically.
                      </p>
                    </button>

                    <button
                      type="button"
                      disabled={lockModeAutopilot}
                      onClick={() => !lockModeAutopilot && setGkeMode('STANDARD')}
                      title={
                        lockModeAutopilot
                          ? `Locked by ${gkeComplianceRegime.toUpperCase()}: Zero-Trust Enclaves require GKE Autopilot immutable node hardening`
                          : 'Full control over GCE machine types, Spot VM discounts (-68%), and dedicated NVIDIA L4 / T4 / A100 GPUs.'
                      }
                      className={`p-3 rounded-xl border text-left transition-all ${
                        lockModeAutopilot
                          ? 'opacity-45 cursor-not-allowed border-zinc-200 dark:border-zinc-800'
                          : gkeMode === 'STANDARD'
                          ? 'bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-300 cursor-pointer shadow-sm'
                          : 'bg-white dark:bg-[#131314] border-zinc-200 dark:border-zinc-800 cursor-pointer hover:border-blue-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold">
                          GKE Standard (Custom Node Pools + Spot GPUs)
                        </span>
                        {lockModeAutopilot && <span>[LOCKED]</span>}
                      </div>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                        Direct control over `initialNodeCount`, `Spot VM (-68%)`, and `NVIDIA L4 / T4 / A100` GPU accelerators.
                      </p>
                    </button>
                  </div>
                </div>

                {/* STEP 2: Region Sovereignty, Release Channel & VPC Network */}
                <div className="p-3.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 block">
                    Step 2 · Regional Control Plane Sovereignty & Release Channel
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                        GKE Cluster Region {isGdprGke ? '(EU Only)' : isSecGke || isHipaaGke ? '(US Only)' : ''}
                      </label>
                      <select
                        value={gkeLocation}
                        onChange={(e) => setGkeLocation(e.target.value)}
                        className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-2 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                      >
                        {allowedGkeRegions.map(([regKey, info]) => (
                          <option key={regKey} value={regKey}>
                            {info.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                        K8s Release Channel (`releaseChannel.channel`)
                      </label>
                      <select
                        value={gkeReleaseChannel}
                        disabled={lockStableChannel}
                        onChange={(e) => setGkeReleaseChannel(e.target.value)}
                        title={
                          lockStableChannel
                            ? 'Locked to STABLE channel by SEC/HIPAA compliance regime'
                            : 'Select Kubernetes control plane upgrade cadence'
                        }
                        className={`w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-2 text-xs font-mono text-zinc-950 dark:text-zinc-100 ${
                          lockStableChannel ? 'opacity-60 cursor-not-allowed' : ''
                        }`}
                      >
                        <option value="RAPID">RAPID (Newest K8s + AI/GPU Features)</option>
                        <option value="REGULAR">REGULAR (Recommended Production)</option>
                        <option value="STABLE">STABLE (Mission-Critical Regulated)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                        VPC Network (`IP_ALIASES` VPC-Native)
                      </label>
                      <input
                        type="text"
                        value={gkeNetwork}
                        onChange={(e) => setGkeNetwork(e.target.value)}
                        placeholder="default"
                        className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-2 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                </div>

                {/* STEP 3: Standard Mode Node Pool & GPU Accelerators (Shown when STANDARD is active) */}
                {gkeMode === 'STANDARD' && (
                  <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/25 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-300">
                        Step 3 · Standard Node Pool Sizing, Spot VMs & NVIDIA GPUs
                      </span>
                      <span className="text-[10px] font-mono text-emerald-500 font-bold">
                        {gkeSpotNodes ? 'SPOT PREEMPTIBLE (-68% OFF)' : 'STANDARD ON-DEMAND'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                          Node Machine Type
                        </label>
                        <select
                          value={gkeNodeMachineType}
                          onChange={(e) => setGkeNodeMachineType(e.target.value)}
                          className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-2 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                        >
                          <option value="e2-medium">e2-medium (2 vCPU · 4GB)</option>
                          <option value="e2-standard-2">e2-standard-2 (2 vCPU · 8GB)</option>
                          <option value="e2-standard-4">e2-standard-4 (4 vCPU · 16GB)</option>
                          <option value="n2-standard-4">n2-standard-4 (4 vCPU · 16GB)</option>
                          <option value="c3-standard-4">c3-standard-4 (4 vCPU Gen3 · 16GB)</option>
                          <option value="g2-standard-4">g2-standard-4 (4 vCPU · 16GB · L4 GPU)</option>
                          <option value="g2-standard-8">g2-standard-8 (8 vCPU · 32GB · L4 GPU)</option>
                          <option value="a2-highgpu-1g">a2-highgpu-1g (12 vCPU · 85GB · A100)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                          Initial Node Count (`1-12`)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={12}
                          value={gkeInitialNodeCount}
                          onChange={(e) =>
                            setGkeInitialNodeCount(
                              Math.max(1, Math.min(12, Number(e.target.value) || 1))
                            )
                          }
                          className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-2 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                          GPU Accelerator (`accelerators`)
                        </label>
                        <select
                          value={gkeGpuAcceleratorType}
                          onChange={(e) => setGkeGpuAcceleratorType(e.target.value)}
                          className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-2 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                        >
                          <option value="NONE">None (CPU-Only Nodes)</option>
                          <option value="nvidia-l4">NVIDIA L4 (24GB Ada Lovelace)</option>
                          <option value="nvidia-tesla-t4">NVIDIA Tesla T4 (16GB Inference)</option>
                          <option value="nvidia-a100-80gb">NVIDIA A100 (80GB HBM2e Training)</option>
                        </select>
                      </div>

                      <div className="flex flex-col justify-end">
                        <label className="flex items-center gap-2 p-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={gkeSpotNodes}
                            onChange={(e) => setGkeSpotNodes(e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                            Spot Nodes (-68% FinOps)
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: Zero-Trust Security Enclave Locks (Workload Identity, Private Nodes, Shielded Nodes, Binary Auth) */}
                <div className="p-3.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 block">
                    Step 4 · Zero-Trust K8s Enclave Hardening (Strict Compliance Locks)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <label
                      title={
                        lockWorkloadIdentityOn
                          ? `Enforced by ${gkeComplianceRegime.toUpperCase()}: Workload Identity OIDC federation is mandatory to eliminate static JSON service account keys.`
                          : 'Bind Kubernetes ServiceAccounts directly to Google Cloud IAM roles via OIDC.'
                      }
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border ${
                        lockWorkloadIdentityOn
                          ? 'bg-emerald-500/5 border-emerald-500/30 cursor-not-allowed'
                          : 'bg-white dark:bg-[#131314] border-zinc-200 dark:border-zinc-800 cursor-pointer'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={gkeEnableWorkloadIdentity}
                        disabled={lockWorkloadIdentityOn}
                        onChange={(e) =>
                          !lockWorkloadIdentityOn &&
                          setGkeEnableWorkloadIdentity(e.target.checked)
                        }
                        className="mt-0.5 rounded"
                      />
                      <div className="text-xs">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          <span>Workload Identity Federation (`{projectId}.svc.id.goog`)</span>
                          {lockWorkloadIdentityOn && <span>[LOCKED]</span>}
                        </div>
                        <p className="text-[10px] text-zinc-500">
                          Eliminates static SA keys; Pods authenticate via short-lived OIDC tokens.
                        </p>
                      </div>
                    </label>

                    <label
                      title={
                        lockPrivateNodesOn
                          ? `Enforced by ${gkeComplianceRegime.toUpperCase()}: Worker nodes must not have public RFC-1918 external IPv4 addresses.`
                          : 'Provision worker nodes with internal RFC-1918 IPs only (no public internet exposure).'
                      }
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border ${
                        lockPrivateNodesOn
                          ? 'bg-emerald-500/5 border-emerald-500/30 cursor-not-allowed'
                          : 'bg-white dark:bg-[#131314] border-zinc-200 dark:border-zinc-800 cursor-pointer'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={gkeEnablePrivateNodes}
                        disabled={lockPrivateNodesOn}
                        onChange={(e) =>
                          !lockPrivateNodesOn &&
                          setGkeEnablePrivateNodes(e.target.checked)
                        }
                        className="mt-0.5 rounded"
                      />
                      <div className="text-xs">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          <span>Private Cluster Nodes (`enablePrivateNodes`)</span>
                          {lockPrivateNodesOn && <span>[LOCKED]</span>}
                        </div>
                        <p className="text-[10px] text-zinc-500">
                          Isolates worker nodes from public internet ingress (RFC-1918 only).
                        </p>
                      </div>
                    </label>

                    <label
                      title={
                        lockBinaryAuthOn
                          ? `Enforced by ${gkeComplianceRegime.toUpperCase()}: Only cryptographically attested container images may run.`
                          : 'Require cryptographic Binary Authorization attestations before Pod admission.'
                      }
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border ${
                        lockBinaryAuthOn
                          ? 'bg-emerald-500/5 border-emerald-500/30 cursor-not-allowed'
                          : 'bg-white dark:bg-[#131314] border-zinc-200 dark:border-zinc-800 cursor-pointer'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={gkeEnableBinaryAuth}
                        disabled={lockBinaryAuthOn}
                        onChange={(e) =>
                          !lockBinaryAuthOn && setGkeEnableBinaryAuth(e.target.checked)
                        }
                        className="mt-0.5 rounded"
                      />
                      <div className="text-xs">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          <span>Binary Authorization SLSA Gatekeeper (`PROJECT_SINGLETON_POLICY_ENFORCE`)</span>
                          {lockBinaryAuthOn && <span>[LOCKED]</span>}
                        </div>
                        <p className="text-[10px] text-zinc-500">
                          Blocks unsigned or unverified container images at admission time.
                        </p>
                      </div>
                    </label>

                    <label
                      title="Enforces vTPM Secure Boot and kernel integrity monitoring across all GKE worker nodes."
                      className="flex items-start gap-2.5 p-2.5 rounded-xl border bg-emerald-500/5 border-emerald-500/30 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={gkeEnableShieldedNodes}
                        disabled={isZeroTrustEnclave}
                        onChange={(e) =>
                          !isZeroTrustEnclave &&
                          setGkeEnableShieldedNodes(e.target.checked)
                        }
                        className="mt-0.5 rounded"
                      />
                      <div className="text-xs">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          <span>Shielded GKE Nodes (`enableSecureBoot` + `vTPM`)</span>
                          {isZeroTrustEnclave && <span>[LOCKED]</span>}
                        </div>
                        <p className="text-[10px] text-zinc-500">
                          Cryptographically verifies boot loader & kernel integrity against rootkits.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            );
          })()}

          {serviceType === 'CLOUD_SQL' && (() => {
            const isSqlCustom = sqlComplianceRegime === 'custom';
            const isSqlGdpr = sqlComplianceRegime === 'gdpr-eu-db';
            const isSqlUsOnly =
              sqlComplianceRegime === 'pci-sec-ledger' ||
              sqlComplianceRegime === 'hipaa-clinical-db' ||
              sqlComplianceRegime === 'ai-vector-alloydb';
            const lockAlloyDbOnly = sqlComplianceRegime === 'ai-vector-alloydb';
            const lockPrivateNet = !isSqlCustom || sqlArchitecture === 'ALLOYDB';
            const lockRegionalHa = !isSqlCustom || sqlArchitecture === 'ALLOYDB';
            const lockMtls =
              sqlComplianceRegime === 'pci-sec-ledger' ||
              sqlComplianceRegime === 'hipaa-clinical-db';

            return (
              <div className="space-y-4">
                {/* STEP 0: Compliance Blueprint Presets */}
                <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-500/[0.08] border border-blue-500/30 space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                      Step 0 · Database Compliance Blueprint (MySQL 8.4 · PostgreSQL 16 · AlloyDB)
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      Enforces strict compliance locks () on Engine, Architecture, Region & PITR
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                    {[
                      {
                        id: 'pci-sec-ledger',
                        title: 'PCI / SEC Ledger',
                        badge: 'mTLS + 35d PITR',
                        sub: 'Locks US + Regional HA + Private IP + mTLS',
                      },
                      {
                        id: 'gdpr-eu-db',
                        title: 'GDPR EU DB',
                        badge: 'EU ONLY',
                        sub: 'Locks europe-* residency + Private VPC + HA',
                      },
                      {
                        id: 'hipaa-clinical-db',
                        title: 'HIPAA Clinical',
                        badge: 'BAA + 30d PITR',
                        sub: 'Locks US BAA + Regional HA + mTLS + 30d PITR',
                      },
                      {
                        id: 'ai-vector-alloydb',
                        title: 'AI Vector AlloyDB',
                        badge: 'ScaNN + Columnar',
                        sub: 'Locks Postgres 16 + AlloyDB + ScaNN Vector',
                      },
                      {
                        id: 'custom',
                        title: 'Custom Mode',
                        badge: 'UNLOCKED',
                        sub: 'Full manual control over MySQL/Postgres/AlloyDB',
                      },
                    ].map((preset) => {
                      const active = sqlComplianceRegime === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => applySqlCompliancePreset(preset.id)}
                          className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                            active
                              ? 'bg-blue-600/15 border-blue-500 shadow-sm'
                              : 'bg-white dark:bg-[#131314] border-zinc-200 dark:border-zinc-800 hover:border-blue-500/40'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100">
                              {preset.title}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500/20 text-blue-600 dark:text-blue-300">
                              {preset.badge}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-500 leading-snug">
                            {preset.sub}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* STEP 1: Engine Family (PostgreSQL vs MySQL) & Architecture Fork (Classic Cloud SQL vs AlloyDB) */}
                <div className="p-3.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 block">
                    Step 1 · Relational Engine Family & PostgreSQL Architecture Fork (Cloud SQL vs. AlloyDB)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleSelectModalSqlEngine('POSTGRES')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        sqlEngineFamily === 'POSTGRES'
                          ? 'bg-blue-600/15 border-blue-500 text-zinc-900 dark:text-zinc-100'
                          : 'bg-white dark:bg-[#131314] border-zinc-200 dark:border-zinc-800 text-zinc-500'
                      }`}
                    >
                      <div className="text-xs font-extrabold flex items-center justify-between">
                        <span>PostgreSQL (16 / 17 / 15)</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                          Unlocks Cloud SQL + AlloyDB
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-1">
                        Choose between Classic / Enterprise Plus Cloud SQL or Google Cloud AlloyDB (4x faster OLTP + 100x Analytical Columnar Engine).
                      </p>
                    </button>

                    <button
                      type="button"
                      disabled={lockAlloyDbOnly}
                      onClick={() => handleSelectModalSqlEngine('MYSQL')}
                      title={
                        lockAlloyDbOnly
                          ? 'AI Vector AlloyDB blueprint requires PostgreSQL 16 (`alloydb_scann`). Switch to Custom Mode to select MySQL.'
                          : 'Select MySQL 8.4 LTS or 8.0 on Cloud SQL'
                      }
                      className={`p-3 rounded-xl border text-left transition-all ${
                        lockAlloyDbOnly
                          ? 'opacity-45 cursor-not-allowed bg-zinc-100 dark:bg-zinc-900/40 border-zinc-300 dark:border-zinc-800'
                          : sqlEngineFamily === 'MYSQL'
                          ? 'bg-blue-600/15 border-blue-500 text-zinc-900 dark:text-zinc-100 cursor-pointer'
                          : 'bg-white dark:bg-[#131314] border-zinc-200 dark:border-zinc-800 text-zinc-500 cursor-pointer'
                      }`}
                    >
                      <div className="text-xs font-extrabold flex items-center justify-between">
                        <span>MySQL (8.4 LTS / 8.0) {lockAlloyDbOnly ? '[LOCKED]' : ''}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                          Cloud SQL Dedicated
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-1">
                        Managed Cloud SQL for MySQL with InnoDB Group Replication, 128 GB Data Cache, and MySQL 8.4 native `VECTOR` search.
                      </p>
                    </button>
                  </div>

                  {/* Architecture Fork (Classic Cloud SQL vs AlloyDB) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <button
                      type="button"
                      disabled={lockAlloyDbOnly}
                      onClick={() => handleSelectModalSqlArchitecture('CLOUD_SQL')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        lockAlloyDbOnly
                          ? 'opacity-45 cursor-not-allowed bg-zinc-100 dark:bg-zinc-900/40 border-zinc-300 dark:border-zinc-800'
                          : sqlArchitecture === 'CLOUD_SQL'
                          ? 'bg-blue-600/15 border-blue-500 text-zinc-900 dark:text-zinc-100 cursor-pointer'
                          : 'bg-white dark:bg-[#131314] border-zinc-200 dark:border-zinc-800 text-zinc-500 cursor-pointer'
                      }`}
                    >
                      <div className="text-xs font-extrabold flex items-center justify-between">
                        <span>Classic / Enterprise Plus Cloud SQL {lockAlloyDbOnly ? '[LOCKED]' : ''}</span>
                        <span className="text-[10px] font-mono text-blue-400">sqladmin.googleapis.com</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-1">
                        Traditional VM + Regional Persistent Disk architecture for both PostgreSQL and MySQL workloads.
                      </p>
                    </button>

                    <button
                      type="button"
                      disabled={sqlEngineFamily === 'MYSQL'}
                      onClick={() => handleSelectModalSqlArchitecture('ALLOYDB')}
                      title={
                        sqlEngineFamily === 'MYSQL'
                          ? 'Google Cloud AlloyDB is a 100% PostgreSQL-compatible engine. Switch Engine Family to PostgreSQL to unlock AlloyDB.'
                          : 'Select Google Cloud AlloyDB Disaggregated Colossus + Columnar + ScaNN Architecture'
                      }
                      className={`p-3 rounded-xl border text-left transition-all ${
                        sqlEngineFamily === 'MYSQL'
                          ? 'opacity-45 cursor-not-allowed bg-zinc-100 dark:bg-zinc-900/40 border-zinc-300 dark:border-zinc-800'
                          : sqlArchitecture === 'ALLOYDB'
                          ? 'bg-blue-600/15 border-blue-500 text-zinc-900 dark:text-zinc-100 cursor-pointer'
                          : 'bg-white dark:bg-[#131314] border-zinc-200 dark:border-zinc-800 text-zinc-500 cursor-pointer'
                      }`}
                    >
                      <div className="text-xs font-extrabold flex items-center justify-between">
                        <span>
                          Google Cloud AlloyDB (PostgreSQL) {sqlEngineFamily === 'MYSQL' ? '[LOCKED]' : ''}
                        </span>
                        <span className="text-[10px] font-mono text-blue-400">alloydb.googleapis.com</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-1">
                        {sqlEngineFamily === 'MYSQL'
                          ? 'Disabled because MySQL is selected. Switch to PostgreSQL to unlock AlloyDB.'
                          : 'Disaggregated Colossus log-structured storage, 4x faster OLTP, 100x Columnar Engine & ScaNN Vector Index.'}
                      </p>
                    </button>
                  </div>
                </div>

                {/* STEP 2: Version, Tier, Sovereign Region & Strict Compliance Locks */}
                <div className="p-3.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 block">
                    Step 2 · Engine Version, Compute Tier, Sovereign Region & Zero-Trust Locks
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                        Engine Version
                      </label>
                      <select
                        value={sqlDatabaseVersion}
                        onChange={(e) => setSqlDatabaseVersion(e.target.value)}
                        className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-2 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                      >
                        {sqlEngineFamily === 'POSTGRES' ? (
                          <>
                            <option value="POSTGRES_16">POSTGRES_16 (Recommended LTS)</option>
                            <option value="POSTGRES_17">POSTGRES_17 (2026 Latest)</option>
                            <option value="POSTGRES_15">POSTGRES_15</option>
                          </>
                        ) : (
                          <>
                            <option value="MYSQL_8_4">MYSQL_8_4 (LTS · Native VECTOR)</option>
                            <option value="MYSQL_8_0">MYSQL_8_0</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                        Sovereign Region {!isSqlCustom ? '[LOCKED]' : ''}
                      </label>
                      <select
                        value={sqlRegion}
                        onChange={(e) => setSqlRegion(e.target.value)}
                        className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-2 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                      >
                        <option value="us-central1" disabled={isSqlGdpr}>
                          {isSqlGdpr ? '[LOCKED] ' : ''}us-central1 (Iowa — US SEC/HIPAA)
                        </option>
                        <option value="us-east4" disabled={isSqlGdpr}>
                          {isSqlGdpr ? '[LOCKED] ' : ''}us-east4 (Virginia — US Financial)
                        </option>
                        <option value="europe-west1" disabled={isSqlUsOnly}>
                          {isSqlUsOnly ? '[LOCKED] ' : ''}europe-west1 (Belgium — EU GDPR)
                        </option>
                        <option value="europe-west3" disabled={isSqlUsOnly}>
                          {isSqlUsOnly ? '[LOCKED] ' : ''}europe-west3 (Frankfurt — EU BaFin)
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                        Compute Machine Tier
                      </label>
                      <select
                        value={sqlTier}
                        onChange={(e) => setSqlTier(e.target.value)}
                        className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-2 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                      >
                        {sqlArchitecture === 'ALLOYDB' ? (
                          <>
                            <option value="alloydb-2vcpu-16gb">AlloyDB 2 vCPU · 16 GB RAM</option>
                            <option value="alloydb-4vcpu-32gb">AlloyDB 4 vCPU · 32 GB RAM</option>
                            <option value="alloydb-8vcpu-64gb">AlloyDB 8 vCPU · 64 GB RAM</option>
                          </>
                        ) : (
                          <>
                            <option value="db-perf-optimized-N-2">Enterprise Plus 2 vCPU · 16 GB</option>
                            <option value="db-perf-optimized-N-4">Enterprise Plus 4 vCPU · 32 GB</option>
                            <option value="db-custom-2-8192">Enterprise 2 vCPU · 8 GB</option>
                            <option value="db-f1-micro">Shared Dev db-f1-micro</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                        High-Availability Topology {lockRegionalHa ? '[LOCKED]' : ''}
                      </label>
                      <select
                        value={sqlAvailabilityType}
                        disabled={lockRegionalHa}
                        onChange={(e) => setSqlAvailabilityType(e.target.value)}
                        className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-2 text-xs font-mono text-zinc-950 dark:text-zinc-100 disabled:opacity-60"
                      >
                        <option value="REGIONAL">REGIONAL (Multi-Zone Automatic Failover)</option>
                        <option value="ZONAL" disabled={lockRegionalHa}>
                          ZONAL (Single Zone — Forbidden by SLA)
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                        Network Exposure {lockPrivateNet ? '[LOCKED]' : ''}
                      </label>
                      <select
                        value={sqlNetworkMode}
                        disabled={lockPrivateNet}
                        onChange={(e) => setSqlNetworkMode(e.target.value)}
                        className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-2 text-xs font-mono text-zinc-950 dark:text-zinc-100 disabled:opacity-60"
                      >
                        <option value="PRIVATE_VPC_ONLY">Private VPC Peering Only (--no-assign-ip)</option>
                        <option value="PUBLIC_IPV4" disabled={lockPrivateNet}>
                          Public IPv4 (Blocked by Zero-Trust)
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                        TLS / mTLS Mode {lockMtls ? '[LOCKED]' : ''}
                      </label>
                      <select
                        value={sqlSslMode}
                        disabled={lockMtls}
                        onChange={(e) => setSqlSslMode(e.target.value)}
                        className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-2 text-xs font-mono text-zinc-950 dark:text-zinc-100 disabled:opacity-60"
                      >
                        <option value="TRUSTED_CLIENT_CERTIFICATE_REQUIRED">
                          TRUSTED_CLIENT_CERTIFICATE_REQUIRED (Strict mTLS)
                        </option>
                        <option value="ENCRYPTED_ONLY" disabled={lockMtls}>
                          {lockMtls ? '[LOCKED] ' : ''}ENCRYPTED_ONLY (TLS 1.3 Required)
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 2026 Live Pre-Deploy FinOps Price Calculator */}
          <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-500/[0.06] border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Live Pre-Deploy FinOps Cost Calculator
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                  {liveCostEstimate.badge}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                {liveCostEstimate.detail}
              </p>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <div className="text-[10px] font-mono uppercase text-zinc-500">
                  Est. Hourly Burn
                </div>
                <div className="text-sm font-black font-mono text-zinc-900 dark:text-white">
                  ${liveCostEstimate.hourly.toFixed(4)}
                  <span className="text-[10px] font-normal text-zinc-500">/hr</span>
                </div>
              </div>
              <div className="text-right pl-3 border-l border-zinc-300 dark:border-zinc-800">
                <div className="text-[10px] font-mono uppercase text-zinc-500">
                  Est. Monthly (730h)
                </div>
                <div className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                  ${liveCostEstimate.monthly.toFixed(2)}
                  <span className="text-[10px] font-normal text-zinc-500">/mo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Live gcloud CLI Equivalent Preview */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 space-y-1.5">
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
            <pre className="text-xs font-mono text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap break-all">
              $ {gcloudPreview}
            </pre>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-500 leading-relaxed">
              <strong>Google Cloud API Response:</strong> {errorMsg}
            </div>
          )}

            <div className="sticky bottom-0 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 pb-1 border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#202124]/95 backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <ShieldCheck className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <span>Direct Live GCP API Execution ({projectId})</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-white dark:bg-[#202124] hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-[8px] px-[16px] py-[8px] text-xs font-[500] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !name.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] px-[18px] py-[8px] text-xs font-[700] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submitting
                    ? 'Creating on Google Cloud...'
                    : `Create ${
                        SERVICE_TABS.find((s) => s.id === serviceType)?.label
                      }`}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
