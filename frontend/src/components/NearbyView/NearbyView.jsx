import { useState } from 'react'
import { useNearby } from '../../hooks/useNearby'
import { ASSET_COLORS, ASSET_LABELS } from '../../utils/colors'
import { haversineDistance, formatDistance } from '../../utils/geo'

const RADIUS_OPTIONS = [250, 500, 1000, 2000]

const S = {
  panel: {
    position: 'absolute', bottom: 24, right: 24, zIndex: 200,
    background: '#fff', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
    width: 320, maxHeight: '60vh', display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    background: '#1a3a5c', color: '#fff',
    padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    flexShrink: 0,
  },
  title: { fontSize: 14, fontWeight: 600, margin: 0 },
  closeBtn: { background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 18, lineHeight: 1 },
  controls: { padding: '10px 14px', borderBottom: '1px solid #eee', flexShrink: 0 },
  radiiRow: { display: 'flex', gap: 6 },
  radiusBtn: (active) => ({
    flex: 1, padding: '5px 0', border: '1px solid',
    borderColor: active ? '#1a3a5c' : '#ddd', borderRadius: 6,
    background: active ? '#1a3a5c' : '#fff',
    color: active ? '#fff' : '#555', fontSize: 12, cursor: 'pointer',
  }),
  body: { flex: 1, overflowY: 'auto', padding: '10px 14px' },
  coords: { fontSize: 11, color: '#aaa', marginBottom: 8 },
  assetRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 0', borderBottom: '1px solid #f5f5f5',
  },
  dot: (color) => ({ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0 }),
  assetName: { fontSize: 13, color: '#333', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  distance: { fontSize: 11, color: '#999', whiteSpace: 'nowrap' },
  status: { fontSize: 13, color: '#aaa', textAlign: 'center', padding: '16px 0' },
}

export default function NearbyView({ coords, onClose }) {
  const [radius, setRadius] = useState(500)
  const { data, loading, error } = useNearby(coords, radius)

  const features = data?.features ?? []
  const sorted = [...features].sort((a, b) => {
    const da = haversineDistance(coords.lat, coords.lng, a.geometry.coordinates[1], a.geometry.coordinates[0])
    const db = haversineDistance(coords.lat, coords.lng, b.geometry.coordinates[1], b.geometry.coordinates[0])
    return da - db
  })

  return (
    <div style={S.panel}>
      <div style={S.header}>
        <p style={S.title}>
          Assets near you{data ? ` (${features.length})` : ''}
        </p>
        <button style={S.closeBtn} onClick={onClose}>×</button>
      </div>

      <div style={S.controls}>
        <div style={S.radiiRow}>
          {RADIUS_OPTIONS.map((r) => (
            <button key={r} style={S.radiusBtn(radius === r)} onClick={() => setRadius(r)}>
              {formatDistance(r)}
            </button>
          ))}
        </div>
      </div>

      <div style={S.body}>
        <p style={S.coords}>
          {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
        </p>

        {loading && <p style={S.status}>Loading…</p>}
        {error && <p style={{ ...S.status, color: '#e74c3c' }}>Error: {error}</p>}
        {!loading && !error && features.length === 0 && (
          <p style={S.status}>No assets within {formatDistance(radius)}.</p>
        )}

        {sorted.map((f, i) => {
          const props = f.properties
          const dist = haversineDistance(
            coords.lat, coords.lng,
            f.geometry.coordinates[1], f.geometry.coordinates[0],
          )
          const color = ASSET_COLORS[props.asset_type] ?? ASSET_COLORS.other
          const label = ASSET_LABELS[props.asset_type] ?? props.asset_type
          return (
            <div key={props.asset_id ?? i} style={S.assetRow}>
              <span style={S.dot(color)} />
              <span style={S.assetName} title={props.asset_name || label}>
                {props.asset_name || label}
              </span>
              <span style={S.distance}>{formatDistance(dist)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
