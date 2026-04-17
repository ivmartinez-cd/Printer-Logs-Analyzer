import { useState, useEffect } from 'react'
import type { ErrorSolution } from '../types/api'
import { getErrorSolution } from '../services/api'

export interface SolutionContentModalProps {
  code: string
  modelId?: string | null
  sdsContent?: string | null
  sdsUrl?: string | null
  onClose: () => void
}

type CpmdFetchState = 'idle' | 'loading' | 'found' | 'not-found'
type ActiveTab = 'sds' | 'cpmd'

export function SolutionContentModal({
  code,
  modelId,
  sdsContent,
  sdsUrl,
  onClose,
}: SolutionContentModalProps) {
  const [cpmdState, setCpmdState] = useState<CpmdFetchState>(modelId ? 'loading' : 'idle')
  const [cpmdSolution, setCpmdSolution] = useState<ErrorSolution | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>('cpmd')

  const hasSds = !!(sdsContent || sdsUrl)
  const showTabs = hasSds && !!modelId

  useEffect(() => {
    if (!modelId) {
      setCpmdState('idle')
      setCpmdSolution(null)
      setActiveTab('sds')
      return
    }
    setCpmdState('loading')
    setCpmdSolution(null)
    setActiveTab('cpmd')
    const controller = new AbortController()
    getErrorSolution(modelId, code, controller.signal)
      .then((sol) => {
        if (controller.signal.aborted) return
        if (sol) {
          setCpmdSolution(sol)
          setCpmdState('found')
          setActiveTab('cpmd')
        } else {
          setCpmdState('not-found')
          setActiveTab('sds')
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setCpmdState('not-found')
          setActiveTab('sds')
        }
      })
    return () => controller.abort()
  }, [modelId, code])

  const neitherAvailable = !hasSds && (cpmdState === 'not-found' || cpmdState === 'idle')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-hp-dark/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="glass-card w-full max-w-2xl max-h-[90vh] flex flex-col shadow-premium-glow animate-scale-in overflow-hidden border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-hp-blue-vibrant mb-1">Base de Conocimiento</span>
            <h2 className="font-display font-bold text-xl text-white m-0">Resolución de Error: <span className="text-hp-blue-vibrant">{code}</span></h2>
          </div>
          <button 
            type="button" 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all" 
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Tab Strip */}
        {showTabs && (
          <div className="flex items-center bg-white/[0.02] border-b border-white/5 px-2" role="tablist">
            {[
              { id: 'cpmd', label: 'Manual de Servicio (CPMD)', icon: '📘' },
              { id: 'sds', label: 'Diagnóstico Remoto (SDS)', icon: '📡' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`relative px-6 py-4 text-[11px] font-bold uppercase tracking-widest transition-all hover:text-white ${
                  activeTab === tab.id ? 'text-white' : 'text-slate-500'
                }`}
                onClick={() => setActiveTab(tab.id as any)}
              >
                <span className="flex items-center gap-2">
                   {tab.icon} {tab.label}
                </span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-hp-blue-vibrant shadow-premium-glow" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
          {neitherAvailable ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-60">
              <span className="text-4xl mb-4">🔍</span>
              <p className="text-slate-400 text-sm">Sin información técnica disponible para este código en la base local.</p>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in-up">
              {/* SDS Content */}
              {(!showTabs ? hasSds : activeTab === 'sds') && (
                <div className="space-y-4">
                  {sdsUrl && (
                    <div className="p-4 bg-hp-blue/5 border border-hp-blue/20 rounded-2xl flex items-start gap-3">
                      <span className="text-lg">🔗</span>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-hp-blue-vibrant uppercase tracking-wider">Documentación Original</span>
                        <a href={sdsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-300 hover:text-white underline break-all">
                          {sdsUrl}
                        </a>
                      </div>
                    </div>
                  )}
                  {sdsContent ? (
                    <div className="p-6 bg-hp-dark/40 border border-white/5 rounded-2xl shadow-inner">
                      <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                        {sdsContent}
                      </pre>
                    </div>
                  ) : (
                    <div className="p-6 text-center border-2 border-dashed border-white/5 rounded-2xl opacity-40">
                      <p className="text-sm italic">Contenido estructurado no disponible. Utilice el enlace de la fuente superior.</p>
                    </div>
                  )}
                </div>
              )}

              {/* CPMD Content */}
              {(!showTabs ? !!modelId : activeTab === 'cpmd') && (
                <div className="space-y-6">
                  {cpmdState === 'loading' && (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                       <span className="w-10 h-10 border-4 border-hp-blue/20 border-t-hp-blue-vibrant rounded-full animate-spin" />
                       <span className="text-hp-blue-vibrant font-bold text-sm animate-pulse tracking-widest uppercase">Consultando CPMD Database…</span>
                    </div>
                  )}
                  
                  {cpmdState === 'not-found' && (
                    <div className="p-10 text-center opacity-60">
                       <p className="text-sm italic">No se encontraron entradas específicas en el manual de servicio sincronizado.</p>
                    </div>
                  )}

                  {cpmdState === 'found' && cpmdSolution && (
                    <div className="space-y-8">
                       {/* Cause Block */}
                       {cpmdSolution.cause && (
                         <div className="p-6 bg-accent-amber/5 border-l-4 border-accent-amber rounded-r-3xl">
                            <h4 className="text-[10px] font-bold text-accent-amber uppercase tracking-widest mb-2 flex items-center gap-2">
                               <span className="text-sm">🧐</span> Causa Probable
                            </h4>
                            <p className="text-slate-300 font-medium leading-relaxed">{cpmdSolution.cause}</p>
                         </div>
                       )}

                       {/* Steps Block */}
                       <div className="space-y-4">
                          <h4 className="text-[10px] font-bold text-hp-blue-vibrant uppercase tracking-widest flex items-center gap-2 px-2">
                             <span className="text-sm">🛠️</span> Procedimiento para el Técnico
                          </h4>
                          {cpmdSolution.technician_steps.length > 0 ? (
                            <div className="space-y-3">
                               {cpmdSolution.technician_steps.map((step, i) => (
                                 <div key={i} className="flex gap-4 p-4 bg-white/[0.03] border border-white/5 rounded-2xl group hover:border-hp-blue/40 transition-all">
                                    <span className="shrink-0 w-6 h-6 rounded-full bg-hp-blue/20 text-hp-blue-vibrant text-[10px] font-bold flex items-center justify-center group-hover:scale-110 transition-transform">
                                       {i + 1}
                                    </span>
                                    <p className="text-sm text-slate-300 group-hover:text-white transition-colors leading-normal">{step}</p>
                                 </div>
                               ))}
                            </div>
                          ) : (
                            <p className="p-6 text-center italic text-slate-600 text-xs border border-dashed border-white/10 rounded-2xl">Sin pasos detallados en esta sección del manual.</p>
                          )}
                       </div>

                       {/* FRUs Block */}
                       {cpmdSolution.frus.length > 0 && (
                         <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-accent-rose uppercase tracking-widest flex items-center gap-2 px-2">
                               <span className="text-sm">📦</span> Repuestos Necesarios (FRUs)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                               {cpmdSolution.frus.map((fru, i) => (
                                 <div key={i} className="p-4 bg-accent-rose/5 border border-accent-rose/10 rounded-2xl flex flex-col gap-1">
                                    <code className="text-[11px] font-mono text-accent-rose font-bold">{fru.part_number}</code>
                                    <span className="text-xs text-slate-400 font-medium leading-tight">{fru.description || 'Sin descripción'}</span>
                                 </div>
                               ))}
                            </div>
                         </div>
                       )}

                       {/* Metadata */}
                       <div className="flex items-center justify-between pt-6 border-t border-white/5 opacity-40 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                          {cpmdSolution.source_page && <span>Referencia: Pag. {cpmdSolution.source_page}</span>}
                          {cpmdSolution.source_audience && <span>Audiencia: {cpmdSolution.source_audience}</span>}
                       </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-white/5 border-t border-white/5 flex justify-end">
          <button
            type="button"
            className="px-8 py-2.5 rounded-full bg-hp-blue-vibrant text-white font-bold text-xs uppercase tracking-widest hover:shadow-premium-glow hover:scale-105 transition-all"
            onClick={onClose}
          >
            Finalizar Revisión
          </button>
        </div>
      </div>
    </div>
  )
}
