import { useEffect, useState } from 'react'
import { formatDateTime } from '../../hooks/useDateFilter'
import { getDeviceHealth } from '../../services/api'
import type { SavedAnalysisFull, CompareResponse, DeviceHealth } from '../../types/api'

const HEALTH_ICON: Record<DeviceHealth['status'], string> = {
  RED: '🔴',
  YELLOW: '🟡',
  GREEN: '🟢',
}

function DeviceHealthBar({ id }: { id: string }) {
  const [health, setHealth] = useState<DeviceHealth | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ctrl = new AbortController()
    getDeviceHealth(id, ctrl.signal)
      .then((h) => setHealth(h))
      .catch(() => {
        if (!ctrl.signal.aborted) setHealth(null)
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false)
      })
    return () => ctrl.abort()
  }, [id])

  if (loading) {
    return <div className="device-health device-health--loading">Evaluando salud del equipo…</div>
  }
  if (!health) return null

  const modifier = health.status.toLowerCase()
  return (
    <div
      className={`device-health device-health--${modifier}`}
      role="status"
      aria-live="polite"
    >
      <span className="device-health__pulse" aria-hidden="true" />
      <span className="device-health__icon" aria-hidden="true">
        {HEALTH_ICON[health.status]}
      </span>
      <div className="device-health__body">
        <p className="device-health__title">
          Estado del Dispositivo: {health.label}
          <span className="device-health__reco"> — {health.recommendation}</span>
        </p>
        <p className="device-health__reason">{health.reason}</p>
      </div>
    </div>
  )
}

interface SavedAnalysisDetailProps {
  savedDetail: SavedAnalysisFull | null
  deletingId: string | null
  compareResult: CompareResponse | null
  onDelete: (item: { id: string; name: string }) => void
  onCompare: () => void
}

export function SavedAnalysisDetail({
  savedDetail,
  deletingId,
  compareResult,
  onDelete,
  onCompare,
}: SavedAnalysisDetailProps) {
  if (!savedDetail) {
    return (
      <div className="dashboard__saved-section">
        <p className="dashboard__muted dashboard__muted--top">Cargando…</p>
      </div>
    )
  }

  return (
    <div className="dashboard__saved-section">
      <DeviceHealthBar key={savedDetail.id} id={savedDetail.id} />
      {savedDetail.equipment_identifier && (
        <p className="dashboard__muted">Equipo: {savedDetail.equipment_identifier}</p>
      )}
      <p className="dashboard__muted">
        Severidad: {savedDetail.global_severity} · Guardado:{' '}
        {formatDateTime(savedDetail.created_at)}
      </p>
      <div className="dashboard__saved-actions">
        <button
          type="button"
          className="dashboard__btn dashboard__btn--primary"
          onClick={onCompare}
        >
          Comparar con log
        </button>
        <button
          type="button"
          className="dashboard__btn dashboard__btn--secondary"
          disabled={deletingId !== null}
          onClick={() => onDelete({ id: savedDetail.id, name: savedDetail.name })}
        >
          {deletingId === savedDetail.id ? 'Borrando…' : 'Borrar'}
        </button>
      </div>
      <div className="table-wrap table-wrap--top-16">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th scope="col">Código</th>
              <th scope="col">Clasificación</th>
              <th scope="col">Severidad</th>
              <th scope="col">Ocurrencias</th>
              <th scope="col">Último evento</th>
            </tr>
          </thead>
          <tbody>
            {savedDetail.incidents.map((inc, i) => (
              <tr key={inc.code + String(i)}>
                <td>{inc.code}</td>
                <td>{inc.classification}</td>
                <td>{inc.severity}</td>
                <td>{inc.occurrences}</td>
                <td>
                  {inc.last_event_time || inc.end_time
                    ? formatDateTime(inc.last_event_time || inc.end_time)
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {compareResult && (
        <div className="dashboard__compare-block">
          <h3 className="dashboard__subheader-title">Comparación con el log nuevo</h3>
          <div className="dashboard__diff-grid">
            <div>
              <strong>Días desde guardado:</strong> {compareResult.diff.diferencia_dias}
            </div>
            <div>
              <strong>Tendencia:</strong> {compareResult.diff.tendencia}
            </div>
            {compareResult.diff.codigos_nuevos.length > 0 && (
              <div>
                <strong>Códigos nuevos:</strong> {compareResult.diff.codigos_nuevos.join(', ')}
              </div>
            )}
            {compareResult.diff.codigos_desaparecidos.length > 0 && (
              <div>
                <strong>Códigos que desaparecieron:</strong>{' '}
                {compareResult.diff.codigos_desaparecidos.join(', ')}
              </div>
            )}
            {compareResult.diff.cambios_ocurrencias.length > 0 && (
              <div>
                <strong>Cambios en ocurrencias:</strong>
                <ul>
                  {compareResult.diff.cambios_ocurrencias.map((c) => (
                    <li key={c.code}>
                      {c.code}: {c.saved_occurrences} → {c.current_occurrences} (
                      {c.delta >= 0 ? '+' : ''}
                      {c.delta})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <h4>Análisis del log nuevo</h4>
          <div className="table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th scope="col">Código</th>
                  <th scope="col">Clasificación</th>
                  <th scope="col">Severidad</th>
                  <th scope="col">Ocurrencias</th>
                  <th scope="col">Último evento</th>
                </tr>
              </thead>
              <tbody>
                {compareResult.current.incidents.map((inc) => (
                  <tr key={inc.id}>
                    <td>{inc.code}</td>
                    <td>{inc.classification}</td>
                    <td>{inc.severity}</td>
                    <td>{inc.occurrences}</td>
                    <td>{inc.end_time ? formatDateTime(inc.end_time) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}


