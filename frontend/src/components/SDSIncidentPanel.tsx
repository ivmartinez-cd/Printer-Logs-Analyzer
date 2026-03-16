import React, { useState } from 'react'
import type { SdsIncidentData } from './SDSIncidentModal'

type SdsVsLogStatus = 'match' | 'partial' | 'no_match'

interface IncidentRowForSds {
  code: string
  classification: string
}

interface IncidentFullForSds {
  code: string
  end_time: string
  /** Número de eventos del incidente (para "Eventos relacionados"). Opcional. */
  occurrences?: number
}

/**
 * Si el código SDS termina en "z", se trata como prefijo (ej. 53.B0.0z → 53.B0.0).
 * Si no, se usa el código tal cual para comparación exacta.
 */
function getSdsMatchPrefix(sdsCode: string): string {
  const trimmed = sdsCode.trim()
  if (!trimmed) return trimmed
  if (trimmed.toLowerCase().endsWith('z')) {
    return trimmed.slice(0, -1)
  }
  return trimmed
}

/** True si el código de incidente coincide con el código SDS (exacto o por prefijo si SDS termina en "z"). */
function incidentCodeMatchesSds(incidentCode: string, sdsCode: string): boolean {
  const inc = (incidentCode ?? '').trim()
  const sds = (sdsCode ?? '').trim()
  if (!sds) return false
  const prefix = getSdsMatchPrefix(sds)
  if (prefix === sds) {
    return inc === sds
  }
  return inc.startsWith(prefix)
}

/** Parsea fecha SDS (ej. "14-mar-2026 10:30:00" o ISO). Devuelve null si no se puede parsear. */
function parseSdsDate(value: string | null): Date | null {
  if (!value?.trim()) return null
  const d = new Date(value.trim())
  return Number.isNaN(d.getTime()) ? null : d
}

/** Diferencia en milisegundos; created_at puede ser string. */
function getEstadoSds(createdAt: string | null): { label: string; icon: string } {
  const created = parseSdsDate(createdAt)
  if (!created) return { label: '—', icon: '⚪' }
  const now = Date.now()
  const diffMs = now - created.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  const diffDays = diffHours / 24
  if (diffHours <= 24) return { label: '🔴 Activo', icon: '🔴' }
  if (diffDays <= 3) return { label: '🟡 Reciente', icon: '🟡' }
  return { label: '⚪ Viejo', icon: '⚪' }
}

/** Formato para "Último evento": "13-mar-2026 (hace 2 días)". */
function formatLastEvent(dateStr: string): string {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  const day = d.getDate()
  const month = d.toLocaleString('es', { month: 'short' })
  const year = d.getFullYear()
  const datePart = `${day}-${month}-${year}`
  const now = Date.now()
  const diffMs = now - d.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  let relPart: string
  if (diffMins < 60) relPart = `hace ${diffMins} min`
  else if (diffHours < 24) relPart = `hace ${diffHours} h`
  else if (diffDays === 1) relPart = 'hace 1 día'
  else relPart = `hace ${diffDays} días`
  return `${datePart} (${relPart})`
}

/** Código a usar para comparar con el log: "Más información" (53.B0.0z) si existe, sino "Código" (ReplaceTrayPickRollers). */
function getSdsCodeForMatch(sds: SdsIncidentData): string {
  return (sds.more_info ?? sds.code ?? '').trim()
}

/** Total de eventos del log que coinciden con el SDS (mismo matching). */
function getEventosRelacionadosCount(sds: SdsIncidentData, incidentsFull: IncidentFullForSds[]): number {
  const sdsCodeForMatch = getSdsCodeForMatch(sds)
  if (!sdsCodeForMatch) return 0
  const matching = incidentsFull.filter((i) => incidentCodeMatchesSds(i.code, sdsCodeForMatch))
  return matching.reduce((sum, i) => sum + (i.occurrences ?? 1), 0)
}

function computeSdsVsLog(
  sds: SdsIncidentData,
  incidentRows: IncidentRowForSds[],
  incidentsFull: IncidentFullForSds[],
  eventosRelacionadosCount: number
): { status: SdsVsLogStatus; explanation: string } {
  const sdsCodeForMatch = getSdsCodeForMatch(sds)
  if (!sdsCodeForMatch) {
    return { status: 'no_match', explanation: 'no hay eventos del código' }
  }

  const hasMatchInFiltered = incidentRows.some((r) => incidentCodeMatchesSds(r.code, sdsCodeForMatch))
  const hasMatchInFull = incidentsFull.some((i) => incidentCodeMatchesSds(i.code, sdsCodeForMatch))

  if (hasMatchInFiltered) {
    return { status: 'match', explanation: `${eventosRelacionadosCount} eventos detectados` }
  }
  if (hasMatchInFull) {
    return { status: 'partial', explanation: `${eventosRelacionadosCount} eventos detectados` }
  }
  return { status: 'no_match', explanation: 'no hay eventos del código' }
}

function getLastEventRelated(
  sds: SdsIncidentData,
  incidentsFull: IncidentFullForSds[]
): string {
  const sdsCodeForMatch = getSdsCodeForMatch(sds)
  if (!sdsCodeForMatch) return '—'
  const matching = incidentsFull.filter((i) => incidentCodeMatchesSds(i.code, sdsCodeForMatch))
  if (matching.length === 0) return '—'
  const latest = matching.sort((a, b) => new Date(b.end_time).getTime() - new Date(a.end_time).getTime())[0]
  if (!latest?.end_time) return '—'
  return formatLastEvent(latest.end_time)
}

interface SDSIncidentPanelProps {
  sdsIncident: SdsIncidentData
  incidentRows: IncidentRowForSds[]
  /** Lista completa de incidencias del log (para Parcial y Último evento). Opcional para no romper uso existente. */
  incidentsFull?: IncidentFullForSds[]
}

export function SDSIncidentPanel({
  sdsIncident,
  incidentRows,
  incidentsFull = [],
}: SDSIncidentPanelProps) {
  const [collapsed, setCollapsed] = useState(true)
  const estadoSds = getEstadoSds(sdsIncident.created_at)
  const eventosRelacionadosCount = getEventosRelacionadosCount(sdsIncident, incidentsFull)
  const sdsVsLog = computeSdsVsLog(sdsIncident, incidentRows, incidentsFull, eventosRelacionadosCount)
  const lastEventRelated = getLastEventRelated(sdsIncident, incidentsFull)

  const sdsVsLogLabel =
    sdsVsLog.status === 'match'
      ? '✔ Coincide'
      : sdsVsLog.status === 'partial'
        ? '⚠ Parcial'
        : '❌ No coincide'

  const rows: { label: string; value: React.ReactNode; muted?: boolean }[] = [
    { label: 'Código', value: sdsIncident.code },
    { label: 'Más información', value: sdsIncident.more_info },
    { label: 'Contexto evento', value: sdsIncident.event_context },
    { label: 'Severidad', value: sdsIncident.severity },
    { label: 'Fecha creación', value: sdsIncident.created_at },
    { label: 'Firmware', value: sdsIncident.firmware },
    { label: 'Contador', value: sdsIncident.impressions },
    { label: 'Último evento', value: lastEventRelated },
    { label: 'Eventos relacionados', value: eventosRelacionadosCount },
    { label: 'Estado SDS', value: estadoSds.label, muted: estadoSds.label === '⚪ Viejo' },
  ]

  return (
    <section className="section dashboard__table-section dashboard__table-section--collapsible">
      <button
        type="button"
        className="section__title section__title--toggle"
        onClick={() => setCollapsed((c) => !c)}
        {...(collapsed ? { 'aria-expanded': 'false' } : { 'aria-expanded': 'true' })}
      >
        <span>SDS Engineering Incident</span>
        <span className="section__toggle-icon" aria-hidden>
          {collapsed ? '▶' : '▼'}
        </span>
      </button>
      {!collapsed && (
        <div className="table-wrap">
          <table className="dashboard-table sds-incident-panel__table">
            <thead>
              <tr>
                <th scope="col">Campo</th>
                <th scope="col">Valor</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ label, value, muted }) => (
                <tr key={label}>
                  <td className="sds-incident-panel__label">{label}</td>
                  <td className={`sds-incident-panel__value${muted ? ' sds-incident-panel__value--muted' : ''}`}>
                    {value ?? '—'}
                  </td>
                </tr>
              ))}
              <tr className="sds-incident-panel__vs-row">
                <td className="sds-incident-panel__label">SDS vs Log</td>
                <td className="sds-incident-panel__value sds-incident-panel__value--with-explanation" data-status={sdsVsLog.status}>
                  <span className="sds-incident-panel__vs-status">{sdsVsLogLabel}</span>
                  <span className="sds-incident-panel__vs-explanation">{sdsVsLog.explanation}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
