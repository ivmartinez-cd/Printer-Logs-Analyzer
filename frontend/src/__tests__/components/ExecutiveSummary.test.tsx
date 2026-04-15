// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ExecutiveSummary } from '../../components/ExecutiveSummary'
import type { ParseLogsResponse, Incident, EnrichedEvent } from '../../types/api'

const mockResult: ParseLogsResponse = {
  events: [],
  incidents: [],
  global_severity: 'OK',
  errors: [],
  log_start_date: '2026-03-01T10:00:00Z',
  log_end_date: '2026-03-10T10:00:00Z',
  total_lines: 1000,
}

const defaultProps = {
  result: mockResult,
  filteredIncidents: [],
  filteredEvents: [],
  consumableWarnings: [],
  lastErrorLabel: null,
  logFileName: 'test-log.txt',
  serialNumber: 'SN12345',
}

describe('ExecutiveSummary', () => {
  it('muestras el estado "Estable" cuando no hay incidentes', () => {
    render(<ExecutiveSummary {...defaultProps} />)
    expect(screen.getByText('Estable')).toBeInTheDocument()
    expect(screen.getByText('Sin incidentes críticos registrados')).toBeInTheDocument()
  })

  it('muestra el estado "Crítico" cuando hay incidentes de tipo ERROR', () => {
    const incidents: Incident[] = [
      {
        id: '1',
        code: '60.00.02',
        severity: 'ERROR',
        severity_weight: 10,
        occurrences: 5,
        start_time: '2026-03-01T10:00:00Z',
        end_time: '2026-03-01T11:00:00Z',
        classification: 'Critical error',
        counter_range: [100, 200],
        events: [],
      },
    ]
    render(<ExecutiveSummary {...defaultProps} filteredIncidents={incidents} />)
    expect(screen.getByText('Crítico')).toBeInTheDocument()
    expect(screen.getAllByText(/60\.00\.02/).length).toBeGreaterThanOrEqual(1)
  })

  it('muestra alertas de consumibles para reemplazo', () => {
    const warnings: any[] = [
      {
        sku: 'W123',
        description: 'Toner Black',
        type: 'TONER',
        percentLeft: 5,
        pagesLeft: 500,
        daysLeft: 10,
      },
    ]
    render(<ExecutiveSummary {...defaultProps} consumableWarnings={warnings} />)
    // Buscamos el texto específico del badge para evitar falsos positivos con otros "1"
    expect(screen.getByText('1 para reemplazo inmediato')).toBeInTheDocument()
  })

  it('calcula correctamente la densidad de errores', () => {
    const events: EnrichedEvent[] = [
      { type: 'ERROR', code: 'E1', timestamp: '...', counter: 1000, firmware: null, help_reference: null },
      { type: 'ERROR', code: 'E2', timestamp: '...', counter: 2000, firmware: null, help_reference: null },
      { type: 'INFO', code: 'I1', timestamp: '...', counter: 1500, firmware: null, help_reference: null },
    ]
    // Rango: 2000 - 1000 = 1000 páginas.
    // Errores: 2.
    // Densidad: 2 errores / 1.000 pág. = 2.0 (por toFixed(1))
    render(<ExecutiveSummary {...defaultProps} filteredEvents={events} />)
    
    const labelElement = screen.getByText(/errores por 1\.000 pág\./)
    const densityElement = labelElement.previousElementSibling
    expect(densityElement?.textContent).toBe('2.0')
  })
})
