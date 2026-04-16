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
      if (next.has(severity)) next.delete(severity)
      else next.add(severity)
      return next
    })
  }

  const filteredCodes = topCodes.filter((c) =>
    activeSeverities.has((c.severity ?? '').toUpperCase())
  )

  return (
    <div className="flex flex-col h-full animate-fade-in-up">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-hp-blue-vibrant mb-1">Impacto Acumulado</span>
          <h3 className="font-display font-bold text-lg text-white m-0">Top Errores</h3>
        </div>
        <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
          {(
            [
              ['ERROR', '#fb7185'],
              ['WARNING', '#fbbf24'],
              ['INFO', '#38bdf8'],
            ] as const
          ).map(([sev, color]) => {
            const active = activeSeverities.has(sev)
            return (
              <button
                key={sev}
                onClick={() => handleToggle(sev)}
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
        <div className="absolute inset-0">
          {activeSeverities.size === 0 ? (
            <div className="flex items-center justify-center h-full opacity-30 italic text-sm text-slate-400">
              Seleccione severidad para visualizar
            </div>
          ) : filteredCodes.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredCodes}
                layout="vertical"
                margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
                barSize={16}
                barGap={8}
              >
                <defs>
                   <linearGradient id="barError" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#fb7185" stopOpacity={0.1}/>
                      <stop offset="100%" stopColor="#fb7185" stopOpacity={0.8}/>
                   </linearGradient>
                   <linearGradient id="barWarning" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.1}/>
                      <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.8}/>
                   </linearGradient>
                   <linearGradient id="barInfo" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.1}/>
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.8}/>
                   </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.03} horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#64748b"
                  tick={{ fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}
                  width={80}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const color = data.severity?.toUpperCase() === 'ERROR' ? '#fb7185' : data.severity?.toUpperCase() === 'WARNING' ? '#fbbf24' : '#38bdf8';
                      return (
                        <div className="bg-hp-dark/90 backdrop-blur-md border border-white/10 p-3 rounded-2xl shadow-premium-glow animate-scale-in">
                          <div className="flex flex-col gap-1">
                             <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                                <span className="text-[10px] font-bold text-white font-mono uppercase tracking-widest">{data.name}</span>
                             </div>
                             <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500 font-medium">Ocurrencias:</span>
                                <span className="text-white font-bold ml-4">{data.count}</span>
                             </div>
                          </div>
                        </div>
                      )
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[0, 10, 10, 0]} animationDuration={1000}>
                  {filteredCodes.map((entry, index) => {
                    const sev = (entry.severity ?? '').toUpperCase();
                    const fill = sev === 'ERROR' ? 'url(#barError)' : sev === 'WARNING' ? 'url(#barWarning)' : 'url(#barInfo)';
                    const stroke = sev === 'ERROR' ? '#fb7185' : sev === 'WARNING' ? '#fbbf24' : '#38bdf8';
                    return <Cell key={`cell-${index}`} fill={fill} stroke={stroke} strokeWidth={1} strokeOpacity={0.3} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full opacity-30 italic text-sm text-slate-400">
              Sin incidencias registradas
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
  )
}
