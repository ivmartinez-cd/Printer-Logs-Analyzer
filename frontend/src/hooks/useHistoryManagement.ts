import { useState } from 'react'
import { useHistoryStore } from '../store/useHistoryStore'
import { useAnalysisStore } from '../store/useAnalysisStore'
import { useUIStore } from '../store/useUIStore'
import { useToast } from '../contexts/ToastContext'

export function useHistoryManagement() {
  const toast = useToast()
  const setViewMode = useAnalysisStore((s) => s.setViewMode)
  const setDeleteConfirm = useUIStore((s) => s.setDeleteConfirm)
  const setCompareModalOpen = useUIStore((s) => s.setCompareModalOpen)

  const {
    savedList,
    savedDetail,
    compareResult,
    loadingList,
    comparing,
    deletingId,
    fetchSavedList,
    fetchSavedDetail,
    removeAnalysis,
    compareWithSaved,
    resetDetail,
    resetCompare,
  } = useHistoryStore()

  const [savedListSearch, setSavedListSearch] = useState('')
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null)
  const [compareLogText, setCompareLogText] = useState('')
  const [compareFileName, setCompareFileName] = useState<string | undefined>(undefined)

  const handleOpenDetail = async (id: string) => {
    setSelectedSavedId(id)
    resetDetail()
    resetCompare()
    setViewMode('saved-detail')
    try {
      await fetchSavedDetail(id)
    } catch (e: any) {
      toast.showError('Error al cargar detalle')
    }
  }

  const handleBackToList = () => {
    setViewMode('saved-list')
    resetDetail()
    setSelectedSavedId(null)
    resetCompare()
  }

  const handleOpenList = async () => {
    setViewMode('saved-list')
    resetDetail()
    await fetchSavedList()
  }

  const handleDeleteClick = (id: string) => {
    const item = savedList?.find((x) => x.id === id)
    if (item) {
      setDeleteConfirm({ id: item.id, name: item.name })
    }
  }

  const handleConfirmDelete = async (id: string) => {
    try {
      await removeAnalysis(id)
      if (selectedSavedId === id) {
        handleBackToList()
      }
      toast.showSuccess('Incidente borrado')
    } catch (e: any) {
      toast.showError('Error al borrar')
    }
  }

  const handleCompareSubmit = async () => {
    if (!compareLogText.trim() || !selectedSavedId) return
    try {
      await compareWithSaved(selectedSavedId, compareLogText)
      setCompareModalOpen(false)
      toast.showSuccess('Comparación completada')
    } catch (e: any) {
      toast.showError('Error en comparación')
    }
  }

  return {
    savedList,
    savedListSearch,
    setSavedListSearch,
    savedDetail,
    selectedSavedId,
    setSelectedSavedId,
    compareResult,
    comparing,
    deletingId,
    loadingList,
    compareLogText,
    setCompareLogText,
    compareFileName,
    setCompareFileName,
    handleOpenList,
    handleOpenDetail,
    handleBackToList,
    handleDeleteClick,
    handleConfirmDelete,
    handleCompareSubmit,
  }
}
