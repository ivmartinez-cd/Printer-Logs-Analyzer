import { useEffect, useState } from 'react'
import { getSolutionProxy } from '../../services/api'

export interface SolutionContentModalProps {
  code: string
  modelId?: string | null
  sdsContent?: string | null
  sdsUrl?: string | null
  onClose: () => void
}

export function SolutionContentModal({
  code,
  sdsContent: initialContent,
  sdsUrl,
  onClose,
}: SolutionContentModalProps) {
  const isKaaS = sdsUrl?.includes('kaas.hpcloud.hp.com')
  const shouldFetchLive = !initialContent || isKaaS
  
  const [content, setContent] = useState<string | null>(initialContent || null)
  const [loading, setLoading] = useState(shouldFetchLive)
  const [source, setSource] = useState<'cache' | 'live'>(initialContent ? 'cache' : 'live')

  useEffect(() => {
    // If we have a URL but no content, or it's a KaaS URL, try to fetch live via proxy
    if (shouldFetchLive) {
      getSolutionProxy(code)
        .then((res) => {
          if (res.content) {
            setContent(res.content)
            setSource(res.source)
          }
        })
        .catch((err) => {
          console.error('Error fetching live solution:', err)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [code, initialContent, sdsUrl, shouldFetchLive])

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
            Solución técnica {loading && '— Cargando...'}
          </h2>
          <button type="button" className="log-modal__close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <div className="solution-content-modal__tab-content">
          {sdsUrl && (
            <p className="solution-content-modal__source">
              Fuente:{' '}
              <a
                href={sdsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="solution-content-modal__url"
              >
                HP Portal
              </a>{' '}
              <span className="solution-content-modal__url-warning">
                ({source === 'live' ? 'contenido actualizado en vivo' : 'versión guardada'})
              </span>
            </p>
          )}

          {loading ? (
            <div className="solution-content-modal__empty">
              <span className="log-modal__spinner"></span>
              Consultando portal HP con tus credenciales...
            </div>
          ) : content ? (
            <pre className="solution-content-modal__body">{content}</pre>
          ) : (
            <p className="solution-content-modal__empty">
              {sdsUrl 
                ? 'No se pudo recuperar el contenido. El link puede estar vencido o las credenciales SDS son incorrectas.'
                : 'Sin información disponible para este código.'}
            </p>
          )}
        </div>

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


