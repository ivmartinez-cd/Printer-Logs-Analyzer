import { describe, it, expect } from 'vitest'
import {
  filterEventsByDate,
  filterIncidentsByDate,
  getWeekRange,
  weekInputToRange,
  getDateRangeFromEvents,
  formatWeekRange,
} from '../hooks/useDateFilter'
import type { EnrichedEvent as ApiEvent, Incident as ApiIncident } from '../types/api'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEvent(code: string, timestamp: string, type = 'ERROR'): ApiEvent {
  return {
    type,
    code,
    timestamp,
    counter: 1,
    firmware: null,
    help_reference: null,
    code_severity: null,
    code_description: null,
    code_solution_url: null,
    code_solution_content: null,
  }
}

function makeIncident(code: string, start: string, end: string): ApiIncident {
  return {
    id: `${code}-${start}`,
    code,
    classification: code,
    severity: 'ERROR',
    severity_weight: 3,
    occurrences: 1,
    start_time: start,
    end_time: end,
    counter_range: [1, 1],
    events: [makeEvent(code, start)],
  }
}

// ---------------------------------------------------------------------------
// filterEventsByDate
// ---------------------------------------------------------------------------

describe('filterEventsByDate', () => {
  const events = [
    makeEvent('A', '2024-03-14T10:00:00'),
    makeEvent('B', '2024-03-15T10:00:00'),
    makeEvent('C', '2024-03-20T10:00:00'),
  ]

  it('returns all events when filter is null', () => {
    expect(filterEventsByDate(events, null)).toHaveLength(3)
  })

  it('returns only events matching specific day', () => {
    const result = filterEventsByDate(events, '2024-03-14')
    expect(result).toHaveLength(1)
    expect(result[0].code).toBe('A')
  })

  it('returns events within a week range', () => {
    const result = filterEventsByDate(events, { start: '2024-03-14', end: '2024-03-16' })
    expect(result).toHaveLength(2)
    const codes = result.map((e) => e.code)
    expect(codes).toContain('A')
    expect(codes).toContain('B')
  })

  it('returns empty array when no events match the day', () => {
    const result = filterEventsByDate(events, '2024-01-01')
    expect(result).toHaveLength(0)
  })

  it('includes events at the exact boundary of the range', () => {
    const result = filterEventsByDate(events, { start: '2024-03-20', end: '2024-03-20' })
    expect(result).toHaveLength(1)
    expect(result[0].code).toBe('C')
  })
})

// ---------------------------------------------------------------------------
// filterIncidentsByDate
// ---------------------------------------------------------------------------

describe('filterIncidentsByDate', () => {
  const incidents = [
    makeIncident('A', '2024-03-14T10:00:00', '2024-03-14T12:00:00'),
    makeIncident('B', '2024-03-20T09:00:00', '2024-03-20T11:00:00'),
  ]
  const events = incidents.flatMap((i) => i.events)

  it('returns all incidents when filter is null', () => {
    expect(filterIncidentsByDate(incidents, events, null)).toHaveLength(2)
  })

  it('filters incidents by day', () => {
    const result = filterIncidentsByDate(incidents, events, '2024-03-14')
    expect(result).toHaveLength(1)
    expect(result[0].code).toBe('A')
  })

  it('filters incidents by week range', () => {
    const result = filterIncidentsByDate(incidents, events, {
      start: '2024-03-14',
      end: '2024-03-16',
    })
    expect(result).toHaveLength(1)
    expect(result[0].code).toBe('A')
  })
})

// ---------------------------------------------------------------------------
// getWeekRange
// ---------------------------------------------------------------------------

describe('getWeekRange', () => {
  it('returns Monday as start of the week', () => {
    const thursday = new Date('2024-03-14') // Thursday
    const { start } = getWeekRange(thursday)
    expect(start).toBe('2024-03-11') // Monday
  })

  it('returns Sunday as end of the week', () => {
    const thursday = new Date('2024-03-14')
    const { end } = getWeekRange(thursday)
    expect(end).toBe('2024-03-17') // Sunday
  })

  it('Monday of a week returns itself as start', () => {
    // Use local date constructor to avoid UTC timezone shift
    const monday = new Date(2024, 2, 11) // March 11, 2024 local time
    const { start } = getWeekRange(monday)
    expect(start).toBe('2024-03-11')
  })
})

// ---------------------------------------------------------------------------
// weekInputToRange — boundary: week 1 crossing year boundary
// ---------------------------------------------------------------------------

describe('weekInputToRange', () => {
  it('converts YYYY-Www string to correct date range', () => {
    const { start, end } = weekInputToRange('2024-W11')
    expect(start).toBe('2024-03-11')
    expect(end).toBe('2024-03-17')
  })

  it('handles week 1 crossing year boundary correctly', () => {
    // ISO week 1 of 2025 starts on Monday 2024-12-30
    const { start, end } = weekInputToRange('2025-W01')
    expect(start).toBe('2024-12-30')
    expect(end).toBe('2025-01-05')
  })

  it('handles week 52/53 at end of year', () => {
    const { start } = weekInputToRange('2024-W52')
    expect(start).toBe('2024-12-23')
  })
})

// ---------------------------------------------------------------------------
// getDateRangeFromEvents — uses reduce, no spread (stack overflow fix)
// ---------------------------------------------------------------------------

describe('getDateRangeFromEvents', () => {
  it('returns null for empty array', () => {
    expect(getDateRangeFromEvents([])).toBeNull()
  })

  it('returns correct min and max dates', () => {
    const events = [
      makeEvent('A', '2024-03-14T10:00:00'),
      makeEvent('B', '2024-03-01T08:00:00'),
      makeEvent('C', '2024-03-20T23:59:00'),
    ]
    const range = getDateRangeFromEvents(events)
    expect(range).not.toBeNull()
    expect(range!.minDate).toBe('2024-03-01')
    expect(range!.maxDate).toBe('2024-03-20')
  })

  it('handles large arrays without stack overflow', () => {
    const events = Array.from({ length: 10000 }, (_, i) =>
      makeEvent('X', `2024-01-${String((i % 28) + 1).padStart(2, '0')}T00:00:00`)
    )
    expect(() => getDateRangeFromEvents(events)).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// formatWeekRange
// ---------------------------------------------------------------------------

describe('formatWeekRange', () => {
  it('formats same-month range correctly', () => {
    const result = formatWeekRange({ start: '2024-03-11', end: '2024-03-17' })
    expect(result).toMatch(/11/)
    expect(result).toMatch(/17/)
  })

  it('formats cross-month range showing both months', () => {
    const result = formatWeekRange({ start: '2024-03-29', end: '2024-04-04' })
    expect(result).toContain('29')
    expect(result).toContain('4')
  })
})
