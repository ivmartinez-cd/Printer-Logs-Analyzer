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
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
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
    <div className="flex flex-col gap-2 animate-fade-in-up">
      <button 
        type="button" 
        className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${
          expanded 
          ? 'bg-hp-blue-vibrant/10 border-hp-blue-vibrant/30 shadow-premium-sm' 
          : 'bg-white/5 border-white/10 hover:bg-white/10'
        }`}
        onClick={handleToggle}
      >
        <div className="flex flex-col items-start">
           <span className="text-[10px] font-bold uppercase tracking-widest text-hp-blue-vibrant mb-0.5">Evolución Histórica</span>
           <span className="text-sm font-bold text-white font-display tracking-tight">{equipmentId}</span>
        </div>
        <div className="flex items-center gap-6">
           <div className="hidden sm:flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>{snapshots.length} registros</span>
              <span className="opacity-30">|</span>
              <span>{formatShortDate(first)} → {formatShortDate(last)}</span>
           </div>
           <span className={`text-hp-blue-vibrant transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>▼</span>
        </div>
      </button>

      {expanded && (
        <div className="glass-card p-6 border border-white/10 animate-fade-in-up">
          {loading && (
             <div className="h-[220px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                   <div className="w-8 h-8 border-2 border-hp-blue-vibrant/20 border-t-hp-blue-vibrant rounded-full animate-spin" />
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest animate-pulse">Sincronizando Tendencias...</p>
                </div>
             </div>
          )}
          
          {fetchError && (
             <div className="h-[220px] flex items-center justify-center p-6 bg-accent-rose/5 border border-accent-rose/20 rounded-2xl">
                <p className="text-xs font-bold text-accent-rose text-center">{fetchError}</p>
             </div>
          )}

          {data && (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorWarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} 
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                   allowDecimals={false} 
                   tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} 
                   axisLine={false}
                   tickLine={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    const point = data.find((p) => p.date === label)
                    return (
                      <div className="glass-card shadow-premium-glow border border-white/10 p-4 min-w-[180px]">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-hp-blue-vibrant mb-2">{label}</p>
                        {point && <p className="text-xs font-bold text-white mb-3 truncate max-w-[160px]">{point.name}</p>}
                        <div className="space-y-2">
                           {payload.map((p) => (
                             <div key={String(p.dataKey)} className="flex items-center justify-between gap-4">
                               <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color as string }} />
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">{p.name}</span>
                               </div>
                               <span className="text-xs font-bold text-white">{p.value}</span>
                             </div>
                           ))}
                        </div>
                      </div>
                    )
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  iconType="circle"
                  wrapperStyle={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '0px', paddingBottom: '20px' }} 
                />
                <Line
                  type="monotone"
                  dataKey="errors"
                  name="Errores"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: '#0f172a' }}
                  activeDot={{ r: 6, strokeWidth: 0, shadow: '0 0 10px rgba(239,68,68,0.5)' }}
                />
                <Line
                  type="monotone"
                  dataKey="warnings"
                  name="Alertas"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: '#0f172a' }}
                  activeDot={{ r: 6, strokeWidth: 0, shadow: '0 0 10px rgba(245,158,11,0.5)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  )
}
