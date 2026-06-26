
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
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
  getMaintenanceFamilies: vi.fn(),
  getDeviceIncidents: vi.fn(),
  deleteFamily: vi.fn(),
  renameFamily: vi.fn(),
  discoverFamily: vi.fn(),
  triggerMaintenanceCheck: vi.fn(),
  getMaintenanceSyncStatus: vi.fn(),
  upsertMaintenanceModelRule: vi.fn(),
  clearFamilyDevices: vi.fn(),
  recordMaintenanceChange: vi.fn(),
  updateDeviceState: vi.fn(),
  openMaintenanceIncident: vi.fn(),
  closeMaintenanceIncident: vi.fn(),
  sendMaintenanceAlert: vi.fn(),
  getMaintenanceDevicesStatus: vi.fn(),
}))

async function switchToDevicesTab() {
  const devicesTab = screen.getByText('Modelos y Equipos')
  fireEvent.click(devicesTab)
}

describe('AvisosPage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default mocks to avoid crashes
    vi.mocked(api.getMaintenanceDevices).mockResolvedValue([])
    vi.mocked(api.getMaintenanceFamilies).mockResolvedValue([])
    vi.mocked(api.getDeviceIncidents).mockResolvedValue([])
    vi.mocked(api.getMaintenanceDevicesStatus).mockResolvedValue([])
  })

  it('renders the empty state when no family is selected', async () => {
    render(
      <ToastProvider>
        <AvisosPage />
      </ToastProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Avisos de Mantenimiento')).toBeInTheDocument()
    })

    switchToDevicesTab()

    await waitFor(() => {
      expect(screen.getByText('Selecciona una familia o equipo')).toBeInTheDocument()
    })
  })

  it('loads and displays families in the sidebar', async () => {
    vi.mocked(api.getMaintenanceFamilies).mockResolvedValue(['Family 1'])

    render(
      <ToastProvider>
        <AvisosPage />
      </ToastProvider>
    )

    switchToDevicesTab()

    await waitFor(() => {
      expect(screen.getByText('Family 1')).toBeInTheDocument()
    })
  })

  it('opens rename modal and calls renameFamily API', async () => {
    vi.mocked(api.getMaintenanceFamilies).mockResolvedValue(['Family 1'])
    vi.mocked(api.getMaintenanceModelRules).mockResolvedValue([])

    render(
      <ToastProvider>
        <AvisosPage />
      </ToastProvider>
    )

    switchToDevicesTab()

    const familyBtn = await screen.findByText('Family 1')
    fireEvent.click(familyBtn)

    const editBtn = await screen.findByTitle('Renombrar Familia')
    fireEvent.click(editBtn)

    expect(await screen.findByText(/Renombrar Familia/i)).toBeInTheDocument()

    const input = screen.getByDisplayValue('Family 1')
    fireEvent.change(input, { target: { value: 'New Name' } })
    fireEvent.click(screen.getByText('Guardar Cambios'))

    await waitFor(() => {
      expect(api.renameFamily).toHaveBeenCalledWith('Family 1', 'New Name')
    })
  })

  it('opens delete modal and calls deleteFamily API', async () => {
    vi.mocked(api.getMaintenanceFamilies).mockResolvedValue(['Family 1'])
    vi.mocked(api.getMaintenanceModelRules).mockResolvedValue([])

    render(
      <ToastProvider>
        <AvisosPage />
      </ToastProvider>
    )

    switchToDevicesTab()

    const familyBtn = await screen.findByText('Family 1')
    fireEvent.click(familyBtn)

    const deleteBtn = await screen.findByTitle('Eliminar Familia')
    fireEvent.click(deleteBtn)

    expect(await screen.findByText(/Eliminar Familia/i)).toBeInTheDocument()

    fireEvent.click(screen.getByText('Sí, Eliminar Todo'))

    await waitFor(() => {
      expect(api.deleteFamily).toHaveBeenCalledWith('Family 1')
    })
  })

  it('calls discoverFamily API when discovery is triggered', async () => {
    vi.mocked(api.getMaintenanceFamilies).mockResolvedValue(['Family 1'])
    render(
      <ToastProvider>
        <AvisosPage />
      </ToastProvider>
    )

    switchToDevicesTab()

    const familyBtn = await screen.findByText('Family 1')
    fireEvent.click(familyBtn)

    const discoverBtn = await screen.findByText(/Buscar Equipos en SDS/i)
    fireEvent.click(discoverBtn)

    await waitFor(() => {
      expect(api.discoverFamily).toHaveBeenCalledWith('Family 1')
    })
  })

  it('calls triggerMaintenanceCheck when sync is triggered', async () => {
    vi.mocked(api.getMaintenanceFamilies).mockResolvedValue(['Family 1'])
    vi.mocked(api.getMaintenanceDevices).mockResolvedValue([
      { serial: 'SN001', model_family: 'Family 1', last_sync_counter: 0, is_active: true }
    ])
    vi.mocked(api.triggerMaintenanceCheck).mockResolvedValue({ job_id: 'job-123', total: 1, status: 'pending' })
    vi.mocked(api.getMaintenanceSyncStatus).mockResolvedValue({ status: 'completed', processed: 1, total: 1, errors: 0 })
    vi.mocked(api.getMaintenanceModelRules).mockResolvedValue([])

    render(
      <ToastProvider>
        <AvisosPage />
      </ToastProvider>
    )

    switchToDevicesTab()

    const familyBtn = await screen.findByText('Family 1')
    fireEvent.click(familyBtn)

    const syncBtn = await screen.findByText(/Sincronización Silenciosa/i)
    fireEvent.click(syncBtn)

    await waitFor(() => {
      expect(api.triggerMaintenanceCheck).toHaveBeenCalledWith('Family 1', false)
    })
  })

  it('calls clearFamilyDevices when clear is triggered', async () => {
    vi.mocked(api.getMaintenanceFamilies).mockResolvedValue(['Family 1'])
    window.confirm = vi.fn().mockReturnValue(true)

    render(
      <ToastProvider>
        <AvisosPage />
      </ToastProvider>
    )

    switchToDevicesTab()

    const familyBtn = await screen.findByText('Family 1')
    fireEvent.click(familyBtn)

    const clearBtn = await screen.findByText(/Limpiar Equipos/i)
    fireEvent.click(clearBtn)

    await waitFor(() => {
      expect(api.clearFamilyDevices).toHaveBeenCalledWith('Family 1')
    })
  })
})
