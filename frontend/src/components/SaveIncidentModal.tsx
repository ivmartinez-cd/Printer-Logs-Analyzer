import React, { useState, useEffect } from 'react'

export interface SaveIncidentModalProps {
  onSave: (name: string, equipmentIdentifier: string | null) => void | Promise<void>
  onClose: () => void
  saving: boolean
  initialEquipment?: string | null
  initialName?: string | null
}

export function SaveIncidentModal({ 
  onSave, 
  onClose, 
  saving, 
  initialEquipment,
  initialName 
}: SaveIncidentModalProps) {
  const [name, setName] = useState(initialName || '')
  const [equipment, setEquipment] = useState(initialEquipment || '')

  // Update if props change while open
  useEffect(() => {
    if (initialEquipment && !equipment) {
      requestAnimationFrame(() => setEquipment(initialEquipment))
    }
  }, [initialEquipment, equipment])

  useEffect(() => {
    if (initialName && !name) {
      requestAnimationFrame(() => setName(initialName))
    }
  }, [initialName, name])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return
    onSave(trimmedName, equipment.trim() || null)
  }

  return (
    <div
      className="log-modal-overlay animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-incident-modal-title"
    >
      <div className="log-modal add-code-modal save-incident-modal">
        <div className="log-modal__header">
          <div className="log-modal__header-content">
            <h2 id="save-incident-modal-title" className="log-modal__title">
              Guardar como incidente
            </h2>
            <p className="log-modal__subtitle">
              Sincronizar este análisis con la base de datos persistente.
            </p>
          </div>
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
              Nombre de la sesión
            </label>
            <input
              id="save-incident-name"
              type="text"
              className="add-code-modal__input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Análisis de falla de fusor"
              required
              disabled={saving}
              autoFocus
            />
          </div>

          <div className="add-code-modal__field">
            <div className="save-incident-modal__label-row">
              <label className="add-code-modal__label" htmlFor="save-incident-equipment">
                Identificador del equipo
              </label>
              {initialEquipment && (
                <span className="save-incident-modal__badge">Detectado</span>
              )}
            </div>
            <input
              id="save-incident-equipment"
              type="text"
              className="add-code-modal__input"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              placeholder="Nombre del modelo o Serie"
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
              {saving ? (
                <>
                  <span className="spinner-small" /> Guardando…
                </>
              ) : (
                'Confirmar y Guardar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
