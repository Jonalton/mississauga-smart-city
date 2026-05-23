# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A civic transparency tool that visualizes Mississauga's smart city infrastructure (IoT sensors, WiFi hotspots, traffic cameras, smart poles, air quality sensors) on an interactive map and scores coverage equity across the city's 11 wards.

Data source: City of Mississauga Open Data portal (data.mississauga.ca), powered by ArcGIS Hub.

---

## Architecture

Three services decoupled through GCS — the pipeline and API server **never communicate directly**:

```
ArcGIS Hub REST API
    ↓ (once daily, Cloud Scheduler)
Python Pipeline (Cloud Run Job)
    ↓ writes: assets.geojson, ward_scores.json, joined_data.geojson, metadata.json
GCS Bucket: mississauga-smart-city-data
    ↓ reads on startup + refreshes every 60 min
Go API Server (Cloud Run)
    ↓ HTTPS JSON
React Frontend (Firebase Hosting)
```

The Go API loads all GCS blobs into memory at startup and serves entirely from that in-memory cache — zero GCS reads per request.

---

## Commands

### Pipeline (Python)

```bash
cd pipeline
pip install -r requirements.txt

# Run pipeline end-to-end
python main.py

# Tests (use fixture GeoJSON — no live API calls needed)
pytest tests/
pytest tests/test_processor.py          # single test file
pytest tests/test_processor.py::test_equity_score  # single test
```

### API (Go)

```bash
cd api
go build ./...
go test ./...
go test ./handlers/...                  # single package
go run main.go                          # runs on :8080
```

### Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev                             # dev server, proxies /api/* to :8080
npm run build
npm run lint
```

### Local Dev (Docker Compose)

```bash
# Start fake GCS emulator + Go API
docker-compose up api

# Populate local data by running the pipeline once
docker-compose run pipeline

# Then start the frontend
cd frontend && npm run dev
```

Local GCS emulator: `fsouza/fake-gcs-server` (implements the GCS API locally).

---

## Key Constraints

1. **Never query ArcGIS at API request time.** All data is pre-computed by the pipeline and cached from GCS.
2. **Use MapLibre GL JS**, not Mapbox GL JS — Mapbox requires a paid token; MapLibre is a drop-in replacement.
3. **All GeoJSON must use EPSG:4326** (WGS84 lat/lng).
4. **Pipeline must be idempotent** — write to temp GCS paths first, then rename/copy atomically.
5. **API responses must include `Cache-Control: max-age=3600`** — data only changes once daily.
6. **CORS must be fully open** (`Access-Control-Allow-Origin: *`) — intentional for this public civic API.
7. **Never use Cloud SQL** — GCS + in-memory Go cache is sufficient.
8. **On pipeline failure, write `pipeline_error.json` to GCS** and abort — never write partial data.
9. **On API cache refresh failure**, keep serving stale data and log a warning — do not crash.

---

## ArcGIS Data Discovery

Datasets are discovered at runtime, not hardcoded. Query the Hub search API to get Feature Service URLs:

```
GET https://data.mississauga.ca/api/search/v1/datasets?q=<query>&limit=10
```

Relevant queries: `"smart city asset registry"`, `"ward boundaries"`, `"census"`, `"land use"`

The response `url` field points to an ArcGIS Feature Service. Query it like:

```
https://services1.arcgis.com/{orgId}/arcgis/rest/services/{serviceName}/FeatureServer/0/query
  ?f=geojson&where=1%3D1&outFields=*&resultOffset=0&resultRecordCount=2000
```

---

## Data Contracts

### Asset type normalization (`processor.py`)

ArcGIS uses inconsistent type strings. Canonical types: `wifi`, `camera`, `smart_pole`, `air_quality`, `weather`, `other`. The `raw_type` field on each asset preserves the original string.

### Equity score formula

```python
# Normalized 0–100 across wards; 100 = best covered, 0 = worst
df['equity_score'] = ((df['asset_per_1k_residents'] - min_val) / (max_val - min_val) * 100).round(1)
df['rank'] = df['equity_score'].rank(ascending=False).astype(int)
```

### Gap flags (computed per ward in `processor.py`)

- `no_air_quality_sensors` — zero air quality assets
- `no_weather_sensors` — zero weather assets  
- `critically_low_coverage` — `asset_per_1k_residents < 0.3`

### Frontend map config

- Initial viewport: center `[-79.65, 43.59]`, zoom `11`
- Dev map style: `https://demotiles.maplibre.org/style.json`
- API base: `import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'`

---

## API Endpoints

| Method | Path | Source file |
|--------|------|-------------|
| GET | `/api/assets?type=&ward=&bbox=` | `handlers/assets.go` |
| GET | `/api/wards/scores` | `handlers/wards.go` |
| GET | `/api/wards/:id` | `handlers/wards.go` |
| GET | `/api/nearby?lat=&lng=&radius=` | `handlers/nearby.go` (Haversine, max radius 5000m) |
| GET | `/api/meta` | `handlers/meta.go` |
| GET | `/healthz` | `main.go` (Cloud Run health check) |

Router: `github.com/go-chi/chi/v5`

---

## Environment Variables

**Pipeline:**
```
GCS_BUCKET_NAME=mississauga-smart-city-data
ARCGIS_ORG_ID=          # discovered from Hub API response
GOOGLE_CLOUD_PROJECT=
```

**API:**
```
GCS_BUCKET_NAME=mississauga-smart-city-data
PORT=8080
CACHE_REFRESH_MINUTES=60
GOOGLE_CLOUD_PROJECT=
```
