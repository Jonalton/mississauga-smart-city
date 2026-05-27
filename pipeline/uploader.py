from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone

from google.cloud import storage

logger = logging.getLogger(__name__)

BUCKET_NAME = os.environ.get("GCS_BUCKET_NAME", "mississauga-smart-city-data")
SNAPSHOT_PREFIX = "snapshots"


def _client() -> storage.Client:
    return storage.Client()


def _upload(bucket: storage.Bucket, name: str, data: bytes, content_type: str) -> None:
    blob = bucket.blob(name)
    blob.upload_from_string(data, content_type=content_type)
    logger.info("Uploaded gs://%s/%s (%d bytes)", bucket.name, name, len(data))


def upload_outputs(
    assets_geojson: dict,
    ward_scores: list[dict],
    joined_geojson: dict,
    ward_boundaries_geojson: dict,
    neighbourhood_geojson: dict,
    metadata: dict,
    *,
    snapshot: bool = True,
) -> None:
    """Write all pipeline outputs to GCS using temp-then-rename for atomicity."""
    client = _client()
    bucket = client.bucket(BUCKET_NAME)

    files: dict[str, tuple[bytes, str]] = {
        "assets.geojson": (json.dumps(assets_geojson).encode(), "application/geo+json"),
        "ward_scores.json": (json.dumps(ward_scores).encode(), "application/json"),
        "joined_data.geojson": (json.dumps(joined_geojson).encode(), "application/geo+json"),
        "ward_boundaries.geojson": (json.dumps(ward_boundaries_geojson).encode(), "application/geo+json"),
        "neighbourhood_census.geojson": (json.dumps(neighbourhood_geojson).encode(), "application/geo+json"),
        "metadata.json": (json.dumps(metadata).encode(), "application/json"),
    }

    # Write to a timestamped temp prefix first
    tmp = f"_tmp/{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S')}"
    for name, (data, ct) in files.items():
        _upload(bucket, f"{tmp}/{name}", data, ct)

    # Copy temp → final (closest GCS has to an atomic swap)
    for name, (data, ct) in files.items():
        src = bucket.blob(f"{tmp}/{name}")
        bucket.copy_blob(src, bucket, name)
        src.delete()

    # Phase 2B: daily snapshot archive
    if snapshot:
        date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        for name, (data, ct) in files.items():
            _upload(bucket, f"{SNAPSHOT_PREFIX}/{date_str}/{name}", data, ct)


def upload_error(error: str, stage: str) -> None:
    client = _client()
    bucket = client.bucket(BUCKET_NAME)
    payload = json.dumps({
        "error": error,
        "stage": stage,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }).encode()
    _upload(bucket, "pipeline_error.json", payload, "application/json")
