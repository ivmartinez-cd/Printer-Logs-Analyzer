import type {
  ParseLogsResponse,
  ValidateLogsResponse,
  SavedAnalysisCreateBody,
  SavedAnalysisSummary,
  AIDiagnosisResponse,
  DeviceAlertsResponse,
  ExtractSdsLogsResponse,
  InsightMeter,
  RemoteEwsResponse,
  RealtimeConsumable,
  FleetClientSummary,
  FleetClientDetail,
} from '../types/api'
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_BASE = 'https://34.63.48.46.sslip.io'
const API_KEY = 'test123'

function apiHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  }
}

async function apiFetch(
  url: string,
  options: RequestInit & { signal?: AbortSignal },
  timeoutMs = 30_000
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  // Encadenar el signal externo (si lo hay) para que su abort también cancele
  const parentSignal = options.signal
  const onParentAbort = () => controller.abort()
  if (parentSignal) parentSignal.addEventListener('abort', onParentAbort)

  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('La solicitud tardó demasiado. Verificá tu conexión e intentá de nuevo.')
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
    if (parentSignal) parentSignal.removeEventListener('abort', onParentAbort)
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(
      typeof err.detail === 'string' ? err.detail : res.statusText || 'Error en la solicitud'
    )
  }
  return res.json()
}

export async function previewLogs(
  logs: string,
  modelFamily?: string | null,
  signal?: AbortSignal
): Promise<ParseLogsResponse> {
  const body = modelFamily ? { logs, model_family: modelFamily } : { logs }
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

export async function extractSdsLogs(
  serial: string,
  days: number = 30,
  signal?: AbortSignal
): Promise<ExtractSdsLogsResponse> {
  const res = await apiFetch(
    `${API_BASE}/sds/extract-logs`,
    {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ serial, days }),
      signal,
    },
    60_000
  )
  return handleResponse<ExtractSdsLogsResponse>(res)
}

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

export async function getInsightAlerts(
  serial: string,
  signal?: AbortSignal
): Promise<DeviceAlertsResponse> {
  const res = await apiFetch(
    `${API_BASE}/insight/devices/${encodeURIComponent(serial)}/alerts`,
    { method: 'GET', headers: apiHeaders(), signal },
    15_000
  )
  return handleResponse<DeviceAlertsResponse>(res)
}

export async function aiDiagnose(
  result: ParseLogsResponse,
  extra?: {
    consumables?: RealtimeConsumable[]
    alerts?: DeviceAlertsResponse | null
    meters?: InsightMeter[]
    serialNumber?: string | null
    modelName?: string | null
  },
  signal?: AbortSignal
): Promise<AIDiagnosisResponse> {
  const incidents = result.incidents.map((inc) => {
    const firstDescEvt = inc.events.find((e) => e.code_description)
    const item: Record<string, any> = {
      code: inc.code,
      severity: inc.severity,
      occurrences: inc.occurrences,
      start_time: inc.start_time,
      end_time: inc.end_time,
    }
    if (firstDescEvt?.code_description) item.description = firstDescEvt.code_description
    if (inc.counter_range) item.counter_range = inc.counter_range
    return item
  })

  const metadata = {
    total_events: result.events.length,
    consumables: extra?.consumables,
    serial_number: extra?.serialNumber,
    model_name: extra?.modelName,
  }

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

export async function listFleetClients(): Promise<FleetClientSummary[]> {
  const res = await apiFetch(`${API_BASE}/fleet/clients`, { method: 'GET', headers: apiHeaders() }, 10_000)
  return handleResponse<FleetClientSummary[]>(res)
}

export async function getFleetClient(clientId: string): Promise<FleetClientDetail> {
  const res = await apiFetch(`${API_BASE}/fleet/clients/${encodeURIComponent(clientId)}`, { method: 'GET', headers: apiHeaders() }, 10_000)
  return handleResponse<FleetClientDetail>(res)
}

export async function getSolutionProxy(
  code: string,
  signal?: AbortSignal
): Promise<{ content: string | null; source: 'cache' | 'live'; url: string | null }> {
  const cacheKey = `solution_cache_${code.toUpperCase().replace(/\s+/g, '')}`
  try {
    const res = await apiFetch(
      `${API_BASE}/error-codes/${encodeURIComponent(code)}/solution-proxy`,
      {
        method: 'GET',
        headers: apiHeaders(),
        signal,
      },
      20_000
    )
    const data = await handleResponse<{ content: string | null; source: 'cache' | 'live'; url: string | null }>(res)
    try {
      await AsyncStorage.setItem(cacheKey, JSON.stringify(data))
    } catch {
      // Ignorar fallas al escribir en cache
    }
    return data
  } catch (err) {
    try {
      const cached = await AsyncStorage.getItem(cacheKey)
      if (cached) {
        const parsed = JSON.parse(cached)
        return {
          content: parsed.content,
          source: 'cache',
          url: parsed.url,
        }
      }
    } catch {
      // Ignorar fallas al leer de cache
    }
    throw err
  }
}

export async function getRemoteEwsAccess(
  serial: string,
  signal?: AbortSignal
): Promise<RemoteEwsResponse> {
  const res = await apiFetch(
    `${API_BASE}/sds/devices/${encodeURIComponent(serial)}/remote-ews`,
    {
      method: 'GET',
      headers: apiHeaders(),
      signal,
    },
    15_000
  )
  return handleResponse<RemoteEwsResponse>(res)
}
