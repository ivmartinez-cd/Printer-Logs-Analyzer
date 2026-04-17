import { useState } from 'react'

interface RealtimeConsumable {
  description?: string
  type?: string
  sku?: string
  percentLeft?: number
  pagesLeft?: number
  daysLeft?: number
  colour?: string
}

interface ConsumableWarningsPanelProps {
  warnings: any[] // we use any[] from frontend state, cast it locally
}

const CATEGORY_ICON: Record<string, string> = {
  TONER: '🖨️',
  FUSER: '🔥',
  MAINTENANCE_KIT: '🔧',
  TRANSFER_KIT: '↔️',
  CLEANING: '🧹',
  UNKNOWN: '⚙️',
}

function formatPages(n?: number): string {
  if (n === undefined || n === null) return 'N/A'
  return n.toLocaleString('es-AR') + ' págs'
}

export function ConsumableWarningsPanel({ warnings }: ConsumableWarningsPanelProps) {
  const [collapsed, setCollapsed] = useState(true)

  if (!warnings || warnings.length === 0) return null

  // Treat as alert if anything is below 15%
  const hasAlert = warnings.some((w) => typeof w.percentLeft === 'number' && w.percentLeft < 15)

  return (
    <div className={`glass-card rounded-3xl overflow-hidden shadow-premium-md animate-fade-in-up border-l-4 ${hasAlert ? 'border-l-accent-rose' : 'border-l-hp-blue-vibrant'}`}>
      <button
        type="button"
        className="w-full flex items-center justify-between px-5 py-3 bg-white/5 hover:bg-white/[0.08] transition-all group"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
      >
        <div className="flex items-center gap-3">
          <span className={`text-lg transition-transform duration-500 ${hasAlert ? 'animate-pulse scale-110' : 'group-hover:scale-110'}`}>
            {hasAlert ? '🚨' : '⚙️'}
          </span>
          <span className="font-display font-bold text-sm text-white uppercase tracking-tight">Estado de consumibles en tiempo real ({warnings.length})</span>
        </div>
        <span className={`text-slate-500 group-hover:text-white transition-all transform duration-300 ${!collapsed ? 'rotate-90 text-[10px]' : 'text-[10px]'}`}>
           ▶
        </span>
      </button>

      {!collapsed && (
        <div className="flex flex-col bg-hp-dark/20 p-6">
          <p className="text-xs text-slate-500 italic mb-6 border-l-2 border-white/10 pl-3">
            Valores en tiempo real recolectados vía EKM Insight Portal para este hardware específico.
          </p>

          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5">
                  <th className="p-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Categoría</th>
                  <th className="p-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Descripción</th>
                  <th className="p-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">SKU / Parte</th>
                  <th className="p-4 text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">Est. Restante</th>
                  <th className="p-4 text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">Nivel Actual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {warnings.map((w: RealtimeConsumable, idx) => {
                  const pct = w.percentLeft || 0
                  const isCritical = pct < 15
                  const isWarning = pct < 30
                  const typeKey = (w.type || 'UNKNOWN').toUpperCase()
                  
                  return (
                    <tr key={`${idx}-${w.sku}`} className="hover:bg-white/[0.03] transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg opacity-70 group-hover:opacity-100 transition-opacity">
                            {CATEGORY_ICON[typeKey] ?? '⚙️'}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{typeKey}</span>
                        </div>
                      </td>
                      <td className="p-4 text-xs font-semibold text-slate-200">{w.description || 'Desconocido'}</td>
                      <td className="p-4">
                        <code className="text-[10px] font-mono bg-white/5 px-2 py-1 rounded text-slate-500 group-hover:text-hp-blue-vibrant transition-colors">
                          {w.sku || 'N/A'}
                        </code>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-300">{formatPages(w.pagesLeft)}</span>
                          <span className="text-[10px] text-slate-600 italic">~{w.daysLeft ?? '?'} días</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1.5 min-w-[120px]">
                           <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-1000 ease-out rounded-full ${
                                  isCritical ? 'bg-gradient-to-r from-accent-rose to-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 
                                  isWarning ? 'bg-gradient-to-r from-accent-amber to-yellow-400 shadow-[0_0_8px_rgba(245,158,11,0.3)]' : 
                                  'bg-gradient-to-r from-hp-blue-vibrant to-cyan-400'
                                }`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                           </div>
                           <span className={`text-[10px] font-mono font-bold text-right ${
                             isCritical ? 'text-accent-rose' : 
                             isWarning ? 'text-accent-amber' : 
                             'text-hp-blue-vibrant'
                           }`}>
                             {pct.toFixed(1)}%
                           </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
