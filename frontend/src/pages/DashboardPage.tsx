import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts'
import { previewLogs, validateLogs, upsertErrorCode, createSavedAnalysis, listSavedAnalyses, getSavedAnalysis, compareSavedAnalysis, deleteSavedAnalysis } from '../services/api'
import type {
  ParseLogsResponse,
  Event as ApiEvent,
  Incident as ApiIncident,
  ErrorCodeUpsertBody,
  SavedAnalysisSummary,
  SavedAnalysisFull,
  SavedAnalysisIncidentItem,
  CompareResponse,
} from '../types/api'
import { AddCodeToCatalogModal } from '../components/AddCodeToCatalogModal'
import { ConfirmModal } from '../components/ConfirmModal'
import { SaveIncidentModal } from '../components/SaveIncidentModal'
import { SDSIncidentModal, type SdsIncidentData } from '../components/SDSIncidentModal'
import { SDSIncidentPanel } from '../components/SDSIncidentPanel'
import { SolutionContentModal } from '../components/SolutionContentModal'
import { DiagnosticPanel } from '../components/DiagnosticPanel'
import { DateFilterBar } from '../components/DateFilterBar'
import { SavedAnalysisList } from '../components/SavedAnalysisList'
import { SavedAnalysisDetail } from '../components/SavedAnalysisDetail'
import { useToast } from '../contexts/ToastContext'
import {
  useDateFilter,
  formatDateTime,
  formatWeekRange,
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

type IncidentRow = {
  id: string
  code: string
  classification: string
  severity: string
  severity_weight: number
  occurrences: number
  start_time: string
  end_time: string
  sds_link: string | null
  sds_solution_content: string | null
  eventsInWindow: ApiEvent[]
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

export default function DashboardPage({ serverWasCold }: { serverWasCold: boolean }) {
  const [result, setResult] = useState<ParseLogsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dateFilter = useDateFilter()
  const { selectedDate, setSelectedDate, selectedWeekRange, setSelectedWeekRange, activeFilter,
    weekPickerOpen, setWeekPickerOpen, weekPickerRef,
    dayPickerOpen, setDayPickerOpen, dayPickerRef } = dateFilter
  const [pendingResult, setPendingResult] = useState<ParseLogsResponse | null>(null)
  const [pendingCodesNew, setPendingCodesNew] = useState<string[]>([])
  const [sdsPreModalOpen, setSdsPreModalOpen] = useState(false)
  const [logModalOpen, setLogModalOpen] = useState(false)
  const [sdsModalOpen, setSdsModalOpen] = useState(false)
  const [sdsIncident, setSdsIncident] = useState<SdsIncidentData | null>(null)
  const [eventsTableCollapsed, setEventsTableCollapsed] = useState(true)
  const [codesNew, setCodesNew] = useState<string[]>([])
  const [addCodeModalCode, setAddCodeModalCode] = useState<string | null>(null)
  const [savingCode, setSavingCode] = useState(false)
  const [incidentsSeverityFilter, setIncidentsSeverityFilter] = useState<string>('')
  const [incidentsSearchFilter, setIncidentsSearchFilter] = useState('')
  const [eventsSeverityFilter, setEventsSeverityFilter] = useState<string>('')
  const [eventsSearchFilter, setEventsSearchFilter] = useState('')
  const [incidentsSort, setIncidentsSort] = useState<{ column: string; dir: 'asc' | 'desc' }>({ column: 'end_time', dir: 'desc' })
  const [eventsSort, setEventsSort] = useState<{ column: string; dir: 'asc' | 'desc' }>({ column: 'timestamp', dir: 'desc' })
  const [expandedIncidentIds, setExpandedIncidentIds] = useState<Set<string>>(new Set())
  const [editCodeInitial, setEditCodeInitial] = useState<{ code: string; description: string; severity: string; solutionUrl: string } | null>(null)
  const [saveIncidentModalOpen, setSaveIncidentModalOpen] = useState(false)
  const [savingIncident, setSavingIncident] = useState(false)
  const [viewMode, setViewMode] = useState<'dashboard' | 'saved-list' | 'saved-detail'>('dashboard')
  const [savedList, setSavedList] = useState<SavedAnalysisSummary[] | null>(null)
  const [savedListSearch, setSavedListSearch] = useState('')
  const [savedDetail, setSavedDetail] = useState<SavedAnalysisFull | null>(null)
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null)
  const [compareModalOpen, setCompareModalOpen] = useState(false)
  const [compareLogText, setCompareLogText] = useState('')
  const [comparing, setComparing] = useState(false)
  const [compareResult, setCompareResult] = useState<CompareResponse | null>(null)
  const [parseErrorsExpanded, setParseErrorsExpanded] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)
  const [logFileName, setLogFileName] = useState<string | null>(null)
  const [solutionModal, setSolutionModal] = useState<{ content: string; url?: string | null } | null>(null)
  const [visibleSeverities, setVisibleSeverities] = useState<Set<string>>(new Set(['ERROR', 'WARNING', 'INFO']))
  const [exportingPdf, setExportingPdf] = useState(false)
  const kpisRef = useRef<HTMLElement>(null)
  const diagnosticRef = useRef<HTMLDivElement>(null)
  const barChartRef = useRef<HTMLElement>(null)
  const incidentsTableRef = useRef<HTMLElement>(null)
  const toast = useToast()

  async function handleExportPDF() {
    if (!result) return
    setExportingPdf(true)
    try {
      const { jsPDF } = await import('jspdf')
      const html2canvasModule = await import('html2canvas')
      const html2canvas = html2canvasModule.default as (el: HTMLElement, opts?: object) => Promise<HTMLCanvasElement>

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 14
      const contentWidth = pageWidth - margin * 2

      pdf.setFontSize(16)
      pdf.setTextColor(30, 30, 30)
      pdf.text('HP Logs Analyzer — Reporte de análisis', margin, margin + 6)
      pdf.setFontSize(9)
      pdf.setTextColor(100, 100, 100)
      const dateStr = new Date().toLocaleString('es-AR', { dateStyle: 'long', timeStyle: 'short' })
      pdf.text(`Generado: ${dateStr}`, margin, margin + 13)
      if (logFileName) pdf.text(`Archivo: ${logFileName}`, margin, margin + 19)

      let yPos = margin + 28

      const sections: Array<React.RefObject<HTMLElement | HTMLDivElement>> = [
        kpisRef, diagnosticRef, barChartRef, incidentsTableRef,
      ]
      for (const ref of sections) {
        const el = ref.current as HTMLElement | null
        if (!el) continue
        const canvas = await html2canvas(el, { scale: 2, useCORS: true, logging: false })
        const imgData = canvas.toDataURL('image/png')
        const imgH = (canvas.height / canvas.width) * contentWidth
        if (yPos + imgH > pageHeight - margin) {
          pdf.addPage()
          yPos = margin
        }
        pdf.addImage(imgData, 'PNG', margin, yPos, contentWidth, imgH)
        yPos += imgH + 6
      }

      const fileName = logFileName
        ? `reporte-${logFileName.replace(/\.[^.]+$/, '')}.pdf`
        : 'reporte-hp-logs.pdf'
      pdf.save(fileName)
    } catch (err) {
      console.error('Error al exportar PDF:', err)
      toast.showError('Error al generar el PDF')
    } finally {
      setExportingPdf(false)
    }
  }

  async function handleAnalyze(logText: string, fileName?: string) {
    if (!logText.trim()) return
    setError(null)
    setResult(null)
    setPendingResult(null)
    setPendingCodesNew([])
    setCodesNew([])
    setSdsIncident(null)
    setLogFileName(fileName ?? null)
    dateFilter.reset()
    setIncidentsSeverityFilter('')
    setIncidentsSearchFilter('')
    setEventsSeverityFilter('')
    setEventsSearchFilter('')
    setExpandedIncidentIds(new Set())
    setLoading(true)
    try {
      const [data, validateRes] = await Promise.all([
        previewLogs(logText),
        validateLogs(logText).catch(() => ({ codes_new: [] as string[] })),
      ])
      const newCodes = validateRes.codes_new ?? []
      setPendingResult(data)
      setPendingCodesNew(newCodes)
      setLogModalOpen(false)
      setSdsPreModalOpen(true)
      if (newCodes.length > 0) {
        toast.showWarning(`Se detectaron ${newCodes.length} códigos nuevos. Agrégalos al catálogo si lo deseas.`)
      } else {
        toast.showSuccess('Análisis completado')
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      toast.showError(msg)
    } finally {
      setLoading(false)
    }
  }

  function commitPendingResult() {
    setResult(pendingResult)
    setCodesNew(pendingCodesNew)
    setPendingResult(null)
    setPendingCodesNew([])
  }

  async function handleSaveCodeToCatalog(body: ErrorCodeUpsertBody, isEdit: boolean = false) {
    setError(null)
    setSavingCode(true)
    try {
      const res = await upsertErrorCode(body)
      if (!isEdit) setCodesNew((prev) => prev.filter((c) => c !== body.code))
      setAddCodeModalCode(null)
      setEditCodeInitial(null)
      // Update events in the current result so the UI reflects the new solution data immediately
      setResult((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          events: prev.events.map((evt) =>
            evt.code === body.code
              ? { ...evt, code_solution_url: res.solution_url ?? body.solution_url ?? evt.code_solution_url, code_solution_content: res.solution_content ?? evt.code_solution_content }
              : evt
          ),
          incidents: prev.incidents.map((inc) => {
            const updatedEvents = inc.events.map((evt) =>
              evt.code === body.code
                ? { ...evt, code_solution_url: res.solution_url ?? body.solution_url ?? evt.code_solution_url, code_solution_content: res.solution_content ?? evt.code_solution_content }
                : evt
            )
            if (inc.code !== body.code) return { ...inc, events: updatedEvents }
            return {
              ...inc,
              events: updatedEvents,
              sds_link: res.solution_url ?? body.solution_url ?? inc.sds_link,
              sds_solution_content: res.solution_content ?? inc.sds_solution_content,
            }
          }),
        }
      })
      const baseMsg = isEdit ? `Código ${body.code} actualizado` : `Código ${body.code} agregado al catálogo`
      if (res.warning) {
        toast.showWarning(`${baseMsg}. ${res.warning}`)
      } else if (body.solution_url && res.solution_content_saved) {
        toast.showSuccess(`${baseMsg} — contenido de solución guardado`)
      } else {
        toast.showSuccess(baseMsg)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      toast.showError(msg)
    } finally {
      setSavingCode(false)
    }
  }

  function buildIncidentSummaryItems(incidents: ApiIncident[]): SavedAnalysisIncidentItem[] {
    return incidents.map((inc) => ({
      code: inc.code,
      classification: inc.classification,
      severity: inc.severity,
      occurrences: inc.occurrences,
      start_time: inc.start_time,
      end_time: inc.end_time,
      counter_range: inc.counter_range,
      sds_link: inc.sds_link ?? null,
      last_event_time: inc.end_time,
    }))
  }

  async function handleSaveIncident(name: string, equipmentIdentifier: string | null) {
    if (!result) return
    setSavingIncident(true)
    setError(null)
    try {
      await createSavedAnalysis({
        name,
        equipment_identifier: equipmentIdentifier,
        incidents: buildIncidentSummaryItems(result.incidents),
        global_severity: result.global_severity,
      })
      setSaveIncidentModalOpen(false)
      toast.showSuccess('Incidente guardado')
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      toast.showError(msg)
    } finally {
      setSavingIncident(false)
    }
  }

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
  const errorCount = filteredIncidents.filter((i) => i.severity.toUpperCase() === 'ERROR').length
  const warningCount = filteredIncidents.filter((i) => i.severity.toUpperCase() === 'WARNING').length
  const infoCount = filteredIncidents.filter((i) => i.severity.toUpperCase() === 'INFO').length
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
      let cmp = 0
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
      let cmp = 0
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
                  onClick={handleExportPDF}
                  disabled={exportingPdf}
                >
                  {exportingPdf ? 'Generando PDF…' : 'Exportar PDF'}
                </button>
              )}
              <LiveClock className="dashboard__datetime" />
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
              onCompare={() => { setCompareLogText(''); setCompareModalOpen(true) }}
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
          <section className="kpis" ref={kpisRef}>
            <div className="kpi-card">
              <div className="kpi-card__label">Estado de errores</div>
              <div className="kpi-card__values">
                <span className="kpi-card__value kpi-card__value--error">{errorCount}</span>
                <span className="kpi-card__values-sep">·</span>
                <span className="kpi-card__value kpi-card__value--warning">{warningCount}</span>
                <span className="kpi-card__values-sep">·</span>
                <span className="kpi-card__value kpi-card__value--info">{infoCount}</span>
              </div>
              <div className="kpi-card__sub">crítico · advertencia · info</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-card__label">Incidencias Activas</div>
              <div className="kpi-card__value">{filteredIncidents.length}</div>
              <div className="kpi-card__sub">incidentes detectados en el log</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-card__label">Último error crítico</div>
              {lastErrorEvent ? (
                <>
                  <div className="kpi-card__value kpi-card__value--error" style={{ fontSize: '1rem', fontWeight: 700 }}>
                    {lastErrorEvent.code}
                  </div>
                  <div className="kpi-card__sub">{lastErrorLabel} · último error registrado</div>
                </>
              ) : (
                <>
                  <div className="kpi-card__value" style={{ fontSize: '1rem', color: 'var(--color-success, #22c55e)' }}>
                    Sin errores
                  </div>
                  <div className="kpi-card__sub">último error registrado</div>
                </>
              )}
            </div>
            <div className="kpi-card">
              <div className="kpi-card__label">Eventos Registrados</div>
              <div className="kpi-card__value">{filteredEvents.length}</div>
              <div className="kpi-card__sub">eventos registrados en el log</div>
            </div>
          </section>

          {/* Diagnóstico automático basado en reglas */}
          <div ref={diagnosticRef}>
            <DiagnosticPanel events={filteredEvents} />
          </div>

          {/* Fila 2 — Grid 70% / 30%: Issue Volume | Top Errors */}
          <div className="dashboard__charts-row">
            <section className="section dashboard__chart-left">
              <h2 className="section__title">
                {activeFilter === null
                  ? 'Volumen de incidencias (registro completo)'
                  : typeof activeFilter === 'string'
                    ? `Volumen de incidencias (${new Date(activeFilter + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })})`
                    : `Volumen de incidencias (${formatWeekRange(activeFilter)})`}
              </h2>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                {([['ERROR', '#ef4444'], ['WARNING', '#f59e0b'], ['INFO', '#3b82f6']] as const).map(([sev, color]) => {
                  const active = visibleSeverities.has(sev)
                  return (
                    <button
                      key={sev}
                      onClick={() => {
                        const next = new Set(visibleSeverities)
                        if (next.has(sev)) { next.delete(sev) } else { next.add(sev) }
                        setVisibleSeverities(next)
                      }}
                      style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, cursor: 'pointer',
                        border: `1px solid ${color}`,
                        background: active ? color : 'transparent',
                        color: active ? '#fff' : color,
                        opacity: active ? 1 : 0.6,
                        transition: 'all 0.15s',
                      }}
                    >
                      {sev}
                    </button>
                  )
                })}
              </div>
              <div className="chart-wrap">
                {volumeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={volumeData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#232734" />
                      <XAxis
                        dataKey="time"
                        stroke="#9aa3b2"
                        tick={{ fontSize: 11 }}
                        interval={Math.max(0, Math.ceil(volumeData.length / 10) - 1)}
                        tickFormatter={(v) => {
                          const d = new Date(v)
                          return volumeData.length > 24
                            ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                            : d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
                        }}
                      />
                      <YAxis stroke="#9aa3b2" tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ background: '#151821', border: '1px solid #232734', borderRadius: 6 }}
                        labelStyle={{ color: '#e5e7eb' }}
                        itemStyle={{ color: '#e5e7eb' }}
                        labelFormatter={(v) => new Date(v).toLocaleString()}
                      />
                      <Legend wrapperStyle={{ paddingTop: 8, fontSize: 12 }} />
                      {visibleSeverities.has('ERROR') && <Area type="monotone" dataKey="ERROR" stackId="a" stroke="#ef4444" strokeWidth={2} fill="#ef4444" fillOpacity={0.7} />}
                      {visibleSeverities.has('WARNING') && <Area type="monotone" dataKey="WARNING" stackId="a" stroke="#f59e0b" strokeWidth={2} fill="#f59e0b" fillOpacity={0.7} />}
                      {visibleSeverities.has('INFO') && <Area type="monotone" dataKey="INFO" stackId="a" stroke="#3b82f6" strokeWidth={2} fill="#3b82f6" fillOpacity={0.7} />}
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="chart-placeholder">Sin datos para el gráfico</div>
                )}
              </div>
            </section>
            <section className="section dashboard__chart-right" ref={barChartRef}>
              <h2 className="section__title">Errores más frecuentes</h2>
              <div className="chart-wrap">
                {topCodes.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topCodes} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#232734" />
                      <XAxis type="number" stroke="#9aa3b2" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" stroke="#9aa3b2" tick={{ fontSize: 11 }} width={80} />
                      <Tooltip
                        contentStyle={{ background: '#151821', border: '1px solid #232734', borderRadius: 6 }}
                        labelStyle={{ color: '#e5e7eb' }}
                        itemStyle={{ color: '#e5e7eb' }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                          {topCodes.map((entry, index) => {
                            const color = entry.severity?.toUpperCase() === 'ERROR'
                              ? '#ef4444'
                              : entry.severity?.toUpperCase() === 'WARNING'
                              ? '#f59e0b'
                              : '#4c8bf5'
                            return <Cell key={`cell-${index}`} fill={color} />
                          })}
                        </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="chart-placeholder">Sin incidencias</div>
                )}
              </div>
            </section>
          </div>

          {/* Fila 3 — Tabla de incidencias (lo primero que se ve) */}
          <section className="section dashboard__table-section" ref={incidentsTableRef}>
            <h2 className="section__title">Incidencias</h2>
            <div className="table-toolbar">
              <label className="table-toolbar__label" htmlFor="incidents-severity-filter">
                Severidad:
              </label>
              <select
                id="incidents-severity-filter"
                className="table-toolbar__select"
                value={incidentsSeverityFilter}
                onChange={(e) => setIncidentsSeverityFilter(e.target.value)}
                aria-label="Filtrar por severidad"
              >
                <option value="">Todo</option>
                <option value="ERROR">Error</option>
                <option value="WARNING">Advertencia</option>
                <option value="INFO">Info</option>
              </select>
              <label className="table-toolbar__label" htmlFor="incidents-search-filter">
                Buscar:
              </label>
              <input
                id="incidents-search-filter"
                type="search"
                className="table-toolbar__search"
                placeholder="Código o clasificación..."
                value={incidentsSearchFilter}
                onChange={(e) => setIncidentsSearchFilter(e.target.value)}
                aria-label="Buscar en código o clasificación"
              />
            </div>
            <div className="table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th className="dashboard-table__cell-expand" aria-label="Expandir detalle" />
                    {[
                      { key: 'code', label: 'Código' },
                      { key: 'classification', label: 'Clasificación' },
                      { key: 'severity', label: 'Severidad' },
                      { key: 'occurrences', label: 'Ocurrencias' },
                      { key: 'start_time', label: 'Primera vez' },
                      { key: 'end_time', label: 'Última vez' },
                    ].map(({ key, label }) => {
                      const sortState = incidentsSort.column === key ? incidentsSort.dir : null
                      return (
                      <th key={key} {...(sortState ? { 'aria-sort': sortState === 'asc' ? 'ascending' : 'descending' } : {})}>
                        <button
                          type="button"
                          className="dashboard-table__sort-header"
                          onClick={() => setIncidentsSort((s) => ({ column: key, dir: s.column === key && s.dir === 'asc' ? 'desc' : 'asc' }))}
                        >
                          {label}
                          <span className="dashboard-table__sort-icon" aria-hidden>
                            {incidentsSort.column === key ? (incidentsSort.dir === 'asc' ? ' ↑' : ' ↓') : ' ⇅'}
                          </span>
                        </button>
                      </th>
                    )})}
                    <th className="dashboard-table__th-solution">Solución</th>
                  </tr>
                </thead>
                <tbody>
                  {incidentRows.map((inc) => {
                    const isExpanded = expandedIncidentIds.has(inc.id)
                    const toggleExpand = () => setExpandedIncidentIds((prev) => {
                      const next = new Set(prev)
                      if (next.has(inc.id)) next.delete(inc.id)
                      else next.add(inc.id)
                      return next
                    })
                    return (
                      <React.Fragment key={inc.id}>
                        <tr className="dashboard-table__row-main">
                          <td className="dashboard-table__cell-expand">
                            <button
                              type="button"
                              className="dashboard-table__expand-btn"
                              onClick={toggleExpand}
                              {...(isExpanded ? { 'aria-expanded': 'true' } : { 'aria-expanded': 'false' })}
                              aria-label={isExpanded ? 'Colapsar detalle' : 'Expandir detalle'}
                              title={isExpanded ? 'Colapsar' : 'Ver ocurrencias'}
                            >
                              {isExpanded ? '▼' : '▶'}
                            </button>
                          </td>
                          <td>{inc.code}</td>
                          <td className="dashboard-table__cell-classification" title={inc.classification || inc.code}>{inc.classification || inc.code}</td>
                          <td>
                            <span className={`badge badge--${(inc.severity || 'info').toLowerCase()}`}>
                              {inc.severity}
                            </span>
                          </td>
                          <td>{inc.occurrences}</td>
                          <td>{formatDateTime(inc.start_time)}</td>
                          <td>{formatDateTime(inc.end_time)}</td>
                          <td className="dashboard-table__cell-solution">
                            <span className="dashboard-table__cell-actions">
                              <span className="dashboard-table__cell-actions-left">
                                {inc.sds_solution_content ? (
                                  <button
                                    type="button"
                                    className="dashboard-table__solution-link"
                                    onClick={() => setSolutionModal({ content: inc.sds_solution_content!, url: inc.sds_link })}
                                  >
                                    Ver solución
                                  </button>
                                ) : inc.sds_link ? (
                                  <a href={inc.sds_link} target="_blank" rel="noopener noreferrer" className="dashboard-table__solution-link" title="Este link puede haber vencido">
                                    Ver solución ⚠
                                  </a>
                                ) : (
                                  <span className="dashboard-table__cell-actions-placeholder">—</span>
                                )}
                              </span>
                              <button
                                type="button"
                                className="dashboard__btn dashboard__btn--secondary dashboard__btn--edit"
                                onClick={() => setEditCodeInitial({
                                  code: inc.code,
                                  description: inc.classification || '',
                                  severity: inc.severity || 'INFO',
                                  solutionUrl: inc.sds_link || '',
                                })}
                                title="Editar código en el catálogo"
                              >
                                Editar
                              </button>
                            </span>
                          </td>
                        </tr>
                        {isExpanded && inc.eventsInWindow.length > 0 && (
                          <tr className="dashboard-table__row-detail-header" aria-hidden>
                            <th className="dashboard-table__cell-expand" scope="col" />
                            <th scope="col">Fecha y hora</th>
                            <th scope="col">Contador</th>
                            <th scope="col" title="Diferencia con la ocurrencia anterior">Δ</th>
                            <th scope="col">Firmware</th>
                            <th scope="col" colSpan={3}>Mensaje / Ayuda</th>
                          </tr>
                        )}
                        {isExpanded && inc.eventsInWindow.map((evt, idx) => {
                          const prevCounter = idx > 0 ? inc.eventsInWindow[idx - 1].counter : null
                          const delta = prevCounter !== null ? evt.counter - prevCounter : null
                          const msg = evt.help_reference ?? (evt as ApiEvent & { code_description?: string }).code_description ?? '—'
                          return (
                            <tr key={`${inc.id}-${idx}`} className="dashboard-table__row-detail">
                              <td className="dashboard-table__cell-expand" />
                              <td className="dashboard-table__cell-detail-label">{formatDateTime(evt.timestamp)}</td>
                              <td className="dashboard-table__cell-detail-num">{evt.counter}</td>
                              <td className="dashboard-table__cell-detail-delta" title="Diferencia de contador desde la ocurrencia anterior">
                                {delta !== null ? (delta >= 0 ? `+${delta}` : delta) : '—'}
                              </td>
                              <td>{evt.firmware ?? '—'}</td>
                              <td colSpan={3} className="dashboard-table__cell-detail-msg">{msg.length > 80 ? `${msg.slice(0, 80)}…` : msg}</td>
                            </tr>
                          )
                        })}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Fila 4 — Tabla de eventos recientes (colapsable, cerrada por defecto) */}
          <section className="section dashboard__table-section dashboard__table-section--collapsible">
            <button
              type="button"
              className="section__title section__title--toggle"
              onClick={() => setEventsTableCollapsed((c) => !c)}
            >
              <span>Últimos errores registrados</span>
              <span className="section__toggle-icon" aria-hidden>{eventsTableCollapsed ? '▶' : '▼'}</span>
            </button>
            {!eventsTableCollapsed && (
              <>
                <div className="table-toolbar">
                  <label className="table-toolbar__label" htmlFor="events-severity-filter">
                    Severidad:
                  </label>
                  <select
                    id="events-severity-filter"
                    className="table-toolbar__select"
                    value={eventsSeverityFilter}
                    onChange={(e) => setEventsSeverityFilter(e.target.value)}
                    aria-label="Filtrar por severidad"
                  >
                    <option value="">Todo</option>
                    <option value="ERROR">Error</option>
                    <option value="WARNING">Advertencia</option>
                    <option value="INFO">Info</option>
                  </select>
                  <label className="table-toolbar__label" htmlFor="events-search-filter">
                    Buscar:
                  </label>
                  <input
                    id="events-search-filter"
                    type="search"
                    className="table-toolbar__search"
                    placeholder="Código o mensaje..."
                    value={eventsSearchFilter}
                    onChange={(e) => setEventsSearchFilter(e.target.value)}
                    aria-label="Buscar en código o mensaje"
                  />
                </div>
                <div className="table-wrap">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      {[
                        { key: 'timestamp', label: 'Fecha/hora' },
                        { key: 'code', label: 'Código' },
                        { key: 'severity', label: 'Severidad' },
                        { key: 'message', label: 'Mensaje' },
                      ].map(({ key, label }) => {
                        const sortState = eventsSort.column === key ? eventsSort.dir : null
                        return (
                        <th key={key} {...(sortState ? { 'aria-sort': sortState === 'asc' ? 'ascending' : 'descending' } : {})}>
                          <button
                            type="button"
                            className="dashboard-table__sort-header"
                            onClick={() => setEventsSort((s) => ({ column: key, dir: s.column === key && s.dir === 'asc' ? 'desc' : 'asc' }))}
                          >
                            {label}
                            <span className="dashboard-table__sort-icon" aria-hidden>
                              {eventsSort.column === key ? (eventsSort.dir === 'asc' ? ' ↑' : ' ↓') : ' ⇅'}
                            </span>
                          </button>
                        </th>
                      )})}
                      <th className="dashboard-table__th-solution">Solución</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((evt, i) => (
                      <tr key={i}>
                        <td>{formatDateTime(evt.timestamp)}</td>
                        <td>{evt.code}</td>
                        <td>
                          <span className={`badge badge--${(evt.type || 'info').toLowerCase()}`}>
                            {evt.type}
                          </span>
                        </td>
                        <td>{evt.code_description?.trim() || evt.code || '—'}</td>
                        <td className="dashboard-table__cell-solution">
                          {evt.code_solution_content?.trim() ? (
                            <button
                              type="button"
                              className="dashboard-table__solution-link"
                              onClick={() => setSolutionModal({ content: evt.code_solution_content!, url: evt.code_solution_url })}
                            >
                              Ver solución
                            </button>
                          ) : evt.code_solution_url?.trim() ? (
                            <a href={evt.code_solution_url.trim()} target="_blank" rel="noopener noreferrer" className="dashboard-table__solution-link" title="Este link puede haber vencido">
                              Ver solución ⚠
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </>
            )}
          </section>

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
