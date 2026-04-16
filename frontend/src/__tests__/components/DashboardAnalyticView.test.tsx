import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DashboardAnalyticView } from '../../components/dashboard/DashboardAnalyticView'

// Mock de sub-componentes pesados/complejos
vi.mock('../IncidentsChart', () => ({ IncidentsChart: () => <div data-testid="chart">Chart</div> }))
vi.mock('../TopErrorsChart', () => ({ TopErrorsChart: () => <div data-testid="chart">TopErrors</div> }))
vi.mock('../KPICards', () => ({ KPICards: () => <div data-testid="kpi">KPIs</div> }))
vi.mock('../AIDiagnosticPanel', () => ({ AIDiagnosticPanel: vi.fn(() => <div data-testid="ai-panel">AI</div>) }))
vi.mock('../ExecutiveSummary', () => ({ ExecutiveSummary: () => <div data-testid="exec-sum">ExecSummary</div> }))

describe('DashboardAnalyticView', () => {
  const mockResult = {
    events: [],
    incidents: [],
    log_start_date: '2026-04-01',
    log_end_date: '2026-04-15',
    errors: []
  }

  const defaultProps: any = {
    result: mockResult,
    codesNew: [],
    setCodesNew: vi.fn(),
    activeFilter: 'all',
    dateFilter: { reset: vi.fn(), setSelectedDate: vi.fn(), setSelectedWeekRange: vi.fn() },
    dateRange: { minDate: '2026-04-01', maxDate: '2026-04-15' },
    realtimeConsumables: [],
    lastErrorLabel: 'Hace 2 horas',
    lastErrorEvent: null,
    currentModelName: 'HP LaserJet E60055',
    currentSerialNumber: 'ABC12345',
    logFileName: 'test.log',
    currentModelHasCpmd: true,
    insightData: { data: [], loading: false, error: null },
    sdsIncident: null,
    incidentRows: [],
    visibleSeverities: new Set(['ERROR']),
    setVisibleSeverities: vi.fn(),
    filteredIncidents: [],
    filteredEvents: [],
    onSaveCodeToCatalog: vi.fn(),
    onEditCode: vi.fn(),
    onViewSolution: vi.fn(),
    refs: {
      executiveSummaryRef: { current: null },
      kpisRef: { current: null },
      aiDiagnosticRef: { current: null },
      consumableRef: { current: null },
      areaChartRef: { current: null },
      barChartRef: { current: null },
      incidentsTableRef: { current: null },
    },
    savingCode: false,
    addCodeModalCode: null,
    setAddCodeModalCode: vi.fn(),
    editCodeInitial: null,
    setEditCodeInitial: vi.fn()
  }

  it('debe renderizar el título del panel de errores con el modelo', () => {
    render(<DashboardAnalyticView {...defaultProps} />)
    expect(screen.getByText(/Panel de errores/)).toBeInTheDocument()
    expect(screen.getByText(/HP LaserJet E60055/)).toBeInTheDocument()
  })

  it('debe mostrar el banner de errores de parseo si existen', () => {
    const propsWithErrors = {
      ...defaultProps,
      result: {
        ...mockResult,
        errors: [{ line_number: 1, raw_line: 'bad line', reason: 'invalid format' }]
      }
    }
    render(<DashboardAnalyticView {...propsWithErrors} />)
    expect(screen.getByText(/Se omitieron 1 líneas/)).toBeInTheDocument()
  })

  it('debe mostrar la sección de códigos nuevos si los hay', () => {
    const propsWithNewCodes = {
      ...defaultProps,
      codesNew: ['41.03.01']
    }
    render(<DashboardAnalyticView {...propsWithNewCodes} />)
    expect(screen.getByText(/Se detectaron/)).toBeInTheDocument()
    expect(screen.getByText('41.03.01')).toBeInTheDocument()
  })
})
