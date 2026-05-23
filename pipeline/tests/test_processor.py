import json
import os
import pytest

FIXTURES = os.path.join(os.path.dirname(__file__), "fixtures")


def _fixture(name):
    with open(os.path.join(FIXTURES, name)) as f:
        return json.load(f)


# Add pipeline dir to path so imports work when running from project root
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from processor import load_assets, load_wards, load_census, spatial_join, compute_ward_scores, CANONICAL_TYPES


def test_load_assets_normalizes_type():
    gdf = load_assets(_fixture("sample_assets.geojson"))
    assert "asset_type" in gdf.columns
    assert "raw_type" in gdf.columns
    assert set(gdf["asset_type"].unique()).issubset(set(CANONICAL_TYPES))


def test_load_assets_preserves_count():
    data = _fixture("sample_assets.geojson")
    gdf = load_assets(data)
    assert len(gdf) == len(data["features"])


def test_load_assets_required_columns():
    gdf = load_assets(_fixture("sample_assets.geojson"))
    required = {"geometry", "asset_id", "asset_name", "asset_type", "status", "raw_type"}
    assert required.issubset(set(gdf.columns))


def test_load_wards_computes_area():
    gdf = load_wards(_fixture("sample_wards.geojson"))
    assert "area_km2" in gdf.columns
    assert (gdf["area_km2"] > 0).all()


def test_load_wards_required_columns():
    gdf = load_wards(_fixture("sample_wards.geojson"))
    assert {"ward_id", "ward_name", "area_km2"}.issubset(set(gdf.columns))


def test_spatial_join_assigns_ward():
    assets_gdf = load_assets(_fixture("sample_assets.geojson"))
    wards_gdf = load_wards(_fixture("sample_wards.geojson"))
    joined = spatial_join(assets_gdf, wards_gdf)
    assert "ward_id" in joined.columns
    assert "ward_name" in joined.columns
    assert len(joined) == len(assets_gdf)


def test_equity_scores_bounded():
    assets_gdf = load_assets(_fixture("sample_assets.geojson"))
    wards_gdf = load_wards(_fixture("sample_wards.geojson"))
    joined = spatial_join(assets_gdf, wards_gdf)
    scores = compute_ward_scores(joined, wards_gdf, {1: 48200, 2: 36500})

    equity_scores = [s["equity_score"] for s in scores]
    assert min(equity_scores) == 0.0
    assert max(equity_scores) == 100.0


def test_equity_scores_have_ranks():
    assets_gdf = load_assets(_fixture("sample_assets.geojson"))
    wards_gdf = load_wards(_fixture("sample_wards.geojson"))
    joined = spatial_join(assets_gdf, wards_gdf)
    scores = compute_ward_scores(joined, wards_gdf, {1: 48200, 2: 36500})

    ranks = sorted(s["rank"] for s in scores)
    assert ranks == list(range(1, len(scores) + 1))


def test_type_breakdown_contains_canonical_types():
    assets_gdf = load_assets(_fixture("sample_assets.geojson"))
    wards_gdf = load_wards(_fixture("sample_wards.geojson"))
    joined = spatial_join(assets_gdf, wards_gdf)
    scores = compute_ward_scores(joined, wards_gdf, {1: 48200, 2: 36500})

    for s in scores:
        assert set(CANONICAL_TYPES) == set(s["type_breakdown"].keys())


def test_gap_flags_computed():
    assets_gdf = load_assets(_fixture("sample_assets.geojson"))
    wards_gdf = load_wards(_fixture("sample_wards.geojson"))
    joined = spatial_join(assets_gdf, wards_gdf)
    scores = compute_ward_scores(joined, wards_gdf, {1: 48200, 2: 36500})

    for s in scores:
        assert isinstance(s["gap_flags"], list)
