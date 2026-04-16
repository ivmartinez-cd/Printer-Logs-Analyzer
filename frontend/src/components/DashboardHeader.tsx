import { useState, useEffect } from 'react'
import type { HealthStatus } from '../services/api'
import { DbStatusBadge } from './DbStatusBadge'

function LiveClock({ className }: { className?: string }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000) // Minute enough for short clock
    return () => clearInterval(t)
  }, [])
  return (
    <time className={className} dateTime={now.toISOString()}>
      {now.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
    </time>
  )
}

interface DashboardHeaderProps {
  healthStatus: HealthStatus | null
  hasResult: boolean
  exportingPdf: boolean
  onOpenSavedList: () => void
  onAnalyzeNew: () => void
  onSaveIncident: () => void
  onAddSds: () => void
  onExportPdf: () => void
  onHelp: () => void
}

export function DashboardHeader({
  healthStatus,
  hasResult,
  exportingPdf,
  onOpenSavedList,
  onAnalyzeNew,
  onSaveIncident,
  onAddSds,
  onExportPdf,
  onHelp,
}: DashboardHeaderProps) {
  return (
    <header className="glass-card flex items-center justify-between px-6 py-4 rounded-3xl sticky top-2 z-50 animate-fade-in-up">
      <div className="flex items-center gap-4">
        <div className="bg-hp-blue/10 p-2 rounded-xl border border-hp-blue/20">
          <svg
            className="w-5 h-5 text-hp-blue-vibrant"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
        </div>
        <h1 className="font-display text-xl font-bold tracking-tight text-white m-0">
          HP Logs Analyzer
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
          <button
            type="button"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all"
            onClick={onOpenSavedList}
          >
            Historial
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-hp-blue-vibrant/20 border border-hp-blue-vibrant/20 hover:bg-hp-blue-vibrant/30 transition-all"
            onClick={onAnalyzeNew}
          >
            Nuevo Análisis
          </button>
        </div>

        {hasResult && (
          <div className="flex items-center gap-2 border-l border-white/10 pl-3 ml-1">
            <HeaderAction 
              icon="💾" 
              label="Guardar" 
              onClick={onSaveIncident} 
            />
            <HeaderAction 
              icon="🔗" 
              label="SDS" 
              onClick={onAddSds} 
            />
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-hp-dark hover:bg-slate-200 transition-all disabled:opacity-50"
              onClick={onExportPdf}
              disabled={exportingPdf}
            >
              {exportingPdf ? 'Generando...' : 'Exportar PDF'}
            </button>
          </div>
        )}

        <div className="hidden lg:flex items-center gap-4 border-l border-white/10 pl-4 ml-1">
          <LiveClock className="text-xs font-medium text-slate-500 font-mono" />
          <DbStatusBadge status={healthStatus} />
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-hp-blue-vibrant hover:border-hp-blue-vibrant/40 transition-all"
            onClick={onHelp}
            title="Ayuda"
          >
             ?
          </button>
        </div>
      </div>
    </header>
  )
}

function HeaderAction({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
      onClick={onClick}
    >
      <span className="text-sm opacity-70 group-hover:opacity-100">{icon}</span>
      {label}
    </button>
  )
}
