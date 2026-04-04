import React from 'react'
import type { EnrichedEvent as ApiEvent, Incident as ApiIncident } from '../types/api'

interface KPICardsProps {
  filteredIncidents: ApiIncident[]
  filteredEvents: ApiEvent[]
  lastErrorEvent: ApiEvent | null
  lastErrorLabel: string | null
}

export function KPICards({ filteredIncidents, filteredEvents, lastErrorEvent, lastErrorLabel }: KPICardsProps) {
  const errorCount = filteredIncidents.filter((i) => i.severity.toUpperCase() === 'ERROR').length
  const warningCount = filteredIncidents.filter((i) => i.severity.toUpperCase() === 'WARNING').length
  const infoCount = filteredIncidents.filter((i) => i.severity.toUpperCase() === 'INFO').length

  return (
    <div className="kpis">
      <div className="kpi-card">
        <div className="kpi-card__label">Estado de errores</div>
        <div className="kpi-card__values">
          <span className="kpi-card__value kpi-card__value--error">{errorCount}</span>
          <span className="kpi-card__values-sep">·</span>
          <span className="kpi-card__value kpi-card__value--warning">{warningCount}</span>
          <span className="kpi-card__values-sep">·</span>
          <span className="kpi-card__value kpi-card__value--info">{infoCount}</span>
        </div>
        <div className="kpi-card__sub">crítico · advertencia · info</div>
      </div>
      <div className="kpi-card">
        <div className="kpi-card__label">Incidencias Activas</div>
        <div className="kpi-card__value">{filteredIncidents.length}</div>
        <div className="kpi-card__sub">incidentes detectados en el log</div>
      </div>
      <div className="kpi-card">
        <div className="kpi-card__label">Último error crítico</div>
        {lastErrorEvent ? (
          <>
            <div className="kpi-card__value kpi-card__value--error" style={{ fontSize: '1rem', fontWeight: 700 }}>
              {lastErrorEvent.code}
            </div>
            <div className="kpi-card__sub">{lastErrorLabel} · último error registrado</div>
          </>
        ) : (
          <>
            <div className="kpi-card__value" style={{ fontSize: '1rem', color: 'var(--color-success, #22c55e)' }}>
              Sin errores
            </div>
            <div className="kpi-card__sub">último error registrado</div>
          </>
        )}
      </div>
      <div className="kpi-card">
        <div className="kpi-card__label">Eventos Registrados</div>
        <div className="kpi-card__value">{filteredEvents.length}</div>
        <div className="kpi-card__sub">eventos registrados en el log</div>
      </div>
    </div>
  )
}
