import React, { useState, useEffect, useRef } from 'react'
import { listPrinterModels } from '../services/api'
import type { PrinterModel, UploadPdfResponse } from '../types/api'
import { AddPrinterModelModal } from './AddPrinterModelModal'

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
  const [manualExpanded, setManualExpanded] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)


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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
  const [manualExpanded, setManualExpanded] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

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
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-hp-dark/80 backdrop-blur-md animate-fade-in"
        role="dialog"
        aria-modal="true"
      >
        <div className="glass-card w-full max-w-2xl shadow-premium-glow animate-scale-in overflow-hidden border border-white/10 flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-hp-blue-vibrant mb-1">Centro de Diagnóstico</span>
              <h2 className="font-display font-bold text-xl text-white m-0 tracking-tight">Ingesta de <span className="text-hp-blue-vibrant">Telemetría HP</span></h2>
            </div>
            <button 
              type="button" 
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all focus:outline-none" 
              onClick={onClose}
              disabled={loading}
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 p-6 flex flex-col gap-6">
            
            {/* Quick Extraction Method */}
            <div className="flex flex-col gap-4 p-6 bg-hp-blue-vibrant/5 border border-hp-blue-vibrant/20 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <span className="text-4xl text-hp-blue-vibrant">⚡</span>
              </div>
              <div className="flex flex-col relative">
                <span className="text-[9px] font-bold uppercase tracking-widest text-hp-blue-vibrant mb-2">Método Acelerado</span>
                <label className="text-sm font-bold text-white mb-4" htmlFor="log-modal-serial-input">
                  Extracción Directa vía SDS
                </label>
                <div className="flex flex-col md:flex-row gap-3">
                  <input
                    id="log-modal-serial-input"
                    type="text"
                    className="flex-1 bg-hp-dark/60 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white placeholder:text-slate-600 focus:ring-1 focus:ring-hp-blue-vibrant focus:border-hp-blue-vibrant outline-none transition-all font-mono tracking-widest uppercase hover:border-white/20"
                    placeholder="INTRODUCIR N° DE SERIE..."
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value.toUpperCase())}
                    disabled={loading}
                    maxLength={50}
                    autoComplete="off"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && serialNumber.length >= 5 && !loading) {
                        e.preventDefault()
                        onAnalyze('', undefined, null, false, serialNumber.trim(), true)
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="px-8 py-3 bg-hp-blue-vibrant text-white text-[11px] font-bold uppercase tracking-widest rounded-2xl hover:shadow-premium-glow hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 whitespace-nowrap"
                    onClick={() => onAnalyze('', undefined, null, false, serialNumber.trim(), true)}
                    disabled={loading || serialNumber.length < 5}
                  >
                    🚀 Extraer y Analizar
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 font-medium mt-3 leading-relaxed border-t border-white/5 pt-3 italic">
                   El sistema se conectará al portal HP SDS para extraer logs de ingeniería automáticamente.
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <button 
                type="button"
                onClick={() => setManualExpanded(!manualExpanded)}
                className="relative z-10 px-6 py-2 bg-hp-dark border border-white/10 rounded-full text-[10px] font-bold text-slate-400 hover:text-white hover:border-white/20 transition-all flex items-center gap-3 group"
              >
                <span>{manualExpanded ? '−' : '+'}</span>
                <span className="uppercase tracking-widest">{manualExpanded ? 'Ocultar' : 'Mostrar'} Ingesta Manual</span>
                <span className="opacity-30 group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>

            {/* Manual Method Section */}
            {manualExpanded && (
              <div className="flex flex-col gap-6 animate-fade-in-up">
                <div className="flex flex-col md:flex-row gap-6">
                   <div className="flex-1 flex flex-col gap-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500" htmlFor="log-modal-model-select">
                        Modelo de Impresora <span className="text-accent-rose">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="log-modal-model-select"
                          className="w-full bg-hp-dark/60 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white appearance-none focus:ring-1 focus:ring-hp-blue-vibrant focus:border-hp-blue-vibrant outline-none transition-all hover:bg-white/5 cursor-pointer"
                          value={selectedModelId ?? ''}
                          onChange={(e) => setSelectedModelId(e.target.value || null)}
                          disabled={loading}
                        >
                          <option value="">— Seleccionar Familia / Modelo —</option>
                          {models.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.has_cpmd ? '📘 ' : ''}{m.model_name} {m.model_code ? `(${m.model_code})` : ''}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">
                           ▼
                        </div>
                      </div>
                   </div>
                   <div className="flex flex-col justify-end">
                      <button
                        type="button"
                        className="px-6 py-3 border border-dashed border-white/20 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all"
                        onClick={() => setAddModelOpen(true)}
                        disabled={loading}
                      >
                        + Nuevo Modelo (PDF)
                      </button>
                   </div>
                </div>

                {modelSuccessMsg && (
                  <div className="px-4 py-2 bg-green-400/10 border border-green-400/20 rounded-xl text-[11px] font-bold text-green-400 animate-fade-in">
                     ✓ {modelSuccessMsg}
                  </div>
                )}

                <div className="flex flex-col gap-3">
                   <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Contenido del Log</label>
                      <div className="flex gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".log,.txt,.tsv,text/plain"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        <button
                          type="button"
                          className="text-[10px] font-bold uppercase tracking-widest text-hp-blue-vibrant hover:underline transition-all"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={loading}
                        >
                          {fileName ? `Cambiar: ${fileName}` : 'Cargar Archivo Local'}
                        </button>
                      </div>
                   </div>
                   
                   <div className="relative">
                    <textarea
                      ref={textareaRef}
                      className="w-full h-48 bg-hp-dark/60 border border-white/10 rounded-2xl p-5 text-xs text-slate-300 font-mono focus:ring-1 focus:ring-hp-blue-vibrant focus:border-hp-blue-vibrant outline-none resize-none scrollbar-thin scrollbar-thumb-white/10 shadow-inner"
                      placeholder="Pegue aquí el bloque de eventos técnicos o cargue un archivo..."
                      value={logText}
                      onChange={(e) => setLogText(e.target.value)}
                      disabled={loading}
                    />
                    {logText.length > 0 && (
                      <button 
                        onClick={() => setLogText('')}
                        className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center rounded-full bg-white/5 text-[10px] text-slate-500 hover:text-white transition-all"
                      >✕</button>
                    )}
                   </div>
                </div>

                {error && (
                   <div className="px-4 py-3 bg-accent-rose/10 border border-accent-rose/20 rounded-2xl text-[11px] font-bold text-accent-rose flex items-center gap-3">
                      <span>⚠️ Error Detectado:</span>
                      <span className="font-medium text-slate-300">{error}</span>
                   </div>
                )}

                <div className="flex justify-end pt-2">
                   <button
                    type="button"
                    className="px-12 py-3 bg-hp-blue-vibrant text-white text-[11px] font-bold uppercase tracking-widest rounded-full hover:shadow-premium-glow hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                    onClick={() => {
                      const selectedModel = models.find((m) => m.id === selectedModelId)
                      onAnalyze(logText, fileName, selectedModelId, selectedModel?.has_cpmd ?? false, undefined, false)
                    }}
                    disabled={loading || !logText.trim() || selectedModelId === null}
                  >
                    {loading ? 'Sincronizando...' : 'Ejecutar Análisis Manual'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="p-6 bg-white/5 border-t border-white/5 flex items-center justify-between">
            <div className="flex flex-col">
              {slowWarning && (
                <div className="flex items-center gap-2 text-[10px] font-bold text-accent-amber animate-pulse">
                   <span>⚡ Servidor en fase de arranque...</span>
                </div>
              )}
            </div>
            <button
              type="button"
              className="px-8 py-2.5 rounded-full bg-slate-800 text-white font-bold text-[11px] uppercase tracking-widest hover:bg-slate-700 transition-all border border-white/5"
              onClick={onClose}
              disabled={loading}
            >
              Cerrar Panel
            </button>
          </div>
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
