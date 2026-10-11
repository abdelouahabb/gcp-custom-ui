#!/usr/bin/env bash
# ==============================================================================
# CloudPulse 2026 — Quota-Safe Google Cloud Run Deployment Script
# ==============================================================================
# Prevents Google Cloud Shell's "Error 429: Quota exceeded for quota metric
# 'List available/disabled services requests' (serviceusage.googleapis.com)" by:
#   1. Dynamically setting CLOUDSDK_BILLING_QUOTA_PROJECT to the target project.
#   2. Never calling 'gcloud services list' (which triggers the 429 quota error).
#   3. Waiting 65s (1 full GCP per-minute quota window) + continuing gracefully
#      if serviceusage.googleapis.com is rate-limited.
#   4. Supporting a custom runtime --service-account (auto-created if missing).
#
# Usage:
#   ./deploy-cloud-run.sh [OPTIONS]
#
# Options:
#   -p, --project <PROJECT_ID>          GCP Project ID (prompts interactively if unset)
#   -r, --region <REGION>               Cloud Run region (default: us-central1)
#   -s, --service <SERVICE_NAME>        Cloud Run service name (default: cloudpulse-2026)
#   -a, --service-account <SA>          Custom runtime Service Account email or short name
#                                       (e.g., cloudpulse-run-sa or custom@my-gcp-project.iam.gserviceaccount.com)
#       --build-service-account <SA>    Optional custom Cloud Build service account
#       --sleep <SECONDS>               Cooldown sleep between stages (default: 15)
#       --skip-api-enable               Skip 'gcloud services enable' completely (use when APIs
#                                       are already enabled or serviceusage quota is exhausted)
#       --private | --iap               Deploy in Private Zero-Trust IAM/IAP mode
# ==============================================================================

set -euo pipefail

SERVICE_NAME="cloudpulse-2026"
REGION="us-central1"
PROJECT_ID="$(gcloud config get-value project 2>/dev/null || true)"
SERVICE_ACCOUNT=""
BUILD_SERVICE_ACCOUNT=""
SLEEP_SECONDS=15
MAX_RETRIES=4
SKIP_API_ENABLE="false"
AUTH_FLAG="--allow-unauthenticated"
INGRESS_FLAG="all"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -p|--project)
      PROJECT_ID="$2"
      shift 2
      ;;
    -r|--region)
      REGION="$2"
      shift 2
      ;;
    -s|--service)
      SERVICE_NAME="$2"
      shift 2
      ;;
    -a|--service-account|--sa)
      SERVICE_ACCOUNT="$2"
      shift 2
      ;;
    --build-service-account|--build-sa)
      BUILD_SERVICE_ACCOUNT="$2"
      shift 2
      ;;
    --sleep|--cooldown)
      SLEEP_SECONDS="$2"
      shift 2
      ;;
    --retries)
      MAX_RETRIES="$2"
      shift 2
      ;;
    --skip-api-enable)
      SKIP_API_ENABLE="true"
      shift 1
      ;;
    --private|--iap)
      AUTH_FLAG="--no-allow-unauthenticated"
      INGRESS_FLAG="internal-and-cloud-load-balancing"
      shift 1
      ;;
    -h|--help)
      sed -n '2,28p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "❌ Unknown option: $1 (run ./deploy-cloud-run.sh --help for usage)"
      exit 1
      ;;
  esac
done

# Interactive project prompt if not provided via --project or gcloud config
if [[ -z "${PROJECT_ID}" || "${PROJECT_ID}" == "(unset)" ]]; then
  echo "🔍 Querying your Google Cloud projects..."
  gcloud projects list --format="table(projectId,name)" || true
  echo ""
  read -r -p "[ ? ] Enter your GCP Project ID (e.g., my-gcp-project): " PROJECT_ID
fi

if [[ -z "${PROJECT_ID}" ]]; then
  echo "❌ Error: No GCP Project ID specified."
  exit 1
fi

# Interactive optional custom Service Account prompt if running interactively and not passed
if [[ -z "${SERVICE_ACCOUNT}" && -t 0 ]]; then
  echo ""
  read -r -p "[ ? ] Optional custom runtime Service Account name/email (press Enter to use default, or type e.g. 'cloudpulse-run-sa'): " INPUT_SA || true
  if [[ -n "${INPUT_SA}" ]]; then
    SERVICE_ACCOUNT="${INPUT_SA}"
  fi
fi

# Bind gcloud quota & core project to the user-selected PROJECT_ID
export CLOUDSDK_CORE_PROJECT="${PROJECT_ID}"
export CLOUDSDK_BILLING_QUOTA_PROJECT="${PROJECT_ID}"
gcloud config set project "${PROJECT_ID}" >/dev/null 2>&1 || true
gcloud config set billing/quota_project "${PROJECT_ID}" >/dev/null 2>&1 || true

# Normalize short service account name to full email if needed
SERVICE_ACCOUNT_EMAIL=""
SERVICE_ACCOUNT_SHORT=""
if [[ -n "${SERVICE_ACCOUNT}" ]]; then
  if [[ "${SERVICE_ACCOUNT}" == *"@"* ]]; then
    SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT}"
    SERVICE_ACCOUNT_SHORT="${SERVICE_ACCOUNT%%@*}"
  else
    SERVICE_ACCOUNT_SHORT="${SERVICE_ACCOUNT}"
    SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com"
  fi
fi

# Helper: Quota-resilient command runner with 65s per-minute quota window backoff
run_with_quota_backoff() {
  local description="$1"
  shift
  local attempt=1
  local wait_time=65

  while true; do
    if "$@"; then
      return 0
    fi
    if [[ ${attempt} -ge ${MAX_RETRIES} ]]; then
      echo "⚠️  Reached max retries (${MAX_RETRIES}) for: ${description}"
      return 1
    fi
    echo "⏳ [GCP 60s Per-Minute Quota Window Reset] '${description}' hit rate-limit (attempt ${attempt}/${MAX_RETRIES})."
    echo "   Sleeping ${wait_time}s for Google Cloud per-minute quota counter to reset..."
    sleep "${wait_time}"
    attempt=$((attempt + 1))
  done
}

echo ""
echo "=============================================================================="
echo "🛰️  Deploying CloudPulse 2026 GCP Cockpit to Google Cloud Run"
echo "------------------------------------------------------------------------------"
echo "  • GCP Project     : ${PROJECT_ID}"
echo "  • Region          : ${REGION}"
echo "  • Service         : ${SERVICE_NAME}"
echo "  • Service Account : ${SERVICE_ACCOUNT_EMAIL:-(Default Cloud Run SA — pass --service-account to override)}"
echo "  • Stage Cooldown  : ${SLEEP_SECONDS}s sleep between stages (65s on 429 quota reset)"
echo "  • Access Mode     : ${AUTH_FLAG} (Ingress: ${INGRESS_FLAG})"
echo "=============================================================================="

# ------------------------------------------------------------------------------
# Stage 1: Staggered API Enablement (Avoids 'List available services' 429)
# ------------------------------------------------------------------------------
if [[ "${SKIP_API_ENABLE}" == "true" ]]; then
  echo "▶ [1/3] Skipping API enablement (--skip-api-enable set)."
else
  echo "▶ [1/3] Enabling Cloud Run, Cloud Build & Artifact Registry APIs..."
  if ! run_with_quota_backoff "Enable required GCP APIs" \
    gcloud services enable \
      run.googleapis.com \
      cloudbuild.googleapis.com \
      artifactregistry.googleapis.com \
      iam.googleapis.com \
      --project "${PROJECT_ID}" \
      --quiet; then
    echo "⚠️  Warning: 'gcloud services enable' returned a quota warning. Continuing to deployment in case APIs are already enabled..."
  fi
  echo "⏳ Sleeping ${SLEEP_SECONDS}s for API & quota cooldown..."
  sleep "${SLEEP_SECONDS}"
fi

# ------------------------------------------------------------------------------
# Stage 2: Custom Runtime Service Account Verification / Auto-Creation
# ------------------------------------------------------------------------------
if [[ -n "${SERVICE_ACCOUNT_EMAIL}" ]]; then
  echo "▶ [2/3] Verifying custom runtime Service Account: ${SERVICE_ACCOUNT_EMAIL}..."
  if gcloud iam service-accounts describe "${SERVICE_ACCOUNT_EMAIL}" --project "${PROJECT_ID}" >/dev/null 2>&1; then
    echo "   ✓ Existing Service Account found: ${SERVICE_ACCOUNT_EMAIL}"
  else
    echo "   ↳ Creating custom least-privilege runtime Service Account '${SERVICE_ACCOUNT_SHORT}'..."
    run_with_quota_backoff "Create Service Account ${SERVICE_ACCOUNT_SHORT}" \
      gcloud iam service-accounts create "${SERVICE_ACCOUNT_SHORT}" \
        --display-name="CloudPulse 2026 GCP Cockpit Runtime SA" \
        --description="Least-privilege Cloud Run runtime identity for CloudPulse 2026 GCP Cockpit" \
        --project "${PROJECT_ID}"

    echo "   ⏳ Sleeping ${SLEEP_SECONDS}s for IAM Service Account propagation..."
    sleep "${SLEEP_SECONDS}"
  fi
else
  echo "▶ [2/3] Using project default Cloud Run runtime Service Account."
fi

# ------------------------------------------------------------------------------
# Stage 3: Build from Dockerfile & Deploy to Cloud Run
# ------------------------------------------------------------------------------
echo "▶ [3/3] Building container & deploying '${SERVICE_NAME}' to Cloud Run (${REGION})..."

DEPLOY_ARGS=(
  run deploy "${SERVICE_NAME}"
  --source .
  --project "${PROJECT_ID}"
  --region "${REGION}"
  --platform managed
  --execution-environment gen2
  --cpu-boost
  --port 8080
  --memory 512Mi
  --cpu 1
  --min-instances 0
  --max-instances 5
  --ingress "${INGRESS_FLAG}"
  "${AUTH_FLAG}"
  --quiet
)

if [[ -n "${SERVICE_ACCOUNT_EMAIL}" ]]; then
  DEPLOY_ARGS+=(--service-account "${SERVICE_ACCOUNT_EMAIL}")
fi

if [[ -n "${BUILD_SERVICE_ACCOUNT}" ]]; then
  DEPLOY_ARGS+=(--build-service-account "${BUILD_SERVICE_ACCOUNT}")
fi

run_with_quota_backoff "Deploy ${SERVICE_NAME} to Cloud Run" gcloud "${DEPLOY_ARGS[@]}"

echo "⏳ Sleeping 3s before fetching Service URL..."
sleep 3

SERVICE_URL="$(gcloud run services describe "${SERVICE_NAME}" --project "${PROJECT_ID}" --region "${REGION}" --format='value(status.url)')"

echo ""
echo "=============================================================================="
echo "✅ DEPLOYMENT SUCCESSFUL!"
echo "🌐 Live Cloud Run URL : ${SERVICE_URL}"
if [[ -n "${SERVICE_ACCOUNT_EMAIL}" ]]; then
  echo "🔐 Runtime Identity   : ${SERVICE_ACCOUNT_EMAIL}"
fi
echo "=============================================================================="
