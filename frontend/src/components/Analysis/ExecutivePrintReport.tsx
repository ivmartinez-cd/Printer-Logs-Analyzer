import { forwardRef, useMemo } from 'react'
import type {
  EnrichedEvent as ApiEvent,
  Incident as ApiIncident,
  ParseLogsResponse,
  RealtimeConsumable,
  AIPdfSummaryResponse,
} from '../../types/api'
import type { IncidentRow } from '../Parser/IncidentsTable'
import styles from './ExecutivePrintReport.module.css'

interface TopCodeSummary {
  name: string
  count: number
  severity: string
}

interface ExecutivePrintReportProps {
  result: ParseLogsResponse
  filteredIncidents: ApiIncident[]
  filteredEvents: ApiEvent[]
  consumableWarnings: RealtimeConsumable[]
  lastErrorLabel: string | null
  logFileName: string | null
  serialNumber: string | null
  modelName: string | null
  topCodes: TopCodeSummary[]
  incidentRows: IncidentRow[]
  generatedAtIso: string
  aiSummary?: AIPdfSummaryResponse | null
}

type ReportTone = 'critical' | 'watch' | 'ok'

interface ExecutiveAction {
  priority: string
  owner: string
  due: string
  text: string
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('es-AR')
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatNumber(value: number) {
  return value.toLocaleString('es-AR')
}

function formatDateRange(start: string, end: string) {
  return `${formatDate(start)} - ${formatDate(end)}`
}

function computeErrorDensity(events: ApiEvent[]) {
  const counters = events
    .map((event) => event.counter)
    .filter((counter) => typeof counter === 'number' && Number.isFinite(counter))

  if (counters.length < 2) {
    return { label: 'N/A', detail: 'Sin rango util de contador' }
  }

  const minCounter = counters.reduce((min, current) => Math.min(min, current))
  const maxCounter = counters.reduce((max, current) => Math.max(max, current))
  const range = maxCounter - minCounter

  if (range <= 0) {
    return { label: 'N/A', detail: 'Sin rango util de contador' }
  }

  const errorCount = events.filter((event) => event.type.toUpperCase() === 'ERROR').length
  const density = errorCount / (range / 1000)
  const label =
    errorCount === 0 ? '0' : density >= 10 ? density.toFixed(0) : density >= 1 ? density.toFixed(1) : '<1'

  return {
    label,
    detail: `${formatNumber(range)} paginas analizadas`,
  }
}

function getToneMetrics(
  filteredIncidents: ApiIncident[],
  consumableWarnings: RealtimeConsumable[],
  lastErrorLabel: string | null
) {
  const criticalIncidents = filteredIncidents.filter(
    (incident) => incident.severity.toUpperCase() === 'ERROR'
  )
  const warningIncidents = filteredIncidents.filter(
    (incident) => incident.severity.toUpperCase() === 'WARNING'
  )
  const replaceWarnings = consumableWarnings.filter(
    (warning) => typeof warning.percentLeft === 'number' && warning.percentLeft < 15
  )
  const nearWarnings = consumableWarnings.filter(
    (warning) =>
      typeof warning.percentLeft === 'number' &&
      warning.percentLeft >= 15 &&
      warning.percentLeft < 30
  )

  if (criticalIncidents.length > 0) {
    const topIncident = criticalIncidents[0]
    return {
      tone: 'critical' as const,
      status: 'Prioridad alta',
      headline: 'El equipo requiere intervencion tecnica prioritaria.',
      summary: `Se detectaron incidentes criticos. El codigo ${topIncident.code} fue el principal disparador${
        lastErrorLabel ? ` y el ultimo error confirmado se registro ${lastErrorLabel}.` : '.'
      }`,
      window: 'Intervenir dentro de 24 horas',
      replaceWarnings,
      nearWarnings,
      criticalIncidents,
      warningIncidents,
    }
  }

  if (replaceWarnings.length > 0 || warningIncidents.length > 0 || nearWarnings.length > 0) {
    return {
      tone: 'watch' as const,
      status: 'Atencion requerida',
      headline: 'No hay corte operativo inmediato, pero si senales claras de degradacion.',
      summary:
        replaceWarnings.length > 0
          ? 'La prioridad esta en evitar una parada por consumibles agotados y contener la recurrencia de avisos.'
          : 'Conviene corregir las causas recurrentes antes del proximo ciclo fuerte de uso.',
      window: 'Planificar revision en 72 horas',
      replaceWarnings,
      nearWarnings,
      criticalIncidents,
      warningIncidents,
    }
  }

  return {
    tone: 'ok' as const,
    status: 'Operacion estable',
    headline: 'La operacion luce estable en la ventana analizada.',
    summary:
      'No se observaron incidentes criticos ni alertas de consumibles que justifiquen una intervencion inmediata.',
    window: 'Mantener monitoreo semanal',
    replaceWarnings,
    nearWarnings,
    criticalIncidents,
    warningIncidents,
  }
}

function buildFindings(
  result: ParseLogsResponse,
  filteredEvents: ApiEvent[],
  filteredIncidents: ApiIncident[],
  consumableWarnings: RealtimeConsumable[],
  lastErrorLabel: string | null
) {
  const findings: string[] = []
  const criticalIncidents = filteredIncidents.filter(
    (incident) => incident.severity.toUpperCase() === 'ERROR'
  )
  const warningIncidents = filteredIncidents.filter(
    (incident) => incident.severity.toUpperCase() === 'WARNING'
  )
  const lowConsumables = consumableWarnings
    .filter((warning) => typeof warning.percentLeft === 'number')
    .sort((left, right) => left.percentLeft - right.percentLeft)

  if (criticalIncidents.length > 0) {
    const incident = criticalIncidents[0]
    findings.push(
      `El codigo ${incident.code} concentro ${incident.occurrences} ocurrencias criticas en el periodo.`
    )
  } else if (warningIncidents.length > 0) {
    const incident = warningIncidents[0]
    findings.push(
      `El codigo ${incident.code} se mantuvo recurrente con ${incident.occurrences} registros de advertencia.`
    )
  } else {
    findings.push('No se registraron incidentes criticos en el periodo analizado.')
  }

  if (lowConsumables.length > 0) {
    const warning = lowConsumables[0]
    findings.push(
      `El consumible mas comprometido es ${warning.description || warning.type} con ${Math.round(
        warning.percentLeft
      )}% de vida restante.`
    )
  } else {
    findings.push('No se detectaron consumibles en umbral de riesgo durante la revision.')
  }

  findings.push(
    `Se procesaron ${formatNumber(filteredEvents.length)} eventos sobre ${formatNumber(
      result.total_lines
    )} lineas de log entre ${formatDateRange(result.log_start_date, result.log_end_date)}.`
  )

  if (lastErrorLabel) {
    findings.push(`El ultimo evento de error confirmado fue ${lastErrorLabel}.`)
  }

  return findings.slice(0, 4)
}

function buildImpactPoints(
  tone: ReportTone,
  criticalCount: number,
  warningCount: number,
  consumableRiskCount: number
) {
  const points: string[] = []

  if (tone === 'critical') {
    points.push(
      `Existe riesgo alto de continuidad operativa por ${criticalCount} incidente${
        criticalCount === 1 ? '' : 's'
      } critico${criticalCount === 1 ? '' : 's'}.`
    )
  } else if (warningCount > 0) {
    points.push(
      `Hay riesgo medio de escalamiento si los ${warningCount} aviso${
        warningCount === 1 ? '' : 's'
      } recurrente${warningCount === 1 ? '' : 's'} no se corrigen.`
    )
  } else {
    points.push('No se observa riesgo operativo inmediato en la ventana analizada.')
  }

  if (consumableRiskCount > 0) {
    points.push(
      `Se identificaron ${consumableRiskCount} consumible${
        consumableRiskCount === 1 ? '' : 's'
      } en riesgo, con potencial impacto en disponibilidad y calidad.`
    )
  } else {
    points.push('El frente de consumibles no muestra alertas que alteren la operacion esperada.')
  }

  points.push('El reporte fue condensado para toma de decision e impresion en formato A4.')
  return points
}

function buildActions(
  tone: ReportTone,
  incidentRows: IncidentRow[],
  consumableWarnings: RealtimeConsumable[]
): ExecutiveAction[] {
  const lowConsumables = consumableWarnings
    .filter((warning) => typeof warning.percentLeft === 'number' && warning.percentLeft < 30)
    .sort((left, right) => left.percentLeft - right.percentLeft)

  const actions: ExecutiveAction[] = []

  if (lowConsumables.length > 0) {
    const warning = lowConsumables[0]
    actions.push({
      priority: tone === 'critical' ? 'Alta' : 'Media',
      owner: 'Operaciones',
      due: tone === 'critical' ? 'Hoy / 24h' : '48h',
      text: `Programar reemplazo o abastecimiento de ${warning.description || warning.type} antes del siguiente pico de uso.`,
    })
  }

  if (incidentRows.length > 0) {
    const incident = incidentRows[0]
    actions.push({
      priority: tone === 'ok' ? 'Media' : 'Alta',
      owner: 'Soporte tecnico',
      due: tone === 'critical' ? '24h' : '72h',
      text: `Revisar la causa raiz del codigo ${incident.code} y confirmar correccion estable en la proxima corrida de logs.`,
    })
  }

  actions.push({
    priority: tone === 'ok' ? 'Baja' : 'Media',
    owner: 'Service Desk',
    due: tone === 'critical' ? '48h' : '7 dias',
    text: 'Emitir una nueva exportacion ejecutiva luego de la accion correctiva para validar tendencia y cierre.',
  })

  return actions.slice(0, 3)
}

function widthPercent(value: number, maxValue: number) {
  if (maxValue <= 0) return '0%'
  return `${Math.max(8, Math.round((value / maxValue) * 100))}%`
}

function severityClassName(severity: string) {
  const normalized = severity.toUpperCase()
  if (normalized === 'ERROR') return `${styles.severityBadge} ${styles.severityError}`
  if (normalized === 'WARNING') return `${styles.severityBadge} ${styles.severityWarning}`
  return `${styles.severityBadge} ${styles.severityInfo}`
}

export const ExecutivePrintReport = forwardRef<HTMLDivElement, ExecutivePrintReportProps>(
  (
    {
      result,
      filteredIncidents,
      filteredEvents,
      consumableWarnings,
      lastErrorLabel,
      logFileName,
      serialNumber,
      modelName,
      topCodes,
      incidentRows,
      generatedAtIso,
      aiSummary,
    },
    ref
  ) => {
    const toneMetrics = useMemo(
      () => getToneMetrics(filteredIncidents, consumableWarnings, lastErrorLabel),
      [filteredIncidents, consumableWarnings, lastErrorLabel]
    )

    const density = useMemo(() => computeErrorDensity(filteredEvents), [filteredEvents])
    const generatedAtLabel = useMemo(() => formatDateTime(generatedAtIso), [generatedAtIso])

    const criticalCount = toneMetrics.criticalIncidents.length
    const warningCount = toneMetrics.warningIncidents.length
    const infoCount = filteredIncidents.filter(
      (incident) => incident.severity.toUpperCase() === 'INFO'
    ).length
    const consumableRiskCount = toneMetrics.replaceWarnings.length + toneMetrics.nearWarnings.length

    const findings = useMemo(
      () =>
        buildFindings(
          result,
          filteredEvents,
          filteredIncidents,
          consumableWarnings,
          lastErrorLabel
        ),
      [result, filteredEvents, filteredIncidents, consumableWarnings, lastErrorLabel]
    )

    const impactPoints = useMemo(
      () => buildImpactPoints(toneMetrics.tone, criticalCount, warningCount, consumableRiskCount),
      [toneMetrics.tone, criticalCount, warningCount, consumableRiskCount]
    )

    const actions = useMemo(
      () => buildActions(toneMetrics.tone, incidentRows, consumableWarnings),
      [toneMetrics.tone, incidentRows, consumableWarnings]
    )

    const topConsumables = useMemo(
      () =>
        [...consumableWarnings]
          .filter((warning) => typeof warning.percentLeft === 'number')
          .sort((left, right) => left.percentLeft - right.percentLeft)
          .slice(0, 5),
      [consumableWarnings]
    )

    const severityBars = [
      { label: 'Criticos', count: criticalCount, className: styles.barCritical },
      { label: 'Warnings', count: warningCount, className: styles.barWatch },
      { label: 'Info', count: infoCount, className: styles.barInfo },
    ]

    const severityMax = Math.max(...severityBars.map((item) => item.count), 1)
    const topCodesToShow = topCodes.slice(0, 5)
    const topCodesMax = Math.max(...topCodesToShow.map((item) => item.count), 1)
    const topIncidentRows = incidentRows.slice(0, 8)

    return (
      <div ref={ref} className={styles.report}>
        <section className={styles.page}>
          <div className={styles.pageHeader}>
            <div className={styles.brandBlock}>
              <span className={styles.brandEyebrow}>HP Logs Analyzer</span>
              <span className={styles.brandTitle}>Reporte Ejecutivo de Salud del Equipo</span>
              <span className={styles.brandSubtitle}>
                Documento resumido para impresión, revisión gerencial y seguimiento técnico.
              </span>
            </div>
            <div className={styles.pageMeta}>
              <div>Generado: {generatedAtLabel}</div>
              <div>Formato: A4 vertical</div>
              <div>Uso interno confidencial</div>
            </div>
          </div>

          <div className={styles.coverHero}>
            <div className={styles.heroCopy}>
              <span className={styles.heroTag}>
                {aiSummary ? 'AI Powered Executive Summary' : 'Executive print report'}
              </span>
              <h1 className={styles.heroTitle}>
                {aiSummary 
                  ? 'Diagnóstico ejecutivo generado por Inteligencia Artificial' 
                  : 'Estado actual, impacto y plan de acción.'}
              </h1>
              <p className={styles.heroText}>
                {aiSummary ? aiSummary.narrative_summary : (
                  'Este informe consolida las métricas clave de rendimiento, alertas preventivas y ' +
                  'diagnósticos técnicos para facilitar la toma de decisiones estratégicas y el ' +
                  'aseguramiento de la continuidad operativa.'
                )}
              </p>
            </div>

            <aside className={styles.heroPanel}>
              <span
                className={`${styles.statusPill} ${
                  (aiSummary?.tone || toneMetrics.tone) === 'critical'
                    ? styles.statusPillCritical
                    : (aiSummary?.tone || toneMetrics.tone) === 'watch'
                      ? styles.statusPillWatch
                      : styles.statusPillOk
                }`}
              >
                {aiSummary ? (
                   aiSummary.tone === 'critical' ? 'Prioridad alta' : 
                   aiSummary.tone === 'watch' ? 'Atencion requerida' : 'Operacion estable'
                ) : toneMetrics.status}
              </span>
              <div className={styles.statusTitle}>
                {aiSummary ? 'Plan de Acción Sugerido' : toneMetrics.window}
              </div>
              <div className={styles.statusText}>
                {aiSummary ? (
                  <ul className={styles.aiActionList}>
                    {aiSummary.action_plan.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                ) : toneMetrics.summary}
              </div>
            </aside>
          </div>

          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Equipo</span>
              <span className={styles.metaValue}>{modelName || 'Modelo no identificado'}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Serie</span>
              <span className={styles.metaValue}>{serialNumber || 'N/A'}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Origen</span>
              <span className={styles.metaValue}>{logFileName || 'Logs pegados'}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Periodo revisado</span>
              <span className={styles.metaValue}>
                {formatDateRange(result.log_start_date, result.log_end_date)}
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Eventos procesados</span>
              <span className={styles.metaValue}>{formatNumber(filteredEvents.length)}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Incidentes detectados</span>
              <span className={styles.metaValue}>{formatNumber(filteredIncidents.length)}</span>
            </div>
          </div>

          <div className={styles.footer}>
            <span>Resumen ejecutivo de estado operativo.</span>
            <span>Página 1 / 4</span>
          </div>
        </section>

        <section className={styles.page}>
          <div className={styles.pageHeader}>
            <div className={styles.brandBlock}>
              <span className={styles.sectionLabel}>Resumen ejecutivo</span>
              <span className={styles.brandTitle}>Conclusion y lectura gerencial</span>
            </div>
            <div className={styles.pageMeta}>
              <div>{modelName || 'Equipo sin modelo'}</div>
              <div>{serialNumber || 'Serie N/A'}</div>
            </div>
          </div>

          <section className={styles.leadCard}>
            <span
              className={`${styles.statusPill} ${
                toneMetrics.tone === 'critical'
                  ? styles.statusPillCritical
                  : toneMetrics.tone === 'watch'
                    ? styles.statusPillWatch
                    : styles.statusPillOk
              }`}
            >
              {toneMetrics.status}
            </span>
            <h2 className={styles.leadTitle}>{toneMetrics.headline}</h2>
            <p className={styles.leadText}>{toneMetrics.summary}</p>
          </section>

          <section className={styles.scoreGrid}>
            <article className={styles.scoreCard}>
              <span className={styles.smallLabel}>Salud general</span>
              <span
                className={`${styles.scoreValue} ${
                  toneMetrics.tone === 'critical'
                    ? styles.scoreValueCritical
                    : toneMetrics.tone === 'watch'
                      ? styles.scoreValueWatch
                      : styles.scoreValueOk
                }`}
              >
                {toneMetrics.status}
              </span>
              <span className={styles.scoreText}>{toneMetrics.window}</span>
            </article>
            <article className={styles.scoreCard}>
              <span className={styles.smallLabel}>Incidentes criticos</span>
              <span className={`${styles.scoreValue} ${styles.scoreValueCritical}`}>
                {criticalCount}
              </span>
              <span className={styles.scoreText}>
                {warningCount} warning · {infoCount} info
              </span>
            </article>
            <article className={styles.scoreCard}>
              <span className={styles.smallLabel}>Consumibles en riesgo</span>
              <span
                className={`${styles.scoreValue} ${
                  consumableRiskCount > 0 ? styles.scoreValueWatch : styles.scoreValueOk
                }`}
              >
                {consumableRiskCount}
              </span>
              <span className={styles.scoreText}>
                {toneMetrics.replaceWarnings.length > 0
                  ? `${toneMetrics.replaceWarnings.length} para reposicion inmediata`
                  : toneMetrics.nearWarnings.length > 0
                    ? `${toneMetrics.nearWarnings.length} para seguimiento`
                    : 'Sin alertas activas'}
              </span>
            </article>
            <article className={styles.scoreCard}>
              <span className={styles.smallLabel}>Errores / 1.000 págs.</span>
              <span className={styles.scoreValue}>{density.label}</span>
              <span className={styles.scoreText}>{density.detail}</span>
            </article>
          </section>

          <div className={styles.insightGrid}>
            <section className={styles.listCard}>
              <h3 className={styles.sectionTitle}>Hallazgos clave</h3>
              <ul className={styles.bulletList}>
                {findings.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className={styles.listCard}>
              <h3 className={styles.sectionTitle}>Impacto esperado</h3>
              <ul className={styles.bulletList}>
                {impactPoints.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </div>

          <section className={styles.actionsGrid}>
            {actions.map((action) => (
              <article key={`${action.owner}-${action.text}`} className={styles.actionCard}>
                <span className={styles.actionPriority}>{action.priority}</span>
                <div className={styles.actionOwner}>{action.owner}</div>
                <div className={styles.actionText}>{action.text}</div>
                <div className={styles.actionDue}>Ventana sugerida: {action.due}</div>
              </article>
            ))}
          </section>

          <div className={styles.footer}>
            <span>La recomendación está simplificada para lectura ejecutiva.</span>
            <span>Página 2 / 4</span>
          </div>
        </section>

        <section className={styles.page}>
          <div className={styles.pageHeader}>
            <div className={styles.brandBlock}>
              <span className={styles.sectionLabel}>Evidencia prioritaria</span>
              <span className={styles.brandTitle}>Indicadores y focos de accion</span>
            </div>
            <div className={styles.pageMeta}>
              <div>Severidad global: {result.global_severity || 'N/A'}</div>
              <div>Ultimo error: {lastErrorLabel || 'Sin error critico'}</div>
            </div>
          </div>

          <div className={styles.evidenceGrid}>
            <section className={styles.insightCard}>
              <h3 className={styles.sectionTitle}>Distribución por severidad</h3>
              <div className={styles.barList}>
                {severityBars.map((item) => (
                  <div key={item.label} className={styles.barItem}>
                    <div className={styles.barRow}>
                      <span className={styles.barLabel}>{item.label}</span>
                      <span className={styles.barValue}>{item.count}</span>
                    </div>
                    <div className={styles.barTrack}>
                      <div
                        className={`${styles.barFill} ${item.className}`}
                        style={{ width: widthPercent(item.count, severityMax) }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.insightCard}>
              <h3 className={styles.sectionTitle}>Top códigos recurrentes</h3>
              {topCodesToShow.length > 0 ? (
                <div className={styles.barList}>
                  {topCodesToShow.map((item) => (
                    <div key={`${item.name}-${item.severity}`} className={styles.barItem}>
                      <div className={styles.barRow}>
                        <span className={styles.barLabel}>{item.name}</span>
                        <span className={styles.barValue}>
                          {item.count} · {item.severity}
                        </span>
                      </div>
                      <div className={styles.barTrack}>
                        <div
                          className={`${styles.barFill} ${styles.barNeutral}`}
                          style={{ width: widthPercent(item.count, topCodesMax) }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  No hay códigos recurrentes para mostrar en la ventana filtrada.
                </div>
              )}
            </section>

            <section className={styles.insightCard}>
              <h3 className={styles.sectionTitle}>Consumibles a seguir</h3>
              {topConsumables.length > 0 ? (
                <ul className={styles.compactList}>
                  {topConsumables.map((warning) => (
                    <li key={`${warning.type}-${warning.sku}`}>
                      <span className={styles.listKey}>{warning.description || warning.type}</span>
                      <span className={styles.listValue}>
                        {Math.round(warning.percentLeft)}% restante
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className={styles.emptyState}>
                  No se detectaron alertas de consumibles para seguimiento.
                </div>
              )}
            </section>

            <section className={styles.insightCard}>
              <h3 className={styles.sectionTitle}>Contexto operativo</h3>
              <ul className={styles.compactList}>
                <li>
                  <span className={styles.listKey}>Líneas procesadas</span>
                  <span className={styles.listValue}>{formatNumber(result.total_lines)}</span>
                </li>
                <li>
                  <span className={styles.listKey}>Eventos filtrados</span>
                  <span className={styles.listValue}>{formatNumber(filteredEvents.length)}</span>
                </li>
                <li>
                  <span className={styles.listKey}>Incidentes filtrados</span>
                  <span className={styles.listValue}>{formatNumber(filteredIncidents.length)}</span>
                </li>
                <li>
                  <span className={styles.listKey}>Densidad de errores</span>
                  <span className={styles.listValue}>{density.label}</span>
                </li>
              </ul>
            </section>
          </div>

          <section className={styles.contextGrid}>
            <article className={styles.contextCard}>
              <span className={styles.smallLabel}>Ventana del analisis</span>
              <span className={styles.contextValue}>
                {formatDateRange(result.log_start_date, result.log_end_date)}
              </span>
              <span className={styles.contextText}>
                El resumen se construyo sobre el periodo visible y los filtros activos.
              </span>
            </article>
            <article className={styles.contextCard}>
              <span className={styles.smallLabel}>Lectura ejecutiva</span>
              <span className={styles.contextValue}>{toneMetrics.window}</span>
              <span className={styles.contextText}>
                La accion sugerida combina criticidad del log y riesgo de consumibles.
              </span>
            </article>
          </section>

          <div className={styles.footer}>
            <span>La evidencia se presenta en formato compacto y legible.</span>
            <span>Página 3 / 4</span>
          </div>
        </section>

        <section className={styles.page}>
          <div className={styles.pageHeader}>
            <div className={styles.brandBlock}>
              <span className={styles.sectionLabel}>Anexo ejecutivo</span>
              <span className={styles.brandTitle}>Incidentes priorizados</span>
            </div>
            <div className={styles.pageMeta}>
              <div>Ordenado por severidad y ultima ocurrencia</div>
              <div>Se muestran hasta 8 filas clave</div>
            </div>
          </div>

          <section className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Clasificación</th>
                  <th>Severidad</th>
                  <th>Ocurrencias</th>
                  <th>Primera vez</th>
                  <th>Última vez</th>
                </tr>
              </thead>
              <tbody>
                {topIncidentRows.length > 0 ? (
                  topIncidentRows.map((incident) => (
                    <tr key={incident.id}>
                      <td className={styles.codeCell}>
                        {incident.code}
                        {aiSummary?.error_translations[incident.code] && (
                          <span className={styles.aiTranslation}>
                            {aiSummary.error_translations[incident.code]}
                          </span>
                        )}
                      </td>
                      <td>{incident.classification || incident.code}</td>
                      <td>
                        <span className={severityClassName(incident.severity)}>
                          {incident.severity}
                        </span>
                      </td>
                      <td>{incident.occurrences}</td>
                      <td>{formatDateTime(incident.start_time)}</td>
                      <td>{formatDateTime(incident.end_time)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>
                      <div className={styles.emptyState}>
                        No hay incidentes priorizados en la ventana filtrada.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {incidentRows.length > topIncidentRows.length && (
              <div className={styles.appendixNote}>
                Quedaron fuera {incidentRows.length - topIncidentRows.length} incidente
                {incidentRows.length - topIncidentRows.length === 1 ? '' : 's'} de menor prioridad
                para mantener la lectura ejecutiva en 4 paginas.
              </div>
            )}
          </section>

          <div className={styles.footer}>
            <span>Anexo abreviado para consulta técnica rápida.</span>
            <span>Página 4 / 4</span>
          </div>
        </section>
      </div>
    )
  }
)

ExecutivePrintReport.displayName = 'ExecutivePrintReport'
