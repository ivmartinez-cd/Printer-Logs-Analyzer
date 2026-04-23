import { useState } from 'react'
import type { ParserError } from '../../types/api'

interface ParseErrorsBannerProps {
  errors: ParserError[]
}

export function ParseErrorsBanner({ errors }: ParseErrorsBannerProps) {
  const [expanded, setExpanded] = useState(false)

  if (!errors || errors.length === 0) return null

  return (
    <div className="dashboard__parse-errors-banner" role="alert">
      <button
        className="dashboard__parse-errors-toggle"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span>Se omitieron {errors.length} líneas por formato inválido</span>
        <span className="dashboard__parse-errors-chevron">
          {expanded ? '▲' : '▼'}
        </span>
      </button>
      {expanded && (
        <table className="dashboard__parse-errors-table">
          <thead>
            <tr>
              <th>Línea</th>
              <th>Texto crudo</th>
              <th>Motivo</th>
            </tr>
          </thead>
          <tbody>
            {errors.map((e) => (
              <tr key={e.line_number}>
                <td>{e.line_number}</td>
                <td>
                  <code>{e.raw_line}</code>
                </td>
                <td>{e.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
