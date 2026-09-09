
interface SeverityFiltersProps {
  activeSeverities: Set<string>
  onToggle: (severity: string) => void
}

export function SeverityFilters({ activeSeverities, onToggle }: SeverityFiltersProps) {
  const SEVERITIES = [
    { id: 'ERROR', color: 'var(--color-error)', label: 'ERROR', activeClass: 'active--error' },
    { id: 'WARNING', color: 'var(--color-warning)', label: 'WARNING', activeClass: 'active--warning' },
    { id: 'INFO', color: 'var(--color-info)', label: 'INFO', activeClass: 'active--info' },
  ] as const

  return (
    <div className="chart-filters">
      {SEVERITIES.map(({ id, color, label, activeClass }) => {
        const isActive = activeSeverities.has(id)
        const className = isActive ? `chart-filters__btn active ${activeClass}` : 'chart-filters__btn'
        return (
          <button
            key={id}
            onClick={() => onToggle(id)}
            className={className}
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
