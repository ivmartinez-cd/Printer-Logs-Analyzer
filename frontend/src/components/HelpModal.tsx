interface HelpModalProps {
  onClose: () => void
}

export function HelpModal({ onClose }: HelpModalProps) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-hp-dark/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="glass-card w-full max-w-4xl max-h-[85vh] shadow-premium-glow animate-scale-in overflow-hidden border border-white/10 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-white/5 bg-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-hp-blue-vibrant mb-1">Centro de Conocimiento</span>
            <h2 className="font-display font-bold text-2xl text-white m-0 tracking-tight">Manual Operativo <span className="text-hp-blue-vibrant">Logs Analyzer</span></h2>
          </div>
          <button 
            type="button" 
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all focus:outline-none border border-white/5" 
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-white/10 bg-hp-dark/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            
            {/* FLUJO DE ANÁLISIS */}
            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-3 border-b border-hp-blue/20 pb-2">
                <span className="text-xl">🛠️</span>
                <h3 className="font-display font-bold text-lg text-white uppercase tracking-wider">Flujo de Análisis</h3>
              </div>
              <div className="flex flex-col gap-3">
                 {[
                   { t: 'Deep Link (Técnicos)', d: 'Acceso directo vía /SERIALNUMBER. Resolución y extracción SDS 100% automatizada.' },
                   { t: 'Extracción por Serial', d: 'Ingreso manual de serial. El sistema orquesta Login -> Búsqueda -> Análisis.' },
                   { t: 'Ingesta Manual', d: 'Carga de archivos de texto o pegado directo. Requiere selección de modelo.' }
                 ].map((step, i) => (
                   <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/[0.08] transition-all">
                      <strong className="block text-xs text-hp-blue-vibrant uppercase tracking-widest mb-1">{step.t}</strong>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-medium">{step.d}</p>
                   </div>
                 ))}
              </div>
            </section>

            {/* KPIs & MÉTRICAS */}
            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-3 border-b border-hp-blue/20 pb-2">
                <span className="text-xl">📊</span>
                <h3 className="font-display font-bold text-lg text-white uppercase tracking-wider">Métricas e Inteligencia</h3>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { l: 'Estado de Salud', d: 'Conteo en tiempo real de incidentes ERROR, WARNING e INFO.' },
                  { l: 'Tasa de Errores', d: 'Frecuencia de fallas por volumen de impresión (Error c/N pág).' },
                  { l: 'Diagnóstico IA', d: 'Análisis forense ejecutado por Claude Opus 4.6 con pasos accionables.' },
                  { l: 'Insights en Vivo', d: 'Conexión directa con HP Insight API para alertas activas.' }
                ].map((kpi, i) => (
                   <div key={i} className="flex gap-4 p-3 hover:bg-white/5 rounded-xl transition-all">
                      <span className="text-hp-blue-vibrant font-mono font-bold text-[10px] pt-1">0{i+1}</span>
                      <div className="flex flex-col">
                         <span className="text-xs font-bold text-white mb-0.5">{kpi.l}</span>
                         <span className="text-[10px] text-slate-500 font-medium leading-tight">{kpi.d}</span>
                      </div>
                   </div>
                ))}
              </div>
            </section>

            {/* ESTADO DE CONSUMIBLES */}
            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-3 border-b border-hp-blue/20 pb-2">
                <span className="text-xl">🔋</span>
                <h3 className="font-display font-bold text-lg text-white uppercase tracking-wider">Estado de Consumibles</h3>
              </div>
              <div className="space-y-4">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                   Integración híbrida entre catálogo local <strong>CPMD</strong> y telemetría de <strong>Insight API</strong>.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-green-400/5 border border-green-400/20 rounded-xl text-center">
                     <span className="block text-[8px] font-bold text-green-400 uppercase tracking-widest">Normal</span>
                     <span className="text-[9px] text-slate-500">Uso < 80%</span>
                  </div>
                  <div className="p-3 bg-accent-amber/5 border border-accent-amber/20 rounded-xl text-center">
                     <span className="block text-[8px] font-bold text-accent-amber uppercase tracking-widest">Atención</span>
                     <span className="text-[9px] text-slate-500">80% - 99%</span>
                  </div>
                  <div className="p-3 bg-accent-rose/5 border border-accent-rose/20 rounded-xl text-center col-span-2">
                     <span className="block text-[8px] font-bold text-accent-rose uppercase tracking-widest">Revisión Crítica</span>
                     <span className="text-[9px] text-slate-500">Supera 100% de vida útil teórica</span>
                  </div>
                </div>
              </div>
            </section>

            {/* COMPARATIVA & HISTORIAS */}
            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-3 border-b border-hp-blue/20 pb-2">
                <span className="text-xl">📂</span>
                <h3 className="font-display font-bold text-lg text-white uppercase tracking-wider">Historial y Auditoría</h3>
              </div>
              <ul className="space-y-3">
                 <li className="flex gap-2 text-[11px] text-slate-400 leading-relaxed">
                    <span className="text-hp-blue-vibrant">•</span>
                    <span><strong>Snapshots:</strong> Guardado persistente de análisis para auditoría posterior.</span>
                 </li>
                 <li className="flex gap-2 text-[11px] text-slate-400 leading-relaxed">
                    <span className="text-hp-blue-vibrant">•</span>
                    <span><strong>Análisis Delta:</strong> Comparación forense entre un historial y un log nuevo para detectar tendencias.</span>
                 </li>
                 <li className="flex gap-2 text-[11px] text-slate-400 leading-relaxed">
                    <span className="text-hp-blue-vibrant">•</span>
                    <span><strong>Exportación Ejecutiva:</strong> Generación de reportes PDF en formato Light de alta fidelidad.</span>
                 </li>
              </ul>
            </section>

          </div>

          <div className="mt-12 p-6 bg-hp-blue-vibrant/5 border border-hp-blue-vibrant/10 rounded-3xl flex flex-col md:flex-row items-center gap-6">
             <div className="text-3xl">💡</div>
             <p className="text-xs text-slate-300 font-medium leading-relaxed italic">
                <strong>Consejo Profesional:</strong> Utilice siempre el número de serie para habilitar la potencia completa de la IA y los KPI de Insight API. El sistema correlaciona eventos del log con el estado real del hardware.
             </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 bg-white/5 border-t border-white/5 flex justify-end">
          <button
            type="button"
            className="px-12 py-3 rounded-full bg-hp-blue-vibrant text-white font-bold text-[11px] uppercase tracking-widest hover:shadow-premium-glow hover:scale-105 transition-all shadow-premium-sm"
            onClick={onClose}
          >
            Entendido, Comencemos
          </button>
        </div>
      </div>
    </div>
  )
}
