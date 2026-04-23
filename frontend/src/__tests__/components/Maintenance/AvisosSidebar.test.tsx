
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { AvisosSidebar } from '../../../components/Maintenance/AvisosSidebar'

describe('AvisosSidebar', () => {
  const mockGroupedDevices = {
    'Family A': [
      { serial: 'SERIAL-A1', last_sync_counter: 1000, model_family: 'Family A', is_active: true },
      { serial: 'SERIAL-A2', last_sync_counter: 2000, model_family: 'Family A', is_active: true },
    ],
    'Family B': [
      { serial: 'SERIAL-B1', last_sync_counter: 3000, model_family: 'Family B', is_active: true },
    ],
  }

  const mockHandlers = {
    onSelectFamily: vi.fn(),
    onSelectDevice: vi.fn(),
    onNewFamily: vi.fn(),
  }

  it('renders family names and device counts', () => {
    render(
      <AvisosSidebar 
        groupedDevices={mockGroupedDevices} 
        allFamilies={Object.keys(mockGroupedDevices)}
        selectedFamily={null} 
        selectedDevice={null} 
        loading={false} 
        {...mockHandlers} 
      />
    )

    expect(screen.getByText('Family A')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument() // Count for A
    expect(screen.getByText('Family B')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument() // Count for B
  })

  it('expands a family to show devices when clicked', () => {
    render(
      <AvisosSidebar 
        groupedDevices={mockGroupedDevices} 
        allFamilies={Object.keys(mockGroupedDevices)}
        selectedFamily={null} 
        selectedDevice={null} 
        loading={false} 
        {...mockHandlers} 
      />
    )

    const familyA = screen.getByText('Family A')
    fireEvent.click(familyA)

    expect(screen.getByText('SERIAL-A1')).toBeInTheDocument()
    expect(screen.getByText('SERIAL-A2')).toBeInTheDocument()
  })

  it('filters families and devices by search term', () => {
    render(
      <AvisosSidebar 
        groupedDevices={mockGroupedDevices} 
        allFamilies={Object.keys(mockGroupedDevices)}
        selectedFamily={null} 
        selectedDevice={null} 
        loading={false} 
        {...mockHandlers} 
      />
    )

    const searchInput = screen.getByPlaceholderText('Buscar familia o serie...')
    fireEvent.change(searchInput, { target: { value: 'B1' } })

    expect(screen.queryByText('Family A')).not.toBeInTheDocument()
    expect(screen.getByText('Family B')).toBeInTheDocument()
    expect(screen.getByText('SERIAL-B1')).toBeInTheDocument()
  })

  it('calls onSelectDevice when a device is clicked', () => {
    render(
      <AvisosSidebar 
        groupedDevices={mockGroupedDevices} 
        allFamilies={Object.keys(mockGroupedDevices)}
        selectedFamily={null} 
        selectedDevice={null} 
        loading={false} 
        {...mockHandlers} 
      />
    )

    // Expand Family A
    fireEvent.click(screen.getByText('Family A'))
    
    // Click Device A1
    const deviceA1 = screen.getByText('SERIAL-A1')
    fireEvent.click(deviceA1)

    expect(mockHandlers.onSelectDevice).toHaveBeenCalledWith(mockGroupedDevices['Family A'][0])
  })

  it('calls onNewFamily when the plus button is clicked', () => {
    render(
      <AvisosSidebar 
        groupedDevices={mockGroupedDevices} 
        allFamilies={Object.keys(mockGroupedDevices)}
        selectedFamily={null} 
        selectedDevice={null} 
        loading={false} 
        {...mockHandlers} 
      />
    )

    const plusBtn = screen.getByTitle('Nueva Familia')
    fireEvent.click(plusBtn)

    expect(mockHandlers.onNewFamily).toHaveBeenCalled()
  })
})
