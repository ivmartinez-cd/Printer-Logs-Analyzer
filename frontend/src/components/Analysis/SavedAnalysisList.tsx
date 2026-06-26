import { Fragment, useState } from 'react'
import { formatDateTime } from '../../hooks/useDateFilter'
import type { SavedAnalysisSummary } from '../../types/api'
import { EquipmentTimeline } from './EquipmentTimeline'
import { relativeTime } from '../Monitor/healthMetrics'
import { GlassCard } from '../ui/GlassCard'
import { Badge } from '../ui/Badge'
import { Plus, ChevronDown, ChevronUp } from 'lucide-react'
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
  return !!equipment && equipment.toLowerCase() !== 'desconocido'
}

function severityRank(sev: string): number {
  const s = (sev || '').toUpperCase()
  if (s.includes('ERROR') || s.includes('CRIT')) return 3
  if (s.includes('WARN')) return 2
  if (s.includes('INFO')) return 1
  return 0
}

function severityToScore(sev: string): number {
  const s = (sev || '').toUpperCase()
  if (s.includes('ERROR') || s.includes('CRIT')) return 25
  if (s.includes('WARN')) return 58
  if (s.includes('INFO')) return 82
  return 90
}

function scoreColor(score: number): string {
  if (score >= 75) return '#22c55e'
  if (score >= 45) return '#eab308'
  return '#ef4444'
}

function statusOf(sev: string): FleetStatus {
  const r = severityRank(sev)
  return r >= 3 ? 'critical' : r === 2 ? 'watch' : 'healthy'
}

const STATUS_META: Record<FleetStatus, { label: string; badge: BadgeStatus }> = {
  critical: { label: 'Crítico', badge: 'error' },
  watch:    { label: 'Atención', badge: 'warning' },
  healthy:  { label: 'Saludable', badge: 'success' },
}

const TREND_META: Record<FleetTrend, { icon: string; label: string; badge: BadgeStatus }> = {
  up:     { icon: '↑', label: 'Empeorando', badge: 'error' },
  down:   { icon: '↓', label: 'Mejorando',  badge: 'success' },
  stable: { icon: '↔', label: 'Estable',    badge: 'default' },
}

function trendOf(snapshots: SavedAnalysisSummary[]): FleetTrend {
  if (snapshots.length < 2) return 'stable'
  const latest = severityRank(snapshots[0].global_severity)
  const prev   = severityRank(snapshots[1].global_severity)
  return latest > prev ? 'up' : latest < prev ? 'down' : 'stable'
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 22
  const circumference = 2 * Math.PI * r
  const filled = (score / 100) * circumference
  const color = scoreColor(score)
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" style={{ flexShrink: 0 }}>
      <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4" />
      <circle
        cx="28" cy="28" r={r} fill="none"
        stroke={color} strokeWidth="4"
        strokeDasharray={`${filled} ${circumference}`}
        strokeLinecap="round"
        transform="rotate(-90 28 28)"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text x="28" y="33" textAnchor="middle" fill={color} fontSize="12" fontWeight="800" fontFamily="monospace">
        {score}
      </text>
    </svg>
  )
}

function Sparkline({ scores, color }: { scores: number[]; color: string }) {
  if (scores.length < 2) return <div style={{ width: 88, height: 36 }} />
  const W = 88, H = 34
  const min = Math.min(...scores)
  const max = Math.max(...scores)
  const range = max - min || 10
  const pts = scores.map((s, i) => {
    const x = (i / (scores.length - 1)) * W
    const y = H - ((s - min) / range) * (H - 8) - 4
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const [lx, ly] = pts[pts.length - 1].split(',')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ overflow: 'visible', flexShrink: 0 }}>
      <polyline
        points={pts.join(' ')}
        fill="none" stroke={color}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
      <circle cx={lx} cy={ly} r="3.5" fill={color} />
    </svg>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function SavedAnalysisList({
  savedList,
  savedListSearch,
  setSavedListSearch,
  deletingId,
  onOpen,
  onDelete,
}: SavedAnalysisListProps) {
  const { setLogModalOpen } = useUIStore()
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
    return s.name.toLowerCase().includes(q) || (s.equipment_identifier ?? '').toLowerCase().includes(q)
  })

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

  const fleet = groups.reduce(
    (acc, g) => { acc[statusOf(g.snapshots[0].global_severity)]++; return acc },
    { critical: 0, watch: 0, healthy: 0 }
  )

  const kpis: { value: number; label: string; status: BadgeStatus; key: string }[] = [
    { key: 'total',    value: groups.length,  label: 'Equipos',    status: 'info' },
    { key: 'critical', value: fleet.critical, label: 'Críticos',   status: 'error' },
    { key: 'watch',    value: fleet.watch,    label: 'Atención',   status: 'warning' },
    { key: 'healthy',  value: fleet.healthy,  label: 'Saludables', status: 'success' },
  ]

  return (
    <div className="dashboard__saved-section fleet-overview animate-in">
      <header className="dashboard__subheader">
        <div className="dashboard__subheader-title-group">
          <h2 className="dashboard__subheader-title">Historial de Incidentes</h2>
          <p className="dashboard__subheader-meta">Evolución de dispositivos y diagnóstico de flota</p>
        </div>
        <div className="dashboard__subheader-actions">
          {savedList && savedList.length > 0 && (
            <input
              type="search"
              className="table-toolbar__search"
              placeholder="Buscar equipo o nombre..."
              value={savedListSearch}
              onChange={(e) => setSavedListSearch(e.target.value)}
              aria-label="Buscar análisis guardados"
              style={{ width: '240px', height: '40px', borderRadius: '12px', margin: 0 }}
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
          {/* Fleet KPI bar */}
          <div className="fleet-kpis animate-fade-in">
            {kpis.map((k) => (
              <GlassCard key={k.key} variant="secondary" className={'fleet-kpi fleet-kpi--' + k.status}>
                <span className="fleet-kpi__value">{k.value}</span>
                <Badge status={k.status} pulsing={k.status !== 'info'}>{k.label}</Badge>
              </GlassCard>
            ))}
          </div>

          {groups.length === 0 ? (
            <p className="dashboard__muted animate-fade-in delay-2" style={{ padding: '20px 0' }}>
              Sin resultados.
            </p>
          ) : (
            <div className="fleet-grid animate-fade-in delay-2">
              {groups.map((g) => {
                const latest     = g.snapshots[0]
                const status     = statusOf(latest.global_severity)
                const trend      = trendOf(g.snapshots)
                const sm         = STATUS_META[status]
                const tm         = TREND_META[trend]
                const title      = g.equipment || latest.name
                const open       = expanded.has(g.key)
                const hasHistory = g.snapshots.length >= 2
                const score      = severityToScore(latest.global_severity)
                const color      = scoreColor(score)

                // Sparkline: chronological order (oldest → newest), up to 10 points
                const sparkScores = [...g.snapshots]
                  .reverse()
                  .slice(-10)
                  .map((s) => severityToScore(s.global_severity))

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
                        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(latest.id) }
                      }}
                    >
                      {/* ── Head: device name + status badge ── */}
                      <div className="fleet-card__head">
                        <span className="fleet-card__title" title={title}>{title}</span>
                        <Badge status={sm.badge} pulsing>{sm.label}</Badge>
                      </div>

                      {/* ── Body: score ring + health bar + sparkline ── */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <ScoreRing score={score} />

                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {/* Health bar */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              flex: 1, height: '5px',
                              background: 'rgba(255,255,255,0.07)',
                              borderRadius: '3px', overflow: 'hidden',
                            }}>
                              <div style={{
                                width: `${score}%`, height: '100%',
                                background: color, borderRadius: '3px',
                                transition: 'width 0.6s ease',
                              }} />
                            </div>
                            <span style={{ fontSize: '0.72rem', color: '#475569', whiteSpace: 'nowrap' }}>
                              {score}/100
                            </span>
                          </div>

                          {/* Meta */}
                          <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>
                            {hasHistory
                              ? <><strong style={{ color: '#94a3b8' }}>{g.snapshots.length}</strong> lecturas</>
                              : '1 lectura'
                            }
                            {' · '}{relativeTime(latest.created_at)}
                          </div>

                          {/* Trend */}
                          <Badge status={tm.badge}>{tm.icon} {tm.label}</Badge>
                        </div>

                        {/* Sparkline (only if ≥2 readings) */}
                        {hasHistory && (
                          <div style={{ opacity: 0.85 }}>
                            <Sparkline scores={sparkScores} color={color} />
                          </div>
                        )}
                      </div>

                      {/* ── Footer: actions ── */}
                      <div className="fleet-card__footer" onClick={(e) => e.stopPropagation()}>
                        <span style={{ fontSize: '0.75rem', color: '#475569' }}>
                          {formatDateTime(latest.created_at)}
                        </span>
                        <span className="fleet-card__actions">
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
                              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                              {open ? 'Ocultar' : 'Evolución'}
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

                    {/* ── Evolution panel (EquipmentTimeline) ── */}
                    {open && hasHistory && g.equipment && (
                      <GlassCard variant="secondary" className="fleet-history">
                        <div style={{
                          display: 'flex', justifyContent: 'space-between',
                          alignItems: 'center', marginBottom: '12px',
                        }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0' }}>
                            Evolución — {g.equipment}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#475569' }}>
                            {g.snapshots.length} snapshots
                          </span>
                        </div>
                        <EquipmentTimeline
                          embedded
                          equipmentId={g.equipment}
                          snapshots={g.snapshots}
                        />
                        {/* Snapshot list for individual actions */}
                        <ul className="fleet-history__list" style={{ marginTop: '16px' }}>
                          {g.snapshots.map((s) => (
                            <li key={s.id} className="fleet-history__item">
                              <Badge status={STATUS_META[statusOf(s.global_severity)].badge}>
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
                      </GlassCard>
                    )}

                    {/* Solo snapshot (no equipment) — evolution not available */}
                    {open && hasHistory && !g.equipment && (
                      <GlassCard variant="secondary" className="fleet-history">
                        <ul className="fleet-history__list">
                          {g.snapshots.map((s) => (
                            <li key={s.id} className="fleet-history__item">
                              <Badge status={STATUS_META[statusOf(s.global_severity)].badge}>
                                {STATUS_META[statusOf(s.global_severity)].label}
                              </Badge>
                              <span className="fleet-history__name">{s.name}</span>
                              <span className="fleet-history__date">{formatDateTime(s.created_at)}</span>
                              <span className="fleet-history__actions">
                                <button
                                  type="button"
                                  className="dashboard__btn dashboard__btn--small"
                                  onClick={() => onOpen(s.id)}
                                >Abrir</button>
                                <button
                                  type="button"
                                  className="dashboard__btn dashboard__btn--small"
                                  disabled={deletingId !== null}
                                  onClick={() => onDelete({ id: s.id, name: s.name })}
                                >{deletingId === s.id ? 'Borrando…' : 'Borrar'}</button>
                              </span>
                            </li>
                          ))}
                        </ul>
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
