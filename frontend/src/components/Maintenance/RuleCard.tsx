import { MaintenanceDevice, MaintenanceDeviceState, MaintenanceIncident, MaintenanceModelRule } from '../../types/api'

interface RuleCardProps {
  rule: MaintenanceModelRule
  selectedDevice: MaintenanceDevice | null
  state?: MaintenanceDeviceState
  incident?: MaintenanceIncident
  onEditRule: (rule: MaintenanceModelRule) => void
  onAdjustState: (rule: MaintenanceModelRule, state?: MaintenanceDeviceState) => void
  onRecordChange: (rule: MaintenanceModelRule) => void
  onOpenIncident: (rule: MaintenanceModelRule) => void
  onCloseIncident: (rule: MaintenanceModelRule, incident: MaintenanceIncident) => void
  onSendAlert: (rule: MaintenanceModelRule) => void
  loading?: boolean
}

export function RuleCard({
  rule,
  selectedDevice,
  state,
  incident,
  onEditRule,
  onAdjustState,
  onRecordChange,
  onOpenIncident,
  onCloseIncident,
  onSendAlert,
  loading,
}: RuleCardProps) {
  // Para esta demo, calculamos el próximo cambio basándonos en el último counter registrado
  // Si no hay counter registrado en 'state', asumimos el counter actual del equipo como baseline
  const currentCounter = selectedDevice?.last_sync_counter ?? 0
  const baseline = state?.last_change_counter ?? currentCounter
  const nextChange = baseline + rule.expected_life
  const remaining = nextChange - currentCounter
  
  const isWarning = remaining <= rule.alert_margin && remaining > 0
  const isCritical = remaining <= 0

  const statusClass = incident
    ? 'has-incident'
    : isCritical
      ? 'is-critical'
      : isWarning
        ? 'is-warning'
        : 'is-ok'

  const statusLabel = incident
    ? `INCIDENTE: ${incident.incident_number}`
    : isCritical
      ? 'CRÍTICO'
      : isWarning
        ? 'Atención'
        : 'ESTADO ÓPTIMO'

  return (
    <div className={`avisos-rule-card ${statusClass}`}>
      <div className="avisos-rule-header">
        <div className="avisos-rule-header-actions">
          <span className="rule-icon">⚙️</span>
          <h4>{rule.component_type}</h4>
          <button 
            className="dashboard__btn--icon-edit" 
            onClick={() => onEditRule(rule)}
            title="Editar Regla"
            style={{ marginLeft: '8px' }}
          >
            ✏️
          </button>
        </div>
        <div className={`avisos-rule-badge ${incident ? 'is-incident' : isWarning ? 'is-warning' : ''}`}>
          {statusLabel}
        </div>
      </div>

      <div className="avisos-rule-body">
        <div className="avisos-rule-metric">
          <span className="label">Vida Útil Esperada</span>
          <span className="value">{rule.expected_life.toLocaleString()} págs.</span>
        </div>
        <div className="avisos-rule-metric">
          <span className="label">Margen de Alerta</span>
          <span className="value">{rule.alert_margin.toLocaleString()} págs.</span>
        </div>

        <div className="avisos-rule-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${Math.max(0, Math.min(100, (remaining / rule.expected_life) * 100))}%`,
                backgroundColor: isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981'
              }}
            ></div>
          </div>
          <div className="progress-text">
            {remaining.toLocaleString()} págs. restantes
          </div>
        </div>
      </div>

      {!loading && selectedDevice && (
        <div className="avisos-rule-actions">
          {incident ? (
            <button
              className="dashboard__btn dashboard__btn--vibrant"
              style={{ width: '100%', height: '44px' }}
              onClick={() => onCloseIncident(rule, incident)}
            >
              ✅ Cerrar Incidente y Registrar Reemplazo
            </button>
          ) : (
            <>
              <button
                className="dashboard__btn dashboard__btn--secondary"
                style={{ width: '100%', height: '44px', marginBottom: '8px' }}
                onClick={() => onAdjustState(rule, state)}
              >
                ⚙️ Ajustar Último Cambio
              </button>
              {(isWarning || isCritical) && (
                <button
                  className="dashboard__btn dashboard__btn--warning"
                  style={{ width: '100%', height: '44px', marginBottom: '8px' }}
                  onClick={() => onOpenIncident(rule)}
                >
                  🎫 Abrir Incidente
                </button>
              )}
              <button
                className="dashboard__btn dashboard__btn--secondary"
                style={{ width: '100%', height: '44px', marginBottom: '8px' }}
                onClick={() => onRecordChange(rule)}
              >
                🛠️ Registrar Cambio Directo
              </button>
              <button
                className="dashboard__btn"
                style={{
                  width: '100%',
                  height: '40px',
                  borderColor: 'rgba(56, 189, 248, 0.3)',
                  color: '#38bdf8',
                  fontSize: '13px'
                }}
                title={rule.email_recipients ? `Enviar alerta a: ${rule.email_recipients}` : 'No hay destinatarios configurados en esta regla'}
                onClick={() => onSendAlert(rule)}
              >
                📧 Enviar Alerta por Mail
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
