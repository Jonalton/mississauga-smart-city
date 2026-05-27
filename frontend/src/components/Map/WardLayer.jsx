import { useEffect } from 'react'

const SOURCE_ID = 'ward-boundaries'
const FILL_LAYER_ID = 'ward-fill'
const LINE_LAYER_ID = 'ward-outline'
const LABEL_LAYER_ID = 'ward-labels'
const HIGHLIGHT_FILL_ID = 'ward-highlight-fill'
const HIGHLIGHT_LINE_ID = 'ward-highlight-line'

const NO_MATCH = ['==', ['get', 'ward_id'], -1]

export default function WardLayer({ map, boundaries, scores, selectedWard }) {
  useEffect(() => {
    if (!map || !boundaries || !scores) return

    const scoreByWardId = Object.fromEntries(scores.map((s) => [s.ward_id, s]))
    const enriched = {
      ...boundaries,
      features: boundaries.features.map((f) => ({
        ...f,
        properties: { ...f.properties, ...(scoreByWardId[f.properties.ward_id] ?? {}) },
      })),
    }

    if (map.getSource(SOURCE_ID)) {
      map.getSource(SOURCE_ID).setData(enriched)
      return
    }

    map.addSource(SOURCE_ID, { type: 'geojson', data: enriched })

    // Ward fill — equity score choropleth
    // Insert before asset-circles only if that layer already exists; otherwise append
    const assetLayer = map.getLayer('asset-circles') ? 'asset-circles' : undefined

    map.addLayer(
      {
        id: FILL_LAYER_ID,
        type: 'fill',
        source: SOURCE_ID,
        paint: {
          'fill-color': [
            'interpolate', ['linear'], ['get', 'equity_score'],
            0, '#e74c3c', 50, '#f39c12', 100, '#27ae60',
          ],
          'fill-opacity': 0.28,
        },
      },
      assetLayer,
    )

    // Ward boundary lines — always visible, drawn over the fill
    map.addLayer(
      {
        id: LINE_LAYER_ID,
        type: 'line',
        source: SOURCE_ID,
        paint: {
          'line-color': '#374151',
          'line-width': 1.5,
          'line-opacity': 0.75,
        },
      },
      assetLayer,
    )

    // Highlight layers (initially hidden — shown when a ward is selected)
    map.addLayer(
      {
        id: HIGHLIGHT_FILL_ID,
        type: 'fill',
        source: SOURCE_ID,
        filter: NO_MATCH,
        paint: { 'fill-color': '#ffffff', 'fill-opacity': 0.2 },
      },
      assetLayer,
    )

    map.addLayer(
      {
        id: HIGHLIGHT_LINE_ID,
        type: 'line',
        source: SOURCE_ID,
        filter: NO_MATCH,
        paint: { 'line-color': '#1a3a5c', 'line-width': 3.5, 'line-opacity': 1 },
      },
      assetLayer,
    )

    // Ward labels — always on top of all ward layers
    map.addLayer({
      id: LABEL_LAYER_ID,
      type: 'symbol',
      source: SOURCE_ID,
      layout: {
        'text-field': ['concat', 'Ward ', ['to-string', ['get', 'ward_id']]],
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 9, 11, 13, 15],
        'text-allow-overlap': false,
      },
      paint: {
        'text-color': '#1f2937',
        'text-halo-color': 'rgba(255,255,255,0.9)',
        'text-halo-width': 2,
      },
    })

    return () => {
      ;[LABEL_LAYER_ID, HIGHLIGHT_LINE_ID, HIGHLIGHT_FILL_ID, LINE_LAYER_ID, FILL_LAYER_ID].forEach(
        (id) => { if (map.getLayer(id)) map.removeLayer(id) },
      )
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
    }
  }, [map, boundaries, scores])

  // Update highlight filter whenever selectedWard changes
  useEffect(() => {
    if (!map || !map.getLayer(HIGHLIGHT_LINE_ID)) return
    const filter = selectedWard
      ? ['==', ['get', 'ward_id'], Number(selectedWard)]
      : NO_MATCH
    map.setFilter(HIGHLIGHT_FILL_ID, filter)
    map.setFilter(HIGHLIGHT_LINE_ID, filter)
  }, [map, selectedWard])

  return null
}
