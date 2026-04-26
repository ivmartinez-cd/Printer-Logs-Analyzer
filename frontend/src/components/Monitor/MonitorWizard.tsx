import { useEffect, useState, useMemo } from 'react'
import { Portal } from '../ui/Portal'
import { listFleetClients, getFleetClient } from '../../services/api'
import type { FleetClientSummary, FleetClientDetail } from '../../types/api'
import { useAnalysisStore } from '../../store/useAnalysisStore'
import { useUIStore } from '../../store/useUIStore'

export function MonitorWizard() {
  const { monitorWizardOpen, setMonitorWizardOpen } = useUIStore()
  const { setViewMode, setMonitorClientId, setMonitorModels } = useAnalysisStore()

  const [step, setStep] = useState<'client' | 'models'>('client')
  const [clients, setClients] = useState<FleetClientSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedClient, setSelectedClient] = useState('')
  const [clientDetail, setClientDetail] = useState<FleetClientDetail | null>(null)
  
  const [selectedModels, setSelectedModels] = useState<Record<string, boolean>>({})

  const uniqueModels = useMemo(() => {
    if (!clientDetail) return []
    return [...new Set(clientDetail.devices.map(d => d.model || 'Desconocido'))].sort()
  }, [clientDetail])

  useEffect(() => {
    if (!monitorWizardOpen) return
    let active = true
    
    // Asynchronous loading trigger to avoid cascading render warning
    requestAnimationFrame(() => {
      if (!active) return
      setLoading(true)
      listFleetClients()
        .then(data => {
          if (active) setClients(data)
        })
        .catch(() => {
          if (active) setClients([])
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    })
    
    return () => { active = false }
  }, [monitorWizardOpen])

  useEffect(() => {
    if (selectedClient && step === 'models') {
       let active = true
       
       requestAnimationFrame(() => {
          if (!active) return
          setLoading(true)
          getFleetClient(selectedClient)
           .then(data => {
             if (!active) return
             setClientDetail(data)
             // Initialize with all models selected
             const families = [...new Set(data.devices.map(d => d.model || 'Desconocido'))]
             const initial: Record<string, boolean> = {}
             families.forEach(f => initial[f] = true)
             setSelectedModels(initial)
           })
           .finally(() => {
             if (active) setLoading(false)
           })
       })

       return () => { active = false }
    }
  }, [selectedClient, step])

  if (!monitorWizardOpen) return null

  const handleNext = () => {
    setStep('models')
  }

  const handleStart = () => {
    if (!selectedClient) return
    const activeModels = Object.entries(selectedModels)
        .filter(([_, checked]) => checked)
        .map(([name]) => name)
    
    setMonitorClientId(selectedClient)
    setMonitorModels(activeModels)
    setMonitorWizardOpen(false)
    setViewMode('monitor')
    reset()
  }

  const reset = () => {
    setSelectedClient('')
    setClientDetail(null)
    setStep('client')
    setSelectedModels({})
  }

  const handleClose = () => {
    setMonitorWizardOpen(false)
    reset()
  }

  const toggleModel = (model: string) => {
    setSelectedModels(prev => ({ ...prev, [model]: !prev[model] }))
  }

  const canStart = Object.values(selectedModels).some(v => v)

  return (
    <Portal>
      <div className="log-modal-overlay">
        <div className="log-modal" style={{ maxWidth: '500px' }}>
          <div className="log-modal__header">
            <h2 className="log-modal__title">Configurar Monitoreo de Flota</h2>
            <button className="log-modal__close" onClick={handleClose} aria-label="Cerrar">×</button>
          </div>

          <div style={{ padding: '24px', minHeight: '320px', flex: 1, overflowY: 'auto' }}>
            {step === 'client' ? (
              <>
                <h3 style={{ marginBottom: '16px', color: '#fff', fontSize: '1rem', fontWeight: 600 }}>1. Seleccionar Cliente</h3>
                {loading ? (
                  <p style={{ color: 'var(--text-muted)' }}>Cargando clientes…</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {clients.map(client => (
                      <button
                        key={client.id}
                        onClick={() => setSelectedClient(client.id)}
                        style={{
                          padding: '16px',
                          borderRadius: '12px',
                          border: selectedClient === client.id
                            ? '2px solid var(--hp-blue-vibrant)'
                            : '1px solid rgba(255,255,255,0.08)',
                          background: selectedClient === client.id
                            ? 'rgba(0, 161, 255, 0.1)'
                            : 'rgba(255,255,255,0.03)',
                          color: '#fff',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'block',
                          width: '100%'
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{client.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          {client.device_count} dispositivos configurados
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <h3 style={{ marginBottom: '16px', color: '#fff', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                  <button 
                    onClick={() => setStep('client')} 
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer', 
                      color: 'var(--hp-blue-vibrant)', 
                      padding: '4px 8px',
                      marginLeft: '-8px',
                      fontSize: '1.2rem'
                    }}
                  >
                    ←
                  </button>
                  2. Seleccionar Modelos
                </h3>

                <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => {
                      const all: Record<string, boolean> = {}
                      uniqueModels.forEach(m => all[m] = true)
                      setSelectedModels(all)
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--hp-blue-vibrant)', cursor: 'pointer', fontSize: '0.85rem', padding: 0, fontWeight: 500 }}
                  >
                    Tildar todo
                  </button>
                  <button
                    onClick={() => {
                      const none: Record<string, boolean> = {}
                      uniqueModels.forEach(m => none[m] = false)
                      setSelectedModels(none)
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', padding: 0, fontWeight: 500 }}
                  >
                    Destildar todo
                  </button>
                </div>
                {loading || !clientDetail ? (
                  <p style={{ color: 'var(--text-muted)' }}>Analizando flota…</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                     <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: '1.5' }}>
                       El cliente <strong style={{ color: '#fff' }}>{clientDetail.name}</strong> tiene {clientDetail.devices.length} equipos. 
                       Seleccioná qué familias de modelos querés monitorear:
                     </p>
                     {uniqueModels.map(model => (
                       <label 
                          key={model} 
                          style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '12px', 
                              padding: '12px 16px', 
                              borderRadius: '12px', 
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.06)',
                              cursor: 'pointer',
                              transition: 'var(--transition-fast)'
                          }}
                          className="model-selection-item"
                       >
                         <input 
                          type="checkbox" 
                          style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--hp-blue-vibrant)' }}
                          checked={selectedModels[model] || false} 
                          onChange={() => toggleModel(model)}
                         />
                         <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>{model}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                              {clientDetail.devices.filter(d => (d.model || 'Desconocido') === model).length} dispositivos detectados
                            </div>
                         </div>
                       </label>
                     ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="log-modal__actions">
            <button className="dashboard__btn dashboard__btn--secondary" onClick={handleClose}>
              Cancelar
            </button>
            <div style={{ flex: 1 }} />
            {step === 'client' ? (
               <button className="dashboard__btn dashboard__btn--primary" disabled={!selectedClient} onClick={handleNext}>
                  Siguiente
               </button>
            ) : (
               <button className="dashboard__btn dashboard__btn--primary" disabled={!canStart} onClick={handleStart}>
                  🚀 Iniciar Monitoreo
               </button>
            )}
          </div>
        </div>
      </div>
    </Portal>
  )
}


