# Mississauga Smart City Monitor

A public-facing civic dashboard that maps Mississauga's digital infrastructure across the city's 11 wards, scores coverage equity, and surfaces gaps where investment is most needed.

**Live data source:** [City of Mississauga Open Data](https://data.mississauga.ca) (ArcGIS org `hM5ymMLbxIyWTjn2`)

---

## What It Does

- **Interactive map** — plots public WiFi hotspots and digital access points city-wide using MapLibre GL JS
- **Ward equity scoring** — ranks all 11 wards by assets per 1,000 residents (normalized 0–100)
- **Gap detection** — automatically flags wards with critically low coverage or missing asset types
- **"What's Near Me"** — uses browser geolocation to find the closest city assets within a configurable radius
- **Ward dashboard** — sortable equity table with per-ward breakdowns and gap flag explanations

---

## Architecture

Three independent services decoupled through Google Cloud Storage:

```
ArcGIS REST API (data.mississauga.ca)
    ↓  fetched once daily
Python Pipeline  ──writes──▶  GCS Bucket
                                   ↓  loaded at startup
                              Go API Server  ──HTTPS──▶  React Frontend
                                                         (Firebase Hosting)
```

The Go API loads all GCS blobs into memory at startup and serves entirely from cache — zero GCS reads per request. The pipeline and API never communicate directly; pipeline failures don't affect the live API.

---

## Data Sources

| Dataset | Service | Records |
|---|---|---|
| City Public WiFi Locations | `WiFi/FeatureServer/0` | 50 geolocated points |
| Ward Boundaries | `Ward_Boundaries/FeatureServer/2` | 11 ward polygons |
| 2016 Census by Wards | `Ward_2016Census/FeatureServer/0` | Population per ward (`CP_1`) |
| Active Development Applications | `GrowthManagementActiveDevelopmentApplications` | Phase 2A enrichment |

All services are under ArcGIS org `hM5ymMLbxIyWTjn2` (City of Mississauga).

> **Note:** Mississauga's Smart City Asset Registry is a program catalog without GPS coordinates. The primary spatial dataset is City Public WiFi Locations — libraries, arenas, community centres, and transit hubs with public WiFi.

---

## Project Structure

```
├── pipeline/          Python data pipeline (Cloud Run Job)
│   ├── fetcher.py     Fetches from ArcGIS REST APIs
│   ├── processor.py   Spatial joins, equity scoring, gap flags
│   ├── uploader.py    Writes outputs to GCS (atomic, with daily snapshots)
│   ├── main.py        Orchestration entry point
│   └── tests/         Unit tests using fixture GeoJSON (no live API needed)
│
├── api/               Go API server (Cloud Run Service)
│   ├── main.go        Chi router, GCS cache startup
│   ├── handlers/      One file per endpoint group
│   ├── storage/       In-memory GCS cache with background refresh
│   ├── middleware/     CORS (open) + Cache-Control (max-age=3600)
│   └── models/        Asset and WardScore structs
│
├── frontend/          React + Vite (Firebase Hosting)
│   └── src/
│       ├── components/Map/        MapLibre GL asset + ward + heatmap layers
│       ├── components/Sidebar/    Filters and insight cards
│       ├── components/WardDashboard/  Equity table and ward detail
│       ├── components/NearbyView/ Radius-based nearby search
│       ├── hooks/                 Data fetching hooks (useAssets, useWardScores, etc.)
│       └── utils/                 Haversine, color mapping, formatting
│
└── infra/             GCP infrastructure
    ├── setup.sh       One-time GCP resource provisioning
    ├── scheduler.sh   Cloud Scheduler job (3am daily)
    ├── cloudbuild.yaml  CI/CD on push to main
    └── terraform/     IaC for all GCP resources (Phase 2)
```

---

## Local Development

### Prerequisites

- Docker and Docker Compose
- Python 3.12+ (for running the pipeline outside Docker)
- Go 1.22+
- Node.js 20+

### 1. Start local GCS emulator + API

```bash
docker-compose up fake-gcs api
```

This starts `fsouza/fake-gcs-server` on port 4443 and the Go API on port 8080.

### 2. Run the pipeline to populate local data

```bash
docker-compose run pipeline
```

### 3. Start the frontend dev server

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173 — proxies /api/* to :8080
```

### Running pipeline tests (no live API required)

```bash
cd pipeline
pip install -r requirements.txt
pytest tests/ -v

# Single test file
pytest tests/test_processor.py -v

# Single test
pytest tests/test_processor.py::test_equity_scores_bounded -v
```

### Running Go tests

```bash
cd api
go mod tidy      # generates go.sum on first run
go test ./...
go build ./...
```

---

## API Reference

Base URL: `http://localhost:8080` (local) or the Cloud Run service URL.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/assets` | All assets as GeoJSON. Filters: `?type=wifi&ward=1&bbox=-79.7,43.5,-79.6,43.6` |
| `GET` | `/api/wards/scores` | Equity rankings for all 11 wards |
| `GET` | `/api/wards/boundaries` | Ward polygon GeoJSON for choropleth |
| `GET` | `/api/wards/:id` | Single ward detail |
| `GET` | `/api/nearby` | Assets within radius: `?lat=43.589&lng=-79.644&radius=500` (max 5000m) |
| `GET` | `/api/meta` | Pipeline run metadata and asset counts |
| `GET` | `/healthz` | Health check (Cloud Run liveness probe) |

All responses include `Cache-Control: public, max-age=3600` and `Access-Control-Allow-Origin: *`.

---

## GCP Deployment

### One-time setup

```bash
export PROJECT_ID=your-gcp-project-id
bash infra/setup.sh
```

This creates the GCS bucket, service account, Artifact Registry repo, and enables required APIs.

### CI/CD

Push to `main` triggers Cloud Build (`infra/cloudbuild.yaml`):
1. Build and push Docker images for pipeline and API
2. Deploy API to Cloud Run
3. Update Cloud Run Job for pipeline
4. Build and deploy frontend to Firebase Hosting

Update the substitution variables in `cloudbuild.yaml` before first use:
```yaml
_PROJECT_ID: "your-gcp-project-id"
_FIREBASE_PROJECT: "your-firebase-project"
```

### Scheduled pipeline

```bash
export PIPELINE_JOB_URL=https://...  # Cloud Run Job trigger URL
bash infra/scheduler.sh
```

Runs the pipeline daily at 3:00 AM Eastern time.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in values:

```bash
# GCP
GOOGLE_CLOUD_PROJECT=your-project-id
GCS_BUCKET_NAME=mississauga-smart-city-data

# API
PORT=8080
CACHE_REFRESH_MINUTES=60

# Frontend
VITE_API_BASE_URL=http://localhost:8080
VITE_MAP_STYLE_URL=https://demotiles.maplibre.org/style.json
```

---

## Key Design Decisions

- **No database** — GCS files + in-memory Go cache is sufficient and costs near zero
- **MapLibre GL JS** instead of Mapbox GL JS — identical API, no license cost
- **Pipeline idempotency** — writes to temp GCS paths first, then renames atomically
- **All GeoJSON in EPSG:4326** — no projected coordinates in outputs
- **Stale data warning** — frontend shows a banner if `metadata.json` is over 48h old

---

## Roadmap

| Phase | Feature |
|---|---|
| **2A** | Enrich with Peel Region crime data and active development applications |
| **2B** | Daily GCS snapshots + timeline slider to show coverage change over time |
| **2C** | Ward report card PDF export (`@react-pdf/renderer`) |
| **2D** | Email alerts via Firestore + Cloud Functions when ward equity drops |
| **2E** | Full Terraform IaC with staging environment |
