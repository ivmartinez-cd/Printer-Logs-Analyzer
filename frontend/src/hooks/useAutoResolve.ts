import { useState, useCallback } from 'react'
import { extractSdsLogs } from '../services/api'
import { useAnalysisStore } from '../store/useAnalysisStore'
import { useUIStore } from '../store/useUIStore'
import { useToast } from '../contexts/ToastContext'

export function useAutoResolve() {
  const { showWarning, showError } = useToast()
  const setError = useAnalysisStore((s) => s.setError)
  const handleAnalyze = useAnalysisStore((s) => s.handleAnalyze)
  const setLogModalOpen = useUIStore((s) => s.setLogModalOpen)

  const [autoExtracting, setAutoExtracting] = useState(false)
  const [currentModelId, setCurrentModelId] = useState<string | null>(null)
  const [currentModelHasCpmd, setCurrentModelHasCpmd] = useState(false)
  const [currentSerialNumber, setCurrentSerialNumber] = useState<string | null>(null)
  const [currentModelName, setCurrentModelName] = useState<string | null>(null)
  const [realtimeConsumables, setRealtimeConsumables] = useState<any[]>([])

  const autoResolveAndAnalyze = useCallback(async (serial: string) => {
    setAutoExtracting(true)
    setError(null)
    setLogModalOpen(false)
    try {
      const sdsRes = await extractSdsLogs(serial)
      setCurrentSerialNumber(serial)
      setCurrentModelName(sdsRes.model_name_sds)

      if (sdsRes.suggested_model_id) {
        setCurrentModelId(sdsRes.suggested_model_id)
        setCurrentModelHasCpmd(sdsRes.has_cpmd)
      } else {
        showWarning(`Modelo detectado: ${sdsRes.model_name_sds}. No se encontró coincidencia exacta.`)
      }

      setRealtimeConsumables(sdsRes.realtime_consumables || [])

      if (!sdsRes.logs_text) {
        throw new Error('No se encontraron logs.')
      }

      await handleAnalyze(sdsRes.logs_text, `Portal_SDS_${serial}.tsv`, sdsRes.suggested_model_id)
    } catch (e: any) {
      showError(e.message)
    } finally {
      setAutoExtracting(false)
    }
  }, [handleAnalyze, setError, setLogModalOpen, showWarning, showError])

  return {
    autoExtracting,
    currentModelId,
    setCurrentModelId,
    currentModelHasCpmd,
    setCurrentModelHasCpmd,
    currentSerialNumber,
    setCurrentSerialNumber,
    currentModelName,
    setCurrentModelName,
    realtimeConsumables,
    setRealtimeConsumables,
    autoResolveAndAnalyze,
  }
}
