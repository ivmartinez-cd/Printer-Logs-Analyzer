import { recentEvents } from './healthMetrics'

export interface TimelineItem {
  timestamp: string
  code: string
  /** ERROR | WARNING | INFO */
  severity: string
  description: string
}

interface EventsTimelineProps {
  items: TimelineItem[]
}

function sevClass(severity: string): 'error' | 'warn' | 'info' {
  const t = (severity || '').toUpperCase()
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

export function EventsTimeline({ items }: EventsTimelineProps) {
  const sorted = recentEvents(items, 12)

  return (
    <section className="noc-timeline">
      <div className="noc-timeline__head">
        <h3 className="noc-timeline__title">Timeline de eventos</h3>
        <span className="noc-timeline__count">Últimos {sorted.length}</span>
      </div>
      {sorted.length === 0 ? (
        <p className="noc-timeline__empty">Sin eventos en el período.</p>
      ) : (
        <ol className="noc-timeline__list">
          {sorted.map((e, i) => {
            const sev = sevClass(e.severity)
            const itemClass = 'noc-timeline__item noc-timeline__item--' + sev
            return (
              <li key={i} className={itemClass}>
                <span className="noc-timeline__dot" aria-hidden="true" />
                <time className="noc-timeline__time">{formatTime(e.timestamp)}</time>
                <span className="noc-timeline__body">
                  <span className="noc-timeline__code">{e.code}</span>
                  <span className="noc-timeline__desc">{e.description}</span>
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
