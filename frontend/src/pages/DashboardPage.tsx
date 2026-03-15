import React, { useState, useEffect, useRef } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import { previewLogs, validateLogs, upsertErrorCode } from '../services/api'
import type { ParseLogsResponse, Event as ApiEvent, Incident as ApiIncident, ErrorCodeUpsertBody } from '../types/api'
import { AddCodeToCatalogModal } from '../components/AddCodeToCatalogModal'
import { useToast } from '../contexts/ToastContext'

function useLiveTime() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return now
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'short',
      timeStyle: 'medium',
    })
  } catch {
    return iso
  }
}

/** selectedDate: null = Todo el log; "YYYY-MM-DD" = solo ese día (calendario local). */
function getWindowForDate(events: ApiEvent[], selectedDate: string | null): { minTs: number; maxTs: number } | null {
  if (events.length === 0) return null
  const times = events.map((e) => new Date(e.timestamp).getTime()).filter((t) => !Number.isNaN(t))
  if (times.length === 0) return null
  const minTs = Math.min(...times)
  const maxTs = Math.max(...times)
  if (!selectedDate) return { minTs, maxTs }
  const [y, m, d] = selectedDate.split('-').map(Number)
  const startOfDay = new Date(y, m - 1, d, 0, 0, 0, 0).getTime()
  const endOfDay = new Date(y, m - 1, d, 23, 59, 59, 999).getTime()
  return { minTs: startOfDay, maxTs: endOfDay }
}

/** Rango de fechas del log en formato YYYY-MM-DD para min/max del input date. */
function getDateRangeFromEvents(events: ApiEvent[]): { minDate: string; maxDate: string } | null {
  if (events.length === 0) return null
  const dates = events.map((e) => {
    const d = new Date(e.timestamp)
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
  }).filter((n) => !Number.isNaN(n))
  if (dates.length === 0) return null
  const min = Math.min(...dates)
  const max = Math.max(...dates)
  const toStr = (n: number) => {
    const y = Math.floor(n / 10000)
    const m = Math.floor((n % 10000) / 100)
    const d = n % 100
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }
  return { minDate: toStr(min), maxDate: toStr(max) }
}

function filterEventsByDate(events: ApiEvent[], selectedDate: string | null): ApiEvent[] {
  const window = getWindowForDate(events, selectedDate)
  if (!window) return []
  const { minTs, maxTs } = window
  return events.filter((e) => {
    const t = new Date(e.timestamp).getTime()
    return !Number.isNaN(t) && t >= minTs && t <= maxTs
  })
}

function filterIncidentsByDate(
  incidents: ApiIncident[],
  events: ApiEvent[],
  selectedDate: string | null
): ApiIncident[] {
  const window = getWindowForDate(events, selectedDate)
  if (!window) return []
  const { minTs, maxTs } = window
  return incidents.filter((inc) =>
    inc.events.some((e) => {
      const t = new Date(e.timestamp).getTime()
      return !Number.isNaN(t) && t >= minTs && t <= maxTs
    })
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
  eventsInWindow: ApiEvent[]
}

function getIncidentTableRows(
  incidents: ApiIncident[],
  events: ApiEvent[],
  selectedDate: string | null
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
  selectedDate: string | null,
  n: number
): { name: string; count: number }[] {
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
    .map((x) => ({ name: x.inc.code, count: x.countInWindow }))
}

function bucketEventsByHour(events: ApiEvent[], selectedDate: string | null): { time: string; count: number }[] {
  const window = getWindowForDate(events, selectedDate)
  if (!window) return []
  const { minTs, maxTs } = window
  const hourMs = 60 * 60 * 1000
  const numHours = Math.ceil((maxTs - minTs) / hourMs) || 1
  const counts = new Map<number, number>()
  for (let h = 0; h < numHours; h++) {
    counts.set(minTs + h * hourMs, 0)
  }
  for (const e of events) {
    const t = new Date(e.timestamp).getTime()
    if (Number.isNaN(t) || t < minTs || t > maxTs) continue
    const hourIndex = Math.min(numHours - 1, Math.floor((t - minTs) / hourMs))
    const bucketStart = minTs + hourIndex * hourMs
    counts.set(bucketStart, (counts.get(bucketStart) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .sort(([a], [b]) => a - b)
    .map(([bucketStart, count]) => ({
      time: new Date(bucketStart).toISOString().slice(0, 13) + ':00:00.000Z',
      count,
    }))
}

interface LogPasteModalProps {
  loading: boolean
  error: string | null
  onAnalyze: (logText: string) => void
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

function LogPasteModal({ loading, error, onAnalyze, onClose }: LogPasteModalProps) {
  const [logText, setLogText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])
  return (
    <div className="log-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="log-modal-title">
      <div className="log-modal" onClick={(e) => e.stopPropagation()}>
        <div className="log-modal__header">
          <h2 id="log-modal-title" className="log-modal__title">Pegar logs HP</h2>
          <button type="button" className="log-modal__close" onClick={onClose} aria-label="Cerrar">×</button>
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
            onClick={() => onAnalyze(logText)}
            disabled={loading || !logText.trim()}
          >
            {loading ? 'Analizando…' : 'Analizar'}
          </button>
          <button type="button" className="log-modal__btn-secondary" onClick={onClose} disabled={loading}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const now = useLiveTime()
  const [result, setResult] = useState<ParseLogsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [logModalOpen, setLogModalOpen] = useState(false)
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
  const toast = useToast()

  async function handleAnalyze(logText: string) {
    if (!logText.trim()) return
    setError(null)
    setResult(null)
    setCodesNew([])
    setSelectedDate(null)
    setIncidentsSeverityFilter('')
    setIncidentsSearchFilter('')
    setEventsSeverityFilter('')
    setEventsSearchFilter('')
    setExpandedIncidentIds(new Set())
    setLoading(true)
    try {
      const data = await previewLogs(logText)
      const validateRes = await validateLogs(logText).catch(() => ({ codes_new: [] as string[] }))
      const newCodes = validateRes.codes_new ?? []
      setResult(data)
      setCodesNew(newCodes)
      setLogModalOpen(false)
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

  async function handleSaveCodeToCatalog(body: ErrorCodeUpsertBody, isEdit: boolean = false) {
    setError(null)
    setSavingCode(true)
    try {
      await upsertErrorCode(body)
      if (!isEdit) setCodesNew((prev) => prev.filter((c) => c !== body.code))
      setAddCodeModalCode(null)
      setEditCodeInitial(null)
      toast.showSuccess(isEdit ? `Código ${body.code} actualizado` : `Código ${body.code} agregado al catálogo`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      toast.showError(msg)
    } finally {
      setSavingCode(false)
    }
  }

  const events = result?.events ?? []
  const incidents = result?.incidents ?? []
  const filteredEvents = filterEventsByDate(events, selectedDate)
  const filteredIncidents = filterIncidentsByDate(incidents, events, selectedDate)
  const dateRange = getDateRangeFromEvents(events)
  const SEVERITY_SCORE: Record<string, number> = { ERROR: 3, WARNING: 2, INFO: 1 }
  const globalSeverityFromFiltered =
    filteredEvents.length > 0
      ? filteredEvents.reduce((best, e) => {
          const s = (e.type?.toUpperCase() ?? 'INFO') as string
          const score = SEVERITY_SCORE[s] ?? 1
          const bestScore = SEVERITY_SCORE[best] ?? 1
          return score > bestScore ? s : best
        }, 'INFO')
      : '—'
  const errorCount = filteredIncidents.filter((i) => i.severity.toUpperCase() === 'ERROR').length
  const warningCount = filteredIncidents.filter((i) => i.severity.toUpperCase() === 'WARNING').length
  const infoCount = filteredIncidents.filter((i) => i.severity.toUpperCase() === 'INFO').length
  const uniqueCodes = new Set(filteredEvents.map((e) => e.code)).size
  const volumeData = bucketEventsByHour(events, selectedDate)
  const topCodes = getTopIncidentsForChart(incidents, events, selectedDate, 5)
  const incidentRowsBase = getIncidentTableRows(incidents, events, selectedDate)
  const incidentRowsFiltered = incidentRowsBase.filter((inc) => {
    if (incidentsSeverityFilter && inc.severity.toUpperCase() !== incidentsSeverityFilter) return false
    const q = incidentsSearchFilter.trim().toLowerCase()
    if (q) {
      const code = (inc.code ?? '').toLowerCase()
      const classification = (inc.classification ?? '').toLowerCase()
      if (!code.includes(q) && !classification.includes(q)) return false
    }
    return true
  })
  const incidentRows = [...incidentRowsFiltered].sort((a, b) => {
    const { column, dir } = incidentsSort
    const mult = dir === 'asc' ? 1 : -1
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
  const tableRowsBase = [...filteredEvents].filter((evt) => {
    if (eventsSeverityFilter && (evt.type?.toUpperCase() ?? 'INFO') !== eventsSeverityFilter) return false
    const q = eventsSearchFilter.trim().toLowerCase()
    if (q) {
      const code = (evt.code ?? '').toLowerCase()
      const msg = (evt.code_description ?? evt.help_reference ?? '').toLowerCase()
      if (!code.includes(q) && !msg.includes(q)) return false
    }
    return true
  })
  const tableRows = [...tableRowsBase].sort((a, b) => {
    const { column, dir } = eventsSort
    const mult = dir === 'asc' ? 1 : -1
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

  return (
    <div className="dashboard">
      {!result ? (
        /* Sin resultado: siempre el marco de bienvenida (también detrás del modal) */
        <div className="dashboard__frame">
          <header className="dashboard__header dashboard__header--inside-frame">
            <h1 className="dashboard__title">HP Logs Analyzer</h1>
            <time className="dashboard__datetime" dateTime={now.toISOString()}>
              {now.toLocaleString(undefined, {
                dateStyle: 'long',
                timeStyle: 'medium',
              })}
            </time>
          </header>
          <div className="dashboard__welcome-wrap">
            <section className="dashboard__welcome">
              <p className="dashboard__tagline">
                Analiza logs de impresoras HP, detecta errores por severidad y visualiza tendencias en segundos.
              </p>
              <button
                type="button"
                className="dashboard__btn dashboard__btn--primary dashboard__btn--welcome"
                onClick={() => setLogModalOpen(true)}
              >
                Pegar logs y analizar
              </button>
              <div className="dashboard__features">
                <span className="dashboard__features-title">Después del análisis verás:</span>
                <ul className="dashboard__features-list">
                  <li>KPIs por severidad (Error / Warning / Info) y códigos impactados</li>
                  <li>Gráfico de volumen de eventos en el tiempo (con filtro por día)</li>
                  <li>Top 5 códigos de error con mayor ocurrencia</li>
                  <li>Tabla de eventos recientes con timestamp, código, severidad y mensaje</li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      ) : (
        <>
          <header className="dashboard__header">
            <h1 className="dashboard__title">HP Logs Analyzer</h1>
            <div className="dashboard__header-actions">
              <button
                type="button"
                className="dashboard__btn dashboard__btn--primary dashboard__btn--header-cta"
                onClick={() => setLogModalOpen(true)}
              >
                Analizar otro log
              </button>
              <time className="dashboard__datetime" dateTime={now.toISOString()}>
                {now.toLocaleString(undefined, {
                  dateStyle: 'long',
                  timeStyle: 'medium',
                })}
              </time>
            </div>
          </header>

          {result?.errors?.length > 0 && (
            <div className="dashboard__parse-errors-banner" role="alert">
              Se omitieron {result!.errors.length} líneas por formato inválido
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
          {/* Subheader: Errors Dashboard | filtro día | date */}
          <div className="dashboard__subheader">
            <span className="dashboard__subheader-title">Errors Dashboard</span>
            <div className="dashboard__subheader-actions">
              <label className="dashboard__day-filter-label" htmlFor="dashboard-date-filter">
                Ver datos:
              </label>
              <input
                id="dashboard-date-filter"
                type="date"
                className="dashboard__date-input"
                min={dateRange?.minDate}
                max={dateRange?.maxDate}
                value={selectedDate ?? ''}
                onChange={(e) => setSelectedDate(e.target.value || null)}
                aria-label="Filtrar por fecha del log"
              />
              <button
                type="button"
                className={`dashboard__btn dashboard__btn--secondary dashboard__btn--todo ${selectedDate === null ? 'dashboard__btn--todo-active' : ''}`}
                onClick={() => setSelectedDate(null)}
              >
                Todo
              </button>
              <time className="dashboard__datetime" dateTime={now.toISOString()}>
                {now.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
              </time>
            </div>
          </div>

          {/* Fila 1 — KPIs (4 cards, mismo tamaño) */}
          <section className="kpis">
            <div className="kpi-card">
              <div className="kpi-card__label">Error Status</div>
              <div className="kpi-card__values">
                <span className="kpi-card__value kpi-card__value--error">{errorCount}</span>
                <span className="kpi-card__value kpi-card__value--warning">{warningCount}</span>
                <span className="kpi-card__value kpi-card__value--info">{infoCount}</span>
              </div>
              <div className="kpi-card__sub">crit / warn / info</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-card__label">Activity Impacts</div>
              <div className="kpi-card__value">{filteredIncidents.length}</div>
              <div className="kpi-card__sub">incidencias en período</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-card__label">Impacted Printers</div>
              <div className="kpi-card__value">{uniqueCodes}</div>
              <div className="kpi-card__sub">códigos únicos / {globalSeverityFromFiltered} global</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-card__label">Resolved</div>
              <div className="kpi-card__value">{filteredEvents.length}</div>
              <div className="kpi-card__sub">eventos en período</div>
            </div>
          </section>

          {/* Fila 2 — Grid 70% / 30%: Issue Volume | Top Errors */}
          <div className="dashboard__charts-row">
            <section className="section dashboard__chart-left">
              <h2 className="section__title">
                {selectedDate ? `Issue Volume (${selectedDate})` : 'Issue Volume (todo el log)'}
              </h2>
              <div className="chart-wrap">
                {volumeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={volumeData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                      <defs>
                        <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4c8bf5" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#4c8bf5" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#232734" />
                      <XAxis
                        dataKey="time"
                        stroke="#9aa3b2"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) => new Date(v).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      />
                      <YAxis stroke="#9aa3b2" tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ background: '#151821', border: '1px solid #232734', borderRadius: 6 }}
                        labelFormatter={(v) => new Date(v).toLocaleString()}
                      />
                      <Area type="monotone" dataKey="count" stroke="#4c8bf5" strokeWidth={2} fill="url(#volumeGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="chart-placeholder">Sin datos para el gráfico</div>
                )}
              </div>
            </section>
            <section className="section dashboard__chart-right">
              <h2 className="section__title">Top Errors</h2>
              <div className="chart-wrap">
                {topCodes.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topCodes} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#232734" />
                      <XAxis type="number" stroke="#9aa3b2" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" stroke="#9aa3b2" tick={{ fontSize: 11 }} width={80} />
                      <Tooltip
                        contentStyle={{ background: '#151821', border: '1px solid #232734', borderRadius: 6 }}
                      />
                      <Bar dataKey="count" fill="#4c8bf5" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="chart-placeholder">Sin incidencias</div>
                )}
              </div>
            </section>
          </div>

          {/* Fila 3 — Tabla de incidencias (lo primero que se ve) */}
          <section className="section dashboard__table-section">
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
                <option value="WARNING">Warning</option>
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
                      { key: 'code', label: 'Code' },
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
                          <td>{inc.classification || inc.code}</td>
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
                                {inc.sds_link ? (
                                  <a href={inc.sds_link} target="_blank" rel="noopener noreferrer" className="dashboard-table__solution-link">
                                    Ver solución
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
              <span>Recent Printer Errors</span>
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
                    <option value="WARNING">Warning</option>
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
                        { key: 'timestamp', label: 'Timestamp' },
                        { key: 'code', label: 'Code' },
                        { key: 'severity', label: 'Severity' },
                        { key: 'message', label: 'Message' },
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
                          {evt.code_solution_url?.trim() ? (
                            <a href={evt.code_solution_url.trim()} target="_blank" rel="noopener noreferrer" className="dashboard-table__solution-link">
                              Ver solución
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
          </>
          )}
        </>
      )}

      {/* Modal: siempre encima cuando está abierto (desde bienvenida o desde dashboard) */}
      {logModalOpen && (
        <LogPasteModal
          loading={loading}
          error={error}
          onAnalyze={handleAnalyze}
          onClose={() => {
            setError(null)
            setLogModalOpen(false)
          }}
        />
      )}
    </div>
  )
}
