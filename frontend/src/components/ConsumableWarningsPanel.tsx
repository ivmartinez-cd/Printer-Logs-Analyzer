import { useState } from 'react'
import type { ConsumableWarning } from '../types/api'

interface ConsumableWarningsPanelProps {
  warnings: ConsumableWarning[]
}

const CATEGORY_ICON: Record<string, string> = {
  roller: '🔄',
  fuser: '🔥',
  toner: '🖨️',
  transfer: '↔️',
  maintenance_kit: '🔧',
  other: '⚙️',
}

function formatPages(n: number): string {
  return n.toLocaleString('es-AR') + ' págs'
}

function StatusBadge({ status }: { status: ConsumableWarning['status'] }) {
  if (status === 'replace') {
    return <span className="consumable-warnings-panel__badge consumable-warnings-panel__badge--replace">Revisar historial</span>
  }
  if (status === 'warning') {
    return <span className="consumable-warnings-panel__badge consumable-warnings-panel__badge--warning">Próximo a revisar</span>
  }
  return <span className="consumable-warnings-panel__badge consumable-warnings-panel__badge--ok">Sin alertas</span>
}

function UsageBar({ pct, status }: { pct: number; status: ConsumableWarning['status'] }) {
  const capped = Math.min(pct, 100)
  return (
    <div className="consumable-warnings-panel__bar-wrap" title={`${pct.toFixed(1)}%`}>
      <div
        className={`consumable-warnings-panel__bar consumable-warnings-panel__bar--${status}`}
        style={{ width: `${capped}%` }}
      />
      <span className="consumable-warnings-panel__bar-label">{pct.toFixed(1)}%</span>
    </div>
  )
}

export function ConsumableWarningsPanel({ warnings }: ConsumableWarningsPanelProps) {
  const [collapsed, setCollapsed] = useState(true)

  if (warnings.length === 0) return null

  return (
    <section className="section dashboard__table-section dashboard__table-section--collapsible consumable-warnings-panel">
      <button
        type="button"
        className="section__title section__title--toggle"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
      >
        <span>⚙️ Estado de consumibles ({warnings.length})</span>
        <span className="section__toggle-icon" aria-hidden>
          {collapsed ? '▶' : '▼'}
        </span>
      </button>

      {!collapsed && (
        <>
          <p className="consumable-warnings-panel__intro">
            Estos consumibles superaron su vida útil estimada según el contador de impresión.
            Verificá en el historial del equipo cuándo fue el último reemplazo antes de actuar.
          </p>
          <div className="table-wrap consumable-warnings-panel__scroll">
          <table className="dashboard-table consumable-warnings-panel__table">
            <thead>
              <tr>
                <th scope="col">Categoría</th>
                <th scope="col">Descripción</th>
                <th scope="col">Part number</th>
                <th scope="col">Vida útil</th>
                <th scope="col">Contador actual</th>
                <th scope="col">Uso</th>
                <th scope="col">Estado</th>
                <th scope="col">Códigos del log</th>
              </tr>
            </thead>
            <tbody>
              {warnings.map((w) => (
                <tr key={w.part_number} data-status={w.status}>
                  <td>
                    <span className="consumable-warnings-panel__cat-icon" aria-hidden>
                      {CATEGORY_ICON[w.category] ?? '⚙️'}
                    </span>{' '}
                    {w.category}
                  </td>
                  <td>{w.description}</td>
                  <td>
                    <code className="consumable-warnings-panel__part">{w.part_number}</code>
                  </td>
                  <td className="consumable-warnings-panel__num">{formatPages(w.life_pages)}</td>
                  <td className="consumable-warnings-panel__num">{formatPages(w.current_counter)}</td>
                  <td className="consumable-warnings-panel__bar-cell">
                    <UsageBar pct={w.usage_pct} status={w.status} />
                  </td>
                  <td>
                    <StatusBadge status={w.status} />
                  </td>
                  <td>
                    <span className="consumable-warnings-panel__codes">
                      {w.matched_codes.join(', ')}
                    </span>
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
