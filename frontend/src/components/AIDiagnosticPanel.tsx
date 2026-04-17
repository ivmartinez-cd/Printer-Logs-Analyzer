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
    // Eliminar marcas de markdown que el modelo pueda añadir (```json ... ```)
    const cleaned = text
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim()

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
        setCollapsed(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al generar el diagnóstico')
      } finally {
        setLoading(false)
      }
    }

    const data = diagnosis ? parseDiagnosis(diagnosis) : null

    return (
      <div className={`glass-card rounded-3xl overflow-hidden animate-fade-in-up shadow-premium-lg border-l-4 transition-all duration-500 ${diagnosis ? 'border-l-hp-blue-vibrant shadow-hp-blue/10' : 'border-l-white/10'}`} ref={ref}>
        <button
          type="button"
          data-testid="ai-diagnostic-panel-toggle"
          className="w-full flex items-center justify-between px-5 py-3.5 bg-white/[0.03] hover:bg-white/[0.06] transition-all group"
          onClick={() => setCollapsed((v) => !v)}
          aria-expanded={!collapsed}
        >
          <div className="flex items-center gap-3">
            <span className={`text-lg transition-transform duration-500 ${loading ? 'animate-spin' : diagnosis ? 'animate-pulse scale-110' : 'group-hover:rotate-12'}`}>
              {loading ? '⏳' : diagnosis ? '🤖' : '🧠'}
            </span>
            <span className="font-display font-bold text-sm text-white uppercase tracking-tight">Diagnóstico Inteligente IA</span>
            {data && !collapsed && (
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                data.prioridad === 'alta' ? 'bg-accent-rose/20 text-accent-rose border border-accent-rose/30' : 
                data.prioridad === 'media' ? 'bg-accent-amber/20 text-accent-amber border border-accent-amber/30' : 
                'bg-accent-emerald/20 text-accent-emerald border border-accent-emerald/30'
              }`}>
                Prioridad {data.prioridad}
              </span>
            )}
          </div>
          <span className={`text-slate-500 group-hover:text-white transition-all transform duration-300 ${!collapsed ? 'rotate-90 text-[10px]' : 'text-[10px]'}`}>
             ▶
          </span>
        </button>

        <div className={`transition-all duration-300 ease-in-out ${collapsed ? 'max-h-0 opacity-0 overflow-hidden' : 'p-5 opacity-100'}`}>
          {!diagnosis && !loading && !error && (
            <div className="flex flex-col items-center gap-6 py-6 text-center">
              <p className="text-slate-400 max-w-lg leading-relaxed italic text-sm">
                “Obtené un diagnóstico detallado con correlaciones temporales y recomendación accionable basado en el motor de IA.”
              </p>
              <button
                type="button"
                className="bg-hp-blue-vibrant hover:bg-hp-blue text-white shadow-premium-glow hover:shadow-hp-blue/40 px-8 py-3 rounded-xl font-bold transition-all transform hover:scale-105 active:scale-95"
                onClick={() => void handleGenerate()}
              >
                Generar análisis con IA
              </button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center gap-4 py-8">
              <span className="w-8 h-8 border-4 border-hp-blue/20 border-t-hp-blue-vibrant rounded-full animate-spin" aria-hidden="true" />
              <span className="text-hp-blue-vibrant font-semibold animate-pulse">Generando diagnóstico…</span>
            </div>
          )}

          {error && !loading && (
            <div className="bg-accent-rose/10 border border-accent-rose/30 p-4 rounded-xl flex flex-col items-center gap-3">
              <span className="text-accent-rose text-sm font-medium">{error}</span>
              <button
                type="button"
                className="text-xs font-bold text-white underline underline-offset-4 hover:text-accent-rose transition-colors"
                onClick={() => void handleGenerate()}
              >
                Reintentar
              </button>
            </div>
          )}

          {data && !loading && (
            <div className="space-y-6 animate-scale-in">
              <div className="bg-white/[0.03] border border-white/5 p-5 rounded-2xl space-y-3">
                <h4 className="font-display font-bold text-slate-200 flex items-center gap-3">
                  <span className="text-lg">🔍</span>
                  Hallazgos del Sistema
                </h4>
                <p className="text-slate-300 leading-relaxed text-sm">{data.diagnostico}</p>
                {data.impacto && (
                  <div className="pt-3 border-t border-white/5 text-xs text-slate-500">
                    <strong className="text-slate-400 font-bold">Impacto estimado:</strong> {data.impacto}
                  </div>
                )}
              </div>

              <div className="bg-white/[0.03] border border-white/5 p-5 rounded-2xl space-y-4">
                <h4 className="font-display font-bold text-slate-200 flex items-center gap-3">
                  <span className="text-lg">🔧</span>
                  Pasos a Seguir
                </h4>
                <ul className="space-y-3">
                  {data.acciones.map((accion, idx) => (
                    <li key={idx} className="flex gap-4 group">
                      <span className="w-6 h-6 shrink-0 bg-hp-blue/10 text-hp-blue-vibrant border border-hp-blue/20 rounded-lg flex items-center justify-center text-[10px] font-bold group-hover:bg-hp-blue-vibrant group-hover:text-white transition-all">
                        {idx + 1}
                      </span>
                      <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors leading-relaxed">
                        {accion}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {diagnosis && !data && !loading && (
            <pre className="bg-hp-dark p-4 rounded-xl text-xs text-slate-500 font-mono overflow-auto max-h-60 border border-white/5">
              {diagnosis}
            </pre>
          )}
        </div>
      </div>
    )
  }
)
