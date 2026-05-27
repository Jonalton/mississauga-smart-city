from __future__ import annotations

import asyncio
import json
import logging
import sys
from datetime import datetime, timezone

from fetcher import fetch_all_datasets
import geopandas as gpd
import pandas as pd

from processor import (
    CANONICAL_TYPES,
    compute_ward_scores,
    load_census_population,
    load_neighbourhood_census,
    load_traffic_signals,
    load_transit_stops,
    load_wards,
    load_wifi_assets,
    spatial_join,
)
from schemas import PipelineMetadata
from uploader import upload_error, upload_outputs

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger(__name__)

PIPELINE_VERSION = "1.0.0"


async def run() -> None:
    stage = "fetch"
    try:
        logger.info("Pipeline starting — version %s", PIPELINE_VERSION)
        datasets = await fetch_all_datasets()

        stage = "process"
        wifi_gdf = load_wifi_assets(datasets["wifi_locations"])
        signals_gdf = load_traffic_signals(datasets["traffic_signals"])
        stops_gdf = load_transit_stops(datasets["transit_stops"])
        assets_gdf = gpd.GeoDataFrame(
            pd.concat([wifi_gdf, signals_gdf, stops_gdf], ignore_index=True),
            crs="EPSG:4326",
        )

        wards_gdf = load_wards(datasets["ward_boundaries"])
        population = load_census_population(datasets["census"])
        neighbourhood_gdf = load_neighbourhood_census(datasets["neighbourhood_census"])

        logger.info("Loaded %d assets (%d wifi, %d signals, %d transit stops), %d wards",
                    len(assets_gdf), len(wifi_gdf), len(signals_gdf), len(stops_gdf), len(wards_gdf))

        joined_gdf = spatial_join(assets_gdf, wards_gdf)
        ward_scores = compute_ward_scores(joined_gdf, wards_gdf, population)

        assets_geojson = json.loads(assets_gdf.to_json())
        joined_geojson = json.loads(joined_gdf.to_json())
        ward_boundaries_geojson = json.loads(
            wards_gdf[["geometry", "ward_id", "ward_name", "area_km2"]].to_json()
        )
        neighbourhood_geojson = json.loads(neighbourhood_gdf.to_json())

        type_counts = {t: int((assets_gdf["asset_type"] == t).sum()) for t in CANONICAL_TYPES}
        metadata = PipelineMetadata(
            last_updated=datetime.now(timezone.utc).isoformat(),
            total_assets=len(assets_gdf),
            wards_covered=len(wards_gdf),
            asset_type_counts=type_counts,
            pipeline_version=PIPELINE_VERSION,
        ).model_dump()

        stage = "upload"
        upload_outputs(
            assets_geojson=assets_geojson,
            ward_scores=ward_scores,
            joined_geojson=joined_geojson,
            ward_boundaries_geojson=ward_boundaries_geojson,
            neighbourhood_geojson=neighbourhood_geojson,
            metadata=metadata,
        )
        logger.info("Pipeline complete: %d assets across %d wards", len(assets_gdf), len(wards_gdf))

    except Exception as exc:
        logger.exception("Pipeline failed at stage=%s: %s", stage, exc)
        try:
            upload_error(str(exc), stage)
        except Exception:
            pass
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(run())
