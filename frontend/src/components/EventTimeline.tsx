import React from 'react'
import type { Event } from '../types/api'

interface EventTimelineProps {
  events: Event[]
}

function getSeverityForEvent(evt: Event): 'info' | 'warning' | 'error' {
  const t = (evt.type || '').toUpperCase()
  if (t === 'ERROR') return 'error'
  if (t === 'WARNING') return 'warning'
  return 'info'
}

export function EventTimeline({ events }: EventTimelineProps) {
  if (!events.length) return null

  const sorted = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
  const minTs = new Date(sorted[0].timestamp).getTime()
  const maxTs = new Date(sorted[sorted.length - 1].timestamp).getTime()
  const span = maxTs - minTs || 1

  return (
    <div className="event-timeline">
      <div className="event-timeline__track">
          {sorted.map((evt) => {
            const ts = new Date(evt.timestamp).getTime()
            const position = ((ts - minTs) / span) * 100
            const sev = getSeverityForEvent(evt)
            const title = [
              `Código: ${evt.code}`,
              `Timestamp: ${evt.timestamp}`,
              `Contador: ${evt.counter}`,
              `Firmware: ${evt.firmware ?? '—'}`,
              `Ayuda: ${evt.help_reference ?? '—'}`,
            ].join('\n')

            return (
              <button
                key={`${evt.timestamp}-${evt.code}-${evt.counter}`}
                type="button"
                className={`event-timeline__point event-timeline__point--${sev}`}
                style={{ left: `${position}%` }}
                title={title}
              />
            )
          })}
      </div>
    </div>
  )
}

