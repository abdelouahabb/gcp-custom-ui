# CloudPulse 2026 — Google Cloud Mobile & Desktop PWA Cockpit

**CloudPulse 2026** is a high-speed, mobile-first Progressive Web App (PWA) and desktop command center for managing live **Google Cloud Platform (GCP)** infrastructure directly via official Google Cloud REST APIs (`run.googleapis.com/v2`, `compute.googleapis.com/v1`, `storage.googleapis.com`, `bigquery.googleapis.com`, `serviceusage.googleapis.com`, `cloudbilling.googleapis.com`, and `aiplatform.googleapis.com`).

---

## ✨ Key 2026 Capabilities

- **★ Cloud Run Serverless Studio (`run.googleapis.com/v2`)**
  - **2026 Serverless GPU Accelerators**: Attach `1x NVIDIA L4 (24GB VRAM)` or `1x NVIDIA RTX PRO 6000 Blackwell (96GB VRAM)` with configurable **GPU Zonal Redundancy** (`--no-gpu-zonal-redundancy` vs `--gpu-zonal-redundancy`) and automatic hardware minimum enforcement (`≥4 vCPU`, `≥16Gi RAM`, `GEN2`).
  - **2026 Billing Modes**: Switch between **Request-based Billing** (`cpuIdle: true` / `--billing=request`, $0 when idle) and **Instance-based Billing** (`cpuIdle: false` / `--billing=instance`, CPU/GPU allocated for the entire instance lifetime).
  - **Live Revision Tuner & Canary Traffic Splitting**: Scale Min/Max instances (`0` to `200`), Concurrency, CPU/Memory, Environment Variables, Public (`allUsers`) vs Private IAM authentication, and 1-tap revision rollback.

- **🖥️ Compute Engine Multi-Region Studio & Web SSH (`compute.googleapis.com/v1`)**
  - **13 Global Regions & Dynamic Availability Zones**: Americas, Europe, Asia-Pacific, and MENA.
  - **5 Machine Series**: `E2` (Cost-Optimized/Free Tier), `N2/N2D`, `C3/C4` (Gen-4/5 Sapphire/Emerald Rapids), `T2A Arm64` (Ampere Altra), and `G2/A2` GPU VMs.
  - **Advanced VM Configuration**: Spot VM (`up to 91% off`) vs Standard VM, `pd-balanced` / `pd-ssd` / `hyperdisk-balanced` boot disks, dedicated NVIDIA GPUs (`T4`, `L4`, `V100`, `A100`), Shielded VM (`Secure Boot` + `vTPM`), Deletion Protection toggle, Startup Scripts (`metadata.startup-script`), Live Machine Type Resizing (`setMachineType`), Suspend/Resume, and interactive **Web SSH + Serial Port 1 Console**.

- **🚨 DEFCON-1 Emergency Project Billing Kill-Switch & API Circuit Breaker**
  - **Project Billing Circuit Breaker (`cloudbilling.googleapis.com/v1`)**: 2-step emergency button to detach the active Cloud Billing Account from a compromised project (`billingAccountName: ""`) to immediately halt all billable spend, plus 1-tap re-linking.
  - **Emergency Mobile API Kill-Switch (`serviceusage.googleapis.com/v1`)**: Inspect all enabled APIs on your project with priority sorting and disable/enable services in 1 tap (`disableDependentServices: true`).

- **🌐 VPC Networks & Firewall Manager**
  - Inspect and provision custom/auto-mode VPC Networks (`REGIONAL` / `GLOBAL` BGP routing, Jumbo Frames MTU `8896`) and Ingress/Egress Firewall Rules.

- **🔐 Zero-Hardcoded-Credentials Multi-Account Onboarding Gate**
  - Sign in from mobile or desktop using:
    1. **Gmail / Google Sign-In (PKCE Auth Code Flow)**
    2. **Local `gcloud` CLI / Application Default Credentials (ADC) Discovery**
    3. **OAuth 2.0 Access Token (`ya29...`)**
    4. **`application_default_credentials.json` Paste**

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Start the backend GCP REST proxy (Port 4000)
node server/index.js

# 3. Start the Vite PWA frontend (Port 5173)
npx vite --port 5173 --host 0.0.0.0
```

Open **`http://localhost:5173`** in your browser or on your mobile device.

---

## ☁️ Deploy to Google Cloud Run

```bash
gcloud run deploy cloudpulse-2026 \
  --source . \
  --region=us-east1 \
  --allow-unauthenticated
```

---

## 🔒 Security & Credential Hygiene

- **No credentials or personal tokens are stored in this repository.**
- All authentication happens dynamically at runtime via the browser session (`x-gcp-access-token`), Cloud Run service account metadata server, or your local `~/.config/gcloud` environment.
