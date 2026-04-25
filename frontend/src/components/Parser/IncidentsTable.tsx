import React, { useState } from 'react'
import type { EnrichedEvent as ApiEvent } from '../../types/api'
import { formatDateTime } from '../../hooks/useDateFilter'

function exportIncidentsCSV(rows: IncidentRow[]) {
  const headers = ['Código', 'Clasificación', 'Severidad', 'Ocurrencias', 'Primera vez', 'Última vez']
  const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const body = rows.map(r => [
    r.code,
    r.classification,
    r.severity,
    r.occurrences,
    r.start_time ? new Date(r.start_time).toLocaleString('es-AR') : '',
    r.end_time   ? new Date(r.end_time).toLocaleString('es-AR')   : '',
  ].map(escape).join(','))
  const csv = '﻿' + [headers.join(','), ...body].join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: 'incidencias.csv' })
  a.click()
  URL.revokeObjectURL(url)
}

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
  onEditCode: (code: string, classification: string, severity: string, sdsLink: string) => void
  onViewSolution: (code: string, sdsContent?: string | null, sdsUrl?: string | null) => void
}

export function IncidentsTable({
  incidentRows,
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
    <section className="section dashboard__table-section">
      <h2 className="section__title">Incidencias</h2>
      <div className="table-toolbar">
        <button
          className="dashboard__btn dashboard__btn--secondary"
          style={{ padding: '4px 12px', fontSize: '0.78rem' }}
          onClick={() => exportIncidentsCSV(sortedRows)}
          title="Exportar incidencias visibles a CSV"
        >
          ↓ CSV
        </button>
        <label className="table-toolbar__label" htmlFor="incidents-severity-filter">
          Severidad:
        </label>
        <select
          id="incidents-severity-filter"
          className="table-toolbar__select"
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
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
          onChange={(e) => setSearchFilter(e.target.value)}
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
                      onClick={() => handleSortChange(key)}
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
            {sortedRows.map((inc) => {
              const isExpanded = expandedIncidentIds.has(inc.id)
              return (
                <React.Fragment key={inc.id}>
                  <tr className="dashboard-table__row-main">
                    <td className="dashboard-table__cell-expand" data-label="Detalle">
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
                    <td data-label="Código">
                      <button
                        type="button"
                        className="dashboard-table__code-link"
                        onClick={() =>
                          onViewSolution(inc.code, inc.sds_solution_content, inc.sds_link)
                        }
                        title="Ver solución"
                      >
                        {inc.code}
                      </button>
                    </td>
                    <td
                      className="dashboard-table__cell-classification"
                      title={inc.classification || inc.code}
                      data-label="Clasificación"
                    >
                      {inc.classification || inc.code}
                    </td>
                    <td data-label="Severidad">
                      <span className={'badge badge--' + (inc.severity || 'info').toLowerCase()}>
                        {inc.severity}
                      </span>
                    </td>
                    <td data-label="Ocurrencias">{inc.occurrences}</td>
                    <td data-label="Primera vez">{formatDateTime(inc.start_time)}</td>
                    <td data-label="Última vez">{formatDateTime(inc.end_time)}</td>
                    <td className="dashboard-table__cell-solution" data-label="Solución">
                      <span className="dashboard-table__cell-actions">
                        <span className="dashboard-table__cell-actions-left">
                          {inc.sds_solution_content || inc.sds_link ? (
                            <button
                              type="button"
                              className="dashboard-table__solution-link"
                              onClick={() =>
                                onViewSolution(inc.code, inc.sds_solution_content, inc.sds_link)
                              }
                            >
                              Ver solución
                            </button>
                          ) : (
                            <span className="dashboard-table__cell-actions-placeholder">Sin solución registrada</span>
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
                          <td className="dashboard-table__cell-detail-label" data-label="Fecha y hora">
                            {formatDateTime(evt.timestamp)}
                          </td>
                          <td className="dashboard-table__cell-detail-num" data-label="Contador">{evt.counter}</td>
                          <td
                            className="dashboard-table__cell-detail-delta"
                            title="Diferencia de contador desde la ocurrencia anterior"
                            data-label="Δ"
                          >
                            {delta !== null ? (delta >= 0 ? `+${delta}` : delta) : '—'}
                          </td>
                          <td data-label="Firmware">{evt.firmware ?? '—'}</td>
                          <td colSpan={3} className="dashboard-table__cell-detail-msg" data-label="Mensaje / Ayuda">
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


