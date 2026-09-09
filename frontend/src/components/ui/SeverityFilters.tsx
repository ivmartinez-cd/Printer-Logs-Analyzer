
interface SeverityFiltersProps {
  activeSeverities: Set<string>
  onToggle: (severity: string) => void
}

export function SeverityFilters({ activeSeverities, onToggle }: SeverityFiltersProps) {
  const SEVERITIES = [
    { id: 'ERROR', color: 'var(--color-error)', label: 'ERROR' },
    { id: 'WARNING', color: 'var(--color-warning)', label: 'WARNING' },
    { id: 'INFO', color: 'var(--color-info)', label: 'INFO' },
  ] as const

  return (
    <div className="chart-filters">
      {SEVERITIES.map(({ id, color, label }) => {
        const isActive = activeSeverities.has(id)
        return (
          <button
            key={id}
            onClick={() => onToggle(id)}
            className={`chart-filters__btn ${isActive ? 'active' : ''}`}
            style={{
              color: isActive ? 'var(--text-on-accent)' : color,
              borderColor: isActive ? color : 'transparent'
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
