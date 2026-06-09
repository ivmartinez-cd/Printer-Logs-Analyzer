// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CdsIncidentsPanel } from '../../components/Monitor/CdsIncidentsPanel'

vi.mock('../../services/api', () => ({
  getCdsIncidentDetails: vi.fn().mockResolvedValue({
    repuestos: [{ articulo: 'Pickup Roller', cantidad: 2 }],
    tareas_realizadas: ['Se limpia bandeja 2', 'Reemplazo de pick-up rollers'],
  }),
}))

const mockCdsIncidents = [
  {
    id: 'inc-1',
    numero_incidente: '123456',
    fecha: '09/06/2026 10:00:00',
    motivo: 'Atasco en bandeja 2',
    estado: 'Cerrado',
    contador: '100000',
  }
]

describe('CdsIncidentsPanel', () => {
  it('does not render when serial is null', () => {
    const { container } = render(
      <CdsIncidentsPanel serial={null} data={[]} loading={false} error={null} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders collapsed by default', () => {
    render(
      <CdsIncidentsPanel serial="BRBSN9YYK7" data={mockCdsIncidents} loading={false} error={null} />
    )
    expect(screen.getByText(/Incidentes CD/)).toBeInTheDocument()
    expect(screen.queryByText('Atasco en bandeja 2')).not.toBeInTheDocument()
  })

  it('renders loading spinner and message when loading is true', () => {
    render(
      <CdsIncidentsPanel serial="BRBSN9YYK7" data={[]} loading={true} error={null} />
    )
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText(/Consultando/)).toBeInTheDocument()
  })

  it('renders error message when error is present', () => {
    render(
      <CdsIncidentsPanel serial="BRBSN9YYK7" data={[]} loading={false} error="API Error" />
    )
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText(/API Error/)).toBeInTheDocument()
  })

  it('renders empty message when no data is returned', () => {
    render(
      <CdsIncidentsPanel serial="BRBSN9YYK7" data={[]} loading={false} error={null} />
    )
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText(/Sin incidentes reportados/)).toBeInTheDocument()
  })

  it('renders incident list with basic info on expand', () => {
    render(
      <CdsIncidentsPanel serial="BRBSN9YYK7" data={mockCdsIncidents} loading={false} error={null} />
    )
    fireEvent.click(screen.getByRole('button', { name: /Incidentes CD/i }))
    expect(screen.getByText('Atasco en bandeja 2')).toBeInTheDocument()
    expect(screen.getByText('100.000')).toBeInTheDocument()
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('https://webagentes.canaldirecto.com.ar/incidents/view/123456')
  })

  it('loads and shows repuestos and tareas when row is expanded', async () => {
    render(
      <CdsIncidentsPanel serial="BRBSN9YYK7" data={mockCdsIncidents} loading={false} error={null} />
    )
    // Open panel
    fireEvent.click(screen.getByRole('button', { name: /Incidentes CD/i }))
    // Expand row
    fireEvent.click(screen.getByRole('button', { name: /Ver detalles/i }))

    await waitFor(() => {
      expect(screen.getByText('Pickup Roller (x2)')).toBeInTheDocument()
      expect(screen.getByText('Se limpia bandeja 2')).toBeInTheDocument()
      expect(screen.getByText('Reemplazo de pick-up rollers')).toBeInTheDocument()
    })
  })
})
