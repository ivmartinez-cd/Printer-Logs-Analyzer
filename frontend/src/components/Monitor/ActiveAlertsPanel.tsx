import type { ActiveAlert } from './healthMetrics'

interface ActiveAlertsPanelProps {
  alerts: ActiveAlert[]
}

function dot(severity: string): string {
  return severity === 'ERROR' ? '🔴' : '🟡'
}

export function ActiveAlertsPanel({ alerts }: ActiveAlertsPanelProps) {
  return (
    <section className="noc-alerts">
      <div className="noc-alerts__head">
        <h3 className="noc-alerts__title">Alertas activas</h3>
        <span className="noc-alerts__count">{alerts.length}</span>
      </div>
      {alerts.length === 0 ? (
        <p className="noc-alerts__empty">Sin alertas activas. 🟢</p>
      ) : (
        <ul className="noc-alerts__list">
          {alerts.map((a) => {
            const alertClass = 'noc-alert noc-alert--' + (a.severity === 'ERROR' ? 'error' : 'warn')
            return (
            <li
              key={a.code}
              className={alertClass}
            >
              <span className="noc-alert__dot" aria-hidden="true">
                {dot(a.severity)}
              </span>
              <div className="noc-alert__body">
                <span className="noc-alert__code">{a.code}</span>
                <span className="noc-alert__desc">{a.description}</span>
              </div>
              <span className="noc-alert__meta">{a.label}</span>
            </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
