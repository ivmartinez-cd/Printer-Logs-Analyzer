interface HealthScoreGaugeProps {
  score: number
}

function tier(score: number): { level: 'green' | 'yellow' | 'red'; label: string } {
  if (score >= 80) return { level: 'green', label: 'Saludable' }
  if (score >= 60) return { level: 'yellow', label: 'Atención' }
  return { level: 'red', label: 'Crítico' }
}

export function HealthScoreGauge({ score }: HealthScoreGaugeProps) {
  const { level, label } = tier(score)
  const rootClass = `noc-health noc-health--${level}`

  return (
    <section className={rootClass}>
      <div className="noc-health__head">
        <span className="noc-health__title">Health Score</span>
        <span className="noc-health__tier">{label}</span>
      </div>
      <div className="noc-health__score">
        <span className="noc-health__value">{score}</span>
        <span className="noc-health__max">/ 100</span>
      </div>
      <div
        className="noc-health__bar"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="noc-health__bar-fill" style={{ width: `${score}%` }} />
      </div>
      <span className="noc-health__note">Estimación derivada de los logs analizados</span>
    </section>
  )
}
