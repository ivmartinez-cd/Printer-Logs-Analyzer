import { useMemo } from 'react'
import type { EnrichedEvent, Incident } from '../types/api'

/**
 * Calcula los KPIs del panel de errores a partir de los incidentes y eventos
 * ya filtrados por fecha.
 */
export function useAnalyzerKpis(incidents: Incident[], events: EnrichedEvent[]) {
  const errorIncidents = useMemo(
    () => incidents.filter(i => i.severity.toUpperCase() === 'ERROR'),
    [incidents]
  )

  const warningCount = useMemo(
    () => incidents.filter(i => i.severity.toUpperCase() === 'WARNING').length,
    [incidents]
  )

  const infoCount = useMemo(
    () => incidents.filter(i => i.severity.toUpperCase() === 'INFO').length,
    [incidents]
  )

  const lastErrorEvent = useMemo(() => {
    const errorEvents = events.filter(e => e.type.toUpperCase() === 'ERROR')
    if (errorEvents.length === 0) return null
    return [...errorEvents].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
  }, [events])

  const lastErrorLabel = useMemo(() => {
    if (!lastErrorEvent) return null
    return new Date(lastErrorEvent.timestamp).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }, [lastErrorEvent])

  const topCodes = useMemo(() => {
    const map = new Map<string, { count: number; severity: string }>()
    for (const inc of incidents) {
      const existing = map.get(inc.code)
      if (existing) {
        existing.count += inc.occurrences
      } else {
        map.set(inc.code, { count: inc.occurrences, severity: inc.severity })
      }
    }
    return Array.from(map.entries())
      .map(([name, { count, severity }]) => ({ name, count, severity }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [incidents])

  const errorRateData = useMemo(() => {
    const errorEvents = events.filter((e) => e.type.toUpperCase() === 'ERROR')
    const errorCount = errorEvents.length

    const counters = events
      .map((e) => e.counter)
      .filter((c) => typeof c === 'number' && c > 0)

    if (counters.length < 2) {
      return { label: '—', sub: 'sin datos', totalIntervalPages: 0, maxCounter: 0 }
    }

    const minC = counters.reduce((a, b) => Math.min(a, b))
    const maxC = counters.reduce((a, b) => Math.max(a, b))
    const counterRange = maxC - minC

    if (counterRange === 0) {
      return { label: '—', sub: 'sin rango', totalIntervalPages: 0, maxCounter: maxC }
    }

    if (errorCount === 0) {
      return {
        label: 'Sin err.',
        sub: 'no hay errores',
        totalIntervalPages: counterRange,
        maxCounter: maxC,
      }
    }

    const freq: Record<string, number> = {}
    for (const e of errorEvents) {
      freq[e.code] = (freq[e.code] ?? 0) + 1
    }
    const topCode = Object.entries(freq).reduce((a, b) => (b[1] > a[1] ? b : a))[0]

    const pagesPerError = Math.round(counterRange / errorCount)
    const label = pagesPerError >= 1 ? `1 c/${pagesPerError.toLocaleString('es-AR')} pág.` : `${errorCount} err.`

    return { label, sub: topCode, totalIntervalPages: counterRange, maxCounter: maxC }
  }, [events])

  return {
    errorIncidents,
    warningCount,
    infoCount,
    lastErrorEvent,
    lastErrorLabel,
    topCodes,
    errorRateData,
  }
}
