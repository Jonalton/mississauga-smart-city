import FilterPanel from './FilterPanel'
import InsightCards from './InsightCards'

const S = {
  sidebar: {
    position: 'absolute', top: 0, left: 0, bottom: 0,
    width: 320, zIndex: 100,
    background: '#fff', boxShadow: '2px 0 12px rgba(0,0,0,0.15)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  header: {
    background: '#1a3a5c', color: '#fff',
    padding: '14px 16px 10px',
    flexShrink: 0,
  },
  headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 15, fontWeight: 700, margin: 0 },
  subtitle: { fontSize: 11, opacity: 0.75, margin: '2px 0 0' },
  sourcesBtn: {
    fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 4,
    background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
    color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap', marginLeft: 8, flexShrink: 0,
  },
  nav: {
    display: 'flex', borderBottom: '1px solid #e8e8e8',
    flexShrink: 0,
  },
  navBtn: (active) => ({
    flex: 1, padding: '10px 8px', border: 'none', cursor: 'pointer',
    background: active ? '#f0f6ff' : '#fff',
    color: active ? '#1a3a5c' : '#666',
    fontWeight: active ? 600 : 400, fontSize: 13,
    borderBottom: active ? '2px solid #1a3a5c' : '2px solid transparent',
  }),
  body: { flex: 1, overflowY: 'auto', padding: '12px' },
  footer: {
    padding: '10px 12px', borderTop: '1px solid #e8e8e8',
    display: 'flex', gap: 8, flexShrink: 0,
  },
  btn: (variant) => ({
    flex: 1, padding: '9px 12px', border: 'none', borderRadius: 6,
    cursor: 'pointer', fontSize: 13, fontWeight: 500,
    background: variant === 'primary' ? '#1a3a5c' : '#f0f0f0',
    color: variant === 'primary' ? '#fff' : '#333',
  }),
}

export default function Sidebar({
  filters, onFiltersChange, wardScores, view, onViewChange,
  showHeatmap, onToggleHeatmap, showDensity, onToggleDensity,
  onNearbyMe, assetsLoading,
}) {
  return (
    <div style={S.sidebar}>
      <div style={S.header}>
        <div style={S.headerTop}>
          <p style={S.title}>Mississauga Smart City Monitor</p>
          <button style={S.sourcesBtn} onClick={() => onViewChange('sources')}>
            Data Sources
          </button>
        </div>
        <p style={S.subtitle}>Infrastructure equity across 11 wards</p>
      </div>

      <div style={S.nav}>
        <button style={S.navBtn(view === 'map')} onClick={() => onViewChange('map')}>
          Map View
        </button>
        <button style={S.navBtn(view === 'dashboard')} onClick={() => onViewChange('dashboard')}>
          Ward Rankings
        </button>
      </div>

      <div style={S.body}>
        <FilterPanel
          filters={filters}
          onFiltersChange={onFiltersChange}
          wardScores={wardScores}
          showHeatmap={showHeatmap}
          onToggleHeatmap={onToggleHeatmap}
          loading={assetsLoading}
        />
        <InsightCards wardScores={wardScores} />
      </div>

      <div style={S.footer}>
        <button style={S.btn('primary')} onClick={onNearbyMe}>
          📍 What's Near Me
        </button>
        <button
          style={{ ...S.btn('secondary'), background: showHeatmap ? '#dbeafe' : '#f0f0f0' }}
          onClick={onToggleHeatmap}
        >
          {showHeatmap ? 'Heatmap On' : 'Heatmap Off'}
        </button>
        <button
          style={{ ...S.btn('secondary'), background: showDensity ? '#fef3c7' : '#f0f0f0' }}
          onClick={onToggleDensity}
        >
          {showDensity ? 'Density On' : 'Density Off'}
        </button>
      </div>
    </div>
  )
}
