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

## Step 3: Launch Your Instance!

<walkthrough-conclusion-trophy></walkthrough-conclusion-trophy>

Your **CloudPulse 2026** instance is now live on Google Cloud Run! Click the **`Service URL`** printed in your terminal above to launch the cockpit.
