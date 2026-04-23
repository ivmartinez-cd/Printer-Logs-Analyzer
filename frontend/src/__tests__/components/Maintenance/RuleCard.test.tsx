
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { RuleCard } from '../../../components/Maintenance/RuleCard'

describe('RuleCard', () => {
  const mockRule = {
    id: 1,
    model_family: 'Family 1',
    component_type: 'Fuser',
    expected_life: 100000,
    alert_margin: 10000,
    email_recipients: null
  }

  const mockDevice = {
    serial: 'SERIAL1',
    model_family: 'Family 1',
    last_sync_counter: 95000,
    is_active: true
  }

  const mockHandlers = {
    onEditRule: vi.fn(),
    onAdjustState: vi.fn(),
    onRecordChange: vi.fn(),
    onOpenIncident: vi.fn(),
    onCloseIncident: vi.fn(),
    onSendAlert: vi.fn(),
  }

  it('renders correctly in OK state', () => {
    const mockState = { last_change_counter: 0 }
    render(
      <RuleCard 
        rule={mockRule} 
        selectedDevice={{ ...mockDevice, last_sync_counter: 10000 }} 
        state={mockState as any}
        {...mockHandlers} 
      />
    )

    expect(screen.getByText(/90.*000/i)).toBeInTheDocument()
    expect(screen.getByText(/restantes/i)).toBeInTheDocument()
  })

  it('renders correctly in Warning state', () => {
    const mockState = { last_change_counter: 0 }
    render(
      <RuleCard 
        rule={mockRule} 
        selectedDevice={{ ...mockDevice, last_sync_counter: 95000 }} 
        state={mockState as any}
        {...mockHandlers} 
      />
    )

    expect(screen.getByText(/Atención/i)).toBeInTheDocument()
    expect(screen.getByText(/5.*000/i)).toBeInTheDocument()
    expect(screen.getByText(/restantes/i)).toBeInTheDocument()
  })

  it('renders correctly in Critical state', () => {
    const mockState = { last_change_counter: 0 }
    render(
      <RuleCard 
        rule={mockRule} 
        selectedDevice={{ ...mockDevice, last_sync_counter: 105000 }} 
        state={mockState as any}
        {...mockHandlers} 
      />
    )

    expect(screen.getByText(/CRÍTICO/i)).toBeInTheDocument()
  })

  it('calls onEditRule when edit button is clicked', () => {
    render(<RuleCard rule={mockRule} selectedDevice={null} {...mockHandlers} />)
    fireEvent.click(screen.getByTitle('Editar Regla'))
    expect(mockHandlers.onEditRule).toHaveBeenCalledWith(mockRule)
  })

  it('renders incident status when incident is provided', () => {
    const mockIncident = {
      id: '123',
      device_serial: 'SERIAL1',
      component_type: 'Fuser',
      incident_number: 'INC-001',
      status: 'open'
    }
    render(
      <RuleCard 
        rule={mockRule} 
        selectedDevice={mockDevice} 
        incident={mockIncident as any} 
        {...mockHandlers} 
      />
    )

    expect(screen.getByText('INCIDENTE: INC-001')).toBeInTheDocument()
  })
})
