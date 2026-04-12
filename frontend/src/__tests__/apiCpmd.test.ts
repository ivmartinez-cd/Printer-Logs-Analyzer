import { describe, it, expect, vi, afterEach } from 'vitest'

// Mock fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

afterEach(() => {
  mockFetch.mockReset()
})

// Import after mocking
import { uploadCpmd, getErrorSolution } from '../services/api'

function makeResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    headers: new Headers(),
  } as unknown as Response
}

describe('uploadCpmd', () => {
  it('sends multipart POST with x-api-key header', async () => {
    const report = {
      model_id: 'uuid-123',
      cpmd_hash: 'abc',
      total_blocks: 5,
      extracted: 4,
      failed: 1,
      skipped: false,
      reason: null,
    }
    mockFetch.mockResolvedValue(makeResponse(200, report))

    const file = new File([new Uint8Array(10)], 'cpmd.pdf', { type: 'application/pdf' })
    const result = await uploadCpmd('uuid-123', file)

    expect(result).toEqual(report)
    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/models/uuid-123/cpmd')
    expect((options.headers as Record<string, string>)['x-api-key']).toBeDefined()
    expect(options.body).toBeInstanceOf(FormData)
    const fd = options.body as FormData
    expect(fd.get('file')).toBe(file)
  })

  it('throws on non-2xx response', async () => {
    mockFetch.mockResolvedValue(makeResponse(503, { detail: 'API key no configurada' }))

    const file = new File([new Uint8Array(10)], 'cpmd.pdf', { type: 'application/pdf' })
    await expect(uploadCpmd('uuid-123', file)).rejects.toThrow('API key no configurada')
  })

  it('throws a user-friendly message on 502 (Render free-plan timeout)', async () => {
    mockFetch.mockResolvedValue(makeResponse(502, {}))

    const file = new File([new Uint8Array(10)], 'cpmd.pdf', { type: 'application/pdf' })
    await expect(uploadCpmd('uuid-123', file)).rejects.toThrow(
      'El servidor cortó la conexión antes de terminar de procesar el CPMD.'
    )
  })
})

describe('getErrorSolution', () => {
  it('returns solution on 200', async () => {
    const solution = {
      id: 1,
      model_id: 'uuid-123',
      code: '49.FF.09',
      title: 'Formatter error',
      cause: 'Firmware issue',
      technician_steps: ['Step 1'],
      frus: [{ part_number: 'CF234A', description: 'Formatter PCA' }],
      source_audience: 'service',
      source_page: 10,
      cpmd_hash: 'abc',
    }
    mockFetch.mockResolvedValue(makeResponse(200, solution))

    const result = await getErrorSolution('uuid-123', '49.FF.09')
    expect(result).toEqual(solution)
  })

  it('returns null on 404', async () => {
    mockFetch.mockResolvedValue(makeResponse(404, { detail: 'Not found' }))

    const result = await getErrorSolution('uuid-123', '99.XX.XX')
    expect(result).toBeNull()
  })

  it('throws on other errors (e.g. 500)', async () => {
    mockFetch.mockResolvedValue(makeResponse(500, { detail: 'Internal server error' }))

    await expect(getErrorSolution('uuid-123', '49.FF.09')).rejects.toThrow()
  })
})
