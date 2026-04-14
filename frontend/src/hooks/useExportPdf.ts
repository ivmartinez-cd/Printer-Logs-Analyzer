import { useRef, useState } from 'react'
import { useToast } from '../contexts/ToastContext'

export function useExportPdf(logFileName: string | null) {
  const [exportingPdf, setExportingPdf] = useState(false)
  const dashboardRef = useRef<HTMLDivElement>(null)
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
      // Pequeña espera para que los estilos se apliquen y los charts se redibujen si es necesario
      await new Promise(resolve => setTimeout(resolve, 300))

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

      let yPos = margin

      // Función para agregar el header personalizado en cada página
      const addPageHeader = (pageNum: number) => {
        pdf.setFontSize(10)
        pdf.setTextColor(100, 100, 100)
        const dateStr = new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
        pdf.text('HP Logs Analyzer — Reporte Técnico', margin, margin - 5)
        pdf.text(`${dateStr} | Pág. ${pageNum}`, pageWidth - margin, margin - 5, { align: 'right' })
        pdf.setDrawColor(200, 200, 200)
        pdf.line(margin, margin - 3, pageWidth - margin, margin - 3)
      }

      // El panel de IA va solo si tiene contenido
      const aiEl = aiDiagnosticRef.current as HTMLElement | null
      const aiHasDiagnosis = !!aiEl?.querySelector('.ai-diagnostic-panel__diagnosis')

      const sections: Array<{ el: HTMLElement | null; label: string }> = [
        { el: executiveSummaryRef.current, label: 'Resumen ejecutivo' },
        { el: aiHasDiagnosis ? aiEl : null, label: 'Diagnóstico IA' },
        { el: consumableRef.current, label: 'Consumibles' },
        { el: areaChartRef.current, label: 'Volumen de Incidentes' },
        { el: barChartRef.current, label: 'Top Errores' },
        { el: incidentsTableRef.current, label: 'Detalle de Incidencias' },
      ]

      let currentPage = 1
      addPageHeader(currentPage)

      for (const section of sections) {
        if (!section.el) continue

        // Capturar la sección a un ancho fijo de 1024px para consistencia sonora
        const canvas = await html2canvas(section.el, { 
          scale: 2, 
          useCORS: true, 
          logging: false,
          width: 1024,
          onclone: (clonedDoc: Document) => {
            // Asegurar que el clon tenga la clase para estilos Light
            clonedDoc.body.classList.add('is-exporting')
          }
        })

        const imgData = canvas.toDataURL('image/png')
        if (imgData === 'data:,' || canvas.width === 0 || canvas.height === 0) continue;
        const imgWidthPx = canvas.width
        const imgHeightPx = canvas.height
        
        // Ratio para convertir de pixeles de canvas a mm de PDF
        const ratio = contentWidth / imgWidthPx
        const sectionHeightMm = imgHeightPx * ratio

        // Si la sección no entra en lo que queda de página
        if (yPos + sectionHeightMm > pageHeight - margin) {
          
          // Si la sección es más pequeña que una página entera, simplemente saltamos de página
          if (sectionHeightMm <= maxContentHeight) {
            pdf.addPage()
            currentPage++
            addPageHeader(currentPage)
            yPos = margin
          } else {
            // SI ES MÁS LARGA QUE UNA PÁGINA (ej. tabla gigante), hay que "rebanarla"
            let remainingHeightPx = imgHeightPx
            let currentSourceY = 0

            while (remainingHeightPx > 0) {
              const availableHeightMm = pageHeight - margin - yPos
              const availableHeightPx = availableHeightMm / ratio
              
              const sliceHeightPx = Math.min(remainingHeightPx, availableHeightPx)
              const sliceHeightMm = sliceHeightPx * ratio

              // Creamos un canvas temporal para la rebanada
              const sliceCanvas = document.createElement('canvas')
              sliceCanvas.width = imgWidthPx
              sliceCanvas.height = sliceHeightPx
              const ctx = sliceCanvas.getContext('2d')
              if (ctx) {
                ctx.drawImage(
                  canvas, 
                  0, currentSourceY, imgWidthPx, sliceHeightPx, 
                  0, 0, imgWidthPx, sliceHeightPx
                )
                const sliceData = sliceCanvas.toDataURL('image/png')
                pdf.addImage(sliceData, 'PNG', margin, yPos, contentWidth, sliceHeightMm)
              }

              remainingHeightPx -= sliceHeightPx
              currentSourceY += sliceHeightPx
              yPos += sliceHeightMm

              if (remainingHeightPx > 0) {
                pdf.addPage()
                currentPage++
                addPageHeader(currentPage)
                yPos = margin
              }
            }
            yPos += 4 // pequeño gap tras la sección rebanada
            continue // saltamos al siguiente elemento
          }
        }

        // Caso normal (o inicio de nueva página tras salto)
        pdf.addImage(imgData, 'PNG', margin, yPos, contentWidth, sectionHeightMm)
        yPos += sectionHeightMm + 8
      }

      const fileName = logFileName
        ? `reporte-${logFileName.replace(/\.[^.]+$/, '')}.pdf`
        : 'reporte-hp-logs.pdf'
      pdf.save(fileName)
    } catch (err) {
      console.error('Error al exportar PDF:', err)
      toast.showError('Error al generar el PDF')
    } finally {
      document.body.classList.remove('is-exporting')
      setExportingPdf(false)
    }
  }

  return {
    exportingPdf,
    handleExportPDF,
    dashboardRef,
    executiveSummaryRef,
    aiDiagnosticRef,
    kpisRef,
    consumableRef,
    areaChartRef,
    barChartRef,
    incidentsTableRef,
  }
}
