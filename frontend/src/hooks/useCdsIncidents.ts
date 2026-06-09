import { useState, useEffect, useRef } from 'react'
import { getCdsIncidents } from '../services/api'
import type { CdsIncident } from '../types/api'

export function useCdsIncidents(serial: string | null) {
  const [data, setData] = useState<CdsIncident[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [prevSerial, setPrevSerial] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  if (serial !== prevSerial) {
    setPrevSerial(serial)
    setData([])
    setError(null)
    setLoading(false)
  }

  useEffect(() => {
    if (!serial) {
      setData([])
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const fetchData = async () => {
      setLoading(true)
      try {
        const incidents = await getCdsIncidents(serial, controller.signal)
        if (!controller.signal.aborted) {
          setData(incidents)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Error al consultar incidentes de Canal Directo')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void fetchData()
    return () => controller.abort()
  }, [serial])

  return { data, loading, error }
}
