import { useEffect, useRef, useState } from 'react'
import { getInsightAlerts } from '../services/api'
import type { DeviceAlertsResponse, InsightAlert } from '../types/api'

interface InsightAlertsPanelProps {
  serial: string | null
}

const ALERT_CLASS_LABEL: Record<string, string> = {
  SYSTEM_WARNING: 'Sistema',
  OTHER: 'Otro',
  SUPPLY: 'Consumible',
  PAPER_JAM: 'Atasco de papel',
  OFFLINE: 'Sin conexión',
  DOOR_OPEN: 'Puerta abierta',
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function SeverityBadge({ level }: { level: number }) {
  const label = level >= 4 ? 'Crítico' : level >= 3 ? 'Moderado' : 'Bajo'
  const mod = level >= 4 ? 'critical' : level >= 3 ? 'moderate' : 'low'
  return (
    <span className={`insight-alerts-panel__severity insight-alerts-panel__severity--${mod}`}>
      {label}
    </span>
  )
}

function AlertsTable({ alerts, emptyText }: { alerts: InsightAlert[]; emptyText: string }) {
  if (alerts.length === 0) {
    return <p className="insight-alerts-panel__empty">{emptyText}</p>
  }
  return (
    <div className="table-wrap">
      <table className="dashboard-table insight-alerts-panel__table">
        <thead>
          <tr>
            <th scope="col">Fecha</th>
            <th scope="col">Clase</th>
            <th scope="col">Descripción</th>
            <th scope="col">Severidad</th>
            <th scope="col">Ciclos motor</th>
            <th scope="col">Resuelto</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((a, i) => (
            <tr key={`${a.date}-${a.mibCode}-${i}`}>
              <td>{formatDate(a.date)}</td>
              <td>
                <span className="insight-alerts-panel__class">
                  {ALERT_CLASS_LABEL[a.alertClass] ?? a.alertClass}
                </span>
              </td>
              <td>{a.description}</td>
              <td>
                <SeverityBadge level={a.severityLevel} />
              </td>
              <td className="insight-alerts-panel__num">
                {a.engineCycles.toLocaleString('es-AR')}
              </td>
              <td>
                {a.cleared ? (
                  <span className="insight-alerts-panel__cleared">{formatDate(a.cleared)}</span>
                ) : (
                  <span className="insight-alerts-panel__active">Activa ●</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function InsightAlertsPanel({ serial }: InsightAlertsPanelProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [data, setData] = useState<DeviceAlertsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [prevSerial, setPrevSerial] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current')

  // Patrón recomendado: Resetear estado durante el render cuando cambian las props
  // Esto evita el error de "setState in effect" y renders en cascada.
  if (serial !== prevSerial) {
    setPrevSerial(serial)
    setData(null)
    setError(null)
    setLoading(false)
  }

  useEffect(() => {
    if (!serial) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await getInsightAlerts(serial, controller.signal)
        if (!controller.signal.aborted) setData(res)
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Error al consultar alertas del portal')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void fetchData()
    return () => controller.abort()
  }, [serial])


  // Hide panel when not configured or no serial
  if (!serial) return null
  if (data && !data.insight_configured) return null

  const currentAlerts = data?.current ?? []
  const historyAlerts = data?.history ?? []
  const totalAlerts = currentAlerts.length + historyAlerts.length
  const hasActiveAlert = currentAlerts.length > 0

  return (
    <section
      className={`collapsible-panel collapsible-panel--insight${hasActiveAlert ? ' collapsible-panel--insight-active' : ''}`}
    >
      <button
        type="button"
        className="collapsible-panel__header"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
      >
        <span className="collapsible-panel__title">
          🔔 Alertas del portal SDS
          {serial && (
            <span className="insight-alerts-panel__serial"> · {serial}</span>
          )}
          {!loading && data && (
            <span className="insight-alerts-panel__count">
              {' '}({totalAlerts})
            </span>
          )}
        </span>
        <span
          className={`collapsible-panel__chevron${!collapsed ? ' collapsible-panel__chevron--expanded' : ''}`}
          aria-hidden="true"
        >
          ▶
        </span>
      </button>

      {!collapsed && (
        <div className="collapsible-panel__body">
          {loading && (
            <div className="insight-alerts-panel__loading">
              <span className="insight-alerts-panel__spinner" aria-hidden="true" />
              Consultando portal HP SDS…
            </div>
          )}

          {error && (
            <p className="insight-alerts-panel__error">⚠ {error}</p>
          )}

          {data && data.insight_configured && !loading && (
            <>
              {(data.model || data.zone) && (
                <div className="insight-alerts-panel__meta">
                  {data.model && <span className="insight-alerts-panel__meta-item">📠 {data.model}</span>}
                  {data.zone && <span className="insight-alerts-panel__meta-item">📍 {data.zone}</span>}
                </div>
              )}

              <div className="insight-alerts-panel__tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'current'}
                  className={`insight-alerts-panel__tab${activeTab === 'current' ? ' insight-alerts-panel__tab--active' : ''}`}
                  onClick={() => setActiveTab('current')}
                >
                  Activas
                  {currentAlerts.length > 0 && (
                    <span className="insight-alerts-panel__tab-badge">{currentAlerts.length}</span>
                  )}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'history'}
                  className={`insight-alerts-panel__tab${activeTab === 'history' ? ' insight-alerts-panel__tab--active' : ''}`}
                  onClick={() => setActiveTab('history')}
                >
                  Historial
                  {historyAlerts.length > 0 && (
                    <span className="insight-alerts-panel__tab-badge">{historyAlerts.length}</span>
                  )}
                </button>
              </div>

              {activeTab === 'current' && (
                <AlertsTable
                  alerts={currentAlerts}
                  emptyText="✅ Sin alertas activas en este momento."
                />
              )}
              {activeTab === 'history' && (
                <AlertsTable
                  alerts={historyAlerts}
                  emptyText="Sin alertas en el historial."
                />
              )}
            </>
          )}
        </div>
      )}
    </section>
  )
}
