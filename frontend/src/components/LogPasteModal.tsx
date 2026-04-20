import { useState, useRef, useEffect } from 'react'

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
  const [manualExpanded, setManualExpanded] = useState(false)
  const [serialNumber, setSerialNumber] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  // Fetch models on mount


  useEffect(() => {
    if (!loading || !serverWasCold) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSlowWarning(false)
      return
    }
    const id = setTimeout(() => setSlowWarning(true), 3000)
    return () => clearTimeout(id)
  }, [loading, serverWasCold])


  return (
    <>
      <div
        className="log-modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="log-modal-title"
      >
        <div className="log-modal">
          <div className="log-modal__header">
            <h2 id="log-modal-title" className="log-modal__title">
              Nuevo Análisis de Logs
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

          <div className="log-modal__method-section" style={{ display: 'flex', flexDirection: 'column', paddingTop: '10px' }}>
            <div className="log-modal__model-section" style={{ paddingTop: '5px', marginBottom: "0" }}>
              <label className="log-modal__model-label" htmlFor="log-modal-serial-input">
                N° de serie del equipo
                <span className="log-modal__optional-hint"> (para extracción directa del portal SDS)</span>
              </label>
              <div className="log-modal__serial-input-wrapper" style={{ display: 'flex', gap: '8px' }}>
                <input
                  id="log-modal-serial-input"
                  type="text"
                  className="log-modal__serial-input"
                  placeholder="Ej: CNNCQ520HG"
                  style={{ flex: 1 }}
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value.toUpperCase())}
                  disabled={loading}
                  maxLength={50}
                  autoComplete="off"
                  spellCheck={false}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && serialNumber.length >= 5 && !loading) {
                      e.preventDefault()
                      onAnalyze('', undefined, null, serialNumber.trim(), true)
                    }
                  }}
                />
                <button
                  type="button"
                  className="dashboard__btn"
                  onClick={() => onAnalyze('', undefined, null, serialNumber.trim(), true)}
                  disabled={loading || serialNumber.length < 5}
                  style={{ whiteSpace: 'nowrap', minWidth: '160px' }}
                >
                  Extraer y Analizar
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', margin: '0.75rem 20px' }}>
            <div style={{ flex: 1, borderBottom: '1px solid var(--border-color)', opacity: 0.3 }}></div>
            <button 
              type="button"
              onClick={() => setManualExpanded(!manualExpanded)}
              style={{ 
                padding: '4px 12px', 
                background: 'rgba(255,255,255,0.04)', 
                border: '1px solid var(--border-color)', 
                borderRadius: '999px',
                fontSize: '0.75rem', 
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                margin: '0 12px'
              }}
            >
              {manualExpanded ? '🔼 Ocultar' : '🔽 Mostrar'} ingreso manual
            </button>
            <div style={{ flex: 1, borderBottom: '1px solid var(--border-color)', opacity: 0.3 }}></div>
          </div>

          {manualExpanded && (
            <div className="log-modal__method-section" style={{ transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', flex: 1 }}>

              <textarea
                ref={textareaRef}
                className="log-modal__textarea"
                placeholder="Pegar logs HP aquí..."
                value={logText}
                onChange={(e) => setLogText(e.target.value)}
                disabled={loading}
                style={{ minHeight: '120px', margin: '10px 20px 15px', flex: 1 }}
              />
              {error && <p className="dashboard__error" style={{ margin: '0 20px 10px' }}>{error}</p>}
              
              <div className="log-modal__manual-action" style={{ padding: '0 20px 15px', display: 'flex', justifyContent: 'flex-end' }}>
                 <button
                  type="button"
                  className="dashboard__btn"
                  onClick={() => {
                     onAnalyze(
                       logText,
                       undefined,
                       null,
                       undefined,
                       false
                     )
                  }}
                  disabled={loading || !logText.trim()}
                >
                  {loading ? 'Analizando...' : '🚀 Analizar (Manual)'}
                </button>
              </div>
            </div>
          )}

        <div className="log-modal__actions" style={{ padding: '12px 20px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="log-modal__btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cerrar
            </button>
          </div>
          {slowWarning && (
            <p className="log-modal__slow-warning">
              El servidor está iniciando, por favor esperá…
            </p>
          )}
        </div>
      </div>
    </>
  )
}
