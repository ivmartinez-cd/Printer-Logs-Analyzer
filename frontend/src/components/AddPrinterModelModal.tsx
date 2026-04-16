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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-hp-dark/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="glass-card w-full max-w-lg flex flex-col shadow-premium-glow animate-scale-in border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5 font-display">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-hp-blue-vibrant mb-1">Ingesta de Inteligencia</span>
            <h2 className="font-bold text-xl text-white m-0">Service Cost Data (SCD)</h2>
          </div>
          <button 
            type="button" 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all" 
            onClick={onClose}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <div className="p-8 space-y-6">
          <p className="text-sm text-slate-400 leading-relaxed m-0">
            Cargue el documento PDF oficial de HP para extraer automáticamente las especificaciones del modelo y los rendimientos de consumibles.
          </p>

          <div 
             className={`relative group border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer ${
               file 
               ? 'bg-hp-blue-vibrant/5 border-hp-blue-vibrant/40' 
               : 'bg-white/5 border-white/10 hover:bg-white/[0.08] hover:border-hp-blue-vibrant/30'
             }`}
             onClick={() => !loading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={handleFileChange}
              disabled={loading}
            />
            
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${
               file ? 'bg-hp-blue-vibrant text-white shadow-premium-glow' : 'bg-white/10 text-slate-500'
            }`}>
               {file ? '📄' : '📁'}
            </div>

            {file ? (
               <div className="text-center">
                  <span className="block text-sm font-bold text-white mb-1 truncate max-w-[240px] px-4">{file.name}</span>
                  <span className="text-[10px] font-bold text-hp-blue-vibrant uppercase tracking-widest">Listo para procesar</span>
               </div>
            ) : (
               <div className="text-center">
                  <span className="block text-sm font-bold text-slate-300 mb-1">Seleccionar o soltar PDF</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Máximo 10MB</span>
               </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-accent-rose/10 border border-accent-rose/20 rounded-2xl animate-fade-in">
              <p className="text-xs font-bold text-accent-rose m-0 text-center">{error}</p>
            </div>
          )}

          {loading && (
             <div className="p-6 bg-hp-blue-vibrant/5 border border-hp-blue-vibrant/20 rounded-2xl animate-pulse">
                <div className="flex flex-col items-center gap-4">
                   <div className="w-8 h-8 border-2 border-hp-blue-vibrant/20 border-t-hp-blue-vibrant rounded-full animate-spin" />
                   <div className="text-center">
                      <p className="text-[10px] font-bold text-hp-blue-vibrant uppercase tracking-[0.2em] mb-1">Análisis por IA Iniciado</p>
                      <p className="text-xs text-slate-400 m-0">Extrayendo datos estructurales (30-60s)</p>
                   </div>
                </div>
             </div>
          )}
        </div>

        <div className="p-6 bg-white/5 border-t border-white/5 flex items-center gap-4">
          <button
            type="button"
            className="flex-1 py-4 bg-hp-blue-vibrant text-white font-display font-bold text-sm uppercase tracking-widest rounded-2xl shadow-premium-glow hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
            onClick={handleUpload}
            disabled={!file || loading}
          >
            {loading ? 'Sincronizando...' : 'Iniciar Carga'}
          </button>
          <button
            type="button"
            className="px-8 py-4 bg-white/5 text-slate-400 font-bold text-sm uppercase tracking-widest rounded-2xl hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
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
