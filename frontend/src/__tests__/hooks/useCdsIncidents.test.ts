import { renderHook, waitFor } from '@testing-library/react'
import { useCdsIncidents } from '../../hooks/useCdsIncidents'
import { getCdsIncidents } from '../../services/api'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../services/api', () => ({
  getCdsIncidents: vi.fn(),
}))

describe('useCdsIncidents', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return empty list and loading=false when serial is null', () => {
    const { result } = renderHook(() => useCdsIncidents(null))
    expect(result.current.data).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should fetch incidents and set data when serial is provided', async () => {
    const mockIncidents = [
      {
        id: 'inc-1',
        numero_incidente: '123456',
        fecha: '09/06/2026 10:00:00',
        motivo: 'Fallo fusor',
        estado: 'Cerrado',
        contador: '100000',
        repuestos: [{ articulo: 'Fusor', cantidad: 1 }]
      }
    ]
    vi.mocked(getCdsIncidents).mockResolvedValue(mockIncidents)

    const { result } = renderHook(() => useCdsIncidents('BRBSN9YYK7'))

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toEqual(mockIncidents)
    expect(result.current.error).toBeNull()
    expect(getCdsIncidents).toHaveBeenCalledWith('BRBSN9YYK7', expect.any(AbortSignal))
  })

  it('should handle errors during fetch', async () => {
    vi.mocked(getCdsIncidents).mockRejectedValue(new Error('Connection failed'))

    const { result } = renderHook(() => useCdsIncidents('BRBSN9YYK7'))

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toEqual([])
    expect(result.current.error).toBe('Connection failed')
  })
})
