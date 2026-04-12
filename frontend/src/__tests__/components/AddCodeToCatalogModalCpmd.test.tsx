// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import { AddCodeToCatalogModal } from '../../components/AddCodeToCatalogModal'

afterEach(cleanup)

vi.mock('../../services/api', () => ({
  getErrorSolution: vi.fn(),
}))

import { getErrorSolution } from '../../services/api'
const mockGetErrorSolution = getErrorSolution as ReturnType<typeof vi.fn>

const BASE_PROPS = {
  code: '49.FF.09',
  initialDescription: 'Formatter error',
  initialSeverity: 'ERROR',
  onSave: vi.fn(),
  onClose: vi.fn(),
  saving: false,
}

describe('AddCodeToCatalogModal — CPMD section', () => {
  beforeEach(() => {
    mockGetErrorSolution.mockReset()
  })

  it('shows "no model" message when modelId is not provided', () => {
    render(<AddCodeToCatalogModal {...BASE_PROPS} />)
    expect(screen.getByText(/seleccioná un modelo/i)).toBeInTheDocument()
  })

  it('shows loading skeleton while fetching', () => {
    mockGetErrorSolution.mockReturnValue(new Promise(() => {}))
    render(<AddCodeToCatalogModal {...BASE_PROPS} modelId="model-uuid-123" />)
    expect(screen.getByText(/buscando en cpmd/i)).toBeInTheDocument()
  })

  it('shows not-found message when getErrorSolution returns null', async () => {
    mockGetErrorSolution.mockResolvedValue(null)
    render(<AddCodeToCatalogModal {...BASE_PROPS} modelId="model-uuid-123" />)
    await waitFor(() => {
      expect(screen.getByText(/no hay información del cpmd/i)).toBeInTheDocument()
    })
  })

  it('renders cause, steps and frus when solution is found', async () => {
    mockGetErrorSolution.mockResolvedValue({
      id: 1,
      model_id: 'model-uuid-123',
      code: '49.FF.09',
      title: 'Formatter error',
      cause: 'Firmware corruption in formatter',
      technician_steps: ['Power cycle', 'Reinstall firmware'],
      frus: [{ part_number: 'CF234A', description: 'Formatter PCA' }],
      source_audience: 'service',
      source_page: 42,
      cpmd_hash: 'abc123',
    })

    render(<AddCodeToCatalogModal {...BASE_PROPS} modelId="model-uuid-123" />)

    await waitFor(() => {
      expect(screen.getByText('Firmware corruption in formatter')).toBeInTheDocument()
    })
    expect(screen.getByText('Power cycle')).toBeInTheDocument()
    expect(screen.getByText('Reinstall firmware')).toBeInTheDocument()
    expect(screen.getByText('CF234A')).toBeInTheDocument()
    expect(screen.getByText(/Formatter PCA/)).toBeInTheDocument()
    expect(screen.getByText(/pág. 42/i)).toBeInTheDocument()
    expect(screen.getByText(/sección service/i)).toBeInTheDocument()
  })

  it('omits cause block when cause is null', async () => {
    mockGetErrorSolution.mockResolvedValue({
      id: 1,
      model_id: 'model-uuid-123',
      code: '49.FF.09',
      title: null,
      cause: null,
      technician_steps: ['Power cycle'],
      frus: [],
      source_audience: null,
      source_page: null,
      cpmd_hash: null,
    })

    render(<AddCodeToCatalogModal {...BASE_PROPS} modelId="model-uuid-123" />)

    await waitFor(() => {
      expect(screen.getByText('Power cycle')).toBeInTheDocument()
    })
    expect(screen.queryByText('Causa')).not.toBeInTheDocument()
  })

  it('omits frus block when frus list is empty', async () => {
    mockGetErrorSolution.mockResolvedValue({
      id: 1,
      model_id: 'model-uuid-123',
      code: '49.FF.09',
      title: null,
      cause: 'Some cause',
      technician_steps: ['Step 1'],
      frus: [],
      source_audience: null,
      source_page: null,
      cpmd_hash: null,
    })

    render(<AddCodeToCatalogModal {...BASE_PROPS} modelId="model-uuid-123" />)

    await waitFor(() => {
      expect(screen.getByText('Some cause')).toBeInTheDocument()
    })
    expect(screen.queryByText('Repuestos')).not.toBeInTheDocument()
  })

  it('shows "sin pasos" when technician_steps is empty', async () => {
    mockGetErrorSolution.mockResolvedValue({
      id: 1,
      model_id: 'model-uuid-123',
      code: '49.FF.09',
      title: null,
      cause: null,
      technician_steps: [],
      frus: [],
      source_audience: null,
      source_page: null,
      cpmd_hash: null,
    })

    render(<AddCodeToCatalogModal {...BASE_PROPS} modelId="model-uuid-123" />)

    await waitFor(() => {
      expect(screen.getByText(/sin pasos extraídos/i)).toBeInTheDocument()
    })
  })
})
