// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AIDiagnosticPanel } from '../../components/AIDiagnosticPanel'
import * as api from '../../services/api'

vi.mock('../../services/api', () => ({
  aiDiagnose: vi.fn()
}))

const mockResult = {
  events: [],
  incidents: [],
  global_severity: 'OK',
  errors: [],
  consumable_warnings: [],
  log_start_date: '...',
  log_end_date: '...',
  total_lines: 0,
}

describe('AIDiagnosticPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('no renderiza nada si result es null', () => {
    const { container } = render(<AIDiagnosticPanel result={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('muestra el botón de generar diagnóstico cuando está expandido', () => {
    render(<AIDiagnosticPanel result={mockResult} />)
    fireEvent.click(screen.getByTestId('ai-diagnostic-panel-toggle'))
    expect(screen.getByText('Generar análisis con IA')).toBeInTheDocument()
  })

  it('llama a aiDiagnose y muestra el resultado parseado', async () => {
    const mockDiagnosis = 'DIAGNÓSTICO: Todo ok.\nACCIÓN: Ninguna.\nPRIORIDAD: Baja.'
    vi.mocked(api.aiDiagnose).mockResolvedValue({ 
      diagnosis: mockDiagnosis,
      model: 'test-model',
      tokens_used: { input: 0, output: 0, cache_write: 0, cache_read: 0 },
      cost_usd: 0
    })

    render(<AIDiagnosticPanel result={mockResult} />)
    fireEvent.click(screen.getByTestId('ai-diagnostic-panel-toggle'))
    fireEvent.click(screen.getByText('Generar análisis con IA'))

    expect(screen.getByText('Generando diagnóstico…')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('DIAGNÓSTICO:')).toBeInTheDocument()
      expect(screen.getByText('Todo ok.')).toBeInTheDocument()
      expect(screen.getByText('ACCIÓN:')).toBeInTheDocument()
      expect(screen.getByText('Ninguna.')).toBeInTheDocument()
    })
  })

  it('muestra un mensaje de error si falla la llamada', async () => {
    vi.mocked(api.aiDiagnose).mockRejectedValue(new Error('API Error'))

    render(<AIDiagnosticPanel result={mockResult} />)
    fireEvent.click(screen.getByTestId('ai-diagnostic-panel-toggle'))
    fireEvent.click(screen.getByText('Generar análisis con IA'))

    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument()
      expect(screen.getByText('Reintentar')).toBeInTheDocument()
    })
  })
})
