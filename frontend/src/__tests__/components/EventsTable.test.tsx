// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EventsTable } from '../../components/EventsTable'
import { mockEvent, mockEvents } from '../fixtures/events'

afterEach(cleanup)

describe('EventsTable', () => {
  it('renderiza el título "Eventos del período"', () => {
    render(<EventsTable events={[]} onViewSolution={vi.fn()} />)
    expect(screen.getByText('Eventos del período')).toBeInTheDocument()
  })

  it('tabla arranca colapsada por defecto', () => {
    render(<EventsTable events={mockEvents} onViewSolution={vi.fn()} />)
    // Colapsada: el código no es visible
    expect(screen.queryByText('53.B0.02')).not.toBeInTheDocument()
  })

  it('toggle colapsar/expandir funciona', async () => {
    const user = userEvent.setup()
    const singleEvent = mockEvent({ code: 'COD-UNICO', timestamp: '2024-03-14T10:00:00' })
    render(<EventsTable events={[singleEvent]} onViewSolution={vi.fn()} />)

    // Inicialmente colapsada — el código no es visible
    expect(screen.queryByText('COD-UNICO')).not.toBeInTheDocument()

    // Click para expandir
    const toggleBtn = screen.getByText('Eventos del período').closest('button')!
    await user.click(toggleBtn)
    expect(screen.getByText('COD-UNICO')).toBeInTheDocument()

    // Click de vuelta para colapsar
    await user.click(toggleBtn)
    expect(screen.queryByText('COD-UNICO')).not.toBeInTheDocument()
  })

  it('filtro por tipo de evento ERROR muestra solo los ERRORs', async () => {
    const user = userEvent.setup()
    const events = [
      mockEvent({ type: 'ERROR', code: 'ERR-001', timestamp: '2024-03-14T10:00:00' }),
      mockEvent({ type: 'WARNING', code: 'WRN-002', timestamp: '2024-03-14T11:00:00' }),
      mockEvent({ type: 'INFO', code: 'INF-003', timestamp: '2024-03-14T12:00:00' }),
    ]
    render(<EventsTable events={events} onViewSolution={vi.fn()} />)

    // Expandir primero
    const toggleBtn = screen.getByText('Eventos del período').closest('button')!
    await user.click(toggleBtn)

    const select = screen.getByLabelText('Filtrar por severidad')
    await user.selectOptions(select, 'ERROR')

    expect(screen.getByText('ERR-001')).toBeInTheDocument()
    expect(screen.queryByText('WRN-002')).not.toBeInTheDocument()
    expect(screen.queryByText('INF-003')).not.toBeInTheDocument()
  })

  it('sort por timestamp cambia el orden de las filas', async () => {
    const user = userEvent.setup()
    const events = [
      mockEvent({ code: 'COD-A', timestamp: '2024-03-14T10:00:00' }),
      mockEvent({ code: 'COD-B', timestamp: '2024-03-14T09:00:00' }),
    ]
    render(<EventsTable events={events} onViewSolution={vi.fn()} />)

    // Expandir primero
    const toggleBtn = screen.getByText('Eventos del período').closest('button')!
    await user.click(toggleBtn)

    // Default es desc — COD-A aparece primero (más reciente)
    const rowsBefore = screen.getAllByRole('row')
    const firstCodeBefore = rowsBefore[1].textContent // row 0 es el header

    // Click en "Fecha/hora" para cambiar a asc
    await user.click(screen.getByText('Fecha/hora'))
    const rowsAfter = screen.getAllByRole('row')
    const firstCodeAfter = rowsAfter[1].textContent

    // El orden debe haber cambiado
    expect(firstCodeBefore).not.toBe(firstCodeAfter)
  })

  it('keys únicas no generan warnings de React por key duplicada', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const events = [
      mockEvent({ code: 'ERR-001', timestamp: '2024-03-14T10:00:00' }),
      mockEvent({ code: 'ERR-002', timestamp: '2024-03-14T11:00:00' }),
    ]
    render(<EventsTable events={events} onViewSolution={vi.fn()} />)

    const keyWarnings = consoleSpy.mock.calls.filter(
      (args) =>
        typeof args[0] === 'string' &&
        (args[0].includes('unique key') || args[0].includes('same key'))
    )
    expect(keyWarnings).toHaveLength(0)
    consoleSpy.mockRestore()
  })
})
