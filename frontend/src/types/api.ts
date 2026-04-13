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
  sds_link?: string
  sds_solution_content?: string | null
}

export interface ParserError {
  line_number: number
  raw_line: string
  reason: string
}

export interface ConsumableWarning {
  part_number: string
  description: string
  category: string
  life_pages: number
  current_counter: number
  usage_pct: number
  status: 'ok' | 'warning' | 'replace'
  matched_codes: string[]
}

export interface ParseLogsResponse {
  events: EnrichedEvent[]
  incidents: Incident[]
  global_severity: string
  errors: ParserError[]
  consumable_warnings: ConsumableWarning[]
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

// --- Modelos de impresora ---

export interface PrinterModel {
  id: string
  model_name: string
  model_code: string
  family: string | null
  ampv: number | null
  engine_life_pages: number | null
  notes: string | null
  has_cpmd: boolean
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

export interface IngestReport {
  model_id: string
  cpmd_hash: string
  total_blocks: number | null
  extracted: number | null
  failed: number | null
  skipped: boolean
  reason: string | null
}

export interface UploadPdfResponse {
  created: string[]
  skipped: string[]
  total_consumables: number
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
  current?: InsightAlert[]
  history?: InsightAlert[]
}

