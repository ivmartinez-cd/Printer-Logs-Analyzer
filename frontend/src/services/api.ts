import type {
  ParseLogsResponse,
  ValidateLogsResponse,
  ErrorCodeUpsertBody,
  SavedAnalysisCreateBody,
  SavedAnalysisSummary,
  SavedAnalysisFull,
  CompareResponse,
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

export async function previewLogs(logs: string, signal?: AbortSignal): Promise<ParseLogsResponse> {
  const res = await apiFetch(`${API_BASE}/parser/preview`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ logs }),
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
