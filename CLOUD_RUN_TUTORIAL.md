# Deploy CloudPulse 2026 to Google Cloud Run

Welcome to the interactive **Google Cloud Shell** deployment wizard for **CloudPulse 2026 — Google Cloud Mobile & Desktop PWA Cockpit**!

---

## Step 1: Select Your Google Cloud Project

Select or create the Google Cloud project where you want to deploy CloudPulse 2026:

<walkthrough-project-setup billing="true"></walkthrough-project-setup>

Set your active project in the Cloud Shell terminal:

```bash
gcloud config set project <walkthrough-project-id/>
```

---

## Step 2: Deploy to Google Cloud Run (1 Command)

Run our automated quota-safe deployment script (includes staggered API quota sleeps, Gen2 execution environment with Startup CPU Boost, and optional custom least-privilege Service Account provisioning):

### Option A: Standard Deployment with Least-Privilege Service Account & Quota Cooldown
```bash
./deploy-cloud-run.sh \
  --project <walkthrough-project-id/> \
  --region us-central1 \
  --service-account cloudpulse-run-sa \
  --sleep 10
```

### Option B: Private Zero-Trust IAM / IAP Protected Deployment
```bash
./deploy-cloud-run.sh \
  --project <walkthrough-project-id/> \
  --region us-central1 \
  --service-account cloudpulse-run-sa \
  --sleep 10 \
  --private
```

---

## Step 3: Explore the 2026 Studios & MCP Control Plane

Once your CloudPulse 2026 cockpit opens, try these key workflows:

1. **Dedicated `MCP Servers ★` Main Menu Tab (`48 Official *.googleapis.com/mcp` Endpoints & `505` Live Tools)**:
   - Click **`MCP Servers ★`** in the primary navigation bar (or press **`⌘K` / `Ctrl+K`** -> *"MCP Servers Hub"*).
   - Click **`Probe All 48 Official MCP Servers Live`** to run authenticated JSON-RPC 2.0 `tools/list` discovery across all 48 Google Cloud Remote MCP endpoints.
   - Select any `GA` or `PREVIEW` server (e.g., `Google Cloud CLI (gcloud) MCP`, `BigQuery Remote MCP`, or `Cloud Storage Remote MCP`) to inspect formatted tool safety callouts, `#1`–`#10` execution rules, and `REQUIRED`/`OPTIONAL` schema parameters, execute live `tools/call` operations, or run a grounded **Gemini 2.5 Flash Live MCP Review**.
2. **`FinOps & Credits` Tab (`Active-Only CSV Bonus Credit Guardian & 6-Service Harvester`)**:
   - Open **`FinOps & Credits`** to auto-import your 9-column Google Cloud Billing Credits CSV (`~/Downloads` / `~/Desktop`). Historical `Status = Expired` rows are strictly excluded from active `Bonus: $...` totals while remaining visible in the ledger, and the 6-service Harvester shows how much Spot VM, L4 GPU, GKE, Cloud Run, Cloud SQL, or BigQuery capacity your active expiring bonus buys.
3. **`2026 Innovation` -> `01 · Wave 11: Moonshot Studio`**:
   - Manage **Cloud Deploy 3-Stage Canary Pipelines**, **Firestore Native CRUD**, **Active Assist Recommender**, the **Multi-Project Estate Comparison Matrix**, and the **18-Studio Live Stress Audit**.

---

## Step 4: Launch Your Instance!

<walkthrough-conclusion-trophy></walkthrough-conclusion-trophy>

Your **CloudPulse 2026** instance is now live on Google Cloud Run! Click the **`Service URL`** printed in your terminal above to launch the cockpit.
