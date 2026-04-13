import { describe, it, expect, vi, afterEach } from 'vitest'

// Mock fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

afterEach(() => {
  mockFetch.mockReset()
})

// Import after mocking
import { getInsightAlerts } from '../services/api'

function makeResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    headers: new Headers(),
  } as unknown as Response
}

describe('getInsightAlerts', () => {
  it('returns insight_configured: false when integration is not set up', async () => {
    mockFetch.mockResolvedValue(makeResponse(200, { insight_configured: false }))

    const result = await getInsightAlerts('CNNCQ520HG')

    expect(result.insight_configured).toBe(false)
    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url] = mockFetch.mock.calls[0] as [string]
    expect(url).toContain('/insight/devices/CNNCQ520HG/alerts')
  })

  it('sends GET with x-api-key header', async () => {
    mockFetch.mockResolvedValue(
      makeResponse(200, {
        insight_configured: true,
        serial: 'CNNCQ520HG',
        device_id: 142699,
        model: 'LaserJet Managed E60175dn',
        zone: 'ZUC Quilmes',
        current: [],
        history: [],
      })
    )

    const result = await getInsightAlerts('CNNCQ520HG')

    expect(result.insight_configured).toBe(true)
    expect(result.serial).toBe('CNNCQ520HG')
    expect(result.device_id).toBe(142699)
    expect(Array.isArray(result.current)).toBe(true)
    expect(Array.isArray(result.history)).toBe(true)

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect((options.headers as Record<string, string>)['x-api-key']).toBeDefined()
    expect(options.method).toBe('GET')
  })

  it('returns alerts when portal responds with data', async () => {
    const mockAlert = {
      deviceId: 142699,
      date: '2026-04-11T15:42:36.000Z',
      engineCycles: 256799,
      trainingLevel: 3,
      severityLevel: 3,
      alertClass: 'SYSTEM_WARNING',
      mibCode: 22,
      description: 'En pausa',
      cleared: '2026-04-11T16:12:26.000Z',
    }
    mockFetch.mockResolvedValue(
      makeResponse(200, {
        insight_configured: true,
        serial: 'CNNCQ520HG',
        device_id: 142699,
        model: null,
        zone: null,
        current: [],
        history: [mockAlert],
      })
    )

    const result = await getInsightAlerts('CNNCQ520HG')

    expect(result.history).toHaveLength(1)
    expect(result.history![0].alertClass).toBe('SYSTEM_WARNING')
    expect(result.history![0].description).toBe('En pausa')
  })

  it('encodes special characters in serial number', async () => {
    mockFetch.mockResolvedValue(makeResponse(200, { insight_configured: false }))

    await getInsightAlerts('SN WITH SPACE')

    const [url] = mockFetch.mock.calls[0] as [string]
    expect(url).toContain('SN%20WITH%20SPACE')
  })

  it('throws on non-2xx response', async () => {
    mockFetch.mockResolvedValue(makeResponse(502, { detail: 'Portal connection failed' }))

    await expect(getInsightAlerts('CNNCQ520HG')).rejects.toThrow('Portal connection failed')
  })

  it('throws on 401 unauthorized', async () => {
    mockFetch.mockResolvedValue(makeResponse(401, { detail: 'Unauthorized' }))

    await expect(getInsightAlerts('CNNCQ520HG')).rejects.toThrow()
  })
})
