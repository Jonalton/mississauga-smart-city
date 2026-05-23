from __future__ import annotations

import logging
import re

import geopandas as gpd
import pandas as pd
from shapely.geometry import Point, MultiPoint

logger = logging.getLogger(__name__)

# Canonical asset types used across the whole system
CANONICAL_TYPES = ["wifi", "camera", "smart_pole", "air_quality", "weather", "other"]

# Map keywords in the WiFi DESCRIPT field to canonical types.
# These are public WiFi hotspot locations — mostly libraries, community centres, arenas.
_WIFI_SUBTYPE_KEYWORDS: list[tuple[re.Pattern, str]] = [
    (re.compile(r"library", re.I), "wifi"),
    (re.compile(r"community centre|community center|cc\b", re.I), "wifi"),
    (re.compile(r"arena|rink|ice", re.I), "wifi"),
    (re.compile(r"pool|aquatic", re.I), "wifi"),
    (re.compile(r"transit|bus terminal|brt|gateway", re.I), "wifi"),
    (re.compile(r"golf|marina|park\b", re.I), "wifi"),
    (re.compile(r"museum|heritage|art|theatre|living arts", re.I), "wifi"),
    (re.compile(r"court|justice", re.I), "wifi"),
]


def _wifi_asset_type(description: str) -> str:
    """All WiFi hotspot features normalize to 'wifi' — subtype keywords are kept for future use."""
    return "wifi"


def _extract_multipoint_coords(geometry) -> list[tuple[float, float]] | None:
    """ArcGIS GeoJSON sometimes returns MultiPoint; extract the first coordinate pair."""
    if geometry is None:
        return None
    geom_type = geometry.geom_type
    if geom_type == "Point":
        return [(geometry.x, geometry.y)]
    if geom_type == "MultiPoint":
        return [(g.x, g.y) for g in geometry.geoms]
    return None


def load_wifi_assets(geojson: dict) -> gpd.GeoDataFrame:
    """
    Load City Public WiFi Locations.

    Fields: FID, DESCRIPT (location name), CENT_X (UTM X), CENT_Y (UTM Y).
    Geometry is MultiPoint — we explode multi-location features to individual points.
    """
    rows = []
    for feature in geojson.get("features", []):
        props = feature.get("properties") or {}
        geom = feature.get("geometry")
        if not geom:
            continue

        fid = props.get("FID", "")
        name = props.get("DESCRIPT") or ""

        # Parse geometry — GeoJSON MultiPoint has coordinates list
        coords_list = geom.get("coordinates", [])
        if geom.get("type") == "MultiPoint":
            point_list = coords_list  # [[lng, lat], ...]
        elif geom.get("type") == "Point":
            point_list = [coords_list]
        else:
            continue

        for i, coord in enumerate(point_list):
            if len(coord) < 2:
                continue
            rows.append({
                "geometry": Point(coord[0], coord[1]),
                "asset_id": f"wifi_{fid}_{i}",
                "asset_name": name,
                "asset_type": "wifi",
                "status": "active",
                "install_date": None,
                "operator": "City of Mississauga",
                "raw_type": "Public WiFi",
            })

    if not rows:
        logger.warning("No WiFi features loaded — check geometry format")
        return gpd.GeoDataFrame(columns=["geometry", "asset_id", "asset_name", "asset_type",
                                          "status", "install_date", "operator", "raw_type"],
                                crs="EPSG:4326")

    gdf = gpd.GeoDataFrame(rows, crs="EPSG:4326")
    return gdf


def load_wards(geojson: dict) -> gpd.GeoDataFrame:
    """
    Load Ward Boundaries (layer 2 of Ward_Boundaries FeatureServer).

    Fields: WARD (ward number as string, e.g. "4"), COUNCILLOR, OBJECTID.
    """
    gdf = gpd.GeoDataFrame.from_features(geojson["features"], crs="EPSG:4326")

    gdf["ward_id"] = pd.to_numeric(gdf["WARD"], errors="coerce").fillna(0).astype(int)
    gdf["ward_name"] = gdf["ward_id"].apply(lambda x: f"Ward {x}")

    # Area in km² — project to UTM 17N (EPSG:32617) for Ontario
    gdf_proj = gdf.to_crs("EPSG:32617")
    gdf["area_km2"] = (gdf_proj.geometry.area / 1e6).round(2)

    councillors = {int(r["WARD"]): r.get("COUNCILLOR", "") for _, r in gdf.iterrows() if r.get("WARD")}

    return gdf[["geometry", "ward_id", "ward_name", "area_km2"]].copy()


def load_census_population(geojson: dict) -> dict[int, int]:
    """
    Extract ward population from 2016 Census by Wards.

    Field WARD_ = ward number (int), CP_1 = total population (2016 Census).
    """
    pop: dict[int, int] = {}
    for feature in geojson.get("features", []):
        props = feature.get("properties") or {}
        ward_id = props.get("WARD_") or props.get("WARD")
        population = props.get("CP_1")  # Total population, 2016 Census
        if ward_id and population:
            try:
                pop[int(ward_id)] = int(population)
            except (ValueError, TypeError):
                pass
    if not pop:
        logger.warning("No census population data loaded")
    return pop


def spatial_join(assets: gpd.GeoDataFrame, wards: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    joined = gpd.sjoin(
        assets,
        wards[["geometry", "ward_id", "ward_name"]],
        how="left",
        predicate="within",
    )
    joined = joined.drop(columns=["index_right"], errors="ignore")
    joined["ward_id"] = joined["ward_id"].fillna(-1).astype(int)
    joined["ward_name"] = joined["ward_name"].fillna("Unknown")
    return joined


def _compute_gap_flags(row: pd.Series) -> list[str]:
    flags = []
    breakdown: dict = row["type_breakdown"]
    # For current dataset (WiFi only), check for critically low coverage
    if row["asset_per_1k_residents"] < 0.05:
        flags.append("critically_low_coverage")
    if breakdown.get("wifi", 0) == 0:
        flags.append("no_public_wifi")
    return flags


def compute_ward_scores(
    joined: gpd.GeoDataFrame,
    wards: gpd.GeoDataFrame,
    population_by_ward: dict[int, int],
) -> list[dict]:
    rows = []
    for _, ward in wards.iterrows():
        ward_assets = joined[joined["ward_id"] == int(ward["ward_id"])]
        asset_count = len(ward_assets)
        population = population_by_ward.get(int(ward["ward_id"]), 0)
        area_km2 = float(ward["area_km2"])

        asset_per_km2 = round(asset_count / area_km2, 4) if area_km2 > 0 else 0.0
        asset_per_1k = round(asset_count / (population / 1000), 4) if population > 0 else 0.0

        type_breakdown = {t: int((ward_assets["asset_type"] == t).sum()) for t in CANONICAL_TYPES}

        rows.append({
            "ward_id": int(ward["ward_id"]),
            "ward_name": str(ward["ward_name"]),
            "population": population,
            "area_km2": area_km2,
            "asset_count": asset_count,
            "asset_per_km2": asset_per_km2,
            "asset_per_1k_residents": asset_per_1k,
            "type_breakdown": type_breakdown,
            "equity_score": 0.0,
            "rank": 0,
            "gap_flags": [],
        })

    df = pd.DataFrame(rows)

    mn, mx = df["asset_per_1k_residents"].min(), df["asset_per_1k_residents"].max()
    if mx > mn:
        df["equity_score"] = ((df["asset_per_1k_residents"] - mn) / (mx - mn) * 100).round(1)
    else:
        df["equity_score"] = 50.0

    df["rank"] = df["equity_score"].rank(ascending=False).astype(int)
    df["gap_flags"] = df.apply(_compute_gap_flags, axis=1)

    return df.to_dict(orient="records")
