import type { EnrichedEvent as ApiEvent, Incident as ApiIncident } from '../types/api'

interface KPICardsProps {
  filteredIncidents: ApiIncident[]
  filteredEvents: ApiEvent[]
  lastErrorEvent: ApiEvent | null
  lastErrorLabel: string | null
}

function computeErrorRate(filteredEvents: ApiEvent[]): {
  label: string
  labelColor?: string
  sub: string
} {
  const counters = filteredEvents
    .map((e) => e.counter)
    .filter((c) => typeof c === 'number' && c > 0)

  if (counters.length < 2) {
    return { label: '—', sub: 'sin datos de contador' }
  }

  const minC = counters.reduce((a, b) => Math.min(a, b))
  const maxC = counters.reduce((a, b) => Math.max(a, b))
  const counterRange = maxC - minC
  const sub = `${counterRange.toLocaleString('es-AR')} páginas en el período`

  if (counterRange === 0) {
    return { label: '—', sub: 'sin rango de contador' }
  }

  const errorCount = filteredEvents.filter((e) => e.type.toUpperCase() === 'ERROR').length

  if (errorCount === 0) {
    return { label: 'Sin errores', labelColor: 'var(--color-success, #22c55e)', sub }
  }

  const pagesPerError = Math.round(counterRange / errorCount)
  const label =
    pagesPerError >= 1 ? `1 c/${pagesPerError.toLocaleString('es-AR')} pág.` : `${errorCount} err.`

  return { label, sub }
}

export function KPICards({
  filteredIncidents,
  filteredEvents,
  lastErrorEvent,
  lastErrorLabel,
}: KPICardsProps) {
  const errorCount = filteredIncidents.filter((i) => i.severity.toUpperCase() === 'ERROR').length
  const warningCount = filteredIncidents.filter(
    (i) => i.severity.toUpperCase() === 'WARNING'
  ).length
  const infoCount = filteredIncidents.filter((i) => i.severity.toUpperCase() === 'INFO').length

  const errorRate = computeErrorRate(filteredEvents)

  return (
    <div className="kpis">
      <div className="kpi-card">
        <div className="kpi-card__label">Estado de errores</div>
        <div className="kpi-card__values">
          <span className="kpi-card__value kpi-card__value--error">{errorCount}</span>
          <span className="kpi-card__values-sep">·</span>
          <span className="kpi-card__value kpi-card__value--warning">{warningCount}</span>
          <span className="kpi-card__values-sep">·</span>
          <span className="kpi-card__value kpi-card__value--info">{infoCount}</span>
        </div>
        <div className="kpi-card__sub">crítico · advertencia · info</div>
      </div>
      <div className="kpi-card">
        <div className="kpi-card__label">Incidencias Activas</div>
        <div className="kpi-card__value">{filteredIncidents.length}</div>
        <div className="kpi-card__sub">incidentes detectados en el log</div>
      </div>
      <div className="kpi-card">
        <div className="kpi-card__label">Último error crítico</div>
        {lastErrorEvent ? (
          <>
            <div
              className="kpi-card__value kpi-card__value--error"
              style={{ fontSize: '1rem', fontWeight: 700 }}
            >
              {lastErrorEvent.code}
            </div>
            <div className="kpi-card__sub">{lastErrorLabel} · último error registrado</div>
          </>
        ) : (
          <>
            <div
              className="kpi-card__value"
              style={{ fontSize: '1rem', color: 'var(--color-success, #22c55e)' }}
            >
              Sin errores
            </div>
            <div className="kpi-card__sub">último error registrado</div>
          </>
        )}
      </div>
      <div className="kpi-card">
        <div className="kpi-card__label">Tasa de errores</div>
        <div
          className="kpi-card__value"
          style={
            errorRate.labelColor
              ? { fontSize: '1rem', color: errorRate.labelColor }
              : { fontSize: errorRate.label === '—' ? '1.5rem' : '0.95rem', fontWeight: 700 }
          }
        >
          {errorRate.label}
        </div>
        <div className="kpi-card__sub">{errorRate.sub}</div>
      </div>
    </div>
  )
}
