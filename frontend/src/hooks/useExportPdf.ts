import { useRef, useState } from 'react'
import { useToast } from '../contexts/ToastContext'

export function useExportPdf(logFileName: string | null) {
  const [exportingPdf, setExportingPdf] = useState(false)
  const dashboardRef = useRef<HTMLDivElement>(null)
  const reportCoverRef = useRef<HTMLDivElement>(null)
  const executiveSummaryRef = useRef<HTMLDivElement>(null)
  const aiDiagnosticRef = useRef<HTMLDivElement>(null)
  const kpisRef = useRef<HTMLDivElement>(null)
  const consumableRef = useRef<HTMLDivElement>(null)
  const areaChartRef = useRef<HTMLDivElement>(null)
  const barChartRef = useRef<HTMLDivElement>(null)
  const incidentsTableRef = useRef<HTMLDivElement>(null)
  const toast = useToast()

  async function handleExportPDF(hasResult: boolean) {
    if (!hasResult) return
    setExportingPdf(true)
    
    // Forzar clase de exportación para Light Mode y expansión de paneles
    document.body.classList.add('is-exporting')
    
    try {
      // Pequeña espera para que los estilos se apliquen
      await new Promise(resolve => setTimeout(resolve, 500))

      const { jsPDF } = await import('jspdf')
      const html2canvasModule = await import('html2canvas')
      const html2canvas = html2canvasModule.default as (
        el: HTMLElement,
        opts?: object
      ) => Promise<HTMLCanvasElement>

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 14
      const contentWidth = pageWidth - margin * 2
      const maxContentHeight = pageHeight - margin * 2

      // 1. GENERAR PORTADA (Página 1)
      if (reportCoverRef.current) {
        const coverCanvas = await html2canvas(reportCoverRef.current, {
          scale: 3,
          useCORS: true,
          logging: false,
          width: 1024,
          height: 1000 // Altura fija de la portada
        })
        const coverData = coverCanvas.toDataURL('image/png')
        // La portada ocupa toda la página sin márgenes (sangrado)
        pdf.addImage(coverData, 'PNG', 0, 0, pageWidth, pageHeight)
      }

      // Función para agregar el footer ejecutivo en cada página
      const addPageFooter = (pageNum: number) => {
        pdf.setFontSize(8)
        pdf.setTextColor(150, 150, 150)
        const dateStr = new Date().toLocaleDateString('es-AR')
        
        // Línea decorativa
        pdf.setDrawColor(230, 230, 230)
        pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12)
        
        pdf.text(`HP Logs Analyzer — Reporte Técnico Confidencial`, margin, pageHeight - 8)
        pdf.text(`${dateStr} | Pág. ${pageNum}`, pageWidth - margin, pageHeight - 8, { align: 'right' })
      }

      // 2. GENERAR CONTENIDO SECCIONAL
      const aiEl = aiDiagnosticRef.current as HTMLElement | null
      const aiHasDiagnosis = !!aiEl?.querySelector('.ai-diagnostic-panel__diagnosis')

      const sections: Array<{ el: HTMLElement | null; label: string; forceNewPage?: boolean }> = [
        { el: executiveSummaryRef.current, label: 'Resumen Ejecutivo', forceNewPage: true },
        { el: aiHasDiagnosis ? aiEl : null, label: 'Diagnóstico IA', forceNewPage: false },
        { el: consumableRef.current, label: 'Estado de Consumibles', forceNewPage: false },
        { el: areaChartRef.current, label: 'Tendencia de Incidentes', forceNewPage: true },
        { el: barChartRef.current, label: 'Distribución de Errores', forceNewPage: false },
        { el: incidentsTableRef.current, label: 'Detalle de Incidencias', forceNewPage: true },
      ]

      let currentPage = 1
      let yPos = margin

      for (const section of sections) {
        if (!section.el) continue

        // Capturar sección
        const canvas = await html2canvas(section.el, { 
          scale: 3, 
          useCORS: true, 
          logging: false,
          width: 1024,
          onclone: (clonedDoc: Document) => {
            clonedDoc.body.classList.add('is-exporting')
          }
        })

        const imgData = canvas.toDataURL('image/png')
        if (imgData === 'data:,' || canvas.width === 0 || canvas.height === 0) continue

        const imgWidthPx = canvas.width
        const imgHeightPx = canvas.height
        const ratio = contentWidth / imgWidthPx
        const sectionHeightMm = imgHeightPx * ratio

        // Decidir si saltar de página
        const shouldAddPage = section.forceNewPage || (yPos + sectionHeightMm > pageHeight - margin - 15)

        if (shouldAddPage) {
          pdf.addPage()
          currentPage++
          addPageFooter(currentPage)
          yPos = margin
        } else if (currentPage === 1 && reportCoverRef.current) {
          // Si estamos después de la portada y no hemos saltado, saltamos ahora
          pdf.addPage()
          currentPage++
          addPageFooter(currentPage)
          yPos = margin
        }

        // Si la sección es MUY larga (ej. tabla), hay que rebanarla
        if (sectionHeightMm > maxContentHeight - 15) {
          let remainingHeightPx = imgHeightPx
          let currentSourceY = 0

          while (remainingHeightPx > 0) {
            const availableHeightMm = pageHeight - margin - 15 - yPos
            const availableHeightPx = availableHeightMm / ratio
            
            const sliceHeightPx = Math.min(remainingHeightPx, availableHeightPx)
            const sliceHeightMm = sliceHeightPx * ratio

            const sliceCanvas = document.createElement('canvas')
            sliceCanvas.width = imgWidthPx
            sliceCanvas.height = sliceHeightPx
            const ctx = sliceCanvas.getContext('2d')
            if (ctx) {
              ctx.drawImage(canvas, 0, currentSourceY, imgWidthPx, sliceHeightPx, 0, 0, imgWidthPx, sliceHeightPx)
              const sliceData = sliceCanvas.toDataURL('image/png')
              pdf.addImage(sliceData, 'PNG', margin, yPos, contentWidth, sliceHeightMm)
            }

            remainingHeightPx -= sliceHeightPx
            currentSourceY += sliceHeightPx
            yPos += sliceHeightMm

            if (remainingHeightPx > 0) {
              pdf.addPage()
              currentPage++
              addPageFooter(currentPage)
              yPos = margin
            }
          }
          yPos += 10
        } else {
          // Caso normal
          pdf.addImage(imgData, 'PNG', margin, yPos, contentWidth, sectionHeightMm)
          yPos += sectionHeightMm + 10
        }
      }

      const fileName = logFileName
        ? `Reporte_Tecnico_${logFileName.replace(/\.[^.]+$/, '')}.pdf`
        : 'Reporte_HP_Logs_Analyzer.pdf'
      
      pdf.save(fileName)
      toast.showSuccess('Reporte generado con éxito')
    } catch (err) {
      console.error('Error al exportar PDF:', err)
      toast.showError('Error al generar el PDF de alta calidad')
    } finally {
      document.body.classList.remove('is-exporting')
      setExportingPdf(false)
    }
  }

  return {
    exportingPdf,
    handleExportPDF,
    dashboardRef,
    reportCoverRef,
    executiveSummaryRef,
    aiDiagnosticRef,
    kpisRef,
    consumableRef,
    areaChartRef,
    barChartRef,
    incidentsTableRef,
  }
}
