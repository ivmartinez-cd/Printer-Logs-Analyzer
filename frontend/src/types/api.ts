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

export interface AIPdfSummaryResponse {
  narrative_summary: string
  tone: 'critical' | 'watch' | 'ok'
  action_plan: string[]
  error_translations: Record<string, string>
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

export interface ErrorCodeUpsertBody {
  code: string
  severity?: string | null
  description?: string | null
  solution_url?: string | null
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

export interface SavedAnalysisFull {
  id: string
  name: string
  equipment_identifier: string | null
  incidents: SavedAnalysisIncidentItem[]
  global_severity: string
  created_at: string
}

export interface CompareDiff {
  codigos_nuevos: string[]
  codigos_desaparecidos: string[]
  cambios_ocurrencias: Array<{
    code: string
    saved_occurrences: number
    current_occurrences: number
    delta: number
  }>
  diferencia_dias: number
  tendencia: 'mejoro' | 'estable' | 'empeoro'
}

export interface CompareResponse {
  saved: SavedAnalysisFull
  current: ParseLogsResponse
  diff: CompareDiff
}

export interface ErrorSolutionFru {
  part_number: string
  description: string
}

export interface ErrorSolution {
  id: number | null
  model_id: string
  code: string
  title: string | null
  cause: string | null
  technician_steps: string[]
  frus: ErrorSolutionFru[]
  source_audience: string | null
  source_page: number | null
  cpmd_hash: string | null
}


// --- Diagnóstico con IA ---

export interface AIDiagnosisResponse {
  diagnosis: string
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
  /** False when INSIGHT_* env vars are not configured on the server. */
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

export interface ResolveDeviceResponse {
  serial: string
  device_id: string
  model_name_sds: string
  firmware: string | null
  suggested_model_id: string | null
  suggested_model_name: string | null
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

export interface RollerComponent {
  label: string
  percent: number
}

export interface FleetTopError {
  code: string
  count: number
}

export interface FleetTimelinePoint {
  date: string
  errors: number
  warnings: number
}

export interface FleetScanResult {
  serial: string
  location: string
  status: 'ok' | 'warning' | 'critical' | 'unreachable'
  error_count: number
  warning_count: number
  model_name: string | null
  firmware: string | null
  last_event_date: string | null
  fuser_life_percent?: number | null
  black_toner_percent?: number | null
  roller_components?: RollerComponent[]
  active_alerts_count?: number
  active_alerts_max_severity?: string | null
  error_message?: string | null
  top_errors?: FleetTopError[]
  timeline_data?: FleetTimelinePoint[]
}

export interface FleetScanStatusResponse {
  status: string
  processed: number
  total: number
  results?: FleetScanResult[]
}

export interface MaintenanceDevice {
  serial: string
  model_family: string | null
  last_sync_counter: number
  last_sync_at?: string | null
  is_active: boolean
}

export interface MaintenanceModelRule {
  id?: number | null
  model_family: string
  component_type: string
  expected_life: number
  alert_margin: number
  email_recipients?: string | null
}

export interface MaintenanceDeviceState {
  id?: number | null
  device_serial: string
  component_type: string
  last_change_counter: number
}

export interface MaintenanceHistory {
  id?: number | null
  device_serial: string
  component_type: string
  change_counter: number
  incident_number?: string | null
  technician_notes?: string | null
  changed_at?: string | null
}

export interface MaintenanceIncident {
  id?: string | null
  device_serial: string
  component_type: string
  incident_number: string
  notes?: string | null
  status: string
  opened_at?: string | null
  closed_at?: string | null
}

export interface MaintenanceCheckJob {
  job_id: string
  total: number
  status: string
}

export interface MaintenanceSyncStatus {
  status: string
  processed: number
  total: number
  errors: number
}

export interface MaintenanceMutationResponse {
  status: string
  history_id?: number | null
}

export interface CdsReplacement {
  articulo: string
  cantidad: number
}

export interface CdsIncident {
  id: string
  numero_incidente: string
  fecha: string
  motivo: string
  estado: string
  contador: string | null
  repuestos: CdsReplacement[]
  tareas_realizadas: string[]
}

