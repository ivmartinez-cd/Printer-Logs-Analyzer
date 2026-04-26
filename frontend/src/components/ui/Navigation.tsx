import { useState, useEffect } from 'react'
import { 
  LayoutDashboard, 
  Database, 
  PlusCircle, 
  HelpCircle,
  Printer,
  Monitor,
  Bell,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react'
import type { HealthStatus } from '../../services/api'
import '../../styles/navigation.css'

export type ViewMode = 'dashboard' | 'saved-list' | 'saved-detail' | 'monitor' | 'avisos'

interface NavigationProps {
  viewMode: ViewMode
  onNavigate: (view: ViewMode) => void
  onNewAnalysis: () => void
  onHelp: () => void
  healthStatus: HealthStatus | null
  isCollapsed: boolean
  onToggleCollapse: () => void
  isMobileOpen?: boolean
  onCloseMobile?: () => void
}

export function Navigation({
  viewMode,
  onNavigate,
  onNewAnalysis,
  onHelp,
  healthStatus,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile
}: NavigationProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const dbOk = healthStatus?.db_available === true

  return (
    <>
      <nav className={`navigation ${isCollapsed ? 'navigation--collapsed' : ''} ${isMobileOpen ? 'navigation--mobile-open' : ''}`}>
        <div className="navigation__mobile-header">
          <button className="navigation__close-mobile" onClick={onCloseMobile}>
            <X size={24} />
          </button>
        </div>

        <button 
        className="navigation__toggle" 
        onClick={onToggleCollapse}
        title={isCollapsed ? 'Expandir' : 'Contraer'}
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <div className="navigation__content">
        <div className="navigation__brand" onClick={() => onNavigate('dashboard')} style={{ cursor: 'pointer' }}>
          <Printer className="navigation__logo" />
          {!isCollapsed && (
            <div className="navigation__brand-text">
              <span className="navigation__brand-name">HP Logs</span>
              <span className="navigation__brand-suffix">Analyzer</span>
            </div>
          )}
        </div>

        <ul className="navigation__list">
          <li>
            <button 
              className={`navigation__item ${viewMode === 'dashboard' ? 'navigation__item--active' : ''}`}
              onClick={() => onNavigate('dashboard')}
              title="Panel de Análisis"
            >
              <LayoutDashboard className="navigation__item-icon" />
              {!isCollapsed && <span className="navigation__item-label">Inicio</span>}
            </button>
          </li>

          <li>
            <button 
              className={`navigation__item ${viewMode === 'monitor' ? 'navigation__item--active' : ''}`}
              onClick={() => onNavigate('monitor')}
              title="Monitoreo de Flota"
            >
              <Monitor className="navigation__item-icon" />
              {!isCollapsed && <span className="navigation__item-label">Monitor de Flota</span>}
            </button>
          </li>

          <li>
            <button 
              className={`navigation__item ${viewMode === 'avisos' ? 'navigation__item--active' : ''}`}
              onClick={() => onNavigate('avisos')}
              title="Avisos de Mantenimiento"
            >
              <Bell className="navigation__item-icon" />
              {!isCollapsed && <span className="navigation__item-label">Mantenimiento</span>}
            </button>
          </li>
          
          <li>
            <button 
              className={`navigation__item ${viewMode === 'saved-list' || viewMode === 'saved-detail' ? 'navigation__item--active' : ''}`}
              onClick={() => onNavigate('saved-list')}
              title="Historial de Incidentes"
            >
              <Database className="navigation__item-icon" />
              {!isCollapsed && <span className="navigation__item-label">Historial</span>}
            </button>
          </li>

          <li style={{ marginTop: '12px' }}>
            <button 
              className="navigation__item"
              onClick={onNewAnalysis}
              title="Analizar otro log"
            >
              <PlusCircle className="navigation__item-icon" style={{ color: 'var(--hp-blue-vibrant)' }} />
              {!isCollapsed && <span className="navigation__item-label" style={{ color: 'var(--hp-blue-vibrant)', fontWeight: 600 }}>Análisis manual</span>}
            </button>
          </li>
        </ul>

        <div className="navigation__footer">
          <button className="navigation__item" onClick={onHelp} title="Ayuda">
            <HelpCircle className="navigation__item-icon" />
            {!isCollapsed && <span className="navigation__item-label">Ayuda</span>}
          </button>

          {!isCollapsed && (
            <div className="navigation__status-area">
              <div className="navigation__datetime">
                <span className="navigation__date">
                  {currentTime.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                </span>
                <span className="navigation__time">
                  {currentTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className={`navigation__db-badge ${dbOk ? 'navigation__db-badge--ok' : 'navigation__db-badge--error'}`}>
                <div className="navigation__db-dot" />
                <span>DB {dbOk ? 'conectada' : 'desconectada'}</span>
              </div>
            </div>
          )}
          {isCollapsed && (
             <div className="navigation__status-mini">
                <div className={`navigation__db-dot ${dbOk ? 'navigation__db-dot--ok' : 'navigation__db-dot--error'}`} title={dbOk ? 'DB OK' : 'DB Error'} />
             </div>
          )}
        </div>
      </div>
    </nav>
    {isMobileOpen && <div className="navigation__overlay" onClick={onCloseMobile} />}
    </>
  )
}


