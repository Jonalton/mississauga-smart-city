import { equityScoreColor } from '../../utils/colors'
import { formatScore } from '../../utils/format'

const S = {
  section: { marginTop: 8 },
  heading: { fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  card: {
    background: '#f8f9fa', borderRadius: 8, padding: '10px 12px',
    marginBottom: 8, borderLeft: '3px solid #1a3a5c',
  },
  cardTitle: { fontSize: 12, fontWeight: 600, color: '#1a3a5c', marginBottom: 4 },
  wardRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  wardName: { fontSize: 12, color: '#444', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  score: (s) => ({ fontSize: 12, fontWeight: 600, color: equityScoreColor(s), minWidth: 36, textAlign: 'right' }),
  flag: {
    display: 'inline-block', fontSize: 10, padding: '1px 6px',
    borderRadius: 10, background: '#fee', color: '#c0392b',
    marginRight: 4, marginTop: 2,
  },
  emptyState: { fontSize: 12, color: '#aaa', textAlign: 'center', padding: '12px 0' },
}

const FLAG_LABELS = {
  no_air_quality_sensors: 'No AQ sensors',
  no_weather_sensors: 'No weather',
  critically_low_coverage: 'Critical gap',
}

export default function InsightCards({ wardScores }) {
  if (!wardScores || wardScores.length === 0) {
    return (
      <div style={S.section}>
        <p style={S.emptyState}>Loading insights…</p>
      </div>
    )
  }

  const sorted = [...wardScores].sort((a, b) => a.equity_score - b.equity_score)
  const bottom3 = sorted.slice(0, 3)
  const noAirQuality = wardScores.filter((w) => (w.type_breakdown?.air_quality ?? 0) === 0)
  const topWifi = [...wardScores].sort(
    (a, b) => (b.type_breakdown?.wifi ?? 0) - (a.type_breakdown?.wifi ?? 0),
  )[0]

  return (
    <div style={S.section}>
      <p style={S.heading}>Insights</p>

      <div style={S.card}>
        <p style={S.cardTitle}>Least covered wards</p>
        {bottom3.map((w) => (
          <div key={w.ward_id} style={S.wardRow}>
            <span style={S.wardName}>{w.ward_name}</span>
            <span style={S.score(w.equity_score)}>{formatScore(w.equity_score)}</span>
          </div>
        ))}
      </div>

      {noAirQuality.length > 0 && (
        <div style={{ ...S.card, borderLeftColor: '#e74c3c' }}>
          <p style={{ ...S.cardTitle, color: '#c0392b' }}>
            Air quality sensor gaps ({noAirQuality.length} wards)
          </p>
          {noAirQuality.slice(0, 4).map((w) => (
            <div key={w.ward_id} style={S.wardRow}>
              <span style={S.wardName}>{w.ward_name}</span>
              <span style={S.flag}>No AQ sensors</span>
            </div>
          ))}
        </div>
      )}

      {topWifi && (
        <div style={{ ...S.card, borderLeftColor: '#0079c1' }}>
          <p style={{ ...S.cardTitle, color: '#0079c1' }}>Most WiFi hotspots</p>
          <div style={S.wardRow}>
            <span style={S.wardName}>{topWifi.ward_name}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#0079c1' }}>
              {topWifi.type_breakdown?.wifi ?? 0} hotspots
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
