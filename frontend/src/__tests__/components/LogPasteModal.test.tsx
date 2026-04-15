// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { LogPasteModal } from '../../components/LogPasteModal'

// Mock services
vi.mock('../../services/api', () => ({
  listPrinterModels: vi.fn(),
}))

import { listPrinterModels } from '../../services/api'

describe('LogPasteModal', () => {
  const mockOnAnalyze = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(listPrinterModels).mockResolvedValue([
      { id: 'm1', model_name: 'Printer 1', model_code: 'P1', has_cpmd: false },
    ] as any)
  })

  afterEach(cleanup)

  it('renders correctly in idle state', async () => {
    render(
      <LogPasteModal
        loading={false}
        error={null}
        serverWasCold={false}
        onAnalyze={mockOnAnalyze}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('Pegar logs HP')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('Printer 1 (P1)')).toBeInTheDocument()
    })
  })

  it('calls onAnalyze with isAutomated=true when automated flow is triggered', async () => {
    render(
      <LogPasteModal
        loading={false}
        error={null}
        serverWasCold={false}
        onAnalyze={mockOnAnalyze}
        onClose={mockOnClose}
      />
    )

    const serialInput = screen.getByPlaceholderText(/Ej: CNNCQ520HG/i)
    fireEvent.change(serialInput, { target: { value: 'cnncq520hg' } })
    
    // Value should be upper-cased
    expect(serialInput).toHaveValue('CNNCQ520HG')

    const extractBtn = screen.getByText('Extraer y Analizar')
    expect(extractBtn).not.toBeDisabled()
    
    fireEvent.click(extractBtn)

    expect(mockOnAnalyze).toHaveBeenCalledWith('', undefined, null, false, 'CNNCQ520HG', true)
  })

  it('disables automated extraction button when serial is too short', async () => {
    render(
      <LogPasteModal
        loading={false}
        error={null}
        serverWasCold={false}
        onAnalyze={mockOnAnalyze}
        onClose={mockOnClose}
      />
    )

    const serialInput = screen.getByPlaceholderText(/Ej: CNNCQ520HG/i)
    fireEvent.change(serialInput, { target: { value: '1234' } })
    
    const extractBtn = screen.getByText('Extraer y Analizar')
    expect(extractBtn).toBeDisabled()
  })

  it('calls onAnalyze when manual flow button is clicked and form is valid', async () => {
    render(
      <LogPasteModal
        loading={false}
        error={null}
        serverWasCold={false}
        onAnalyze={mockOnAnalyze}
        onClose={mockOnClose}
      />
    )

    await waitFor(() => screen.getByText('Printer 1 (P1)'))

    const textarea = screen.getByPlaceholderText(/Pegar logs HP aquí/i)
    fireEvent.change(textarea, { target: { value: 'some log data' } })

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'm1' } })

    const analyzeBtn = screen.getByText('Analizar (Manual)')
    expect(analyzeBtn).not.toBeDisabled()
    
    fireEvent.click(analyzeBtn)
    expect(mockOnAnalyze).toHaveBeenCalledWith('some log data', undefined, 'm1', false, undefined, false)
  })

  it('disables manual flow analyze button when input is missing', async () => {
    render(
      <LogPasteModal
        loading={false}
        error={null}
        serverWasCold={false}
        onAnalyze={mockOnAnalyze}
        onClose={mockOnClose}
      />
    )
    
    const analyzeBtn = screen.getByText('Analizar (Manual)')
    expect(analyzeBtn).toBeDisabled()
  })
})
