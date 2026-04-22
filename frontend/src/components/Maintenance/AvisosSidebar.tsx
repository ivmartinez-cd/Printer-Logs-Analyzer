import { useState, useMemo } from 'react'

interface AvisosSidebarProps {
  groupedDevices: Record<string, any[]>
  selectedFamily: string | null
  selectedDevice: any | null
  loading: boolean
  onSelectFamily: (family: string) => void
  onSelectDevice: (device: any) => void
  onNewFamily: () => void
}

export function AvisosSidebar({
  groupedDevices,
  selectedFamily,
  selectedDevice,
  loading,
  onSelectFamily,
  onSelectDevice,
  onNewFamily,
}: AvisosSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(new Set())

  // Toggle expand/collapse
  const toggleFamily = (e: React.MouseEvent, family: string) => {
    e.stopPropagation()
    setExpandedFamilies(prev => {
      const next = new Set(prev)
      if (next.has(family)) next.delete(family)
      else next.add(family)
      return next
    })
  }

  // Auto-expand if selected
  useState(() => {
    if (selectedFamily) setExpandedFamilies(new Set([selectedFamily]))
  })

  const families = useMemo(() => {
    const allFamilies = new Set(Object.keys(groupedDevices))
    if (selectedFamily) allFamilies.add(selectedFamily)
    
    return Array.from(allFamilies).filter((family: string) => {
      const q = searchTerm.toLowerCase().trim()
      if (!q) return true
      if (family.toLowerCase().includes(q)) return true
      return (groupedDevices[family] || []).some((d: any) => d.serial.toLowerCase().includes(q))
    })
  }, [groupedDevices, selectedFamily, searchTerm])

  return (
    <aside className="avisos-sidebar">
      <div className="avisos-sidebar-header">
        <h3 className="avisos-section-title">Equipos por Familia</h3>
        <button 
          onClick={onNewFamily} 
          className="dashboard__btn--icon-vibrant"
          title="Nueva Familia"
        >
          <span>+</span>
        </button>
      </div>

      <div className="avisos-sidebar-search">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Buscar familia o serie..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sidebar-search-input"
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>×</button>
          )}
        </div>
      </div>

      <div className="avisos-device-list">
        {loading ? (
          <div className="sidebar-loading">
            <div className="spinner-small"></div>
            <span>Cargando...</span>
          </div>
        ) : families.length > 0 ? (
          families.map((family) => {
            const isExpanded = expandedFamilies.has(family) || (searchTerm && groupedDevices[family].some(d => d.serial.toLowerCase().includes(searchTerm.toLowerCase())))
            
            return (
              <div key={family} className={`avisos-family-group ${isExpanded ? 'is-expanded' : ''}`}>
                <div 
                  className={`avisos-family-header ${selectedFamily === family && !selectedDevice ? 'is-selected' : ''}`}
                  onClick={() => {
                    onSelectFamily(family)
                    if (!isExpanded) {
                      setExpandedFamilies(prev => new Set(prev).add(family))
                    }
                  }}
                >
                  <button 
                    className={`family-collapse-btn ${isExpanded ? 'is-rotated' : ''}`}
                    onClick={(e) => toggleFamily(e, family)}
                  >
                    ›
                  </button>
                  <span className="family-icon">📂</span>
                  <span className="family-name">{family}</span>
                  <span className="family-count">{(groupedDevices[family] || []).length}</span>
                </div>
                {isExpanded && (
                  <div className="avisos-family-devices">
                    {(groupedDevices[family] || [])
                      .filter((d: any) => !searchTerm || d.serial.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((d: any) => (
                      <div 
                        key={d.serial} 
                        className={`avisos-device-item ${selectedDevice?.serial === d.serial ? 'is-selected' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectDevice(d)
                        }}
                      >
                        <div className="avisos-device-serial">{d.serial}</div>
                        <div className="avisos-device-counter">
                          {d.last_sync_counter?.toLocaleString()} págs.
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <p className="avisos-no-results">
            {searchTerm ? 'No se encontraron coincidencias.' : 'No hay equipos configurados.'}
          </p>
        )}
      </div>
    </aside>
  )
}
