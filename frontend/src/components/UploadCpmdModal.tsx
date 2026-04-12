import React, { useRef, useState } from 'react'
import { uploadCpmd } from '../services/api'
import type { IngestReport } from '../types/api'

const MAX_PDF_BYTES = 20 * 1024 * 1024 // 20 MB

interface UploadCpmdModalProps {
  modelId: string
  modelName: string
  onClose: () => void
  onSuccess: (report: IngestReport) => void
}

type Stage = 'idle' | 'uploading' | 'done' | 'error'

export function UploadCpmdModal({ modelId, modelName, onClose, onSuccess }: UploadCpmdModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const [stage, setStage] = useState<Stage>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [report, setReport] = useState<IngestReport | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_PDF_BYTES) {
      setErrorMsg('El PDF supera el límite de 20 MB.')
      setStage('error')
      return
    }
    startUpload(file)
  }

  async function startUpload(file: File) {
    setStage('uploading')
    setErrorMsg(null)
    setReport(null)
    abortRef.current = new AbortController()
    try {
      const result = await uploadCpmd(modelId, file, abortRef.current.signal)
      setReport(result)
      setStage('done')
      onSuccess(result)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setStage('idle')
        return
      }
      const msg = err instanceof Error ? err.message : String(err)
      setErrorMsg(msg)
      setStage('error')
    }
  }

  function handleCancel() {
    abortRef.current?.abort()
    onClose()
  }

  function handleOverlayClick() {
    if (stage !== 'uploading') onClose()
  }

  const isUploading = stage === 'uploading'

  return (
    <div
      className="log-modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cpmd-modal-title"
    >
      <div className="log-modal cpmd-upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="log-modal__header">
          <h2 id="cpmd-modal-title" className="log-modal__title">
            Cargar CPMD del modelo
          </h2>
          {!isUploading && (
            <button
              type="button"
              className="log-modal__close"
              onClick={onClose}
              aria-label="Cerrar"
            >
              ×
            </button>
          )}
        </div>

        <p className="cpmd-upload-modal__subtitle">
          Modelo: <strong>{modelName}</strong>
        </p>

        {stage === 'idle' && (
          <>
            <p className="cpmd-upload-modal__hint">
              Seleccioná el PDF del CPMD (Customer/Service Manual). La IA extraerá las soluciones
              técnicas para cada código de error. El proceso puede tardar varios minutos.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <div className="log-modal__actions">
              <button
                type="button"
                className="dashboard__btn dashboard__btn--primary"
                onClick={() => fileInputRef.current?.click()}
              >
                Elegir PDF…
              </button>
              <button type="button" className="log-modal__btn-secondary" onClick={onClose}>
                Cancelar
              </button>
            </div>
          </>
        )}

        {stage === 'uploading' && (
          <div className="cpmd-upload-modal__progress">
            <span className="log-modal__spinner cpmd-upload-modal__spinner" aria-hidden="true" />
            <p className="cpmd-upload-modal__progress-text">
              Procesando CPMD con IA. Esto puede tardar varios minutos.
              <br />
              No cierres esta ventana.
            </p>
            <button type="button" className="log-modal__btn-secondary" onClick={handleCancel}>
              Cancelar
            </button>
          </div>
        )}

        {stage === 'done' && report && (
          <div className="cpmd-upload-modal__result cpmd-upload-modal__result--ok">
            {report.skipped ? (
              <p>Este CPMD ya fue procesado anteriormente.</p>
            ) : (
              <p>
                CPMD procesado:{' '}
                <strong>{report.extracted ?? 0} soluciones cargadas</strong>
                {(report.failed ?? 0) > 0 && (
                  <span className="cpmd-upload-modal__failed">
                    {' '}
                    ({report.failed} no se pudieron extraer)
                  </span>
                )}
                .
              </p>
            )}
            <div className="log-modal__actions">
              <button
                type="button"
                className="dashboard__btn dashboard__btn--primary"
                onClick={onClose}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {stage === 'error' && (
          <div className="cpmd-upload-modal__result cpmd-upload-modal__result--error">
            <p>{errorMsg ?? 'Ocurrió un error inesperado.'}</p>
            <div className="log-modal__actions">
              <button
                type="button"
                className="dashboard__btn dashboard__btn--primary"
                onClick={() => {
                  setStage('idle')
                  setErrorMsg(null)
                }}
              >
                Reintentar
              </button>
              <button type="button" className="log-modal__btn-secondary" onClick={onClose}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
