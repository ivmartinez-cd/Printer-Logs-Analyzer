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
