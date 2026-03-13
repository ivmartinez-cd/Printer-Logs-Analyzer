import { useState, useEffect, useMemo } from 'react';
import { getConfig, validateLogs, previewLogs, updateConfig } from '../services/api';
import type { ParseLogsResponse, ValidateLogsResponse, GlobalRule } from '../types/api';
import type { Event, Incident } from '../types/api';
import type { SeverityFilter } from '../components/toolbar/AnalyzeToolbar';
import { MainLayout } from '../layout/MainLayout';
import { DashboardGrid } from '../layout/DashboardGrid';
import { HeaderBar } from '../sections/HeaderBar';
import { LogInputSection } from '../sections/LogInputSection';
import { KPIsRow } from '../sections/KPIsRow';
import { TimelineSection } from '../sections/TimelineSection';
import { TableToolbar } from '../sections/TableToolbar';
import { EventsTable } from '../sections/EventsTable';
import { NewRuleModal } from '../components/NewRuleModal';
import Toast from '../components/Toast';

export function DashboardPage() {
  const [logs, setLogs] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('');
  const [modelOptions, setModelOptions] = useState<string[]>(['default']);
  const [validationResult, setValidationResult] = useState<ValidateLogsResponse | null>(null);
  const [validating, setValidating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ParseLogsResponse | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [severityValue, setSeverityValue] = useState<SeverityFilter>('ALL');
  const [eventsForNewCodes, setEventsForNewCodes] = useState<Event[] | null>(null);
  const [modalData, setModalData] = useState<{
    code: string;
    eventType?: string;
    helpText?: string;
    initialRule?: GlobalRule;
  } | null>(null);
  const [configForEdit, setConfigForEdit] = useState<Awaited<ReturnType<typeof getConfig>> | null>(null);
  const [savingRule, setSavingRule] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    getConfig()
      .then((res) => {
        const keys = Object.keys(res.config.models || {});
        setModelOptions(keys.length > 0 ? keys : ['default']);
      })
      .catch(() => setModelOptions(['default']));
  }, []);

  useEffect(() => {
    if (validationResult?.codes_new?.length && logs.trim()) {
      previewLogs(logs)
        .then((res) => setEventsForNewCodes(res.events))
        .catch(() => setEventsForNewCodes(null));
    } else {
      setEventsForNewCodes(null);
    }
  }, [validationResult?.codes_new?.length, logs]);

  const canValidate = Boolean(logs.trim() && selectedModelId && !validating);
  const canAnalyze = Boolean(
    logs.trim() &&
      selectedModelId &&
      validationResult &&
      validationResult.codes_new.length === 0 &&
      !loading
  );

  const filteredIncidents = useMemo(() => {
    if (!result) return [];
    const q = searchValue.trim().toLowerCase();
    const severity = severityValue;
    return result.incidents.filter((inc) => {
      if (severity !== 'ALL' && inc.severity !== severity) return false;
      if (!q) return true;
      if (inc.code.toLowerCase().includes(q)) return true;
      if (inc.classification.toLowerCase().includes(q)) return true;
      if (inc.events.some((evt) => evt.type.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [result, searchValue, severityValue]);

  function handleLogsChange(value: string) {
    setLogs(value);
    setValidationResult(null);
    setResult(null);
  }

  function handleModelChange(value: string) {
    setSelectedModelId(value);
    setValidationResult(null);
  }

  async function handleValidate() {
    if (!canValidate) return;
    setError(null);
    setValidationResult(null);
    setValidating(true);
    try {
      const data = await validateLogs(logs);
      setValidationResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setValidating(false);
    }
  }

  async function handleAnalyze() {
    if (!canAnalyze) return;
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const data = await previewLogs(logs);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function openAddRuleModal(code: string) {
    setError(null);
    let events = eventsForNewCodes;
    if (!events && validationResult?.codes_new?.length && logs.trim()) {
      try {
        const res = await previewLogs(logs);
        events = res.events;
        setEventsForNewCodes(events);
      } catch {
        setEventsForNewCodes(null);
      }
    }
    const event = events?.find((e) => e.code === code);
    setModalData({
      code,
      eventType: event?.type,
      helpText: event?.help_reference ?? undefined,
    });
    try {
      const config = await getConfig();
      setConfigForEdit(config);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setModalData(null);
    }
  }

  function closeModal() {
    setModalData(null);
    setConfigForEdit(null);
  }

  async function openEditRuleModal(code: string) {
    setError(null);
    try {
      const config = await getConfig();
      setConfigForEdit(config);
      const rule = config.config.global_rules.find((r) => r.code === code);
      if (!rule) {
        setError(`No se encontró regla para el código ${code}`);
        return;
      }
      const evt = result?.events?.find((e) => e.code === code);
      setModalData({
        code,
        eventType: evt?.type,
        helpText: evt?.help_reference ?? undefined,
        initialRule: rule,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleSaveRule(rule: GlobalRule) {
    if (!configForEdit || savingRule) return;
    setError(null);
    setSavingRule(true);
    try {
      const rules = configForEdit.config.global_rules.filter((r) => r.code !== rule.code);
      const nextConfig = {
        ...configForEdit.config,
        global_rules: [...rules, rule],
      };
      await updateConfig(nextConfig);
      const validation = await validateLogs(logs);
      setValidationResult(validation);
      setToast('Regla guardada correctamente');
      setTimeout(() => setToast(null), 2000);
      closeModal();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingRule(false);
    }
  }

  return (
    <MainLayout>
      {toast && <Toast message={toast} />}
      <DashboardGrid>
        <HeaderBar />
        <LogInputSection
          logs={logs}
          onLogsChange={handleLogsChange}
          selectedModelId={selectedModelId}
          onModelChange={handleModelChange}
          modelOptions={modelOptions}
          validating={validating}
          loading={loading}
          canValidate={canValidate}
          canAnalyze={canAnalyze}
          onValidate={handleValidate}
          onAnalyze={handleAnalyze}
          error={error}
          validationResult={validationResult}
          onAddRule={openAddRuleModal}
        />
        <KPIsRow result={result} />
        <TimelineSection result={result} />
        <TableToolbar
          result={result}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          severityValue={severityValue}
          onSeverityChange={setSeverityValue}
          resultsCount={filteredIncidents.length}
        />
        <EventsTable
          result={result}
          incidents={filteredIncidents}
          searchValue={searchValue}
          onEditRule={openEditRuleModal}
        />
      </DashboardGrid>
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
    </MainLayout>
  );
}
