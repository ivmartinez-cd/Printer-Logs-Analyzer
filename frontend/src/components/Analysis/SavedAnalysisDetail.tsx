import { useEffect, useState, useRef } from 'react'
import { formatDateTime } from '../../hooks/useDateFilter'
import { getDeviceHealth, createSavedAnalysis, previewLogs, extractSdsLogs } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import { useHpCacheRefresh } from '../../hooks/useHpCacheRefresh'
import { Activity, AlertTriangle, RefreshCw, BarChart2, Calendar, HardDrive, CheckCircle, DatabaseBackup } from 'lucide-react'
import { Portal } from '../ui/Portal'
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
  onClearCompare?: () => void
}

export function SavedAnalysisDetail({
  savedDetail,
  deletingId,
  compareResult,
  onDelete,
  onCompare,
  onUpdateDetail,
  onClearCompare,
}: SavedAnalysisDetailProps) {
  const [updatingLog, setUpdatingLog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()
  const { refreshing: refreshingHpCache, triggerRefresh: triggerHpCacheRefresh } = useHpCacheRefresh()

  const [updateDiff, setUpdateDiff] = useState<{
    newCodes: string[]
    resolvedCodes: string[]
    occurrenceChanges: Array<{ code: string; before: number; after: number; delta: number }>
  } | null>(null)

  const [previousIncidents, setPreviousIncidents] = useState<SavedAnalysisIncidentItem[] | null>(null)


  if (!savedDetail) {
    return (
      <div className="dashboard__saved-section" style={{ padding: '40px', textAlign: 'center' }}>
        <RefreshCw className="animate-spin text-sky-400" size={32} style={{ margin: '0 auto 16px' }} />
        <p className="dashboard__muted">Cargando detalles del incidente…</p>
      </div>
    )
  }

  // Unify update diff and manual comparison modes
  const isComparing = !!compareResult;
  const isUpdating = !!updateDiff && !!previousIncidents;

  const beforeIncidents = isComparing 
    ? compareResult.saved.incidents 
    : isUpdating 
      ? previousIncidents 
      : null;

  const afterIncidents = isComparing 
    ? compareResult.current.incidents 
    : savedDetail.incidents;

  const getIncidentsOccurrences = (incidentsList: SavedAnalysisIncidentItem[]) => {
    return incidentsList.reduce((acc, inc) => acc + (inc.occurrences || 0), 0);
  };

  const getCriticalCount = (incidentsList: SavedAnalysisIncidentItem[]) => {
    return incidentsList.filter(i => i.severity.toUpperCase() === 'ERROR').length;
  };

  const getWarningCount = (incidentsList: SavedAnalysisIncidentItem[]) => {
    return incidentsList.filter(i => i.severity.toUpperCase() === 'WARNING').length;
  };

  // Calculate active stats
  const totalOccurrences = getIncidentsOccurrences(afterIncidents);
  const uniqueCodesCount = afterIncidents.length;
  const criticalCount = getCriticalCount(afterIncidents);
  const warningCount = getWarningCount(afterIncidents);

  // Calculate previous stats (for deltas)
  const prevTotalOccurrences = beforeIncidents ? getIncidentsOccurrences(beforeIncidents) : 0;
  const prevUniqueCodesCount = beforeIncidents ? beforeIncidents.length : 0;
  const prevCriticalCount = beforeIncidents ? getCriticalCount(beforeIncidents) : 0;
  const prevWarningCount = beforeIncidents ? getWarningCount(beforeIncidents) : 0;

  const renderKPIDelta = (beforeVal: number, afterVal: number, label: string = '') => {
    if (!beforeIncidents) return null;
    const delta = afterVal - beforeVal;
    if (delta === 0) {
      return (
        <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '6px', fontWeight: 600 }}>
          (sin cambios)
        </span>
      );
    }
    const isPositive = delta > 0;
    const color = isPositive ? '#f87171' : '#34d399';
    const sign = isPositive ? '+' : '';
    return (
      <span style={{ fontSize: '0.8rem', color, fontWeight: 700, marginLeft: '6px' }}>
        ({sign}{delta}{label})
      </span>
    );
  };

  interface MergedIncidentInfo {
    code: string;
    classification: string;
    severity: string;
    beforeCount: number;
    afterCount: number;
    delta: number;
    last_event_time: string | null;
  }

  const getMergedIncidentsForChart = (): MergedIncidentInfo[] => {
    const afterMap = new Map(afterIncidents.map(i => [i.code, i]));
    const beforeMap = beforeIncidents ? new Map(beforeIncidents.map(i => [i.code, i])) : new Map<string, SavedAnalysisIncidentItem>();

    const allCodes = new Set([...afterMap.keys(), ...beforeMap.keys()]);
    const merged: MergedIncidentInfo[] = [];

    for (const code of allCodes) {
      const beforeInc = beforeMap.get(code);
      const afterInc = afterMap.get(code);

      const beforeCount = beforeInc?.occurrences || 0;
      const afterCount = afterInc?.occurrences || 0;
      const classification = afterInc?.classification || beforeInc?.classification || 'Desconocido';
      const severity = afterInc?.severity || beforeInc?.severity || 'INFO';
      const afterLastEvent = afterInc && 'last_event_time' in afterInc ? afterInc.last_event_time : undefined;
      const beforeLastEvent = beforeInc && 'last_event_time' in beforeInc ? beforeInc.last_event_time : undefined;
      const last_event_time = afterLastEvent || afterInc?.end_time || beforeLastEvent || beforeInc?.end_time || null;

      merged.push({
        code,
        classification,
        severity,
        beforeCount,
        afterCount,
        delta: afterCount - beforeCount,
        last_event_time
      });
    }

    return merged.sort((a, b) => {
      const scoreA = a.afterCount || a.beforeCount;
      const scoreB = b.afterCount || b.beforeCount;
      return scoreB - scoreA;
    });
  };

  const listToRender = beforeIncidents 
    ? getMergedIncidentsForChart() 
    : savedDetail.incidents.map(inc => ({
        code: inc.code,
        classification: inc.classification,
        severity: inc.severity,
        beforeCount: 0,
        afterCount: inc.occurrences || 0,
        delta: 0,
        last_event_time: inc.last_event_time || inc.end_time
      }));


  function calculateUpdateDiff(before: SavedAnalysisIncidentItem[], after: SavedAnalysisIncidentItem[]) {
    const beforeMap = new Map(before.map(i => [i.code, i]))
    const afterMap = new Map(after.map(i => [i.code, i]))

    const newCodes: string[] = []
    const resolvedCodes: string[] = []
    const occurrenceChanges: Array<{ code: string; before: number; after: number; delta: number }> = []

    for (const [code, inc] of afterMap.entries()) {
      if (!beforeMap.has(code)) {
        newCodes.push(code)
      } else {
        const beforeInc = beforeMap.get(code)
        const beforeCount = beforeInc?.occurrences || 0
        const afterCount = inc.occurrences || 0
        if (beforeCount !== afterCount) {
          occurrenceChanges.push({
            code,
            before: beforeCount,
            after: afterCount,
            delta: afterCount - beforeCount
          })
        }
      }
    }

    for (const code of beforeMap.keys()) {
      if (!afterMap.has(code)) {
        resolvedCodes.push(code)
      }
    }

    return { newCodes, resolvedCodes, occurrenceChanges }
  }

  const handleUpdateLog = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUpdatingLog(true)
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const text = (ev.target?.result as string) ?? ''
        const parseRes = await previewLogs(text, null)
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

        // Create a NEW dated snapshot (don't overwrite) so the equipment keeps
        // a day-by-day history that feeds the timeline and degradation engine.
        const newSnap = await createSavedAnalysis({
          name: savedDetail.name,
          equipment_identifier: savedDetail.equipment_identifier,
          incidents: items,
          global_severity: parseRes.global_severity,
        })

        const diff = calculateUpdateDiff(savedDetail.incidents, items)
        setPreviousIncidents(savedDetail.incidents)
        setUpdateDiff(diff)

        toast.showSuccess('Nuevo snapshot guardado. Mostrando diferencias vs la lectura anterior.')
        if (onUpdateDetail) {
          onUpdateDetail({
            id: newSnap.id,
            name: newSnap.name,
            equipment_identifier: newSnap.equipment_identifier,
            incidents: items,
            global_severity: newSnap.global_severity,
            created_at: newSnap.created_at,
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

  const triggerLogUpdate = async () => {
    const serial = savedDetail.equipment_identifier?.trim()
    if (!serial) {
      fileInputRef.current?.click()
      return
    }

    setUpdatingLog(true)
    try {
      const sdsRes = await extractSdsLogs(serial)
      if (!sdsRes.logs_text) {
        throw new Error('No se encontraron logs para este número de serie en el portal SDS.')
      }

      const parseRes = await previewLogs(sdsRes.logs_text, null)
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

      // New dated snapshot (see handleUpdateLog) instead of overwriting.
      const newSnap = await createSavedAnalysis({
        name: savedDetail.name,
        equipment_identifier: savedDetail.equipment_identifier,
        incidents: items,
        global_severity: parseRes.global_severity,
      })

      const diff = calculateUpdateDiff(savedDetail.incidents, items)
      setPreviousIncidents(savedDetail.incidents)
      setUpdateDiff(diff)

      toast.showSuccess(`Nuevo snapshot de ${serial} guardado desde el portal SDS. Mostrando diferencias.`)
      if (onUpdateDetail) {
        onUpdateDetail({
          id: newSnap.id,
          name: newSnap.name,
          equipment_identifier: newSnap.equipment_identifier,
          incidents: items,
          global_severity: newSnap.global_severity,
          created_at: newSnap.created_at,
        })
      }
    } catch (err) {
      toast.showWarning(err instanceof Error ? err.message : 'Error al conectar con el portal. Seleccione archivo manual.')
      fileInputRef.current?.click()
    } finally {
      setUpdatingLog(false)
    }
  }

  return (
    <div className="dashboard__saved-section animate-in fade-in-50 duration-300" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Comparison/Update Banner */}
      {(isComparing || isUpdating) && (
        <div style={{
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          padding: '16px 20px',
          borderRadius: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Activity className="text-sky-400 animate-pulse" size={20} />
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>
                {isComparing 
                  ? 'Modo Comparación Activo — Visualizando diferencias con el log seleccionado.'
                  : 'Log Actualizado — Visualizando variaciones respecto al log original.'
                }
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                Los KPIs, gráficos y la lista de incidentes reflejan las diferencias y deltas.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="dashboard__btn"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#f8fafc',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '6px 14px',
              fontSize: '0.85rem'
            }}
            onClick={() => {
              if (isComparing && onClearCompare) {
                onClearCompare();
              } else {
                setUpdateDiff(null);
                setPreviousIncidents(null);
              }
            }}
          >
            Volver a Vista Normal
          </button>
        </div>
      )}

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
            onClick={triggerLogUpdate}
            disabled={updatingLog}
          >
            <RefreshCw size={15} className={updatingLog ? 'animate-spin' : ''} />
            {updatingLog ? 'Actualizando...' : 'Actualizar Log'}
          </button>

          {savedDetail.equipment_identifier && (
            <button
              type="button"
              className="dashboard__btn dashboard__btn--secondary"
              onClick={() => triggerHpCacheRefresh(savedDetail.equipment_identifier)}
              disabled={refreshingHpCache}
              title="Solicitar al portal SDS que actualice la caché de datos de HP del dispositivo"
            >
              <DatabaseBackup size={15} />
              {refreshingHpCache ? 'Actualizando...' : 'Actualizar caché HP'}
            </button>
          )}

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
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc', marginTop: '6px', display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '8px' }}>
            <span>{totalOccurrences}</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>ocurrencias</span>
            {renderKPIDelta(prevTotalOccurrences, totalOccurrences)}
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
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc', marginTop: '6px', display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '8px' }}>
            <span>{uniqueCodesCount}</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>únicos</span>
            {renderKPIDelta(prevUniqueCodesCount, uniqueCodesCount)}
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
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f87171', marginTop: '6px', display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '12px' }}>
            <span>{criticalCount}</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertTriangle size={14} className="text-red-400" /> ERRORES
            </span>
            {renderKPIDelta(prevCriticalCount, criticalCount)}
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
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fbbf24', marginTop: '6px', display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '12px' }}>
            <span>{warningCount}</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertTriangle size={14} className="text-amber-400" /> WARNINGS
            </span>
            {renderKPIDelta(prevWarningCount, warningCount)}
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
          {beforeIncidents 
            ? 'Comparación de Ocurrencias por Código (Antes vs. Ahora)' 
            : 'Distribución de Ocurrencias por Código'
          }
        </h3>
        
        {listToRender.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>No hay incidentes para graficar.</p>
        ) : beforeIncidents ? (
          /* Dual-bar comparison mode */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {(() => {
              const maxVal = Math.max(...listToRender.slice(0, 5).map(m => Math.max(m.beforeCount, m.afterCount)), 1)
              return listToRender.slice(0, 5).map((m, index) => {
                const pctBefore = (m.beforeCount / maxVal) * 100
                const pctAfter = (m.afterCount / maxVal) * 100
                const color = m.severity.toUpperCase() === 'ERROR' ? '#f87171' : m.severity.toUpperCase() === 'WARNING' ? '#fbbf24' : '#38bdf8'
                const deltaSign = m.delta > 0 ? '+' : ''
                const deltaColor = m.delta > 0 ? '#f87171' : m.delta < 0 ? '#34d399' : '#64748b'
                
                return (
                  <div key={m.code + String(index)} style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#f8fafc', fontWeight: 700 }}>
                          {m.code}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {m.classification}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: deltaColor }}>
                        {m.delta === 0 ? 'sin cambios' : `${deltaSign}${m.delta} ocur.`}
                      </div>
                    </div>
                    
                    {/* Before bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ width: '50px', fontSize: '0.75rem', color: '#64748b' }}>Antes</span>
                      <div style={{ flex: 1, height: '6px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${pctBefore}%`, height: '100%', background: 'rgba(100, 116, 139, 0.4)', borderRadius: '3px' }} />
                      </div>
                      <span style={{ width: '30px', textAlign: 'right', fontSize: '0.75rem', color: '#64748b' }}>{m.beforeCount}</span>
                    </div>

                    {/* After bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ width: '50px', fontSize: '0.75rem', color: color, fontWeight: 600 }}>Ahora</span>
                      <div style={{ flex: 1, height: '6px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${pctAfter}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 0.6s ease-out' }} />
                      </div>
                      <span style={{ width: '30px', textAlign: 'right', fontSize: '0.75rem', color: color, fontWeight: 700 }}>{m.afterCount}</span>
                    </div>
                  </div>
                )
              })
            })()}
            {listToRender.length > 5 && (
              <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', color: '#64748b', textAlign: 'right' }}>
                * Mostrando los 5 códigos con mayores variaciones.
              </p>
            )}
          </div>
        ) : (
          /* Normal distribution mode */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {listToRender.slice(0, 5).map((m, index) => {
              const pct = totalOccurrences > 0 ? (m.afterCount / totalOccurrences) * 100 : 0
              const color = m.severity.toUpperCase() === 'ERROR' ? '#f87171' : m.severity.toUpperCase() === 'WARNING' ? '#fbbf24' : '#38bdf8'
              return (
                <div key={m.code + String(index)} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '80px', fontFamily: 'monospace', fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 600 }}>
                    {m.code}
                  </div>
                  <div style={{ flex: 1, height: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 0.6s ease-out' }} />
                  </div>
                  <div style={{ width: '80px', textAlign: 'right', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>
                    {m.afterCount} ({Math.round(pct)}%)
                  </div>
                </div>
              )
            })}
            {listToRender.length > 5 && (
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
              {listToRender.map((m, i) => {
                const isCrit = m.severity.toUpperCase() === 'ERROR'
                const isWarn = m.severity.toUpperCase() === 'WARNING'
                const isResolved = beforeIncidents && m.afterCount === 0 && m.beforeCount > 0
                const isNew = beforeIncidents && m.beforeCount === 0 && m.afterCount > 0
                const hasChanged = beforeIncidents && m.beforeCount !== m.afterCount

                return (
                  <tr key={m.code + String(i)} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', opacity: isResolved ? 0.5 : 1 }}>
                    <td style={{
                      padding: '14px 20px',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      color: isCrit ? '#f87171' : isWarn ? '#fbbf24' : '#f8fafc',
                      textDecoration: isResolved ? 'line-through' : 'none'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{m.code}</span>
                        {isResolved && (
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            background: 'rgba(52, 211, 153, 0.15)',
                            color: '#34d399',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            textDecoration: 'none',
                            display: 'inline-block'
                          }}>
                            RESUELTO
                          </span>
                        )}
                        {isNew && (
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#f87171',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            display: 'inline-block'
                          }}>
                            NUEVO
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', color: '#cbd5e1' }}>{m.classification}</td>
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
                        {m.severity}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', fontWeight: 600, color: '#f8fafc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{m.afterCount}</span>
                        {beforeIncidents && hasChanged && (
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: m.delta > 0 ? '#f87171' : '#34d399',
                            background: m.delta > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(52, 211, 153, 0.1)',
                            padding: '2px 6px',
                            borderRadius: '4px'
                          }}>
                            {m.delta > 0 ? `+${m.delta}` : m.delta}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', color: '#94a3b8', fontSize: '0.85rem' }}>
                      {m.last_event_time
                        ? formatDateTime(m.last_event_time)
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
      {updateDiff && (
        <Portal>
          <div
            className="log-modal-overlay animate-in fade-in"
            role="dialog"
            aria-modal="true"
            style={{ zIndex: 110000 }}
          >
            <div className="log-modal add-code-modal" style={{ maxWidth: '500px' }}>
              <div className="log-modal__header">
                <div className="log-modal__header-content">
                  <h2 className="log-modal__title">
                    Cambios en la Actualización
                  </h2>
                  <p className="log-modal__subtitle">
                    Resumen de variaciones detectadas en esta lectura de logs.
                  </p>
                </div>
                <button
                  type="button"
                  className="log-modal__close"
                  onClick={() => setUpdateDiff(null)}
                  aria-label="Cerrar"
                >
                  ×
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px 0' }}>
                {updateDiff.newCodes.length === 0 &&
                 updateDiff.resolvedCodes.length === 0 &&
                 updateDiff.occurrenceChanges.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0' }}>
                    <CheckCircle className="text-emerald-400" size={32} style={{ margin: '0 auto 12px' }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>Sin cambios en esta versión</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem' }}>No se registraron nuevas ocurrencias ni alertas de error.</p>
                  </div>
                ) : (
                  <>
                    {/* New Codes */}
                    {updateDiff.newCodes.length > 0 && (
                      <div style={{ background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.15)', padding: '16px', borderRadius: '12px' }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <AlertTriangle size={15} /> Códigos Nuevos Detectados ({updateDiff.newCodes.length})
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {updateDiff.newCodes.map(c => (
                            <span key={c} style={{ fontFamily: 'monospace', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Resolved Codes */}
                    {updateDiff.resolvedCodes.length > 0 && (
                      <div style={{ background: 'rgba(34, 197, 94, 0.06)', border: '1px solid rgba(34, 197, 94, 0.15)', padding: '16px', borderRadius: '12px' }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#22c55e', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle size={15} /> Códigos Resueltos / Desaparecidos ({updateDiff.resolvedCodes.length})
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {updateDiff.resolvedCodes.map(c => (
                            <span key={c} style={{ fontFamily: 'monospace', fontSize: '0.8rem', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Occurrence Changes */}
                    {updateDiff.occurrenceChanges.length > 0 && (
                      <div>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: '#e2e8f0', fontWeight: 700 }}>
                          Variación de Ocurrencias
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {updateDiff.occurrenceChanges.map(change => {
                            const isIncrease = change.delta > 0
                            return (
                              <div key={change.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#f8fafc' }}>{change.code}</span>
                                <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ color: '#64748b' }}>{change.before} → {change.after}</span>
                                  <span style={{
                                    fontWeight: 700,
                                    color: isIncrease ? '#f87171' : '#34d399',
                                    background: isIncrease ? 'rgba(239, 68, 68, 0.1)' : 'rgba(52, 211, 153, 0.1)',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem'
                                  }}>
                                    {isIncrease ? `+${change.delta}` : change.delta}
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="log-modal__actions" style={{ marginTop: '10px' }}>
                <button
                  type="button"
                  className="dashboard__btn dashboard__btn--primary"
                  onClick={() => setUpdateDiff(null)}
                  style={{ width: '100%' }}
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  )
}
