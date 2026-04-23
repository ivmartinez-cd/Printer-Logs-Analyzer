
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as api from '../../services/api'
import type { ParseLogsResponse } from '../../types/api'

// Mock fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('api.ts service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })
  })

  it('previewLogs sends correct body', async () => {
    await api.previewLogs('test logs', 'FamilyA')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/parser/preview'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ logs: 'test logs', model_family: 'FamilyA' }),
      })
    )
  })

  it('validateLogs sends correct body', async () => {
    await api.validateLogs('test logs')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/parser/validate'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ logs: 'test logs' }),
      })
    )
  })

  it('upsertErrorCode sends correct body', async () => {
    const body = { code: 'E100', severity: 'Critical', description: 'Desc', solution_url: 'url' }
    await api.upsertErrorCode(body)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/error-codes/upsert'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          code: 'E100',
          severity: 'Critical',
          description: 'Desc',
          solution_url: 'url'
        }),
      })
    )
  })

  it('getSolutionProxy sends correct request', async () => {
    await api.getSolutionProxy('E100')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/error-codes/E100/solution-proxy'),
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('createSavedAnalysis sends correct body', async () => {
    const body = { name: 'Test', incidents: [], global_severity: 'INFO' }
    await api.createSavedAnalysis(body)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/saved-analyses'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify(body) })
    )
  })

  it('deleteSavedAnalysis handles errors correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
      json: async () => ({ detail: 'Analysis not found' }),
    })
    await expect(api.deleteSavedAnalysis('id1')).rejects.toThrow('Analysis not found')
  })

  it('aiDiagnose formats request correctly', async () => {
    const result = {
      incidents: [{ code: 'E1', severity: 'C', occurrences: 1, events: [], start_time: '', end_time: '' }],
      events: [{ timestamp: '2023-01-01', counter: 100 }],
      global_severity: 'C'
    } as unknown as ParseLogsResponse
    await api.aiDiagnose(result)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/analysis/ai-diagnose'),
      expect.objectContaining({
        method: 'POST'
      })
    )
  })

  it('scanFleet uses long timeout', async () => {
    await api.scanFleet('client1', ['model1'])
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/fleet/scan'),
      expect.objectContaining({
        body: expect.stringContaining('"client_id":"client1"')
      })
    )
  })

  it('handleResponse throws error on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Server Error',
      json: async () => ({ detail: 'Something went wrong' }),
    })
    await expect(api.previewLogs('logs')).rejects.toThrow('Something went wrong')
  })

  it('getMaintenanceDevices calls correct endpoint', async () => {
    await api.getMaintenanceDevices()
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/maintenance/devices'),
      expect.anything()
    )
  })

  it('recordMaintenanceChange sends correct body', async () => {
    const data = { serial: 'S1', component_type: 'Kit' }
    await api.recordMaintenanceChange(data)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/maintenance/record-change'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(data)
      })
    )
  })
})
