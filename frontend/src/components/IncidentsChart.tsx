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
  ERROR: '#fb7185', // rose-400
  WARNING: '#fbbf24', // amber-400
  INFO: '#38bdf8', // sky-400
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

  const date = new Date(label as string)
  const timeLabel = isMultiDay
    ? date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })
    : date.toLocaleString('es-ES', {
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
    <div className="bg-hp-dark/90 backdrop-blur-md border border-white/10 p-3 rounded-2xl shadow-premium-glow min-w-[200px] animate-scale-in">
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-white/5 pb-2">
        {timeLabel}
      </div>
      <div className="space-y-3">
        {severities.map((sev) => {
          const codes = dataPoint.codes[sev]
          const displayed = codes.slice(0, 5)
          const overflow = codes.length - displayed.length
          return (
            <div key={sev} className="group">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SEV_COLORS[sev] }} />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">{sev}</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-300">{dataPoint[sev]}</span>
              </div>
              {codes.length > 0 && (
                <div className="pl-4 space-y-1">
                  <div className="flex flex-wrap gap-1">
                    {displayed.map(c => (
                      <span key={c} className="text-[9px] font-mono bg-white/5 px-1.5 py-0.5 rounded text-slate-400 group-hover:text-white transition-colors">
                        {c}
                      </span>
                    ))}
                    {overflow > 0 && (
                      <span className="text-[9px] text-slate-600 font-bold">+{overflow}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
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

  const titlePrefix = activeFilter === null
    ? 'Registro Completo'
    : typeof activeFilter === 'string'
      ? new Date(activeFilter + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
      : formatWeekRange(activeFilter)

  return (
    <div className="flex flex-col h-full animate-fade-in-up">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-hp-blue-vibrant mb-1">Análisis Progresivo</span>
          <h3 className="font-display font-bold text-lg text-white m-0">Volumen de Incidencias <span className="text-slate-500 font-medium">({titlePrefix})</span></h3>
        </div>
        <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
          {(
            [
              ['ERROR', '#fb7185'],
              ['WARNING', '#fbbf24'],
              ['INFO', '#38bdf8'],
            ] as const
          ).map(([sev, color]) => {
            const active = visibleSeverities.has(sev)
            return (
              <button
                key={sev}
                onClick={() => onSeverityToggle(sev)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                  active ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                 <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: active ? color : '#475569' }} />
                    {sev}
                 </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 min-h-[300px] w-full relative">
        {volumeData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={volumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorError" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fb7185" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#fb7185" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorWarning" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorInfo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.03} vertical={false} />
              <XAxis
                dataKey="time"
                stroke="#64748b"
                tick={{ fontSize: 10, fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                interval={Math.max(0, Math.ceil(volumeData.length / 8) - 1)}
                tickFormatter={(v) => {
                  const d = new Date(v)
                  return isMultiDay
                    ? d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
                    : d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                }}
              />
              <YAxis 
                stroke="#64748b" 
                tick={{ fontSize: 10, fontWeight: 500 }} 
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={(props) => (
                  <CustomTooltip
                    {...props}
                    visibleSeverities={visibleSeverities}
                    isMultiDay={isMultiDay}
                  />
                )}
                cursor={{ stroke: '#ffffff', strokeOpacity: 0.1, strokeWidth: 1 }}
              />
              {visibleSeverities.has('ERROR') && (
                <Area
                  type="monotone"
                  dataKey="ERROR"
                  stackId="1"
                  stroke="#fb7185"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorError)"
                  animationDuration={1500}
                />
              )}
              {visibleSeverities.has('WARNING') && (
                <Area
                  type="monotone"
                  dataKey="WARNING"
                  stackId="1"
                  stroke="#fbbf24"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorWarning)"
                  animationDuration={1500}
                />
              )}
              {visibleSeverities.has('INFO') && (
                <Area
                  type="monotone"
                  dataKey="INFO"
                  stackId="1"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorInfo)"
                  animationDuration={1500}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-30 italic text-sm text-slate-400">
             Consultando registros históricos…
          </div>
        )}
      </div>
    </div>
  )
}
  )
}
