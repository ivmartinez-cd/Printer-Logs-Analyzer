export interface ConfirmModalProps {
  /** Título del modal */
  title: string
  /** Mensaje o contenido principal */
  message: string
  /** Etiqueta del botón de confirmar (ej. "Borrar", "Aceptar") */
  confirmLabel: string
  /** Etiqueta del botón de cancelar */
  cancelLabel?: string
  /** Acción al confirmar */
  onConfirm: () => void | Promise<void>
  /** Acción al cancelar o cerrar */
  onCancel: () => void
  /** Si está en curso una acción async (deshabilita botones) */
  loading?: boolean
}

export function ConfirmModal({
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmModalProps) {
  async function handleConfirm() {
    await onConfirm()
  }

  return (
    <div
      className="log-modal-overlay"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
    >
      <div className="log-modal confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="log-modal__header">
          <h2 id="confirm-modal-title" className="log-modal__title">
            {title}
          </h2>
          <button
            type="button"
            className="log-modal__close"
            onClick={onCancel}
            aria-label="Cerrar"
            disabled={loading}
          >
            ×
          </button>
        </div>
        <p id="confirm-modal-desc" className="confirm-modal__message">
          {message}
        </p>
        <div className="log-modal__actions">
          <button
            type="button"
            className="dashboard__btn dashboard__btn--secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="dashboard__btn dashboard__btn--primary"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Espere…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
