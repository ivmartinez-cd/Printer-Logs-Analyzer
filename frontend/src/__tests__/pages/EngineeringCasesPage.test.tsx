import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EngineeringCasesPage } from '../../pages/EngineeringCasesPage'
import * as api from '../../services/api'
import { ToastProvider } from '../../contexts/ToastContext'
import type { EngineeringCase, EngineeringCaseDetailResponse } from '../../types/api'

vi.mock('../../services/api', () => ({
  getEngineeringCases: vi.fn(),
  getEngineeringCaseDetail: vi.fn(),
  analyzeEngineeringCases: vi.fn(),
  syncEngineeringCases: vi.fn(),
  getEngineeringJobStatus: vi.fn(),
}))

const CASE_A: EngineeringCase = {
  incident_id: '900001',
  device_id: '100001',
  serial: 'MXBCT0000A',
  customer: 'Cliente Demo SA',
  monitor: 'demo1',
  model: 'HP LASERJET E50145',
  firmware: 'fw1',
  estado: 'New',
  gravedad: 'High',
  tipo: 'ExpertRules',
  codigo: 'TriagePaperPath',
  probabilidad: null,
  plazo_dias: 5,
  mediana_dias_a_fallo: null,
  creado: '2026-09-01T00:00:00Z',
  actualizado: '2026-09-01T00:00:00Z',
  analisis: null,
}

const DETAIL: EngineeringCaseDetailResponse = {
  case: CASE_A,
  detail: {
    hp_action_id: 'uuid-1',
    state: 'Open',
    available_states: ['Open', 'ClosedIgnored'],
    case_type: 'ExpertRules',
    code: 'TriagePaperPath',
    severity: 'High',
    description: 'Paper path jam.',
    more_info_url: null,
    more_info_text: null,
    related_event_codes: [],
    probability: null,
    lead_days: 5,
    median_days_to_failure: null,
    parts: [],
    total_impressions: null,
    firmware: 'fw1',
    created_at: null,
    updated_at: null,
    state_history: [],
  },
  latest_analysis: null,
  analysis_history: [],
}

describe('EngineeringCasesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.getEngineeringCases).mockResolvedValue([CASE_A])
    vi.mocked(api.getEngineeringCaseDetail).mockResolvedValue(DETAIL)
  })

  it('renderiza el header y la lista de casos', async () => {
    render(
      <ToastProvider>
        <EngineeringCasesPage />
      </ToastProvider>
    )

    expect(screen.getByText('Casos de Ingeniería')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('MXBCT0000A')).toBeInTheDocument())
    expect(screen.getByText('TriagePaperPath')).toBeInTheDocument()
  })

  it('muestra estado vacío si la carga falla', async () => {
    vi.mocked(api.getEngineeringCases).mockRejectedValue(new Error('boom'))
    render(
      <ToastProvider>
        <EngineeringCasesPage />
      </ToastProvider>
    )
    await waitFor(() => expect(screen.getByText(/No hay casos/)).toBeInTheDocument())
  })

  it('expandir una fila carga el detalle una sola vez', async () => {
    render(
      <ToastProvider>
        <EngineeringCasesPage />
      </ToastProvider>
    )
    await waitFor(() => expect(screen.getByText('MXBCT0000A')).toBeInTheDocument())

    const row = screen.getByText('MXBCT0000A').closest('tr')!
    fireEvent.click(row)
    await waitFor(() => expect(screen.getByText('Paper path jam.')).toBeInTheDocument())
    expect(api.getEngineeringCaseDetail).toHaveBeenCalledTimes(1)

    // colapsar y re-expandir no debe volver a pedir el detalle (cache)
    fireEvent.click(row)
    fireEvent.click(row)
    await waitFor(() => expect(screen.getByText('Paper path jam.')).toBeInTheDocument())
    expect(api.getEngineeringCaseDetail).toHaveBeenCalledTimes(1)
  })

  it('filtro de gravedad reduce las filas visibles', async () => {
    const caseB: EngineeringCase = { ...CASE_A, incident_id: '900002', gravedad: 'Medium', serial: 'MXBCT0000B' }
    vi.mocked(api.getEngineeringCases).mockResolvedValue([CASE_A, caseB])

    render(
      <ToastProvider>
        <EngineeringCasesPage />
      </ToastProvider>
    )
    await waitFor(() => expect(screen.getByText('MXBCT0000A')).toBeInTheDocument())
    expect(screen.getByText('MXBCT0000B')).toBeInTheDocument()

    const select = screen.getByDisplayValue('Gravedad: todas')
    fireEvent.change(select, { target: { value: 'High' } })

    expect(screen.getByText('MXBCT0000A')).toBeInTheDocument()
    expect(screen.queryByText('MXBCT0000B')).not.toBeInTheDocument()
  })
})
