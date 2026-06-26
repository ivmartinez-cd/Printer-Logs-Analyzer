import { useState } from 'react'
import type { CdsIncident } from '../../types/api'

function calcCheckDigit(numStr: string): string {
  const clean = numStr.replace(/\D/g, '')
  if (!clean) return ''
  let sum = 0
  for (let i = 0; i < clean.length; i++) {
    sum += Number(clean[i]) * (i % 2 === 0 ? 3 : 1)
  }
  return String((10 - (sum % 10)) % 10)
}

function formatIncidentNumber(numero: string): string {
  const cd = calcCheckDigit(numero)
  return cd ? `${numero}-${cd}` : numero
}

interface CdsIncidentsPanelProps {
  serial: string | null
  data: CdsIncident[]
  loading: boolean
  error: string | null
}

export function CdsIncidentsPanel({ serial, data, loading, error }: CdsIncidentsPanelProps) {
  const [collapsed, setCollapsed] = useState(true)

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
          Incidentes CD
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

          {error && <p className="cds-incidents-panel__error">{error}</p>}

          {!loading && !error && (
            <>
              {totalIncidents === 0 ? (
                <p className="cds-incidents-panel__empty">
                  Sin incidentes reportados en los últimos 12 meses.
                </p>
              ) : (
                <div className="table-wrap">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th scope="col">Fecha</th>
                        <th scope="col">Incidente</th>
                        <th scope="col">Detalle / Motivo</th>
                        <th scope="col">Repuesto Utilizado</th>
                        <th scope="col">Tareas Realizadas</th>
                        <th scope="col">Contador</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((inc) => (
                        <tr key={inc.id || inc.numero_incidente}>
                          <td>{inc.fecha}</td>
                          <td>
                            <a
                              href={`https://webagentes.canaldirecto.com.ar/incidents/view/${formatIncidentNumber(inc.numero_incidente)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="cds-incidents-panel__link"
                            >
                              {formatIncidentNumber(inc.numero_incidente)}
                            </a>
                          </td>
                          <td>{inc.motivo}</td>
                          <td>
                            {inc.repuestos && inc.repuestos.length > 0 ? (
                              <div className="cds-incidents-panel__replacements">
                                {inc.repuestos.map((r, idx) => (
                                  <span
                                    key={idx}
                                    className="cds-incidents-panel__replacement-badge"
                                  >
                                    {r.articulo} (x{r.cantidad})
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="cds-incidents-panel__no-replacements">—</span>
                            )}
                          </td>
                          <td>
                            {inc.tareas_realizadas && inc.tareas_realizadas.length > 0 ? (
                              <ul className="cds-incidents-panel__jobs-list">
                                {inc.tareas_realizadas.map((job, idx) => (
                                  <li key={idx}>{job}</li>
                                ))}
                              </ul>
                            ) : (
                              <span className="cds-incidents-panel__no-jobs">—</span>
                            )}
                          </td>
                          <td className="cds-incidents-panel__counter">
                            {inc.contador ? parseInt(inc.contador).toLocaleString('es-AR') : '—'}
                          </td>
                        </tr>
                      ))}
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
