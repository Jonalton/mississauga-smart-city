import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'

const SOURCE_ID = 'neighbourhood-census'
const FILL_LAYER_ID = 'neighbourhood-density-fill'
const LINE_LAYER_ID = 'neighbourhood-density-line'
const POPUP_LAYER_ID = 'neighbourhood-density-hit'

// YlOrRd density scale (persons/km²)
const DENSITY_COLOR_EXPR = [
  'interpolate', ['linear'], ['get', 'pop_density'],
  0,    '#ffffb2',
  1000, '#fecc5c',
  2500, '#fd8d3c',
  5000, '#f03b20',
  8000, '#bd0026',
]

function fmt(n, decimals = 0) {
  return Number(n ?? 0).toLocaleString('en-CA', { maximumFractionDigits: decimals })
}

export default function NeighbourhoodLayer({ map, geojson }) {
  const popupRef = useRef(null)

  useEffect(() => {
    if (!map || !geojson) return

    if (map.getSource(SOURCE_ID)) {
      map.getSource(SOURCE_ID).setData(geojson)
      return
    }

    map.addSource(SOURCE_ID, { type: 'geojson', data: geojson })

    map.addLayer(
      {
        id: FILL_LAYER_ID,
        type: 'fill',
        source: SOURCE_ID,
        paint: {
          'fill-color': DENSITY_COLOR_EXPR,
          'fill-opacity': 0.55,
        },
      },
      // Insert below ward outlines so ward boundaries remain visible on top
      'ward-outline',
    )

    map.addLayer(
      {
        id: LINE_LAYER_ID,
        type: 'line',
        source: SOURCE_ID,
        paint: { 'line-color': '#999', 'line-width': 0.5, 'line-opacity': 0.5 },
      },
      'ward-outline',
    )

    // Invisible hit target for popups
    map.addLayer({
      id: POPUP_LAYER_ID,
      type: 'fill',
      source: SOURCE_ID,
      paint: { 'fill-opacity': 0 },
    })

    map.on('click', POPUP_LAYER_ID, (e) => {
      const p = e.features[0].properties
      const html = `
        <strong>${p.neighbourhood}</strong><br/>
        <table style="font-size:12px;border-collapse:collapse;margin-top:4px">
          <tr><td style="padding:1px 6px 1px 0;color:#666">Population</td><td><b>${fmt(p.population)}</b></td></tr>
          <tr><td style="padding:1px 6px 1px 0;color:#666">Density</td><td><b>${fmt(p.pop_density)} /km²</b></td></tr>
          <tr><td style="padding:1px 6px 1px 0;color:#666">Median income</td><td><b>$${fmt(p.median_income)}</b></td></tr>
          <tr><td style="padding:1px 6px 1px 0;color:#666">Transit commute</td><td><b>${fmt(p.transit_commute_pct, 1)}%</b></td></tr>
          <tr><td style="padding:1px 6px 1px 0;color:#666">Drives to work</td><td><b>${fmt(p.drive_commute_pct, 1)}%</b></td></tr>
          <tr><td style="padding:1px 6px 1px 0;color:#666">Visible minority</td><td><b>${fmt(p.visible_minority_pct, 1)}%</b></td></tr>
          <tr><td style="padding:1px 6px 1px 0;color:#666">Low income</td><td><b>${fmt(p.low_income_count)} (${fmt(p.low_income_pct, 1)}%)</b></td></tr>
        </table>
      `
      popupRef.current?.remove()
      popupRef.current = new maplibregl.Popup({ maxWidth: '260px' })
        .setLngLat(e.lngLat)
        .setHTML(html)
        .addTo(map)
    })

    map.on('mouseenter', POPUP_LAYER_ID, () => { map.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', POPUP_LAYER_ID, () => { map.getCanvas().style.cursor = '' })

    return () => { popupRef.current?.remove() }
  }, [map, geojson])

  useEffect(() => {
    return () => {
      if (!map) return
      ;[POPUP_LAYER_ID, LINE_LAYER_ID, FILL_LAYER_ID].forEach((id) => {
        if (map.getLayer(id)) map.removeLayer(id)
      })
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
      popupRef.current?.remove()
    }
  }, [map])

  return null
}
