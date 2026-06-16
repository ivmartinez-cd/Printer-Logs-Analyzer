import type {
  ParseLogsResponse,
  ValidateLogsResponse,
  ErrorCodeUpsertBody,
  SavedAnalysisCreateBody,
  SavedAnalysisSummary,
  SavedAnalysisFull,
  DeviceHealth,
  CompareResponse,
  AIDiagnosisResponse,
  ErrorSolution,
  DeviceAlertsResponse,
  ExtractSdsLogsResponse,
  RemoteEwsResponse,
  ResolveDeviceResponse,
  InsightMeter,
  RealtimeConsumable,
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
  AIPdfSummaryResponse,
} from '../types/api'

const API_BASE =
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || 'http://localhost:8001'

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

export interface SolutionProxyResult {
  content: string | null
  source: 'live' | 'cache'
  url: string | null
}

export async function getSolutionProxy(
  code: string,
  signal?: AbortSignal
): Promise<SolutionProxyResult> {
  const res = await apiFetch(`${API_BASE}/error-codes/${encodeURIComponent(code)}/solution-proxy`, {
    method: 'GET',
    headers: apiHeaders(),
    signal,
  })
  return handleResponse<SolutionProxyResult>(res)
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

export async function updateSavedAnalysis(
  id: string,
  body: SavedAnalysisCreateBody,
  signal?: AbortSignal
): Promise<SavedAnalysisSummary> {
  const res = await apiFetch(`${API_BASE}/saved-analyses/${encodeURIComponent(id)}`, {
    method: 'PUT',
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

export async function getDeviceHealth(
  id: string,
  signal?: AbortSignal
): Promise<DeviceHealth> {
  const res = await apiFetch(`${API_BASE}/saved-analyses/${encodeURIComponent(id)}/health`, {
    method: 'GET',
    headers: apiHeaders(),
    signal,
  })
  return handleResponse<DeviceHealth>(res)
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



export async function getErrorSolution(
  modelFamily: string,
  code: string,
  signal?: AbortSignal
): Promise<ErrorSolution | null> {
  const res = await apiFetch(
    `${API_BASE}/models/${encodeURIComponent(modelFamily)}/error-solutions/${encodeURIComponent(code)}`,
    { method: 'GET', headers: apiHeaders(), signal }
  )
  if (res.status === 404) return null
  return handleResponse<ErrorSolution>(res)
}

// --- Diagnóstico con IA ---

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
    if (inc.counter_range) item.counter_range = inc.counter_range
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

  // Filtrar alertas y metros al último mes
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

  const alertsHistory = [
    ...(extra?.alerts?.current ?? []),
    ...(extra?.alerts?.history ?? []),
  ].filter((a) => new Date(a.date) >= oneMonthAgo)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 30)

  const metersPattern = (extra?.meters ?? [])
    .filter((m) => new Date(m.date) >= oneMonthAgo)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const metadata = {
    total_events: result.events.length,
    date_range:
      allTimestamps.length > 0
        ? `${new Date(minTs).toISOString().slice(0, 16).replace('T', ' ')} – ${new Date(maxTs).toISOString().slice(0, 16).replace('T', ' ')}`
        : undefined,
    firmware,
    counter_range:
      allCounters.length > 0
        ? [Math.min(...allCounters), Math.max(...allCounters)]
        : undefined,
    consumables: extra?.consumables,
    alerts_history: alertsHistory.length > 0 ? alertsHistory : undefined,
    meters_pattern: metersPattern.length > 0 ? metersPattern : undefined,
    serial_number: extra?.serialNumber,
    model_name: extra?.modelName,
  }

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

interface PdfIncidentSummary {
  code: string
  severity: string
  occurrences: number
  description?: string | null
  start_time?: string
  end_time?: string
}

interface PdfTopCode {
  name: string
  count: number
  severity: string
  sds_link?: string | null
  sds_solution_content?: string | null
}

export async function generatePdfSummary(
  payload: {
    incidents: PdfIncidentSummary[]
    consumables?: RealtimeConsumable[]
    top_codes?: PdfTopCode[]
    model_name?: string | null
    serial_number?: string | null
  },
  signal?: AbortSignal
): Promise<AIPdfSummaryResponse> {
  const res = await apiFetch(
    `${API_BASE}/analysis/pdf-summary`,
    {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify(payload),
      signal,
    },
    40_000
  )
  return handleResponse<AIPdfSummaryResponse>(res)
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

// --- Insight / SDS Portal ---

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

export async function resolveDevice(
  serial: string,
  signal?: AbortSignal
): Promise<ResolveDeviceResponse> {
  const res = await apiFetch(
    `${API_BASE}/sds/resolve-device?serial=${encodeURIComponent(serial)}`,
    { method: 'GET', headers: apiHeaders(), signal },
    15_000
  )
  return handleResponse<ResolveDeviceResponse>(res)
}

export async function getRemoteEwsAccess(
  serial: string,
  signal?: AbortSignal
): Promise<RemoteEwsResponse> {
  const res = await apiFetch(
    `${API_BASE}/sds/devices/${encodeURIComponent(serial)}/remote-ews`,
    { method: 'GET', headers: apiHeaders(), signal },
    25_000
  )
  return handleResponse<RemoteEwsResponse>(res)
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
    60_000 // Extraction can take some time
  )
  return handleResponse<ExtractSdsLogsResponse>(res)
}


export async function listFleetClients(): Promise<import('../types/api').FleetClientSummary[]> {
  const res = await apiFetch(`${API_BASE}/fleet/clients`, { method: 'GET', headers: apiHeaders() }, 10_000)
  return handleResponse(res)
}

export async function getFleetClient(clientId: string): Promise<import('../types/api').FleetClientDetail> {
  const res = await apiFetch(`${API_BASE}/fleet/clients/${encodeURIComponent(clientId)}`, { method: 'GET', headers: apiHeaders() }, 10_000)
  return handleResponse(res)
}

export async function triggerFleetScan(
  clientId: string,
  models: string[] | null,
  signal?: AbortSignal
): Promise<{ job_id: string; total: number; status: string }> {
  const res = await apiFetch(`${API_BASE}/fleet/scan-now`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ client_id: clientId, models, days: 30 }),
    signal,
  })
  return handleResponse(res)
}

export async function getFleetScanStatus(
  jobId: string,
  signal?: AbortSignal
): Promise<FleetScanStatusResponse> {
  const res = await apiFetch(`${API_BASE}/fleet/scan-status/${jobId}`, {
    method: 'GET',
    headers: apiHeaders(),
    signal,
  })
  return handleResponse<FleetScanStatusResponse>(res)
}

export async function scanFleet(
  clientId: string,
  models: string[] | null = null,
  days = 30,
  signal?: AbortSignal
): Promise<FleetScanResult[]> {
  const res = await apiFetch(
    `${API_BASE}/fleet/scan`,
    {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ client_id: clientId, days, models }),
      signal,
    },
    120_000
  )
  return handleResponse(res)
}

// --- Maintenance / Avisos ---

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

export async function discoverFamily(modelFamily: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/maintenance/models/${encodeURIComponent(modelFamily)}/discover`, { 
    method: 'POST', 
    headers: apiHeaders() 
  })
  return handleResponse(res)
}

export async function triggerMaintenanceCheck(
  modelFamily?: string,
  sendEmails: boolean = true
): Promise<MaintenanceCheckJob> {
  const body = JSON.stringify({ model_family: modelFamily ?? null, send_emails: sendEmails })
  const res = await apiFetch(`${API_BASE}/maintenance/check-now`, {
    method: 'POST',
    headers: apiHeaders(),
    body,
  })
  return handleResponse<MaintenanceCheckJob>(res)
}

export async function getMaintenanceSyncStatus(jobId: string): Promise<MaintenanceSyncStatus> {
  const res = await apiFetch(
    `${API_BASE}/maintenance/sync-status/${encodeURIComponent(jobId)}`,
    { method: 'GET', headers: apiHeaders() }
  )
  return handleResponse<MaintenanceSyncStatus>(res)
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

export async function renameFamily(oldName: string, newName: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/maintenance/models/rename`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ old_name: oldName, new_name: newName })
  })
  return handleResponse(res)
}

export async function clearFamilyDevices(modelFamily: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/maintenance/models/${encodeURIComponent(modelFamily)}/devices`, {
    method: 'DELETE',
    headers: apiHeaders()
  })
  return handleResponse(res)
}

export async function deleteFamily(modelFamily: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/maintenance/models/${encodeURIComponent(modelFamily)}`, {
    method: 'DELETE',
    headers: apiHeaders()
  })
  return handleResponse(res)
}

export async function sendMaintenanceAlert(serial: string, componentType: string): Promise<{ status: string; recipients: string[] }> {
  const res = await apiFetch(`${API_BASE}/maintenance/send-alert`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ serial, component_type: componentType }),
  })
  return handleResponse(res)
}
