import {
  BarChart, Bar, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
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
  return (
    <section className="section dashboard__chart-right">
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
  )
}
