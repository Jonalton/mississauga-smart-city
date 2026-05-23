import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import { ASSET_COLORS, ASSET_LABELS, ASSET_TYPES } from '../../utils/colors'

const SOURCE_ID = 'smart-city-assets'
const LAYER_ID = 'asset-circles'
const POPUP_LAYER_ID = 'asset-circles-hit'

export default function AssetLayer({ map, featureCollection }) {
  const popupRef = useRef(null)

  useEffect(() => {
    if (!map || !featureCollection) return

    // Add or update source
    if (map.getSource(SOURCE_ID)) {
      map.getSource(SOURCE_ID).setData(featureCollection)
    } else {
      map.addSource(SOURCE_ID, { type: 'geojson', data: featureCollection })

      // Color circles by asset type using a match expression
      const colorExpr = ['match', ['get', 'asset_type'],
        ...ASSET_TYPES.flatMap((t) => [t, ASSET_COLORS[t]]),
        ASSET_COLORS.other,
      ]

      map.addLayer({
        id: LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        paint: {
          'circle-color': colorExpr,
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 9, 3, 14, 7],
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff',
          'circle-opacity': 0.85,
        },
      })

      // Invisible hit-target layer for easier clicking
      map.addLayer({
        id: POPUP_LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        paint: { 'circle-radius': 12, 'circle-opacity': 0 },
      })

      map.on('click', POPUP_LAYER_ID, (e) => {
        const props = e.features[0].properties
        const coords = e.features[0].geometry.coordinates
        const label = ASSET_LABELS[props.asset_type] ?? props.asset_type
        const html = `
          <strong>${props.asset_name || label}</strong><br/>
          Type: ${label}<br/>
          Ward: ${props.ward_name || '—'}<br/>
          Status: ${props.status || '—'}<br/>
          Operator: ${props.operator || '—'}
        `
        popupRef.current?.remove()
        popupRef.current = new maplibregl.Popup()
          .setLngLat(coords)
          .setHTML(html)
          .addTo(map)
      })

      map.on('mouseenter', POPUP_LAYER_ID, () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', POPUP_LAYER_ID, () => {
        map.getCanvas().style.cursor = ''
      })
    }

    return () => {
      popupRef.current?.remove()
    }
  }, [map, featureCollection])

  // Cleanup layers when component unmounts
  useEffect(() => {
    return () => {
      if (!map) return
      ;[POPUP_LAYER_ID, LAYER_ID].forEach((id) => {
        if (map.getLayer(id)) map.removeLayer(id)
      })
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
    }
  }, [map])

  return null
}
