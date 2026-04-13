// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IncidentsTable } from '../../components/IncidentsTable'
import { mockEvent, mockIncidentRow } from '../fixtures/events'

afterEach(cleanup)

const row1 = mockIncidentRow({
  id: 'row-1',
  code: '53.B0.02',
  classification: 'Fuser error',
  severity: 'ERROR',
  severity_weight: 3,
  occurrences: 2,
  start_time: '2024-03-14T10:00:00',
  end_time: '2024-03-14T10:30:00',
  eventsInWindow: [
    mockEvent({ code: '53.B0.02', timestamp: '2024-03-14T10:00:00', counter: 100 }),
    mockEvent({ code: '53.B0.02', timestamp: '2024-03-14T10:30:00', counter: 101 }),
  ],
})

const row2 = mockIncidentRow({
  id: 'row-2',
  code: '49.38.07',
  classification: 'Firmware update recommended',
  severity: 'WARNING',
  severity_weight: 2,
  occurrences: 1,
  start_time: '2024-03-15T09:00:00',
  end_time: '2024-03-15T09:00:00',
  eventsInWindow: [
    mockEvent({
      type: 'WARNING',
      code: '49.38.07',
      code_description: 'Firmware update recommended',
      timestamp: '2024-03-15T09:00:00',
      counter: 200,
    }),
  ],
})

const row3 = mockIncidentRow({
  id: 'row-3',
  code: '10.00.00',
  classification: 'Supply memory',
  severity: 'INFO',
  severity_weight: 1,
  occurrences: 1,
  start_time: '2024-03-16T14:00:00',
  end_time: '2024-03-16T14:00:00',
  eventsInWindow: [
    mockEvent({
      type: 'INFO',
      code: '10.00.00',
      code_description: 'Supply memory',
      timestamp: '2024-03-16T14:00:00',
      counter: 300,
    }),
  ],
})

const threeRows = [row1, row2, row3]

describe('IncidentsTable', () => {
  it('renderiza todos los incidentes pasados como props', () => {
    render(<IncidentsTable incidentRows={threeRows} onEditCode={vi.fn()} onViewSolution={vi.fn()} />)
    expect(screen.getByText('53.B0.02')).toBeInTheDocument()
    expect(screen.getByText('49.38.07')).toBeInTheDocument()
    expect(screen.getByText('10.00.00')).toBeInTheDocument()
  })

  it('filtro por severidad ERROR muestra solo el incidente ERROR', async () => {
    const user = userEvent.setup()
    render(<IncidentsTable incidentRows={threeRows} onEditCode={vi.fn()} onViewSolution={vi.fn()} />)

    await user.selectOptions(screen.getByLabelText('Filtrar por severidad'), 'ERROR')

    expect(screen.getByText('53.B0.02')).toBeInTheDocument()
    expect(screen.queryByText('49.38.07')).not.toBeInTheDocument()
    expect(screen.queryByText('10.00.00')).not.toBeInTheDocument()
  })

  it('búsqueda por código filtra correctamente', async () => {
    const user = userEvent.setup()
    render(<IncidentsTable incidentRows={threeRows} onEditCode={vi.fn()} onViewSolution={vi.fn()} />)

    await user.type(screen.getByLabelText('Buscar en código o clasificación'), '49')

    expect(screen.queryByText('53.B0.02')).not.toBeInTheDocument()
    expect(screen.getByText('49.38.07')).toBeInTheDocument()
    expect(screen.queryByText('10.00.00')).not.toBeInTheDocument()
  })

  it('sort ascendente/descendente por código funciona', async () => {
    const user = userEvent.setup()
    render(<IncidentsTable incidentRows={threeRows} onEditCode={vi.fn()} onViewSolution={vi.fn()} />)

    const codeHeaderBtn = screen.getByRole('button', { name: /Código/ })
    await user.click(codeHeaderBtn)

    // Asc: 10.00.00 primero
    const rowsAsc = screen.getAllByRole('row')
    expect(rowsAsc[1].textContent).toContain('10.00.00')

    await user.click(codeHeaderBtn)
    // Desc: 53.B0.02 primero
    const rowsDesc = screen.getAllByRole('row')
    expect(rowsDesc[1].textContent).toContain('53.B0.02')
  })

  it('click en el botón de código dispara onViewSolution (abre Ver solución)', async () => {
    const onViewSolution = vi.fn()
    const user = userEvent.setup()
    render(
      <IncidentsTable incidentRows={[row1]} onEditCode={vi.fn()} onViewSolution={onViewSolution} />
    )

    await user.click(screen.getByRole('button', { name: '53.B0.02' }))
    expect(onViewSolution).toHaveBeenCalledWith('53.B0.02', null, null)
  })

  it('click en "Ver solución" dispara onViewSolution con el contenido correcto', async () => {
    const onViewSolution = vi.fn()
    const user = userEvent.setup()
    const rowWithSolution = {
      ...row1,
      sds_solution_content: 'Reemplazar el fusor',
      sds_link: 'https://example.com/solution',
    }
    render(
      <IncidentsTable
        incidentRows={[rowWithSolution]}
        onEditCode={vi.fn()}
        onViewSolution={onViewSolution}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Ver solución' }))
    expect(onViewSolution).toHaveBeenCalledWith(
      '53.B0.02',
      'Reemplazar el fusor',
      'https://example.com/solution'
    )
  })

  it('click en el código dispara onViewSolution (abre modal Ver solución)', async () => {
    const onViewSolution = vi.fn()
    const user = userEvent.setup()
    render(
      <IncidentsTable incidentRows={[row1]} onEditCode={vi.fn()} onViewSolution={onViewSolution} />
    )
    await user.click(screen.getByRole('button', { name: /53\.B0\.02/ }))
    expect(onViewSolution).toHaveBeenCalledWith('53.B0.02', null, null)
  })

  it('muestra indicador 📘 cuando hasCpmdModel=true', () => {
    render(
      <IncidentsTable
        incidentRows={[row1]}
        hasCpmdModel={true}
        onEditCode={vi.fn()}
        onViewSolution={vi.fn()}
      />
    )
    expect(screen.getByLabelText('Solución CPMD disponible')).toBeInTheDocument()
  })

  it('no muestra indicador 📘 cuando hasCpmdModel=false', () => {
    render(
      <IncidentsTable
        incidentRows={[row1]}
        hasCpmdModel={false}
        onEditCode={vi.fn()}
        onViewSolution={vi.fn()}
      />
    )
    expect(screen.queryByLabelText('Solución CPMD disponible')).not.toBeInTheDocument()
  })

  it('expansión de fila muestra el detalle de eventos internos', async () => {
    const user = userEvent.setup()
    render(<IncidentsTable incidentRows={[row1]} onEditCode={vi.fn()} onViewSolution={vi.fn()} />)

    // Antes de expandir, el contador no debe estar visible
    expect(screen.queryByText('100')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Expandir detalle' }))
    // Después de expandir, el contador del primer evento es visible
    expect(screen.getByText('100')).toBeInTheDocument()
  })

  it('botón "ver más" expande mensaje truncado', async () => {
    const user = userEvent.setup()
    const longMsg = 'A'.repeat(100) + ' mensaje largo de prueba que supera los 80 caracteres claramente'
    const rowWithLongMsg = mockIncidentRow({
      id: 'row-long',
      code: 'TST-001',
      eventsInWindow: [
        mockEvent({
          code: 'TST-001',
          timestamp: '2024-03-14T10:00:00',
          help_reference: longMsg,
          counter: 500,
        }),
      ],
    })
    render(<IncidentsTable incidentRows={[rowWithLongMsg]} onEditCode={vi.fn()} onViewSolution={vi.fn()} />)

    // Expandir la fila
    await user.click(screen.getByRole('button', { name: 'Expandir detalle' }))

    // Debe aparecer el botón "ver más"
    expect(screen.getByText('ver más')).toBeInTheDocument()

    // Click en "ver más" para expandir el mensaje
    await user.click(screen.getByText('ver más'))
    expect(screen.getByText('ver menos')).toBeInTheDocument()
  })
})
