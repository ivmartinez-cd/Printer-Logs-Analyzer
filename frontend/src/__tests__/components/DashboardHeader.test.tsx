// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DashboardHeader } from '../../components/DashboardHeader'

afterEach(cleanup)

// LiveClock y DbStatusBadge son funciones locales en DashboardHeader.tsx (no se exportan),
// así que no hay módulo externo que mockear — se renderizan directamente.

const defaultProps = {
  logFileName: null,
  healthStatus: null,
  hasResult: false,
  exportingPdf: false,
  onOpenSavedList: vi.fn(),
  onAnalyzeNew: vi.fn(),
  onSaveIncident: vi.fn(),
  onExportPdf: vi.fn(),
  onHelp: vi.fn(),
}

describe('DashboardHeader', () => {
  it('renderiza el título "HP Logs Analyzer"', () => {
    render(<DashboardHeader {...defaultProps} />)
    expect(screen.getByText('HP Logs Analyzer')).toBeInTheDocument()
  })

  it('muestra logFileName cuando está disponible', () => {
    render(<DashboardHeader {...defaultProps} logFileName="ejemplo.txt" />)
    expect(screen.getByText('ejemplo.txt')).toBeInTheDocument()
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
    const onExportPdf = vi.fn()
    const onHelp = vi.fn()

    const user = userEvent.setup()
    render(
      <DashboardHeader
        {...defaultProps}
        hasResult={true}
        onOpenSavedList={onOpenSavedList}
        onAnalyzeNew={onAnalyzeNew}
        onSaveIncident={onSaveIncident}
        onExportPdf={onExportPdf}
        onHelp={onHelp}
      />
    )

    await user.click(screen.getByText('Incidentes guardados'))
    expect(onOpenSavedList).toHaveBeenCalledOnce()

    await user.click(screen.getByText('Analizar otro log'))
    expect(onAnalyzeNew).toHaveBeenCalledOnce()

    await user.click(screen.getByText('Guardar incidente'))
    expect(onSaveIncident).toHaveBeenCalledOnce()

    await user.click(screen.getByText('Exportar PDF'))
    expect(onExportPdf).toHaveBeenCalledOnce()

    await user.click(screen.getByLabelText('Ayuda — ¿Cómo funciona?'))
    expect(onHelp).toHaveBeenCalledOnce()
  })
})
