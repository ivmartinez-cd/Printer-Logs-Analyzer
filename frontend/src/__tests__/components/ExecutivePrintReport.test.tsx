// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ExecutivePrintReport } from '../../components/Analysis/ExecutivePrintReport'
import type {
  EnrichedEvent,
  Incident,
  ParseLogsResponse,
  RealtimeConsumable,
} from '../../types/api'
import type { IncidentRow } from '../../components/Parser/IncidentsTable'

function makeEvent(overrides: Partial<EnrichedEvent> = {}): EnrichedEvent {
  return {
    type: 'ERROR',
    code: '53.B0.02',
    timestamp: '2026-03-14T10:30:45Z',
    counter: 12345,
    firmware: 'v5.3.0',
    help_reference: null,
    code_severity: 'ERROR',
    code_description: 'Fuser error',
    code_solution_url: null,
    code_solution_content: null,
    ...overrides,
  }
}

function makeIncident(overrides: Partial<Incident> = {}): Incident {
  const events = overrides.events ?? [makeEvent()]
  return {
    id: 'incident-1',
    code: '53.B0.02',
    classification: 'Fuser error',
    severity: 'ERROR',
    severity_weight: 3,
    occurrences: events.length,
    start_time: events[0].timestamp,
    end_time: events[events.length - 1].timestamp,
    counter_range: [events[0].counter, events[events.length - 1].counter],
    events,
    sds_link: undefined,
    sds_solution_content: null,
    ...overrides,
  }
}

function makeIncidentRow(overrides: Partial<IncidentRow> = {}): IncidentRow {
  return {
    id: 'row-1',
    code: '53.B0.02',
    classification: 'Fuser error',
    severity: 'ERROR',
    severity_weight: 3,
    occurrences: 2,
    start_time: '2026-03-14T10:00:00Z',
    end_time: '2026-03-14T10:30:00Z',
    sds_link: null,
    sds_solution_content: null,
    eventsInWindow: [
      makeEvent({ timestamp: '2026-03-14T10:00:00Z', counter: 12000 }),
      makeEvent({ timestamp: '2026-03-14T10:30:00Z', counter: 12345 }),
    ],
    ...overrides,
  }
}

const baseResult: ParseLogsResponse = {
  events: [],
  incidents: [],
  global_severity: 'ERROR',
  errors: [],
  log_start_date: '2026-03-10T10:00:00Z',
  log_end_date: '2026-03-14T10:30:45Z',
  total_lines: 1800,
}

const baseProps = {
  result: baseResult,
  filteredIncidents: [makeIncident()],
  filteredEvents: [
    makeEvent({ counter: 12000 }),
    makeEvent({ code: '53.B0.02', counter: 12345, timestamp: '2026-03-14T10:30:00Z' }),
  ],
  consumableWarnings: [
    {
      type: 'TONER',
      description: 'Toner black',
      sku: 'W1480A',
      percentLeft: 8,
      pagesLeft: 300,
      daysLeft: 4,
    },
  ] satisfies RealtimeConsumable[],
  lastErrorLabel: '14/03/2026, 10:30',
  logFileName: 'Portal_SDS_SN123.tsv',
  serialNumber: 'SN123',
  modelName: 'HP LaserJet 800',
  topCodes: [
    { name: '53.B0.02', count: 4, severity: 'ERROR' },
    { name: '49.38.07', count: 2, severity: 'WARNING' },
  ],
  incidentRows: [makeIncidentRow()],
  generatedAtIso: '2026-03-14T11:00:00Z',
}

describe('ExecutivePrintReport', () => {
  it('renderiza la estructura ejecutiva y el anexo priorizado', () => {
    render(<ExecutivePrintReport {...baseProps} />)

    expect(screen.getByText('Reporte Ejecutivo de Salud del Equipo')).toBeInTheDocument()
    expect(screen.getAllByText('Prioridad alta').length).toBeGreaterThan(0)
    expect(screen.getByText('Conclusion y lectura gerencial')).toBeInTheDocument()
    expect(screen.getByText('Indicadores y focos de accion')).toBeInTheDocument()
    expect(screen.getByText('Incidentes priorizados')).toBeInTheDocument()
    expect(screen.getAllByText('53.B0.02').length).toBeGreaterThan(0)
    expect(screen.getByText('Toner black')).toBeInTheDocument()
  })

  it('muestra estado estable y empty states cuando no hay incidentes', () => {
    render(
      <ExecutivePrintReport
        {...baseProps}
        result={{ ...baseResult, global_severity: 'OK' }}
        filteredIncidents={[]}
        filteredEvents={[
          makeEvent({ type: 'INFO', code: '10.00.00', counter: 12000 }),
          makeEvent({ type: 'INFO', code: '10.00.00', counter: 12500, timestamp: '2026-03-14T10:30:00Z' }),
        ]}
        consumableWarnings={[]}
        lastErrorLabel={null}
        topCodes={[]}
        incidentRows={[]}
      />
    )

    expect(screen.getAllByText('Operacion estable').length).toBeGreaterThan(0)
    expect(
      screen.getByText('No hay códigos recurrentes para mostrar en la ventana filtrada.')
    ).toBeInTheDocument()
    expect(
      screen.getByText('No hay incidentes priorizados en la ventana filtrada.')
    ).toBeInTheDocument()
  })
})
