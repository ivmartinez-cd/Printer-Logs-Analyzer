import { useState } from 'react'

interface RealtimeConsumable {
  description?: string
  type?: string
  sku?: string
  percentLeft?: number
  pagesLeft?: number
  daysLeft?: number
  colour?: string
}

interface ConsumableWarningsPanelProps {
  warnings: any[] // we use any[] from frontend state, cast it locally
}

const CATEGORY_ICON: Record<string, string> = {
  TONER: '🖨️',
  FUSER: '🔥',
  MAINTENANCE_KIT: '🔧',
  TRANSFER_KIT: '↔️',
  CLEANING: '🧹',
  UNKNOWN: '⚙️',
}

function formatPages(n?: number): string {
  if (n === undefined || n === null) return 'N/A'
  return n.toLocaleString('es-AR') + ' págs'
}

export function ConsumableWarningsPanel({ warnings }: ConsumableWarningsPanelProps) {
  const [collapsed, setCollapsed] = useState(true)

  if (!warnings || warnings.length === 0) return null

  // Treat as alert if anything is below 15%
  const hasAlert = warnings.some((w) => typeof w.percentLeft === 'number' && w.percentLeft < 15)

  return (
    <section className={`collapsible-panel collapsible-panel--${hasAlert ? 'alert' : 'consumable'}`}>
      <button
        type="button"
        className="collapsible-panel__header"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
      >
        <span className="collapsible-panel__title">⚙️ Estado de consumibles en tiempo real ({warnings.length})</span>
        <span
          className={`collapsible-panel__chevron${!collapsed ? ' collapsible-panel__chevron--expanded' : ''}`}
          aria-hidden="true"
        >
          ▶
        </span>
      </button>

      <div className={`collapsible-panel__body ${collapsed ? 'collapsible-panel__body--hidden' : ''}`}>
        <p className="consumable-warnings-panel__intro">
          Valores en tiempo real recolectados vía EKM Insight Portal.
        </p>
        <div className="table-wrap consumable-warnings-panel__scroll">
          <table className="dashboard-table consumable-warnings-panel__table">
            <thead>
              <tr>
                <th scope="col">Tipo</th>
                <th scope="col">Descripción</th>
                <th scope="col">SKU / Parte</th>
                <th scope="col">Págs Est. Restantes</th>
                <th scope="col">Días Est. Restantes</th>
                <th scope="col">Nivel Real</th>
              </tr>
            </thead>
            <tbody>
              {warnings.map((w: RealtimeConsumable, idx) => {
                const pct = w.percentLeft || 0
                const status = pct < 15 ? 'replace' : pct < 30 ? 'warning' : 'ok'
                const typeKey = (w.type || 'UNKNOWN').toUpperCase()
                
                return (
                  <tr key={`${idx}-${w.sku}`} data-status={status}>
                    <td>
                      <span className="consumable-warnings-panel__cat-icon" aria-hidden>
                        {CATEGORY_ICON[typeKey] ?? '⚙️'}
                      </span>{' '}
                      {typeKey}
                    </td>
                    <td>{w.description || 'Desconocido'}</td>
                    <td>
                      <code className="consumable-warnings-panel__part">{w.sku || 'N/A'}</code>
                    </td>
                    <td className="consumable-warnings-panel__num">{formatPages(w.pagesLeft)}</td>
                    <td className="consumable-warnings-panel__num">{w.daysLeft !== undefined && w.daysLeft !== null ? `${w.daysLeft} días` : 'N/A'}</td>
                    <td className="consumable-warnings-panel__bar-cell">
                      <div className="consumable-warnings-panel__bar-wrap" title={`${pct.toFixed(1)}%`}>
                        <div
                          className={`consumable-warnings-panel__bar consumable-warnings-panel__bar--${status}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                        <span className="consumable-warnings-panel__bar-label">{pct.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
