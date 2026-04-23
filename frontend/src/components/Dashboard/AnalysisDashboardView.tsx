import { useState } from 'react'
import type { ParseLogsResponse, EnrichedEvent as ApiEvent, Incident as ApiIncident, RealtimeConsumable } from '../../types/api'
import type { DateFilter } from '../../hooks/useDateFilter'
import type { IncidentRow } from '../Parser/IncidentsTable'

import { KPICards } from '../Monitor/KPICards'
import { IncidentsChart } from '../Monitor/IncidentsChart'
import { TopErrorsChart } from '../Monitor/TopErrorsChart'
import { AIDiagnosticPanel } from '../Analysis/AIDiagnosticPanel'
import { IncidentsTable } from '../Parser/IncidentsTable'
import { EventsTable } from '../Parser/EventsTable'
import { ConsumableWarningsPanel } from '../Monitor/ConsumableWarningsPanel'
import { InsightAlertsPanel } from '../Monitor/InsightAlertsPanel'
import { SDSIncidentPanel } from '../Monitor/SDSIncidentPanel'

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
  insightData: any
  currentSerialNumber: string | null
  currentModelName: string | null
  incidentRows: IncidentRow[]
  sdsIncident: any
  
  onSetEditCodeInitial: (val: any) => void
  onSetSolutionModal: (val: any) => void
}

export function AnalysisDashboardView({
  result,
  filteredIncidents,
  filteredEvents,
  events,
  lastErrorEvent,
  lastErrorLabel,
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
  const [visibleSeverities, setVisibleSeverities] = useState<Set<string>>(
    new Set(['ERROR', 'WARNING', 'INFO'])
  )
  const [incidentsCollapsed, setIncidentsCollapsed] = useState(false)

  return (
    <>
      {/* ── ABOVE FOLD: KPIs + 2 gráficos siempre visibles ── */}
      <div className="dashboard__above-fold">
        {/* BLOQUE 1: KPIs ejecutivos */}
        <section className="animate-in delay-1 kpis">
          <KPICards
            filteredIncidents={filteredIncidents}
            filteredEvents={filteredEvents}
            lastErrorEvent={lastErrorEvent}
            lastErrorLabel={lastErrorLabel}
          />
        </section>

        <div className="dashboard__above-fold__charts-row">
          {/* BLOQUE 2a: Gráfico de volumen */}
          <div className="animate-in delay-2 dashboard__above-fold__chart">
            <IncidentsChart
              events={events}
              activeFilter={activeFilter}
              visibleSeverities={visibleSeverities}
              onSeverityToggle={(sev) =>
                setVisibleSeverities((prev) => {
                  const next = new Set(prev)
                  if (next.has(sev)) next.delete(sev)
                  else next.add(sev)
                  return next
                })
              }
            />
          </div>

          {/* BLOQUE 2b: Errores más frecuentes */}
          <div className="animate-in delay-2 dashboard__above-fold__chart">
            <TopErrorsChart 
              topCodes={topCodes} 
              onViewSolution={(code, sdsContent, sdsUrl) =>
                onSetSolutionModal({ code, sdsContent, sdsUrl })
              }
            />
          </div>
        </div>
      </div>

      {/* ── BLOQUE 4: Diagnóstico Inteligente (Destacado) ── */}
      <AIDiagnosticPanel
        className="animate-in delay-3"
        result={result}
        consumables={realtimeConsumables}
        alerts={insightData.data}
        meters={insightData.meters}
        isFeatured={true}
        serialNumber={currentSerialNumber}
        modelName={currentModelName}
      />

      {/* ── BLOQUE 5: Paneles de diagnóstico (drill-down) ── */}
      <div className="dashboard__drilldown-panels">
        {/* Incidencias detectadas */}
        <section className="animate-in delay-3 collapsible-panel collapsible-panel--incidents">
          <button
            type="button"
            className="collapsible-panel__header"
            onClick={() => setIncidentsCollapsed((v) => !v)}
            aria-expanded={!incidentsCollapsed}
          >
            <span className="collapsible-panel__title">
              📋 Incidencias detectadas
            </span>
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
          data={insightData.data}
          loading={insightData.loading}
          error={insightData.error}
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
    </>
  )
}
