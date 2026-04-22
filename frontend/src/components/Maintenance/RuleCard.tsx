interface RuleCardProps {
  rule: any
  state: any
  selectedDevice: any
  incident?: any
  onEditRule: (rule: any) => void
  onAdjustState: (rule: any, state: any) => void
  onRecordChange: (rule: any) => void
  onOpenIncident?: (rule: any) => void
  onCloseIncident?: (rule: any, incident: any) => void
}

export function RuleCard({
  rule,
  state,
  selectedDevice,
  incident,
  onEditRule,
  onAdjustState,
  onRecordChange,
  onOpenIncident,
  onCloseIncident,
}: RuleCardProps) {
  const lastCounter = state ? state.last_change_counter : 0
  const nextChange = lastCounter + rule.expected_life
  const remaining = selectedDevice ? (nextChange - selectedDevice.last_sync_counter) : null
  const percent = selectedDevice ? Math.max(0, Math.min(100, (remaining! / rule.expected_life) * 100)) : null

  const isWarning = selectedDevice && remaining! <= rule.alert_margin
  const isCritical = selectedDevice && remaining! <= 0

  return (
    <div className={`avisos-rule-card ${isCritical ? 'is-critical' : ''} ${incident ? 'has-incident' : ''}`}>
      <div className="avisos-rule-header">
        <h4>{rule.component_type}</h4>
        <div className="avisos-rule-header-actions">
          {!selectedDevice && (
            <div
              className="edit-indicator-compact"
              onClick={() => onEditRule(rule)}
              title="Editar Regla Maestra"
            >
              ✏️ Editar
            </div>
          )}
          {selectedDevice && (
            <>
              <div
                className="edit-indicator-compact"
                onClick={() => onAdjustState(rule, state)}
                title="Ajustar Contador de Último Cambio"
              >
                ⚙️ Ajustar
              </div>
              {incident ? (
                <span className="avisos-rule-badge is-incident" title={`Incidente abierto: ${incident.incident_number}`}>
                  🎫 {incident.incident_number}
                </span>
              ) : (
                <span className={`avisos-rule-badge ${isWarning ? 'is-warning' : ''}`}>
                  {isCritical ? 'CRÍTICO' : isWarning ? 'Atención' : 'OK'}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      <div className="avisos-rule-body">
        {selectedDevice && (
          <div className="avisos-rule-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${percent}%`,
                  backgroundColor: percent! < 15 ? '#ef4444' : percent! < 30 ? '#f59e0b' : '#10b981'
                }}
              ></div>
            </div>
            <div className="progress-text">
              {remaining?.toLocaleString()} páginas restantes
            </div>
          </div>
        )}

        <div className="avisos-rule-metric">
          <span className="label">Vida Útil:</span>
          <span className="value">{rule.expected_life?.toLocaleString()} págs.</span>
        </div>

        <div className="avisos-rule-metric">
          <span className="label">Margen Alerta:</span>
          <span className="value">{rule.alert_margin?.toLocaleString()} págs.</span>
        </div>

        {selectedDevice && (
          <div className="avisos-rule-metric">
            <span className="label">Último Cambio:</span>
            <span className="value">{lastCounter.toLocaleString()}</span>
          </div>
        )}

        {incident?.notes && (
          <div className="avisos-rule-metric">
            <span className="label">Nota:</span>
            <span className="value" style={{ fontStyle: 'italic', opacity: 0.8 }}>{incident.notes}</span>
          </div>
        )}
      </div>

      {selectedDevice && (
        <div className="avisos-rule-actions">
          {incident ? (
            <button
              className="dashboard__btn dashboard__btn--primary"
              style={{ width: '100%', height: '44px' }}
              onClick={() => onCloseIncident?.(rule, incident)}
            >
              ✅ Cerrar Incidente y Registrar Reemplazo
            </button>
          ) : (
            <>
              {(isWarning || isCritical) && (
                <button
                  className="dashboard__btn dashboard__btn--warning"
                  style={{ width: '100%', height: '44px', marginBottom: '8px' }}
                  onClick={() => onOpenIncident?.(rule)}
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
