import { useState, useEffect } from 'react'
import { API_BASE } from '../config'

export function useNearby(coords, radiusM = 500) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!coords) return
    let cancelled = false
    setLoading(true)
    setError(null)
    setData(null)
    fetch(`${API_BASE}/api/nearby?lat=${coords.lat}&lng=${coords.lng}&radius=${radiusM}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((json) => { if (!cancelled) setData(json) })
      .catch((e) => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [coords?.lat, coords?.lng, radiusM])

  return { data, loading, error }
}
