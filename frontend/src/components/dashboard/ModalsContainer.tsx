import { SDSIncidentModal } from '../SDSIncidentModal'
import { LogPasteModal } from '../LogPasteModal'
import { SaveIncidentModal } from '../SaveIncidentModal'
import { ConfirmModal } from '../ConfirmModal'
import { SolutionContentModal } from '../SolutionContentModal'
import { HelpModal } from '../HelpModal'
import type { 
  ErrorCodeUpsertBody, 
  ParseLogsResponse 
} from '../../types/api'
import { useRef } from 'react'

interface ModalsContainerProps {
  // SDS Modal
  sdsModalOpen: boolean
  setSdsModalOpen: (o: boolean) => void
  setSdsIncident: (d: any) => void
  
  // Log Paste Modal
  logModalOpen: boolean
  setLogModalOpen: (o: boolean) => void
  loading: boolean
  error: string | null
  serverWasCold: boolean
  onLogAnalyze: (logText: string, fileName: string, modelId: string | null, hasCpmd: boolean, serial: string | null, isAutomated: boolean) => void
  setError: (e: string | null) => void
  
  // Save Incident Modal
  saveIncidentModalOpen: boolean
  setSaveIncidentModalOpen: (o: boolean) => void
  onSaveIncident: (name: string, identifier: string | null) => Promise<void>
  savingIncident: boolean
  result: ParseLogsResponse | null
  
  // Delete Confirm Modal
  deleteConfirm: { id: string, name: string } | null
  setDeleteConfirm: (v: any) => void
  deletingId: string | null
  onConfirmDelete: () => Promise<void>
  
  // Solution Modal
  solutionModal: { code: string, sdsContent?: string | null, sdsUrl?: string | null } | null
  setSolutionModal: (v: any) => void
  currentModelId: string | null
  
  // Help Modal
  helpModalOpen: boolean
  setHelpModalOpen: (o: boolean) => void
  
  // Auto Extracting Spinner
  autoExtracting: boolean
  currentSerialNumber: string | null
  
  // Compare Modal
  compareModalOpen: boolean
  setCompareModalOpen: (o: boolean) => void
  comparing: boolean
  compareFileName?: string
  compareLogText: string
  setCompareLogText: (t: string) => void
  onCompareSubmit: () => Promise<void>
  compareFileInputRef: React.RefObject<HTMLInputElement>
}

export function ModalsContainer({
  sdsModalOpen, setSdsModalOpen, setSdsIncident,
  logModalOpen, setLogModalOpen, loading, error, serverWasCold, onLogAnalyze, setError,
  saveIncidentModalOpen, setSaveIncidentModalOpen, onSaveIncident, savingIncident, result,
  deleteConfirm, setDeleteConfirm, deletingId, onConfirmDelete,
  solutionModal, setSolutionModal, currentModelId,
  helpModalOpen, setHelpModalOpen,
  autoExtracting, currentSerialNumber,
  compareModalOpen, setCompareModalOpen, comparing, compareFileName, compareLogText, setCompareLogText, onCompareSubmit, compareFileInputRef
}: ModalsContainerProps) {
  return (
    <>
      {sdsModalOpen && (
        <SDSIncidentModal
          onContinue={(data) => {
            setSdsIncident(data)
            setSdsModalOpen(false)
          }}
          onClose={() => setSdsModalOpen(false)}
        />
      )}

      {logModalOpen && (
        <LogPasteModal
          loading={loading}
          error={error}
          serverWasCold={serverWasCold}
          onAnalyze={onLogAnalyze}
          onClose={() => {
            setError(null)
            setLogModalOpen(false)
          }}
        />
      )}

      {saveIncidentModalOpen && result && (
        <SaveIncidentModal
          onSave={onSaveIncident}
          onClose={() => !savingIncident && setSaveIncidentModalOpen(false)}
          saving={savingIncident}
        />
      )}

      {deleteConfirm && (
        <ConfirmModal
          title="Borrar incidente"
          message={`¿Borrar el incidente "${deleteConfirm.name}"? Esta acción no se puede deshacer.`}
          confirmLabel="Borrar"
          cancelLabel="Cancelar"
          loading={deletingId === deleteConfirm.id}
          onConfirm={onConfirmDelete}
          onCancel={() => !deletingId && setDeleteConfirm(null)}
        />
      )}

      {solutionModal && (
        <SolutionContentModal
          code={solutionModal.code}
          modelId={currentModelId}
          sdsContent={solutionModal.sdsContent}
          sdsUrl={solutionModal.sdsUrl}
          onClose={() => setSolutionModal(null)}
        />
      )}

      {autoExtracting && (
        <div className="fixed inset-0 bg-hp-dark/80 backdrop-blur-md flex items-center justify-center z-[3000] animate-fade-in p-6">
          <div className="glass-card p-10 flex flex-col items-center text-center max-w-sm shadow-premium-glow animate-scale-in border border-white/10">
            <div className="w-12 h-12 border-4 border-hp-blue/20 border-t-hp-blue-vibrant rounded-full animate-spin mb-6" />
            <h2 className="font-display font-bold text-xl text-white mb-3">Extrayendo logs automáticamente…</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Estableciendo conexión segura con el portal SDS para el equipo <strong className="text-hp-blue-vibrant font-mono">{currentSerialNumber}</strong>.
            </p>
            <div className="mt-8 px-4 py-2 bg-white/5 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest animate-pulse">
               Procesando solicitud técnica...
            </div>
          </div>
        </div>
      )}

      {compareModalOpen && (
        <div className="fixed inset-0 bg-hp-dark/80 backdrop-blur-md flex items-center justify-center z-[1000] p-6 animate-fade-in" role="dialog" aria-modal="true">
          <div className="glass-card max-w-2xl w-full flex flex-col shadow-premium-glow animate-scale-in overflow-hidden border border-white/10">
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-hp-blue-vibrant mb-1">Módulo de Diferenciales</span>
                <h2 className="font-display font-bold text-xl text-white m-0">Comparar Dispositivo</h2>
              </div>
              <button
                type="button"
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                onClick={() => !comparing && setCompareModalOpen(false)}
                disabled={comparing}
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-6">
              <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl">
                <input
                  ref={compareFileInputRef}
                  type="file"
                  accept=".log,.txt,.tsv,text/plain"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const reader = new FileReader()
                    reader.onload = (ev) => {
                      setCompareLogText(ev.target?.result as string)
                    }
                    reader.readAsText(file)
                  }}
                />
                <button
                  type="button"
                  className="px-6 py-2 bg-hp-blue/10 hover:bg-hp-blue/20 border border-hp-blue/20 rounded-full text-[11px] font-bold uppercase tracking-widest text-hp-blue-vibrant transition-all shadow-sm"
                  onClick={() => compareFileInputRef.current?.click()}
                  disabled={comparing}
                >
                  Cargar Archivo Log
                </button>
                {compareFileName && (
                  <span className="text-slate-500 text-[10px] font-mono font-bold truncate max-w-[200px] border-l border-white/10 pl-4 bg-white/5 py-1 px-3 rounded-full">
                     {compareFileName}
                  </span>
                )}
              </div>
              
              <div className="relative">
                <textarea
                  className="w-full h-80 bg-hp-dark/60 border border-white/10 rounded-2xl p-5 text-xs text-slate-300 font-mono focus:ring-1 focus:ring-hp-blue-vibrant focus:border-hp-blue-vibrant outline-none resize-none scrollbar-thin scrollbar-thumb-white/10 shadow-inner"
                  placeholder="Pegar contenido del log HP aquí para comparar estados de consumibles e incidencias históricas..."
                  value={compareLogText}
                  onChange={(e) => setCompareLogText(e.target.value)}
                  disabled={comparing}
                />
                <div className="absolute top-3 right-5 pointer-events-none opacity-20">
                   📄
                </div>
              </div>
              
              <div className="flex justify-end gap-3 items-center">
                 <button
                    type="button"
                    className="px-8 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-full text-white text-[11px] font-bold uppercase tracking-widest transition-all"
                    onClick={() => !comparing && setCompareModalOpen(false)}
                    disabled={comparing}
                  >
                    Cerrar
                  </button>
                  <button
                    type="button"
                    className="px-10 py-2.5 bg-hp-blue-vibrant hover:shadow-premium-glow hover:scale-105 disabled:opacity-50 disabled:scale-100 rounded-full text-white text-[11px] font-bold uppercase tracking-widest transition-all"
                    onClick={onCompareSubmit}
                    disabled={comparing || !compareLogText.trim()}
                  >
                    {comparing ? 'Analizando Diferencias…' : 'Ejecutar Comparación'}
                  </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {helpModalOpen && <HelpModal onClose={() => setHelpModalOpen(false)} />}
    </>
  )
}
