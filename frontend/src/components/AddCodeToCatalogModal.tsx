import { useState, useEffect } from 'react'
import type { ErrorCodeUpsertBody, ErrorSolution } from '../types/api'
import { getErrorSolution } from '../services/api'

export interface AddCodeToCatalogModalProps {
  code: string
  initialDescription: string
  initialSeverity: string
  initialSolutionUrl?: string
  modelId?: string | null
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

type CpmdState = 'loading' | 'found' | 'not-found' | 'no-model'

export function AddCodeToCatalogModal({
  code,
  initialDescription,
  initialSeverity,
  initialSolutionUrl = '',
  modelId,
  title = 'Agregar código al catálogo',
  submitLabel = 'Agregar al catálogo',
  onSave,
  onClose,
  saving,
}: AddCodeToCatalogModalProps) {
  const [description, setDescription] = useState(initialDescription)
  const [solutionUrl, setSolutionUrl] = useState(initialSolutionUrl)
  const [severity, setSeverity] = useState(initialSeverity)
  const [cpmdState, setCpmdState] = useState<CpmdState>(modelId ? 'loading' : 'no-model')
  const [cpmdSolution, setCpmdSolution] = useState<ErrorSolution | null>(null)

  // Sync local state when the modal opens for a different code — intentional setState in effect
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setDescription(initialDescription)
    setSeverity(initialSeverity)
    setSolutionUrl(initialSolutionUrl)
  }, [code, initialDescription, initialSeverity, initialSolutionUrl])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Fetch CPMD solution when modelId or code changes — intentional setState in async callback
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!modelId) {
      setCpmdState('no-model')
      setCpmdSolution(null)
      return
    }
    setCpmdState('loading')
    setCpmdSolution(null)
    const controller = new AbortController()
    getErrorSolution(modelId, code, controller.signal)
      .then((sol) => {
        if (controller.signal.aborted) return
        if (sol) {
          setCpmdSolution(sol)
          setCpmdState('found')
        } else {
          setCpmdState('not-found')
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setCpmdState('not-found')
      })
    return () => controller.abort()
  }, [modelId, code])
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
          {/* HP CPMD solution panel */}
          <div className="add-code-modal__cpmd-section">
            <div className="add-code-modal__cpmd-header">
              <span className="add-code-modal__cpmd-icon" aria-hidden="true">📘</span>
              <span className="add-code-modal__cpmd-title">Solución oficial HP (CPMD)</span>
            </div>
            {cpmdState === 'loading' && (
              <div className="add-code-modal__cpmd-loading" aria-label="Cargando solución CPMD">
                <span className="log-modal__spinner" aria-hidden="true" />
                <span className="add-code-modal__cpmd-loading-text">Buscando en CPMD…</span>
              </div>
            )}
            {cpmdState === 'no-model' && (
              <p className="add-code-modal__cpmd-empty">
                Seleccioná un modelo en el panel principal para ver la solución del CPMD.
              </p>
            )}
            {cpmdState === 'not-found' && (
              <p className="add-code-modal__cpmd-empty">
                No hay información del CPMD para este código. Cargá el CPMD del modelo desde el
                modal de selección.
              </p>
            )}
            {cpmdState === 'found' && cpmdSolution && (
              <div className="add-code-modal__cpmd-body">
                {cpmdSolution.source_page != null && (
                  <span className="add-code-modal__cpmd-page">pág. {cpmdSolution.source_page}</span>
                )}
                {cpmdSolution.cause && (
                  <div className="add-code-modal__cpmd-block">
                    <strong className="add-code-modal__cpmd-block-title">Causa</strong>
                    <p className="add-code-modal__cpmd-text">{cpmdSolution.cause}</p>
                  </div>
                )}
                <div className="add-code-modal__cpmd-block">
                  <strong className="add-code-modal__cpmd-block-title">Pasos para el técnico</strong>
                  {cpmdSolution.technician_steps.length > 0 ? (
                    <ol className="add-code-modal__cpmd-steps">
                      {cpmdSolution.technician_steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  ) : (
                    <p className="add-code-modal__cpmd-text add-code-modal__cpmd-empty">
                      Sin pasos extraídos para este código.
                    </p>
                  )}
                </div>
                {cpmdSolution.frus.length > 0 && (
                  <div className="add-code-modal__cpmd-block">
                    <strong className="add-code-modal__cpmd-block-title">Repuestos</strong>
                    <ul className="add-code-modal__cpmd-frus">
                      {cpmdSolution.frus.map((fru, i) => (
                        <li key={i}>
                          <code className="add-code-modal__cpmd-pn">{fru.part_number}</code>
                          {fru.description && (
                            <span className="add-code-modal__cpmd-fru-desc"> — {fru.description}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {cpmdSolution.source_audience && (
                  <p className="add-code-modal__cpmd-source">
                    Fuente: sección {cpmdSolution.source_audience}
                  </p>
                )}
              </div>
            )}
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
