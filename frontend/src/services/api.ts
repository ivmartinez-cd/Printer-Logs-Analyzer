import type { ConfigResponse, ParseLogsResponse, ValidateLogsResponse } from '../types/api'

const BASE_URL = 'http://127.0.0.1:8000'
const API_KEY = 'test123'

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text()
    let message = `HTTP ${res.status}`
    try {
      const body = JSON.parse(text)
      if (body.detail) message += `: ${typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail)}`
      else message += ` ${text.slice(0, 200)}`
    } catch {
      if (text) message += ` ${text.slice(0, 200)}`
    }
    throw new Error(message)
  }
  return res.json() as Promise<T>
}

const USER_ID = 'ui-user'

/**
 * POST /parser/preview — parse logs and run analysis.
 */
export async function previewLogs(logs: string): Promise<ParseLogsResponse> {
  const res = await fetch(`${BASE_URL}/parser/preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({ logs }),
  })
  return handleResponse<ParseLogsResponse>(res)
}

/**
 * POST /parser/validate — validate log and detect codes / codes_new.
 */
export async function validateLogs(logs: string): Promise<ValidateLogsResponse> {
  const res = await fetch(`${BASE_URL}/parser/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({ logs }),
  })
  return handleResponse<ValidateLogsResponse>(res)
}

/**
 * GET /config — fetch active configuration.
 */
export async function getConfig(): Promise<ConfigResponse> {
  const res = await fetch(`${BASE_URL}/config`, {
    headers: { 'x-api-key': API_KEY },
  })
  return handleResponse<ConfigResponse>(res)
}

/**
 * PUT /config — update configuration (full body).
 */
export async function updateConfig(configBody: ConfigResponse['config']): Promise<ConfigResponse> {
  const res = await fetch(`${BASE_URL}/config`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'x-user-id': USER_ID,
    },
    body: JSON.stringify(configBody),
  })
  return handleResponse<ConfigResponse>(res)
}
