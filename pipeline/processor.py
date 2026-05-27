from __future__ import annotations

import logging
import re

import geopandas as gpd
import pandas as pd
from shapely.geometry import Point, MultiPoint

logger = logging.getLogger(__name__)

# Canonical asset types used across the whole system
CANONICAL_TYPES = ["wifi", "camera", "smart_pole", "air_quality", "weather", "traffic_signal", "transit_stop", "other"]

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


def load_neighbourhood_census(geojson: dict) -> gpd.GeoDataFrame:
    """
    Load 2016 Neighbourhoods Census — 43 sub-ward polygons with demographic data.

    Computes population density (persons/km²) by projecting geometry to UTM 17N.
    Key fields retained: population, density, transit/drive commute %, median income,
    visible minority %, low income count and percent.
    """
    gdf = gpd.GeoDataFrame.from_features(geojson["features"], crs="EPSG:4326")

    # Compute area in km² using UTM 17N projection (accurate for Ontario)
    gdf_proj = gdf.to_crs("EPSG:32617")
    area_km2 = (gdf_proj.geometry.area / 1e6).round(3)

    # Field names from 2016_Census_Data_By_Neighbourhoods_Shape_File (shapefile truncation applies)
    gdf["neighbourhood"] = gdf["CENTROID"].fillna("Unknown")
    gdf["population"] = pd.to_numeric(gdf["Pop_"], errors="coerce").fillna(0).astype(int)
    gdf["area_km2"] = area_km2.values  # avoid index misalignment
    gdf["pop_density"] = (gdf["population"] / area_km2.replace(0, float("nan")).values).round(1).fillna(0)

    gdf["transit_commute_pct"] = pd.to_numeric(gdf.get("CTW_PT_P"), errors="coerce").round(1).fillna(0)
    # CTW_CTV__1 = drive commute % (shapefile truncation of CTW_CTV_Driv_P)
    gdf["drive_commute_pct"] = pd.to_numeric(gdf.get("CTW_CTV__1"), errors="coerce").round(1).fillna(0)
    gdf["median_income"] = pd.to_numeric(gdf.get("IncMa_MED"), errors="coerce").fillna(0).astype(int)
    # Vis_Minor_ = visible minority % (shapefile truncation of Vis_Minor_P)
    gdf["visible_minority_pct"] = pd.to_numeric(gdf.get("Vis_Minor_"), errors="coerce").round(1).fillna(0)

    low_income = pd.to_numeric(gdf.get("LIM_1"), errors="coerce").fillna(0)
    low_income_base = pd.to_numeric(gdf.get("LF_LIM_15"), errors="coerce").replace(0, float("nan"))
    gdf["low_income_count"] = low_income.astype(int)
    gdf["low_income_pct"] = (low_income / low_income_base * 100).round(1).fillna(0)

    keep = [
        "geometry", "neighbourhood", "population", "area_km2", "pop_density",
        "transit_commute_pct", "drive_commute_pct", "median_income",
        "visible_minority_pct", "low_income_count", "low_income_pct",
    ]
    return gdf[keep].copy()


def load_traffic_signals(geojson: dict) -> gpd.GeoDataFrame:
    """
    Load TrafficSignals_ATMS — 803 signalized intersections from Mississauga's ATMS network.

    Fields used: OBJECTID, UNITDESC (intersection name), STATUS (OPEN/CLOSED),
    OWNER_FK (MISS=city, HWY=provincial), COMMTYPE (APN=fiber-networked), CCTV.
    """
    rows = []
    for feature in geojson.get("features", []):
        props = feature.get("properties") or {}
        geom = feature.get("geometry")
        if not geom or geom.get("type") != "Point":
            continue
        coords = geom.get("coordinates", [])
        if len(coords) < 2:
            continue

        obj_id = props.get("OBJECTID", "")
        name = props.get("UNITDESC") or f"Signal {obj_id}"
        status = "active" if str(props.get("STATUS", "")).upper() == "OPEN" else "inactive"
        owner = props.get("OWNER_FK") or "MISS"
        comm = props.get("COMMTYPE") or ""

        rows.append({
            "geometry": Point(coords[0], coords[1]),
            "asset_id": f"signal_{obj_id}",
            "asset_name": name,
            "asset_type": "traffic_signal",
            "status": status,
            "install_date": None,
            "operator": "City of Mississauga" if owner == "MISS" else owner,
            "raw_type": f"Traffic Signal ({comm})" if comm else "Traffic Signal",
        })

    if not rows:
        logger.warning("No traffic signal features loaded")
        return gpd.GeoDataFrame(columns=["geometry", "asset_id", "asset_name", "asset_type",
                                          "status", "install_date", "operator", "raw_type"],
                                crs="EPSG:4326")

    return gpd.GeoDataFrame(rows, crs="EPSG:4326")


def load_transit_stops(geojson: dict) -> gpd.GeoDataFrame:
    """
    Load MiWay_Transit_Stop — 3,323 bus stops with accessibility and zone data.

    Fields used: stp_identi (stop ID), stp_descri (location description),
    stp_access ('1'=accessible), stp_distri (district), stp_zone (fare zone).
    """
    rows = []
    for feature in geojson.get("features", []):
        props = feature.get("properties") or {}
        geom = feature.get("geometry")
        if not geom or geom.get("type") != "Point":
            continue
        coords = geom.get("coordinates", [])
        if len(coords) < 2:
            continue

        stop_id = props.get("stp_identi") or props.get("OBJECTID", "")
        description = props.get("stp_descri") or f"Stop {stop_id}"
        accessible = str(props.get("stp_access", "")) == "1"
        zone = props.get("stp_zone") or ""

        rows.append({
            "geometry": Point(coords[0], coords[1]),
            "asset_id": f"transit_{stop_id}",
            "asset_name": description,
            "asset_type": "transit_stop",
            "status": "active" if accessible else "limited",
            "install_date": None,
            "operator": "MiWay",
            "raw_type": f"Transit Stop Zone {zone}" if zone else "Transit Stop",
        })

    if not rows:
        logger.warning("No transit stop features loaded")
        return gpd.GeoDataFrame(columns=["geometry", "asset_id", "asset_name", "asset_type",
                                          "status", "install_date", "operator", "raw_type"],
                                crs="EPSG:4326")

    return gpd.GeoDataFrame(rows, crs="EPSG:4326")


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
    if row["asset_per_1k_residents"] < 0.3:
        flags.append("critically_low_coverage")
    if breakdown.get("wifi", 0) == 0:
        flags.append("no_public_wifi")
    if breakdown.get("transit_stop", 0) == 0:
        flags.append("no_transit_stops")
    if breakdown.get("traffic_signal", 0) == 0:
        flags.append("no_traffic_signals")
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
