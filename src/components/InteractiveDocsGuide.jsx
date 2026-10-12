import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Sparkles,
  DollarSign,
  Share2,
  Moon,
  FileCode2,
  ShieldAlert,
  Command,
  Zap,
  AlertTriangle,
  Globe,
  Leaf,
  GitCompare,
  Wand2,
  History,
  Rocket,
  Server,
  PowerOff,
  ArrowRight,
  CheckCircle2,
  Terminal,
  Info,
  Layers,
} from 'lucide-react';

const DOC_SECTIONS = [
  {
    id: 'quantum-nexus-2026-lab-star',
    wave: 'FLAGSHIP STAR · 2026 QUANTUM NEXUS (5 WORLD-FIRST BREAKTHROUGHS)',
    title:
      '2026 Quantum Nexus — Causal Blast-Radius Graph, Time-Machine State Rollback, FinOps Arbitrage Autopilot, Ephemeral PR Shadow Previews & Zero-Trust Honey-Token Deception Grid',
    badge: '2026 INNOVATION LAB (DEFAULT STAR)',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    icon: Sparkles,
    targetTab: 'INNOVATION_LAB',
    targetSubTab: 'QUANTUM_NEXUS',
    problemSolved:
      'Standard cloud consoles treat IAM, VPC Firewalls, Compute, Storage/BigLake, CI/CD, and Billing as isolated silos—so you cannot see cross-domain causal failure cascades, cannot snapshot and roll back whole-project configuration drift in 1 click, cannot automate Spot/Slot arbitrage with a hard-cap circuit-breaker, cannot mirror live production traffic into auto-expiring PR preview branches, and cannot plant active deception tripwires against credential thieves.',
    howItWorks: [
      'Breakthrough #1 — Cross-Cloud Blast-Radius & Causal Dependency Graph: Connects Identity (IAM Service Accounts), Network (VPC Firewalls), Compute (Cloud Run & VMs), Data (BigLake Iceberg & GCS), and Billing into one interactive causal simulator. Click any node and switch between Simulate Credential Breach, Cascading Outage, or DDoS/Spend Spike to inspect 1st/2nd-hop blast propagation.',
      '⏳ Breakthrough #2 — Time-Machine Flight Recorder & Verified 1-Click State Rollback: Captures cryptographic SHA-256 project state checkpoints (IAM bindings, open firewalls, Cloud Run revisions, VMs, and hourly burn), diffs any two snapshots side-by-side, and restores state behind a Human-in-the-Loop Approval Gate.',
      'Breakthrough #3 — Autonomous FinOps Autopilot & Commitment Arbitrage Engine: Identifies live Standard → Spot VM (-72%), Cloud Run Always-Allocated → Request-Only CPU (-68%), and BigQuery → BigLake Partition Pruning (-71%) arbitrage, plus an Automated Hard-Cap Budget Circuit-Breaker ($/mo & $/hr spike triggers).',
      'Breakthrough #4 — Live Ephemeral PR Preview Environments & Shadow Traffic Mirror: Clones any Cloud Run service into a PR preview stack that mirrors 5%–25% of live traffic asynchronously, compares Prod vs Shadow P95 latency & 5xx errors, and auto-self-destructs after its TTL (2h–24h) so dev stacks never become zombie bills.',
      'Breakthrough #5 — Zero-Trust Honey-Token & Active Breach Deception Grid: Plants decoy IAM Service Account .json keys, canary BigLake Parquet files, and Secret Manager honey-secrets that trigger instant VPC /32 IP-ban + credential quarantine the millisecond an attacker touches them.',
    ],
    apisUsed: [
      'GET /api/project/:id/quantum-nexus/overview (aggregates compute, run, storage, firewall & IAM state)',
      'POST /api/project/:id/quantum-nexus/action (CAPTURE_SNAPSHOT, ROLLBACK_SNAPSHOT, UPDATE_FINOPS_CIRCUIT_BREAKER, CREATE_EPHEMERAL_PR_ENV, PLANT_HONEY_TOKEN, TRIGGER_HONEY_TRIPWIRE_TEST)',
    ],
    billingImpact:
      '100% free control-plane engine; actively prevents runaway cloud bills, zombie PR preview environments, and credential-breach exfiltration costs.',
  },
  {
    id: 'wave10-2026-frontier-spanner-spark-workflows-armor',
    wave: 'WAVE 10 · 2026 FRONTIER STUDIO (SPANNER GRAPH, SPARK, WORKFLOWS & MODEL ARMOR)',
    title:
      'Spanner Graph & Geo-Partitioning ($65/mo 100-PU), Serverless Apache Spark 2.2, Cloud Workflows Visual Choreographer & Vertex AI Model Armor',
    badge: 'SPANNER GRAPH & SPARK TAB',
    badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    icon: Rocket,
    targetTab: 'WAVE10_FRONTIER',
    problemSolved:
      'Engineers often think Cloud Spanner still costs $730+/mo for a full node or requires a separate graph database like Neo4j, struggle with idle Dataproc cluster waste when running PySpark over BigLake Iceberg, lack a visual retry/compensation choreographer for multi-service sagas, and need inline prompt-injection & PII defense for Vertex AI / Gemini workloads.',
    howItWorks: [
      'Tab 1 — Spanner Graph (ISO GQL) + Granular 100-PU Sizing ($65/mo) & Geo-Partitioning: Provision fractional Spanner instances starting at 100 Processing Units (0.1 node = ~$65/mo with 99.999% SLA) and run unified SQL + ISO GQL Graph queries (GRAPH FinTechFraudGraph MATCH (a:Account)-[t:TRANSFERRED]->(b:Account)) on the same tables with zero ETL.',
      'Tab 2 — Dataproc Serverless for Apache Spark 2.2 (Scale-to-$0 Lakehouse Engine): Submit sub-5-second startup PySpark 3.5 / Spark SQL batches directly over BigLake Apache Iceberg tables with zero master/worker cluster management fees.',
      'Tab 3 — Cloud Workflows Visual Step-by-Step Saga & Compensation Choreographer: Visually design and execute multi-API cloud sagas with exponential backoff retries and automatic rollback compensation.',
      'Tab 4 — Vertex AI Model Armor & Prompt-Injection / PII Firewall: Real-time adversarial prompt scanner that intercepts jailbreaks, system-prompt extraction, SSRF/metadata probes, and regulated PII before reaching Gemini / Vertex AI.',
    ],
    apisUsed: [
      'GET /api/project/:id/wave10/overview → spanner.googleapis.com/v1 + dataproc.googleapis.com/v1 + workflows.googleapis.com/v1',
      'POST /api/project/:id/wave10/action (CREATE_SPANNER_INSTANCE, RUN_SPANNER_GQL, SUBMIT_SERVERLESS_SPARK, DEPLOY_WORKFLOW_SAGA, SCAN_MODEL_ARMOR)',
    ],
    billingImpact:
      'Unlocks fractional 100-PU Spanner (~$65/mo instead of $730/mo) and scale-to-$0 Serverless Spark batches ($0 idle cluster waste).',
  },
  {
    id: 'biglake-vs-bigquery-open-iceberg-2026',
    wave: 'BIGLAKE & APACHE ICEBERG · OPEN LAKEHOUSE STUDIO',
    title:
      'BigLake vs. BigQuery Demystified Studio — Open Apache Iceberg Tables, Cross-Engine Governance & 1-Click BigLake Wizard',
    badge: 'BIGQUERY & BIGLAKE TAB (TAB 5)',
    badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    icon: Layers,
    targetTab: 'BIGQUERY_STUDIO',
    problemSolved:
      'Engineers frequently confuse Google BigQuery with Google BigLake, leading to duplicate data copies in proprietary storage when they actually need open Parquet/Apache Iceberg files on Cloud Storage governed by a single row/column-level security policy across BigQuery, Spark, Trino, and Vertex AI.',
    howItWorks: [
      'Interactive "BigQuery vs. BigLake" Side-by-Side Architecture Clarifier: Explains Storage Location, File Format (Proprietary Capacitor vs Open Apache Iceberg/Parquet/Delta), Multi-Engine Read/Write (BigQuery + Spark + Flink + Presto), Fine-Grained Row/Column Security, and Governance Connection Architecture.',
      '"Which One Do I Need?" Decision Matrix: Instant architectural recommendation based on your workload (Pure SQL Warehouse vs Open Apache Iceberg Lakehouse vs Multi-Cloud Omni).',
      '1-Click BigLake Connection + Managed Apache Iceberg Table Provisioner: Creates the BigQuery Cloud Resource Connection, binds the Connection Service Account IAM role on your GCS bucket, and executes CREATE EXTERNAL TABLE ... WITH CONNECTION ... OPTIONS(format="ICEBERG" | "PARQUET", metadata_cache_mode="AUTOMATIC").',
    ],
    apisUsed: [
      'GET /api/project/:id/bigquery/biglake/overview',
      'POST /api/project/:id/bigquery/biglake/create → bigqueryconnection.googleapis.com/v1 + bigquery.googleapis.com/bigquery/v2/projects/:id/jobs',
    ],
    billingImpact:
      'Eliminates duplicate warehouse storage bills by keeping a single open Parquet/Iceberg copy on Cloud Storage ($0.020/GB-mo) with BigLake metadata caching.',
  },
  {
    id: 'sovereign-iam-owner-guard-and-sa-key-killswitch',
    wave: 'SOVEREIGN IAM · OWNER SELF-PROTECTION & STOLEN KEY KILL-SWITCH VAULT',
    title:
      'Sovereign IAM Owner Self-Protection, Human Approval Gate & Service Account .json Key / OAuth2 Token Kill-Switch Vault',
    badge: 'SOVEREIGN & IAM TAB',
    badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    icon: ShieldAlert,
    targetTab: 'SOVEREIGN_STUDIO',
    problemSolved:
      'Standard IAM recommenders naively flag the authenticated project owner (roles/owner) as "excessive privilege" and can lock you out if clicked accidentally—and if a Service Account .json key or OAuth token is stolen, engineers need one place to inspect, create, download, disable, or permanently revoke keys in seconds.',
    howItWorks: [
      'Active Session Owner Self-Protection (PROTECTED OWNER badge): Cross-references every IAM binding against your active authenticated account so your own roles/owner binding is protected and never auto-targeted for downgrade.',
      'Mandatory Human-in-the-Loop Approval Modal: Every IAM privilege reduction requires reviewing the exact gcloud iam command, typing or confirming impact, and clicking Approve & Execute.',
      'Service Account .json Key & OAuth2 Token Kill-Switch Vault: Dedicated top sub-tab switcher + compact collapsible IAM roles list so you can immediately access all Service Accounts, create & download a new .json key, disable/re-enable a key to test breakage, permanently delete a leaked key, or run the 1-Click Emergency Key Purge + Active OAuth Token Revocation.',
    ],
    apisUsed: [
      'GET /api/project/:id/sovereign-iam/credentials → iam.googleapis.com/v1/projects/:id/serviceAccounts/:email/keys',
      'POST /api/project/:id/sovereign-iam/credentials/action (CREATE_SA_KEY, DISABLE_SA_KEY, ENABLE_SA_KEY, DELETE_SA_KEY, EMERGENCY_REVOKE_ALL_SA_KEYS, REVOKE_ACTIVE_OAUTH_TOKEN)',
    ],
    billingImpact:
      '100% free IAM control plane; neutralizes stolen Service Account .json keys before attackers can spin up rogue GPU/crypto miners.',
  },
  {
    id: 'wave3-engineer-moonshots-x1-x6',
    wave: 'WAVE 6 · ENGINEER MOONSHOT LAB (X1–X6)',
    title:
      '6 Out-of-the-Box Cloud Engineering Moonshots (DLP X-Ray, Cold-Start Surgeon, Egress Tollbooth, Ransomware Air-Gap, Anycast Latency & AES-256-GCM Gemini 3.8 / 3.1 Vault)',
    badge: '2026 LAB · MOONSHOTS X1–X6',
    badgeColor: 'bg-red-500/15 text-red-500 border-red-500/30',
    icon: Rocket,
    targetTab: 'INNOVATION_LAB',
    targetSubTab: 'MOONSHOT_X1_DLP',
    problemSolved:
      'Engineers constantly battle leaked credentials/PII inside Cloud Storage buckets, mysterious 1.5s–3.5s Cloud Run cold starts, hidden cross-region egress bandwidth taxes, ransomware bucket deletion risks, global client latency blindspots, and how to use live Gemini 3.8 Flash / 3.1 Pro without ever writing an API key to disk or browser localStorage.',
    howItWorks: [
      'X1 — Cloud Storage Live DLP, Secret Leak & PII X-Ray Scanner + 1-Tap In-Place Redactor: Streams object bytes in server memory to detect leaked GCP Service Account keys, AWS keys, GitHub PATs, Stripe keys, JWTs, Credit Cards, IBANs, and SSNs—with a 1-Tap Canary Injector and 1-Tap In-Place Cryptographic Redactor.',
      'X2 — Serverless Cold-Start Profiler & Container Diet Surgeon: Breaks down Cloud Run startup into 5 phases (Image Pull, Sandbox Init, Runtime Boot, Weight Tax, Warm P50), patches Startup CPU Boost + Gen2 Execution Environment in 1 tap, and synthesizes a multi-stage Distroless Dockerfile.',
      'X3 — Cross-Service Egress & Hidden Data-Gravity Tollbooth: Cross-references every Compute VM and Cloud Run service region against your Cloud Storage bucket locations using the Live Pricing Catalog to flag cross-region ($0.02/GB) and inter-continental ($0.08–$0.12/GB) bandwidth taxes.',
      'X4 — Cryptographic Ransomware Air-Gap & Clean-Room Recovery Auditor: Scores every bucket on a 0–100 Ransomware Survival scale, computes exact RTO/RPO, and applies a 1-Tap 30-Day Soft-Delete + Object Versioning Air-Gap Shield.',
      'X5 — 12-Metropolis Speed-of-Light User-Experience & Anycast Edge Latency Matrix: Calculates great-circle fiber distance and TLS RTT from 12 global population hubs to your active GCP regions vs Google Cloud CDN Anycast Edge.',
      'X6 — Option 3 AES-256-GCM Encrypted Google AI Studio BYOK RAM Vault (Gemini 3.8 Flash & 3.1 Pro): Seals your AIzaSy... key in volatile Node.js RAM using crypto.createCipheriv("aes-256-gcm") with an 8,192-token output budget, live /v1beta/models auto-discovery, and 3-step onboarding when empty.',
    ],
    apisUsed: [
      'POST /api/project/:id/storage/buckets/:bucket/dlp-scan & /dlp-redact',
      'GET /api/ai-vault/status, GET /api/ai-vault/models, POST /api/ai-vault/configure & POST /api/project/:id/ai-vault/ask',
      'POST /api/project/:id/storage/buckets/:bucket/security-patch & PATCH /api/project/:id/cloudrun/:region/:name',
    ],
    billingImpact:
      '100% free telemetry & in-memory security inspection. Prevents compliance fines, egress waste, and cold-start latency.',
  },
  {
    id: 'dedicated-cloud-sql-alloydb-studio',
    wave: 'CLOUD SQL & ALLOYDB · RELATIONAL & AI VECTOR STUDIO',
    title:
      'Dedicated Cloud SQL (MySQL 8.4 LTS & PostgreSQL 16/17) + Google Cloud AlloyDB Studio',
    badge: 'CLOUD SQL & ALLOYDB TAB + PROVISION MODAL',
    badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    icon: Layers,
    targetTab: 'CLOUD_SQL_STUDIO',
    problemSolved:
      'Choosing between MySQL and PostgreSQL—and when using PostgreSQL, deciding whether to deploy Classic/Enterprise Plus Cloud SQL or Google Cloud AlloyDB—requires comparing storage architectures, failover SLAs, AI vector indexes, and strict regulatory compliance locks.',
    howItWorks: [
      'Engine Family & Architecture Fork: Select MySQL (8.4 LTS / 8.0) or PostgreSQL (16 / 17 / 15). When PostgreSQL is selected, fork between Classic / Enterprise Plus Cloud SQL (sqladmin.googleapis.com/v1) and Google Cloud AlloyDB (alloydb.googleapis.com/v1). Selecting MySQL automatically locks out AlloyDB with a badge.',
      'Classic Cloud SQL vs. AlloyDB TCO Comparator: Simulates vCPUs, Storage GB, Read Replicas, Vector RAG, and HTAP workloads to compare Cloud SQL Enterprise, Cloud SQL Enterprise Plus, and AlloyDB across failover SLA (<60s vs <2s vs <1s) and Cost per 1,000 TPS.',
      'AI Vector (ScaNN / pgvector / MySQL 8.4 VECTOR) & Slow-Query Index Surgeon + Zero-Password IAM Auth Proxy v2 Vault.',
    ],
    apisUsed: [
      'GET /api/project/:id/wave9/cloud-sql → sqladmin.googleapis.com/v1 + alloydb.googleapis.com/v1',
      'POST /api/project/:id/provision (serviceType: "CLOUD_SQL", sqlArchitecture: "CLOUD_SQL" | "ALLOYDB")',
    ],
    billingImpact:
      'Displays exact pre-deploy hourly and monthly FinOps estimates before provisioning any database instance or cluster.',
  },
  {
    id: 'dedicated-gke-studio',
    wave: 'GKE STUDIO · AUTOPILOT & SPOT GPU KUBERNETES',
    title:
      'Dedicated Google Kubernetes Engine (GKE) Autopilot, Spot GPU & Workload Studio',
    badge: 'GKE STUDIO TAB + PROVISION MODAL',
    badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    icon: Server,
    targetTab: 'GKE_STUDIO',
    problemSolved:
      'Provisioning hardened GKE Autopilot or Standard Spot GPU clusters with Workload Identity OIDC, Private Nodes, Shielded Nodes, and Binary Authorization normally requires dozens of complex gcloud flags and manual Kubernetes manifests.',
    howItWorks: [
      '1-Click GKE Autopilot & Standard Spot GPU Cluster Provisioner: Enforces strict compliance locks () across SEC/FedRAMP, GDPR EU, HIPAA BAA, and AI Spot GPU presets.',
      'K8s Workload YAML & Spot GPU Deployment Composer: Generates production Kubernetes Deployment + Service + HorizontalPodAutoscaler manifests and 1-click kubectl apply commands.',
      'Live GKE Fleet & 1-Tap kubeconfig / Cloud Shell Connector.',
    ],
    apisUsed: [
      'GET /api/project/:id/wave9/gke-vertex → container.googleapis.com/v1/projects/:id/locations/-/clusters',
      'POST /api/project/:id/provision (serviceType: "GKE_CLUSTER") & DELETE /api/project/:id/gke/clusters/:location/:name',
    ],
    billingImpact:
      'GKE Autopilot empty clusters cost $0.00/hr under the GKE Free Tier management credit ($74.40/mo); Spot GPU node pools save up to 68%.',
  },
  {
    id: 'cloud-run-2026-vpc-storage-gke-migrator',
    wave: 'CLOUD RUN 2026 · CONTAINER SSH, DIRECT VPC, STORAGE VOLUMES & GKE MIGRATOR',
    title:
      'Cloud Run 2026 Container SSH (@xterm/xterm + gcloud beta run services ssh), Direct VPC Egress, Storage Volumes & 1-Click GKE Migrator',
    badge: 'CLOUD RUN TAB + PROVISION MODAL',
    badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    icon: Rocket,
    targetTab: 'CLOUD_RUN',
    problemSolved:
      'Debugging live Cloud Run containers, configuring Direct VPC Egress or Stateful Storage Volume Mounts, toggling Public vs. Private IAM access safely, or migrating a Cloud Run service to Kubernetes normally requires scattered CLI flags and manual YAML editing.',
    howItWorks: [
      'Interactive Cloud Run Container SSH (@xterm/xterm + gcloud beta run services ssh): Click "SSH / Container Shell" on any Cloud Run service card (default OFF; toggle off with "SSH Active (Turn Off)") to open a real browser PTY shell inside the running container (~ #). Automatically enables --ssh and --execution-environment=gen2 (>=512Mi) if missing, warms up the active revision, and also supports gcloud beta run services proxy.',
      'Accurate Public (allUsers / invokerIamDisabled) vs. Private (IAM Auth) State & Gatekeeper: Detects both IAM allUsers bindings and Cloud Run v2 invokerIamDisabled state, displays "PUBLIC (Unauthenticated) · Switch to Private" vs. "PRIVATE (IAM Auth) · Switch to Public", and requires explicit confirmation before switching access modes.',
      '2026 Direct VPC Egress Network (template.vpcAccess) & Beta Storage Volume Mounts (GCS FUSE / RAM Disk / Filestore NFS): Attach revisions directly to any VPC/Subnet ($0 Serverless VPC Connector tax) and mount stateful or RAM-disk volumes.',
      '1-Click Cloud Run → GKE Kubernetes 6-Manifest Transpiler & Live Cluster Migrator: Converts any running Cloud Run service into a 6-resource production Kubernetes bundle and deploys it directly to your live GKE cluster in 1 click.',
    ],
    apisUsed: [
      'WS /api/ws/ssh?targetType=cloudrun → gcloud beta run services ssh / proxy PTY',
      'POST /api/project/:id/provision (serviceType: "CLOUD_RUN") & PATCH /api/project/:id/cloudrun/:region/:name',
      'POST /api/project/:id/cloudrun/:region/:name/iam & POST /api/project/:id/cloudrun/convert-to-gke',
    ],
    billingImpact:
      'Direct VPC Egress eliminates ~$14.60/mo Serverless VPC Connector instance charges; migrating warm Cloud Run services to GKE Spot VMs/GPUs cuts compute spend by up to 68%.',
  },
  {
    id: 'xterm-web-ssh-and-mandatory-delete-gatekeeper',
    wave: 'OPEN-SOURCE @XTERM/XTERM WEB-SSH & ZERO-TRUST SAFETY GATEKEEPER',
    title:
      'Real Open-Source Browser SSH (@xterm/xterm + ssh2 + Linux PTY) & Global Mandatory Delete / IAM Exposure Gatekeeper',
    badge: 'VM FLEET + CLOUD RUN + ALL 16 STUDIOS',
    badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    icon: Terminal,
    targetTab: 'VM_SSH',
    problemSolved:
      'One-shot command emulators truncate multi-line streaming commands like "apt update" or interactive tools like htop/vim, while auto-connecting SSH on tab load wastes sessions and unconfirmed delete or IAM exposure buttons risk accidental production outages.',
    howItWorks: [
      'Real Full-Duplex @xterm/xterm + ssh2 + Python PTY WebSocket Terminal (/api/ws/ssh): Streams 100% of live stdout/stderr bytes in real time for "apt update", htop, vim, top, tmux, and interactive prompts across Compute Engine VMs and Cloud Run Gen2 containers.',
      'Default-OFF Explicit Toggle ("SSH / Console" → "SSH Active (Turn Off)"): Never auto-connects when landing on the VM Fleet or Cloud Run tab; connects only when you click the SSH button on a specific VM or Cloud Run card and disconnects cleanly when toggled off.',
      'Global Mandatory Delete & IAM Security Gatekeeper (src/App.jsx): Intercepts 100% of HTTP DELETE requests, destructive POST teardowns (VM delete, Bucket empty-and-delete, Zombie extermination, Artifact Registry image deletion, SA key revocation), and Cloud Run Public/Private IAM toggles with a high-visibility confirmation modal.',
    ],
    apisUsed: [
      'WS /api/ws/ssh (Engines: Auto, Direct SSH2 :22, gcloud compute ssh PTY, IAP Tunnel, Cloud Run SSH PTY)',
      'Global Axios Request Interceptor: classifyDestructiveAxiosConfig() + <MandatoryDeleteConfirmationModal />',
    ],
    billingImpact:
      '100% free open-source browser terminal (@xterm/xterm + ssh2) and zero-cost safety gatekeeper that prevents accidental resource deletion or unintended public exposure.',
  },
  {
    id: 'cloud-functions-eventarc-demystified-studio',
    wave: 'CLOUD FUNCTIONS (v1 & v2) · DEMYSTIFIED EVENTARC TRIGGER STUDIO',
    title:
      'Cloud Functions (1st Gen & 2nd Gen) + Visual Eventarc Trigger Wizard & 1-Tap IAM Auto-Doctor',
    badge: 'FUNCTIONS & EVENTARC TAB',
    badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    icon: Zap,
    targetTab: 'FUNCTIONS_STUDIO',
    problemSolved:
      'When Google Cloud moved from 1st Gen (v1) to 2nd Gen (v2 + Eventarc), newcomers stayed stuck on v1 because Eventarc hid 3 required service-agent IAM roles, demanded raw CloudEvents strings, and mixed free direct Pub/Sub triggers with paid Cloud Audit Log (DATA_WRITE) triggers.',
    howItWorks: [
      'Plain-English Eventarc Trigger Wizard ("v1 Simplicity with v2 Power"): Pick "When a file is uploaded to Bucket X", "When a Pub/Sub message arrives", "When a BigQuery job finishes", or "On a Cron Schedule" without memorizing CloudEvents filter syntax.',
      '4-Stage Visual Eventarc Pipeline X-Ray & Synthetic CloudEvent Tester: Shows Producer → Transport Bus ($0 Free Direct Pub/Sub vs Cloud Audit Logs) → Eventarc Filter & IAM → Function Handler, and lets you fire a synthetic CloudEvent v1.0 payload in 1 click.',
      '1-Tap Eventarc IAM Auto-Doctor + 1-Click v1 → v2 Upgrader: Automatically binds roles/pubsub.publisher on the GCS Service Agent, roles/eventarc.eventReceiver, and roles/run.invoker, and upgrades legacy v1 functions (1 req/instance) to v2 (up to 1,000 req/instance, saving up to 78%).',
    ],
    apisUsed: [
      'GET /api/project/:id/functions/overview → cloudfunctions.googleapis.com/v2 + v1 + eventarc.googleapis.com/v1',
      'POST /api/project/:id/functions/iam-doctor, POST /api/project/:id/functions/deploy & POST /api/project/:id/functions/test-event',
    ],
    billingImpact:
      'Includes 2,000,000 free invocations/month; upgrading I/O-bound functions from v1 (1x concurrency) to v2 (80–250x concurrency) cuts active instance hours by up to 78%.',
  },
  {
    id: 'cloud-build-github-cicd-studio',
    wave: 'CLOUD BUILD CI/CD · GITHUB SOURCE-TO-CONTAINER STUDIO',
    title:
      'Dedicated Cloud Build & GitHub Source-to-Container Studio (Zero-Dockerfile Buildpacks + Dockerfile + Auto-Deploy)',
    badge: 'CLOUD BUILD TAB + CLOUD RUN / GKE MODAL',
    badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    icon: Zap,
    targetTab: 'WAVE9_STUDIO',
    problemSolved:
      'Deploying custom applications to Cloud Run or GKE shouldn’t require local Docker builds or manual Artifact Registry repository creation.',
    howItWorks: [
      '3-Way Container Source Selector: Available both in the dedicated Cloud Build tab and inline inside Cloud Run and GKE provisioning—choose Project Artifact Registry images, Public Docker/GCR URIs, or build directly from any GitHub Repository URL + branch.',
      'Zero-Dockerfile Cloud Buildpacks & Dockerfile Engine: Automatically creates your target Artifact Registry Docker repository if missing, builds the container image on Google Cloud Build, and optionally deploys the built image straight to Cloud Run or GKE.',
    ],
    apisUsed: [
      'GET /api/project/:id/cloudbuild/overview → cloudbuild.googleapis.com/v1 + artifactregistry.googleapis.com/v1',
      'POST /api/project/:id/cloudbuild/github-build',
    ],
    billingImpact:
      'Google Cloud Build includes 120 free build-minutes per day on the standard pool.',
  },
  {
    id: 'dedicated-bigquery-2026-studio',
    wave: 'BIGQUERY STUDIO · PHYSICAL COMPRESSED LAKEHOUSE',
    title:
      'BigQuery 2026 Enterprise Lakehouse, Physical Billing (-54%) & 168h Time-Machine Studio',
    badge: 'BIGQUERY STUDIO TAB + PROVISION MODAL',
    badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    icon: Layers,
    targetTab: 'BIGQUERY_STUDIO',
    problemSolved:
      'Uncompressed Logical BigQuery billing overcharges high-compression datasets by up to 2.2x, while unpartitioned SELECT * queries can accidentally scan terabytes of data.',
    howItWorks: [
      'Strict Compliance Blueprints (SEC/FINRA, GDPR EU, HIPAA, AI Vector BigLake): Locks jurisdiction, Physical Capacitor compressed billing (-54%), and 48h–168h Time-Travel windows.',
      'Pre-Crime SQL Dry-Run X-Ray & Auto-SQL Partition/Cluster Optimizer: Estimates exact bytes billed and query cost before execution.',
      '⏪ 168-Hour FOR SYSTEM_TIME AS OF Time-Machine & 1-Tap Storage Billing Model Switcher (LOGICAL ↔ PHYSICAL).',
    ],
    apisUsed: [
      'GET /api/project/:id/bigquery/datasets & POST /api/project/:id/provision (serviceType: "BIGQUERY_DATASET")',
      'POST /api/project/:id/bigquery/dry-run → bigquery.googleapis.com/bigquery/v2/projects/:id/jobs',
    ],
    billingImpact:
      'Empty datasets cost $0.00/mo; Physical Compressed billing reduces active storage spend by up to 54% on compressible analytical tables.',
  },
  {
    id: 'dedicated-data-engineering-2026-studio',
    wave: 'DATA ENGINEER STUDIO · MEDALLION ELT, DATAFORM, DATAPLEX & SLOT DOCTOR (gcloud 588.0.0)',
    title:
      '2026 Data Engineering Studio: Source-to-Gold Medallion ELT, Dataform/dbt SQLX Auto-Clean, Dataplex Data Mesh & Slot Doctor',
    badge: 'DATA ENGINEER TAB',
    badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    icon: Layers,
    targetTab: 'DATA_ENGINEER_STUDIO',
    problemSolved:
      'Data engineers on Google Cloud traditionally have to juggle 8 disconnected consoles (GCS, BigQuery DTS, Dataform, Dataplex, Dataproc Serverless, Dataflow, Cloud Composer at $350/mo idle, and INFORMATION_SCHEMA.JOBS) while manually writing deduplication SQL, debugging stage skew, and worrying about breaking downstream BI views.',
    howItWorks: [
      '1-Canvas "Source-to-Gold" Medallion ELT Pipeline Builder + Smart Engine & Cost Advisor: Connect any source (GCS Parquet/JSON/CSV, BigQuery DTS SaaS, Pub/Sub, Cloud SQL CDC) through Bronze (BigLake Raw), Silver (Deduplicated & Typed), and Gold (BI Mart) with a live engine cost comparison across BigQuery SQL ($0 idle), Dataproc Serverless Spark 2.2 ($0 idle), Dataflow Streaming, and Cloud Workflows ($0.05/mo vs $350/mo Cloud Composer).',
      'Dataform (.sqlx) & dbt (.sql) Visual SQLX Studio + 1-Tap Auto-Clean: Generates production Dataform .sqlx and dbt incremental models with QUALIFY ROW_NUMBER() = 1 deduplication, SAFE_CAST / TRIM / UPPER hygiene, SHA256 PII masking, and partition/cluster keys — and executes or provisions native Dataform Repositories (dataform.googleapis.com/v1beta1) in 1 click.',
      'Dataplex Auto-Profiling / Data Quality Scans & Data Mesh Products (gcloud 588.0.0): Launches real gcloud dataplex datascans create data-profile / data-quality jobs, provisions Dataplex Data Mesh Products (gcloud dataplex data-products), and runs gcloud dataplex dbt metadata-jobs.',
      'Schema Drift & Downstream Contract Firewall + Live BigQuery Slot Contention Doctor & Composer-Lite Serverless DAGs: Maps source-to-target schemas with non-breaking View Adapters and diagnoses real-time INFORMATION_SCHEMA.JOBS_BY_PROJECT slot contention while deploying $0-idle Cloud Workflows ELT DAGs.',
    ],
    apisUsed: [
      'GET /api/project/:id/data-engineer/overview & POST /api/project/:id/data-engineer/action',
      'dataform.googleapis.com/v1beta1, dataplex.googleapis.com/v1 (gcloud 588.0.0 datascans & data-products), bigquerydatatransfer.googleapis.com/v1 & workflows.googleapis.com/v1',
    ],
    billingImpact:
      'Replaces $350/mo always-on Cloud Composer environments with $0.05/mo Serverless Cloud Workflows ELT DAGs and enforces Partition + Cluster pruning across Bronze/Silver/Gold tables.',
  },
  {
    id: 'artifact-registry-sbom-studio',
    wave: 'ARTIFACT REGISTRY · SLSA-3 SUPPLY-CHAIN & ORPHAN SWEEPER',
    title:
      'Artifact Registry SLSA-3 Supply-Chain & 1-Click Orphan Digest Sweeper Studio',
    badge: 'ARTIFACT REGISTRY & SBOM TAB',
    badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    icon: Layers,
    targetTab: 'WAVE9_STUDIO',
    problemSolved:
      'CI/CD pipelines leave behind dozens of untagged orphan container digests that silently bill $0.10/GB-month forever, and mutable image tags (:latest / :v1.0) allow tag-mutation supply-chain attacks.',
    howItWorks: [
      'Immutable Tag Repository Provisioner: Enforces dockerConfig.immutableTags = true across SEC/FedRAMP, GDPR EU, and HIPAA container registries.',
      '1-Click Live Digest Deletion & Batch Orphan Sweeper: Delete individual container digests, sweep all untagged orphan layers in one click, or delete repositories directly from the UI.',
    ],
    apisUsed: [
      'GET /api/project/:id/wave9/supply-chain & POST /api/project/:id/wave9/supply-chain/create-repo',
      'POST /api/project/:id/wave9/supply-chain/delete-image & POST /api/project/:id/wave9/supply-chain/sweep-orphans',
    ],
    billingImpact:
      'Directly reclaims wasted monthly Artifact Registry storage spend by sweeping untagged orphan container digests.',
  },
  {
    id: 'cloud-storage-5step-compliance-studio',
    wave: 'CLOUD STORAGE · ENTERPRISE COMPLIANCE & 5-STEP WIZARD',
    title:
      '5-Step Fine-Grained Cloud Storage Provisioning Wizard & Regulatory Compliance Studio (SEC 17a-4, HIPAA, GDPR, Sovereign Zero-Trust)',
    badge: 'CLOUD STORAGE TAB + PROVISION MODAL',
    badgeColor: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
    icon: Layers,
    targetTab: 'CLOUD_STORAGE',
    problemSolved:
      'Creating a production Cloud Storage bucket requires fine-grained control over Region vs Dual-Region (custom pair + 15-minute Turbo Replication RPO) vs Multi-Region topology, Autoclass vs manual storage classes, Uniform vs Fine-grained ACLs, WORM Retention Locks, Soft-Delete windows, CMEK encryption, and Lifecycle policies.',
    howItWorks: [
      '5-Step Google Cloud Console Parity Wizard: Step 1 (Location Type: Region, Dual-Region custom pairs + Turbo RPO, or Multi-Region US/EU/ASIA), Step 2 (Default Storage Class or Autoclass + Hierarchical Namespace HNS), Step 3 (Public Access Prevention + Uniform vs Fine-grained Access Control), Step 4 (Soft Delete 0–90d, Object Versioning + max versions, WORM Retention Policy + Lock, Google-managed vs Cloud KMS CMEK), Step 5 (Lifecycle rules, Requester Pays, CORS origins, and Key=Value FinOps labels).',
      '1-Tap Regulatory Blueprints: Pre-fills SEC Rule 17a-4 / FINRA Immutable WORM Vault, HIPAA / HITECH ePHI Vault, EU GDPR Sovereign Boundary (europe-west3), FinOps Intelligent Tiering Lake, or Ransomware Air-Gap Backup Vault.',
      'Live Bucket Compliance Posture Matrix (0–100 Score): Audits every existing bucket in your project with 1-tap remediation for Public Access Prevention, Uniform Access, Soft Delete, Versioning, and Lifecycle rules.',
    ],
    apisUsed: [
      'POST /api/project/:id/provision (resourceType: "GCS_BUCKET") → storage.googleapis.com/storage/v1/b',
      'POST /api/project/:id/storage/buckets/:bucket/security-patch → PATCH storage.googleapis.com/storage/v1/b/:bucket',
    ],
    billingImpact:
      'Enforces lifecycle auto-tiering and archival deletion rules to continuously compress monthly storage spend.',
  },
  {
    id: 'live-cloud-billing-pricing-sync',
    wave: 'VARIABLE PRICING ENGINE · ZERO STALE RATES',
    title:
      'Live Google Cloud Billing Catalog Price Sync & Custom Enterprise Discount Override Bar',
    badge: 'GLOBAL MAP + 2026 LAB + SRE AUDITOR',
    badgeColor: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
    icon: DollarSign,
    targetTab: 'INNOVATION_LAB',
    targetSubTab: 'FINOPS_SLEEP',
    problemSolved:
      'Cloud providers periodically change SKU rates, regional tier multipliers, and egress fees, or organizations negotiate custom Enterprise / EDP discounts. Hardcoding static prices causes inaccurate FinOps burn-rate reporting.',
    howItWorks: [
      'Sync Live GCP Prices Button: Queries GET /api/pricing/live-sync (which probes cloudbilling.googleapis.com/v1/services/6F81-5844-456A/skus when authenticated) to refresh compute, serverless, GPU, storage, and egress rates on demand.',
      'Global Price Adjustment Factor (0.50x–1.50x) & Per-SKU Override Editor: Lets you apply your organization’s negotiated enterprise discount or edit any individual rate (e2-medium, Cloud Run vCPU, L4 GPU, Standard Storage, Egress) and immediately recalculates every FinOps metric across the entire app.',
    ],
    apisUsed: [
      'GET /api/pricing/live-sync → cloudbilling.googleapis.com/v1/services',
      'Shared React Pricing Hook: useLivePricingCatalog() & <LivePricingCatalogControlBar />',
    ],
    billingImpact:
      '100% free catalog sync. Ensures all FinOps projections match your real-world billing rates.',
  },
  {
    id: 'wave5-autonomous-cloud-brain',
    wave: 'WAVE 5 · AUTONOMOUS CLOUD BRAIN',
    title:
      '"Pre-Crime" 30-Day Billing Time-Crystal, Failure Cascade X-Ray & Dream Stack Compiler',
    badge: '2026 LAB · TAB 1 (NEW)',
    badgeColor: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
    icon: Sparkles,
    targetTab: 'INNOVATION_LAB',
    targetSubTab: 'DREAM_BRAIN',
    problemSolved:
      'Cloud consoles only show past billing invoices after the money is already spent, never warn you which day/hour a traffic spike or infinite retry loop will exhaust your budget, and force you to manually stitch together multi-service architectures without knowing which region is cheapest, greenest, and hardware-compatible.',
    howItWorks: [
      '"Pre-Crime" 30-Day Billing Time-Crystal Simulator: Combines your live project $/hr burn rate with a configurable Monthly Hard Budget Cap ($20–$1,000) and lets you inject anomaly scenarios (35x Viral Traffic Spike, 120x Runaway Retry Loop, 4x NVIDIA L4 GPU Surge, 8 TB Egress Flood). Plots a 30-day SVG trajectory showing the exact Day & Hour of budget exhaustion and how much money is saved when the Autonomous $0-Idle Circuit-Breaker is armed.',
      '"What-If" Resource Blast-Radius & Failure Cascade X-Ray: Click any live VPC, Firewall Rule, Cloud Run Service, Compute VM, GCS Bucket, or BigQuery Dataset to inspect its Blast Severity Score (/100), Upstream Entrypoints, Downstream Failure Cascade, and a 1-click Self-Healing CLI command.',
      'Autonomous Cloud Architecture Compiler: Select a production archetype (Zero-Trust L4 GPU RAG Stack, EU GDPR Sovereign Lakehouse, Ultra-Frugal Spot Mesh, or 98% CFE Green Core). Automatically scans all 40 GCP regions for GPU SKU support, Tier-1 pricing, and highest Carbon-Free Energy % to output an itemized Bill of Materials ($/mo) and a full gcloud + bq deployment script.',
    ],
    apisUsed: [
      'Live telemetry from GET /api/project/:id/overview & GET /api/project/:id/vms',
      'POST /api/project/:id/hibernate (1-Tap Emergency $0-Idle Circuit-Breaker)',
      'POST /api/project/:id/provision (1-Tap Component Provisioning into Optimal Region)',
    ],
    billingImpact:
      '100% free simulation ($0 cost). Prevents catastrophic surprise cloud bills before they happen.',
  },
  {
    id: 'wave5-sku-finops-migration-engine',
    wave: 'WAVE 5 · FINOPS & SKU GATEKEEPER',
    title:
      'Regional GPU/Service SKU Gatekeeper & Live Migration FinOps Break-Even Calculator',
    badge: 'GLOBAL MAP + 2026 LAB · TAB 8',
    badgeColor: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
    icon: Leaf,
    targetTab: 'INNOVATION_LAB',
    targetSubTab: 'TELEPORT_DIFF',
    problemSolved:
      'Migrating a workload strictly for Carbon-Free Energy (CFE%) can fail at deploy time if the destination region lacks required hardware (e.g., Cloud Run NVIDIA L4 GPUs are only in 10 of 40 regions), or cause a +38% monthly bill jump when moving from a Tier-1 region (1.00x) to a Tier-2 region (1.38x) plus cross-continental egress fees.',
    howItWorks: [
      'Pre-Flight Hardware & Service SKU Gatekeeper: Maps all 40 GCP regions against Cloud Run Serverless L4 GPUs, Compute Engine G2 L4 GPU VMs, and A3 H100 / TPU v5e Mega-Hubs. Blocks incompatible migrations before API dispatch and offers 1-click "Switch to Greenest GPU-Compatible Region" or "Strip GPU & Deploy as CPU-Only".',
      '3-Part Live Migration FinOps Receipt: Computes (1) Ongoing Monthly Compute Spend Delta ($source/mo → $target/mo using real regional price multipliers from 1.00x to 1.38x), (2) One-Time Container & State Egress Transfer Fee ($0.02/GB intra-continental vs $0.08–$0.12/GB inter-continental), and (3) FinOps Break-Even Payback in Days.',
      'Smart 3-Way Destination Recommender: Recommends the #1 Greenest SKU-Compatible Region, #1 Cheapest + Green Arbitrage Region, and #1 Same-Continent Low-Egress Peer.',
    ],
    apisUsed: [
      'Shared 40-Region Engine: evaluateMigrationFeasibility() & findBestMigrationTargets()',
      'POST /api/project/:id/cloudrun/teleport → run.googleapis.com/v2',
    ],
    billingImpact:
      'Eliminates failed GPU deployments and calculates exact monthly savings and egress payback days before you migrate.',
  },
  {
    id: 'wave3-orbital-hud',
    wave: 'WAVE 3 · 2030 ORBITAL UI',
    title: '2030 Orbital Telemetry HUD, Stack Synthesizer & Flight Recorder',
    badge: 'TOP RIBBON HUD',
    badgeColor: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
    icon: Wand2,
    targetTab: 'OVERVIEW',
    problemSolved:
      'In the standard Google Cloud Console, deploying a connected 3-tier application (Storage + BigQuery + Cloud Run) requires visiting 3 separate product consoles and manually copying resource URIs. Furthermore, if you make a mistake, there is no single "Undo" button.',
    howItWorks: [
      'Live Orbital Telemetry Ribbon: Continuously measures your real REST API Round-Trip Time (ms), calculates your project-wide Carbon-Free Energy score (CFE%), grades your security posture (A+ to B), and counts active workloads across Americas, Europe, APAC, and MENA.',
      '1-Tap Stack Synthesizer: Lets you pick a complete architecture blueprint (AI RAG Inference Stack, Real-Time Lakehouse, or Zero-Trust Edge Stack) and provisions a Cloud Storage Bucket + BigQuery Dataset + Cloud Run Gen2 Service in parallel, automatically injecting GCS_BUCKET_URI and BIGQUERY_DATASET into the Cloud Run container environment variables.',
      '⏱Cloud Flight Recorder & 1-Tap Undo: Records every stack deployment and cross-region service teleport in a chronological ledger with a "1-Tap Rewind / Delete" button to immediately roll back any newly created resource.',
    ],
    apisUsed: [
      'POST /api/project/:id/stack-deploy → storage.googleapis.com/storage/v1/b + bigquery.googleapis.com/v2 + run.googleapis.com/v2',
      'GET /api/project/:id/flight-recorder → Session mutation ledger with 1-tap rollback payloads',
    ],
    billingImpact:
      'Synthesized stacks default to Scale-to-Zero Cloud Run (minInstances=0), Standard GCS, and Serverless BigQuery ($0.00/hr idle cost when not serving traffic).',
  },
  {
    id: 'wave1-burn-radar',
    wave: 'WAVE 1 · REAL-TIME FINOPS',
    title: 'Live Wallet Burn-Rate Radar ($/hr & $/mo) + Pre-Deploy Cost Calculator',
    badge: 'HEADER + PROVISION MODAL',
    badgeColor: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
    icon: DollarSign,
    targetTab: 'INNOVATION_LAB',
    targetSubTab: 'FINOPS_SLEEP',
    problemSolved:
      'Google Cloud Billing reports typically lag by 6–24 hours. Engineers often deploy a GPU service or large VM without realizing its hourly burn rate until a surprise bill arrives at the end of the month.',
    howItWorks: [
      'Header Live Ticker: Inspects every running Compute Engine VM (machine type, Spot -68% discount, and attached persistent disk size), warm Cloud Run instance (vCPU, RAM, and NVIDIA L4 / RTX PRO 6000 GPU), GKE cluster, and GCS bucket to compute your exact $/hr and projected 730-hour $/month run-rate.',
      'Pre-Deploy FinOps Price Calculator: Built directly inside the "+ Provision Resource" modal. As you toggle between Spot vs On-Demand VMs, or Request-based ($0 idle) vs Instance-based GPU Cloud Run, the calculator updates your estimated $/hr and $/mo before you click Create.',
    ],
    apisUsed: [
      'GET /api/project/:id/overview & GET /api/project/:id/vms',
      'Client-side real-time pricing engine (calculateLiveBurnRate)',
    ],
    billingImpact:
      'Read-only calculation ($0 cost). Helps prevent accidental high-burn deployments.',
  },
  {
    id: 'wave1-night-sleep',
    wave: 'WAVE 1 · 1-TAP FINOPS HIBERNATE',
    title: 'Night-Mode FinOps Sleep & Wake Switch ("Park Project for the Night")',
    badge: '2026 LAB · TAB 2',
    badgeColor: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
    icon: Moon,
    targetTab: 'INNOVATION_LAB',
    targetSubTab: 'FINOPS_SLEEP',
    problemSolved:
      'Development and staging projects often run 24 hours a day even though engineers only use them 8 hours a day—wasting ~66% of compute spend overnight and on weekends.',
    howItWorks: [
      'When you click "Park Night-Mode ($0)", CloudPulse scans all availability zones for RUNNING Compute Engine VMs and all regions for warm Cloud Run services (minInstanceCount > 0).',
      'It saves a snapshot of your exact running VMs and minInstance counts in server memory, then issues parallel stop commands to all running VMs and scales warm Cloud Run services down to minInstanceCount = 0.',
      'When you return in the morning and click "Wake", it reads the saved snapshot and restarts those exact VMs and restores your warm Cloud Run instance counts.',
    ],
    apisUsed: [
      'POST /api/project/:id/hibernate ({ mode: "SLEEP" | "WAKE" })',
      'POST compute.googleapis.com/compute/v1/projects/:id/zones/:zone/instances/:vm/stop & /start',
      'PATCH run.googleapis.com/v2/projects/:id/locations/:region/services/:srv',
    ],
    billingImpact:
      'Immediately drops running VM vCPU/GPU hourly charges and warm Cloud Run idle charges to $0.00/hr while parked.',
  },
  {
    id: 'wave1-topology',
    wave: 'WAVE 1 · VISUAL ARCHITECTURE',
    title: 'Interactive 4-Layer Cloud Topology & Blast-Radius Graph',
    badge: '2026 LAB · TAB 1',
    badgeColor: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
    icon: Share2,
    targetTab: 'INNOVATION_LAB',
    targetSubTab: 'TOPOLOGY',
    problemSolved:
      'Understanding how your public firewall rules, VPC networks, Compute VMs, Cloud Run services, and Storage/BigQuery datasets connect—and which resources are exposed to the public internet (0.0.0.0/0)—requires checking 5 different pages in GCP Console.',
    howItWorks: [
      'Renders a live 4-column architecture map of your active project:',
      'Layer 1 (Public Internet 0.0.0.0/0 Exposure): Flags world-open ingress firewall rules and public allUsers Cloud Run URLs.',
      'Layer 2 (VPC Network Backbone): Shows every VPC network, routing mode (REGIONAL vs GLOBAL), and MTU.',
      'Layer 3 (Compute & Serverless Fleet): Lists all Compute Engine VMs and Cloud Run services with their live status, IPs, and GPUs.',
      'Layer 4 (Storage & Data Lakehouse): Lists all Cloud Storage buckets and BigQuery datasets.',
    ],
    apisUsed: [
      'GET /api/project/:id/overview & GET /api/project/:id/vms',
    ],
    billingImpact: '100% read-only visualization ($0 cost).',
  },
  {
    id: 'wave1-terraform',
    wave: 'WAVE 1 · REVERSE IaC EXPORTER',
    title: '1-Tap Reverse-Terraform (main.tf) & gcloud Clone Blueprint Exporter',
    badge: '2026 LAB · TAB 3',
    badgeColor: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
    icon: FileCode2,
    targetTab: 'INNOVATION_LAB',
    targetSubTab: 'TERRAFORM',
    problemSolved:
      'Teams often prototype infrastructure by clicking in the UI, and later struggle to write Terraform (main.tf) or reproducible bash scripts to clone that setup into staging or production.',
    howItWorks: [
      'Introspects all live resources currently running in your GCP project (VPCs, Firewalls, Compute VMs with Spot/Disk/Machine specs, Cloud Run services with Gen2/GPU/Billing settings, GCS Buckets, and BigQuery Datasets).',
      'Dynamically generates valid HashiCorp Terraform HCL (main.tf) or an executable bash script (deploy-project-clone.sh) that you can copy in 1 click to recreate the entire project anywhere.',
    ],
    apisUsed: ['Live client-side IaC compiler over /overview and /vms state'],
    billingImpact: '100% read-only code generation ($0 cost).',
  },
  {
    id: 'wave1-security',
    wave: 'WAVE 1 · ZERO-TRUST SECURITY',
    title: 'Zero-Trust Security & IAM Service Account Posture Scanner',
    badge: '2026 LAB · TAB 4',
    badgeColor: 'bg-red-500/15 text-red-500 border-red-500/30',
    icon: ShieldAlert,
    targetTab: 'INNOVATION_LAB',
    targetSubTab: 'SECURITY',
    problemSolved:
      'Open 0.0.0.0/0 firewall rules on SSH (port 22) or RDP (port 3389) and forgotten IAM Service Accounts are the #1 cause of compromised cloud projects.',
    howItWorks: [
      'Queries iam.googleapis.com and compute.googleapis.com in parallel to list all active IAM Service Accounts and inspect every active VPC firewall rule.',
      'Computes a live Security Posture Score (0–100) and flags HIGH/MEDIUM risk rules allowing 0.0.0.0/0 ingress.',
      'Provides a "1-Tap Delete Open Firewall Rule" button to immediately close unintended public ports.',
    ],
    apisUsed: [
      'GET /api/project/:id/security-audit → iam.googleapis.com/v1/projects/:id/serviceAccounts + compute.googleapis.com/compute/v1/projects/:id/global/firewalls',
    ],
    billingImpact: '100% free security & IAM audit ($0 cost).',
  },
  {
    id: 'wave2-benchmark-xray',
    wave: 'WAVE 2 · ENGINEER SECRET WISHLIST',
    title: 'Cold-Start & P95 Latency Stress Arena + HTTP Header X-Ray',
    badge: '2026 LAB · TAB 5',
    badgeColor: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
    icon: Zap,
    targetTab: 'INNOVATION_LAB',
    targetSubTab: 'BENCHMARK',
    problemSolved:
      'Testing how fast a Cloud Run service or VM responds—and measuring the exact Cold-Start penalty on request #1 vs subsequent warm requests—normally requires switching to a laptop terminal and running hey, wrk, or curl loops.',
    howItWorks: [
      'Fires Request #1 alone first to measure the exact First-Hit / Cold-Start latency and capture all raw HTTP response headers (x-cloud-trace-context, server, alt-svc, cache-control) + the first 800 bytes of the response body.',
      'Then fires your configured burst (up to 40 requests at 10x concurrency) to compute Warm P50 (median), P95, P99 tail latency, throughput (req/sec), and a visual per-request waterfall chart.',
    ],
    apisUsed: ['POST /api/project/:id/benchmark'],
    billingImpact:
      'Sends standard HTTP requests to your chosen URL (negligible/free within Cloud Run free tier).',
  },
  {
    id: 'wave2-zombie-hunter',
    wave: 'WAVE 2 · ENGINEER SECRET WISHLIST',
    title: 'Zombie Resource Hunter with Real-Time GCP Operation Progress Bar',
    badge: '2026 LAB · TAB 6',
    badgeColor: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
    icon: AlertTriangle,
    targetTab: 'INNOVATION_LAB',
    targetSubTab: 'ZOMBIES',
    problemSolved:
      'Cloud projects accumulate "silent zombies" that bill you every month while doing zero work: unattached Persistent Disks, reserved Static External IPs not attached to a running VM ($7.30/mo penalty), stopped VMs still paying for boot disks, and warm Cloud Run services.',
    howItWorks: [
      'Scans aggregated disks, regional static IP addresses, stopped VMs, and warm Cloud Run services across your entire project, filtering out resources already in DELETING state.',
      'Calculates the exact Monthly and Annual Waste ($/yr) and Verified Saved ($/yr) for each zombie resource.',
      'Tracks live Google Cloud Zone/Region Operation progress (DISPATCHING 18% → RUNNING 35–92% → DONE 100%) via GET /api/project/:id/operation-status and tombstones deleted resources so they never reappear.',
    ],
    apisUsed: [
      'GET /api/project/:id/zombies & POST /api/project/:id/zombies/exterminate',
      'GET /api/project/:id/operation-status → Polls live compute#operation until DONE',
    ],
    billingImpact: 'Directly saves money by eliminating unused billable resources.',
  },
  {
    id: 'wave2-teleport-diff-carbon',
    wave: 'WAVE 2 · ENGINEER SECRET WISHLIST',
    title: '1-Tap Cross-Region Cloud Run Teleporter, Carbon CFE% & Visual Diff',
    badge: '2026 LAB · TAB 7',
    badgeColor: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
    icon: Globe,
    targetTab: 'INNOVATION_LAB',
    targetSubTab: 'TELEPORT_DIFF',
    problemSolved:
      'Moving or cloning a Cloud Run service to another continent (or to a 98% Carbon-Free hydro/wind region like Montréal or Finland) normally requires re-creating the service and re-entering all env vars, CPU/GPU limits, and IAM bindings manually.',
    howItWorks: [
      '1-Tap Cross-Region Teleporter: Reads the live spec of any Cloud Run service in your project and deploys an identical clone (container image, env vars, CPU/RAM/GPU, billing mode, concurrency, and public IAM invoker policy) into your chosen destination region.',
      'Grid Carbon CFE% Optimizer: Ranks all 13 regions by Google Cloud Carbon-Free Energy percentage (CFE%) and gCO2eq/kWh.',
      'Visual Config Diff Time-Machine: Compares any two Cloud Run services side-by-side with CHANGED vs IDENTICAL highlights.',
    ],
    apisUsed: [
      'POST /api/project/:id/cloudrun/teleport → run.googleapis.com/v2',
    ],
    billingImpact:
      'Cloned Cloud Run services preserve your scaling settings (scale-to-zero services remain $0 when idle).',
  },
  {
    id: 'wave4-global-world-map',
    wave: 'WAVE 4 · 40-REGION ORBITAL MAP',
    title:
      'Global Cloud Map · All 40 Official Regions, 121 Zones, Tactical Spotlight & Chaos Failover',
    badge: 'GLOBAL MAP TAB',
    badgeColor: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
    icon: Globe,
    targetTab: 'GLOBAL_MAP',
    problemSolved:
      'Standard cloud consoles list regions and firewall rules as static text tables, making it impossible to see all 40 Google Cloud regions and 121 zones geographically, test regional/zonal failover, measure subsea fiber RTT latency, or inspect live packet filtering without UI lag or overlapping badges when zoomed in.',
    howItWorks: [
      'All 40 Official GCP Regions & 121 Orbiting Availability Zones: Complete geographic catalog across North America (11), South America (2), Europe (12), Middle East (3), Africa (1), Asia (9), and Oceania (2) with interactive continent presets and full directory matrix.',
      'Tactical Spotlight Focus & Inverse-Zoom Scaling: When zoomed in (up to 6.0x with cursor-locked wheel zoom and WASD/Arrow panning that never scrolls the outer web page), only the selected/hovered region expands its orbiting Availability Zone satellite ring (-a/-b/-c/-f) with intra-region fiber spokes, while unselected neighbors fade into 18% opacity Ghost Mode so labels never collide.',
      'Chaos Outage & Automatic Traffic Failover Simulator: Sever any region or individual Availability Zone in 1 click to watch live packets automatically reroute (⇄FAILOVER) to healthy backup zones or peer regions.',
      'Point-to-Point Subsea Fiber RTT Laser, Multi-Lens Switcher (Traffic / Carbon CFE% / Spot Price), DVR Time-Machine Scrubber (20 snapshots), Performance Cadence Guardrails (100ms–1000ms), and Coordinate-Locked Drop-Pod Provisioning.',
    ],
    apisUsed: [
      'Live evaluation over GET /api/project/:id/overview (vpcs, firewalls, resources)',
      'POST /api/project/:id/provision (Coordinate-Locked Drop-Pod VM/Cloud Run & Priority-100 Cyber-Shield)',
    ],
    billingImpact:
      '100% client-side visual simulation ($0 cost) with configurable tick rate (default 4 FPS / 250ms) and auto-pause on hidden tab to ensure zero CPU hang.',
  },
  {
    id: 'core-enterprise-firewall',
    wave: 'WAVE 1 · ZERO-TRUST SECURITY',
    title: 'Enterprise VPC Firewall Command Center (ALLOW/DENY, INGRESS/EGRESS & Packet Tester)',
    badge: 'VPC & FIREWALLS TAB',
    badgeColor: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
    icon: ShieldAlert,
    targetTab: 'VPC_NETWORKS',
    problemSolved:
      'Managing production VPC security requires full control over both ALLOW and DENY actions, INGRESS and EGRESS directions, priority ordering (0–65535), multi-protocol port matrices, in-place rule editing (PATCH), and instant IAP lockdown.',
    howItWorks: [
      'Full ALLOW & DENY + INGRESS & EGRESS Studio: Create or edit firewall rules in-place with multi-protocol rows (tcp, udp, icmp, sctp, esp, all), custom priorities (0–65535), target network tags, and firewall audit logging.',
      '1-Tap Lock to IAP (35.235.240.0/20) & 1-Tap Pause/Enable: Automatically flags rules exposing SSH (22), RDP (3389), or DB ports to 0.0.0.0/0 and locks them down to Google Cloud IAP in 1 click, or pauses/enables any rule via PATCH.',
      'Interactive Packet Priority Match Simulator: Test any hypothetical packet against your priority-sorted rules + Google Cloud implied fallback rules (65535) to see which exact rule wins.',
    ],
    apisUsed: [
      'POST /api/project/:id/provision (serviceType: VPC_FIREWALL)',
      'PATCH /api/project/:id/firewalls/:firewallName',
      'GET /api/project/:id/operation-status (Live GCP Global Operation progress bar)',
    ],
    billingImpact:
      'VPC Firewall rules are free on Google Cloud ($0/mo). Locking down open ports prevents unauthorized compute abuse.',
  },
  {
    id: 'core-emergency-killswitch',
    wave: 'EMERGENCY MOBILE GOVERNANCE',
    title: 'DEFCON-1 Project Billing Kill-Switch & API Circuit Breaker',
    badge: '2026 SRE TAB',
    badgeColor: 'bg-red-500/15 text-red-500 border-red-500/30',
    icon: PowerOff,
    targetTab: 'OVERVIEW',
    problemSolved:
      'If an API key is leaked or a runaway loop starts spawning expensive GPUs while you are away from your desk, disabling individual APIs or unlinking the billing account from a mobile browser in the standard GCP Console is slow and difficult.',
    howItWorks: [
      'Emergency Project Billing Kill-Switch: Uses a 2-step confirmation to call cloudbilling.googleapis.com and detach the billing account (billingAccountName: "") from the project, immediately stopping all billable spend. Also stores the previous billing account ID so you can re-link it in 1 tap.',
      'Emergency Mobile API Kill-Switch: Lists all enabled APIs on your project with priority sorting (Compute, Cloud Run, Vertex AI, GKE, BigQuery) and lets you disable or re-enable any API in 1 tap.',
    ],
    apisUsed: [
      'GET / POST /api/project/:id/billing → cloudbilling.googleapis.com/v1/projects/:id/billingInfo',
      'GET / POST /api/project/:id/apis → serviceusage.googleapis.com/v1',
    ],
    billingImpact:
      'Unlinking billing immediately halts all billable GCP usage across the entire project.',
  },
];

export default function InteractiveDocsGuide({
  onNavigateToFeature,
  onOpenCommandPalette,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWave, setSelectedWave] = useState('ALL');

  const filteredDocs = useMemo(() => {
    return DOC_SECTIONS.filter((doc) => {
      const matchesWave =
        selectedWave === 'ALL' || doc.wave.includes(selectedWave);
      if (!matchesWave) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        doc.title.toLowerCase().includes(q) ||
        doc.problemSolved.toLowerCase().includes(q) ||
        doc.howItWorks.join(' ').toLowerCase().includes(q) ||
        doc.apisUsed.join(' ').toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedWave]);

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 text-zinc-900 dark:text-zinc-100 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 text-xs font-mono font-bold text-blue-700 dark:text-blue-300">
              <BookOpen className="w-3.5 h-3.5" />
              <span>INTERACTIVE ENGINEERING MANUAL & ARCHITECTURE GUIDE</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              How CloudPulse 2026 Works Under the Hood
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
              Every revolutionary feature in CloudPulse 2026 talks directly to
              official Google Cloud REST APIs using your authenticated session.
              Read below to understand what each tool does, which GCP APIs it
              calls, its billing impact, and click{' '}
              <strong className="text-blue-600 dark:text-blue-400">&quot;Launch Feature →&quot;</strong> to
              jump straight to it.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-mono font-bold text-xs px-4 py-3 rounded-xl shadow-sm transition-colors shrink-0 cursor-pointer"
          >
            <Command className="w-4 h-4" />
            <span>Press ⌘K for Voice & Natural Language Ops</span>
          </button>
        </div>

        {/* Search & Wave Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documentation (e.g. 'hibernate', 'terraform', 'zombie', 'teleport', 'billing', 'gpu')..."
              className="w-full bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-10 pr-4 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-6 flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'ALL', label: `All Innovations (${DOC_SECTIONS.length})` },
              { id: 'WAVE 5', label: 'Wave 5 Cloud Brain & SKU' },
              { id: 'WAVE 4', label: 'Wave 4 Global Map (40 Regions)' },
              { id: 'WAVE 3', label: 'Wave 3 Orbital HUD' },
              { id: 'WAVE 2', label: 'Wave 2 Wishlist' },
              { id: 'WAVE 1', label: 'Wave 1 FinOps & IaC' },
              { id: 'EMERGENCY', label: 'Kill-Switches' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedWave(f.id)}
                className={`px-3 py-2 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer ${
                  selectedWave === f.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-zinc-50 dark:bg-zinc-900/80 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Documentation Cards */}
      <div className="grid grid-cols-1 gap-4">
        {filteredDocs.map((doc) => {
          const Icon = doc.icon;
          return (
            <div
              key={doc.id}
              className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3.5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-500">
                      {doc.wave}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${doc.badgeColor}`}
                    >
                      Location: {doc.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                    <Icon className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
                    <span>{doc.title}</span>
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onNavigateToFeature(doc.targetTab, doc.targetSubTab)
                  }
                  className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-bold px-3.5 py-2 rounded-xl transition-colors shrink-0 cursor-pointer"
                >
                  <span>Launch Feature</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left Column: Why & How It Works */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/20">
                    <div className="text-[10px] font-mono font-bold uppercase text-amber-600 dark:text-amber-400 mb-1">
                      Why We Built This (The GCP Console Pain Point)
                    </div>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      {doc.problemSolved}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[11px] font-mono font-bold uppercase text-zinc-500">
                      Step-by-Step How It Works
                    </div>
                    <ul className="space-y-1.5">
                      {doc.howItWorks.map((step, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Right Column: Under-the-Hood REST APIs & Billing/Safety Impact */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                    <div className="text-[10px] font-mono font-bold uppercase text-blue-400 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Under-the-Hood GCP REST APIs Called</span>
                    </div>
                    <div className="space-y-1">
                      {doc.apisUsed.map((api, i) => (
                        <div
                          key={i}
                          className="text-[11px] font-mono text-zinc-300 break-all"
                        >
                          • {api}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/25">
                    <div className="text-[10px] font-mono font-bold uppercase text-emerald-600 dark:text-emerald-400 mb-1">
                      Safety & Billing Impact
                    </div>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300">
                      {doc.billingImpact}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
