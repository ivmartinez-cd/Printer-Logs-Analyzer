import type { ParseLogsResponse } from '../types/api'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const API_KEY = import.meta.env.VITE_API_KEY || ''

export async function previewLogs(
  logs: string,
  signal?: AbortSignal
): Promise<ParseLogsResponse> {
  const res = await fetch(`${API_BASE}/parser/preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({ logs }),
    signal,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || res.statusText || 'Request failed')
  }
  return res.json()
}
