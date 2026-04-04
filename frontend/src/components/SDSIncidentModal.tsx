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
      className="log-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sds-modal-title"
    >
      <div className="log-modal" onClick={(e) => e.stopPropagation()}>
        <div className="log-modal__header">
          <h2 id="sds-modal-title" className="log-modal__title">
            Pegar incidente SDS
          </h2>
          <button type="button" className="log-modal__close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        <textarea
          ref={textareaRef}
          className="log-modal__textarea"
          placeholder="Pegá el incidente SDS completo"
          value={sdsText}
          onChange={(e) => setSdsText(e.target.value)}
        />
        <div className="log-modal__actions">
          <button
            type="button"
            className="dashboard__btn dashboard__btn--primary"
            onClick={handleContinue}
          >
            Agregar
          </button>
          <button type="button" className="log-modal__btn-secondary" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
