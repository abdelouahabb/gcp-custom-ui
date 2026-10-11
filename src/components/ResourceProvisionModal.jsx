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
    return `lakehouse_${suffix}`;
  };

  useEffect(() => {
    if (isOpen) {
      setServiceType(initialServiceType);
      setName(generateDefaultName(initialServiceType, projectId));
      if (initialLocation?.region) {
        setRegion(initialLocation.region);
        setVmRegion(initialLocation.region);
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
    }
  }, [isOpen, initialServiceType, initialLocation, projectId]);

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
      return `gcloud run deploy ${clean} --project=${projectId} --region=${region} --image=${containerImage} --port=${runPort} --cpu=${runCpu} --memory=${runMemory}${gpuFlags} --min-instances=${runMinInstances} --max-instances=${runMaxInstances} --concurrency=${runConcurrency} --timeout=${runTimeout}s --ingress=${ingressFlag} --execution-environment=${
        runExecEnv === 'EXECUTION_ENVIRONMENT_GEN2' ? 'gen2' : 'gen1'
      } ${billingFlag} ${
        runAllowUnauth ? '--allow-unauthenticated' : '--no-allow-unauthenticated'
      }`;
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
                : gcsComplianceRegime,
            dataClassification:
              serviceType === 'BIGQUERY_DATASET'
                ? bqDataClassification
                : gcsDataClassification,
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
    <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-sm flex items-start justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#ffffff] dark:bg-[#0c0c0f] rounded-[14px] border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-3xl max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-3rem)] flex flex-col overflow-hidden my-auto">
        <div className="shrink-0 flex items-start justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 px-6 pt-5 pb-4 bg-[#ffffff] dark:bg-[#0c0c0f]">
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
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
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
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
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
                    GCP Region (40 Global Ready)
                  </label>
                  <select
                    value={vmRegion}
                    onChange={(e) => handleSelectVmRegion(e.target.value)}
                    className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2 py-[8px] text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100"
                  >
                    {!GCP_REGION_ZONES[vmRegion] && (
                      <option value={vmRegion}>
                        🛰️ {vmRegion} (Map Drop-Pod Target)
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
                    className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2 py-[8px] text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100"
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

            {serviceType === 'CLOUD_RUN' && (
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                  GCP Region (40 Global Ready)
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] py-[8px] text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100"
                >
                  {!GCP_REGION_ZONES[region] && (
                    <option value={region}>
                      🛰️ {region} (Map Drop-Pod Target)
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

            {serviceType === 'GCS_BUCKET' && (
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5 flex items-center justify-between">
                  <span>Location Topology & Geo-Redundancy</span>
                  {gcsComplianceRegime !== 'custom' && (
                    <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400">
                      🔒 Enforced by {gcsComplianceRegime.toUpperCase()}
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
                  className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] py-[8px] text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option
                    value="REGIONAL"
                    disabled={
                      gcsComplianceRegime === 'sec-17a4-worm' ||
                      gcsComplianceRegime === 'gdpr-eu-sovereign'
                    }
                  >
                    📍 REGIONAL — Single Region Low Latency (99.99% SLA)
                  </option>
                  <option
                    value="DUAL_REGION"
                    disabled={
                      gcsComplianceRegime === 'sec-17a4-worm' ||
                      gcsComplianceRegime === 'ai-lakehouse-hns'
                    }
                  >
                    🛡️ DUAL_REGION — 2-Region Sovereign Pair + 15m RPO (99.999% SLA)
                  </option>
                  <option
                    value="MULTI_REGION"
                    disabled={
                      gcsComplianceRegime === 'gdpr-eu-sovereign' ||
                      gcsComplianceRegime === 'ai-lakehouse-hns'
                    }
                  >
                    🌐 MULTI_REGION — Continental Geo-Redundant (US / EU / ASIA)
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
                <div className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] py-[8px] text-xs font-mono text-zinc-800 dark:text-zinc-200 flex items-center justify-between">
                  <span>
                    {bqComplianceRegime === 'standard'
                      ? '🎛️ Custom / GCP Console Standard (All Options Unlocked)'
                      : `🔒 Enforcing ${bqComplianceRegime.toUpperCase()} Guardrails`}
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
                          ? 'bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400'
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
                          ? 'bg-violet-500/15 border-violet-500 text-violet-600 dark:text-violet-400'
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
                    className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] py-[8px] text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100"
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
                    className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] py-[8px] text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100"
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
                    className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] py-[8px] text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100 disabled:opacity-40"
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
                    className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] py-[8px] text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100"
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
                    className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] py-[8px] text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100"
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
                      className="flex-1 bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] py-[8px] text-xs font-mono shadow-sm text-zinc-950 dark:text-zinc-100"
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
                      🛡️ 1-Tap Cloud Storage Regulatory Blueprints (Strict Guardrail Enforcement)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                      {isGcsCustom
                        ? '🎛️ Custom Mode: All Options Unlocked'
                        : `🔒 Enforcing ${gcsComplianceRegime.toUpperCase()} · ${gcsDataClassification.toUpperCase()}`}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-1.5">
                    {[
                      {
                        id: 'custom',
                        title: '🎛️ GCP Console Standard',
                        desc: 'All Options Unlocked · Custom Topology & ACLs',
                      },
                      {
                        id: 'sec-17a4-worm',
                        title: '🏛️ SEC 17a-4 / FINRA WORM',
                        desc: 'Locks: ≥1-Yr WORM · US Only · PAP + Uniform · ≥30d Soft-Delete',
                      },
                      {
                        id: 'gdpr-eu-sovereign',
                        title: '🇪🇺 GDPR EU Dual-Region',
                        desc: 'Locks: EU Only (EUR4/Europe) · 15m Turbo RPO · PAP + Uniform',
                      },
                      {
                        id: 'hipaa-soc2-vault',
                        title: '🏥 HIPAA / SOC2 Vault',
                        desc: 'Locks: US BAA Region · PAP + Uniform · ≥30d Soft-Delete · Versioning',
                      },
                      {
                        id: 'ai-lakehouse-hns',
                        title: '🤖 AI / Spark HNS Tree',
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
                              : 'bg-[#ffffff] dark:bg-[#09090b] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'
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
                        <strong>🔒 Active Regulatory Lock ({gcsComplianceRegime.toUpperCase()}):</strong>{' '}
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
                        ? `🔒 Restricted by ${gcsComplianceRegime.toUpperCase()}`
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
                              : 'bg-[#ffffff] dark:bg-[#09090b] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 cursor-pointer'
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
                              {locCard.disabled ? '🔒 ' : ''}
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
                        className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-3 py-2 text-xs font-mono text-zinc-950 dark:text-zinc-100"
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
                                {blockedByHipaa ? '🔒 ' : ''}
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
                            className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                          >
                            <option value="CUSTOM">
                              🛠️ Custom Dual-Region Pair (Pick Any 2 Regions in Continent)
                            </option>
                            <option value="NAM4" disabled={isGcsGdpr}>
                              {isGcsGdpr ? '🔒 ' : '🇺🇸 '}Predefined NAM4 (us-central1 Iowa + us-east1 South Carolina)
                            </option>
                            <option value="EUR4" disabled={isGcsHipaa || isGcsSec}>
                              {isGcsHipaa || isGcsSec ? '🔒 ' : '🇪🇺 '}Predefined EUR4 (europe-west4 Netherlands + europe-north1 Finland)
                            </option>
                            <option
                              value="ASIA1"
                              disabled={isGcsGdpr || isGcsHipaa || isGcsSec}
                            >
                              {isGcsGdpr || isGcsHipaa || isGcsSec ? '🔒 ' : '🇯🇵 '}Predefined ASIA1 (asia-northeast1 Tokyo + asia-northeast2 Osaka)
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
                              className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-950 dark:text-zinc-100 disabled:opacity-50"
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
                              className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-950 dark:text-zinc-100"
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
                              className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-950 dark:text-zinc-100"
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
                      <div className="p-2.5 rounded-[8px] border border-zinc-200 dark:border-zinc-800 bg-[#ffffff] dark:bg-[#09090b] flex flex-wrap items-center justify-between gap-2">
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
                              ⚡ Enable Turbo Replication (15-minute RPO SLA)
                              {isGcsGdpr ? ' — 🔒 Enforced by GDPR Blueprint' : ''}
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
                                  : 'bg-[#ffffff] dark:bg-[#09090b] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 cursor-pointer'
                              }`}
                            >
                              <div className="text-xs font-mono font-bold">
                                {mr.disabled ? '🔒 ' : ''}
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
                          : 'bg-[#ffffff] dark:bg-[#09090b] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 cursor-pointer'
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
                          {isGcsSec || isGcsAiHns ? '🔒 ' : ''}Autoclass (Automatic Tiering)
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
                          : 'bg-[#ffffff] dark:bg-[#09090b] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
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
                              : 'bg-[#ffffff] dark:bg-[#09090b] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-extrabold">
                              {sc.disabled ? '🔒 ' : ''}
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
                          className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-950 dark:text-zinc-100"
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
                        : 'cursor-pointer border-zinc-200 dark:border-zinc-800 bg-[#ffffff] dark:bg-[#09090b]'
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
                        {isGcsAiHns ? ' — 🔒 Enforced by AI/Spark HNS Blueprint' : ''}
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
                        🔒 Enforced by {gcsComplianceRegime.toUpperCase()}: Zero-Trust PAP + Uniform IAM
                      </span>
                    )}
                  </div>

                  {/* Prevent Public Access Checkbox */}
                  <div className="p-2.5 rounded-[8px] border border-zinc-200 dark:border-zinc-800 bg-[#ffffff] dark:bg-[#09090b] flex flex-wrap items-center justify-between gap-2">
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
                          {lockGcsPapAndUniform ? ' (🔒 Locked ON)' : ''}
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
                            : 'bg-[#ffffff] dark:bg-[#09090b] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
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
                            : 'bg-[#ffffff] dark:bg-[#09090b] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 cursor-pointer'
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
                            {lockGcsPapAndUniform ? '🔒 ' : ''}Fine-grained (Legacy Object ACLs)
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
                  <div className="p-2.5 rounded-[8px] border border-zinc-200 dark:border-zinc-800 bg-[#ffffff] dark:bg-[#09090b] space-y-2">
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
                        {!isGcsCustom ? ` — 🔒 Min ${minGcsSoftDeleteDays}d Enforced` : ''}
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
                                {disabledDay ? '🔒' : ''}
                                {d}d
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 4B. Object Versioning */}
                  <div className="p-2.5 rounded-[8px] border border-zinc-200 dark:border-zinc-800 bg-[#ffffff] dark:bg-[#09090b] space-y-2">
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
                        {isGcsGdpr || isGcsHipaa ? ' — 🔒 Enforced ON' : ''}
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
                  <div className="p-2.5 rounded-[8px] border border-zinc-200 dark:border-zinc-800 bg-[#ffffff] dark:bg-[#09090b] space-y-2">
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
                          ? ' — 🔒 Locked ON by SEC Rule 17a-4 (Min 1 Year)'
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
                          : 'bg-[#ffffff] dark:bg-[#09090b] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
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
                          : 'bg-[#ffffff] dark:bg-[#09090b] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
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
                        className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-950 dark:text-zinc-100"
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
                        ? ' — 🔒 Locked OFF (Hot Tensor I/O)'
                        : ' — 🔒 Locked ON by Compliance'
                      : ''}
                  </label>
                </div>

                {gcsEnableSmartLifecycle && !gcsAutoclass && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-2.5 rounded-[8px] border border-zinc-200 dark:border-zinc-800 bg-[#ffffff] dark:bg-[#09090b]">
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
                          ? '(🔒 0 = WORM Protected)'
                          : isGcsGdpr
                          ? '(🔒 1–365d GDPR Cap)'
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
                      className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-950 dark:text-zinc-100"
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
                      className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer p-2 rounded-[8px] border border-zinc-200 dark:border-zinc-800 bg-[#ffffff] dark:bg-[#09090b]">
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
                    className={`flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 p-2 rounded-[8px] border border-zinc-200 dark:border-zinc-800 bg-[#ffffff] dark:bg-[#09090b] ${
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
                        {isGcsSec || isGcsGdpr || isGcsHipaa ? ' 🔒' : ''}
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
                <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-500/[0.06] via-blue-500/[0.06] to-emerald-500/[0.06] border border-blue-500/25 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>
                        1-Tap BigQuery Regulatory, FinOps & Lakehouse Blueprints (Strict Guardrail Enforcement)
                      </span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30">
                      {isBqCustom
                        ? '🎛️ Custom Mode: All Controls Unlocked'
                        : `🔒 Strict Enforcement Active: ${bqComplianceRegime.toUpperCase()}`}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                    {[
                      {
                        id: 'standard',
                        title: '🎛️ GCP Console Standard',
                        sub: 'All Options Unlocked · Custom Location & Billing',
                      },
                      {
                        id: 'sec-finra-ledger',
                        title: '🏛️ SEC 17a-4 / FINRA Ledger',
                        sub: 'Locks: US Only · Physical Billing · ROUND_HALF_EVEN · ≥7yr TTL · 168h TT',
                      },
                      {
                        id: 'gdpr-eu-sovereign',
                        title: '🇪🇺 GDPR EU Sovereign',
                        sub: 'Locks: EU Only (Blocks US/Asia) · Physical Billing · 30–90d Erasure TTL · ≤72h TT',
                      },
                      {
                        id: 'hipaa-soc2- clinical',
                        title: '🏥 HIPAA / SOC2 Vault',
                        sub: 'Locks: BAA Region · Physical Billing · 168h Audit Time-Travel · ≥365d TTL',
                      },
                      {
                        id: 'ai-vector-biglake',
                        title: '🤖 AI Vector & Iceberg',
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
                              : 'bg-white dark:bg-[#09090b] border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-blue-500/40'
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
                        <strong>🔒 Active Regulatory Lock ({bqComplianceRegime.toUpperCase()}):</strong>{' '}
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
                        ? '🔒 GDPR Lock: Only EU Multi-Region or europe-* Single Regions permitted'
                        : isSecFinra
                        ? '🔒 SEC/FINRA Lock: Only US Multi-Region or us-* Single Regions permitted'
                        : isAiVector
                        ? '🔒 AI Vector Lock: Single Region required for low-latency GPU co-location'
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
                              : 'bg-white dark:bg-[#09090b] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 cursor-pointer'
                          }`}
                        >
                          {isAiVector ? '🔒 ' : '🌐 '}MULTI_REGION (US / EU)
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
                              : 'bg-white dark:bg-[#09090b] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                          }`}
                        >
                          📍 SINGLE REGION (Sovereign)
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
                          className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-3 py-2 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                        >
                          <option
                            value="US"
                            disabled={isGdprEu}
                          >
                            {isGdprEu ? '🔒 ' : '🇺🇸 '}US Multi-Region (Continental United States · 99.99% SLA)
                            {isGdprEu ? ' — Blocked by GDPR EU Sovereignty' : ''}
                          </option>
                          <option
                            value="EU"
                            disabled={isSecFinra || isHipaa}
                          >
                            {isSecFinra || isHipaa ? '🔒 ' : '🇪🇺 '}EU Multi-Region (European Union Sovereign Member States · GDPR)
                            {isSecFinra || isHipaa ? ' — Blocked by US Regulatory Mandate' : ''}
                          </option>
                        </select>
                      ) : (
                        <select
                          value={bqLocation}
                          onChange={(e) => setBqLocation(e.target.value)}
                          className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-3 py-2 text-xs font-mono text-zinc-950 dark:text-zinc-100"
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
                                  {isDisabled ? '🔒 ' : ''}
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
                        ? `🔒 Enforced by ${bqComplianceRegime.toUpperCase()}: PHYSICAL Compressed Billing Required`
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
                          : 'bg-white dark:bg-[#09090b] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono">
                          ⚡ PHYSICAL (Compressed Bytes)
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold">
                          {lockPhysicalBilling
                            ? '🔒 Enforced by Blueprint'
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
                          : 'bg-white dark:bg-[#09090b] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono">
                          {lockPhysicalBilling ? '🔒 ' : '📦 '}LOGICAL (Uncompressed Bytes)
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
                      <span className="px-2 py-0.5 rounded bg-violet-500/15 text-violet-600 dark:text-violet-400 font-mono text-[10px]">
                        STEP 3
                      </span>
                      <span>
                        Time-Travel Recovery Window (`FOR SYSTEM_TIME AS OF`) & Lifecycle Expiration
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {lockTimeTravel168
                        ? '🔒 Enforced: 168h (7-Day) Full Audit Time-Travel Window'
                        : lockTimeTravelMax72
                        ? '🔒 GDPR Minimization: Time-Travel capped at ≤72h & Partition TTL 30–90d'
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
                        className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-2 text-xs font-mono text-zinc-950 dark:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value={48} disabled={lockTimeTravel168}>
                          {lockTimeTravel168 ? '🔒 ' : ''}48 Hours (2 Days · Min Physical Storage Overhead)
                        </option>
                        <option value={72} disabled={lockTimeTravel168}>
                          {lockTimeTravel168 ? '🔒 ' : ''}72 Hours (3 Days · Balanced FinOps Recovery)
                        </option>
                        <option
                          value={120}
                          disabled={lockTimeTravel168 || lockTimeTravelMax72}
                        >
                          {lockTimeTravel168 || lockTimeTravelMax72 ? '🔒 ' : ''}120 Hours (5 Days · Workweek Recovery)
                        </option>
                        <option
                          value={168}
                          disabled={lockTimeTravelMax72}
                        >
                          {lockTimeTravelMax72 ? '🔒 ' : ''}168 Hours (7 Days · Maximum Point-in-Time Rewind)
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                        Default Partition TTL (
                        {minPartitionTtlDays > 0
                          ? `🔒 Range: ${minPartitionTtlDays}–${maxPartitionTtlDays}d`
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
                        className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-2 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                        Default Table TTL (
                        {isSecFinra
                          ? '🔒 Locked: 0 (No Auto-Drop)'
                          : isGdprEu
                          ? '🔒 Max 365 Days'
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
                        className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-2 text-xs font-mono text-zinc-950 dark:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        🔒 SEC/FINRA Lock: ROUND_HALF_EVEN (Banker&apos;s Rounding) Enforced
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
                        className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-2 text-xs font-mono text-zinc-950 dark:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option
                          value="ROUND_HALF_AWAY_FROM_ZERO"
                          disabled={lockBankerRounding}
                        >
                          {lockBankerRounding ? '🔒 ' : ''}ROUND_HALF_AWAY_FROM_ZERO (Standard Arithmetic)
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
                        className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-2 text-xs font-mono text-zinc-950 dark:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="" disabled={isAiVector}>
                          {isAiVector ? '🔒 ' : ''}Binary Case-Sensitive (`&apos;&apos;` · Exact ID Match)
                        </option>
                        <option
                          value="und:ci"
                          disabled={isSecFinra || isHipaa}
                        >
                          {isSecFinra || isHipaa ? '🔒 ' : ''}Unicode Case-Insensitive (`und:ci` · Human Search)
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
                        className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-2.5 py-2 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                      >
                        <option value="GOOGLE_MANAGED">
                          🔐 Google-Managed AES-256 Envelope Key
                        </option>
                        <option value="CMEK">
                          🔑 Cloud KMS Customer-Managed Key (CMEK)
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
                        className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-3 py-2 text-xs font-mono text-zinc-950 dark:text-zinc-100"
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
                        className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-3 py-2 text-xs font-mono text-zinc-950 dark:text-zinc-100"
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
                        className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-3 py-2 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 2026 Live Pre-Deploy FinOps Price Calculator */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/[0.08] via-cyan-500/[0.06] to-violet-500/[0.08] border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

            <div className="sticky bottom-0 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 pb-1 border-t border-zinc-200 dark:border-zinc-800 bg-[#ffffff]/95 dark:bg-[#0c0c0f]/95 backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Direct Live GCP API Execution ({projectId})</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-[#ffffff] dark:bg-[#262626] hover:bg-[#f8fafc] dark:hover:bg-zinc-800 text-[#334155] dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-[8px] px-[16px] py-[8px] text-xs font-[500] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !name.trim()}
                  className="bg-[#059669] hover:bg-[#047857] text-[#000000] rounded-[8px] px-[18px] py-[8px] text-xs font-[700] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
    </div>
  );
}
