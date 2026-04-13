// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SolutionContentModal } from '../../components/SolutionContentModal'
import * as api from '../../services/api'
import type { ErrorSolution } from '../../types/api'

afterEach(cleanup)

const mockSolution: ErrorSolution = {
  id: 1,
  model_id: 'model-uuid',
  code: '53.B0.02',
  title: 'Fuser error',
  cause: 'Fuser assembly failed',
  technician_steps: ['Step 1: Power off', 'Step 2: Replace fuser'],
  frus: [{ part_number: 'RM1-1234', description: 'Fuser assembly' }],
  source_audience: 'CE',
  source_page: 42,
  cpmd_hash: 'abc123',
}

describe('SolutionContentModal', () => {
  beforeEach(() => {
    vi.spyOn(api, 'getErrorSolution').mockResolvedValue(null)
  })

  it('muestra mensaje único cuando no hay SDS ni CPMD', async () => {
    render(
      <SolutionContentModal
        code="53.B0.02"
        modelId={null}
        sdsContent={null}
        sdsUrl={null}
        onClose={vi.fn()}
      />
    )
    expect(
      screen.getByText('Sin información disponible para este código.')
    ).toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
  })

  it('muestra solo SDS sin tabs cuando no hay modelId', () => {
    render(
      <SolutionContentModal
        code="53.B0.02"
        modelId={null}
        sdsContent="Reemplazar el fusor"
        sdsUrl="https://example.com/solution"
        onClose={vi.fn()}
      />
    )
    expect(screen.getByText('Reemplazar el fusor')).toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    expect(screen.queryByText('Solución CPMD')).not.toBeInTheDocument()
  })

  it('muestra dos tabs cuando hay SDS y modelId, tab CPMD activo por default mientras carga', () => {
    vi.spyOn(api, 'getErrorSolution').mockReturnValue(new Promise(() => {})) // pending
    render(
      <SolutionContentModal
        code="53.B0.02"
        modelId="model-uuid"
        sdsContent="Contenido SDS"
        sdsUrl="https://example.com"
        onClose={vi.fn()}
      />
    )
    expect(screen.getByRole('tab', { name: 'Solución SDS' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Solución CPMD/ })).toBeInTheDocument()
    // Tab CPMD activo por default
    expect(screen.getByRole('tab', { name: /Solución CPMD/ })).toHaveAttribute(
      'aria-selected',
      'true'
    )
  })

  it('ambas soluciones disponibles → tab CPMD activo por default', async () => {
    vi.spyOn(api, 'getErrorSolution').mockResolvedValue(mockSolution)
    render(
      <SolutionContentModal
        code="53.B0.02"
        modelId="model-uuid"
        sdsContent="Contenido SDS"
        sdsUrl="https://example.com"
        onClose={vi.fn()}
      />
    )
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Solución CPMD/ })).toHaveAttribute(
        'aria-selected',
        'true'
      )
    })
    // Contenido CPMD visible
    expect(screen.getByText('Fuser assembly failed')).toBeInTheDocument()
    // Contenido SDS no visible
    expect(screen.queryByText('Contenido SDS')).not.toBeInTheDocument()
  })

  it('solo SDS disponible (CPMD not found) → switch a tab SDS', async () => {
    vi.spyOn(api, 'getErrorSolution').mockResolvedValue(null)
    render(
      <SolutionContentModal
        code="53.B0.02"
        modelId="model-uuid"
        sdsContent="Contenido SDS"
        sdsUrl="https://example.com"
        onClose={vi.fn()}
      />
    )
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Solución SDS' })).toHaveAttribute(
        'aria-selected',
        'true'
      )
    })
    expect(screen.getByText('Contenido SDS')).toBeInTheDocument()
  })

  it('solo CPMD disponible (sin SDS) → sin tabs, muestra CPMD directamente', async () => {
    vi.spyOn(api, 'getErrorSolution').mockResolvedValue(mockSolution)
    render(
      <SolutionContentModal
        code="53.B0.02"
        modelId="model-uuid"
        sdsContent={null}
        sdsUrl={null}
        onClose={vi.fn()}
      />
    )
    await waitFor(() => {
      expect(screen.getByText('Fuser assembly failed')).toBeInTheDocument()
    })
    // Sin tab strip
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
  })

  it('click en tab SDS cambia el contenido visible', async () => {
    vi.spyOn(api, 'getErrorSolution').mockResolvedValue(mockSolution)
    const user = userEvent.setup()
    render(
      <SolutionContentModal
        code="53.B0.02"
        modelId="model-uuid"
        sdsContent="Contenido SDS"
        sdsUrl="https://example.com"
        onClose={vi.fn()}
      />
    )
    await waitFor(() => {
      expect(screen.getByText('Fuser assembly failed')).toBeInTheDocument()
    })
    await user.click(screen.getByRole('tab', { name: 'Solución SDS' }))
    expect(screen.getByText('Contenido SDS')).toBeInTheDocument()
    expect(screen.queryByText('Fuser assembly failed')).not.toBeInTheDocument()
  })

  it('modal de edición ya no contiene el panel CPMD (AddCodeToCatalogModal)', async () => {
    // This is a structural test — just verify that SolutionContentModal has the CPMD panel
    // and AddCodeToCatalogModal does not (covered by import verification)
    const { AddCodeToCatalogModal } = await import('../../components/AddCodeToCatalogModal')
    render(
      <AddCodeToCatalogModal
        code="53.B0.02"
        initialDescription="Fuser error"
        initialSeverity="ERROR"
        onSave={vi.fn()}
        onClose={vi.fn()}
        saving={false}
      />
    )
    expect(screen.queryByText('Solución oficial HP (CPMD)')).not.toBeInTheDocument()
    expect(screen.queryByText('Buscando en CPMD…')).not.toBeInTheDocument()
  })

  it('botón Cerrar invoca onClose', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(
      <SolutionContentModal
        code="53.B0.02"
        modelId={null}
        sdsContent="Contenido"
        onClose={onClose}
      />
    )
    // The action button has text "Cerrar"; the × button has aria-label="Cerrar"
    const [, actionClose] = screen.getAllByRole('button', { name: 'Cerrar' })
    await user.click(actionClose)
    expect(onClose).toHaveBeenCalledOnce()
  })
})
