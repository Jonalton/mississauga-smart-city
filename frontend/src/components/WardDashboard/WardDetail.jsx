import { equityScoreColor, ASSET_COLORS, ASSET_LABELS } from '../../utils/colors'
import { formatScore, formatCount, formatPopulation } from '../../utils/format'

const FLAG_DESCRIPTIONS = {
  no_air_quality_sensors: 'No air quality sensors deployed in this ward.',
  no_weather_sensors: 'No road weather stations deployed in this ward.',
  critically_low_coverage: 'Fewer than 0.3 assets per 1,000 residents — critically underserved.',
}

const S = {
  backBtn: { background: 'none', border: 'none', color: '#1a3a5c', cursor: 'pointer', fontSize: 14, padding: '0 0 16px', fontWeight: 500 },
  header: { display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 24 },
  wardName: { fontSize: 22, fontWeight: 700, color: '#1a3a5c', margin: 0 },
  scoreBig: (s) => ({ fontSize: 40, fontWeight: 800, color: equityScoreColor(s), lineHeight: 1 }),
  scoreLabel: { fontSize: 12, color: '#999', marginTop: 2 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 },
  statCard: { background: '#f8f9fa', borderRadius: 8, padding: '12px 14px' },
  statValue: { fontSize: 20, fontWeight: 700, color: '#222', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: 0.4 },
  sectionTitle: { fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.4 },
  typeRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  typeDot: (color) => ({ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }),
  typeLabel: { fontSize: 13, color: '#444', flex: 1 },
  typeCount: { fontSize: 13, fontWeight: 600, color: '#222', minWidth: 30, textAlign: 'right' },
  barWrap: { flex: 1, height: 6, background: '#eee', borderRadius: 3, overflow: 'hidden', margin: '0 8px' },
  bar: (pct, color) => ({ width: `${pct}%`, height: '100%', background: color, borderRadius: 3 }),
  flagCard: { background: '#fff3f3', border: '1px solid #fcc', borderRadius: 8, padding: '10px 14px', marginBottom: 8 },
  flagTitle: { fontSize: 13, fontWeight: 600, color: '#c0392b', marginBottom: 2 },
  flagDesc: { fontSize: 12, color: '#666' },
}

export default function WardDetail({ ward, onBack, allScores }) {
  const totalAssets = allScores.reduce((sum, w) => sum + w.asset_count, 0)
  const maxType = Math.max(...Object.values(ward.type_breakdown ?? {}), 1)

  return (
    <div>
      <button style={S.backBtn} onClick={onBack}>← All wards</button>

      <div style={S.header}>
        <div style={{ flex: 1 }}>
          <h2 style={S.wardName}>{ward.ward_name}</h2>
          <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
            Rank #{ward.rank} of {allScores.length} · {formatPopulation(ward.population)} residents · {ward.area_km2} km²
          </p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={S.scoreBig(ward.equity_score)}>{formatScore(ward.equity_score)}</div>
          <div style={S.scoreLabel}>Equity Score</div>
        </div>
      </div>

      <div style={S.grid}>
        <div style={S.statCard}>
          <div style={S.statValue}>{formatCount(ward.asset_count)}</div>
          <div style={S.statLabel}>Total assets</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statValue}>{formatScore(ward.asset_per_km2)}</div>
          <div style={S.statLabel}>Assets / km²</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statValue}>{formatScore(ward.asset_per_1k_residents)}</div>
          <div style={S.statLabel}>Assets / 1k residents</div>
        </div>
      </div>

      <p style={S.sectionTitle}>Asset breakdown</p>
      {Object.entries(ward.type_breakdown ?? {}).map(([type, count]) => (
        <div key={type} style={S.typeRow}>
          <span style={S.typeDot(ASSET_COLORS[type] ?? '#999')} />
          <span style={S.typeLabel}>{ASSET_LABELS[type] ?? type}</span>
          <div style={S.barWrap}>
            <div style={S.bar((count / maxType) * 100, ASSET_COLORS[type] ?? '#999')} />
          </div>
          <span style={S.typeCount}>{count}</span>
        </div>
      ))}

      {ward.gap_flags?.length > 0 && (
        <>
          <p style={{ ...S.sectionTitle, marginTop: 20 }}>Gap flags</p>
          {ward.gap_flags.map((flag) => (
            <div key={flag} style={S.flagCard}>
              <p style={S.flagTitle}>{flag.replace(/_/g, ' ')}</p>
              <p style={S.flagDesc}>{FLAG_DESCRIPTIONS[flag] ?? 'Coverage gap identified.'}</p>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
