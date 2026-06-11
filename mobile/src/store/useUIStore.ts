import { create } from 'zustand'

interface UIState {
  logSheetOpen: boolean
  sdsSheetOpen: boolean
  addCodeSheetCode: string | null
  saveIncidentSheetOpen: boolean
  helpSheetOpen: boolean
  monitorWizardSheetOpen: boolean
  solutionSheet: {
    code: string
    sdsContent?: string | null
    sdsUrl?: string | null
  } | null

  // Actions
  setLogSheetOpen: (open: boolean) => void
  setSdsSheetOpen: (open: boolean) => void
  setAddCodeSheetCode: (code: string | null) => void
  setSaveIncidentSheetOpen: (open: boolean) => void
  setHelpSheetOpen: (open: boolean) => void
  setMonitorWizardSheetOpen: (open: boolean) => void
  setSolutionSheet: (data: { code: string; sdsContent?: string | null; sdsUrl?: string | null } | null) => void
  closeAllSheets: () => void
}

export const useUIStore = create<UIState>((set) => ({
  logSheetOpen: false,
  sdsSheetOpen: false,
  addCodeSheetCode: null,
  saveIncidentSheetOpen: false,
  helpSheetOpen: false,
  monitorWizardSheetOpen: false,
  solutionSheet: null,

  setLogSheetOpen: (logSheetOpen) => set({ logSheetOpen }),
  setSdsSheetOpen: (sdsSheetOpen) => set({ sdsSheetOpen }),
  setAddCodeSheetCode: (addCodeSheetCode) => set({ addCodeSheetCode }),
  setSaveIncidentSheetOpen: (saveIncidentSheetOpen) => set({ saveIncidentSheetOpen }),
  setHelpSheetOpen: (helpSheetOpen) => set({ helpSheetOpen }),
  setMonitorWizardSheetOpen: (monitorWizardSheetOpen) => set({ monitorWizardSheetOpen }),
  setSolutionSheet: (solutionSheet) => set({ solutionSheet }),
  closeAllSheets: () => set({
    logSheetOpen: false,
    sdsSheetOpen: false,
    addCodeSheetCode: null,
    saveIncidentSheetOpen: false,
    helpSheetOpen: false,
    monitorWizardSheetOpen: false,
    solutionSheet: null,
  })
}))
