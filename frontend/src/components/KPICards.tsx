import type { EnrichedEvent as ApiEvent, Incident as ApiIncident } from '../types/api'

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up">
      {/* Estado de Errores */}
      <Card 
        label="Estado de errores"
        sub="crítico · advertencia · info"
      >
        <div className="flex items-baseline gap-2 font-display font-black tracking-tighter">
          <span className="text-5xl text-accent-rose" data-testid="kpi-error-count">{errorCount}</span>
          <span className="text-white/10 select-none text-3xl">·</span>
          <span className="text-4xl text-accent-amber">{warningCount}</span>
          <span className="text-white/10 select-none text-2xl">·</span>
          <span className="text-3xl text-hp-blue-vibrant">{infoCount}</span>
        </div>
      </Card>

      {/* Incidencias Activas */}
      <Card 
        label="Incidencias Activas"
        sub="en el período analizado"
      >
        <div className="font-display text-6xl font-black tracking-tighter text-white" data-testid="kpi-active-incidents">
          {filteredIncidents.length}
        </div>
      </Card>

      {/* Último error crítico */}
      <Card 
        label="Último error crítico"
        sub={lastErrorEvent ? `${lastErrorLabel?.split(',')[1] || ''} · REGISTRADO` : 'SIN ERRORES REGISTRADOS'}
      >
        {lastErrorEvent ? (
          <div className="font-display text-5xl font-black tracking-tighter text-accent-rose uppercase" data-testid="kpi-last-error-code">
            {lastErrorEvent.code}
          </div>
        ) : (
          <div className="font-display text-2xl font-black text-accent-emerald uppercase opacity-60">
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
          className="font-display font-black tracking-tighter"
          style={{ 
            fontSize: errorRate.label === '—' ? '24px' : '2.2rem',
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
    <div className="glass-card glass-card--hover p-6 rounded-3xl flex flex-col gap-2 min-h-[160px]">
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </div>
      <div className="flex-1 flex items-center">
        {children}
      </div>
      <div className="text-[10px] font-bold text-slate-600 truncate uppercase tracking-wider">
        {sub}
      </div>
    </div>
  )
}
