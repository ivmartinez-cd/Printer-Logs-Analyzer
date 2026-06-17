import { Fragment, useState } from 'react'
import { formatDateTime } from '../../hooks/useDateFilter'
import type { SavedAnalysisSummary } from '../../types/api'
import { EquipmentTimeline } from './EquipmentTimeline'
import { relativeTime } from '../Monitor/healthMetrics'

interface SavedAnalysisListProps {
  savedList: SavedAnalysisSummary[] | null
  savedListSearch: string
  setSavedListSearch: (v: string) => void
  deletingId: string | null
  onOpen: (id: string) => void
  onDelete: (item: { id: string; name: string }) => void
}

interface EquipmentGroup {
  key: string
  equipment: string | null
  snapshots: SavedAnalysisSummary[]
}

type FleetStatus = 'critical' | 'watch' | 'healthy'
type FleetTrend = 'up' | 'down' | 'stable'

function isGroupable(equipment: string): boolean {
  // Empty or the "Desconocido" placeholder must not lump unrelated devices.
  return !!equipment && equipment.toLowerCase() !== 'desconocido'
}

function severityRank(sev: string): number {
  const s = (sev || '').toUpperCase()
  if (s.includes('ERROR') || s.includes('CRIT')) return 3
  if (s.includes('WARN')) return 2
  if (s.includes('INFO')) return 1
  return 0
}

function statusOf(sev: string): FleetStatus {
  const r = severityRank(sev)
  return r >= 3 ? 'critical' : r === 2 ? 'watch' : 'healthy'
}

const STATUS_META: Record<FleetStatus, { dot: string; label: string }> = {
  critical: { dot: '🔴', label: 'Crítico' },
  watch: { dot: '🟡', label: 'Atención' },
  healthy: { dot: '🟢', label: 'Saludable' },
}

const TREND_META: Record<FleetTrend, { icon: string; label: string; cls: string }> = {
  up: { icon: '↑', label: 'Empeorando', cls: 'up' },
  down: { icon: '↓', label: 'Mejorando', cls: 'down' },
  stable: { icon: '↔', label: 'Estable', cls: 'stable' },
}

/** Tendencia comparando la severidad de la última lectura vs la anterior. */
function trendOf(snapshots: SavedAnalysisSummary[]): FleetTrend {
  if (snapshots.length < 2) return 'stable'
  const latest = severityRank(snapshots[0].global_severity)
  const prev = severityRank(snapshots[1].global_severity)
  return latest > prev ? 'up' : latest < prev ? 'down' : 'stable'
}

export function SavedAnalysisList({
  savedList,
  savedListSearch,
  setSavedListSearch,
  deletingId,
  onOpen,
  onDelete,
}: SavedAnalysisListProps) {
  // Expanded equipment groups (collapsed by default so snapshots don't mix).
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const filtered = savedList?.filter((s) => {
    const q = savedListSearch.trim().toLowerCase()
    if (!q) return true
    return (
      s.name.toLowerCase().includes(q) || (s.equipment_identifier ?? '').toLowerCase().includes(q)
    )
  })

  // Group snapshots by equipment, preserving the original (newest-first) order.
  // Devices without a real equipment stay as standalone cards.
  const groups: EquipmentGroup[] = []
  const indexByEquipment = new Map<string, number>()
  for (const s of filtered ?? []) {
    const equipment = (s.equipment_identifier ?? '').trim()
    if (isGroupable(equipment)) {
      const existing = indexByEquipment.get(equipment)
      if (existing != null) {
        groups[existing].snapshots.push(s)
        continue
      }
      indexByEquipment.set(equipment, groups.length)
      groups.push({ key: equipment, equipment, snapshots: [s] })
    } else {
      groups.push({ key: `__solo__${s.id}`, equipment: s.equipment_identifier ?? null, snapshots: [s] })
    }
  }

  // Fleet KPIs (estado por equipo según su última lectura).
  const fleet = groups.reduce(
    (acc, g) => {
      const st = statusOf(g.snapshots[0].global_severity)
      acc[st]++
      return acc
    },
    { critical: 0, watch: 0, healthy: 0 }
  )

  if (savedList === null) {
    return (
      <div className="dashboard__saved-section">
        <p className="dashboard__muted">Cargando…</p>
      </div>
    )
  }

  if (savedList.length === 0) {
    return (
      <div className="dashboard__saved-section">
        <p className="dashboard__muted">No hay incidentes guardados.</p>
      </div>
    )
  }

  return (
    <div className="dashboard__saved-section fleet-overview">
      {/* Resumen de flota */}
      <div className="fleet-kpis">
        <div className="fleet-kpi fleet-kpi--total">
          <span className="fleet-kpi__value">{groups.length}</span>
          <span className="fleet-kpi__label">Equipos monitoreados</span>
        </div>
        <div className="fleet-kpi fleet-kpi--critical">
          <span className="fleet-kpi__value">{fleet.critical}</span>
          <span className="fleet-kpi__label">🔴 En crítico</span>
        </div>
        <div className="fleet-kpi fleet-kpi--watch">
          <span className="fleet-kpi__value">{fleet.watch}</span>
          <span className="fleet-kpi__label">🟡 En atención</span>
        </div>
        <div className="fleet-kpi fleet-kpi--healthy">
          <span className="fleet-kpi__value">{fleet.healthy}</span>
          <span className="fleet-kpi__label">🟢 Saludables</span>
        </div>
      </div>

      <div className="table-toolbar">
        <input
          type="search"
          className="table-toolbar__search"
          placeholder="Buscar por nombre o equipo..."
          value={savedListSearch}
          onChange={(e) => setSavedListSearch(e.target.value)}
          aria-label="Buscar análisis guardados"
        />
      </div>

      {groups.length === 0 ? (
        <p className="dashboard__muted">Sin resultados para la búsqueda.</p>
      ) : (
        <div className="fleet-grid">
          {groups.map((g) => {
            const latest = g.snapshots[0]
            const oldest = g.snapshots[g.snapshots.length - 1]
            const status = statusOf(latest.global_severity)
            const trend = trendOf(g.snapshots)
            const sm = STATUS_META[status]
            const tm = TREND_META[trend]
            const title = g.equipment || latest.name
            const open = expanded.has(g.key)
            const hasHistory = g.snapshots.length >= 2
            const cardClass = 'fleet-card fleet-card--' + status

            return (
              <Fragment key={g.key}>
                <article
                  className={cardClass}
                  onClick={() => onOpen(latest.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onOpen(latest.id)
                    }
                  }}
                >
                  <div className="fleet-card__head">
                    <span className="fleet-card__dot" aria-hidden="true">{sm.dot}</span>
                    <span className="fleet-card__title">{title}</span>
                    <span className={'fleet-card__trend fleet-card__trend--' + tm.cls} title={tm.label}>
                      {tm.icon}
                    </span>
                  </div>

                  <div className="fleet-card__status-row">
                    <span className={'fleet-card__status fleet-card__status--' + status}>{sm.label}</span>
                    {hasHistory && (
                      <span className="fleet-card__snaps">{g.snapshots.length} lecturas</span>
                    )}
                  </div>

                  <div className="fleet-card__meta">
                    {g.equipment && latest.name !== g.equipment && (
                      <span className="fleet-card__name">{latest.name}</span>
                    )}
                    <span className="fleet-card__updated">Última lectura {relativeTime(latest.created_at)}</span>
                  </div>

                  <div className="fleet-card__actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="dashboard__btn dashboard__btn--small dashboard__btn--primary"
                      onClick={() => onOpen(latest.id)}
                    >
                      Abrir
                    </button>
                    {hasHistory && (
                      <button
                        type="button"
                        className="dashboard__btn dashboard__btn--small"
                        onClick={() => toggle(g.key)}
                        aria-expanded={open}
                      >
                        {open ? 'Ocultar histórico' : 'Ver histórico'}
                      </button>
                    )}
                    {!hasHistory && (
                      <button
                        type="button"
                        className="dashboard__btn dashboard__btn--small"
                        disabled={deletingId !== null}
                        onClick={() => onDelete({ id: latest.id, name: latest.name })}
                      >
                        {deletingId === latest.id ? 'Borrando…' : 'Borrar'}
                      </button>
                    )}
                  </div>
                </article>

                {open && hasHistory && (
                  <div className="fleet-history" onClick={(e) => e.stopPropagation()}>
                    <div className="fleet-history__range">
                      {formatDateTime(oldest.created_at)} → {formatDateTime(latest.created_at)}
                    </div>
                    <ul className="fleet-history__list">
                      {g.snapshots.map((s) => (
                        <li key={s.id} className="fleet-history__item">
                          <span className="fleet-history__dot" aria-hidden="true">
                            {STATUS_META[statusOf(s.global_severity)].dot}
                          </span>
                          <span className="fleet-history__name">{s.name}</span>
                          <span className="fleet-history__date">{formatDateTime(s.created_at)}</span>
                          <span className="fleet-history__actions">
                            <button
                              type="button"
                              className="dashboard__btn dashboard__btn--small"
                              onClick={() => onOpen(s.id)}
                            >
                              Abrir
                            </button>
                            <button
                              type="button"
                              className="dashboard__btn dashboard__btn--small"
                              disabled={deletingId !== null}
                              onClick={() => onDelete({ id: s.id, name: s.name })}
                            >
                              {deletingId === s.id ? 'Borrando…' : 'Borrar'}
                            </button>
                          </span>
                        </li>
                      ))}
                    </ul>
                    {g.equipment && (
                      <EquipmentTimeline embedded equipmentId={g.equipment} snapshots={g.snapshots} />
                    )}
                  </div>
                )}
              </Fragment>
            )
          })}
        </div>
      )}
    </div>
  )
}
