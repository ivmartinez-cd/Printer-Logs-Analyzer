import { forwardRef, useState, useEffect } from 'react'
import { aiDiagnose } from '../services/api'
import type { ParseLogsResponse } from '../types/api'

interface AIDiagnosticPanelProps {
  result: ParseLogsResponse | null
}

// Parsea el texto "DIAGNÓSTICO: ...\nACCIÓN: ...\nPRIORIDAD: ..." en secciones.
// Retorna null si el formato no matchea (fallback a texto crudo).
function parseDiagnosis(text: string): { label: string; content: string }[] | null {
  // Strippear asteriscos dobles de cada línea por si el modelo usa markdown
  // a pesar de la instrucción explícita de no hacerlo
  const sanitized = text
    .split('\n')
    .map((line) => line.replace(/\*\*/g, '').trim())
    .join('\n')
  const regex = /(DIAGNÓSTICO|ACCIÓN|PRIORIDAD):\s*([\s\S]*?)(?=\n(?:DIAGNÓSTICO|ACCIÓN|PRIORIDAD):|$)/g
  const sections: { label: string; content: string }[] = []
  let match: RegExpExecArray | null
  while ((match = regex.exec(sanitized)) !== null) {
    sections.push({ label: match[1], content: match[2].trim() })
  }
  // Necesitamos al menos DIAGNÓSTICO y ACCIÓN para considerar el parseo exitoso
  return sections.length >= 2 ? sections : null
}

export const AIDiagnosticPanel = forwardRef<HTMLDivElement, AIDiagnosticPanelProps>(
  function AIDiagnosticPanel({ result }, ref) {
    const [diagnosis, setDiagnosis] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [collapsed, setCollapsed] = useState(true)

    // Resetear el diagnóstico cuando el usuario analiza un nuevo log
    useEffect(() => {
      setDiagnosis(null)
      setError(null)
    }, [result])

    // No renderizar si no hay resultado analizado
    if (!result) return null

    async function handleGenerate() {
      if (!result || loading) return
      setLoading(true)
      setError(null)
      try {
        const res = await aiDiagnose(result)
        setDiagnosis(res.diagnosis)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al generar el diagnóstico')
      } finally {
        setLoading(false)
      }
    }

    const sections = diagnosis ? parseDiagnosis(diagnosis) : null

    return (
      <div className="collapsible-panel collapsible-panel--ai" ref={ref}>
        <button
          type="button"
          className="collapsible-panel__header"
          onClick={() => setCollapsed((v) => !v)}
          aria-expanded={!collapsed}
        >
          <span className="collapsible-panel__title">🤖 Diagnóstico con IA</span>
          <span
            className={`collapsible-panel__chevron${!collapsed ? ' collapsible-panel__chevron--expanded' : ''}`}
            aria-hidden="true"
          >
            ▶
          </span>
        </button>

        <div className={`ai-diagnostic-panel__content ${collapsed ? 'collapsible-panel__body--hidden' : ''}`}>
          {/* Estado inicial: CTA para generar el diagnóstico */}
          {!diagnosis && !loading && !error && (
            <div className="ai-diagnostic-panel__cta-wrapper">
              <p className="ai-diagnostic-panel__button-description">
                Obtené un diagnóstico detallado con correlaciones temporales y recomendación
                accionable.
              </p>
              <button
                type="button"
                className="ai-diagnostic-panel__button"
                onClick={() => void handleGenerate()}
              >
                Generar análisis con IA
              </button>
            </div>
          )}

          {/* Estado de carga */}
          {loading && (
            <div className="ai-diagnostic-panel__loading">
              <span className="ai-diagnostic-panel__spinner" aria-hidden="true" />
              <span>Generando diagnóstico…</span>
            </div>
          )}

          {/* Estado de error con botón de reintento */}
          {error && !loading && (
            <div className="ai-diagnostic-panel__error">
              <span>{error}</span>
              <button
                type="button"
                className="ai-diagnostic-panel__retry-button"
                onClick={() => void handleGenerate()}
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Estado de éxito: diagnóstico parseado o texto crudo */}
          {diagnosis && !loading && (
            <div className="ai-diagnostic-panel__diagnosis">
              {sections ? (
                sections.map((s) => (
                  <div key={s.label} className="ai-diagnostic-panel__diagnosis-section">
                    <span className="ai-diagnostic-panel__diagnosis-label">{s.label}: </span>
                    <span>{s.content}</span>
                  </div>
                ))
              ) : (
                // Fallback si el parseo de etiquetas falla
                <pre className="ai-diagnostic-panel__diagnosis-raw">{diagnosis}</pre>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }
)
