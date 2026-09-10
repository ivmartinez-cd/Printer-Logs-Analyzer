import type { EngineeringCase } from '../../types/api'

const GRAVEDAD_ORDER: Record<string, number> = { High: 0, Medium: 1 }

/** Orden de triage por defecto: plazo asc (sin dato al final) -> gravedad -> creado asc. */
export function sortCases(cases: EngineeringCase[]): EngineeringCase[] {
  return [...cases].sort((a, b) => {
    const aPlazo = a.plazo_dias ?? Infinity
    const bPlazo = b.plazo_dias ?? Infinity
    if (aPlazo !== bPlazo) return aPlazo - bPlazo

    const aGrav = GRAVEDAD_ORDER[a.gravedad ?? ''] ?? 2
    const bGrav = GRAVEDAD_ORDER[b.gravedad ?? ''] ?? 2
    if (aGrav !== bGrav) return aGrav - bGrav

    const aCreado = a.creado ?? ''
    const bCreado = b.creado ?? ''
    return aCreado.localeCompare(bCreado)
  })
}

export function groupByDevice(cases: EngineeringCase[]): Map<string, EngineeringCase[]> {
  const map = new Map<string, EngineeringCase[]>()
  for (const c of cases) {
    const list = map.get(c.device_id) ?? []
    list.push(c)
    map.set(c.device_id, list)
  }
  return map
}

/** true si el caso cambió en el portal después del último análisis (badge "desactualizado"). */
export function isAnalysisStale(c: EngineeringCase): boolean {
  if (!c.analisis?.analizado_en || !c.actualizado) return false
  return new Date(c.analisis.analizado_en).getTime() < new Date(c.actualizado).getTime()
}

export function relativeDays(iso: string | null): string {
  if (!iso) return '—'
  const diffMs = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (days <= 0) return 'hoy'
  if (days === 1) return 'hace 1 día'
  return `hace ${days} días`
}

export interface EngineeringKpis {
  vencenEstaSemana: number
  equiposConVarios: number
  sinAnalisisVigente: number
  descartables: number
}

export function buildKpis(cases: EngineeringCase[]): EngineeringKpis {
  const byDevice = groupByDevice(cases)
  let equiposConVarios = 0
  for (const list of byDevice.values()) {
    if (list.length > 1) equiposConVarios += 1
  }

  let vencenEstaSemana = 0
  let sinAnalisisVigente = 0
  let descartables = 0
  for (const c of cases) {
    if (c.plazo_dias !== null && c.plazo_dias <= 7) vencenEstaSemana += 1
    if (!c.analisis || isAnalysisStale(c)) sinAnalisisVigente += 1
    if (c.analisis?.veredicto === 'descartar') descartables += 1
  }

  return { vencenEstaSemana, equiposConVarios, sinAnalisisVigente, descartables }
}
