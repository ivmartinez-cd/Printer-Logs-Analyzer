import { useState } from 'react'
import type { EnrichedEvent as ApiEvent } from '../types/api'
import { formatDateTime } from '../hooks/useDateFilter'
import styles from './EventsTable.module.css'

interface EventsTableProps {
  events: ApiEvent[]
  onViewSolution: (code: string, sdsContent?: string | null, sdsUrl?: string | null) => void
}

export function EventsTable({ events, onViewSolution }: EventsTableProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [severityFilter, setSeverityFilter] = useState('')
  const [searchFilter, setSearchFilter] = useState('')
  const [sort, setSort] = useState<{ column: string; dir: 'asc' | 'desc' }>({
    column: 'timestamp',
    dir: 'desc',
  })

  function handleSortChange(column: string) {
    setSort((s) => ({
      column,
      dir: s.column === column && s.dir === 'asc' ? 'desc' : 'asc',
    }))
  }

  const filtered = events.filter((evt) => {
    if (severityFilter && (evt.type?.toUpperCase() ?? 'INFO') !== severityFilter) return false
    const q = searchFilter.trim().toLowerCase()
    if (q) {
      const code = (evt.code ?? '').toLowerCase()
      const msg = (evt.code_description ?? evt.help_reference ?? '').toLowerCase()
      if (!code.includes(q) && !msg.includes(q)) return false
    }
    return true
  })

  const { column, dir } = sort
  const mult = dir === 'asc' ? 1 : -1
  const tableRows = [...filtered].sort((a, b) => {
    let cmp: number
    switch (column) {
      case 'timestamp':
        cmp = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        break
      case 'code':
        cmp = (a.code ?? '').localeCompare(b.code ?? '')
        break
      case 'severity':
        cmp = (a.type ?? '').localeCompare(b.type ?? '')
        break
      case 'message':
        cmp = (a.code_description ?? a.help_reference ?? '').localeCompare(
          b.code_description ?? b.help_reference ?? ''
        )
        break
      default:
        cmp = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        break
    }
    return cmp * mult
  })

  return (
    <div className="glass-card rounded-3xl overflow-hidden shadow-premium-md animate-fade-in-up">
      <button
        type="button"
        className="w-full flex items-center justify-between p-5 bg-white/5 hover:bg-white/[0.08] transition-all group"
        onClick={() => setIsCollapsed((c) => !c)}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl group-hover:scale-110 transition-transform duration-300">📋</span>
          <span className="font-display font-bold text-lg text-white">Eventos del período</span>
        </div>
        <span className={`text-slate-500 group-hover:text-white transition-all transform duration-300 ${!isCollapsed ? 'rotate-90' : ''}`}>
           ▶
        </span>
      </button>

      {!isCollapsed && (
        <div className="flex flex-col bg-hp-dark/20">
          <div className="flex flex-col md:flex-row items-center justify-between p-4 gap-4 border-b border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Severidad:</span>
                <select
                  className="bg-hp-dark/40 border border-white/10 rounded-lg text-xs py-1.5 px-3 text-slate-300 focus:border-hp-blue-vibrant transition-all"
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                >
                  <option value="">Todas</option>
                  <option value="ERROR">Error</option>
                  <option value="WARNING">Advertencia</option>
                  <option value="INFO">Información</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Buscar:</span>
                 <input
                  type="search"
                  className="bg-hp-dark/40 border border-white/10 rounded-lg text-xs py-1.5 px-3 text-slate-300 w-48 focus:border-hp-blue-vibrant transition-all"
                  placeholder="Código o mensaje..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                />
              </div>
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {tableRows.length} resultados
            </span>
          </div>

          <div className="overflow-x-auto max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
            <table className="w-full border-collapse border-spacing-0">
              <thead className="sticky top-0 z-10 bg-hp-dark/80 backdrop-blur-md shadow-sm">
                <tr>
                  {[
                    { key: 'timestamp', label: 'Fecha/hora' },
                    { key: 'code', label: 'Código' },
                    { key: 'severity', label: 'Severidad' },
                    { key: 'message', label: 'Mensaje de Sistema' },
                  ].map(({ key, label }) => (
                    <th key={key} className="p-4 text-left">
                      <button
                        type="button"
                        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                        onClick={() => handleSortChange(key)}
                      >
                        {label}
                        <span className="opacity-50">
                          {sort.column === key ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      </button>
                    </th>
                  ))}
                  <th className="p-4 text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">Solución</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tableRows.map((evt) => {
                  const sev = (evt.type || 'info').toUpperCase()
                  return (
                    <tr key={`${evt.code}-${evt.timestamp}`} className="hover:bg-white/[0.03] transition-colors group">
                      <td className="p-4 text-[11px] text-slate-500 font-mono whitespace-nowrap">
                        {formatDateTime(evt.timestamp)}
                      </td>
                      <td className="p-4">
                        <span className="font-display font-bold text-slate-200 group-hover:text-hp-blue-vibrant transition-colors">
                          {evt.code}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          sev === 'ERROR' ? 'bg-accent-rose/10 text-accent-rose border border-accent-rose/20' : 
                          sev === 'WARNING' ? 'bg-accent-amber/10 text-accent-amber border border-accent-amber/20' : 
                          'bg-hp-blue/10 text-hp-blue-vibrant border border-hp-blue/20'
                        }`}>
                          {evt.type}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-slate-400 group-hover:text-slate-300 transition-colors max-w-md">
                        {evt.code_description?.trim() || evt.code || '—'}
                      </td>
                      <td className="p-4 text-right">
                        {evt.code_solution_content?.trim() || evt.code_solution_url?.trim() ? (
                          <button
                            type="button"
                            className="text-[10px] font-bold text-hp-blue-vibrant hover:underline uppercase tracking-wide"
                            onClick={() =>
                              onViewSolution(evt.code, evt.code_solution_content, evt.code_solution_url)
                            }
                          >
                            Ver Solución
                          </button>
                        ) : (
                          <span className="text-slate-700 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
  )
}
