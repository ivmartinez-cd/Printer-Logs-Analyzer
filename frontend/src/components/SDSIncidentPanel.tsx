import React, { useState } from 'react'
import type { SdsIncidentData } from './SDSIncidentModal'
import type { ConsumableWarning } from '../types/api'

type SdsVsLogStatus = 'match' | 'partial' | 'no_match' | 'general'

interface IncidentRowForSds {
  code: string
  classification: string
}

interface IncidentFullForSds {
  code: string
  end_time: string
  /** Número de eventos del incidente (para "Eventos relacionados"). Opcional. */
  occurrences?: number
  /** Clasificación/descripción del incidente — usada para match por mensaje. */
  classification?: string
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

/**
 * True si el valor SDS parece un código numérico HP (ej. "60.00.02", "53.B0.0z").
 * Heurística: contiene un punto — los identificadores de mensaje no lo tienen.
 */
function isNumericSdsCode(value: string): boolean {
  return value.includes('.')
}

/** Normaliza un string para match por mensaje: minúsculas, sin espacios ni guiones. */
function normalizeForMessageMatch(s: string): string {
  return s.toLowerCase().replace(/[\s_-]/g, '')
}

/** Stopwords descartadas al extraer keywords de un identificador SDS de mensaje. */
const SDS_STOPWORDS = new Set(['replace', 'check', 'clean', 'verify', 'reset', 'the', 'a'])

/** Mínimo de keywords del token SDS que deben aparecer en la clasificación del incidente. */
const MIN_KEYWORD_MATCHES = 1

/**
 * Extrae keywords significativas de un identificador CamelCase SDS.
 * Ej: "ReplaceTrayPickRollers" → ["tray", "pick", "roller"]
 * - Parte por CamelCase
 * - Lowercase + singular básico (quita "s" final si length > 3)
 * - Descarta stopwords y palabras de ≤ 1 carácter
 */
function extractSdsKeywords(token: string): string[] {
  const words = token
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(/\s+/)
    .map((w) => w.toLowerCase())
    .map((w) => (w.endsWith('s') && w.length > 3 ? w.slice(0, -1) : w))
    .filter((w) => w.length > 1 && !SDS_STOPWORDS.has(w))
  return [...new Set(words)]
}

/**
 * Compara un token SDS contra un incidente del log.
 * - Código numérico (contiene ".") → match exacto o por prefijo wildcard z
 * - Identificador de mensaje (ej. "ReplaceTrayPickRollers") → extrae keywords
 *   significativas por CamelCase y busca al menos MIN_KEYWORD_MATCHES en la
 *   clasificación del incidente (case-insensitive). Ej. "roller" aparece en
 *   "Tray Z feed roller at end of life." → match.
 */
function sdsTokenMatchesIncident(
  incidentCode: string,
  incidentClassification: string,
  sdsToken: string
): boolean {
  const token = sdsToken.trim()
  if (!token) return false
  if (isNumericSdsCode(token)) {
    return incidentCodeMatchesSds(incidentCode, token)
  }
  const keywords = extractSdsKeywords(token)
  if (keywords.length === 0) return false
  const normalizedClassification = normalizeForMessageMatch(incidentClassification ?? '')
  let matchCount = 0
  for (const kw of keywords) {
    if (normalizedClassification.includes(kw)) matchCount++
  }
  return matchCount >= MIN_KEYWORD_MATCHES
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

/**
 * Extrae todos los tokens a usar para el match contra el log:
 * 1. "Contexto evento" (event_context) como código primario — ej. "60.00.02"
 * 2. Tokens en "Más información" separados por "or" — ej. "60.00.02 or 60.01.02"
 * 3. "Código" (sds.code) cuando es un identificador CamelCase con keywords significativas,
 *    ej. "ReplaceTrayPickRollers" → keywords ["tray","pick","roller"].
 *    Se excluyen IDs internos con dígitos (ej. "TriageInput2") y stopwords sueltas (ej. "Replace").
 */
function getSdsCodesForMatch(sds: SdsIncidentData): string[] {
  const codes: string[] = []

  const ctx = sds.event_context?.trim()
  if (ctx) codes.push(ctx)

  const moreInfo = sds.more_info?.trim()
  if (moreInfo) {
    const parts = moreInfo
      .split(/\s+or\s+/i)
      .map((s) => s.trim())
      .filter(Boolean)
    for (const part of parts) {
      if (!codes.includes(part)) codes.push(part)
    }
  }

  // Include sds.code when it's a CamelCase message identifier:
  // - not a numeric HP code (no dots)
  // - no digits (excludes internal IDs like "TriageInput2")
  // - produces ≥1 meaningful keyword (excludes pure stopwords like "Replace")
  const code = sds.code?.trim()
  if (code && !isNumericSdsCode(code) && !/\d/.test(code)) {
    const kws = extractSdsKeywords(code)
    if (kws.length > 0 && !codes.includes(code)) codes.push(code)
  }

  return codes
}

/** Total de eventos del log que coinciden con cualquiera de los tokens SDS. */
function getEventosRelacionadosCount(
  sds: SdsIncidentData,
  incidentsFull: IncidentFullForSds[]
): number {
  const sdsCodes = getSdsCodesForMatch(sds)
  if (sdsCodes.length === 0) return 0
  const matching = incidentsFull.filter((i) =>
    sdsCodes.some((c) => sdsTokenMatchesIncident(i.code, i.classification ?? '', c))
  )
  return matching.reduce((sum, i) => sum + (i.occurrences ?? 1), 0)
}

function computeSdsVsLog(
  sds: SdsIncidentData,
  incidentRows: IncidentRowForSds[],
  incidentsFull: IncidentFullForSds[],
  eventosRelacionadosCount: number
): { status: SdsVsLogStatus; explanation: string } {
  const sdsCodes = getSdsCodesForMatch(sds)
  if (sdsCodes.length === 0) {
    return {
      status: 'general',
      explanation: 'SDS de tipo general — sin código de evento específico',
    }
  }

  const matchedInFiltered = sdsCodes.filter((c) =>
    incidentRows.some((r) => sdsTokenMatchesIncident(r.code, r.classification, c))
  )
  const matchedInFull = sdsCodes.filter((c) =>
    incidentsFull.some((i) => sdsTokenMatchesIncident(i.code, i.classification ?? '', c))
  )

  if (matchedInFiltered.length > 0) {
    return {
      status: 'match',
      explanation: `${matchedInFiltered.join(', ')} — ${eventosRelacionadosCount} eventos detectados`,
    }
  }
  if (matchedInFull.length > 0) {
    return {
      status: 'partial',
      explanation: `${matchedInFull.join(', ')} — ${eventosRelacionadosCount} eventos detectados`,
    }
  }
  return { status: 'no_match', explanation: 'no hay eventos del código' }
}

function getLastEventRelated(sds: SdsIncidentData, incidentsFull: IncidentFullForSds[]): string {
  const sdsCodes = getSdsCodesForMatch(sds)
  if (sdsCodes.length === 0) return '—'
  const matching = incidentsFull.filter((i) =>
    sdsCodes.some((c) => sdsTokenMatchesIncident(i.code, i.classification ?? '', c))
  )
  if (matching.length === 0) return '—'
  const latest = matching.sort(
    (a, b) => new Date(b.end_time).getTime() - new Date(a.end_time).getTime()
  )[0]
  if (!latest?.end_time) return '—'
  return formatLastEvent(latest.end_time)
}

/**
 * Devuelve los consumibles cuyo matched_codes solapa con los códigos del SDS.
 * Usa incidentCodeMatchesSds para respetar el wildcard "z".
 */
function getOverlappingConsumables(
  sds: SdsIncidentData,
  consumableWarnings: ConsumableWarning[]
): ConsumableWarning[] {
  const sdsCodes = getSdsCodesForMatch(sds)
  if (sdsCodes.length === 0) return []
  return consumableWarnings.filter((w) =>
    w.matched_codes.some((mc) => sdsCodes.some((sc) => incidentCodeMatchesSds(mc, sc)))
  )
}

function ConsumableStatusLabel({ status }: { status: ConsumableWarning['status'] }) {
  if (status === 'replace') return <span className="sds-consumable__badge sds-consumable__badge--replace">Revisar historial</span>
  if (status === 'warning') return <span className="sds-consumable__badge sds-consumable__badge--warning">Próximo a revisar</span>
  return <span className="sds-consumable__badge sds-consumable__badge--ok">Sin alertas</span>
}

interface SDSIncidentPanelProps {
  sdsIncident: SdsIncidentData
  incidentRows: IncidentRowForSds[]
  /** Lista completa de incidencias del log (para Parcial y Último evento). Opcional para no romper uso existente. */
  incidentsFull?: IncidentFullForSds[]
  /** Advertencias de consumibles del análisis actual. Si hay solapamiento con los códigos del SDS se muestra la sección "Verificar historial". */
  consumableWarnings?: ConsumableWarning[]
}

export function SDSIncidentPanel({
  sdsIncident,
  incidentRows,
  incidentsFull = [],
  consumableWarnings = [],
}: SDSIncidentPanelProps) {
  const [collapsed, setCollapsed] = useState(true)
  const estadoSds = getEstadoSds(sdsIncident.created_at)
  const isGeneral = getSdsCodesForMatch(sdsIncident).length === 0
  const overlappingConsumables = getOverlappingConsumables(sdsIncident, consumableWarnings)
  const eventosRelacionadosCount = isGeneral
    ? null
    : getEventosRelacionadosCount(sdsIncident, incidentsFull)
  const sdsVsLog = computeSdsVsLog(
    sdsIncident,
    incidentRows,
    incidentsFull,
    eventosRelacionadosCount ?? 0
  )
  const lastEventRelated = isGeneral ? '—' : getLastEventRelated(sdsIncident, incidentsFull)

  const sdsVsLogLabel =
    sdsVsLog.status === 'match'
      ? '✔ Coincide'
      : sdsVsLog.status === 'partial'
        ? '⚠ Parcial'
        : sdsVsLog.status === 'general'
          ? 'ℹ️ SDS de tipo general'
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
    { label: 'Eventos relacionados', value: eventosRelacionadosCount ?? '—' },
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
        <>
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
                    <td
                      className={`sds-incident-panel__value${muted ? ' sds-incident-panel__value--muted' : ''}`}
                    >
                      {value ?? '—'}
                    </td>
                  </tr>
                ))}
                <tr className="sds-incident-panel__vs-row">
                  <td className="sds-incident-panel__label">SDS vs Log</td>
                  <td
                    className="sds-incident-panel__value sds-incident-panel__value--with-explanation"
                    data-status={sdsVsLog.status}
                  >
                    <span className="sds-incident-panel__vs-status">{sdsVsLogLabel}</span>
                    <span className="sds-incident-panel__vs-explanation">{sdsVsLog.explanation}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {overlappingConsumables.length > 0 && (
            <div className="sds-consumable">
              <p className="sds-consumable__title">Verificar historial de consumibles</p>
              <p className="sds-consumable__note">
                Los siguientes consumibles tienen códigos relacionados con este SDS. Verificá en el
                historial del equipo cuándo fue el último reemplazo antes de actuar.
              </p>
              <table className="dashboard-table sds-consumable__table">
                <thead>
                  <tr>
                    <th scope="col">Descripción</th>
                    <th scope="col">Part number</th>
                    <th scope="col">Vida útil</th>
                    <th scope="col">Uso</th>
                    <th scope="col">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {overlappingConsumables.map((w) => (
                    <tr key={w.part_number} data-status={w.status}>
                      <td>{w.description}</td>
                      <td><code className="consumable-warnings-panel__part">{w.part_number}</code></td>
                      <td className="consumable-warnings-panel__num">{w.life_pages.toLocaleString('es-AR')} págs</td>
                      <td className="consumable-warnings-panel__num">{w.usage_pct.toFixed(1)}%</td>
                      <td><ConsumableStatusLabel status={w.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  )
}
