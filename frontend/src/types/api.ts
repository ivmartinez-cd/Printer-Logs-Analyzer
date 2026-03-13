/** Event: one parsed log line from the backend. */
export interface Event {
  type: string
  code: string
  timestamp: string
  counter: number
  firmware: string | null
  help_reference: string | null
}

/** Incident: grouped events that match a rule. */
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
  events: Event[]
  sds_link?: string
}

/** ParserError: non-fatal parse issue for a line. */
export interface ParserError {
  line_number: number
  raw_line: string
  reason: string
}

/** Response of POST /parser/preview. */
export interface ParseLogsResponse {
  events: Event[]
  incidents: Incident[]
  global_severity: string
  errors: ParserError[]
}

/** Response of POST /parser/validate. */
export interface ValidateLogsResponse {
  total_lines: number
  codes_detected: string[]
  codes_new: string[]
  errors: ParserError[]
}

/** Single rule in config. */
export interface GlobalRule {
  code: string
  classification: string
  description: string
  resolution: string
  recency_window: number
  X: number
  Y: number
  counter_max_jump: number
  severity_weight?: number
  enabled: boolean
  tags: string[]
  sds_link?: string
}

/** Active config from GET /config. */
export interface ConfigResponse {
  version_number: number
  version_id: string
  created_at: string
  created_by: string
  config: {
    metadata: Record<string, unknown>
    defaults: Record<string, unknown>
    models: Record<string, unknown>
    global_rules: GlobalRule[]
  }
}
