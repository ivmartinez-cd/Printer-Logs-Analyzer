import type { EnrichedEvent as ApiEvent, Incident as ApiIncident } from '../types/api'
import styles from './KPICards.module.css'

interface KPICardsProps {
  filteredIncidents: ApiIncident[]
  filteredEvents: ApiEvent[]
  lastErrorEvent: ApiEvent | null
  lastErrorLabel: string | null
}

function computeErrorRate(filteredEvents: ApiEvent[]): {
  label: string
  labelColor?: string
  sub: string
} {
  const counters = filteredEvents
    .map((e) => e.counter)
    .filter((c) => typeof c === 'number' && c > 0)

  if (counters.length < 2) {
    return { label: '—', sub: 'sin datos de contador' }
  }

  const minC = counters.reduce((a, b) => Math.min(a, b))
  const maxC = counters.reduce((a, b) => Math.max(a, b))
  const counterRange = maxC - minC
  const pagesLabel = `${counterRange.toLocaleString('es-AR')} pág. en el período`

  if (counterRange === 0) {
    return { label: '—', sub: 'sin rango de contador' }
  }

  const errorEvents = filteredEvents.filter((e) => e.type.toUpperCase() === 'ERROR')
  const errorCount = errorEvents.length

  if (errorCount === 0) {
    return { label: 'Sin errores', labelColor: 'var(--color-success, #22c55e)', sub: pagesLabel }
  }

  // Código ERROR más frecuente
  const freq: Record<string, number> = {}
  for (const e of errorEvents) {
    freq[e.code] = (freq[e.code] ?? 0) + 1
  }
  const topCode = Object.entries(freq).reduce((a, b) => (b[1] > a[1] ? b : a))[0]

  const pagesPerError = Math.round(counterRange / errorCount)
  const label =
    pagesPerError >= 1 ? `1 c/${pagesPerError.toLocaleString('es-AR')} pág.` : `${errorCount} err.`
  const sub = `${topCode} · ${pagesLabel}`

  return { label, sub }
}

export function KPICards({
  filteredIncidents,
  filteredEvents,
  lastErrorEvent,
  lastErrorLabel,
}: KPICardsProps) {
  const errorCount = filteredIncidents.filter((i) => i.severity.toUpperCase() === 'ERROR').length
  const warningCount = filteredIncidents.filter(
    (i) => i.severity.toUpperCase() === 'WARNING'
  ).length
  const infoCount = filteredIncidents.filter((i) => i.severity.toUpperCase() === 'INFO').length

  const errorRate = computeErrorRate(filteredEvents)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
      {/* Estado de Errores */}
      <Card 
        label="Estado de errores"
        sub="crítico · advertencia · info"
      >
        <div className="flex items-center gap-3 font-display text-2xl font-bold tracking-tight">
          <span className="text-accent-rose" data-testid="kpi-error-count">{errorCount}</span>
          <span className="text-white/20 select-none">·</span>
          <span className="text-accent-amber">{warningCount}</span>
          <span className="text-white/20 select-none">·</span>
          <span className="text-hp-blue-vibrant">{infoCount}</span>
        </div>
      </Card>

      {/* Incidencias Activas */}
      <Card 
        label="Incidencias Activas"
        sub="incidentes detectados en el log"
      >
        <div className="font-display text-3xl font-bold tracking-tight text-white" data-testid="kpi-active-incidents">
          {filteredIncidents.length}
        </div>
      </Card>

      {/* Último error crítico */}
      <Card 
        label="Último error crítico"
        sub={lastErrorEvent ? `${lastErrorLabel} · registrado` : 'Ningún error registrado'}
      >
        {lastErrorEvent ? (
          <div className="font-display text-3xl font-bold tracking-tight text-accent-rose" data-testid="kpi-last-error-code">
            {lastErrorEvent.code}
          </div>
        ) : (
          <div className="font-display text-xl font-bold text-accent-emerald">
            Sin errores
          </div>
        )}
      </Card>

      {/* Tasa de errores */}
      <Card 
        label="Tasa de errores"
        sub={errorRate.sub}
      >
        <div 
          className="font-display font-bold tracking-tight"
          style={{ 
            fontSize: errorRate.label === '—' ? '24px' : '1.1rem',
            color: errorRate.labelColor || 'inherit'
          }}
        >
          {errorRate.label}
        </div>
      </Card>
    </div>
  )
}

function Card({ label, sub, children }: { label: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="glass-card glass-card--hover p-5 rounded-2xl flex flex-col gap-3">
      <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
        {label}
      </div>
      <div className="flex-1 flex items-center">
        {children}
      </div>
      <div className="text-[11px] font-medium text-slate-600 truncate">
        {sub}
      </div>
    </div>
  )
}
