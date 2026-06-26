import { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { Menu } from 'lucide-react'
import {
  listSavedAnalyses,
  getSavedAnalysis,
  extractSdsLogs,
  generatePdfSummary,
  getRemoteEwsAccess,
  getCpmdPdfUrl,
  API_BASE,
} from '../services/api'
import { useHpCacheRefresh } from '../hooks/useHpCacheRefresh'
import { NotificationsBell } from '../components/ui/NotificationsBell'
import type { HealthStatus } from '../services/api'
import type {
  ParseLogsResponse,
  SavedAnalysisSummary,
  SavedAnalysisFull,
  ErrorCodeUpsertBody,
  RealtimeConsumable,
  AIPdfSummaryResponse,
} from '../types/api'
import { CpmdUploadModal } from '../components/Parser/CpmdUploadModal'
import { AddCodeToCatalogModal } from '../components/Parser/AddCodeToCatalogModal'
import { DateRangePicker } from '../components/ui/DateRangePicker'
import { SavedAnalysisList } from '../components/Analysis/SavedAnalysisList'
import { SavedAnalysisDetail } from '../components/Analysis/SavedAnalysisDetail'
import { Skeleton } from '../components/ui/Skeleton'
import { ExecutivePrintReport } from '../components/Analysis/ExecutivePrintReport'
import { useExportPdf } from '../hooks/useExportPdf'
import { useInsightData } from '../hooks/useInsightData'
import { useCdsIncidents } from '../hooks/useCdsIncidents'
import { useToast } from '../contexts/ToastContext'
import { WelcomeView } from '../components/ui/WelcomeView'
import { MonitorDashboard } from '../components/Monitor/MonitorDashboard'
import { Navigation, type ViewMode as NavViewMode } from '../components/ui/Navigation'
import { AvisosPage } from './AvisosPage'
import {
  useDateFilter,
  filterEventsByDate,
  filterIncidentsByDate,
  getDateRangeFromEvents,
} from '../hooks/useDateFilter'
import { useAnalysisStore } from '../store/useAnalysisStore'
import { useUIStore } from '../store/useUIStore'

// Nuevos componentes refactorizados
import { ParseErrorsBanner } from '../components/Dashboard/ParseErrorsBanner'
import { NewCodesSection } from '../components/Dashboard/NewCodesSection'
import { DashboardModals } from '../components/Dashboard/DashboardModals'
import { AnalysisDashboardView } from '../components/Dashboard/AnalysisDashboardView'
import { getIncidentTableRows, getTopIncidentsForChart, getEventInfoForCode } from '../components/Dashboard/utils'

export default function DashboardPage({
  serverWasCold,
  healthStatus,
  initialSerial,
  initialAnalysisId,
  initialIsSavedList,
  initialIsMonitor,
  initialIsAvisos,
}: {
  serverWasCold: boolean
  healthStatus: HealthStatus | null
  initialSerial?: string | null
  initialAnalysisId?: string | null
  initialIsSavedList?: boolean
  initialIsMonitor?: boolean
  initialIsAvisos?: boolean
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
    setError,
    viewMode,
    setViewMode,
    logFileName,
    handleAnalyze,
    handleSaveCodeToCatalog: storeSaveCode,
    codesNew,
    setCodesNew,
    savingCode,
    monitorClientId,
    monitorModels,
    currentModelFamily,
  } = useAnalysisStore()

  const toast = useToast()

  const {
    setLogModalOpen,
    sdsIncident,
    addCodeModalCode,
    setAddCodeModalCode,
    editCodeInitial,
    setEditCodeInitial,
    setSaveIncidentModalOpen,
    setDeleteConfirm,
    setSolutionModal,
    setHelpModalOpen,
    setMonitorWizardOpen,
    setSdsModalOpen,
  } = useUIStore()

  const [savedList, setSavedList] = useState<SavedAnalysisSummary[] | null>(null)
  const [savedListSearch, setSavedListSearch] = useState('')
  const [savedDetail, setSavedDetail] = useState<SavedAnalysisFull | null>(null)
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [currentModelId, setCurrentModelId] = useState<string | null>(null)
  const [navCollapsed, setNavCollapsed] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentSerialNumber, setCurrentSerialNumber] = useState<string | null>(null)
  const [autoExtracting, setAutoExtracting] = useState(false)
  const [realtimeConsumables, setRealtimeConsumables] = useState<RealtimeConsumable[]>([])
  const [currentModelName, setCurrentModelName] = useState<string | null>(null)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [pdfAiSummary, setPdfAiSummary] = useState<AIPdfSummaryResponse | null>(null)
  const [isAiPdfReady, setIsAiPdfReady] = useState(false)
  const [isGeneratingAiPdf, setIsGeneratingAiPdf] = useState(false)
  const [cpmdUploadFamily, setCpmdUploadFamily] = useState<string | null>(null)

  const lastNavState = useRef({ viewMode, currentSerialNumber, selectedSavedId })

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
    } else if (viewMode === 'avisos') {
      newPath = '/avisos'
    }

    if (window.location.pathname !== newPath) {
      const shouldReplace = 
        viewMode === 'dashboard' && 
        lastNavState.current.viewMode === 'dashboard' &&
        lastNavState.current.currentSerialNumber !== null;

      if (shouldReplace) {
        window.history.replaceState({ viewMode, currentSerialNumber, selectedSavedId }, '', newPath)
      } else {
        window.history.pushState({ viewMode, currentSerialNumber, selectedSavedId }, '', newPath)
      }
      
      window.dispatchEvent(new CustomEvent('hp-navigation-change'))
    }
    lastNavState.current = { viewMode, currentSerialNumber, selectedSavedId }
  }, [viewMode, currentSerialNumber, selectedSavedId])


  useEffect(() => {
    listSavedAnalyses()
      .then(setSavedList)
      .catch(() => setSavedList([]))

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

  const monitorKey = useMemo(
    () => `${monitorClientId}-${(monitorModels ?? []).slice().sort().join(',')}`,
    [monitorClientId, monitorModels]
  )
 
  const insightData = useInsightData(currentSerialNumber)
  const cdsIncidents = useCdsIncidents(currentSerialNumber)
  const [loadingRemoteEws, setLoadingRemoteEws] = useState(false)
  const { refreshing: refreshingHpCache, triggerRefresh: triggerHpCacheRefresh } = useHpCacheRefresh()

  const {
    exportingPdf,
    handleExportPDF,
    dashboardRef,
    printReportRef,
  } = useExportPdf(logFileName)

  const autoResolveAndAnalyze = useCallback(async (serial: string) => {
    setAutoExtracting(true)
    setError(null)
    setLogModalOpen(false)
    try {
      saveToSearchHistory(serial)
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

      const fileName = `Portal_SDS_${serial}.tsv`
      await handleAnalyze(sdsRes.logs_text, fileName, sdsRes.suggested_model_id)
      dashboardRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      toast.showError(msg)
    } finally {
      setAutoExtracting(false)
    }
  }, [handleAnalyze, setCurrentModelId, setCurrentSerialNumber, setError, setLogModalOpen, toast, saveToSearchHistory, dashboardRef])

  useEffect(() => {
    if (initialIsSavedList) {
      setViewMode('saved-list')
      setSavedList(null)
      setSavedListSearch('')
      listSavedAnalyses().then(setSavedList).catch(() => setSavedList([]))
    } else if (initialIsMonitor) {
      setViewMode('monitor')
      if (!monitorClientId) {
        setMonitorWizardOpen(true)
      }
    } else if (initialIsAvisos) {
      setViewMode('avisos')
    } else if (initialSerial) {
      setViewMode('dashboard')
      if (initialSerial !== currentSerialNumber) {
        autoResolveAndAnalyze(initialSerial)
      }
    } else if (!initialAnalysisId) {
      setCurrentSerialNumber(null)
      setResult(null)
      setViewMode('dashboard')
      setSelectedSavedId(null)
      setSavedDetail(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSerial, initialAnalysisId, initialIsSavedList, initialIsMonitor, initialIsAvisos, autoResolveAndAnalyze, setCurrentSerialNumber, setResult])

  // Tracks the analysis id last seen in the URL. We only load from the URL on a
  // genuine URL change (deep link / back-forward). Internal selection changes
  // sync the URL asynchronously, so without this guard the transient mismatch
  // would revert selectedSavedId and ping-pong into an infinite fetch loop.
  const lastUrlAnalysisId = useRef<string | null>(null)
  useEffect(() => {
    if (initialAnalysisId === lastUrlAnalysisId.current) return
    lastUrlAnalysisId.current = initialAnalysisId ?? null
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
  const reportGeneratedAtIso = new Date().toISOString()

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

  const handleNavigate = useCallback((newView: NavViewMode) => {
    if (newView === 'dashboard') {
      setCurrentSerialNumber(null)
      setResult(null)
      setSelectedSavedId(null)
      setSavedDetail(null)
    }
    setViewMode(newView)
  }, [setViewMode, setCurrentSerialNumber, setResult, setSelectedSavedId, setSavedDetail])

  const isWelcome = !result && !loading && viewMode === 'dashboard'
  const dashboardClass = `dashboard ${isWelcome ? 'dashboard--welcome' : ''}`


  return (
    <div className="app-layout" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Navigation 
        viewMode={viewMode}
        onNavigate={(mode) => {
          handleNavigate(mode)
          setMobileMenuOpen(false)
        }}
        onNewAnalysis={() => {
          setLogModalOpen(true)
          setMobileMenuOpen(false)
        }}
        onHelp={() => {
          setHelpModalOpen(true)
          setMobileMenuOpen(false)
        }}
        healthStatus={healthStatus}
        isCollapsed={navCollapsed}
        onToggleCollapse={() => setNavCollapsed(!navCollapsed)}
        isMobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <button className="dashboard__mobile-menu-btn" onClick={() => setMobileMenuOpen(true)}>
        <Menu size={24} />
      </button>

      <NotificationsBell />
      
      <div
        className={dashboardClass}
        ref={dashboardRef}
        style={{
          flex: 1,
          minWidth: 0,
          overflowY: 'auto',
          height: '100vh',
        }}
      >
        <header className="export-header">
          <div className="export-header__left">
            <h1 className="dashboard__title">
              HP Logs <span className="dashboard__title-suffix">Analyzer</span>
            </h1>
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


        {viewMode === 'dashboard' && result && (
          <div className="report-only-section" aria-hidden="true">
            <div ref={printReportRef}>
              <ExecutivePrintReport
                result={result}
                filteredIncidents={filteredIncidents}
                filteredEvents={filteredEvents}
                consumableWarnings={realtimeConsumables}
                lastErrorLabel={lastErrorLabel}
                logFileName={logFileName}
                serialNumber={currentSerialNumber}
                modelName={currentModelName}
                topCodes={topCodes}
                incidentRows={incidentRows}
                generatedAtIso={reportGeneratedAtIso}
                aiSummary={pdfAiSummary}
              />
            </div>
          </div>
        )}

        {!result && !loading && viewMode === 'dashboard' ? (
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
            loadingQuickSearch={autoExtracting || loading}
            onOpenSaved={(id) => {
              setSelectedSavedId(id)
              setViewMode('saved-detail')
              setSavedDetail(null)
              getSavedAnalysis(id)
                .then(setSavedDetail)
                .catch(() => setSavedDetail(null))
            }}
            onOpenMonitor={() => setViewMode('monitor')}
            onOpenAvisos={() => setViewMode('avisos')}
          />
        ) : viewMode === 'monitor' ? (
          <div className="dashboard__content-wrap" style={{ paddingTop: '32px' }}>
            <MonitorDashboard key={monitorKey} />
          </div>
        ) : viewMode === 'avisos' ? (
          <div className="dashboard__content-wrap" style={{ paddingTop: '32px' }}>
            <AvisosPage />
          </div>
        ) : result || loading || viewMode === 'saved-list' || viewMode === 'saved-detail' ? (
          <>
            <div className="dashboard__content-wrap" style={{ paddingTop: '32px' }}>

            {viewMode === 'saved-list' && (
              <SavedAnalysisList
                savedList={savedList}
                savedListSearch={savedListSearch}
                setSavedListSearch={setSavedListSearch}
                deletingId={deletingId}
                onOpen={(id) => {
                  setSelectedSavedId(id)
                  setSavedDetail(null)
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
                onDelete={setDeleteConfirm}
                onUpdateDetail={(updated) => {
                  // A log update now creates a new dated snapshot: point the
                  // detail view (and selection) at it and refresh the list.
                  setSelectedSavedId(updated.id)
                  setSavedDetail(updated)
                  listSavedAnalyses().then(setSavedList).catch(() => {})
                }}
              />
            )}

            {viewMode === 'dashboard' && (
              <>
                <ParseErrorsBanner errors={result?.errors || []} />
                
                <NewCodesSection 
                  result={result}
                  codesNew={codesNew}
                  savingCode={savingCode}
                  onAddCode={setAddCodeModalCode}
                  onIgnore={() => setCodesNew(() => [])}
                />

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
                    {loading && !result && (
                      <div className="dashboard__content-main animate-in" style={{ paddingTop: '32px' }}>
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
                        
                        <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                          <button
                            className="dashboard__btn dashboard__btn--secondary"
                            onClick={() => setSdsModalOpen(true)}
                            title="Ingresar Incidente SDS"
                          >
                            SDS
                          </button>
                          <button
                            className="dashboard__btn dashboard__btn--secondary"
                            onClick={() => setSaveIncidentModalOpen(true)}
                            title="Guardar Análisis"
                          >
                            Guardar
                          </button>
                          <button
                            className={`dashboard__btn ${isGeneratingAiPdf ? 'dashboard__btn--loading' : 'dashboard__btn--primary'}`}
                            onClick={async () => {
                              if (!result) return
                              setPdfAiSummary(null)
                              setIsAiPdfReady(false)
                              setIsGeneratingAiPdf(true)
                              
                              try {
                                const summary = await generatePdfSummary({
                                  incidents: filteredIncidents.map(i => ({
                                    code: i.code,
                                    severity: i.severity,
                                    occurrences: i.occurrences,
                                    description: i.classification,
                                    start_time: i.start_time,
                                    end_time: i.end_time
                                  })),
                                  consumables: realtimeConsumables,
                                  top_codes: topCodes,
                                  model_name: currentModelName,
                                  serial_number: currentSerialNumber
                                }, AbortSignal.timeout(30000))
                                
                                setPdfAiSummary(summary)
                                setIsAiPdfReady(true)
                              } catch (err) {
                                console.error('Error generating AI PDF Summary:', err)
                                toast.showError('Error al contactar con la IA, se generara reporte estandar.')
                                setPdfAiSummary(null)
                                handleExportPDF(true)
                              } finally {
                                setIsGeneratingAiPdf(false)
                              }
                            }}
                            disabled={exportingPdf || isGeneratingAiPdf}
                          >
                            {isGeneratingAiPdf ? 'Procesando...' : exportingPdf ? 'Exportando...' : 'Exportar PDF'}
                          </button>
                          <button
                            className="dashboard__btn dashboard__btn--secondary"
                            onClick={async () => {
                              if (!currentSerialNumber) return
                              setLoadingRemoteEws(true)
                              try {
                                const { ews_url } = await getRemoteEwsAccess(
                                  currentSerialNumber,
                                  AbortSignal.timeout(25000)
                                )
                                window.open(ews_url, '_blank', 'noopener,noreferrer')
                              } catch (err) {
                                console.error('Error fetching remote EWS access:', err)
                                toast.showError('No se pudo obtener el acceso remoto al EWS del dispositivo.')
                              } finally {
                                setLoadingRemoteEws(false)
                              }
                            }}
                            disabled={!currentSerialNumber || loadingRemoteEws}
                            title="Acceso remoto al EWS del dispositivo"
                          >
                            {loadingRemoteEws ? 'Conectando...' : 'EWS Remoto'}
                          </button>
                          <button
                            className="dashboard__btn dashboard__btn--secondary"
                            onClick={async () => {
                              const family = currentModelFamily || currentModelName
                              if (!family) return
                              try {
                                const result = await getCpmdPdfUrl(family)
                                if (result) {
                                  window.open(`${API_BASE}${result.url}`, '_blank', 'noopener,noreferrer')
                                } else {
                                  setCpmdUploadFamily(family)
                                }
                              } catch {
                                toast.showError('Error al buscar el manual CPMD.')
                              }
                            }}
                            disabled={!(currentModelFamily || currentModelName)}
                            title="Ver manual de servicio CPMD para este modelo"
                          >
                            Manual CPMD
                          </button>
                          <button
                            className="dashboard__btn dashboard__btn--secondary"
                            onClick={() => triggerHpCacheRefresh(currentSerialNumber)}
                            disabled={!currentSerialNumber || refreshingHpCache}
                            title="Solicitar al portal SDS que actualice la caché de datos de HP del dispositivo"
                          >
                            {refreshingHpCache ? 'Actualizando...' : 'Actualizar caché HP'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {result && (
                      <AnalysisDashboardView
                        result={result as ParseLogsResponse}
                        filteredIncidents={filteredIncidents}
                        filteredEvents={filteredEvents}
                        events={events}
                        lastErrorEvent={lastErrorEvent}
                        lastErrorLabel={lastErrorLabel || ''}
                        activeFilter={activeFilter}
                        topCodes={topCodes}
                        realtimeConsumables={realtimeConsumables}
                        insightData={insightData}
                        cdsIncidents={cdsIncidents}
                        currentSerialNumber={currentSerialNumber}
                        currentModelName={currentModelName}
                        incidentRows={incidentRows}
                        sdsIncident={sdsIncident}
                        onSetEditCodeInitial={setEditCodeInitial}
                        onSetSolutionModal={setSolutionModal}
                      />
                    )}
                  </>
                )}
              </>
            )}
            </div>
          </>
        ) : null}
      </div>

      <DashboardModals
        serverWasCold={serverWasCold}
        autoExtracting={autoExtracting}
        currentSerialNumber={currentSerialNumber}
        currentModelId={currentModelId}
        currentModelName={currentModelName}
        selectedSavedId={selectedSavedId}
        autoResolveAndAnalyze={autoResolveAndAnalyze}
        setSavedList={setSavedList}
        setViewMode={setViewMode}
        setSavedDetail={setSavedDetail}
        setSelectedSavedId={setSelectedSavedId}
        exportingPdf={exportingPdf}
        isAiPdfReady={isAiPdfReady}
        setIsAiPdfReady={setIsAiPdfReady}
        isGeneratingAiPdf={isGeneratingAiPdf}
        handleExportPDF={handleExportPDF}
        onDateFilterReset={() => dateFilter.reset()}
        deletingId={deletingId}
        setDeletingId={setDeletingId}
      />

      {cpmdUploadFamily && (
        <CpmdUploadModal
          modelFamily={cpmdUploadFamily}
          onClose={() => setCpmdUploadFamily(null)}
          onUploaded={(pdfUrl) => {
            setCpmdUploadFamily(null)
            toast.showSuccess('Manual CPMD subido correctamente')
            window.open(pdfUrl, '_blank', 'noopener,noreferrer')
          }}
        />
      )}
    </div>
  )
}
