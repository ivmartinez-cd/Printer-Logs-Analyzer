import { useMemo, useState } from 'react'
import type { MaintenanceDevice } from '../../types/api'

interface AvisosSidebarProps {
  groupedDevices: Record<string, MaintenanceDevice[]>
  allFamilies: string[]
  selectedFamily: string | null
  selectedDevice: MaintenanceDevice | null
  loading: boolean
  onSelectFamily: (family: string) => void
  onSelectDevice: (device: MaintenanceDevice) => void
  onNewFamily: () => void
}

export function AvisosSidebar({
  groupedDevices,
  allFamilies,
  selectedFamily,
  selectedDevice,
  loading,
  onSelectFamily,
  onSelectDevice,
  onNewFamily,
}: AvisosSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(new Set())

  const normalizedSearch = searchTerm.toLowerCase().trim()

  const toggleFamily = (e: React.MouseEvent, family: string) => {
    e.stopPropagation()
    setExpandedFamilies((prev) => {
      const next = new Set(prev)
      if (next.has(family)) next.delete(family)
      else next.add(family)
      return next
    })
  }

  const families = useMemo(() => {
    // Combine families from backend and the currently selected one (in case it's newly created)
    const combined = new Set([...allFamilies, ...(selectedFamily ? [selectedFamily] : [])])
    
    return Array.from(combined).filter((family) => {
      if (!normalizedSearch) return true
      if (family.toLowerCase().includes(normalizedSearch)) return true
      return (groupedDevices[family] || []).some((device) =>
        device.serial.toLowerCase().includes(normalizedSearch)
      )
    }).sort()
  }, [allFamilies, groupedDevices, normalizedSearch, selectedFamily])

  return (
    <aside className="avisos-sidebar">
      <div className="avisos-sidebar-header">
        <h3 className="avisos-section-title">Equipos por Familia</h3>
        <button onClick={onNewFamily} className="dashboard__btn--icon-vibrant" title="Nueva Familia">
          <span>+</span>
        </button>
      </div>

      <div className="avisos-sidebar-search">
        <div className="search-input-wrapper">
          <span className="search-icon">/</span>
          <input
            type="text"
            placeholder="Buscar familia o serie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sidebar-search-input"
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              x
            </button>
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
            const devices = groupedDevices[family] || []
            const matchesSearch = normalizedSearch
              ? devices.some((device) => device.serial.toLowerCase().includes(normalizedSearch))
              : false
            const isExpanded = expandedFamilies.has(family) || matchesSearch

            return (
              <div key={family} className={`avisos-family-group ${isExpanded ? 'is-expanded' : ''}`}>
                <div
                  className={`avisos-family-header ${selectedFamily === family && !selectedDevice ? 'is-selected' : ''}`}
                  onClick={() => {
                    onSelectFamily(family)
                    if (!isExpanded) {
                      setExpandedFamilies((prev) => new Set(prev).add(family))
                    }
                  }}
                >
                  <button
                    className={`family-collapse-btn ${isExpanded ? 'is-rotated' : ''}`}
                    onClick={(e) => toggleFamily(e, family)}
                    title={isExpanded ? 'Colapsar' : 'Expandir'}
                  >
                    <span className="family-collapse-icon">›</span>
                  </button>
                  <span className="family-icon">🖨️</span>
                  <span className="family-name">{family}</span>
                  <span className="family-count">{devices.length}</span>
                </div>
                {isExpanded && (
                  <div className="avisos-family-devices">
                    {devices
                      .filter(
                        (device) =>
                          !normalizedSearch ||
                          device.serial.toLowerCase().includes(normalizedSearch)
                      )
                      .map((device) => (
                        <div
                          key={device.serial}
                          className={`avisos-device-item ${selectedDevice?.serial === device.serial ? 'is-selected' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelectDevice(device)
                          }}
                        >
                          <div className="avisos-device-serial">{device.serial}</div>
                          <div className="avisos-device-counter">
                            {device.last_sync_counter?.toLocaleString()} pags.
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
