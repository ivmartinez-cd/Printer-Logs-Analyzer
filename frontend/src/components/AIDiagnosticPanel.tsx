import { forwardRef, useState, useEffect } from 'react'
import { aiDiagnose } from '../services/api'
import type { ParseLogsResponse, RealtimeConsumable, DeviceAlertsResponse, InsightMeter } from '../types/api'

interface AIDiagnosticPanelProps {
  result: ParseLogsResponse | null
  consumables?: RealtimeConsumable[]
  alerts?: DeviceAlertsResponse | null
  meters?: InsightMeter[]
}

// Parsea el texto "DIAGNÓSTICO: ...\nACCIÓN: ...\nPRIORIDAD: ..." en secciones.
// Retorna null si el formato no matchea (fallback a texto crudo).
interface DiagnosisData {
  diagnostico: string
  acciones: string[]
  prioridad: 'alta' | 'media' | 'baja'
  impacto?: string
}

function parseDiagnosis(text: string): DiagnosisData | null {
  try {
    // Intentar parsear como JSON directo
    const cleaned = text.trim()
    if (cleaned.startsWith('{')) {
      return JSON.parse(cleaned) as DiagnosisData
    }
  } catch (e) {
    console.warn('Failed to parse AI diagnosis as JSON:', e)
  }

  // Fallback: Si no es JSON, intentar parsear etiquetas (legacy)
  const regex = /(DIAGNÓSTICO|ACCIÓN|PRIORIDAD):\s*([\s\S]*?)(?=\n(?:DIAGNÓSTICO|ACCIÓN|PRIORIDAD):|$)/g
  const data: Partial<DiagnosisData> = { acciones: [] }
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    const key = match[1]
    const content = match[2].trim()
    if (key === 'DIAGNÓSTICO') data.diagnostico = content
    if (key === 'ACCIÓN') data.acciones = content.split('. ').filter(s => s.length > 5)
    if (key === 'PRIORIDAD') data.prioridad = content.toLowerCase() as any
  }

  return data.diagnostico ? (data as DiagnosisData) : null
}

export const AIDiagnosticPanel = forwardRef<HTMLDivElement, AIDiagnosticPanelProps>(
  function AIDiagnosticPanel({ result, consumables, alerts, meters }, ref) {
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
        const res = await aiDiagnose(result, { consumables, alerts, meters })
        setDiagnosis(res.diagnosis)
        setCollapsed(false) // Expandir automáticamente cuando se genera
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al generar el diagnóstico')
      } finally {
        setLoading(false)
      }
    }

    const data = diagnosis ? parseDiagnosis(diagnosis) : null

    return (
      <div className="collapsible-panel collapsible-panel--ai" ref={ref}>
        <button
          type="button"
          className="collapsible-panel__header"
          onClick={() => setCollapsed((v) => !v)}
          aria-expanded={!collapsed}
          data-testid="ai-diagnostic-panel-toggle"
        >
          <div className="ai-diagnostic-panel__header-left">
            <span className="collapsible-panel__title">🤖 Diagnóstico con IA</span>
            {data && !collapsed && (
              <span className={`ai-priority-badge ai-priority-badge--${data.prioridad}`}>
                Prioridad {data.prioridad}
              </span>
            )}
          </div>
          <span
            className={`collapsible-panel__chevron${!collapsed ? ' collapsible-panel__chevron--expanded' : ''}`}
            aria-hidden="true"
          >
            ▶
          </span>
        </button>

        <div className={`ai-diagnostic-panel__content ${collapsed ? 'collapsible-panel__body--hidden' : ''}`}>
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

          {loading && (
            <div className="ai-diagnostic-panel__loading">
              <span className="ai-diagnostic-panel__spinner" aria-hidden="true" />
              <span>Generando diagnóstico…</span>
            </div>
          )}

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

          {data && !loading && (
            <div className="ai-diagnostic-result">
              <div className="ai-diagnostic-result__diagnosis-card">
                <h4 className="ai-diagnostic-result__section-title">
                  <span className="ai-diagnostic-result__icon">🔍</span>
                  Hallazgos del Sistema
                </h4>
                <p className="ai-diagnostic-result__text">{data.diagnostico}</p>
                {data.impacto && (
                  <div className="ai-diagnostic-result__impact">
                    <strong>Impacto estimado:</strong> {data.impacto}
                  </div>
                )}
              </div>

              <div className="ai-diagnostic-result__actions-card">
                <h4 className="ai-diagnostic-result__section-title">
                  <span className="ai-diagnostic-result__icon">🔧</span>
                  Pasos a Seguir
                </h4>
                <ul className="ai-diagnostic-result__actions-list">
                  {data.acciones.map((accion, idx) => (
                    <li key={idx} className="ai-diagnostic-result__action-item">
                      <span className="ai-diagnostic-result__action-number">{idx + 1}</span>
                      <span className="ai-diagnostic-result__action-text">{accion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {diagnosis && !data && !loading && (
            // Fallback total si falla el parseo
            <pre className="ai-diagnostic-panel__diagnosis-raw">{diagnosis}</pre>
          )}
        </div>
      </div>
    )

  }
)
