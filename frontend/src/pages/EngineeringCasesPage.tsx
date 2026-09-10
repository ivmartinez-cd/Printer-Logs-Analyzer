import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import {
  getEngineeringCases,
  getEngineeringCaseDetail,
  analyzeEngineeringCases,
  syncEngineeringCases,
} from '../services/api'
import { useToast } from '../contexts/ToastContext'
import { LoadingState } from '../components/ui/Spinner'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { EngineeringCaseAIPanel } from '../components/Engineering/EngineeringCaseAIPanel'
import { sortCases, groupByDevice, isAnalysisStale, relativeDays, buildKpis } from '../components/Engineering/utils'
import { useEngineeringJobStore } from '../store/useEngineeringJobStore'
import type { EngineeringCase, EngineeringCaseDetailResponse, EngineeringCaseAnalysis } from '../types/api'

const IA_BADGE_CLASS: Record<string, string> = {
  pendiente: 'eng-ia-badge eng-ia-badge--pendiente',
  analizando: 'eng-ia-badge eng-ia-badge--analizando',
  accionar: 'eng-ia-badge eng-ia-badge--accionar',
  monitorear: 'eng-ia-badge eng-ia-badge--monitorear',
  descartar: 'eng-ia-badge eng-ia-badge--descartar',
}

const IA_BADGE_LABEL: Record<string, string> = {
  pendiente: 'Sin analizar',
  analizando: 'Analizando…',
  accionar: 'Accionar',
  monitorear: 'Monitorear',
  descartar: 'Descartar',
}

const GRAVEDAD_CLASS: Record<string, string> = {
  High: 'eng-badge eng-badge--high',
  Medium: 'eng-badge eng-badge--medium',
}

function plazoClass(plazo: number | null): string {
  if (plazo === null) return 'eng-plazo eng-plazo--sin-dato'
  if (plazo <= 7) return 'eng-plazo eng-plazo--vencido'
  if (plazo <= 30) return 'eng-plazo eng-plazo--urgente'
  return 'eng-plazo eng-plazo--normal'
}

export function EngineeringCasesPage() {
  const toast = useToast()
  const [cases, setCases] = useState<EngineeringCase[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [details, setDetails] = useState<Record<string, EngineeringCaseDetailResponse>>({})
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null)

  const [analyzing, setAnalyzing] = useState<Set<string>>(new Set())
  const [analysisErrors, setAnalysisErrors] = useState<Record<string, string>>({})

  const [gravedadFilter, setGravedadFilter] = useState<string>('')
  const [iaFilter, setIaFilter] = useState<string>('')
  const [soloMultiples, setSoloMultiples] = useState(false)
  const [search, setSearch] = useState('')

  const [confirmBatch, setConfirmBatch] = useState<{ soloSinAnalizar: boolean } | null>(null)

  const job = useEngineeringJobStore()

  const loadCases = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true)
      try {
        const items = await getEngineeringCases({ state: ['New', 'Open', 'Postponed'] }, signal)
        setCases(items)
      } catch (e) {
        toast.showError(e instanceof Error ? e.message : 'Error al cargar los casos de ingeniería')
        setCases([])
      } finally {
        setLoading(false)
      }
    },
    [toast]
  )

  useEffect(() => {
    const controller = new AbortController()
    loadCases(controller.signal)
    return () => controller.abort()
  }, [loadCases])

  // El job de lote vive en un store global (sobrevive a navegar fuera de esta
  // pantalla); acá solo mostramos el toast y recargamos cuando termina.
  useEffect(() => {
    if (job.status !== 'completed' && job.status !== 'failed') return
    if (job.acknowledged) return

    if (job.status === 'completed' && job.lastResult) {
      const r = job.lastResult
      toast.showSuccess(
        `Lote completado: ${r.analyzed} analizados (${r.veredictos.accionar ?? 0} accionar, ` +
          `${r.veredictos.monitorear ?? 0} monitorear, ${r.veredictos.descartar ?? 0} descartar)` +
          (r.errors ? ` · ${r.errors} error(es)` : '') +
          ` · USD ${r.cost_usd.toFixed(2)}`
      )
      loadCases()
    } else {
      toast.showError('El análisis en lote falló o no terminó a tiempo.')
    }
    job.acknowledgeResult()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.status, job.acknowledged])

  async function handleSync() {
    setSyncing(true)
    try {
      const result = await syncEngineeringCases()
      toast.showSuccess(`${result.fetched} casos en el portal (${result.new} nuevos, ${result.updated} actualizados)`)
      await loadCases()
    } catch (e) {
      toast.showError(e instanceof Error ? e.message : 'Error al sincronizar con el portal SDS')
    } finally {
      setSyncing(false)
    }
  }

  async function toggleExpand(c: EngineeringCase) {
    const key = c.incident_id
    if (expandedId === key) {
      setExpandedId(null)
      return
    }
    setExpandedId(key)
    if (details[key]) return
    setLoadingDetail(key)
    try {
      const detail = await getEngineeringCaseDetail(c.device_id, c.incident_id)
      setDetails((prev) => ({ ...prev, [key]: detail }))
    } catch (e) {
      toast.showError(e instanceof Error ? e.message : 'Error al cargar el detalle del caso')
    } finally {
      setLoadingDetail(null)
    }
  }

  async function handleAnalyzeOne(c: EngineeringCase) {
    setAnalyzing((prev) => new Set(prev).add(c.incident_id))
    setAnalysisErrors((prev) => {
      const next = { ...prev }
      delete next[c.incident_id]
      return next
    })
    try {
      await analyzeEngineeringCases({
        scope: 'selection',
        incidents: [{ device_id: c.device_id, incident_id: c.incident_id }],
        force: true,
      })
      toast.showSuccess(`Análisis de ${c.codigo} completado`)
      const detail = await getEngineeringCaseDetail(c.device_id, c.incident_id, true)
      setDetails((prev) => ({ ...prev, [c.incident_id]: detail }))
      await loadCases()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al analizar el caso'
      setAnalysisErrors((prev) => ({ ...prev, [c.incident_id]: msg }))
      toast.showError(msg)
    } finally {
      setAnalyzing((prev) => {
        const next = new Set(prev)
        next.delete(c.incident_id)
        return next
      })
    }
  }

  async function handleStartBatch(soloSinAnalizar: boolean) {
    setConfirmBatch(null)
    try {
      await job.startBatch({
        scope: soloSinAnalizar ? 'new' : 'open',
        force: !soloSinAnalizar,
      })
      toast.showSuccess('Análisis en lote iniciado — podés navegar a otra pantalla, te avisamos al terminar.')
    } catch (e) {
      toast.showError(e instanceof Error ? e.message : 'Error al iniciar el análisis en lote')
    }
  }

  const siblingsByDevice = useMemo(() => groupByDevice(cases), [cases])

  const filtered = useMemo(() => {
    let result = cases
    if (gravedadFilter) result = result.filter((c) => c.gravedad === gravedadFilter)
    if (soloMultiples) result = result.filter((c) => (siblingsByDevice.get(c.device_id)?.length ?? 0) > 1)
    if (iaFilter === 'pendiente') result = result.filter((c) => !c.analisis)
    else if (iaFilter === 'desactualizado') result = result.filter((c) => isAnalysisStale(c))
    else if (iaFilter) result = result.filter((c) => c.analisis?.veredicto === iaFilter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(
        (c) =>
          c.serial.toLowerCase().includes(q) ||
          c.incident_id.includes(q) ||
          (c.customer ?? '').toLowerCase().includes(q) ||
          c.codigo.toLowerCase().includes(q)
      )
    }
    return sortCases(result)
  }, [cases, gravedadFilter, soloMultiples, iaFilter, search, siblingsByDevice])

  const kpis = useMemo(() => buildKpis(cases), [cases])

  function iaKeyFor(c: EngineeringCase): string {
    if (analyzing.has(c.incident_id)) return 'analizando'
    if (!c.analisis) return 'pendiente'
    return c.analisis.veredicto
  }

  return (
    <div className="eng-page animate-in" style={{ padding: '0 40px 40px' }}>
      <header className="dashboard__subheader">
        <div className="dashboard__subheader-title-group">
          <h2 className="dashboard__subheader-title">Casos de Ingeniería</h2>
          <p className="dashboard__subheader-meta eng-page-meta">
            {cases.length} casos abiertos · {siblingsByDevice.size} equipos
          </p>
        </div>
        <div className="dashboard__subheader-actions">
          <button
            className="dashboard__btn dashboard__btn--secondary dashboard__btn--small"
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing ? 'Sincronizando...' : '↻ Sincronizar con SDS'}
          </button>
          <button
            className="dashboard__btn dashboard__btn--primary dashboard__btn--small"
            onClick={() => setConfirmBatch({ soloSinAnalizar: true })}
            disabled={job.status === 'running'}
          >
            {job.status === 'running'
              ? `Analizando... ${job.processed}/${job.total}`
              : 'Analizar casos nuevos'}
          </button>
        </div>
      </header>

      {job.status === 'running' && (
        <div className="eng-batch-banner eng-batch-banner--running">
          <div className="sync-inline-progress">
            <div className="sync-inline-bar">
              <div
                className="sync-inline-fill"
                style={{ width: `${job.total ? (job.processed / job.total) * 100 : 0}%` }}
              />
            </div>
            <span className="sync-inline-text">
              Analizando equipos: {job.processed}/{job.total}
              {job.errors > 0 && ` · ${job.errors} error(es)`}
            </span>
          </div>
        </div>
      )}

      <div className="mnt-kpi-grid">
        <button type="button" className="eng-kpi-filter" onClick={() => setGravedadFilter('')}>
          <div className="mnt-kpi-card mnt-kpi-card--critical">
            <span className="mnt-kpi-value">{kpis.vencenEstaSemana}</span>
            <span className="mnt-kpi-label">Vencen esta semana</span>
            <span className="mnt-kpi-sublabel">plazo ≤ 7 días</span>
          </div>
        </button>
        <button type="button" className="eng-kpi-filter" onClick={() => setSoloMultiples((v) => !v)}>
          <div
            className={
              soloMultiples
                ? 'mnt-kpi-card mnt-kpi-card--warning is-active'
                : 'mnt-kpi-card mnt-kpi-card--warning'
            }
          >
            <span className="mnt-kpi-value">{kpis.equiposConVarios}</span>
            <span className="mnt-kpi-label">Equipos con varios casos</span>
            <span className="mnt-kpi-sublabel">riesgo de doble visita</span>
          </div>
        </button>
        <button
          type="button"
          className="eng-kpi-filter"
          onClick={() => setIaFilter((v) => (v === 'pendiente' ? '' : 'pendiente'))}
        >
          <div
            className={
              iaFilter === 'pendiente'
                ? 'mnt-kpi-card mnt-kpi-card--incident is-active'
                : 'mnt-kpi-card mnt-kpi-card--incident'
            }
          >
            <span className="mnt-kpi-value">{kpis.sinAnalisisVigente}</span>
            <span className="mnt-kpi-label">Sin análisis vigente</span>
            <span className="mnt-kpi-sublabel">cola de análisis IA</span>
          </div>
        </button>
        <button
          type="button"
          className="eng-kpi-filter"
          onClick={() => setIaFilter((v) => (v === 'descartar' ? '' : 'descartar'))}
        >
          <div
            className={
              iaFilter === 'descartar'
                ? 'mnt-kpi-card mnt-kpi-card--ok is-active'
                : 'mnt-kpi-card mnt-kpi-card--ok'
            }
          >
            <span className="mnt-kpi-value">{kpis.descartables}</span>
            <span className="mnt-kpi-label">Descartables</span>
            <span className="mnt-kpi-sublabel">listos para cerrar en HP</span>
          </div>
        </button>
      </div>

      <div className="table-toolbar">
        <select value={gravedadFilter} onChange={(e) => setGravedadFilter(e.target.value)}>
          <option value="">Gravedad: todas</option>
          <option value="High">Alta</option>
          <option value="Medium">Media</option>
        </select>
        <select value={iaFilter} onChange={(e) => setIaFilter(e.target.value)}>
          <option value="">IA: todos</option>
          <option value="pendiente">Sin analizar</option>
          <option value="desactualizado">Desactualizado</option>
          <option value="accionar">Accionar</option>
          <option value="monitorear">Monitorear</option>
          <option value="descartar">Descartar</option>
        </select>
        <input
          type="search"
          placeholder="Buscar por serial, cliente o código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="eng-visible-count">
          Mostrando {filtered.length} de {cases.length}
        </span>
      </div>

      {loading ? (
        <LoadingState text="Cargando casos de ingeniería..." />
      ) : filtered.length === 0 ? (
        <div className="eng-empty">
          <span className="eng-empty-icon">✓</span>
          <p className="eng-empty-text">No hay casos que coincidan con los filtros.</p>
        </div>
      ) : (
        <div className="eng-table-wrapper">
          <table className="eng-table">
            <thead>
              <tr>
                <th />
                <th>Cliente</th>
                <th>Equipo</th>
                <th>Caso</th>
                <th>Plazo</th>
                <th>Antigüedad</th>
                <th>IA</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const siblings = siblingsByDevice.get(c.device_id) ?? []
                const iaKey = iaKeyFor(c)
                const detail = details[c.incident_id]
                const isExpanded = expandedId === c.incident_id
                return (
                  <Fragment key={c.incident_id}>
                    <tr
                      className={isExpanded ? 'eng-row is-expanded' : 'eng-row'}
                      onClick={() => toggleExpand(c)}
                    >
                      <td className="eng-cell-expand">
                        <span className="eng-expand-btn">{isExpanded ? '▾' : '▸'}</span>
                      </td>
                      <td className="eng-cell--cliente" data-label="Cliente">
                        <div className="eng-primary">{c.customer ?? '—'}</div>
                        <div className="eng-sublabel">{c.monitor ?? ''}</div>
                      </td>
                      <td className="eng-cell--equipo" data-label="Equipo">
                        <div className="eng-primary eng-serial">{c.serial}</div>
                        <div className="eng-sublabel">{c.model ?? ''}</div>
                        {siblings.length > 1 && (
                          <span
                            className="eng-multi-badge"
                            title={`Este equipo tiene ${siblings.length} casos abiertos — coordinar una sola visita`}
                          >
                            {siblings.length} casos
                          </span>
                        )}
                      </td>
                      <td className="eng-cell--caso" data-label="Caso">
                        <span className={GRAVEDAD_CLASS[c.gravedad ?? ''] ?? 'eng-badge'}>
                          {c.gravedad ?? '—'}
                        </span>
                        <div className="eng-primary">{c.codigo}</div>
                        {c.probabilidad !== null && (
                          <span className="eng-probabilidad">{c.probabilidad}%</span>
                        )}
                      </td>
                      <td className="eng-cell--plazo" data-label="Plazo">
                        <span className={plazoClass(c.plazo_dias)}>
                          {c.plazo_dias !== null ? `${c.plazo_dias} d` : '—'}
                        </span>
                      </td>
                      <td className="eng-cell--antiguedad" data-label="Antigüedad">
                        {relativeDays(c.creado)}
                      </td>
                      <td className="eng-cell--ia" data-label="IA">
                        <span className={IA_BADGE_CLASS[iaKey] ?? 'eng-ia-badge'}>
                          {IA_BADGE_LABEL[iaKey] ?? iaKey}
                        </span>
                        {isAnalysisStale(c) && (
                          <span className="eng-ia-stale" title="El caso cambió después del análisis" />
                        )}
                        {c.analisis?.analizado_en && (
                          <div className="eng-ia-age">{relativeDays(c.analisis.analizado_en)}</div>
                        )}
                      </td>
                      <td className="eng-cell--acciones" data-label="Acciones">
                        <button
                          type="button"
                          className="dashboard__btn dashboard__btn--secondary dashboard__btn--small"
                          disabled={analyzing.has(c.incident_id)}
                          onClick={(e) => {
                            e.stopPropagation()
                            void handleAnalyzeOne(c)
                          }}
                        >
                          {analyzing.has(c.incident_id) ? 'Analizando...' : 'Analizar'}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="eng-detail-row">
                        <td colSpan={8}>
                          <div className="eng-detail">
                            {loadingDetail === c.incident_id ? (
                              <LoadingState text="Cargando detalle del caso..." />
                            ) : (
                              <div className="eng-detail-grid">
                                <div className="eng-detail-main">
                                  <div className="eng-detail-section">
                                    <h4 className="eng-detail-title">Descripción de HP</h4>
                                    <p className="eng-detail-text">
                                      {detail?.detail.description ?? 'Sin descripción disponible.'}
                                    </p>
                                  </div>
                                  {detail && detail.detail.parts.length > 0 && (
                                    <div className="eng-detail-section">
                                      <h4 className="eng-detail-title">Piezas sugeridas por HP</h4>
                                      <ul className="eng-parts-list">
                                        {detail.detail.parts.map((p) => (
                                          <li key={p.pn} className="eng-part">
                                            <span className="eng-part-pn">{p.pn}</span>
                                            <span className="eng-part-desc">{p.description}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {detail && detail.detail.state_history.length > 0 && (
                                    <div className="eng-detail-section">
                                      <h4 className="eng-detail-title">Historial de estados</h4>
                                      <div className="eng-history">
                                        {detail.detail.state_history.map((h, idx) => (
                                          <div key={idx} className="eng-history-row">
                                            <span className="eng-history-date">{h.date}</span>
                                            <span>{h.state}</span>
                                            <span className="eng-history-user">{h.user ?? ''}</span>
                                            <span className="eng-history-comment">{h.comment ?? ''}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {siblings.length > 1 && (
                                    <div className="eng-detail-section eng-siblings">
                                      <h4 className="eng-detail-title">Otros casos de este equipo</h4>
                                      <div>
                                        {siblings
                                          .filter((s) => s.incident_id !== c.incident_id)
                                          .map((s) => (
                                            <button
                                              key={s.incident_id}
                                              type="button"
                                              className="eng-sibling-chip"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                void toggleExpand(s)
                                              }}
                                            >
                                              {s.codigo}
                                            </button>
                                          ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="eng-detail-aside">
                                  <EngineeringCaseAIPanel
                                    analysis={
                                      (detail?.latest_analysis as EngineeringCaseAnalysis | null) ?? null
                                    }
                                    loading={analyzing.has(c.incident_id)}
                                    error={analysisErrors[c.incident_id] ?? null}
                                    onGenerate={() => void handleAnalyzeOne(c)}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {confirmBatch && (
        <ConfirmModal
          title="Analizar casos con IA"
          message={
            confirmBatch.soloSinAnalizar
              ? 'Se van a analizar los casos nuevos sin análisis vigente. Puede tardar varios minutos — podés navegar a otra pantalla, te avisamos al terminar.'
              : 'Se van a re-analizar TODOS los casos abiertos, incluso los ya analizados. Esto tiene costo adicional. ¿Continuar?'
          }
          confirmLabel="Analizar"
          onConfirm={() => handleStartBatch(confirmBatch.soloSinAnalizar)}
          onCancel={() => setConfirmBatch(null)}
        />
      )}
    </div>
  )
}
