import { useState, useRef, useMemo, useEffect } from 'react'
import type { HealthStatus } from '../services/api'

import { DashboardHeader } from '../components/DashboardHeader'
import { WelcomeView } from '../components/dashboard/WelcomeView'
import { HistoryView } from '../components/dashboard/HistoryView'
import { DashboardAnalyticView } from '../components/dashboard/DashboardAnalyticView'
import { ModalsContainer } from '../components/dashboard/ModalsContainer'

import { useExportPdf } from '../hooks/useExportPdf'
import { useInsightData } from '../hooks/useInsightData'
import { useToast } from '../contexts/ToastContext'
import {
  useDateFilter,
  filterEventsByDate,
  filterIncidentsByDate,
  getDateRangeFromEvents,
  type DateFilter,
} from '../hooks/useDateFilter'
import { useAnalysisStore } from '../store/useAnalysisStore'
import { useUIStore } from '../store/useUIStore'
import { useHistoryManagement } from '../hooks/useHistoryManagement'
import { useAutoResolve } from '../hooks/useAutoResolve'
import { useUrlSync } from '../hooks/useUrlSync'

// Helper logic
import { getWindowForDate } from '../hooks/useDateFilter'

function getIncidentTableRows(incidents: any[], events: any[], selectedDate: DateFilter) {
  const filtered = filterIncidentsByDate(incidents, events, selectedDate)
  const window = getWindowForDate(events, selectedDate)
  if (!window) return []
  const { minTs, maxTs } = window
  return filtered
    .map((inc) => {
      const inWindow = inc.events
        .filter((e: any) => {
          const t = new Date(e.timestamp).getTime()
          return !Number.isNaN(t) && t >= minTs && t <= maxTs
        })
      if (inWindow.length === 0) return null
      const times = inWindow.map((e: any) => new Date(e.timestamp).getTime())
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

export default function DashboardPage({
  serverWasCold,
  healthStatus,
  initialSerial,
  initialAnalysisId,
}: {
  serverWasCold: boolean
  healthStatus: HealthStatus | null
  initialSerial?: string | null
  initialAnalysisId?: string | null
}) {
  const toast = useToast()
  const dateFilter = useDateFilter()
  
  const { 
    result, setResult, loading, error, setError, viewMode, setViewMode, logFileName, handleAnalyze, 
    handleSaveCodeToCatalog: storeSaveCode, handleSaveIncident, codesNew, setCodesNew, savingCode, savingIncident 
  } = useAnalysisStore()

  const {
    logModalOpen, setLogModalOpen, sdsModalOpen, setSdsModalOpen, setSdsIncident, addCodeModalCode, setAddCodeModalCode, editCodeInitial, setEditCodeInitial,
    saveIncidentModalOpen, setSaveIncidentModalOpen, compareModalOpen, setCompareModalOpen, deleteConfirm, setDeleteConfirm, solutionModal, setSolutionModal, helpModalOpen, setHelpModalOpen
  } = useUIStore()

  const history = useHistoryManagement()
  const sds = useAutoResolve()

  const compareFileInputRef = useRef<HTMLInputElement>(null)

  useUrlSync({ viewMode, currentSerialNumber: sds.currentSerialNumber, selectedSavedId: history.selectedSavedId })

  const insightData = useInsightData(sds.currentSerialNumber)
  const { exportingPdf, handleExportPDF, dashboardRef, executiveSummaryRef, aiDiagnosticRef, kpisRef, consumableRef, areaChartRef, barChartRef, incidentsTableRef } = useExportPdf(logFileName)

  const [visibleSeverities, setVisibleSeverities] = useState<Set<string>>(new Set(['ERROR', 'WARNING', 'INFO']))

  // Initialization effects
  useEffect(() => {
    if (initialSerial && initialSerial !== sds.currentSerialNumber) sds.autoResolveAndAnalyze(initialSerial)
    else if (!initialSerial && !initialAnalysisId) { sds.setCurrentSerialNumber(null); setResult(null) }
  }, [initialSerial, initialAnalysisId, sds.autoResolveAndAnalyze, sds.setCurrentSerialNumber, setResult])

  useEffect(() => {
    if (initialAnalysisId && initialAnalysisId !== history.selectedSavedId) history.handleOpenDetail(initialAnalysisId)
  }, [initialAnalysisId, history.selectedSavedId, history.handleOpenDetail])

  // Data derivations
  const filteredEvents = useMemo(() => filterEventsByDate(result?.events ?? [], dateFilter.activeFilter), [result, dateFilter.activeFilter])
  const filteredIncidents = useMemo(() => filterIncidentsByDate(result?.incidents ?? [], result?.events ?? [], dateFilter.activeFilter), [result, dateFilter.activeFilter])
  const dateRange = useMemo(() => getDateRangeFromEvents(result?.events ?? []), [result])
  const lastErrorEvent = useMemo(() => [...filteredEvents].filter((e) => e.type.toUpperCase() === 'ERROR').sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0] ?? null, [filteredEvents])
  const lastErrorLabel = lastErrorEvent ? new Date(lastErrorEvent.timestamp).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null
  const incidentRows = useMemo(() => getIncidentTableRows(result?.incidents ?? [], result?.events ?? [], dateFilter.activeFilter), [result, dateFilter.activeFilter])

  // Handlers
  const handleSaveCodeToCatalog = async (body: any, isEdit = false) => {
    try {
      await storeSaveCode(body, isEdit); toast.showSuccess(isEdit ? `Código ${body.code} actualizado` : `Código ${body.code} agregado`)
      setAddCodeModalCode(null); setEditCodeInitial(null)
    } catch (e: any) { toast.showError(e.message) }
  }

  const onSaveIncident = async (name: string, identifier: string | null) => {
    try { await handleSaveIncident(name, identifier); setSaveIncidentModalOpen(false); toast.showSuccess('Incidente guardado') }
    catch (e: any) { toast.showError(e.message) }
  }

  return (
    <div 
      className={`min-h-screen flex flex-col gap-6 p-6 transition-all duration-700 bg-hp-dark selection:bg-hp-blue-vibrant/30 ${exportingPdf ? 'is-exporting !p-0 !bg-white' : ''}`} 
      style={{
        backgroundImage: !exportingPdf ? 'radial-gradient(circle at 50% 0%, rgba(0, 150, 214, 0.08) 0%, transparent 50%), radial-gradient(circle at 0% 100%, rgba(244, 63, 94, 0.03) 0%, transparent 40%)' : 'none'
      }}
      ref={dashboardRef}
    >
      {!result && viewMode === 'dashboard' ? (
        <div className="flex-1 flex items-center justify-center animate-fade-in">
          <WelcomeView 
              healthStatus={healthStatus}
              onAnalyzeNew={() => setLogModalOpen(true)}
              onViewSaved={history.handleOpenList}
              onHelp={() => setHelpModalOpen(true)}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-8 max-w-[1600px] mx-auto w-full animate-fade-in">
          <DashboardHeader
            healthStatus={healthStatus}
            hasResult={!!result}
            exportingPdf={exportingPdf}
            onOpenSavedList={history.handleOpenList}
            onAnalyzeNew={() => setLogModalOpen(true)}
            onSaveIncident={() => setSaveIncidentModalOpen(true)}
            onAddSds={() => setSdsModalOpen(true)}
            onExportPdf={() => handleExportPDF(!!result)}
            onHelp={() => setHelpModalOpen(true)}
          />

          <div className="transition-all duration-500">
            <HistoryView 
              viewMode={viewMode as any}
              savedList={history.savedList}
              savedListSearch={history.savedListSearch}
              setSavedListSearch={history.setSavedListSearch}
              deletingId={history.deletingId}
              selectedSavedId={history.selectedSavedId}
              savedDetail={history.savedDetail}
              compareResult={history.compareResult}
              onBack={() => setViewMode('dashboard')}
              onOpen={history.handleOpenDetail}
              onDelete={history.handleDeleteClick}
              onDetailBack={history.handleBackToList}
              onCompare={() => setCompareModalOpen(true)}
            />
          </div>

          {viewMode === 'dashboard' && result && (
            <div className="animate-fade-in-up">
              <DashboardAnalyticView 
                  result={result}
                  codesNew={codesNew}
                  setCodesNew={setCodesNew}
                  activeFilter={dateFilter.activeFilter}
                  dateFilter={dateFilter}
                  dateRange={dateRange}
                  realtimeConsumables={sds.realtimeConsumables}
                  lastErrorLabel={lastErrorLabel}
                  lastErrorEvent={lastErrorEvent}
                  currentModelName={sds.currentModelName}
                  currentSerialNumber={sds.currentSerialNumber}
                  logFileName={logFileName}
                  currentModelHasCpmd={sds.currentModelHasCpmd}
                  insightData={insightData}
                  sdsIncident={useUIStore.getState().sdsIncident}
                  incidentRows={incidentRows}
                  visibleSeverities={visibleSeverities}
                  setVisibleSeverities={setVisibleSeverities}
                  filteredIncidents={filteredIncidents}
                  filteredEvents={filteredEvents}
                  onSaveCodeToCatalog={handleSaveCodeToCatalog}
                  onEditCode={(code, desc, sev, url) => setEditCodeInitial({ code, description: desc, severity: sev, solutionUrl: url })}
                  onViewSolution={(code, content, url) => setSolutionModal({ code, sdsContent: content, sdsUrl: url ?? undefined })}
                  refs={{ executiveSummaryRef, kpisRef, aiDiagnosticRef, consumableRef, areaChartRef, barChartRef, incidentsTableRef }}
                  savingCode={savingCode}
                  addCodeModalCode={addCodeModalCode}
                  setAddCodeModalCode={setAddCodeModalCode}
                  editCodeInitial={editCodeInitial}
                  setEditCodeInitial={setEditCodeInitial}
              />
            </div>
          )}
        </div>
      )}

      <ModalsContainer 
        sdsModalOpen={sdsModalOpen}
        setSdsModalOpen={setSdsModalOpen}
        setSdsIncident={setSdsIncident}
        logModalOpen={logModalOpen}
        setLogModalOpen={setLogModalOpen}
        loading={loading}
        error={error}
        serverWasCold={serverWasCold}
        onLogAnalyze={(logText, fileName, modelId, hasCpmd, serial, isAutomated) => {
           if (isAutomated && serial) { sds.autoResolveAndAnalyze(serial); return }
           sds.setCurrentModelId(modelId ?? null); sds.setCurrentModelHasCpmd(hasCpmd ?? false); sds.setCurrentSerialNumber(serial ?? null)
           handleAnalyze(logText, fileName, modelId).then(() => { setLogModalOpen(false); dateFilter.reset(); toast.showSuccess('Análisis completado') })
        }}
        setError={setError}
        saveIncidentModalOpen={saveIncidentModalOpen}
        setSaveIncidentModalOpen={setSaveIncidentModalOpen}
        onSaveIncident={onSaveIncident}
        savingIncident={savingIncident}
        result={result}
        deleteConfirm={deleteConfirm}
        setDeleteConfirm={setDeleteConfirm}
        deletingId={history.deletingId}
        onConfirmDelete={() => history.handleConfirmDelete(deleteConfirm?.id ?? '')}
        solutionModal={solutionModal}
        setSolutionModal={setSolutionModal}
        currentModelId={sds.currentModelId}
        helpModalOpen={helpModalOpen}
        setHelpModalOpen={setHelpModalOpen}
        autoExtracting={sds.autoExtracting}
        currentSerialNumber={sds.currentSerialNumber}
        compareModalOpen={compareModalOpen}
        setCompareModalOpen={setCompareModalOpen}
        comparing={history.comparing}
        compareFileName={history.compareFileName}
        compareLogText={history.compareLogText}
        setCompareLogText={history.setCompareLogText}
        onCompareSubmit={history.handleCompareSubmit}
        compareFileInputRef={compareFileInputRef as any}
      />
    </div>
  )
}
  )
}
