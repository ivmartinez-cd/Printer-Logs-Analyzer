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

          <div className="log-modal__method-section">
            <h3 style={{ color: "var(--accent-primary)", marginBottom: "1rem", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "8px" }}>
              ✨ Opción 1: Automático (Recomendado)
            </h3>
            <div className="log-modal__model-section" style={{ marginBottom: "0" }}>
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
                      onAnalyze('', undefined, null, false, serialNumber.trim(), true)
                    }
                  }}
                />
                <button
                  type="button"
                  className="dashboard__btn"
                  onClick={() => onAnalyze('', undefined, null, false, serialNumber.trim(), true)}
                  disabled={loading || serialNumber.length < 5}
                  style={{ whiteSpace: 'nowrap', minWidth: '160px' }}
                >
                  Extraer y Analizar
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', margin: '2rem 0' }}>
            <div style={{ flex: 1, borderBottom: '1px solid var(--border-color)', opacity: 0.5 }}></div>
            <span style={{ padding: '0 1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', opacity: 0.8 }}>Ó ingreso manual</span>
            <div style={{ flex: 1, borderBottom: '1px solid var(--border-color)', opacity: 0.5 }}></div>
          </div>

          <div className="log-modal__method-section" style={{ opacity: serialNumber.length >= 5 ? 0.5 : 1, transition: 'opacity 0.3s ease' }}>
            <h3 style={{ color: "var(--text-secondary)", marginBottom: "1rem", fontSize: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
              🖨️ Opción 2: Formato Manual
            </h3>
            
            <div className="log-modal__model-section">
              <label className="log-modal__model-label" htmlFor="log-modal-model-select">
                Modelo de impresora *
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
              disabled={loading}
              style={{ minHeight: '150px' }}
            />
            {error && <p className="dashboard__error">{error}</p>}
          </div>

          <div className="log-modal__actions" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', flex: 1 }}>
              {serialNumber.length >= 5 ? 'Automático listo' : (!logText.trim() ? '' : (selectedModelId ? 'Manual listo' : 'Seleccioná un modelo para analizar manualmente'))}
            </span>
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
                  undefined,
                  false
                )
              }}
              disabled={loading || !logText.trim() || selectedModelId === null}
            >
              {loading ? (
                <>
                  <span className="log-modal__spinner" aria-hidden="true" /> Analizando log…
                </>
              ) : (
                'Analizar (Manual)'
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
