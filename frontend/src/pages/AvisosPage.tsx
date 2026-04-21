import { useState, useEffect, useMemo } from 'react'
import { 
  getMaintenanceDevices, 
  getMaintenanceModelRules, 
  getMaintenanceDeviceState,
  triggerMaintenanceCheck, 
  upsertMaintenanceModelRule,
  getMaintenanceHistory,
  recordMaintenanceChange,
  discoverFamily,
  updateDeviceState,
  renameFamily,
  clearFamilyDevices
} from '../services/api'
import { useToast } from '../contexts/ToastContext'

export function AvisosPage({ onBack }: { onBack: () => void }) {
  const [devices, setDevices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [discovering, setDiscovering] = useState(false)
  
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null)
  const [selectedDevice, setSelectedDevice] = useState<any | null>(null)
  
  const [rules, setRules] = useState<any[]>([])
  const [deviceStates, setDeviceStates] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [loadingRules, setLoadingRules] = useState(false)
  
  // Rule Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)

  // Record Change Modal State
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false)
  const [recordingData, setRecordingData] = useState<any | null>(null)
  const [recording, setRecording] = useState(false)

  // Manual State Update Modal
  const [isStateModalOpen, setIsStateModalOpen] = useState(false)
  const [stateEditingData, setStateEditingData] = useState<any | null>(null)
  const [updatingState, setUpdatingState] = useState(false)
  
  const toast = useToast()

  // Agrupar equipos por familia
  const groupedDevices = useMemo(() => {
    return devices.reduce((acc: any, device: any) => {
      const family = device.model_family || 'Sin Modelo'
      if (!acc[family]) acc[family] = []
      acc[family].push(device)
      return acc
    }, {})
  }, [devices])

  useEffect(() => {
    loadDevices()
  }, [])

  const loadDevices = async () => {
    setLoading(true)
    try {
      const data = await getMaintenanceDevices()
      setDevices(data)
    } catch (e) {
      toast.showError('Error al cargar dispositivos')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckNow = async () => {
    setChecking(true)
    try {
      await triggerMaintenanceCheck()
      toast.showSuccess('Sincronización disparada correctamente')
      await loadDevices()
      if (selectedDevice) {
        loadDeviceData(selectedDevice)
      } else if (selectedFamily) {
        loadFamilyRules(selectedFamily)
      }
    } catch (e) {
      toast.showError('Error al sincronizar')
    } finally {
      setChecking(false)
    }
  }

  const loadFamilyRules = async (family: string) => {
    setLoadingRules(true)
    try {
      const rulesData = await getMaintenanceModelRules(family)
      setRules(rulesData)
      setDeviceStates([])
      setHistory([])
    } catch (e) {
      toast.showError('Error al cargar reglas de familia')
    } finally {
      setLoadingRules(false)
    }
  }

  const loadDeviceData = async (device: any) => {
    setLoadingRules(true)
    try {
      const [rulesData, statesData, historyData] = await Promise.all([
        getMaintenanceModelRules(device.model_family),
        getMaintenanceDeviceState(device.serial),
        getMaintenanceHistory(device.serial)
      ])
      setRules(rulesData)
      setDeviceStates(statesData)
      setHistory(historyData)
    } catch (e) {
      toast.showError('Error al cargar datos del equipo')
    } finally {
      setLoadingRules(false)
    }
  }

  const handleSelectFamily = (family: string) => {
    setSelectedFamily(family)
    setSelectedDevice(null)
    loadFamilyRules(family)
  }

  const handleSelectDevice = (device: any) => {
    setSelectedDevice(device)
    setSelectedFamily(device.model_family)
    loadDeviceData(device)
  }

  const handleOpenModal = (rule?: any) => {
    if (rule) {
      setEditingRule({ ...rule })
    } else {
      setEditingRule({
        model_family: selectedFamily || '',
        component_type: '',
        expected_life: 200000,
        alert_margin: 10000,
        email_recipients: ''
      })
    }
    setIsModalOpen(true)
  }

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await upsertMaintenanceModelRule(editingRule)
      toast.showSuccess('Regla guardada correctamente')
      setIsModalOpen(false)
      setSelectedFamily(editingRule.model_family)
      await loadDevices()
      loadFamilyRules(editingRule.model_family)
    } catch (e) {
      toast.showError('Error al guardar la regla')
    } finally {
      setSaving(false)
    }
  }

  const handleDiscoverFamily = async () => {
    if (!selectedFamily) return
    setDiscovering(true)
    try {
      await discoverFamily(selectedFamily)
      toast.showSuccess(`Descubrimiento para ${selectedFamily} completado`)
      await loadDevices()
    } catch (e) {
      toast.showError('Error al buscar equipos en SDS')
    } finally {
      setDiscovering(false)
    }
  }

  const handleRenameFamily = async () => {
    if (!selectedFamily) return
    const newName = window.prompt('Nuevo nombre para la familia:', selectedFamily)
    if (!newName || newName === selectedFamily) return

    setLoadingRules(true)
    try {
      await renameFamily(selectedFamily, newName)
      toast.showSuccess('Familia renombrada correctamente')
      setSelectedFamily(newName)
      await loadDevices()
      await loadFamilyRules(newName)
    } catch (e) {
      toast.showError('Error al renombrar familia')
    } finally {
      setLoadingRules(false)
    }
  }

  const handleClearDevices = async () => {
    if (!selectedFamily) return
    if (!window.confirm(`¿Estás seguro de que quieres eliminar todos los equipos asociados a la familia "${selectedFamily}"? Esto limpiará la lista actual.`)) return

    setLoading(true)
    try {
      await clearFamilyDevices(selectedFamily)
      toast.showSuccess('Lista de equipos limpiada')
      await loadDevices()
    } catch (e) {
      toast.showError('Error al limpiar equipos')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenStateModal = (rule: any, currentState: any) => {
    setStateEditingData({
      serial: selectedDevice.serial,
      component_type: rule.component_type,
      last_change_counter: currentState?.last_change_counter || 0
    })
    setIsStateModalOpen(true)
  }

  const handleSaveManualState = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdatingState(true)
    try {
      await updateDeviceState(
        stateEditingData.serial,
        stateEditingData.component_type,
        stateEditingData.last_change_counter
      )
      toast.showSuccess('Estado actualizado correctamente')
      setIsStateModalOpen(false)
      loadDeviceData(selectedDevice)
    } catch (e) {
      toast.showError('Error al actualizar estado')
    } finally {
      setUpdatingState(false)
    }
  }

  const handleOpenRecordModal = (rule: any) => {
    if (!selectedDevice) return
    setRecordingData({
      serial: selectedDevice.serial,
      component_type: rule.component_type,
      incident_number: '',
      notes: ''
    })
    setIsRecordModalOpen(true)
  }

  const handleRecordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setRecording(true)
    try {
      await recordMaintenanceChange(recordingData)
      toast.showSuccess('Cambio registrado y ciclo reiniciado')
      setIsRecordModalOpen(false)
      if (selectedDevice) {
        loadDeviceData(selectedDevice)
        loadDevices() // Refresh sync counter
      }
    } catch (e) {
      toast.showError('Error al registrar el cambio')
    } finally {
      setRecording(false)
    }
  }

  return (
    <div className="avisos-page animate-in">
      <div className="dashboard__subheader">
        <div className="avisos-subheader-header">
          <button onClick={onBack} className="dashboard__btn dashboard__btn--secondary dashboard__btn--small">
            ← Volver
          </button>
          <h1 className="dashboard__subheader-title">Avisos de Mantenimiento</h1>
        </div>
        <div className="dashboard__subheader-actions">
          <button 
            onClick={handleCheckNow} 
            disabled={checking}
            className="dashboard__btn dashboard__btn--primary"
          >
            {checking ? 'Sincronizando...' : '🔄 Sincronizar Ahora'}
          </button>
        </div>
      </div>

      <div className="avisos-grid">
        <aside className="avisos-sidebar">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className="avisos-section-title" style={{ marginBottom: 0 }}>Equipos por Familia</h3>
            <button 
              onClick={() => handleOpenModal()} 
              className="dashboard__btn--icon"
              title="Nueva Familia"
            >
              ➕
            </button>
          </div>
          <div className="avisos-device-list">
            {loading ? (
              <p>Cargando...</p>
            ) : Object.keys(groupedDevices).length > 0 ? (
              Object.keys(groupedDevices).map((family) => (
                <div key={family} className="avisos-family-group">
                  <div 
                    className={`avisos-family-header ${selectedFamily === family && !selectedDevice ? 'is-selected' : ''}`}
                    onClick={() => handleSelectFamily(family)}
                  >
                    <span className="family-icon">📂</span>
                    <span className="family-name">{family}</span>
                    <span className="family-count">{groupedDevices[family].length}</span>
                  </div>
                  {selectedFamily === family && (
                    <div className="avisos-family-devices">
                      {groupedDevices[family].map((d: any) => (
                        <div 
                          key={d.serial} 
                          className={`avisos-device-item ${selectedDevice?.serial === d.serial ? 'is-selected' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSelectDevice(d)
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
              ))
            ) : (
              <p>No hay equipos configurados.</p>
            )}
          </div>
        </aside>

        <main className="avisos-main">
          {selectedFamily ? (
            <div className="avisos-detail">
              <div className="avisos-detail-header">
                {selectedDevice ? (
                  <>
                    <h2>Equipo: {selectedDevice.serial}</h2>
                    <p className="detail-subtitle">Modelo: {selectedDevice.model_family}</p>
                  </>
                ) : selectedFamily ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <h2>Familia: {selectedFamily}</h2>
                      <button 
                        onClick={handleRenameFamily}
                        className="dashboard__btn--icon"
                        title="Renombrar Familia"
                      >
                        ✏️
                      </button>
                    </div>
                    <p className="detail-subtitle">Configuración maestra para todos los equipos de este modelo.</p>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                      <button 
                        onClick={handleDiscoverFamily} 
                        disabled={discovering}
                        className="dashboard__btn dashboard__btn--secondary dashboard__btn--small"
                      >
                        {discovering ? 'Buscando...' : '🔍 Buscar Equipos en SDS'}
                      </button>
                      <button 
                        onClick={handleClearDevices}
                        className="dashboard__btn dashboard__btn--danger-outline dashboard__btn--small"
                      >
                        🗑️ Limpiar Equipos
                      </button>
                    </div>
                  </>
                ) : (
                  <h2>Selecciona un equipo o familia</h2>
                )}
              </div>

              <div className="avisos-rules-section">
                <h3 className="avisos-section-title">
                  Reglas Maestras {selectedDevice ? '' : '(Modo Catálogo)'}
                </h3>
                {loadingRules ? (
                  <p>Cargando reglas...</p>
                ) : (
                  <div className="avisos-rules-list">
                    {rules.map((r) => {
                      const state = deviceStates.find(s => s.component_type === r.component_type)
                      const lastCounter = state ? state.last_change_counter : 0
                      const nextChange = lastCounter + r.expected_life
                      const remaining = selectedDevice ? (nextChange - selectedDevice.last_sync_counter) : null
                      const percent = selectedDevice ? Math.max(0, Math.min(100, (remaining! / r.expected_life) * 100)) : null

                      return (
                      <div key={r.id} className="avisos-rule-card">
                        <div className="avisos-rule-header">
                          <h4>{r.component_type}</h4>
                          <div className="avisos-rule-header-actions">
                            {!selectedDevice && (
                              <div className="edit-indicator-compact" onClick={() => handleOpenModal(r)} title="Editar Regla Maestra">✏️ Editar</div>
                            )}
                            {selectedDevice && (
                              <>
                                <div className="edit-indicator-compact" onClick={() => handleOpenStateModal(r, state)} title="Ajustar Contador de Último Cambio">⚙️ Ajustar</div>
                                <span className={`avisos-rule-badge ${remaining! <= r.alert_margin ? 'is-warning' : ''}`}>
                                  {remaining! <= r.alert_margin ? 'Atención' : 'OK'}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="avisos-rule-body">
                          {selectedDevice && (
                             <div className="avisos-rule-progress">
                               <div className="progress-bar">
                                 <div className="progress-fill" style={{ width: `${percent}%`, backgroundColor: percent! < 20 ? '#ef4444' : '#10b981' }}></div>
                               </div>
                               <div className="progress-text">
                                 {remaining?.toLocaleString()} páginas restantes
                               </div>
                             </div>
                          )}
                          <div className="avisos-rule-metric">
                            <span className="label">Vida Útil:</span>
                            <span className="value">{r.expected_life?.toLocaleString()} págs.</span>
                          </div>
                          <div className="avisos-rule-metric">
                            <span className="label">Margen Alerta:</span>
                            <span className="value">{r.alert_margin?.toLocaleString()} págs.</span>
                          </div>
                          {selectedDevice && (
                            <div className="avisos-rule-metric">
                              <span className="label">Último Cambio:</span>
                              <span className="value">{lastCounter.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                        {selectedDevice && (
                          <div className="avisos-rule-actions">
                            <button 
                              className="dashboard__btn dashboard__btn--primary"
                              style={{ width: '100%', height: '44px' }}
                              onClick={() => handleOpenRecordModal(r)}
                            >
                              🛠️ Registrar Cambio
                            </button>
                          </div>
                        )}
                      </div>
                    )})}
                    {(!selectedDevice && rules.length < 8) && (
                      <button className="avisos-add-rule-btn" onClick={() => handleOpenModal()}>
                        <span>+ Agregar Regla al Modelo</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {selectedDevice && (
                <div className="avisos-history-section">
                  <h3 className="avisos-section-title">Historial del Equipo</h3>
                  {history.length > 0 ? (
                    <div className="avisos-history-list">
                      {history.map((h) => (
                        <div key={h.id} className="avisos-history-item">
                          <div className="history-date">{new Date(h.changed_at).toLocaleDateString()}</div>
                          <div className="history-content">
                            <div className="history-main">
                              <strong>{h.component_type}</strong> cambiado a las <strong>{h.change_counter?.toLocaleString()}</strong> págs.
                            </div>
                            {h.incident_number && (
                              <div className="history-incident">Nº Incidente: <code>{h.incident_number}</code></div>
                            )}
                            {h.technician_notes && (
                              <div className="history-notes">"{h.technician_notes}"</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="avisos-no-history">No hay intervenciones registradas para este equipo.</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="avisos-empty-state">
              <div className="avisos-empty-icon">📂</div>
              <h3>Selecciona una familia o equipo</h3>
              <p>Gestiona las reglas globales por modelo o registra intervenciones específicas por número de serie.</p>
            </div>
          )}
        </main>
      </div>

      {/* Modal: Editar Regla */}
      {isModalOpen && editingRule && (
        <div className="maintenance-modal-overlay">
          <div className="maintenance-modal">
            <h3>{editingRule.id ? 'Editar Regla Maestra' : 'Nueva Regla Maestra'}</h3>
            <form onSubmit={handleSaveRule} className="maintenance-form" style={{ marginTop: '20px' }}>
              <div className="form-group">
                <label>Familia de Modelo (ej: 50145)</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="Ej: 50145"
                  value={editingRule.model_family}
                  onChange={e => setEditingRule({...editingRule, model_family: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Componente</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="Ej: Fuser Kit, Roller..."
                  value={editingRule.component_type}
                  onChange={e => setEditingRule({...editingRule, component_type: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Vida Útil Esperada (págs)</label>
                <input 
                  type="number" 
                  className="form-input"
                  value={editingRule.expected_life}
                  onChange={e => setEditingRule({...editingRule, expected_life: parseInt(e.target.value)})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Margen de Alerta (págs antes)</label>
                <input 
                  type="number" 
                  className="form-input"
                  value={editingRule.alert_margin}
                  onChange={e => setEditingRule({...editingRule, alert_margin: parseInt(e.target.value)})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Emails (separados por coma)</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="ejemplo@correo.com"
                  value={editingRule.email_recipients}
                  onChange={e => setEditingRule({...editingRule, email_recipients: e.target.value})}
                />
              </div>
              <div className="form-actions">
                <button 
                  type="button" 
                  className="dashboard__btn dashboard__btn--secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="dashboard__btn dashboard__btn--primary"
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar Regla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Registrar Cambio */}
      {isRecordModalOpen && recordingData && (
        <div className="maintenance-modal-overlay">
          <div className="maintenance-modal">
            <h3>🛠️ Registrar Cambio de Componente</h3>
            <p style={{ marginBottom: '20px', opacity: 0.7 }}>
              Se registrará el cambio de <strong>{recordingData.component_type}</strong> para el equipo {recordingData.serial} con el contador actual de <strong>{selectedDevice.last_sync_counter.toLocaleString()}</strong> págs.
            </p>
            <form onSubmit={handleRecordChange} className="maintenance-form">
              <div className="form-group">
                <label>Nº de Incidente (Opcional)</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="Ej: INC-12345"
                  value={recordingData.incident_number}
                  onChange={e => setRecordingData({...recordingData, incident_number: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Notas del Técnico</label>
                <textarea 
                  className="form-input"
                  rows={3}
                  placeholder="Detalles del cambio..."
                  value={recordingData.notes}
                  onChange={e => setRecordingData({...recordingData, notes: e.target.value})}
                />
              </div>
              <div className="form-actions">
                <button 
                  type="button" 
                  className="dashboard__btn dashboard__btn--secondary"
                  onClick={() => setIsRecordModalOpen(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="dashboard__btn dashboard__btn--primary"
                  disabled={recording}
                >
                  {recording ? 'Registrando...' : 'Confirmar Cambio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Manual State Update Modal */}
      {isStateModalOpen && stateEditingData && (
        <div className="maintenance-modal-overlay">
          <div className="maintenance-modal">
            <h3>⚙️ Ajustar Último Cambio</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.9rem' }}>
              Ajusta manualmente el contador en el que se realizó el último cambio para este equipo.
            </p>
            <form onSubmit={handleSaveManualState} className="maintenance-form">
              <div className="form-group">
                <label>Componente</label>
                <input className="form-input" value={stateEditingData.component_type} disabled />
              </div>
              <div className="form-group">
                <label>Contador del Último Cambio (Páginas)</label>
                <input 
                  className="form-input"
                  type="number" 
                  value={stateEditingData.last_change_counter}
                  onChange={e => setStateEditingData({...stateEditingData, last_change_counter: parseInt(e.target.value)})}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                  Contador actual del equipo: {selectedDevice.last_sync_counter.toLocaleString()}
                </span>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setIsStateModalOpen(false)} className="dashboard__btn dashboard__btn--secondary">Cancelar</button>
                <button type="submit" disabled={updatingState} className="dashboard__btn dashboard__btn--primary">
                  {updatingState ? 'Guardando...' : 'Guardar Ajuste'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
