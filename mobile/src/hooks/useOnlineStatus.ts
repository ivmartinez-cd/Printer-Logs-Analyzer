import { useState, useEffect } from 'react'
import * as Network from 'expo-network'

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true)

  useEffect(() => {
    let isMounted = true

    async function checkStatus() {
      try {
        const state = await Network.getNetworkStateAsync()
        if (isMounted) {
          setIsOnline(!!state.isConnected && !!state.isInternetReachable)
        }
      } catch {
        if (isMounted) setIsOnline(false)
      }
    }

    checkStatus()

    // Polling cada 5 segundos para actualización rápida de red en movilidad
    const interval = setInterval(checkStatus, 5000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  return isOnline
}
