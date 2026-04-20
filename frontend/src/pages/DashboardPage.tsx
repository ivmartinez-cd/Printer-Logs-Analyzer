import { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import {
  listSavedAnalyses,
  getSavedAnalysis,
  compareSavedAnalysis,
  deleteSavedAnalysis,
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
  ErrorCodeUpsertBody,
  RealtimeConsumable,
  ParserError,
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
import { Skeleton } from '../components/Skeleton'
import { ExecutiveSummary } from '../components/ExecutiveSummary'
import { useExportPdf } from '../hooks/useExportPdf'
import { useInsightData } from '../hooks/useInsightData'
import { useToast } from '../contexts/ToastContext'
import { LogPasteModal } from '../components/LogPasteModal'
import { WelcomeView } from '../components/WelcomeView'
import { MonitorWizard } from '../components/MonitorWizard'
import { MonitorDashboard } from '../components/MonitorDashboard'
import { DashboardHeader } from '../components/DashboardHeader'
import {
  useDateFilter,
  filterEventsByDate,
  filterIncidentsByDate,
  getDateRangeFromEvents,
  getWindowForDate,
  type DateFilter,
} from '../hooks/useDateFilter'
import { useAnalysisStore } from '../store/useAnalysisStore'
import { useUIStore } from '../store/useUIStore'


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
): { name: string; count: number; severity: string; sds_link?: string; sds_solution_content?: string | null }[] {
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
    .map((x) => ({ 
      name: x.inc.code, 
      count: x.countInWindow, 
      severity: x.inc.severity,
      sds_link: x.inc.sds_link,
      sds_solution_content: x.inc.sds_solution_content
    }))
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


// DbStatusBadge moved to DashboardHeader

export default function DashboardPage({
  serverWasCold,
  healthStatus,
  initialSerial,
  initialAnalysisId,
  initialIsSavedList,
  initialIsMonitor,
}: {
  serverWasCold: boolean
  healthStatus: HealthStatus | null
  initialSerial?: string | null
  initialAnalysisId?: string | null
  initialIsSavedList?: boolean
  initialIsMonitor?: boolean
}) {
  const dateFilter = useDateFilter()
  const {
    setSelectedDate,
    setSelectedWeekRange,
    activeFilter,
  } = dateFilter
  const {
    result,
    setResult,
    loading,
    error,
    setError,
    viewMode,
    setViewMode,
    logFileName,
    handleAnalyze,
    handleSaveCodeToCatalog: storeSaveCode,
    handleSaveIncident,
    codesNew,
    setCodesNew,
    savingCode,
    savingIncident,
    monitorClientId,
  } = useAnalysisStore()

  const toast = useToast()

  const {
    logModalOpen,
    setLogModalOpen,
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
    monitorWizardOpen,
    setMonitorWizardOpen,
  } = useUIStore()

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
  const [incidentsCollapsed, setIncidentsCollapsed] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [currentModelId, setCurrentModelId] = useState<string | null>(null)
  const [isAtTop, setIsAtTop] = useState(true)
  const [currentSerialNumber, setCurrentSerialNumber] = useState<string | null>(null)
  const [visibleSeverities, setVisibleSeverities] = useState<Set<string>>(
    new Set(['ERROR', 'WARNING', 'INFO'])
  )
  const [autoExtracting, setAutoExtracting] = useState(false)
  const [realtimeConsumables, setRealtimeConsumables] = useState<RealtimeConsumable[]>([])
  const [currentModelName, setCurrentModelName] = useState<string | null>(null)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  const lastNavState = useRef({ viewMode, currentSerialNumber, selectedSavedId })

  // URL Sync Effect: Write state to URL
  useEffect(() => {
    let newPath = '/'
    if (viewMode === 'dashboard') {
      if (currentSerialNumber) {
        newPath = `/${currentSerialNumber}`
      }
    } else if (viewMode === 'saved-detail' && selectedSavedId) {
      newPath = `/analysis/${selectedSavedId}`
    } else if (viewMode === 'saved-list') {
      newPath = '/saved-analyses'
    } else if (viewMode === 'monitor') {
      newPath = '/monitor'
    }

    if (window.location.pathname !== newPath) {
      // Logic: If we are already in dashboard and just changing serial, REPLACE.
      // If we are changing viewMode (e.g. Welcome -> Dashboard), PUSH.
      const shouldReplace = 
        viewMode === 'dashboard' && 
        lastNavState.current.viewMode === 'dashboard' &&
        lastNavState.current.currentSerialNumber !== null;

      if (shouldReplace) {
        window.history.replaceState({ viewMode, currentSerialNumber, selectedSavedId }, '', newPath)
      } else {
        window.history.pushState({ viewMode, currentSerialNumber, selectedSavedId }, '', newPath)
      }
      
      // Notify parent about the navigation change
      window.dispatchEvent(new CustomEvent('hp-navigation-change'))
    }
    lastNavState.current = { viewMode, currentSerialNumber, selectedSavedId }
  }, [viewMode, currentSerialNumber, selectedSavedId])

  useEffect(() => {
    const handleScroll = () => {
      setIsAtTop(window.scrollY < 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-fetch saved list and history on mount
  useEffect(() => {
    // 1. Fetch saved analyses list
    listSavedAnalyses()
      .then(setSavedList)
      .catch(() => setSavedList([]))

    // 2. Load search history from localStorage
    const history = localStorage.getItem('hp_search_history')
    if (history) {
      try {
        setRecentSearches(JSON.parse(history).slice(0, 5))
      } catch {
        setRecentSearches([])
      }
    }
  }, [])

  const saveToSearchHistory = useCallback((serial: string) => {
    const s = serial.trim().toUpperCase()
    if (!s) return
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item !== s)
      const next = [s, ...filtered].slice(0, 5)
      localStorage.setItem('hp_search_history', JSON.stringify(next))
      return next
    })
  }, [])

  const insightData = useInsightData(currentSerialNumber)

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

  const autoResolveAndAnalyze = useCallback(async (serial: string) => {
    setAutoExtracting(true)
    setError(null)
    setLogModalOpen(false)
    try {
      // 0. Update search history
      saveToSearchHistory(serial)

      // 1. Extract logs AND resolve device info in a single call
      const sdsRes = await extractSdsLogs(serial)
      setCurrentSerialNumber(serial)
      setCurrentModelName(sdsRes.model_name_sds)
      
      if (sdsRes.suggested_model_id) {
        setCurrentModelId(sdsRes.suggested_model_id)
      }

      setRealtimeConsumables(sdsRes.realtime_consumables || [])

      if (!sdsRes.logs_text) {
        throw new Error('No se encontraron logs para este número de serie.')
      }

      // 3. Analyze
      const fileName = `Portal_SDS_${serial}.tsv`
      await handleAnalyze(sdsRes.logs_text, fileName, sdsRes.suggested_model_id)
      
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      toast.showError(msg)
    } finally {
      setAutoExtracting(false)
    }
  }, [handleAnalyze, setCurrentModelId, setCurrentSerialNumber, setError, setLogModalOpen, toast, saveToSearchHistory])

  // Effect for Deep Linking: Auto-start if initialSerial is provided.
  // currentSerialNumber is read but intentionally NOT a dep: this effect must
  // only react to URL changes (initialSerial / initialAnalysisId). Including it
  // would re-run the effect after the user manually analyzes a serial from home,
  // falling into the else-branch and resetting state back to the welcome screen.
  useEffect(() => {
    if (initialIsSavedList) {
      setViewMode('saved-list')
      setSavedList(null)
      setSavedListSearch('')
      listSavedAnalyses().then(setSavedList).catch(() => setSavedList([]))
    } else if (initialIsMonitor) {
      setViewMode('monitor')
      // If we are in monitor mode but no client is selected, open the wizard automatically
      if (!monitorClientId) {
        setMonitorWizardOpen(true)
      }
    } else if (initialSerial) {
      setViewMode('dashboard')
      if (initialSerial !== currentSerialNumber) {
        autoResolveAndAnalyze(initialSerial)
      }
    } else if (!initialAnalysisId) {
      // Reset if we go back to root
      setCurrentSerialNumber(null)
      setResult(null)
      setViewMode('dashboard')
      setSelectedSavedId(null)
      setSavedDetail(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSerial, initialAnalysisId, initialIsSavedList, initialIsMonitor, autoResolveAndAnalyze, setCurrentSerialNumber, setResult])

  // Effect for Deep Linking: Load saved analysis if analysisId is provided
  useEffect(() => {
    if (initialAnalysisId && initialAnalysisId !== selectedSavedId) {
      setViewMode('saved-detail')
      setSelectedSavedId(initialAnalysisId)
      setSavedDetail(null)
      getSavedAnalysis(initialAnalysisId)
        .then(setSavedDetail)
        .catch(() => toast.showError('Error al cargar análisis guardado'))
    }
  }, [initialAnalysisId, selectedSavedId, setViewMode, toast])

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

  const handleSaveCodeToCatalog = useCallback(
    async (body: ErrorCodeUpsertBody, isEdit = false) => {
      try {
        const res = await storeSaveCode(body, isEdit)
        const baseMsg = isEdit
          ? `Código ${body.code} actualizado`
          : `Código ${body.code} agregado al catálogo`
        if (res.warning) {
          toast.showWarning(`${baseMsg}. ${res.warning}`)
        } else if (body.solution_url && res.solution_content_saved) {
          toast.showSuccess(`${baseMsg} — contenido de solución guardado`)
        } else {
          toast.showSuccess(baseMsg)
        }
        setAddCodeModalCode(null)
        setEditCodeInitial(null)
      } catch (e: unknown) {
        toast.showError(e instanceof Error ? e.message : String(e))
      }
    },
    [storeSaveCode, toast, setAddCodeModalCode, setEditCodeInitial]
  )

  const onSaveIncident = useCallback(
    async (name: string, equipmentIdentifier: string | null) => {
      try {
        await handleSaveIncident(name, equipmentIdentifier)
        setSaveIncidentModalOpen(false)
        toast.showSuccess('Incidente guardado')
      } catch (e: unknown) {
        toast.showError(e instanceof Error ? e.message : String(e))
      }
    },
    [handleSaveIncident, toast, setSaveIncidentModalOpen]
  )

  const isWelcome = !result && viewMode === 'dashboard';
  const dashboardClass = `dashboard ${exportingPdf ? 'is-exporting' : ''} ${isWelcome ? 'dashboard--welcome' : ''}`;

  return (
    <div className={dashboardClass} ref={dashboardRef}>
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

      {/* Solo mostrar el Header Flotante si hay resultados o estamos en una vista secundaria */}
      {/* Global Header (Always visible) */}
      {!isWelcome && (
        <DashboardHeader
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
          onAddSds={() => setSdsModalOpen(true)}
          onExportPdf={() => handleExportPDF(!!result)}
          onHelp={() => setHelpModalOpen(true)}
          isAtTop={isAtTop}
          showSavedListButton={viewMode !== 'monitor'}
        />
      )}
      {!result && viewMode === 'dashboard' ? (
        <WelcomeView 
          onAnalyzeNew={() => setLogModalOpen(true)}
          onViewSaved={() => {
            setViewMode('saved-list')
            setSavedList(null)
            setSavedListSearch('')
            listSavedAnalyses()
              .then(setSavedList)
              .catch(() => setSavedList([]))
          }}
          onHelp={() => setHelpModalOpen(true)}
          savedList={savedList || []}
          recentSearches={recentSearches}
          onQuickSearch={autoResolveAndAnalyze}
          onOpenSaved={(id) => {
            setViewMode('saved-detail')
            setSavedDetail(null)
            getSavedAnalysis(id)
              .then(setSavedDetail)
              .catch(() => setSavedDetail(null))
          }}
          onOpenMonitor={() => setMonitorWizardOpen(true)}
        />
      ) : viewMode === 'monitor' ? (
        <MonitorDashboard />
      ) : result || viewMode === 'saved-list' || viewMode === 'saved-detail' ? (
        <>
          {/* El botón de Asociar SDS ahora está en el Header para mayor limpieza */}
          <div className="dashboard__content-wrap">

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
                        {(result?.errors ?? []).map((e: ParserError) => (
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
                    {codesNew.map((code: string) => {
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
                    onClick={() => setCodesNew(() => [])}
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
                  {/* Fallback visual mientras carga el primer análisis */}
              {loading && !result && (
                <div className="dashboard__content-main animate-in">
                  <section className="dashboard__subheader">
                    <Skeleton className="skeleton--title" width="300px" />
                    <Skeleton className="skeleton--text" width="120px" height="32px" />
                  </section>
                  <section className="dashboard__kpi-grid">
                    <Skeleton className="skeleton--card" />
                    <Skeleton className="skeleton--card" />
                    <Skeleton className="skeleton--card" />
                    <Skeleton className="skeleton--card" />
                  </section>
                  <section style={{ marginTop: '24px' }}>
                    <Skeleton height="300px" />
                  </section>
                </div>
              )}

              {result && (
                    <div className="report-only-section" ref={executiveSummaryRef}>
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
                  )}
                  {/* Subheader: Panel de errores | filtro de fecha */}
                  <div className="dashboard__subheader">
                    <div className="dashboard__subheader-title-group">
                      <span className="dashboard__subheader-title">Panel de errores</span>
                      {(currentModelName || currentSerialNumber || logFileName) && (
                        <span className="dashboard__subheader-meta">
                          {currentModelName && currentModelName}
                          {currentSerialNumber && ` · ${currentSerialNumber}`}
                          {!currentSerialNumber && logFileName && logFileName}
                        </span>
                      )}
                    </div>
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

                  {/* ── ABOVE FOLD: KPIs + 2 gráficos siempre visibles ── */}
                  <div className="dashboard__above-fold">

                    {/* BLOQUE 1: KPIs ejecutivos */}
                    <section ref={kpisRef} className="animate-in delay-1">
                      <KPICards
                        filteredIncidents={filteredIncidents}
                        filteredEvents={filteredEvents}
                        lastErrorEvent={lastErrorEvent}
                        lastErrorLabel={lastErrorLabel}
                      />
                    </section>

                    {/* BLOQUE 2a: Gráfico de volumen */}
                    <div ref={areaChartRef} className="animate-in delay-2 dashboard__above-fold__chart">
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
                    <div ref={barChartRef} className="animate-in delay-2 dashboard__above-fold__chart">
                      <TopErrorsChart 
                        topCodes={topCodes} 
                        onViewSolution={(code, sdsContent, sdsUrl) =>
                          setSolutionModal({ code, sdsContent, sdsUrl })
                        }
                      />
                    </div>

                  </div>


                  {/* ── BLOQUE 4: Diagnóstico Inteligente (Destacado) ── */}
                  <AIDiagnosticPanel
                    ref={aiDiagnosticRef}
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
                    <section ref={incidentsTableRef} className="animate-in delay-3 collapsible-panel collapsible-panel--incidents">
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
                        </div>
                      )}
                    </section>

                    {/* Eventos del periodo */}
                    <EventsTable
                      events={filteredEvents}
                      onViewSolution={(code, sdsContent, sdsUrl) =>
                        setSolutionModal({ code, sdsContent, sdsUrl })
                      }
                    />

                    {/* Consumibles en tiempo real */}
                    <div ref={consumableRef}>
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
              )}
            </>
          )}
        </div> {/* close dashboard__content-wrap */}
      </>
    ) : null}

      {sdsModalOpen && (
        <SDSIncidentModal
          onContinue={(data) => {
            setSdsIncident(data)
            setSdsModalOpen(false)
          }}
          onClose={() => {
            setSdsModalOpen(false)
          }}
        />
      )}

      {/* Modal: siempre encima cuando está abierto (desde bienvenida o desde dashboard) */}
      {logModalOpen && (
        <LogPasteModal
          loading={loading}
          error={error}
          serverWasCold={serverWasCold}
          onAnalyze={(logText, fileName, modelId, serial, isAutomated) => {
            if (isAutomated && serial) {
              autoResolveAndAnalyze(serial)
              return
            }
            setCurrentModelId(modelId ?? null)
            setCurrentSerialNumber(serial ?? null)
            handleAnalyze(logText, fileName, modelId).then(() => {
              setLogModalOpen(false)
              dateFilter.reset()
              toast.showSuccess('Análisis completado')
            }).catch((err: unknown) => {
              toast.showError(err instanceof Error ? err.message : String(err))
            })
          }}
          onClose={() => {
            setError(null)
            setLogModalOpen(false)
          }}
        />
      )}

      {saveIncidentModalOpen && result && (
        <SaveIncidentModal
          onSave={onSaveIncident}
          onClose={() => !savingIncident && setSaveIncidentModalOpen(false)}
          saving={savingIncident}
          initialEquipment={
            currentModelName && currentSerialNumber 
              ? `${currentModelName} (${currentSerialNumber})` 
              : currentSerialNumber || currentModelName || ''
          }
          initialName={`Análisis - ${currentSerialNumber || 'Sin Serial'} - ${new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}`}
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

      {helpModalOpen && (
        <HelpModal onClose={() => setHelpModalOpen(false)} />
      )}

      {monitorWizardOpen && (
        <MonitorWizard />
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
                    setCompareLogText((ev.target?.result as string) ?? '')
                    setCompareFileName(file.name)
                  }
                  reader.readAsText(file)
                }}
              />
              <button
                type="button"
                className="dashboard__btn"
                onClick={() => compareFileInputRef.current?.click()}
                disabled={comparing}
              >
                {compareFileName ? `📄 ${compareFileName}` : '📂 Seleccionar archivo…'}
              </button>
            </div>
            <textarea
              className="log-modal__textarea"
              placeholder="O pegar el log aquí…"
              value={compareLogText}
              onChange={(e) => setCompareLogText(e.target.value)}
              rows={10}
              disabled={comparing}
            />
            <div className="log-modal__footer">
              <button
                type="button"
                className="dashboard__btn"
                onClick={() => setCompareModalOpen(false)}
                disabled={comparing}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="dashboard__btn dashboard__btn--primary"
                disabled={!compareLogText.trim() || comparing}
                onClick={async () => {
                  if (!selectedSavedId || !compareLogText.trim()) return
                  setComparing(true)
                  try {
                    const res = await compareSavedAnalysis(selectedSavedId, compareLogText)
                    setCompareResult(res)
                    setCompareModalOpen(false)
                    setViewMode('saved-detail')
                  } catch (e) {
                    toast.showError(e instanceof Error ? e.message : 'Error al comparar')
                  } finally {
                    setComparing(false)
                  }
                }}
              >
                {comparing ? 'Comparando…' : 'Comparar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
