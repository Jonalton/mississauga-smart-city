import { useState } from 'react'
import { equityScoreColor, ASSET_COLORS } from '../../utils/colors'
import { formatScore, formatCount, formatPopulation } from '../../utils/format'

const COLUMNS = [
  { key: 'rank', label: 'Rank', sortable: true },
  { key: 'ward_name', label: 'Ward', sortable: false },
  { key: 'equity_score', label: 'Equity Score', sortable: true },
  { key: 'asset_count', label: 'Assets', sortable: true },
  { key: 'asset_per_1k_residents', label: 'Per 1k Residents', sortable: true },
  { key: 'population', label: 'Population', sortable: true },
]

const S = {
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13, background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  th: (active) => ({
    padding: '12px 14px', textAlign: 'left', background: '#f0f4fa',
    fontWeight: 600, fontSize: 12, color: active ? '#1a3a5c' : '#666',
    cursor: 'pointer', userSelect: 'none', borderBottom: '1px solid #e0e8f0',
    whiteSpace: 'nowrap',
  }),
  td: { padding: '11px 14px', borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle' },
  row: (hovered) => ({
    background: hovered ? '#f0f6ff' : '#fff', cursor: 'pointer',
    transition: 'background 0.1s',
  }),
  scoreChip: (score) => ({
    display: 'inline-block', padding: '3px 10px', borderRadius: 12,
    background: equityScoreColor(score) + '22',
    color: equityScoreColor(score), fontWeight: 700, fontSize: 13,
  }),
  rankBadge: (rank) => ({
    width: 28, height: 28, borderRadius: '50%', display: 'inline-flex',
    alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
    background: rank <= 3 ? '#1a3a5c' : rank >= 9 ? '#fee' : '#f5f5f5',
    color: rank <= 3 ? '#fff' : rank >= 9 ? '#c0392b' : '#444',
  }),
  flagWrap: { display: 'flex', gap: 4, flexWrap: 'wrap' },
  flag: { fontSize: 10, padding: '2px 6px', borderRadius: 8, background: '#fee', color: '#c0392b' },
}

const FLAG_SHORT = {
  no_air_quality_sensors: 'No AQ',
  no_weather_sensors: 'No Weather',
  critically_low_coverage: 'Critical',
}

export default function EquityTable({ scores, onSelect }) {
  const [sortKey, setSortKey] = useState('rank')
  const [sortAsc, setSortAsc] = useState(true)
  const [hoveredId, setHoveredId] = useState(null)

  const sorted = [...scores].sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey]
    if (typeof av === 'string') return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av)
    return sortAsc ? av - bv : bv - av
  })

  const handleSort = (key) => {
    if (sortKey === key) setSortAsc((a) => !a)
    else { setSortKey(key); setSortAsc(true) }
  }

  return (
    <table style={S.table}>
      <thead>
        <tr>
          {COLUMNS.map((col) => (
            <th
              key={col.key}
              style={S.th(sortKey === col.key)}
              onClick={() => col.sortable && handleSort(col.key)}
            >
              {col.label}
              {col.sortable && sortKey === col.key && (sortAsc ? ' ↑' : ' ↓')}
            </th>
          ))}
          <th style={S.th(false)}>Gap Flags</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((ward) => (
          <tr
            key={ward.ward_id}
            style={S.row(hoveredId === ward.ward_id)}
            onClick={() => onSelect(ward)}
            onMouseEnter={() => setHoveredId(ward.ward_id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <td style={S.td}>
              <span style={S.rankBadge(ward.rank)}>{ward.rank}</span>
            </td>
            <td style={{ ...S.td, fontWeight: 500 }}>{ward.ward_name}</td>
            <td style={S.td}>
              <span style={S.scoreChip(ward.equity_score)}>{formatScore(ward.equity_score)}</span>
            </td>
            <td style={S.td}>{formatCount(ward.asset_count)}</td>
            <td style={S.td}>{formatScore(ward.asset_per_1k_residents)}</td>
            <td style={S.td}>{formatPopulation(ward.population)}</td>
            <td style={S.td}>
              <div style={S.flagWrap}>
                {(ward.gap_flags ?? []).map((f) => (
                  <span key={f} style={S.flag}>{FLAG_SHORT[f] ?? f}</span>
                ))}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
