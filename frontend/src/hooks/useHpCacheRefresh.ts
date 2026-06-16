import { useState } from 'react'
import { refreshHpDataCache, getHpOperations } from '../services/api'
import type { HpOperation } from '../types/api'
import { useToast } from '../contexts/ToastContext'

// HP Smart operations triggered by "Actualizar la caché de datos de HP".
const CACHE_OPS: Record<string, string> = {
  RefreshHPCloudDeviceActionCache: 'Acciones',
  RefreshHPCloudDeviceEventLogCache: 'Logs de eventos',
  RefreshHPCloudDeviceConfigCache: 'Configuración',
}

// States that mean the operation is no longer running (terminal).
const TERMINAL_STATES = new Set([
  'success',
  'partialsuccess',
  'finishedwitherrors',
  'httpcredentialsneeded',
  'failed',
  'error',
  'timedout',
  'cancelled',
])

const POLL_INTERVAL_MS = 20_000
const MAX_POLLS = 12 // ~4 minutes

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const normalize = (state: string | null): string => (state ?? '').replace(/\s+/g, '').toLowerCase()

function isTerminal(state: string | null): boolean {
  return TERMINAL_STATES.has(normalize(state))
}

function stateEmoji(state: string | null): string {
  const s = normalize(state)
  if (s === 'success') return '✅'
  if (s === 'partialsuccess') return '⚠️'
  return '❌'
}

/**
 * Triggers the SDS "Actualizar la caché de datos de HP" action for a device and,
 * in the background, polls the HP Smart operations table until the cache refresh
 * operations reach a terminal state — then toasts the result. The button is freed
 * as soon as the request is sent (the refresh takes minutes on HP's side).
 */
export function useHpCacheRefresh() {
  const [refreshing, setRefreshing] = useState(false)
  const toast = useToast()

  async function pollUntilDone(serial: string, baseline: Record<string, string>) {
    for (let i = 0; i < MAX_POLLS; i++) {
      await sleep(POLL_INTERVAL_MS)
      let ops: HpOperation[]
      try {
        ops = (await getHpOperations(serial, AbortSignal.timeout(25_000))).operations
      } catch {
        continue // transient error: keep polling
      }
      const cacheOps = ops.filter((o) => o.operation in CACHE_OPS)
      if (cacheOps.length === 0) continue

      // Prefer operations whose "sent" changed vs the pre-refresh baseline
      // (i.e. our new run); fall back to all cache ops if none changed yet.
      const fresh = cacheOps.filter((o) => (o.sent ?? '') !== (baseline[o.operation] ?? ''))
      const target = fresh.length > 0 ? fresh : cacheOps

      if (target.every((o) => isTerminal(o.last_known_state))) {
        const summary = target
          .map((o) => `${CACHE_OPS[o.operation]} ${stateEmoji(o.last_known_state)}`)
          .join(' · ')
        const allOk = target.every((o) => normalize(o.last_known_state) === 'success')
        if (allOk) toast.showSuccess(`Caché de HP actualizada — ${summary}`)
        else toast.showWarning(`Caché de HP procesada con avisos — ${summary}`)
        return
      }
    }
    toast.showWarning('La caché de HP sigue procesándose. Revisá el estado en unos minutos.')
  }

  async function triggerRefresh(serial: string | null | undefined) {
    if (!serial || refreshing) return
    setRefreshing(true)
    try {
      const res = await refreshHpDataCache(serial, AbortSignal.timeout(30_000))
      const baseline: Record<string, string> = {}
      for (const b of res.baseline) baseline[b.operation] = b.sent
      toast.showSuccess(res.message)
      void pollUntilDone(serial, baseline) // background; don't block the button
    } catch (err) {
      console.error('Error refreshing HP data cache:', err)
      toast.showError('No se pudo solicitar la actualización de la caché de datos de HP.')
    } finally {
      setRefreshing(false)
    }
  }

  return { refreshing, triggerRefresh }
}
