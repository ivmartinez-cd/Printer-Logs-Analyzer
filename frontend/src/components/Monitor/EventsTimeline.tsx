import type { EnrichedEvent as ApiEvent } from '../../types/api'
import { recentEvents } from './healthMetrics'

interface EventsTimelineProps {
  events: ApiEvent[]
}

function sevClass(type: string): 'error' | 'warn' | 'info' {
  const t = (type || '').toUpperCase()
  if (t === 'ERROR') return 'error'
  if (t === 'WARNING') return 'warn'
  return 'info'
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function EventsTimeline({ events }: EventsTimelineProps) {
  const items = recentEvents(events, 12)

  return (
    <section className="noc-timeline">
      <div className="noc-timeline__head">
        <h3 className="noc-timeline__title">Timeline de eventos</h3>
        <span className="noc-timeline__count">Últimos {items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="noc-timeline__empty">Sin eventos en el período.</p>
      ) : (
        <ol className="noc-timeline__list">
          {items.map((e, i) => {
            const sev = sevClass(e.type)
            const itemClass = 'noc-timeline__item noc-timeline__item--' + sev
            return (
              <li key={i} className={itemClass}>
                <span className="noc-timeline__dot" aria-hidden="true" />
                <time className="noc-timeline__time">{formatTime(e.timestamp)}</time>
                <span className="noc-timeline__body">
                  <span className="noc-timeline__code">{e.code}</span>
                  <span className="noc-timeline__desc">{e.code_description || e.type}</span>
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
