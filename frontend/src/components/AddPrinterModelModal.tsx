import { useRef, useState } from 'react'
import { uploadPrinterModelPdf } from '../services/api'
import type { UploadPdfResponse } from '../types/api'

export interface AddPrinterModelModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (response: UploadPdfResponse) => void
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export function AddPrinterModelModal({ open, onClose, onSuccess }: AddPrinterModelModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  function validateFile(f: File): string | null {
    if (f.type !== 'application/pdf' && !f.name.endsWith('.pdf')) {
      return 'El archivo debe ser un PDF.'
    }
    if (f.size > MAX_FILE_SIZE) {
      return 'El archivo no puede superar 10 MB.'
    }
    return null
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null
    if (!selected) return
    const validationError = validateFile(selected)
    if (validationError) {
      setError(validationError)
      setFile(null)
      return
    }
    setError(null)
    setFile(selected)
  }

  async function handleUpload() {
    if (!file) return
    setError(null)
    setLoading(true)
    try {
      const response = await uploadPrinterModelPdf(file)
      onSuccess(response)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="add-printer-model-modal__overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-printer-model-title"
    >
      <div className="add-printer-model-modal" onClick={(e) => e.stopPropagation()}>
        <div className="add-printer-model-modal__header">
          <h2 id="add-printer-model-title" className="add-printer-model-modal__title">
            Cargar Service Cost Data
          </h2>
          <button
            type="button"
            className="add-printer-model-modal__close"
            onClick={onClose}
            aria-label="Cerrar"
            disabled={loading}
          >
            ×
          </button>
        </div>

        <div className="add-printer-model-modal__body">
          <p className="add-printer-model-modal__description">
            Subí el PDF oficial del Service Cost Data de HP. Se extraerán automáticamente los
            modelos y consumibles.
          </p>

          <div className="add-printer-model-modal__file-row">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              style={{ display: 'none' }}
              onChange={handleFileChange}
              disabled={loading}
            />
            <button
              type="button"
              className="add-printer-model-modal__btn-secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              Seleccionar PDF…
            </button>
            {file && (
              <span className="add-printer-model-modal__file-name" title={file.name}>
                {file.name}
              </span>
            )}
          </div>

          {error && <p className="add-printer-model-modal__error">{error}</p>}

          {loading && (
            <p className="add-printer-model-modal__loading-hint">
              <span className="add-printer-model-modal__spinner" aria-hidden="true" />
              Procesando PDF con IA… (puede tardar 30-60 segundos)
            </p>
          )}
        </div>

        <div className="add-printer-model-modal__actions">
          <button
            type="button"
            className="dashboard__btn"
            onClick={handleUpload}
            disabled={!file || loading}
          >
            {loading ? 'Cargando…' : 'Cargar PDF'}
          </button>
          <button
            type="button"
            className="add-printer-model-modal__btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
