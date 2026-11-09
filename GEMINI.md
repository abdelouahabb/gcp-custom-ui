# CloudPulse 2026 (`gcp-ui`) — Antigravity (`agy`) & Agent Context Handoff

## 1. Project Overview & Architecture
- **Repository Root**: `/home/abdelouahab/gcp-ui` (`cloudpulse-2026-gcp-pwa`, v3.0.0)
- **Git Remote**: `git@github.com:abdelouahabb/gcp-custom-ui.git` (`main` branch)
- **Stack**:
  - **Frontend**: React 19 + Vite 6 + Tailwind CSS + Lucide React + ECharts + Xterm.js (`http://localhost:5173`)
  - **Backend**: Express + WebSocket (`ws`) + `ssh2` SFTP/SSH bridge + Google Cloud REST APIs (`http://127.0.0.1:4000`, [`server/index.js`](file:///home/abdelouahab/gcp-ui/server/index.js))
  - **Start Dev Server**: `npm run dev` (Vite auto-heals and launches `server/index.js` on port `4000`).

---

## 2. Non-Negotiable Engineering Rules
1. **Zero Simulation / Zero Mock Data**: Every action, scan, backup, sweep, deletion, and log stream must execute real Google Cloud REST API calls or real SSH/SFTP commands against live infrastructure.
2. **Dynamic Multi-Project Discovery Only**: Never hardcode any GCP project ID anywhere in frontend or backend code.
3. **Zero Emojis in UI**: Strictly use `lucide-react` SVG icons across all JSX components.
4. **Button Color Discipline**: Solid blue fill (`bg-blue-600 text-white`) is strictly reserved for enabled/active states.
5. **Mandatory Destructive Action Gatekeeper**: All destructive HTTP `DELETE` or `POST` operations must be registered in `classifyDestructiveAxiosConfig` inside [`src/App.jsx`](file:///home/abdelouahab/gcp-ui/src/App.jsx#L520-L625) so the global confirmation modal intercepts them before execution.

---

## 3. Recently Completed Milestones (Latest Session Progress)

### A. SFTP-to-GCS Same-Region (`$0.00/GB` Egress) Backup Streamer (Committed in `d3ea807`)
- **Files**: [`src/components/VmFleetAndSsh.jsx`](file:///home/abdelouahab/gcp-ui/src/components/VmFleetAndSsh.jsx), [`server/index.js`](file:///home/abdelouahab/gcp-ui/server/index.js)
- **Capabilities**:
  - Selection-aware source path sync from the SFTP file/folder browser (keeps exact file or directory name on target `gs://` object).
  - Automatic same-region bucket matching (e.g., VM in `us-central1-a` $\to$ bucket in `US-CENTRAL1` for `$0.00/GB` intra-region transfer).
  - 2-step `gs://` URI collision pre-flight check (`POST /api/project/:id/vms/:name/sftp/backup-to-gcs/preflight`) + confirmation modal before streaming (`POST /api/project/:id/vms/:name/sftp/backup-to-gcs`).
  - 1-click **`Browse in GCS →`** deep-link directly into the Cloud Storage Object Workbench.

### B. Cloud Storage Fleet & Object Intelligence Studio — Sweep (Keep Bucket) & Selective Batch Deletion
- **Files**:
  - [`server/index.js`](file:///home/abdelouahab/gcp-ui/server/index.js#L28085-L28342)
  - [`src/components/CloudStorageStudio.jsx`](file:///home/abdelouahab/gcp-ui/src/components/CloudStorageStudio.jsx#L469-L550) & [`lines 1418–1710`](file:///home/abdelouahab/gcp-ui/src/components/CloudStorageStudio.jsx#L1418-L1710)
  - [`src/components/GcsObjectWorkbench.jsx`](file:///home/abdelouahab/gcp-ui/src/components/GcsObjectWorkbench.jsx#L1344-L1456) & [`lines 2624–2810`](file:///home/abdelouahab/gcp-ui/src/components/GcsObjectWorkbench.jsx#L2624-L2810)
  - [`src/App.jsx`](file:///home/abdelouahab/gcp-ui/src/App.jsx#L550-L615)
- **Capabilities**:
  - **Bucket Governance Tab (`CloudStorageStudio.jsx`)**:
    - Per-bucket **`Sweep Bucket`** button (`POST /api/project/:id/storage/buckets/:bucketName/sweep`) that purges all objects and generations while **keeping the bucket itself intact** (preserving IAM, CORS, Lifecycle, and Cloud Run Gen2 FUSE mounts), alongside **`Empty & Delete`**.
    - **Multi-Bucket Fleet Selection Checkboxes & Batch Bar**: Select multiple buckets by choice and run **`Sweep Selected Buckets (Keep Buckets) (N)`** or **`Empty & Delete Selected (N)`** (`POST /api/project/:id/storage/buckets/batch-action`).
  - **Object Workbench Tab (`GcsObjectWorkbench.jsx`)**:
    - **`Delete Selected (N)`** button right next to `Bundle .tar (N)` (`POST /api/project/:id/storage/buckets/:bucketName/objects/batch-delete`) to batch-delete checked objects and folders by choice.
    - **`Sweep Bucket (N)` / `Sweep Folder`** button in the Object Explorer selection bar.
    - Virtual folder rows (`folder/`) now include a **checkbox** (selects all objects inside the folder) and a per-folder **`Delete Folder` (`Trash2`)** button.

### C. 4-Pillar 100X DevOps & SRE Logging Command Hub (`Chrono-Log Time-Machine & SRE Triage`)
- **Files**:
  - [`server/index.js`](file:///home/abdelouahab/gcp-ui/server/index.js#L21000-L22100)
  - [`src/components/LogStreamerAndShell.jsx`](file:///home/abdelouahab/gcp-ui/src/components/LogStreamerAndShell.jsx#L2050-L3180)
  - [`src/App.jsx`](file:///home/abdelouahab/gcp-ui/src/App.jsx#L8211-L8223)
- **Capabilities**:
  1. **Pillar 1 — Multi-Project Error Radar & 16-Preset DevOps/SRE Filter Library**: Live scan across all discovered GCP projects + 1-click LQL presets (Cloud Run 5xx/Cold Starts, GCE Serial Console/OOM/SSHD, Cloud Audit IAM/Delete, VPC Firewall Drops, GKE CrashLoopBackOff, Cloud SQL Deadlocks).
  2. **Pillar 2 — Live VM OS `journalctl` / `dmesg` / Container & Unit Inspector**: Direct SSH execution (`POST /api/project/:id/chrono-logs/vm-live-journal`) streaming real `journalctl`, `dmesg -T`, `/var/log/syslog`, `sshd`, `docker/containerd`, failed `systemd` units, and top CPU/RAM processes from running GCE VMs.
  3. **Pillar 3 — Same-Region (`$0.00/GB`) Log-to-GCS JSONL Archive & Log Sink / Bucket Retention Studio**:
     - 2-step collision preflight (`POST /api/project/:id/chrono-logs/export-to-gcs/preflight`) + confirmation modal (`POST /api/project/:id/chrono-logs/export-to-gcs`) to archive filtered log entries into `gs://<bucket>/logs-archive/...jsonl` with a 1-click **`Browse in GCS →`** deep-link (`onOpenStorageBucket`).
     - Live Cloud Logging Sinks (`logging.googleapis.com/v2/projects/:id/sinks`) & Log Buckets (`_Default`, `_Required`) retention editor (`POST /api/project/:id/chrono-logs/sinks-buckets/action`).
  4. **Pillar 4 — 1-Tap Log-to-Metric & Cloud Monitoring Alert Policy Synthesizer**: Creates real Cloud Logging log-based metrics and Cloud Monitoring alert policies (`POST /api/project/:id/chrono-logs/alert-policies/action`) directly from any log query.
  5. **Pillar 5 — Cloud Logging FinOps & `_Default` Sink Exclusion Filter Studio (`@skill:cloud-logging-finops`)**: Audits Cloud Logging buckets, `_Default` sink exclusions, and stream volume shares (`POST /api/project/:id/chrono-logs/finops-audit`) and applies 1-click `_Default` sink noise-exclusion filters (`POST /api/project/:id/chrono-logs/finops-exclusion`).

### D. GDE Mode (`Alt+G`) 7-Shield Live Demo & Screen-Share Privacy Engine
- **Files**:
  - [`src/components/GdeStreamerPrivacyShield.jsx`](file:///home/abdelouahab/gcp-ui/src/components/GdeStreamerPrivacyShield.jsx)
  - [`src/components/XtermWebSshTerminal.jsx`](file:///home/abdelouahab/gcp-ui/src/components/XtermWebSshTerminal.jsx)
  - [`src/components/InnovationHoverExplainer.jsx`](file:///home/abdelouahab/gcp-ui/src/components/InnovationHoverExplainer.jsx)
- **Capabilities**:
  - **Derived SSH / OS-Login Username & `/home/<user>` Redaction**: Automatically derives local and OS-Login POSIX usernames from `accountEmail` and masks `/home/<user>`, `/Users/<user>`, `user@host`, and `su - <user>` across SFTP Browser, Disk Hotspot Analyzer, and `journalctl`.
  - **Zero-Flash Synchronous `MutationObserver` + `<svg>` + `title`/`placeholder` + Unfocused `<input>` Masking**: Redacts DOM mutations synchronously before browser paint (`0ms` flash), masks `<svg>` `<text>`/`<tspan>` in Mermaid/ECharts, redacts native `title`/`placeholder` attributes, and visually masks unfocused text `<input>`/`.value` properties while preserving 100% of React state and live GCP API calls.
  - **Live Xterm.js Web-SSH PTY Stream Redaction & 7th Secret Shield**: Redacts live WebSocket `term.write(...)` terminal streams in real time and masks `ya29.•••` OAuth tokens, `AIza•••` API keys, `Bearer eyJ•••` JWTs, and `SHA256:•••` SSH fingerprints.

### E. Global Network World Map — Live GCE VM SSH & `/var/log/auth.log` Geo-Telemetry + 4-Scenario Mode Overlays
- **Files**:
  - [`server/index.js`](file:///home/abdelouahab/gcp-ui/server/index.js#L80888-L82740)
  - [`src/components/GlobalNetworkWorldMap.jsx`](file:///home/abdelouahab/gcp-ui/src/components/GlobalNetworkWorldMap.jsx)
- **Capabilities**:
  - **Inside-VM SSH & Serial Console Log Collector (`collectLiveVmSshTelemetryForMap`)**: Connects to running GCE VMs via SSH (with Serial Port 1 fallback) to parse live `/var/log/auth.log` (`sshd` accepted & blocked `[preauth]` events), `ss -tnH state established` active SSH sessions, and `who`, geo-locating every remote IP with `resolveRemoteIpGeo`.
  - **Always-Visible Live GCE SSH Tunnel Beam & Telemetry Strip**: Draws a live emerald `LIVE GCE SSH:22` arc from `YOU` to the running VM region plus geo-located red `SSH:<COUNTRY>` probe origin nodes on the SVG map, paired with a 1-click **Live GCE VM SSH & `/var/log/auth.log` Telemetry Strip** below the map.
  - **4 Distinct Scenario Mode Overlays + Lens & Layer Synchronization**:
    - `LIVE_MIX`: Balanced 3-way stream (live GCE SSH + Cloud Logs, 10-region TLS 1.3 sockets, and `FIBER ⇄` subsea backbone packets incrementing `FIBER: N`).
    - `SSH_BRUTEFORCE`: Standing red perimeter attack vectors from `/var/log/auth.log` probe countries into the VM region + live `:22/:3389` socket audit.
    - `IAP_ZERO_TRUST`: 2-Hop `IAP EDGE · 35.235.240.0/20` SVG overlay (`YOU ➔ IAP Edge ➔ VM Region :22`) comparing `IAP:22 ALLOW` vs `0.0.0.0/0:22`.
    - `GLOBAL_LOAD_TEST`: Simultaneous 10-region GFE Anycast `:443 · <RTT>ms` fan-out constellation across all continents.
    - `Lens` (`Traffic`, `CFE %`, `Spot $`) and `Layers` (`Fiber`, `Zones`, `IAP Tunnel`, `RTT Laser`) immediately update all visible region pills and zone rings even at `1.0x` zoom.

### F. Managed Service for Apache Spark & Dataproc Serverless Studio (`MANAGED_SPARK_STUDIO`)
- **Files**:
  - [`src/components/ManagedSparkStudio.jsx`](file:///home/abdelouahab/gcp-ui/src/components/ManagedSparkStudio.jsx)
  - [`server/index.js`](file:///home/abdelouahab/gcp-ui/server/index.js#L40145-L43070)
  - [`src/App.jsx`](file:///home/abdelouahab/gcp-ui/src/App.jsx#L7701-L7725)
  - [`src/components/BigQueryStudio.jsx`](file:///home/abdelouahab/gcp-ui/src/components/BigQueryStudio.jsx), [`src/components/GcsObjectWorkbench.jsx`](file:///home/abdelouahab/gcp-ui/src/components/GcsObjectWorkbench.jsx), [`src/components/DataEngineeringStudio.jsx`](file:///home/abdelouahab/gcp-ui/src/components/DataEngineeringStudio.jsx)
- **Capabilities**:
  - **Live Multi-Region Fleet Discovery (`GET /api/project/:id/managed-spark/overview`)**: Discovers Dataproc Serverless Batches (`locations/:region/batches`), Interactive Spark Connect Sessions (`locations/:region/sessions`), Session Templates (`locations/:region/sessionTemplates`), GCE Clusters (`regions/:region/clusters`), `dataproc.googleapis.com` / `biglake.googleapis.com` API status, and 7-Role Spark IAM readiness.
  - **4-Stage Physical Execution Plan DAG & 6-Gate Live Python 3 AST X-Ray (`PREFLIGHT_SPARK_BATCH_XRAY`) + 4-Profile Executor, Heap & C++ Lightning Engine Cockpit (`SPARK_HARDWARE_PROFILES`)**: Runs a real `python3` `ast` + `py_compile` subprocess on the edited PySpark script to synthesize a 4-Stage Physical Execution Plan (`Stage 0 Scan` $\to$ `Stage 1 Broadcast/Shuffle Exchange` $\to$ `Stage 2 WholeStageCodegen / C++ Vectorized` $\to$ `Stage 3 ACID Sink Commit`), audits 6 live GCP infrastructure gates (including Same-Region `$0.00/GB` GCS Data-Gravity alignment and BigQuery target dataset/table readiness), and offers 4 interactive hardware profiles (`MICRO_ETL`, `PROD_LAKEHOUSE`, `HEAVY_SHUFFLE`, and `LIGHTNING_TURBO` `spark.dataproc.engine=lightningEngine`).
  - **1-Click `$0.00` Compute GCS Dry-Stager (`STAGE_SCRIPT_TO_GCS_ONLY`) + 1-Click BigQuery Dataset & Source Table Seeder (`BOOTSTRAP_SPARK_DEMO_ASSETS`) + Serverless Spark 3.5 Submission (`SUBMIT_SERVERLESS_BATCH`)**: Stages `.py` scripts to `gs://<bucket>/spark-jobs/<batchId>.py` at `$0.00` compute cost with a cryptographic `SHA-256` receipt and 1-click **`Browse Staged .py in GCS Workbench →`**, bootstraps the target BigQuery dataset and seeds 3 live source tables (`telemetry_events`, `dim_regions`, `account_risk_tiers`), submits Runtime `2.2` (Spark 3.5) batches with Adaptive Query Execution (`spark.sql.adaptive.enabled=true`), and calculates 24/7 GCE Dataproc cluster burn vs `$0.00/hr` Serverless idle cost with 1-click idle cluster teardown (`DELETE_DATAPROC_CLUSTER`).
  - **Live BigQuery Table & GCS Prefix Schema Introspector (`INTROSPECT_SPARK_DATA_ASSETS`) + Real `python3 -m py_compile` Verifier (`VALIDATE_PYSPARK_SYNTAX`)**: Queries live BigQuery `tables.get` column schemas, row counts, and `<= 100 MB` `BroadcastHashJoin` (`F.broadcast()`) eligibility plus GCS object prefix formats, and synthesizes schema-verified PySpark 3.5 scripts.
  - **3-Pillar SparkApplications RCA (`INSPECT_BATCH_DIAGNOSTICS`), Interactive Property Auto-Tuner & Bounded 128 KB GCS Driver Log Regex Search (`SEARCH_GCS_DRIVER_LOG`)**: Queries `sparkApplications` (`:search`, `:searchStages`, `:searchExecutorSummary`, `:searchSqlQueries`, `:searchJobs`), synthesizes tuned Spark properties (`skewJoin.enabled`, `scaling.version=2`, `8g` heap) with 1-click re-submission, and performs bounded 128 KB `Range` regex searches over `<outputUri>.000000000`.
  - **Bi-Directional Cross-Studio Wiring**: Deep-linked with **BigQuery Studio** (per-table `PySpark 3.5 →` & `Query in BigQuery →`), **Cloud Storage Object Workbench** (`Managed Spark 3.5 →` & `Browse in GCS →`), **Data Engineering Studio** (`Open Full Managed Spark Studio →`), **BigLake Iceberg Studio**, **Chrono-Log SRE Triage Hub** (`Logs →`), and **`StudioGcpAdvantageBar` (`SPARK` domain)**.
  - **5th Pillar — Spark Lightning Engine + BigFrames v2.0 + Data Lineage Blast-Radius (`ANALYZE_SPARK_KNOWLEDGE_CATALOG_AND_LINEAGE`)**: Queries `datalineage.googleapis.com/v1` (`:searchLinks` downstream blast radius & upstream provenance) + Dataplex Knowledge Catalog `aspectTypes`, and synthesizes **Managed Spark Lightning Engine (`spark.dataproc.engine=lightningEngine`)** batches and **BigQuery DataFrames (`bigframes.pandas` v2.0 + `bigframes.bigquery.ml`)** pipelines. Also added the **Cloud Storage FUSE (`gcsfuse` v2) & ML Checkpointing Architect** (`POST /api/project/:id/storage/buckets/:bucketName/gcsfuse-architect`) in `CloudStorageStudio.jsx`.

### G. Google Cloud SDK `592.0.0` (`2026-11-03` · `2026.10.30`) Frontier Lab & Wave 5 GA Upgrades
- **Files**:
  - [`src/components/GcloudAlphaBetaStudio.jsx`](file:///home/abdelouahab/gcp-ui/src/components/GcloudAlphaBetaStudio.jsx)
  - [`src/components/StudioGcpAdvantageBar.jsx`](file:///home/abdelouahab/gcp-ui/src/components/StudioGcpAdvantageBar.jsx)
  - [`src/components/CloudSqlAndAlloyDbStudio.jsx`](file:///home/abdelouahab/gcp-ui/src/components/CloudSqlAndAlloyDbStudio.jsx)
  - [`src/components/ManagedSparkStudio.jsx`](file:///home/abdelouahab/gcp-ui/src/components/ManagedSparkStudio.jsx)
  - [`server/index.js`](file:///home/abdelouahab/gcp-ui/server/index.js#L56749-L60480)
- **Capabilities**:
  - **Wave 5 `SCAN_WAVE5_GCLOUD_592_UPGRADES` 8-Pillar Live Probe & 13-Suite Audit**: Probes and synthesizes AlloyDB Autoscaler (`--enable-autoscaler`, `--autoscaler-target-connections-count`, cron schedules), Cloud SQL PSC DNS reconciliation (`gcloud sql instances reconcile-networking`), GKE Ambient Service Mesh (`--enable-ambient-networking`) & Dataplane V2 Migration (`--enable-dataplane-v2`), Backup & DR Auto-Protection (`gcloud backup-dr auto-protection-policies`), Dataproc DWS Scheduled Spark Clusters (`--scheduling-timeout`, `--requested-run-duration`), Cloud Run `--public`, Dataplex Data Documentation (`--custom-instructions`, `--sql-dialect`), BigLake CMEK (`--kms-key`), Agent Registry `--scanning-policy` (breaking change replacing `--scanning-state`), and Cloud KMS ECDH KEM (`kem-ecdh-p256`/`p384`).

### H. Dual-Engine Cloud Storage Secret, Credential & Regulated PII X-Ray Scanner (`LOCAL_RAM_REGEX_LUHN` vs `CLOUD_DLP_VISION_OCR`) & 100% `<button>` Hover Explainer Coverage
- **Files**:
  - [`src/components/EngineerMoonshotsWave3.jsx`](file:///home/abdelouahab/gcp-ui/src/components/EngineerMoonshotsWave3.jsx#L187-L325) & [`lines 1240–1605`](file:///home/abdelouahab/gcp-ui/src/components/EngineerMoonshotsWave3.jsx#L1240-L1605)
  - [`src/components/InnovationHoverExplainer.jsx`](file:///home/abdelouahab/gcp-ui/src/components/InnovationHoverExplainer.jsx)
  - [`server/index.js`](file:///home/abdelouahab/gcp-ui/server/index.js#L29009-L29660)
- **Capabilities**:
  - **Engine 1 (`LOCAL_RAM_REGEX_LUHN`, Default · `$0.00` API Cost · Zero OCR Binary Required)**: Streams structured text/code/config objects (`.env`, `.json`, `.yaml`, `.csv`, `.log`, `.pem`, `.sql`, `.tfstate`) up to `128 KB` via `?alt=media` into Node.js RAM and evaluates 11 credential & PII regex signatures + Luhn Mod-10 PAN checksum (`verifyLuhnChecksum`) + Shannon Entropy (`computeShannonEntropy` in `bits/char`), with 1-tap in-place UTF-8 sanitization.
  - **Engine 2 (`CLOUD_DLP_VISION_OCR`, Optional Choice · `dlp.googleapis.com/v2`)**: Combines Engine 1 with Google Cloud Sensitive Data Protection REST API (`content:inspect`, `content:deidentify`, and `image:redact`) to inspect both text AND binary images (`.png`, `.jpg`, `.webp` up to `512 KB`) using Google’s cloud-hosted Vision OCR (`byteItem`) and burn opaque black pixel bounding boxes over leaked secrets/PII inside images.
  - **100% `<button>` `GlobalInnovationHoverExplainer` Coverage (`2,700+` buttons across `66` JSX files)**: Eliminated `null` returns on icon-only/1-char buttons via `inferIconOrSingleCharButtonLabel`, decomposed multi-element card buttons via `extractButtonDomContext`, wired all 54 buttons in `ManagedSparkStudio.jsx` and all 7 buttons in the Dual-Engine DLP X-Ray Scanner with handcrafted `INNOVATION_FEATURE_GUIDE` entries (`512` total entries), and replaced all 18 generic studio-wide catch-all blocks.

### I. Secret Manager Lifecycle Studio, DLP-to-Secret-Manager (`sm://`) Vaulting & Unified Warm-Amber Architectural Design System
- **Files**:
  - [`src/components/SecretManagerVaultExplorer.jsx`](file:///home/abdelouahab/gcp-ui/src/components/SecretManagerVaultExplorer.jsx)
  - [`src/components/EngineerMoonshotsWave3.jsx`](file:///home/abdelouahab/gcp-ui/src/components/EngineerMoonshotsWave3.jsx)
  - [`src/components/SovereignTimeMachineIamStudio.jsx`](file:///home/abdelouahab/gcp-ui/src/components/SovereignTimeMachineIamStudio.jsx)
  - [`src/components/Startup10xMentorStudio.jsx`](file:///home/abdelouahab/gcp-ui/src/components/Startup10xMentorStudio.jsx)
  - [`src/components/SortableKpiRow.jsx`](file:///home/abdelouahab/gcp-ui/src/components/SortableKpiRow.jsx)
  - [`src/index.css`](file:///home/abdelouahab/gcp-ui/src/index.css), [`src/App.jsx`](file:///home/abdelouahab/gcp-ui/src/App.jsx)
- **Capabilities**:
  - **DLP-to-Secret-Manager (`VAULT_AND_MASK`) & Rehydrate (`POST /api/project/:id/storage/buckets/:bucketName/dlp-rehydrate`)**: Instead of destructively erasing plaintext credentials in Cloud Storage, vaults every discovered credential into `secretmanager.googleapis.com/v1` (`projects/<id>/secrets/cloudpulse-dlp-.../versions/latest`), replaces the file value with a `sm://projects/...` pointer, hides the vault button once vaulted, and supports 1-click file rehydration.
  - **Dedicated Secret Manager Lifecycle & Rotation Studio (`SecretManagerVaultExplorer.jsx`)**: 2-column table-grid Secret row layout (`grid-cols-[minmax(0,1fr)_auto]`) with fixed-width aligned action columns (`Peek Value`, `+ Rotate`, `sm:// URI`, `Delete`), version enable/disable (`$0.00/mo` disabled state), and permanent version destruction gated by `classifyDestructiveAxiosConfig`.
  - **Google Cloud Console Left Architectural Navigation Rail + Warm-Amber Selection Language (`src/index.css`, `src/App.jsx`)**:
    - Replaced top multi-row Studio card grids with a collapsible `232px` Left Architectural Navigation Sidebar (`<aside>`) + Workspace Breadcrumb Header.
    - Adopted the high-contrast **Warm Amber/Orange Selection Language** (`#f59e0b` border + `rgba(245, 158, 11, 0.16)` surface glow + `#fbbf24` icon/badge highlight) across all Studio tab bars, equal-width grid menus, segmented mode switchers, and the left navigation rail, while keeping standalone execution CTAs in solid blue (`bg-blue-600 text-white`).
    - Flattened passive read-only KPI boxes (`Section 1B` in `src/index.css`) into subordinate recessed telemetry strips and moved interactive menus above telemetry in `Startup10xMentorStudio.jsx`.

### J. 4-Pillar Cryptographic Ransomware Resilience & Clean-Room Rollback Studio (`X4`), Bi-Directional `Active Bucket:` Reactivity, Redesigned 3-Zone Object Workbench IDE, Cross-Studio Navigation Guard & 100% Plain-English Action Gatekeeper
- **Files**:
  - [`server/index.js`](file:///home/abdelouahab/gcp-ui/server/index.js#L29660-L30070)
  - [`src/components/EngineerMoonshotsWave3.jsx`](file:///home/abdelouahab/gcp-ui/src/components/EngineerMoonshotsWave3.jsx#L206-L246) & [`lines 680–920`](file:///home/abdelouahab/gcp-ui/src/components/EngineerMoonshotsWave3.jsx#L680-L920) & [`lines 2840–3460`](file:///home/abdelouahab/gcp-ui/src/components/EngineerMoonshotsWave3.jsx#L2840-L3460)
  - [`src/components/CloudStorageStudio.jsx`](file:///home/abdelouahab/gcp-ui/src/components/CloudStorageStudio.jsx)
  - [`src/components/GcsObjectWorkbench.jsx`](file:///home/abdelouahab/gcp-ui/src/components/GcsObjectWorkbench.jsx)
  - [`src/components/InnovationHoverExplainer.jsx`](file:///home/abdelouahab/gcp-ui/src/components/InnovationHoverExplainer.jsx)
  - [`src/components/InteractiveDocsGuide.jsx`](file:///home/abdelouahab/gcp-ui/src/components/InteractiveDocsGuide.jsx)
  - [`src/App.jsx`](file:///home/abdelouahab/gcp-ui/src/App.jsx), [`src/index.css`](file:///home/abdelouahab/gcp-ui/src/index.css)
- **Capabilities**:
  - **4-Pillar Cryptographic Ransomware Air-Gap & Live Clean-Room Recovery Drill Studio (`X4`)**:
    - `POST /api/project/:id/storage/buckets/:bucketName/ransomware-deep-audit`: 6-Gate live metadata & IAM blast-radius X-Ray (`PAP`, `Uniform IAM`, `Soft-Delete 7d–90d`, `Object Versioning`, `SEC 17a-4 WORM Retention`, and `CMEK + Over-Privileged IAM Principals`) plus live noncurrent (`?versions=true`) and soft-deleted (`?softDeleted=true`) generation inventory.
    - `POST /api/project/:id/storage/buckets/:bucketName/ransomware-drill`: Executes a non-destructive 3-step `v1 Seed -> v2 Ransomware Overwrite -> v3 Generation Rollback` clean-room proof verifying `SHA-256` and `CRC32C` bit-for-bit equality and measuring exact RTO in milliseconds, plus 1-click `ROLLBACK_SINGLE_GENERATION` (`rewriteTo?sourceGeneration`) and `RESTORE_SOFT_DELETED_OBJECT` (`/restore?generation`).
  - **Bi-Directional `Active Bucket:` Selector Reactivity**: Selecting any bucket in `Active Bucket:` immediately normalizes its region (`resolveBucketRegionId`) for live CFE % and pricing simulation, updates the 5-card Active Bucket KPI strip, sorts the active bucket to slot `#1` in the Bucket Governance grid with an `ACTIVE BUCKET` badge, and syncs live scans across **Object Workbench**, **DLP Secret & PII X-Ray (`X1`)**, and **Ransomware Auditor (`X4`)**.
  - **Redesigned 3-Zone Object Workbench IDE & Cross-Studio Navigation Confirmation Guard (`cloudpulse:request-cross-tab-nav`)**: Streamlined `GcsObjectWorkbench.jsx` with consolidated overflow menus (`Access & Hold`, `Actions & Export`, `Jump to Studio...`), responsive button toolbars, and a global confirmation guard modal before switching studios or sub-tabs.
  - **100% Plain-English Action Gatekeeper (`classifyDestructiveAxiosConfig` in `src/App.jsx`)**: Added explicit `laymanSummary`, `headerBadge`, `targetLabel`, `whatHappensNext`, `costWarning`, `impactWarning`, and `confirmLabel` to 100% of mutating API descriptors (`0` generic fallback modals) and whitelisted read-only `/ransomware-deep-audit`, `/dlp-scan`, and `/gcsfuse-architect` probes.

---

## 4. Next Steps When Resuming in `agy` CLI
1. Review or test the **4-Pillar Ransomware Resilience & Clean-Room Rollback Studio (`X4`)** ([`src/components/EngineerMoonshotsWave3.jsx`](file:///home/abdelouahab/gcp-ui/src/components/EngineerMoonshotsWave3.jsx)), **Redesigned 3-Zone Object Workbench IDE** ([`src/components/GcsObjectWorkbench.jsx`](file:///home/abdelouahab/gcp-ui/src/components/GcsObjectWorkbench.jsx)), and **Cloud Storage Governance Studio** ([`src/components/CloudStorageStudio.jsx`](file:///home/abdelouahab/gcp-ui/src/components/CloudStorageStudio.jsx)).
