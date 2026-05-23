#!/bin/bash
# Creates the Cloud Scheduler job that triggers the pipeline daily at 3am Eastern.
# Usage: PIPELINE_JOB_URL=https://... bash infra/scheduler.sh

set -euo pipefail

: "${PIPELINE_JOB_URL:?PIPELINE_JOB_URL must be set}"
: "${PROJECT_ID:?PROJECT_ID must be set}"
REGION="northamerica-northeast1"

gcloud scheduler jobs create http run-pipeline-daily \
  --location="$REGION" \
  --schedule="0 3 * * *" \
  --time-zone="America/Toronto" \
  --uri="$PIPELINE_JOB_URL" \
  --http-method=POST \
  --project="$PROJECT_ID" \
  --message-body="{}" \
  --headers="Content-Type=application/json"

echo "Scheduler job created: run-pipeline-daily (0 3 * * * America/Toronto)"
