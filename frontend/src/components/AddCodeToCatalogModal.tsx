import { useState, useEffect } from 'react'
import type { ErrorCodeUpsertBody } from '../types/api'

export interface AddCodeToCatalogModalProps {
  code: string
  initialDescription: string
  initialSeverity: string
  initialSolutionUrl?: string
  title?: string
  submitLabel?: string
  onSave: (body: ErrorCodeUpsertBody) => void | Promise<void>
  onClose: () => void
  saving: boolean
}

const SEVERITY_OPTIONS = [
  { value: 'INFO', label: 'Info' },
  { value: 'WARNING', label: 'Advertencia' },
  { value: 'ERROR', label: 'Error' },
]

export function AddCodeToCatalogModal({
  code,
  initialDescription,
  initialSeverity,
  initialSolutionUrl = '',
  title = 'Agregar código al catálogo',
  submitLabel = 'Agregar al catálogo',
  onSave,
  onClose,
  saving,
}: AddCodeToCatalogModalProps) {
  const [description, setDescription] = useState(initialDescription)
  const [solutionUrl, setSolutionUrl] = useState(initialSolutionUrl)
  const [severity, setSeverity] = useState(initialSeverity)

  // Sync local state when the modal opens for a different code — intentional setState in effect
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setDescription(initialDescription)
    setSeverity(initialSeverity)
    setSolutionUrl(initialSolutionUrl)
  }, [code, initialDescription, initialSeverity, initialSolutionUrl])
  /* eslint-enable react-hooks/set-state-in-effect */

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      code,
      severity: severity || null,
      description: description.trim() || null,
      solution_url: solutionUrl.trim() || null,
    })
  }

  return (
    <div
      className="log-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-code-modal-title"
    >
      <div className="log-modal add-code-modal" onClick={(e) => e.stopPropagation()}>
        <div className="log-modal__header">
          <h2 id="add-code-modal-title" className="log-modal__title">
            {title}
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
            <label className="add-code-modal__label" htmlFor="add-code-code">
              Código
            </label>
            <input
              id="add-code-code"
              type="text"
              className="add-code-modal__input add-code-modal__input--readonly"
              value={code}
              readOnly
              aria-readonly="true"
            />
          </div>
          <div className="add-code-modal__field">
            <label className="add-code-modal__label" htmlFor="add-code-severity">
              Severidad
            </label>
            <select
              id="add-code-severity"
              className="add-code-modal__input add-code-modal__select"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              disabled={saving}
            >
              {SEVERITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="add-code-modal__field">
            <label className="add-code-modal__label" htmlFor="add-code-description">
              Descripción (del log)
            </label>
            <textarea
              id="add-code-description"
              className="add-code-modal__textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción del código..."
              disabled={saving}
            />
          </div>
          <div className="add-code-modal__field">
            <label className="add-code-modal__label" htmlFor="add-code-solution-url">
              URL de la posible solución
            </label>
            <input
              id="add-code-solution-url"
              type="url"
              className="add-code-modal__input"
              value={solutionUrl}
              onChange={(e) => setSolutionUrl(e.target.value)}
              placeholder="https://..."
              disabled={saving}
            />
          </div>

          <div className="log-modal__actions">
            <button
              type="submit"
              className="dashboard__btn dashboard__btn--primary"
              disabled={saving}
            >
              {saving ? 'Guardando…' : submitLabel}
            </button>
            <button
              type="button"
              className="log-modal__btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
