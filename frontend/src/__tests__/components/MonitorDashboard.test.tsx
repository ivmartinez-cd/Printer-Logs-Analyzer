
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MonitorDashboard } from '../../components/Monitor/MonitorDashboard'
import * as api from '../../services/api'
import { useAnalysisStore } from '../../store/useAnalysisStore'

// Mock Recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  AreaChart: () => <div data-testid="area-chart" />,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}))

// Mock APIs
vi.mock('../../services/api', () => ({
  getFleetClient: vi.fn(),
  triggerFleetScan: vi.fn(),
  getFleetScanStatus: vi.fn(),
}))

describe('MonitorDashboard', () => {
  const mockClient = {
    id: 'client-1',
    name: 'Test Client',
    devices: [
      { serial: 'S1', location: 'Office', model: 'M1' },
      { serial: 'S2', location: 'Lab', model: 'M2' },
    ]
  }

  const mockScanResults = [
    {
      serial: 'S1',
      status: 'ok',
      error_count: 0,
      warning_count: 0,
      black_toner_percent: 80,
      fuser_life_percent: 90,
      location: 'Office',
      top_errors: [{ code: '10.00.00', count: 1 }],
      timeline_data: [{ date: '2026-04-22', errors: 1, warnings: 0 }]
    },
    {
      serial: 'S2',
      status: 'critical',
      error_count: 5,
      warning_count: 2,
      black_toner_percent: 5,
      fuser_life_percent: 10,
      location: 'Lab',
      top_errors: [{ code: '11.00.00', count: 5 }],
      timeline_data: [{ date: '2026-04-22', errors: 5, warnings: 2 }]
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    useAnalysisStore.setState({
      monitorClientId: 'client-1',
      monitorModels: []
    })
    // @ts-ignore
    api.getFleetClient.mockResolvedValue(mockClient)
  })

  it('renders initial state with devices as unreachable', async () => {
    render(<MonitorDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Test Client')).toBeInTheDocument()
      expect(screen.getByText('S1')).toBeInTheDocument()
    })

    const statusLabels = screen.getAllByText('Sin contacto')
    expect(statusLabels.length).toBeGreaterThanOrEqual(2)
  })

  it('updates dashboard after scanning fleet', async () => {
    // @ts-ignore
    api.triggerFleetScan.mockResolvedValue({ job_id: 'job-123', total: 2, status: 'running' })
    // @ts-ignore
    api.getFleetScanStatus.mockResolvedValue({ 
      processed: 2, 
      total: 2, 
      status: 'completed', 
      results: mockScanResults 
    })

    render(<MonitorDashboard pollingInterval={10} />)
    await waitFor(() => screen.getByText('S1'))
    
    fireEvent.click(screen.getByText('🔄 Sincronizar Todo'))

    await waitFor(() => {
      expect(screen.getByText('Saludable')).toBeInTheDocument()
      expect(screen.getByText('Crítico')).toBeInTheDocument()
    })
  })

  it('filters devices when clicking on KPI cards', async () => {
    // @ts-ignore
    api.triggerFleetScan.mockResolvedValue({ job_id: 'job-123', total: 2, status: 'running' })
    // @ts-ignore
    api.getFleetScanStatus.mockResolvedValue({ 
      processed: 2, 
      total: 2, 
      status: 'completed', 
      results: mockScanResults 
    })

    render(<MonitorDashboard pollingInterval={10} />)
    await waitFor(() => screen.getByText('S1'))
    
    fireEvent.click(screen.getByText('🔄 Sincronizar Todo'))
    await waitFor(() => screen.getByText('Crítico'))

    const criticalCard = screen.getByText('Críticos').closest('button')!
    fireEvent.click(criticalCard)

    expect(screen.queryByText('S1')).not.toBeInTheDocument()
    expect(screen.getByText('S2')).toBeInTheDocument()
  })

  it('expands device row on click', async () => {
    // @ts-ignore
    api.triggerFleetScan.mockResolvedValue({ job_id: 'job-123', total: 2, status: 'running' })
    // @ts-ignore
    api.getFleetScanStatus.mockResolvedValue({ 
      processed: 2, 
      total: 2, 
      status: 'completed', 
      results: mockScanResults 
    })

    render(<MonitorDashboard pollingInterval={10} />)
    await waitFor(() => screen.getByText('S1'))
    
    fireEvent.click(screen.getByText('🔄 Sincronizar Todo'))
    
    // Wait for the scan to finish by checking for the new status
    await waitFor(() => screen.getByText('Saludable'))

    // Now expand
    fireEvent.click(screen.getByText('Office'))

    await waitFor(() => {
       expect(screen.getByText(/análisis completo/i)).toBeInTheDocument()
    }, { timeout: 2000 })
  })
})
