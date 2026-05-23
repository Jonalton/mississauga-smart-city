from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Any


class HubDataset(BaseModel):
    id: str
    name: str | None = None
    url: str | None = None


class HubSearchResponse(BaseModel):
    results: list[HubDataset] = Field(default_factory=list)


class PipelineMetadata(BaseModel):
    last_updated: str
    total_assets: int
    wards_covered: int
    asset_type_counts: dict[str, int]
    pipeline_version: str = "1.0.0"
    source: str = "City of Mississauga Open Data — data.mississauga.ca"


class PipelineError(BaseModel):
    error: str
    timestamp: str
    stage: str
