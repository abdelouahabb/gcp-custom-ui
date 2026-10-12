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
    - **🎯 Plain-English Eventarc Trigger Wizard ("`v1` Simplicity with `v2` Power")**: Eliminates raw CloudEvents filter memorization—pick *"When a file is uploaded/deleted in Cloud Storage"*, *"When a Pub/Sub message arrives"*, *"When a BigQuery job finishes"*, *"On a Cron Schedule"*, or *"Direct HTTPS Webhook"*.
    - **🔬 4-Stage Visual Eventarc Pipeline X-Ray & Cost Guardrail**: Visually maps `1. Event Producer` ➔ `2. Transport Bus ($0 Free Direct Pub/Sub vs Cloud Audit Logs DATA_WRITE warning)` ➔ `3. Eventarc Filter & Hidden IAM Roles` ➔ `4. Function Handler`, with a **1-Click Synthetic CloudEvent v1.0 Tester** and copy-ready **Node.js 22 / Python 3.12 / Go 1.23** handler code.
    - **🩺 1-Tap Eventarc IAM Auto-Doctor & `v1 → v2` Upgrader**: Automatically binds the 4 hidden service-agent IAM roles (`roles/pubsub.publisher` on the GCS Service Agent, `roles/eventarc.eventReceiver`, `roles/run.invoker`, and `roles/eventarc.serviceAgent`) that break newcomer deployments, and upgrades legacy `v1` functions (`1 req/instance`) to `v2` (`up to 1,000 req/instance`, saving up to **78%**).

> 📖 **Full Engineering & User Manual**: Read [**`docs/REVOLUTIONARY_FEATURES_GUIDE.md`**](docs/REVOLUTIONARY_FEATURES_GUIDE.md) or click the **`Docs & Guide 📖`** tab directly inside the app for step-by-step explanations of every feature, the exact GCP REST APIs called, and billing impact.

---

## ✨ Core GCP Service Studios

- **★ Cloud Run Serverless Studio (`run.googleapis.com/v2`)**
  - **2026 Serverless GPU Accelerators**: Attach `1x NVIDIA L4 (24GB VRAM)` or `1x NVIDIA RTX PRO 6000 Blackwell (96GB VRAM)` with configurable **GPU Zonal Redundancy** (`--no-gpu-zonal-redundancy` vs `--gpu-zonal-redundancy`) and automatic hardware minimum enforcement (`≥4 vCPU`, `≥16Gi RAM`, `GEN2`).
  - **2026 Billing Modes**: Switch between **Request-based Billing** (`cpuIdle: true` / `--billing=request`, `$0` when idle) and **Instance-based Billing** (`cpuIdle: false` / `--billing=instance`, CPU/GPU allocated for the entire instance lifetime).
  - **2026 Direct VPC Egress & Storage Volume Mounts (Beta)**: Native `template.vpcAccess` Direct VPC Egress (`PRIVATE_RANGES_ONLY` / `ALL_TRAFFIC` + firewall tags) and stateful/ephemeral volume mounts (`GCS_BUCKET` FUSE, `IN_MEMORY` RAM disk, `NFS_FILESTORE`).
  - **1-Click Cloud Run → GKE Kubernetes Migration & Live Revision Tuner**: Transpile any Cloud Run service into a 6-resource Kubernetes manifest bundle and deploy straight to GKE, or scale Min/Max instances (`0` to `200`), Concurrency, CPU/Memory, Environment Variables, and Canary Traffic Splitting in place.

- **⚡ Cloud Functions (`v1` & `v2`) & Eventarc Trigger Studio (`cloudfunctions.googleapis.com/v2` + `eventarc.googleapis.com/v1`)**
  - Plain-English Eventarc trigger wizard, 4-stage visual Eventarc transport & billing X-Ray, 1-Tap Eventarc IAM Auto-Doctor, synthetic CloudEvent v1.0 tester, and 1-Click `v1 → v2` concurrency upgrader (`-78%` compute cost).

- **☸️ Google Kubernetes Engine (GKE) Studio (`container.googleapis.com/v1`)**
  - Dedicated GKE Autopilot & Standard Spot GPU cluster provisioner with SEC/GDPR/HIPAA compliance locks, Workload YAML Composer, GitHub-to-GKE Cloud Build integration, and 1-tap `kubeconfig` / `kubectl` commands.

- **🐘 Cloud SQL & Google Cloud AlloyDB Studio (`sqladmin.googleapis.com/v1` + `alloydb.googleapis.com/v1`)**
  - Dedicated MySQL 8.4 LTS, PostgreSQL 16/17 Cloud SQL (`Enterprise` & `Enterprise Plus`), and Google Cloud AlloyDB cluster provisioner, TCO Architecture Comparator, ScaNN / `pgvector` AI Vector Index Surgeon, and IAM Auth Proxy v2 Vault.

- **🏗️ Cloud Build & Artifact Registry Supply-Chain Studios (`cloudbuild.googleapis.com/v1` + `artifactregistry.googleapis.com/v1`)**
  - Build container images directly from GitHub repositories using Zero-Dockerfile Google Cloud Buildpacks or Dockerfiles, auto-create Artifact Registry repositories, inspect SLSA-3 provenance, and delete or batch-sweep untagged orphan digests in 1 click.

- **🖥️ Compute Engine Multi-Region Studio & Web SSH (`compute.googleapis.com/v1`)**
  - **40 Global Regions & 121 Availability Zones**: Americas, Europe, Asia-Pacific, MENA, and Africa.
  - **5 Machine Series**: `E2` (Cost-Optimized/Free Tier), `N2/N2D`, `C3/C4` (Gen-4/5 Sapphire/Emerald Rapids), `T2A Arm64` (Ampere Altra), and `G2/A2` GPU VMs.
  - **Advanced VM Configuration**: Spot VM (`up to 91% off`) vs Standard VM, `pd-balanced` / `pd-ssd` / `hyperdisk-balanced` boot disks, dedicated NVIDIA GPUs (`T4`, `L4`, `V100`, `A100`), Shielded VM (`Secure Boot` + `vTPM`), Deletion Protection toggle, Startup Scripts (`metadata.startup-script`), Live Machine Type Resizing (`setMachineType`), Suspend/Resume, and interactive **Web SSH + Serial Port 1 Console**.

- **🚨 DEFCON-1 Emergency Project Billing Kill-Switch & API Circuit Breaker**
  - **Project Billing Circuit Breaker (`cloudbilling.googleapis.com/v1`)**: 2-step emergency button to detach the active Cloud Billing Account from a compromised project (`billingAccountName: ""`) to immediately halt all billable spend, plus 1-tap re-linking.
  - **Emergency Mobile API Kill-Switch (`serviceusage.googleapis.com/v1`)**: Inspect all enabled APIs on your project with priority sorting and disable/enable services in 1 tap (`disableDependentServices: true`).

- **🌐 VPC Networks, Enterprise Firewalls, Storage, BigQuery & Mobile Cloud Shell**
  - Provision and manage custom/auto-mode VPC Networks (`REGIONAL` / `GLOBAL` BGP routing, Jumbo Frames MTU `8896`), `ALLOW`/`DENY` Ingress & Egress Firewall Rules with live `PATCH` editing and IAP lockdown, Cloud Storage Buckets, BigQuery Datasets & Partitioned/Clustered Tables, real-time Cloud Logging streams, and an interactive Mobile Cloud Shell (`gcloud` / `bq`).

- **🔐 Zero-Hardcoded-Credentials Multi-Account Onboarding Gate**
  - Sign in from mobile or desktop using:
    1. **Gmail / Google Sign-In (PKCE Auth Code Flow)**
    2. **Local `gcloud` CLI / Application Default Credentials (ADC) Discovery**
    3. **OAuth 2.0 Access Token (`ya29...`)**
    4. **`application_default_credentials.json` Paste**

---

## 🔌 Backend REST API Endpoints (`server/index.js`)

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/auth/discover` | `GET` | Discovers local `gcloud` / ADC accounts and accessible GCP projects |
| `/api/context` | `GET` | Returns active authenticated session account and project list |
| `/api/pricing/live-sync` | `GET` | **Live Cloud Billing Price Sync**: Queries `cloudbilling.googleapis.com/v1` for live SKU rates |
| `/api/ai-vault/status` | `GET` | Returns AES-256-GCM RAM Vault status, ECDH P-256 public key (`SPKI`), and available Gemini 3.8/3.1 models |
| `/api/ai-vault/models` | `GET` | Queries `generativelanguage.googleapis.com/v1beta/models` to auto-discover live Gemini models |
| `/api/ai-vault/configure` | `POST` | Accepts an **ECDH P-256 + HKDF-SHA256 + AES-256-GCM** encrypted client envelope and seals the key in volatile RAM |
| `/api/project/:id/ai-vault/ask` | `POST` | Runs live `gemini-3.8-flash` / `gemini-3.1-pro` SRE & FinOps reasoning (`8,192` token budget) |
| `/api/project/:id/overview` | `GET` | Parallel live fetch of VMs, Cloud Run, GKE, VPCs, Firewalls, GCS, BigQuery, APIs & Logs |
| `/api/project/:id/cloudrun` | `GET / PATCH` | Lists and live-patches Cloud Run Gen2 services (CPU, RAM, Min/Max scale, GPUs, Billing mode, Direct VPC Egress & Storage Volume Mounts) |
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
| `/api/project/:id/flight-recorder` | `GET` | **Wave 3 Flight Recorder**: Returns chronological session mutation ledger with 1-tap undo payloads |
| `/api/project/:id/apis` | `GET / POST` | Lists enabled APIs and enables/disables services via `serviceusage.googleapis.com` |
| `/api/project/:id/billing` | `GET / POST` | Reads billing status or executes Emergency Billing Kill-Switch (`UNLINK_BILLING` / `RELINK_BILLING`) |

---

## 🚀 Quick Start (Local Development vs Single-Port Production)

```bash
# 1. Install dependencies
npm install

# Option A — Local Development (Hot-Reload Vite + Express Bridge)
node server/index.js &
npx vite --port 5173 --host 0.0.0.0

# Option B — Single-Port Production Mode (Builds dist/ & serves UI + /api/* on Port 4000)
npm run prod
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
