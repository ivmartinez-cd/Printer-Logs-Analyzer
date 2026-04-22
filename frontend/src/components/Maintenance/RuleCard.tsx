interface RuleCardProps {
  rule: any
  state: any
  selectedDevice: any
  onEditRule: (rule: any) => void
  onAdjustState: (rule: any, state: any) => void
  onRecordChange: (rule: any) => void
}

export function RuleCard({
  rule,
  state,
  selectedDevice,
  onEditRule,
  onAdjustState,
  onRecordChange,
}: RuleCardProps) {
  const lastCounter = state ? state.last_change_counter : 0
  const nextChange = lastCounter + rule.expected_life
  const remaining = selectedDevice ? (nextChange - selectedDevice.last_sync_counter) : null
  const percent = selectedDevice ? Math.max(0, Math.min(100, (remaining! / rule.expected_life) * 100)) : null
  
  const isWarning = selectedDevice && remaining! <= rule.alert_margin
  const isCritical = selectedDevice && remaining! <= 0

  return (
    <div className={`avisos-rule-card ${isCritical ? 'is-critical' : ''}`}>
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
              <span className={`avisos-rule-badge ${isWarning ? 'is-warning' : ''}`}>
                {isCritical ? 'CRÍTICO' : isWarning ? 'Atención' : 'OK'}
              </span>
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
      </div>
      
      {selectedDevice && (
        <div className="avisos-rule-actions">
          <button 
            className="dashboard__btn dashboard__btn--primary"
            style={{ width: '100%', height: '44px' }}
            onClick={() => onRecordChange(rule)}
          >
            🛠️ Registrar Cambio
          </button>
        </div>
      )}
    </div>
  )
}
