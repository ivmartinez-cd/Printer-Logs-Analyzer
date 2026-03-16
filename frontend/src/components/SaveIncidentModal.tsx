import React, { useState } from 'react'

export interface SaveIncidentModalProps {
  onSave: (name: string, equipmentIdentifier: string | null) => void | Promise<void>
  onClose: () => void
  saving: boolean
}

export function SaveIncidentModal({
  onSave,
  onClose,
  saving,
}: SaveIncidentModalProps) {
  const [name, setName] = useState('')
  const [equipment, setEquipment] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return
    onSave(trimmedName, equipment.trim() || null)
  }

  return (
    <div
      className="log-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-incident-modal-title"
    >
      <div className="log-modal add-code-modal" onClick={(e) => e.stopPropagation()}>
        <div className="log-modal__header">
          <h2 id="save-incident-modal-title" className="log-modal__title">
            Guardar como incidente
          </h2>
          <button
            type="button"
            className="log-modal__close"
            onClick={onClose}
            aria-label="Cerrar"
            disabled={saving}
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="add-code-modal__form">
          <div className="add-code-modal__field">
            <label className="add-code-modal__label" htmlFor="save-incident-name">
              Nombre
            </label>
            <input
              id="save-incident-name"
              type="text"
              className="add-code-modal__input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Equipo 3 - 14-mar"
              required
              disabled={saving}
              autoFocus
            />
          </div>
          <div className="add-code-modal__field">
            <label className="add-code-modal__label" htmlFor="save-incident-equipment">
              Equipo (opcional)
            </label>
            <input
              id="save-incident-equipment"
              type="text"
              className="add-code-modal__input"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              placeholder="Ej: HP OfficeJet 3"
              disabled={saving}
            />
          </div>
          <div className="log-modal__actions">
            <button
              type="button"
              className="dashboard__btn dashboard__btn--secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="dashboard__btn dashboard__btn--primary"
              disabled={saving || !name.trim()}
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
