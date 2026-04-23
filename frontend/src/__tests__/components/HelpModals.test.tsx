import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { HelpModal } from '../../components/ui/HelpModal'
import { HowItWorksModal } from '../../components/Maintenance/MaintenanceModals'

describe('Help Modals Integration', () => {
  describe('HelpModal (General)', () => {
    it('renders the main title and guide meta', () => {
      render(<HelpModal onClose={vi.fn()} />)
      expect(screen.getByText('¿Cómo funciona HP Logs Analyzer?')).toBeInTheDocument()
      expect(screen.getByText(/Guía de arquitectura/i)).toBeInTheDocument()
    })

    it('renders the step-based flow sections', () => {
      render(<HelpModal onClose={vi.fn()} />)
      expect(screen.getByText('Flujo de Análisis')).toBeInTheDocument()
      expect(screen.getByText('Panel de KPIs Inteligentes')).toBeInTheDocument()
      expect(screen.getByText('Diagnóstico Ejecutivo (IA)')).toBeInTheDocument()
    })

    it('renders KPI cards descriptions', () => {
      render(<HelpModal onClose={vi.fn()} />)
      expect(screen.getByText('Estado de Errores')).toBeInTheDocument()
      expect(screen.getByText(/Tasa de Errores/i)).toBeInTheDocument()
    })

    it('calls onClose when clicking the close button or "Entendido"', () => {
      const onClose = vi.fn()
      render(<HelpModal onClose={onClose} />)
      
      fireEvent.click(screen.getByLabelText('Cerrar'))
      expect(onClose).toHaveBeenCalled()

      fireEvent.click(screen.getByText('Entendido, ¡vamos allá!'))
      expect(onClose).toHaveBeenCalledTimes(2)
    })
  })

  describe('HowItWorksModal (Maintenance)', () => {
    it('renders the maintenance help title', () => {
      render(<HowItWorksModal onClose={vi.fn()} />)
      expect(screen.getByText('¿Cómo funciona el módulo de Avisos?')).toBeInTheDocument()
    })

    it('renders the formula section', () => {
      render(<HowItWorksModal onClose={vi.fn()} />)
      expect(screen.getByText('Cálculo de páginas restantes')).toBeInTheDocument()
      expect(screen.getAllByText('Próximo cambio')[0]).toBeInTheDocument()
    })

    it('calls onClose when clicking close icon or button', () => {
      const onClose = vi.fn()
      render(<HowItWorksModal onClose={onClose} />)

      fireEvent.click(screen.getByLabelText('Cerrar'))
      expect(onClose).toHaveBeenCalled()

      fireEvent.click(screen.getByText('Entendido'))
      expect(onClose).toHaveBeenCalledTimes(2)
    })
  })
})
