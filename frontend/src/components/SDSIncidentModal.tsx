import { useState, useRef, useEffect } from 'react'

export interface SdsIncidentData {
  code: string | null
  /** Código numérico / patrón que aparece en el log (ej. 53.B0.0z). Se usa para matching con incidentes. */
  more_info: string | null
  severity: string | null
  created_at: string | null
  firmware: string | null
  impressions: string | null
  event_context: string | null
}

const SDS_KEYS: { key: keyof SdsIncidentData; labels: string[] }[] = [
  { key: 'code', labels: ['Código'] },
  { key: 'more_info', labels: ['Más información', 'Mas informacion'] },
  { key: 'severity', labels: ['Gravedad'] },
  { key: 'created_at', labels: ['Creado'] },
  { key: 'firmware', labels: ['Versión del firmware', 'Version del firmware'] },
  { key: 'impressions', labels: ['N.º total de impresiones', 'N. total de impresiones'] },
  {
    key: 'event_context',
    labels: ['Contexto del código de evento', 'Contexto del codigo de evento'],
  },
]

function parseSdsText(text: string): SdsIncidentData {
  const out: SdsIncidentData = {
    code: null,
    more_info: null,
    severity: null,
    created_at: null,
    firmware: null,
    impressions: null,
    event_context: null,
  }
  const lines = text.split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    for (const { key, labels } of SDS_KEYS) {
      for (const label of labels) {
        if (trimmed.startsWith(label)) {
          const rest = trimmed
            .slice(label.length)
            .replace(/^[\s:]+/, '')
            .trim()
          if (rest) (out as unknown as Record<string, string | null>)[key] = rest
          break
        }
      }
    }
  }
  return out
}

interface SDSIncidentModalProps {
  onContinue: (data: SdsIncidentData) => void
  onClose: () => void
}

export function SDSIncidentModal({ onContinue, onClose }: SDSIncidentModalProps) {
  const [sdsText, setSdsText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleContinue = () => {
    const data = parseSdsText(sdsText)
    onContinue(data)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-hp-dark/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="glass-card w-full max-w-xl shadow-premium-glow animate-scale-in overflow-hidden border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-hp-blue-vibrant mb-1">Entrada de Telemetría</span>
            <h2 className="font-display font-bold text-xl text-white m-0">Vincular Incidente <span className="text-hp-blue-vibrant">SDS</span></h2>
          </div>
          <button 
            type="button" 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all" 
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4">
           <div className="flex items-center gap-3 p-4 bg-hp-blue/5 border border-hp-blue/20 rounded-2xl mb-2">
              <span className="text-lg">📋</span>
              <p className="text-[11px] text-slate-300 font-medium leading-tight">
                 Pegue el contenido completo extraído del portal HP SDS. El sistema detectará automáticamente códigos de evento, firmware e impresiones.
              </p>
           </div>
           
           <textarea
             ref={textareaRef}
             className="w-full h-64 bg-hp-dark/60 border border-white/10 rounded-2xl p-5 text-xs text-slate-300 font-mono focus:ring-1 focus:ring-hp-blue-vibrant focus:border-hp-blue-vibrant outline-none resize-none scrollbar-thin scrollbar-thumb-white/10 shadow-inner"
             placeholder="Pegue aquí el texto detallado del incidente SDS..."
             value={sdsText}
             onChange={(e) => setSdsText(e.target.value)}
           />
        </div>

        {/* Actions */}
        <div className="p-6 bg-white/5 border-t border-white/5 flex justify-end gap-3">
          <button
            type="button"
            className="px-6 py-2.5 rounded-full bg-slate-800 text-white font-bold text-[11px] uppercase tracking-widest hover:bg-slate-700 transition-all"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="px-10 py-2.5 rounded-full bg-hp-blue-vibrant text-white font-bold text-[11px] uppercase tracking-widest hover:shadow-premium-glow hover:scale-105 transition-all disabled:opacity-50"
            onClick={handleContinue}
            disabled={!sdsText.trim()}
          >
            Vincular Datos
          </button>
        </div>
      </div>
    </div>
  )
}
