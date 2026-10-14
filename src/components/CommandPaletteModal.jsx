import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import {
  Search, Mic, MicOff, Terminal, Rocket, Server, Moon, Sun, ShieldAlert,
  FileCode, Network, DollarSign, Zap, Sparkles, X, ArrowRight, CheckCircle2,
  Loader2, PowerOff, Key, Database, Globe, Cpu
} from 'lucide-react';

export default function CommandPaletteModal({
  isOpen,
  onClose,
  projectId,
  overview,
  vms = [],
  onSelectTab,
  onOpenCreateModal,
  onOpenKillSwitch,
  onOpenCopilot,
  onToggleGdeMode,
  onRefreshAll
}) {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [executingId, setExecutingId] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 60);
      setQuery('');
      setSelectedIndex(0);
      setToastMsg(null);
    }
  }, [isOpen]);

  const toggleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setToastMsg({
        type: 'warning',
        text: 'Web Speech API not supported in this browser. Type your natural language command above!'
      });
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((res) => res[0].transcript)
          .join('');
        setQuery(transcript);
        setSelectedIndex(0);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const runDirectHibernate = async (mode) => {
    if (!projectId) return;
    setExecutingId(`hibernate-${mode}`);
    setToastMsg(null);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/hibernate`,
        { mode }
      );
      const data = res.data || {};
      setToastMsg({
        type: 'success',
        text:
          data.summary ||
          `${mode} executed (${(data.actions || []).length} resources updated)`
      });
      if (onRefreshAll) onRefreshAll();
    } catch (e) {
      setToastMsg({
        type: 'error',
        text: e.response?.data?.error || e.message
      });
    } finally {
      setExecutingId(null);
    }
  };

  const actions = useMemo(() => {
    const normalizedVms = (vms || []).map((v) => ({
      name: v.name,
      rawStatus: v.details?.status || v.status || 'RUNNING',
      machineType: v.machineType || v.details?.machineType || 'e2-medium',
      zone: v.zone || v.details?.zone || v.region || 'us-east1-b',
      externalIp: v.externalIp || v.details?.externalIp || 'internal'
    }));
    const runningVms = normalizedVms.filter(
      (v) => v.rawStatus === 'RUNNING' || v.rawStatus === 'HEALTHY'
    );
    const stoppedVms = normalizedVms.filter(
      (v) => v.rawStatus !== 'RUNNING' && v.rawStatus !== 'HEALTHY'
    );
    const crServices = overview?.cloudRunServices || overview?.cloudRun || [];

    const baseActions = [
      {
        id: 'open-quantum-nexus',
        category: '2026 Innovation Lab (Star)',
        title: 'Open 2026 Quantum Nexus (Causal Blast-Radius, State Rollback, FinOps, PR Mirror & Honey-Grid)',
        subtitle: 'Launch all 5 world-first 2026 breakthroughs inside the 2026 Innovation Lab',
        keywords: 'quantum nexus causal blast radius rollback snapshot finops arbitrage ephemeral pr preview shadow mirror honey token deception',
        badge: '2026 STAR',
        badgeColor: 'text-amber-300 bg-blue-500/25 border-amber-400/50',
        icon: Sparkles,
        run: () => {
          onSelectTab('INNOVATION_LAB', 'QUANTUM_NEXUS');
          onClose();
        }
      },
      {
        id: 'open-wave10-frontier',
        category: '2026 Innovation Lab (Star)',
        title: 'Open Spanner Graph ($65/mo 100-PU), Serverless Spark 2.2, Workflows & Model Armor',
        subtitle: 'ISO GQL Graph queries, scale-to-$0 Spark over BigLake Iceberg, Saga Workflows & AI Prompt Firewall',
        keywords: 'spanner graph gql spark serverless dataproc workflows saga model armor vertex ai wave 10',
        badge: '2026 FRONTIER',
        badgeColor: 'text-blue-300 bg-blue-500/15 border-blue-500/30',
        icon: Rocket,
        run: () => {
          onSelectTab('WAVE10_FRONTIER');
          onClose();
        }
      },
      {
        id: 'open-aws-azure-parity',
        category: '2026 Innovation Lab (Star)',
        title: 'Open AWS & Azure Parity Super-Studio (Resource Groups, Spend Fuse, IAM Simulator, SAS URLs & 1-Screen LB)',
        subtitle: 'Azure-style Resource Groups + 1-Click Teardown, Hard-Spend Stop-Loss Fuse, AWS IAM Policy Simulator, Presigned URLs & Global LB Wizard',
        keywords: 'aws azure resource group tagger hard spend fuse stop loss budget iam policy simulator switch role presigned url sas s3 load balancer waf',
        badge: 'AWS/AZURE PARITY',
        badgeColor: 'text-indigo-300 bg-indigo-500/15 border-indigo-500/30',
        icon: Rocket,
        run: () => {
          onSelectTab('AWS_AZURE_PARITY');
          onClose();
        }
      },
      {
        id: 'open-biglake-iceberg',
        category: '2026 Innovation Lab (Star)',
        title: 'Open Dedicated BigLake & Apache Iceberg Open Lakehouse Studio',
        subtitle: 'Manage BigLake Metastore REST Catalogs, 1-Click CLOUD_RESOURCE Connections, Iceberg Compaction Doctor & Cross-Cloud Omni',
        keywords: 'biglake bigquery iceberg parquet lakehouse open table governance compaction omni s3 azure',
        badge: 'BIGLAKE 2026',
        badgeColor: 'text-blue-300 bg-blue-500/15 border-blue-500/30',
        icon: Database,
        run: () => {
          onSelectTab('BIGLAKE_STUDIO');
          onClose();
        }
      },
      {
        id: 'open-data-engineer-studio',
        category: '2026 Innovation Lab (Star)',
        title: 'Open 2026 Data Engineering Studio (Medallion ELT, Dataform/dbt SQLX & Dataplex 588.0.0)',
        subtitle: '1-Canvas Bronze→Silver→Gold Pipeline Builder, Auto-Clean QUALIFY Dedup, Dataplex Profiling/Products & -$348/mo Serverless DAGs',
        keywords: 'data engineer medallion bronze silver gold dataform dbt sqlx dataplex profile qualitycomposer airflow dag skew slot',
        badge: 'DATA ENGINEER',
        badgeColor: 'text-blue-300 bg-blue-500/15 border-blue-500/30',
        icon: Database,
        run: () => {
          onSelectTab('DATA_ENGINEER_STUDIO');
          onClose();
        }
      },
      {
        id: 'open-sa-key-killswitch',
        category: '2026 Innovation Lab (Star)',
        title: 'Open Service Account .json Key & OAuth Token Kill-Switch Vault (Sovereign IAM)',
        subtitle: 'Create, download, disable, or emergency-revoke stolen SA .json keys & active tokens with Owner self-protection',
        keywords: 'iam service account key json token revoke kill switch stolen credential sovereign owner',
        badge: 'IAM KILL-SWITCH',
        badgeColor: 'text-red-300 bg-red-500/15 border-red-500/30',
        icon: Key,
        run: () => {
          onSelectTab('SOVEREIGN_STUDIO');
          onClose();
        }
      },
      {
        id: 'sleep-project',
        category: 'FinOps & Sleep Mode',
        title: 'Park Project for the Night (Hibernate All Running VMs & Warm Cloud Run)',
        subtitle: `Stops ${runningVms.length} running VM(s) & scales warm Cloud Run instances to 0 min-instances`,
        keywords: 'sleep hibernate park night stop all vms save money finops pause',
        badge: '1-TAP FINOPS',
        badgeColor: 'text-blue-300 bg-blue-500/15 border-blue-500/30',
        icon: Moon,
        run: () => runDirectHibernate('SLEEP')
      },
      {
        id: 'wake-project',
        category: 'FinOps & Sleep Mode',
        title: 'Wake Up Hibernated Project (Restore Stopped VMs & Warm Cloud Run)',
        subtitle: 'Starts previously parked VMs and restores Cloud Run min-instances',
        keywords: 'wake resume morning start all vms unpark restore',
        badge: '1-TAP WAKE',
        badgeColor: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
        icon: Sun,
        run: () => runDirectHibernate('WAKE')
      },
      {
        id: 'open-topology',
        category: '2026 Revolutionary Suite',
        title: 'Open Interactive Cloud Topology & Blast-Radius Graph',
        subtitle: 'Visualize Public Internet 0.0.0.0/0 exposure → VPC → Compute/Cloud Run → Storage',
        keywords: 'topology graph map network architecture blast radius visual diagram',
        badge: '2026 LAB',
        badgeColor: 'text-blue-300 bg-blue-500/15 border-blue-500/30',
        icon: Network,
        run: () => {
          onSelectTab('INNOVATION_LAB', 'TOPOLOGY');
          onClose();
        }
      },
      {
        id: 'open-terraform',
        category: '2026 Revolutionary Suite',
        title: 'Export Live Project to Terraform (main.tf) & gcloud Blueprint',
        subtitle: 'Reverse-engineer your live VMs, Cloud Run, VPCs, and Buckets into IaC code',
        keywords: 'terraform iac export main.tf clone script blueprint code',
        badge: 'REVERSE IaC',
        badgeColor: 'text-blue-300 bg-blue-500/15 border-blue-500/30',
        icon: FileCode,
        run: () => {
          onSelectTab('INNOVATION_LAB', 'TERRAFORM');
          onClose();
        }
      },
      {
        id: 'open-security',
        category: '2026 Revolutionary Suite',
        title: 'Run Zero-Trust Security & IAM Service Account Scanner',
        subtitle: 'Detect open 0.0.0.0/0 SSH/RDP firewalls and audit IAM Service Accounts',
        keywords: 'security iam audit firewall zero trust scan vulnerability 0.0.0.0',
        badge: 'SECURITY',
        badgeColor: 'text-amber-300 bg-amber-500/15 border-amber-500/30',
        icon: ShieldAlert,
        run: () => {
          onSelectTab('INNOVATION_LAB', 'SECURITY');
          onClose();
        }
      },
      {
        id: 'open-finops-radar',
        category: '2026 Revolutionary Suite',
        title: 'Open Live Wallet Burn-Rate Radar ($/hr & $/mo Breakdown)',
        subtitle: 'Inspect real-time hourly & monthly cost per VM, GPU, Cloud Run, and Disk',
        keywords: 'burn rate cost price radar billing hourly monthly wallet',
        badge: 'LIVE $/HR',
        badgeColor: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
        icon: DollarSign,
        run: () => {
          onSelectTab('INNOVATION_LAB', 'FINOPS_SLEEP');
          onClose();
        }
      },
      {
        id: 'open-benchmark-xray',
        category: 'Wave 2 Engineer Wishlist',
        title: 'Run Live Cold-Start & P95 Latency Stress Benchmark + HTTP Header X-Ray',
        subtitle: 'Fire concurrent HTTP bursts against Cloud Run or VM URLs and inspect headers/trace',
        keywords: 'benchmark latency load test stress cold start p95 p99 xray headers curl',
        badge: 'STRESS & X-RAY',
        badgeColor: 'text-blue-300 bg-blue-500/15 border-blue-500/30',
        icon: Zap,
        run: () => {
          onSelectTab('INNOVATION_LAB', 'BENCHMARK');
          onClose();
        }
      },
      {
        id: 'open-zombie-hunter',
        category: 'Wave 2 Engineer Wishlist',
        title: 'Run Zombie Resource Hunter & Silent-Waste Exterminator',
        subtitle: 'Detect orphaned Persistent Disks, unused Static External IPs ($7.30/mo), and idle resources',
        keywords: 'zombie waste orphan disk unused static ip clean exterminate save money',
        badge: 'ZOMBIE HUNTER',
        badgeColor: 'text-amber-300 bg-amber-500/15 border-amber-500/30',
        icon: ShieldAlert,
        run: () => {
          onSelectTab('INNOVATION_LAB', 'ZOMBIES');
          onClose();
        }
      },
      {
        id: 'open-teleport-diff-carbon',
        category: 'Wave 2 Engineer Wishlist',
        title: '1-Tap Cross-Region Cloud Run Teleporter, Carbon CFE% & Visual Config Diff',
        subtitle: 'Clone services to 98% Carbon-Free regions (Montréal/Finland) or diff two services side-by-side',
        keywords: 'teleport clone region migrate carbon green cfe diff compare revision',
        badge: 'TELEPORT & DIFF',
        badgeColor: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
        icon: Globe,
        run: () => {
          onSelectTab('INNOVATION_LAB', 'TELEPORT_DIFF');
          onClose();
        }
      },
      {
        id: 'create-cloudrun',
        category: 'Provisioning & Deploy',
        title: 'Deploy New Cloud Run Gen2 Service (Serverless / L4 or Blackwell GPU)',
        subtitle: 'Launch container with Request-based ($0 idle) or Instance-based billing & GPU',
        keywords: 'deploy cloud run container serverless gpu l4 rtx 6000 create service',
        badge: 'PROVISION',
        badgeColor: 'text-blue-300 bg-blue-500/15 border-blue-500/30',
        icon: Rocket,
        run: () => {
          onClose();
          onOpenCreateModal('CLOUD_RUN');
        }
      },
      {
        id: 'create-gke',
        category: 'Provisioning & Deploy',
        title: 'Create New GKE Cluster (Autopilot Serverless K8s or Standard Spot GPU Pool)',
        subtitle: 'Provision GKE cluster with SEC/GDPR/HIPAA compliance locks, Workload Identity & Binary Auth',
        keywords: 'create gke kubernetes cluster autopilot standard gpu l4 a100 spot k8s',
        badge: 'PROVISION K8S',
        badgeColor: 'text-blue-300 bg-blue-500/15 border-blue-500/30',
        icon: Cpu,
        run: () => {
          onClose();
          onOpenCreateModal('GKE_CLUSTER');
        }
      },
      {
        id: 'create-vm',
        category: 'Provisioning & Deploy',
        title: 'Create New Compute Engine VM (13 Regions, Spot VM, C3/C4/Arm64/GPU)',
        subtitle: 'Provision VM with pre-deploy live cost calculator, startup script & SSH',
        keywords: 'create vm compute engine instance spot linux ubuntu gpu arm64',
        badge: 'PROVISION',
        badgeColor: 'text-blue-300 bg-blue-500/15 border-blue-500/30',
        icon: Server,
        run: () => {
          onClose();
          onOpenCreateModal('VM');
        }
      },
      {
        id: 'create-vpc',
        category: 'Provisioning & Deploy',
        title: 'Create New VPC Network or Ingress Firewall Rule',
        subtitle: 'Provision custom/auto-mode VPC network or TCP/UDP/ICMP firewall rule',
        keywords: 'create vpc network firewall rule subnet bgp mtu',
        badge: 'NETWORK',
        badgeColor: 'text-blue-300 bg-blue-500/15 border-blue-500/30',
        icon: Network,
        run: () => {
          onClose();
          onOpenCreateModal('VPC_NETWORK');
        }
      },
      {
        id: 'create-cloud-sql',
        category: 'Provisioning & Deploy',
        title: 'Create Cloud SQL (MySQL 8.4 / Postgres 16) or Google Cloud AlloyDB Cluster',
        subtitle: 'Choose MySQL or PostgreSQL, and for PostgreSQL fork between Classic Cloud SQL vs. AlloyDB with SEC/GDPR/HIPAA locks',
        keywords: 'create cloud sql mysql postgres postgresql alloydb database vector scann pgvector',
        badge: 'PROVISION DB',
        badgeColor: 'text-blue-300 bg-blue-500/15 border-blue-500/30',
        icon: Database,
        run: () => {
          onClose();
          onOpenCreateModal('CLOUD_SQL');
        }
      },
      {
        id: 'create-bucket',
        category: 'Provisioning & Deploy',
        title: 'Create Cloud Storage Bucket or BigQuery Lakehouse Dataset',
        subtitle: 'Provision multi-region GCS bucket or BigQuery analytics dataset',
        keywords: 'create bucket storage gcs bigquery dataset',
        badge: 'DATA',
        badgeColor: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
        icon: Database,
        run: () => {
          onClose();
          onOpenCreateModal('BUCKET');
        }
      },
      {
        id: 'open-gke-studio',
        category: 'Compute & Containers Studios',
        title: 'Open Dedicated GKE Studio (Autopilot, Spot GPUs & K8s Workloads)',
        subtitle: '1-Click GKE Autopilot / Spot GPU Cluster Provisioner, K8s YAML Composer & kubeconfig Fleet Manager',
        keywords: 'gke studio kubernetes cluster autopilot spot gpu k8s yaml kubeconfig',
        badge: 'GKE STUDIO',
        badgeColor: 'text-blue-300 bg-blue-500/15 border-blue-500/30',
        icon: Cpu,
        run: () => {
          onSelectTab('GKE_STUDIO');
          onClose();
        }
      },
      {
        id: 'open-cloud-build-studio',
        category: 'Compute & Containers Studios',
        title: 'Open Cloud Build & GitHub Source-to-Container Studio',
        subtitle: 'Clone any GitHub repo, build via Buildpacks or Dockerfile, push to Artifact Registry & auto-deploy to Cloud Run or GKE',
        keywords: 'cloud build github repo dockerfile buildpacks container ci cd artifact registry deploy',
        badge: 'CLOUD BUILD CI/CD',
        badgeColor: 'text-amber-300 bg-amber-500/15 border-amber-500/30',
        icon: Rocket,
        run: () => {
          onSelectTab('WAVE9_STUDIO');
          onClose();
        }
      },
      {
        id: 'open-cloudrun-gke-migrator',
        category: 'Compute & Containers Studios',
        title: 'Convert Cloud Run to GKE Kubernetes + Tune Direct VPC & Storage Volumes',
        subtitle: '6-Resource K8s Transpiler (Deployment, HPA v2, PDB, NetworkPolicy, Workload Identity), Direct VPC Egress & GCS/RAM/NFS Volume Mounts',
        keywords: 'cloud run to kubernetes gke convert migrate yaml direct vpc egress storage volume gcs fuse ramdisk nfs',
        badge: 'CLOUD RUN 2026',
        badgeColor: 'text-blue-300 bg-blue-500/15 border-blue-500/30',
        icon: Globe,
        run: () => {
          onSelectTab('CLOUD_RUN');
          onClose();
        }
      },
      {
        id: 'open-functions-eventarc-studio',
        category: 'Compute & Containers Studios',
        title: 'Open Cloud Functions (v1 & v2) & Demystified Eventarc Trigger Studio',
        subtitle: 'Plain-English Eventarc trigger wizard, 4-stage visual pipeline X-Ray, 1-Tap Eventarc IAM Auto-Doctor & v1→v2 concurrency upgrader (-78% cost)',
        keywords: 'cloud functions eventarc trigger v1 v2 gen2 gcs pubsub bigquery cron iam doctor serverless',
        badge: 'FUNCTIONS & EVENTARC',
        badgeColor: 'text-amber-300 bg-amber-500/15 border-amber-500/30',
        icon: Zap,
        run: () => {
          onSelectTab('FUNCTIONS_STUDIO');
          onClose();
        }
      },
      {
        id: 'open-bigquery-studio',
        category: 'Data Lakehouse & Sovereign SRE Studios',
        title: 'Open BigQuery 2026 Lakehouse & Compliance Studio',
        subtitle: 'Physical compressed billing (-54%), Pre-Crime SQL Dry-Run X-Ray & 168h Time-Machine',
        keywords: 'bigquery sql dataset table physical billing dry run time travel',
        badge: 'BIGQUERY',
        badgeColor: 'text-blue-300 bg-blue-500/15 border-blue-500/30',
        icon: Database,
        run: () => {
          onSelectTab('BIGQUERY_STUDIO');
          onClose();
        }
      },
      {
        id: 'open-cloud-sql-studio',
        category: 'Data Lakehouse & Sovereign SRE Studios',
        title: 'Open Dedicated Cloud SQL (MySQL & PostgreSQL) & AlloyDB Studio',
        subtitle: 'Classic Cloud SQL vs. AlloyDB Architecture Fork, AI Vector (alloydb_scann / pgvector / MySQL VECTOR) Surgeon & IAM Auth Proxy v2 Vault',
        keywords: 'cloud sql mysql postgres postgresql alloydb database vector scann pgvector proxy',
        badge: 'CLOUD SQL & ALLOYDB',
        badgeColor: 'text-blue-300 bg-blue-500/15 border-blue-500/30',
        icon: Database,
        run: () => {
          onSelectTab('CLOUD_SQL_STUDIO');
          onClose();
        }
      },
      {
        id: 'open-sql-sbom-studio',
        category: 'Data Lakehouse & Sovereign SRE Studios',
        title: 'Open Artifact Registry SLSA-3 Supply-Chain & OCI SBOM Studio',
        subtitle: 'Audit container digests, sweep untagged orphan layers, and enforce immutable tag compliance locks',
        keywords: 'artifact registry sbom slsa container digest docker immutable tags',
        badge: 'ARTIFACT SBOM',
        badgeColor: 'text-blue-300 bg-blue-500/15 border-blue-500/30',
        icon: Database,
        run: () => {
          onSelectTab('WAVE9_STUDIO');
          onClose();
        }
      },
      {
        id: 'open-sovereign-studio',
        category: 'Data Lakehouse & Sovereign SRE Studios',
        title: 'Open Sovereign Cloud Time-Machine, IAM Surgeon & Drift Radar',
        subtitle: '24h JIT CEL IAM conditions, SHA-256 Merkle drift detection & Sovereign Secret Manager',
        keywords: 'sovereign iam surgeon jit condition drift merkle time machine secret manager kms',
        badge: 'WAVE 7',
        badgeColor: 'text-blue-300 bg-blue-500/15 border-blue-500/30',
        icon: Key,
        run: () => {
          onSelectTab('SOVEREIGN_STUDIO');
          onClose();
        }
      },
      {
        id: 'open-sre-war-room',
        category: 'Data Lakehouse & Sovereign SRE Studios',
        title: 'Open Autonomous SRE Incident War-Room & VPC-SC Perimeter Studio',
        subtitle: 'LogRCA root-cause clusters, 14.4x SLO Burn Radar, VPC-SC Exfiltration Shield & Pub/Sub DLQ',
        keywords: 'sre war room incident slo burn rate vpc-sc exfiltration pubsub dlq postmortem',
        badge: 'WAVE 8',
        badgeColor: 'text-red-300 bg-red-500/15 border-red-500/30',
        icon: ShieldAlert,
        run: () => {
          onSelectTab('SRE_WAR_ROOM');
          onClose();
        }
      },
      {
        id: 'open-shell-logs',
        category: 'AI & Developer Tools',
        title: 'Open Mobile Cloud Shell & Real-Time Log Streamer',
        subtitle: 'Execute live gcloud / bq CLI commands and inspect Cloud Logging entries',
        keywords: 'shell terminal cli logs gcloud bq bash',
        badge: 'CLOUD SHELL',
        badgeColor: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
        icon: Terminal,
        run: () => {
          onSelectTab('LOGS_SHELL');
          onClose();
        }
      },
      {
        id: 'open-gemini-sre',
        category: 'AI & Developer Tools',
        title: 'Ask Gemini SRE Copilot (Diagnose Latency, Costs & Architecture)',
        subtitle: 'AI SRE assistant with full context of your live VMs, Buckets, and APIs',
        keywords: 'gemini ai copilot sre assistant ask help',
        badge: 'AI SRE',
        badgeColor: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
        icon: Sparkles,
        run: () => {
          onClose();
          if (onOpenCopilot) onOpenCopilot();
        }
      },
      {
        id: 'open-cloudrun-time-machine',
        category: '2026 SRE & Developer Velocity',
        title: 'Open Cloud Run Revision Time-Machine, Crash-Loop Autopsy & 1-Click Rollback',
        subtitle: 'Diagnose OOMKilled (Exit 137), PORT mismatch & broken Secret refs, diff revisions side-by-side & shift 100% traffic in 1 click',
        keywords: 'cloud run revision time machine rollback crash loop autopsy exit 137 oomkilled port diff traffic pin',
        badge: 'TIME-MACHINE',
        badgeColor: 'text-amber-300 bg-amber-500/15 border-amber-500/30',
        icon: Rocket,
        run: () => {
          onSelectTab('CLOUD_RUN');
          onClose();
        }
      },
      {
        id: 'open-cloudrun-dead-artifacts-hunter',
        category: '2026 SRE & Developer Velocity',
        title: 'Search & Purge Dead Containers (Artifact Registry) & Build Artifacts (Cloud Storage)',
        subtitle: 'Cross-reference live Cloud Run services against Artifact Registry images & _cloudbuild / run-sources-* buckets to sweep dead containers & tarballs',
        keywords: 'cloud run dead container artifact registry orphan digest cloud storage build staging tarball sweep purge',
        badge: 'ARTIFACT HUNTER',
        badgeColor: 'text-amber-300 bg-amber-500/15 border-amber-500/30',
        icon: Database,
        run: () => {
          onSelectTab('CLOUD_RUN');
          onClose();
        }
      },
      {
        id: 'open-local-iap-tunnel-bridge',
        category: '2026 SRE & Developer Velocity',
        title: 'Open 127.0.0.1 Zero-Public-IP Developer Port-Forward & IAP Tunnel Manager',
        subtitle: 'Bind private VMs, Cloud SQL / AlloyDB & IAM-locked Cloud Run to localhost without paying $7.30/mo for public IPv4',
        keywords: '127.0.0.1 localhost tunnel iap port forward private vm cloud sql alloydb proxy zero public ip',
        badge: '127.0.0.1 TUNNEL',
        badgeColor: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
        icon: Network,
        run: () => {
          onSelectTab('VM_SSH');
          onClose();
        }
      },
      {
        id: 'open-audit-who-changed-what',
        category: '2026 SRE & Developer Velocity',
        title: 'Open Live Cloud Audit "Who-Changed-What" Activity Timeline & Change Inspector',
        subtitle: 'Chronological feed of IAM, Cloud Run, Secret Manager, VM & Firewall mutations with principal email, caller IP & payload diff',
        keywords: 'audit timeline who changed what cloudaudit activity log principal email ip mutation history',
        badge: 'AUDIT TIMELINE',
        badgeColor: 'text-blue-300 bg-blue-500/15 border-blue-500/30',
        icon: Terminal,
        run: () => {
          onSelectTab('LOGS_SHELL');
          onClose();
        }
      },
      {
        id: 'open-quota-429-radar',
        category: 'Emergency & Governance',
        title: 'Open Live GCP API Quota Saturation & HTTP 429 Outage Early-Warning Radar',
        subtitle: 'Inspect regional CPU, GPU (L4/A100/H100), Static IP, Cloud Run & Vertex AI RPM quota saturation + 1-click quota increase CLI',
        keywords: 'quota saturation radar http 429 rate limit exhausted gpu cpu static ip vertex ai increase',
        badge: '429 QUOTA RADAR',
        badgeColor: 'text-amber-300 bg-amber-500/15 border-amber-500/30',
        icon: ShieldAlert,
        run: () => {
          onClose();
          onOpenCreateModal('API');
        }
      },
      {
        id: 'manage-apis',
        category: 'Emergency & Governance',
        title: 'Open Emergency Mobile API Kill-Switch & Service Manager',
        subtitle: 'Enable or immediately disable Google Cloud APIs (Compute, Vertex AI, Run)',
        keywords: 'api enable disable kill switch services',
        badge: 'API OPS',
        badgeColor: 'text-amber-300 bg-amber-500/15 border-amber-500/30',
        icon: Key,
        run: () => {
          onClose();
          onOpenCreateModal('API');
        }
      },
      {
        id: 'toggle-gde-tutorial-mode',
        category: '2026 SRE & Developer Velocity',
        title: 'Toggle GDE Streamer & Video Tutorial Privacy Shield (Alt+G)',
        subtitle: 'Masks personal emails, Cloud Billing Account IDs, GCP project numbers & public IPv4s across all 20 tabs for safe screen sharing',
        keywords: 'gde mode streamer tutorial privacy shield hide email billing account id screen share video recording mask pii',
        badge: 'GDE SHIELD',
        badgeColor: 'text-rose-300 bg-rose-500/15 border-rose-500/30',
        icon: Sparkles,
        run: () => {
          onClose();
          if (onToggleGdeMode) onToggleGdeMode();
        }
      },
      {
        id: 'emergency-killswitch',
        category: 'Emergency & Governance',
        title: 'Open Emergency Project Billing Kill-Switch (Unlink Billing Account)',
        subtitle: 'Nuclear option to immediately freeze all project spending if keys are leaked',
        keywords: 'emergency billing kill switch unlink stop spending hacked leak',
        badge: 'NUCLEAR',
        badgeColor: 'text-red-300 bg-red-500/15 border-red-500/30',
        icon: PowerOff,
        run: () => {
          onClose();
          if (onOpenKillSwitch) onOpenKillSwitch();
        }
      }
    ];

    // Add dynamic live VM quick actions
    runningVms.forEach((vm) => {
      baseActions.push({
        id: `vm-ssh-${vm.name}`,
        category: 'Live Compute Engine Fleet',
        title: `Open Web SSH & Fleet Manager for VM "${vm.name}"`,
        subtitle: `${vm.machineType} • ${vm.zone} • External IP: ${vm.externalIp}`,
        keywords: `vm ssh ${vm.name} ${vm.zone} ${vm.machineType} stop suspend`,
        badge: 'RUNNING VM',
        badgeColor: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
        icon: Terminal,
        run: () => {
          onSelectTab('VM_SSH');
          onClose();
        }
      });
    });

    stoppedVms.forEach((vm) => {
      baseActions.push({
        id: `vm-start-${vm.name}`,
        category: 'Live Compute Engine Fleet',
        title: `Manage / Boot Stopped VM "${vm.name}"`,
        subtitle: `${vm.machineType} • ${vm.zone} • Status: ${vm.rawStatus}`,
        keywords: `vm start boot ${vm.name} ${vm.zone}`,
        badge: vm.rawStatus,
        badgeColor: 'text-slate-300 bg-slate-800 border-slate-700',
        icon: Server,
        run: () => {
          onSelectTab('VM_SSH');
          onClose();
        }
      });
    });

    crServices.forEach((svc) => {
      const minInst = svc.minInstances ?? svc.minScale ?? 0;
      const maxInst = svc.maxInstances ?? svc.maxScale ?? 10;
      const gpuTag = svc.gpuType ? ` • GPU: ${svc.gpuType}` : '';
      baseActions.push({
        id: `cr-manage-${svc.name}`,
        category: 'Live Cloud Run Services',
        title: `Configure Cloud Run Service "${svc.name}" (${svc.region})`,
        subtitle: `Scale ${minInst}-${maxInst} • ${svc.cpu || '1'} vCPU • ${svc.memory || '512Mi'}${gpuTag}`,
        keywords: `cloud run service ${svc.name} ${svc.region} scale gpu`,
        badge: svc.gpuType ? 'GPU RUN' : 'CLOUD RUN',
        badgeColor: 'text-blue-300 bg-blue-500/15 border-blue-500/30',
        icon: Globe,
        run: () => {
          onSelectTab('CLOUD_RUN');
          onClose();
        }
      });
    });

    if (!query.trim()) return baseActions;

    const terms = query.toLowerCase().trim().split(/\s+/);
    return baseActions.filter((item) => {
      const hay = `${item.title} ${item.subtitle} ${item.keywords} ${item.category}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }, [query, vms, overview, projectId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (actions.length ? (prev + 1) % actions.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (actions.length ? (prev - 1 + actions.length) % actions.length : 0));
      } else if (e.key === 'Enter' && actions[selectedIndex]) {
        e.preventDefault();
        actions[selectedIndex].run();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, actions, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-24 px-3 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-slate-900/95 border border-blue-500/30 shadow-2xl shadow-blue-950/50 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Search & Voice Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <Sparkles className="w-5 h-5 text-zinc-500 dark:text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder='Ask or run anything... e.g. "park project for night", "export terraform", "deploy gpu", "security scan"'
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={toggleVoiceInput}
            title="Voice-to-Cloud Natural Language Input"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all shrink-0 ${
              isListening
                ? 'bg-red-500/20 border-red-500/50 text-red-300 animate-pulse'
                : 'bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
          >
            {isListening ? <MicOff className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" /> : <Mic className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />}
            <span className="hidden sm:inline">{isListening ? 'Listening...' : 'Voice Ops'}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Natural Language Prompt Chips */}
        <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/70 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 shrink-0 mr-1">
            Try:
          </span>
          {[
            { label: 'Park for night', q: 'park night' },
            { label: 'Blast Radius Map', q: 'topology' },
            { label: 'Export Terraform', q: 'terraform' },
            { label: 'Security Audit', q: 'security' },
            { label: 'Deploy GPU Cloud Run', q: 'deploy gpu' },
            { label: 'Burn-Rate Radar', q: 'burn rate' }
          ].map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => {
                setQuery(chip.q);
                setSelectedIndex(0);
              }}
              className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 whitespace-nowrap transition-colors"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Toast Feedback inside Palette */}
        {toastMsg && (
          <div
            className={`mx-4 mt-3 p-3 rounded-xl border text-xs flex items-center justify-between ${
              toastMsg.type === 'error'
                ? 'bg-red-950/50 border-red-500/40 text-red-200'
                : toastMsg.type === 'warning'
                ? 'bg-amber-950/50 border-amber-500/40 text-amber-200'
                : 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
            }`}
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {toastMsg.text}
            </span>
            <button onClick={() => setToastMsg(null)} className="text-[11px] underline ml-3">
              Dismiss
            </button>
          </div>
        )}

        {/* Action Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-slate-800/40">
          {actions.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              No matching cloud action found for "{query}". Try "sleep", "terraform", "topology", or "gpu".
            </div>
          ) : (
            actions.map((action, idx) => {
              const Icon = action.icon;
              const isSelected = idx === selectedIndex;
              const isBusy = executingId === `hibernate-SLEEP` && action.id === 'sleep-project' ||
                             executingId === `hibernate-WAKE` && action.id === 'wake-project';

              return (
                <button
                  key={action.id}
                  type="button"
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => action.run()}
                  className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center justify-between gap-3 transition-all ${
                    isSelected
                      ? 'bg-blue-500/15 border border-blue-500/30'
                      : 'hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${action.badgeColor}`}>
                      {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white truncate">{action.title}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${action.badgeColor}`}>
                          {action.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{action.subtitle}</p>
                    </div>
                  </div>
                  <ArrowRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-zinc-500 dark:text-zinc-400 translate-x-0.5' : 'text-slate-600'}`} />
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">↑↓</kbd> Navigate</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">↵</kbd> Execute</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">ESC</kbd> Close</span>
          </div>
          <span className="font-mono text-[10px] text-blue-400">
            Active Project: {projectId || 'None'}
          </span>
        </div>
      </div>
    </div>
  );
}
