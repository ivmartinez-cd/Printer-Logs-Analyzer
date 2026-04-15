import { describe, it, expect, vi, afterEach } from 'vitest'

// Mock fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

afterEach(() => {
  mockFetch.mockReset()
})

// Import after mocking
import { extractSdsLogs } from '../services/api'

function makeResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    headers: new Headers(),
  } as unknown as Response
}

describe('extractSdsLogs', () => {
  it('successfully extracts logs for a given serial', async () => {
    mockFetch.mockResolvedValue(
      makeResponse(200, {
        serial: 'MXSCS7Q00Q',
        event_count: 5,
        logs_text: 'Log content here',
      })
    )

    const result = await extractSdsLogs('MXSCS7Q00Q')

    expect(result.serial).toBe('MXSCS7Q00Q')
    expect(result.event_count).toBe(5)
    expect(result.logs_text).toBe('Log content here')
    
    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/sds/extract-logs')
    expect(options.method).toBe('POST')
    expect(options.body).toContain('"serial":"MXSCS7Q00Q"')
  })

  it('normalizes serial number in the request body', async () => {
    mockFetch.mockResolvedValue(makeResponse(200, { serial: 'SERIAL', event_count: 0, logs_text: '' }))
    
    await extractSdsLogs('lowercaseserial')
    
    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(options.body).toContain('"serial":"lowercaseserial"')
  })

  it('throws error on server failure', async () => {
    mockFetch.mockResolvedValue(
      makeResponse(502, { detail: 'Portal timeout' })
    )

    await expect(extractSdsLogs('FAIL')).rejects.toThrow('Portal timeout')
  })

  it('throws error on network failure', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    await expect(extractSdsLogs('FAIL')).rejects.toThrow('Network error')
  })
})
