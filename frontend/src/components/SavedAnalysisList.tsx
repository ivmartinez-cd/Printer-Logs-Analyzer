import { formatDateTime } from '../hooks/useDateFilter'
import type { SavedAnalysisSummary } from '../types/api'
import { EquipmentTimeline } from './EquipmentTimeline'

interface SavedAnalysisListProps {
  savedList: SavedAnalysisSummary[] | null
  savedListSearch: string
  setSavedListSearch: (v: string) => void
  deletingId: string | null
  onBack: () => void
  onOpen: (id: string) => void
  onDelete: (item: { id: string; name: string }) => void
}

export function SavedAnalysisList({
  savedList,
  savedListSearch,
  setSavedListSearch,
  deletingId,
  onBack,
  onOpen,
  onDelete,
}: SavedAnalysisListProps) {
  const filtered = savedList?.filter((s) => {
    const q = savedListSearch.trim().toLowerCase()
    if (!q) return true
    return (
      s.name.toLowerCase().includes(q) || (s.equipment_identifier ?? '').toLowerCase().includes(q)
    )
  })

  const timelineGroups: { equipmentId: string; snapshots: SavedAnalysisSummary[] }[] = []
  if (savedList && savedList.length >= 2) {
    const byEquipment = new Map<string, SavedAnalysisSummary[]>()
    for (const s of savedList) {
      const key = (s.equipment_identifier ?? '').trim()
      if (!key) continue
      const group = byEquipment.get(key) ?? []
      group.push(s)
      byEquipment.set(key, group)
    }
    for (const [equipmentId, snaps] of byEquipment) {
      if (snaps.length >= 2) timelineGroups.push({ equipmentId, snapshots: snaps })
    }
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Search and Navigation */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/[0.03] p-6 rounded-3xl border border-white/5">
        <div className="flex flex-col">
          <button 
            type="button" 
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 hover:text-hp-blue-vibrant transition-colors mb-2 group" 
            onClick={onBack}
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Volver al Dashboard Principal
          </button>
          <h2 className="font-display font-bold text-2xl text-white m-0">Biblioteca de Análisis <span className="text-hp-blue-vibrant">Guardados</span></h2>
        </div>

        <div className="w-full md:w-96 relative">
          <input
            type="search"
            className="w-full bg-hp-dark/60 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white placeholder:text-slate-600 focus:ring-2 focus:ring-hp-blue-vibrant/50 focus:border-hp-blue-vibrant outline-none transition-all shadow-inner"
            placeholder="Filtrar por nombre, serial o modelo..."
            value={savedListSearch}
            onChange={(e) => setSavedListSearch(e.target.value)}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
             🔍
          </div>
        </div>
      </div>

      {savedList === null ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
           <div className="w-10 h-10 border-4 border-hp-blue/20 border-t-hp-blue-vibrant rounded-full animate-spin" />
           <span className="text-sm font-bold uppercase tracking-widest text-hp-blue-vibrant">Sincronizando biblioteca...</span>
        </div>
      ) : savedList.length === 0 ? (
        <div className="glass-card p-20 text-center flex flex-col items-center gap-4">
           <span className="text-5xl">📂</span>
           <p className="text-slate-400 font-medium">No se registran diagnósticos archivados en este momento.</p>
        </div>
      ) : (
        <div className="glass-card rounded-3xl overflow-hidden border border-white/10 shadow-premium-lg translate-y-0 hover:-translate-y-1 transition-transform duration-500">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="p-5 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">Identificación / Nombre</th>
                  <th className="p-5 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">Equipo Relacionado</th>
                  <th className="p-5 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">Estado de Salud</th>
                  <th className="p-5 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">Fecha de Registro</th>
                  <th className="p-5 text-right text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">Acciones Ejecutivas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-hp-dark/20">
                {(filtered ?? []).map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.04] transition-all group">
                    <td className="p-5">
                      <div className="flex flex-col">
                         <span className="text-sm font-bold text-white group-hover:text-hp-blue-vibrant transition-colors">{s.name}</span>
                         <span className="text-[10px] font-mono text-slate-500">ID: {s.id.slice(0, 8)}...</span>
                      </div>
                    </td>
                    <td className="p-5">
                       {s.equipment_identifier ? (
                         <span className="text-xs font-bold text-slate-300 bg-white/5 px-3 py-1 rounded-full border border-white/5 tracking-wider">
                           {s.equipment_identifier}
                         </span>
                       ) : (
                         <span className="text-xs italic text-slate-600">— No especificado —</span>
                       )}
                    </td>
                    <td className="p-5">
                       <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                         s.global_severity === 'ERROR' ? 'bg-accent-rose/10 text-accent-rose border border-accent-rose/20' : 
                         s.global_severity === 'WARNING' ? 'bg-accent-amber/10 text-accent-amber border border-accent-amber/20' : 
                         'bg-hp-blue/10 text-hp-blue-vibrant border border-hp-blue/20'
                       }`}>
                         {s.global_severity}
                       </span>
                    </td>
                    <td className="p-5 text-xs text-slate-400 font-medium">
                       {formatDateTime(s.created_at)}
                    </td>
                    <td className="p-5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          className="px-5 py-2 rounded-full bg-hp-blue-vibrant text-white text-[10px] font-bold uppercase tracking-widest shadow-premium-sm hover:shadow-premium-glow hover:scale-105 transition-all"
                          onClick={() => onOpen(s.id)}
                        >
                          Restaurar
                        </button>
                        <button
                          type="button"
                          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-500 hover:text-accent-rose hover:bg-accent-rose/10 transition-all border border-transparent hover:border-accent-rose/20"
                          disabled={deletingId !== null}
                          onClick={() => onDelete({ id: s.id, name: s.name })}
                          title="Eliminar registro permanentemente"
                        >
                          {deletingId === s.id ? (
                            <div className="w-4 h-4 border-2 border-accent-rose/20 border-t-accent-rose rounded-full animate-spin" />
                          ) : (
                            '🗑️'
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Timeline Section */}
      {timelineGroups.length > 0 && (
        <div className="flex flex-col gap-6 animate-fade-in-up mt-4">
          <div className="flex flex-col">
             <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-hp-blue-vibrant mb-1">Visión Retrospectiva</span>
             <h3 className="font-display font-bold text-xl text-white m-0">Líneas de Tiempo por Equipo</h3>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {timelineGroups.map(({ equipmentId, snapshots }) => (
              <div key={equipmentId} className="glass-card p-6 rounded-3xl border border-white/10 hover:border-hp-blue/30 transition-all group">
                 <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-hp-blue-vibrant text-white font-bold text-xs group-hover:scale-110 transition-transform shadow-premium-glow">T</span>
                    <h4 className="text-sm font-bold text-white uppercase tracking-widest">Estado Evolutivo: <span className="text-hp-blue-vibrant">{equipmentId}</span></h4>
                 </div>
                 <EquipmentTimeline equipmentId={equipmentId} snapshots={snapshots} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
