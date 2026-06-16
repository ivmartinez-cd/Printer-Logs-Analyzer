import { useState, useRef } from 'react'
import { useUIStore } from '../../store/useUIStore'
import { useAnalysisStore } from '../../store/useAnalysisStore'
import { useToast } from '../../contexts/ToastContext'
import { deleteSavedAnalysis, compareSavedAnalysis, listSavedAnalyses } from '../../services/api'
import type { SavedAnalysisSummary, SavedAnalysisFull, CompareResponse } from '../../types/api'
import type { ViewMode } from '../ui/Navigation'

import { SDSIncidentModal } from '../Monitor/SDSIncidentModal'
import { LogPasteModal } from '../Analysis/LogPasteModal'
import { SaveIncidentModal } from '../Analysis/SaveIncidentModal'
import { ConfirmModal } from '../ui/ConfirmModal'
import { SolutionContentModal } from '../Parser/SolutionContentModal'
import { HelpModal } from '../ui/HelpModal'
import { MonitorWizard } from '../Monitor/MonitorWizard'

interface DashboardModalsProps {
  serverWasCold: boolean
  autoExtracting: boolean
  currentSerialNumber: string | null
  currentModelId: string | null
  currentModelName: string | null
  selectedSavedId: string | null
  autoResolveAndAnalyze: (serial: string) => void
  setSavedList: React.Dispatch<React.SetStateAction<SavedAnalysisSummary[] | null>>
  setViewMode: (mode: ViewMode) => void
  setSavedDetail: (val: SavedAnalysisFull | null) => void
  setSelectedSavedId: (val: string | null) => void
  setCompareResult: (val: CompareResponse | null) => void
  
  exportingPdf: boolean
  isAiPdfReady: boolean
  setIsAiPdfReady: (val: boolean) => void
  isGeneratingAiPdf: boolean
  handleExportPDF: (val: boolean) => void
  onDateFilterReset: () => void
  deletingId: string | null
  setDeletingId: (val: string | null) => void
}

export function DashboardModals({
  serverWasCold,
  autoExtracting,
  currentSerialNumber,
  currentModelId,
  currentModelName,
  selectedSavedId,
  autoResolveAndAnalyze,
  setSavedList,
  setViewMode,
  setSavedDetail,
  setSelectedSavedId,
  setCompareResult,
  exportingPdf,
  isAiPdfReady,
  setIsAiPdfReady,
  isGeneratingAiPdf,
  handleExportPDF,
  onDateFilterReset,
  deletingId,
  setDeletingId
}: DashboardModalsProps) {
  const {
    loading,
    error,
    setError,
    result,
    handleAnalyze,
    savingIncident,
    handleSaveIncident,
  } = useAnalysisStore()

  const {
    logModalOpen,
    setLogModalOpen,
    sdsModalOpen,
    setSdsModalOpen,
    setSdsIncident,
    saveIncidentModalOpen,
    setSaveIncidentModalOpen,
    compareModalOpen,
    setCompareModalOpen,
    deleteConfirm,
    setDeleteConfirm,
    solutionModal,
    setSolutionModal,
    helpModalOpen,
    setHelpModalOpen,
    monitorWizardOpen,
  } = useUIStore()

  const toast = useToast()
  
  const [comparing, setComparing] = useState(false)
  const [compareLogText, setCompareLogText] = useState('')
  const [compareFileName, setCompareFileName] = useState<string | undefined>(undefined)
  const compareFileInputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      {sdsModalOpen && (
        <SDSIncidentModal
          onContinue={(data) => {
            setSdsIncident(data)
            setSdsModalOpen(false)
          }}
          onClose={() => {
            setSdsModalOpen(false)
          }}
        />
      )}

      {logModalOpen && (
        <LogPasteModal
          loading={loading}
          error={error}
          serverWasCold={serverWasCold}
          onAnalyze={(logText, fileName, modelId, serial, isAutomated) => {
            if (isAutomated && serial) {
              autoResolveAndAnalyze(serial)
              return
            }
            handleAnalyze(logText, fileName, modelId).then(() => {
              setLogModalOpen(false)
              onDateFilterReset()
              toast.showSuccess('Análisis completado')
            }).catch((err: unknown) => {
              toast.showError(err instanceof Error ? err.message : String(err))
            })
          }}
          onClose={() => {
            setError(null)
            setLogModalOpen(false)
          }}
        />
      )}

      {saveIncidentModalOpen && result && (
        <SaveIncidentModal
          onSave={async (name, equipmentIdentifier) => {
            try {
              await handleSaveIncident(name, equipmentIdentifier)
              setSaveIncidentModalOpen(false)
              toast.showSuccess('Incidente guardado')
              const list = await listSavedAnalyses()
              setSavedList(list)
            } catch (e) {
              toast.showError(e instanceof Error ? e.message : 'Error al guardar el incidente')
            }
          }}
          onClose={() => !savingIncident && setSaveIncidentModalOpen(false)}
          saving={savingIncident}
          initialEquipment={
            currentModelName && currentSerialNumber 
              ? `${currentModelName} (${currentSerialNumber})` 
              : currentSerialNumber || currentModelName || ''
          }
          initialName={`Análisis - ${currentSerialNumber || 'Sin Serial'} - ${new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}`}
        />
      )}

      {deleteConfirm && (
        <ConfirmModal
          title="Borrar análisis"
          message={`¿Borrar el análisis "${deleteConfirm.name}"? Esta acción no se puede deshacer.`}
          confirmLabel="Borrar"
          cancelLabel="Cancelar"
          variant="danger"
          loading={deletingId === deleteConfirm.id}
          onConfirm={async () => {
            setDeletingId(deleteConfirm.id)
            try {
              await deleteSavedAnalysis(deleteConfirm.id)
              setSavedList((prev) => (prev ? prev.filter((x) => x.id !== deleteConfirm.id) : []))
              if (selectedSavedId === deleteConfirm.id) {
                setViewMode('saved-list')
                setSavedDetail(null)
                setSelectedSavedId(null)
                setCompareResult(null)
              }
              toast.showSuccess('Análisis borrado')
            } catch (e) {
              toast.showError(e instanceof Error ? e.message : 'Error al borrar')
            } finally {
              setDeletingId(null)
              setDeleteConfirm(null)
            }
          }}
          onCancel={() => !deletingId && setDeleteConfirm(null)}
        />
      )}

      {solutionModal && (
        <SolutionContentModal
          code={solutionModal.code}
          modelId={currentModelId}
          sdsContent={solutionModal.sdsContent}
          sdsUrl={solutionModal.sdsUrl}
          onClose={() => setSolutionModal(null)}
        />
      )}

      {helpModalOpen && (
        <HelpModal onClose={() => setHelpModalOpen(false)} />
      )}

      {monitorWizardOpen && (
        <MonitorWizard />
      )}

      {autoExtracting && (
        <div className="log-modal-overlay" style={{ zIndex: 3000 }}>
          <div className="log-modal" style={{ textAlign: 'center', padding: '40px' }}>
            <div className="log-modal__spinner" style={{ margin: '0 auto 20px', width: '40px', height: '40px' }} />
            <h2 className="log-modal__title">Extrayendo logs automáticamente…</h2>
            <p style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>
              Estamos conectando con el portal SDS para el equipo <strong>{currentSerialNumber}</strong>.
              Esto puede tardar hasta 30 segundos.
            </p>
          </div>
        </div>
      )}

      {compareModalOpen && selectedSavedId && (
        <div
          className="log-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="compare-modal-title"
        >
          <div className="log-modal">
            <div className="log-modal__header">
              <h2 id="compare-modal-title" className="log-modal__title">
                Comparar con log nuevo
              </h2>
              <button
                type="button"
                className="log-modal__close"
                onClick={() => !comparing && setCompareModalOpen(false)}
                aria-label="Cerrar"
                disabled={comparing}
              >
                ×
              </button>
            </div>
            <div className="log-modal__file-row">
              <input
                ref={compareFileInputRef}
                type="file"
                accept=".log,.txt,.tsv,text/plain"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = (ev) => {
                    setCompareLogText((ev.target?.result as string) ?? '')
                    setCompareFileName(file.name)
                  }
                  reader.readAsText(file)
                }}
              />
              <button
                type="button"
                className="dashboard__btn"
                onClick={() => compareFileInputRef.current?.click()}
                disabled={comparing}
              >
                {compareFileName ? `📄 ${compareFileName}` : '📂 Seleccionar archivo…'}
              </button>
            </div>
            <textarea
              className="log-modal__textarea"
              placeholder="O pegar el log aquí…"
              value={compareLogText}
              onChange={(e) => setCompareLogText(e.target.value)}
              rows={10}
              disabled={comparing}
            />
            <div className="log-modal__footer">
              <button
                type="button"
                className="dashboard__btn"
                onClick={() => setCompareModalOpen(false)}
                disabled={comparing}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="dashboard__btn dashboard__btn--primary"
                disabled={!compareLogText.trim() || comparing}
                onClick={async () => {
                  if (!selectedSavedId || !compareLogText.trim()) return
                  setComparing(true)
                  try {
                    const res = await compareSavedAnalysis(selectedSavedId, compareLogText)
                    setCompareResult(res)
                    setCompareModalOpen(false)
                    setViewMode('saved-detail')
                  } catch (e) {
                    toast.showError(e instanceof Error ? e.message : 'Error al comparar')
                  } finally {
                    setComparing(false)
                  }
                }}
              >
                {comparing ? 'Comparando…' : 'Comparar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Modal de Exportación PDF (auto-contenido) ===== */}
      {(exportingPdf || isAiPdfReady || isGeneratingAiPdf) && (
        <>
          <style>{`
            @keyframes pdf-spin { to { transform: rotate(360deg); } }
            .pdf-export-spinner {
              width: 52px;
              height: 52px;
              border: 5px solid rgba(255,255,255,0.12);
              border-top-color: #38bdf8;
              border-radius: 50%;
              animation: pdf-spin 0.9s linear infinite;
              margin-bottom: 28px;
            }
          `}</style>
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(8, 12, 22, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 100000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              background: '#111827',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
              width: '380px',
              padding: '52px 40px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}>
              {!isAiPdfReady ? (
                <>
                  <div className="pdf-export-spinner" />
                  <p style={{
                    margin: '0 0 8px 0',
                    fontSize: '1.35rem',
                    fontWeight: 700,
                    color: '#f1f5f9',
                    letterSpacing: '-0.02em'
                  }}>
                    Generando reporte
                  </p>
                  <p style={{
                    margin: 0,
                    fontSize: '13px',
                    color: '#64748b',
                    lineHeight: 1.5
                  }}>
                    Redactando resumen ejecutivo con IA...
                  </p>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '52px', lineHeight: 1, marginBottom: '24px' }}>✅</div>
                  <p style={{
                    margin: '0 0 10px 0',
                    fontSize: '1.35rem',
                    fontWeight: 700,
                    color: '#f1f5f9',
                    letterSpacing: '-0.02em'
                  }}>
                    ¡Reporte Listo!
                  </p>
                  <p style={{
                    margin: '0 0 32px 0',
                    fontSize: '13px',
                    color: '#64748b',
                    lineHeight: 1.5
                  }}>
                    La IA ha finalizado el resumen ejecutivo.
                  </p>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button
                      className="dashboard__btn"
                      onClick={() => setIsAiPdfReady(false)}
                    >
                      Cerrar
                    </button>
                    <button
                      className="dashboard__btn dashboard__btn--primary"
                      onClick={() => { setIsAiPdfReady(false); handleExportPDF(true) }}
                    >
                      Abrir Impresión
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
