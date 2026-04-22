// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SolutionContentModal } from '../../components/Parser/SolutionContentModal'
import * as api from '../../services/api'

vi.mock('../../services/api', () => ({
  getSolutionProxy: vi.fn()
}))

afterEach(cleanup)

describe('SolutionContentModal', () => {
  it('muestra mensaje cuando no hay contenido SDS y el proxy no devuelve nada', async () => {
    vi.mocked(api.getSolutionProxy).mockResolvedValueOnce({ content: null, source: 'cache', url: null })

    render(
      <SolutionContentModal
        code="53.B0.02"
        sdsContent={null}
        sdsUrl={null}
        onClose={vi.fn()}
      />
    )
    
    // Debería mostrar el mensaje después de que termine de "cargar" (el fetch falla o vuelve vacío)
    await waitFor(() => {
      expect(screen.getByText('Sin información disponible para este código.')).toBeInTheDocument()
    })

    // Ya no debe haber pestañas
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
  })

  it('muestra contenido SDS directamente sin pestañas', () => {
    const content = 'Reemplazar el fusor inmediatamente'
    render(
      <SolutionContentModal
        code="53.B0.02"
        sdsContent={content}
        sdsUrl="https://hp.com/support/123"
        onClose={vi.fn()}
      />
    )
    expect(screen.getByText(content)).toBeInTheDocument()
    expect(screen.getByText(/Solución técnica/i)).toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    expect(screen.queryByText('Solución CPMD')).not.toBeInTheDocument()
  })

  it('el botón Cerrar invoca la función onClose', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(
      <SolutionContentModal
        code="53.B0.02"
        sdsContent="Contenido"
        onClose={onClose}
      />
    )
    // Buscamos el botón de acción principal "Cerrar"
    const buttons = screen.getAllByRole('button', { name: 'Cerrar' })
    const actionClose = buttons.find(b => b.className.includes('dashboard__btn--secondary'))
    
    if (actionClose) {
      await user.click(actionClose)
      expect(onClose).toHaveBeenCalledOnce()
    }
  })
})
