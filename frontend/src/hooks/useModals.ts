import { useState } from 'react'
import type { SdsIncidentData } from '../components/SDSIncidentModal'

export function useModals() {
  const [logModalOpen, setLogModalOpen] = useState(false)
  const [sdsModalOpen, setSdsModalOpen] = useState(false)
  const [sdsIncident, setSdsIncident] = useState<SdsIncidentData | null>(null)
  const [addCodeModalCode, setAddCodeModalCode] = useState<string | null>(null)
  const [editCodeInitial, setEditCodeInitial] = useState<{
    code: string
    description: string
    severity: string
    solutionUrl: string
  } | null>(null)
  const [saveIncidentModalOpen, setSaveIncidentModalOpen] = useState(false)
  const [compareModalOpen, setCompareModalOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)
  const [solutionModal, setSolutionModal] = useState<{
    code: string
    sdsContent?: string | null
    sdsUrl?: string | null
  } | null>(null)
  const [helpModalOpen, setHelpModalOpen] = useState(false)

  return {
    logModalOpen,
    setLogModalOpen,
    sdsModalOpen,
    setSdsModalOpen,
    sdsIncident,
    setSdsIncident,
    addCodeModalCode,
    setAddCodeModalCode,
    editCodeInitial,
    setEditCodeInitial,
    saveIncidentModalOpen,
    setSaveIncidentModalOpen,
    compareModalOpen,
    setCompareModalOpen,
    deleteConfirm,
    setDeleteConfirm,
    solutionModal,
    setSolutionModal,
    helpModalOpen,
    setHelpModalOpen,
  }
}
