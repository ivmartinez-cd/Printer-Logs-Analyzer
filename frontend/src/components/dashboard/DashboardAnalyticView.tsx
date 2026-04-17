import { useState } from 'react'
import { ExecutiveSummary } from '../ExecutiveSummary'
import { KPICards } from '../KPICards'
import { AIDiagnosticPanel } from '../AIDiagnosticPanel'
import { SDSIncidentPanel } from '../SDSIncidentPanel'
import { ConsumableWarningsPanel } from '../ConsumableWarningsPanel'
import { InsightAlertsPanel } from '../InsightAlertsPanel'
import { IncidentsChart } from '../IncidentsChart'
import { TopErrorsChart } from '../TopErrorsChart'
import { IncidentsTable } from '../IncidentsTable'
import { EventsTable } from '../EventsTable'
import { DateRangePicker } from '../DateRangePicker'
import { AddCodeToCatalogModal } from '../AddCodeToCatalogModal'
import type { ParseLogsResponse, ErrorCodeUpsertBody } from '../../types/api'
import { type DateFilter, getWindowForDate } from '../../hooks/useDateFilter'

interface DashboardAnalyticViewProps {
  result: ParseLogsResponse
  codesNew: string[]
  setCodesNew: (updater: (prev: string[]) => string[]) => void
  activeFilter: DateFilter
  dateFilter: any
  dateRange: { minDate: string; maxDate: string } | null
  realtimeConsumables: any[]
  lastErrorLabel: string | null
  lastErrorEvent: any
  currentModelName: string | null
  currentSerialNumber: string | null
  logFileName: string | null
  currentModelHasCpmd: boolean
  insightData: any
  sdsIncident: any
  incidentRows: any[]
  visibleSeverities: Set<string>
  setVisibleSeverities: (s: Set<string> | ((prev: Set<string>) => Set<string>)) => void
  filteredIncidents: any[]
  filteredEvents: any[]
  
  // Handlers
  onSaveCodeToCatalog: (body: ErrorCodeUpsertBody, isEdit: boolean) => Promise<void>
  onEditCode: (code: string, description: string, severity: string, solutionUrl?: string) => void
  onViewSolution: (code: string, sdsContent?: string | null, sdsUrl?: string | null) => void
  
  // Refs for PDF
  refs: {
    executiveSummaryRef: any
    kpisRef: any
    aiDiagnosticRef: any
    consumableRef: any
    areaChartRef: any
    barChartRef: any
    incidentsTableRef: any
  }
  
  // UI State
  savingCode: boolean
  addCodeModalCode: string | null
  setAddCodeModalCode: (c: string | null) => void
  editCodeInitial: any
  setEditCodeInitial: (c: any) => void
}

export function DashboardAnalyticView({
  result,
  codesNew,
  setCodesNew,
  activeFilter,
  dateFilter,
  dateRange,
  realtimeConsumables,
  lastErrorLabel,
  lastErrorEvent,
  currentModelName,
  currentSerialNumber,
  logFileName,
  currentModelHasCpmd,
  insightData,
  sdsIncident,
  incidentRows,
  visibleSeverities,
  setVisibleSeverities,
  filteredIncidents,
  filteredEvents,
  onSaveCodeToCatalog,
  onEditCode,
  onViewSolution,
  refs,
  savingCode,
  addCodeModalCode,
  setAddCodeModalCode,
  editCodeInitial,
  setEditCodeInitial
}: DashboardAnalyticViewProps) {
  const [parseErrorsExpanded, setParseErrorsExpanded] = useState(false)

  const getEventInfoForCode = (code: string) => {
    const ev = result.events.find((e) => e.code === code)
    return {
      description: ev?.help_reference?.trim() ?? ev?.code_description?.trim() ?? '',
      severity: (ev?.type?.toUpperCase() ?? 'INFO') as string,
    }
  }

  const parseErrorsCount = result.errors?.length ?? 0

  return (
    <div className="dashboard-analytic-view flex flex-col gap-6 w-full">
      {/* Banner de errores de parseo */}
      {parseErrorsCount > 0 && (
        <div className="bg-accent-amber/10 border border-accent-amber/20 p-4 rounded-2xl animate-fade-in-up" role="alert">
          <button
            className="flex items-center justify-between w-full text-accent-amber font-semibold text-sm transition-opacity hover:opacity-80"
            onClick={() => setParseErrorsExpanded((v) => !v)}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">⚠️</span>
              Se omitieron {parseErrorsCount} líneas por formato inválido
            </div>
            <span className={`transform transition-transform duration-300 ${parseErrorsExpanded ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
          {parseErrorsExpanded && (
            <div className="mt-4 overflow-x-auto rounded-xl bg-hp-dark/40 border border-accent-amber/10">
              <table className="w-full text-[11px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-accent-amber/10 text-accent-amber/60 uppercase tracking-wider font-bold">
                    <th className="p-3">Línea</th>
                    <th className="p-3">Texto crudo</th>
                    <th className="p-3">Motivo</th>
                  </tr>
                </thead>
                <tbody className="text-slate-400">
                  {result.errors.map((e: any) => (
                    <tr key={e.line_number} className="border-b border-accent-amber/5 last:border-0 hover:bg-accent-amber/5 transition-colors">
                      <td className="p-3 font-mono">{e.line_number}</td>
                      <td className="p-3 font-mono break-all opacity-80">{e.raw_line}</td>
                      <td className="p-3">{e.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Detección de códigos nuevos */}
      {codesNew.length > 0 && (
        <div className="bg-hp-blue/10 border border-hp-blue/20 p-6 rounded-[2rem] animate-fade-in-up shadow-premium-glow" role="status">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h3 className="font-display font-bold text-xl text-white mb-2">✨ Se detectaron nuevos códigos</h3>
              <p className="text-slate-400 text-sm">
                Se encontraron <strong>{codesNew.length}</strong> códigos que no están en el catálogo maestro.
              </p>
            </div>
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-bold text-hp-blue-vibrant hover:text-white hover:bg-hp-blue/20 transition-all"
              onClick={() => setCodesNew(() => [])}
            >
              Ignorar todo
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-hp-blue/20">
            {codesNew.map((code: string) => {
              const { description } = getEventInfoForCode(code)
              return (
                <div key={code} className="flex items-center justify-between gap-4 p-4 bg-hp-dark/40 border border-white/5 rounded-2xl group hover:border-hp-blue/40 transition-all">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-display font-bold text-lg text-white group-hover:text-hp-blue-vibrant transition-colors">{code}</span>
                    <span className="text-[11px] text-slate-500 truncate" title={description}>{description}</span>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 px-4 py-2 bg-hp-blue-vibrant hover:bg-hp-blue text-white rounded-xl text-[11px] font-bold shadow-lg shadow-hp-blue/20 transition-all active:scale-95"
                    onClick={() => setAddCodeModalCode(code)}
                    disabled={savingCode}
                  >
                    Agregar
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modales locales de códigos */}
      {addCodeModalCode && (
        <AddCodeToCatalogModal
          code={addCodeModalCode}
          initialDescription={getEventInfoForCode(addCodeModalCode).description}
          initialSeverity={getEventInfoForCode(addCodeModalCode).severity}
          onSave={(body) => onSaveCodeToCatalog(body, false)}
          onClose={() => !savingCode && setAddCodeModalCode(null)}
          saving={savingCode}
        />
      )}

      {editCodeInitial && (
        <AddCodeToCatalogModal
          code={editCodeInitial.code}
          initialDescription={editCodeInitial.description}
          initialSeverity={editCodeInitial.severity}
          initialSolutionUrl={editCodeInitial.solutionUrl}
          title="Editar código en el catálogo"
          submitLabel="Guardar"
          onSave={(body) => onSaveCodeToCatalog(body, true)}
          onClose={() => !savingCode && setEditCodeInitial(null)}
          saving={savingCode}
        />
      )}

      {codesNew.length === 0 && (
        <>
          {/* Executive Summary (Report perspective) */}
          <div className="report-only-section" ref={refs.executiveSummaryRef}>
            <ExecutiveSummary
              result={result}
              filteredIncidents={filteredIncidents}
              filteredEvents={filteredEvents}
              consumableWarnings={realtimeConsumables}
              lastErrorLabel={lastErrorLabel}
              logFileName={logFileName}
              serialNumber={currentSerialNumber}
            />
          </div>

          {/* Subheader: Titulo y Filtros */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-4 border-b border-white/5 animate-fade-in-up">
            <div className="flex items-center gap-4">
              <div className="w-2 h-8 bg-hp-blue-vibrant rounded-full shadow-premium-glow" />
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-white m-0">
                  Panel de errores y análisis
                </h2>
                {currentModelName && (
                  <p className="text-xs font-semibold text-slate-500 mt-0.5 uppercase tracking-widest">
                    Hardware Model: <span className="text-hp-blue-vibrant">{currentModelName}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white/5 p-1 rounded-2xl border border-white/5">
              <DateRangePicker
                activeFilter={activeFilter}
                minDate={dateRange ? new Date(dateRange.minDate + 'T00:00:00') : undefined}
                maxDate={dateRange ? new Date(dateRange.maxDate + 'T00:00:00') : undefined}
                onChange={(filter) => {
                  if (filter === null) {
                    dateFilter.reset()
                  } else if (typeof filter === 'string') {
                    dateFilter.setSelectedDate(filter)
                    dateFilter.setSelectedWeekRange(null)
                  } else {
                    dateFilter.setSelectedWeekRange(filter)
                    dateFilter.setSelectedDate(null)
                  }
                }}
              />
            </div>
          </div>

          {/* Fila 1 — KPIs */}
          <section ref={refs.kpisRef}>
            <KPICards
              filteredIncidents={filteredIncidents}
              filteredEvents={filteredEvents}
              lastErrorEvent={lastErrorEvent}
              lastErrorLabel={lastErrorLabel}
            />
          </section>

          {/* IA Diagnosis */}
          <AIDiagnosticPanel
            ref={refs.aiDiagnosticRef}
            result={result}
            consumables={realtimeConsumables}
            alerts={insightData.data}
            meters={insightData.meters}
          />

          {/* SDS y Hardware */}
          {sdsIncident && (
            <SDSIncidentPanel
              sdsIncident={sdsIncident}
              incidentRows={incidentRows.map((r) => ({
                code: r.code,
                classification: r.classification || r.code,
              }))}
              incidentsFull={
                result?.incidents?.map((inc: any) => ({
                  code: inc.code,
                  classification: inc.classification,
                  end_time: inc.end_time,
                  occurrences: inc.occurrences,
                })) ?? []
              }
            />
          )}

          <div ref={refs.consumableRef}>
            <ConsumableWarningsPanel warnings={realtimeConsumables} />
          </div>

          <InsightAlertsPanel
            serial={currentSerialNumber}
            data={insightData.data}
            loading={insightData.loading}
            error={insightData.error}
          />

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
            <div ref={refs.areaChartRef} className="glass-card p-6 rounded-3xl group h-[500px] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-slate-200">Cronología de Eventos</h3>
              </div>
              <div className="flex-1 min-h-0">
                <IncidentsChart
                events={result.events}
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
            </div>
            <div ref={refs.barChartRef} className="glass-card p-6 rounded-3xl h-[500px] flex flex-col">
               <h3 className="font-display font-bold text-slate-200 mb-4">Top Eventos Críticos</h3>
               <div className="flex-1 min-h-0">
                  <TopErrorsChart topCodes={getTopIncidentsForChart(result.incidents, result.events, activeFilter, 5)} />
               </div>
            </div>
          </div>

          {/* Tablas principales */}
          <section ref={refs.incidentsTableRef} className="glass-card rounded-3xl overflow-hidden shadow-premium-md">
            <IncidentsTable
              incidentRows={incidentRows}
              hasCpmdModel={currentModelHasCpmd}
              onEditCode={onEditCode}
              onViewSolution={onViewSolution}
            />
          </section>

          <section className="animate-fade-in-up">
            <EventsTable
              events={filteredEvents}
              onViewSolution={onViewSolution}
            />
          </section>
        </>
      )}
    </div>
  )
}

// Auxiliar function moved from DashboardPage or locally defined
function getTopIncidentsForChart(
  incidents: any[],
  events: any[],
  selectedDate: DateFilter,
  n: number
): { name: string; count: number; severity: string }[] {
  // Logic from DashboardPage.tsx
  const window = getWindowForDate(events, selectedDate)
  if (!window) return []
  const { minTs, maxTs } = window
  const withCount = incidents
    .map((inc) => {
      const countInWindow = inc.events.filter((e: any) => {
        const t = new Date(e.timestamp).getTime()
        return !Number.isNaN(t) && t >= minTs && t <= maxTs
      }).length
      return { inc, countInWindow }
    })
    .filter((x) => x.countInWindow > 0)
  return withCount
    .sort((a, b) => b.countInWindow - a.countInWindow)
    .slice(0, n)
    .map((x) => ({ name: x.inc.code, count: x.countInWindow, severity: x.inc.severity }))
}

