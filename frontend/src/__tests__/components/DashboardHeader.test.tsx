// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DashboardHeader } from '../../components/DashboardHeader'

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'welcome.title': 'Monitor de Diagnóstico HP',
        'header.history': 'Historial',
        'header.new_analysis': 'Nuevo Análisis',
        'header.save': 'Guardar',
        'header.sds': 'SDS',
        'header.export_pdf': 'Exportar PDF',
        'header.help': 'Ayuda'
      }
      return translations[key] || key
    },
  }),
}))

afterEach(cleanup)

const defaultProps = {
  healthStatus: null,
  hasResult: false,
  exportingPdf: false,
  onOpenSavedList: vi.fn(),
  onAnalyzeNew: vi.fn(),
  onSaveIncident: vi.fn(),
  onAddSds: vi.fn(),
  onExportPdf: vi.fn(),
  onHelp: vi.fn(),
}

describe('DashboardHeader', () => {
  it('renderiza el título actualizado según el plan premium', () => {
    render(<DashboardHeader {...defaultProps} />)
    expect(screen.getByText('Monitor de Diagnóstico HP')).toBeInTheDocument()
  })

  it('botón "Exportar PDF" solo aparece cuando hasResult es true', () => {
    const { rerender } = render(<DashboardHeader {...defaultProps} hasResult={false} />)
    expect(screen.queryByText('Exportar PDF')).not.toBeInTheDocument()

    rerender(<DashboardHeader {...defaultProps} hasResult={true} />)
    expect(screen.getByText('Exportar PDF')).toBeInTheDocument()
  })

  it('click en botones dispara los callbacks correctos', async () => {
    const onOpenSavedList = vi.fn()
    const onAnalyzeNew = vi.fn()
    const onSaveIncident = vi.fn()
    const onAddSds = vi.fn()
    const onHelp = vi.fn()

    const user = userEvent.setup()
    render(
      <DashboardHeader
        {...defaultProps}
        hasResult={true}
        onOpenSavedList={onOpenSavedList}
        onAnalyzeNew={onAnalyzeNew}
        onSaveIncident={onSaveIncident}
        onAddSds={onAddSds}
        onHelp={onHelp}
      />
    )

    await user.click(screen.getByText('Historial'))
    expect(onOpenSavedList).toHaveBeenCalledOnce()

    await user.click(screen.getByText('Nuevo Análisis'))
    expect(onAnalyzeNew).toHaveBeenCalledOnce()

    await user.click(screen.getByText('Guardar'))
    expect(onSaveIncident).toHaveBeenCalledOnce()

    await user.click(screen.getByText('SDS'))
    expect(onAddSds).toHaveBeenCalledOnce()

    await user.click(screen.getByTitle('Ayuda'))
    expect(onHelp).toHaveBeenCalledOnce()
  })
})
