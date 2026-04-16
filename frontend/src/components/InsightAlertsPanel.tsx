import { useState } from 'react'
import type { DeviceAlertsResponse, InsightAlert } from '../types/api'

function SeverityBadge({ level }: { level: number }) {
  const label = level >= 4 ? 'Crítico' : level >= 3 ? 'Moderado' : 'Bajo'
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
      level >= 4 ? 'bg-accent-rose/10 text-accent-rose border border-accent-rose/20' : 
      level >= 3 ? 'bg-accent-amber/10 text-accent-amber border border-accent-amber/20' : 
      'bg-hp-blue/10 text-hp-blue-vibrant border border-hp-blue/20'
    }`}>
      {label}
    </span>
  )
}

function AlertsTable({ alerts, emptyText }: { alerts: InsightAlert[]; emptyText: string }) {
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
        <span className="text-3xl mb-3">✅</span>
        <p className="text-sm text-slate-400 max-w-xs">{emptyText}</p>
      </div>
    )
  }
  return (
    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-white/[0.02] border-b border-white/5">
            <th className="p-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Fecha</th>
            <th className="p-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Clase</th>
            <th className="p-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Descripción</th>
            <th className="p-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Severidad</th>
            <th className="p-4 text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">Motor</th>
            <th className="p-4 text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">Estado / Cierre</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {alerts.map((a, i) => (
            <tr key={`${a.date}-${a.mibCode}-${i}`} className="hover:bg-white/[0.03] transition-colors group">
              <td className="p-4 text-[11px] text-slate-500 font-mono whitespace-nowrap">{formatDate(a.date)}</td>
              <td className="p-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {ALERT_CLASS_LABEL[a.alertClass] ?? a.alertClass}
                </span>
              </td>
              <td className="p-4 text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">{a.description}</td>
              <td className="p-4">
                <SeverityBadge level={a.severityLevel} />
              </td>
              <td className="p-4 text-right text-xs font-mono text-slate-400 font-bold">
                {a.engineCycles.toLocaleString('es-AR')}
              </td>
              <td className="p-4 text-right">
                {a.cleared ? (
                  <span className="text-[10px] text-slate-600 font-medium">Resuelta: {formatDate(a.cleared)}</span>
                ) : (
                  <span className="flex items-center justify-end gap-2 text-[10px] font-bold text-accent-rose uppercase tracking-widest animate-pulse">
                    Activa <span className="w-1.5 h-1.5 rounded-full bg-accent-rose shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface InsightAlertsPanelProps {
  serial: string | null
  data: DeviceAlertsResponse | null
  loading: boolean
  error: string | null
}

export function InsightAlertsPanel({ serial, data, loading, error }: InsightAlertsPanelProps) {
  const [collapsed, setCollapsed] = useState(true)
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current')

  if (!serial) return null
  if (data && !data.insight_configured) return null

  const currentAlerts = data?.current ?? []
  const historyAlerts = data?.history ?? []
  const totalAlerts = currentAlerts.length + historyAlerts.length
  const hasActiveAlert = currentAlerts.length > 0

  return (
    <div className={`glass-card rounded-3xl overflow-hidden shadow-premium-md animate-fade-in-up border-l-4 transition-all ${hasActiveAlert ? 'border-l-accent-rose' : 'border-l-hp-blue/40'}`}>
      <button
        type="button"
        className="w-full flex items-center justify-between p-5 bg-white/5 hover:bg-white/[0.08] transition-all group"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
      >
        <div className="flex items-center gap-3">
          <span className={`text-xl transition-transform duration-500 ${hasActiveAlert ? 'animate-pulse scale-110' : 'group-hover:scale-110'}`}>
            {hasActiveAlert ? '🔔' : '🔕'}
          </span>
          <span className="font-display font-bold text-lg text-white">Alertas del portal SDS</span>
          {serial && <span className="text-xs font-semibold text-hp-blue-vibrant opacity-60">· {serial}</span>}
          {!loading && data && <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">({totalAlerts})</span>}
        </div>
        <span className={`text-slate-500 group-hover:text-white transition-all transform duration-300 ${!collapsed ? 'rotate-90' : ''}`}>
           ▶
        </span>
      </button>

      {!collapsed && (
        <div className="flex flex-col bg-hp-dark/20">
          {loading ? (
            <div className="flex flex-col items-center gap-4 py-12">
              <span className="w-8 h-8 border-4 border-hp-blue/20 border-t-hp-blue-vibrant rounded-full animate-spin" />
              <span className="text-hp-blue-vibrant font-semibold animate-pulse">Consultando portal HP SDS…</span>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-accent-rose text-sm font-medium animate-shake">
               ⚠️ {error}
            </div>
          ) : data && data.insight_configured && (
            <div className="animate-scale-in">
              {(data.model || data.zone) && (
                <div className="px-6 py-4 flex gap-6 text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-white/5">
                  {data.model && <span className="flex items-center gap-2">📠 <span className="text-slate-300">{data.model}</span></span>}
                  {data.zone && <span className="flex items-center gap-2">📍 <span className="text-slate-300">{data.zone}</span></span>}
                </div>
              )}

              <div className="flex items-center border-b border-white/5 bg-white/[0.02] px-4">
                {[
                  { id: 'current', label: 'Alertas Activas', count: currentAlerts.length, color: 'text-accent-rose' },
                  { id: 'history', label: 'Historial de Eventos', count: historyAlerts.length, color: 'text-hp-blue-vibrant' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`relative px-6 py-4 text-[10px] font-bold uppercase tracking-[0.15em] transition-all hover:text-white ${
                      activeTab === tab.id ? 'text-white' : 'text-slate-500'
                    }`}
                    onClick={() => setActiveTab(tab.id as any)}
                  >
                    <div className="flex items-center gap-3">
                      {tab.label}
                      {tab.count > 0 && (
                        <span className={`px-2 py-0.5 rounded-full bg-white/5 text-[9px] ${activeTab === tab.id ? tab.color : 'text-slate-600'}`}>
                          {tab.count}
                        </span>
                      )}
                    </div>
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-hp-blue-vibrant shadow-premium-glow" />
                    )}
                  </button>
                ))}
              </div>

              <div className="p-2">
                 {activeTab === 'current' ? (
                    <AlertsTable alerts={currentAlerts} emptyText="No se detectaron alertas críticas activas en este momento." />
                 ) : (
                    <AlertsTable alerts={historyAlerts} emptyText="No se registran eventos previos recolectados." />
                 )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
  )
}
