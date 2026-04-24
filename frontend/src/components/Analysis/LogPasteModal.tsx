import { useState, useRef, useEffect } from 'react'
import { Portal } from '../ui/Portal'

export interface LogPasteModalProps {
  loading: boolean
  error: string | null
  serverWasCold: boolean
  onAnalyze: (
    logText: string,
    fileName?: string,
    modelFamily?: string | null,
    serial?: string | null,
    isAutomated?: boolean
  ) => void
  onClose: () => void
}

export function LogPasteModal({
  loading,
  error,
  serverWasCold,
  onAnalyze,
  onClose,
}: LogPasteModalProps) {
  const [logText, setLogText] = useState('')
  const [slowWarning, setSlowWarning] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!loading || !serverWasCold) return
    
    const id = setTimeout(() => setSlowWarning(true), 3000)
    return () => {
      clearTimeout(id)
      setSlowWarning(false)
    }
  }, [loading, serverWasCold])


  return (
    <Portal>
      <div
        className="log-modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="log-modal-title"
      >
        <div className="log-modal">
          <div className="log-modal__header">
            <h2 id="log-modal-title" className="log-modal__title">
              Análisis Manual de Logs
            </h2>
            <button
              type="button"
              className="log-modal__close"
              onClick={onClose}
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>

          <div className="log-modal__manual-container" style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingTop: '12px' }}>
            <textarea
              ref={textareaRef}
              className="log-modal__textarea"
              placeholder="Pegar logs HP aquí para analizar..."
              value={logText}
              onChange={(e) => setLogText(e.target.value)}
              disabled={loading}
              style={{ minHeight: '250px' }}
            />
            {error && <p className="dashboard__error" style={{ margin: '0 32px 12px' }}>{error}</p>}
            
            <div className="log-modal__manual-action" style={{ padding: '0 32px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-dim)', maxWidth: '240px' }}>
                 Pegá el contenido completo del log para una detección automática del modelo.
               </p>
               <button
                type="button"
                className="dashboard__btn dashboard__btn--vibrant"
                onClick={() => onAnalyze(logText, undefined, null, undefined, false)}
                disabled={loading || !logText.trim()}
                style={{ padding: '0 32px', height: '48px' }}
              >
                {loading ? 'Analizando...' : '🚀 Iniciar Análisis'}
              </button>
            </div>
          </div>

          <div className="log-modal__actions">
            <button
              type="button"
              className="log-modal__btn-secondary"
              onClick={onClose}
              disabled={loading}
              style={{ marginLeft: 'auto' }}
            >
              Cerrar
            </button>
          </div>
          
          {slowWarning && (
            <div className="log-modal__slow-warning">
              El servidor está iniciando, por favor esperá…
            </div>
          )}
        </div>
      </div>
    </Portal>
  )
}


