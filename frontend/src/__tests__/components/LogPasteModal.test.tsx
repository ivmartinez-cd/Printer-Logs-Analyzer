// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { LogPasteModal } from '../../components/LogPasteModal'
import { useToast } from '../../contexts/ToastContext'

// Mock services
vi.mock('../../services/api', () => ({
  listPrinterModels: vi.fn(),
  extractSdsLogs: vi.fn(),
}))

// Mock Toast context
vi.mock('../../contexts/ToastContext', () => ({
  useToast: vi.fn(),
}))

import { listPrinterModels, extractSdsLogs } from '../../services/api'

describe('LogPasteModal', () => {
  const mockOnAnalyze = vi.fn()
  const mockOnClose = vi.fn()
  const mockToast = {
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showWarning: vi.fn(),
  }

  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(useToast).mockReturnValue(mockToast as any)
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

  it('handles serial number input and extraction success', async () => {
    vi.mocked(extractSdsLogs).mockResolvedValue({
      serial: 'CNNCQ520HG',
      event_count: 10,
      logs_text: 'MOCK LOG DATA',
    } as any)

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

    const extractBtn = screen.getByText('Extraer logs')
    fireEvent.click(extractBtn)

    expect(screen.getByText('Extrayendo…')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByDisplayValue('MOCK LOG DATA')).toBeInTheDocument()
      expect(mockToast.showSuccess).toHaveBeenCalledWith(expect.stringContaining('10 eventos'))
    })
  })

  it('handles extraction failure', async () => {
    vi.mocked(extractSdsLogs).mockRejectedValue(new Error('Portal offline') as any)

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
    fireEvent.change(serialInput, { target: { value: 'SERIAL' } })
    
    const extractBtn = screen.getByText('Extraer logs')
    fireEvent.click(extractBtn)

    await waitFor(() => {
      expect(mockToast.showError).toHaveBeenCalledWith('Portal offline')
      expect(screen.getByText('Extraer logs')).toBeInTheDocument()
    })
  })

  it('calls onAnalyze when button is clicked and form is valid', async () => {
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

    const analyzeBtn = screen.getByText('Analizar')
    expect(analyzeBtn).not.toBeDisabled()
    
    fireEvent.click(analyzeBtn)
    expect(mockOnAnalyze).toHaveBeenCalledWith('some log data', undefined, 'm1', false, null)
  })

  it('disables analyze button when input is missing', async () => {
    render(
      <LogPasteModal
        loading={false}
        error={null}
        serverWasCold={false}
        onAnalyze={mockOnAnalyze}
        onClose={mockOnClose}
      />
    )
    
    const analyzeBtn = screen.getByText('Analizar')
    expect(analyzeBtn).toBeDisabled()
  })
})
