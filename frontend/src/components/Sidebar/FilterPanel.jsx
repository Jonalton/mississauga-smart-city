import { ASSET_TYPES, ASSET_LABELS, ASSET_COLORS } from '../../utils/colors'

const S = {
  section: { marginBottom: 22 },
  sectionHead: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 6,
  },
  sectionLabel: {
    fontSize: 10, fontWeight: 700, color: '#9ca3af',
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  quickLinks: { display: 'flex', gap: 10 },
  quickBtn: {
    fontSize: 10, color: '#6b7280', background: 'none', border: 'none',
    cursor: 'pointer', padding: 0, textDecoration: 'underline',
  },
  checkRow: {
    display: 'flex', alignItems: 'center', gap: 9,
    padding: '6px 0', borderBottom: '1px solid #f3f4f6',
    cursor: 'pointer', userSelect: 'none',
  },
  checkbox: (color) => ({
    width: 15, height: 15, cursor: 'pointer',
    accentColor: color, flexShrink: 0,
    margin: 0,
  }),
  colorDot: (color, checked) => ({
    width: 9, height: 9, borderRadius: '50%',
    background: color, flexShrink: 0,
    opacity: checked ? 1 : 0.25,
    transition: 'opacity 0.15s',
  }),
  rowLabel: (checked) => ({
    flex: 1, fontSize: 13,
    color: checked ? '#111827' : '#9ca3af',
    transition: 'color 0.15s',
  }),
  overlayRow: {
    display: 'flex', alignItems: 'center', gap: 9,
    padding: '6px 0', borderBottom: '1px solid #f3f4f6',
    cursor: 'pointer', userSelect: 'none',
  },
  overlayIcon: { fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0 },
  overlayLabel: (checked) => ({
    flex: 1, fontSize: 13,
    color: checked ? '#111827' : '#9ca3af',
    transition: 'color 0.15s',
  }),
  select: {
    width: '100%', padding: '8px 10px',
    border: '1px solid #e5e7eb', borderRadius: 6,
    fontSize: 13, background: '#fafafa', color: '#374151',
    cursor: 'pointer',
  },
  clearLink: {
    marginTop: 5, fontSize: 11, color: '#6b7280', background: 'none',
    border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline',
    display: 'block',
  },
}

export default function FilterPanel({
  activeTypes, onToggleType, onSelectAll, onClearAll,
  selectedWard, onWardChange,
  wardScores,
  showHeatmap, onToggleHeatmap,
  showDensity, onToggleDensity,
  loading,
}) {
  return (
    <div>
      {/* Asset Layers */}
      <div style={S.section}>
        <div style={S.sectionHead}>
          <span style={S.sectionLabel}>Asset Layers</span>
          <div style={S.quickLinks}>
            <button style={S.quickBtn} onClick={onSelectAll}>All</button>
            <button style={S.quickBtn} onClick={onClearAll}>None</button>
          </div>
        </div>

        {ASSET_TYPES.map((type) => {
          const checked = activeTypes.has(type)
          return (
            <label key={type} style={S.checkRow}>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggleType(type)}
                style={S.checkbox(ASSET_COLORS[type])}
              />
              <span style={S.colorDot(ASSET_COLORS[type], checked)} />
              <span style={S.rowLabel(checked)}>{ASSET_LABELS[type]}</span>
            </label>
          )
        })}
      </div>

      {/* Map Overlays */}
      <div style={S.section}>
        <div style={S.sectionHead}>
          <span style={S.sectionLabel}>Map Overlays</span>
        </div>

        <label style={S.overlayRow}>
          <input
            type="checkbox"
            checked={showHeatmap}
            onChange={onToggleHeatmap}
            style={S.checkbox('#e67e22')}
          />
          <span style={S.overlayIcon}>🔥</span>
          <span style={S.overlayLabel(showHeatmap)}>Asset Heatmap</span>
        </label>

        <label style={S.overlayRow}>
          <input
            type="checkbox"
            checked={showDensity}
            onChange={onToggleDensity}
            style={S.checkbox('#c0392b')}
          />
          <span style={S.overlayIcon}>🗺</span>
          <span style={S.overlayLabel(showDensity)}>Population Density</span>
        </label>
      </div>

      {/* Ward Filter */}
      <div style={S.section}>
        <div style={S.sectionHead}>
          <span style={S.sectionLabel}>Highlight Ward</span>
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
          <button style={S.clearLink} onClick={() => onWardChange('')}>
            Clear selection
          </button>
        )}
      </div>

      {loading && (
        <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', margin: '0 0 8px' }}>
          Loading assets…
        </p>
      )}
    </div>
  )
}
