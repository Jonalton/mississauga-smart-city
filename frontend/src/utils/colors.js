export const ASSET_COLORS = {
  wifi:        '#0079c1',
  camera:      '#e74c3c',
  smart_pole:  '#f39c12',
  air_quality: '#27ae60',
  weather:     '#9b59b6',
  other:       '#95a5a6',
}

export const ASSET_TYPES = Object.keys(ASSET_COLORS)

export const ASSET_LABELS = {
  wifi:        'WiFi Hotspot',
  camera:      'Traffic Camera',
  smart_pole:  'Smart Pole',
  air_quality: 'Air Quality Sensor',
  weather:     'Weather Station',
  other:       'Other',
}

export function assetColor(type) {
  return ASSET_COLORS[type] ?? ASSET_COLORS.other
}

export function equityScoreColor(score) {
  if (score >= 70) return '#27ae60'
  if (score >= 40) return '#f39c12'
  return '#e74c3c'
}

export function equityScoreOpacity(score) {
  return 0.3 + (score / 100) * 0.5
}
