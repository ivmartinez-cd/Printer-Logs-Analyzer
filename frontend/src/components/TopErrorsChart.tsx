import { useState } from 'react'
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface TopCode {
  name: string
  count: number
  severity?: string
}

interface TopErrorsChartProps {
  topCodes: TopCode[]
}

export function TopErrorsChart({ topCodes }: TopErrorsChartProps) {
  const [activeSeverities, setActiveSeverities] = useState<Set<string>>(new Set(['ERROR', 'WARNING', 'INFO']))

  function handleToggle(severity: string) {
    setActiveSeverities((prev) => {
      const next = new Set(prev)
      if (next.has(severity)) {
        next.delete(severity)
      } else {
        next.add(severity)
      }
      return next
    })
  }

  const filteredCodes = topCodes.filter((c) =>
    activeSeverities.has((c.severity ?? '').toUpperCase())
  )

  return (
    <section className="section dashboard__chart-right">
      <h2 className="section__title">Errores más frecuentes</h2>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {(
          [
            ['ERROR', '#ef4444'],
            ['WARNING', '#f59e0b'],
            ['INFO', '#3b82f6'],
          ] as const
        ).map(([sev, color]) => {
          const active = activeSeverities.has(sev)
          return (
            <button
              key={sev}
              onClick={() => handleToggle(sev)}
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
        {activeSeverities.size === 0 ? (
          <div className="chart-placeholder">Ningún filtro activo</div>
        ) : filteredCodes.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filteredCodes}
              layout="vertical"
              margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#232734" />
              <XAxis type="number" stroke="#9aa3b2" tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#9aa3b2"
                tick={{ fontSize: 11 }}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  background: '#151821',
                  border: '1px solid #232734',
                  borderRadius: 6,
                }}
                labelStyle={{ color: '#e5e7eb' }}
                itemStyle={{ color: '#e5e7eb' }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {filteredCodes.map((entry, index) => {
                  const color =
                    entry.severity?.toUpperCase() === 'ERROR'
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
  )
}
