export type SeverityFilter = 'ALL' | 'INFO' | 'WARNING' | 'ERROR'

interface AnalyzeToolbarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  severityValue: SeverityFilter
  onSeverityChange: (value: SeverityFilter) => void
  resultsCount: number
}

const SEVERITY_OPTIONS: SeverityFilter[] = ['ALL', 'INFO', 'WARNING', 'ERROR']

export function AnalyzeToolbar({
  searchValue,
  onSearchChange,
  severityValue,
  onSeverityChange,
  resultsCount,
}: AnalyzeToolbarProps) {
  return (
    <div className="analyze-toolbar">
      <input
        type="text"
        className="analyze-toolbar__search"
        placeholder="Buscar..."
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        aria-label="Buscar"
      />
      <select
        className="analyze-toolbar__severity"
        value={severityValue}
        onChange={(e) => onSeverityChange(e.target.value as SeverityFilter)}
        aria-label="Filtrar por severidad"
      >
        {SEVERITY_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <span className="analyze-toolbar__count">
        {resultsCount} resultado{resultsCount !== 1 ? 's' : ''}
      </span>
    </div>
  )
}
