import { useEffect } from 'react'

interface UrlSyncParams {
  viewMode: string
  currentSerialNumber: string | null
  selectedSavedId: string | null
}

export function useUrlSync({ viewMode, currentSerialNumber, selectedSavedId }: UrlSyncParams) {
  useEffect(() => {
    let newPath = '/'
    
    if (viewMode === 'dashboard' && currentSerialNumber) {
      newPath = `/${currentSerialNumber}`
    } else if (viewMode === 'saved-detail' && selectedSavedId) {
      newPath = `/analysis/${selectedSavedId}`
    } else if (viewMode === 'saved-list') {
      newPath = '/history'
    }

    if (window.location.pathname !== newPath) {
      window.history.pushState({ viewMode, currentSerialNumber, selectedSavedId }, '', newPath)
    }
  }, [viewMode, currentSerialNumber, selectedSavedId])
}
