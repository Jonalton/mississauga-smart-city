import { ASSET_TYPES, ASSET_LABELS, ASSET_COLORS } from '../../utils/colors'

const S = {
  section: { marginBottom: 16 },
  label: { fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  row: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, cursor: 'pointer' },
  dot: (color, active) => ({
    width: 10, height: 10, borderRadius: '50%',
    background: active ? color : '#ccc', flexShrink: 0,
  }),
  typeLabel: (active) => ({ fontSize: 13, color: active ? '#222' : '#999' }),
  select: {
    width: '100%', padding: '7px 10px', border: '1px solid #ddd',
    borderRadius: 6, fontSize: 13, background: '#fafafa',
  },
  clearBtn: {
    fontSize: 12, color: '#1a3a5c', background: 'none', border: 'none',
    cursor: 'pointer', padding: 0, textDecoration: 'underline',
  },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
}

export default function FilterPanel({ filters, onFiltersChange, wardScores, loading }) {
  const hasFilter = filters.type || filters.ward

  return (
    <div>
      <div style={S.section}>
        <div style={S.sectionHeader}>
          <span style={S.label}>Asset Type</span>
          {hasFilter && (
            <button style={S.clearBtn} onClick={() => onFiltersChange({ type: '', ward: '' })}>
              Clear filters
            </button>
          )}
        </div>
        {ASSET_TYPES.map((type) => {
          const active = !filters.type || filters.type === type
          return (
            <label key={type} style={S.row}>
              <input
                type="radio"
                name="asset-type"
                checked={filters.type === type}
                onChange={() => onFiltersChange({ ...filters, type: filters.type === type ? '' : type })}
                style={{ display: 'none' }}
              />
              <span style={S.dot(ASSET_COLORS[type], active)} />
              <span style={S.typeLabel(active)}>{ASSET_LABELS[type]}</span>
            </label>
          )
        })}
      </div>

      <div style={S.section}>
        <p style={S.label}>Ward</p>
        <select
          style={S.select}
          value={filters.ward}
          onChange={(e) => onFiltersChange({ ...filters, ward: e.target.value })}
        >
          <option value="">All wards</option>
          {(wardScores ?? [])
            .slice()
            .sort((a, b) => a.ward_id - b.ward_id)
            .map((w) => (
              <option key={w.ward_id} value={w.ward_id}>
                {w.ward_name}
              </option>
            ))}
        </select>
      </div>

      {loading && (
        <p style={{ fontSize: 12, color: '#999', textAlign: 'center', marginTop: 4 }}>
          Loading assets…
        </p>
      )}
    </div>
  )
}
