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
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE ||
  'http://localhost:8000'

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

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(typeof err.detail === 'string' ? err.detail : res.statusText || 'Request failed')
  }
  return res.json()
}

export async function previewLogs(
  logs: string,
  signal?: AbortSignal
): Promise<ParseLogsResponse> {
  const res = await fetch(`${API_BASE}/parser/preview`, {
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
  const res = await fetch(`${API_BASE}/parser/validate`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ logs }),
    signal,
  })
  return handleResponse<ValidateLogsResponse>(res)
}

export async function upsertErrorCode(
  body: ErrorCodeUpsertBody,
  signal?: AbortSignal
): Promise<unknown> {
  const res = await fetch(`${API_BASE}/error-codes/upsert`, {
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
  return handleResponse(res)
}

// --- Saved analyses (incidents) ---

export async function createSavedAnalysis(
  body: SavedAnalysisCreateBody,
  signal?: AbortSignal
): Promise<SavedAnalysisSummary> {
  const res = await fetch(`${API_BASE}/saved-analyses`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify(body),
    signal,
  })
  return handleResponse<SavedAnalysisSummary>(res)
}

export async function listSavedAnalyses(
  signal?: AbortSignal
): Promise<SavedAnalysisSummary[]> {
  const res = await fetch(`${API_BASE}/saved-analyses`, {
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
  const res = await fetch(`${API_BASE}/saved-analyses/${encodeURIComponent(id)}`, {
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
  const res = await fetch(`${API_BASE}/saved-analyses/${encodeURIComponent(id)}/compare`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ logs }),
    signal,
  })
  return handleResponse<CompareResponse>(res)
}

export async function deleteSavedAnalysis(
  id: string,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(`${API_BASE}/saved-analyses/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: apiHeaders(),
    signal,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(typeof err.detail === 'string' ? err.detail : res.statusText || 'Request failed')
  }
}
