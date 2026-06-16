import { useState } from 'react'
import { refreshHpDataCache } from '../services/api'
import { useToast } from '../contexts/ToastContext'

/**
 * Triggers the SDS "Actualizar la caché de datos de HP" action for a device.
 * The backend tracks completion and posts the result to the notifications center
 * (the bell), so the user is informed even if they leave the page. The button is
 * freed as soon as the request is sent.
 */
export function useHpCacheRefresh() {
  const [refreshing, setRefreshing] = useState(false)
  const toast = useToast()

  async function triggerRefresh(serial: string | null | undefined) {
    if (!serial || refreshing) return
    setRefreshing(true)
    try {
      const res = await refreshHpDataCache(serial, AbortSignal.timeout(30_000))
      toast.showSuccess(res.message)
    } catch (err) {
      console.error('Error refreshing HP data cache:', err)
      toast.showError('No se pudo solicitar la actualización de la caché de datos de HP.')
    } finally {
      setRefreshing(false)
    }
  }

  return { refreshing, triggerRefresh }
}
