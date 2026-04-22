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
  clearFamilyDevices,
  syncMaintenanceDevice
} from '../services/api'
import { useToast } from '../contexts/ToastContext'
import { AvisosSidebar } from '../components/Maintenance/AvisosSidebar'
import { RuleCard } from '../components/Maintenance/RuleCard'
import { RuleModal, RecordChangeModal, StateModal, NewFamilyModal } from '../components/Maintenance/MaintenanceModals'

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
  
  // New Family Modal State
  const [isNewFamilyModalOpen, setIsNewFamilyModalOpen] = useState(false)
  
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

  const handleSyncFamily = async () => {
    if (!selectedFamily) return
    setChecking(true)
    try {
      await triggerMaintenanceCheck(selectedFamily)
      toast.showSuccess(`Sincronización de ${selectedFamily} completada`)
      await loadDevices()
      if (selectedDevice) {
        loadDeviceData(selectedDevice)
      } else {
        loadFamilyRules(selectedFamily)
      }
    } catch (e) {
      toast.showError('Error al sincronizar familia')
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

  const handleSelectDevice = async (device: any) => {
    setSelectedDevice(device)
    setSelectedFamily(device.model_family)
    loadDeviceData(device)
    try {
      const updated = await syncMaintenanceDevice(device.serial)
      setSelectedDevice(updated)
    } catch {
      // silent fail — usamos datos cacheados
    }
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

  const handleCreateNewFamily = (family: string) => {
    const trimmed = family.trim()
    if (!trimmed) return
    setSelectedFamily(trimmed)
    setSelectedDevice(null)
    setRules([])
    setDeviceStates([])
    setHistory([])
    setIsNewFamilyModalOpen(false)
    toast.showSuccess(`Familia ${trimmed} lista para configurar`)
  }

  return (
    <div className="avisos-page animate-in">
      <div className="dashboard__subheader">
        <div className="avisos-subheader-header">
          <button onClick={onBack} className="dashboard__btn dashboard__btn--secondary dashboard__btn--small">
            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>‹</span> Volver
          </button>
          <div className="dashboard__subheader-title-group">
            <h1 className="dashboard__subheader-title">Avisos de Mantenimiento</h1>
            <p className="dashboard__subheader-meta">Gestión preventiva de componentes y suministros</p>
          </div>
        </div>
        <div className="dashboard__subheader-actions">
          {/* Sincronización global movida a cada familia */}
        </div>
      </div>


      <div className="avisos-grid">
        <AvisosSidebar 
          groupedDevices={groupedDevices}
          selectedFamily={selectedFamily}
          selectedDevice={selectedDevice}
          loading={loading}
          onSelectFamily={handleSelectFamily}
          onSelectDevice={handleSelectDevice}
          onNewFamily={() => setIsNewFamilyModalOpen(true)}
        />

        <main className="avisos-main">
          {selectedFamily ? (
            <div className="avisos-detail">
              <div className="avisos-detail-header">
                {selectedDevice ? (
                  <>
                    <h2>Equipo: {selectedDevice.serial}</h2>
                    <p className="detail-subtitle">Modelo: {selectedDevice.model_family}</p>
                  </>
                ) : (
                  <>
                    <div className="family-title-group">
                      <div className="family-title-main">
                        <h2>Familia: {selectedFamily}</h2>
                        <button 
                          onClick={handleRenameFamily}
                          className="dashboard__btn--icon-edit"
                          title="Renombrar Familia"
                        >
                          ✏️
                        </button>
                      </div>
                      <p className="detail-subtitle">Configuración maestra para todos los equipos de este modelo.</p>
                    </div>
                    <div className="avisos-detail-actions">
                      <button 
                        onClick={handleSyncFamily} 
                        disabled={checking}
                        className={`dashboard__btn ${checking ? 'dashboard__btn--loading' : 'dashboard__btn--primary'} dashboard__btn--small`}
                      >
                        {checking ? 'Sincronizando...' : '🔄 Sincronizar Familia'}
                      </button>
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
                    {rules.map((r) => (
                      <RuleCard 
                        key={r.id}
                        rule={r}
                        state={deviceStates.find(s => s.component_type === r.component_type)}
                        selectedDevice={selectedDevice}
                        onEditRule={handleOpenModal}
                        onAdjustState={handleOpenStateModal}
                        onRecordChange={handleOpenRecordModal}
                      />
                    ))}
                    {!selectedDevice && rules.length < 8 && (
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

      {isModalOpen && editingRule && (
        <RuleModal 
          editingRule={editingRule}
          setEditingRule={setEditingRule}
          onSave={handleSaveRule}
          onClose={() => setIsModalOpen(false)}
          saving={saving}
        />
      )}

      {isRecordModalOpen && recordingData && (
        <RecordChangeModal 
          recordingData={recordingData}
          setRecordingData={setRecordingData}
          currentCounter={selectedDevice.last_sync_counter}
          onSave={handleRecordChange}
          onClose={() => setIsRecordModalOpen(false)}
          recording={recording}
        />
      )}

      {isStateModalOpen && stateEditingData && (
        <StateModal 
          stateEditingData={stateEditingData}
          setStateEditingData={setStateEditingData}
          currentCounter={selectedDevice.last_sync_counter}
          onSave={handleSaveManualState}
          onClose={() => setIsStateModalOpen(false)}
          updating={updatingState}
        />
      )}
      {isNewFamilyModalOpen && (
        <NewFamilyModal 
          onSave={handleCreateNewFamily}
          onClose={() => setIsNewFamilyModalOpen(false)}
        />
      )}
    </div>
  )
}
