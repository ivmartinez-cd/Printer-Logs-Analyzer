import { create } from 'zustand'
import { previewLogs, validateLogs, upsertErrorCode, createSavedAnalysis, type UpsertErrorCodeResult } from '../services/api'
import type {
  ParseLogsResponse,
  ErrorCodeUpsertBody,
  SavedAnalysisIncidentItem,
} from '../types/api'

interface AnalysisState {
  // Data
  result: ParseLogsResponse | null
  codesNew: string[]
  loading: boolean
  error: string | null
  savingCode: boolean
  savingIncident: boolean
  
  // UI State
  viewMode: 'dashboard' | 'saved-list' | 'saved-detail' | 'monitor' | 'avisos'
  logFileName: string | null
  currentModelFamily: string | null
  currentSerialNumber: string | null
  monitorClientId: string | null
  monitorModels: string[]

  // Actions
  setResult: (result: ParseLogsResponse | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setViewMode: (mode: 'dashboard' | 'saved-list' | 'saved-detail' | 'monitor' | 'avisos') => void
  setLogFileName: (name: string | null) => void
  setCodesNew: (updater: (prev: string[]) => string[]) => void
  setMonitorClientId: (id: string | null) => void
  setMonitorModels: (models: string[]) => void
  
  // Handlers
  handleAnalyze: (logText: string, fileName?: string, modelFamily?: string | null) => Promise<void>
  handleSaveCodeToCatalog: (body: ErrorCodeUpsertBody, isEdit?: boolean) => Promise<UpsertErrorCodeResult>
  handleSaveIncident: (name: string, equipmentIdentifier: string | null) => Promise<void>
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  result: null,
  codesNew: [],
  loading: false,
  savingCode: false,
  savingIncident: false,
  error: null,
  viewMode: 'dashboard',
  logFileName: null,
  currentModelFamily: null,
  currentSerialNumber: null,
  monitorClientId: null,
  monitorModels: [],

  setResult: (result) => set({ result }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setViewMode: (viewMode) => set({ viewMode }),
  setLogFileName: (logFileName) => set({ logFileName }),
  setCodesNew: (updater) => set((state) => ({ codesNew: updater(state.codesNew) })),
  setMonitorClientId: (monitorClientId) => set({ monitorClientId }),
  setMonitorModels: (monitorModels) => set({ monitorModels }),

  handleAnalyze: async (logText, fileName, modelFamily) => {
    if (!logText.trim()) return
    set({ loading: true, error: null, result: null, codesNew: [], logFileName: fileName ?? null, currentModelFamily: modelFamily ?? null })
    
    try {
      const [data, validateRes] = await Promise.all([
        previewLogs(logText, modelFamily),
        validateLogs(logText).catch(() => ({ codes_new: [] as string[] })),
      ])
      set({
        result: data,
        codesNew: validateRes.codes_new ?? [],
        loading: false
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      set({ error: msg, loading: false })
      throw e // Let the component handle UI (toast)
    }
  },

  handleSaveCodeToCatalog: async (body, isEdit = false) => {
    set({ savingCode: true, error: null })
    try {
      const res = await upsertErrorCode(body)
      set((state) => {
        const nextCodesNew = isEdit ? state.codesNew : state.codesNew.filter((c) => c !== body.code)
        if (!state.result) return { codesNew: nextCodesNew, savingCode: false }

        // Update local result with new solution data
        const nextResult: ParseLogsResponse = {
          ...state.result,
          events: state.result.events.map((evt) =>
            evt.code === body.code
              ? {
                  ...evt,
                  code_description: body.description ?? evt.code_description,
                  code_severity: body.severity ?? evt.code_severity,
                  code_solution_url: res.solution_url ?? body.solution_url ?? evt.code_solution_url,
                  code_solution_content: res.solution_content ?? evt.code_solution_content,
                }
              : evt
          ),
          incidents: state.result.incidents.map((inc) => {
            const updatedEvents = inc.events.map((evt) =>
              evt.code === body.code
                ? {
                    ...evt,
                    code_description: body.description ?? evt.code_description,
                    code_severity: body.severity ?? evt.code_severity,
                    code_solution_url: res.solution_url ?? body.solution_url ?? evt.code_solution_url,
                    code_solution_content: res.solution_content ?? evt.code_solution_content,
                  }
                : evt
            )
            if (inc.code !== body.code) return { ...inc, events: updatedEvents }
            
            const severity = (body.severity || inc.severity || 'INFO').toUpperCase()
            const severity_weight = severity === 'ERROR' ? 3 : severity === 'WARNING' ? 2 : 1

            return {
              ...inc,
              events: updatedEvents,
              classification: body.description ?? inc.classification,
              severity,
              severity_weight,
              sds_link: res.solution_url ?? body.solution_url ?? inc.sds_link,
              sds_solution_content: res.solution_content ?? inc.sds_solution_content,
            }
          }),
        }
        return { result: nextResult, codesNew: nextCodesNew, savingCode: false }
      })
      return res
    } catch (e) {
      set({ savingCode: false, error: e instanceof Error ? e.message : String(e) })
      throw e
    }
  },

  handleSaveIncident: async (name, equipmentIdentifier) => {
    const { result } = get()
    if (!result) return
    set({ savingIncident: true, error: null })
    
    try {
      const items: SavedAnalysisIncidentItem[] = result.incidents.map((inc) => ({
        code: inc.code,
        classification: inc.classification,
        severity: inc.severity,
        occurrences: inc.occurrences,
        start_time: inc.start_time,
        end_time: inc.end_time,
        counter_range: inc.counter_range,
        sds_link: inc.sds_link ?? null,
        last_event_time: inc.end_time,
      }))

      await createSavedAnalysis({
        name,
        equipment_identifier: equipmentIdentifier,
        incidents: items,
        global_severity: result.global_severity,
      })
      set({ savingIncident: false })
    } catch (e) {
      set({ savingIncident: false, error: e instanceof Error ? e.message : String(e) })
      throw e
    }
  }
}))
