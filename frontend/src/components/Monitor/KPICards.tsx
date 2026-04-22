import type { EnrichedEvent as ApiEvent, Incident as ApiIncident } from '../../types/api'
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
  totalIntervalPages: number
  maxCounter: number
} {
  const counters = filteredEvents
    .map((e) => e.counter)
    .filter((c) => typeof c === 'number' && c > 0)

  if (counters.length < 2) {
    return { label: '—', sub: 'sin datos de contador', totalIntervalPages: 0, maxCounter: 0 }
  }

  const minC = counters.reduce((a, b) => Math.min(a, b))
  const maxC = counters.reduce((a, b) => Math.max(a, b))
  const counterRange = maxC - minC

  if (counterRange === 0) {
    return { label: '—', sub: 'sin rango de contador', totalIntervalPages: 0, maxCounter: maxC }
  }

  const errorEvents = filteredEvents.filter((e) => e.type.toUpperCase() === 'ERROR')
  const errorCount = errorEvents.length

  if (errorCount === 0) {
    return { 
      label: 'Sin errores', 
      labelColor: 'var(--color-success, #22c55e)', 
      sub: 'sin errores críticos',
      totalIntervalPages: counterRange,
      maxCounter: maxC
    }
  }

  const freq: Record<string, number> = {}
  for (const e of errorEvents) {
    freq[e.code] = (freq[e.code] ?? 0) + 1
  }
  const topCode = Object.entries(freq).reduce((a, b) => (b[1] > a[1] ? b : a))[0]

  const pagesPerError = Math.round(counterRange / errorCount)
  const label =
    pagesPerError >= 1 ? `1 c/${pagesPerError.toLocaleString('es-AR')} pág.` : `${errorCount} err.`

  return { label, sub: topCode, totalIntervalPages: counterRange, maxCounter: maxC }
}

export function KPICards({
  filteredIncidents,
  filteredEvents,
  lastErrorEvent,
  lastErrorLabel,
}: KPICardsProps) {
  const errorCount   = filteredIncidents.filter((i) => i.severity.toUpperCase() === 'ERROR').length
  const warningCount = filteredIncidents.filter((i) => i.severity.toUpperCase() === 'WARNING').length
  const infoCount    = filteredIncidents.filter((i) => i.severity.toUpperCase() === 'INFO').length
  const totalCount   = filteredIncidents.length
  const errorRate    = computeErrorRate(filteredEvents)

  const errorStateVariant =
    errorCount > 0   ? styles['kpi-card--variant-error']   :
    warningCount > 0 ? styles['kpi-card--variant-warning'] :
    infoCount > 0    ? styles['kpi-card--variant-info']    :
                       styles['kpi-card--variant-neutral']

  const rateVariant = errorRate.labelColor
    ? styles['kpi-card--variant-neutral']
    : styles['kpi-card--variant-error']

  return (
    <div className={styles['kpi-grid']}>

      {/* ── HERO: Último error crítico ────────────────────────────── */}
      <div className={`${styles['kpi-card']} ${styles['kpi-card--hero']} ${lastErrorEvent ? styles['kpi-card--hero-alert'] : styles['kpi-card--hero-ok']}`}
           data-testid="kpi-last-error-hero">
        <div className={styles['kpi-card__label']}>Último error crítico</div>
        {lastErrorEvent ? (
          <>
            <div className={`${styles['kpi-card__value']} ${styles['kpi-card__value--hero-code']}`}
                 data-testid="kpi-last-error-code">
              {lastErrorEvent.code}
            </div>
            <div className={styles['kpi-card__sub']}>
              {lastErrorEvent.code_description
                ? lastErrorEvent.code_description.slice(0, 48) + (lastErrorEvent.code_description.length > 48 ? '…' : '')
                : ''}
            </div>
            <div className={styles['kpi-card__timestamp']}>{lastErrorLabel}</div>
          </>
        ) : (
          <>
            <div className={`${styles['kpi-card__value']} ${styles['kpi-card__value--ok']}`}>
              Sin errores
            </div>
            <div className={styles['kpi-card__sub']}>No se registraron errores en el período</div>
          </>
        )}
      </div>

      {/* ── Estado de errores ─────────────────────────────────────── */}
      <div className={`${styles['kpi-card']} ${errorStateVariant}`}>
        <div className={styles['kpi-card__label']}>Errores críticos</div>
        <div
          className={`${styles['kpi-card__value']} ${errorCount > 0 ? styles['kpi-card__value--error'] : styles['kpi-card__value--ok']}`}
          data-testid="kpi-error-count"
        >
          {errorCount}
        </div>
        <div className={styles['kpi-card__sub']} title="Eventos de menor severidad detectados en el período">
          Alertas menores: {warningCount} advert. · {infoCount} info
        </div>
      </div>

      {/* ── Incidencias activas ───────────────────────────────────── */}
      <div className={`${styles['kpi-card']} ${styles['kpi-card--variant-info']}`}>
        <div className={styles['kpi-card__label']}>Incidencias activas</div>
        <div className={styles['kpi-card__value']} data-testid="kpi-active-incidents">
          {totalCount}
        </div>
        <div className={styles['kpi-card__sub']}>en el período</div>
      </div>

      {/* ── Tasa de errores ───────────────────────────────────────── */}
      <div className={`${styles['kpi-card']} ${rateVariant}`}>
        <div className={styles['kpi-card__label']}>Tasa de errores</div>
        <div
          className={`${styles['kpi-card__value']} ${styles['kpi-card__value--rate']}`}
          style={errorRate.labelColor ? { color: errorRate.labelColor } : undefined}
        >
          {errorRate.label}
        </div>
        <div className={styles['kpi-card__sub']}>
          {errorRate.sub && <div style={{ marginBottom: '4px' }}>{errorRate.sub}</div>}
          {errorRate.totalIntervalPages > 0 && (
            <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>
               En periodo: <strong>{errorRate.totalIntervalPages.toLocaleString('es-AR')}</strong> págs.
            </div>
          )}
          {errorRate.maxCounter > 0 && (
            <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>
               Contador total: <strong>{errorRate.maxCounter.toLocaleString('es-AR')}</strong> págs.
            </div>
          )}
        </div>
      </div>

    </div>
  )
}


