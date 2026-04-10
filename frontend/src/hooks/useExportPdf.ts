import { useRef, useState } from 'react'
import { useToast } from '../contexts/ToastContext'

export function useExportPdf(logFileName: string | null) {
  const [exportingPdf, setExportingPdf] = useState(false)
  const aiDiagnosticRef = useRef<HTMLDivElement>(null)
  const kpisRef = useRef<HTMLDivElement>(null)
  const barChartRef = useRef<HTMLDivElement>(null)
  const incidentsTableRef = useRef<HTMLDivElement>(null)
  const toast = useToast()

  async function handleExportPDF(hasResult: boolean) {
    if (!hasResult) return
    setExportingPdf(true)
    try {
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

      pdf.setFontSize(16)
      pdf.setTextColor(30, 30, 30)
      pdf.text('HP Logs Analyzer — Reporte de análisis', margin, margin + 6)
      pdf.setFontSize(9)
      pdf.setTextColor(100, 100, 100)
      const dateStr = new Date().toLocaleString('es-AR', { dateStyle: 'long', timeStyle: 'short' })
      pdf.text(`Generado: ${dateStr}`, margin, margin + 13)
      if (logFileName) pdf.text(`Archivo: ${logFileName}`, margin, margin + 19)

      let yPos = margin + 28

      // El panel de IA va primero en el PDF solo si el diagnóstico ya fue generado.
      // Se detecta buscando el contenedor .ai-diagnostic-panel__diagnosis como descendiente.
      const aiEl = aiDiagnosticRef.current as HTMLElement | null
      const aiHasDiagnosis = !!aiEl?.querySelector('.ai-diagnostic-panel__diagnosis')

      const sections: Array<HTMLElement | null> = [
        aiHasDiagnosis ? aiEl : null,
        kpisRef.current,
        barChartRef.current,
        incidentsTableRef.current,
      ]

      for (const el of sections) {
        if (!el) continue
        const canvas = await html2canvas(el, { scale: 2, useCORS: true, logging: false })
        const imgData = canvas.toDataURL('image/png')
        const imgH = (canvas.height / canvas.width) * contentWidth
        if (yPos + imgH > pageHeight - margin) {
          pdf.addPage()
          yPos = margin
        }
        pdf.addImage(imgData, 'PNG', margin, yPos, contentWidth, imgH)
        yPos += imgH + 6
      }

      const fileName = logFileName
        ? `reporte-${logFileName.replace(/\.[^.]+$/, '')}.pdf`
        : 'reporte-hp-logs.pdf'
      pdf.save(fileName)
    } catch (err) {
      console.error('Error al exportar PDF:', err)
      toast.showError('Error al generar el PDF')
    } finally {
      setExportingPdf(false)
    }
  }

  return {
    exportingPdf,
    handleExportPDF,
    aiDiagnosticRef,
    kpisRef,
    barChartRef,
    incidentsTableRef,
  }
}
