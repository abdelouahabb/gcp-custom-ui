# CloudPulse 2026–2030 — Revolutionary Features & Engineering Manual

This guide explains **what every revolutionary feature in CloudPulse 2026 does**, **why it exists** (compared to the corporate Google Cloud Console), **which official Google Cloud REST APIs it calls under the hood**, and **how it impacts your billing and safety**.

> 💡 **In-App Interactive Guide**: You can also open the **`Docs & Guide 📖`** tab directly inside the CloudPulse 2026 UI (or click **`📖 How It Works`** in the top 2030 Orbital HUD) to search these guides interactively and launch any feature in 1 click.

---

## 🛰️ Wave 3: 2030 Orbital Telemetry UI & Autonomous Cloud Synthesis

### 1. Live 2030 Orbital Telemetry Ribbon (`FuturisticOrbitalHud.jsx`)
- **Where to find it**: Persistent ribbon across the top of the main cockpit.
- **What it shows**:
  - **API RTT (`ms`)**: Real-time round-trip latency from the CloudPulse bridge to Google Cloud REST APIs.
  - **Grid Carbon CFE (`% Clean`)**: Average **Google Cloud Carbon-Free Energy (`CFE%`)** across the regions where your active resources are deployed.
  - **Cloud Posture Grade (`A+` to `B`)**: Real-time security grade based on whether any VPC firewall rules expose ports to `0.0.0.0/0`.
  - **Continental Workload Matrix**: Live count of active resources in `Americas`, `Europe`, `APAC`, and `MENA`.

### 2. 🪄 1-Tap Multi-Service Architecture Stack Synthesizer (`POST /api/project/:id/stack-deploy`)
- **The Problem**: In standard Google Cloud Console, deploying a 3-tier cloud application (Object Storage + Analytics Lakehouse + Serverless API Gateway) requires navigating 3 different product consoles and manually wiring environment variables.
- **How it Works**:
  1. Click **`🪄 1-Tap Stack Synthesizer`** in the Orbital HUD.
  2. Choose one of 3 blueprints:
     - **🧠 Serverless AI RAG & Inference Stack**
     - **📊 Real-Time Lakehouse & Streaming Stack**
     - **🛡️ Zero-Trust Edge Microservice Stack**
  3. Pick a naming prefix and a target **Green GCP Region** (sorted by `CFE%`).
  4. Click **Deploy 3-Tier Stack**. CloudPulse calls `storage.googleapis.com`, `bigquery.googleapis.com`, and `run.googleapis.com/v2` in sequence, automatically injecting `GCS_BUCKET_URI` and `BIGQUERY_DATASET` into your new Cloud Run service's environment variables.
- **Billing Impact**: Defaults to Scale-to-Zero (`minInstanceCount: 0`), meaning **$0.00/hr idle compute cost**.

### 3. ⏱️ Cloud Flight Recorder & Mutation Time-Machine (`GET /api/project/:id/flight-recorder`)
- **The Problem**: When experimenting or deploying multiple resources, it is easy to lose track of what was just created and tedious to clean each resource up across different consoles.
- **How it Works**:
  - Click **`⏱️ Flight Recorder & Undo`** in the Orbital HUD.
  - Every stack synthesis and cross-region teleport is logged chronologically with a **`1-Tap Rewind / Delete`** button that calls `DELETE /api/project/:id/resource` to immediately roll back that resource.

---

## ✦ Wave 1: Beyond-Console FinOps, Topology, IaC & Zero-Trust Security

### 4. 💸 Live Wallet Burn-Rate Radar & Pre-Deploy Cost Calculator
- **Where to find it**: Top header (`$X.XXXX/hr` pill), **2026 Lab ✦ → Tab 2**, and inside the **`+ Provision Resource`** modal.
- **How it Works**:
  - Calculates real-time hourly and monthly (`730h`) run-rate across running Compute Engine VMs (accounting for `-68%` Spot VM discounts and boot disk storage), warm Cloud Run instances (`minInstances > 0`, including `NVIDIA L4` and `RTX PRO 6000 Blackwell` GPUs), GKE clusters, and GCS buckets.
  - Before you create a VM, Cloud Run service, or Bucket in the Provision Modal, the **Pre-Deploy FinOps Price Calculator** shows your exact estimated `$/hr` and `$/mo`.

### 5. 🌙 1-Tap Night-Mode FinOps Sleep & Wake Switch (`POST /api/project/:id/hibernate`)
- **Where to find it**: **2026 Lab ✦ → Tab 2** (or via **`⌘K`** → *"Park Project for the Night"*).
- **How it Works**:
  - **🌙 Park Night-Mode (`SLEEP`)**: Saves a snapshot of all currently `RUNNING` Compute Engine VMs and warm Cloud Run services (`minInstances > 0`), then stops all running VMs across all zones and scales warm Cloud Run services to `0`.
  - **☀️ Wake (`WAKE`)**: Reads your saved snapshot and restarts those exact VMs and restores your previous `minInstances` counts.

### 6. 🕸️ Interactive 4-Layer Cloud Topology & Blast-Radius Graph
- **Where to find it**: **2026 Lab ✦ → Tab 1**.
- **How it Works**: Maps your live project across 4 connected layers on a single screen:
  1. **Public Internet (`0.0.0.0/0` Exposure)** — World-open firewall rules and public `allUsers` Cloud Run endpoints.
  2. **VPC Backbone** — Active VPC networks, BGP routing modes, and MTU.
  3. **Compute & Serverless Fleet** — Live Compute Engine VMs and Cloud Run services.
  4. **Storage & Data Lakehouse** — Cloud Storage buckets and BigQuery datasets.

### 7. 📄 1-Tap Reverse-Terraform (`main.tf`) & `gcloud` Clone Blueprint Exporter
- **Where to find it**: **2026 Lab ✦ → Tab 3**.
- **How it Works**: Inspects all live resources in your active project and compiles them into ready-to-run **HashiCorp Terraform (`main.tf`)** (`google_compute_network`, `google_compute_firewall`, `google_compute_instance`, `google_cloud_run_v2_service`, `google_storage_bucket`, `google_bigquery_dataset`) or a bash script (`deploy-project-clone.sh`).

### 8. 🛡️ Zero-Trust Security & IAM Service Account Posture Scanner (`GET /api/project/:id/security-audit`)
- **Where to find it**: **2026 Lab ✦ → Tab 4**.
- **How it Works**: Queries `iam.googleapis.com/v1/projects/:id/serviceAccounts` and `compute.googleapis.com/compute/v1/projects/:id/global/firewalls` in parallel to flag risky `0.0.0.0/0` rules (especially on SSH port `22`, RDP port `3389`, or all ports) with a **1-Tap Delete Open Firewall Rule** button.

### 9. 🎙️ Global `⌘K` & Voice-to-Cloud Natural Language Command Palette (`CommandPaletteModal.jsx`)
- **Where to find it**: Press **`⌘K` / `Ctrl+K`** anywhere or click **`⌘K Ops`** in the top header.
- **How it Works**: Type or use **Web Speech API Voice Ops** (`Voice Ops` mic button) to execute natural-language cloud actions immediately.

---

## 🧪 Wave 2: Google Engineer's Secret Wishlist

### 10. ⚡ Cold-Start & P95 Latency Stress Arena + HTTP Header X-Ray (`POST /api/project/:id/benchmark`)
- **Where to find it**: **2026 Lab ✦ → Tab 5 (`⚡ Latency & HTTP X-Ray Arena`)**.
- **How it Works**:
  - Sends Request `#1` alone to measure **First-Hit Cold-Start Latency (`ms`)** and capture raw **HTTP Response Headers** (`x-cloud-trace-context`, `server`, `alt-svc`, `content-type`) and an 800-byte payload preview.
  - Sends the remaining burst (`1` to `40` requests at up to `10x` concurrency) to compute **Warm P50, P95, P99 tail latency**, **Throughput (`rps`)**, and a visual request waterfall.

### 11. 🧟 Zombie Resource Hunter with Real-Time GCP Zone Operation Progress Tracker (`GET / POST /api/project/:id/zombies`)
- **Where to find it**: **2026 Lab ✦ → Tab 6 (`🧟 Zombie Resource & Waste Hunter`)**.
- **How it Works**:
  - Scans `aggregated/disks`, `aggregated/addresses`, `aggregated/instances`, and Cloud Run services to detect:
    - **Unattached Persistent Disks** billing 24/7 with 0 mounted VMs
    - **Unused Static External IPs** (`$7.30/mo` penalty when not attached to a running VM)
    - **Stopped VMs** still paying monthly for attached boot disks
    - **Warm Cloud Run Services** (`minInstances > 0`)
  - **Real-Time GCP Zone Operation Progress Bar (`GET /api/project/:id/operation-status`)**: Tracks live Google Cloud `compute#operation` deletion progress (`18% DISPATCHING` → `35–92% RUNNING` → `100% DONE`), filters out `DELETING` resources, tombstones exterminated resources so they never reappear, and records verified savings (`$/yr`) in the session ledger.

### 12. 🌍 1-Tap Cross-Region Cloud Run Teleporter, FinOps & GPU SKU Pre-Flight Gatekeeper & Visual Diff (`POST /api/project/:id/cloudrun/teleport`)
- **Where to find it**: **2026 Lab ✦ → Tab 8 (`🌍 Cross-Region Teleport, Diff & CFE%`)** AND **Global Map 🌍 → Regional Inspector (`🌱 Green Cloud & FinOps Migration Recommender`)**.
- **How it Works**:
  - **1-Tap Cross-Region Teleporter**: Reads any live Cloud Run service in your project and clones its exact container image, env vars, CPU/RAM/GPU limits, billing mode, and public IAM invoker policy into any global region.
  - **40-Region FinOps Pricing & GPU SKU Capability Gatekeeper (`getRegionProfile` + `evaluateMigrationFeasibility`)**:
    - Evaluates regional price multipliers (`1.00x` Tier-1 in `us-central1`/`us-east1`/`us-west1` vs `1.38x` in `southamerica-east1` or `1.28x` in `europe-west6`), monthly `$` cost delta, annual `$` impact, one-time network egress & snapshot copy fees (`$0.08–$0.14/GB`), and **Break-Even ROI Payback Window** (`IMMEDIATE ROI` vs `X.X months`).
    - Performs hardware SKU pre-flight checks against **Cloud Run NVIDIA L4 GPU availability (`CLOUD_RUN_GPU_REGIONS`)**, **Compute Engine G2/L4 availability**, and **A3/H100 Mega-Hub availability**, blocking unsupported GPU teleports before execution and recommending the nearest GPU-enabled green region.
  - **Visual Config Diff Time-Machine**: Compares any two Cloud Run services side-by-side with `CHANGED` vs `IDENTICAL` badges.

### 13. 🗺️ Global Cloud Map · 40 Regions, 121 Zones, Tactical Spotlight & Chaos Failover (`GlobalNetworkWorldMap.jsx`)
- **Where to find it**: Top navigation tab **`Global Map 🌍`**.
- **How it Works**:
  - **Interactive 40-Region Orbital World Map (`1200×560` SVG)**: Plots all 40 Google Cloud regions and 121 Availability Zones across North America, South America, Europe, Middle East, Africa, Asia, and Australia with real subsea Andromeda fiber corridors.
  - **Native Scroll-Locked Zoom (`0.85x–6.5x`) + Tactical Spotlight Mode (`🎯 Spotlight ON`)**:
    - Uses a native `{ passive: false }` DOM wheel listener with cursor-centered zoom and map-scoped keyboard shortcuts (`WASD`/Arrows pan, `+/-` zoom, `0`/`Esc` reset) so zooming or navigating inside the map never scrolls the outer web page.
    - **Inverse-Zoom Node Scaling (`1 / Math.pow(zoom, 0.54)`)** keeps region hubs crisp at high magnification, while **Tactical Spotlight** dims non-target regions to ghost silhouettes (`18%` opacity) and renders orbiting Availability Zone constellations (`-a`, `-b`, `-c`, `-d`, `-f`) exclusively around the focused region.
  - **4 Lens Overlays**:
    - `🌐 Traffic & Topology`: Live packet arcs + VPC firewall priority evaluation (`0 → 65535`).
    - `🌱 Carbon Grid (CFE%)`: Colors all 40 regions by Carbon-Free Energy % and grid intensity (`gCO₂eq/kWh`).
    - `💥 Chaos Outage Sim`: Simulates a complete regional blackout (`⚡ Trigger Outage`) with Autonomous Cloud DNS + Global Load Balancer Reroute calculation to the nearest healthy region.
    - `📏 Fiber RTT Laser`: Click any 2 regions to fire an Andromeda subsea fiber laser and compute geodesic distance (`km`), physical glass propagation delay, and estimated TCP/TLS/HTTP RTT (`ms`).
  - **⏪ 60-Second Flight Recorder DVR Scrubber**: Rewind and replay historical packet animations and firewall interceptions across a 60-second rolling buffer.

### 14. 🔥 Enterprise VPC Firewall & Zero-Trust Command Center (`VpcNetworksAndFirewalls.jsx`)
- **Where to find it**: Top navigation tab **`VPC Networks & Firewalls`**.
- **How it Works**:
  - **Full `ALLOW` & `DENY` + `INGRESS` & `EGRESS` Studio**: Create or edit firewall rules in-place (`PATCH /api/project/:id/firewalls/:name`) with custom priorities (`0–65535`), multi-protocol port matrices (`tcp`, `udp`, `icmp`, `sctp`, `esp`, `all`), source/destination CIDRs, target network tags (`targetTags`), and firewall audit logging (`logConfig`).
  - **1-Tap Lock to IAP (`35.235.240.0/20`) & 1-Tap Pause/Enable**: Automatically flags rules exposing sensitive ports (`22`, `3389`, `3306`, `5432`, `6379`) to `0.0.0.0/0` and narrows `sourceRanges` to Google Cloud IAP in 1 click, or pauses/enables any rule without deleting it.
  - **Interactive Packet Priority Match Simulator ("Packet Tester")**: Test any hypothetical packet against your priority-sorted firewall rules + Google Cloud implied fallback rules (`65535`) to see which exact rule wins.

---

## 🧠 Wave 5 — Autonomous Cloud Brain, Pre-Crime Billing Time-Crystal & Dream Stack Compiler (`AutonomousCloudBrain.jsx`)

### 15. 🔮 "Pre-Crime" 30-Day Billing Time-Crystal Simulator & `$0`-Idle Circuit-Breaker
- **Where to find it**: **2026 Lab ✦ → Tab 1 (`🧠 Pre-Crime & Dream Brain`) → Mode 1 (`🔮 30-Day Billing Time-Crystal`)**.
- **How it Works**:
  - **Interactive 5-Variable Traffic & Architecture Simulator**: Drag live sliders for **Traffic Surge (`0.5x` → `50x` viral spike)**, **AI / GPU Inference Hours (`0–24h/day`)**, **Cross-Region Egress (`GB/mo`)**, **30-Day Forecast Horizon**, and **Autonomous Circuit-Breaker Guardrails** to watch your 30-day cumulative burn curve update in real time before spending a single dollar.
  - **Cost Anomaly & Budget Breach Predictor**: Pinpoints the exact day (`Day 1–30`) when a traffic surge or runaway GPU loop will breach your monthly budget ceiling.
  - **1-Tap Live `$0`-Idle Hibernation (`POST /api/project/:id/cloudrun/scale-zero`)**: Executes live Cloud Run scale-to-zero mutations (`minInstanceCount = 0`) across warm services in your project to immediately eliminate 24/7 idle container burn.

### 16. 🧬 "What-If" Resource Blast-Radius & Failure Cascade X-Ray
- **Where to find it**: **2026 Lab ✦ → Tab 1 (`🧠 Pre-Crime & Dream Brain`) → Mode 2 (`🧬 What-If Blast-Radius X-Ray`)**.
- **How it Works**:
  - Builds a dependency graph across your live VMs, Cloud Run services, VPC Firewall rules, Persistent Disks, and Regional Hubs.
  - Select any resource and switch between **Delete / Terminate**, **Revoke / Tighten Access**, and **Regional Blackout** to inspect every downstream casualty, severity score (`CRITICAL` / `ELEVATED` / `CONTAINED`), and a **Pre-Flight Safety Checklist** before mutating production infrastructure.

### 17. ⚡ Autonomous Cloud Architecture Compiler (Prompt → Optimal 40-Region Terraform / `gcloud` + Live Deploy)
- **Where to find it**: **2026 Lab ✦ → Tab 1 (`🧠 Pre-Crime & Dream Brain`) → Mode 3 (`⚡ Dream Stack Compiler`)**.
- **How it Works**:
  - Choose an architecture blueprint (*LLM Inference GPU API*, *Global Zero-Trust Microservice*, *High-Throughput Event Pipeline*, *Green FinOps Batch Compute*) or write a natural-language specification, and select your optimization priority (**Balanced**, **Lowest Cost `$`**, **Zero-Carbon `CFE%`**, or **Ultra-Low Latency**).
  - Evaluates all **40 Google Cloud regions** against hardware SKU availability (`NVIDIA L4 GPU` / `A3 H100`) + regional pricing multipliers + Carbon-Free Energy % to select the mathematically optimal region, generate a complete **Itemized Monthly Bill of Materials (`$/mo`)**, output a ready-to-run **`gcloud` / Infrastructure-as-Code script**, or **1-Click Live Deploy** directly into your active GCP project (`POST /api/project/:id/cloudrun`).

---

## ☸️ Wave 7–9 — Dedicated GKE Studio, Cloud SQL & AlloyDB, Cloud Build CI/CD & Cloud Run 2026 Evolution

### 18. ☸️ Dedicated GKE Kubernetes Studio (`GkeFleetStudio.jsx` + `ResourceProvisionModal.jsx`)
- **Where to find it**: Top navigation tab **`GKE Studio ☸️`** and inside the **`+ Provision Resource` (`GKE Cluster ☸️`)** modal.
- **How it Works**:
  - **1-Click GKE Autopilot & Standard Spot GPU Provisioner (`container.googleapis.com/v1`)**: Supports strict regulatory compliance locks (`🔒`) across **SEC / FedRAMP**, **GDPR EU Sovereign**, **HIPAA BAA**, and **AI Spot GPU Factory** blueprints (auto-locking Workload Identity OIDC, Private Nodes, Shielded Nodes, and Binary Authorization).
  - **📦 K8s Workload YAML Composer & Live Deployer**: Synthesizes production Kubernetes `Deployment` + `Service` + `HorizontalPodAutoscaler` manifests and deploys workloads via `kubectl apply` or direct GitHub Cloud Build integration.

### 19. 🐘 Dedicated Cloud SQL (MySQL 8.4 & PostgreSQL 16/17) & Google Cloud AlloyDB Studio (`CloudSqlAlloyStudio.jsx` + `ResourceProvisionModal.jsx`)
- **Where to find it**: Top navigation tab **`Cloud SQL & AlloyDB 🐘`** and inside the **`+ Provision Resource` (`Cloud SQL / AlloyDB 🐘`)** modal.
- **How it Works**:
  - **Engine Family & Architecture Fork**: Choose **MySQL (`8.4 LTS` / `8.0`)** or **PostgreSQL (`16` / `17` / `15`)**. When PostgreSQL is selected, fork between **Classic / Enterprise Plus Cloud SQL (`sqladmin.googleapis.com/v1`)** and **Google Cloud AlloyDB (`alloydb.googleapis.com/v1`)**. Selecting MySQL automatically locks out AlloyDB with a `🔒` badge.
  - **⚖️ Classic Cloud SQL vs. AlloyDB TCO Comparator**: Simulates vCPUs, Storage GB, Read Replicas, Vector RAG, and HTAP workloads across failover SLA (`<60s` vs `<2s` vs `<1s`) and Cost per 1,000 TPS.
  - **🧠 AI Vector (`alloydb_scann` / `pgvector` / `MySQL 8.4 VECTOR`) & Slow-Query Index Surgeon + Zero-Password IAM Auth Proxy v2 Vault**.

### 20. 🏗️ Cloud Build & GitHub Source-to-Container CI/CD Studio (`CloudBuildStudio.jsx`)
- **Where to find it**: Top navigation tab **`Cloud Build 🏗️`** and inline inside both **Cloud Run** and **GKE** provisioning flows.
- **How it Works**:
  - **🐙 3-Way Container Source Selector**: Pick from **Project Artifact Registry Images**, **Public Docker/GCR URIs**, or **Build from GitHub Repository**.
  - **🛠️ Zero-Dockerfile Cloud Buildpacks & Dockerfile Engine (`POST /api/project/:id/cloudbuild/github-build`)**: Clones any GitHub repository URL + branch, auto-creates the target Artifact Registry repository if missing, builds & pushes the container image on Google Cloud Build, and optionally deploys the built image straight to **Cloud Run** or **GKE**.

### 21. 🚀 Cloud Run 2026 Direct VPC Egress, Beta Storage Volume Mounts & 1-Click GKE Kubernetes Transpiler (`CloudRunFleetManager.jsx` + `ResourceProvisionModal.jsx`)
- **Where to find it**: Top navigation tab **`Cloud Run ★`** (`Scale & Tune` drawer + `☸️ To GKE K8s` drawer) and inside the **`+ Provision Resource` (`Cloud Run`)** modal (`1220px` wide studio).
- **How it Works**:
  - **🌐 2026 Direct VPC Egress (`template.vpcAccess`)**: Attach Cloud Run revisions directly to any VPC Network & Subnetwork with `PRIVATE_RANGES_ONLY` or `ALL_TRAFFIC` routing and custom Firewall Network Tags (`$0.00` Serverless VPC Connector tax).
  - **💾 2026 Beta Storage Volume Mounts (`template.volumes` + `container.volumeMounts`)**: Mount a live **Cloud Storage Bucket via GCS FUSE** (`Read-Write` or `Read-Only`), an **In-Memory RAM Disk (`emptyDir` up to `32Gi`)**, or a **VPC Filestore NFSv3 Share** at any container `mountPath`.
  - **☸️ 1-Click Cloud Run → GKE Kubernetes 6-Manifest Transpiler & Live Cluster Migrator (`POST /api/project/:id/cloudrun/convert-to-gke`)**: Transpiles any running Cloud Run service into a **6-Resource Production Kubernetes Bundle** (`Namespace`, Workload Identity `ServiceAccount`, Spot VM/GPU `Deployment` with `/dev/shm` RAM disk, `Service`, `HorizontalPodAutoscaler v2`, `PodDisruptionBudget`, and Zero-Trust L3/L4 `NetworkPolicy`) and applies it directly to your live GKE cluster in 1 click.

### 22. 📦 Artifact Registry SLSA-3 Supply-Chain & 1-Click Orphan Digest Sweeper (`Wave9EnterpriseStudio.jsx`)
- **Where to find it**: Top navigation tab **`Artifact Registry & SBOM 📦`**.
- **How it Works**:
  - Enforces `dockerConfig.immutableTags = true` across compliance blueprints, deletes individual container digests/tags in 1 click (`POST /api/project/:id/wave9/supply-chain/delete-image`), or batch-sweeps all untagged orphan layers (`POST /api/project/:id/wave9/supply-chain/sweep-orphans`) to reclaim wasted monthly Artifact Registry storage spend.

### 23. ⚡ Cloud Functions (`1st Gen v1` & `2nd Gen v2`) + Demystified Eventarc Visual Trigger Studio (`CloudFunctionsEventarcStudio.jsx`)
- **Where to find it**: Top navigation tab **`Functions & Eventarc ⚡`**.
- **The Problem**: When Google Cloud introduced 2nd Gen Cloud Functions (`v2` powered by Eventarc & Cloud Run), newcomers stayed stuck on `v1` because Eventarc required 3 hidden service-agent IAM bindings (`roles/pubsub.publisher` on the GCS Service Agent, `roles/eventarc.eventReceiver`, and `roles/run.invoker`), replaced simple dropdowns with raw CloudEvents filter strings, and mixed free native Pub/Sub triggers with paid Cloud Audit Log (`DATA_WRITE`) triggers.
- **How it Works**:
  - **🎯 Plain-English Eventarc Trigger Wizard**: Pick *"When a file is uploaded/deleted in Cloud Storage"*, *"When a Pub/Sub message arrives"*, *"When a BigQuery job finishes"*, *"On a Cron Schedule"*, or *"Direct HTTPS Webhook"*—automatically synthesizing the exact Eventarc flags and CloudEvents v1.0 starter code in **Node.js 22**, **Python 3.12**, and **Go 1.23**.
  - **🔬 4-Stage Visual Eventarc Pipeline X-Ray & Live CloudEvent Tester**: Maps `1. Producer` ➔ `2. Transport & Billing ($0 Direct Pub/Sub vs Cloud Audit Logs)` ➔ `3. Eventarc Filter & IAM` ➔ `4. Function Runtime`, and lets you fire a synthetic `CloudEvents v1.0` envelope (`POST /api/project/:id/functions/test-event`) to inspect per-hop latency.
  - **🩺 1-Tap Eventarc IAM Auto-Doctor (`POST /api/project/:id/functions/iam-doctor`) & `v1 → v2` Upgrader**: Automatically resolves your `projectNumber` and grants the 4 required service-agent IAM bindings in 1 click, and upgrades legacy `v1` functions (`1 req/instance` limit) to `v2` (`up to 1,000 req/instance`, saving up to **78%** on monthly compute).


