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
  cpmd_solution_content?: string | null
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
      fill="rgba(255, 255, 255, 0.15)"
    />
  )
}

interface TopErrorsChartProps {
  topCodes: TopCode[]
  onViewSolution?: (code: string, sdsContent?: string | null, sdsUrl?: string | null, cpmdContent?: string | null) => void
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
              <CartesianGrid strokeDasharray="3 3" stroke="#232734" />
              <XAxis type="number" stroke="#9aa3b2" tick={{ fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#9aa3b2"
                width={100}
                axisLine={false}
                tickLine={false}
                tick={(props) => {
                  const { x, y, payload } = props
                  const entry = filteredCodes.find((c) => c.name === payload.value)
                  const canView = !!(entry?.sds_link || entry?.sds_solution_content || entry?.cpmd_solution_content)
                  return (
                    <g transform={`translate(${x},${y})`}>
                      <text
                        x={-10}
                        y={0}
                        dy={4}
                        textAnchor="end"
                        fill={canView ? '#3b82f6' : '#9aa3b2'}
                        fontSize={12}
                        fontWeight={canView ? 700 : 400}
                        style={{ cursor: canView ? 'pointer' : 'default' }}
                        className={canView ? 'chart-y-axis-link' : ''}
                        onClick={() => {
                          if (canView && onViewSolution && entry) {
                            onViewSolution(entry.name, entry.sds_solution_content, entry.sds_link, entry.cpmd_solution_content)
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
                  background: '#151821',
                  border: '1px solid #232734',
                  borderRadius: 8,
                }}
                labelStyle={{ color: '#e5e7eb', fontWeight: 700 }}
                itemStyle={{ color: '#e5e7eb' }}
                cursor={<CustomCursor />}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div style={{ 
                        background: '#151821', 
                        border: '1px solid #232734', 
                        padding: '10px', 
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}>
                        <div style={{ color: '#e5e7eb', fontWeight: 700, marginBottom: '4px' }}>{data.name}</div>
                        <div style={{ color: '#9aa3b2', fontSize: '12px' }}>Ocurrencias: <span style={{ color: '#fff' }}>{data.count}</span></div>
                        {(data.sds_link || data.sds_solution_content || data.cpmd_solution_content) && (
                          <div style={{ color: '#3b82f6', fontSize: '10px', marginTop: '8px', fontWeight: 700 }}>
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
                      ? '#ef4444'
                      : entry.severity?.toUpperCase() === 'WARNING'
                        ? '#f59e0b'
                        : '#3b82f6'
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


