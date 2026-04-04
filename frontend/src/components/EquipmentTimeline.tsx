import { useState } from 'react'
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
import type { SavedAnalysisSummary } from '../types/api'
import { getSavedAnalysis } from '../services/api'

interface TimelinePoint {
  date: string
  dateRaw: string
  name: string
  errors: number
  warnings: number
}

function formatShortDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

interface EquipmentTimelineProps {
  equipmentId: string
  snapshots: SavedAnalysisSummary[]
}

export function EquipmentTimeline({ equipmentId, snapshots }: EquipmentTimelineProps) {
  const [expanded, setExpanded] = useState(false)
  const [data, setData] = useState<TimelinePoint[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  async function fetchData() {
    setLoading(true)
    setFetchError(null)
    try {
      const fulls = await Promise.all(snapshots.map((s) => getSavedAnalysis(s.id)))
      const points: TimelinePoint[] = fulls
        .map((full, i) => ({
          date: formatShortDate(snapshots[i].created_at),
          dateRaw: snapshots[i].created_at,
          name: snapshots[i].name,
          errors: full.incidents.filter((inc) => inc.severity === 'ERROR').length,
          warnings: full.incidents.filter((inc) => inc.severity === 'WARNING').length,
        }))
        .sort((a, b) => a.dateRaw.localeCompare(b.dateRaw))
      setData(points)
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

  const sorted = [...snapshots].sort((a, b) => a.created_at.localeCompare(b.created_at))
  const first = sorted[0]?.created_at
  const last = sorted[sorted.length - 1]?.created_at

  return (
    <div className="equipment-timeline">
      <button type="button" className="equipment-timeline__toggle" onClick={handleToggle}>
        <span className="equipment-timeline__label">{equipmentId}</span>
        <span className="equipment-timeline__meta">
          {snapshots.length} snapshots · {formatShortDate(first)} → {formatShortDate(last)}
        </span>
        <span className="equipment-timeline__arrow">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
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
        </div>
      )}
    </div>
  )
}
