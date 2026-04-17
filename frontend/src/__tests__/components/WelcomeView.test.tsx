import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { WelcomeView } from '../../components/dashboard/WelcomeView'

// Mock react-i18next para validar Branding Premium
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'welcome.title': 'Monitor de Diagnóstico HP',
        'welcome.tagline': 'Análisis técnico avanzado',
        'welcome.cta_new': 'Analizar Nuevo',
        'welcome.cta_saved': 'Explorar Historial',
        'welcome.cta_guide': 'Guía de Uso',
        'welcome.capabilities': 'Capacidades del Sistema',
        'welcome.feat_kpi_title': 'KPIs de Severidad',
        'welcome.feat_hw_title': 'Hardware Real-Time'
      }
      return translations[key] || key
    },
  }),
}))

// Mock DbStatusBadge
vi.mock('../DbStatusBadge', () => ({
  DbStatusBadge: () => <div data-testid="db-status">DbStatus</div>
}))

describe('WelcomeView', () => {
  const defaultProps = {
    healthStatus: { db_available: true, status: 'ok' as const, db_mode: 'postgres' as const },
    onAnalyzeNew: vi.fn(),
    onViewSaved: vi.fn(),
    onHelp: vi.fn(),
  }

  it('debe renderizar el título y el tagline premium', () => {
    render(<WelcomeView {...defaultProps} />)
    expect(screen.getByText('Monitor de Diagnóstico HP')).toBeInTheDocument()
    expect(screen.getByText('Análisis técnico avanzado')).toBeInTheDocument()
  })

  it('debe llamar a los handlers al hacer click en los botones ejecutivos', () => {
    render(<WelcomeView {...defaultProps} />)
    
    // Validamos labels específicos del plan
    fireEvent.click(screen.getByRole('button', { name: /Analizar Nuevo/ }))
    expect(defaultProps.onAnalyzeNew).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /Explorar Historial/ }))
    expect(defaultProps.onViewSaved).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /Guía de Uso/ }))
    expect(defaultProps.onHelp).toHaveBeenCalled()
  })

  it('debe mostrar las capacidades del sistema', () => {
    render(<WelcomeView {...defaultProps} />)
    expect(screen.getByText('Capacidades del Sistema')).toBeInTheDocument()
    expect(screen.getByText('KPIs de Severidad')).toBeInTheDocument()
    expect(screen.getByText('Hardware Real-Time')).toBeInTheDocument()
  })
})
