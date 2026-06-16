import { useState, useEffect } from 'react'
import { AppState } from 'react-native'
import * as Network from 'expo-network'

const POLL_INTERVAL_MS = 15_000

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true)

  useEffect(() => {
    let isMounted = true
    let interval: ReturnType<typeof setInterval> | null = null

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

    function startPolling() {
      if (interval) return
      checkStatus()
      interval = setInterval(checkStatus, POLL_INTERVAL_MS)
    }

    function stopPolling() {
      if (interval) {
        clearInterval(interval)
        interval = null
      }
    }

    // Solo sondear con la app en primer plano (ahorro de batería)
    if (AppState.currentState === 'active') startPolling()

    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        startPolling()
      } else {
        stopPolling()
      }
    })

    return () => {
      isMounted = false
      stopPolling()
      sub.remove()
    }
  }, [])

  return isOnline
}
