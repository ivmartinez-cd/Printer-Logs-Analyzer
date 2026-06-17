import type { CodeTrend, Trend, Impact } from './healthMetrics'

interface CodeTrendTableProps {
  trends: CodeTrend[]
  onViewSolution?: (code: string) => void
}

const TREND_META: Record<Trend, { icon: string; label: string; cls: string }> = {
  up: { icon: '↑', label: 'En aumento', cls: 'up' },
  down: { icon: '↓', label: 'En baja', cls: 'down' },
  stable: { icon: '↔', label: 'Estable', cls: 'stable' },
}

const IMPACT_META: Record<Impact, { label: string; cls: string }> = {
  high: { label: 'Alto', cls: 'high' },
  medium: { label: 'Medio', cls: 'medium' },
  low: { label: 'Bajo', cls: 'low' },
}

export function CodeTrendTable({ trends, onViewSolution }: CodeTrendTableProps) {
  return (
    <section className="noc-trends">
      <div className="noc-trends__head">
        <h3 className="noc-trends__title">Tendencia de códigos</h3>
      </div>
      {trends.length === 0 ? (
        <p className="noc-trends__empty">Sin códigos de error o advertencia en el período.</p>
      ) : (
        <div className="noc-trends__table-wrap">
          <table className="noc-trends__table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th>Tendencia</th>
                <th>Impacto</th>
              </tr>
            </thead>
            <tbody>
              {trends.map((t) => {
                const tm = TREND_META[t.trend]
                const im = IMPACT_META[t.impact]
                const sev = t.severity === 'ERROR' ? 'error' : 'warn'
                const sevBadgeClass = 'noc-badge noc-badge--' + sev
                const trendClass = 'noc-trend noc-trend--' + tm.cls
                const impactBadgeClass = 'noc-badge noc-badge--impact-' + im.cls
                return (
                  <tr key={t.code}>
                    <td>
                      <button
                        type="button"
                        className="noc-trends__code"
                        onClick={() => onViewSolution?.(t.code)}
                        title="Ver solución"
                      >
                        {t.code}
                      </button>
                    </td>
                    <td className="noc-trends__desc">{t.description}</td>
                    <td>
                      <span className={sevBadgeClass}>
                        {t.severity === 'ERROR' ? 'Crítico' : 'Advertencia'}
                      </span>
                    </td>
                    <td>
                      <span className={trendClass}>
                        {tm.icon} {tm.label}
                      </span>
                    </td>
                    <td>
                      <span className={impactBadgeClass}>{im.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
