
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AvisosPage } from '../../pages/AvisosPage'
import * as api from '../../services/api'
import { ToastProvider } from '../../contexts/ToastContext'

// Mock the API services
vi.mock('../../services/api', () => ({
  getMaintenanceDevices: vi.fn(),
  getMaintenanceModelRules: vi.fn(),
  getMaintenanceDeviceState: vi.fn(),
  getMaintenanceHistory: vi.fn(),
  syncMaintenanceDevice: vi.fn(),
}))

describe('AvisosPage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the empty state when no family is selected', async () => {
    // @ts-ignore
    api.getMaintenanceDevices.mockResolvedValue([])

    render(
      <ToastProvider>
        <AvisosPage onBack={vi.fn()} />
      </ToastProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Avisos de Mantenimiento')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Selecciona una familia o equipo')).toBeInTheDocument()
  })

  it('loads and displays devices in the sidebar', async () => {
    const mockDevices = [
      { serial: 'SERIAL-1', model_family: 'Family 1', last_sync_counter: 1000 },
      { serial: 'SERIAL-2', model_family: 'Family 1', last_sync_counter: 2000 },
    ]
    // @ts-ignore
    api.getMaintenanceDevices.mockResolvedValue(mockDevices)

    render(
      <ToastProvider>
        <AvisosPage onBack={vi.fn()} />
      </ToastProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Family 1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument() // Count
    })
  })

  it('loads family rules when a family is selected', async () => {
    const mockDevices = [{ serial: 'S1', model_family: 'Family 1', last_sync_counter: 1000 }]
    const mockRules = [{ id: 1, family: 'Family 1', part_name: 'Roller', interval_pages: 100000 }]
    
    // @ts-ignore
    api.getMaintenanceDevices.mockResolvedValue(mockDevices)
    // @ts-ignore
    api.getMaintenanceModelRules.mockResolvedValue(mockRules)

    render(
      <ToastProvider>
        <AvisosPage onBack={vi.fn()} />
      </ToastProvider>
    )

    // Wait for sidebar to load
    const familyElement = await screen.findByText('Family 1')
    familyElement.click()

    await waitFor(() => {
      expect(api.getMaintenanceModelRules).toHaveBeenCalledWith('Family 1')
    })
  })
})
