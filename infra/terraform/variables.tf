variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "northamerica-northeast1"
}

variable "bucket_name" {
  description = "GCS bucket for pipeline outputs"
  type        = string
  default     = "mississauga-smart-city-data"
}

variable "artifact_repo" {
  description = "Artifact Registry repository name"
  type        = string
  default     = "smart-city"
}
