import { create } from 'zustand'
import { previewLogs, validateLogs, createSavedAnalysis } from '../services/api'
import type { ParseLogsResponse, SavedAnalysisIncidentItem } from '../types/api'

interface AnalysisState {
  result: ParseLogsResponse | null
  codesNew: string[]
  loading: boolean
  error: string | null
  savingIncident: boolean
  
  viewMode: 'dashboard' | 'saved-list' | 'saved-detail' | 'monitor' | 'avisos'
  logFileName: string | null
  currentModelFamily: string | null
  currentSerialNumber: string | null
  monitorClientId: string | null
  monitorModels: string[]

  setResult: (result: ParseLogsResponse | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setViewMode: (mode: 'dashboard' | 'saved-list' | 'saved-detail' | 'monitor' | 'avisos') => void
  setLogFileName: (name: string | null) => void
  setCodesNew: (updater: (prev: string[]) => string[]) => void
  setMonitorClientId: (id: string | null) => void
  setMonitorModels: (models: string[]) => void
  
  handleAnalyze: (logText: string, fileName?: string, modelFamily?: string | null) => Promise<void>
  handleSaveIncident: (name: string, equipmentIdentifier: string | null) => Promise<void>
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  result: null,
  codesNew: [],
  loading: false,
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
