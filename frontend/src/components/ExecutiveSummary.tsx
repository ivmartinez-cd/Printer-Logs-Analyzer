import { forwardRef, useMemo } from 'react'
import type {
  ParseLogsResponse,
  Incident as ApiIncident,
  EnrichedEvent as ApiEvent,
  ConsumableWarning,
} from '../types/api'

interface ExecutiveSummaryProps {
  result: ParseLogsResponse
  filteredIncidents: ApiIncident[]
  filteredEvents: ApiEvent[]
  consumableWarnings: ConsumableWarning[]
  lastErrorLabel: string | null
  logFileName: string | null
  serialNumber: string | null
}

type HealthVariant = 'critical' | 'watch' | 'ok'

function computeHealthStatus(
  incidents: ApiIncident[],
  lastErrorLabel: string | null
): {
  label: string
  description: string
  variant: HealthVariant
} {
  const critical = incidents.filter((i) => i.severity.toUpperCase() === 'ERROR')
  if (critical.length > 0) {
    const worst = critical[0]
    const desc =
      lastErrorLabel != null
        ? `${worst.code} · último error ${lastErrorLabel}`
        : `${worst.code} · ${worst.occurrences} ocurrencias`
    return { label: 'Crítico', description: desc, variant: 'critical' }
  }

  const warnings = incidents.filter((i) => i.severity.toUpperCase() === 'WARNING')
  if (warnings.length > 0) {
    const desc = `${warnings.length} incidente${warnings.length > 1 ? 's' : ''} en observación`
    return { label: 'En observación', description: desc, variant: 'watch' }
  }

  return {
    label: 'Estable',
    description: 'Sin incidentes críticos registrados',
    variant: 'ok',
  }
}

function computeErrorDensity(events: ApiEvent[]) {
  const counters = events
    .map((e) => e.counter)
    .filter((c) => typeof c === 'number' && Number.isFinite(c))

  if (counters.length < 2) {
    return { label: '—', sub: 'sin datos de contador' }
  }

  const minC = counters.reduce((a, b) => Math.min(a, b))
  const maxC = counters.reduce((a, b) => Math.max(a, b))
  const range = maxC - minC
  if (range <= 0) {
    return { label: '—', sub: 'sin rango de contador' }
  }

  const pagesLabel = `${range.toLocaleString('es-AR')} pág. analizadas`
  const errorEvents = events.filter((e) => e.type.toUpperCase() === 'ERROR')
  if (errorEvents.length === 0) {
    return { label: '0', sub: pagesLabel }
  }

  const thousands = range / 1000
  const density = thousands > 0 ? errorEvents.length / thousands : errorEvents.length
  const label =
    density >= 10
      ? density.toFixed(0)
      : density >= 1
        ? density.toFixed(1)
        : '<1'

  return { label, sub: `errores por 1.000 pág. · ${pagesLabel}` }
}

function formatDateRange(start: string, end: string) {
  const startDate = new Date(start)
  const endDate = new Date(end)
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return '—'
  return `${startDate.toLocaleDateString('es-AR')} – ${endDate.toLocaleDateString('es-AR')}`
}

export const ExecutiveSummary = forwardRef<HTMLDivElement, ExecutiveSummaryProps>(
  (
    {
      result,
      filteredIncidents,
      filteredEvents,
      consumableWarnings,
      lastErrorLabel,
      logFileName,
      serialNumber,
    },
    ref
  ) => {
    const criticalIncidents = filteredIncidents.filter(
      (i) => i.severity.toUpperCase() === 'ERROR'
    )
    const warningIncidents = filteredIncidents.filter(
      (i) => i.severity.toUpperCase() === 'WARNING'
    )
    const infoIncidents = filteredIncidents.filter((i) => i.severity.toUpperCase() === 'INFO')
    const replaceWarnings = consumableWarnings.filter((w) => w.status === 'replace')
    const warningWarnings = consumableWarnings.filter((w) => w.status === 'warning')

    const health = useMemo(
      () => computeHealthStatus(filteredIncidents, lastErrorLabel),
      [filteredIncidents, lastErrorLabel]
    )
    const density = useMemo(() => computeErrorDensity(filteredEvents), [filteredEvents])

    const summaryPoints = useMemo(() => {
      const points: string[] = []

      if (criticalIncidents.length > 0) {
        const top = criticalIncidents[0]
        points.push(
          `El código ${top.code} registró ${top.occurrences} evento${
            top.occurrences !== 1 ? 's' : ''
          } de severidad crítica (${new Date(top.end_time).toLocaleString('es-AR')}).`
        )
      } else if (warningIncidents.length > 0) {
        const top = warningIncidents[0]
        points.push(
          `${top.code} permanece en observación con ${top.occurrences} registro${
            top.occurrences !== 1 ? 's' : ''
          } en el período.`
        )
      } else {
        points.push('Sin incidencias críticas detectadas en la ventana analizada.')
      }

      if (replaceWarnings.length > 0) {
        const list = replaceWarnings
          .slice(0, 2)
          .map((w) => `${w.description} (${Math.round(w.usage_pct)}%)`)
          .join(', ')
        const extra = replaceWarnings.length > 2 ? ` y +${replaceWarnings.length - 2}` : ''
        points.push(`Consumibles fuera de vida útil: ${list}${extra}.`)
      } else if (warningWarnings.length > 0) {
        points.push(
          `${warningWarnings.length} consumible${
            warningWarnings.length !== 1 ? 's' : ''
          } se acerca(n) al límite: ${warningWarnings[0].description}.`
        )
      } else {
        points.push('Sin alertas de consumibles en el período.')
      }

      points.push(
        `Se procesaron ${filteredEvents.length.toLocaleString('es-AR')} eventos entre ${formatDateRange(result.log_start_date, result.log_end_date)}.`
      )

      return points
    }, [
      criticalIncidents,
      warningIncidents,
      replaceWarnings,
      warningWarnings,
      filteredEvents.length,
      result.log_start_date,
      result.log_end_date,
    ])

    const nextSteps = useMemo(() => {
      const steps: Array<{ owner: string; text: string }> = []
      if (replaceWarnings.length > 0) {
        const w = replaceWarnings[0]
        steps.push({
          owner: 'Operaciones',
          text: `Programar reemplazo de ${w.description} (${Math.round(w.usage_pct)}% de uso) y validar historial.`,
        })
      } else if (warningWarnings.length > 0) {
        const w = warningWarnings[0]
        steps.push({
          owner: 'Operaciones',
          text: `Revisar ${w.description} para evitar llegar al 100% de vida útil en el próximo ciclo.`,
        })
      }

      if (criticalIncidents.length > 0) {
        const inc = criticalIncidents[0]
        steps.push({
          owner: 'Soporte técnico',
          text: `Escalar ${inc.code} (${inc.occurrences} ocurrencia${
            inc.occurrences !== 1 ? 's' : ''
          }) y coordinar visita si persiste.`,
        })
      } else if (warningIncidents.length > 0) {
        const inc = warningIncidents[0]
        steps.push({
          owner: 'Soporte técnico',
          text: `Monitorear ${inc.code} y confirmar si reaparece en el próximo log.`,
        })
      }

      if (steps.length === 0) {
        steps.push({
          owner: 'Service Desk',
          text: 'Continuar monitoreo semanal y volver a generar reporte en 7 días.',
        })
      }

      return steps
    }, [replaceWarnings, warningWarnings, criticalIncidents, warningIncidents])

    const contextItems = [
      { label: 'Archivo / Equipo', value: logFileName ?? 'Logs pegados' },
      { label: 'Serie', value: serialNumber ?? '—' },
      {
        label: 'Período',
        value: formatDateRange(result.log_start_date, result.log_end_date),
      },
      {
        label: 'Eventos procesados',
        value: filteredEvents.length.toLocaleString('es-AR'),
      },
    ]

    const consumableRiskCount = replaceWarnings.length + warningWarnings.length

    return (
      <section className="executive-summary" ref={ref}>
        <div className="executive-summary__scorecards">
          <article className="exec-scorecard">
            <span className="exec-scorecard__label">Salud general</span>
            <span className={`exec-scorecard__value exec-scorecard__value--${health.variant}`}>
              {health.label}
            </span>
            <span className="exec-scorecard__sub">{health.description}</span>
          </article>
          <article className="exec-scorecard">
            <span className="exec-scorecard__label">Incidentes críticos</span>
            <span className="exec-scorecard__value">{criticalIncidents.length}</span>
            <span className="exec-scorecard__sub">
              {warningIncidents.length} warning · {infoIncidents.length} info
            </span>
          </article>
          <article className="exec-scorecard">
            <span className="exec-scorecard__label">Consumibles en riesgo</span>
            <span className="exec-scorecard__value">{consumableRiskCount}</span>
            <span className="exec-scorecard__sub">
              {replaceWarnings.length > 0
                ? `${replaceWarnings.length} para reemplazo inmediato`
                : warningWarnings.length > 0
                  ? `${warningWarnings.length} próximos a revisar`
                  : 'Sin alertas activas'}
            </span>
          </article>
          <article className="exec-scorecard">
            <span className="exec-scorecard__label">Errores / 1.000 pág.</span>
            <span className="exec-scorecard__value">{density.label}</span>
            <span className="exec-scorecard__sub">{density.sub}</span>
          </article>
        </div>

        <div className="executive-summary__grid">
          <div className="executive-summary__block">
            <h3>Lo más relevante</h3>
            <ul>
              {summaryPoints.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="executive-summary__block">
            <h3>Próximos pasos sugeridos</h3>
            <ul className="exec-next-steps">
              {nextSteps.map((step, idx) => (
                <li key={`${step.owner}-${idx}`}>
                  <strong>{step.owner}:</strong> {step.text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="executive-summary__context">
          {contextItems.map((item) => (
            <div key={item.label} className="executive-summary__context-item">
              <span className="executive-summary__context-label">{item.label}</span>
              <span className="executive-summary__context-value">{item.value}</span>
            </div>
          ))}
        </div>
      </section>
    )
  }
)

ExecutiveSummary.displayName = 'ExecutiveSummary'
