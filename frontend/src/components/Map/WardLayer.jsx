import { useEffect } from 'react'
import { equityScoreColor, equityScoreOpacity } from '../../utils/colors'

const SOURCE_ID = 'ward-boundaries'
const FILL_LAYER_ID = 'ward-fill'
const LINE_LAYER_ID = 'ward-outline'

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

    return () => {
      ;[LINE_LAYER_ID, FILL_LAYER_ID].forEach((id) => {
        if (map.getLayer(id)) map.removeLayer(id)
      })
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
    }
  }, [map, boundaries, scores])

  return null
}
