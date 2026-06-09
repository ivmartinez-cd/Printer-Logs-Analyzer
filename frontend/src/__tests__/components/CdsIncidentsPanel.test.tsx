// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CdsIncidentsPanel } from '../../components/Monitor/CdsIncidentsPanel'

const mockCdsIncidents = [
  {
    id: 'inc-1',
    numero_incidente: '123456',
    fecha: '09/06/2026 10:00:00',
    motivo: 'Atasco en bandeja 2',
    estado: 'Cerrado',
    contador: '100000',
    repuestos: [{ articulo: 'Pickup Roller', cantidad: 2 }]
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
    // Expand first
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(screen.getByText(/Consultando/)).toBeInTheDocument()
  })

  it('renders error message when error is present', () => {
    render(
      <CdsIncidentsPanel serial="BRBSN9YYK7" data={[]} loading={false} error="API Error" />
    )
    // Expand
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(screen.getByText(/API Error/)).toBeInTheDocument()
  })

  it('renders empty message when no data is returned', () => {
    render(
      <CdsIncidentsPanel serial="BRBSN9YYK7" data={[]} loading={false} error={null} />
    )
    // Expand
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(screen.getByText(/Sin incidentes reportados/)).toBeInTheDocument()
  })

  it('renders list of incidents when data is provided', () => {
    render(
      <CdsIncidentsPanel serial="BRBSN9YYK7" data={mockCdsIncidents} loading={false} error={null} />
    )
    // Expand
    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(screen.getByText('Atasco en bandeja 2')).toBeInTheDocument()
    expect(screen.getByText('Pickup Roller (x2)')).toBeInTheDocument()
    expect(screen.getByText('100.000')).toBeInTheDocument() // formatted count

    const link = screen.getByRole('link')
    expect(link).toBeInTheDocument()
    expect(link.getAttribute('href')).toBe('https://webagentes.canaldirecto.com.ar/incidents/view/123456')
  })
})
