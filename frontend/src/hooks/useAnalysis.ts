import { useState, useCallback } from 'react'
import { previewLogs, validateLogs, upsertErrorCode, createSavedAnalysis } from '../services/api'
import type {
  ParseLogsResponse,
  ErrorCodeUpsertBody,
  Incident as ApiIncident,
  SavedAnalysisIncidentItem,
} from '../types/api'
import { useToast } from '../contexts/ToastContext'

interface UseAnalysisOptions {
  onAnalyzeDone?: (result: ParseLogsResponse, codesNew: string[]) => void
  setLogFileName: (name: string | null) => void
  resetDateFilter: () => void
  resetFilters: () => void
  setLogModalOpen: (open: boolean) => void
  setAddCodeModalCode: (code: string | null) => void
  setEditCodeInitial: (
    v: { code: string; description: string; severity: string; solutionUrl: string } | null
  ) => void
  setSaveIncidentModalOpen: (open: boolean) => void
}

export function useAnalysis({
  onAnalyzeDone,
  setLogFileName,
  resetDateFilter,
  resetFilters,
  setLogModalOpen,
  setAddCodeModalCode,
  setEditCodeInitial,
  setSaveIncidentModalOpen,
}: UseAnalysisOptions) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ParseLogsResponse | null>(null)
  const [codesNew, setCodesNew] = useState<string[]>([])
  const [savingCode, setSavingCode] = useState(false)
  const [savingIncident, setSavingIncident] = useState(false)
  const toast = useToast()

  const handleAnalyze = useCallback(async (logText: string, fileName?: string, modelId?: string | null) => {
    if (!logText.trim()) return
    setError(null)
    setResult(null)
    setCodesNew([])
    setLogFileName(fileName ?? null)
    resetDateFilter()
    resetFilters()
    setLoading(true)
    try {
      const [data, validateRes] = await Promise.all([
        previewLogs(logText, modelId),
        validateLogs(logText).catch(() => ({ codes_new: [] as string[] })),
      ])
      const newCodes = validateRes.codes_new ?? []
      setResult(data)
      setCodesNew(newCodes)
      onAnalyzeDone?.(data, newCodes)
      setLogModalOpen(false)
      if (newCodes.length > 0) {
        toast.showWarning(
          `Se detectaron ${newCodes.length} códigos nuevos. Agrégalos al catálogo si lo deseas.`
        )
      } else {
        toast.showSuccess('Análisis completado')
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      toast.showError(msg)
    } finally {
      setLoading(false)
    }
  }, [onAnalyzeDone, setLogFileName, resetDateFilter, resetFilters, setLogModalOpen, toast])

  const handleSaveCodeToCatalog = useCallback(async (body: ErrorCodeUpsertBody, isEdit = false) => {
    setError(null)
    setSavingCode(true)
    try {
      const res = await upsertErrorCode(body)
      if (!isEdit) setCodesNew((prev) => prev.filter((c) => c !== body.code))
      setAddCodeModalCode(null)
      setEditCodeInitial(null)
      setResult((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          events: prev.events.map((evt) =>
            evt.code === body.code
              ? {
                  ...evt,
                  code_solution_url: res.solution_url ?? body.solution_url ?? evt.code_solution_url,
                  code_solution_content: res.solution_content ?? evt.code_solution_content,
                }
              : evt
          ),
          incidents: prev.incidents.map((inc) => {
            const updatedEvents = inc.events.map((evt) =>
              evt.code === body.code
                ? {
                    ...evt,
                    code_solution_url:
                      res.solution_url ?? body.solution_url ?? evt.code_solution_url,
                    code_solution_content: res.solution_content ?? evt.code_solution_content,
                  }
                : evt
            )
            if (inc.code !== body.code) return { ...inc, events: updatedEvents }
            return {
              ...inc,
              events: updatedEvents,
              sds_link: res.solution_url ?? body.solution_url ?? inc.sds_link,
              sds_solution_content: res.solution_content ?? inc.sds_solution_content,
            }
          }),
        }
      })
      const baseMsg = isEdit
        ? `Código ${body.code} actualizado`
        : `Código ${body.code} agregado al catálogo`
      if (res.warning) {
        toast.showWarning(`${baseMsg}. ${res.warning}`)
      } else if (body.solution_url && res.solution_content_saved) {
        toast.showSuccess(`${baseMsg} — contenido de solución guardado`)
      } else {
        toast.showSuccess(baseMsg)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      toast.showError(msg)
    } finally {
      setSavingCode(false)
    }
  }, [setAddCodeModalCode, setEditCodeInitial, toast])

  function buildIncidentSummaryItems(incidents: ApiIncident[]): SavedAnalysisIncidentItem[] {
    return incidents.map((inc) => ({
      code: inc.code,
      classification: inc.classification,
      severity: inc.severity,
      occurrences: inc.occurrences,
      start_time: inc.start_time,
      end_time: inc.end_time,
      counter_range: inc.counter_range,
      sds_link: inc.sds_link ?? null,
      last_event_time: inc.end_time,
    }))
  }

  const handleSaveIncident = useCallback(async (name: string, equipmentIdentifier: string | null) => {
    if (!result) return
    setSavingIncident(true)
    setError(null)
    try {
      await createSavedAnalysis({
        name,
        equipment_identifier: equipmentIdentifier,
        incidents: buildIncidentSummaryItems(result.incidents),
        global_severity: result.global_severity,
      })
      setSaveIncidentModalOpen(false)
      toast.showSuccess('Incidente guardado')
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      toast.showError(msg)
    } finally {
      setSavingIncident(false)
    }
  }, [result, setSaveIncidentModalOpen, toast])

  return {
    loading,
    error,
    setError,
    result,
    setResult,
    codesNew,
    setCodesNew,
    savingCode,
    savingIncident,
    handleAnalyze,
    handleSaveCodeToCatalog,
    handleSaveIncident,
  }
}
