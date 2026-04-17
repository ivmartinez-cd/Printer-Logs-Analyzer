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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-hp-dark/80 backdrop-blur-md animate-fade-in"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="glass-card w-full max-w-lg flex flex-col shadow-premium-glow animate-scale-in border border-white/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5 font-display">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-hp-blue-vibrant mb-1">Base de Conocimiento Local</span>
            <h2 className="font-bold text-xl text-white m-0">Ingesta de Manual (CPMD)</h2>
          </div>
          {!isUploading && (
            <button 
              type="button" 
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all" 
              onClick={onClose}
            >
              ✕
            </button>
          )}
        </div>

        <div className="p-8">
           <div className="mb-6">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Modelo Objetivo</span>
              <div className="text-white font-bold text-lg">{modelName}</div>
           </div>

           {stage === 'idle' && (
             <div className="space-y-6 animate-fade-in-up">
               <p className="text-sm text-slate-400 leading-relaxed m-0">
                 Cargue el manual de servicio (CPMD) en formato PDF. La IA procesará el documento para extraer y catalogar automáticamente las soluciones de ingeniería para este modelo.
               </p>
               
               <div 
                  className="border-2 border-dashed border-white/10 rounded-3xl p-10 flex flex-col items-center justify-center hover:bg-white/5 hover:border-hp-blue-vibrant/30 transition-all cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}
               >
                  <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-4 text-slate-500 group-hover:bg-hp-blue-vibrant group-hover:text-white group-hover:shadow-premium-glow transition-all">
                     📁
                  </div>
                  <span className="text-sm font-bold text-slate-300">Seleccionar PDF del Manual</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Límite 20MB</span>
               </div>

               <input
                 ref={fileInputRef}
                 type="file"
                 accept=".pdf,application/pdf"
                 className="hidden"
                 onChange={handleFileChange}
               />
               
               <div className="flex items-center gap-4">
                  <button 
                    type="button" 
                    className="flex-1 py-4 bg-hp-blue-vibrant text-white font-display font-bold text-sm uppercase tracking-widest rounded-2xl shadow-premium-glow hover:scale-[1.02] active:scale-[0.98] transition-all"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Elegir Archivo
                  </button>
                  <button 
                    type="button" 
                    className="px-8 py-4 bg-white/5 text-slate-400 font-bold text-sm uppercase tracking-widest rounded-2xl hover:bg-white/10 hover:text-white transition-all"
                    onClick={onClose}
                  >
                    Cancelar
                  </button>
               </div>
             </div>
           )}

           {stage === 'uploading' && (
             <div className="py-10 flex flex-col items-center gap-6 animate-pulse">
               <div className="relative">
                  <div className="w-20 h-20 border-4 border-hp-blue-vibrant/20 border-t-hp-blue-vibrant rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-xl">🤖</div>
               </div>
               <div className="text-center">
                  <h4 className="text-hp-blue-vibrant font-bold text-sm uppercase tracking-[0.2em] mb-2">Ingesta de Inteligencia</h4>
                  <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Extrayendo conocimiento técnico y procedimientos de reparación. No cierre esta ventana.
                  </p>
               </div>
               <button 
                 type="button" 
                 className="px-8 py-2 bg-white/5 text-slate-500 font-bold text-[10px] uppercase tracking-widest rounded-full hover:bg-accent-rose/10 hover:text-accent-rose transition-all"
                 onClick={handleCancel}
               >
                 Abortar Operación
               </button>
             </div>
           )}

           {stage === 'done' && report && (
             <div className="space-y-6 animate-fade-in-up text-center">
               <div className="w-20 h-20 bg-accent-teal/10 text-accent-teal rounded-full flex items-center justify-center text-3xl mx-auto mb-2 border border-accent-teal/20">
                  ✅
               </div>
               <div>
                  <h4 className="text-white font-bold text-lg mb-2">Ingesta Completada</h4>
                  {report.skipped ? (
                    <p className="text-sm text-slate-400 m-0">Este manual ya ha sido indexado previamente en la base de datos.</p>
                  ) : (
                    <div className="space-y-4">
                       <p className="text-sm text-slate-300">
                         Se han procesado y catalogado <strong className="text-hp-blue-vibrant">{report.extracted ?? 0} soluciones técnicas</strong>.
                       </p>
                       {(report.failed ?? 0) > 0 && (
                         <div className="p-3 bg-accent-amber/10 border border-accent-amber/20 rounded-xl text-[11px] text-accent-amber">
                            Nota: {report.failed} secciones presentaron ambigüedades y fueron omitidas.
                         </div>
                       )}
                    </div>
                  )}
               </div>
               <button
                 type="button"
                 className="w-full py-4 bg-hp-blue-vibrant text-white font-display font-bold text-sm uppercase tracking-widest rounded-2xl shadow-premium-glow hover:scale-[1.02] transition-all"
                 onClick={onClose}
               >
                 Finalizar y Salir
               </button>
             </div>
           )}

           {stage === 'error' && (
             <div className="space-y-6 animate-fade-in-up text-center">
               <div className="w-20 h-20 bg-accent-rose/10 text-accent-rose rounded-full flex items-center justify-center text-3xl mx-auto mb-2 border border-accent-rose/20">
                  ⚠️
               </div>
               <div>
                  <h4 className="text-white font-bold text-lg mb-2">Fallo en la Ingesta</h4>
                  <p className="text-sm text-accent-rose bg-accent-rose/5 p-4 rounded-2xl border border-accent-rose/10">{errorMsg ?? 'Error de red o procesamiento IA.'}</p>
               </div>
               <div className="flex items-center gap-4">
                  <button
                    type="button"
                    className="flex-1 py-4 bg-hp-blue-vibrant text-white font-display font-bold text-sm uppercase tracking-widest rounded-2xl shadow-premium-glow hover:scale-[1.02] transition-all"
                    onClick={() => {
                      setStage('idle')
                      setErrorMsg(null)
                    }}
                  >
                    Reintentar
                  </button>
                  <button 
                    type="button" 
                    className="px-8 py-4 bg-white/5 text-slate-400 font-bold text-sm uppercase tracking-widest rounded-2xl hover:bg-white/10 hover:text-white transition-all"
                    onClick={onClose}
                  >
                    Cerrar
                  </button>
               </div>
             </div>
           )}
        </div>
      </div>
    </div>
  )
}
