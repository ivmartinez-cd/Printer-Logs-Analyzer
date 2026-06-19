import { create } from 'zustand'
import type { SdsIncidentData } from '../components/Monitor/SDSIncidentModal'

interface UIState {
  logModalOpen: boolean
  sdsModalOpen: boolean
  sdsIncident: SdsIncidentData | null
  addCodeModalCode: string | null
  editCodeInitial: {
    code: string
    description: string
    severity: string
    solutionUrl: string
  } | null
  saveIncidentModalOpen: boolean
  deleteConfirm: { id: string; name: string } | null
  solutionModal: {
    code: string
    sdsContent?: string | null
    sdsUrl?: string | null
    cpmdContent?: string | null
  } | null
  helpModalOpen: boolean
  monitorWizardOpen: boolean

  // Actions
  setLogModalOpen: (open: boolean) => void
  setSdsModalOpen: (open: boolean) => void
  setSdsIncident: (incident: SdsIncidentData | null) => void
  setAddCodeModalCode: (code: string | null) => void
  setEditCodeInitial: (data: { code: string; description: string; severity: string; solutionUrl: string } | null) => void
  setSaveIncidentModalOpen: (open: boolean) => void
  setDeleteConfirm: (data: { id: string; name: string } | null) => void
  setSolutionModal: (data: { code: string; sdsContent?: string | null; sdsUrl?: string | null; cpmdContent?: string | null } | null) => void
  setHelpModalOpen: (open: boolean) => void
  setMonitorWizardOpen: (open: boolean) => void
  closeAllModals: () => void
}

export const useUIStore = create<UIState>((set) => ({
  logModalOpen: false,
  sdsModalOpen: false,
  sdsIncident: null,
  addCodeModalCode: null,
  editCodeInitial: null,
  saveIncidentModalOpen: false,
  deleteConfirm: null,
  solutionModal: null,
  helpModalOpen: false,
  monitorWizardOpen: false,

  setLogModalOpen: (logModalOpen) => set({ logModalOpen }),
  setSdsModalOpen: (sdsModalOpen) => set({ sdsModalOpen }),
  setSdsIncident: (sdsIncident) => set({ sdsIncident }),
  setAddCodeModalCode: (addCodeModalCode) => set({ addCodeModalCode }),
  setEditCodeInitial: (editCodeInitial) => set({ editCodeInitial }),
  setSaveIncidentModalOpen: (saveIncidentModalOpen) => set({ saveIncidentModalOpen }),
  setDeleteConfirm: (deleteConfirm) => set({ deleteConfirm }),
  setSolutionModal: (solutionModal) => set({ solutionModal }),
  setHelpModalOpen: (helpModalOpen) => set({ helpModalOpen }),
  setMonitorWizardOpen: (monitorWizardOpen) => set({ monitorWizardOpen }),
  closeAllModals: () => set({
    logModalOpen: false,
    sdsModalOpen: false,
    saveIncidentModalOpen: false,
    deleteConfirm: null,
    solutionModal: null,
    helpModalOpen: false,
    monitorWizardOpen: false,
    addCodeModalCode: null,
    editCodeInitial: null
  })
}))
