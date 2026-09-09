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
  severity: string
  sds_link?: string | null
  sds_solution_content?: string | null
}

interface CustomCursorProps {
  x?: number
  y?: number
  width?: number
  height?: number
}

const CustomCursor = (props: CustomCursorProps) => {
  const { x = 0, y = 0, width = 0, height = 0 } = props
  // Dibujamos una línea muy fina en lugar de un bloque
  return (
    <rect
      x={x}
      y={y + height / 2 - 1}
      width={width}
      height={2}
      fill="var(--veil-5)"
    />
  )
}

interface TopErrorsChartProps {
  topCodes: TopCode[]
  onViewSolution?: (code: string, sdsContent?: string | null, sdsUrl?: string | null) => void
  onBarClick?: (code: string) => void
  activeSeverities: Set<string>
}

export function TopErrorsChart({
  topCodes,
  onViewSolution,
  onBarClick,
  activeSeverities,
}: TopErrorsChartProps) {

  const filteredCodes = topCodes.filter((c) =>
    activeSeverities.has((c.severity ?? '').toUpperCase())
  )

  return (
    <section className="section chart-section">
      <div className="section__header-row">
        <h2 className="section__title">Errores más frecuentes</h2>
      </div>
      <div className="chart-wrap">
        {activeSeverities.size === 0 ? (
          <div className="chart-placeholder">Ningún filtro activo</div>
        ) : filteredCodes.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filteredCodes}
              layout="vertical"
              margin={{ top: 8, right: 32, left: 10, bottom: 8 }}
              barSize={32}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis type="number" stroke="var(--text-secondary)" tick={{ fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="name"
                stroke="var(--text-secondary)"
                width={100}
                axisLine={false}
                tickLine={false}
                tick={(props) => {
                  const { x, y, payload } = props
                  const entry = filteredCodes.find((c) => c.name === payload.value)
                  const canView = !!(entry?.sds_link || entry?.sds_solution_content)
                  return (
                    <g transform={`translate(${x},${y})`}>
                      <text
                        x={-10}
                        y={0}
                        dy={4}
                        textAnchor="end"
                        fill={canView ? 'var(--cd-celeste)' : 'var(--text-secondary)'}
                        fontSize={12}
                        fontWeight={canView ? 700 : 400}
                        style={{ cursor: canView ? 'pointer' : 'default' }}
                        className={canView ? 'chart-y-axis-link' : ''}
                        onClick={() => {
                          if (canView && onViewSolution && entry) {
                            onViewSolution(entry.name, entry.sds_solution_content, entry.sds_link)
                          }
                        }}
                      >
                        {payload.value}
                        {canView && ' ↗'}
                      </text>
                    </g>
                  )
                }}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 8,
                }}
                labelStyle={{ color: 'var(--text-main)', fontWeight: 700 }}
                itemStyle={{ color: 'var(--text-main)' }}
                cursor={<CustomCursor />}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-color)',
                        padding: '10px',
                        borderRadius: '8px',
                        boxShadow: 'var(--shadow-sm)'
                      }}>
                        <div style={{ color: 'var(--text-main)', fontWeight: 700, marginBottom: '4px' }}>{data.name}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Ocurrencias: <span style={{ color: 'var(--text-main)' }}>{data.count}</span></div>
                        {(data.sds_link || data.sds_solution_content) && (
                          <div style={{ color: 'var(--cd-celeste)', fontSize: '10px', marginTop: '8px', fontWeight: 700 }}>
                            Haga clic en el código para ver solución
                          </div>
                        )}
                      </div>
                    )
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={32} style={{ cursor: onBarClick ? 'pointer' : 'default' }} onClick={(data: TopCode) => onBarClick?.(data.name)}>
                {filteredCodes.map((entry, index) => {
                  const color =
                    entry.severity?.toUpperCase() === 'ERROR'
                      ? 'var(--color-error)'
                      : entry.severity?.toUpperCase() === 'WARNING'
                        ? 'var(--color-warning)'
                        : 'var(--color-info)'
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


