import React, { useState, useMemo } from 'react'
import type { SavedAnalysisSummary } from '../../types/api'

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (serial.trim()) {
      onQuickSearch(serial.trim().toUpperCase())
    }
  }

  // 1. Saved Summaries
  const displaySaved = useMemo(() => {
    return (savedList || []).slice(0, 4)
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
            HP Logs Analyzer
          </h1>
          <p className="welcome-hero__tagline">
            Análisis técnico avanzado de logs HP con detección inteligente de errores y estado de hardware en tiempo real.
          </p>
        </div>

        {/* Quick Search Bar */}
        <form onSubmit={handleSearch} className="welcome-searchbox">
          <div className="welcome-searchbox__container">
            <input
              type="text"
              placeholder="Ingrese Serie de Impresora (ej: MXBCN...)"
              className="welcome-searchbox__input"
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              disabled={loadingQuickSearch}
            />
            <button
              type="submit"
              disabled={loadingQuickSearch || !serial.trim()}
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
            💡 Consejo: Pega un número de serie para un diagnóstico instantáneo vía HP Insight API.
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

        {/* Primary CTA: New Manual Analysis */}
        <div className="welcome-grid__item welcome-grid__item--main" onClick={onAnalyzeNew}>
          <div className="welcome-grid__content">
            <div className="welcome-grid__icon">✨</div>
            <h3 className="welcome-grid__title">Análisis Manual</h3>
            <p className="welcome-grid__desc">Sube o pega logs históricos para un diagnóstico profundo fuera de línea.</p>
          </div>
          <div className="welcome-grid__footer">
            Comenzar ahora →
          </div>
        </div>

        {/* CARD 1: Saved Incidents */}
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

        {/* CARD 2: Recent Search History */}
        <div className="welcome-grid__item welcome-grid__item--history">
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


