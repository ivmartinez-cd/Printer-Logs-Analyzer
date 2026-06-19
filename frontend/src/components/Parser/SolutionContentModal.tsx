import { useEffect, useState } from 'react'
import { Portal } from '../ui/Portal'
import { getSolutionProxy } from '../../services/api'

export interface SolutionContentModalProps {
  code: string
  modelId?: string | null
  sdsContent?: string | null
  sdsUrl?: string | null
  cpmdContent?: string | null
  onClose: () => void
}

export function SolutionContentModal({
  code,
  sdsContent: initialContent,
  sdsUrl,
  cpmdContent,
  onClose,
}: SolutionContentModalProps) {
  const isKaaS = sdsUrl?.includes('kaas.hpcloud.hp.com')
  const shouldFetchLive = !initialContent || isKaaS
  
  const [content, setContent] = useState<string | null>(initialContent || null)
  const [loading, setLoading] = useState(shouldFetchLive)
  const [source, setSource] = useState<'cache' | 'live'>(initialContent ? 'cache' : 'live')
  const [liveUrl, setLiveUrl] = useState<string | null>(sdsUrl || null)
  
  const hasCpmd = !!cpmdContent?.trim()
  const hasSds = shouldFetchLive || !!content?.trim() || !!sdsUrl?.trim()
  const [activeTab, setActiveTab] = useState<'cpmd' | 'sds'>(hasCpmd ? 'cpmd' : 'sds')

  useEffect(() => {
    // If we have a URL but no content, or it's a KaaS URL, try to fetch live via proxy
    if (shouldFetchLive) {
      getSolutionProxy(code)
        .then((res) => {
          if (res.content) {
            setContent(res.content)
            setSource(res.source)
            if (res.url) setLiveUrl(res.url)
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
    <Portal>
      <div
        className="log-modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="solution-modal-title"
        style={{ zIndex: 11000 }}
      >
        <div className="log-modal solution-content-modal">
          <div className="log-modal__header">
            <h2 id="solution-modal-title" className="log-modal__title">
              Solución técnica {loading && activeTab === 'sds' && '— Cargando...'}
            </h2>
            <button type="button" className="log-modal__close" onClick={onClose} aria-label="Cerrar">
              ×
            </button>
          </div>

          {hasCpmd && hasSds && (
            <div className="solution-content-modal__tabs">
              <button
                type="button"
                className={`solution-content-modal__tab ${activeTab === 'cpmd' ? 'solution-content-modal__tab--active' : ''}`}
                onClick={() => setActiveTab('cpmd')}
              >
                Manual CPMD
              </button>
              <button
                type="button"
                className={`solution-content-modal__tab ${activeTab === 'sds' ? 'solution-content-modal__tab--active' : ''}`}
                onClick={() => setActiveTab('sds')}
              >
                Catálogo / Portal HP
              </button>
            </div>
          )}

          <div className="solution-content-modal__tab-content">
            {activeTab === 'cpmd' && hasCpmd && (
              <pre className="solution-content-modal__body">{cpmdContent}</pre>
            )}

            {activeTab === 'sds' && (
              <>
                {(sdsUrl || liveUrl || source === 'live') && (
                  <p className="solution-content-modal__source">
                    Fuente:{' '}
                    {sdsUrl || liveUrl ? (
                      <a
                        href={sdsUrl || liveUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="solution-content-modal__url"
                      >
                        HP Portal
                      </a>
                    ) : (
                      <span className="solution-content-modal__url">HP Portal</span>
                    )}{' '}
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
                    {sdsUrl || liveUrl
                      ? 'No se pudo recuperar el contenido. El link puede estar vencido o las credenciales SDS son incorrectas.'
                      : 'Sin información disponible para este código.'}
                  </p>
                )}
              </>
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
    </Portal>
  )
}


