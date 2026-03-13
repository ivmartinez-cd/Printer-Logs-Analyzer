import React, { useState, useEffect } from 'react'
import type { GlobalRule } from '../types/api'

const DEFAULT_RECENCY = 300
const DEFAULT_DESCRIPTION = 'Regla agregada desde log'
const DEFAULT_COUNTER_MAX_JUMP = 100000

interface NewRuleModalProps {
  code: string
  eventType?: string
  helpText?: string
  initialRule?: GlobalRule
  onSave: (rule: GlobalRule) => void
  onClose: () => void
  saving: boolean
}

function getSuggestedValues(eventType?: string, helpText?: string, code?: string) {
  let classification = 'system'
  let resolution = ''

  const text = (helpText || '').toLowerCase()

  if (eventType?.toLowerCase() === 'warning') {
    classification = 'consumable'
  }

  if (eventType?.toLowerCase() === 'error') {
    if (code?.startsWith('13.')) {
      classification = 'paper_jam'
    }
  }

  if (text.includes('toner') || text.includes('supply')) {
    classification = 'consumable'
    resolution = 'Revisar toner y reemplazar si es necesario'
  }

  if (text.includes('jam')) {
    classification = 'paper_jam'
    resolution = 'Abrir puerta y retirar papel atascado'
  }

  if (text.includes('fuser')) {
    classification = 'mechanical'
  }

  return {
    classification,
    resolution,
  }
}

export function NewRuleModal({ code, eventType, helpText, initialRule, onSave, onClose, saving }: NewRuleModalProps) {
  const [classification, setClassification] = useState('')
  const [resolution, setResolution] = useState('')
  const [X, setX] = useState<string>('2')
  const [Y, setY] = useState<string>('60')
  const [sdsLink, setSdsLink] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (initialRule) {
      setClassification(initialRule.classification)
      setResolution(initialRule.resolution || '')
      setX(String(initialRule.X))
      setY(String(initialRule.Y))
      setSdsLink(initialRule.sds_link || '')
    } else {
      const suggested = getSuggestedValues(eventType, helpText, code)
      setClassification(suggested.classification)
      setResolution(suggested.resolution || '')
      setX('2')
      setY('60')
      setSdsLink('')
    }
  }, [code, eventType, helpText, initialRule])

  useEffect(() => {
    setFieldErrors({})
  }, [classification, X, Y])

  function validate(): boolean {
    const err: Record<string, string> = {}
    if (!classification.trim()) err.classification = 'Requerido'
    const xNum = parseInt(X, 10)
    if (Number.isNaN(xNum) || xNum < 1) err.X = 'Mínimo 1'
    const yNum = parseInt(Y, 10)
    if (Number.isNaN(yNum) || yNum < 1) err.Y = 'Mínimo 1'
    setFieldErrors(err)
    return Object.keys(err).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate() || saving) return
    const rule: GlobalRule = {
      code,
      classification: classification.trim(),
      description: DEFAULT_DESCRIPTION,
      resolution: (resolution || DEFAULT_DESCRIPTION).trim(),
      recency_window: DEFAULT_RECENCY,
      X: parseInt(X, 10),
      Y: parseInt(Y, 10),
      counter_max_jump: DEFAULT_COUNTER_MAX_JUMP,
      enabled: true,
      tags: [],
      sds_link: sdsLink.trim() || undefined,
    }
    onSave(rule)
  }

  return (
    <div className="modal-overlay" role="presentation">
      <div className="modal" role="dialog" aria-labelledby="modal-title">
        <h2 id="modal-title" className="modal__title">{initialRule ? 'Editar regla' : 'Agregar regla'}</h2>
        <form onSubmit={handleSubmit} className="modal__form">
          <div className="modal__field">
            <label htmlFor="rule-code">Código</label>
            <input id="rule-code" type="text" value={code} readOnly className="modal__input modal__input--readonly" />
          </div>
          <div className="modal__field">
            <label htmlFor="rule-classification">Clasificación</label>
            <input
              id="rule-classification"
              type="text"
              value={classification}
              onChange={(e) => setClassification(e.target.value)}
              required
              className="modal__input"
            />
            {fieldErrors.classification && <span className="modal__error">{fieldErrors.classification}</span>}
          </div>
          <div className="modal__field">
            <div className="modal__xy-row">
              <span>Crear incidente si hay al menos</span>
              <input
                id="rule-x"
                type="number"
                min={1}
                value={X}
                onChange={(e) => setX(e.target.value)}
                className="modal__input modal__input--sm"
              />
              <span>eventos en</span>
              <input
                id="rule-y"
                type="number"
                min={1}
                value={Y}
                onChange={(e) => setY(e.target.value)}
                className="modal__input modal__input--sm"
              />
              <span>minutos</span>
            </div>
            {(fieldErrors.X || fieldErrors.Y) && (
              <span className="modal__error">
                {fieldErrors.X || fieldErrors.Y}
              </span>
            )}
          </div>
          <div className="modal__field modal__field--sds">
            <label htmlFor="rule-sds-link">SDS link (opcional)</label>
            <input
              id="rule-sds-link"
              type="text"
              value={sdsLink}
              onChange={(e) => setSdsLink(e.target.value)}
              className="modal__input"
              placeholder="https://kaas.hpcloud.hp.com/..."
            />
          </div>
          <div className="modal__actions">
            <button type="button" onClick={onClose} className="modal__btn modal__btn--secondary" disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="modal__btn modal__btn--primary" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
