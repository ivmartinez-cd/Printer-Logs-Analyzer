import { Fragment, useState } from 'react'
import { formatDateTime } from '../../hooks/useDateFilter'
import type { SavedAnalysisSummary } from '../../types/api'
import { EquipmentTimeline } from './EquipmentTimeline'
import { relativeTime } from '../Monitor/healthMetrics'
import { GlassCard } from '../ui/GlassCard'
import { Badge } from '../ui/Badge'
import { Plus } from 'lucide-react'
import { useUIStore } from '../../store/useUIStore'

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
type BadgeStatus = 'success' | 'warning' | 'error' | 'info' | 'offline' | 'default'

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

const STATUS_META: Record<FleetStatus, { label: string; badge: BadgeStatus }> = {
  critical: { label: 'Crítico', badge: 'error' },
  watch: { label: 'Atención', badge: 'warning' },
  healthy: { label: 'Saludable', badge: 'success' },
}

const TREND_META: Record<FleetTrend, { icon: string; label: string; badge: BadgeStatus }> = {
  up: { icon: '↑', label: 'Empeorando', badge: 'error' },
  down: { icon: '↓', label: 'Mejorando', badge: 'success' },
  stable: { icon: '↔', label: 'Estable', badge: 'default' },
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
  const { setLogModalOpen } = useUIStore()
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
      acc[statusOf(g.snapshots[0].global_severity)]++
      return acc
    },
    { critical: 0, watch: 0, healthy: 0 }
  )

  const kpis: { value: number; label: string; status: BadgeStatus; key: string }[] = [
    { key: 'total', value: groups.length, label: 'Equipos monitoreados', status: 'info' },
    { key: 'critical', value: fleet.critical, label: 'En crítico', status: 'error' },
    { key: 'watch', value: fleet.watch, label: 'En atención', status: 'warning' },
    { key: 'healthy', value: fleet.healthy, label: 'Saludables', status: 'success' },
  ]

  return (
    <div className="dashboard__saved-section fleet-overview animate-in">
      <header className="dashboard__subheader">
        <div className="dashboard__subheader-title-group">
          <h2 className="dashboard__subheader-title">Historial de Incidentes</h2>
          <p className="dashboard__subheader-meta">Historial de análisis de dispositivos y diagnóstico de flota</p>
        </div>
        <div className="dashboard__subheader-actions">
          {savedList && savedList.length > 0 && (
            <input
              type="search"
              className="table-toolbar__search"
              placeholder="Buscar por nombre o equipo..."
              value={savedListSearch}
              onChange={(e) => setSavedListSearch(e.target.value)}
              aria-label="Buscar análisis guardados"
              style={{ width: '260px', height: '40px', borderRadius: '12px', margin: 0 }}
            />
          )}
          <button
            type="button"
            className="dashboard__btn dashboard__btn--primary"
            onClick={() => setLogModalOpen(true)}
          >
            <Plus size={16} />
            Analizar nuevo log
          </button>
        </div>
      </header>

      {savedList === null ? (
        <p className="dashboard__muted" style={{ padding: '20px 0' }}>Cargando…</p>
      ) : savedList.length === 0 ? (
        <p className="dashboard__muted" style={{ padding: '20px 0' }}>No hay incidentes guardados.</p>
      ) : (
        <>
          {/* Resumen de flota */}
          <div className="fleet-kpis animate-fade-in">
            {kpis.map((k) => (
              <GlassCard key={k.key} variant="secondary" className={'fleet-kpi fleet-kpi--' + k.status}>
                <span className="fleet-kpi__value">{k.value}</span>
                <Badge status={k.status} pulsing={k.status !== 'info'}>
                  {k.label}
                </Badge>
              </GlassCard>
            ))}
          </div>

          {groups.length === 0 ? (
            <p className="dashboard__muted animate-fade-in delay-2" style={{ padding: '20px 0' }}>Sin resultados para la búsqueda.</p>
          ) : (
            <div className="fleet-grid animate-fade-in delay-2">
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

                return (
                  <Fragment key={g.key}>
                    <GlassCard
                      variant="secondary"
                      hoverEffect
                      className={'fleet-card fleet-card--' + status}
                      role="button"
                      tabIndex={0}
                      onClick={() => onOpen(latest.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onOpen(latest.id)
                        }
                      }}
                    >
                      <div className="fleet-card__head">
                        <span className="fleet-card__title">{title}</span>
                        <Badge status={sm.badge} pulsing>
                          {sm.label}
                        </Badge>
                      </div>

                      <div className="fleet-card__meta">
                        {g.equipment && latest.name !== g.equipment && (
                          <span className="fleet-card__name">{latest.name}</span>
                        )}
                        <span className="fleet-card__date">{formatDateTime(latest.created_at)}</span>
                        <span className="fleet-card__updated">
                          Última lectura {relativeTime(latest.created_at)}
                          {hasHistory && ` · ${g.snapshots.length} lecturas`}
                        </span>
                      </div>

                      <div className="fleet-card__footer">
                        <Badge status={tm.badge}>
                          {tm.icon} {tm.label}
                        </Badge>
                        <span className="fleet-card__actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="dashboard__btn dashboard__btn--small dashboard__btn--primary"
                            onClick={() => onOpen(latest.id)}
                          >
                            Abrir
                          </button>
                          {hasHistory ? (
                            <button
                              type="button"
                              className="dashboard__btn dashboard__btn--small"
                              onClick={() => toggle(g.key)}
                              aria-expanded={open}
                            >
                              {open ? 'Ocultar histórico' : 'Ver histórico'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="dashboard__btn dashboard__btn--small"
                              disabled={deletingId !== null}
                              onClick={() => onDelete({ id: latest.id, name: latest.name })}
                            >
                              {deletingId === latest.id ? 'Borrando…' : 'Borrar'}
                            </button>
                          )}
                        </span>
                      </div>
                    </GlassCard>

                    {open && hasHistory && (
                      <GlassCard variant="secondary" className="fleet-history">
                        <div className="fleet-history__range">
                          {formatDateTime(oldest.created_at)} → {formatDateTime(latest.created_at)}
                        </div>
                        <ul className="fleet-history__list">
                          {g.snapshots.map((s) => (
                            <li key={s.id} className="fleet-history__item">
                              <Badge status={STATUS_META[statusOf(s.global_severity)].badge} pulsing>
                                {STATUS_META[statusOf(s.global_severity)].label}
                              </Badge>
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
                      </GlassCard>
                    )}
                  </Fragment>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
