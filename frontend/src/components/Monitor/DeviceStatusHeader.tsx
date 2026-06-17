import { Printer } from 'lucide-react'
import type { DeviceStatus } from './healthMetrics'
import { relativeTime } from './healthMetrics'

interface DeviceStatusHeaderProps {
  modelName: string | null
  serialNumber: string | null
  status: DeviceStatus
  lastUpdateIso: string | null
  availability: number
  errorCount: number
  warningCount: number
}

const STATUS_META: Record<DeviceStatus, { label: string; dot: string }> = {
  critical: { label: 'Crítico', dot: '🔴' },
  watch: { label: 'Atención', dot: '🟡' },
  healthy: { label: 'Saludable', dot: '🟢' },
}

export function DeviceStatusHeader({
  modelName,
  serialNumber,
  status,
  lastUpdateIso,
  availability,
  errorCount,
  warningCount,
}: DeviceStatusHeaderProps) {
  const meta = STATUS_META[status]
  const rootClass = `noc-device noc-device--${status}`

  return (
    <header className={rootClass}>
      <div className="noc-device__identity">
        <span className="noc-device__icon" aria-hidden="true">
          <Printer size={28} />
        </span>
        <div>
          <h2 className="noc-device__model">{modelName || 'Dispositivo'}</h2>
          {serialNumber && <span className="noc-device__serial">{serialNumber}</span>}
        </div>
      </div>

      <div className="noc-device__status">
        <span className="noc-device__status-badge">
          <span aria-hidden="true">{meta.dot}</span>
          Estado actual: {meta.label}
        </span>
        <span className="noc-device__updated">Última actualización: {relativeTime(lastUpdateIso)}</span>
      </div>

      <div className="noc-device__stats">
        <div className="noc-device__stat">
          <span className="noc-device__stat-value">{availability.toFixed(1)}%</span>
          <span className="noc-device__stat-label">Disponibilidad</span>
        </div>
        <div className="noc-device__stat noc-device__stat--error">
          <span className="noc-device__stat-value">{errorCount}</span>
          <span className="noc-device__stat-label">Errores activos</span>
        </div>
        <div className="noc-device__stat noc-device__stat--warn">
          <span className="noc-device__stat-value">{warningCount}</span>
          <span className="noc-device__stat-label">Advertencias</span>
        </div>
      </div>
    </header>
  )
}
