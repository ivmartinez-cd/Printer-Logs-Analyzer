import { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import {
  listSavedAnalyses,
  getSavedAnalysis,
  compareSavedAnalysis,
  deleteSavedAnalysis,
  resolveDevice,
  extractSdsLogs,
} from '../services/api'
import type { HealthStatus } from '../services/api'
import type {
  ParseLogsResponse,
  EnrichedEvent as ApiEvent,
  Incident as ApiIncident,
  SavedAnalysisSummary,
  SavedAnalysisFull,
  CompareResponse,
} from '../types/api'
import { AddCodeToCatalogModal } from '../components/AddCodeToCatalogModal'
import { ConfirmModal } from '../components/ConfirmModal'
import { SaveIncidentModal } from '../components/SaveIncidentModal'
import { SDSIncidentModal } from '../components/SDSIncidentModal'
import { SDSIncidentPanel } from '../components/SDSIncidentPanel'
import { ConsumableWarningsPanel } from '../components/ConsumableWarningsPanel'
import { SolutionContentModal } from '../components/SolutionContentModal'
import { HelpModal } from '../components/HelpModal'
import { AIDiagnosticPanel } from '../components/AIDiagnosticPanel'
import { InsightAlertsPanel } from '../components/InsightAlertsPanel'
import { DateRangePicker } from '../components/DateRangePicker'
import { SavedAnalysisList } from '../components/SavedAnalysisList'
import { SavedAnalysisDetail } from '../components/SavedAnalysisDetail'
import { KPICards } from '../components/KPICards'
import { EventsTable } from '../components/EventsTable'
import { IncidentsTable, type IncidentRow } from '../components/IncidentsTable'
import { IncidentsChart } from '../components/IncidentsChart'
import { TopErrorsChart } from '../components/TopErrorsChart'
import { DashboardHeader } from '../components/DashboardHeader'
import { ExecutiveSummary } from '../components/ExecutiveSummary'
import { useExportPdf } from '../hooks/useExportPdf'
import { useModals } from '../hooks/useModals'
import { useAnalysis } from '../hooks/useAnalysis'
import { useToast } from '../contexts/ToastContext'
import { LogPasteModal } from '../components/LogPasteModal'
import {
  useDateFilter,
  filterEventsByDate,
  filterIncidentsByDate,
  getDateRangeFromEvents,
  getWindowForDate,
  type DateFilter,
} from '../hooks/useDateFilter'


function getIncidentTableRows(
  incidents: ApiIncident[],
  events: ApiEvent[],
  selectedDate: DateFilter
): IncidentRow[] {
  const filtered = filterIncidentsByDate(incidents, events, selectedDate)
  const window = getWindowForDate(events, selectedDate)
  if (!window) return []
  const { minTs, maxTs } = window
  return filtered
    .map((inc) => {
      const inWindow = inc.events
        .filter((e) => {
          const t = new Date(e.timestamp).getTime()
          return !Number.isNaN(t) && t >= minTs && t <= maxTs
        })
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      if (inWindow.length === 0) return null
      const times = inWindow.map((e) => new Date(e.timestamp).getTime())
      return {
        id: inc.id,
        code: inc.code,
        classification: inc.classification || inc.code,
        severity: inc.severity,
        severity_weight: inc.severity_weight,
        occurrences: inWindow.length,
        start_time: new Date(Math.min(...times)).toISOString(),
        end_time: new Date(Math.max(...times)).toISOString(),
        sds_link: inc.sds_link ?? null,
        sds_solution_content: inc.sds_solution_content ?? null,
        eventsInWindow: inWindow,
      }
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => {
      if (b.severity_weight !== a.severity_weight) return b.severity_weight - a.severity_weight
      return new Date(b.end_time).getTime() - new Date(a.end_time).getTime()
    })
}

function getTopIncidentsForChart(
  incidents: ApiIncident[],
  events: ApiEvent[],
  selectedDate: DateFilter,
  n: number
): { name: string; count: number; severity: string }[] {
  const window = getWindowForDate(events, selectedDate)
  if (!window) return []
  const { minTs, maxTs } = window
  const withCount = incidents
    .map((inc) => {
      const countInWindow = inc.events.filter((e) => {
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


function getEventInfoForCode(
  result: ParseLogsResponse | null,
  code: string
): { description: string; severity: string } {
  if (!result?.events?.length) return { description: '', severity: 'INFO' }
  const ev = result.events.find((e) => e.code === code)
  return {
    description: ev?.help_reference?.trim() ?? ev?.code_description?.trim() ?? '',
    severity: (ev?.type?.toUpperCase() ?? 'INFO') as string,
  }
}


function DbStatusBadge({ status }: { status: HealthStatus | null }) {
  if (!status) return null
  const online = status.db_available
  return (
    <span
      className={`db-status-badge ${online ? 'db-status-badge--ok' : 'db-status-badge--offline'}`}
    >
      <span className="db-status-badge__dot" aria-hidden="true" />
      {online ? 'DB conectada' : 'DB offline · modo local'}
    </span>
  )
}

export default function DashboardPage({
  serverWasCold,
  healthStatus,
  initialSerial,
}: {
  serverWasCold: boolean
  healthStatus: HealthStatus | null
  initialSerial?: string | null
}) {
  const dateFilter = useDateFilter()
  const {
    setSelectedDate,
    setSelectedWeekRange,
    activeFilter,
  } = dateFilter
  const [viewMode, setViewMode] = useState<'dashboard' | 'saved-list' | 'saved-detail'>('dashboard')
  const [savedList, setSavedList] = useState<SavedAnalysisSummary[] | null>(null)
  const [savedListSearch, setSavedListSearch] = useState('')
  const [savedDetail, setSavedDetail] = useState<SavedAnalysisFull | null>(null)
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null)
  const [compareLogText, setCompareLogText] = useState('')
  const [compareFileName, setCompareFileName] = useState<string | undefined>(undefined)
  const [comparing, setComparing] = useState(false)
  const compareFileInputRef = useRef<HTMLInputElement>(null)
  const [compareResult, setCompareResult] = useState<CompareResponse | null>(null)
  const [parseErrorsExpanded, setParseErrorsExpanded] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [logFileName, setLogFileName] = useState<string | null>(null)
  const [currentModelId, setCurrentModelId] = useState<string | null>(null)
  const [currentModelHasCpmd, setCurrentModelHasCpmd] = useState(false)
  const [currentSerialNumber, setCurrentSerialNumber] = useState<string | null>(null)
  const [visibleSeverities, setVisibleSeverities] = useState<Set<string>>(
    new Set(['ERROR', 'WARNING', 'INFO'])
  )
  const [autoExtracting, setAutoExtracting] = useState(false)

  const toast = useToast()
  const modals = useModals()
  const {
    logModalOpen,
    setLogModalOpen,
    sdsPreModalOpen,
    setSdsPreModalOpen,
    sdsModalOpen,
    setSdsModalOpen,
    sdsIncident,
    setSdsIncident,
    addCodeModalCode,
    setAddCodeModalCode,
    editCodeInitial,
    setEditCodeInitial,
    saveIncidentModalOpen,
    setSaveIncidentModalOpen,
    compareModalOpen,
    setCompareModalOpen,
    deleteConfirm,
    setDeleteConfirm,
    solutionModal,
    setSolutionModal,
    helpModalOpen,
    setHelpModalOpen,
  } = modals

  const {
    exportingPdf,
    handleExportPDF,
    dashboardRef,
    executiveSummaryRef,
    aiDiagnosticRef,
    kpisRef,
    consumableRef,
    areaChartRef,
    barChartRef,
    incidentsTableRef,
  } = useExportPdf(logFileName)

  const {
    loading,
    error,
    setError,
    result,
    pendingResult,
    codesNew,
    setCodesNew,
    savingCode,
    savingIncident,
    handleAnalyze,
    commitPendingResult,
    handleSaveCodeToCatalog,
    handleSaveIncident,
  } = useAnalysis({
    setLogFileName,
    resetDateFilter: dateFilter.reset,
    resetFilters: () => {},
    setLogModalOpen,
    setSdsPreModalOpen,
    setAddCodeModalCode,
    setEditCodeInitial,
    setSaveIncidentModalOpen,
  })

  const autoResolveAndAnalyze = useCallback(async (serial: string) => {
    setAutoExtracting(true)
    setError(null)
    setLogModalOpen(false)
    try {
      // 1. Resolve device info
      const info = await resolveDevice(serial)
      setCurrentSerialNumber(serial)
      
      if (info.suggested_model_id) {
        setCurrentModelId(info.suggested_model_id)
        setCurrentModelHasCpmd(info.has_cpmd)
      } else {
        toast.showWarning(`Modelo detectado: ${info.model_name_sds}. No se encontró coincidencia exacta en el catálogo local.`)
      }

      // 2. Extract logs
      const sdsRes = await extractSdsLogs(serial)
      if (!sdsRes.logs_text) {
        throw new Error('No se encontraron logs para este número de serie.')
      }

      // 3. Analyze
      const fileName = `Portal_SDS_${serial}.tsv`
      await handleAnalyze(sdsRes.logs_text, fileName, info.suggested_model_id)
      
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      toast.showError(msg)
    } finally {
      setAutoExtracting(false)
    }
  }, [handleAnalyze, setCurrentModelHasCpmd, setCurrentModelId, setCurrentSerialNumber, setError, setLogModalOpen, toast])

  const autoExtractRef = useRef(false)
  // Effect for Deep Linking: Auto-start if initialSerial is provided
  useEffect(() => {
    if (initialSerial && !autoExtractRef.current) {
      autoExtractRef.current = true
      autoResolveAndAnalyze(initialSerial)
    }
  }, [initialSerial, autoResolveAndAnalyze])

  const events = useMemo(() => result?.events ?? [], [result])
  const incidents = useMemo(() => result?.incidents ?? [], [result])
  const parseErrorsCount = result?.errors?.length ?? 0

  const filteredEvents = useMemo(
    () => filterEventsByDate(events, activeFilter),
    [events, activeFilter]
  )
  const filteredIncidents = useMemo(
    () => filterIncidentsByDate(incidents, events, activeFilter),
    [incidents, events, activeFilter]
  )
  const dateRange = useMemo(() => getDateRangeFromEvents(events), [events])
  const lastErrorEvent = useMemo(
    () =>
      [...filteredEvents]
        .filter((e) => e.type.toUpperCase() === 'ERROR')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0] ??
      null,
    [filteredEvents]
  )
  const lastErrorLabel = lastErrorEvent
    ? new Date(lastErrorEvent.timestamp).toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null
  const topCodes = useMemo(
    () => getTopIncidentsForChart(incidents, events, activeFilter, 5),
    [incidents, events, activeFilter]
  )
  const incidentRows = useMemo(
    () => getIncidentTableRows(incidents, events, activeFilter),
    [incidents, events, activeFilter]
  )

  return (
    <div className={`dashboard${exportingPdf ? ' is-exporting' : ''}`} ref={dashboardRef}>
      <header className="export-header">
        <div className="export-header__left">
          <h1 className="dashboard__title">HP Logs Analyzer</h1>
          <p className="dashboard__report-type">Reporte de Análisis de Diagnóstico Técnico</p>
        </div>
        <div className="export-header__right dashboard__subheader">
          <div>Archivo: <strong>{logFileName || 'Logs Pegados'}</strong></div>
          {currentSerialNumber && <div>Serial: <strong>{currentSerialNumber}</strong></div>}
          {result && (
            <div className="export-header__period">
              Periodo: {new Date(result.log_start_date).toLocaleDateString()} - {new Date(result.log_end_date).toLocaleDateString()}
            </div>
          )}
          {result && <div>Total Eventos: <strong>{result.incidents.length + result.events.length}</strong></div>}
          <div className="export-header__date">Generado el {new Date().toLocaleString()}</div>
        </div>
      </header>
      {!result && viewMode === 'dashboard' ? (
        /* Sin resultado y vista dashboard: marco de bienvenida */
        <div className="dashboard__frame">
          <header className="dashboard__header dashboard__header--inside-frame">
            <div className="dashboard__title-group">
              <svg
                className="dashboard__title-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <h1 className="dashboard__title">HP Logs Analyzer</h1>
            </div>
            <DbStatusBadge status={healthStatus} />
          </header>
          <div className="dashboard__welcome-wrap">
            <section className="dashboard__welcome">
              <p className="dashboard__tagline">
                Analiza logs de impresoras HP, detecta errores por severidad y visualiza tendencias
                en segundos.
              </p>
              <div className="dashboard__welcome-actions">
                <button
                  type="button"
                  className="dashboard__btn dashboard__btn--primary dashboard__btn--welcome"
                  onClick={() => setLogModalOpen(true)}
                >
                  Pegar logs y analizar
                </button>
                <button
                  type="button"
                  className="dashboard__btn dashboard__btn--secondary dashboard__btn--welcome-secondary"
                  onClick={() => {
                    setViewMode('saved-list')
                    setSavedList(null)
                    setSavedListSearch('')
                    listSavedAnalyses()
                      .then(setSavedList)
                      .catch(() => setSavedList([]))
                  }}
                >
                  Ver logs guardados
                </button>
                <button
                  type="button"
                  className="dashboard__btn dashboard__btn--ghost dashboard__btn--help"
                  onClick={() => setHelpModalOpen(true)}
                  title="¿Cómo funciona?"
                >
                  ¿Cómo funciona?
                </button>
              </div>
              <div className="dashboard__features">
                <span className="dashboard__features-title">¿Qué vas a ver?</span>
                <div className="dashboard__features-grid">
                  <div className="dashboard__feature-item">
                    <span className="dashboard__feature-icon">📊</span>
                    <div className="dashboard__feature-text">
                      <strong>KPIs de severidad</strong>
                      Error · Warning · Info y códigos únicos
                    </div>
                  </div>
                  <div className="dashboard__feature-item">
                    <span className="dashboard__feature-icon">📈</span>
                    <div className="dashboard__feature-text">
                      <strong>Gráfico temporal</strong>
                      Volumen de eventos filtrable por día
                    </div>
                  </div>
                  <div className="dashboard__feature-item">
                    <span className="dashboard__feature-icon">🏅</span>
                    <div className="dashboard__feature-text">
                      <strong>Top 5 errores</strong>
                      Códigos con mayor ocurrencia en el log
                    </div>
                  </div>
                  <div className="dashboard__feature-item">
                    <span className="dashboard__feature-icon">📋</span>
                    <div className="dashboard__feature-text">
                      <strong>Tabla de incidencias</strong>
                      Timestamp, código, severidad y mensaje
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      ) : result || viewMode === 'saved-list' || viewMode === 'saved-detail' ? (
        <>
          <DashboardHeader
            logFileName={logFileName}
            healthStatus={healthStatus}
            hasResult={!!result}
            exportingPdf={exportingPdf}
            onOpenSavedList={() => {
              setViewMode('saved-list')
              setSavedList(null)
              setSavedListSearch('')
              listSavedAnalyses()
                .then(setSavedList)
                .catch(() => setSavedList([]))
            }}
            onAnalyzeNew={() => setLogModalOpen(true)}
            onSaveIncident={() => setSaveIncidentModalOpen(true)}
            onExportPdf={() => handleExportPDF(!!result)}
            onHelp={() => setHelpModalOpen(true)}
          />

          {viewMode === 'saved-list' && (
            <SavedAnalysisList
              savedList={savedList}
              savedListSearch={savedListSearch}
              setSavedListSearch={setSavedListSearch}
              deletingId={deletingId}
              onBack={() => setViewMode('dashboard')}
              onOpen={(id) => {
                setSelectedSavedId(id)
                setSavedDetail(null)
                setCompareResult(null)
                setViewMode('saved-detail')
                getSavedAnalysis(id)
                  .then(setSavedDetail)
                  .catch(() => toast.showError('Error al cargar'))
              }}
              onDelete={setDeleteConfirm}
            />
          )}

          {viewMode === 'saved-detail' && selectedSavedId && (
            <SavedAnalysisDetail
              savedDetail={savedDetail}
              deletingId={deletingId}
              compareResult={compareResult}
              onBack={() => {
                setViewMode('saved-list')
                setSavedDetail(null)
                setSelectedSavedId(null)
                setCompareResult(null)
              }}
              onDelete={setDeleteConfirm}
              onCompare={() => {
                setCompareLogText('')
                setCompareFileName(undefined)
                setCompareModalOpen(true)
              }}
            />
          )}

          {viewMode === 'dashboard' && (
            <>
              {parseErrorsCount > 0 && (
                <div className="dashboard__parse-errors-banner" role="alert">
                  <button
                    className="dashboard__parse-errors-toggle"
                    onClick={() => setParseErrorsExpanded((v) => !v)}
                    aria-expanded={parseErrorsExpanded}
                  >
                    <span>Se omitieron {parseErrorsCount} líneas por formato inválido</span>
                    <span className="dashboard__parse-errors-chevron">
                      {parseErrorsExpanded ? '▲' : '▼'}
                    </span>
                  </button>
                  {parseErrorsExpanded && (
                    <table className="dashboard__parse-errors-table">
                      <thead>
                        <tr>
                          <th>Línea</th>
                          <th>Texto crudo</th>
                          <th>Motivo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(result?.errors ?? []).map((e) => (
                          <tr key={e.line_number}>
                            <td>{e.line_number}</td>
                            <td>
                              <code>{e.raw_line}</code>
                            </td>
                            <td>{e.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {result && codesNew.length > 0 && (
                <div className="dashboard__codes-new-section" role="status">
                  <p className="dashboard__codes-new-intro">
                    Se detectaron {codesNew.length} código{codesNew.length !== 1 ? 's' : ''} nuevo
                    {codesNew.length !== 1 ? 's' : ''} que no están en el catálogo. Agrega cada uno
                    con su URL de solución si la tienes.
                  </p>
                  <ul className="dashboard__codes-new-list">
                    {codesNew.map((code) => {
                      const { description } = getEventInfoForCode(result, code)
                      return (
                        <li key={code} className="dashboard__codes-new-item">
                          <span className="dashboard__codes-new-code">{code}</span>
                          {description && (
                            <span className="dashboard__codes-new-desc" title={description}>
                              {description.slice(0, 60)}
                              {description.length > 60 ? '…' : ''}
                            </span>
                          )}
                          <button
                            type="button"
                            className="dashboard__btn dashboard__btn--secondary dashboard__btn--small"
                            onClick={() => setAddCodeModalCode(code)}
                            disabled={savingCode}
                          >
                            Agregar al catálogo
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                  <button
                    type="button"
                    className="dashboard__btn dashboard__btn--secondary"
                    onClick={() => setCodesNew([])}
                  >
                    Ignorar y ver resultados
                  </button>
                </div>
              )}

              {addCodeModalCode && result && (
                <AddCodeToCatalogModal
                  code={addCodeModalCode}
                  initialDescription={getEventInfoForCode(result, addCodeModalCode).description}
                  initialSeverity={getEventInfoForCode(result, addCodeModalCode).severity}
                  onSave={(body) => handleSaveCodeToCatalog(body, false)}
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
                  onSave={(body) => handleSaveCodeToCatalog(body, true)}
                  onClose={() => !savingCode && setEditCodeInitial(null)}
                  saving={savingCode}
                />
              )}

              {codesNew.length === 0 && (
                <>
                  {result && (
                    <div className="report-only-section" ref={executiveSummaryRef}>
                      <ExecutiveSummary
                        result={result}
                        filteredIncidents={filteredIncidents}
                        filteredEvents={filteredEvents}
                        consumableWarnings={result?.consumable_warnings ?? []}
                        lastErrorLabel={lastErrorLabel}
                        logFileName={logFileName}
                        serialNumber={currentSerialNumber}
                      />
                    </div>
                  )}
                  {/* Subheader: Panel de errores | filtro de fecha */}
                  <div className="dashboard__subheader">
                    <span className="dashboard__subheader-title">
                      Panel de errores{logFileName ? ` · ${logFileName}` : ''}
                    </span>
                    <div className="dashboard__subheader-actions">
                      <DateRangePicker
                        activeFilter={activeFilter}
                        minDate={dateRange ? new Date(dateRange.minDate + 'T00:00:00') : undefined}
                        maxDate={dateRange ? new Date(dateRange.maxDate + 'T00:00:00') : undefined}
                        onChange={(filter) => {
                          if (filter === null) {
                            dateFilter.reset()
                          } else if (typeof filter === 'string') {
                            setSelectedDate(filter)
                            setSelectedWeekRange(null)
                          } else {
                            setSelectedWeekRange(filter)
                            setSelectedDate(null)
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Fila 1 — KPIs (4 cards, mismo tamaño) */}
                  <section ref={kpisRef}>
                    <KPICards
                      filteredIncidents={filteredIncidents}
                      filteredEvents={filteredEvents}
                      lastErrorEvent={lastErrorEvent}
                      lastErrorLabel={lastErrorLabel}
                    />
                  </section>

                  {/* Diagnóstico con IA — llama a /analysis/ai-diagnose on demand */}
                  <AIDiagnosticPanel ref={aiDiagnosticRef} result={result} />

                  {/* SDS Engineering Incident — colapsado por defecto */}
                  {sdsIncident && (
                    <SDSIncidentPanel
                      sdsIncident={sdsIncident}
                      incidentRows={incidentRows.map((r) => ({
                        code: r.code,
                        classification: r.classification || r.code,
                      }))}
                      incidentsFull={
                        result?.incidents?.map((inc) => ({
                          code: inc.code,
                          classification: inc.classification,
                          end_time: inc.end_time,
                          occurrences: inc.occurrences,
                        })) ?? []
                      }
                      consumableWarnings={result?.consumable_warnings ?? []}
                    />
                  )}

                  {/* Consumable warnings — colapsado por defecto */}
                  <div ref={consumableRef}>
                    <ConsumableWarningsPanel warnings={result?.consumable_warnings ?? []} />
                  </div>

                  {/* Insight SDS alerts — se oculta si no hay serial o si la integración no está configurada */}
                  <InsightAlertsPanel serial={currentSerialNumber} />

                  {/* Fila 2 — Grid 70% / 30%: Issue Volume | Top Errors */}
                  <div className="dashboard__charts-row">
                    <div ref={areaChartRef}>
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
                    <div ref={barChartRef}>
                      <TopErrorsChart topCodes={topCodes} />
                    </div>
                  </div>

                  {/* Fila 3 — Tabla de incidencias */}
                  <section ref={incidentsTableRef}>
                    <IncidentsTable
                      incidentRows={incidentRows}
                      hasCpmdModel={currentModelHasCpmd}
                      onEditCode={(code, classification, severity, solutionUrl) =>
                        setEditCodeInitial({
                          code,
                          description: classification,
                          severity,
                          solutionUrl,
                        })
                      }
                      onViewSolution={(code, sdsContent, sdsUrl) =>
                        setSolutionModal({ code, sdsContent, sdsUrl })
                      }
                    />
                  </section>

                  {/* Fila 4 — Tabla de eventos recientes (colapsable) */}
                  <EventsTable
                    events={filteredEvents}
                    onViewSolution={(code, sdsContent, sdsUrl) =>
                      setSolutionModal({ code, sdsContent, sdsUrl })
                    }
                  />
                </>
              )}
            </>
          )}
        </>
      ) : null}

      {sdsModalOpen && (
        <SDSIncidentModal
          onContinue={(data) => {
            setSdsIncident(data)
            setSdsModalOpen(false)
            if (pendingResult !== null) commitPendingResult()
          }}
          onClose={() => {
            setSdsModalOpen(false)
            if (pendingResult !== null) commitPendingResult()
          }}
        />
      )}

      {sdsPreModalOpen && (
        <ConfirmModal
          title="¿Agregar incidente SDS?"
          message="¿Querés asociar un incidente del SDS a este análisis?"
          confirmLabel="Sí, agregar"
          cancelLabel="No, continuar"
          onConfirm={() => {
            setSdsPreModalOpen(false)
            setSdsModalOpen(true)
          }}
          onCancel={() => {
            setSdsPreModalOpen(false)
            commitPendingResult()
          }}
        />
      )}

      {/* Modal: siempre encima cuando está abierto (desde bienvenida o desde dashboard) */}
      {logModalOpen && (
        <LogPasteModal
          loading={loading}
          error={error}
          serverWasCold={serverWasCold}
          onAnalyze={(logText, fileName, modelId, hasCpmd, serial, isAutomated) => {
            if (isAutomated && serial) {
              autoResolveAndAnalyze(serial)
              return
            }
            setCurrentModelId(modelId ?? null)
            setCurrentModelHasCpmd(hasCpmd ?? false)
            setCurrentSerialNumber(serial ?? null)
            handleAnalyze(logText, fileName, modelId)
          }}
          onClose={() => {
            setError(null)
            setLogModalOpen(false)
          }}
        />
      )}

      {saveIncidentModalOpen && result && (
        <SaveIncidentModal
          onSave={handleSaveIncident}
          onClose={() => !savingIncident && setSaveIncidentModalOpen(false)}
          saving={savingIncident}
        />
      )}

      {deleteConfirm && (
        <ConfirmModal
          title="Borrar incidente"
          message={`¿Borrar el incidente "${deleteConfirm.name}"? Esta acción no se puede deshacer.`}
          confirmLabel="Borrar"
          cancelLabel="Cancelar"
          loading={deletingId === deleteConfirm.id}
          onConfirm={async () => {
            setDeletingId(deleteConfirm.id)
            try {
              await deleteSavedAnalysis(deleteConfirm.id)
              setSavedList((prev) => (prev ? prev.filter((x) => x.id !== deleteConfirm.id) : []))
              if (selectedSavedId === deleteConfirm.id) {
                setViewMode('saved-list')
                setSavedDetail(null)
                setSelectedSavedId(null)
                setCompareResult(null)
              }
              toast.showSuccess('Incidente borrado')
            } catch (e) {
              toast.showError(e instanceof Error ? e.message : 'Error al borrar')
            } finally {
              setDeletingId(null)
              setDeleteConfirm(null)
            }
          }}
          onCancel={() => !deletingId && setDeleteConfirm(null)}
        />
      )}

      {solutionModal && (
        <SolutionContentModal
          code={solutionModal.code}
          modelId={currentModelId}
          sdsContent={solutionModal.sdsContent}
          sdsUrl={solutionModal.sdsUrl}
          onClose={() => setSolutionModal(null)}
        />
      )}

      {autoExtracting && (
        <div className="log-modal-overlay" style={{ zIndex: 3000 }}>
          <div className="log-modal" style={{ textAlign: 'center', padding: '40px' }}>
            <div className="log-modal__spinner" style={{ margin: '0 auto 20px', width: '40px', height: '40px' }} />
            <h2 className="log-modal__title">Extrayendo logs automáticamente…</h2>
            <p style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>
              Estamos conectando con el portal SDS para el equipo <strong>{currentSerialNumber}</strong>.
              Esto puede tardar hasta 30 segundos.
            </p>
          </div>
        </div>
      )}

      {compareModalOpen && selectedSavedId && (
        <div
          className="log-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="compare-modal-title"
        >
          <div className="log-modal">
            <div className="log-modal__header">
              <h2 id="compare-modal-title" className="log-modal__title">
                Comparar con log nuevo
              </h2>
              <button
                type="button"
                className="log-modal__close"
                onClick={() => !comparing && setCompareModalOpen(false)}
                aria-label="Cerrar"
                disabled={comparing}
              >
                ×
              </button>
            </div>
            <div className="log-modal__file-row">
              <input
                ref={compareFileInputRef}
                type="file"
                accept=".log,.txt,.tsv,text/plain"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = (ev) => {
                    setCompareLogText(ev.target?.result as string)
                    setCompareFileName(file.name)
                  }
                  reader.readAsText(file)
                }}
              />
              <button
                type="button"
                className="log-modal__btn-secondary"
                onClick={() => compareFileInputRef.current?.click()}
                disabled={comparing}
              >
                Cargar archivo…
              </button>
              {compareFileName && <span className="log-modal__file-name">{compareFileName}</span>}
            </div>
            <textarea
              className="log-modal__textarea"
              placeholder="Pegar logs HP aquí..."
              value={compareLogText}
              onChange={(e) => setCompareLogText(e.target.value)}
              disabled={comparing}
            />
            <div className="log-modal__actions">
              <button
                type="button"
                className="dashboard__btn dashboard__btn--primary"
                onClick={async () => {
                  if (!compareLogText.trim() || !selectedSavedId) return
                  setComparing(true)
                  try {
                    const res = await compareSavedAnalysis(selectedSavedId, compareLogText)
                    setCompareResult(res)
                    setCompareModalOpen(false)
                    toast.showSuccess('Comparación completada')
                  } catch (e) {
                    toast.showError(e instanceof Error ? e.message : 'Error al comparar')
                  } finally {
                    setComparing(false)
                  }
                }}
                disabled={comparing || !compareLogText.trim()}
              >
                {comparing ? 'Comparando…' : 'Comparar'}
              </button>
              <button
                type="button"
                className="log-modal__btn-secondary"
                onClick={() => !comparing && setCompareModalOpen(false)}
                disabled={comparing}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {helpModalOpen && <HelpModal onClose={() => setHelpModalOpen(false)} />}
    </div>
  )
}
