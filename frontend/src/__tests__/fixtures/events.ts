import type { EnrichedEvent, Incident } from '../../types/api'
import type { IncidentRow } from '../../components/IncidentsTable'

export function mockEvent(overrides: Partial<EnrichedEvent> = {}): EnrichedEvent {
  return {
    type: 'ERROR',
    code: '53.B0.02',
    timestamp: '2024-03-14T10:30:45',
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

export function mockIncident(overrides: Partial<Incident> = {}): Incident {
  const events = overrides.events ?? [mockEvent()]
  return {
    id: `${events[0].code}-${events[0].timestamp}`,
    code: events[0].code,
    classification: events[0].code_description ?? events[0].code,
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

export function mockIncidentRow(overrides: Partial<IncidentRow> = {}): IncidentRow {
  const evt = mockEvent()
  return {
    id: `${evt.code}-${evt.timestamp}`,
    code: evt.code,
    classification: evt.code_description ?? evt.code,
    severity: 'ERROR',
    severity_weight: 3,
    occurrences: 1,
    start_time: evt.timestamp,
    end_time: evt.timestamp,
    sds_link: null,
    sds_solution_content: null,
    eventsInWindow: [evt],
    ...overrides,
  }
}

export const mockIncidents: Incident[] = [
  mockIncident({
    code: '53.B0.02',
    severity: 'ERROR',
    severity_weight: 3,
    events: [
      mockEvent({ code: '53.B0.02', timestamp: '2024-03-14T10:00:00', counter: 100 }),
      mockEvent({ code: '53.B0.02', timestamp: '2024-03-14T10:30:00', counter: 101 }),
    ],
  }),
  mockIncident({
    code: '49.38.07',
    severity: 'WARNING',
    severity_weight: 2,
    classification: 'Firmware update recommended',
    events: [
      mockEvent({
        type: 'WARNING',
        code: '49.38.07',
        code_severity: 'WARNING',
        code_description: 'Firmware update recommended',
        timestamp: '2024-03-15T09:00:00',
        counter: 200,
      }),
    ],
  }),
  mockIncident({
    code: '10.00.00',
    severity: 'INFO',
    severity_weight: 1,
    events: [
      mockEvent({
        type: 'INFO',
        code: '10.00.00',
        code_severity: 'INFO',
        code_description: 'Supply memory',
        timestamp: '2024-03-16T14:00:00',
        counter: 300,
      }),
    ],
  }),
]

export const mockEvents: EnrichedEvent[] = mockIncidents.flatMap((i) => i.events)
