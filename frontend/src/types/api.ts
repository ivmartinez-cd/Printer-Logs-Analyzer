export interface Event {
  type: string
  code: string
  timestamp: string
  counter: number
  firmware: string | null
  help_reference: string | null
  code_severity?: string | null
  code_description?: string | null
  code_solution_url?: string | null
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
  events: Event[]
  sds_link?: string
}

export interface ParserError {
  line_number: number
  raw_line: string
  reason: string
}

export interface ParseLogsResponse {
  events: Event[]
  incidents: Incident[]
  global_severity: string
  errors: ParserError[]
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
