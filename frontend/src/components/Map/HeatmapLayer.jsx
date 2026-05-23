import { useEffect } from 'react'

const SOURCE_ID = 'heatmap-assets'
const LAYER_ID = 'asset-heatmap'

export default function HeatmapLayer({ map, featureCollection }) {
  useEffect(() => {
    if (!map || !featureCollection) return

    if (map.getSource(SOURCE_ID)) {
      map.getSource(SOURCE_ID).setData(featureCollection)
      return
    }

    map.addSource(SOURCE_ID, { type: 'geojson', data: featureCollection })
    map.addLayer(
      {
        id: LAYER_ID,
        type: 'heatmap',
        source: SOURCE_ID,
        maxzoom: 15,
        paint: {
          'heatmap-weight': 1,
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(33,102,172,0)',
            0.2, 'rgb(103,169,207)',
            0.4, 'rgb(209,229,240)',
            0.6, 'rgb(253,219,199)',
            0.8, 'rgb(239,138,98)',
            1, 'rgb(178,24,43)',
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 15, 20],
          'heatmap-opacity': 0.7,
        },
      },
      // Insert below asset circles
      'asset-circles',
    )

    return () => {
      if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID)
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
    }
  }, [map, featureCollection])

  return null
}
