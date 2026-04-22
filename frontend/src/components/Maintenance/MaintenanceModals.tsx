import React from 'react'

interface RuleModalProps {
  editingRule: any
  setEditingRule: (rule: any) => void
  onSave: (e: React.FormEvent) => void
  onClose: () => void
  saving: boolean
}

export function RuleModal({ editingRule, setEditingRule, onSave, onClose, saving }: RuleModalProps) {
  return (
    <div className="maintenance-modal-overlay">
      <div className="maintenance-modal">
        <h3>{editingRule.id ? 'Editar Regla Maestra' : 'Nueva Regla Maestra'}</h3>
        <form onSubmit={onSave} className="maintenance-form" style={{ marginTop: '20px' }}>
          <div className="form-group">
            <label>Familia de Modelo (ej: 50145)</label>
            <input 
              type="text" 
              className="form-input"
              placeholder="Ej: 50145"
              value={editingRule.model_family}
              onChange={e => setEditingRule({...editingRule, model_family: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Componente</label>
            <input 
              type="text" 
              className="form-input"
              placeholder="Ej: Fuser Kit, Roller..."
              value={editingRule.component_type}
              onChange={e => setEditingRule({...editingRule, component_type: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Vida Útil Esperada (págs)</label>
            <input 
              type="number" 
              className="form-input"
              value={editingRule.expected_life}
              onChange={e => setEditingRule({...editingRule, expected_life: parseInt(e.target.value)})}
              required
            />
          </div>
          <div className="form-group">
            <label>Margen de Alerta (págs antes)</label>
            <input 
              type="number" 
              className="form-input"
              value={editingRule.alert_margin}
              onChange={e => setEditingRule({...editingRule, alert_margin: parseInt(e.target.value)})}
              required
            />
          </div>
          <div className="form-group">
            <label>Emails (separados por coma)</label>
            <input 
              type="text" 
              className="form-input"
              placeholder="ejemplo@correo.com"
              value={editingRule.email_recipients}
              onChange={e => setEditingRule({...editingRule, email_recipients: e.target.value})}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="dashboard__btn dashboard__btn--secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="dashboard__btn dashboard__btn--primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Regla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface RecordChangeModalProps {
  recordingData: any
  setRecordingData: (data: any) => void
  currentCounter: number
  onSave: (e: React.FormEvent) => void
  onClose: () => void
  recording: boolean
}

export function RecordChangeModal({ 
  recordingData, 
  setRecordingData, 
  currentCounter, 
  onSave, 
  onClose, 
  recording 
}: RecordChangeModalProps) {
  return (
    <div className="maintenance-modal-overlay">
      <div className="maintenance-modal">
        <h3>🛠️ Registrar Cambio de Componente</h3>
        <p style={{ marginBottom: '20px', opacity: 0.7, fontSize: '0.9rem' }}>
          Se registrará el cambio de <strong>{recordingData.component_type}</strong> para el equipo {recordingData.serial} con el contador actual de <strong>{currentCounter.toLocaleString()}</strong> págs.
        </p>
        <form onSubmit={onSave} className="maintenance-form">
          <div className="form-group">
            <label>Nº de Incidente (Opcional)</label>
            <input 
              type="text" 
              className="form-input"
              placeholder="Ej: INC-12345"
              value={recordingData.incident_number}
              onChange={e => setRecordingData({...recordingData, incident_number: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Notas del Técnico</label>
            <textarea 
              className="form-input"
              rows={3}
              placeholder="Detalles del cambio..."
              value={recordingData.notes}
              onChange={e => setRecordingData({...recordingData, notes: e.target.value})}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="dashboard__btn dashboard__btn--secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="dashboard__btn dashboard__btn--primary" disabled={recording}>
              {recording ? 'Registrando...' : 'Confirmar Cambio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface StateModalProps {
  stateEditingData: any
  setStateEditingData: (data: any) => void
  currentCounter: number
  onSave: (e: React.FormEvent) => void
  onClose: () => void
  updating: boolean
}

export function StateModal({
  stateEditingData,
  setStateEditingData,
  currentCounter,
  onSave,
  onClose,
  updating
}: StateModalProps) {
  return (
    <div className="maintenance-modal-overlay">
      <div className="maintenance-modal">
        <h3>⚙️ Ajustar Último Cambio</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.9rem' }}>
          Ajusta manualmente el contador en el que se realizó el último cambio para este equipo.
        </p>
        <form onSubmit={onSave} className="maintenance-form">
          <div className="form-group">
            <label>Componente</label>
            <input className="form-input" value={stateEditingData.component_type} disabled />
          </div>
          <div className="form-group">
            <label>Contador del Último Cambio (Páginas)</label>
            <input 
              className="form-input"
              type="number" 
              value={stateEditingData.last_change_counter}
              onChange={e => setStateEditingData({...stateEditingData, last_change_counter: parseInt(e.target.value)})}
              required
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              Contador actual del equipo: {currentCounter.toLocaleString()}
            </span>
          </div>
          <div className="form-actions">
            <button type="button" onClick={onClose} className="dashboard__btn dashboard__btn--secondary">Cancelar</button>
            <button type="submit" disabled={updating} className="dashboard__btn dashboard__btn--primary">
              {updating ? 'Guardando...' : 'Guardar Ajuste'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface HowItWorksModalProps {
  onClose: () => void
}

export function HowItWorksModal({ onClose }: HowItWorksModalProps) {
  return (
    <div className="maintenance-modal-overlay" onClick={onClose}>
      <div className="maintenance-modal maintenance-modal--wide" onClick={e => e.stopPropagation()}>
        <div className="hiw-header">
          <div>
            <h3 style={{ margin: 0 }}>¿Cómo funciona el módulo de Avisos?</h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', opacity: 0.5 }}>
              Sistema de mantenimiento preventivo por contador de motor
            </p>
          </div>
          <button className="hiw-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="hiw-body">

          <div className="hiw-section hiw-section--setup">
            <div className="hiw-step-number">1</div>
            <div className="hiw-step-content">
              <h4>Configuración inicial</h4>
              <p>
                Se crea una <strong>familia de modelo</strong> (ej: "50145") y se definen
                las <strong>reglas maestras</strong> para esa familia: tipo de componente (Fuser Kit),
                vida útil en páginas, margen de alerta y destinatarios de email.
                Las reglas aplican a todos los equipos del mismo modelo.
              </p>
            </div>
          </div>

          <div className="hiw-section hiw-section--discover">
            <div className="hiw-step-number">2</div>
            <div className="hiw-step-content">
              <h4>Descubrimiento de equipos</h4>
              <p>
                <strong>"Buscar Equipos en SDS"</strong> consulta la API de HP Insight para
                encontrar todos los dispositivos cuyo modelo contenga el nombre de la familia.
                Los equipos encontrados se agregan automáticamente a la lista de monitoreo.
              </p>
            </div>
          </div>

          <div className="hiw-section hiw-section--sync">
            <div className="hiw-step-number">3</div>
            <div className="hiw-step-content">
              <h4>Primera sincronización — modo silencioso</h4>
              <p>
                Usar <strong>"Sincronización Silenciosa"</strong> la primera vez. Lee los
                contadores actuales de Insight y los guarda como <em>baseline</em> para cada
                equipo. Esto evita que impresoras con uso previo disparen alertas falsas
                en su primer ciclo.
              </p>
              <div className="hiw-callout">
                El contador nunca se resetea en el motor. El sistema registra <strong>en qué
                página se hizo el último cambio</strong> y calcula la diferencia.
              </div>
            </div>
          </div>

          <div className="hiw-section hiw-section--formula">
            <div className="hiw-step-number">4</div>
            <div className="hiw-step-content">
              <h4>Cálculo de páginas restantes</h4>
              <div className="hiw-formula">
                <span className="hiw-formula-item">Próximo cambio</span>
                <span className="hiw-formula-op">=</span>
                <span className="hiw-formula-item">Contador del último cambio</span>
                <span className="hiw-formula-op">+</span>
                <span className="hiw-formula-item">Vida útil</span>
              </div>
              <div className="hiw-formula" style={{ marginTop: '8px' }}>
                <span className="hiw-formula-item">Restantes</span>
                <span className="hiw-formula-op">=</span>
                <span className="hiw-formula-item">Próximo cambio</span>
                <span className="hiw-formula-op">−</span>
                <span className="hiw-formula-item">Contador actual</span>
              </div>
              <p style={{ marginTop: '10px' }}>
                Cuando <strong>Restantes ≤ Margen de alerta</strong> el sistema entra en
                zona de aviso. El contador viene de la API de HP Insight y puede tener
                un desfase de 1–4 horas respecto al valor real de la impresora.
              </p>
            </div>
          </div>

          <div className="hiw-section hiw-section--alert">
            <div className="hiw-step-number">5</div>
            <div className="hiw-step-content">
              <h4>Alerta por email</h4>
              <p>
                Al sincronizar con <strong>"Sincronizar Familia"</strong>, si un equipo está
                en zona de aviso se envía un email a los destinatarios configurados en la regla.
                Para evitar spam, no se vuelve a enviar hasta que el equipo imprima
                500 páginas más — tiempo suficiente para abrir un incidente.
              </p>
            </div>
          </div>

          <div className="hiw-section hiw-section--incident">
            <div className="hiw-step-number">6</div>
            <div className="hiw-step-content">
              <h4>Abrir incidente</h4>
              <p>
                Al recibir el email, el técnico busca el equipo en la app y hace clic en
                <strong> "🎫 Abrir Incidente"</strong>. Se carga el número de incidente del
                sistema externo. A partir de ese momento <strong>no se envían más alertas</strong>
                para ese componente hasta que el incidente sea cerrado. La card muestra
                un badge violeta con el número de incidente.
              </p>
            </div>
          </div>

          <div className="hiw-section hiw-section--close">
            <div className="hiw-step-number">7</div>
            <div className="hiw-step-content">
              <h4>Cerrar incidente y registrar reemplazo</h4>
              <p>
                Una vez reemplazado el componente, el técnico hace clic en
                <strong> "✅ Cerrar Incidente y Registrar Reemplazo"</strong>.
                El sistema registra el cambio en el historial con el contador actual
                como nuevo baseline, cierra el incidente y reactiva las alertas
                para el próximo ciclo de vida.
              </p>
            </div>
          </div>

          <div className="hiw-section hiw-section--direct">
            <div className="hiw-step-number">8</div>
            <div className="hiw-step-content">
              <h4>Cambio directo (sin incidente previo)</h4>
              <p>
                <strong>"🛠️ Registrar Cambio Directo"</strong> permite registrar un reemplazo
                preventivo cuando el componente aún no llegó al margen de alerta.
                Resetea el baseline al contador actual sin pasar por el flujo de incidentes.
              </p>
            </div>
          </div>

          <div className="hiw-section hiw-section--adjust">
            <div className="hiw-step-number">9</div>
            <div className="hiw-step-content">
              <h4>Ajuste manual</h4>
              <p>
                <strong>"⚙️ Ajustar"</strong> permite corregir el contador del último cambio
                manualmente. Útil si el fusor fue reemplazado antes de incorporar el equipo
                al sistema o si se cargó un valor incorrecto.
              </p>
            </div>
          </div>

        </div>

        <div className="form-actions" style={{ marginTop: '24px' }}>
          <button className="dashboard__btn dashboard__btn--primary" onClick={onClose} style={{ width: '100%' }}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}

interface OpenIncidentModalProps {
  data: any
  setData: (data: any) => void
  onSave: (e: React.FormEvent) => void
  onClose: () => void
  saving: boolean
}

export function OpenIncidentModal({ data, setData, onSave, onClose, saving }: OpenIncidentModalProps) {
  return (
    <div className="maintenance-modal-overlay">
      <div className="maintenance-modal">
        <h3>🎫 Abrir Incidente de Mantenimiento</h3>
        <p style={{ marginBottom: '20px', opacity: 0.7, fontSize: '0.9rem' }}>
          Al cargar el incidente, las alertas por email quedarán suspendidas hasta que sea cerrado.
        </p>
        <form onSubmit={onSave} className="maintenance-form">
          <div className="form-group">
            <label>Componente</label>
            <input className="form-input" value={data.component_type} disabled />
          </div>
          <div className="form-group">
            <label>Nº de Incidente *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej: INC-20240422-001"
              value={data.incident_number}
              onChange={e => setData({ ...data, incident_number: e.target.value })}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Notas (Opcional)</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="Ej: Fusor pedido, llegada estimada 25/04..."
              value={data.notes}
              onChange={e => setData({ ...data, notes: e.target.value })}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="dashboard__btn dashboard__btn--secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="dashboard__btn dashboard__btn--primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Abrir Incidente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface CloseIncidentModalProps {
  data: any
  setData: (data: any) => void
  onSave: (e: React.FormEvent) => void
  onClose: () => void
  saving: boolean
}

export function CloseIncidentModal({ data, setData, onSave, onClose, saving }: CloseIncidentModalProps) {
  return (
    <div className="maintenance-modal-overlay">
      <div className="maintenance-modal">
        <h3>✅ Cerrar Incidente y Registrar Reemplazo</h3>
        <p style={{ marginBottom: '20px', opacity: 0.7, fontSize: '0.9rem' }}>
          Se registrará el reemplazo de <strong>{data.component_type}</strong> y el contador se reiniciará desde el valor actual. El incidente <strong>{data.incident_number}</strong> quedará cerrado.
        </p>
        <form onSubmit={onSave} className="maintenance-form">
          <div className="form-group">
            <label>Nº de Incidente</label>
            <input className="form-input" value={data.incident_number} disabled />
          </div>
          <div className="form-group">
            <label>Notas del Técnico (Opcional)</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Ej: Reemplazado fusor original por kit HP CF281A..."
              value={data.notes}
              onChange={e => setData({ ...data, notes: e.target.value })}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="dashboard__btn dashboard__btn--secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="dashboard__btn dashboard__btn--primary" disabled={saving}>
              {saving ? 'Cerrando...' : 'Confirmar Reemplazo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface NewFamilyModalProps {
  onSave: (family: string) => void
  onClose: () => void
}

export function NewFamilyModal({ onSave, onClose }: NewFamilyModalProps) {
  const [name, setName] = React.useState('')
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) onSave(name.trim())
  }

  return (
    <div className="maintenance-modal-overlay">
      <div className="maintenance-modal">
        <h3>📂 Nueva Familia de Equipos</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.9rem' }}>
          Crea un nuevo grupo de configuración maestra para un modelo de impresora.
        </p>
        <form onSubmit={handleSubmit} className="maintenance-form">
          <div className="form-group">
            <label>Nombre de la Familia</label>
            <input 
              className="form-input"
              placeholder="Ej: 52645, MFP E876, etc."
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="form-actions">
            <button type="button" onClick={onClose} className="dashboard__btn dashboard__btn--secondary">Cancelar</button>
            <button type="submit" className="dashboard__btn dashboard__btn--primary">Crear Familia</button>
          </div>
        </form>
      </div>
    </div>
  )
}
