import { useState } from 'react'
import EquityTable from './EquityTable'
import WardDetail from './WardDetail'

const S = {
  container: {
    position: 'absolute', inset: 0, background: '#f5f7fa',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    paddingLeft: 320, // sidebar width
  },
  header: {
    background: '#1a3a5c', color: '#fff',
    padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    flexShrink: 0,
  },
  title: { fontSize: 18, fontWeight: 700, margin: 0 },
  closeBtn: {
    background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
    padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13,
  },
  body: { flex: 1, overflow: 'auto', padding: '24px' },
  emptyState: { textAlign: 'center', color: '#999', marginTop: 60, fontSize: 15 },
}

export default function WardDashboard({ scores, onClose }) {
  const [selectedWard, setSelectedWard] = useState(null)

  if (!scores) {
    return (
      <div style={S.container}>
        <div style={S.header}>
          <h1 style={S.title}>Ward Equity Rankings</h1>
          <button style={S.closeBtn} onClick={onClose}>← Back to Map</button>
        </div>
        <p style={S.emptyState}>Loading ward data…</p>
      </div>
    )
  }

  return (
    <div style={S.container}>
      <div style={S.header}>
        <h1 style={S.title}>
          Ward Equity Rankings
          <span style={{ fontSize: 13, fontWeight: 400, opacity: 0.75, marginLeft: 12 }}>
            {scores.length} wards
          </span>
        </h1>
        <button style={S.closeBtn} onClick={onClose}>← Back to Map</button>
      </div>

      <div style={S.body}>
        {selectedWard ? (
          <WardDetail
            ward={selectedWard}
            onBack={() => setSelectedWard(null)}
            allScores={scores}
          />
        ) : (
          <EquityTable scores={scores} onSelect={setSelectedWard} />
        )}
      </div>
    </div>
  )
}
