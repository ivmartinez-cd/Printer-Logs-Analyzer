import React, { useState, useMemo } from 'react'
import type { Incident } from '../types/api'

type SortKey = 'occurrences' | 'severity' | 'start_time'
type SortDir = 'asc' | 'desc'

interface IncidentTableProps {
  incidents: Incident[]
  searchValue?: string
  onEditRule?: (code: string) => void
}

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'medium' })
  } catch {
    return iso
  }
}

function formatDuration(startIso: string, endIso: string): string {
  try {
    const start = new Date(startIso).getTime()
    const end = new Date(endIso).getTime()
    const totalMs = end - start
    const totalMin = Math.round(totalMs / 60_000)
    if (totalMin < 60) return `${totalMin} min`
    const h = Math.floor(totalMin / 60)
    const m = totalMin % 60
    return `${h}:${m.toString().padStart(2, '0')}`
  } catch {
    return '—'
  }
}

function highlightMatches(text: string, search: string): React.ReactNode {
  const q = search.trim()
  if (!q) return text
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`(${escaped})`, 'gi')
  const parts = text.split(re)
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="highlight">
        {part}
      </span>
    ) : (
      part
    )
  )
}

export function IncidentTable({ incidents, searchValue = '', onEditRule }: IncidentTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('severity')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const sorted = useMemo(() => {
    const list = [...incidents]
    list.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'occurrences') cmp = a.occurrences - b.occurrences
      else if (sortKey === 'severity') cmp = a.severity_weight - b.severity_weight
      else cmp = new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      if (cmp === 0) {
        cmp = new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return list
  }, [incidents, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  if (incidents.length === 0) return null

  return (
    <div className="incident-table-wrap">
      <table className="incident-table">
        <thead>
          <tr>
            <th></th>
            <th>Code</th>
            <th>Classification</th>
            <th className="sortable" onClick={() => toggleSort('occurrences')}>
              Occurrences {sortKey === 'occurrences' && (sortDir === 'asc' ? '↑' : '↓')}
            </th>
            <th className="sortable" onClick={() => toggleSort('severity')}>
              Severity {sortKey === 'severity' && (sortDir === 'asc' ? '↑' : '↓')}
            </th>
            <th className="sortable" onClick={() => toggleSort('start_time')}>
              Start time {sortKey === 'start_time' && (sortDir === 'asc' ? '↑' : '↓')}
            </th>
            <th>End time</th>
            <th>Ventana</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((inc) => {
            const isExpanded = expandedId === inc.id
            return (
              <React.Fragment key={inc.id}>
                <tr
                  className={isExpanded ? 'expanded' : ''}
                  onClick={() => setExpandedId(isExpanded ? null : inc.id)}
                >
                  <td className="expand-cell">{isExpanded ? '▼' : '▶'}</td>
                  <td>
                    {inc.sds_link ? (
                      <a href={inc.sds_link} target="_blank" rel="noopener noreferrer" className="incident-table__code-link" onClick={(e) => e.stopPropagation()}>
                        {highlightMatches(inc.code, searchValue)}
                        <span className="incident-table__code-icon" aria-hidden>🔗</span>
                      </a>
                    ) : (
                      highlightMatches(inc.code, searchValue)
                    )}
                  </td>
                  <td>{highlightMatches(inc.classification, searchValue)}</td>
                  <td>{inc.occurrences}</td>
                  <td>
                    <span className={`incident-table__badge incident-table__badge--${(inc.severity || 'info').toLowerCase()}`}>
                      {inc.severity}
                    </span>
                  </td>
                  <td>{formatDateTime(inc.start_time)}</td>
                  <td>{formatDateTime(inc.end_time)}</td>
                  <td>{formatDuration(inc.start_time, inc.end_time)}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    {onEditRule && (
                      <button
                        type="button"
                        className="incident-table__edit-btn"
                        onClick={() => onEditRule(inc.code)}
                        aria-label={`Editar regla ${inc.code}`}
                      >
                        Editar regla
                      </button>
                    )}
                  </td>
                </tr>
                {isExpanded && (
                  <tr key={`${inc.id}-detail`} className="detail-row">
                    <td colSpan={9}>
                      <div className="detail-content">
                        <p className="detail-content__meta"><strong>Contador:</strong> {inc.counter_range[0]} – {inc.counter_range[1]}</p>
                        <p className="detail-content__title">Eventos</p>
                        <div className="detail-content__events">
                          {inc.events.map((evt, i) => (
                            <div key={i} className="detail-content__event">
                              <span className="detail-content__event-time">{formatDateTime(evt.timestamp)}</span>
                              <span className="detail-content__event-counter">Contador: {evt.counter}</span>
                              <span className={`detail-content__event-severity detail-content__event-severity--${(evt.type || 'info').toLowerCase()}`}>
                                {evt.type}
                              </span>
                            </div>
                          ))}
                        </div>
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
  )
}
