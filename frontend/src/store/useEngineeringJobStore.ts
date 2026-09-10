import { create } from 'zustand'
import { analyzeEngineeringCases, getEngineeringJobStatus } from '../services/api'
import type { EngineeringJobStatus } from '../types/api'

const POLL_INTERVAL_MS = 3000
const MAX_WAIT_MS = 25 * 60 * 1000 // 25 min — guarda contra un job huérfano

interface EngineeringJobState {
  jobId: string | null
  processed: number
  total: number
  errors: number
  status: 'idle' | 'running' | 'completed' | 'failed'
  lastResult: EngineeringJobStatus['results'] | null
  acknowledged: boolean
  startBatch: (options: {
    scope: 'new' | 'open' | 'selection'
    incidents?: { device_id: string; incident_id: string }[]
    force?: boolean
  }) => Promise<void>
  stopBatch: () => void
  acknowledgeResult: () => void
}

let intervalHandle: ReturnType<typeof setInterval> | null = null
let startedAt = 0

function clearPolling() {
  if (intervalHandle) {
    clearInterval(intervalHandle)
    intervalHandle = null
  }
}

export const useEngineeringJobStore = create<EngineeringJobState>((set, get) => ({
  jobId: null,
  processed: 0,
  total: 0,
  errors: 0,
  status: 'idle',
  lastResult: null,
  acknowledged: true,

  startBatch: async (options) => {
    clearPolling()
    set({ status: 'running', processed: 0, total: 0, errors: 0, jobId: null })

    const job = await analyzeEngineeringCases(options)
    startedAt = Date.now()
    set({ jobId: job.job_id, total: job.total, status: 'running' })

    intervalHandle = setInterval(async () => {
      const { jobId } = get()
      if (!jobId) return
      try {
        const status = await getEngineeringJobStatus(jobId)
        set({ processed: status.processed, total: status.total, errors: status.errors })

        if (status.status === 'completed' || status.status === 'failed') {
          clearPolling()
          set({
            status: status.status,
            lastResult: status.results ?? null,
            acknowledged: false,
          })
          return
        }
        if (Date.now() - startedAt > MAX_WAIT_MS) {
          clearPolling()
          set({ status: 'failed', acknowledged: false })
        }
      } catch {
        clearPolling()
        set({ status: 'failed', acknowledged: false })
      }
    }, POLL_INTERVAL_MS)
  },

  stopBatch: () => {
    clearPolling()
    set({ status: 'idle', jobId: null })
  },

  acknowledgeResult: () => set({ acknowledged: true }),
}))
