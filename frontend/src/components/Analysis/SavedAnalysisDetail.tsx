import { useEffect, useState, useRef } from 'react'
import { formatDateTime } from '../../hooks/useDateFilter'
import { getDeviceHealth, updateSavedAnalysis, previewLogs } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import { Activity, AlertTriangle, CheckCircle, RefreshCw, FileText, BarChart2, Calendar, HardDrive } from 'lucide-react'
import type { SavedAnalysisFull, CompareResponse, DeviceHealth, SavedAnalysisIncidentItem } from '../../types/api'

const HEALTH_ICON: Record<DeviceHealth['status'], string> = {
  RED: '🔴',
  YELLOW: '🟡',
  GREEN: '🟢',
}

function DeviceHealthBar({ id }: { id: string }) {
  const [health, setHealth] = useState<DeviceHealth | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ctrl = new AbortController()
    getDeviceHealth(id, ctrl.signal)
      .then((h) => setHealth(h))
      .catch(() => {
        if (!ctrl.signal.aborted) setHealth(null)
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false)
      })
    return () => ctrl.abort()
  }, [id])

  if (loading) {
    return (
      <div className="device-health device-health--loading animate-pulse" style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px dashed rgba(255, 255, 255, 0.1)',
        padding: '20px',
        borderRadius: '16px',
        color: '#94a3b8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        fontSize: '0.95rem'
      }}>
        <RefreshCw className="animate-spin text-sky-400" size={18} />
        Evaluando salud del equipo…
      </div>
    )
  }
  if (!health) return null

  const modifier = health.status.toLowerCase()
  return (
    <div
      className={`device-health device-health--${modifier} animate-in fade-in slide-in-from-top-4`}
      style={{
        background: health.status === 'RED' ? 'rgba(239, 68, 68, 0.08)' : health.status === 'YELLOW' ? 'rgba(234, 179, 8, 0.08)' : 'rgba(34, 197, 94, 0.08)',
        border: `1px solid ${health.status === 'RED' ? 'rgba(239, 68, 68, 0.2)' : health.status === 'YELLOW' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`,
        padding: '20px',
        borderRadius: '16px',
        display: 'flex',
        gap: '16px',
        alignItems: 'flex-start',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
      }}
      role="status"
      aria-live="polite"
    >
      <div className="device-health__icon" style={{ fontSize: '1.5rem', lineHeight: 1 }}>
        {HEALTH_ICON[health.status]}
      </div>
      <div className="device-health__body" style={{ flex: 1 }}>
        <p className="device-health__title" style={{
          margin: 0,
          fontWeight: 700,
          color: '#f8fafc',
          fontSize: '1.05rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '8px'
        }}>
          Estado del Dispositivo: <span style={{
            color: health.status === 'RED' ? '#ef4444' : health.status === 'YELLOW' ? '#eab308' : '#22c55e'
          }}>{health.label}</span>
          <span className="device-health__reco" style={{
            fontWeight: 500,
            opacity: 0.9,
            color: '#cbd5e1'
          }}> — {health.recommendation}</span>
        </p>
        <p className="device-health__reason" style={{
          margin: '6px 0 0 0',
          fontSize: '0.9rem',
          color: '#94a3b8',
          lineHeight: 1.5
        }}>{health.reason}</p>
      </div>
    </div>
  )
}

interface SavedAnalysisDetailProps {
  savedDetail: SavedAnalysisFull | null
  deletingId: string | null
  compareResult: CompareResponse | null
  onDelete: (item: { id: string; name: string }) => void
  onCompare: () => void
  onUpdateDetail?: (updated: SavedAnalysisFull) => void
}

export function SavedAnalysisDetail({
  savedDetail,
  deletingId,
  compareResult,
  onDelete,
  onCompare,
  onUpdateDetail,
}: SavedAnalysisDetailProps) {
  const [updatingLog, setUpdatingLog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  if (!savedDetail) {
    return (
      <div className="dashboard__saved-section" style={{ padding: '40px', textAlign: 'center' }}>
        <RefreshCw className="animate-spin text-sky-400" size={32} style={{ margin: '0 auto 16px' }} />
        <p className="dashboard__muted">Cargando detalles del incidente…</p>
      </div>
    )
  }

  // Calculate stats
  const totalOccurrences = savedDetail.incidents.reduce((acc, inc) => acc + (inc.occurrences || 0), 0)
  const uniqueCodesCount = savedDetail.incidents.length
  const criticalCount = savedDetail.incidents.filter(i => i.severity.toUpperCase() === 'ERROR').length
  const warningCount = savedDetail.incidents.filter(i => i.severity.toUpperCase() === 'WARNING').length

  const handleUpdateLog = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUpdatingLog(true)
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const text = (ev.target?.result as string) ?? ''
        // Parse the new log
        const parseRes = await previewLogs(text, null)
        
        // Convert to payload items
        const items: SavedAnalysisIncidentItem[] = parseRes.incidents.map((inc) => ({
          code: inc.code,
          classification: inc.classification,
          severity: inc.severity,
          occurrences: inc.occurrences,
          start_time: inc.start_time,
          end_time: inc.end_time,
          counter_range: inc.counter_range,
          sds_link: inc.sds_link ?? null,
          last_event_time: inc.end_time,
        }))

        // Call the new PUT endpoint
        const updated = await updateSavedAnalysis(savedDetail.id, {
          name: savedDetail.name,
          equipment_identifier: savedDetail.equipment_identifier,
          incidents: items,
          global_severity: parseRes.global_severity,
        })

        toast.showSuccess('El log guardado y la telemetría se han actualizado exitosamente.')
        if (onUpdateDetail) {
          // Re-fetch or pass details
          onUpdateDetail({
            ...savedDetail,
            incidents: items,
            global_severity: parseRes.global_severity,
          })
        }
      } catch (err) {
        toast.showError(err instanceof Error ? err.message : 'Error al actualizar el log')
      } finally {
        setUpdatingLog(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="dashboard__saved-section animate-in fade-in-50 duration-300" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Info & Actions */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        paddingBottom: '8px'
      }}>
        <div>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
            {savedDetail.name}
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.85rem', color: '#64748b' }}>
            {savedDetail.equipment_identifier && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HardDrive size={14} /> {savedDetail.equipment_identifier}
              </span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} /> Creado: {formatDateTime(savedDetail.created_at)}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".log,.txt,.tsv,text/plain"
            style={{ display: 'none' }}
            onChange={handleUpdateLog}
          />
          <button
            type="button"
            className={`dashboard__btn ${updatingLog ? 'dashboard__btn--loading' : 'dashboard__btn--secondary'}`}
            onClick={() => fileInputRef.current?.click()}
            disabled={updatingLog}
          >
            <RefreshCw size={15} className={updatingLog ? 'animate-spin' : ''} />
            {updatingLog ? 'Actualizando...' : 'Actualizar Log'}
          </button>
          
          <button
            type="button"
            className="dashboard__btn dashboard__btn--primary"
            onClick={onCompare}
          >
            <BarChart2 size={15} /> Comparar con log
          </button>
          
          <button
            type="button"
            className="dashboard__btn dashboard__btn--danger"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}
            disabled={deletingId !== null}
            onClick={() => onDelete({ id: savedDetail.id, name: savedDetail.name })}
          >
            {deletingId === savedDetail.id ? 'Borrando…' : 'Borrar'}
          </button>
        </div>
      </div>

      {/* Degradation / Health Status Widget */}
      <DeviceHealthBar key={savedDetail.id} id={savedDetail.id} />

      {/* Premium Dashboard KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px'
      }}>
        <div style={{
          background: 'rgba(30, 41, 59, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          padding: '20px',
          borderRadius: '16px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
          <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Eventos Totales
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc', marginTop: '6px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            {totalOccurrences}
            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>ocurrencias</span>
          </div>
        </div>

        <div style={{
          background: 'rgba(30, 41, 59, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          padding: '20px',
          borderRadius: '16px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
          <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Códigos de Error
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc', marginTop: '6px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            {uniqueCodesCount}
            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>únicos</span>
          </div>
        </div>

        <div style={{
          background: 'rgba(30, 41, 59, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          padding: '20px',
          borderRadius: '16px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
          <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Severidades Críticas
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f87171', marginTop: '6px', display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            {criticalCount}
            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertTriangle size={14} className="text-red-400" /> ERRORES
            </span>
          </div>
        </div>

        <div style={{
          background: 'rgba(30, 41, 59, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          padding: '20px',
          borderRadius: '16px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
          <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Alertas / Advertencias
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fbbf24', marginTop: '6px', display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            {warningCount}
            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertTriangle size={14} className="text-amber-400" /> WARNINGS
            </span>
          </div>
        </div>
      </div>

      {/* SVG Bar Chart for Incidents Distribution */}
      <div style={{
        background: 'rgba(30, 41, 59, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        padding: '24px',
        borderRadius: '16px',
        boxShadow: '0 4px 25px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 700, color: '#f1f5f9' }}>
          Distribución de Ocurrencias por Código
        </h3>
        
        {savedDetail.incidents.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>No hay incidentes para graficar.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {savedDetail.incidents.slice(0, 5).map((inc, index) => {
              const pct = totalOccurrences > 0 ? ((inc.occurrences || 0) / totalOccurrences) * 100 : 0
              const color = inc.severity.toUpperCase() === 'ERROR' ? '#f87171' : inc.severity.toUpperCase() === 'WARNING' ? '#fbbf24' : '#38bdf8'
              return (
                <div key={inc.code + String(index)} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '80px', fontFamily: 'monospace', fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 600 }}>
                    {inc.code}
                  </div>
                  <div style={{ flex: 1, height: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 0.6s ease-out' }} />
                  </div>
                  <div style={{ width: '80px', textAlign: 'right', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>
                    {inc.occurrences} ({Math.round(pct)}%)
                  </div>
                </div>
              )
            })}
            {savedDetail.incidents.length > 5 && (
              <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', color: '#64748b', textAlign: 'right' }}>
                * Mostrando los 5 códigos con mayores ocurrencias.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Incident List Table */}
      <div style={{
        background: 'rgba(30, 41, 59, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 25px rgba(0, 0, 0, 0.1)'
      }}>
        <div className="table-wrap">
          <table className="dashboard-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th scope="col" style={{ padding: '16px 20px' }}>Código</th>
                <th scope="col" style={{ padding: '16px 20px' }}>Clasificación</th>
                <th scope="col" style={{ padding: '16px 20px' }}>Severidad</th>
                <th scope="col" style={{ padding: '16px 20px' }}>Ocurrencias</th>
                <th scope="col" style={{ padding: '16px 20px' }}>Último evento</th>
              </tr>
            </thead>
            <tbody>
              {savedDetail.incidents.map((inc, i) => {
                const isCrit = inc.severity.toUpperCase() === 'ERROR'
                const isWarn = inc.severity.toUpperCase() === 'WARNING'
                return (
                  <tr key={inc.code + String(i)} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '14px 20px', fontWeight: 700, fontFamily: 'monospace', color: isCrit ? '#f87171' : isWarn ? '#fbbf24' : '#f8fafc' }}>
                      {inc.code}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#cbd5e1' }}>{inc.classification}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: isCrit ? 'rgba(239, 68, 68, 0.15)' : isWarn ? 'rgba(234, 179, 8, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                        color: isCrit ? '#f87171' : isWarn ? '#fbbf24' : '#38bdf8',
                        textTransform: 'uppercase'
                      }}>
                        {inc.severity}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', fontWeight: 600, color: '#f8fafc' }}>{inc.occurrences}</td>
                    <td style={{ padding: '14px 20px', color: '#94a3b8', fontSize: '0.85rem' }}>
                      {inc.last_event_time || inc.end_time
                        ? formatDateTime(inc.last_event_time || inc.end_time)
                        : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comparison Blocks */}
      {compareResult && (
        <div className="dashboard__compare-block animate-in fade-in slide-in-from-bottom-6 duration-400" style={{
          background: 'rgba(15, 23, 42, 0.3)',
          border: '1px solid rgba(56, 189, 248, 0.15)',
          padding: '24px',
          borderRadius: '16px',
          marginTop: '8px',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Activity className="text-sky-400 animate-pulse" size={20} />
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#f1f5f9' }}>
              Comparación de Variaciones en Log Actualizado
            </h3>
          </div>
          
          <div className="dashboard__diff-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{ background: 'rgba(30, 41, 59, 0.3)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>DÍAS DESDE GUARDADO</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
                {compareResult.diff.diferencia_dias} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>días</span>
              </div>
            </div>
            
            <div style={{ background: 'rgba(30, 41, 59, 0.3)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>TENDENCIA DE FLOTA</span>
              <div style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: compareResult.diff.tendencia.includes('Estable') ? '#34d399' : compareResult.diff.tendencia.includes('Mejora') ? '#60a5fa' : '#f87171',
                marginTop: '4px'
              }}>
                {compareResult.diff.tendencia}
              </div>
            </div>

            <div style={{ background: 'rgba(30, 41, 59, 0.3)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>CÓDIGOS NUEVOS</span>
              <div style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: compareResult.diff.codigos_nuevos.length > 0 ? '#f87171' : '#34d399',
                marginTop: '4px'
              }}>
                {compareResult.diff.codigos_nuevos.length > 0 ? (
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                    {compareResult.diff.codigos_nuevos.join(', ')}
                  </span>
                ) : (
                  'Ninguno'
                )}
              </div>
            </div>

            <div style={{ background: 'rgba(30, 41, 59, 0.3)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>CÓDIGOS RESUELTOS</span>
              <div style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: '#34d399',
                marginTop: '4px'
              }}>
                {compareResult.diff.codigos_desaparecidos.length > 0 ? (
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                    {compareResult.diff.codigos_desaparecidos.join(', ')}
                  </span>
                ) : (
                  'Ninguno'
                )}
              </div>
            </div>
          </div>

          {/* SVG Multi-bar comparison chart */}
          {compareResult.diff.cambios_ocurrencias.length > 0 && (
            <div style={{
              background: 'rgba(30, 41, 59, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.04)',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '24px'
            }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0' }}>
                Comparación de Ocurrencias (Guardado vs. Actual)
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {compareResult.diff.cambios_ocurrencias.map((c) => {
                  const maxVal = Math.max(c.saved_occurrences, c.current_occurrences)
                  const pctSaved = maxVal > 0 ? (c.saved_occurrences / maxVal) * 80 : 0
                  const pctCurr = maxVal > 0 ? (c.current_occurrences / maxVal) * 80 : 0
                  return (
                    <div key={c.code} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ fontWeight: 700, color: '#f8fafc', fontFamily: 'monospace' }}>{c.code}</span>
                        <span style={{
                          fontWeight: 700,
                          color: c.delta > 0 ? '#f87171' : '#34d399'
                        }}>
                          {c.delta > 0 ? `+${c.delta}` : c.delta} ocur.
                        </span>
                      </div>
                      
                      {/* Saved Bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ width: '60px', fontSize: '0.75rem', color: '#64748b' }}>Guardado</span>
                        <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px' }}>
                          <div style={{ width: `${pctSaved}%`, height: '100%', background: '#64748b', borderRadius: '3px' }} />
                        </div>
                        <span style={{ width: '30px', textAlign: 'right', fontSize: '0.75rem', color: '#64748b' }}>{c.saved_occurrences}</span>
                      </div>

                      {/* Current Bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ width: '60px', fontSize: '0.75rem', color: '#38bdf8' }}>Nuevo</span>
                        <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px' }}>
                          <div style={{ width: `${pctCurr}%`, height: '100%', background: '#38bdf8', borderRadius: '3px' }} />
                        </div>
                        <span style={{ width: '30px', textAlign: 'right', fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>{c.current_occurrences}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <h4 style={{ margin: '24px 0 16px 0', fontSize: '1.05rem', fontWeight: 700, color: '#f1f5f9' }}>
            Lista de incidentes del log comparado
          </h4>
          <div className="table-wrap" style={{ border: '1px solid rgba(255,255,255,0.03)', borderRadius: '12px', overflow: 'hidden' }}>
            <table className="dashboard-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th scope="col" style={{ padding: '14px 20px' }}>Código</th>
                  <th scope="col" style={{ padding: '14px 20px' }}>Clasificación</th>
                  <th scope="col" style={{ padding: '14px 20px' }}>Severidad</th>
                  <th scope="col" style={{ padding: '14px 20px' }}>Ocurrencias</th>
                  <th scope="col" style={{ padding: '14px 20px' }}>Último evento</th>
                </tr>
              </thead>
              <tbody>
                {compareResult.current.incidents.map((inc) => (
                  <tr key={inc.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '12px 20px', fontWeight: 700, fontFamily: 'monospace', color: '#f8fafc' }}>{inc.code}</td>
                    <td style={{ padding: '12px 20px', color: '#cbd5e1' }}>{inc.classification}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: inc.severity.toUpperCase() === 'ERROR' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                        color: inc.severity.toUpperCase() === 'ERROR' ? '#f87171' : '#38bdf8',
                      }}>
                        {inc.severity}
                      </span>
                    </td>
                    <td style={{ padding: '12px 20px', fontWeight: 600, color: '#f8fafc' }}>{inc.occurrences}</td>
                    <td style={{ padding: '12px 20px', color: '#94a3b8', fontSize: '0.85rem' }}>
                      {inc.end_time ? formatDateTime(inc.end_time) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
