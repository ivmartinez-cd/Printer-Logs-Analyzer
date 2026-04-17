import React, { useState } from 'react'
import type { EnrichedEvent as ApiEvent } from '../types/api'
import { formatDateTime } from '../hooks/useDateFilter'

export type IncidentRow = {
  id: string
  code: string
  classification: string
  severity: string
  severity_weight: number
  occurrences: number
  start_time: string
  end_time: string
  sds_link: string | null
  sds_solution_content: string | null
  eventsInWindow: ApiEvent[]
}

interface IncidentsTableProps {
  incidentRows: IncidentRow[]
  hasCpmdModel?: boolean
  onEditCode: (code: string, classification: string, severity: string, sdsLink: string) => void
  onViewSolution: (code: string, sdsContent?: string | null, sdsUrl?: string | null) => void
}

export function IncidentsTable({
  incidentRows,
  hasCpmdModel,
  onEditCode,
  onViewSolution,
}: IncidentsTableProps) {
  const [expandedIncidentIds, setExpandedIncidentIds] = useState<Set<string>>(new Set())
  const [expandedMsgs, setExpandedMsgs] = useState<Set<string>>(new Set())
  const [severityFilter, setSeverityFilter] = useState('')
  const [searchFilter, setSearchFilter] = useState('')
  const [sort, setSort] = useState<{ column: string; dir: 'asc' | 'desc' }>({
    column: 'end_time',
    dir: 'desc',
  })

  function toggleIncident(id: string) {
    setExpandedIncidentIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSortChange(column: string) {
    setSort((s) => ({
      column,
      dir: s.column === column && s.dir === 'asc' ? 'desc' : 'asc',
    }))
  }

  const filtered = incidentRows.filter((inc) => {
    if (severityFilter && inc.severity.toUpperCase() !== severityFilter) return false
    const q = searchFilter.trim().toLowerCase()
    if (q) {
      const code = (inc.code ?? '').toLowerCase()
      const classification = (inc.classification ?? '').toLowerCase()
      if (!code.includes(q) && !classification.includes(q)) return false
    }
    return true
  })

  const { column, dir } = sort
  const mult = dir === 'asc' ? 1 : -1
  const sortedRows = [...filtered].sort((a, b) => {
    let cmp: number
    switch (column) {
      case 'code':
        cmp = (a.code ?? '').localeCompare(b.code ?? '')
        break
      case 'classification':
        cmp = (a.classification ?? '').localeCompare(b.classification ?? '')
        break
      case 'severity':
        cmp = (a.severity ?? '').localeCompare(b.severity ?? '')
        break
      case 'occurrences':
        cmp = a.occurrences - b.occurrences
        break
      case 'start_time':
        cmp = new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        break
      case 'end_time':
      default:
        cmp = new Date(a.end_time).getTime() - new Date(b.end_time).getTime()
        break
    }
    return cmp * mult
  })

  return (
    <div className="flex flex-col animate-fade-in-up">
      <div className="flex flex-col md:flex-row items-center justify-between p-5 gap-4 bg-white/5 border-b border-white/5">
        <h3 className="font-display font-bold text-lg text-white m-0">Registro de Incidencias</h3>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Severidad:</span>
            <select
              aria-label="Filtrar por severidad"
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
              aria-label="Buscar en código o clasificación"
              className="bg-hp-dark/40 border border-white/10 rounded-lg text-xs py-1.5 px-3 text-slate-300 w-48 focus:border-hp-blue-vibrant transition-all"
              placeholder="Código o descripción..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border-spacing-0">
          <thead>
            <tr className="bg-white/[0.02]">
              <th className="w-10" />
              {[
                { key: 'code', label: 'Código' },
                { key: 'classification', label: 'Clasificación' },
                { key: 'severity', label: 'Severidad' },
                { key: 'occurrences', label: 'Ocurrencias' },
                { key: 'start_time', label: 'Primera vez' },
                { key: 'end_time', label: 'Última vez' },
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
              <th className="p-4 text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sortedRows.map((inc) => {
              const isExpanded = expandedIncidentIds.has(inc.id)
              const sev = (inc.severity || 'info').toUpperCase()
              return (
                <React.Fragment key={inc.id}>
                  <tr className="group hover:bg-white/[0.03] transition-colors relative">
                    <td className="p-4">
                      <button
                        type="button"
                        aria-label={isExpanded ? 'Contraer detalle' : 'Expandir detalle'}
                        className={`w-6 h-6 flex items-center justify-center rounded-lg transition-all ${isExpanded ? 'bg-hp-blue-vibrant text-white shadow-premium-glow rotate-90' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
                        onClick={() => toggleIncident(inc.id)}
                      >
                         ▶
                      </button>
                    </td>
                    <td className="p-4">
                      <button
                        type="button"
                        className="font-display font-bold text-slate-200 hover:text-hp-blue-vibrant transition-colors flex items-center gap-2"
                        onClick={() => onViewSolution(inc.code, inc.sds_solution_content, inc.sds_link)}
                      >
                        {inc.code}
                        {hasCpmdModel && <span className="text-xs" title="Solución CPMD" aria-label="Solución CPMD disponible">📘</span>}
                      </button>
                    </td>
                    <td className="p-4 text-xs text-slate-400 font-medium max-w-[200px] truncate" title={inc.classification}>
                      {inc.classification || inc.code}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        sev === 'ERROR' ? 'bg-accent-rose/10 text-accent-rose border border-accent-rose/20' : 
                        sev === 'WARNING' ? 'bg-accent-amber/10 text-accent-amber border border-accent-amber/20' : 
                        'bg-hp-blue/10 text-hp-blue-vibrant border border-hp-blue/20'
                      }`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-mono text-slate-300 font-bold">{inc.occurrences}</td>
                    <td className="p-4 text-[11px] text-slate-500 font-medium">{formatDateTime(inc.start_time)}</td>
                    <td className="p-4 text-[11px] text-white/70 font-bold">{formatDateTime(inc.end_time)}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {inc.sds_solution_content || inc.sds_link ? (
                          <button
                            type="button"
                            className="text-[10px] font-bold text-hp-blue-vibrant hover:underline uppercase tracking-wide"
                            onClick={() => onViewSolution(inc.code, inc.sds_solution_content, inc.sds_link)}
                          >
                            Ver solución
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="p-1.5 rounded-lg bg-white/5 text-slate-500 hover:text-white hover:bg-white/10 transition-all"
                          onClick={() => onEditCode(inc.code, inc.classification || '', inc.severity || 'INFO', inc.sds_link || '')}
                          title="Editar código"
                          aria-label="Editar código"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5M18.364 4.636a2 2 0 0 1 2.828 2.828l-10.121 10.121-4 1 1-4 10.121-10.121z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {isExpanded && inc.eventsInWindow.length > 0 && (
                    <tr>
                      <td colSpan={8} className="p-0 bg-hp-dark/40 border-l border-r border-hp-blue-vibrant/20">
                        <div className="p-4 space-y-2 animate-scale-in">
                          <header className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600 border-b border-white/5 pb-2 mb-2">
                            <span className="w-24">Fecha y Hora</span>
                            <span className="w-16">Contador</span>
                            <span className="w-12">Δ</span>
                            <span className="w-32">Firmware</span>
                            <span>Mensaje de Sistema</span>
                          </header>
                          {inc.eventsInWindow.map((evt, idx) => {
                            const prevCounter = idx > 0 ? inc.eventsInWindow[idx - 1].counter : null
                            const delta = prevCounter !== null ? evt.counter - prevCounter : null
                            const msg = evt.help_reference ?? evt.code_description ?? '—'
                            const msgKey = `${inc.id}-${idx}-msg`
                            return (
                              <div key={`${inc.id}-${idx}`} className="flex items-start gap-4 text-[11px] group/item py-1 hover:bg-white/5 transition-colors rounded">
                                <span className="w-24 text-slate-500 font-mono">{formatDateTime(evt.timestamp)}</span>
                                <span className="w-16 text-slate-300 font-bold">{evt.counter}</span>
                                <span className={`w-12 font-bold ${delta !== null && delta > 0 ? 'text-accent-amber' : 'text-slate-600'}`}>
                                  {delta !== null ? (delta >= 0 ? `+${delta}` : delta) : '—'}
                                </span>
                                <span className="w-32 text-slate-500 truncate">{evt.firmware ?? '—'}</span>
                                <div className="flex-1 text-slate-400 group-hover/item:text-slate-200 transition-colors">
                                  {msg.length > 100 ? (
                                    expandedMsgs.has(msgKey) ? (
                                      <span>
                                        {msg}{' '}
                                        <button
                                          type="button"
                                          className="text-hp-blue-vibrant font-bold hover:underline"
                                          onClick={() => setExpandedMsgs((s) => { const n = new Set(s); n.delete(msgKey); return n })}
                                        >
                                          ver menos
                                        </button>
                                      </span>
                                    ) : (
                                      <span>
                                        {msg.slice(0, 100)}…{' '}
                                        <button
                                          type="button"
                                          className="text-hp-blue-vibrant font-bold hover:underline"
                                          onClick={() => setExpandedMsgs((s) => new Set(s).add(msgKey))}
                                        >
                                          ver más
                                        </button>
                                      </span>
                                    )
                                  ) : msg}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
