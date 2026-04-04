import { formatDateTime } from '../hooks/useDateFilter'
import type { SavedAnalysisSummary } from '../types/api'
import { EquipmentTimeline } from './EquipmentTimeline'

interface SavedAnalysisListProps {
  savedList: SavedAnalysisSummary[] | null
  savedListSearch: string
  setSavedListSearch: (v: string) => void
  deletingId: string | null
  onBack: () => void
  onOpen: (id: string) => void
  onDelete: (item: { id: string; name: string }) => void
}

export function SavedAnalysisList({
  savedList,
  savedListSearch,
  setSavedListSearch,
  deletingId,
  onBack,
  onOpen,
  onDelete,
}: SavedAnalysisListProps) {
  const filtered = savedList?.filter((s) => {
    const q = savedListSearch.trim().toLowerCase()
    if (!q) return true
    return (
      s.name.toLowerCase().includes(q) ||
      (s.equipment_identifier ?? '').toLowerCase().includes(q)
    )
  })

  // Groups with 3+ snapshots for the same non-empty equipment_identifier
  const timelineGroups: { equipmentId: string; snapshots: SavedAnalysisSummary[] }[] = []
  if (savedList && savedList.length >= 3) {
    const byEquipment = new Map<string, SavedAnalysisSummary[]>()
    for (const s of savedList) {
      const key = (s.equipment_identifier ?? '').trim()
      if (!key) continue
      const group = byEquipment.get(key) ?? []
      group.push(s)
      byEquipment.set(key, group)
    }
    for (const [equipmentId, snaps] of byEquipment) {
      if (snaps.length >= 3) timelineGroups.push({ equipmentId, snapshots: snaps })
    }
  }

  return (
    <div className="dashboard__saved-section">
      <button
        type="button"
        className="dashboard__btn dashboard__btn--secondary"
        onClick={onBack}
      >
        ← Volver al dashboard
      </button>
      <h2 className="dashboard__subheader-title">Incidentes guardados</h2>
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
              {(filtered ?? []).map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.equipment_identifier ?? '—'}</td>
                  <td>{s.global_severity}</td>
                  <td>{formatDateTime(s.created_at)}</td>
                  <td>
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {timelineGroups.length > 0 && (
        <div className="equipment-timeline__section">
          <h3 className="equipment-timeline__section-title">Evolución por equipo</h3>
          {timelineGroups.map(({ equipmentId, snapshots }) => (
            <EquipmentTimeline key={equipmentId} equipmentId={equipmentId} snapshots={snapshots} />
          ))}
        </div>
      )}
    </div>
  )
}
