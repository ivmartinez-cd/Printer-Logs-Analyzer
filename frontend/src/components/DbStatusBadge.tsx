import type { HealthStatus } from '../services/api'

export function DbStatusBadge({ status }: { status: HealthStatus | null }) {
  if (status === null) {
    return (
      <span className="db-status-badge db-status-badge--connecting px-3 py-1 bg-yellow-400/10 border border-yellow-400/25 text-yellow-500 rounded-full flex items-center gap-2 text-xs font-medium">
        <span className="db-status-badge__spinner w-2.5 h-2.5 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" aria-hidden="true" />
        Conectando al servidor...
      </span>
    )
  }
  const online = status.db_available
  return (
    <span
      className={`db-status-badge px-3 py-1 rounded-full flex items-center gap-2 text-xs font-medium select-none ${
        online 
          ? 'db-status-badge--ok bg-green-400/10 border border-green-400/25 text-green-400' 
          : 'db-status-badge--offline bg-red-400/10 border border-red-400/25 text-red-400'
      }`}
    >
      <span className={`db-status-badge__dot w-1.5 h-1.5 rounded-full ${online ? 'bg-green-400' : 'bg-red-400'}`} aria-hidden="true" />
      {online ? 'DB conectada' : 'DB offline · modo local'}
    </span>
  )
}
