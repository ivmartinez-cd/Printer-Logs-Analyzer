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
    <section className="collapsible-panel collapsible-panel--events">
      <button
        type="button"
        className="collapsible-panel__header"
        onClick={() => setIsCollapsed((c) => !c)}
        aria-expanded={!isCollapsed}
      >
        <span className="collapsible-panel__title">📅 Eventos del período</span>
        {isCollapsed && events.length > 0 && (
          <span style={{ fontSize: '0.8rem', color: '#9aa3b2', fontWeight: 400, marginLeft: 4 }}>
            {events.length} evento{events.length !== 1 ? 's' : ''}
          </span>
        )}
        <span
          className={`collapsible-panel__chevron${!isCollapsed ? ' collapsible-panel__chevron--expanded' : ''}`}
          aria-hidden="true"
        >
          ▶
        </span>
      </button>
      {!isCollapsed && (
        <div className="collapsible-panel__body">
          <>
          <div className={styles['table-toolbar']}>
            <label className={styles['table-toolbar__label']} htmlFor="events-severity-filter">
              Severidad:
            </label>
            <select
              id="events-severity-filter"
              className={styles['table-toolbar__select']}
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              aria-label="Filtrar por severidad"
            >
              <option value="">Todo</option>
              <option value="ERROR">Error</option>
              <option value="WARNING">Advertencia</option>
              <option value="INFO">Info</option>
            </select>
            <label className={styles['table-toolbar__label']} htmlFor="events-search-filter">
              Buscar:
            </label>
            <input
              id="events-search-filter"
              type="search"
              className={styles['table-toolbar__search']}
              placeholder="Código o mensaje..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              aria-label="Buscar en código o mensaje"
            />
          </div>
          <div className={styles['table-wrap']}>
            <table className={styles['dashboard-table']}>
              <thead>
                <tr>
                  {[
                    { key: 'timestamp', label: 'Fecha/hora' },
                    { key: 'code', label: 'Código' },
                    { key: 'severity', label: 'Severidad' },
                    { key: 'message', label: 'Mensaje' },
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
                          className={styles['dashboard-table__sort-header']}
                          onClick={() => handleSortChange(key)}
                        >
                          {label}
                          <span className={styles['dashboard-table__sort-icon']} aria-hidden>
                            {sort.column === key ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : ' ⇅'}
                          </span>
                        </button>
                      </th>
                    )
                  })}
                  <th className={styles['dashboard-table__th-solution']}>Solución</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((evt) => (
                  <tr key={`${evt.code}-${evt.timestamp}`}>
                    <td>{formatDateTime(evt.timestamp)}</td>
                    <td>{evt.code}</td>
                    <td>
                      <span className={'badge badge--' + (evt.type || 'info').toLowerCase()}>
                        {evt.type}
                      </span>
                    </td>
                    <td>{evt.code_description?.trim() || evt.code || '—'}</td>
                    <td className={styles['dashboard-table__cell-solution']}>
                      {evt.code_solution_content?.trim() || evt.code_solution_url?.trim() ? (
                        <button
                          type="button"
                          className={styles['dashboard-table__solution-link']}
                          onClick={() =>
                            onViewSolution(evt.code, evt.code_solution_content, evt.code_solution_url)
                          }
                        >
                          Ver solución
                        </button>
                      ) : (
                        <span className="dashboard-table__cell-actions-placeholder">Sin solución SDS</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        </div>
      )}
    </section>
  )
}
