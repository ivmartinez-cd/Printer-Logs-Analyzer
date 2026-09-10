import { describe, it, expect } from 'vitest'
import { sortCases, groupByDevice, isAnalysisStale, buildKpis } from '../../components/Engineering/utils'
import type { EngineeringCase } from '../../types/api'

function makeCase(overrides: Partial<EngineeringCase> = {}): EngineeringCase {
  return {
    incident_id: '1',
    device_id: 'd1',
    serial: 'MXBCT0000A',
    customer: 'Cliente Demo',
    monitor: 'demo1',
    model: 'HP LASERJET E50145',
    firmware: 'fw1',
    estado: 'New',
    gravedad: 'Medium',
    tipo: 'ExpertRules',
    codigo: 'TriagePaperPath',
    probabilidad: null,
    plazo_dias: null,
    mediana_dias_a_fallo: null,
    creado: '2026-09-01T00:00:00Z',
    actualizado: '2026-09-01T00:00:00Z',
    analisis: null,
    ...overrides,
  }
}

describe('sortCases', () => {
  it('ordena por plazo asc, con nulls al final', () => {
    const cases = [
      makeCase({ incident_id: 'a', plazo_dias: 90 }),
      makeCase({ incident_id: 'b', plazo_dias: 5 }),
      makeCase({ incident_id: 'c', plazo_dias: null }),
    ]
    const sorted = sortCases(cases)
    expect(sorted.map((c) => c.incident_id)).toEqual(['b', 'a', 'c'])
  })

  it('desempata por gravedad cuando el plazo es igual', () => {
    const cases = [
      makeCase({ incident_id: 'medium', plazo_dias: 10, gravedad: 'Medium' }),
      makeCase({ incident_id: 'high', plazo_dias: 10, gravedad: 'High' }),
    ]
    const sorted = sortCases(cases)
    expect(sorted.map((c) => c.incident_id)).toEqual(['high', 'medium'])
  })

  it('desempata por fecha de creación (más viejo primero) si plazo y gravedad son iguales', () => {
    const cases = [
      makeCase({ incident_id: 'nuevo', creado: '2026-09-05T00:00:00Z' }),
      makeCase({ incident_id: 'viejo', creado: '2026-09-01T00:00:00Z' }),
    ]
    const sorted = sortCases(cases)
    expect(sorted.map((c) => c.incident_id)).toEqual(['viejo', 'nuevo'])
  })
})

describe('groupByDevice', () => {
  it('agrupa casos por device_id', () => {
    const cases = [
      makeCase({ incident_id: '1', device_id: 'd1' }),
      makeCase({ incident_id: '2', device_id: 'd1' }),
      makeCase({ incident_id: '3', device_id: 'd2' }),
    ]
    const grouped = groupByDevice(cases)
    expect(grouped.get('d1')).toHaveLength(2)
    expect(grouped.get('d2')).toHaveLength(1)
  })
})

describe('isAnalysisStale', () => {
  it('es true si el caso se actualizó después del análisis', () => {
    const c = makeCase({
      actualizado: '2026-09-10T00:00:00Z',
      analisis: { veredicto: 'monitorear', confianza: 'media', analizado_en: '2026-09-05T00:00:00Z', model: 'x' },
    })
    expect(isAnalysisStale(c)).toBe(true)
  })

  it('es false si el análisis es posterior a la actualización', () => {
    const c = makeCase({
      actualizado: '2026-09-01T00:00:00Z',
      analisis: { veredicto: 'monitorear', confianza: 'media', analizado_en: '2026-09-05T00:00:00Z', model: 'x' },
    })
    expect(isAnalysisStale(c)).toBe(false)
  })

  it('es false si no hay análisis (es "pendiente", no "stale")', () => {
    const c = makeCase({ analisis: null })
    expect(isAnalysisStale(c)).toBe(false)
  })
})

describe('buildKpis', () => {
  it('cuenta equipos (no casos) con más de un caso abierto', () => {
    const cases = [
      makeCase({ incident_id: '1', device_id: 'd1' }),
      makeCase({ incident_id: '2', device_id: 'd1' }),
      makeCase({ incident_id: '3', device_id: 'd2' }),
    ]
    expect(buildKpis(cases).equiposConVarios).toBe(1)
  })

  it('cuenta casos que vencen en <= 7 días', () => {
    const cases = [
      makeCase({ incident_id: '1', plazo_dias: 3 }),
      makeCase({ incident_id: '2', plazo_dias: 30 }),
    ]
    expect(buildKpis(cases).vencenEstaSemana).toBe(1)
  })

  it('cuenta descartables por veredicto', () => {
    const cases = [
      makeCase({
        incident_id: '1',
        analisis: { veredicto: 'descartar', confianza: 'alta', analizado_en: '2026-09-01T00:00:00Z', model: 'x' },
      }),
      makeCase({ incident_id: '2', analisis: null }),
    ]
    expect(buildKpis(cases).descartables).toBe(1)
  })
})
