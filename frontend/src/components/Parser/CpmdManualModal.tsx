import { useEffect, useState } from 'react'
import { Portal } from '../ui/Portal'
import { getCpmdSolutions } from '../../services/api'
import type { ErrorSolution } from '../../types/api'
import { Search, Loader2, AlertCircle, FileText, ChevronRight } from 'lucide-react'

interface CpmdManualModalProps {
  modelFamily: string
  onClose: () => void
}

export function CpmdManualModal({ modelFamily, onClose }: CpmdManualModalProps) {
  const [solutions, setSolutions] = useState<ErrorSolution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSol, setSelectedSol] = useState<ErrorSolution | null>(null)

  useEffect(() => {
    let ignore = false
    
    Promise.resolve().then(() => {
      if (!ignore) {
        setLoading(true)
        setError(null)
      }
    })

    getCpmdSolutions(modelFamily)
      .then((data) => {
        if (!ignore) {
          setSolutions(data)
          if (data.length > 0) {
            setSelectedSol(data[0])
          }
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error('Error fetching CPMD manual:', err)
          setError('No se pudo cargar el manual CPMD para este modelo.')
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [modelFamily])

  const filteredSolutions = solutions.filter((sol) => {
    const q = searchQuery.toLowerCase()
    return (
      sol.code.toLowerCase().includes(q) ||
      (sol.title?.toLowerCase() || '').includes(q) ||
      (sol.cause?.toLowerCase() || '').includes(q)
    );
  })

  return (
    <Portal>
      <div
        className="log-modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cpmd-modal-title"
        style={{ zIndex: 11000 }}
      >
        <div className="log-modal cpmd-manual-modal" style={{ maxWidth: '900px', width: '90%' }}>
          <div className="log-modal__header">
            <h2 id="cpmd-modal-title" className="log-modal__title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} className="text-blue-400" />
              Manual Técnico CPMD — {modelFamily}
            </h2>
            <button type="button" className="log-modal__close" onClick={onClose} aria-label="Cerrar">
              ×
            </button>
          </div>

          <div className="log-modal__body" style={{ padding: 0 }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: '12px' }}>
                <Loader2 className="animate-spin text-blue-500" size={32} />
                <span className="text-gray-400 text-sm">Cargando manual de servicio...</span>
              </div>
            ) : error ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', gap: '12px' }}>
                <AlertCircle className="text-red-500" size={32} />
                <span className="text-gray-300 text-sm">{error}</span>
              </div>
            ) : solutions.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px', gap: '12px' }}>
                <AlertCircle className="text-amber-500" size={32} />
                <span className="text-gray-300 text-sm text-center">
                  No hay soluciones CPMD indexadas para la familia de modelos <strong>{modelFamily}</strong>.
                </span>
                <span className="text-gray-500 text-xs">
                  Puedes importar manuales CPMD en formato PDF usando la CLI.
                </span>
              </div>
            ) : (
              <div className="cpmd-split-container" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', height: '550px' }}>
                {/* Left pane: search and codes list */}
                <div className="cpmd-sidebar" style={{ borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                  <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Search size={16} className="text-gray-500" style={{ position: 'absolute', left: '10px' }} />
                      <input
                        type="text"
                        placeholder="Buscar por código o título..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px 8px 32px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          background: 'rgba(255,255,255,0.05)',
                          color: '#fff',
                          fontSize: '13px'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {filteredSolutions.map((sol) => (
                      <button
                        key={sol.code}
                        type="button"
                        onClick={() => setSelectedSol(sol)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '12px 16px',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          background: selectedSol?.code === sol.code ? 'rgba(59,130,246,0.1)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'background 0.2s',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: 'bold', color: selectedSol?.code === sol.code ? '#60a5fa' : '#fff', fontSize: '13px' }}>
                            {sol.code}
                          </div>
                          <div style={{ fontSize: '11px', color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                            {sol.title || 'Sin título'}
                          </div>
                        </div>
                        <ChevronRight size={14} className={selectedSol?.code === sol.code ? 'text-blue-400' : 'text-gray-600'} />
                      </button>
                    ))}
                    {filteredSolutions.length === 0 && (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>
                        Sin resultados
                      </div>
                    )}
                  </div>
                </div>

                {/* Right pane: selected solution details */}
                <div className="cpmd-details" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '24px' }}>
                  {selectedSol ? (
                    <div>
                      <div style={{ marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{
                            background: 'rgba(59, 130, 246, 0.2)',
                            color: '#60a5fa',
                            fontWeight: 'bold',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}>
                            {selectedSol.code}
                          </span>
                          {selectedSol.source_page && (
                            <span style={{ fontSize: '11px', color: '#6b7280' }}>
                              Pág. {selectedSol.source_page} (Sección {selectedSol.source_audience === 'technician' ? 'Técnico' : 'Cliente'})
                            </span>
                          )}
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', margin: 0 }}>
                          {selectedSol.title || 'Error sin título'}
                        </h3>
                      </div>

                      {selectedSol.cause && (
                        <div style={{ marginBottom: '20px' }}>
                          <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.05em', marginBottom: '6px', fontWeight: 'bold' }}>
                            Causa Probable
                          </h4>
                          <p style={{ color: '#d1d5db', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
                            {selectedSol.cause}
                          </p>
                        </div>
                      )}

                      {selectedSol.technician_steps && selectedSol.technician_steps.length > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                          <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.05em', marginBottom: '8px', fontWeight: 'bold' }}>
                            Pasos de Resolución
                          </h4>
                          <ol style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {selectedSol.technician_steps.map((step, idx) => (
                              <li key={idx} style={{ color: '#d1d5db', fontSize: '13px', lineHeight: '1.5' }}>
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {selectedSol.frus && selectedSol.frus.length > 0 && (
                        <div>
                          <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.05em', marginBottom: '8px', fontWeight: 'bold' }}>
                            Repuestos del Manual (FRUs)
                          </h4>
                          <div style={{ display: 'grid', gap: '8px' }}>
                            {selectedSol.frus.map((fru, idx) => (
                              <div
                                key={idx}
                                style={{
                                  background: 'rgba(255,255,255,0.02)',
                                  border: '1px solid rgba(255,255,255,0.05)',
                                  padding: '10px 14px',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
                                }}
                              >
                                <span style={{ fontSize: '13px', color: '#fff' }}>{fru.description}</span>
                                <span style={{ fontFamily: 'monospace', background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', color: '#a7f3d0' }}>
                                  {fru.part_number}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6b7280' }}>
                      Selecciona un código para ver los detalles.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Portal>
  )
}
