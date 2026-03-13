import React from 'react'
import type { Event, Incident } from '../types/api'

interface KPIBarProps {
  incidents: Incident[]
  events: Event[]
  globalSeverity: string
}

function formatSeverity(value: string): string {
  const upper = (value || '').toUpperCase()
  if (upper === 'ERROR' || upper === 'WARNING' || upper === 'INFO') return upper
  return upper || 'INFO'
}

export function KPIBar({ incidents, events, globalSeverity }: KPIBarProps) {
  const totalIncidents = incidents.length
  const severity = formatSeverity(globalSeverity)
  const uniqueCodes = new Set(events.map((e) => e.code)).size
  const recentEvents = events.length

  return (
    <div className="kpi-bar">
        <div className="kpi-card">
          <span className="kpi-card__label">Incidentes</span>
          <span className="kpi-card__value">{totalIncidents}</span>
        </div>

        <div className={`kpi-card kpi-card--severity kpi-card--severity-${severity.toLowerCase()}`}>
          <span className="kpi-card__label">Severidad máxima</span>
          <span className="kpi-card__value">{severity}</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-card__label">Códigos únicos</span>
          <span className="kpi-card__value">{uniqueCodes}</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-card__label">Eventos recientes</span>
          <span className="kpi-card__value">{recentEvents}</span>
        </div>
      </div>
  )
}

