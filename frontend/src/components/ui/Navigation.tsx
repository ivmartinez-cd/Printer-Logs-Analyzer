import { 
  LayoutDashboard, 
  Database, 
  PlusCircle, 
  FileDown, 
  HelpCircle,
  Printer
} from 'lucide-react'
import '../../styles/navigation.css'

interface NavigationProps {
  viewMode: 'dashboard' | 'saved-list' | 'saved-detail'
  hasResult: boolean
  onNavigate: (view: 'dashboard' | 'saved-list') => void
  onNewAnalysis: () => void
  onExportPdf: () => void
  onHelp: () => void
}

export function Navigation({
  viewMode,
  hasResult,
  onNavigate,
  onNewAnalysis,
  onExportPdf,
  onHelp
}: NavigationProps) {
  return (
    <nav className="navigation">
      <div className="navigation__content">
        <div className="navigation__brand">
          <Printer className="navigation__logo" />
          <span className="navigation__item-label" style={{ fontWeight: 700, fontSize: '1.1rem' }}>HP Logs</span>
        </div>

        <ul className="navigation__list">
          <li>
            <button 
              className={`navigation__item ${viewMode === 'dashboard' ? 'navigation__item--active' : ''}`}
              onClick={() => onNavigate('dashboard')}
              title="Dashboard"
            >
              <LayoutDashboard className="navigation__item-icon" />
              <span className="navigation__item-label">Dashboard</span>
            </button>
          </li>
          
          <li>
            <button 
              className={`navigation__item ${viewMode === 'saved-list' || viewMode === 'saved-detail' ? 'navigation__item--active' : ''}`}
              onClick={() => onNavigate('saved-list')}
              title="Incidentes Guardados"
            >
              <Database className="navigation__item-icon" />
              <span className="navigation__item-label">Historial</span>
            </button>
          </li>

          <li>
            <button 
              className="navigation__item"
              onClick={onNewAnalysis}
              title="Analizar otro log"
            >
              <PlusCircle className="navigation__item-icon" style={{ color: 'var(--accent-primary)' }} />
              <span className="navigation__item-label">Nuevo Análisis</span>
            </button>
          </li>

          {hasResult && (
            <li>
              <button 
                className="navigation__item"
                onClick={onExportPdf}
                title="Exportar PDF"
              >
                <FileDown className="navigation__item-icon" />
                <span className="navigation__item-label">Exportar PDF</span>
              </button>
            </li>
          )}
        </ul>

        <div className="navigation__footer">
          <button className="navigation__item" onClick={onHelp} title="Ayuda">
            <HelpCircle className="navigation__item-icon" />
            <span className="navigation__item-label">Ayuda</span>
          </button>
        </div>
      </div>
    </nav>
  )
}


