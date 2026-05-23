export function formatScore(score) {
  return typeof score === 'number' ? score.toFixed(1) : '—'
}

export function formatCount(n) {
  return typeof n === 'number' ? n.toLocaleString() : '—'
}

export function formatDate(isoString) {
  if (!isoString || isoString === 'None' || isoString === 'null') return null
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatRelativeTime(isoString) {
  if (!isoString) return 'Unknown'
  const diff = Date.now() - new Date(isoString).getTime()
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function formatPopulation(n) {
  if (!n) return '—'
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}
