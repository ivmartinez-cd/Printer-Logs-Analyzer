/**
 * Métricas de salud para la vista de monitoreo (NOC) del Historial de Incidentes.
 *
 * IMPORTANTE: el dispositivo no expone telemetría de uptime en tiempo real.
 * Estas métricas son ESTIMACIONES derivadas de los incidentes analizados
 * (severidad, cantidad, duración y variación entre lecturas).
 * Se etiquetan visualmente como estimación.
 */

export type DeviceStatus = 'critical' | 'watch' | 'healthy'
export type Trend = 'up' | 'down' | 'stable'
export type Impact = 'high' | 'medium' | 'low'

/** Forma mínima de un incidente, compatible con Incident y SavedAnalysisIncidentItem. */
export interface IncidentLike {
  code: string
  classification: string
  severity: string
  occurrences: number
  start_time: string
  end_time: string
}

export interface ActiveAlert {
  code: string
  severity: string
  description: string
  persistenceHours: number
  label: string
}

export interface CodeTrend {
  code: string
  description: string
  severity: string
  trend: Trend
  impact: Impact
}

const isError = (sev: string) => (sev || '').toUpperCase() === 'ERROR'
const isWarning = (sev: string) => (sev || '').toUpperCase() === 'WARNING'

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function durationHours(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime()
  const end = new Date(endIso).getTime()
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 0
  return (end - start) / 3_600_000
}

/** Estado general: ERROR → crítico; solo WARNING → atención; ninguno → saludable. */
export function computeDeviceStatus(incidents: IncidentLike[]): DeviceStatus {
  if (incidents.some((i) => isError(i.severity))) return 'critical'
  if (incidents.some((i) => isWarning(i.severity))) return 'watch'
  return 'healthy'
}

/**
 * Health score 0–100. Parte de 100 y penaliza por incidentes de error
 * (y sus ocurrencias) y, en menor medida, por advertencias.
 */
export function computeHealthScore(incidents: IncidentLike[]): number {
  const errors = incidents.filter((i) => isError(i.severity))
  const warnings = incidents.filter((i) => isWarning(i.severity))
  const errorOcc = errors.reduce((acc, i) => acc + (i.occurrences || 0), 0)
  const penalty = errors.length * 12 + errorOcc * 0.5 + warnings.length * 4
  return Math.round(clamp(100 - penalty, 0, 100))
}

/**
 * Disponibilidad estimada: 1 − (tiempo total con incidentes de error / ventana total).
 * La ventana se deriva del rango temporal de los propios incidentes.
 * Fallback a 100% si no hay ventana válida.
 */
export function computeAvailability(incidents: IncidentLike[]): number {
  const starts = incidents.map((i) => new Date(i.start_time).getTime()).filter((t) => !Number.isNaN(t))
  const ends = incidents.map((i) => new Date(i.end_time).getTime()).filter((t) => !Number.isNaN(t))
  if (starts.length === 0 || ends.length === 0) return 100
  const windowH = (Math.max(...ends) - Math.min(...starts)) / 3_600_000
  if (windowH <= 0) return 100
  const downtimeH = incidents
    .filter((i) => isError(i.severity))
    .reduce((acc, i) => acc + durationHours(i.start_time, i.end_time), 0)
  const availability = (1 - downtimeH / windowH) * 100
  return Math.round(clamp(availability, 0, 100) * 10) / 10
}

/** Alertas activas (incidentes abiertos), ordenadas: errores primero, luego por persistencia. */
export function computeActiveAlerts(incidents: IncidentLike[]): ActiveAlert[] {
  return incidents
    .filter((i) => isError(i.severity) || isWarning(i.severity))
    .map((i) => {
      const hours = Math.round(durationHours(i.start_time, i.end_time))
      const label = isError(i.severity)
        ? `Persistente durante ${hours} h`
        : `Detectada hace ${hours} h`
      return {
        code: i.code,
        severity: i.severity.toUpperCase(),
        description: i.classification || i.code,
        persistenceHours: hours,
        label,
      }
    })
    .sort((a, b) => {
      if (a.severity !== b.severity) return a.severity === 'ERROR' ? -1 : 1
      return b.persistenceHours - a.persistenceHours
    })
}

function impactForIncident(inc: IncidentLike): Impact {
  if (isError(inc.severity)) return 'high'
  if (isWarning(inc.severity) && (inc.occurrences || 0) >= 5) return 'medium'
  return 'low'
}

/**
 * Tabla operacional de tendencias por código (errores y advertencias).
 * Si se pasa `prevOccByCode` (ocurrencias de la lectura anterior), la tendencia
 * se calcula comparando contra esa lectura; si no, queda en 'stable'.
 */
export function computeCodeTrends(
  incidents: IncidentLike[],
  prevOccByCode?: Record<string, number>
): CodeTrend[] {
  return incidents
    .filter((i) => isError(i.severity) || isWarning(i.severity))
    .map((i) => {
      let trend: Trend = 'stable'
      if (prevOccByCode) {
        const prev = prevOccByCode[i.code] ?? 0
        const cur = i.occurrences || 0
        trend = cur > prev ? 'up' : cur < prev ? 'down' : 'stable'
      }
      return {
        code: i.code,
        description: i.classification || i.code,
        severity: i.severity.toUpperCase(),
        trend,
        impact: impactForIncident(i),
      }
    })
    .sort((a, b) => {
      if (a.severity !== b.severity) return a.severity === 'ERROR' ? -1 : 1
      return 0
    })
}

/** Ordena por fecha descendente y limita. Genérico sobre cualquier item con timestamp. */
export function recentEvents<T extends { timestamp: string }>(items: T[], limit = 12): T[] {
  return [...items]
    .filter((e) => !Number.isNaN(new Date(e.timestamp).getTime()))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit)
}

/** Formato relativo en español: "hace 2 minutos", "hace 3 horas", "hace 5 días". */
export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return '—'
  const diffMs = Date.now() - t
  if (diffMs < 0) return 'hace instantes'
  const min = Math.floor(diffMs / 60_000)
  if (min < 1) return 'hace instantes'
  if (min < 60) return `hace ${min} minuto${min !== 1 ? 's' : ''}`
  const hours = Math.floor(min / 60)
  if (hours < 24) return `hace ${hours} hora${hours !== 1 ? 's' : ''}`
  const days = Math.floor(hours / 24)
  if (days < 30) return `hace ${days} día${days !== 1 ? 's' : ''}`
  const months = Math.floor(days / 30)
  if (months < 12) return `hace ${months} mes${months !== 1 ? 'es' : ''}`
  const years = Math.floor(months / 12)
  return `hace ${years} año${years !== 1 ? 's' : ''}`
}
