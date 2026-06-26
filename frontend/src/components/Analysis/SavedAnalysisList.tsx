import { Fragment, useState } from 'react'
import { AlertOctagon, AlertTriangle, CheckCircle2, Monitor, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { formatDateTime } from '../../hooks/useDateFilter'
import type { SavedAnalysisSummary } from '../../types/api'
import { EquipmentTimeline } from './EquipmentTimeline'
import { relativeTime } from '../Monitor/healthMetrics'
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

const STATUS_COLOR = {
  critical: { text: 'var(--noc-error)', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.25)',  label: 'Crítico'   },
  watch:    { text: 'var(--noc-warn)',  bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', label: 'Atención'  },
  healthy:  { text: 'var(--noc-ok)',   bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', label: 'Saludable' },
}

const TREND_CSS: Record<FleetTrend, { cls: string; label: string }> = {
  up:     { cls: 'noc-trend noc-trend--up',     label: '↑ Empeorando' },
  down:   { cls: 'noc-trend noc-trend--down',   label: '↓ Mejorando'  },
  stable: { cls: 'noc-trend noc-trend--stable', label: '↔ Estable'    },
}

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

function statusOf(sev: string): FleetStatus {
  const r = severityRank(sev)
  return r >= 3 ? 'critical' : r === 2 ? 'watch' : 'healthy'
}

function trendOf(snapshots: SavedAnalysisSummary[]): FleetTrend {
  if (snapshots.length < 2) return 'stable'
  const latest = severityRank(snapshots[0].global_severity)
  const prev   = severityRank(snapshots[1].global_severity)
  return latest > prev ? 'up' : latest < prev ? 'down' : 'stable'
}

function scoreColorVar(score: number): string {
  if (score >= 75) return 'var(--noc-ok)'
  if (score >= 45) return 'var(--noc-warn)'
  return 'var(--noc-error)'
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 22
  const circ = 2 * Math.PI * r
  const color = scoreColorVar(score)
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" style={{ flexShrink: 0 }}>
      <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4" />
      <circle
        cx="28" cy="28" r={r} fill="none"
        stroke={color} strokeWidth="4"
        strokeDasharray={`${(score / 100) * circ} ${circ}`}
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

function Sparkline({ scores, colorVar }: { scores: number[]; colorVar: string }) {
  if (scores.length < 2) return <div style={{ width: 88, height: 32 }} />
  const W = 88, H = 30
  const min = Math.min(...scores), max = Math.max(...scores)
  const range = max - min || 10
  const pts = scores.map((s, i) => {
    const x = (i / (scores.length - 1)) * W
    const y = H - ((s - min) / range) * (H - 8) - 4
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const [lx, ly] = pts[pts.length - 1].split(',')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ overflow: 'visible', flexShrink: 0 }}>
      <polyline points={pts.join(' ')} fill="none" stroke={colorVar} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="3.5" fill={colorVar} />
    </svg>
  )
}

function StatusPill({ status }: { status: FleetStatus }) {
  const s = STATUS_COLOR[status]
  return (
    <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, background: s.bg, color: s.text, border: `1px solid ${s.border}`, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
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
      if (existing != null) { groups[existing].snapshots.push(s); continue }
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

  return (
    <div className="noc-stack animate-in" style={{ paddingTop: '8px' }}>

      {/* ── Section header ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h4 style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--hp-blue-vibrant)', margin: '0 0 4px', fontWeight: 800, letterSpacing: '0.05em' }}>
            Historial de Incidentes
          </h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Evolución de dispositivos y diagnóstico de flota
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {savedList && savedList.length > 0 && (
            <input
              type="search"
              className="table-toolbar__search"
              placeholder="Buscar equipo o nombre..."
              value={savedListSearch}
              onChange={(e) => setSavedListSearch(e.target.value)}
              aria-label="Buscar análisis guardados"
              style={{ width: '220px', height: '38px', borderRadius: '10px', margin: 0 }}
            />
          )}
          <button type="button" className="dashboard__btn dashboard__btn--primary" onClick={() => setLogModalOpen(true)}>
            <Plus size={15} /> Analizar nuevo log
          </button>
        </div>
      </div>

      {savedList === null ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Cargando…</p>
      ) : savedList.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No hay incidentes guardados.</p>
      ) : (
        <>
          {/* ── NOC KPI bar ──────────────────────────────────────────────── */}
          <div className="noc-kpis">
            <div className="noc-kpi noc-kpi--info">
              <span className="noc-kpi__icon"><Monitor size={22} /></span>
              <span className="noc-kpi__value">{groups.length}</span>
              <span className="noc-kpi__label">Equipos</span>
            </div>
            <div className="noc-kpi noc-kpi--error">
              <span className="noc-kpi__icon"><AlertOctagon size={22} /></span>
              <span className="noc-kpi__value">{fleet.critical}</span>
              <span className="noc-kpi__label">Críticos</span>
            </div>
            <div className="noc-kpi noc-kpi--warn">
              <span className="noc-kpi__icon"><AlertTriangle size={22} /></span>
              <span className="noc-kpi__value">{fleet.watch}</span>
              <span className="noc-kpi__label">Atención</span>
            </div>
            <div className="noc-kpi noc-kpi--ok">
              <span className="noc-kpi__icon"><CheckCircle2 size={22} /></span>
              <span className="noc-kpi__value">{fleet.healthy}</span>
              <span className="noc-kpi__label">Saludables</span>
            </div>
          </div>

          {/* ── Fleet grid ───────────────────────────────────────────────── */}
          {groups.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sin resultados.</p>
          ) : (
            <div className="fleet-grid">
              {groups.map((g) => {
                const latest     = g.snapshots[0]
                const status     = statusOf(latest.global_severity)
                const trend      = trendOf(g.snapshots)
                const s          = STATUS_COLOR[status]
                const open       = expanded.has(g.key)
                const hasHistory = g.snapshots.length >= 2
                const score      = severityToScore(latest.global_severity)
                const colorVar   = scoreColorVar(score)
                const title      = g.equipment || latest.name
                const sparkScores = [...g.snapshots].reverse().slice(-10).map((sn) => severityToScore(sn.global_severity))

                return (
                  <Fragment key={g.key}>
                    {/* ── Device card ──────────────────────────────── */}
                    <div
                      style={{
                        borderRadius: 'var(--noc-radius)',
                        border: `1px solid ${open ? s.text : s.border}`,
                        background: open ? `linear-gradient(135deg, ${s.bg}, var(--noc-panel-bg))` : 'var(--noc-panel-bg)',
                        backdropFilter: 'blur(20px)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s, background 0.2s',
                        boxShadow: open ? `0 0 20px ${s.bg}` : 'none',
                      }}
                      onClick={() => onOpen(latest.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(latest.id) } }}
                      role="button"
                      tabIndex={0}
                    >
                      {/* Top accent bar */}
                      <div style={{ height: '3px', background: s.text, boxShadow: `0 0 8px ${s.text}`, flexShrink: 0 }} />

                      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                        {/* Title + status */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.88rem', color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }} title={title}>
                            {title}
                          </span>
                          <StatusPill status={status} />
                        </div>

                        {/* Score ring + health bar + sparkline */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <ScoreRing score={score} />
                          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ flex: 1, height: '5px', background: 'rgba(255,255,255,0.07)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${score}%`, height: '100%', background: colorVar, borderRadius: '3px', transition: 'width 0.6s ease' }} />
                              </div>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{score}/100</span>
                            </div>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {hasHistory ? <><strong style={{ color: '#94a3b8' }}>{g.snapshots.length}</strong> lecturas</> : '1 lectura'}
                              {' · '}{relativeTime(latest.created_at)}
                            </span>
                            <span className={TREND_CSS[trend].cls}>{TREND_CSS[trend].label}</span>
                          </div>
                          {hasHistory && (
                            <div style={{ opacity: 0.8 }}>
                              <Sparkline scores={sparkScores} colorVar={colorVar} />
                            </div>
                          )}
                        </div>

                        {/* Footer */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}
                          onClick={(e) => e.stopPropagation()}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                            {formatDateTime(latest.created_at)}
                          </span>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="button" className="dashboard__btn dashboard__btn--small dashboard__btn--primary" onClick={() => onOpen(latest.id)}>
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
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── Evolution panel ──────────────────────────── */}
                    {open && hasHistory && (
                      <div className="fleet-history" style={{
                        background: 'var(--noc-panel-bg)',
                        border: 'var(--noc-panel-border)',
                        borderRadius: 'var(--noc-radius)',
                        padding: '20px 24px',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                          <h4 style={{ margin: 0, fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--hp-blue-vibrant)', fontWeight: 800, letterSpacing: '0.05em' }}>
                            Evolución — {g.equipment ?? latest.name}
                          </h4>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{g.snapshots.length} snapshots</span>
                        </div>

                        {g.equipment && (
                          <EquipmentTimeline embedded equipmentId={g.equipment} snapshots={g.snapshots} />
                        )}

                        <ul className="fleet-history__list" style={{ marginTop: g.equipment ? '16px' : 0 }}>
                          {g.snapshots.map((sn) => {
                            const st = statusOf(sn.global_severity)
                            const sc = STATUS_COLOR[st]
                            return (
                              <li key={sn.id} className="fleet-history__item">
                                <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700, background: sc.bg, color: sc.text, whiteSpace: 'nowrap' }}>
                                  {sc.label}
                                </span>
                                <span className="fleet-history__name">{sn.name}</span>
                                <span className="fleet-history__date">{formatDateTime(sn.created_at)}</span>
                                <span className="fleet-history__actions">
                                  <button type="button" className="dashboard__btn dashboard__btn--small" onClick={() => onOpen(sn.id)}>Abrir</button>
                                  <button type="button" className="dashboard__btn dashboard__btn--small" disabled={deletingId !== null} onClick={() => onDelete({ id: sn.id, name: sn.name })}>
                                    {deletingId === sn.id ? 'Borrando…' : 'Borrar'}
                                  </button>
                                </span>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
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
