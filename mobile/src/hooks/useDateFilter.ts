import { useMemo, useState, useCallback } from 'react'
import type { EnrichedEvent, Incident } from '../types/api'
import { formatYMD, parseDateRange, type DateSelection } from '../utils/date'

interface DateItem {
  id: string
  name: string
  detail?: string
}

/**
 * Gestiona el filtro de fecha del análisis: estado, presets, items para el
 * selector y los incidentes/eventos filtrados por el rango elegido.
 */
export function useDateFilter(incidents: Incident[], events: EnrichedEvent[]) {
  const [selectedDate, setSelectedDate] = useState<DateSelection | null>(null)

  const handleDateSelect = useCallback((item: { id: string }) => {
    if (item.id === 'divider') return

    if (item.id === 'all') {
      setSelectedDate(null)
    } else if (item.id === 'today') {
      const s = formatYMD(new Date())
      setSelectedDate({ start: s, end: s })
    } else if (item.id === 'this_week') {
      const now = new Date()
      const day = now.getDay()
      const diff = day === 0 ? -6 : 1 - day
      const monday = new Date(now)
      monday.setDate(now.getDate() + diff)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      setSelectedDate({ start: formatYMD(monday), end: formatYMD(sunday) })
    } else if (item.id === 'last_week') {
      const now = new Date()
      const day = now.getDay()
      const diff = day === 0 ? -13 : 1 - day - 7
      const monday = new Date(now)
      monday.setDate(now.getDate() + diff)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      setSelectedDate({ start: formatYMD(monday), end: formatYMD(sunday) })
    } else if (item.id === 'this_month') {
      const now = new Date()
      const first = new Date(now.getFullYear(), now.getMonth(), 1)
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      setSelectedDate({ start: formatYMD(first), end: formatYMD(last) })
    } else if (item.id === 'last_month') {
      const now = new Date()
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const last = new Date(now.getFullYear(), now.getMonth(), 0)
      setSelectedDate({ start: formatYMD(first), end: formatYMD(last) })
    } else if (item.id === 'last_7_days') {
      const today = new Date()
      const start = new Date(today)
      start.setDate(today.getDate() - 6)
      setSelectedDate({ start: formatYMD(start), end: formatYMD(today) })
    } else if (item.id === 'last_30_days') {
      const today = new Date()
      const start = new Date(today)
      start.setDate(today.getDate() - 29)
      setSelectedDate({ start: formatYMD(start), end: formatYMD(today) })
    } else if (item.id.startsWith('day:')) {
      setSelectedDate(item.id.substring(4))
    }
  }, [])

  // Fechas únicas presentes en los logs (YYYY-MM-DD), descendentes
  const uniqueDates = useMemo(() => {
    if (events.length === 0) return []
    const datesSet = new Set<string>()
    for (const e of events) {
      if (e.timestamp) {
        const dateStr = e.timestamp.split('T')[0]
        if (dateStr) datesSet.add(dateStr)
      }
    }
    return Array.from(datesSet).sort((a, b) => b.localeCompare(a))
  }, [events])

  const dateItems = useMemo<DateItem[]>(() => {
    const items: DateItem[] = [
      { id: 'all', name: 'Todo el período', detail: 'Mostrar todos los eventos' },
      { id: 'today', name: 'Hoy', detail: 'Filtrar por el día de hoy' },
      { id: 'this_week', name: 'Esta semana', detail: 'De lunes a domingo' },
      { id: 'last_week', name: 'Semana anterior', detail: 'Semana pasada completa' },
      { id: 'this_month', name: 'Este mes', detail: 'Mes en curso' },
      { id: 'last_month', name: 'Mes anterior', detail: 'Mes pasado completo' },
      { id: 'last_7_days', name: 'Últimos 7 días', detail: 'Últimos 7 días corridos' },
      { id: 'last_30_days', name: 'Últimos 30 días', detail: 'Últimos 30 días corridos' },
    ]
    if (uniqueDates.length > 0) {
      items.push({ id: 'divider', name: '— Días Específicos del Log —', detail: undefined })
      for (const d of uniqueDates) {
        const [y, m, dayNum] = d.split('-').map(Number)
        const formatted = new Date(y, m - 1, dayNum).toLocaleDateString('es-AR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
        items.push({ id: `day:${d}`, name: formatted, detail: `Filtrar por el día ${formatted}` })
      }
    }
    return items
  }, [uniqueDates])

  const dateButtonLabel = useMemo(() => {
    if (!selectedDate) return 'Todo el período'
    const fmtShort = (s: string) => {
      const [y, m, d] = s.split('-').map(Number)
      return new Date(y, m - 1, d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
    }
    if (typeof selectedDate === 'string') return fmtShort(selectedDate)
    return `${fmtShort(selectedDate.start)} – ${fmtShort(selectedDate.end)}`
  }, [selectedDate])

  const dateFilteredIncidents = useMemo(() => {
    if (!selectedDate) return incidents
    const { startTs, endTs } = parseDateRange(selectedDate)
    return incidents.filter(i =>
      i.events.some(e => {
        if (!e.timestamp) return false
        const t = new Date(e.timestamp).getTime()
        return t >= startTs && t <= endTs
      })
    )
  }, [incidents, selectedDate])

  const dateFilteredEvents = useMemo(() => {
    if (!selectedDate) return events
    const { startTs, endTs } = parseDateRange(selectedDate)
    return events.filter(e => {
      if (!e.timestamp) return false
      const t = new Date(e.timestamp).getTime()
      return t >= startTs && t <= endTs
    })
  }, [events, selectedDate])

  return {
    selectedDate,
    setSelectedDate,
    handleDateSelect,
    dateItems,
    dateButtonLabel,
    dateFilteredIncidents,
    dateFilteredEvents,
  }
}
