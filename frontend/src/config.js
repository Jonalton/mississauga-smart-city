export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export const MAP_CONFIG = {
  center: [-79.65, 43.59],
  zoom: 11,
  style: import.meta.env.VITE_MAP_STYLE_URL || 'https://demotiles.maplibre.org/style.json',
}

// Data is stale if the pipeline hasn't run in this many hours
export const STALE_DATA_THRESHOLD_HOURS = 48
