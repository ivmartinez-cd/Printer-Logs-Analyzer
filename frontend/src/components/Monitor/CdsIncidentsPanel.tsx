import { useState, useCallback } from 'react'
import type { CdsIncident, CdsIncidentDetails } from '../../types/api'
import { getCdsIncidentDetails } from '../../services/api'

interface CdsIncidentsPanelProps {
  serial: string | null
  data: CdsIncident[]
  loading: boolean
  error: string | null
}

export function CdsIncidentsPanel({ serial, data, loading, error }: CdsIncidentsPanelProps) {
  const [collapsed, setCollapsed] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detailsCache, setDetailsCache] = useState<Record<string, CdsIncidentDetails>>({})
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)

  const toggleRow = useCallback(async (inc: CdsIncident) => {
    const id = inc.id || inc.numero_incidente
    if (expandedId === id) {
      setExpandedId(null)
      return
    }
    setExpandedId(id)
    setDetailError(null)
    if (detailsCache[id]) return
    setLoadingDetailId(id)
    try {
      const details = await getCdsIncidentDetails(inc.id)
      setDetailsCache((prev) => ({ ...prev, [id]: details }))
    } catch {
      setDetailError('No se pudieron cargar los detalles.')
    } finally {
      setLoadingDetailId(null)
    }
  }, [expandedId, detailsCache])

  if (!serial) return null

  const totalIncidents = data?.length ?? 0

  return (
    <section className="collapsible-panel collapsible-panel--cds">
      <button
        type="button"
        className="collapsible-panel__header"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
      >
        <span className="collapsible-panel__title">
          📋 Incidentes CD
          {serial && <span className="insight-alerts-panel__serial"> · {serial}</span>}
          {!loading && data && (
            <span className="insight-alerts-panel__count"> ({totalIncidents})</span>
          )}
        </span>
        <span
          className={`collapsible-panel__chevron${!collapsed ? ' collapsible-panel__chevron--expanded' : ''}`}
          aria-hidden="true"
        >
          ▶
        </span>
      </button>

      {!collapsed && (
        <div className="collapsible-panel__body">
          {loading && (
            <div className="cds-incidents-panel__loading">
              <span className="cds-incidents-panel__spinner" aria-hidden="true" />
              Consultando incidentes en Canal Directo…
            </div>
          )}

          {error && <p className="cds-incidents-panel__error">⚠ {error}</p>}

          {!loading && !error && (
            <>
              {totalIncidents === 0 ? (
                <p className="cds-incidents-panel__empty">
                  Sin incidentes reportados en los últimos 6 meses.
                </p>
              ) : (
                <div className="table-wrap">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th scope="col">Fecha</th>
                        <th scope="col">Detalle / Motivo</th>
                        <th scope="col">Contador</th>
                        <th scope="col" aria-label="Expandir detalles" />
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((inc) => {
                        const rowId = inc.id || inc.numero_incidente
                        const isExpanded = expandedId === rowId
                        const isLoadingThis = loadingDetailId === rowId
                        const details = detailsCache[rowId]

                        return (
                          <>
                            <tr key={rowId}>
                              <td>
                                <a
                                  href={`https://webagentes.canaldirecto.com.ar/incidents/view/${inc.numero_incidente}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="cds-incidents-panel__link"
                                >
                                  {inc.fecha} (#{inc.numero_incidente})
                                </a>
                              </td>
                              <td>{inc.motivo}</td>
                              <td className="cds-incidents-panel__counter">
                                {inc.contador ? parseInt(inc.contador).toLocaleString('es-AR') : '—'}
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="cds-incidents-panel__expand-btn"
                                  onClick={() => toggleRow(inc)}
                                  aria-expanded={isExpanded}
                                  aria-label={isExpanded ? 'Ocultar detalles' : 'Ver detalles'}
                                >
                                  {isExpanded ? '▲' : '▼'}
                                </button>
                              </td>
                            </tr>

                            {isExpanded && (
                              <tr key={`${rowId}-details`} className="cds-incidents-panel__detail-row">
                                <td colSpan={4}>
                                  {isLoadingThis && (
                                    <div className="cds-incidents-panel__loading">
                                      <span className="cds-incidents-panel__spinner" aria-hidden="true" />
                                      Cargando detalles…
                                    </div>
                                  )}
                                  {detailError && !isLoadingThis && (
                                    <p className="cds-incidents-panel__error">⚠ {detailError}</p>
                                  )}
                                  {details && !isLoadingThis && (
                                    <div className="cds-incidents-panel__detail-body">
                                      <div className="cds-incidents-panel__detail-section">
                                        <span className="cds-incidents-panel__detail-label">Repuestos:</span>
                                        {details.repuestos.length > 0 ? (
                                          <div className="cds-incidents-panel__replacements">
                                            {details.repuestos.map((r, idx) => (
                                              <span key={idx} className="cds-incidents-panel__replacement-badge">
                                                {r.articulo} (x{r.cantidad})
                                              </span>
                                            ))}
                                          </div>
                                        ) : (
                                          <span className="cds-incidents-panel__no-replacements">—</span>
                                        )}
                                      </div>
                                      <div className="cds-incidents-panel__detail-section">
                                        <span className="cds-incidents-panel__detail-label">Tareas realizadas:</span>
                                        {details.tareas_realizadas.length > 0 ? (
                                          <ul className="cds-incidents-panel__jobs-list">
                                            {details.tareas_realizadas.map((job, idx) => (
                                              <li key={idx}>{job}</li>
                                            ))}
                                          </ul>
                                        ) : (
                                          <span className="cds-incidents-panel__no-jobs">—</span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )}
                          </>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  )
}
