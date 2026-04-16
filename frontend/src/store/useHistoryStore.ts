import { create } from 'zustand'
import { listSavedAnalyses, getSavedAnalysis, deleteSavedAnalysis, compareSavedAnalysis } from '../services/api'
import type { SavedAnalysisSummary, SavedAnalysisFull, CompareResponse } from '../types/api'

interface HistoryState {
  savedList: SavedAnalysisSummary[] | null
  savedDetail: SavedAnalysisFull | null
  compareResult: CompareResponse | null
  loadingList: boolean
  loadingDetail: boolean
  comparing: boolean
  deletingId: string | null
  error: string | null

  // Actions
  fetchSavedList: () => Promise<void>
  fetchSavedDetail: (id: string) => Promise<void>
  removeAnalysis: (id: string) => Promise<void>
  compareWithSaved: (id: string, logText: string) => Promise<void>
  resetDetail: () => void
  resetCompare: () => void
}

export const useHistoryStore = create<HistoryState>((set) => ({
  savedList: null,
  savedDetail: null,
  compareResult: null,
  loadingList: false,
  loadingDetail: false,
  comparing: false,
  deletingId: null,
  error: null,

  fetchSavedList: async () => {
    set({ loadingList: true, error: null })
    try {
      const data = await listSavedAnalyses()
      set({ savedList: data, loadingList: false })
    } catch (e: any) {
      set({ savedList: [], loadingList: false, error: e.message })
    }
  },

  fetchSavedDetail: async (id: string) => {
    set({ loadingDetail: true, error: null, savedDetail: null })
    try {
      const data = await getSavedAnalysis(id)
      set({ savedDetail: data, loadingDetail: false })
    } catch (e: any) {
      set({ loadingDetail: false, error: e.message })
    }
  },

  removeAnalysis: async (id: string) => {
    set({ deletingId: id })
    try {
      await deleteSavedAnalysis(id)
      set((state) => ({
        savedList: state.savedList ? state.savedList.filter((x) => x.id !== id) : [],
        deletingId: null,
      }))
    } catch (e: any) {
      set({ deletingId: null, error: e.message })
      throw e
    }
  },

  compareWithSaved: async (id: string, logText: string) => {
    set({ comparing: true, error: null })
    try {
      const res = await compareSavedAnalysis(id, logText)
      set({ compareResult: res, comparing: false })
    } catch (e: any) {
      set({ comparing: false, error: e.message })
      throw e
    }
  },

  resetDetail: () => set({ savedDetail: null }),
  resetCompare: () => set({ compareResult: null }),
}))
