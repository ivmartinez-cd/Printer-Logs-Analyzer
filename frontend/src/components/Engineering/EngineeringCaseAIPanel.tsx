import { Spinner } from '../ui/Spinner'
import { AIDiagnosticSkeleton } from '../Analysis/AIDiagnosticSkeleton'
import type { EngineeringCaseAnalysis } from '../../types/api'

interface EngineeringCaseAIPanelProps {
  analysis: EngineeringCaseAnalysis | null
  loading: boolean
  error: string | null
  onGenerate: () => void
}

const VERDICT_LABEL: Record<string, string> = {
  accionar: 'Accionar',
  monitorear: 'Monitorear',
  descartar: 'Descartar',
}

const VERDICT_ICON: Record<string, string> = {
  accionar: '🔧',
  monitorear: '👁️',
  descartar: '✅',
}

const VERDICT_CLASS: Record<string, string> = {
  accionar: 'ai-diagnostic-result__despacho ai-diagnostic-result__despacho--si',
  monitorear: 'ai-diagnostic-result__despacho ai-diagnostic-result__despacho--remoto',
  descartar: 'ai-diagnostic-result__despacho ai-diagnostic-result__despacho--no',
}

const EVIDENCE_LABEL: Record<string, string> = {
  corrobora: 'Los logs del equipo corroboran el caso',
  contradice: 'Los logs contradicen el caso',
  sin_evidencia: 'Sin evidencia en los logs',
}

const PRIORIDAD_CLASS: Record<string, string> = {
  llevar: 'eng-badge eng-badge--llevar',
  opcional: 'eng-badge eng-badge--opcional',
  no_llevar: 'eng-badge eng-badge--no_llevar',
}

export function EngineeringCaseAIPanel({
  analysis,
  loading,
  error,
  onGenerate,
}: EngineeringCaseAIPanelProps) {
  return (
    <div className="collapsible-panel collapsible-panel--ai eng-ai-panel">
      {!analysis && !loading && !error && (
        <div className="ai-diagnostic-panel__cta-wrapper">
          <p className="ai-diagnostic-panel__button-description">
            Cruza el caso contra el artículo de HP, los event logs del equipo y el historial de
            servicio para decidir si amerita una visita.
          </p>
          <button type="button" className="ai-diagnostic-panel__button" onClick={onGenerate}>
            Analizar con IA
          </button>
        </div>
      )}

      {loading && (
        <div className="ai-diagnostic-panel__loading-container">
          <Spinner size={22} />
          <span className="ai-diagnostic-panel__loading-text">Analizando el caso...</span>
          <AIDiagnosticSkeleton />
        </div>
      )}

      {error && !loading && (
        <div className="ai-diagnostic-panel__error">
          <span>{error}</span>
          <button type="button" className="ai-diagnostic-panel__retry-button" onClick={onGenerate}>
            Reintentar
          </button>
        </div>
      )}

      {analysis && !loading && (
        <div className="ai-diagnostic-result">
          <div className={VERDICT_CLASS[analysis.veredicto] ?? ''}>
            <span className="ai-diagnostic-result__despacho-icon">
              {VERDICT_ICON[analysis.veredicto] ?? '❓'}
            </span>
            <div className="ai-diagnostic-result__despacho-content">
              <strong className="ai-diagnostic-result__despacho-label">
                {VERDICT_LABEL[analysis.veredicto] ?? analysis.veredicto}
              </strong>
              <span className="ai-diagnostic-result__despacho-motivo">
                Confianza {analysis.confianza}
                {analysis.corroboracion_logs && (
                  <> · {EVIDENCE_LABEL[analysis.corroboracion_logs] ?? analysis.corroboracion_logs}</>
                )}
              </span>
            </div>
          </div>

          {analysis._error && (
            <div className="ai-diagnostic-panel__error">
              <span>La IA no devolvió un veredicto explícito para este caso.</span>
            </div>
          )}

          {analysis.causa_raiz && (
            <div className="ai-diagnostic-result__diagnosis-card">
              <h4 className="ai-diagnostic-result__section-title">
                <span className="ai-diagnostic-result__icon">🔍</span>
                Causa raíz
              </h4>
              <div className="ai-diagnostic-result__text-container">
                <p className="ai-diagnostic-result__text">{analysis.causa_raiz}</p>
                {analysis.justificacion && (
                  <p className="ai-diagnostic-result__text">{analysis.justificacion}</p>
                )}
              </div>
            </div>
          )}

          {analysis.pasos.length > 0 && (
            <div className="ai-diagnostic-result__actions-card">
              <h4 className="ai-diagnostic-result__section-title">
                <span className="ai-diagnostic-result__icon">🔧</span>
                Pasos
              </h4>
              <ul className="ai-diagnostic-result__actions-list">
                {analysis.pasos.map((paso, idx) => (
                  <li key={idx} className="ai-diagnostic-result__action-item">
                    <span className="ai-diagnostic-result__action-number">{idx + 1}</span>
                    <span className="ai-diagnostic-result__action-text">{paso}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.piezas.length > 0 && (
            <div className="eng-ai-parts">
              <h4 className="ai-diagnostic-result__section-title">
                <span className="ai-diagnostic-result__icon">🧰</span>
                Piezas
              </h4>
              <ul className="eng-parts-list">
                {analysis.piezas.map((p) => (
                  <li key={p.pn} className="eng-part">
                    <span className="eng-part-pn">{p.pn}</span>
                    <span className="eng-part-desc">{p.descripcion}</span>
                    {p.prioridad && (
                      <span className={PRIORIDAD_CLASS[p.prioridad] ?? 'eng-badge'}>{p.prioridad}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.motivo_cierre_sugerido && (
            <div className="eng-ai-close-reason">
              <strong>Motivo de cierre sugerido:</strong> {analysis.motivo_cierre_sugerido}
              {analysis.comentario_cierre && (
                <p className="ai-diagnostic-result__text">{analysis.comentario_cierre}</p>
              )}
            </div>
          )}

          {analysis.consolidado && (
            <div className="ai-diagnostic-result__summary-banner">
              <span className="ai-diagnostic-result__summary-icon">📋</span>
              <p className="ai-diagnostic-result__summary-text">{analysis.consolidado.resumen}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
