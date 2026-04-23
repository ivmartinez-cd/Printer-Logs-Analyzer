import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAnalysisStore } from '../../store/useAnalysisStore'
import * as api from '../../services/api'
import type {
  EnrichedEvent,
  Incident,
  ParseLogsResponse,
  ValidateLogsResponse,
} from '../../types/api'
import type { UpsertErrorCodeResult } from '../../services/api'

vi.mock('../../services/api', () => ({
  previewLogs: vi.fn(),
  validateLogs: vi.fn(),
  upsertErrorCode: vi.fn(),
  createSavedAnalysis: vi.fn(),
}))

function makeEvent(overrides: Partial<EnrichedEvent> = {}): EnrichedEvent {
  return {
    type: 'ERROR',
    code: 'E1',
    timestamp: '2026-03-14T10:30:45Z',
    counter: 12345,
    firmware: null,
    help_reference: null,
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
    code: events[0].code,
    classification: events[0].code_description ?? events[0].code,
    severity: 'ERROR',
    severity_weight: 3,
    occurrences: events.length,
    start_time: events[0].timestamp,
    end_time: events[events.length - 1].timestamp,
    counter_range: [events[0].counter, events[events.length - 1].counter],
    events,
    sds_link: null,
    sds_solution_content: null,
    ...overrides,
  }
}

function makeResult(overrides: Partial<ParseLogsResponse> = {}): ParseLogsResponse {
  return {
    events: [],
    incidents: [],
    global_severity: 'INFO',
    errors: [],
    log_start_date: '2026-03-14T10:00:00Z',
    log_end_date: '2026-03-14T11:00:00Z',
    total_lines: 1000,
    ...overrides,
  }
}

describe('useAnalysisStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAnalysisStore.setState({
      result: null,
      codesNew: [],
      loading: false,
      error: null,
      viewMode: 'dashboard',
      logFileName: null,
    })
  })

  it('initial state is correct', () => {
    const state = useAnalysisStore.getState()
    expect(state.viewMode).toBe('dashboard')
    expect(state.loading).toBe(false)
  })

  it('setViewMode updates state', () => {
    useAnalysisStore.getState().setViewMode('saved-list')
    expect(useAnalysisStore.getState().viewMode).toBe('saved-list')
  })

  it('handleAnalyze updates state on success', async () => {
    const mockResult = makeResult()
    const validateResult: ValidateLogsResponse = {
      total_lines: 1000,
      codes_detected: ['E1'],
      codes_new: ['E1'],
      errors: [],
    }

    vi.mocked(api.previewLogs).mockResolvedValue(mockResult)
    vi.mocked(api.validateLogs).mockResolvedValue(validateResult)

    await useAnalysisStore.getState().handleAnalyze('logs', 'file.txt')

    const state = useAnalysisStore.getState()
    expect(state.result).toEqual(mockResult)
    expect(state.codesNew).toEqual(['E1'])
    expect(state.loading).toBe(false)
    expect(state.logFileName).toBe('file.txt')
  })

  it('handleAnalyze sets error on failure', async () => {
    vi.mocked(api.previewLogs).mockRejectedValue(new Error('Fetch failed'))

    await expect(useAnalysisStore.getState().handleAnalyze('logs')).rejects.toThrow('Fetch failed')

    const state = useAnalysisStore.getState()
    expect(state.error).toBe('Fetch failed')
    expect(state.loading).toBe(false)
  })

  it('handleSaveCodeToCatalog updates result and filters codesNew', async () => {
    const initialEvent = makeEvent()
    const initialResult = makeResult({
      events: [initialEvent],
      incidents: [makeIncident({ events: [initialEvent] })],
    })
    const upsertResult: UpsertErrorCodeResult = {
      id: '1',
      code: 'E1',
      solution_url: 'new-url',
      solution_content_saved: true,
      solution_content: null,
    }

    useAnalysisStore.setState({
      result: initialResult,
      codesNew: ['E1', 'E2'],
    })

    vi.mocked(api.upsertErrorCode).mockResolvedValue(upsertResult)

    await useAnalysisStore.getState().handleSaveCodeToCatalog({ code: 'E1' })

    const state = useAnalysisStore.getState()
    expect(state.codesNew).toEqual(['E2'])
    expect(state.result?.incidents[0].events[0].code_solution_url).toBe('new-url')
  })

  it('handleSaveIncident calls api and updates state', async () => {
    useAnalysisStore.setState({
      result: makeResult({
        incidents: [makeIncident()],
      }),
    })

    vi.mocked(api.createSavedAnalysis).mockResolvedValue({
      id: '1',
      name: 'Snapshot',
      equipment_identifier: 'S1',
      global_severity: 'INFO',
      created_at: '2026-03-14T11:00:00Z',
    })

    await useAnalysisStore.getState().handleSaveIncident('Snapshot', 'S1')

    expect(api.createSavedAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Snapshot',
        equipment_identifier: 'S1',
      })
    )
    expect(useAnalysisStore.getState().savingIncident).toBe(false)
  })
})
