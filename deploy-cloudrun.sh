#!/usr/bin/env bash
# ============================================================================
# CloudPulse 2026 — 1-Command Self-Hosted Cloud Run Gen2 Production Installer
# Usage:
#   ./deploy-cloudrun.sh [PROJECT_ID] [REGION] [SERVICE_NAME]
# ============================================================================
set -euo pipefail

PROJECT_ID="${1:-$(gcloud config get-value project 2>/dev/null || true)}"
REGION="${2:-us-central1}"
SERVICE_NAME="${3:-cloudpulse-2026-cockpit}"
REPO_NAME="cloudpulse-containers"

if [[ -z "${PROJECT_ID}" ]]; then
  echo "Error: No Google Cloud PROJECT_ID specified and no default gcloud project configured."
  echo "Usage: ./deploy-cloudrun.sh <PROJECT_ID> [REGION] [SERVICE_NAME]"
  exit 1
fi

export CLOUDSDK_METRICS_ENVIRONMENT="${CLOUDSDK_METRICS_ENVIRONMENT:+$CLOUDSDK_METRICS_ENVIRONMENT }datacloud.antigravity"

echo "=================================================================="
echo " CloudPulse 2026 — Production Cloud Run Gen2 Deployment"
echo " Target Project : ${PROJECT_ID}"
echo " Target Region  : ${REGION}"
echo " Service Name   : ${SERVICE_NAME}"
echo "=================================================================="

echo "[1/3] Ensuring required Google Cloud APIs are enabled..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  clouddeploy.googleapis.com \
  firestore.googleapis.com \
  recommender.googleapis.com \
  --project="${PROJECT_ID}"

echo "[2/3] Ensuring Artifact Registry repository '${REPO_NAME}' exists in ${REGION}..."
gcloud artifacts repositories describe "${REPO_NAME}" \
  --location="${REGION}" \
  --project="${PROJECT_ID}" >/dev/null 2>&1 || \
gcloud artifacts repositories create "${REPO_NAME}" \
  --repository-format=docker \
  --location="${REGION}" \
  --description="CloudPulse 2026 Production Container Repository" \
  --labels="managed_by=cloudpulse_2026" \
  --project="${PROJECT_ID}"

echo "[3/3] Submitting Cloud Build & deploying to Cloud Run Gen2..."
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions="_REGION=${REGION},_REPO_NAME=${REPO_NAME},_SERVICE_NAME=${SERVICE_NAME}" \
  --project="${PROJECT_ID}"

SERVICE_URL="$(gcloud run services describe "${SERVICE_NAME}" --region="${REGION}" --project="${PROJECT_ID}" --format='value(status.url)' 2>/dev/null || true)"
echo "=================================================================="
echo " Deployment Complete!"
echo " Live CloudPulse 2026 URL: ${SERVICE_URL}"
echo "=================================================================="
