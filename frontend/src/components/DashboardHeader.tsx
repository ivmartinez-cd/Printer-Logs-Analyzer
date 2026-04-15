import { useState, useEffect } from 'react'
import type { HealthStatus } from '../services/api'

function LiveClock({ className }: { className?: string }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <time className={className} dateTime={now.toISOString()}>
      {now.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
    </time>
  )
}

function DbStatusBadge({ status }: { status: HealthStatus | null }) {
  if (!status) return null
  const online = status.db_available
  return (
    <span
      className={`db-status-badge ${online ? 'db-status-badge--ok' : 'db-status-badge--offline'}`}
    >
      <span className="db-status-badge__dot" aria-hidden="true" />
      {online ? 'DB conectada' : 'DB offline · modo local'}
    </span>
  )
}

interface DashboardHeaderProps {
  logFileName: string | null
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
  logFileName,
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
    <header className="dashboard__header">
      <div className="dashboard__title-group">
        <svg
          className="dashboard__title-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
        <h1 className="dashboard__title">HP Logs Analyzer</h1>
      </div>
      <div className="dashboard__header-actions">
        <button
          type="button"
          className="dashboard__btn dashboard__btn--secondary"
          onClick={onOpenSavedList}
        >
          Incidentes guardados
        </button>
        <button
          type="button"
          className="dashboard__btn dashboard__btn--primary dashboard__btn--header-cta"
          onClick={onAnalyzeNew}
        >
          Analizar otro log
        </button>
        {hasResult && (
          <button
            type="button"
            className="dashboard__btn dashboard__btn--secondary"
            onClick={onSaveIncident}
          >
            Guardar incidente
          </button>
        )}
        {hasResult && (
          <button
            type="button"
            className="dashboard__btn dashboard__btn--secondary"
            onClick={onAddSds}
          >
            Asociar SDS
          </button>
        )}
        {hasResult && (
          <button
            type="button"
            className="dashboard__btn dashboard__btn--secondary"
            onClick={onExportPdf}
            disabled={exportingPdf}
          >
            {exportingPdf ? 'Generando PDF…' : 'Exportar PDF'}
          </button>
        )}
        <button
          type="button"
          className="dashboard__btn--help-icon"
          onClick={onHelp}
          title="¿Cómo funciona?"
          aria-label="Ayuda — ¿Cómo funciona?"
        >
          ?
        </button>
        <LiveClock className="dashboard__datetime" />
        <DbStatusBadge status={healthStatus} />
      </div>
    </header>
  )
}
