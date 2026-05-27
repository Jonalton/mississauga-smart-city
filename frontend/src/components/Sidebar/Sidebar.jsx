import FilterPanel from './FilterPanel'
import InsightCards from './InsightCards'

const S = {
  sidebar: {
    position: 'absolute', top: 0, left: 0, bottom: 0,
    width: 320, zIndex: 100,
    background: '#fff', boxShadow: '2px 0 12px rgba(0,0,0,0.12)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  header: {
    background: '#1a3a5c', color: '#fff',
    padding: '12px 14px 10px', flexShrink: 0,
  },
  headerTop: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  title: { fontSize: 14, fontWeight: 700, margin: 0, lineHeight: 1.3 },
  subtitle: { fontSize: 11, opacity: 0.65, margin: '3px 0 0' },
  sourcesBtn: {
    fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 4,
    background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
    color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap',
    marginLeft: 8, flexShrink: 0, marginTop: 1,
  },
  nav: {
    display: 'flex', borderBottom: '1px solid #e5e7eb', flexShrink: 0,
  },
  navBtn: (active) => ({
    flex: 1, padding: '9px 8px', border: 'none', cursor: 'pointer',
    background: active ? '#f0f6ff' : '#fff',
    color: active ? '#1a3a5c' : '#6b7280',
    fontWeight: active ? 600 : 400, fontSize: 12,
    borderBottom: active ? '2px solid #1a3a5c' : '2px solid transparent',
    transition: 'all 0.1s',
  }),
  body: {
    flex: 1, overflowY: 'auto', padding: '14px 14px 0',
    scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb transparent',
  },
  footer: {
    padding: '10px 14px', borderTop: '1px solid #e5e7eb', flexShrink: 0,
  },
  nearbyBtn: {
    width: '100%', padding: '10px', border: 'none', borderRadius: 7,
    cursor: 'pointer', fontSize: 13, fontWeight: 600,
    background: '#1a3a5c', color: '#fff',
  },
}

export default function Sidebar({
  activeTypes, onToggleType, onSelectAll, onClearAll,
  selectedWard, onWardChange,
  wardScores, view, onViewChange,
  showHeatmap, onToggleHeatmap,
  showDensity, onToggleDensity,
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
          activeTypes={activeTypes}
          onToggleType={onToggleType}
          onSelectAll={onSelectAll}
          onClearAll={onClearAll}
          selectedWard={selectedWard}
          onWardChange={onWardChange}
          wardScores={wardScores}
          showHeatmap={showHeatmap}
          onToggleHeatmap={onToggleHeatmap}
          showDensity={showDensity}
          onToggleDensity={onToggleDensity}
          loading={assetsLoading}
        />
        <InsightCards wardScores={wardScores} />
      </div>

      <div style={S.footer}>
        <button style={S.nearbyBtn} onClick={onNearbyMe}>
          📍 What's Near Me
        </button>
      </div>
    </div>
  )
}
