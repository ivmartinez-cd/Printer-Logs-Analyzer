import React, { useState, useEffect, useRef } from 'react'
import { listPrinterModels, extractSdsLogs } from '../services/api'
import type { PrinterModel, UploadPdfResponse } from '../types/api'
import { AddPrinterModelModal } from './AddPrinterModelModal'
import { useToast } from '../contexts/ToastContext'

export interface LogPasteModalProps {
  loading: boolean
  error: string | null
  serverWasCold: boolean
  onAnalyze: (
    logText: string,
    fileName?: string,
    modelId?: string | null,
    hasCpmd?: boolean,
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
  const [fileName, setFileName] = useState<string | undefined>(undefined)
  const [slowWarning, setSlowWarning] = useState(false)
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)
  const [serialNumber, setSerialNumber] = useState('')
  const [models, setModels] = useState<PrinterModel[]>([])
  const [addModelOpen, setAddModelOpen] = useState(false)
  const [modelSuccessMsg, setModelSuccessMsg] = useState<string | null>(null)
  const [extractingSds, setExtractingSds] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  // Fetch models on mount
  useEffect(() => {
    listPrinterModels()
      .then(setModels)
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!loading || !serverWasCold) {
      setSlowWarning(false)
      return
    }
    const id = setTimeout(() => setSlowWarning(true), 3000)
    return () => clearTimeout(id)
  }, [loading, serverWasCold])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setLogText(text)
      setFileName(file.name)
      textareaRef.current?.focus()
    }
    reader.readAsText(file)
  }

  async function handleUploadSuccess(response: UploadPdfResponse) {
    setAddModelOpen(false)
    const updatedModels = await listPrinterModels().catch(() => models)
    setModels(updatedModels)
    if (response.created.length > 0) {
      const firstCreated = updatedModels.find((m) => response.created.includes(m.model_code))
      if (firstCreated) setSelectedModelId(firstCreated.id)
      setModelSuccessMsg(`Modelo cargado: ${response.created.join(', ')}`)
    }
  }

  async function handleExtractSds() {
    if (!serialNumber) return
    setExtractingSds(true)
    try {
      const res = await extractSdsLogs(serialNumber)
      if (res.logs_text) {
        setLogText(res.logs_text)
        setFileName(`Portal_SDS_${serialNumber}.tsv`)
        toast.showSuccess(`Logs extraídos correctamente (${res.event_count} eventos)`)
      } else {
        toast.showWarning('No se encontraron logs para este número de serie.')
      }
    } catch (err: unknown) {
      console.error('Error extracting SDS logs:', err)
      const errorMsg = err instanceof Error ? err.message : 'Error al extraer logs del portal SDS'
      toast.showError(errorMsg)
    } finally {
      setExtractingSds(false)
    }
  }

  const canAnalyze = !loading && (
    (!!logText.trim() && selectedModelId !== null) || 
    (!!serialNumber.trim() && serialNumber.length >= 5)
  )

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
              Pegar logs HP
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

          <div className="log-modal__model-section">
            <label className="log-modal__model-label" htmlFor="log-modal-model-select">
              Modelo de impresora {!serialNumber && '*'}
            </label>
            <div className="log-modal__model-selector">
              <select
                id="log-modal-model-select"
                className="log-modal__model-select"
                value={selectedModelId ?? ''}
                onChange={(e) => setSelectedModelId(e.target.value || null)}
                disabled={loading}
              >
                <option value="">— Elegí un modelo —</option>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.has_cpmd ? '📘 ' : ''}
                    {m.model_name} {m.model_code ? `(${m.model_code})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="log-modal__model-buttons">
              <button
                type="button"
                className="log-modal__model-add-button"
                onClick={() => setAddModelOpen(true)}
                disabled={loading}
                title="Cargar nuevo modelo desde PDF"
              >
                + Cargar nuevo modelo (PDF)
              </button>
            </div>
            {modelSuccessMsg && (
              <p className="log-modal__model-success">{modelSuccessMsg}</p>
            )}
          </div>

          <div className="log-modal__model-section">
            <label className="log-modal__model-label" htmlFor="log-modal-serial-input">
              N° de serie del equipo
              <span className="log-modal__optional-hint"> (para extracción automática o alertas SDS)</span>
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
                disabled={loading || extractingSds}
                maxLength={50}
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                className="log-modal__btn-secondary"
                onClick={handleExtractSds}
                disabled={loading || extractingSds || !serialNumber}
                style={{ whiteSpace: 'nowrap', minWidth: '100px' }}
              >
                {extractingSds ? 'Extrayendo…' : 'Extraer logs'}
              </button>
            </div>
          </div>

          <div className="log-modal__file-row">
            <input
              ref={fileInputRef}
              type="file"
              accept=".log,.txt,.tsv,text/plain"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <button
              type="button"
              className="log-modal__btn-secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              Cargar archivo…
            </button>
            {fileName && <span className="log-modal__file-name">{fileName}</span>}
          </div>

          <textarea
            ref={textareaRef}
            className="log-modal__textarea"
            placeholder="Pegar logs HP aquí..."
            value={logText}
            onChange={(e) => setLogText(e.target.value)}
            disabled={loading || selectedModelId === null}
          />
          {error && <p className="dashboard__error">{error}</p>}

          <div className="log-modal__actions">
            <button
              type="button"
              className="dashboard__btn"
              onClick={() => {
                const selectedModel = models.find((m) => m.id === selectedModelId)
                onAnalyze(
                  logText,
                  fileName,
                  selectedModelId,
                  selectedModel?.has_cpmd ?? false,
                  serialNumber.trim() || null,
                  !logText.trim() && !!serialNumber.trim() // isAutomated
                )
              }}
              disabled={!canAnalyze}
            >
              {loading ? (
                <>
                  <span className="log-modal__spinner" aria-hidden="true" /> Analizando log…
                </>
              ) : (
                'Analizar'
              )}
            </button>
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

      <AddPrinterModelModal
        open={addModelOpen}
        onClose={() => setAddModelOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </>
  )
}
