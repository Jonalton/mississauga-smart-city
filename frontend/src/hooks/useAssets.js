import { useState, useEffect, useCallback, useRef } from 'react'
import { API_BASE } from '../config'

export function useAssets(filters = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)

  const load = useCallback(async () => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filters.type) params.set('type', filters.type)
      if (filters.ward) params.set('ward', String(filters.ward))
      if (filters.bbox) params.set('bbox', filters.bbox)
      const res = await fetch(`${API_BASE}/api/assets?${params}`, { signal: ctrl.signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData(await res.json())
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [filters.type, filters.ward, filters.bbox])

  useEffect(() => { load() }, [load])

  return { data, loading, error, refetch: load }
}
