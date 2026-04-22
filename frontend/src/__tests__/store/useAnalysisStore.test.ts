
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAnalysisStore } from '../../store/useAnalysisStore'
import * as api from '../../services/api'

vi.mock('../../services/api', () => ({
  previewLogs: vi.fn(),
  validateLogs: vi.fn(),
  upsertErrorCode: vi.fn(),
  createSavedAnalysis: vi.fn(),
}))

describe('useAnalysisStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset state before each test
    useAnalysisStore.setState({
      result: null,
      codesNew: [],
      loading: false,
      error: null,
      viewMode: 'dashboard',
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
    const mockResult = { incidents: [], events: [], global_severity: 'INFO' }
    vi.mocked(api.previewLogs).mockResolvedValue(mockResult as any)
    vi.mocked(api.validateLogs).mockResolvedValue({ codes_new: ['E1'] } as any)

    await useAnalysisStore.getState().handleAnalyze('logs', 'file.txt')

    const state = useAnalysisStore.getState()
    expect(state.result).toEqual(mockResult)
    expect(state.codesNew).toEqual(['E1'])
    expect(state.loading).toBe(false)
    expect(state.logFileName).toBe('file.txt')
  })

  it('handleAnalyze sets error on failure', async () => {
    vi.mocked(api.previewLogs).mockRejectedValue(new Error('Fetch failed'))

    try {
      await useAnalysisStore.getState().handleAnalyze('logs')
    } catch (e) {
      // ignore
    }

    const state = useAnalysisStore.getState()
    expect(state.error).toBe('Fetch failed')
    expect(state.loading).toBe(false)
  })

  it('handleSaveCodeToCatalog updates result and filters codesNew', async () => {
    const initialResult = {
      incidents: [{ code: 'E1', events: [{ code: 'E1' }] }],
      events: [{ code: 'E1' }],
    }
    useAnalysisStore.setState({ 
      result: initialResult as any,
      codesNew: ['E1', 'E2']
    })

    vi.mocked(api.upsertErrorCode).mockResolvedValue({ 
      id: '1', 
      code: 'E1', 
      solution_url: 'new-url',
      solution_content_saved: true 
    } as any)

    await useAnalysisStore.getState().handleSaveCodeToCatalog({ code: 'E1' } as any)

    const state = useAnalysisStore.getState()
    expect(state.codesNew).toEqual(['E2'])
    expect(state.result?.incidents[0].events[0].code_solution_url).toBe('new-url')
  })

  it('handleSaveIncident calls api and updates state', async () => {
    useAnalysisStore.setState({
      result: { incidents: [], global_severity: 'INFO' } as any
    })
    vi.mocked(api.createSavedAnalysis).mockResolvedValue({ id: '1' } as any)

    await useAnalysisStore.getState().handleSaveIncident('Snapshot', 'S1')

    expect(api.createSavedAnalysis).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Snapshot',
      equipment_identifier: 'S1'
    }))
    expect(useAnalysisStore.getState().savingIncident).toBe(false)
  })
})
