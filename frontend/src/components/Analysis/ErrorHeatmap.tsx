import { useMemo, useState } from 'react'
import type { EnrichedEvent } from '../../types/api'
import { Portal } from '../ui/Portal'

interface ErrorHeatmapProps {
  events: EnrichedEvent[]
}

type CellData = {
  ERROR: number
  WARNING: number
  INFO: number
  total: number
  events: EnrichedEvent[]
}

type SeverityFilter = 'ALL' | 'ERROR' | 'WARNING' | 'INFO'

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

const SEVERITY_COLORS: Record<string, string> = {
  ERROR: '239, 68, 68', // Red-500
  WARNING: '245, 158, 11', // Amber-500
  INFO: '56, 189, 248', // Sky-400
  ALL: '56, 189, 248' // Default Blue
}

export function ErrorHeatmap({ events }: ErrorHeatmapProps) {
  const [filter, setFilter] = useState<SeverityFilter>('ALL')
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

    // Calculate max based on current filter
    matrix.forEach(row => row.forEach(cell => {
      const val = filter === 'ALL' ? cell.total : (cell[filter as keyof Omit<CellData, 'events'>] as number)
      if (val > maxCount) maxCount = val
    }))

    const fmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' })
    const dateRangeText = minDate && maxDate 
      ? `${fmt.format(minDate)} y el ${fmt.format(maxDate)}`
      : 'periodo analizado'

    return { matrix, maxCount, dateRangeText }
  }, [events, filter])

  if (events.length === 0) return null

  const getCellColor = (dayIdx: number, hour: number) => {
    const cell = matrix[dayIdx][hour]
    const count = filter === 'ALL' ? cell.total : (cell[filter as keyof Omit<CellData, 'events'>] as number)
    if (count === 0) return 'rgba(255, 255, 255, 0.03)'

    let colorRgb = SEVERITY_COLORS[filter]
    
    // If ALL, use the color of the most critical severity present
    if (filter === 'ALL') {
      if (cell.ERROR > 0) colorRgb = SEVERITY_COLORS.ERROR
      else if (cell.WARNING > 0) colorRgb = SEVERITY_COLORS.WARNING
      else colorRgb = SEVERITY_COLORS.INFO
    }

    const opacity = maxCount > 0 ? count / maxCount : 0
    return `rgba(${colorRgb}, ${0.2 + opacity * 0.8})`
  }

  const getTooltip = (dayLabel: string, hour: number, cell: CellData) => {
    let text = `${dayLabel} ${hour}:00h`
    if (filter === 'ALL') {
      text += ` \nTotal: ${cell.total}`
      if (cell.ERROR > 0) text += ` \nErrores: ${cell.ERROR}`
      if (cell.WARNING > 0) text += ` \nWarnings: ${cell.WARNING}`
      if (cell.INFO > 0) text += ` \nInfo: ${cell.INFO}`
    } else {
      const count = cell[filter as keyof Omit<CellData, 'events'>] as number
      text += ` \n${filter}: ${count}`
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
          
          <div className="error-heatmap__filters">
            {(['ALL', 'ERROR', 'WARNING', 'INFO'] as SeverityFilter[]).map(f => (
              <button
                key={f}
                type="button"
                className={`error-heatmap__filter-btn ${filter === f ? 'active' : ''} ${f.toLowerCase()}`}
                onClick={() => setFilter(f)}
              >
                {f === 'ALL' ? 'Todos' : f}
              </button>
            ))}
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
                  const count = filter === 'ALL' ? cell.total : (cell[filter as keyof Omit<CellData, 'events'>] as number)
                  
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
              style={{ background: `linear-gradient(to right, rgba(${SEVERITY_COLORS[filter]}, 0.1), rgba(${SEVERITY_COLORS[filter]}, 1))` }}
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
        />
      )}
    </div>
  )
}

function HeatmapDetailModal({ day, hour, data, onClose }: { day: string; hour: number; data: CellData; onClose: () => void }) {
  // Group codes by count
  const codeStats = useMemo(() => {
    const stats: Record<string, { count: number; severity: string; description: string }> = {}
    data.events.forEach(e => {
      if (!stats[e.code]) {
        stats[e.code] = { 
          count: 0, 
          severity: (e.code_severity || e.type || 'INFO').toUpperCase(),
          description: e.code_description || 'Sin descripción'
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
                          <span className="heatmap-modal-code-name">{code}</span>
                          <span className="heatmap-modal-code-count">{stat.count} ocurrencias</span>
                        </div>
                        <p className="heatmap-modal-code-desc">{stat.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="heatmap-modal-timeline">
                <h4 className="heatmap-modal-section-title">Secuencia de Eventos</h4>
                <div className="heatmap-modal-event-list">
                  {data.events.slice(0, 50).map((evt, i) => (
                    <div key={i} className="heatmap-modal-event-row">
                      <span className="heatmap-modal-event-time">
                        {new Date(evt.timestamp).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                      </span>
                      <span className={`severity-tag severity-tag--${(evt.code_severity || evt.type || 'INFO').toLowerCase()}`}>
                        {evt.code}
                      </span>
                      <span className="heatmap-modal-event-counter">#{evt.counter}</span>
                    </div>
                  ))}
                  {data.events.length > 50 && (
                    <p className="dashboard__muted" style={{ padding: '12px', textAlign: 'center' }}>
                      Mostrando los primeros 50 eventos...
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
