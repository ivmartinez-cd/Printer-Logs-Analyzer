
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MonitorWizard } from '../../components/Monitor/MonitorWizard'
import * as api from '../../services/api'
import { useUIStore } from '../../store/useUIStore'
import { useAnalysisStore } from '../../store/useAnalysisStore'
import type { FleetClientDetail, FleetClientSummary } from '../../types/api'

// Mock APIs
vi.mock('../../services/api', () => ({
  listFleetClients: vi.fn(),
  getFleetClient: vi.fn(),
}))

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback) => {
  callback(0)
  return 0
}

describe('MonitorWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Open the wizard in the store
    useUIStore.getState().setMonitorWizardOpen(true)
  })

  it('renders client selection step and lists clients', async () => {
    const mockClients: FleetClientSummary[] = [
      { id: '1', name: 'Client A', device_count: 5 },
      { id: '2', name: 'Client B', device_count: 10 },
    ]
    vi.mocked(api.listFleetClients).mockResolvedValue(mockClients)

    render(<MonitorWizard />)

    await waitFor(() => {
      expect(screen.getByText('Client A')).toBeInTheDocument()
      expect(screen.getByText('Client B')).toBeInTheDocument()
    })
  })

  it('navigates to model selection after selecting a client', async () => {
    const mockClients: FleetClientSummary[] = [{ id: '1', name: 'Client A', device_count: 5 }]
    const mockClientDetail: FleetClientDetail = {
      id: '1',
      name: 'Client A',
      devices: [
        { serial: 'S1', location: 'Office', model: 'Model X' },
        { serial: 'S2', location: 'Lab', model: 'Model Y' },
      ],
    }
    
    vi.mocked(api.listFleetClients).mockResolvedValue(mockClients)
    vi.mocked(api.getFleetClient).mockResolvedValue(mockClientDetail)

    render(<MonitorWizard />)

    await waitFor(() => screen.getByText('Client A'))
    
    fireEvent.click(screen.getByText('Client A'))
    fireEvent.click(screen.getByText('Siguiente'))

    await waitFor(() => {
      expect(screen.getByText('2. Seleccionar Modelos')).toBeInTheDocument()
      expect(screen.getByText('Model X')).toBeInTheDocument()
      expect(screen.getByText('Model Y')).toBeInTheDocument()
    })
  })

  it('completes the wizard and updates the analysis store', async () => {
    const mockClients: FleetClientSummary[] = [{ id: '1', name: 'Client A', device_count: 1 }]
    const mockClientDetail: FleetClientDetail = {
      id: '1',
      name: 'Client A',
      devices: [{ serial: 'S1', location: 'Office', model: 'Model X' }],
    }
    
    vi.mocked(api.listFleetClients).mockResolvedValue(mockClients)
    vi.mocked(api.getFleetClient).mockResolvedValue(mockClientDetail)

    const setMonitorClientId = vi.spyOn(useAnalysisStore.getState(), 'setMonitorClientId')
    const setMonitorModels = vi.spyOn(useAnalysisStore.getState(), 'setMonitorModels')

    render(<MonitorWizard />)

    await waitFor(() => screen.getByText('Client A'))
    fireEvent.click(screen.getByText('Client A'))
    fireEvent.click(screen.getByText('Siguiente'))

    await waitFor(() => screen.getByText('Model X'))
    fireEvent.click(screen.getByText('🚀 Iniciar Monitoreo'))

    expect(setMonitorClientId).toHaveBeenCalledWith('1')
    expect(setMonitorModels).toHaveBeenCalledWith(['Model X'])
    expect(useUIStore.getState().monitorWizardOpen).toBe(false)
  })
})
