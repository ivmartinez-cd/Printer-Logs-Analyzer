import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { formatWeekRange, type DateFilter } from '../hooks/useDateFilter'

interface VolumeDataPoint {
  time: string
  ERROR?: number
  WARNING?: number
  INFO?: number
}

interface IncidentsChartProps {
  volumeData: VolumeDataPoint[]
  activeFilter: DateFilter
  visibleSeverities: Set<string>
  onSeverityToggle: (severity: string) => void
}

export function IncidentsChart({ volumeData, activeFilter, visibleSeverities, onSeverityToggle }: IncidentsChartProps) {
  const title = activeFilter === null
    ? 'Volumen de incidencias (registro completo)'
    : typeof activeFilter === 'string'
      ? `Volumen de incidencias (${new Date(activeFilter + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })})`
      : `Volumen de incidencias (${formatWeekRange(activeFilter)})`

  return (
    <section className="section dashboard__chart-left">
      <h2 className="section__title">{title}</h2>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {([['ERROR', '#ef4444'], ['WARNING', '#f59e0b'], ['INFO', '#3b82f6']] as const).map(([sev, color]) => {
          const active = visibleSeverities.has(sev)
          return (
            <button
              key={sev}
              onClick={() => onSeverityToggle(sev)}
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
  )
}
