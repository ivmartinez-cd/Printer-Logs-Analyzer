import { useState, useEffect, useRef } from 'react'
import type { Event as ApiEvent, Incident as ApiIncident } from '../types/api'

/**
 * DateFilter:
 *   null                          → Todo el log
 *   "YYYY-MM-DD"                  → solo ese día
 *   { start: "YYYY-MM-DD", end }  → rango de semana (lunes–domingo)
 */
export type DateFilter = string | { start: string; end: string } | null

export function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'short',
      timeStyle: 'medium',
    })
  } catch {
    return iso
  }
}

export function getWindowForDate(
  events: ApiEvent[],
  filter: DateFilter
): { minTs: number; maxTs: number } | null {
  if (events.length === 0) return null
  const times = events.map((e) => new Date(e.timestamp).getTime()).filter((t) => !Number.isNaN(t))
  if (times.length === 0) return null
  const minTs = Math.min(...times)
  const maxTs = Math.max(...times)
  if (!filter) return { minTs, maxTs }
  if (typeof filter === 'string') {
    const [y, m, d] = filter.split('-').map(Number)
    return {
      minTs: new Date(y, m - 1, d, 0, 0, 0, 0).getTime(),
      maxTs: new Date(y, m - 1, d, 23, 59, 59, 999).getTime(),
    }
  }
  const [sy, sm, sd] = filter.start.split('-').map(Number)
  const [ey, em, ed] = filter.end.split('-').map(Number)
  return {
    minTs: new Date(sy, sm - 1, sd, 0, 0, 0, 0).getTime(),
    maxTs: new Date(ey, em - 1, ed, 23, 59, 59, 999).getTime(),
  }
}

export function getWeekRange(date: Date): { start: string; end: string } {
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(date)
  monday.setDate(date.getDate() + diff)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return { start: fmt(monday), end: fmt(sunday) }
}

export function formatWeekRange(range: { start: string; end: string }): string {
  const fmt = (s: string) => {
    const [y, m, d] = s.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }
  return `${fmt(range.start)} – ${fmt(range.end)}`
}

export function weekInputToRange(weekStr: string): { start: string; end: string } {
  // weekStr format: "2024-W12"
  const match = weekStr.match(/^(\d{4})-W(\d{2})$/)
  if (!match) return getWeekRange(new Date())
  const year = Number(match[1])
  const week = Number(match[2])
  // ISO 8601: Jan 4th is always in week 1; find that week's Monday
  const jan4 = new Date(year, 0, 4)
  const jan4Day = (jan4.getDay() + 6) % 7 // Mon=0
  const monday = new Date(jan4)
  monday.setDate(jan4.getDate() - jan4Day + (week - 1) * 7)
  return getWeekRange(monday)
}

export function formatDayFilter(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

/** Rango de fechas del log en formato YYYY-MM-DD para min/max del input date. */
export function getDateRangeFromEvents(
  events: ApiEvent[]
): { minDate: string; maxDate: string } | null {
  if (events.length === 0) return null
  const dates = events
    .map((e) => {
      const d = new Date(e.timestamp)
      return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
    })
    .filter((n) => !Number.isNaN(n))
  if (dates.length === 0) return null
  const min = Math.min(...dates)
  const max = Math.max(...dates)
  const toStr = (n: number) => {
    const y = Math.floor(n / 10000)
    const mo = Math.floor((n % 10000) / 100)
    const d = n % 100
    return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }
  return { minDate: toStr(min), maxDate: toStr(max) }
}

export function filterEventsByDate(events: ApiEvent[], selectedDate: DateFilter): ApiEvent[] {
  const window = getWindowForDate(events, selectedDate)
  if (!window) return []
  const { minTs, maxTs } = window
  return events.filter((e) => {
    const t = new Date(e.timestamp).getTime()
    return !Number.isNaN(t) && t >= minTs && t <= maxTs
  })
}

export function filterIncidentsByDate(
  incidents: ApiIncident[],
  events: ApiEvent[],
  selectedDate: DateFilter
): ApiIncident[] {
  const window = getWindowForDate(events, selectedDate)
  if (!window) return []
  const { minTs, maxTs } = window
  return incidents.filter((inc) =>
    inc.events.some((e) => {
      const t = new Date(e.timestamp).getTime()
      return !Number.isNaN(t) && t >= minTs && t <= maxTs
    })
  )
}

export function useDateFilter() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedWeekRange, setSelectedWeekRange] = useState<{
    start: string
    end: string
  } | null>(null)
  const [weekPickerOpen, setWeekPickerOpen] = useState(false)
  const weekPickerRef = useRef<HTMLDivElement>(null)
  const [dayPickerOpen, setDayPickerOpen] = useState(false)
  const dayPickerRef = useRef<HTMLDivElement>(null)

  const activeFilter: DateFilter = selectedWeekRange ?? selectedDate

  useEffect(() => {
    if (!weekPickerOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (weekPickerRef.current && !weekPickerRef.current.contains(e.target as Node)) {
        setWeekPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [weekPickerOpen])

  useEffect(() => {
    if (!dayPickerOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (dayPickerRef.current && !dayPickerRef.current.contains(e.target as Node)) {
        setDayPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dayPickerOpen])

  function reset() {
    setSelectedDate(null)
    setSelectedWeekRange(null)
  }

  return {
    selectedDate,
    setSelectedDate,
    selectedWeekRange,
    setSelectedWeekRange,
    weekPickerOpen,
    setWeekPickerOpen,
    weekPickerRef,
    dayPickerOpen,
    setDayPickerOpen,
    dayPickerRef,
    activeFilter,
    reset,
  }
}
