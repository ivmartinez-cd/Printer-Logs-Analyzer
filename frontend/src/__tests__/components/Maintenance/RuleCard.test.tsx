
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { RuleCard } from '../../../components/Maintenance/RuleCard'

describe('RuleCard', () => {
  const mockRule = {
    component_type: 'Fuser',
    expected_life: 100000,
    alert_margin: 10000,
  }

  const mockState = {
    last_change_counter: 50000,
  }

  const mockDevice = {
    serial: 'BRBSSD80CX',
    last_sync_counter: 140000, // 50k (last) + 100k (life) = 150k limit. 140k means 10k left.
  }

  const mockHandlers = {
    onEditRule: vi.fn(),
    onAdjustState: vi.fn(),
    onRecordChange: vi.fn(),
  }

  it('renders rule details correctly', () => {
    render(
      <RuleCard 
        rule={mockRule} 
        state={mockState} 
        selectedDevice={mockDevice} 
        {...mockHandlers} 
      />
    )

    expect(screen.getByText('Fuser')).toBeInTheDocument()
    expect(screen.getByText(new RegExp((100000).toLocaleString() + ' págs.'))).toBeInTheDocument()
    expect(screen.getByText(new RegExp((10000).toLocaleString() + ' págs.'))).toBeInTheDocument() // Margin
  })

  it('calculates and displays remaining pages correctly', () => {
    render(
      <RuleCard 
        rule={mockRule} 
        state={mockState} 
        selectedDevice={mockDevice} 
        {...mockHandlers} 
      />
    )

    // Limit is 50k + 100k = 150k. Current is 140k. Remaining = 10k.
    const expectedRemaining = (10000).toLocaleString() + ' páginas restantes'
    expect(screen.getByText(expectedRemaining)).toBeInTheDocument()
  })

  it('shows critical status when remaining pages <= 0', () => {
    const criticalDevice = { ...mockDevice, last_sync_counter: 160000 }
    render(
      <RuleCard 
        rule={mockRule} 
        state={mockState} 
        selectedDevice={criticalDevice} 
        {...mockHandlers} 
      />
    )

    expect(screen.getByText('CRÍTICO')).toBeInTheDocument()
  })

  it('shows warning status when within alert margin', () => {
    const warningDevice = { ...mockDevice, last_sync_counter: 145000 } // 5k remaining, margin is 10k
    render(
      <RuleCard 
        rule={mockRule} 
        state={mockState} 
        selectedDevice={warningDevice} 
        {...mockHandlers} 
      />
    )

    expect(screen.getByText('Atención')).toBeInTheDocument()
  })

  it('calls onRecordChange when clicking the button', () => {
    // OK device (50k remaining, well above 10k margin) — only direct change button shows
    const okDevice = { ...mockDevice, last_sync_counter: 100000 }
    render(
      <RuleCard
        rule={mockRule}
        state={mockState}
        selectedDevice={okDevice}
        {...mockHandlers}
      />
    )

    const button = screen.getByText('🛠️ Registrar Cambio Directo')
    fireEvent.click(button)
    expect(mockHandlers.onRecordChange).toHaveBeenCalledWith(mockRule)
  })

  it('shows edit rule option when no device is selected', () => {
    render(
      <RuleCard 
        rule={mockRule} 
        state={null} 
        selectedDevice={null} 
        {...mockHandlers} 
      />
    )

    const editBtn = screen.getByText('✏️ Editar')
    fireEvent.click(editBtn)
    expect(mockHandlers.onEditRule).toHaveBeenCalledWith(mockRule)
  })
})
