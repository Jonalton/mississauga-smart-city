import { useState, useEffect } from 'react'
import { API_BASE, STALE_DATA_THRESHOLD_HOURS } from '../config'

export function useMeta() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isStale, setIsStale] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`${API_BASE}/api/meta`)
      .then((res) => res.ok ? res.json() : null)
      .then((json) => {
        if (!cancelled && json) {
          setData(json)
          const ageHours = (Date.now() - new Date(json.last_updated).getTime()) / 3_600_000
          setIsStale(ageHours > STALE_DATA_THRESHOLD_HOURS)
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { data, loading, isStale }
}
