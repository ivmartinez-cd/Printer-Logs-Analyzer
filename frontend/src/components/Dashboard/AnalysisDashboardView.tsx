import { useState, useMemo } from 'react'
import type {
  ParseLogsResponse,
  EnrichedEvent as ApiEvent,
  Incident as ApiIncident,
  RealtimeConsumable,
  DeviceAlertsResponse,
  InsightMeter
} from '../../types/api'
import type { DateFilter } from '../../hooks/useDateFilter'
import type { IncidentRow } from '../Parser/IncidentsTable'
import type { SdsIncidentData } from '../Monitor/SDSIncidentModal'

interface InsightDataResult {
  data: DeviceAlertsResponse | null
  meters: InsightMeter[]
  loading: boolean
  error: string | null
}

import { IncidentsChart } from '../Monitor/IncidentsChart'
import { TopErrorsChart } from '../Monitor/TopErrorsChart'
import { AIDiagnosticPanel } from '../Analysis/AIDiagnosticPanel'
import { IncidentsTable } from '../Parser/IncidentsTable'
import { EventsTable } from '../Parser/EventsTable'
import { ConsumableWarningsPanel } from '../Monitor/ConsumableWarningsPanel'
import { InsightAlertsPanel } from '../Monitor/InsightAlertsPanel'
import { SDSIncidentPanel } from '../Monitor/SDSIncidentPanel'

import { ErrorHeatmap } from '../Analysis/ErrorHeatmap'
import { SeverityFilters } from '../ui/SeverityFilters'
import { Portal } from '../ui/Portal'

import { DeviceStatusHeader } from '../Monitor/DeviceStatusHeader'
import { HealthScoreGauge } from '../Monitor/HealthScoreGauge'
import { NocKpiCards } from '../Monitor/NocKpiCards'
import { EventsTimeline } from '../Monitor/EventsTimeline'
import { ActiveAlertsPanel } from '../Monitor/ActiveAlertsPanel'
import { CodeTrendTable } from '../Monitor/CodeTrendTable'
import {
  computeDeviceStatus,
  computeHealthScore,
  computeAvailability,
  computeActiveAlerts,
  computeCodeTrends,
  recentEvents,
} from '../Monitor/healthMetrics'

interface AnalysisDashboardViewProps {
  result: ParseLogsResponse
  filteredIncidents: ApiIncident[]
  filteredEvents: ApiEvent[]
  events: ApiEvent[]
  lastErrorEvent: ApiEvent | null
  lastErrorLabel: string
  activeFilter: DateFilter
  topCodes: { name: string; count: number; severity: string; sds_link?: string | null; sds_solution_content?: string | null }[]
  realtimeConsumables: RealtimeConsumable[]
  insightData: InsightDataResult | null
  currentSerialNumber: string | null
  currentModelName: string | null
  incidentRows: IncidentRow[]
  sdsIncident: SdsIncidentData | null

  onSetEditCodeInitial: (val: { code: string; description: string; severity: string; solutionUrl: string } | null) => void
  onSetSolutionModal: (val: { code: string; sdsContent?: string | null; sdsUrl?: string | null } | null) => void
}

export function AnalysisDashboardView({
  result,
  filteredIncidents,
  filteredEvents,
  events,
  activeFilter,
  topCodes,
  realtimeConsumables,
  insightData,
  currentSerialNumber,
  currentModelName,
  incidentRows,
  sdsIncident,
  onSetEditCodeInitial,
  onSetSolutionModal
}: AnalysisDashboardViewProps) {
  const [visibleSeverities, setVisibleSeverities] = useState<Set<string>>(new Set(['ERROR', 'WARNING', 'INFO']))
  const [incidentsCollapsed, setIncidentsCollapsed] = useState(true)
  const [detailCollapsed, setDetailCollapsed] = useState(true)
  const [drillCode, setDrillCode] = useState<string | null>(null)

  const drillEvents = useMemo(() => {
    if (!drillCode) return []
    return filteredEvents.filter(e => e.code === drillCode)
  }, [drillCode, filteredEvents])

  // ── Métricas NOC (estimaciones derivadas de logs) ──────────────────
  const status = useMemo(() => computeDeviceStatus(filteredIncidents), [filteredIncidents])
  const healthScore = useMemo(() => computeHealthScore(filteredIncidents), [filteredIncidents])
  const availability = useMemo(
    () => computeAvailability(filteredIncidents, result.log_start_date, result.log_end_date),
    [filteredIncidents, result.log_start_date, result.log_end_date]
  )
  const activeAlerts = useMemo(() => computeActiveAlerts(filteredIncidents), [filteredIncidents])
  const codeTrends = useMemo(() => computeCodeTrends(filteredIncidents), [filteredIncidents])
  const lastUpdateIso = useMemo(
    () => recentEvents(filteredEvents, 1)[0]?.timestamp ?? result.log_end_date,
    [filteredEvents, result.log_end_date]
  )
  const errorCount = useMemo(
    () => filteredIncidents.filter((i) => i.severity.toUpperCase() === 'ERROR').length,
    [filteredIncidents]
  )
  const warningCount = useMemo(
    () => filteredIncidents.filter((i) => i.severity.toUpperCase() === 'WARNING').length,
    [filteredIncidents]
  )

  const handleSeverityToggle = (sev: string) => {
    setVisibleSeverities(prev => {
      const next = new Set(prev)
      if (next.has(sev)) {
        if (next.size > 1) next.delete(sev)
      } else {
        next.add(sev)
      }
      return next
    })
  }

  return (
    <>
      {/* ── NOC: Centro de monitoreo (above fold) ── */}
      <div className="noc-stack">
        {/* Header del equipo */}
        <DeviceStatusHeader
          modelName={currentModelName}
          serialNumber={currentSerialNumber}
          status={status}
          lastUpdateIso={lastUpdateIso}
          availability={availability}
          errorCount={errorCount}
          warningCount={warningCount}
        />

        {/* Health Score + KPIs */}
        <div className="noc-row">
          <HealthScoreGauge score={healthScore} />
          <NocKpiCards
            errorCount={errorCount}
            warningCount={warningCount}
            incidentCount={filteredIncidents.length}
            availability={availability}
          />
        </div>

        {/* Filtros globales para los gráficos */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '16px',
            background: 'rgba(255, 255, 255, 0.02)', padding: '8px 24px',
            borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.05)',
          }}>
            <span style={{
              fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>
              Filtrar Análisis:
            </span>
            <SeverityFilters activeSeverities={visibleSeverities} onToggle={handleSeverityToggle} />
          </div>
        </div>

        {/* Gráfico principal + top errores */}
        <div className="dashboard__above-fold__charts-row">
          <div className="dashboard__above-fold__chart">
            <IncidentsChart
              events={events}
              activeFilter={activeFilter}
              visibleSeverities={visibleSeverities}
            />
          </div>
          <div className="dashboard__above-fold__chart">
            <TopErrorsChart
              topCodes={topCodes}
              activeSeverities={visibleSeverities}
              onViewSolution={(code, sdsContent, sdsUrl) =>
                onSetSolutionModal({ code, sdsContent, sdsUrl })
              }
              onBarClick={setDrillCode}
            />
          </div>
        </div>

        {/* Timeline de eventos + Alertas activas */}
        <div className="noc-row">
          <EventsTimeline events={filteredEvents} />
          <ActiveAlertsPanel alerts={activeAlerts} />
        </div>

        {/* Patrones temporales */}
        <ErrorHeatmap
          events={events}
          visibleSeverities={visibleSeverities}
          onViewSolution={(code, sdsContent, sdsUrl) =>
            onSetSolutionModal({ code, sdsContent, sdsUrl })
          }
          onEditCode={(code, description, severity, solutionUrl) =>
            onSetEditCodeInitial({ code, description, severity, solutionUrl })
          }
        />
      </div>

      {/* ── Recomendación automática (IA) ── */}
      <AIDiagnosticPanel
        className="animate-in delay-3"
        result={result}
        consumables={realtimeConsumables}
        alerts={insightData?.data || null}
        meters={insightData?.meters || []}
        isFeatured={true}
        serialNumber={currentSerialNumber}
        modelName={currentModelName}
      />

      {/* ── Tendencia de códigos (tabla operacional) ── */}
      <CodeTrendTable
        trends={codeTrends}
        onViewSolution={(code) => onSetSolutionModal({ code })}
      />

      {/* ── Detalle técnico (drill-down, plegado) ── */}
      <section className="collapsible-panel" style={{ marginTop: '24px' }}>
        <button
          type="button"
          className="collapsible-panel__header"
          onClick={() => setDetailCollapsed((v) => !v)}
          aria-expanded={!detailCollapsed}
        >
          <span className="collapsible-panel__title">🔍 Detalle técnico completo</span>
          <span
            className={'collapsible-panel__chevron' + (!detailCollapsed ? ' collapsible-panel__chevron--expanded' : '')}
            aria-hidden="true"
          >
            ▶
          </span>
        </button>

        {!detailCollapsed && (
          <div className="collapsible-panel__body">
            <div className="dashboard__drilldown-panels">
              {/* Incidencias detectadas */}
              <section className="collapsible-panel collapsible-panel--incidents">
                <button
                  type="button"
                  className="collapsible-panel__header"
                  onClick={() => setIncidentsCollapsed((v) => !v)}
                  aria-expanded={!incidentsCollapsed}
                >
                  <span className="collapsible-panel__title">📋 Incidencias detectadas</span>
                  {incidentsCollapsed && incidentRows.length > 0 && (
                    <span style={{ fontSize: '0.8rem', color: '#9aa3b2', fontWeight: 400, marginLeft: 4 }}>
                      {incidentRows.length} incidencia{incidentRows.length !== 1 ? 's' : ''}
                    </span>
                  )}
                  <span
                    className={`collapsible-panel__chevron${!incidentsCollapsed ? ' collapsible-panel__chevron--expanded' : ''}`}
                    aria-hidden="true"
                  >
                    ▶
                  </span>
                </button>
                {!incidentsCollapsed && (
                  <div className="collapsible-panel__body">
                    <IncidentsTable
                      incidentRows={incidentRows}
                      onEditCode={(code, classification, severity, solutionUrl) =>
                        onSetEditCodeInitial({
                          code,
                          description: classification,
                          severity,
                          solutionUrl,
                        })
                      }
                      onViewSolution={(code, sdsContent, sdsUrl) =>
                        onSetSolutionModal({ code, sdsContent, sdsUrl })
                      }
                    />
                  </div>
                )}
              </section>

              {/* Eventos del periodo */}
              <EventsTable
                events={filteredEvents}
                onViewSolution={(code, sdsContent, sdsUrl) =>
                  onSetSolutionModal({ code, sdsContent, sdsUrl })
                }
              />

              {/* Consumibles en tiempo real */}
              <div>
                <ConsumableWarningsPanel warnings={realtimeConsumables} />
              </div>

              {/* Alertas del portal SDS */}
              <InsightAlertsPanel
                serial={currentSerialNumber}
                data={insightData?.data || null}
                loading={insightData?.loading || false}
                error={insightData?.error || null}
              />

              {/* SDS Engineering Incident */}
              {sdsIncident && (
                <SDSIncidentPanel
                  sdsIncident={sdsIncident}
                  incidentRows={incidentRows.map((r) => ({
                    code: r.code,
                    classification: r.classification || r.code,
                  }))}
                  incidentsFull={
                    result?.incidents?.map((inc: ApiIncident) => ({
                      code: inc.code,
                      classification: inc.classification,
                      end_time: inc.end_time,
                      occurrences: inc.occurrences,
                    })) ?? []
                  }
                />
              )}
            </div>
          </div>
        )}
      </section>

      {/* ── Drill-down modal: eventos por código ── */}
      {drillCode && (
        <Portal>
          <div
            onClick={() => setDrillCode(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', maxWidth: '720px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', background: '#0e121a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}
            >
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1rem', color: 'var(--hp-blue-vibrant)' }}>{drillCode}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{drillEvents.length} evento{drillEvents.length !== 1 ? 's' : ''} en el período</span>
                </div>
                <button onClick={() => setDrillCode(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.3rem', lineHeight: 1 }}>✕</button>
              </div>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {drillEvents.length === 0 ? (
                  <p style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Sin eventos para este código en el período activo.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.03)', position: 'sticky', top: 0 }}>
                        {['Fecha', 'Tipo', 'Descripción', 'Contador'].map(h => (
                          <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {drillEvents.map((e, i) => {
                        const typeColor = e.type?.toUpperCase() === 'ERROR' ? '#ff5252' : e.type?.toUpperCase() === 'WARNING' ? '#ffb300' : '#3b82f6'
                        return (
                          <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '10px 16px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{e.timestamp ? new Date(e.timestamp).toLocaleString('es-AR') : '—'}</td>
                            <td style={{ padding: '10px 16px' }}><span style={{ color: typeColor, fontWeight: 700, fontSize: '0.75rem' }}>{e.type}</span></td>
                            <td style={{ padding: '10px 16px', color: '#e5e7eb' }}>{e.code_description || '—'}</td>
                            <td style={{ padding: '10px 16px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{e.counter ?? '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  )
}
