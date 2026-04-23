import { useState, useEffect } from 'react'
import type { HealthStatus } from '../../services/api'

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
  healthStatus: HealthStatus | null
  hasResult: boolean
  exportingPdf: boolean
  onOpenSavedList: () => void
  onAnalyzeNew: () => void
  onSaveIncident: () => void
  onAddSds: () => void
  onExportPdf: () => void
  onHelp: () => void
  isAtTop?: boolean
  showSavedListButton?: boolean
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
  isAtTop = true,
  showSavedListButton = true,
}: DashboardHeaderProps) {
  return (
    <header className={`dashboard__header ${isAtTop ? 'at-top' : ''}`}>
      <div 
        className="dashboard__title-group dashboard__title-group--interactive"
        onClick={() => window.location.href = '/'}
      >
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
        {showSavedListButton && (
          <button
            type="button"
            className="dashboard__btn--icon"
            onClick={onOpenSavedList}
            data-tooltip="Incidentes guardados"
            aria-label="Ver incidentes guardados"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        )}
        {hasResult && (
          <button
            type="button"
            className="dashboard__btn--icon dashboard__btn--icon--primary"
            onClick={onAnalyzeNew}
            data-tooltip="Analizar otro log"
            aria-label="Analizar otro archivo de log"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </button>
        )}
        {hasResult && (
          <button
            type="button"
            className="dashboard__btn--icon"
            onClick={onSaveIncident}
            data-tooltip="Guardar incidente"
            aria-label="Guardar análisis actual como incidente"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
            </svg>
          </button>
        )}
        {hasResult && (
          <button
            type="button"
            className="dashboard__btn--icon"
            onClick={onAddSds}
            data-tooltip="Asociar SDS"
            aria-label="Asociar con portal HP SDS"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </button>
        )}
        {hasResult && (
          <button
            type="button"
            className="dashboard__btn--icon"
            onClick={onExportPdf}
            disabled={exportingPdf}
            data-tooltip={exportingPdf ? 'Generando PDF…' : 'Exportar PDF'}
            aria-label="Exportar reporte a PDF"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
        )}
        <button
          type="button"
          className="dashboard__btn--help-icon"
          onClick={onHelp}
          data-tooltip="¿Cómo funciona?"
          aria-label="Ayuda — ¿Cómo funciona?"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </button>
        <LiveClock className="dashboard__datetime" />
        <DbStatusBadge status={healthStatus} />
      </div>
    </header>
  )
}


