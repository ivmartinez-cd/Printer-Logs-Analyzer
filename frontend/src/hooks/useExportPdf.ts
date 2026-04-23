import { useRef, useState } from 'react'
import { useToast } from '../contexts/ToastContext'

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildHeadMarkup(title: string) {
  const styleNodes = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
  const stylesMarkup = styleNodes
    .map((node) => {
      if (node.tagName === 'LINK') {
        const link = node as HTMLLinkElement
        return `<link rel="stylesheet" href="${escapeHtml(link.href)}">`
      }

      return node.outerHTML
    })
    .join('\n')

  return `
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <base href="${escapeHtml(document.baseURI)}">
    ${stylesMarkup}
    <style>
      @page {
        size: A4 portrait;
        margin: 0;
      }

      html,
      body {
        margin: 0;
        padding: 0;
        background: #e2e8f0;
      }

      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .print-shell {
        min-height: 100vh;
        display: flex;
        justify-content: center;
        padding: 16px 0;
        box-sizing: border-box;
      }

      @media print {
        html,
        body {
          background: #ffffff;
        }

        .print-shell {
          padding: 0;
        }
      }
    </style>
  `
}

async function waitForImages(doc: Document) {
  const images = Array.from(doc.images).filter((img) => !img.complete)
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          img.addEventListener('load', () => resolve(), { once: true })
          img.addEventListener('error', () => resolve(), { once: true })
        })
    )
  )
}

async function waitForPrintReady(printWindow: Window) {
  const fonts = printWindow.document.fonts
  if (fonts?.ready) {
    try {
      await fonts.ready
    } catch {
      // Ignore font loading failures and continue with system fallbacks.
    }
  }

  await waitForImages(printWindow.document)

  await new Promise<void>((resolve) => {
    printWindow.requestAnimationFrame(() => {
      printWindow.requestAnimationFrame(() => resolve())
    })
  })
}

export function useExportPdf(logFileName: string | null) {
  const [exportingPdf, setExportingPdf] = useState(false)
  const dashboardRef = useRef<HTMLDivElement>(null)
  const printReportRef = useRef<HTMLDivElement>(null)
  const toast = useToast()

  async function handleExportPDF(hasResult: boolean, onBeforePrint?: () => Promise<void>) {
    if (!hasResult) return

    setExportingPdf(true)

    try {
      if (onBeforePrint) {
        await onBeforePrint()
      }

      const reportMarkup = printReportRef.current?.outerHTML
      if (!reportMarkup) {
        toast.showError('No se pudo preparar el reporte ejecutivo')
        return
      }

      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        toast.showError('El navegador bloqueo la ventana emergente. Por favor, permite popups para este sitio.')
        return
      }

      const fileStem = logFileName ? logFileName.replace(/\.[^.]+$/, '') : 'HP_Logs_Analyzer'
      const title = `Reporte_Ejecutivo_${fileStem}`

      printWindow.document.open()
      printWindow.document.write(`<!doctype html>
        <html lang="es">
          <head>${buildHeadMarkup(title)}</head>
          <body>
            <main class="print-shell">${reportMarkup}</main>
          </body>
        </html>`)
      printWindow.document.close()
      printWindow.document.title = title

      await waitForPrintReady(printWindow)

      printWindow.focus()
      printWindow.print()
      printWindow.onafterprint = () => {
        setTimeout(() => {
          if (printWindow && !printWindow.closed) {
            printWindow.close()
          }
        }, 150)
      }

      toast.showSuccess('Vista de impresion lista')
    } catch (error) {
      console.error('Error al preparar el reporte ejecutivo:', error)
      toast.showError('Error al preparar el PDF para impresion')
    } finally {
      setExportingPdf(false)
    }
  }

  return {
    exportingPdf,
    handleExportPDF,
    dashboardRef,
    printReportRef,
  }
}
