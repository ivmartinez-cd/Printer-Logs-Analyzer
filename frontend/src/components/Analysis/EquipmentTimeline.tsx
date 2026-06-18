import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { SavedAnalysisSummary } from '../../types/api'
import { getSavedAnalysis } from '../../services/api'

interface TimelinePoint {
  date: string
  dateRaw: string
  name: string
  errors: number
  warnings: number
  errorOcc: number
}

type Trend = 'new' | 'resolved' | 'up' | 'down' | 'stable'

interface CodeRow {
  code: string
  classification: string
  severity: string
  occ: number[] // occurrences per snapshot, in date order
  trend: Trend
}

interface Verdict {
  level: 'red' | 'yellow' | 'green'
  text: string
}

const TREND_META: Record<Trend, { label: string; color: string }> = {
  up: { label: '↑ En aumento', color: '#f87171' },
  new: { label: '✚ Nuevo', color: '#f87171' },
  stable: { label: '→ Estable', color: '#94a3b8' },
  down: { label: '↓ Baja', color: '#34d399' },
  resolved: { label: '✓ Resuelto', color: '#34d399' },
}

function computeTrend(occ: number[]): Trend {
  const first = occ[0] ?? 0
  const last = occ[occ.length - 1] ?? 0
  if (first === 0 && last > 0) return 'new'
  if (first > 0 && last === 0) return 'resolved'
  if (last > first) return 'up'
  if (last < first) return 'down'
  return 'stable'
}

function computeVerdict(rows: CodeRow[]): Verdict {
  const errs = rows.filter((r) => r.severity.toUpperCase() === 'ERROR')
  if (errs.length === 0) {
    return { level: 'green', text: 'Sin errores críticos en el período. No parece requerir visita técnica.' }
  }
  const worsening = errs.filter((r) => r.trend === 'new' || r.trend === 'up')
  if (worsening.length > 0) {
    return {
      level: 'red',
      text: `Se sugiere evaluar visita técnica: error(es) nuevo(s) o en aumento — ${worsening.map((r) => r.code).join(', ')}.`,
    }
  }
  if (errs.every((r) => r.trend === 'down' || r.trend === 'resolved')) {
    return { level: 'green', text: 'Los errores críticos disminuyen o se resolvieron. Podés esperar antes de enviar técnico.' }
  }
  const persistent = errs.filter((r) => r.trend === 'stable' && (r.occ[r.occ.length - 1] ?? 0) > 0)
  return {
    level: 'yellow',
    text: `Errores críticos persistentes y estables — ${persistent.map((r) => r.code).join(', ')}. Si el caso de soporte sigue abierto, evaluar visita.`,
  }
}

function formatShortDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface EquipmentTimelineProps {
  equipmentId: string
  snapshots: SavedAnalysisSummary[]
  /** Render the chart inline (auto-loaded, no collapsible toggle). */
  embedded?: boolean
}

export function EquipmentTimeline({ equipmentId, snapshots, embedded = false }: EquipmentTimelineProps) {
  const [expanded, setExpanded] = useState(false)
  const [data, setData] = useState<TimelinePoint[] | null>(null)
  const [codeRows, setCodeRows] = useState<CodeRow[] | null>(null)
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  async function fetchData() {
    setLoading(true)
    setFetchError(null)
    try {
      const fulls = await Promise.all(snapshots.map((s) => getSavedAnalysis(s.id)))
      // Snapshots in chronological (date) order.
      const order = snapshots
        .map((s, i) => ({ s, full: fulls[i] }))
        .sort((a, b) => a.s.created_at.localeCompare(b.s.created_at))

      const isErr = (sev: string) => (sev || '').toUpperCase() === 'ERROR'
      const isWarn = (sev: string) => (sev || '').toUpperCase() === 'WARNING'

      const points: TimelinePoint[] = order.map(({ s, full }) => ({
        date: formatShortDate(s.created_at),
        dateRaw: s.created_at,
        name: s.name,
        errors: full.incidents.filter((inc) => isErr(inc.severity)).length,
        warnings: full.incidents.filter((inc) => isWarn(inc.severity)).length,
        errorOcc: full.incidents
          .filter((inc) => isErr(inc.severity))
          .reduce((acc, inc) => acc + (inc.occurrences || 0), 0),
      }))

      // Per-code occurrences across snapshots (ERROR/WARNING only).
      const meta = new Map<string, { classification: string; severity: string }>()
      for (const { full } of order) {
        for (const inc of full.incidents) {
          if ((isErr(inc.severity) || isWarn(inc.severity)) && !meta.has(inc.code)) {
            meta.set(inc.code, {
              classification: inc.classification || inc.code,
              severity: inc.severity.toUpperCase(),
            })
          }
        }
      }
      const rows: CodeRow[] = []
      for (const [code, m] of meta) {
        const occ = order.map(({ full }) => {
          const inc = full.incidents.find((x) => x.code === code)
          return inc ? inc.occurrences || 0 : 0
        })
        rows.push({ code, classification: m.classification, severity: m.severity, occ, trend: computeTrend(occ) })
      }
      // Errors first, then by latest occurrences desc.
      rows.sort((a, b) => {
        if (a.severity !== b.severity) return a.severity === 'ERROR' ? -1 : 1
        return (b.occ[b.occ.length - 1] ?? 0) - (a.occ[a.occ.length - 1] ?? 0)
      })

      setData(points)
      setCodeRows(rows)
      setVerdict(computeVerdict(rows))
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : 'Error al cargar evolución')
    } finally {
      setLoading(false)
    }
  }

  function handleToggle() {
    if (!expanded && data === null && !loading) {
      fetchData()
    }
    setExpanded((e) => !e)
  }

  // Embedded mode: auto-load the chart on mount (no toggle).
  useEffect(() => {
    if (embedded && data === null && !loading) {
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embedded])

  const sorted = [...snapshots].sort((a, b) => a.created_at.localeCompare(b.created_at))
  const first = sorted[0]?.created_at
  const last = sorted[sorted.length - 1]?.created_at

  const body = (
    <div className="equipment-timeline__body">
      {loading && <p className="dashboard__muted">Cargando evolución…</p>}
      {fetchError && <p className="dashboard__error">{fetchError}</p>}
      {data && (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 8, right: 20, left: -10, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3544" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9aa3b2' }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9aa3b2' }} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                const point = data.find((p) => p.date === label)
                return (
                  <div className="equipment-timeline__tooltip">
                    {point && <p className="equipment-timeline__tooltip-name">{point.name}</p>}
                    <p className="equipment-timeline__tooltip-date">{label}</p>
                    {payload.map((p) => (
                      <p key={String(p.dataKey)} style={{ color: p.color as string }}>
                        {p.name}: {p.value}
                      </p>
                    ))}
                  </div>
                )
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="errors"
              name="Errores"
              stroke="#e53e3e"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="warnings"
              name="Advertencias"
              stroke="#d97706"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {verdict && (
        <div
          style={{
            marginTop: '12px',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background:
              verdict.level === 'red'
                ? 'rgba(239,68,68,0.1)'
                : verdict.level === 'yellow'
                  ? 'rgba(234,179,8,0.1)'
                  : 'rgba(34,197,94,0.1)',
            border: `1px solid ${verdict.level === 'red' ? 'rgba(239,68,68,0.25)' : verdict.level === 'yellow' ? 'rgba(234,179,8,0.25)' : 'rgba(34,197,94,0.25)'}`,
            color: verdict.level === 'red' ? '#f87171' : verdict.level === 'yellow' ? '#fbbf24' : '#34d399',
          }}
        >
          <span>{verdict.level === 'red' ? '🔧' : verdict.level === 'yellow' ? '🔁' : '✅'}</span>
          <span>{verdict.text}</span>
        </div>
      )}

      {codeRows && codeRows.length > 0 && data && (
        <div className="table-wrap" style={{ marginTop: '12px', overflowX: 'auto' }}>
          <table className="dashboard-table" style={{ margin: 0, fontSize: '0.82rem' }}>
            <thead>
              <tr>
                <th scope="col" style={{ padding: '8px 12px' }}>Código</th>
                {data.map((p) => (
                  <th key={p.dateRaw} scope="col" style={{ padding: '8px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {p.date}
                  </th>
                ))}
                <th scope="col" style={{ padding: '8px 12px' }}>Tendencia</th>
              </tr>
            </thead>
            <tbody>
              {codeRows.map((r) => {
                const isErr = r.severity === 'ERROR'
                return (
                  <tr key={r.code}>
                    <td style={{ padding: '6px 12px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: isErr ? '#f87171' : '#fbbf24' }}>
                        {r.code}
                      </span>
                      <span style={{ color: '#64748b', marginLeft: '8px' }}>{r.classification}</span>
                    </td>
                    {r.occ.map((n, i) => (
                      <td key={i} style={{ padding: '6px 12px', textAlign: 'right', color: n === 0 ? '#475569' : '#e2e8f0', fontWeight: 600 }}>
                        {n}
                      </td>
                    ))}
                    <td style={{ padding: '6px 12px', color: TREND_META[r.trend].color, fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {TREND_META[r.trend].label}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  if (embedded) {
    return (
      <div className="equipment-timeline equipment-timeline--embedded">
        <span className="equipment-timeline__meta" style={{ display: 'block', marginBottom: '8px' }}>
          📈 Evolución · {snapshots.length} snapshots · {formatShortDate(first)} → {formatShortDate(last)}
        </span>
        {body}
      </div>
    )
  }

  return (
    <div className="equipment-timeline">
      <button type="button" className="equipment-timeline__toggle" onClick={handleToggle}>
        <span className="equipment-timeline__label">{equipmentId}</span>
        <span className="equipment-timeline__meta">
          {snapshots.length} snapshots · {formatShortDate(first)} → {formatShortDate(last)}
        </span>
        <span className="equipment-timeline__arrow">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && body}
    </div>
  )
}


