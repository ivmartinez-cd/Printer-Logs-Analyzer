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

    expect(screen.getByText(/Ingesta de Telemetría/i)).toBeInTheDocument()
    
    // Manual section should be hidden initially
    expect(screen.queryByPlaceholderText(/Pegue aquí el bloque/i)).not.toBeInTheDocument()

    // Expand manual section to see the select
    fireEvent.click(screen.getByText(/Mostrar Ingesta de Telemetría/i))

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

    const serialInput = screen.getByPlaceholderText(/INTRODUCIR N° DE SERIE/i)
    fireEvent.change(serialInput, { target: { value: 'cnncq520hg' } })
    
    // Value should be upper-cased
    expect(serialInput).toHaveValue('CNNCQ520HG')

    const extractBtn = screen.getByText(/Procesar Análisis/i)
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

    const serialInput = screen.getByPlaceholderText(/INTRODUCIR N° DE SERIE/i)
    fireEvent.change(serialInput, { target: { value: '1234' } })
    
    const extractBtn = screen.getByText(/Procesar Análisis/i)
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

    await waitFor(() => screen.getByText(/Mostrar Ingesta de Telemetría/i))
    fireEvent.click(screen.getByText(/Mostrar Ingesta de Telemetría/i))

    await waitFor(() => screen.getByPlaceholderText(/Pegue aquí el bloque/i))

    const textarea = screen.getByPlaceholderText(/Pegue aquí el bloque/i)
    fireEvent.change(textarea, { target: { value: 'some log data' } })

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'm1' } })

    // There are two '🚀 Procesar Análisis' buttons: quick (index 0) and manual (index 1)
    const analyzeBtns = screen.getAllByText(/🚀 Procesar Análisis/i)
    const analyzeBtn = analyzeBtns[analyzeBtns.length - 1] // manual section button
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
    fireEvent.click(screen.getByText(/Mostrar Ingesta de Telemetría/i))
    await waitFor(() => screen.getByPlaceholderText(/Pegue aquí el bloque/i))
    
    // There are two '🚀 Procesar Análisis' buttons: quick (index 0) and manual (index 1)
    const analyzeBtns = screen.getAllByText(/🚀 Procesar Análisis/i)
    const analyzeBtn = analyzeBtns[analyzeBtns.length - 1] // manual section button
    expect(analyzeBtn).toBeDisabled()
  })
})
