import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import type { EnrichedEvent } from '../../types/api'
import '../../styles/error-timeline.css'

interface ErrorTimelineProps {
  events: EnrichedEvent[]
  visibleSeverities: Set<string>
  onViewSolution: (code: string, sdsContent?: string | null, sdsUrl?: string | null) => void
}

type DayEvents = {
  date: string
  label: string
  events: EnrichedEvent[]
  counts: { ERROR: number; WARNING: number; INFO: number }
}

function toDateKey(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDayLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

function getSeverity(evt: EnrichedEvent): string {
  return (evt.code_severity || evt.type || 'INFO').toUpperCase()
}

const SEV_COLORS: Record<string, string> = {
  ERROR: '#ef4444',
  WARNING: '#f59e0b',
  INFO: '#3b82f6',
}

const MAX_VISIBLE_EVENTS = 200

export function ErrorTimeline({ events, visibleSeverities, onViewSolution }: ErrorTimelineProps) {
  const pillsRef = useRef<HTMLDivElement>(null)

  const days: DayEvents[] = useMemo(() => {
    const map = new Map<string, EnrichedEvent[]>()
    for (const evt of events) {
      const key = toDateKey(evt.timestamp)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(evt)
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, dayEvents]) => {
        const counts = { ERROR: 0, WARNING: 0, INFO: 0 }
        for (const e of dayEvents) {
          const sev = getSeverity(e)
          if (sev === 'ERROR') counts.ERROR++
          else if (sev === 'WARNING') counts.WARNING++
          else counts.INFO++
        }
        return {
          date,
          label: formatDayLabel(date),
          events: dayEvents.sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          ),
          counts,
        }
      })
  }, [events])

  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const selectedDayIdx = useMemo(() => {
    if (selectedDay !== null) {
      const idx = days.findIndex(d => d.date === selectedDay)
      if (idx !== -1) return idx
    }
    return Math.max(0, days.length - 1)
  }, [days, selectedDay])

  const selectDay = useCallback((idx: number) => {
    setSelectedDay(days[idx]?.date ?? null)
  }, [days])

  useEffect(() => {
    if (!pillsRef.current) return
    const container = pillsRef.current
    const activeBtn = container.querySelector('.error-timeline__day-btn--active') as HTMLElement
    if (activeBtn) {
      const containerRect = container.getBoundingClientRect()
      const btnRect = activeBtn.getBoundingClientRect()
      const relativeLeft = btnRect.left - containerRect.left + container.scrollLeft
      
      container.scrollTo({
        left: relativeLeft - containerRect.width / 2 + btnRect.width / 2,
        behavior: 'smooth'
      })
    }
  }, [selectedDayIdx])

  if (events.length === 0) return null

  const currentDay = days[selectedDayIdx]
  if (!currentDay) return null

  const filtered = currentDay.events.filter(e => visibleSeverities.has(getSeverity(e)))
  const truncated = filtered.length > MAX_VISIBLE_EVENTS
  const visible = truncated ? filtered.slice(0, MAX_VISIBLE_EVENTS) : filtered

  const hourGroups = new Map<number, EnrichedEvent[]>()
  for (const evt of visible) {
    const h = new Date(evt.timestamp).getHours()
    if (!hourGroups.has(h)) hourGroups.set(h, [])
    hourGroups.get(h)!.push(evt)
  }
  const sortedHours = Array.from(hourGroups.entries()).sort(([a], [b]) => a - b)

  const summaryErrors = filtered.filter(e => getSeverity(e) === 'ERROR').length
  const summaryWarnings = filtered.filter(e => getSeverity(e) === 'WARNING').length
  const summaryInfo = filtered.filter(e => getSeverity(e) === 'INFO').length

  return (
    <div className="error-timeline">
      <div className="error-timeline__header">
        <div>
          <h3 className="error-timeline__title">Timeline de Errores</h3>
          <p className="error-timeline__subtitle">
            Secuencia cronológica de eventos — <strong>{currentDay.label}</strong>
            {' '}({filtered.length} evento{filtered.length !== 1 ? 's' : ''})
          </p>
        </div>

        <div className="error-timeline__day-nav">
          <button
            type="button"
            className="error-timeline__day-arrow"
            disabled={selectedDayIdx === 0}
            onClick={() => selectDay(selectedDayIdx - 1)}
            title="Día anterior"
          >
            ‹
          </button>

          <div className="error-timeline__day-pills" ref={pillsRef}>
            {days.map((day, idx) => {
              const hasErrors = day.counts.ERROR > 0
              return (
                <button
                  key={day.date}
                  type="button"
                  className={`error-timeline__day-btn${idx === selectedDayIdx ? ' error-timeline__day-btn--active' : ''}`}
                  onClick={() => selectDay(idx)}
                  style={hasErrors && idx !== selectedDayIdx ? { borderColor: 'rgba(239, 68, 68, 0.3)' } : undefined}
                >
                  {day.label}
                  {hasErrors && (
                    <span style={{ color: '#ef4444', marginLeft: 4, fontSize: '0.65rem' }}>
                      {day.counts.ERROR}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            className="error-timeline__day-arrow"
            disabled={selectedDayIdx === days.length - 1}
            onClick={() => selectDay(selectedDayIdx + 1)}
            title="Día siguiente"
          >
            ›
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="error-timeline__summary">
        {visibleSeverities.has('ERROR') && (
          <div className="error-timeline__summary-item">
            <span className="error-timeline__summary-dot" style={{ background: SEV_COLORS.ERROR }} />
            <span className="error-timeline__summary-count" style={{ color: SEV_COLORS.ERROR }}>{summaryErrors}</span>
            Errores
          </div>
        )}
        {visibleSeverities.has('WARNING') && (
          <div className="error-timeline__summary-item">
            <span className="error-timeline__summary-dot" style={{ background: SEV_COLORS.WARNING }} />
            <span className="error-timeline__summary-count" style={{ color: SEV_COLORS.WARNING }}>{summaryWarnings}</span>
            Warnings
          </div>
        )}
        {visibleSeverities.has('INFO') && (
          <div className="error-timeline__summary-item">
            <span className="error-timeline__summary-dot" style={{ background: SEV_COLORS.INFO }} />
            <span className="error-timeline__summary-count" style={{ color: SEV_COLORS.INFO }}>{summaryInfo}</span>
            Info
          </div>
        )}
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div className="error-timeline__empty">
          Sin eventos del tipo seleccionado para este día
        </div>
      ) : (
        <div className="error-timeline__list">
          {sortedHours.map(([hour, hourEvents]) => (
            <div key={hour} className="error-timeline__hour-group">
              <div className="error-timeline__hour-label">
                {String(hour).padStart(2, '0')}:00
              </div>
              {hourEvents.map((evt, i) => {
                const sev = getSeverity(evt).toLowerCase() as 'error' | 'warning' | 'info'
                return (
                  <div
                    key={`${evt.timestamp}-${evt.code}-${i}`}
                    className={`error-timeline__event error-timeline__event--${sev}`}
                  >
                    <span className="error-timeline__event-time">
                      {formatTime(evt.timestamp)}
                    </span>
                    <button
                      type="button"
                      className={`error-timeline__event-code error-timeline__event-code--${sev}`}
                      onClick={() =>
                        onViewSolution(
                          evt.code,
                          evt.code_solution_content || (evt.code_solution_url ? null : evt.code_description),
                          evt.code_solution_url
                        )
                      }
                      title="Ver solución técnica"
                    >
                      {evt.code}
                    </button>
                    <span className="error-timeline__event-desc">
                      {evt.code_description || '—'}
                    </span>
                    <span className="error-timeline__event-counter">
                      #{evt.counter}
                    </span>
                  </div>
                )
              })}
            </div>
          ))}
          {truncated && (
            <div className="error-timeline__truncated">
              Mostrando los primeros {MAX_VISIBLE_EVENTS} de {filtered.length} eventos
            </div>
          )}
        </div>
      )}
    </div>
  )
}
