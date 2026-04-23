import type { ParseLogsResponse } from '../../types/api'
import { getEventInfoForCode } from './utils'

interface NewCodesSectionProps {
  result: ParseLogsResponse | null
  codesNew: string[]
  savingCode: boolean
  onAddCode: (code: string) => void
  onIgnore: () => void
}

export function NewCodesSection({
  result,
  codesNew,
  savingCode,
  onAddCode,
  onIgnore,
}: NewCodesSectionProps) {
  if (!result || codesNew.length === 0) return null

  return (
    <div className="dashboard__codes-new-section" role="status">
      <p className="dashboard__codes-new-intro">
        Se detectaron {codesNew.length} código{codesNew.length !== 1 ? 's' : ''} nuevo
        {codesNew.length !== 1 ? 's' : ''} que no están en el catálogo. Agrega cada uno
        con su URL de solución si la tienes.
      </p>
      <ul className="dashboard__codes-new-list">
        {codesNew.map((code: string) => {
          const { description } = getEventInfoForCode(result, code)
          return (
            <li key={code} className="dashboard__codes-new-item">
              <span className="dashboard__codes-new-code">{code}</span>
              {description && (
                <span className="dashboard__codes-new-desc" title={description}>
                  {description.slice(0, 60)}
                  {description.length > 60 ? '…' : ''}
                </span>
              )}
              <button
                type="button"
                className="dashboard__btn dashboard__btn--secondary dashboard__btn--small"
                onClick={() => onAddCode(code)}
                disabled={savingCode}
              >
                Agregar al catálogo
              </button>
            </li>
          )
        })}
      </ul>
      <button
        type="button"
        className="dashboard__btn dashboard__btn--secondary"
        onClick={onIgnore}
      >
        Ignorar y ver resultados
      </button>
    </div>
  )
}
