import { useState, useMemo, useEffect } from 'react'
import { previewLogs, validateLogs, getConfig, updateConfig } from '../services/api'
import type { ParseLogsResponse, ValidateLogsResponse, GlobalRule } from '../types/api'
import type { Event, Incident } from '../types/api'
import { AppShell } from '../components/layout/AppShell'
import { AnalyzeToolbar } from '../components/toolbar/AnalyzeToolbar'
import type { SeverityFilter } from '../components/toolbar/AnalyzeToolbar'
import { IncidentTable } from '../components/IncidentTable'
import { NewRuleModal } from '../components/NewRuleModal'
import Toast from '../components/Toast'
import { KPIBar } from '../components/KPIBar'
import { EventTimeline } from '../components/EventTimeline'

function matchesSeverity(incident: Incident, severity: SeverityFilter): boolean {
  if (severity === 'ALL') return true
  return incident.severity === severity
}

function matchesSearch(incident: Incident, search: string): boolean {
  const q = search.trim().toLowerCase()
  if (!q) return true
  if (incident.code.toLowerCase().includes(q)) return true
  if (incident.classification.toLowerCase().includes(q)) return true
  const inEvents = incident.events.some((evt) => evt.type.toLowerCase().includes(q))
  if (inEvents) return true
  return false
}

export function MainPage() {
  const [logs, setLogs] = useState('')
  const [selectedModelId, setSelectedModelId] = useState('')
  const [modelOptions, setModelOptions] = useState<string[]>(['default'])
  const [validationResult, setValidationResult] = useState<ValidateLogsResponse | null>(null)
  const [validating, setValidating] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ParseLogsResponse | null>(null)

  const [searchValue, setSearchValue] = useState('')
  const [severityValue, setSeverityValue] = useState<SeverityFilter>('ALL')

  const [eventsForNewCodes, setEventsForNewCodes] = useState<Event[] | null>(null)
  const [modalData, setModalData] = useState<{ code: string; eventType?: string; helpText?: string; initialRule?: GlobalRule } | null>(null)
  const [configForEdit, setConfigForEdit] = useState<Awaited<ReturnType<typeof getConfig>> | null>(null)
  const [savingRule, setSavingRule] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    getConfig()
      .then((res) => {
        const keys = Object.keys(res.config.models || {})
        setModelOptions(keys.length > 0 ? keys : ['default'])
      })
      .catch(() => setModelOptions(['default']))
  }, [])

  useEffect(() => {
    if (validationResult?.codes_new?.length && logs.trim()) {
      previewLogs(logs)
        .then((res) => setEventsForNewCodes(res.events))
        .catch(() => setEventsForNewCodes(null))
    } else {
      setEventsForNewCodes(null)
    }
  }, [validationResult?.codes_new?.length, logs])

  const canValidate = Boolean(logs.trim() && selectedModelId && !validating)
  const canAnalyze = Boolean(
    logs.trim() &&
      selectedModelId &&
      validationResult &&
      validationResult.codes_new.length === 0 &&
      !loading
  )
  const hasNewCodes = validationResult && validationResult.codes_new.length > 0

  const filteredIncidents = useMemo(() => {
    if (!result) return []
    return result.incidents.filter(
      (inc) => matchesSearch(inc, searchValue) && matchesSeverity(inc, severityValue)
    )
  }, [result, searchValue, severityValue])

  function handleLogsChange(value: string) {
    setLogs(value)
    setValidationResult(null)
    setResult(null)
  }

  function handleModelChange(value: string) {
    setSelectedModelId(value)
    setValidationResult(null)
  }

  async function handleValidate() {
    if (!canValidate) return
    setError(null)
    setValidationResult(null)
    setValidating(true)
    try {
      const data = await validateLogs(logs)
      setValidationResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setValidating(false)
    }
  }

  async function handleAnalyze() {
    if (!canAnalyze) return
    setError(null)
    setResult(null)
    setLoading(true)
    try {
      const data = await previewLogs(logs)
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  async function openAddRuleModal(code: string) {
    setError(null)
    let events = eventsForNewCodes
    if (!events && validationResult?.codes_new?.length && logs.trim()) {
      try {
        const res = await previewLogs(logs)
        events = res.events
        setEventsForNewCodes(events)
      } catch {
        setEventsForNewCodes(null)
      }
    }
    const event = events?.find((e) => e.code === code)
    setModalData({
      code,
      eventType: event?.type,
      helpText: event?.help_reference ?? undefined,
    })
    try {
      const config = await getConfig()
      setConfigForEdit(config)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setModalData(null)
    }
  }

  function closeModal() {
    setModalData(null)
    setConfigForEdit(null)
  }

  async function openEditRuleModal(code: string) {
    setError(null)
    try {
      const config = await getConfig()
      setConfigForEdit(config)
      const rule = config.config.global_rules.find((r) => r.code === code)
      if (!rule) {
        setError(`No se encontró regla para el código ${code}`)
        return
      }
      const evt = result?.events?.find((e) => e.code === code)
      setModalData({
        code,
        eventType: evt?.type,
        helpText: evt?.help_reference ?? undefined,
        initialRule: rule,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  async function handleSaveRule(rule: GlobalRule) {
    if (!configForEdit || savingRule) return
    setError(null)
    setSavingRule(true)
    try {
      const rules = configForEdit.config.global_rules.filter((r) => r.code !== rule.code)
      const nextConfig = {
        ...configForEdit.config,
        global_rules: [...rules, rule],
      }
      await updateConfig(nextConfig)
      const result = await validateLogs(logs)
      setValidationResult(result)
      setToast('Regla guardada correctamente')
      setTimeout(() => setToast(null), 2000)
      closeModal()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSavingRule(false)
    }
  }

  const resultsCount = filteredIncidents.length

  return (
    <AppShell>
      {toast && <Toast message={toast} />}
      <div className={`main-dashboard ${result ? 'main-dashboard--with-result' : ''}`}>
        <header className="dashboard-header">
          <h1 className="dashboard-header__title">Análisis de logs</h1>
          <p className="dashboard-header__subtitle">Pegá logs TSV, validá y analizá incidentes</p>
        </header>

        <section className="dashboard-input">
          <textarea
            value={logs}
            onChange={(e) => handleLogsChange(e.target.value)}
            placeholder="Pegá aquí los logs (TSV con TAB)..."
            rows={10}
            disabled={loading}
            aria-label="Logs a analizar"
            className="dashboard-input__textarea"
          />
          <div className="dashboard-input__row">
            <label htmlFor="model-select" className="dashboard-input__label">Modelo</label>
            <select
              id="model-select"
              value={selectedModelId}
              onChange={(e) => handleModelChange(e.target.value)}
              className="dashboard-input__select"
              aria-label="Seleccionar modelo"
            >
              <option value="">— Seleccionar —</option>
              {modelOptions.map((id) => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
          </div>
          <div className="dashboard-input__actions">
            <button
              type="button"
              onClick={handleValidate}
              disabled={!canValidate}
              className="dashboard-input__btn"
            >
              {validating ? 'Validando…' : 'Validar'}
            </button>
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className="dashboard-input__btn dashboard-input__btn--primary"
            >
              {loading ? 'Analizando…' : 'Analizar'}
            </button>
          </div>
          {error && <div className="dashboard-input__error">{error}</div>}
          {validationResult && (
            <div className="dashboard-input__validation">
              <p><strong>Total líneas:</strong> {validationResult.total_lines}</p>
              <p><strong>Códigos detectados:</strong> {validationResult.codes_detected.join(', ') || '—'}</p>
              {hasNewCodes && (
                <div className="validation-warning">
                  <p><strong>Hay {validationResult.codes_new.length} código(s) sin regla.</strong> Completá una regla para cada uno antes de analizar.</p>
                  <ul className="validation-warning__codes">
                    {validationResult.codes_new.map((c) => (
                      <li key={c}>
                        <span>{c}</span>
                        <button type="button" onClick={() => openAddRuleModal(c)} className="validation-warning__btn">
                          Agregar regla
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>

        {result && (
          <>
            <section className="dashboard-kpis">
              <KPIBar incidents={result.incidents} events={result.events} globalSeverity={result.global_severity} />
            </section>
            <section className="dashboard-timeline">
              <EventTimeline events={result.events} />
            </section>
            <section className="dashboard-toolbar">
              <AnalyzeToolbar
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                severityValue={severityValue}
                onSeverityChange={setSeverityValue}
                resultsCount={resultsCount}
              />
            </section>
            <section className="dashboard-table">
              <IncidentTable
                incidents={filteredIncidents}
                searchValue={searchValue}
                onEditRule={openEditRuleModal}
              />
            </section>
          </>
        )}
      </div>

      {modalData && (
        <NewRuleModal
          code={modalData.code}
          eventType={modalData.eventType}
          helpText={modalData.helpText}
          initialRule={modalData.initialRule}
          onSave={handleSaveRule}
          onClose={closeModal}
          saving={savingRule}
        />
      )}
    </AppShell>
  )
}
