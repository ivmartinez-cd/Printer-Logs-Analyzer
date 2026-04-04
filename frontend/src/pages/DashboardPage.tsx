import React, { useState, useEffect, useRef, useMemo } from 'react'
import { listSavedAnalyses, getSavedAnalysis, compareSavedAnalysis, deleteSavedAnalysis } from '../services/api'
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
import { SolutionContentModal } from '../components/SolutionContentModal'
import { DiagnosticPanel } from '../components/DiagnosticPanel'
import { DateFilterBar } from '../components/DateFilterBar'
import { SavedAnalysisList } from '../components/SavedAnalysisList'
import { SavedAnalysisDetail } from '../components/SavedAnalysisDetail'
import { KPICards } from '../components/KPICards'
import { EventsTable } from '../components/EventsTable'
import { IncidentsTable, type IncidentRow } from '../components/IncidentsTable'
import { IncidentsChart } from '../components/IncidentsChart'
import { TopErrorsChart } from '../components/TopErrorsChart'
import { useExportPdf } from '../hooks/useExportPdf'
import { useModals } from '../hooks/useModals'
import { useAnalysis } from '../hooks/useAnalysis'
import { useToast } from '../contexts/ToastContext'
import {
  useDateFilter,
  filterEventsByDate,
  filterIncidentsByDate,
  getDateRangeFromEvents,
  getWindowForDate,
  type DateFilter,
} from '../hooks/useDateFilter'

function LiveClock({ className, short = false }: { className?: string; short?: boolean }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <time className={className} dateTime={now.toISOString()}>
      {now.toLocaleString(undefined, short
        ? { dateStyle: 'short', timeStyle: 'short' }
        : { dateStyle: 'long', timeStyle: 'medium' }
      )}
    </time>
  )
}


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

function bucketEventsByHour(events: ApiEvent[], selectedDate: DateFilter): { time: string; ERROR: number; WARNING: number; INFO: number }[] {
  const window = getWindowForDate(events, selectedDate)
  if (!window) return []
  const { minTs, maxTs } = window
  const hourMs = 60 * 60 * 1000
  const numHours = Math.ceil((maxTs - minTs) / hourMs) || 1
  const buckets = new Map<number, { ERROR: number; WARNING: number; INFO: number }>()
  for (let h = 0; h < numHours; h++) {
    buckets.set(minTs + h * hourMs, { ERROR: 0, WARNING: 0, INFO: 0 })
  }
  for (const e of events) {
    const t = new Date(e.timestamp).getTime()
    if (Number.isNaN(t) || t < minTs || t > maxTs) continue
    const hourIndex = Math.min(numHours - 1, Math.floor((t - minTs) / hourMs))
    const bucketStart = minTs + hourIndex * hourMs
    const bucket = buckets.get(bucketStart)!
    const sev = (e.type ?? '').toUpperCase()
    if (sev === 'ERROR') bucket.ERROR++
    else if (sev === 'WARNING') bucket.WARNING++
    else bucket.INFO++
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([bucketStart, counts]) => ({
      time: new Date(bucketStart).toISOString().slice(0, 13) + ':00:00.000Z',
      ...counts,
    }))
}

interface LogPasteModalProps {
  loading: boolean
  error: string | null
  serverWasCold: boolean
  onAnalyze: (logText: string, fileName?: string) => void
  onClose: () => void
}

/** Obtiene descripción y severidad del primer evento del resultado para un código. */
function getEventInfoForCode(result: ParseLogsResponse | null, code: string): { description: string; severity: string } {
  if (!result?.events?.length) return { description: '', severity: 'INFO' }
  const ev = result.events.find((e) => e.code === code)
  return {
    description: ev?.help_reference?.trim() ?? ev?.code_description?.trim() ?? '',
    severity: (ev?.type?.toUpperCase() ?? 'INFO') as string,
  }
}

function LogPasteModal({ loading, error, serverWasCold, onAnalyze, onClose }: LogPasteModalProps) {
  const [logText, setLogText] = useState('')
  const [fileName, setFileName] = useState<string | undefined>(undefined)
  const [slowWarning, setSlowWarning] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])
  useEffect(() => {
    if (!loading || !serverWasCold) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSlowWarning(false)
      return
    }
    const id = setTimeout(() => setSlowWarning(true), 3000)
    return () => clearTimeout(id)
  }, [loading, serverWasCold])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setLogText(text)
      setFileName(file.name)
      textareaRef.current?.focus()
    }
    reader.readAsText(file)
  }

  return (
    <div className="log-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="log-modal-title">
      <div className="log-modal" onClick={(e) => e.stopPropagation()}>
        <div className="log-modal__header">
          <h2 id="log-modal-title" className="log-modal__title">Pegar logs HP</h2>
          <button type="button" className="log-modal__close" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        <div className="log-modal__file-row">
          <input
            ref={fileInputRef}
            type="file"
            accept=".log,.txt,.tsv,text/plain"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button
            type="button"
            className="log-modal__btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
          >
            Cargar archivo…
          </button>
          {fileName && <span className="log-modal__file-name">{fileName}</span>}
        </div>
        <textarea
          ref={textareaRef}
          className="log-modal__textarea"
          placeholder="Pegar logs HP aquí..."
          value={logText}
          onChange={(e) => setLogText(e.target.value)}
          disabled={loading}
        />
        {error && <p className="dashboard__error">{error}</p>}
        <div className="log-modal__actions">
          <button
            type="button"
            className="dashboard__btn"
            onClick={() => onAnalyze(logText, fileName)}
            disabled={loading || !logText.trim()}
          >
            {loading ? (
              <>
                <span className="log-modal__spinner" aria-hidden="true" /> Analizando log…
              </>
            ) : 'Analizar'}
          </button>
          <button type="button" className="log-modal__btn-secondary" onClick={onClose} disabled={loading}>
            Cerrar
          </button>
        </div>
        {slowWarning && (
          <p className="log-modal__slow-warning">El servidor está iniciando, por favor esperá…</p>
        )}
      </div>
    </div>
  )
}

function DbStatusBadge({ status }: { status: HealthStatus | null }) {
  if (!status) return null
  const online = status.db_available
  return (
    <span className={`db-status-badge ${online ? 'db-status-badge--ok' : 'db-status-badge--offline'}`}>
      <span className="db-status-badge__dot" aria-hidden="true" />
      {online ? 'DB conectada' : 'DB offline · modo local'}
    </span>
  )
}

export default function DashboardPage({ serverWasCold, healthStatus }: { serverWasCold: boolean; healthStatus: HealthStatus | null }) {
  const dateFilter = useDateFilter()
  const { selectedDate, setSelectedDate, selectedWeekRange, setSelectedWeekRange, activeFilter,
    weekPickerOpen, setWeekPickerOpen, weekPickerRef,
    dayPickerOpen, setDayPickerOpen, dayPickerRef } = dateFilter
  const [eventsTableCollapsed, setEventsTableCollapsed] = useState(false)
  const [incidentsSeverityFilter, setIncidentsSeverityFilter] = useState<string>('')
  const [incidentsSearchFilter, setIncidentsSearchFilter] = useState('')
  const [eventsSeverityFilter, setEventsSeverityFilter] = useState<string>('')
  const [eventsSearchFilter, setEventsSearchFilter] = useState('')
  const [incidentsSort, setIncidentsSort] = useState<{ column: string; dir: 'asc' | 'desc' }>({ column: 'end_time', dir: 'desc' })
  const [eventsSort, setEventsSort] = useState<{ column: string; dir: 'asc' | 'desc' }>({ column: 'timestamp', dir: 'desc' })
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
  const [visibleSeverities, setVisibleSeverities] = useState<Set<string>>(new Set(['ERROR', 'WARNING', 'INFO']))

  const toast = useToast()
  const modals = useModals()
  const {
    logModalOpen, setLogModalOpen,
    sdsPreModalOpen, setSdsPreModalOpen,
    sdsModalOpen, setSdsModalOpen,
    sdsIncident, setSdsIncident,
    addCodeModalCode, setAddCodeModalCode,
    editCodeInitial, setEditCodeInitial,
    saveIncidentModalOpen, setSaveIncidentModalOpen,
    compareModalOpen, setCompareModalOpen,
    deleteConfirm, setDeleteConfirm,
    solutionModal, setSolutionModal,
  } = modals

  const { exportingPdf, handleExportPDF, kpisRef, diagnosticRef, barChartRef, incidentsTableRef } = useExportPdf(logFileName)

  const {
    loading, error, setError,
    result,
    pendingResult, codesNew, setCodesNew,
    savingCode, savingIncident,
    handleAnalyze, commitPendingResult,
    handleSaveCodeToCatalog, handleSaveIncident,
  } = useAnalysis({
    setLogFileName,
    resetDateFilter: dateFilter.reset,
    resetFilters: () => {
      setIncidentsSeverityFilter('')
      setIncidentsSearchFilter('')
      setEventsSeverityFilter('')
      setEventsSearchFilter('')
    },
    setLogModalOpen,
    setSdsPreModalOpen,
    setAddCodeModalCode,
    setEditCodeInitial,
    setSaveIncidentModalOpen,
  })

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
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0] ?? null,
    [filteredEvents]
  )
  const lastErrorLabel = lastErrorEvent
    ? new Date(lastErrorEvent.timestamp).toLocaleString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null
  const volumeData = useMemo(
    () => bucketEventsByHour(events, activeFilter),
    [events, activeFilter]
  )
  const topCodes = useMemo(
    () => getTopIncidentsForChart(incidents, events, activeFilter, 5),
    [incidents, events, activeFilter]
  )
  const incidentRowsBase = useMemo(
    () => getIncidentTableRows(incidents, events, activeFilter),
    [incidents, events, activeFilter]
  )
  const incidentRows = useMemo(() => {
    const filtered = incidentRowsBase.filter((inc) => {
      if (incidentsSeverityFilter && inc.severity.toUpperCase() !== incidentsSeverityFilter) return false
      const q = incidentsSearchFilter.trim().toLowerCase()
      if (q) {
        const code = (inc.code ?? '').toLowerCase()
        const classification = (inc.classification ?? '').toLowerCase()
        if (!code.includes(q) && !classification.includes(q)) return false
      }
      return true
    })
    const { column, dir } = incidentsSort
    const mult = dir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      let cmp: number
      switch (column) {
        case 'code':
          cmp = (a.code ?? '').localeCompare(b.code ?? '')
          break
        case 'classification':
          cmp = (a.classification ?? '').localeCompare(b.classification ?? '')
          break
        case 'severity':
          cmp = (a.severity ?? '').localeCompare(b.severity ?? '')
          break
        case 'occurrences':
          cmp = a.occurrences - b.occurrences
          break
        case 'start_time':
          cmp = new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
          break
        case 'end_time':
        default:
          cmp = new Date(a.end_time).getTime() - new Date(b.end_time).getTime()
          break
      }
      return cmp * mult
    })
  }, [incidentRowsBase, incidentsSeverityFilter, incidentsSearchFilter, incidentsSort])
  const tableRows = useMemo(() => {
    const { column, dir } = eventsSort
    const mult = dir === 'asc' ? 1 : -1
    const filtered = filteredEvents.filter((evt) => {
      if (eventsSeverityFilter && (evt.type?.toUpperCase() ?? 'INFO') !== eventsSeverityFilter) return false
      const q = eventsSearchFilter.trim().toLowerCase()
      if (q) {
        const code = (evt.code ?? '').toLowerCase()
        const msg = (evt.code_description ?? evt.help_reference ?? '').toLowerCase()
        if (!code.includes(q) && !msg.includes(q)) return false
      }
      return true
    })
    return [...filtered].sort((a, b) => {
      let cmp: number
      switch (column) {
        case 'timestamp':
          cmp = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          break
        case 'code':
          cmp = (a.code ?? '').localeCompare(b.code ?? '')
          break
        case 'severity':
          cmp = (a.type ?? '').localeCompare(b.type ?? '')
          break
        case 'message':
          cmp = (a.code_description ?? a.help_reference ?? '').localeCompare(b.code_description ?? b.help_reference ?? '')
          break
        default:
          cmp = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          break
      }
      return cmp * mult
    })
  }, [filteredEvents, eventsSeverityFilter, eventsSearchFilter, eventsSort])

  return (
    <div className="dashboard">
      {!result && viewMode === 'dashboard' ? (
        /* Sin resultado y vista dashboard: marco de bienvenida */
        <div className="dashboard__frame">
          <header className="dashboard__header dashboard__header--inside-frame">
            <div className="dashboard__title-group">
              <svg className="dashboard__title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
                Analiza logs de impresoras HP, detecta errores por severidad y visualiza tendencias en segundos.
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
                  onClick={() => { setViewMode('saved-list'); setSavedList(null); setSavedListSearch(''); listSavedAnalyses().then(setSavedList).catch(() => setSavedList([])) }}
                >
                  Ver logs guardados
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
      ) : (result || viewMode === 'saved-list' || viewMode === 'saved-detail') ? (
        <>
          <header className="dashboard__header">
            <div className="dashboard__title-group">
              <svg className="dashboard__title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <h1 className="dashboard__title">HP Logs Analyzer</h1>
              {logFileName && <span className="dashboard__file-name">{logFileName}</span>}
            </div>
            <div className="dashboard__header-actions">
              <button
                type="button"
                className="dashboard__btn dashboard__btn--secondary"
                onClick={() => { setViewMode('saved-list'); setSavedList(null); setSavedListSearch(''); listSavedAnalyses().then(setSavedList).catch(() => setSavedList([])) }}
              >
                Incidentes guardados
              </button>
              <button
                type="button"
                className="dashboard__btn dashboard__btn--primary dashboard__btn--header-cta"
                onClick={() => setLogModalOpen(true)}
              >
                Analizar otro log
              </button>
              {result && (
                <button
                  type="button"
                  className="dashboard__btn dashboard__btn--secondary"
                  onClick={() => setSaveIncidentModalOpen(true)}
                >
                  Guardar incidente
                </button>
              )}
              {result && (
                <button
                  type="button"
                  className="dashboard__btn dashboard__btn--secondary"
                  onClick={() => handleExportPDF(!!result)}
                  disabled={exportingPdf}
                >
                  {exportingPdf ? 'Generando PDF…' : 'Exportar PDF'}
                </button>
              )}
              <LiveClock className="dashboard__datetime" />
              <DbStatusBadge status={healthStatus} />
            </div>
          </header>

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
                getSavedAnalysis(id).then(setSavedDetail).catch(() => toast.showError('Error al cargar'))
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
              onCompare={() => { setCompareLogText(''); setCompareFileName(undefined); setCompareModalOpen(true) }}
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
                <span className="dashboard__parse-errors-chevron">{parseErrorsExpanded ? '▲' : '▼'}</span>
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
                        <td><code>{e.raw_line}</code></td>
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
                Se detectaron {codesNew.length} código{codesNew.length !== 1 ? 's' : ''} nuevo{codesNew.length !== 1 ? 's' : ''} que no están en el catálogo. Agrega cada uno con su URL de solución si la tienes.
              </p>
              <ul className="dashboard__codes-new-list">
                {codesNew.map((code) => {
                  const { description } = getEventInfoForCode(result, code)
                  return (
                    <li key={code} className="dashboard__codes-new-item">
                      <span className="dashboard__codes-new-code">{code}</span>
                      {description && (
                        <span className="dashboard__codes-new-desc" title={description}>
                          {description.slice(0, 60)}{description.length > 60 ? '…' : ''}
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
          {/* Subheader: Panel de errores | filtros de fecha */}
          <DateFilterBar
            logFileName={logFileName}
            activeFilter={activeFilter}
            selectedDate={selectedDate}
            selectedWeekRange={selectedWeekRange}
            dateRange={dateRange}
            weekPickerOpen={weekPickerOpen}
            setWeekPickerOpen={setWeekPickerOpen}
            weekPickerRef={weekPickerRef}
            dayPickerOpen={dayPickerOpen}
            setDayPickerOpen={setDayPickerOpen}
            dayPickerRef={dayPickerRef}
            setSelectedDate={setSelectedDate}
            setSelectedWeekRange={setSelectedWeekRange}
          />

          {/* Fila 1 — KPIs (4 cards, mismo tamaño) */}
          <section ref={kpisRef}>
            <KPICards
              filteredIncidents={filteredIncidents}
              filteredEvents={filteredEvents}
              lastErrorEvent={lastErrorEvent}
              lastErrorLabel={lastErrorLabel}
            />
          </section>

          {/* Diagnóstico automático basado en reglas */}
          <div ref={diagnosticRef}>
            <DiagnosticPanel events={filteredEvents} />
          </div>

          {/* Fila 2 — Grid 70% / 30%: Issue Volume | Top Errors */}
          <div className="dashboard__charts-row">
            <IncidentsChart
              volumeData={volumeData}
              activeFilter={activeFilter}
              visibleSeverities={visibleSeverities}
              onSeverityToggle={(sev) => setVisibleSeverities((prev) => {
                const next = new Set(prev)
                if (next.has(sev)) next.delete(sev); else next.add(sev)
                return next
              })}
            />
            <div ref={barChartRef}>
              <TopErrorsChart topCodes={topCodes} />
            </div>
          </div>

          {/* Fila 3 — Tabla de incidencias */}
          <section ref={incidentsTableRef}>
            <IncidentsTable
              incidentRows={incidentRows}
              severityFilter={incidentsSeverityFilter}
              onSeverityFilterChange={setIncidentsSeverityFilter}
              searchFilter={incidentsSearchFilter}
              onSearchFilterChange={setIncidentsSearchFilter}
              sort={incidentsSort}
              onSortChange={(col) => setIncidentsSort((s) => ({ column: col, dir: s.column === col && s.dir === 'asc' ? 'desc' : 'asc' }))}
              onEditCode={(code, classification, severity, solutionUrl) => setEditCodeInitial({ code, description: classification, severity, solutionUrl })}
              onViewSolution={(content, url) => setSolutionModal({ content, url })}
            />
          </section>

          {/* Fila 4 — Tabla de eventos recientes (colapsable) */}
          <EventsTable
            tableRows={tableRows}
            isCollapsed={eventsTableCollapsed}
            onToggleCollapse={() => setEventsTableCollapsed((c) => !c)}
            severityFilter={eventsSeverityFilter}
            onSeverityFilterChange={setEventsSeverityFilter}
            searchFilter={eventsSearchFilter}
            onSearchFilterChange={setEventsSearchFilter}
            sort={eventsSort}
            onSortChange={(col) => setEventsSort((s) => ({ column: col, dir: s.column === col && s.dir === 'asc' ? 'desc' : 'asc' }))}
            onViewSolution={(content, url) => setSolutionModal({ content, url })}
          />

          {sdsIncident && (
            <SDSIncidentPanel
              sdsIncident={sdsIncident}
              incidentRows={incidentRows.map((r) => ({ code: r.code, classification: r.classification || r.code }))}
              incidentsFull={result?.incidents?.map((inc) => ({ code: inc.code, end_time: inc.end_time, occurrences: inc.occurrences })) ?? []}
            />
          )}
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
          onAnalyze={handleAnalyze}
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
              setSavedList(prev => (prev ? prev.filter(x => x.id !== deleteConfirm.id) : []))
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
          content={solutionModal.content}
          url={solutionModal.url}
          onClose={() => setSolutionModal(null)}
        />
      )}

      {compareModalOpen && selectedSavedId && (
        <div className="log-modal-overlay" onClick={() => !comparing && setCompareModalOpen(false)} role="dialog" aria-modal="true" aria-labelledby="compare-modal-title">
          <div className="log-modal" onClick={(e) => e.stopPropagation()}>
            <div className="log-modal__header">
              <h2 id="compare-modal-title" className="log-modal__title">Comparar con log nuevo</h2>
              <button type="button" className="log-modal__close" onClick={() => !comparing && setCompareModalOpen(false)} aria-label="Cerrar" disabled={comparing}>×</button>
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
              <button type="button" className="log-modal__btn-secondary" onClick={() => !comparing && setCompareModalOpen(false)} disabled={comparing}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
