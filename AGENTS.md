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

### D. GDE Mode (`Alt+G`) 7-Shield Live Demo & Screen-Share Privacy Engine
- **Files**:
  - [`src/components/GdeStreamerPrivacyShield.jsx`](file:///home/abdelouahab/gcp-ui/src/components/GdeStreamerPrivacyShield.jsx)
  - [`src/components/XtermWebSshTerminal.jsx`](file:///home/abdelouahab/gcp-ui/src/components/XtermWebSshTerminal.jsx)
  - [`src/components/InnovationHoverExplainer.jsx`](file:///home/abdelouahab/gcp-ui/src/components/InnovationHoverExplainer.jsx)
- **Capabilities**:
  - **Derived SSH / OS-Login Username & `/home/<user>` Redaction**: Automatically derives local and OS-Login POSIX usernames from `accountEmail` and masks `/home/<user>`, `/Users/<user>`, `user@host`, and `su - <user>` across SFTP Browser, Disk Hotspot Analyzer, and `journalctl`.
  - **Zero-Flash Synchronous `MutationObserver` + `<svg>` + `title`/`placeholder` + Unfocused `<input>` Masking**: Redacts DOM mutations synchronously before browser paint (`0ms` flash), masks `<svg>` `<text>`/`<tspan>` in Mermaid/ECharts, redacts native `title`/`placeholder` attributes, and visually masks unfocused text `<input>`/`.value` properties while preserving 100% of React state and live GCP API calls.
  - **Live Xterm.js Web-SSH PTY Stream Redaction & 7th Secret Shield**: Redacts live WebSocket `term.write(...)` terminal streams in real time and masks `ya29.•••` OAuth tokens, `AIza•••` API keys, `Bearer eyJ•••` JWTs, and `SHA256:•••` SSH fingerprints.

---

## 4. Next Steps When Resuming in `agy` CLI
1. Review or test the **4-Pillar DevOps & SRE Logging Command Hub** ([`src/components/LogStreamerAndShell.jsx`](file:///home/abdelouahab/gcp-ui/src/components/LogStreamerAndShell.jsx)) and **Cloud Storage Sweep & Selective Batch Deletion** ([`src/components/CloudStorageStudio.jsx`](file:///home/abdelouahab/gcp-ui/src/components/CloudStorageStudio.jsx), [`src/components/GcsObjectWorkbench.jsx`](file:///home/abdelouahab/gcp-ui/src/components/GcsObjectWorkbench.jsx)).
2. Update [`README.md`](file:///home/abdelouahab/gcp-ui/README.md) and [`docs/REVOLUTIONARY_FEATURES_GUIDE.md`](file:///home/abdelouahab/gcp-ui/docs/REVOLUTIONARY_FEATURES_GUIDE.md) when ready to commit & push the latest changes.
