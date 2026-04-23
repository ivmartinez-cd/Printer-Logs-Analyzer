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
    ? 'is-incident'
    : isCritical
      ? 'is-critical'
      : isWarning
        ? 'is-warning'
        : 'is-ok'

  const statusLabel = incident
    ? 'INCIDENTE ABIERTO'
    : isCritical
      ? 'CRÍTICO'
      : isWarning
        ? 'Atención'
        : 'ESTADO ÓPTIMO'

  return (
    <div className={`maintenance-rule-card ${statusClass}`}>
      <div className="rule-card-header">
        <div className="rule-component-info">
          <span className="rule-icon">⚙️</span>
          <h4 className="rule-component-name">{rule.component_type}</h4>
          <button 
            className="dashboard__btn--icon-edit" 
            onClick={() => onEditRule(rule)}
            title="Editar Regla"
            style={{ padding: '4px', marginLeft: '8px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            ✏️ Editar
          </button>
        </div>
        <div className="rule-status-badge">{statusLabel}</div>
      </div>

      <div className="rule-card-body">
        <div className="rule-stat-grid">
          <div className="rule-stat-item">
            <span className="rule-stat-label">Vida Útil Esperada</span>
            <span className="rule-stat-value">{rule.expected_life.toLocaleString()} págs.</span>
          </div>
          <div className="rule-stat-item">
            <span className="rule-stat-label">Margen de Alerta</span>
            <span className="rule-stat-value">{rule.alert_margin.toLocaleString()} págs.</span>
          </div>
        </div>

        <div className="rule-progress-section">
          <div className="rule-progress-info">
            <span className="rule-progress-label">Páginas restantes</span>
            <span className="rule-progress-value">{remaining.toLocaleString()} páginas restantes</span>
          </div>
          <div className="rule-progress-bar-container">
            <div
              className="rule-progress-bar-fill"
              style={{
                width: `${Math.max(0, Math.min(100, (remaining / rule.expected_life) * 100))}%`,
              }}
            ></div>
          </div>
        </div>

        {incident && (
          <div className="rule-incident-info">
            <span className="incident-icon">🎫</span>
            <span className="incident-text">Incidente: {incident.incident_number}</span>
          </div>
        )}
      </div>

      {!loading && selectedDevice && (
        <div className="rule-card-actions">
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
                style={{ width: '100%', height: '44px' }}
                onClick={() => onRecordChange(rule)}
              >
                🛠️ Registrar Cambio Directo
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
