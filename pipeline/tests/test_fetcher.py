import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import httpx

from fetcher import discover_feature_service_url, fetch_all_features


def _mock_response(data: dict) -> MagicMock:
    resp = MagicMock()
    resp.raise_for_status = MagicMock()
    resp.json.return_value = data
    return resp


@pytest.mark.asyncio
async def test_discover_returns_url():
    payload = {
        "results": [{"id": "abc", "name": "Smart City Assets", "url": "https://services1.arcgis.com/org/arcgis/rest/services/Assets/FeatureServer"}]
    }
    async with httpx.AsyncClient() as client:
        with patch.object(client, "get", new_callable=AsyncMock, return_value=_mock_response(payload)):
            url = await discover_feature_service_url(client, "smart city asset registry")
    assert url == "https://services1.arcgis.com/org/arcgis/rest/services/Assets/FeatureServer"


@pytest.mark.asyncio
async def test_discover_raises_on_empty_results():
    async with httpx.AsyncClient() as client:
        with patch.object(client, "get", new_callable=AsyncMock, return_value=_mock_response({"results": []})):
            with pytest.raises(RuntimeError, match="No Hub dataset found"):
                await discover_feature_service_url(client, "nonexistent")


@pytest.mark.asyncio
async def test_discover_raises_on_missing_url():
    payload = {"results": [{"id": "abc", "name": "No URL dataset"}]}
    async with httpx.AsyncClient() as client:
        with patch.object(client, "get", new_callable=AsyncMock, return_value=_mock_response(payload)):
            with pytest.raises(RuntimeError, match="has no url field"):
                await discover_feature_service_url(client, "some query")


@pytest.mark.asyncio
async def test_fetch_all_features_paginates():
    page1 = {"features": [{"type": "Feature", "geometry": None, "properties": {}} for _ in range(2000)]}
    page2 = {"features": [{"type": "Feature", "geometry": None, "properties": {}} for _ in range(500)]}

    responses = [_mock_response(page1), _mock_response(page2)]
    call_count = 0

    async def _get_side_effect(url, params=None, **kwargs):
        nonlocal call_count
        r = responses[min(call_count, 1)]
        call_count += 1
        return r

    async with httpx.AsyncClient() as client:
        with patch.object(client, "get", side_effect=_get_side_effect):
            result = await fetch_all_features(client, "https://example.com/FeatureServer")

    assert len(result["features"]) == 2500
    assert call_count == 2


@pytest.mark.asyncio
async def test_fetch_all_features_single_page():
    page = {"features": [{"type": "Feature", "geometry": None, "properties": {}} for _ in range(42)]}
    async with httpx.AsyncClient() as client:
        with patch.object(client, "get", new_callable=AsyncMock, return_value=_mock_response(page)):
            result = await fetch_all_features(client, "https://example.com/FeatureServer")
    assert len(result["features"]) == 42
