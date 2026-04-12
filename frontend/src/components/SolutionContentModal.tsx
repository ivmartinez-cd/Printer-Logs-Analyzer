export interface SolutionContentModalProps {
  content: string
  url?: string | null
  onClose: () => void
}

export function SolutionContentModal({ content, url, onClose }: SolutionContentModalProps) {
  return (
    <div
      className="log-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="solution-modal-title"
    >
      <div className="log-modal solution-content-modal">
        <div className="log-modal__header">
          <h2 id="solution-modal-title" className="log-modal__title">
            Contenido de solución guardado
          </h2>
          <button type="button" className="log-modal__close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        {url && (
          <p className="solution-content-modal__source">
            Fuente:{' '}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="solution-content-modal__url"
              title="Este link puede haber vencido"
            >
              {url}
            </a>{' '}
            <span className="solution-content-modal__url-warning">
              (el link puede haber vencido)
            </span>
          </p>
        )}
        <pre className="solution-content-modal__body">{content}</pre>
        <div className="log-modal__actions">
          <button
            type="button"
            className="dashboard__btn dashboard__btn--secondary"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
