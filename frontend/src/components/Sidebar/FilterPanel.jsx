import { ASSET_TYPES, ASSET_LABELS, ASSET_COLORS } from '../../utils/colors'

function Toggle({ on, color, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onChange}
      style={{
        width: 34, height: 18, borderRadius: 9, border: 'none', padding: 0,
        background: on ? color : '#d1d5db',
        position: 'relative', cursor: 'pointer', flexShrink: 0,
        transition: 'background 0.15s ease', outline: 'none',
      }}
    >
      <span style={{
        position: 'absolute', top: 2, left: on ? 16 : 2,
        width: 14, height: 14, borderRadius: '50%',
        background: '#fff', transition: 'left 0.15s ease',
        boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
        display: 'block',
      }} />
    </button>
  )
}

const S = {
  section: { marginBottom: 20 },
  sectionHead: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 10, fontWeight: 700, color: '#9ca3af',
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  quickLinks: { display: 'flex', gap: 8 },
  quickBtn: {
    fontSize: 10, color: '#6b7280', background: 'none', border: 'none',
    cursor: 'pointer', padding: 0, textDecoration: 'underline',
  },
  row: {
    display: 'flex', alignItems: 'center', gap: 9,
    padding: '6px 0', borderBottom: '1px solid #f3f4f6',
    cursor: 'pointer',
  },
  dot: (color) => ({
    width: 9, height: 9, borderRadius: '50%',
    background: color, flexShrink: 0,
  }),
  rowLabel: (on) => ({
    flex: 1, fontSize: 13, color: on ? '#111827' : '#9ca3af',
    transition: 'color 0.15s',
  }),
  select: {
    width: '100%', padding: '8px 10px',
    border: '1px solid #e5e7eb', borderRadius: 6,
    fontSize: 13, background: '#fafafa', color: '#374151',
    appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
    cursor: 'pointer',
  },
  overlayRow: {
    display: 'flex', alignItems: 'center', gap: 9, padding: '7px 0',
    borderBottom: '1px solid #f3f4f6',
  },
  overlayIcon: { fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0 },
  overlayLabel: (on) => ({
    flex: 1, fontSize: 13, color: on ? '#111827' : '#9ca3af',
    transition: 'color 0.15s',
  }),
}

export default function FilterPanel({
  activeTypes, onToggleType, onSelectAll, onClearAll,
  selectedWard, onWardChange,
  wardScores,
  showHeatmap, onToggleHeatmap,
  showDensity, onToggleDensity,
  loading,
}) {
  const allOn = activeTypes.size === ASSET_TYPES.length

  return (
    <div>
      {/* Asset Layers */}
      <div style={S.section}>
        <div style={S.sectionHead}>
          <span style={S.label}>Asset Layers</span>
          <div style={S.quickLinks}>
            <button style={S.quickBtn} onClick={onSelectAll} disabled={allOn}>All</button>
            <button style={S.quickBtn} onClick={onClearAll} disabled={activeTypes.size === 0}>None</button>
          </div>
        </div>
        {ASSET_TYPES.map((type) => {
          const on = activeTypes.has(type)
          return (
            <div
              key={type}
              style={S.row}
              onClick={() => onToggleType(type)}
            >
              <span style={S.dot(ASSET_COLORS[type])} />
              <span style={S.rowLabel(on)}>{ASSET_LABELS[type]}</span>
              <Toggle on={on} color={ASSET_COLORS[type]} onChange={() => onToggleType(type)} />
            </div>
          )
        })}
      </div>

      {/* Map Overlays */}
      <div style={S.section}>
        <div style={S.sectionHead}>
          <span style={S.label}>Map Overlays</span>
        </div>
        <div style={S.overlayRow} onClick={onToggleHeatmap}>
          <span style={S.overlayIcon}>🔥</span>
          <span style={S.overlayLabel(showHeatmap)}>Asset Heatmap</span>
          <Toggle on={showHeatmap} color="#e67e22" onChange={onToggleHeatmap} />
        </div>
        <div style={S.overlayRow} onClick={onToggleDensity}>
          <span style={S.overlayIcon}>🗺</span>
          <span style={S.overlayLabel(showDensity)}>Population Density</span>
          <Toggle on={showDensity} color="#c0392b" onChange={onToggleDensity} />
        </div>
      </div>

      {/* Ward Filter */}
      <div style={S.section}>
        <div style={S.sectionHead}>
          <span style={S.label}>Highlight Ward</span>
        </div>
        <select
          style={S.select}
          value={selectedWard}
          onChange={(e) => onWardChange(e.target.value)}
        >
          <option value="">All wards</option>
          {(wardScores ?? [])
            .slice()
            .sort((a, b) => a.ward_id - b.ward_id)
            .map((w) => (
              <option key={w.ward_id} value={w.ward_id}>
                Ward {w.ward_id} — {w.ward_name}
              </option>
            ))}
        </select>
        {selectedWard && (
          <button
            onClick={() => onWardChange('')}
            style={{
              marginTop: 6, fontSize: 11, color: '#6b7280', background: 'none',
              border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline',
            }}
          >
            Clear selection
          </button>
        )}
      </div>

      {loading && (
        <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', margin: '4px 0 8px' }}>
          Loading assets…
        </p>
      )}
    </div>
  )
}
