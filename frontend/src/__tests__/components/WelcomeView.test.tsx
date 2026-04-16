import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { WelcomeView } from '../../components/dashboard/WelcomeView'

// Mock react-i18next para simplificar el test unitario
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Mock DbStatusBadge ya que tiene su propio test o lógica
vi.mock('../DbStatusBadge', () => ({
  DbStatusBadge: () => <div data-testid="db-status">DbStatus</div>
}))

describe('WelcomeView', () => {
  const defaultProps = {
    healthStatus: { db_available: true, status: 'ok' as const, db_mode: 'postgres' },
    onAnalyzeNew: vi.fn(),
    onViewSaved: vi.fn(),
    onHelp: vi.fn(),
  }

  it('debe renderizar el título y el tagline (vía claves de i18n)', () => {
    render(<WelcomeView {...defaultProps} />)
    expect(screen.getByText('welcome.title')).toBeInTheDocument()
    expect(screen.getByText('welcome.tagline')).toBeInTheDocument()
  })

  it('debe llamar a los handlers al hacer click en los botones', () => {
    render(<WelcomeView {...defaultProps} />)
    
    fireEvent.click(screen.getByText('welcome.cta_new'))
    expect(defaultProps.onAnalyzeNew).toHaveBeenCalled()

    fireEvent.click(screen.getByText('welcome.cta_saved'))
    expect(defaultProps.onViewSaved).toHaveBeenCalled()

    fireEvent.click(screen.getByText('welcome.cta_guide'))
    expect(defaultProps.onHelp).toHaveBeenCalled()
  })

  it('debe mostrar las capacidades del sistema', () => {
    render(<WelcomeView {...defaultProps} />)
    expect(screen.getByText('welcome.capabilities')).toBeInTheDocument()
    expect(screen.getByText('welcome.feat_kpi_title')).toBeInTheDocument()
    expect(screen.getByText('welcome.feat_hw_title')).toBeInTheDocument()
  })
})
