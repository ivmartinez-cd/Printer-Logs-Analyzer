// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { LogPasteModal } from '../../components/LogPasteModal'

describe('LogPasteModal', () => {
  const mockOnAnalyze = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(cleanup)

  it('renders correctly in idle state', () => {
    render(
      <LogPasteModal
        loading={false}
        error={null}
        serverWasCold={false}
        onAnalyze={mockOnAnalyze}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('Nuevo Análisis de Logs')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Ej: CNNCQ520HG/i)).toBeInTheDocument()
    // Manual section should be hidden initially
    expect(screen.queryByPlaceholderText(/Pegar logs HP aquí/i)).not.toBeInTheDocument()
  })

  it('calls onAnalyze with isAutomated=true when automated flow is triggered', () => {
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
    expect(mockOnAnalyze).toHaveBeenCalledWith('', undefined, null, 'CNNCQ520HG', true)
  })

  it('disables automated extraction button when serial is too short', () => {
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

    fireEvent.click(screen.getByText(/Mostrar ingreso manual/i))
    await waitFor(() => screen.getByPlaceholderText(/Pegar logs HP aquí/i))

    const textarea = screen.getByPlaceholderText(/Pegar logs HP aquí/i)
    fireEvent.change(textarea, { target: { value: 'some log data' } })


    const analyzeBtn = screen.getByText('🚀 Analizar (Manual)')
    expect(analyzeBtn).not.toBeDisabled()

    fireEvent.click(analyzeBtn)
    expect(mockOnAnalyze).toHaveBeenCalledWith('some log data', undefined, null, undefined, false)
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
    fireEvent.click(screen.getByText(/Mostrar ingreso manual/i))
    await waitFor(() => screen.getByPlaceholderText(/Pegar logs HP aquí/i))

    const analyzeBtn = screen.getByText('🚀 Analizar (Manual)')
    expect(analyzeBtn).toBeDisabled()
  })
})
