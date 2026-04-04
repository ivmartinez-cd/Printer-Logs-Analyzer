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
  severityFilter: string
  onSeverityFilterChange: (value: string) => void
  searchFilter: string
  onSearchFilterChange: (value: string) => void
  sort: { column: string; dir: 'asc' | 'desc' }
  onSortChange: (column: string) => void
  onEditCode: (code: string, classification: string, severity: string, sdsLink: string) => void
  onViewSolution: (content: string, url?: string | null) => void
}

export function IncidentsTable({
  incidentRows,
  severityFilter,
  onSeverityFilterChange,
  searchFilter,
  onSearchFilterChange,
  sort,
  onSortChange,
  onEditCode,
  onViewSolution,
}: IncidentsTableProps) {
  const [expandedIncidentIds, setExpandedIncidentIds] = useState<Set<string>>(new Set())
  const [expandedMsgs, setExpandedMsgs] = useState<Set<string>>(new Set())

  function toggleIncident(id: string) {
    setExpandedIncidentIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <section className="section dashboard__table-section">
      <h2 className="section__title">Incidencias</h2>
      <div className="table-toolbar">
        <label className="table-toolbar__label" htmlFor="incidents-severity-filter">
          Severidad:
        </label>
        <select
          id="incidents-severity-filter"
          className="table-toolbar__select"
          value={severityFilter}
          onChange={(e) => onSeverityFilterChange(e.target.value)}
          aria-label="Filtrar por severidad"
        >
          <option value="">Todo</option>
          <option value="ERROR">Error</option>
          <option value="WARNING">Advertencia</option>
          <option value="INFO">Info</option>
        </select>
        <label className="table-toolbar__label" htmlFor="incidents-search-filter">
          Buscar:
        </label>
        <input
          id="incidents-search-filter"
          type="search"
          className="table-toolbar__search"
          placeholder="Código o clasificación..."
          value={searchFilter}
          onChange={(e) => onSearchFilterChange(e.target.value)}
          aria-label="Buscar en código o clasificación"
        />
      </div>
      <div className="table-wrap">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th className="dashboard-table__cell-expand" aria-label="Expandir detalle" />
              {[
                { key: 'code', label: 'Código' },
                { key: 'classification', label: 'Clasificación' },
                { key: 'severity', label: 'Severidad' },
                { key: 'occurrences', label: 'Ocurrencias' },
                { key: 'start_time', label: 'Primera vez' },
                { key: 'end_time', label: 'Última vez' },
              ].map(({ key, label }) => {
                const sortState = sort.column === key ? sort.dir : null
                return (
                  <th
                    key={key}
                    {...(sortState
                      ? { 'aria-sort': sortState === 'asc' ? 'ascending' : 'descending' }
                      : {})}
                  >
                    <button
                      type="button"
                      className="dashboard-table__sort-header"
                      onClick={() => onSortChange(key)}
                    >
                      {label}
                      <span className="dashboard-table__sort-icon" aria-hidden>
                        {sort.column === key ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : ' ⇅'}
                      </span>
                    </button>
                  </th>
                )
              })}
              <th className="dashboard-table__th-solution">Solución</th>
            </tr>
          </thead>
          <tbody>
            {incidentRows.map((inc) => {
              const isExpanded = expandedIncidentIds.has(inc.id)
              return (
                <React.Fragment key={inc.id}>
                  <tr className="dashboard-table__row-main">
                    <td className="dashboard-table__cell-expand">
                      <button
                        type="button"
                        className="dashboard-table__expand-btn"
                        onClick={() => toggleIncident(inc.id)}
                        aria-expanded={isExpanded ? 'true' : 'false'}
                        aria-label={isExpanded ? 'Colapsar detalle' : 'Expandir detalle'}
                        title={isExpanded ? 'Colapsar' : 'Ver ocurrencias'}
                      >
                        {isExpanded ? '▼' : '▶'}
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="dashboard-table__code-link"
                        onClick={() =>
                          onEditCode(
                            inc.code,
                            inc.classification || '',
                            inc.severity || 'INFO',
                            inc.sds_link || ''
                          )
                        }
                        title="Editar en el catálogo"
                      >
                        {inc.code}
                      </button>
                    </td>
                    <td
                      className="dashboard-table__cell-classification"
                      title={inc.classification || inc.code}
                    >
                      {inc.classification || inc.code}
                    </td>
                    <td>
                      <span className={`badge badge--${(inc.severity || 'info').toLowerCase()}`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td>{inc.occurrences}</td>
                    <td>{formatDateTime(inc.start_time)}</td>
                    <td>{formatDateTime(inc.end_time)}</td>
                    <td className="dashboard-table__cell-solution">
                      <span className="dashboard-table__cell-actions">
                        <span className="dashboard-table__cell-actions-left">
                          {inc.sds_solution_content ? (
                            <button
                              type="button"
                              className="dashboard-table__solution-link"
                              onClick={() =>
                                onViewSolution(inc.sds_solution_content!, inc.sds_link)
                              }
                            >
                              Ver solución
                            </button>
                          ) : inc.sds_link ? (
                            <a
                              href={inc.sds_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="dashboard-table__solution-link"
                              title="Este link puede haber vencido"
                            >
                              Ver solución ⚠
                            </a>
                          ) : (
                            <span className="dashboard-table__cell-actions-placeholder">—</span>
                          )}
                        </span>
                        <button
                          type="button"
                          className="dashboard__btn dashboard__btn--secondary dashboard__btn--edit"
                          onClick={() =>
                            onEditCode(
                              inc.code,
                              inc.classification || '',
                              inc.severity || 'INFO',
                              inc.sds_link || ''
                            )
                          }
                          title="Editar código en el catálogo"
                        >
                          Editar
                        </button>
                      </span>
                    </td>
                  </tr>
                  {isExpanded && inc.eventsInWindow.length > 0 && (
                    <tr className="dashboard-table__row-detail-header" aria-hidden>
                      <th className="dashboard-table__cell-expand" scope="col" />
                      <th scope="col">Fecha y hora</th>
                      <th scope="col">Contador</th>
                      <th scope="col" title="Diferencia con la ocurrencia anterior">
                        Δ
                      </th>
                      <th scope="col">Firmware</th>
                      <th scope="col" colSpan={3}>
                        Mensaje / Ayuda
                      </th>
                    </tr>
                  )}
                  {isExpanded &&
                    inc.eventsInWindow.map((evt, idx) => {
                      const prevCounter = idx > 0 ? inc.eventsInWindow[idx - 1].counter : null
                      const delta = prevCounter !== null ? evt.counter - prevCounter : null
                      const msg = evt.help_reference ?? evt.code_description ?? '—'
                      const msgKey = `${inc.id}-${idx}-msg`
                      return (
                        <tr key={`${inc.id}-${idx}`} className="dashboard-table__row-detail">
                          <td className="dashboard-table__cell-expand" />
                          <td className="dashboard-table__cell-detail-label">
                            {formatDateTime(evt.timestamp)}
                          </td>
                          <td className="dashboard-table__cell-detail-num">{evt.counter}</td>
                          <td
                            className="dashboard-table__cell-detail-delta"
                            title="Diferencia de contador desde la ocurrencia anterior"
                          >
                            {delta !== null ? (delta >= 0 ? `+${delta}` : delta) : '—'}
                          </td>
                          <td>{evt.firmware ?? '—'}</td>
                          <td colSpan={3} className="dashboard-table__cell-detail-msg">
                            {msg.length > 80 ? (
                              expandedMsgs.has(msgKey) ? (
                                <span>
                                  {msg}{' '}
                                  <button
                                    type="button"
                                    className="dashboard-table__msg-toggle"
                                    onClick={() =>
                                      setExpandedMsgs((s) => {
                                        const n = new Set(s)
                                        n.delete(msgKey)
                                        return n
                                      })
                                    }
                                  >
                                    ver menos
                                  </button>
                                </span>
                              ) : (
                                <span title={msg}>
                                  {msg.slice(0, 80)}…{' '}
                                  <button
                                    type="button"
                                    className="dashboard-table__msg-toggle"
                                    onClick={() => setExpandedMsgs((s) => new Set(s).add(msgKey))}
                                  >
                                    ver más
                                  </button>
                                </span>
                              )
                            ) : (
                              msg
                            )}
                          </td>
                        </tr>
                      )
                    })}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
