import { useState, useCallback } from 'react'
import Map from './components/Map/Map'
import AssetLayer from './components/Map/AssetLayer'
import WardLayer from './components/Map/WardLayer'
import HeatmapLayer from './components/Map/HeatmapLayer'
import NeighbourhoodLayer from './components/Map/NeighbourhoodLayer'
import Sidebar from './components/Sidebar/Sidebar'
import WardDashboard from './components/WardDashboard/WardDashboard'
import SourcesPage from './components/SourcesPage/SourcesPage'
import NearbyView from './components/NearbyView/NearbyView'
import { useAssets } from './hooks/useAssets'
import { useWardScores } from './hooks/useWardScores'
import { useWardBoundaries } from './hooks/useWardBoundaries'
import { useMeta } from './hooks/useMeta'
import { useNeighbourhoods } from './hooks/useNeighbourhoods'

export default function App() {
  const [filters, setFilters] = useState({ type: '', ward: '' })
  const [view, setView] = useState('map') // 'map' | 'dashboard'
  const [mapInstance, setMapInstance] = useState(null)
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [showDensity, setShowDensity] = useState(false)
  const [nearbyCoords, setNearbyCoords] = useState(null)

  const { data: assets, loading: assetsLoading, error: assetsError, refetch } = useAssets(filters)
  const { data: wardScores } = useWardScores()
  const { data: wardBoundaries } = useWardBoundaries()
  const { isStale } = useMeta()
  const { data: neighbourhoods } = useNeighbourhoods()

  const handleNearbyMe = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setNearbyCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => alert('Location access was denied or unavailable.'),
      { enableHighAccuracy: true },
    )
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {isStale && (
        <div style={styles.staleBanner}>
          Data may be outdated — pipeline has not run in over 48 hours.
        </div>
      )}

      {view === 'map' ? (
        <>
          <Map onMapReady={setMapInstance} />
          {mapInstance && assets && (
            <AssetLayer map={mapInstance} featureCollection={assets} filters={filters} />
          )}
          {mapInstance && wardBoundaries && wardScores && (
            <WardLayer map={mapInstance} boundaries={wardBoundaries} scores={wardScores} />
          )}
          {mapInstance && showHeatmap && assets && (
            <HeatmapLayer map={mapInstance} featureCollection={assets} />
          )}
          {mapInstance && showDensity && neighbourhoods && (
            <NeighbourhoodLayer map={mapInstance} geojson={neighbourhoods} />
          )}
        </>
      ) : view === 'dashboard' ? (
        <WardDashboard scores={wardScores} onClose={() => setView('map')} />
      ) : (
        <SourcesPage onClose={() => setView('map')} />
      )}

      {assetsError && (
        <div style={styles.errorBanner}>
          Failed to load assets.{' '}
          <button onClick={refetch} style={styles.retryBtn}>Retry</button>
        </div>
      )}

      <Sidebar
        filters={filters}
        onFiltersChange={setFilters}
        wardScores={wardScores}
        view={view}
        onViewChange={setView}
        showHeatmap={showHeatmap}
        onToggleHeatmap={() => setShowHeatmap((h) => !h)}
        showDensity={showDensity}
        onToggleDensity={() => setShowDensity((d) => !d)}
        onNearbyMe={handleNearbyMe}
        assetsLoading={assetsLoading}
      />

      {nearbyCoords && (
        <NearbyView
          coords={nearbyCoords}
          onClose={() => setNearbyCoords(null)}
        />
      )}
    </div>
  )
}

const styles = {
  staleBanner: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000,
    background: '#f39c12', color: '#fff', textAlign: 'center',
    padding: '8px 16px', fontSize: 13, fontWeight: 500,
  },
  errorBanner: {
    position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
    zIndex: 1000, background: '#e74c3c', color: '#fff',
    padding: '10px 20px', borderRadius: 6, fontSize: 14,
    display: 'flex', alignItems: 'center', gap: 12,
  },
  retryBtn: {
    background: 'rgba(255,255,255,0.25)', border: 'none', color: '#fff',
    padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 13,
  },
}
