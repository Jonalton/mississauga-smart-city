terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# --- GCS bucket ---
resource "google_storage_bucket" "data" {
  name                        = var.bucket_name
  location                    = var.region
  uniform_bucket_level_access = true
  force_destroy               = false
}

resource "google_storage_bucket_iam_member" "public_read" {
  bucket = google_storage_bucket.data.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# --- Service account ---
resource "google_service_account" "smart_city" {
  account_id   = "smart-city-sa"
  display_name = "Smart City Pipeline & API"
}

resource "google_storage_bucket_iam_member" "sa_admin" {
  bucket = google_storage_bucket.data.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.smart_city.email}"
}

# --- Artifact Registry ---
resource "google_artifact_registry_repository" "docker" {
  location      = var.region
  repository_id = var.artifact_repo
  format        = "DOCKER"
}

# --- Cloud Run API service (placeholder — image populated by CI) ---
resource "google_cloud_run_v2_service" "api" {
  name     = "smart-city-api"
  location = var.region

  template {
    service_account = google_service_account.smart_city.email
    containers {
      # Placeholder image — updated by cloudbuild.yaml on every push to main
      image = "gcr.io/cloudrun/placeholder"
      env {
        name  = "GCS_BUCKET_NAME"
        value = var.bucket_name
      }
      env {
        name  = "GOOGLE_CLOUD_PROJECT"
        value = var.project_id
      }
    }
  }
}

resource "google_cloud_run_v2_service_iam_member" "api_public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# --- Cloud Run Job for pipeline (placeholder) ---
resource "google_cloud_run_v2_job" "pipeline" {
  name     = "smart-city-pipeline"
  location = var.region

  template {
    template {
      service_account = google_service_account.smart_city.email
      containers {
        image = "gcr.io/cloudrun/placeholder"
        env {
          name  = "GCS_BUCKET_NAME"
          value = var.bucket_name
        }
        env {
          name  = "GOOGLE_CLOUD_PROJECT"
          value = var.project_id
        }
      }
    }
  }
}

# --- Cloud Scheduler trigger ---
resource "google_cloud_scheduler_job" "pipeline_daily" {
  name      = "run-pipeline-daily"
  region    = var.region
  schedule  = "0 3 * * *"
  time_zone = "America/Toronto"

  http_target {
    uri         = "https://${var.region}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${var.project_id}/jobs/smart-city-pipeline:run"
    http_method = "POST"
    oauth_token {
      service_account_email = google_service_account.smart_city.email
    }
  }
}
