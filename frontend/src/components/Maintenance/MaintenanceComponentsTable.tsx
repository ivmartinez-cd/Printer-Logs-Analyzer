import type {
  MaintenanceDevice,
  MaintenanceDeviceState,
  MaintenanceIncident,
  MaintenanceModelRule,
} from '../../types/api'

interface MaintenanceComponentsTableProps {
  rules: MaintenanceModelRule[]
  deviceStates: MaintenanceDeviceState[]
  incidents: MaintenanceIncident[]
  selectedDevice: MaintenanceDevice | null
  onEditRule: (rule: MaintenanceModelRule) => void
  onAdjustState: (rule: MaintenanceModelRule, state?: MaintenanceDeviceState) => void
  onRecordChange: (rule: MaintenanceModelRule) => void
  onOpenIncident: (rule: MaintenanceModelRule) => void
  onCloseIncident: (rule: MaintenanceModelRule, incident: MaintenanceIncident) => void
  onSendAlert: (rule: MaintenanceModelRule) => void
  onAddRule?: () => void
  loading?: boolean
}

const STATUS_COLORS = {
  ok: 'hsl(160 55% 42%)',
  warning: 'hsl(45 88% 52%)',
  critical: 'hsl(0 70% 58%)',
  incident: 'hsl(220 78% 58%)',
}

const STATUS_LABELS = {
  ok: 'Óptimo',
  warning: 'Atención',
  critical: 'Crítico',
  incident: 'Incidente',
}

export function MaintenanceComponentsTable({
  rules,
  deviceStates,
  incidents,
  selectedDevice,
  onEditRule,
  onAdjustState,
  onRecordChange,
  onOpenIncident,
  onCloseIncident,
  onSendAlert,
  onAddRule,
  loading,
}: MaintenanceComponentsTableProps) {
  if (loading) {
    return <div className="mnt-comp-table-loading">Cargando componentes...</div>
  }

  if (rules.length === 0) {
    return (
      <div className="mnt-comp-table-empty">
        <p>No hay reglas configuradas para este modelo.</p>
        {onAddRule && (
          <button className="dashboard__btn dashboard__btn--secondary" onClick={onAddRule}>
            + Agregar primera regla
          </button>
        )}
      </div>
    )
  }

  const currentCounter = selectedDevice?.last_sync_counter ?? 0

  return (
    <div className="mnt-comp-table-wrapper">
      <table className="mnt-comp-table">
        <thead>
          <tr>
            <th>Componente</th>
            <th>Vida Útil</th>
            <th>Progreso</th>
            <th>Págs. Restantes</th>
            <th>Alerta a</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rules.map((rule) => {
            const state = deviceStates.find((s) => s.component_type === rule.component_type)
            const incident = incidents.find(
              (i) => i.component_type === rule.component_type && i.status === 'open'
            )
            const baseline = state?.last_change_counter ?? currentCounter
            const remaining = baseline + rule.expected_life - currentCounter
            const pct = Math.max(0, Math.min(100, (remaining / rule.expected_life) * 100))

            let compStatus: 'ok' | 'warning' | 'critical' | 'incident' = 'ok'
            if (incident) compStatus = 'incident'
            else if (remaining <= 0) compStatus = 'critical'
            else if (remaining <= rule.alert_margin) compStatus = 'warning'

            const color = STATUS_COLORS[compStatus]

            return (
              <tr key={rule.id ?? rule.component_type} className={`mnt-comp-row mnt-comp-row--${compStatus}`}>
                <td className="mnt-comp-cell--name">
                  <span className="mnt-comp-icon">⚙️</span>
                  <span className="mnt-comp-label">{rule.component_type}</span>
                </td>

                <td className="mnt-comp-cell--life">
                  {rule.expected_life.toLocaleString()} págs.
                </td>

                <td className="mnt-comp-cell--progress">
                  <div className="mnt-progress-track">
                    <div
                      className="mnt-progress-fill"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                  <span className="mnt-progress-pct" style={{ color }}>
                    {Math.round(pct)}%
                  </span>
                </td>

                <td className="mnt-comp-cell--remaining">
                  <span
                    className="mnt-remaining-value"
                    style={{ color: remaining < 0 ? STATUS_COLORS.critical : color }}
                  >
                    {remaining >= 0 ? '+' : ''}{remaining.toLocaleString()}
                  </span>
                  {incident && (
                    <span className="mnt-incident-tag" title={`Incidente: ${incident.incident_number}`}>
                      #{incident.incident_number}
                    </span>
                  )}
                </td>

                <td className="mnt-comp-cell--recipients">
                  <span className="mnt-recipients-text" title={rule.email_recipients ?? ''}>
                    {rule.email_recipients
                      ? rule.email_recipients.split(',')[0].trim() +
                        (rule.email_recipients.includes(',') ? ' +más' : '')
                      : '—'}
                  </span>
                </td>

                <td className="mnt-comp-cell--actions">
                  <div className="mnt-action-group">
                    <button
                      className="mnt-action-btn"
                      title="Editar Regla"
                      onClick={() => onEditRule(rule)}
                    >
                      ✏️
                    </button>
                    {selectedDevice && (
                      <>
                        <button
                          className="mnt-action-btn"
                          title="Ajustar último cambio"
                          onClick={() => onAdjustState(rule, state)}
                        >
                          ⚙️
                        </button>
                        <button
                          className="mnt-action-btn"
                          title="Registrar cambio directo"
                          onClick={() => onRecordChange(rule)}
                        >
                          🛠️
                        </button>
                        {incident ? (
                          <button
                            className="mnt-action-btn mnt-action-btn--incident"
                            title="Cerrar Incidente y Registrar Reemplazo"
                            onClick={() => onCloseIncident(rule, incident)}
                          >
                            ✅
                          </button>
                        ) : (
                          <button
                            className="mnt-action-btn"
                            title="Abrir Incidente"
                            onClick={() => onOpenIncident(rule)}
                          >
                            🎫
                          </button>
                        )}
                        <button
                          className="mnt-action-btn"
                          title={
                            rule.email_recipients
                              ? `Enviar alerta a: ${rule.email_recipients}`
                              : 'Sin destinatarios configurados'
                          }
                          onClick={() => onSendAlert(rule)}
                        >
                          📧
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {!selectedDevice && onAddRule && rules.length < 8 && (
        <button className="mnt-comp-add-rule" onClick={onAddRule}>
          + Agregar Regla al Modelo
        </button>
      )}

      <div className="mnt-comp-legend">
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <span key={key} className="mnt-legend-item">
            <span
              className="mnt-legend-dot"
              style={{ backgroundColor: STATUS_COLORS[key as keyof typeof STATUS_COLORS] }}
            />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
