output "bucket_name" {
  value = google_storage_bucket.data.name
}

output "api_url" {
  value = google_cloud_run_v2_service.api.uri
}

output "service_account_email" {
  value = google_service_account.smart_city.email
}
