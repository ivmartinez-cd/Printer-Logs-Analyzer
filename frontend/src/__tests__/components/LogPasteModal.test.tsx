// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { LogPasteModal } from '../../components/Analysis/LogPasteModal'

describe('LogPasteModal', () => {
  const mockOnAnalyze = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(cleanup)

  it('renders correctly with manual input visible', () => {
    render(
      <LogPasteModal
        loading={false}
        error={null}
        serverWasCold={false}
        onAnalyze={mockOnAnalyze}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('Análisis Manual de Logs')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Pegar logs HP aquí/i)).toBeInTheDocument()
  })

  it('calls onAnalyze when analyze button is clicked and form is valid', async () => {
    render(
      <LogPasteModal
        loading={false}
        error={null}
        serverWasCold={false}
        onAnalyze={mockOnAnalyze}
        onClose={mockOnClose}
      />
    )

    const textarea = screen.getByPlaceholderText(/Pegar logs HP aquí/i)
    fireEvent.change(textarea, { target: { value: 'some log data' } })

    const analyzeBtn = screen.getByText('🚀 Iniciar Análisis')
    expect(analyzeBtn).not.toBeDisabled()

    fireEvent.click(analyzeBtn)
    expect(mockOnAnalyze).toHaveBeenCalledWith('some log data', undefined, null, undefined, false)
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
    
    const analyzeBtn = screen.getByText('🚀 Iniciar Análisis')
    expect(analyzeBtn).toBeDisabled()
  })

  it('shows error message when error prop is provided', () => {
    render(
      <LogPasteModal
        loading={false}
        error="Invalid log format"
        serverWasCold={false}
        onAnalyze={mockOnAnalyze}
        onClose={mockOnClose}
      />
    )
    
    expect(screen.getByText('Invalid log format')).toBeInTheDocument()
  })
})
