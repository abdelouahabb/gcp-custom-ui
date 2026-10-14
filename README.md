# CloudPulse 2026 — Google Cloud Mobile & Desktop PWA Cockpit

[![Google Cloud Platform](https://img.shields.io/badge/Google_Cloud-REST_API_v1%2Fv2-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)](https://github.com/abdelouahabb/gcp-custom-ui)
[![Gemini 3.8 Flash & 3.1 Pro](https://img.shields.io/badge/Gemini_3.8_Flash_%2B_3.1_Pro-AES--256--GCM_RAM_Vault-10b981?style=for-the-badge)](https://github.com/abdelouahabb/gcp-custom-ui)
[![Cloud Storage Compliance](https://img.shields.io/badge/Storage-SEC_17a--4_%7C_HIPAA_%7C_GDPR-f59e0b?style=for-the-badge)](https://github.com/abdelouahabb/gcp-custom-ui)
[![40 GCP Regions](https://img.shields.io/badge/Global_Map-40_Regions_%2B_121_Zones-8b5cf6?style=for-the-badge)](https://github.com/abdelouahabb/gcp-custom-ui)

[![Run on Google Cloud](https://deploy.cloud.run/button.svg)](https://ssh.cloud.google.com/cloudshell/editor?cloudshell_git_repo=https://github.com/abdelouahabb/gcp-custom-ui&cloudshell_git_branch=main&cloudshell_tutorial=CLOUD_RUN_TUTORIAL.md)
[![Open in Cloud Shell](https://gstatic.com/cloudssh/images/open-btn.svg)](https://ssh.cloud.google.com/cloudshell/editor?cloudshell_git_repo=https://github.com/abdelouahabb/gcp-custom-ui&cloudshell_git_branch=main&cloudshell_tutorial=CLOUD_RUN_TUTORIAL.md)

**CloudPulse 2026** is a high-speed, mobile-first Progressive Web App (PWA) and desktop command center for managing live **Google Cloud Platform (GCP)** infrastructure directly via official Google Cloud REST APIs (`run.googleapis.com/v2`, `compute.googleapis.com/v1`, `storage.googleapis.com`, `bigquery.googleapis.com`, `iam.googleapis.com/v1`, `serviceusage.googleapis.com/v1`, `cloudbilling.googleapis.com/v1`, and `generativelanguage.googleapis.com/v1beta`).

---

## ✦ Revolutionary "Beyond-Google-Cloud-Console" 2026 Suite

1. **💸 Live Wallet Burn-Rate Radar & Pre-Deploy FinOps Price Calculator**
   - **Real-Time Header Ticker (`$/hr` & `$/mo`)**: Continuously computes your active hourly and monthly burn rate across running Compute Engine VMs (accounting for `-68%` Spot VM discounts and boot disk storage), warm Cloud Run instances (CPU, RAM, and L4 / RTX PRO 6000 Blackwell GPUs), GKE clusters, and Cloud Storage buckets.
   - **Live Pre-Deploy Price Calculator**: Embedded directly inside the `+ Provision Resource` modal so you see the exact estimated `$/hr` and `$/month` cost *before* clicking Create.

2. **🕸️ Interactive 4-Layer Cloud Topology & Blast-Radius Graph**
   - Visualizes your entire live GCP project on a single screen across 4 connected layers:
     `Public Internet (0.0.0.0/0 Exposure)` → `VPC Backbone` → `Compute VMs & Cloud Run Fleet` → `Cloud Storage & BigQuery Lakehouse`.
   - Automatically highlights world-open firewall rules (`0.0.0.0/0` on port `22`, `3389`, or all ports) and public `allUsers` Cloud Run endpoints.

3. **🌙 1-Tap Night-Mode FinOps Sleep & Wake Switch ("Park Project for the Night")**
   - **Park Project (`SLEEP`)**: Stops all `RUNNING` Compute Engine VMs across all zones and scales any warm Cloud Run services (`minInstanceCount > 0`) down to `0` in a single tap while saving their pre-sleep state in memory.
   - **Wake Project (`WAKE`)**: Restores your previously running VMs and warm Cloud Run instances in 1 tap the next morning.

4. **📄 1-Tap Reverse-Terraform (`main.tf`) & Reproducible `gcloud` Clone Blueprint Exporter**
   - Reverse-engineers your live running GCP resources (VPC networks, Firewall rules, Compute Engine VMs, Cloud Run services, GCS Buckets, and BigQuery Datasets) into copy-ready **HashiCorp Terraform (`main.tf`)** or an executable **`deploy-project-clone.sh`** script.

5. **🛡️ Zero-Trust Security & IAM Service Account Posture Scanner**
   - Queries `iam.googleapis.com` and `compute.googleapis.com` in parallel to compute a live **Security Score (`0–100`)**, audit all IAM Service Accounts, detect risky `0.0.0.0/0` ingress firewall rules, and remediate open firewall rules in 1 tap.

6. **🎙️ Global `⌘K` & Voice-to-Cloud Natural Language Command Palette**
   - Press **`⌘K` / `Ctrl+K`** (or tap **`⌘K Ops`** in the top header) to search or use **Web Speech API Voice Ops** with natural language commands like *"park project for night"*, *"export terraform"*, *"deploy gpu"*, *"security scan"*, *"benchmark"*, *"zombie hunter"*, or *"teleport"*.

7. **⚡ Built-In Cloud Run & VM Cold-Start / P95 Stress Arena + HTTP Header X-Ray**
   - Fire configurable HTTP bursts (`1` to `40` requests at up to `10x` concurrency) directly from the UI to measure **#1 First-Hit Cold-Start Latency** vs **Warm P50 / P95 / P99 Tail Latency**, throughput (`req/sec`), and inspect raw **HTTP Response Headers** (`x-cloud-trace-context`, `server`, TLS, and payload preview).

8. **🧟 Zombie Resource Hunter & Real-Time GCP Zone Operation Progress Tracker**
   - Scans `compute.googleapis.com/v1/projects/:id/aggregated/disks` and `aggregated/addresses` to detect **unattached Persistent Disks**, **unused Static External IPs** (`$7.30/mo` penalty), **STOPPED VMs** still paying for boot disks, and **warm Cloud Run instances** (`minInstances > 0`).
   - **Live Multi-Stage GCP Operation Progress Bar**: Polls `GET /api/project/:id/operation-status` in real time (`DISPATCHING 18%` → `RUNNING 35–92%` → `DONE 100%`), tombstones exterminated resources so eventual-consistency lag never causes deleted disks to reappear, and logs verified savings (`$/yr`) in the session ledger.

9. **🌍 1-Tap Cross-Region Cloud Run Teleporter, FinOps Break-Even Calculator, GPU SKU Gatekeeper & Visual Config Diff**
   - Clone any live Cloud Run service (image, env vars, CPU/Memory/GPU, billing mode, and IAM policy) across **all 40 official Google Cloud regions** sorted by **Carbon-Free Energy (`CFE%` & `gCO2eq/kWh`)**.
   - **🛡️ Pre-Flight Hardware & GPU SKU Gatekeeper**: Automatically checks whether the target region supports **Cloud Run Serverless NVIDIA L4 GPUs**, **Compute Engine G2 GPU VMs**, or **A3 H100 / TPU v5e Mega-Hubs** before deployment, blocking incompatible targets (e.g., `europe-north1` Finland for L4 GPUs) and recommending the greenest GPU-compatible region (`northamerica-northeast1` Montréal `99% CFE` or `europe-west1` Belgium `83% CFE`).
   - **💰 3-Part Live Migration FinOps Receipt**: Calculates **Ongoing Monthly Compute Spend Delta (`$/mo`)** using authentic regional tier multipliers (`1.00x` to `1.38x`), **One-Time Container & State Egress Transfer Fee (`$0.02–$0.12/GB`)**, and **FinOps ROI Break-Even Payback (`Days`)**.

10. **🛰️ 2030 Orbital Telemetry HUD, 1-Tap Stack Synthesizer & Cloud Flight Recorder**
    - **Orbital Telemetry Ribbon**: Displays live REST API RTT (`ms`), project-wide Carbon-Free Energy (`CFE%`), Cloud Security Posture Grade (`A+` to `B`), and Continental Workload Distribution (`Americas`, `Europe`, `APAC`, `MENA`).
    - **🪄 1-Tap Multi-Service Stack Synthesizer**: Deploys an interconnected 3-tier stack (`Cloud Storage Bucket` + `BigQuery Dataset` + `Cloud Run Gen2 Microservice Gateway` pre-wired with `GCS_BUCKET_URI` and `BIGQUERY_DATASET` env vars) in a single click.
    - **⏱️ Cloud Flight Recorder & 1-Tap Undo**: Chronological mutation ledger with 1-tap rollback to delete any newly synthesized or teleported resource.

11. **🗺️ Dedicated Global Map 🌍 Tab — All 40 Official Regions, 121 Availability Zones, Tactical Spotlight & Chaos Failover**
    - **Complete 40-Region & 121-Zone Orbital World Map (`1200×560` Interactive SVG)**: Plots all 40 official Google Cloud regions across North America (`11`), South America (`2`), Europe (`12`), Middle East (`3`), Africa (`1`), Asia (`9`), and Oceania (`2`), with interactive cursor-centered wheel zoom (`1.0x`–`6.0x`), drag/WASD/Arrow pan (strictly locked to the map viewport so scrolling never jumps the web page), and a searchable 40-Region Directory Matrix.
    - **🎯 Tactical Spotlight Focus & Inverse-Zoom Scaling**: Eliminates dense regional overlap when zoomed in—only the selected/hovered region expands its orbiting Availability Zone satellite ring (`-a/-b/-c/-f`) with intra-region fiber tether spokes at `100%` opacity, while unselected neighboring regions fade into translucent `18%` Ghost Mode and pins counter-scale via `1 / Math.pow(zoom, 0.54)`.
    - **💥 Chaos Outage & Automatic Traffic Failover Simulator**: Sever any region or individual Availability Zone in 1 click to watch live packets automatically reroute (`⇄FAILOVER`) to healthy backup zones or peer regions.
    - **📏 Point-to-Point Subsea Fiber RTT Laser, Multi-Lens Switcher (`Traffic` / `Carbon CFE%` / `Spot Price`), DVR Time-Machine Scrubber (`20` snapshots), Performance Cadence Guardrails (`100ms–1000ms`), and 🛰️ Coordinate-Locked Drop-Pod Provisioning**.

12. **🔥 Enterprise VPC Firewall & Zero-Trust Security Command Center**
    - **Full `ALLOW` & `DENY` + `INGRESS` & `EGRESS` Policy Control**: Create or edit firewall rules in-place (`PATCH /global/firewalls/:name`) with custom priorities (`0–65535`), multi-protocol port matrices (`tcp`, `udp`, `icmp`, `sctp`, `esp`, `all`), source/destination CIDRs, target network tags (`targetTags`), and firewall audit logging (`logConfig`).
    - **1-Tap Lock to IAP (`35.235.240.0/20`) & 1-Tap Pause/Enable**: Automatically flags rules exposing sensitive ports (`22`, `3389`, `3306`, `5432`, `6379`) to `0.0.0.0/0` and locks them down to Google Cloud Identity-Aware Proxy in 1 click, or pauses/enables any rule without deleting it.
    - **Interactive Packet Priority Match Simulator ("Packet Tester")**: Test any hypothetical packet against your priority-sorted firewall rules + Google Cloud implied fallback rules (`65535`) to see which exact rule wins.

13. **🔮 Wave 5 Autonomous Cloud Brain — "Pre-Crime" 30-Day Billing Time-Crystal, Failure Cascade X-Ray & Dream Stack Compiler (`AutonomousCloudBrain.jsx`)**
    - **🔮 "Pre-Crime" 30-Day Billing Time-Crystal Simulator & Autonomous Circuit-Breaker**: Inject traffic and billing anomaly scenarios (*35x Viral Spike*, *120x Runaway Retry Loop*, *4x NVIDIA L4 GPU 24/7 Surge*, *8 TB Egress Flood*) against your configurable **Monthly Hard Budget Cap (`$20–$1,000`)**. Plots a 30-day SVG spend trajectory showing the exact **Day & Hour of Budget Exhaustion** and how much money is saved when the **Autonomous `$0`-Idle Circuit-Breaker** trips.
    - **🧬 "What-If" Resource Blast-Radius & Failure Cascade X-Ray**: Click any live resource (`VPC`, `Firewall Rule`, `Cloud Run`, `Compute VM`, `GCS Bucket`, `BigQuery Dataset`) to trace its **Blast Severity Score (`/100`)**, **Upstream Entrypoints**, **Downstream Failure Cascade**, and **Self-Healing CLI**.
    - **⚡ Autonomous Cloud Architecture Compiler**: Pick a target production stack archetype (`Zero-Trust L4 GPU RAG`, `EU GDPR Sovereign Lakehouse`, `Ultra-Frugal Spot Mesh`, or `98% CFE Green Core`)—automatically scans all 40 GCP regions for GPU SKU support, lowest Tier-1 pricing, and highest Carbon-Free Energy % to output an itemized **Bill of Materials (`$/mo`)** + ready-to-run **`gcloud` + `bq` deployment script**.

14. **🚀 Wave 6 Engineer Moonshot Lab (`X1`–`X6` in `EngineerMoonshotsWave3.jsx`)**
    - **🕵️ `X1` Cloud Storage Live DLP, Secret Leak & Regulated PII X-Ray Scanner + 1-Tap In-Place Redactor**: Streams bucket objects in memory to detect leaked GCP Service Account private keys, AWS keys, GitHub PATs, Stripe keys, JWTs, Credit Cards, IBANs, and SSNs—with a **1-Tap Canary Injector** and **1-Tap In-Place Cryptographic Redactor (`[REDACTED-BY-CLOUDPULSE-DLP]`)**.
    - **⚡ `X2` Serverless Cold-Start Profiler & Container Diet Surgeon**: Breaks down Cloud Run startup into 5 phases (`Image Pull`, `Sandbox Init`, `Runtime Boot`, `Weight Tax`, `Warm P50`), patches **Startup CPU Boost (`cpuThrottling: false`) + Gen2 Execution Environment** in 1 tap, and synthesizes a multi-stage **Distroless Dockerfile**.
    - **💸 `X3` Cross-Service Egress & Hidden Data-Gravity Tollbooth**: Cross-references Compute VMs and Cloud Run services against Cloud Storage bucket locations using the Live Pricing Catalog to detect cross-region (`$0.02/GB`) and inter-continental (`$0.08–$0.12/GB`) bandwidth taxes.
    - **🛡️ `X4` Cryptographic Ransomware Air-Gap & Clean-Room Recovery Auditor**: Scores every bucket (`0–100`) against ransomware deletion, computes exact RTO/RPO, and applies a **1-Tap 30-Day Soft-Delete + Versioning Air-Gap Shield**.
    - **🌐 `X5` 12-Metropolis Speed-of-Light User-Experience & Anycast Edge Latency Matrix**: Computes great-circle fiber distance (`km`) and TLS RTT (`ms`) from 12 global client population hubs (`NYC`, `Silicon Valley`, `São Paulo`, `London`, `Frankfurt`, `Paris`, `Dubai`, `Johannesburg`, `Mumbai`, `Singapore`, `Tokyo`, `Sydney`) to your active GCP regions vs Google Cloud CDN Anycast Edge.
    - **🔐 `X6` Option 3 AES-256-GCM Encrypted Google AI Studio BYOK RAM Vault (`gemini-3.8-flash` & `gemini-3.1-pro`)**: Seals your Google AI Studio API key (`AIzaSy...`) in volatile server RAM using `crypto.createCipheriv('aes-256-gcm')` with an `8,192`-token output budget, live `/v1beta/models` auto-discovery, and a 3-step interactive onboarding guide when empty.

15. **🗄️ 5-Step Enterprise Cloud Storage Compliance & Location Wizard (`CloudStorageStudio.jsx` + `ResourceProvisionModal.jsx`)**
    - Full Google Cloud Console parity across 5 steps: **1. Location Type** (`Region`, `Dual-region` custom pairs + 15m Turbo Replication RPO, `Multi-region` US/EU/ASIA), **2. Storage Class** (`Autoclass` vs `Standard`/`Nearline`/`Coldline`/`Archive` + Hierarchical Namespace HNS), **3. Access Control** (`Public Access Prevention` + `Uniform` vs `Fine-grained ACLs`), **4. Data Protection & Encryption** (`Soft Delete 0–90d`, `Object Versioning + max versions`, `WORM Retention Policy + Lock`, `Google-managed` vs `Cloud KMS CMEK`), and **5. Lifecycle, FinOps & Labels**—plus **Strict Regulatory Compliance Enforcement Locks (`🔒`)** that automatically disable non-compliant downstream options when `SEC Rule 17a-4`, `GDPR EU Sovereign`, `HIPAA / SOC2`, or `AI Lakehouse (HNS)` is selected.

16. **🔷 BigQuery 2026 Enterprise Lakehouse & Compliance Studio (`BigQueryStudio.jsx` + `ResourceProvisionModal.jsx`)**
    - **🛡️ Dataset Posture & Compliance Matrix**: Scores every BigQuery dataset (`0–100`) and enforces 1-tap `PATCH` hardening across **Storage Billing Model** (`PHYSICAL` Compressed vs `LOGICAL` Uncompressed), **Time-Travel Window** (`48h` / `72h` / `120h` / `168h`), **Numeric Rounding** (`ROUND_HALF_EVEN` Banker's Rounding vs `ROUND_HALF_AWAY_FROM_ZERO`), **Partition & Table TTL**, **Collation (`und:ci` vs Binary)**, and **Strict Blueprint Enforcement Locks (`🔒`)** inside the Dataset Provisioning Editor.
    - **⚡ Pre-Flight SQL Dry-Run Gatekeeper, Auto-Optimizer & Byte-Cost Firewall**: Validates every query via `jobs.query (dryRun: true)` before execution, blocks queries exceeding your configurable **Hard Byte-Scan Firewall Cap (`maxBytesBilled`)**, compares **On-Demand (`$6.25/TiB`)** vs **Enterprise Autoscaling Editions (`$0.06/slot-hr`)**, and automatically rewrites suboptimal SQL (`SELECT *`, late `LIMIT`, `REGEXP_CONTAINS`, `NOT IN`) with a **"Summary of Optimizations"**.
    - **💎 Storage FinOps Crystal**: Simulates project-wide savings from switching datasets from `LOGICAL` to `PHYSICAL` compressed billing (`4.2x–6.5x` columnar ZSTD compression).
    - **⏳ `FOR SYSTEM_TIME AS OF` Time-Travel Machine**: Generates point-in-time historical recovery SQL (`1h` to `168h` ago) and runs live dry-run or point-in-time queries.

17. **🔄 Live Google Cloud Billing Catalog Price Sync & Enterprise Discount Override (`GET /api/pricing/live-sync`)**
    - Eliminates stale hardcoded prices by querying `cloudbilling.googleapis.com/v1/services/6F81-5844-456A/skus` on demand and allowing global (`0.50x–1.50x`) or per-SKU price overrides across the entire app.

18. **☸️ Dedicated GKE Kubernetes Studio — Autopilot, Spot GPUs & Workload YAML Composer (`GkeFleetStudio.jsx` + `ResourceProvisionModal.jsx`)**
    - **1-Click GKE Autopilot & Standard Spot GPU Cluster Provisioner (`container.googleapis.com/v1`)**: Provision regional GKE Autopilot or Standard multi-zone GPU clusters (`NVIDIA L4` / `H100`) with strict compliance locks (`🔒`) across **SEC / FedRAMP**, **GDPR EU Sovereign**, **HIPAA BAA**, and **AI Spot GPU Factory** blueprints (auto-enforcing Workload Identity OIDC, Private Nodes, Shielded Nodes, and Binary Authorization).
    - **📦 K8s Workload YAML Composer & 1-Click Live Deployer**: Generates production Kubernetes `Deployment` + `Service` + `HorizontalPodAutoscaler` manifests and applies them directly to your live GKE cluster or via **GitHub → Cloud Build → GKE** source deployment.

19. **🐘 Dedicated Cloud SQL (MySQL 8.4 & PostgreSQL 16/17) & Google Cloud AlloyDB Studio (`CloudSqlAlloyStudio.jsx` + `ResourceProvisionModal.jsx`)**
    - **Relational Engine & Architecture Fork**: Deploy **MySQL (`8.4 LTS` / `8.0`)** or **PostgreSQL (`16` / `17` / `15`)**. When PostgreSQL is selected, choose between **Classic / Enterprise Plus Cloud SQL (`sqladmin.googleapis.com/v1`)** and **Google Cloud AlloyDB (`alloydb.googleapis.com/v1`)** (selecting MySQL automatically locks out AlloyDB with a `🔒` badge).
    - **⚖️ Classic Cloud SQL vs. AlloyDB TCO Comparator**: Compare Cloud SQL Enterprise, Cloud SQL Enterprise Plus (`99.99%` SLA, `<2s` failover), and AlloyDB (`4x` transactional throughput, `100x` columnar engine, `<1s` failover) across vCPUs, Storage, Read Pool nodes, and Cost per 1,000 TPS.
    - **🧠 AI Vector (`alloydb_scann` / `pgvector` / `MySQL 8.4 VECTOR`) & Slow-Query Index Surgeon + Zero-Password IAM Auth Proxy v2 Vault**.

20. **🏗️ Cloud Build & GitHub Source-to-Container Studio (`CloudBuildStudio.jsx` + Inline Cloud Run / GKE Integration)**
    - **🐙 3-Way Container Source Selector**: Available both in the dedicated **`Cloud Build 🏗️`** tab and inline inside **Cloud Run** and **GKE** provisioning—choose **Project Artifact Registry Images**, **Public Docker/GCR URIs**, or **Build from GitHub Repository**.
    - **🛠️ Zero-Dockerfile Cloud Buildpacks & Dockerfile Pipeline (`cloudbuild.googleapis.com/v1`)**: Clones any GitHub repository URL + branch, auto-creates the target **Artifact Registry** Docker repository if missing, builds & pushes the OCI container image, and optionally auto-deploys directly to **Cloud Run** or **GKE**.

21. **🚀 Cloud Run 2026 Direct VPC Egress, Beta Storage Volume Mounts & 1-Click GKE Kubernetes Transpiler (`CloudRunFleetManager.jsx` + `ResourceProvisionModal.jsx`)**
    - **🌐 2026 Direct VPC Egress (`template.vpcAccess`)**: Attach Cloud Run directly to any VPC Network & Subnetwork with `PRIVATE_RANGES_ONLY` or `ALL_TRAFFIC` routing and custom Firewall Network Tags (`$0.00` Serverless VPC Connector tax).
    - **💾 2026 Beta Storage Volume Mounts (`template.volumes` + `container.volumeMounts`)**: Mount a live **Cloud Storage Bucket via GCS FUSE** (`Read-Write` or `Read-Only`), an **In-Memory RAM Disk (`emptyDir` up to `32Gi`)**, or a **VPC Filestore NFSv3 Share** at any container `mountPath` (both during initial provisioning and live in the **Scale & Tune** drawer).
    - **☸️ 1-Click Cloud Run → GKE Kubernetes 6-Manifest Transpiler & Live Cluster Migrator**: Unlike the standard GCP Console (which only exports a bare Knative YAML), CloudPulse transpiles any running Cloud Run service into a **6-Resource Production Kubernetes Bundle** (`Namespace`, Workload Identity `ServiceAccount`, Spot VM/GPU `Deployment` with `/dev/shm` RAM disk, `Service`, `HorizontalPodAutoscaler v2`, `PodDisruptionBudget`, and Zero-Trust L3/L4 `NetworkPolicy`), computes live **GKE Autopilot (`-42%`) & GKE Spot (`-68%`) savings**, and deploys directly onto your GKE cluster in 1 click.

22. **📦 Artifact Registry SLSA-3 Supply-Chain & 1-Click Orphan Digest Sweeper (`Wave9EnterpriseStudio.jsx`)**
    - Audit container repositories (`artifactregistry.googleapis.com/v1`), enforce immutable tags (`dockerConfig.immutableTags = true`), delete individual container digests in 1 click, or batch-sweep all untagged orphan layers to reclaim wasted monthly storage spend.

23. **⚡ Cloud Functions (`1st Gen v1` & `2nd Gen v2`) + Demystified Eventarc Visual Trigger Studio (`CloudFunctionsEventarcStudio.jsx`)**
    - **🎯 Plain-English Eventarc Trigger Wizard ("`v1` Simplicity with `v2` Power")**: Eliminates raw CloudEvents filter memorization—pick *"When a file is uploaded/deleted in Cloud Storage"*, *"When a Pub/Sub message arrives"*, *"When a BigQuery job finishes"*, *"On a Cron Schedule"*, or *"Direct HTTPS Webhook"*, plus the **Universal 2026 Eventarc Multi-Service Catalog (90+ GCP Providers across 8 Architecture Domains)**.
    - **🔬 4-Stage Visual Eventarc Pipeline X-Ray & Cost Guardrail**: Visually maps `1. Event Producer` ➔ `2. Transport Bus ($0 Free Direct Pub/Sub vs Cloud Audit Logs DATA_WRITE warning)` ➔ `3. Eventarc Filter & Hidden IAM Roles` ➔ `4. Function Handler`, with a **1-Click Synthetic CloudEvent v1.0 Tester** and copy-ready **Node.js 22 / Python 3.12 / Go 1.23** handler code.
    - **🩺 1-Tap Eventarc IAM Auto-Doctor & `v1 → v2` Upgrader**: Automatically binds the 4 hidden service-agent IAM roles (`roles/pubsub.publisher` on the GCS Service Agent, `roles/eventarc.eventReceiver`, `roles/run.invoker`, and `roles/eventarc.serviceAgent`) that break newcomer deployments, and upgrades legacy `v1` functions (`1 req/instance`) to `v2` (`up to 1,000 req/instance`, saving up to **78%**).

24. **✦ 2026 Quantum Nexus — 5 World-First Breakthroughs Inside the `✦ 2026 Innovation Lab ★` (`Lab2026QuantumNexus.jsx`)**
    - **🕸️ Breakthrough #1 — Cross-Cloud Blast-Radius & Causal Dependency Graph**: Connects **Identity (IAM Service Accounts)**, **Network (VPC Firewalls)**, **Serverless (Cloud Run)**, **Compute VMs**, **Data Lakehouse (BigLake Iceberg & GCS)**, and **Billing** into one interactive causal simulator (`🔓 Simulate Credential Breach`, `⚡ Simulate Cascading Outage`, `💸 Simulate DDoS / Spend Spike`).
    - **⏳ Breakthrough #2 — Time-Machine Flight Recorder & Verified 1-Click State Rollback**: Captures cryptographic `sha256` checkpoints of project state, diffs any two checkpoints side-by-side, and executes state rollback behind a **Human-in-the-Loop Approval Gate**.
    - **🤖 Breakthrough #3 — Autonomous FinOps Autopilot & Commitment Arbitrage Engine**: Calculates live monthly savings across **Standard → Spot VM (`-72%`)**, **Cloud Run Request-Only CPU (`-68%`)**, and **BigQuery → BigLake Partition Pruning (`-71%`)**, paired with an **Automated Hard-Cap Budget Circuit-Breaker**.
    - **🪞 Breakthrough #4 — Live Ephemeral PR Preview Environments & Shadow Traffic Mirror**: Spawns isolated Cloud Run PR preview stacks mirroring `5%–25%` of live production traffic asynchronously with an **Auto-TTL Self-Destruct Timer (`2h–24h`)**.
    - **🍯 Breakthrough #5 — Zero-Trust Honey-Token & Active Breach Deception Grid**: Plants decoy Service Account `.json` keys, canary BigLake Parquet files, and Secret Manager honey-secrets wired to an automated VPC `/32` IP-ban + IAM quarantine tripwire.

25. **🚀 Wave-10 2026 Frontier Studio — Spanner Graph (`$65/mo` 100-PU), Serverless Apache Spark 2.2, Cloud Workflows & Vertex AI Model Armor (`Wave10Frontier2026Studio.jsx`)**
    - **🕸️ Spanner Graph (`ISO GQL`) & Granular 100-PU Sizing (`~$65/mo`)**: Provision fractional Spanner instances (`100` to `1,000` Processing Units) with Geo-Partitioning and run unified `SQL + ISO GQL` graph traversal queries with zero ETL.
    - **🔥 Dataproc Serverless for Apache Spark 2.2 (`Scale-to-$0`)**: Submit sub-5-second startup PySpark 3.5 / Spark SQL batches directly over BigLake Apache Iceberg tables with `$0` idle cluster waste.
    - **🎼 Cloud Workflows Visual Saga Choreographer & 🛡️ Vertex AI Model Armor Prompt-Injection / PII Firewall**.

26. **🌊 BigLake vs. BigQuery Demystified & Open Apache Iceberg Studio (`BigQueryStudio.jsx` Tab 5)**
    - Side-by-side architectural clarifier (`BigQuery` vs. `BigLake`), interactive *"Which One Do I Need?"* workload recommender, and **1-Click BigLake Cloud Resource Connection + Managed Apache Iceberg Table Provisioner**.

27. **🔑 Sovereign IAM Owner Self-Protection, Keyless GitHub Actions OIDC Architect, Least-Privilege Service Account Architect & `.json` Key Kill-Switch Vault (`SovereignTimeMachineIamStudio.jsx`)**
    - **🛡️ Dedicated Least-Privilege Service Account Architect (`CREATE_SERVICE_ACCOUNT`)**: Replaces the dangerous default Compute Engine Service Account (`*-compute@developer.gserviceaccount.com` with `roles/editor`) by allowing engineers to architect custom runtime identities in a dedicated security tab with **4 Workload Blueprints** (*Zero Roles*, *Cloud Run Runtime*, *Compute VM / GKE Node*, *Data Pipeline Worker*), granular least-privilege IAM role checkboxes (`roles/owner` and `roles/editor` blocked by policy), and **1-Click Resource-Level `iam.serviceAccounts.actAs` (`roles/iam.serviceAccountUser`) Granting**.
    - **🚀 1-Click Keyless GitHub Actions OIDC Workload Identity Federation Architect (`PROVISION_GITHUB_OIDC_WIF` — *"Kill the `.json` Key Forever"*)**: Provisions a Google Cloud Workload Identity Pool (`github-actions-pool`), configures an OIDC Provider (`https://token.actions.githubusercontent.com`) locked to your exact `owner/repo` via `attribute.repository`, binds `roles/iam.workloadIdentityUser` on your target Service Account, and outputs a copy-ready `.github/workflows/deploy-keyless-oidc.yml` snippet (`google-github-actions/auth@v2`) plus equivalent `gcloud` CLI commands—for **`$0.00/mo`** with zero `.json` keys ever created.
    - **🔄 Universal Read-Only `iam.serviceAccounts.actAs` Selector Across All Provisioning Modals**: Automatically discovers all custom and default Service Accounts (`iam.googleapis.com/v1` + `gcloud iam service-accounts list` fallback) and populates the **Runtime Service Account (`iam.serviceAccounts.actAs`)** selector across Cloud Run, Compute VM, GKE, Cloud Functions, Cloud Build, Dataproc Spark, and Cloud Workflows—preventing `Permission 'iam.serviceaccounts.actAs' denied` errors when default Compute Service Accounts are deleted.
    - **🔑 `.json` Key & OAuth2 Token Kill-Switch Vault**: Protects the authenticated Project Owner (`PROTECTED OWNER` badge) from accidental self-downgrade, enforces a mandatory **Human Approval Modal** before any IAM privilege reduction, and provides 1-click key rotation, revocation, and stolen-credential freeze.

28. **🧑‍🔬 2026 Data Engineering Studio — Zero-Friction Medallion ELT, Dataform/dbt SQLX, Dataplex Data Mesh & Slot Doctor (`DataEngineeringStudio.jsx` · Powered by `gcloud 588.0.0`)**
    - **🥉🥈🥇 1-Canvas "Source-to-Gold" Medallion ELT Pipeline Builder & Smart Engine Advisor**: Visually wire any source (`GCS Parquet/CSV/JSON`, `BigQuery Data Transfer Service`, `Pub/Sub Stream`, or `Cloud SQL / AlloyDB CDC`) into **Bronze (`BigLake External / Raw Landing`)** $\rightarrow$ **Silver (`Deduplicated, Typed & PII-Cleaned`)** $\rightarrow$ **Gold (`Partitioned + Clustered BI Mart`)** in 1 click, paired with an interactive **Workload Engine & FinOps Advisor** comparing **BigQuery ELT (`$0` idle)**, **Dataproc Serverless Spark 2.2 (`$0` idle)**, **Dataflow Apache Beam**, and **Serverless Cloud Workflows (`~$0.05/mo` vs `$350/mo` Cloud Composer)**.
    - **📐 Dataform (`.sqlx`) & `dbt` (`.sql`) Visual Transformation & Auto-Clean Studio**: Generates copy-ready **Dataform `.sqlx`** (with `config { type: "incremental", uniqueKey, bigquery: { partitionBy, clusterBy }, assertions }`), **dbt `.sql`**, and **Executable BigQuery DDL** featuring `QUALIFY ROW_NUMBER() OVER (...) = 1` deduplication, `SAFE_CAST` + `TRIM`/`LOWER` hygiene, and `TO_HEX(SHA256(...))` PII masking—plus 1-click live execution and native **Dataform Repository & Workspace creation (`dataform.googleapis.com/v1beta1`)**.
    - **🛡️ Dataplex Auto Data Profiling, Data Quality Scans & Data Mesh Products (`gcloud 588.0.0`)**: Launches native `gcloud dataplex datascans create data-profile` and `data-quality` scans (`dataplex.googleapis.com/v1`), provisions **Dataplex Data Mesh Products (`gcloud dataplex data-products`)**, and syncs `dbt` `manifest.json` lineage via `gcloud dataplex dbt metadata-jobs`.
    - **📜 Interactive Source $\leftrightarrow$ Target Schema Drift & Downstream Contract Firewall**: Side-by-side schema mapper with automatic non-breaking SQL View Adapter generation to protect downstream Looker / BI dashboards from column renames or type changes.
    - **🩺 Live BigQuery Slot Contention / Stage Skew Doctor & "Composer-Lite" Serverless DAG Transpiler**: Queries live `region-us.INFORMATION_SCHEMA.JOBS_BY_PROJECT` telemetry to flag `CROSS JOIN` / unpartitioned slot hogs and deploys multi-step **Cloud Workflows (`workflows.googleapis.com/v1`) + `gcloud beta orchestration-pipelines` YAML** ELT DAGs with automatic retries and failure alerts for `~$0.05/mo` (saving `~$348/mo` vs. Cloud Composer).

29. **💳 Remaining Bonus & Cloud Billing Guardian (`BillingAccountCreditGuardian.jsx`)**
    - **⚡ 1-Click Automated CSV Export, Local Discovery & Tampermonkey Zero-Touch Userscript (`.user.js`)**: Targets the Google Cloud Console Credits export button (`button[id$="billingtest-download-credits-csv"]` / `button[cfctooltip="Download CSV"]` inside `cfc-exposed-filter`) via Chrome CDP (when active) and automatically scans `~/Downloads`, `~/Desktop`, and `/tmp` for the newest 9-column Google Cloud Billing Credits `.csv` (`Credit name,Status,Currency,Percent remaining,Remaining value,Original value,Start date,End date,Credit application type`), ingesting all rows in 1 click. Also includes a **1-Click Tampermonkey Userscript (`.user.js`) Generator** that auto-clicks `Download CSV` whenever you open the Billing Console.
    - **⏳ Exact CSV Balances + Automatic Expiration Date & Countdown Calculation**: Preserves the exact `Remaining value` and `Original value` from the CSV without automatic balance modification, while dynamically calculating days remaining (`Expiring in N days` vs. `Available` vs. `Expired`), `CREDIT_TYPE_MONTHLY` Developer Program benefits, required daily burn rate (`$/day`) before expiration, and projected stranded credit dollars from each grant's `End date`.
    - **🚀 Expanded 6-Resource "Use-It-Or-Lose-It" Expiring Credit Harvester, Shutdown Time Matrix & Hidden Egress Cost Advisory**: Dynamically calculates how much capacity your expiring bonus buys across **6 GCP services** (**1. Compute Engine Spot VM / L4 GPU Workstation**, **2. Cloud Storage Staging Lake**, **3. GKE Autopilot / GPU Burst Cluster**, **4. Cloud Run Serverless L4 GPU Jobs**, **5. Cloud SQL Postgres 16 / MySQL 8.4 Lab**, and **6. BigQuery Gold Lakehouse & BQML**), automatically aligned to your **detected project region** (`preferredRegion`) to avoid cross-region egress fees. Displays the exact **Shutdown / Drain Time SLA** (`~0–5s` for Cloud Run, `~25–45s` for VMs, `~2–6m` for Cloud SQL, `~5–12m` for GKE) and explicit warnings for **Internet/Cross-Region Egress (`$0.01–$0.12/GB`)**, **"Stopped" Resource Leftovers** (Persistent Disks, idle Static IPs, GKE LoadBalancers), and **GCS Nearline/Coldline early-deletion penalties**.
    - **💸 Live Cross-Region Egress & "Stopped-Resource Leftover" FinOps Radar (`GET /api/project/:id/finops/egress-leftover-radar`)**: Automatically scans your live Compute VMs, Persistent Disks, Reserved Static IPv4s, Cloud Run regions, and GCS Buckets to flag `STOPPED`/`TERMINATED` VMs still billing for boot disks, unattached disks, idle static IPs (`$7.30/mo`), Nearline/Coldline early-deletion risks, and cross-region bucket $\leftrightarrow$ compute egress mismatches.

30. **🧪 Pre-Provision Dry-Run IAM (`testIamPermissions`), `actAs` & Egress Preflight Simulator (`ResourceProvisionModal.jsx`)**
    - Before deploying a Cloud Run service, Compute VM, or GKE cluster, click **`🧪 Dry-Run IAM & Egress Preflight`** (`POST /api/project/:id/provision/preflight`) to verify in `<400ms`: (1) target API enablement (`serviceusage.googleapis.com`), (2) caller project creation permissions (`projects.testIamPermissions`), (3) resource-level `iam.serviceAccounts.actAs` on the selected Custom Runtime Service Account (with a **`1-Click Grant actAs`** remediation button), and (4) same-region locality against your existing Cloud Storage buckets.

31. **🔐 Dedicated Secret Manager Lifecycle & Rotation Studio, Live Cloud Run `secretKeyRef` Dependency Healer & `$0/Mo` Auto-Rotation Schedule (`SovereignTimeMachineIamStudio.jsx` + `CloudRunFleetManager.jsx`)**
    - **🎁 Live Monthly Free-Tier Quota Meter (`secretmanager.googleapis.com/v1`)**: Tracks your live `ENABLED` vs `DISABLED` vs `DESTROYED` secret versions against Google Cloud's official monthly Free Tier (**First 6 Active Secret Versions FREE** + **10,000 Access Operations FREE** + **3 Rotation Notifications FREE / month**, then **$0.06 / active version / month** and **$0.03 / 10,000 access ops** beyond the free allowance).
    - **🔄 1-Click Secret Rotation with Auto-Disable of Old Versions + Hot-Reload Mounted Cloud Run Revisions**: Add a new encrypted version payload (`secrets:addVersion`), automatically disable previous `ENABLED` versions (`versions:disable`) so they drop to **`$0.00/mo`**, and optionally trigger **`RELOAD_MOUNTED_WORKLOADS`** so every Cloud Run service referencing that secret immediately rolls out a fresh revision with the new secret value.
    - **🩺 Live Secret-to-Cloud-Run Dependency Radar & 1-Click Broken `secretKeyRef` Healer (`HEAL_CLOUDRUN_SECRET_REF`)**: Cross-references all live Cloud Run v2 services (`container.env` + secret `volumes`) against Secret Manager to show which services mount each secret, automatically flags **Broken / Orphaned `secretKeyRef` Pointers** (pointing to deleted secrets or disabled/destroyed versions), and lets you **Re-Pin to Latest Enabled (`REPIN_LATEST`)** or **Safely Unbind Broken Ref (`UNBIND_BROKEN_REF`)** in 1 click.
    - **⏰ Autonomous `$0.00/Mo` Secret Rotation Schedule (`CONFIGURE_AUTO_ROTATION_SCHEDULE`)**: Configures `30d`, `60d`, or `90d` rotation schedules using Secret Manager's **3 FREE rotation notifications/month** + Pub/Sub's **10 GiB/mo Always Free** topic (`secret-rotation-events`), automatically granting the Secret Manager Service Agent (`service-PROJECT_NUMBER@gcp-sa-secretmanager.iam.gserviceaccount.com`) `roles/pubsub.publisher`.
    - **⚠️ Explicit 3-State Lifecycle & "No Plaintext Fallback" Safeguard (`⏸ Disable` vs `🔥 Destroy` vs `🗑️ Delete`)**: Clearly explains across the Secret Studio, Cloud Run Leak Surgeon, and Confirmation Gatekeeper that sealing an environment variable removes the plaintext from Cloud Run and replaces it with a `valueSource.secretKeyRef` pointer—so clicking **Destroy Version** or **Delete Secret** **never reverts a secret back into plaintext**; it **permanently erases the secret value forever**.

32. **🎁 Google Cloud "Always Free" Tier Auditor, 1-Click `$0.00` Micro-Charge Killer & Free-Tier Provisioning Guardrail (`BillingAccountCreditGuardian.jsx` + `ResourceProvisionModal.jsx`)**
    - **15-Service Live "Always Free" Eligibility & Overage Auditor (`GET /api/project/:id/finops/always-free-auditor`)**: Cross-references your live project inventory against the official [Google Cloud Free Tier Usage Limits](https://docs.cloud.google.com/free/docs/free-cloud-features#free-tier-usage-limits) across **Compute Engine** (`1x e2-micro` in `us-west1`/`us-central1`/`us-east1` + `30 GB Standard PD` + `1 GB North America egress`), **Cloud Run** (`2M requests` + `180k vCPU-sec` + `360k GiB-sec/mo`), **Cloud Storage** (`5 GB Standard` in `us-east1`/`us-west1`/`us-central1`), **BigQuery** (`1 TiB query/mo` + `10 GiB active storage`), **Secret Manager** (`6 active versions/mo`), **Artifact Registry** (`0.5 GB/mo`), **Cloud Build** (`2,500 build-min/mo`), **Cloud Logging** (`50 GiB/project/mo`), **GKE** (`$74.40/mo cluster management fee credit` for 1 zonal/Autopilot cluster), **Cloud Functions Gen2**, **Cloud Workflows** (`5,000 internal steps/mo`), **Pub/Sub** (`10 GiB/mo`), **Firestore** (`1 GiB` + `50k reads/day`), **Cloud Shell** (`50 hrs/wk`), and **Vertex AI / Gemini**, plus **4 Product-Specific Free Trials** (*AlloyDB 30d*, *Spanner 90d*, *Cloud SQL 30d*, *Looker 30d*).
    - **🧹 1-Click "$0.00 Free-Tier Micro-Charge Killer" (`POST /api/project/:id/finops/always-free-enforcer`)**: Eliminates the 3 stealth micro-charges that break a `$0.00/mo` invoice in 1 click: (1) **`ENFORCE_ARTIFACT_REGISTRY_CLEANUP`** (attaches a `keepCount: 3` + 7-day untagged cleanup policy to all Artifact Registry repos so Cloud Build/Run images never breach the `0.5 GB` free limit), (2) **`ENFORCE_LOGGING_HEALTHCHECK_EXCLUSION`** (creates a `_Default` Cloud Logging exclusion filter for noisy `/healthz` and `GoogleHC/` probes so logs stay under `50 GiB/mo`), and (3) **`TRIM_EXCESS_SECRET_VERSIONS`** (auto-disables superseded `ENABLED` Secret Manager versions when a project exceeds the **6 Free Active Versions/mo** limit).
    - **🛡️ 1-Click `"🎁 Lock to Always Free Tier ($0.00/mo)"` Provisioning Guardrail**: Available directly inside the `+ Provision Resource` modal—automatically locks Compute Engine VMs (`e2-micro` + `us-central1-a` + `30 GB pd-standard`), Cloud Storage buckets (`us-central1` Regional `STANDARD`), Cloud Run services (`cpuIdle: true`, `minInstances: 0`, `1 vCPU`, `512Mi`, `no GPU`), and BigQuery datasets (`US` multi-region) to their exact `$0.00/mo` Always Free parameters.

33. **⏪ Cloud Run Revision Time-Machine, Crash-Loop Autopsy & 1-Click Instant Rollback (`CloudRunFleetManager.jsx`)**
    - **🚨 Live Crash-Loop Detection & Card Alert Badge (`run.googleapis.com/v2`)**: Inspects every revision's `Ready` and `ContainerReady` conditions (`HealthCheckContainerError`, `ContainerMissing`, `RevisionFailed`), surfaces a pulsing **`🚨 Crash-Loop Detected · 1-Click Autopsy & Rollback`** alert badge on affected service cards, and identifies the last known `HEALTHY` revision.
    - **🔬 Automated Crash-Loop Autopsy & Side-by-Side Revision Diff (`GET /api/project/:id/cloudrun/:region/:name/revisions/:rev/autopsy`)**: Queries `logging.googleapis.com/v2` (`resource.type="cloud_run_revision"`) for container crash stderr/stdout lines, diffs the selected revision against the healthy baseline (Container Image, CPU/Memory, Container Port, Service Account, Added/Removed Env Vars, and Secret Manager `secretKeyRef` version changes), and classifies the root cause (`PORT_LISTEN_TIMEOUT`, `SECRET_MANAGER_REF_ERROR`, `OUT_OF_MEMORY_OOM`, `APPLICATION_STARTUP_CRASH`).
    - **⚡ 3-Mode 1-Click Time-Machine Recovery (`POST /api/project/:id/cloudrun/:region/:name/time-machine-restore`)**: (1) **`INSTANT_TRAFFIC_PIN`** (`<2s` zero-rebuild 100% traffic shift to any healthy revision), (2) **`CLONE_REVISION_SPEC`** (clones a historical revision's exact image, resources, env vars, and secret mounts into a fresh `LATEST` deployment), and (3) **`AUTO_FIX_CRASH`** (1-click OOM / startup timeout healer that upgrades memory to the next tier and enables `startupCpuBoost: true`).

34. **🔌 127.0.0.1 Zero-Public-IP Developer Port-Forward & IAP Tunnel Manager (`LocalDevTunnelBar.jsx`)**
    - **3-Engine Localhost Bridge (`GET/POST /api/project/:id/tunnels/*`)**: Binds local `127.0.0.1:<PORT>` sockets directly to **(1) Private IAM-Locked Cloud Run services** (`gcloud run services proxy` with automatic OIDC Bearer token injection), **(2) Zero-External-IP Compute Engine VMs** (`gcloud compute start-iap-tunnel` over IAP TCP `35.235.240.0/20` for `:22` SSH, `:8080` Web, `:5432` Postgres, `:6379` Redis, `:8888` Jupyter/vLLM), and **(3) Private VPC Cloud SQL / AlloyDB** (`cloud-sql-proxy` / `alloydb-auth-proxy` with `--auto-iam-authn --private-ip`).
    - **⚡ Live `127.0.0.1` Socket/HTTP Probe & Copy-Ready ORM/IDE Snippets**: Tests local TCP handshake RTT (`ms`) and HTTP status directly from the UI (`POST /api/project/:id/tunnels/probe`), outputs copy-ready `Prisma` / `SQLAlchemy` / `psql` / `mysql` / `VS Code Remote-SSH` snippets, and saves **`$7.30/mo` per VM or Database** by eliminating public IPv4 addresses.

35. **🕵️ Live Cloud Audit "Who-Changed-What" Activity Timeline & 1-Click Change Inspector (`LogStreamerAndShell.jsx`)**
    - **Live `cloudaudit.googleapis.com/activity` Forensics (`GET /api/project/:id/audit-timeline`)**: Queries `logging.googleapis.com/v2` for Admin Activity & System Event audit logs (retained **400 days for `$0.00/mo` Always Free**) and merges in-session Flight Recorder mutations so every resource creation, patch, IAM policy change, secret rotation, and deletion appears with zero lag.
    - **👤 Principal Attribution, IAM Policy Binding Deltas & 1-Click Shell Inspection**: Filter mutations by service (`run`, `compute`, `secretmanager`, `iam`, `storage`, `bigquery`), Action Category (`CREATE`, `UPDATE`, `IAM_SECURITY`, `DELETE`), or Actor (`principalEmail`), inspect `serviceData.policyDelta.bindingDeltas` (`ADD`/`REMOVE`) + `protoPayload.request`, and run the generated inspection CLI in the Mobile Cloud Shell in 1 click.

36. **📡 Live GCP API Quota Saturation & HTTP 429 Outage Early-Warning Radar (`EmergencyApiKillSwitch.jsx`)**
    - **Parallel Multi-Service Quota Inspection (`GET /api/project/:id/quotas/radar`)**: Queries `compute.googleapis.com/compute/v1/projects/:id`, regional Compute quotas (`regions`), `run.googleapis.com/v2` autoscaler ceilings, `secretmanager.googleapis.com/v1` Free-Tier version saturation (`6/mo`), and BigQuery concurrency limits in parallel.
    - **🚨 HTTP 429 `RESOURCE_EXHAUSTED` Early-Warning & 1-Click Quota CLI**: Ranks all tracked limits by live utilization percentage (`HEALTHY_HEADROOM` vs `ELEVATED_WARNING >=65%` vs `CRITICAL_429_RISK >=85%`) and provides 1-click `gcloud alpha services quota update` / inspection commands before traffic spikes hit hard quota walls.

37. **🧹 Cloud Run Dead Container (`artifactregistry.googleapis.com/v1`) & Cloud Storage Build-Artifact Hunter (`CloudRunFleetManager.jsx`)**
    - **1-Click Cross-Reference Hygiene Scan (`GET /api/project/:id/cloudrun/dead-artifacts-scan`)**: Located directly in the **Cloud Run ★** header (`🧹 Search Dead Containers & GCS Artifacts`). Cross-references all live Cloud Run services against regional **Artifact Registry** repositories (`cloud-run-source-deploy`, `gcf-artifacts`, custom Docker repos) and **Cloud Storage** buckets (`*_cloudbuild`, `run-sources-*`, `gcf-v2-*`, `artifacts.*.appspot.com`, and project buckets).
    - **🔒 Active Container Protection, 1-Click Dead Container / Staging Tarball Purge & Async `⏳ DELETING...` Tombstoning**: Locks any container image currently serving a live Cloud Run service (`🔒 Protected`), classifies unused images (`Dead Container (Deleted Service)`, `Dead Untagged Digest (Orphan)`, `Unused / Superseded Image`), and lets you delete individual images/objects, batch-sweep all dead containers, batch-purge leftover `.tgz`/`.zip` build staging tarballs (`POST /api/project/:id/cloudrun/dead-artifacts-purge-gcs`), or force-empty & delete staging buckets—while immediately rendering a grayed-out **`line-through` + `⏳ DELETING...`** visual state during asynchronous GCP propagation.

38. **🎥 GDE Streamer & Video Tutorial Privacy Shield (`GdeStreamerPrivacyShield.jsx`)**
    - **1-Click Screen-Share & Live Recording Redactor (`Alt+G` or Top Header `GDE Mode` Split Button)**: Built for Google Developer Experts (GDEs), instructors, and workshop speakers recording live sessions. Masks your personal & IAM email (`gde-instructor@google-cloud-demo.dev`), Cloud Billing Account IDs (`01GDE•-••••••-TUTOR1`), 12-digit GCP Project Numbers (`#9900••••••01`), Public IPv4 addresses (`34.•••.•••.88`), **and all Remaining Promotional Credit / Bonus Balances (`Credits: $•••.••` & `$•••.•• / $•••.••` enabled by default via `maskDollarAmounts: true`)** across the top header pill, tooltips, Billing & Credit Guardian cards, and all 20 tabs while keeping all underlying React state and live GCP REST API calls 100% functional.

39. **🌉 28-in-1 Global Multi-Cloud Parity Super-Studio: 20 AWS & Azure + 8 Alibaba Cloud & Huawei Cloud Bridges (`AwsAzureEnvySuiteStudio.jsx`)**
    - **📐 Uniform 4-Column Bento Grid (`5×4` for AWS/Azure, `2×4` for Alibaba/Huawei)**: Every parity bridge is organized in an equal-width, equal-height (`h-11`) 4-column Bento Grid with fixed `01`–`20` / `01`–`08` step badges, single-line truncated titles, and right-aligned live metric pills.
    - **🛡️ Per-Feature 1-Click Enable (`ENABLE_PARITY_FEATURE_APIS`) & Two-Mode Safe Teardown Gatekeeper (`TEARDOWN_PARITY_FEATURE`)**: Every single one of the 28 features includes a live **Feature Status & Cost Control Bar** showing exact underlying GCP APIs (`serviceusage.googleapis.com`), active resource count, and live hourly burn (`$/hr`). Clicking **Disable & Teardown Feature** opens a mandatory **Two-Mode Teardown Confirmation Modal** so you explicitly choose between:
      1. **Mode 1 — `FEATURE_ONLY` (Recommended Safe Default)**: Purges only that feature's studio state (`workflows`, `brands`, `routes`, `pipes`, `shares`, etc.) while keeping shared Google Cloud APIs (`run.googleapis.com`, `workflows.googleapis.com`, `iap.googleapis.com`, etc.) enabled so other workloads in the project are never disrupted.
      2. **Mode 2 — `PURGE_AND_DISABLE_APIS` (Full Infrastructure Teardown)**: Purges the feature's state AND runs `gcloud services disable <api> --force` across all mapped Google Cloud APIs for that feature, clearly warning which shared project APIs will be turned off.
    - **📦 Wave 1 Foundation & Azure Architect Wishlist (Modules 01–05 & 16)**: **(01) Azure-Style "Resource Groups" (`labels.resource_group`), Live `$/hr` + `$/mo` + Accrued Spend Tracker, RG-Scoped RBAC Access Assignment (`Reader`/`Contributor`/`Owner` + CEL IAM Condition) & 1-Click Cascade Teardown** (`line-through` `⏳ DELETING...`); **(02) AWS Budgets Actions / Azure Auto-Shutdown "Hard-Spend Stop-Loss Fuse"** (`80%` Soft Brake, `95%` Compute Park, `100%` Pub/Sub Fuse); **(03) AWS-Style "IAM Policy Simulator" & "Switch Role" Impersonator** (`testIamPermissions` + 1-click least-privilege role grant); **(04) Azure SAS / AWS S3 "1-Click Presigned URL & Browser Upload Studio"** (`15m`–`7d` Zero-SA-Key SAS Bridge + V4 Signed URLs); **(05) 1-Screen Global HTTPS Load Balancer + Custom Domain + Cloud Armor WAF Wizard**; **(16) Azure Entra App Registrations Parity — Multi-Brand OAuth Sign-In Studio (Multiple Distinct OAuth Brandings Inside 1 `'prod'` GCP Project via Identity Platform Multi-Tenancy & Custom Auth Domains)**.
    - **🚀 Wave 2 Enterprise Scale (Modules 06–10)**: **(06) AWS CloudFormation / Azure ARM Stack Snapshot, Live Console Drift Detector, 1-Click Rollback & Terraform HCL / Pulumi TS Exporter**; **(07) AWS Cost Explorer / Azure Cost Analysis 14-Day Daily Burn Attribution & 1-Click CUD / Spot Arbitrage Plans**; **(08) AWS Systems Manager (SSM) Fleet Run Command & Zero-SSH Patch Manager**; **(09) AWS EventBridge Pipes / Azure Logic Apps Visual Event Router** with automatic `-dlq` Pub/Sub provisioning; **(10) AWS Secrets Manager / Azure Key Vault 1-Click Secret Rotation & Cross-Env (`dev`/`staging`/`prod`) Sync**.
    - **🏛️ Wave 3 Hyper-Scale & Architecture Parity (Modules 11–15)**: **(11) AWS Trusted Advisor / Azure Advisor 5-Pillar Well-Architected Live Scorer & 1-Click Auto-Fixer** (`Cost`, `Security`, `Fault Tolerance`, `Performance`, `Service Quotas`); **(12) AWS Transit Gateway / Azure Virtual WAN Hub-and-Spoke VPC Peering, Cloud Router & Cloud NAT Mesh Builder**; **(13) AWS ECS Task Definitions / Azure Container Apps Multi-Container Gen2 Sidecar & Compose Deployer** (`Ingress` + `OpenTelemetry Collector` + `Redis Sidecar` sharing `/var/run/shared` RAM volume); **(14) AWS GuardDuty / Microsoft Sentinel Live Threat Hunting & 1-Click SOAR Quarantine Playbooks**; **(15) AWS Step Functions / Azure Durable Functions Visual Saga State-Machine & Cloud Workflows YAML Compiler** with exponential backoff retries and compensation rollback states.
    - **🌕 Wave 4 Moonshot Parity (Modules 17–20)**: **(17) AWS Route 53 Traffic Flow / Azure Front Door Weighted, Geo-Proximity & 10s Health-Check Failover DNS Studio (`dns.googleapis.com/dns/v1`)**; **(18) AWS CloudTrail Lake & Azure Activity Log "Who-Did-What" SQL Time-Detective** with Before/After change analysis and 1-click Undo CLI generation; **(19) AWS RAM (Resource Access Manager) & Azure Lighthouse Cross-Project Resource Sharing Hub** (Shared VPC Subnets, BigQuery Analytics Hub & KMS Delegation with zero JSON keys); **(20) AWS Bedrock Guardrails & Azure AI Foundry Multi-Model Vertex AI Router (`Gemini 2.5 Pro -> Flash -> Claude 3.7 Sonnet`), Cloud DLP PII Redaction Shield & Per-Team Daily Token Spend Fuse**.
    - **🐉 Wave 5 Dedicated Alibaba Cloud (Aliyun) & Huawei Cloud Hyperscale Parity Suite (8 Bridges, Modules 21–28)**: **(21 / 01) Alibaba Cloud PTS + MSE Sentinel "11.11 Singles' Day Flash-Sale" Pre-Warm & QPS Token-Bucket Circuit-Breaker Engine**; **(22 / 02) Alibaba Cloud CEN (Cloud Enterprise Network) & Global Accelerator Cross-Region QoS Bandwidth Slicer** (`Gold`/`Silver`/`Bronze` traffic lanes); **(23 / 03) Alibaba PolarDB & Huawei GaussDB Serverless HTAP Read-Pool & `1.6s` Zero-Copy Snapshot Clone**; **(24 / 04) Huawei Cloud CCE Turbo (CNCF Volcano Gang-Scheduler) + ModelArts / Alibaba PAI Fractional vGPU Pool** (`0.125x` / `0.25x` / `0.50x` isolated vGPU slicing); **(25 / 05) Alibaba RocketMQ 5.0 2-Phase Transactional Half-Messages & Exact-Second Delay Queue**; **(26 / 06) Alibaba Nacos + Higress Zero-Restart Dynamic Config & AI Wasm Gateway**; **(27 / 07) Alibaba Hologres + MaxCompute Sub-Second Hybrid Row-Column OLAP Serving**; **(28 / 08) Alibaba DataV & Huawei Astro Executive Digital-Twin NOC & War-Room Command Wall**.

> 📖 **Full Engineering & User Manual**: Read [**`docs/REVOLUTIONARY_FEATURES_GUIDE.md`**](docs/REVOLUTIONARY_FEATURES_GUIDE.md) or click the **`Docs & Guide 📖`** tab directly inside the app for step-by-step explanations of every feature, the exact GCP REST APIs called, and billing impact.

---

## ✨ Core GCP Service Studios

- **★ Cloud Run Serverless Studio (`run.googleapis.com/v2`)**
  - **2026 Serverless GPU Accelerators**: Attach `1x NVIDIA L4 (24GB VRAM)` or `1x NVIDIA RTX PRO 6000 Blackwell (96GB VRAM)` with configurable **GPU Zonal Redundancy** (`--no-gpu-zonal-redundancy` vs `--gpu-zonal-redundancy`) and automatic hardware minimum enforcement (`≥4 vCPU`, `≥16Gi RAM`, `GEN2`).
  - **2026 Billing Modes**: Switch between **Request-based Billing** (`cpuIdle: true` / `--billing=request`, `$0` when idle) and **Instance-based Billing** (`cpuIdle: false` / `--billing=instance`, CPU/GPU allocated for the entire instance lifetime).
  - **2026 Direct VPC Egress & Storage Volume Mounts (Beta)**: Native `template.vpcAccess` Direct VPC Egress (`PRIVATE_RANGES_ONLY` / `ALL_TRAFFIC` + firewall tags) and stateful/ephemeral volume mounts (`GCS_BUCKET` FUSE, `IN_MEMORY` RAM disk, `NFS_FILESTORE`), with automatic Cloud Run v2 API system-annotation sanitization (`run.googleapis.com/ssh-enabled` stripped on v2 `POST`/`PATCH`).
  - **🧹 Dead Container (Artifact Registry) & Cloud Storage Build-Artifact Hunter**: 1-click button in the Cloud Run header (`🧹 Search Dead Containers & GCS Artifacts`) that finds leftover container images from deleted/superseded Cloud Run services in Artifact Registry and `.tgz` source tarballs in Cloud Storage (`_cloudbuild`, `run-sources-*`, `gcf-v2-*`), protecting active Cloud Run images while sweeping dead containers and staging artifacts in 1 click.
  - **⏪ Revision Time-Machine, Crash-Loop Autopsy, Config Diff & 1-Click Rollback**: Visual timeline of all service revisions (`HEALTHY` / `CRASHED` / `RECONCILING`), live `logging.googleapis.com/v2` container crash autopsy, side-by-side diff against the active revision, `<2s` 100% traffic pin rollback, historical revision spec cloning, and 1-click OOM / Startup CPU Boost auto-remediation.
  - **🔒 1-Click Secret Manager (`secretmanager.googleapis.com/v1`) & Plaintext Env-Var Leak Surgeon**: Automatically scans `container.env` for plaintext secrets (`SECRET`, `TOKEN`, `PASSWORD`, `API_KEY`, `PRIVATE_KEY`, `DATABASE_URL`, `AIzaSy...`, `sk-...`, `ghp_...`), explains the monthly Free Tier (**6 Active Versions FREE + 10k Access Ops FREE / mo**) and why deleting/destroying a secret later erases it forever rather than reverting to plaintext, creates encrypted secrets + versions in Google Cloud Secret Manager, binds `roles/secretmanager.secretAccessor` to the Cloud Run runtime Service Account, and patches the Cloud Run revision to mount `valueSource.secretKeyRef` in 1 click—with a direct jump button to the **Dedicated Secret Manager Lifecycle & Rotation Studio**.
  - **Interactive Cloud Run Container SSH (`@xterm/xterm` + `gcloud beta run services ssh`) & `127.0.0.1` OIDC Auth Proxy**: Real browser terminal into live Cloud Run Gen2 containers (default OFF; toggle via **`SSH / Container Shell`** $\rightarrow$ **`SSH Active (Turn Off)`**) plus 1-click **`🔌 127.0.0.1 Proxy`** tunnel (`gcloud run services proxy`).
  - **Public (`allUsers` / `invokerIamDisabled`) vs. Private (`IAM Auth`) Gatekeeper**: Accurately detects both IAM `allUsers` bindings and Cloud Run v2 `invokerIamDisabled` state, displays **`PUBLIC (Unauthenticated) · Switch to Private`** vs **`PRIVATE (IAM Auth) · Switch to Public`**, and enforces a mandatory confirmation modal before switching access modes.
  - **1-Click Cloud Run → GKE Kubernetes Migration & Live Revision Tuner**: Transpile any Cloud Run service into a 6-resource Kubernetes manifest bundle and deploy straight to GKE, or scale Min/Max instances (`0` to `200`), Concurrency, CPU/Memory, Environment Variables, and Canary Traffic Splitting in place.

- **🛡️ Global Mandatory Delete, IAM Exposure & Live Dependency Blast-Radius Gatekeeper (`src/App.jsx`)**
  - **100% Zero-Trust Destructive Action Interception + Live Pre-Flight Dependency Scan**: Global Axios request interceptor (`classifyDestructiveAxiosConfig` + `MandatoryDeleteConfirmationModal`) pauses every `DELETE` and destructive `POST` operation across all 20 studios (VMs, Cloud Run, GKE, Cloud SQL, AlloyDB, GCS Buckets/Objects, BigQuery Datasets, BigLake Catalogs, Dataform Repositories, Dataplex DataScans/Data Products, VPCs, Firewalls, Artifact Registry Repositories/Images/Orphans, Cloud Storage Build-Artifact Batch Purges, Zombie Resources, Secret Manager Secret Deletion & Version Destruction with **Live Cloud Run `secretKeyRef` Blast-Radius Pre-Flight Scan** + No-Plaintext-Fallback warnings, Broken `secretKeyRef` Unbinding, Service Account Keys/Tokens/Account Freeze, Billing Kill-Switch, API Disable, Ephemeral PR Stacks, Cloud Run Revision Rollbacks, Cloud Run Public/Private IAM toggles, and Multi-Cloud Parity Feature Teardowns) until explicitly confirmed by the engineer.

- **🎥 GDE Streamer & Video Tutorial Privacy Shield (`src/components/GdeStreamerPrivacyShield.jsx`)**
  - **1-Click Screen-Share & Live Recording Redactor (`Alt+G` or Top Header `GDE Mode` Button)**: Built for Google Developer Experts (GDEs), instructors, and workshop speakers recording live sessions. Masks your personal & IAM email (`gde-instructor@google-cloud-demo.dev`), Cloud Billing Account IDs (`01GDE•-••••••-TUTOR1`), 12-digit GCP Project Numbers (`#9900••••••01`), Public IPv4 addresses (`34.•••.•••.88`), and **all Remaining Promotional Credit / Bonus Balances (`Credits: $•••.••`, enabled by default)** across all 20 tabs, modals, and hover tooltips via a real-time DOM `MutationObserver` + `WeakMap` cache—while keeping all underlying React state and live GCP REST API calls 100% functional.

- **☁️ 28-in-1 Global Multi-Cloud Parity Super-Studio: 20 AWS/Azure + 8 Alibaba/Huawei Bridges (`src/components/AwsAzureEnvySuiteStudio.jsx`)**
  - **Uniform 4-Column Bento Grid & Two-Mode Safe Feature Teardown**: All 20 AWS/Azure bridges (`5×4` grid) and 8 Alibaba/Huawei bridges (`2×4` grid) feature a live **Under-the-Hood GCP Architecture X-Ray**, **1-Click Enable Feature & Underlying GCP APIs**, and a **Two-Mode Teardown Confirmation Modal** (`FEATURE_ONLY` to reset only that feature vs `PURGE_AND_DISABLE_APIS` to also disable shared Google Cloud APIs).
  - **Wave 1–4 AWS & Microsoft Azure Enterprise Parity (Modules 01–20)**: Resource Groups + RBAC (`01`), Hard-Spend Fuse (`02`), IAM Simulator & Switch Role (`03`), S3/SAS Presigned URLs (`04`), 1-Screen Global LB & WAF (`05`), CloudFormation/ARM Drift & Rollback (`06`), Cost Explorer & CUD Savings (`07`), AWS SSM Fleet Run Command (`08`), EventBridge Pipes & DLQ Router (`09`), Key Vault Auto-Rotation & Sync (`10`), Trusted Advisor 5-Pillar (`11`), Transit Gateway VPC Mesh (`12`), ECS/ACA Sidecar Compose (`13`), GuardDuty/Sentinel SOAR (`14`), Step Functions Saga Studio (`15`), Multi-Brand OAuth Studio (`16`), Route 53 / Front Door DNS (`17`), CloudTrail / Activity Detective (`18`), AWS RAM / Azure Lighthouse (`19`), and Bedrock / AI Foundry Gateway (`20`).
  - **Wave 5 Alibaba Cloud (Aliyun) & Huawei Cloud Hyperscale Parity (Modules 21–28)**: Alibaba PTS + MSE 11.11 Surge (`01`), Alibaba CEN & GA QoS Slicer (`02`), PolarDB / GaussDB HTAP & Clone (`03`), Huawei Volcano / PAI vGPU Pool (`04`), RocketMQ 5.0 2PC & Delay Queue (`05`), Nacos + Higress Config & Wasm (`06`), Hologres + MaxCompute Sub-s OLAP (`07`), and DataV / Huawei Astro NOC Wall (`08`).

- **⚡ Cloud Functions (`v1` & `v2`) & Eventarc Trigger Studio (`cloudfunctions.googleapis.com/v2` + `eventarc.googleapis.com/v1`)**
  - Plain-English Eventarc trigger wizard, 4-stage visual Eventarc transport & billing X-Ray, 1-Tap Eventarc IAM Auto-Doctor, synthetic CloudEvent v1.0 tester, and 1-Click `v1 → v2` concurrency upgrader (`-78%` compute cost).

- **☸️ Google Kubernetes Engine (GKE) Studio (`container.googleapis.com/v1`)**
  - Dedicated GKE Autopilot & Standard Spot GPU cluster provisioner with SEC/GDPR/HIPAA compliance locks, Workload YAML Composer, GitHub-to-GKE Cloud Build integration, and 1-tap `kubeconfig` / `kubectl` commands.

- **🐘 Cloud SQL & Google Cloud AlloyDB Studio (`sqladmin.googleapis.com/v1` + `alloydb.googleapis.com/v1`)**
  - Dedicated MySQL 8.4 LTS, PostgreSQL 16/17 Cloud SQL (`Enterprise` & `Enterprise Plus`), and Google Cloud AlloyDB cluster provisioner, TCO Architecture Comparator, ScaNN / `pgvector` AI Vector Index Surgeon, and `127.0.0.1` Zero-Password IAM Auth Proxy v2 Vault.

- **🏗️ Cloud Build & Artifact Registry Supply-Chain Studios (`cloudbuild.googleapis.com/v1` + `artifactregistry.googleapis.com/v1`)**
  - Build container images directly from GitHub repositories using Zero-Dockerfile Google Cloud Buildpacks or Dockerfiles, auto-create Artifact Registry repositories, inspect SLSA-3 provenance, and delete or batch-sweep untagged orphan digests in 1 click.

- **🖥️ Compute Engine Multi-Region Studio & Real `@xterm/xterm` Web-SSH (`compute.googleapis.com/v1`)**
  - **40 Global Regions & 121 Availability Zones**: Americas, Europe, Asia-Pacific, MENA, and Africa.
  - **5 Machine Series**: `E2` (Cost-Optimized/Free Tier), `N2/N2D`, `C3/C4` (Gen-4/5 Sapphire/Emerald Rapids), `T2A Arm64` (Ampere Altra), and `G2/A2` GPU VMs.
  - **Real Open-Source `@xterm/xterm` + `ssh2` + Linux PTY WebSocket SSH Client + `127.0.0.1` IAP TCP Tunnel**: Default OFF when landing on the VM Fleet tab; click **`SSH / Console`** on any VM card to connect (and **`SSH Active (Turn Off)`** to disconnect), or click **`🔌 127.0.0.1 IAP Tunnel`** to bind local ports (`:2222`, `:8086`, `:5433`, `:6380`, `:8888`) to private VMs over IAP TCP `35.235.240.0/20`.

- **🚨 DEFCON-1 Emergency Project Billing Kill-Switch, API Circuit Breaker & Live Quota Saturation Radar**
  - **Project Billing Circuit Breaker (`cloudbilling.googleapis.com/v1`)**: 2-step emergency button to detach the active Cloud Billing Account from a compromised project (`billingAccountName: ""`) to immediately halt all billable spend, plus 1-tap re-linking.
  - **Emergency Mobile API Kill-Switch (`serviceusage.googleapis.com/v1`) & Live Quota Saturation Radar (`/quotas/radar`)**: Inspect all enabled APIs on your project with priority sorting, disable/enable services in 1 tap (`disableDependentServices: true`), and monitor live Global/Regional quota utilization (`%`) before hitting HTTP 429 limits.

- **🌐 VPC Networks, Enterprise Firewalls, Storage, BigQuery, BigLake Metastore & Mobile Cloud Shell**
  - Provision and manage custom/auto-mode VPC Networks (`REGIONAL` / `GLOBAL` BGP routing, Jumbo Frames MTU `8896`), `ALLOW`/`DENY` Ingress & Egress Firewall Rules with live `PATCH` editing and IAP lockdown, Cloud Storage Buckets, BigQuery Datasets & Partitioned/Clustered Tables, **BigLake Metastore Catalogs (`/biglake/metastore/catalogs` — `biglake.googleapis.com/v1`)**, real-time Cloud Logging & **400-Day Cloud Audit "Who-Changed-What" Activity Timeline**, and an interactive Mobile Cloud Shell (`gcloud` / `bq`).

- **🕒 Global UI Timezone Engine & Live Dual-Clock Selector (`src/context/TimezoneContext.jsx`)**
  - **Auto-Detected Browser IANA Timezone + 14 Global/GCP Regional Presets**: Automatically detects your browser's local IANA timezone (`Intl.DateTimeFormat().resolvedOptions().timeZone`) and lets you switch in 1 click between **Auto Local**, **UTC / Zulu (SRE Standard)**, or any major GCP regional timezone (`Africa/Algiers`, `Europe/Paris`, `Europe/London`, `Europe/Helsinki`, `America/New_York`, `America/Chicago`, `America/Los_Angeles`, `America/Sao_Paulo`, `Asia/Dubai`, `Asia/Singapore`, `Asia/Tokyo`, `Australia/Sydney`).
  - **24h / 12h & Dual (+UTC) Mode**: Synchronizes Cloud Audit `"Who-Changed-What"` timestamps, Flight Recorder mutation timestamps, resource creation dates, and **Night-Mode Cloud Scheduler / Compute Instance Schedule** `--timezone` flags (`x-client-timezone` header).

- **🔐 Zero-Hardcoded-Credentials Multi-Account Onboarding Gate**
  - Sign in from mobile or desktop using:
    1. **Gmail / Google Sign-In (PKCE Auth Code Flow)**
    2. **Local `gcloud` CLI / Application Default Credentials (ADC) Discovery**
    3. **OAuth 2.0 Access Token (`ya29...`)**
    4. **`application_default_credentials.json` Paste**

---

## 🔌 Backend REST & WebSocket API Endpoints (`server/index.js`)

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/ws/ssh` | `WS (WebSocket)` | **Full-Duplex `@xterm/xterm` Web-SSH PTY Bridge**: Connects to Compute Engine VMs (`ssh2` / `gcloud compute ssh` / IAP) and Cloud Run Gen2 Containers (`gcloud beta run services ssh` with auto `--ssh --execution-environment=gen2` preflight & `gcloud beta run services proxy`) |
| `/api/project/:id/tunnels` | `GET / POST` | **127.0.0.1 Developer Tunnel Manager**: Starts, stops, lists, and probes local port-forward tunnels (`/tunnels/start`, `/tunnels/stop`, `/tunnels/probe`) for Cloud Run OIDC Proxy, Compute VM IAP TCP, and Cloud SQL / AlloyDB Auth Proxy |
| `/api/project/:id/audit-timeline` | `GET` | **Live Cloud Audit "Who-Changed-What" Timeline**: Queries `logging.googleapis.com/v2` (`cloudaudit.googleapis.com/activity`) + in-session Flight Recorder for principal attribution, IAM binding deltas & request payloads |
| `/api/project/:id/quotas/radar` | `GET` | **Live GCP API Quota Saturation & HTTP 429 Early-Warning Radar**: Queries Global & Regional Compute Engine quotas, Cloud Run max-instance ceilings & Secret Manager Free-Tier version saturation |
| `/api/auth/discover` | `GET` | Discovers local `gcloud` / ADC accounts and accessible GCP projects |
| `/api/context` | `GET` | Returns active authenticated session account and project list |
| `/api/pricing/live-sync` | `GET` | **Live Cloud Billing Price Sync**: Queries `cloudbilling.googleapis.com/v1` for live SKU rates |
| `/api/ai-vault/status` | `GET` | Returns AES-256-GCM RAM Vault status, ECDH P-256 public key (`SPKI`), and available Gemini 3.8/3.1 models |
| `/api/ai-vault/models` | `GET` | Queries `generativelanguage.googleapis.com/v1beta/models` to auto-discover live Gemini models |
| `/api/ai-vault/configure` | `POST` | Accepts an **ECDH P-256 + HKDF-SHA256 + AES-256-GCM** encrypted client envelope and seals the key in volatile RAM |
| `/api/project/:id/ai-vault/ask` | `POST` | Runs live `gemini-3.8-flash` / `gemini-3.1-pro` SRE & FinOps reasoning (`8,192` token budget) |
| `/api/project/:id/overview` | `GET` | Parallel live fetch of VMs, Cloud Run, GKE, VPCs, Firewalls, GCS, BigQuery, APIs & Logs |
| `/api/project/:id/quantum-nexus/overview` | `GET` | **2026 Quantum Nexus**: Returns Cross-Cloud Causal Blast-Radius Graph, Time-Machine Snapshots, FinOps Arbitrage, Ephemeral PR Stacks & Honey-Tokens |
| `/api/project/:id/quantum-nexus/action` | `POST` | **2026 Quantum Nexus**: Executes `CAPTURE_SNAPSHOT`, `ROLLBACK_SNAPSHOT`, `UPDATE_FINOPS_CIRCUIT_BREAKER`, `CREATE_EPHEMERAL_PR_ENV`, `PLANT_HONEY_TOKEN` & `TRIGGER_HONEY_TRIPWIRE_TEST` |
| `/api/project/:id/wave10/overview` | `GET` | **Wave-10 Frontier Studio**: Lists Spanner Graph instances, Serverless Spark batches, Cloud Workflows & Model Armor policies |
| `/api/project/:id/wave10/action` | `POST` | **Wave-10 Frontier Studio**: Executes `CREATE_SPANNER_INSTANCE`, `RUN_SPANNER_GQL`, `SUBMIT_SERVERLESS_SPARK`, `DEPLOY_WORKFLOW_SAGA` & `SCAN_MODEL_ARMOR` |
| `/api/project/:id/data-engineer/overview` | `GET` | **2026 Data Engineering Studio**: Parallel discovery of BigQuery Datasets/Tables, GCS Buckets, Dataform Repositories (`dataform.googleapis.com/v1beta1`), Dataplex DataScans & Data Mesh Products (`dataplex.googleapis.com/v1`), BigQuery DTS Transfers, Cloud Workflows DAGs & live `INFORMATION_SCHEMA.JOBS_BY_PROJECT` Slot Doctor diagnostics |
| `/api/project/:id/data-engineer/action` | `POST` | **2026 Data Engineering Studio**: Executes `DEPLOY_MEDALLION_PIPELINE`, `CREATE_DATAFORM_REPO`, `RUN_AUTO_CLEAN_SQL`, `CREATE_DATAPLEX_SCAN`, `CREATE_DATAPLEX_DATA_PRODUCT` & `DEPLOY_SERVERLESS_ELT_DAG` |
| `/api/project/:id/data-engineer/resource` | `DELETE` | **2026 Data Engineering Studio**: Deletes a Dataform Repository, Dataplex DataScan, Dataplex Data Product, or BigQuery Dataset |
| `/api/project/:id/bigquery/biglake/overview` | `GET` | **BigLake Metastore & Iceberg Studio**: Lists BigLake Metastore Catalogs (`biglake.googleapis.com/v1`), Connections & Apache Iceberg / Parquet tables |
| `/api/project/:id/bigquery/biglake/create` | `POST` | **BigLake & Iceberg Studio**: Creates BigLake Metastore Catalogs, Connections, binds GCS IAM & provisions Apache Iceberg tables |
| `/api/project/:id/biglake/metastore/catalogs/:loc/:id` | `DELETE` | **BigLake Metastore**: Deletes a BigLake Metastore Catalog (`biglake.googleapis.com/v1`) |
| `/api/project/:id/sovereign-iam/credentials` | `GET` | **Sovereign IAM Vault**: Lists Service Accounts, user-managed `.json` keys (`iam.googleapis.com/v1`) & active session OAuth2 token status |
| `/api/project/:id/sovereign-iam/credentials/action` | `POST` | **Sovereign IAM Kill-Switch**: Executes `CREATE_SA_KEY`, `DISABLE_SA_KEY`, `ENABLE_SA_KEY`, `DELETE_SA_KEY`, `EMERGENCY_REVOKE_ALL_SA_KEYS` & `REVOKE_ACTIVE_OAUTH_TOKEN` |
| `/api/project/:id/sovereign/secrets-kms` | `GET` | **Secret Manager & KMS Vault Studio**: Lists live Secret Manager secrets, version states (`ENABLED`/`DISABLED`/`DESTROYED`), IAM accessors & monthly Free Tier usage (`6 free active versions/mo`) |
| `/api/project/:id/sovereign/secrets-kms/action` | `POST` | **Dedicated Secret Manager Lifecycle & Rotation Studio**: Executes `ROTATE_SECRET` (with auto-disable of old versions), `TOGGLE_VERSION_STATE` (`ENABLE`/`DISABLE`/`DESTROY`), `GRANT_SECRET_ACCESSOR` & `DELETE_SECRET` |
| `/api/project/:id/finops/always-free-auditor` | `GET` | **Google Cloud "Always Free" Tier Auditor**: Cross-references live Compute VMs, Cloud Run, GCS, BigQuery, Secret Manager, Artifact Registry & GKE against official monthly Free Tier limits |
| `/api/project/:id/cloudrun` | `GET / PATCH` | Lists and live-patches Cloud Run Gen2 services (CPU, RAM, Min/Max scale, GPUs, Billing mode, Direct VPC Egress, Storage Volume Mounts & Revision Health) |
| `/api/project/:id/cloudrun/dead-artifacts-scan` | `GET` | **Cloud Run Dead Container & GCS Artifact Scanner**: Cross-references active Cloud Run revisions against Artifact Registry images & Cloud Storage build/staging buckets (`_cloudbuild`, `run-sources-*`, `gcf-v2-*`) |
| `/api/project/:id/cloudrun/dead-artifacts-purge-gcs` | `POST` | **Cloud Storage Build-Artifact Batch Purge**: Batch-deletes leftover Cloud Storage build/staging tarballs and container blobs |
| `/api/project/:id/cloudrun/:region/:name/revisions/:rev/autopsy` | `GET` | **Cloud Run Crash-Loop Autopsy & Revision Diff**: Queries `logging.googleapis.com/v2` for container crash logs, diffs config/env/secrets against the healthy baseline & classifies root cause |
| `/api/project/:id/cloudrun/:region/:name/time-machine-restore` | `POST` | **Cloud Run Revision Time-Machine**: Executes `INSTANT_TRAFFIC_PIN` (`<2s` 100% traffic rollback), `CLONE_REVISION_SPEC`, or `AUTO_FIX_CRASH` (RAM upgrade + `startupCpuBoost`) |
| `/api/project/:id/cloudrun/:region/:name/iam` | `POST` | **Cloud Run Public/Private IAM Toggle**: Updates `roles/run.invoker` (`allUsers`) and `invokerIamDisabled` |
| `/api/project/:id/cloudrun/convert-to-gke` | `POST` | **Cloud Run → GKE Migrator**: Transpiles & deploys a 6-resource K8s bundle onto a live GKE cluster |
| `/api/project/:id/functions/overview` | `GET` | **Cloud Functions & Eventarc Studio**: Lists `v2` & `v1` functions (`cloudfunctions.googleapis.com`) and Eventarc triggers (`eventarc.googleapis.com`) |
| `/api/project/:id/functions/iam-doctor` | `POST` | **1-Tap Eventarc IAM Auto-Doctor**: Grants missing GCS Publisher, Eventarc Receiver & Cloud Run Invoker service-agent IAM bindings |
| `/api/project/:id/functions/deploy` | `POST` | **Functions & Eventarc Deployer**: Deploys `GEN_2` or `GEN_1` Cloud Functions with plain-English Eventarc triggers |
| `/api/project/:id/functions/test-event` | `POST` | **Synthetic CloudEvent Tester**: Fires a `CloudEvents v1.0` payload and traces 4-hop Eventarc delivery latency |
| `/api/project/:id/cloudbuild/overview` | `GET` | **Cloud Build Studio**: Lists Cloud Build history (`cloudbuild.googleapis.com/v1`) & Artifact Registry images |
| `/api/project/:id/cloudbuild/github-build` | `POST` | **GitHub Source-to-Container**: Clones GitHub repo, builds via Buildpacks/Dockerfile, pushes to Artifact Registry & optionally deploys to Cloud Run / GKE |
| `/api/project/:id/wave9/gke-vertex` | `GET` | **GKE Studio**: Lists live GKE Autopilot & Standard clusters (`container.googleapis.com/v1`) + Vertex AI endpoints |
| `/api/project/:id/gke/clusters/:loc/:name` | `DELETE` | **GKE Studio**: Deletes a live GKE cluster |
| `/api/project/:id/wave9/cloud-sql` | `GET` | **Cloud SQL & AlloyDB Studio**: Lists Cloud SQL (`sqladmin.googleapis.com`) & AlloyDB (`alloydb.googleapis.com`) instances |
| `/api/project/:id/wave9/supply-chain` | `GET` | **Artifact Registry SBOM Studio**: Lists repositories, container digests, and untagged orphan layers |
| `/api/project/:id/wave9/supply-chain/delete-image` | `POST` | **Artifact Registry**: Deletes a specific container digest or tag via `artifactregistry.googleapis.com/v1` |
| `/api/project/:id/wave9/supply-chain/sweep-orphans` | `POST` | **Artifact Registry**: Batch-deletes all untagged orphan digests across a repository |
| `/api/project/:id/vms` | `GET` | Lists all Compute Engine VMs across all zones with machine types, IPs, Spot status & disks |
| `/api/project/:id/vms/:zone/:name/power` | `POST` | Executes `start`, `stop`, `reset`, `suspend`, `resume`, `setMachineType`, or `setDeletionProtection` |
| `/api/project/:id/vms/:zone/:name/ssh` | `POST` | Runs live commands over `gcloud compute ssh` or reads Serial Port 1 console output |
| `/api/project/:id/provision` | `POST` | Creates live Compute VMs, Cloud Run services (with Direct VPC & Storage Volumes), GKE Clusters, Cloud SQL / AlloyDB, VPCs, Firewalls, 5-Step GCS Buckets, or BigQuery Datasets |
| `/api/project/:id/bigquery/datasets` | `GET` | **BigQuery Studio**: Enriches all datasets with Compliance Score (`0–100`), Billing Model, Time-Travel & FinOps delta |
| `/api/project/:id/bigquery/datasets/:d` | `PATCH` | **BigQuery Studio**: Live-patches `storageBillingModel`, `maxTimeTravelHours`, `defaultRoundingMode`, TTLs & KMS |
| `/api/project/:id/bigquery/datasets/:d/tables` | `GET / POST` | **BigQuery Studio**: Lists tables or provisions Partitioned + Clustered + BigLake tables |
| `/api/project/:id/bigquery/query` | `POST` | **BigQuery Studio**: Pre-Flight Dry-Run Gatekeeper, Auto-SQL Optimizer, Byte-Cost Firewall & Live Execution |
| `/api/project/:id/storage/buckets/:b/dlp-scan` | `POST` | **Moonshot X1**: Streams object bytes in RAM to scan for leaked secrets & regulated PII |
| `/api/project/:id/storage/buckets/:b/dlp-redact` | `POST` | **Moonshot X1**: Redacts sensitive secrets/PII in-place inside a Cloud Storage object |
| `/api/project/:id/storage/buckets/:b/security-patch` | `POST` | **Storage Compliance**: Applies 1-tap PAP, Uniform Access, Soft Delete, Versioning, or Lifecycle rules |
| `/api/project/:id/firewalls/:name` | `PATCH` | **Enterprise Firewall Editor**: Updates `ALLOW`/`DENY`, priority, ports, CIDRs, tags, logging, or `disabled` state |
| `/api/project/:id/operation-status` | `GET` | **Real-Time GCP Operation Tracker**: Polls live `compute#operation` (`PENDING` → `RUNNING` → `DONE`) |
| `/api/project/:id/hibernate` | `POST` | **2026 Night-Mode FinOps Switch**: `SLEEP` (parks all VMs & warm Cloud Run) or `WAKE` (restores state) |
| `/api/project/:id/security-audit` | `GET` | **2026 Zero-Trust Scanner**: Audits IAM Service Accounts & `0.0.0.0/0` open firewall exposures |
| `/api/project/:id/benchmark` | `POST` | **Wave 2 Stress & X-Ray Arena**: Benchmarks Cold-Start vs Warm P50/P95/P99 latency & HTTP headers |
| `/api/project/:id/zombies` | `GET` | **Wave 2 Zombie Hunter**: Scans orphaned Persistent Disks, unused Static IPs & idle warm services |
| `/api/project/:id/zombies/exterminate` | `POST` | **Wave 2 Zombie Exterminator**: Deletes orphaned disks/IPs with live GCP operation tracking & tombstoning |
| `/api/project/:id/cloudrun/teleport` | `POST` | **Wave 2 Cross-Region Teleporter**: Clones a live Cloud Run service into a target/green region |
| `/api/project/:id/stack-deploy` | `POST` | **Wave 3 Stack Synthesizer**: Provisions interconnected GCS + BigQuery + Cloud Run 3-tier stack |
| `/api/project/:id/flight-recorder` | `POST / GET` | **Wave 3 Flight Recorder**: Returns chronological session mutation ledger with 1-tap undo payloads |
| `/api/project/:id/apis` | `GET / POST` | Lists enabled APIs and enables/disables services via `serviceusage.googleapis.com` |
| `/api/project/:id/billing` | `GET / POST` | Reads billing status or executes Emergency Billing Kill-Switch (`UNLINK_BILLING` / `RELINK_BILLING`) |
| `/api/project/:id/billing-guardian` | `GET` | **Remaining Bonus & Cloud Billing Guardian**: Returns cached snapshot immediately on page entry (`cached: true`) or queries live `cloudbilling.googleapis.com/v1beta:generateInsights` + `billingbudgets.googleapis.com/v1` when `?refresh=true` is passed (every 2m) |
| `/api/project/:id/billing-guardian/auto-download-credits-csv` | `POST` | **1-Click Auto-Grab Credits CSV**: Clicks `button[id$="billingtest-download-credits-csv"]` via CDP (if open) and automatically discovers & parses the latest Google Cloud Billing Credits `.csv` in `~/Downloads`, `~/Desktop`, or `/tmp` |
| `/api/project/:id/billing-guardian/sync-console-credits` | `POST` | **Remaining Bonus CSV Parser**: Parses the 9-column Google Cloud Console Credits `.csv` and saves exact `Remaining value` & `Original value` grants to Temp JSON |
| `/api/project/:id/billing-guardian/reset-console-credits` | `POST` | **Remaining Bonus Reset**: Empties all synced Remaining Bonus grants and cached cost/credit rows across Temp JSON and in-memory caches |
| `/api/project/:id/service-accounts` | `GET` | **Universal Runtime Service Account Discovery**: Lists all active custom and default Service Accounts (`iam.googleapis.com/v1` + `gcloud` fallback) and recommends custom SAs |
| `/api/project/:id/service-accounts/grant-act-as` | `POST` | **1-Click Resource-Level `actAs` Surgeon**: Binds `roles/iam.serviceAccountUser` strictly on a target Service Account resource |
| `/api/project/:id/provision/preflight` | `POST` | **Dry-Run IAM & Egress Preflight Simulator**: Tests `projects.testIamPermissions`, API status, `iam.serviceAccounts.actAs`, and same-region bucket locality before provisioning |
| `/api/project/:id/finops/egress-leftover-radar` | `GET` | **Live Egress & Stopped-Resource Leftover Radar**: Scans for `STOPPED` VM disk drain, orphaned disks, idle Static IPs (`$7.30/mo`), Nearline/Coldline early-deletion penalties, and cross-region egress |
| `/api/project/:id/aws-azure-parity/overview` | `GET` | **28-in-1 Multi-Cloud Parity Discovery**: 12-way parallel discovery across VMs, Cloud Run, GCS, BigQuery, Secret Manager, VPCs, Cloud DNS, IAM, and Enabled GCP APIs (`serviceusage.googleapis.com`) |
| `/api/project/:id/aws-azure-parity/action` | `POST` | **28-in-1 Multi-Cloud Parity & Two-Mode Teardown Engine**: Executes all 20 AWS/Azure and 8 Alibaba/Huawei bridge actions plus `ENABLE_PARITY_FEATURE_APIS` and `TEARDOWN_PARITY_FEATURE` (`FEATURE_ONLY` vs `PURGE_AND_DISABLE_APIS`) |

---

## 🛠️ Prerequisites & Optional Google Cloud SDK (`gcloud`) Power-User Perks

### 1. Required (Core Runtime — Zero `gcloud` Needed)
- **Node.js `20+` / `22+`** (or Docker `node:22-alpine`)
- **Is `gcloud` required? No.** Over **95% of CloudPulse 2026** communicates directly with official **Google Cloud HTTPS REST APIs** (`compute.googleapis.com`, `run.googleapis.com`, `storage.googleapis.com`, `bigquery.googleapis.com`, `cloudbilling.googleapis.com`, `iam.googleapis.com`, `container.googleapis.com`, etc.) using standard OAuth 2.0 Bearer tokens:
  - **Browser OAuth2 Sign-In / Token Paste (`ya29...`)** or **`application_default_credentials.json`** in the Onboarding Gate
  - **Cloud Run / GCE Metadata Server** when deployed on Google Cloud
  - **Pure-JS Direct TCP Web-SSH (`ssh2` on port `:22`)** for Compute Engine VMs
  - **Remaining Bonus CSV Guardian** (`⚡ Auto-Grab Downloaded CSV` & `.csv` upload)

### 2. Optional Power-User Perks (Unlocked Automatically When `gcloud` Is Installed Locally)
If you run CloudPulse locally on a machine with the **[Google Cloud SDK (`gcloud`)](https://cloud.google.com/sdk/docs/install)** installed, the backend (`server/index.js`) automatically detects it and unlocks **5 extra local capabilities**:

| Feature Unlocked by Local `gcloud` | CLI Command Used Under the Hood | What Works Without `gcloud` (Pure REST Fallback) |
| :--- | :--- | :--- |
| **1. Zero-Click Local Account & Token Auto-Discovery** | `gcloud auth list` & `gcloud auth print-access-token` | Sign in via Google OAuth PKCE, paste an OAuth2 token (`ya29...`), or upload `application_default_credentials.json` |
| **2. Interactive Cloud Run Gen2 Container SSH & Proxy** | `gcloud beta run services ssh` & `gcloud beta run services proxy` | Full Cloud Run Gen2 deployment, live logs, revision tuning, GPU attachment, and IAM toggling via `run.googleapis.com/v2` |
| **3. Zero-Public-IP Cloud IAP Tunnel SSH for VMs** | `gcloud compute ssh --tunnel-through-iap` | Direct Web-SSH over port `:22` via the built-in pure-Node `ssh2` client + Serial Port 1 Console output via REST |
| **4. Live Interactive Local Cloud Shell Tab** | Local PTY running `gcloud`, `bq`, and `gsutil` commands | Copy-ready `gcloud` / `bq` / Terraform snippets in every studio |
| **5. `gcloud billing` & `gcloud beta orchestration-pipelines` CLI Helpers** | `gcloud billing accounts list` & `gcloud dataplex` CLI fallbacks | Direct `cloudbilling.googleapis.com` & `dataplex.googleapis.com/v1` REST API calls |

```bash
# Optional: Install & authenticate Google Cloud SDK locally to unlock all 5 perks above
gcloud auth login
gcloud auth application-default login
gcloud components install beta
```

---

## 🚀 Quick Start — How to Run Properly (Dev, Custom Ports & Production)

### 1. Install Dependencies & (Optional) Configure `.env`
All ports, hosts, and proxy targets are environment-driven (see [`.env.example`](.env.example)—nothing is hardcoded):
```bash
npm install

# Optional: copy .env.example to .env to customize ports/hosts
cp .env.example .env
```

| Environment Variable | Default | Purpose |
| :--- | :--- | :--- |
| `BACKEND_HOST` | `127.0.0.1` | Host interface where the Express API & WebSocket bridge (`server/index.js`) listens |
| `BACKEND_PORT` / `PORT` | `4000` | Port for the Express API & WebSocket bridge (`server/index.js`) |
| `VITE_HOST` | `0.0.0.0` | Host interface for the Vite frontend dev server (`vite.config.js`) |
| `VITE_PORT` | `5173` | Port for the Vite frontend dev server |
| `VITE_API_PROXY_TARGET` | `http://${BACKEND_HOST}:${BACKEND_PORT}` | Explicit `/api` proxy target override for Vite |
| `VITE_AUTO_START_BACKEND` | `true` | When `true`, `npm run dev` automatically starts and watches `server/index.js` if `BACKEND_PORT` is down (preventing `ECONNREFUSED` proxy errors) |

### 2. Three Ways to Run CloudPulse 2026

```bash
# Option A — 1-Command Auto-Healing Dev Mode (Recommended)
# Starts Vite AND automatically spawns/watches server/index.js on BACKEND_PORT:
npm run dev

# Option B — Two-Terminal Explicit Dev Mode (Separate Backend & Frontend Terminals)
# Terminal 1 (Express API + WebSocket Bridge):
BACKEND_PORT=4000 npm run server
# Terminal 2 (Vite Hot-Reload UI pointing to Terminal 1):
BACKEND_PORT=4000 VITE_PORT=5173 VITE_AUTO_START_BACKEND=false npm run dev

# Option C — Single-Port Production Mode (Builds dist/ & serves UI + /api/* on PORT)
PORT=4000 npm run prod
```

---

## ☁️ Deploy to Google Cloud Run (1-Click Button & CLI Guide)

[![Run on Google Cloud](https://deploy.cloud.run/button.svg)](https://ssh.cloud.google.com/cloudshell/editor?cloudshell_git_repo=https://github.com/abdelouahabb/gcp-custom-ui&cloudshell_git_branch=main&cloudshell_tutorial=CLOUD_RUN_TUTORIAL.md)
[![Open in Cloud Shell](https://gstatic.com/cloudssh/images/open-btn.svg)](https://ssh.cloud.google.com/cloudshell/editor?cloudshell_git_repo=https://github.com/abdelouahabb/gcp-custom-ui&cloudshell_git_branch=main&cloudshell_tutorial=CLOUD_RUN_TUTORIAL.md)

- **1-Click "Run on Google Cloud" / "Open in Cloud Shell" Guided Wizard:** Opens Google Cloud Shell with [`abdelouahabb/gcp-custom-ui`](https://github.com/abdelouahabb/gcp-custom-ui) cloned and launches an interactive tutorial panel ([`CLOUD_RUN_TUTORIAL.md`](CLOUD_RUN_TUTORIAL.md)) that runs our quota-safe [`./deploy-cloud-run.sh`](deploy-cloud-run.sh) script (bypassing `deploy.cloud.run`'s shared `serviceusage.googleapis.com` `Error 429` rate limit by pinning `CLOUDSDK_BILLING_QUOTA_PROJECT` to your selected project).

```bash
# Option 1 — Interactive Mode (prompts for your GCP Project ID and optional Service Account)
./deploy-cloud-run.sh

# Option 2 — Standard Public Deployment with Custom Runtime Service Account & 10s Cooldown
./deploy-cloud-run.sh \
  --project YOUR_GCP_PROJECT_ID \
  --region us-central1 \
  --service-account cloudpulse-run-sa \
  --sleep 10

# Option 3 — Skip API Enablement if APIs are Already Active (or if serviceusage quota is rate-limited)
./deploy-cloud-run.sh \
  --project YOUR_GCP_PROJECT_ID \
  --region us-central1 \
  --service-account cloudpulse-run-sa \
  --skip-api-enable

# Option 4 — Private Zero-Trust IAM / IAP Deployment
./deploy-cloud-run.sh \
  --project YOUR_GCP_PROJECT_ID \
  --region us-central1 \
  --service-account cloudpulse-run-sa \
  --sleep 10 \
  --private

# Option 5 — Google Cloud Build CI/CD Pipeline (cloudbuild.yaml)
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_REGION="us-central1",_SERVICE_NAME="cloudpulse-2026"
```

---

## 🔒 Security & Credential Hygiene

- **No credentials or personal tokens are stored in this repository.**
- **Google AI Studio API keys (`AIzaSy...`)** sealed via **Moonshot `X6`** are encrypted exclusively in volatile Node.js RAM using an ephemeral 256-bit `AES-256-GCM` key (`crypto.createCipheriv`), never written to disk or browser `localStorage`, and automatically wiped on server restart or 1-tap purge.
- All GCP authentication happens dynamically at runtime via the browser session (`x-gcp-access-token`), Cloud Run service account metadata server, or your local `~/.config/gcloud` environment.
