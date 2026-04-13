import { useState, useEffect } from 'react'
import type { ErrorSolution } from '../types/api'
import { getErrorSolution } from '../services/api'

export interface SolutionContentModalProps {
  code: string
  modelId?: string | null
  sdsContent?: string | null
  sdsUrl?: string | null
  onClose: () => void
}

type CpmdFetchState = 'idle' | 'loading' | 'found' | 'not-found'
type ActiveTab = 'sds' | 'cpmd'

export function SolutionContentModal({
  code,
  modelId,
  sdsContent,
  sdsUrl,
  onClose,
}: SolutionContentModalProps) {
  const [cpmdState, setCpmdState] = useState<CpmdFetchState>(modelId ? 'loading' : 'idle')
  const [cpmdSolution, setCpmdSolution] = useState<ErrorSolution | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>('cpmd')

  const hasSds = !!(sdsContent || sdsUrl)
  const showTabs = hasSds && !!modelId

  // Fetch CPMD solution when modelId or code changes — intentional setState in async callback
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!modelId) {
      setCpmdState('idle')
      setCpmdSolution(null)
      setActiveTab('sds')
      return
    }
    setCpmdState('loading')
    setCpmdSolution(null)
    setActiveTab('cpmd')
    const controller = new AbortController()
    getErrorSolution(modelId, code, controller.signal)
      .then((sol) => {
        if (controller.signal.aborted) return
        if (sol) {
          setCpmdSolution(sol)
          setCpmdState('found')
          setActiveTab('cpmd')
        } else {
          setCpmdState('not-found')
          setActiveTab('sds')
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setCpmdState('not-found')
          setActiveTab('sds')
        }
      })
    return () => controller.abort()
  }, [modelId, code])
  /* eslint-enable react-hooks/set-state-in-effect */

  const neitherAvailable = !hasSds && (cpmdState === 'not-found' || cpmdState === 'idle')

  return (
    <div
      className="log-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="solution-modal-title"
    >
      <div className="log-modal solution-content-modal" onClick={(e) => e.stopPropagation()}>
        <div className="log-modal__header">
          <h2 id="solution-modal-title" className="log-modal__title">
            Contenido de solución guardado
          </h2>
          <button type="button" className="log-modal__close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        {/* Tab strip — solo visible cuando hay SDS y modelo CPMD */}
        {showTabs && (
          <div className="solution-content-modal__tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'sds'}
              className={`solution-content-modal__tab${activeTab === 'sds' ? ' solution-content-modal__tab--active' : ''}`}
              onClick={() => setActiveTab('sds')}
            >
              Solución SDS
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'cpmd'}
              className={`solution-content-modal__tab${activeTab === 'cpmd' ? ' solution-content-modal__tab--active' : ''}`}
              onClick={() => setActiveTab('cpmd')}
            >
              📘 Solución CPMD
            </button>
          </div>
        )}

        {/* Contenido */}
        {neitherAvailable ? (
          <p className="solution-content-modal__empty">Sin información disponible para este código.</p>
        ) : (
          <>
            {/* Tab SDS — visible cuando: (showTabs y tab activo es sds) ó (no hay tabs y hay SDS) */}
            {(!showTabs ? hasSds : activeTab === 'sds') && (
              <div className="solution-content-modal__tab-content">
                {sdsUrl && (
                  <p className="solution-content-modal__source">
                    Fuente:{' '}
                    <a
                      href={sdsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="solution-content-modal__url"
                      title="Este link puede haber vencido"
                    >
                      {sdsUrl}
                    </a>{' '}
                    <span className="solution-content-modal__url-warning">
                      (el link puede haber vencido)
                    </span>
                  </p>
                )}
                {sdsContent ? (
                  <pre className="solution-content-modal__body">{sdsContent}</pre>
                ) : (
                  <p className="solution-content-modal__empty">
                    Contenido SDS no guardado. El link puede estar disponible arriba.
                  </p>
                )}
              </div>
            )}

            {/* Tab CPMD — visible cuando: (showTabs y tab activo es cpmd) ó (no hay tabs y hay modelo) */}
            {(!showTabs ? !!modelId : activeTab === 'cpmd') && (
              <div className="solution-content-modal__tab-content solution-content-modal__tab-content--cpmd">
                {cpmdState === 'loading' && (
                  <div
                    className="solution-content-modal__cpmd-loading"
                    aria-label="Cargando solución CPMD"
                  >
                    <span className="log-modal__spinner" aria-hidden="true" />
                    <span>Buscando en CPMD…</span>
                  </div>
                )}
                {cpmdState === 'not-found' && (
                  <p className="solution-content-modal__empty">
                    No hay información del CPMD para este código.
                  </p>
                )}
                {cpmdState === 'found' && cpmdSolution && (
                  <div className="solution-content-modal__cpmd-body">
                    {cpmdSolution.source_page != null && (
                      <span className="solution-content-modal__cpmd-page">
                        pág. {cpmdSolution.source_page}
                      </span>
                    )}
                    {cpmdSolution.cause && (
                      <div className="solution-content-modal__cpmd-block">
                        <strong className="solution-content-modal__cpmd-block-title">Causa</strong>
                        <p className="solution-content-modal__cpmd-text">{cpmdSolution.cause}</p>
                      </div>
                    )}
                    <div className="solution-content-modal__cpmd-block">
                      <strong className="solution-content-modal__cpmd-block-title">
                        Pasos para el técnico
                      </strong>
                      {cpmdSolution.technician_steps.length > 0 ? (
                        <ol className="solution-content-modal__cpmd-steps">
                          {cpmdSolution.technician_steps.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                      ) : (
                        <p className="solution-content-modal__cpmd-text solution-content-modal__empty">
                          Sin pasos extraídos para este código.
                        </p>
                      )}
                    </div>
                    {cpmdSolution.frus.length > 0 && (
                      <div className="solution-content-modal__cpmd-block">
                        <strong className="solution-content-modal__cpmd-block-title">Repuestos</strong>
                        <ul className="solution-content-modal__cpmd-frus">
                          {cpmdSolution.frus.map((fru, i) => (
                            <li key={i}>
                              <code className="solution-content-modal__cpmd-pn">
                                {fru.part_number}
                              </code>
                              {fru.description && (
                                <span className="solution-content-modal__cpmd-fru-desc">
                                  {' '}
                                  — {fru.description}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {cpmdSolution.source_audience && (
                      <p className="solution-content-modal__cpmd-source">
                        Fuente: sección {cpmdSolution.source_audience}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

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
