// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SDSIncidentPanel } from '../../components/SDSIncidentPanel'

const mockSdsIncident = {
  code: '60.00.02',
  more_info: '60.00.02 or 60.01.02',
  event_context: '60.00.02',
  severity: 'Critical',
  created_at: '2026-03-01T10:00:00Z',
  firmware: '1.0',
  impressions: '1000',
}

const mockIncidentRows = [
  { code: '60.00.02', classification: 'Tray 2 pick roller' }
]

const mockIncidentsFull = [
  { code: '60.00.02', end_time: '2026-03-05T10:00:00Z', occurrences: 3, classification: 'Tray 2 pick roller' }
]

describe('SDSIncidentPanel', () => {
  const getHeaderButton = () => screen.getByTestId('sds-incidents-panel-toggle')

  it('se renderiza colapsado por defecto', () => {
    render(<SDSIncidentPanel sdsIncident={mockSdsIncident} incidentRows={mockIncidentRows} />)
    expect(getHeaderButton()).toBeInTheDocument()
    expect(screen.queryByText('Campo')).not.toBeInTheDocument()
  })

  it('se expande al hacer click en el header', () => {
    render(<SDSIncidentPanel sdsIncident={mockSdsIncident} incidentRows={mockIncidentRows} />)
    fireEvent.click(getHeaderButton())
    expect(screen.getByText('Código')).toBeInTheDocument()
    // 60.00.02 aparece múltiples veces (Código y Contexto evento)
    expect(screen.getAllByText('60.00.02').length).toBeGreaterThanOrEqual(1)
  })

  it('muestra "✔ Coincide" cuando el código está en el log', () => {
    render(
      <SDSIncidentPanel 
        sdsIncident={mockSdsIncident} 
        incidentRows={mockIncidentRows} 
        incidentsFull={mockIncidentsFull} 
      />
    )
    fireEvent.click(getHeaderButton())
    expect(screen.getByText('✔ Coincide')).toBeInTheDocument()
    expect(screen.getAllByText(/3 eventos detectados/).length).toBeGreaterThanOrEqual(1)
  })

  it('muestra "❌ No coincide" cuando el código no está en el log', () => {
    render(
      <SDSIncidentPanel 
        sdsIncident={mockSdsIncident} 
        incidentRows={[]} 
        incidentsFull={[]} 
      />
    )
    fireEvent.click(getHeaderButton())
    expect(screen.getByText('❌ No coincide')).toBeInTheDocument()
  })
})
