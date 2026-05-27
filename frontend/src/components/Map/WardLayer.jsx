import { useEffect } from 'react'
import { equityScoreColor, equityScoreOpacity } from '../../utils/colors'

const SOURCE_ID = 'ward-boundaries'
const FILL_LAYER_ID = 'ward-fill'
const LINE_LAYER_ID = 'ward-outline'
const LABEL_LAYER_ID = 'ward-labels'

export default function WardLayer({ map, boundaries, scores }) {
  useEffect(() => {
    if (!map || !boundaries || !scores) return

    // Merge equity scores into ward boundary features
    const scoreByWardId = Object.fromEntries(scores.map((s) => [s.ward_id, s]))
    const enriched = {
      ...boundaries,
      features: boundaries.features.map((f) => ({
        ...f,
        properties: {
          ...f.properties,
          ...(scoreByWardId[f.properties.ward_id] ?? {}),
        },
      })),
    }

    if (map.getSource(SOURCE_ID)) {
      map.getSource(SOURCE_ID).setData(enriched)
      return
    }

    map.addSource(SOURCE_ID, { type: 'geojson', data: enriched })

    // Choropleth fill — color by equity score bucket
    map.addLayer(
      {
        id: FILL_LAYER_ID,
        type: 'fill',
        source: SOURCE_ID,
        paint: {
          'fill-color': [
            'interpolate', ['linear'], ['get', 'equity_score'],
            0, '#e74c3c',
            50, '#f39c12',
            100, '#27ae60',
          ],
          'fill-opacity': 0.35,
        },
      },
      // Insert below asset circles so assets remain visible
      'asset-circles',
    )

    map.addLayer(
      {
        id: LINE_LAYER_ID,
        type: 'line',
        source: SOURCE_ID,
        paint: { 'line-color': '#666', 'line-width': 1, 'line-opacity': 0.6 },
      },
      'asset-circles',
    )

    map.addLayer({
      id: LABEL_LAYER_ID,
      type: 'symbol',
      source: SOURCE_ID,
      layout: {
        'text-field': ['concat', 'Ward ', ['to-string', ['get', 'ward_id']]],
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 9, 11, 13, 15],
        'text-allow-overlap': false,
        'text-ignore-placement': false,
      },
      paint: {
        'text-color': '#222',
        'text-halo-color': 'rgba(255,255,255,0.85)',
        'text-halo-width': 2,
      },
    })

    return () => {
      ;[LABEL_LAYER_ID, LINE_LAYER_ID, FILL_LAYER_ID].forEach((id) => {
        if (map.getLayer(id)) map.removeLayer(id)
      })
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
    }
  }, [map, boundaries, scores])

  return null
}
