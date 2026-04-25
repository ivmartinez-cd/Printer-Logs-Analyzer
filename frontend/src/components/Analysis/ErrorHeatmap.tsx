import { useMemo, useState } from 'react'
import type { EnrichedEvent } from '../../types/api'
import { Portal } from '../ui/Portal'
import '../../styles/error-heatmap.css'

interface ErrorHeatmapProps {
  events: EnrichedEvent[]
  visibleSeverities: Set<string>
  onViewSolution: (code: string, sdsContent?: string | null, sdsUrl?: string | null) => void
  onEditCode: (code: string, description: string, severity: string, solutionUrl: string) => void
}

type CellData = {
  ERROR: number
  WARNING: number
  INFO: number
  total: number
  events: EnrichedEvent[]
}


const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

const SEVERITY_COLORS: Record<string, string> = {
  ERROR: '239, 68, 68', // Red-500
  WARNING: '245, 158, 11', // Amber-500
  INFO: '59, 130, 246',
  ALL: '59, 130, 246'
}

export function ErrorHeatmap({ events, visibleSeverities, onViewSolution, onEditCode }: ErrorHeatmapProps) {
  const [selectedCell, setSelectedCell] = useState<{ dayIdx: number; hour: number; data: CellData } | null>(null)

  const { matrix, maxCount, dateRangeText } = useMemo(() => {
    // Matrix [day][hour] = CellData
    const matrix: CellData[][] = Array.from({ length: 7 }, () => 
      Array.from({ length: 24 }, () => ({ ERROR: 0, WARNING: 0, INFO: 0, total: 0, events: [] }))
    )
    
    let maxCount = 0
    let minDate: Date | null = null
    let maxDate: Date | null = null

    events.forEach(evt => {
      const d = new Date(evt.timestamp)
      if (isNaN(d.getTime())) return
      
      if (!minDate || d < minDate) minDate = d
      if (!maxDate || d > maxDate) maxDate = d

      const day = d.getDay()
      const hour = d.getHours()
      const severity = (evt.code_severity || evt.type || 'INFO').toUpperCase()
      
      const cell = matrix[day][hour]
      cell.events.push(evt)

      if (severity === 'ERROR' || severity === 'WARNING' || severity === 'INFO') {
        cell[severity]++
        cell.total++
      } else {
        cell.INFO++
        cell.total++
      }
    })

    // Calculate max based on current filter (sum of selected severities)
    matrix.forEach(row => row.forEach(cell => {
      let val = 0
      visibleSeverities.forEach(sev => {
        val += (cell[sev as keyof Omit<CellData, 'events'>] as number) || 0
      })
      if (val > maxCount) maxCount = val
    }))

    const fmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' })
    const dateRangeText = minDate && maxDate 
      ? `${fmt.format(minDate)} y el ${fmt.format(maxDate)}`
      : 'periodo analizado'

    return { matrix, maxCount, dateRangeText }
  }, [events, visibleSeverities])

  if (events.length === 0) return null

  const getCellColor = (dayIdx: number, hour: number) => {
    const cell = matrix[dayIdx][hour]
    let count = 0
    visibleSeverities.forEach(sev => {
      count += (cell[sev as keyof Omit<CellData, 'events'>] as number) || 0
    })
    if (count === 0) return 'rgba(255, 255, 255, 0.03)'

    // Use color of the most critical severity present among SELECTED ones
    const colorRgb = (visibleSeverities.has('ERROR') && cell.ERROR > 0)
      ? SEVERITY_COLORS.ERROR
      : (visibleSeverities.has('WARNING') && cell.WARNING > 0)
        ? SEVERITY_COLORS.WARNING
        : SEVERITY_COLORS.INFO

    const opacity = maxCount > 0 ? count / maxCount : 0
    return `rgba(${colorRgb}, ${0.2 + opacity * 0.8})`
  }

  const getTooltip = (dayLabel: string, hour: number, cell: CellData) => {
    let text = `${dayLabel} ${hour}:00h`
    let totalActive = 0
    visibleSeverities.forEach(sev => {
      const count = (cell[sev as keyof Omit<CellData, 'events'>] as number) || 0
      if (count > 0) {
        text += ` \n${sev}: ${count}`
        totalActive += count
      }
    })
    if (visibleSeverities.size > 1) {
      text += ` \nTotal Seleccionado: ${totalActive}`
    }
    return text
  }

  return (
    <div className="error-heatmap">
      <div className="error-heatmap__header">
        <div className="error-heatmap__title-wrap">
          <div>
            <h3 className="error-heatmap__title">Distribución Temporal de Fallas</h3>
            <p className="error-heatmap__subtitle">
              Patrones semanales detectados entre el{' '}
              <span className="error-heatmap__date-highlight">{dateRangeText}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="error-heatmap__container">
        <div className="error-heatmap__grid-wrapper">
          {/* Hour labels header */}
          <div className="error-heatmap__hours-header">
            <div /> {/* Grid spacer column */}
            {HOURS.map(h => (
              <div key={h} className="error-heatmap__hour-label">
                {h % 4 === 0 ? `${h}h` : ''}
              </div>
            ))}
          </div>

          {/* Grid rows */}
          {DAYS.map((dayLabel, dayIdx) => (
            <div key={dayLabel} className="error-heatmap__row">
              <div className="error-heatmap__day-label">{dayLabel.slice(0, 3)}</div>
              <div className="error-heatmap__cells">
                {HOURS.map(hour => {
                  const cell = matrix[dayIdx][hour]
                  let count = 0
                  visibleSeverities.forEach(sev => {
                    count += (cell[sev as keyof Omit<CellData, 'events'>] as number) || 0
                  })
                  
                  return (
                    <div
                      key={hour}
                      className="error-heatmap__cell"
                      style={{ backgroundColor: getCellColor(dayIdx, hour) }}
                      title={getTooltip(dayLabel, hour, cell)}
                      onClick={() => count > 0 && setSelectedCell({ dayIdx, hour, data: cell })}
                    >
                      {count > 5 && <span className="error-heatmap__cell-count">{count}</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        
        <div className="error-heatmap__footer">
          <div className="error-heatmap__legend">
            <span>Menos</span>
            <div 
              className="error-heatmap__legend-gradient" 
              style={{ background: `linear-gradient(to right, rgba(${visibleSeverities.has('ERROR') ? SEVERITY_COLORS.ERROR : visibleSeverities.has('WARNING') ? SEVERITY_COLORS.WARNING : SEVERITY_COLORS.INFO}, 0.1), rgba(${visibleSeverities.has('ERROR') ? SEVERITY_COLORS.ERROR : visibleSeverities.has('WARNING') ? SEVERITY_COLORS.WARNING : SEVERITY_COLORS.INFO}, 1))` }}
            />
            <span>Más</span>
          </div>
        </div>
      </div>

      {selectedCell && (
        <HeatmapDetailModal 
          day={DAYS[selectedCell.dayIdx]} 
          hour={selectedCell.hour} 
          data={selectedCell.data} 
          onClose={() => setSelectedCell(null)} 
          onViewSolution={onViewSolution}
          onEditCode={onEditCode}
        />
      )}
    </div>
  )
}

function HeatmapDetailModal({ 
  day, 
  hour, 
  data, 
  onClose,
  onViewSolution,
  onEditCode
}: { 
  day: string; 
  hour: number; 
  data: CellData; 
  onClose: () => void;
  onViewSolution: (code: string, sdsContent?: string | null, sdsUrl?: string | null) => void;
  onEditCode: (code: string, description: string, severity: string, solutionUrl: string) => void;
}) {
  // Group codes by count
  const codeStats = useMemo(() => {
    const stats: Record<string, { count: number; severity: string; description: string | null; sds_url?: string | null; sds_content?: string | null }> = {}
    data.events.forEach(e => {
      if (!stats[e.code]) {
        stats[e.code] = { 
          count: 0, 
          severity: (e.code_severity || e.type || 'INFO').toUpperCase(),
          description: e.code_description || null,
          sds_url: e.code_solution_url,
          sds_content: e.code_solution_content
        }
      }
      stats[e.code].count++
    })
    return Object.entries(stats).sort((a, b) => b[1].count - a[1].count)
  }, [data.events])

  return (
    <Portal>
      <div className="log-modal-overlay" onClick={onClose}>
        <div className="log-modal maintenance-modal--wide animate-in" onClick={e => e.stopPropagation()}>
          <div className="log-modal__header">
            <div>
              <h2 className="log-modal__title">Detalle de Actividad</h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                {day} — {hour}:00h ({data.total} eventos totales)
              </p>
            </div>
            <button type="button" className="log-modal__close" onClick={onClose}>&times;</button>
          </div>

          <div className="heatmap-modal-body">
            <div className="heatmap-modal-grid">
              <div className="heatmap-modal-summary">
                <h4 className="heatmap-modal-section-title">Resumen por Severidad</h4>
                <div className="heatmap-modal-severity-row">
                  <div className="severity-pill severity-pill--error">
                    <strong>{data.ERROR}</strong> Errores
                  </div>
                  <div className="severity-pill severity-pill--warning">
                    <strong>{data.WARNING}</strong> Warnings
                  </div>
                  <div className="severity-pill severity-pill--info">
                    <strong>{data.INFO}</strong> Info
                  </div>
                </div>

                <h4 className="heatmap-modal-section-title" style={{ marginTop: '24px' }}>Frecuencia de Códigos</h4>
                <div className="heatmap-modal-codes-list">
                  {codeStats.map(([code, stat]) => (
                    <div key={code} className="heatmap-modal-code-item">
                      <div className={`severity-indicator severity-indicator--${stat.severity.toLowerCase()}`} />
                      <div className="heatmap-modal-code-info">
                        <div className="heatmap-modal-code-header">
                          <button 
                            type="button"
                            className="heatmap-modal-code-name"
                            onClick={() => onViewSolution(code, stat.sds_content || (stat.sds_url ? null : (stat.description || null)), stat.sds_url)}
                            title="Ver solución técnica"
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                          >
                            {code}
                          </button>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span className="heatmap-modal-code-count">{stat.count} ocurrencias</span>
                            <button
                              type="button"
                              className="dashboard__btn dashboard__btn--secondary"
                              style={{ padding: '2px 8px', fontSize: '0.7rem', height: 'auto' }}
                              onClick={() => onEditCode(code, stat.description || '', stat.severity, stat.sds_url || '')}
                            >
                              Editar
                            </button>
                          </div>
                        </div>
                        <p className="heatmap-modal-code-desc">{stat.description || 'Sin descripción'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="heatmap-modal-timeline">
                <h4 className="heatmap-modal-section-title">Secuencia de Eventos</h4>
                <div className="heatmap-modal-event-list">
                  {data.events.slice(0, 100).map((evt, i) => (
                    <div key={i} className="heatmap-modal-event-row">
                      <span className="heatmap-modal-event-time">
                        {new Date(evt.timestamp).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                      </span>
                      <button 
                        type="button"
                        className={`severity-tag severity-tag--${(evt.code_severity || evt.type || 'INFO').toLowerCase()}`}
                        onClick={() => onViewSolution(evt.code, evt.code_solution_content || (evt.code_solution_url ? null : evt.code_description), evt.code_solution_url)}
                        title="Ver solución técnica"
                        style={{ border: 'none', cursor: 'pointer' }}
                      >
                        {evt.code}
                      </button>
                      <span className="heatmap-modal-event-counter">#{evt.counter}</span>
                    </div>
                  ))}
                  {data.events.length > 100 && (
                    <p className="dashboard__muted" style={{ padding: '12px', textAlign: 'center' }}>
                      Mostrando los primeros 100 eventos...
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="log-modal__actions">
            <button type="button" className="dashboard__btn dashboard__btn--secondary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
