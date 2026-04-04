import type { EnrichedEvent as ApiEvent } from '../types/api'
import { formatDateTime } from '../hooks/useDateFilter'

interface EventsTableProps {
  tableRows: ApiEvent[]
  isCollapsed: boolean
  onToggleCollapse: () => void
  severityFilter: string
  onSeverityFilterChange: (value: string) => void
  searchFilter: string
  onSearchFilterChange: (value: string) => void
  sort: { column: string; dir: 'asc' | 'desc' }
  onSortChange: (column: string) => void
  onViewSolution: (content: string, url?: string | null) => void
}

export function EventsTable({
  tableRows,
  isCollapsed,
  onToggleCollapse,
  severityFilter,
  onSeverityFilterChange,
  searchFilter,
  onSearchFilterChange,
  sort,
  onSortChange,
  onViewSolution,
}: EventsTableProps) {
  return (
    <section className="section dashboard__table-section dashboard__table-section--collapsible">
      <button
        type="button"
        className="section__title section__title--toggle"
        onClick={onToggleCollapse}
      >
        <span>Eventos del período</span>
        <span className="section__toggle-icon" aria-hidden>{isCollapsed ? '▶' : '▼'}</span>
      </button>
      {!isCollapsed && (
        <>
          <div className="table-toolbar">
            <label className="table-toolbar__label" htmlFor="events-severity-filter">
              Severidad:
            </label>
            <select
              id="events-severity-filter"
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
            <label className="table-toolbar__label" htmlFor="events-search-filter">
              Buscar:
            </label>
            <input
              id="events-search-filter"
              type="search"
              className="table-toolbar__search"
              placeholder="Código o mensaje..."
              value={searchFilter}
              onChange={(e) => onSearchFilterChange(e.target.value)}
              aria-label="Buscar en código o mensaje"
            />
          </div>
          <div className="table-wrap">
            <table className="dashboard-table">
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
                      <th key={key} {...(sortState ? { 'aria-sort': sortState === 'asc' ? 'ascending' : 'descending' } : {})}>
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
                {tableRows.map((evt) => (
                  <tr key={`${evt.code}-${evt.timestamp}`}>
                    <td>{formatDateTime(evt.timestamp)}</td>
                    <td>{evt.code}</td>
                    <td>
                      <span className={`badge badge--${(evt.type || 'info').toLowerCase()}`}>
                        {evt.type}
                      </span>
                    </td>
                    <td>{evt.code_description?.trim() || evt.code || '—'}</td>
                    <td className="dashboard-table__cell-solution">
                      {evt.code_solution_content?.trim() ? (
                        <button
                          type="button"
                          className="dashboard-table__solution-link"
                          onClick={() => onViewSolution(evt.code_solution_content!, evt.code_solution_url)}
                        >
                          Ver solución
                        </button>
                      ) : evt.code_solution_url?.trim() ? (
                        <a href={evt.code_solution_url.trim()} target="_blank" rel="noopener noreferrer" className="dashboard-table__solution-link" title="Este link puede haber vencido">
                          Ver solución ⚠
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
