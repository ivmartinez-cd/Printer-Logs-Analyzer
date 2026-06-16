export interface Event {
  type: string
  code: string
  timestamp: string
  counter: number
  firmware: string | null
  help_reference: string | null
}

export interface EnrichedEvent extends Event {
  code_severity?: string | null
  code_description?: string | null
  code_solution_url?: string | null
  code_solution_content?: string | null
}

export interface Incident {
  id: string
  code: string
  classification: string
  severity: string
  severity_weight: number
  occurrences: number
  start_time: string
  end_time: string
  counter_range: [number, number]
  events: EnrichedEvent[]
  sds_link?: string | null
  sds_solution_content?: string | null
}

export interface ParserError {
  line_number: number
  raw_line: string
  reason: string
}

export interface RealtimeConsumable {
  type: string
  description: string
  sku: string
  percentLeft: number
  pagesLeft: number | null
  daysLeft: number | null
}

export interface ParseLogsResponse {
  events: EnrichedEvent[]
  incidents: Incident[]
  global_severity: string
  errors: ParserError[]
  log_start_date: string
  log_end_date: string
  total_lines: number
}

export interface ValidateLogsResponse {
  total_lines: number
  codes_detected: string[]
  codes_new: string[]
  errors: ParserError[]
}

// --- Saved analyses (incidents) ---

export interface SavedAnalysisIncidentItem {
  code: string
  classification: string
  severity: string
  occurrences: number
  start_time: string
  end_time: string
  counter_range: [number, number]
  sds_link?: string | null
  last_event_time?: string | null
}

export interface SavedAnalysisCreateBody {
  name: string
  equipment_identifier?: string | null
  incidents: SavedAnalysisIncidentItem[]
  global_severity: string
}

export interface SavedAnalysisSummary {
  id: string
  name: string
  equipment_identifier: string | null
  global_severity: string
  created_at: string
}

// --- Diagnóstico con IA ---

export interface AIDiagnosisResponse {
  diagnosis: string
  tareas_resumen?: string | null
  urgencia?: 'urgente' | 'programar' | 'monitorear' | null
  model: string
  tokens_used: {
    input: number
    output: number
    cache_write: number
    cache_read: number
  }
  cost_usd: number
}

// --- Insight / SDS Portal ---

export interface InsightAlert {
  deviceId: number
  date: string
  engineCycles: number
  trainingLevel: number
  severityLevel: number
  alertClass: string
  mibCode: number
  description: string
  cleared?: string | null
}

export interface DeviceAlertsResponse {
  insight_configured: boolean
  serial?: string
  device_id?: number | null
  model?: string | null
  zone?: string | null
  firmware?: string | null
  current?: InsightAlert[]
  history?: InsightAlert[]
}

export interface InsightMeter {
  date: string
  engineCycles: number
  description: string
  value: number
}

export interface ExtractSdsLogsResponse {
  serial: string
  device_id: string
  model_name_sds: string
  firmware: string | null
  suggested_model_id: string | null
  logs_text: string
  event_count: number
  realtime_consumables: RealtimeConsumable[]
}

export interface RemoteEwsResponse {
  ews_url: string
}

// --- Fleet ---

export interface FleetClientSummary {
  id: string
  name: string
  device_count: number
}

export interface FleetDeviceSummary {
  serial: string
  location: string
  model?: string
}

export interface FleetClientDetail {
  id: string
  name: string
  devices: FleetDeviceSummary[]
}
