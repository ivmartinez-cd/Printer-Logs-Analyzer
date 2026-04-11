import type {
  ParseLogsResponse,
  ValidateLogsResponse,
  ErrorCodeUpsertBody,
  SavedAnalysisCreateBody,
  SavedAnalysisSummary,
  SavedAnalysisFull,
  CompareResponse,
  AIDiagnosisResponse,
  PrinterModel,
  UploadPdfResponse,
} from '../types/api'

const API_BASE =
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || 'http://localhost:8000'

function normalizeEnvValue(value: string | undefined): string {
  const trimmed = (value ?? '').trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim()
  }
  return trimmed
}

const API_KEY = normalizeEnvValue(import.meta.env.VITE_API_KEY) || 'dev'

function apiHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  }
}

function withTimeout(signal: AbortSignal | undefined, ms: number): AbortSignal {
  const timeout = AbortSignal.timeout(ms)
  if (!signal) return timeout
  return AbortSignal.any([signal, timeout])
}

async function apiFetch(
  url: string,
  options: RequestInit & { signal?: AbortSignal },
  timeoutMs = 30_000
): Promise<Response> {
  const signal = withTimeout(options.signal, timeoutMs)
  try {
    return await fetch(url, { ...options, signal })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      // eslint-disable-next-line preserve-caught-error -- Error.cause requires ES2022, project targets ES2020
      throw new Error('La solicitud tardó demasiado (>30 s). Verificá tu conexión e intentá de nuevo.')
    }
    throw err
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(
      typeof err.detail === 'string' ? err.detail : res.statusText || 'Request failed'
    )
  }
  return res.json()
}

export async function previewLogs(
  logs: string,
  modelId?: string | null,
  signal?: AbortSignal
): Promise<ParseLogsResponse> {
  const body = modelId ? { logs, model_id: modelId } : { logs }
  const res = await apiFetch(`${API_BASE}/parser/preview`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify(body),
    signal,
  })
  return handleResponse<ParseLogsResponse>(res)
}

export async function validateLogs(
  logs: string,
  signal?: AbortSignal
): Promise<ValidateLogsResponse> {
  const res = await apiFetch(`${API_BASE}/parser/validate`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ logs }),
    signal,
  })
  return handleResponse<ValidateLogsResponse>(res)
}

export interface UpsertErrorCodeResult {
  id: string
  code: string
  solution_url?: string | null
  solution_content?: string | null
  solution_content_saved: boolean
  warning?: string
}

export async function upsertErrorCode(
  body: ErrorCodeUpsertBody,
  signal?: AbortSignal
): Promise<UpsertErrorCodeResult> {
  const res = await apiFetch(`${API_BASE}/error-codes/upsert`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({
      code: body.code,
      severity: body.severity ?? null,
      description: body.description ?? null,
      solution_url: body.solution_url ?? null,
    }),
    signal,
  })
  return handleResponse<UpsertErrorCodeResult>(res)
}

// --- Saved analyses (incidents) ---

export async function createSavedAnalysis(
  body: SavedAnalysisCreateBody,
  signal?: AbortSignal
): Promise<SavedAnalysisSummary> {
  const res = await apiFetch(`${API_BASE}/saved-analyses`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify(body),
    signal,
  })
  return handleResponse<SavedAnalysisSummary>(res)
}

export async function listSavedAnalyses(signal?: AbortSignal): Promise<SavedAnalysisSummary[]> {
  const res = await apiFetch(`${API_BASE}/saved-analyses`, {
    method: 'GET',
    headers: apiHeaders(),
    signal,
  })
  return handleResponse<SavedAnalysisSummary[]>(res)
}

export async function getSavedAnalysis(
  id: string,
  signal?: AbortSignal
): Promise<SavedAnalysisFull> {
  const res = await apiFetch(`${API_BASE}/saved-analyses/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: apiHeaders(),
    signal,
  })
  return handleResponse<SavedAnalysisFull>(res)
}

export async function compareSavedAnalysis(
  id: string,
  logs: string,
  signal?: AbortSignal
): Promise<CompareResponse> {
  const res = await apiFetch(`${API_BASE}/saved-analyses/${encodeURIComponent(id)}/compare`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ logs }),
    signal,
  })
  return handleResponse<CompareResponse>(res)
}

export async function deleteSavedAnalysis(id: string, signal?: AbortSignal): Promise<void> {
  const res = await apiFetch(`${API_BASE}/saved-analyses/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: apiHeaders(),
    signal,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(
      typeof err.detail === 'string' ? err.detail : res.statusText || 'Request failed'
    )
  }
}

// --- Modelos de impresora ---

export async function listPrinterModels(signal?: AbortSignal): Promise<PrinterModel[]> {
  const res = await apiFetch(`${API_BASE}/printer-models`, {
    method: 'GET',
    headers: apiHeaders(),
    signal,
  })
  return handleResponse<PrinterModel[]>(res)
}

export async function uploadPrinterModelPdf(
  file: File,
  signal?: AbortSignal
): Promise<UploadPdfResponse> {
  const formData = new FormData()
  formData.append('file', file)
  // NOTE: No setear Content-Type — el browser lo setea con el boundary correcto
  const res = await apiFetch(
    `${API_BASE}/printer-models/upload-pdf`,
    {
      method: 'POST',
      headers: { 'x-api-key': API_KEY },
      body: formData,
      signal,
    },
    90_000 // Claude puede tardar en procesar PDFs grandes
  )
  return handleResponse<UploadPdfResponse>(res)
}

// --- Diagnóstico con IA ---

export async function aiDiagnose(
  result: ParseLogsResponse,
  signal?: AbortSignal
): Promise<AIDiagnosisResponse> {
  // Construir incidentes compactos: código, severidad, ocurrencias y descripción si existe
  const incidents = result.incidents.map((inc) => {
    const firstDescEvt = inc.events.find((e) => e.code_description)
    const item: Record<string, unknown> = {
      code: inc.code,
      severity: inc.severity,
      occurrences: inc.occurrences,
      start_time: inc.start_time,
      end_time: inc.end_time,
    }
    if (firstDescEvt?.code_description) item.description = firstDescEvt.code_description
    return item
  })

  // Calcular metadata a partir de todos los eventos
  const allTimestamps = result.events
    .map((e) => new Date(e.timestamp).getTime())
    .filter((t) => !Number.isNaN(t))
  const allCounters = result.events.map((e) => e.counter)

  // Firmware más frecuente en el log
  const firmwareCounts = new Map<string, number>()
  for (const e of result.events) {
    if (e.firmware) firmwareCounts.set(e.firmware, (firmwareCounts.get(e.firmware) ?? 0) + 1)
  }
  let firmware: string | undefined
  let maxFwCount = 0
  for (const [fw, count] of firmwareCounts) {
    if (count > maxFwCount) {
      maxFwCount = count
      firmware = fw
    }
  }

  const minTs = allTimestamps.length > 0 ? allTimestamps.reduce((a, b) => Math.min(a, b)) : 0
  const maxTs = allTimestamps.length > 0 ? allTimestamps.reduce((a, b) => Math.max(a, b)) : 0

  const metadata =
    allTimestamps.length > 0
      ? {
          total_events: result.events.length,
          date_range: `${new Date(minTs).toISOString().slice(0, 16).replace('T', ' ')} – ${new Date(maxTs).toISOString().slice(0, 16).replace('T', ' ')}`,
          firmware,
          counter_range:
            allCounters.length > 0
              ? [
                  allCounters.reduce((a, b) => Math.min(a, b)),
                  allCounters.reduce((a, b) => Math.max(a, b)),
                ]
              : undefined,
        }
      : undefined

  // NOTE: timeout de 60s — el modelo puede tardar 3-5s y queremos margen para cold starts
  const res = await apiFetch(
    `${API_BASE}/analysis/ai-diagnose`,
    {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ incidents, global_severity: result.global_severity, metadata }),
      signal,
    },
    60_000
  )
  return handleResponse<AIDiagnosisResponse>(res)
}

export interface HealthStatus {
  db_available: boolean
  db_mode: 'postgres' | 'local_fallback'
}

export async function getHealth(): Promise<HealthStatus | null> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(10_000) })
    if (!res.ok) return null
    return (await res.json()) as HealthStatus
  } catch {
    return null
  }
}
