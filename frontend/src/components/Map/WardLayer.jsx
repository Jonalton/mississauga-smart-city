import { useEffect, useRef } from 'react'

const SOURCE_ID = 'ward-boundaries'
const FILL_LAYER_ID = 'ward-fill'
const LINE_LAYER_ID = 'ward-outline'
const LABEL_LAYER_ID = 'ward-labels'
const HIGHLIGHT_FILL_ID = 'ward-highlight-fill'
const HIGHLIGHT_LINE_ID = 'ward-highlight-line'

const NO_MATCH = ['==', ['get', 'ward_id'], -1]

function buildEnriched(boundaries, scores) {
  const scoreByWardId = Object.fromEntries(scores.map((s) => [String(s.ward_id), s]))
  return {
    ...boundaries,
    features: boundaries.features.map((f) => ({
      ...f,
      properties: {
        ...f.properties,
        ...(scoreByWardId[String(f.properties.ward_id)] ?? {}),
      },
    })),
  }
}

export default function WardLayer({ map, boundaries, scores, selectedWard }) {
  const layersAdded = useRef(false)

  // Add source + layers once, then only update data thereafter
  useEffect(() => {
    if (!map || !boundaries || !scores) return

    const enriched = buildEnriched(boundaries, scores)

    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, { type: 'geojson', data: enriched })
    } else {
      map.getSource(SOURCE_ID).setData(enriched)
    }

    if (layersAdded.current) return
    layersAdded.current = true

    map.addLayer({
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
    })

    map.addLayer({
      id: LINE_LAYER_ID,
      type: 'line',
      source: SOURCE_ID,
      paint: {
        'line-color': '#0f172a',
        'line-width': 3,
        'line-opacity': 1,
      },
    })

    // Highlight overlay layers (hidden until a ward is selected)
    map.addLayer({
      id: HIGHLIGHT_FILL_ID,
      type: 'fill',
      source: SOURCE_ID,
      filter: NO_MATCH,
      paint: { 'fill-color': '#ffffff', 'fill-opacity': 0.2 },
    })

    map.addLayer({
      id: HIGHLIGHT_LINE_ID,
      type: 'line',
      source: SOURCE_ID,
      filter: NO_MATCH,
      paint: { 'line-color': '#1a3a5c', 'line-width': 5, 'line-opacity': 1 },
    })

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

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      if (!map) return
      ;[LABEL_LAYER_ID, HIGHLIGHT_LINE_ID, HIGHLIGHT_FILL_ID, LINE_LAYER_ID, FILL_LAYER_ID].forEach(
        (id) => { if (map.getLayer(id)) map.removeLayer(id) },
      )
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
      layersAdded.current = false
    }
  }, [map])

  return null
}
