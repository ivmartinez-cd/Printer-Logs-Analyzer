import { describe, it, expect } from 'vitest'
import {
  computeDeviceStatus,
  computeHealthScore,
  computeAvailability,
  computeActiveAlerts,
  computeCodeTrends,
  recentEvents,
  relativeTime,
  type IncidentLike,
} from '../components/Monitor/healthMetrics'

function inc(partial: Partial<IncidentLike>): IncidentLike {
  return {
    code: '60.00.03',
    classification: 'Bandeja opcional',
    severity: 'ERROR',
    occurrences: 1,
    start_time: '2026-01-01T00:00:00Z',
    end_time: '2026-01-01T01:00:00Z',
    ...partial,
  }
}

describe('computeDeviceStatus', () => {
  it('crítico si hay error', () => {
    expect(computeDeviceStatus([inc({ severity: 'ERROR' })])).toBe('critical')
  })
  it('atención si solo warning', () => {
    expect(computeDeviceStatus([inc({ severity: 'WARNING' })])).toBe('watch')
  })
  it('saludable si no hay incidentes', () => {
    expect(computeDeviceStatus([])).toBe('healthy')
  })
})

describe('computeHealthScore', () => {
  it('100 sin incidentes', () => {
    expect(computeHealthScore([])).toBe(100)
  })
  it('penaliza errores', () => {
    // 100 - (12 + 4*0.5) = 86
    expect(computeHealthScore([inc({ severity: 'ERROR', occurrences: 4 })])).toBe(86)
  })
  it('clamp a 0', () => {
    const many = Array.from({ length: 20 }, () => inc({ severity: 'ERROR', occurrences: 10 }))
    expect(computeHealthScore(many)).toBe(0)
  })
})

describe('computeAvailability', () => {
  it('100% sin incidentes', () => {
    expect(computeAvailability([])).toBe(100)
  })
  it('descuenta duración de errores sobre la ventana observada', () => {
    // ventana 0..24h (warning marca el fin), error de 1h => ~95.8%
    const a = computeAvailability([
      inc({ severity: 'ERROR', start_time: '2026-01-01T00:00:00Z', end_time: '2026-01-01T01:00:00Z' }),
      inc({ severity: 'WARNING', start_time: '2026-01-01T00:00:00Z', end_time: '2026-01-02T00:00:00Z' }),
    ])
    expect(a).toBeCloseTo(95.8, 1)
  })
  it('fallback 100 si fechas inválidas', () => {
    expect(computeAvailability([inc({ start_time: 'bad', end_time: 'bad' })])).toBe(100)
  })
})

describe('computeActiveAlerts', () => {
  it('ordena errores primero y calcula persistencia', () => {
    const alerts = computeActiveAlerts([
      inc({ code: 'W1', severity: 'WARNING', start_time: '2026-01-01T00:00:00Z', end_time: '2026-01-01T03:00:00Z' }),
      inc({ code: 'E1', severity: 'ERROR', start_time: '2026-01-01T00:00:00Z', end_time: '2026-01-01T18:00:00Z' }),
    ])
    expect(alerts[0].code).toBe('E1')
    expect(alerts[0].persistenceHours).toBe(18)
    expect(alerts[0].label).toContain('Persistente')
    expect(alerts[1].label).toContain('Detectada')
  })
})

describe('computeCodeTrends', () => {
  it('sin lectura previa => estable, impacto por severidad', () => {
    const trends = computeCodeTrends([inc({ severity: 'ERROR' })])
    expect(trends[0].trend).toBe('stable')
    expect(trends[0].impact).toBe('high')
  })
  it('detecta aumento vs lectura previa', () => {
    const trends = computeCodeTrends(
      [inc({ code: 'E1', severity: 'ERROR', occurrences: 5 })],
      { E1: 2 }
    )
    expect(trends[0].trend).toBe('up')
  })
  it('warning con muchas ocurrencias => impacto medio', () => {
    const trends = computeCodeTrends([inc({ severity: 'WARNING', occurrences: 6 })])
    expect(trends[0].impact).toBe('medium')
  })
})

describe('recentEvents', () => {
  it('ordena descendente y limita', () => {
    const r = recentEvents(
      [
        { timestamp: '2026-01-01T00:00:00Z', code: 'A' },
        { timestamp: '2026-01-03T00:00:00Z', code: 'B' },
        { timestamp: '2026-01-02T00:00:00Z', code: 'C' },
      ],
      2
    )
    expect(r.map((e) => e.code)).toEqual(['B', 'C'])
  })
})

describe('relativeTime', () => {
  it('maneja inválido', () => {
    expect(relativeTime(null)).toBe('—')
  })
  it('minutos recientes', () => {
    const iso = new Date(Date.now() - 2 * 60_000).toISOString()
    expect(relativeTime(iso)).toBe('hace 2 minutos')
  })
})
