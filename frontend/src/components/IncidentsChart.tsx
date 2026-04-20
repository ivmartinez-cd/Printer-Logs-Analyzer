import { useMemo, useState } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { EnrichedEvent as ApiEvent } from '../types/api'
import { formatWeekRange, getWindowForDate, type DateFilter } from '../hooks/useDateFilter'

type ChartView = 'area' | 'bar' | 'line'

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

// ─── View toggle button ────────────────────────────────────────────────────────
const VIEW_OPTIONS: { key: ChartView; label: string; icon: string; title: string }[] = [
  { key: 'area',  label: 'Área',   icon: '▲', title: 'Vista de área apilada' },
  { key: 'bar',   label: 'Barras', icon: '▐', title: 'Vista de barras agrupadas' },
  { key: 'line',  label: 'Líneas', icon: '〜', title: 'Vista de líneas' },
]

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
  const [chartView, setChartView] = useState<ChartView>('area')

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

  const axisProps = {
    xAxis: (
      <XAxis
        dataKey="time"
        stroke="#9aa3b2"
        tick={{ fontSize: 12 }}
        interval={Math.max(0, Math.ceil(volumeData.length / 10) - 1)}
        tickFormatter={(v: string) => {
          const d = new Date(v)
          return isMultiDay
            ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
            : d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
        }}
      />
    ),
    yAxis: <YAxis stroke="#9aa3b2" tick={{ fontSize: 12 }} />,
    grid: <CartesianGrid strokeDasharray="3 3" stroke="#232734" />,
    tooltip: (
      <Tooltip
        content={(props) => (
          <CustomTooltip
            {...props}
            visibleSeverities={visibleSeverities}
            isMultiDay={isMultiDay}
          />
        )}
      />
    ),
    legend: <Legend wrapperStyle={{ paddingTop: 8, fontSize: 12 }} />,
  }

  const severities = (['ERROR', 'WARNING', 'INFO'] as const).filter((s) =>
    visibleSeverities.has(s)
  )

  function renderChart() {
    const margin = { top: 8, right: 8, left: 0, bottom: 8 }

    if (chartView === 'bar') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={volumeData} margin={margin} barCategoryGap="20%">
            {axisProps.grid}
            {axisProps.xAxis}
            {axisProps.yAxis}
            {axisProps.tooltip}
            {axisProps.legend}
            {severities.map((sev) => (
              <Bar
                key={sev}
                dataKey={sev}
                stackId="a"
                fill={SEV_COLORS[sev]}
                fillOpacity={0.85}
                radius={sev === severities[severities.length - 1] ? [3, 3, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )
    }

    if (chartView === 'line') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={volumeData} margin={margin}>
            {axisProps.grid}
            {axisProps.xAxis}
            {axisProps.yAxis}
            {axisProps.tooltip}
            {axisProps.legend}
            {severities.map((sev) => (
              <Line
                key={sev}
                type="monotone"
                dataKey={sev}
                stroke={SEV_COLORS[sev]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )
    }

    // default: area
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={volumeData} margin={margin}>
          {axisProps.grid}
          {axisProps.xAxis}
          {axisProps.yAxis}
          {axisProps.tooltip}
          {axisProps.legend}
          {severities.map((sev) => (
            <Area
              key={sev}
              type="monotone"
              dataKey={sev}
              stackId="a"
              stroke={SEV_COLORS[sev]}
              strokeWidth={2}
              fill={SEV_COLORS[sev]}
              fillOpacity={0.65}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  return (
    <section className="section dashboard__chart-left chart-section">
      <div className="section__header-row">
        <h2 className="section__title">{title}</h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* View type toggle */}
          <div className="chart-view-toggle">
            {VIEW_OPTIONS.map(({ key, label, title: tip }) => (
              <button
                key={key}
                className={`chart-view-toggle__btn${chartView === key ? ' chart-view-toggle__btn--active' : ''}`}
                onClick={() => setChartView(key)}
                title={tip}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Severity filters */}
          <div className="chart-filters">
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
                  className="chart-filters__btn"
                  style={{
                    border: `1px solid ${color}`,
                    background: active ? color : 'transparent',
                    color: active ? '#fff' : color,
                    opacity: active ? 1 : 0.6,
                  }}
                >
                  {sev}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="chart-wrap">
        {volumeData.length > 0 ? (
          renderChart()
        ) : (
          <div className="chart-placeholder">No hay datos que coincidan con los filtros seleccionados</div>
        )}
      </div>
    </section>
  )
}
