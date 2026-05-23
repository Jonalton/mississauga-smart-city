#!/bin/bash
# One-time GCP project setup — run once per environment.
# Usage: PROJECT_ID=your-project-id bash infra/setup.sh

set -euo pipefail

: "${PROJECT_ID:?PROJECT_ID must be set}"
REGION="northamerica-northeast1"
BUCKET="mississauga-smart-city-data"
REPO="smart-city"
SA_NAME="smart-city-sa"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "Setting up project: $PROJECT_ID"

# --- GCS bucket ---
gsutil mb -p "$PROJECT_ID" -l "$REGION" "gs://${BUCKET}" || echo "Bucket already exists"
gsutil iam ch allUsers:objectViewer "gs://${BUCKET}"

# --- Required APIs ---
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  cloudscheduler.googleapis.com \
  artifactregistry.googleapis.com \
  --project="$PROJECT_ID"

# --- Artifact Registry ---
gcloud artifacts repositories create "$REPO" \
  --repository-format=docker \
  --location="$REGION" \
  --project="$PROJECT_ID" || echo "Repo already exists"

# --- Service account ---
gcloud iam service-accounts create "$SA_NAME" \
  --project="$PROJECT_ID" || echo "SA already exists"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/storage.objectAdmin"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.invoker"

echo "Setup complete."
echo "SA email: $SA_EMAIL"
