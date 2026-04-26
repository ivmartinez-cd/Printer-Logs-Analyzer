
interface SeverityFiltersProps {
  activeSeverities: Set<string>
  onToggle: (severity: string) => void
}

export function SeverityFilters({ activeSeverities, onToggle }: SeverityFiltersProps) {
  const SEVERITIES = [
    { id: 'ERROR', color: '#ef4444', label: 'ERROR' },
    { id: 'WARNING', color: '#f59e0b', label: 'WARNING' },
    { id: 'INFO', color: '#3b82f6', label: 'INFO' },
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
              color: isActive ? '#fff' : color,
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
