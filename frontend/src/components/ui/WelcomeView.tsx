import React, { useState, useMemo, useEffect } from 'react'
import type { SavedAnalysisSummary, FleetClientSummary, FleetDeviceSummary } from '../../types/api'
import { listFleetClients, getFleetClient } from '../../services/api'

interface WelcomeViewProps {
  onAnalyzeNew: () => void
  onViewSaved: () => void
  onHelp: () => void
  savedList: SavedAnalysisSummary[] | null
  recentSearches?: string[]
  onQuickSearch: (serial: string) => void
  onOpenSaved: (id: string) => void
  onOpenMonitor: () => void
  onOpenAvisos: () => void
  loadingQuickSearch?: boolean
}

export function WelcomeView({
  onAnalyzeNew,
  onViewSaved,
  onHelp,
  savedList,
  recentSearches = [],
  onQuickSearch,
  onOpenSaved,
  onOpenMonitor,
  onOpenAvisos,
  loadingQuickSearch = false
}: WelcomeViewProps) {
  const [serial, setSerial] = useState('')
  const [searchMode, setSearchMode] = useState<'serial' | 'client'>('serial')

  const [clients, setClients] = useState<FleetClientSummary[]>([])
  const [loadingClients, setLoadingClients] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState('')

  const [devices, setDevices] = useState<FleetDeviceSummary[]>([])
  const [loadingDevices, setLoadingDevices] = useState(false)
  const [selectedSerial, setSelectedSerial] = useState('')

  useEffect(() => {
    if (searchMode === 'client' && clients.length === 0) {
      setLoadingClients(true)
      listFleetClients()
        .then(setClients)
        .catch((err) => console.error('Error listing clients:', err))
        .finally(() => setLoadingClients(false))
    }
  }, [searchMode, clients.length])

  const handleClientChange = async (clientId: string) => {
    setSelectedClientId(clientId)
    setSelectedSerial('')
    setDevices([])
    if (!clientId) return

    setLoadingDevices(true)
    try {
      const detail = await getFleetClient(clientId)
      setDevices(detail.devices || [])
    } catch (err) {
      console.error('Error fetching client devices:', err)
    } finally {
      setLoadingDevices(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchMode === 'serial') {
      if (serial.trim()) {
        onQuickSearch(serial.trim().toUpperCase())
      }
    } else {
      if (selectedSerial) {
        onQuickSearch(selectedSerial)
      }
    }
  }

  // 1. Saved Summaries — one entry per equipment (newest snapshot), so grouped
  //    day-by-day snapshots don't flood the card. Records without a real
  //    equipment are shown individually.
  const displaySaved = useMemo(() => {
    const seen = new Set<string>()
    const out: SavedAnalysisSummary[] = []
    for (const item of savedList || []) {
      const key = (item.equipment_identifier ?? '').trim().toLowerCase()
      if (key && key !== 'desconocido') {
        if (seen.has(key)) continue
        seen.add(key)
      }
      out.push(item)
      if (out.length >= 4) break
    }
    return out
  }, [savedList])

  // 2. Recent Searches (filtered to avoid showing if they are already in the saved list prominently)
  const displaySearches = useMemo(() => {
    return recentSearches
      .filter(s => !displaySaved.some(item => item.equipment_identifier === s))
      .slice(0, 4)
  }, [recentSearches, displaySaved])

  return (
    <div className="welcome-view animate-fade-in">
      
      {/* Hero Section */}
      <section className="welcome-hero">
        <div className="welcome-hero__bg-glow" />
        
        <div className="welcome-hero__titles">
          <h1 className="welcome-hero__title">
            HP Logs <span className="welcome-hero__title-suffix">Analyzer</span>
          </h1>
          <p className="welcome-hero__tagline">
            Análisis técnico avanzado de logs HP con detección inteligente de errores y estado de hardware en tiempo real.
          </p>
        </div>

        {/* Quick Search Bar */}
        <form onSubmit={handleSearch} className="welcome-searchbox">
          <div className="welcome-search-tabs">
            <button
              type="button"
              className={`welcome-search-tab ${searchMode === 'serial' ? 'active' : ''}`}
              onClick={() => setSearchMode('serial')}
            >
              Buscar por Serie
            </button>
            <button
              type="button"
              className={`welcome-search-tab ${searchMode === 'client' ? 'active' : ''}`}
              onClick={() => setSearchMode('client')}
            >
              Buscar por Cliente
            </button>
          </div>

          <div className="welcome-searchbox__container">
            {searchMode === 'serial' ? (
              <input
                type="text"
                placeholder="Ingrese Serie de Impresora (ej: MXBCN...)"
                className="welcome-searchbox__input"
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                disabled={loadingQuickSearch}
              />
            ) : (
              <div className="welcome-searchbox__select-group">
                <select
                  className="welcome-searchbox__select"
                  value={selectedClientId}
                  onChange={(e) => handleClientChange(e.target.value)}
                  disabled={loadingQuickSearch || loadingClients}
                >
                  <option value="">
                    {loadingClients ? 'Cargando clientes...' : 'Seleccionar Cliente...'}
                  </option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.device_count} equipos)
                    </option>
                  ))}
                </select>

                <select
                  className="welcome-searchbox__select"
                  value={selectedSerial}
                  onChange={(e) => setSelectedSerial(e.target.value)}
                  disabled={loadingQuickSearch || !selectedClientId || loadingDevices}
                >
                  <option value="">
                    {loadingDevices ? 'Cargando equipos...' : 'Seleccionar Equipo/Serie...'}
                  </option>
                  {devices.map((d) => (
                    <option key={d.serial} value={d.serial}>
                      {d.serial} - {d.location} {d.model ? `(${d.model})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              type="submit"
              disabled={
                loadingQuickSearch ||
                (searchMode === 'serial' ? !serial.trim() : !selectedSerial)
              }
              className="welcome-searchbox__button"
            >
              {loadingQuickSearch ? (
                <span className="welcome-searchbox__spinner" />
              ) : (
                <>Analizar</>
              )}
            </button>
            <button 
              type="button"
              className="hiw-trigger-btn"
              onClick={onHelp}
              title="¿Cómo funciona HP Logs Analyzer?"
              style={{ marginLeft: '12px' }}
            >
              ?
            </button>
          </div>
          <p className="welcome-searchbox__tip">
            {searchMode === 'serial' 
              ? '💡 Consejo: Pega un número de serie para un diagnóstico instantáneo vía HP Insight API.'
              : '💡 Seleccioná un cliente de la flota para listar sus equipos activos y diagnosticar uno de ellos.'
            }
          </p>
        </form>
      </section>

      {/* Main Grid Layout (Bento Style) */}
      <div className="welcome-grid">
        
        {/* NEW: Fleet Monitor Card */}
        <div className="welcome-grid__item welcome-grid__item--monitor" onClick={onOpenMonitor}>
          <div className="welcome-grid__content">
            <div className="welcome-grid__icon welcome-grid__icon--pulse">🖥️</div>
            <h3 className="welcome-grid__title">Monitoreo de Flota</h3>
            <p className="welcome-grid__desc">Control centralizado de logs para clientes críticos y familias de modelos.</p>
          </div>
          <div className="welcome-grid__footer">
            Gestionar flotas →
          </div>
        </div>

        {/* NEW: Maintenance Alerts Card */}
        <div className="welcome-grid__item welcome-grid__item--alerts" onClick={onOpenAvisos}>
          <div className="welcome-grid__content">
            <div className="welcome-grid__icon welcome-grid__icon--warning">🔔</div>
            <h3 className="welcome-grid__title">Avisos de Mantenimiento</h3>
            <p className="welcome-grid__desc">Alertas automáticas por contador para equipos sin medición por chip.</p>
          </div>
          <div className="welcome-grid__footer">
            Ver alertas activas →
          </div>
        </div>

        {/* Primary CTA: New Manual Analysis - Slot 3 */}
        <div className="welcome-grid__item welcome-grid__item--main">
          <div className="welcome-activity">
            <div className="welcome-activity__header">
              <h3 className="welcome-activity__title">🔍 Búsquedas Recientes</h3>
            </div>
            <div className="welcome-activity__list">
              {displaySearches.length > 0 ? displaySearches.map((s) => (
                <button 
                  key={`search-${s}`}
                  onClick={() => onQuickSearch(s)}
                  className="welcome-activity__item welcome-activity__item--search"
                >
                  <div className="welcome-activity__item-icon-wrapper welcome-activity__item-icon-wrapper--search">
                    🔍
                  </div>
                  <div className="welcome-activity__item-info">
                    <span className="welcome-activity__item-serial">{s}</span>
                    <span className="welcome-activity__item-date">Consulta rápida</span>
                  </div>
                  <div className="welcome-activity__item-arrow">→</div>
                </button>
              )) : (
                <div className="welcome-activity__empty">
                  <p>No hay búsquedas recientes</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CARD 1: Saved Incidents - Slot 4 */}
        <div className="welcome-grid__item welcome-grid__item--history">
          <div className="welcome-activity">
            <div className="welcome-activity__header">
              <h3 className="welcome-activity__title">📂 Incidentes Guardados</h3>
              <button onClick={onViewSaved} className="welcome-activity__link">Ver todo</button>
            </div>
            <div className="welcome-activity__list">
                {displaySaved.length > 0 ? displaySaved.map((item) => {
                  let title = item.equipment_identifier || item.name || 'Análisis Guardado'
                  let subtitle: string | null = null
                  
                  if (item.equipment_identifier && item.equipment_identifier.includes('(')) {
                    const match = item.equipment_identifier.match(/^(.*)\s\((.*)\)$/)
                    if (match) {
                      title = match[2]
                      subtitle = match[1]
                    }
                  } else if (item.equipment_identifier && item.name && item.name !== item.equipment_identifier) {
                    title = item.equipment_identifier
                    subtitle = item.name
                  }

                  return (
                    <button 
                      key={item.id}
                      onClick={() => onOpenSaved(item.id)}
                      className="welcome-activity__item welcome-activity__item--saved"
                    >
                      <div className="welcome-activity__item-icon-wrapper welcome-activity__item-icon-wrapper--folder">
                        📂
                      </div>
                      <div className="welcome-activity__item-info">
                        <span className="welcome-activity__item-serial">
                          {title}
                        </span>
                        {subtitle && (
                          <span className="welcome-activity__item-model">
                            {subtitle}
                          </span>
                        )}
                        <span className="welcome-activity__item-date">
                          Sincronizado {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="welcome-activity__item-arrow">→</div>
                    </button>
                  )
                }) : (
                <div className="welcome-activity__empty">
                  <p>No hay incidentes guardados</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CARD 2: Recent Search History - Slot 5 (Now containing Manual Analysis) */}
        <div className="welcome-grid__item welcome-grid__item--history" onClick={onAnalyzeNew}>
          <div className="welcome-grid__content">
            <div className="welcome-grid__icon">✨</div>
            <h3 className="welcome-grid__title">Análisis Manual</h3>
            <p className="welcome-grid__desc">Sube o pega logs históricos para un diagnóstico profundo fuera de línea.</p>
          </div>
          <div className="welcome-grid__footer">
            Comenzar ahora →
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <footer className="welcome-footer">
        <p>© 2026 HP Logs Analyzer · Diagnostic Engine v4.6</p>
        <div className="welcome-footer__links">
          <button onClick={onHelp} className="welcome-footer__link">Centro de Ayuda</button>
          <button className="welcome-footer__link">Documentación API</button>
        </div>
      </footer>
    </div>
  )
}


