import type { ValidateLogsResponse } from '../types/api';

export type LogInputSectionProps = {
  logs: string;
  onLogsChange: (value: string) => void;
  selectedModelId: string;
  onModelChange: (value: string) => void;
  modelOptions: string[];
  validating: boolean;
  loading: boolean;
  canValidate: boolean;
  canAnalyze: boolean;
  onValidate: () => void;
  onAnalyze: () => void;
  error: string | null;
  validationResult: ValidateLogsResponse | null;
  onAddRule: (code: string) => void;
};

export function LogInputSection({
  logs,
  onLogsChange,
  selectedModelId,
  onModelChange,
  modelOptions,
  validating,
  loading,
  canValidate,
  canAnalyze,
  onValidate,
  onAnalyze,
  error,
  validationResult,
  onAddRule,
}: LogInputSectionProps) {
  const hasNewCodes = validationResult && validationResult.codes_new.length > 0;

  return (
    <section className="main-dashboard__section dashboard-input">
      <textarea
        value={logs}
        onChange={(e) => onLogsChange(e.target.value)}
        placeholder="Pegá aquí los logs (TSV con TAB)..."
        rows={10}
        disabled={loading}
        aria-label="Logs a analizar"
        className="dashboard-input__textarea"
      />
      <div className="dashboard-input__row">
        <label htmlFor="model-select" className="dashboard-input__label">
          Modelo
        </label>
        <select
          id="model-select"
          value={selectedModelId}
          onChange={(e) => onModelChange(e.target.value)}
          className="dashboard-input__select"
          aria-label="Seleccionar modelo"
        >
          <option value="">— Seleccionar —</option>
          {modelOptions.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </div>
      <div className="dashboard-input__actions">
        <button
          type="button"
          onClick={onValidate}
          disabled={!canValidate}
          className="dashboard-input__btn"
        >
          {validating ? 'Validando…' : 'Validar'}
        </button>
        <button
          type="button"
          onClick={onAnalyze}
          disabled={!canAnalyze}
          className="dashboard-input__btn dashboard-input__btn--primary"
        >
          {loading ? 'Analizando…' : 'Analizar'}
        </button>
      </div>
      {error && <div className="dashboard-input__error">{error}</div>}
      {validationResult && (
        <div className="dashboard-input__validation">
          <p>
            <strong>Total líneas:</strong> {validationResult.total_lines}
          </p>
          <p>
            <strong>Códigos detectados:</strong>{' '}
            {validationResult.codes_detected.join(', ') || '—'}
          </p>
          {hasNewCodes && (
            <div className="validation-warning">
              <p>
                <strong>
                  Hay {validationResult.codes_new.length} código(s) sin regla.
                </strong>{' '}
                Completá una regla para cada uno antes de analizar.
              </p>
              <ul className="validation-warning__codes">
                {validationResult.codes_new.map((c) => (
                  <li key={c}>
                    <span>{c}</span>
                    <button
                      type="button"
                      onClick={() => onAddRule(c)}
                      className="validation-warning__btn"
                    >
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
  );
}
