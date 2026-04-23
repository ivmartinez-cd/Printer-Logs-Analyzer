import { renderHook, act } from '@testing-library/react'
import { useExportPdf } from '../../hooks/useExportPdf'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock de useToast
vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}))

describe('useExportPdf', () => {
  let mockWindowOpen: any
  let mockDocument: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockDocument = {
      open: vi.fn(),
      write: vi.fn(),
      close: vi.fn(),
      title: '',
    }
    const mockWindow = {
      document: mockDocument,
      focus: vi.fn(),
      print: vi.fn(),
      close: vi.fn(),
      closed: false,
    }
    mockWindowOpen = vi.spyOn(window, 'open').mockReturnValue(mockWindow as any)
  })

  it('debe abrir la ventana inmediatamente y luego llamar a onBeforePrint', async () => {
    const { result } = renderHook(() => useExportPdf('test.log'))
    const onBeforePrint = vi.fn().mockImplementation(async () => {
      // Simular delay de la IA
      await new Promise(r => setTimeout(r, 10))
    })

    // Mock printReportRef (usamos cast a any para poder asignar en el test)
    ;(result.current.printReportRef as any).current = document.createElement('div')
    result.current.printReportRef.current!.innerHTML = '<h1>Reporte de Prueba</h1>'

    await act(async () => {
      await result.current.handleExportPDF(true, onBeforePrint)
    })

    // 1. Validar que onBeforePrint se ejecuto
    expect(onBeforePrint).toHaveBeenCalled()

    // 2. Validar que window.open se llamo DESPUES de onBeforePrint
    expect(mockWindowOpen).toHaveBeenCalled()
    
    // 3. Validar que se escribio el contenido del reporte
    expect(mockDocument.write).toHaveBeenCalledWith(expect.stringContaining('<h1>Reporte de Prueba</h1>'))
  })

  it('debe cerrar la ventana si no hay resultados para exportar', async () => {
    const { result } = renderHook(() => useExportPdf(null))
    
    await act(async () => {
      await result.current.handleExportPDF(false)
    })

    expect(mockWindowOpen).not.toHaveBeenCalled()
  })
})
