import { useState, useEffect, useRef } from 'react'
import { getInsightAlerts, getInsightMeters } from '../services/api'
import type { DeviceAlertsResponse, InsightMeter } from '../types/api'

export function useInsightData(serial: string | null) {
  const [data, setData] = useState<DeviceAlertsResponse | null>(null)
  const [meters, setMeters] = useState<InsightMeter[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [prevSerial, setPrevSerial] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  if (serial !== prevSerial) {
    setPrevSerial(serial)
    setData(null)
    setMeters([])
    setError(null)
    setLoading(false)
  }

  useEffect(() => {
    if (!serial) {
      setData(null)
      setMeters([])
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const fetchData = async () => {
      setLoading(true)
      try {
        const [alertsRes, metersRes] = await Promise.all([
          getInsightAlerts(serial, controller.signal),
          getInsightMeters(serial, controller.signal),
        ])
        
        if (!controller.signal.aborted) {
          setData(alertsRes)
          setMeters(metersRes)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Error al consultar datos del portal')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void fetchData()
    return () => controller.abort()
  }, [serial])

  return { data, meters, loading, error }
}
