import { formatDateTime } from '../hooks/useDateFilter'
import type { SavedAnalysisFull, CompareResponse } from '../types/api'

interface SavedAnalysisDetailProps {
  savedDetail: SavedAnalysisFull | null
  deletingId: string | null
  compareResult: CompareResponse | null
  onBack: () => void
  onDelete: (item: { id: string; name: string }) => void
  onCompare: () => void
}

export function SavedAnalysisDetail({
  savedDetail,
  deletingId,
  compareResult,
  onBack,
  onDelete,
  onCompare,
}: SavedAnalysisDetailProps) {
  if (!savedDetail) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
        <div className="w-10 h-10 border-4 border-hp-blue/20 border-t-hp-blue-vibrant rounded-full animate-spin" />
        <span className="text-sm font-bold uppercase tracking-widest text-hp-blue-vibrant">Recuperando detalles del archivo...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/[0.03] p-8 rounded-3xl border border-white/5 shadow-premium-lg">
        <div className="flex flex-col">
          <button 
            type="button" 
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 hover:text-hp-blue-vibrant transition-colors mb-3 group" 
            onClick={onBack}
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Volver a la Biblioteca
          </button>
          <div className="flex items-center gap-4 mb-2">
            <h2 className="font-display font-bold text-3xl text-white m-0 tracking-tight">{savedDetail.name}</h2>
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
               savedDetail.global_severity === 'ERROR' ? 'bg-accent-rose text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 
               savedDetail.global_severity === 'WARNING' ? 'bg-accent-amber text-black shadow-[0_0_15px_rgba(251,191,36,0.4)]' : 
               'bg-hp-blue-vibrant text-white shadow-[0_0_15px_rgba(0,150,214,0.4)]'
            }`}>
              {savedDetail.global_severity}
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">
             {savedDetail.equipment_identifier && <span>Serial: <span className="text-hp-blue-vibrant">{savedDetail.equipment_identifier}</span></span>}
             <span className="opacity-30">|</span>
             <span>Guardado el: <span className="text-slate-300">{formatDateTime(savedDetail.created_at)}</span></span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="px-8 py-3 rounded-full bg-hp-blue-vibrant text-white text-[11px] font-bold uppercase tracking-widest hover:shadow-premium-glow hover:scale-105 transition-all"
            onClick={onCompare}
          >
            Comparar con Log Actual
          </button>
          <button
            type="button"
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-slate-500 hover:text-accent-rose hover:bg-accent-rose/10 hover:border-accent-rose/20 transition-all"
            disabled={deletingId !== null}
            onClick={() => onDelete({ id: savedDetail.id, name: savedDetail.name })}
            title="Eliminar de la biblioteca"
          >
            {deletingId === savedDetail.id ? (
              <div className="w-5 h-5 border-2 border-accent-rose/20 border-t-accent-rose rounded-full animate-spin" />
            ) : (
              '🗑️'
            )}
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-card rounded-3xl overflow-hidden border border-white/10 shadow-premium-lg">
        <div className="px-6 py-4 bg-white/5 border-b border-white/5">
           <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Desglose de Incidencias Archivadas</h3>
        </div>
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-hp-dark/40 border-b border-white/5">
                <th className="p-5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Código</th>
                <th className="p-5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Clasificación Técnica</th>
                <th className="p-5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Nivel</th>
                <th className="p-5 text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">Eventos</th>
                <th className="p-5 text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">Último Registro</th>
              </tr>
            </thead>
              <tbody className="divide-y divide-white/5">
              {savedDetail.incidents.map((inc, i) => (
                <tr key={inc.code + String(i)} className="hover:bg-white/[0.04] transition-all group">
                  <td className="p-5 font-mono text-sm font-bold text-hp-blue-vibrant group-hover:text-white">{inc.code}</td>
                  <td className="p-5 text-xs text-slate-300 font-semibold">{inc.classification}</td>
                  <td className="p-5">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                      inc.severity.toUpperCase() === 'ERROR' ? 'border-accent-rose/40 text-accent-rose bg-accent-rose/5' :
                      inc.severity.toUpperCase() === 'WARNING' ? 'border-accent-amber/40 text-accent-amber bg-accent-amber/5' :
                      'border-hp-blue/40 text-hp-blue-vibrant bg-hp-blue/5'
                    }`}>
                      {inc.severity}
                    </span>
                  </td>
                  <td className="p-5 text-right text-sm font-mono font-bold text-slate-500">{inc.occurrences}</td>
                  <td className="p-5 text-right text-[10px] font-bold text-slate-600">
                    {inc.last_event_time || inc.end_time
                      ? formatDateTime(inc.last_event_time || inc.end_time)
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comparison Block */}
      {compareResult && (
        <div className="flex flex-col gap-6 animate-fade-in-up mt-8 border-t border-white/10 pt-12">
          <div className="flex flex-col">
             <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent-rose mb-1">Módulo de Diferenciales</span>
             <h3 className="font-display font-bold text-2xl text-white m-0">Análisis Delta <span className="text-slate-500 text-lg ml-2">(Vs. Log Nuevo)</span></h3>
          </div>

          {/* Diff Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Días Transcurridos', value: compareResult.diff.diferencia_dias, icon: '📅', color: 'text-slate-400' },
              { label: 'Tendencia General', value: compareResult.diff.tendencia, icon: '📈', color: compareResult.diff.tendencia.includes('Mejora') ? 'text-green-400' : 'text-accent-rose' },
              { label: 'Códigos Nuevos', value: compareResult.diff.codigos_nuevos.length, detail: compareResult.diff.codigos_nuevos.join(', ') || 'Ninguno', icon: '🆕', color: 'text-accent-rose' },
              { label: 'Resueltos', value: compareResult.diff.codigos_desaparecidos.length, detail: compareResult.diff.codigos_desaparecidos.join(', ') || 'Ninguno', icon: '✅', color: 'text-hp-blue-vibrant' }
            ].map((stat, i) => (
              <div key={i} className="glass-card p-6 border border-white/10 rounded-2xl flex items-start gap-4">
                 <span className="text-2xl pt-1">{stat.icon}</span>
                 <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{stat.label}</span>
                    <span className={`text-xl font-bold font-display ${stat.color}`}>{stat.value}</span>
                    {stat.detail && stat.detail !== 'Ninguno' && <span className="text-[9px] font-mono text-slate-600 mt-1 uppercase truncate max-w-[120px]">{stat.detail}</span>}
                 </div>
              </div>
            ))}
          </div>

          {/* Occurrence Changes */}
          {compareResult.diff.cambios_ocurrencias.length > 0 && (
            <div className="glass-card rounded-2xl border border-white/5 p-6 bg-white/[0.02]">
               <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                  <span className="text-base">🔄</span> Cambio en Frecuencias
               </h4>
               <div className="flex flex-wrap gap-3">
                  {compareResult.diff.cambios_ocurrencias.map((c) => (
                    <div key={c.code} className="px-4 py-3 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4 transition-all hover:bg-white/10">
                       <span className="text-xs font-mono font-bold text-hp-blue-vibrant">{c.code}</span>
                       <div className="flex items-center gap-2 text-[10px] font-bold">
                          <span className="text-slate-500">{c.saved_occurrences}</span>
                          <span className="text-slate-700">→</span>
                          <span className="text-white">{c.current_occurrences}</span>
                       </div>
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.delta > 0 ? 'bg-accent-rose/20 text-accent-rose' : 'bg-green-400/20 text-green-400'}`}>
                          {c.delta > 0 ? '+' : ''}{c.delta}
                       </span>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* New Analysis Table Mini */}
          <div className="glass-card rounded-3xl overflow-hidden border border-white/10 shadow-premium-lg mt-4 opacity-80 scale-[0.98] origin-top hover:scale-100 hover:opacity-100 transition-all duration-500">
            <div className="px-6 py-4 bg-hp-blue-vibrant/10 border-b border-hp-blue-vibrant/20 flex justify-between items-center">
               <h3 className="text-[10px] font-bold uppercase tracking-widest text-hp-blue-vibrant">Estado Actual del Log Procesado</h3>
               <span className="text-[10px] font-bold bg-hp-blue-vibrant text-white px-3 py-1 rounded-full animate-pulse">RESULTADO ACTUAL</span>
            </div>
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 max-h-[400px]">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10 bg-hp-dark/95 border-b border-white/5">
                  <tr className="text-left">
                    <th className="p-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Código</th>
                    <th className="p-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Clasificación</th>
                    <th className="p-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Nivel</th>
                    <th className="p-4 text-right text-[9px] font-bold uppercase tracking-widest text-slate-500">Eventos</th>
                    <th className="p-4 text-right text-[9px] font-bold uppercase tracking-widest text-slate-500">Última Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {compareResult.current.incidents.map((inc) => (
                    <tr key={inc.id} className="hover:bg-white/[0.04] transition-all">
                      <td className="p-4 font-mono text-xs font-bold text-slate-300">{inc.code}</td>
                      <td className="p-4 text-xs text-slate-400 transition-colors hover:text-white">{inc.classification}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold border ${
                          inc.severity.toUpperCase() === 'ERROR' ? 'border-accent-rose/30 text-accent-rose bg-accent-rose/5' :
                          inc.severity.toUpperCase() === 'WARNING' ? 'border-accent-amber/30 text-accent-amber bg-accent-amber/5' :
                          'border-hp-blue/30 text-hp-blue-vibrant bg-hp-blue/5'
                        }`}>
                          {inc.severity}
                        </span>
                      </td>
                      <td className="p-4 text-right text-xs font-mono font-bold text-slate-500">{inc.occurrences}</td>
                      <td className="p-4 text-right text-[9px] font-bold text-slate-600 italic">
                        {inc.end_time ? formatDateTime(inc.end_time) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
