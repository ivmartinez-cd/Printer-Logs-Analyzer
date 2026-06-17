import { AlertOctagon, AlertTriangle, Activity, Gauge } from 'lucide-react'

interface NocKpiCardsProps {
  errorCount: number
  warningCount: number
  incidentCount: number
  availability: number
}

export function NocKpiCards({
  errorCount,
  warningCount,
  incidentCount,
  availability,
}: NocKpiCardsProps) {
  const availabilityVariant = availability >= 99 ? 'ok' : availability >= 95 ? 'warn' : 'error'

  const cards = [
    {
      key: 'errors',
      icon: <AlertOctagon size={22} />,
      label: 'Errores',
      value: errorCount,
      variant: errorCount > 0 ? 'error' : 'ok',
    },
    {
      key: 'warnings',
      icon: <AlertTriangle size={22} />,
      label: 'Advertencias',
      value: warningCount,
      variant: warningCount > 0 ? 'warn' : 'ok',
    },
    {
      key: 'incidents',
      icon: <Activity size={22} />,
      label: 'Incidentes',
      value: incidentCount,
      variant: 'info',
    },
    {
      key: 'availability',
      icon: <Gauge size={22} />,
      label: 'Disponibilidad',
      value: `${availability.toFixed(1)}%`,
      variant: availabilityVariant,
    },
  ] as const

  return (
    <div className="noc-kpis">
      {cards.map((c) => (
        <div key={c.key} className={'noc-kpi noc-kpi--' + c.variant}>
          <span className="noc-kpi__icon" aria-hidden="true">
            {c.icon}
          </span>
          <span className="noc-kpi__value">{c.value}</span>
          <span className="noc-kpi__label">{c.label}</span>
        </div>
      ))}
    </div>
  )
}
