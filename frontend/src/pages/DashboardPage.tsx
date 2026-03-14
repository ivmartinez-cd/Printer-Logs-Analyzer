import { useState, useEffect } from 'react'
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
import { previewLogs } from '../services/api'
import type { ParseLogsResponse, Event as ApiEvent } from '../types/api'
import './DashboardPage.css'

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

const HOURS_24_MS = 24 * 60 * 60 * 1000

const DAY_OFFSET_ALL = -1

/** Ventana de 24h para un día anterior. dayOffset 0 = últimas 24h, 1 = día anterior, etc. -1 = todo el rango. */
function get24hWindowForDay(events: ApiEvent[], dayOffset: number): { minTs: number; maxTs: number } | null {
  if (events.length === 0) return null
  const times = events.map((e) => new Date(e.timestamp).getTime()).filter((t) => !Number.isNaN(t))
  if (times.length === 0) return null
  const minTs = Math.min(...times)
  const maxTs = Math.max(...times)
  if (dayOffset === DAY_OFFSET_ALL) return { minTs, maxTs }
  const logEndTs = maxTs
  const windowEndTs = logEndTs - dayOffset * HOURS_24_MS
  const windowStartTs = windowEndTs - HOURS_24_MS
  return { minTs: windowStartTs, maxTs: windowEndTs }
}

/** Filtra eventos por día. dayOffset -1 = todos los eventos. */
function filterEventsByDay(events: ApiEvent[], dayOffset: number): ApiEvent[] {
  if (dayOffset === DAY_OFFSET_ALL) return [...events]
  const window = get24hWindowForDay(events, dayOffset)
  if (!window) return []
  const { minTs, maxTs } = window
  return events.filter((e) => {
    const t = new Date(e.timestamp).getTime()
    return !Number.isNaN(t) && t >= minTs && t <= maxTs
  })
}

/** Top N códigos por cantidad de eventos (calculado desde la lista de eventos del log). */
function getTopCodesFromEvents(events: ApiEvent[], n: number): { code: string; count: number }[] {
  const byCode = new Map<string, number>()
  for (const e of events) {
    byCode.set(e.code, (byCode.get(e.code) ?? 0) + 1)
  }
  return Array.from(byCode.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([code, count]) => ({ code, count }))
}

/** 24 buckets de 1 hora para la ventana del día elegido; horas sin eventos = 0. */
function bucketEventsLast24h(events: ApiEvent[], dayOffset: number): { time: string; count: number }[] {
  const window = get24hWindowForDay(events, dayOffset)
  if (!window) return []
  const { minTs, maxTs } = window
  const hourMs = 60 * 60 * 1000
  const counts = new Map<number, number>()
  const numHours = dayOffset === DAY_OFFSET_ALL
    ? Math.ceil((maxTs - minTs) / hourMs) || 1
    : 24
  const start = dayOffset === DAY_OFFSET_ALL ? minTs : minTs
  for (let h = 0; h < numHours; h++) {
    counts.set(start + h * hourMs, 0)
  }
  for (const e of events) {
    const t = new Date(e.timestamp).getTime()
    if (Number.isNaN(t) || t < minTs || t > maxTs) continue
    const hourIndex = Math.min(numHours - 1, Math.floor((t - minTs) / hourMs))
    const bucketStart = start + hourIndex * hourMs
    counts.set(bucketStart, (counts.get(bucketStart) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .sort(([a], [b]) => a - b)
    .map(([bucketStart, count]) => ({
      time: new Date(bucketStart).toISOString().slice(0, 13) + ':00:00.000Z',
      count,
    }))
}

const DAY_OFFSET_LABELS: Record<number, string> = {
  [DAY_OFFSET_ALL]: 'Todo',
  0: 'Hoy (últimas 24h)',
  1: 'Ayer',
  2: 'Hace 2 días',
  3: 'Hace 3 días',
  4: 'Hace 4 días',
  5: 'Hace 5 días',
  6: 'Hace 6 días',
}

interface LogPasteModalProps {
  loading: boolean
  error: string | null
  onAnalyze: (logText: string) => void
  onClose: () => void
}

function LogPasteModal({ loading, error, onAnalyze, onClose }: LogPasteModalProps) {
  const [logText, setLogText] = useState('')
  return (
    <div className="log-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="log-modal-title">
      <div className="log-modal" onClick={(e) => e.stopPropagation()}>
        <div className="log-modal__header">
          <h2 id="log-modal-title" className="log-modal__title">Pegar logs HP</h2>
          <button type="button" className="log-modal__close" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        <textarea
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
  const [dashboardDayOffset, setDashboardDayOffset] = useState(0)
  const [logModalOpen, setLogModalOpen] = useState(false)

  async function handleAnalyze(logText: string) {
    if (!logText.trim()) return
    setError(null)
    setResult(null)
    setLoading(true)
    try {
      const data = await previewLogs(logText)
      setResult(data)
      setLogModalOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  const events = result?.events ?? []
  const incidents = result?.incidents ?? []
  const filteredEvents = filterEventsByDay(events, dashboardDayOffset)
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
  const errorCount = filteredEvents.filter((e) => e.type.toUpperCase() === 'ERROR').length
  const warningCount = filteredEvents.filter((e) => e.type.toUpperCase() === 'WARNING').length
  const infoCount = filteredEvents.filter((e) => e.type.toUpperCase() === 'INFO').length
  const uniqueCodes = new Set(filteredEvents.map((e) => e.code)).size
  const volumeData = bucketEventsLast24h(events, dashboardDayOffset)
  const topCodes = getTopCodesFromEvents(filteredEvents, 5)
  const tableRows = [...filteredEvents].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

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

          <>
          {/* Subheader: Errors Dashboard | filtro día | date */}
          <div className="dashboard__subheader">
            <span className="dashboard__subheader-title">Errors Dashboard</span>
            <div className="dashboard__subheader-actions">
              <label className="dashboard__day-filter-label" htmlFor="dashboard-day-filter">
                Ver datos:
              </label>
              <select
                id="dashboard-day-filter"
                className="dashboard__day-select"
                value={dashboardDayOffset}
                onChange={(e) => setDashboardDayOffset(Number(e.target.value))}
                aria-label="Filtrar por día"
              >
                {[DAY_OFFSET_ALL, 0, 1, 2, 3, 4, 5, 6].map((d) => (
                  <option key={d} value={d}>
                    {DAY_OFFSET_LABELS[d]}
                  </option>
                ))}
              </select>
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
              <div className="kpi-card__value">{filteredEvents.length}</div>
              <div className="kpi-card__sub">eventos / {uniqueCodes} códigos en período</div>
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
                {dashboardDayOffset === DAY_OFFSET_ALL ? 'Issue Volume (todo el log)' : 'Issue Volume (Last 24h)'}
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
                      <YAxis type="category" dataKey="code" stroke="#9aa3b2" tick={{ fontSize: 11 }} width={80} />
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

          {/* Fila 3 — Tabla full width */}
          <section className="section dashboard__table-section">
            <h2 className="section__title">Recent Printer Errors</h2>
            <div className="table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Code</th>
                    <th>Severity</th>
                    <th>Message</th>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          </>
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
