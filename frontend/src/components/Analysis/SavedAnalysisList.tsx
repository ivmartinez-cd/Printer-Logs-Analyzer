import { Fragment, useState } from 'react'
import { formatDateTime } from '../../hooks/useDateFilter'
import type { SavedAnalysisSummary } from '../../types/api'
import { EquipmentTimeline } from './EquipmentTimeline'

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

function isGroupable(equipment: string): boolean {
  // Empty or the "Desconocido" placeholder must not lump unrelated devices.
  return !!equipment && equipment.toLowerCase() !== 'desconocido'
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
  // Devices without a real equipment stay as standalone rows.
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

  const renderActions = (s: SavedAnalysisSummary) => (
    <span className="dashboard-table__cell-actions dashboard-table__cell-actions--grouped">
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
  )

  return (
    <div className="dashboard__saved-section">
      {savedList !== null && savedList.length > 0 && (
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
      )}
      {savedList === null ? (
        <p className="dashboard__muted">Cargando…</p>
      ) : savedList.length === 0 ? (
        <p className="dashboard__muted">No hay incidentes guardados.</p>
      ) : (
        <div className="table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th scope="col">Nombre</th>
                <th scope="col">Equipo</th>
                <th scope="col">Severidad</th>
                <th scope="col">Fecha</th>
                <th scope="col" aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => {
                // Standalone snapshot (no grouping): render a plain row.
                if (g.snapshots.length === 1) {
                  const s = g.snapshots[0]
                  return (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{s.equipment_identifier ?? '—'}</td>
                      <td>{s.global_severity}</td>
                      <td>{formatDateTime(s.created_at)}</td>
                      <td>{renderActions(s)}</td>
                    </tr>
                  )
                }

                const latest = g.snapshots[0]
                const oldest = g.snapshots[g.snapshots.length - 1]
                const open = expanded.has(g.key)
                return (
                  <Fragment key={g.key}>
                    <tr
                      onClick={() => toggle(g.key)}
                      style={{ cursor: 'pointer', background: 'rgba(56,189,248,0.04)' }}
                    >
                      <td style={{ fontWeight: 700 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{open ? '▼' : '▶'}</span>
                          {g.equipment}
                          <span style={{ fontWeight: 500, color: '#64748b', fontSize: '0.8rem' }}>
                            ({g.snapshots.length} snapshots)
                          </span>
                        </span>
                      </td>
                      <td>{g.equipment}</td>
                      <td>{latest.global_severity}</td>
                      <td>
                        {formatDateTime(oldest.created_at)} → {formatDateTime(latest.created_at)}
                      </td>
                      <td>
                        <span className="dashboard-table__cell-actions dashboard-table__cell-actions--grouped">
                          <button
                            type="button"
                            className="dashboard__btn dashboard__btn--small"
                            onClick={(e) => {
                              e.stopPropagation()
                              onOpen(latest.id)
                            }}
                          >
                            Abrir último
                          </button>
                        </span>
                      </td>
                    </tr>
                    {open &&
                      g.snapshots.map((s) => (
                        <tr key={s.id} style={{ background: 'rgba(255,255,255,0.015)' }}>
                          <td style={{ paddingLeft: '32px', color: '#cbd5e1' }}>{s.name}</td>
                          <td />
                          <td>{s.global_severity}</td>
                          <td>{formatDateTime(s.created_at)}</td>
                          <td>{renderActions(s)}</td>
                        </tr>
                      ))}
                    {open && g.equipment && g.snapshots.length >= 3 && (
                      <tr style={{ background: 'rgba(255,255,255,0.015)' }}>
                        <td colSpan={5} style={{ padding: '4px 16px 16px 32px' }}>
                          <EquipmentTimeline
                            embedded
                            equipmentId={g.equipment}
                            snapshots={g.snapshots}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
