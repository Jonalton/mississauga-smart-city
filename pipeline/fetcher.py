from __future__ import annotations

import logging

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)

# All service URLs discovered from ArcGIS (org: hM5ymMLbxIyWTjn2 = City of Mississauga)
ARCGIS_BASE = "https://services6.arcgis.com/hM5ymMLbxIyWTjn2/arcgis/rest/services"

DATASET_URLS: dict[str, str] = {
    # City Public WiFi Locations — 50 geolocated points (libraries, arenas, parks, transit hubs)
    "wifi_locations": f"{ARCGIS_BASE}/WiFi/FeatureServer/0",
    # Ward Boundaries — 11 ward polygons, layer index 2
    "ward_boundaries": f"{ARCGIS_BASE}/Ward_Boundaries/FeatureServer/2",
    # 2016 Census by Wards — population and demographic data
    "census": f"{ARCGIS_BASE}/Ward_2016Census/FeatureServer/0",
    # Active Development Applications — used in Phase 2A enrichment
    "development_applications": f"{ARCGIS_BASE}/GrowthManagementActiveDevelopmentApplications/FeatureServer/0",
    # Traffic signals from ATMS (Advanced Traffic Management System) — 803 signalized intersections
    "traffic_signals": f"{ARCGIS_BASE}/TrafficSignals_ATMS/FeatureServer/0",
    # MiWay transit stops — 3,323 bus stops with accessibility flags
    "transit_stops": f"{ARCGIS_BASE}/MiWay_Transit_Stop/FeatureServer/0",
    # 2016 Census by Neighbourhood (shapefile) — 43 sub-ward polygons with geometry + demographics
    "neighbourhood_census": f"{ARCGIS_BASE}/2016_Census_Data_By_Neighbourhoods_Shape_File/FeatureServer/0",
}

_GEOJSON_PARAMS = {
    "f": "geojson",
    "where": "1=1",
    "outFields": "*",
}


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def _get(client: httpx.AsyncClient, url: str, params: dict) -> dict:
    resp = await client.get(url, params=params)
    resp.raise_for_status()
    return resp.json()


async def fetch_feature_layer(client: httpx.AsyncClient, layer_url: str) -> dict:
    """Paginate through an ArcGIS Feature Service layer and return a GeoJSON FeatureCollection."""
    all_features: list[dict] = []
    offset = 0
    page_size = 2000

    while True:
        params = {**_GEOJSON_PARAMS, "resultOffset": offset, "resultRecordCount": page_size}
        data = await _get(client, f"{layer_url}/query", params)
        features = data.get("features", [])
        all_features.extend(features)
        logger.debug("Layer %s: fetched %d features at offset %d (total=%d)", layer_url, len(features), offset, len(all_features))
        if len(features) < page_size:
            break
        offset += page_size

    return {"type": "FeatureCollection", "features": all_features}


async def fetch_all_datasets() -> dict[str, dict]:
    """Fetch all required datasets from Mississauga Open Data (ArcGIS org: hM5ymMLbxIyWTjn2)."""
    import asyncio

    async with httpx.AsyncClient(timeout=httpx.Timeout(30.0)) as client:
        tasks = {
            key: fetch_feature_layer(client, url)
            for key, url in DATASET_URLS.items()
        }
        results = {}
        for key, coro in tasks.items():
            logger.info("Fetching %s from %s", key, DATASET_URLS[key])
            results[key] = await coro
            logger.info("Fetched %d features for %s", len(results[key]["features"]), key)

    return results
