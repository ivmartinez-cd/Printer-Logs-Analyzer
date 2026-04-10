import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { EnrichedEvent as ApiEvent } from '../types/api'
import { formatWeekRange, getWindowForDate, type DateFilter } from '../hooks/useDateFilter'

interface EnrichedVolumeDataPoint {
  time: string
  ERROR: number
  WARNING: number
  INFO: number
  codes: {
    ERROR: string[]
    WARNING: string[]
    INFO: string[]
  }
}

function bucketEventsByHourWithCodes(
  events: ApiEvent[],
  selectedDate: DateFilter
): EnrichedVolumeDataPoint[] {
  const window = getWindowForDate(events, selectedDate)
  if (!window) return []
  const { minTs, maxTs } = window
  const hourMs = 60 * 60 * 1000
  const numHours = Math.ceil((maxTs - minTs) / hourMs) || 1
  const buckets = new Map<
    number,
    { ERROR: number; WARNING: number; INFO: number; codes: { ERROR: Set<string>; WARNING: Set<string>; INFO: Set<string> } }
  >()
  for (let h = 0; h < numHours; h++) {
    buckets.set(minTs + h * hourMs, {
      ERROR: 0,
      WARNING: 0,
      INFO: 0,
      codes: { ERROR: new Set(), WARNING: new Set(), INFO: new Set() },
    })
  }
  for (const e of events) {
    const t = new Date(e.timestamp).getTime()
    if (Number.isNaN(t) || t < minTs || t > maxTs) continue
    const hourIndex = Math.min(numHours - 1, Math.floor((t - minTs) / hourMs))
    const bucketStart = minTs + hourIndex * hourMs
    const bucket = buckets.get(bucketStart)!
    const sev = (e.type ?? '').toUpperCase() as 'ERROR' | 'WARNING' | 'INFO'
    if (sev === 'ERROR') {
      bucket.ERROR++
      if (e.code) bucket.codes.ERROR.add(e.code)
    } else if (sev === 'WARNING') {
      bucket.WARNING++
      if (e.code) bucket.codes.WARNING.add(e.code)
    } else {
      bucket.INFO++
      if (e.code) bucket.codes.INFO.add(e.code)
    }
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([bucketStart, bucket]) => ({
      time: new Date(bucketStart).toISOString().slice(0, 13) + ':00:00.000Z',
      ERROR: bucket.ERROR,
      WARNING: bucket.WARNING,
      INFO: bucket.INFO,
      codes: {
        ERROR: Array.from(bucket.codes.ERROR),
        WARNING: Array.from(bucket.codes.WARNING),
        INFO: Array.from(bucket.codes.INFO),
      },
    }))
}

const SEV_COLORS: Record<string, string> = {
  ERROR: '#ef4444',
  WARNING: '#f59e0b',
  INFO: '#3b82f6',
}

interface CustomTooltipProps {
  active?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: Array<{ payload?: any }>
  label?: string
  visibleSeverities: Set<string>
  isMultiDay: boolean
}

function CustomTooltip({
  active,
  payload,
  label,
  visibleSeverities,
  isMultiDay,
}: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const dataPoint = payload[0]?.payload as EnrichedVolumeDataPoint | undefined
  if (!dataPoint) return null

  const timeLabel = isMultiDay
    ? new Date(label as string).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : new Date(label as string).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })

  const severities = (['ERROR', 'WARNING', 'INFO'] as const).filter(
    (sev) => visibleSeverities.has(sev) && dataPoint[sev] > 0
  )

  if (severities.length === 0) return null

  return (
    <div
      style={{
        background: '#151821',
        border: '1px solid #232734',
        borderRadius: 6,
        padding: '8px 12px',
        minWidth: 160,
        maxWidth: 260,
      }}
    >
      <div style={{ color: '#e5e7eb', fontWeight: 600, marginBottom: 6, fontSize: 12 }}>
        {timeLabel}
      </div>
      {severities.map((sev) => {
        const codes = dataPoint.codes[sev]
        const displayed = codes.slice(0, 5)
        const overflow = codes.length - displayed.length
        return (
          <div key={sev} style={{ marginBottom: severities[severities.length - 1] === sev ? 0 : 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: SEV_COLORS[sev],
                  flexShrink: 0,
                }}
              />
              <span style={{ color: SEV_COLORS[sev], fontWeight: 600, fontSize: 11 }}>
                {sev}
              </span>
              <span style={{ color: '#9aa3b2', fontSize: 11, marginLeft: 'auto' }}>
                {dataPoint[sev]}
              </span>
            </div>
            {codes.length > 0 && (
              <div
                style={{
                  color: '#c9d1d9',
                  fontSize: 10,
                  fontFamily: 'monospace',
                  paddingLeft: 14,
                  lineHeight: 1.4,
                }}
              >
                {displayed.join(', ')}
                {overflow > 0 && (
                  <span style={{ color: '#6b7280' }}>{` +${overflow} más`}</span>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

interface IncidentsChartProps {
  events: ApiEvent[]
  activeFilter: DateFilter
  visibleSeverities: Set<string>
  onSeverityToggle: (severity: string) => void
}

export function IncidentsChart({
  events,
  activeFilter,
  visibleSeverities,
  onSeverityToggle,
}: IncidentsChartProps) {
  const volumeData = useMemo(
    () => bucketEventsByHourWithCodes(events, activeFilter),
    [events, activeFilter]
  )

  const isMultiDay = volumeData.length > 24

  const title =
    activeFilter === null
      ? 'Volumen de incidencias (registro completo)'
      : typeof activeFilter === 'string'
        ? `Volumen de incidencias (${new Date(activeFilter + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })})`
        : `Volumen de incidencias (${formatWeekRange(activeFilter)})`

  return (
    <section className="section dashboard__chart-left">
      <h2 className="section__title">{title}</h2>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {(
          [
            ['ERROR', '#ef4444'],
            ['WARNING', '#f59e0b'],
            ['INFO', '#3b82f6'],
          ] as const
        ).map(([sev, color]) => {
          const active = visibleSeverities.has(sev)
          return (
            <button
              key={sev}
              onClick={() => onSeverityToggle(sev)}
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 4,
                cursor: 'pointer',
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
                  return isMultiDay
                    ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                    : d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
                }}
              />
              <YAxis stroke="#9aa3b2" tick={{ fontSize: 11 }} />
              <Tooltip
                content={(props) => (
                  <CustomTooltip
                    {...props}
                    visibleSeverities={visibleSeverities}
                    isMultiDay={isMultiDay}
                  />
                )}
              />
              <Legend wrapperStyle={{ paddingTop: 8, fontSize: 12 }} />
              {visibleSeverities.has('ERROR') && (
                <Area
                  type="monotone"
                  dataKey="ERROR"
                  stackId="a"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fill="#ef4444"
                  fillOpacity={0.7}
                />
              )}
              {visibleSeverities.has('WARNING') && (
                <Area
                  type="monotone"
                  dataKey="WARNING"
                  stackId="a"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="#f59e0b"
                  fillOpacity={0.7}
                />
              )}
              {visibleSeverities.has('INFO') && (
                <Area
                  type="monotone"
                  dataKey="INFO"
                  stackId="a"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="#3b82f6"
                  fillOpacity={0.7}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-placeholder">Sin datos para el gráfico</div>
        )}
      </div>
    </section>
  )
}
