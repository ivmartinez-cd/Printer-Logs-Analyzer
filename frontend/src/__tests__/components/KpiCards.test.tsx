// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { KPICards } from '../../components/KPICards'
import { mockEvent, mockIncidents, mockEvents } from '../fixtures/events'

afterEach(cleanup)

describe('KPICards', () => {
  it('renderiza los 4 KPIs con eventos mixtos', () => {
    render(
      <KPICards
        filteredIncidents={mockIncidents}
        filteredEvents={mockEvents}
        lastErrorEvent={mockEvents[0]}
        lastErrorLabel="14/3/2024 10:00"
      />
    )
    expect(screen.getByText('Estado de errores')).toBeInTheDocument()
    expect(screen.getByText('Incidencias Activas')).toBeInTheDocument()
    expect(screen.getByText('Último error crítico')).toBeInTheDocument()
    expect(screen.getByText('Tasa de errores')).toBeInTheDocument()
    // 1 ERROR, 1 WARNING, 1 INFO entre los mockIncidents
    expect(screen.getByTestId('kpi-error-count').textContent).toBe('1')
  })

  it('muestra "Sin errores" cuando no hay eventos ERROR', () => {
    const warningEvent = mockEvent({ type: 'WARNING', code_severity: 'WARNING' })
    const infoIncident = mockIncidents[2]
    render(
      <KPICards
        filteredIncidents={[infoIncident]}
        filteredEvents={[warningEvent, warningEvent]}
        lastErrorEvent={null}
        lastErrorLabel={null}
      />
    )
    expect(screen.getByText('Sin errores')).toBeInTheDocument()
  })

  it('muestra el código y timestamp del último error crítico', () => {
    const errorEvent = mockEvent({ code: '53.B0.02', timestamp: '2024-03-14T10:00:00' })
    render(
      <KPICards
        filteredIncidents={[mockIncidents[0]]}
        filteredEvents={[errorEvent]}
        lastErrorEvent={errorEvent}
        lastErrorLabel="14/3/2024 10:00"
      />
    )
    expect(screen.getByTestId('kpi-last-error-code').textContent).toBe('53.B0.02')
    expect(screen.getByText(/14\/3\/2024 10:00/)).toBeInTheDocument()
  })

  it('muestra el conteo correcto de incidencias activas', () => {
    const fiveIncidents = Array.from({ length: 5 }, (_, i) => ({
      ...mockIncidents[0],
      id: `inc-${i}`,
      code: `53.B0.0${i}`,
    }))
    render(
      <KPICards
        filteredIncidents={fiveIncidents}
        filteredEvents={[]}
        lastErrorEvent={null}
        lastErrorLabel={null}
      />
    )
    // KPI "Incidencias Activas" muestra el total de incidentes
    expect(screen.getByTestId('kpi-active-incidents').textContent).toBe('5')
  })

  it('no crashea con arrays vacíos', () => {
    render(
      <KPICards
        filteredIncidents={[]}
        filteredEvents={[]}
        lastErrorEvent={null}
        lastErrorLabel={null}
      />
    )
    expect(screen.getByText('Estado de errores')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
