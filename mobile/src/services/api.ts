import type {
  ParseLogsResponse,
  ValidateLogsResponse,
  ErrorCodeUpsertBody,
  SavedAnalysisCreateBody,
  SavedAnalysisSummary,
  SavedAnalysisFull,
  CompareResponse,
  AIDiagnosisResponse,
  ErrorSolution,
  DeviceAlertsResponse,
  ExtractSdsLogsResponse,
  ResolveDeviceResponse,
  InsightMeter,
  RemoteEwsResponse,
  RealtimeConsumable,
  FleetClientSummary,
  FleetClientDetail,
  FleetScanResult,
  FleetScanStatusResponse,
  MaintenanceCheckJob,
  MaintenanceDevice,
  MaintenanceDeviceState,
  MaintenanceHistory,
  MaintenanceIncident,
  MaintenanceModelRule,
  MaintenanceMutationResponse,
  MaintenanceSyncStatus,
} from '../types/api'

const API_BASE = __DEV__ ? 'http://10.0.2.2:8001' : 'https://34.63.48.46.sslip.io'
const API_KEY = 'test123'

export function getApiBase(): string {
  return API_BASE
}

export function getApiKey(): string {
  return API_KEY
}

function apiHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  }
}

function withTimeout(signal: AbortSignal | undefined, ms: number): AbortSignal {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), ms)
  
  if (signal) {
    signal.addEventListener('abort', () => {
      clearTimeout(timeoutId)
      controller.abort()
    })
  }
  
  return controller.signal
}

async function apiFetch(
  url: string,
  options: RequestInit & { signal?: AbortSignal },
  timeoutMs = 30_000
): Promise<Response> {
  const signal = withTimeout(options.signal, timeoutMs)
  try {
    return await fetch(url, { ...options, signal })
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('La solicitud tardó demasiado. Verificá tu conexión e intentá de nuevo.')
    }
    throw err
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

export async function getHealth(): Promise<{ db_available: boolean; db_mode: string } | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: controller.signal })
    clearTimeout(timeoutId)
    if (!res.ok) return null
    return await res.json()
  } catch {
    clearTimeout(timeoutId)
    return null
  }
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

export async function deleteSavedAnalysis(id: string, signal?: AbortSignal): Promise<void> {
  const res = await apiFetch(`${API_BASE}/saved-analyses/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: apiHeaders(),
    signal,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Error al eliminar')
  }
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

export async function getInsightMeters(
  serial: string,
  signal?: AbortSignal
): Promise<InsightMeter[]> {
  const res = await apiFetch(
    `${API_BASE}/insight/devices/${encodeURIComponent(serial)}/meters`,
    { method: 'GET', headers: apiHeaders(), signal },
    15_000
  )
  return handleResponse<InsightMeter[]>(res)
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

export async function getMaintenanceDevices(): Promise<MaintenanceDevice[]> {
  const res = await apiFetch(`${API_BASE}/maintenance/devices`, { method: 'GET', headers: apiHeaders() })
  return handleResponse<MaintenanceDevice[]>(res)
}

export async function getMaintenanceModelRules(
  modelFamily: string
): Promise<MaintenanceModelRule[]> {
  const res = await apiFetch(`${API_BASE}/maintenance/models/${encodeURIComponent(modelFamily)}/rules`, { method: 'GET', headers: apiHeaders() })
  return handleResponse<MaintenanceModelRule[]>(res)
}

export async function getMaintenanceFamilies(): Promise<string[]> {
  const res = await apiFetch(`${API_BASE}/maintenance/models/families`, { method: 'GET', headers: apiHeaders() })
  return handleResponse<string[]>(res)
}

export async function upsertMaintenanceModelRule(rule: MaintenanceModelRule): Promise<void> {
  const res = await apiFetch(`${API_BASE}/maintenance/models/rules`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify(rule),
  })
  return handleResponse(res)
}

export async function getMaintenanceDeviceState(
  serial: string
): Promise<MaintenanceDeviceState[]> {
  const res = await apiFetch(`${API_BASE}/maintenance/devices/${encodeURIComponent(serial)}/state`, { method: 'GET', headers: apiHeaders() })
  return handleResponse<MaintenanceDeviceState[]>(res)
}

export async function updateDeviceState(serial: string, componentType: string, lastChangeCounter: number): Promise<void> {
  const res = await apiFetch(`${API_BASE}/maintenance/devices/state`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ serial, component_type: componentType, last_change_counter: lastChangeCounter })
  })
  return handleResponse(res)
}

export async function syncMaintenanceDevice(
  serial: string,
  sendEmails: boolean = true
): Promise<MaintenanceDevice> {
  const url = `${API_BASE}/maintenance/devices/${encodeURIComponent(serial)}/sync?send_emails=${sendEmails}`
  const res = await apiFetch(url, {
    method: 'POST',
    headers: apiHeaders(),
  }, 30_000)
  return handleResponse<MaintenanceDevice>(res)
}

export async function getMaintenanceHistory(serial: string): Promise<MaintenanceHistory[]> {
  const res = await apiFetch(`${API_BASE}/maintenance/history/${encodeURIComponent(serial)}`, {
    method: 'GET',
    headers: apiHeaders(),
  })
  return handleResponse<MaintenanceHistory[]>(res)
}

export async function recordMaintenanceChange(data: {
  serial: string
  component_type: string
  incident_number?: string
  notes?: string
}): Promise<void> {
  const res = await apiFetch(`${API_BASE}/maintenance/record-change`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify(data),
  })
  return handleResponse(res)
}

export async function openMaintenanceIncident(data: {
  serial: string
  component_type: string
  incident_number: string
  notes?: string
}): Promise<MaintenanceIncident> {
  const res = await apiFetch(`${API_BASE}/maintenance/incidents`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify(data),
  })
  return handleResponse<MaintenanceIncident>(res)
}

export async function closeMaintenanceIncident(
  incidentId: string,
  notes?: string
): Promise<MaintenanceMutationResponse> {
  const res = await apiFetch(`${API_BASE}/maintenance/incidents/${encodeURIComponent(incidentId)}/close`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ notes }),
  })
  return handleResponse<MaintenanceMutationResponse>(res)
}

export async function getDeviceIncidents(serial: string): Promise<MaintenanceIncident[]> {
  const res = await apiFetch(`${API_BASE}/maintenance/devices/${encodeURIComponent(serial)}/incidents`, {
    method: 'GET',
    headers: apiHeaders(),
  })
  return handleResponse<MaintenanceIncident[]>(res)
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
  const res = await apiFetch(
    `${API_BASE}/error-codes/${encodeURIComponent(code)}/solution-proxy`,
    {
      method: 'GET',
      headers: apiHeaders(),
      signal,
    },
    20_000
  )
  return handleResponse<{ content: string | null; source: 'cache' | 'live'; url: string | null }>(res)
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

