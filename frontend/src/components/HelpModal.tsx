interface HelpModalProps {
  onClose: () => void
}

interface RuleRow {
  level: 'error' | 'warning' | 'success'
  icon: string
  name: string
  description: string
}

const DIAGNOSTIC_RULES: RuleRow[] = [
  {
    level: 'error',
    icon: '🔴',
    name: 'Problema dominante',
    description:
      'Un único código ERROR concentra más del 50 % de todos los eventos de error. Indica una falla recurrente y específica.',
  },
  {
    level: 'error',
    icon: '📈',
    name: 'Escalamiento',
    description:
      'La segunda mitad del período tiene más del doble de eventos ERROR que la primera mitad. El problema está creciendo en el tiempo.',
  },
  {
    level: 'warning',
    icon: '⚡',
    name: 'Ráfaga',
    description:
      '5 o más eventos del mismo código ocurren dentro de una ventana de 30 minutos. Sugiere un evento puntual o un loop de error.',
  },
  {
    level: 'warning',
    icon: '💾',
    name: 'Firmware',
    description:
      'Algún evento tiene una descripción de catálogo que menciona "firmware". Puede requerir actualización del firmware de la impresora.',
  },
  {
    level: 'warning',
    icon: '🗂️',
    name: 'Múltiples bandejas',
    description:
      '2 o más códigos ERROR distintos tienen "tray" o "bandeja" en su descripción. Indica fallas en el sistema de alimentación de papel.',
  },
  {
    level: 'success',
    icon: '🟢',
    name: 'Saludable',
    description:
      'Ninguna de las reglas anteriores se disparó. El log no presenta patrones de alerta.',
  },
]

const RECOMMENDATION_ROWS = [
  {
    icon: '🔴',
    condition: 'Dominante + Ráfaga + Escalamiento activos',
    result: 'Visita técnica recomendada',
  },
  {
    icon: '🟡',
    condition: 'Hay alertas pero no se cumple la condición anterior',
    result: 'Monitorear — revisar en 48 hs',
  },
  {
    icon: '🟢',
    condition: 'Solo alerta Saludable',
    result: 'Sin acción necesaria',
  },
]

const levelColor: Record<RuleRow['level'], string> = {
  error: '#ef4444',
  warning: '#f59e0b',
  success: '#4ade80',
}

export function HelpModal({ onClose }: HelpModalProps) {
  return (
    <div
      className="log-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
    >
      <div className="log-modal help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="log-modal__header">
          <h2 id="help-modal-title" className="log-modal__title">
            ¿Cómo funciona HP Logs Analyzer?
          </h2>
          <button type="button" className="log-modal__close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <div className="help-modal__body">
          {/* FLUJO GENERAL */}
          <section className="help-modal__section">
            <h3 className="help-modal__section-title">Flujo de análisis</h3>
            <ol className="help-modal__steps">
              <li>
                <strong>Pegás o cargás</strong> el log de la impresora HP (formato TSV exportado
                desde el portal HP o copiado al portapapeles).
              </li>
              <li>
                El backend <strong>parsea</strong> cada línea: extrae tipo, código, timestamp,
                contador y firmware. Acepta fechas en español (ene, feb, mar…).
              </li>
              <li>
                Los eventos se <strong>agrupan por código</strong> formando incidentes. Cada
                incidente hereda la severidad máxima de sus eventos.
              </li>
              <li>
                La app consulta el <strong>catálogo de códigos</strong> para enriquecer cada evento
                con descripción y link de solución SDS.
              </li>
              <li>
                Se muestran <strong>KPIs, gráficos y tablas</strong> con filtros de fecha, búsqueda
                y sort por columna.
              </li>
            </ol>
          </section>

          {/* KPIs */}
          <section className="help-modal__section">
            <h3 className="help-modal__section-title">Panel de KPIs</h3>
            <div className="help-modal__kpi-grid">
              <div className="help-modal__kpi-item">
                <span className="help-modal__kpi-label">Estado de errores</span>
                <span className="help-modal__kpi-desc">
                  Conteo de incidentes ERROR · WARNING · INFO dentro del filtro de fecha activo.
                </span>
              </div>
              <div className="help-modal__kpi-item">
                <span className="help-modal__kpi-label">Incidencias Activas</span>
                <span className="help-modal__kpi-desc">
                  Total de incidentes (grupos de código) en el período filtrado.
                </span>
              </div>
              <div className="help-modal__kpi-item">
                <span className="help-modal__kpi-label">Último error crítico</span>
                <span className="help-modal__kpi-desc">
                  Código y timestamp del evento ERROR más reciente dentro del filtro activo.
                </span>
              </div>
              <div className="help-modal__kpi-item">
                <span className="help-modal__kpi-label">Eventos Registrados</span>
                <span className="help-modal__kpi-desc">
                  Total de eventos individuales en el período filtrado.
                </span>
              </div>
            </div>
          </section>

          {/* DIAGNÓSTICO AUTOMÁTICO */}
          <section className="help-modal__section">
            <h3 className="help-modal__section-title">Diagnóstico automático</h3>
            <p className="help-modal__intro-text">
              El panel de diagnóstico aplica 6 reglas sobre los eventos del período filtrado. No usa
              la red — todo el cálculo ocurre en el frontend.
            </p>
            <div className="help-modal__rules">
              {DIAGNOSTIC_RULES.map((rule) => (
                <div key={rule.name} className="help-modal__rule-row">
                  <span className="help-modal__rule-icon">{rule.icon}</span>
                  <div className="help-modal__rule-body">
                    <span
                      className="help-modal__rule-name"
                      style={{ color: levelColor[rule.level] }}
                    >
                      {rule.name}
                    </span>
                    <span className="help-modal__rule-desc">{rule.description}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="help-modal__intro-text" style={{ marginTop: 12 }}>
              La sección <strong>"¿Qué hacer?"</strong> combina las alertas activas para dar una
              recomendación:
            </p>
            <div className="help-modal__rec-table">
              {RECOMMENDATION_ROWS.map((r) => (
                <div key={r.icon} className="help-modal__rec-row">
                  <span className="help-modal__rec-icon">{r.icon}</span>
                  <span className="help-modal__rec-condition">{r.condition}</span>
                  <span className="help-modal__rec-result">→ {r.result}</span>
                </div>
              ))}
            </div>
          </section>

          {/* FILTROS DE FECHA */}
          <section className="help-modal__section">
            <h3 className="help-modal__section-title">Filtros de fecha</h3>
            <div className="help-modal__filter-list">
              {[
                { label: 'Todo', desc: 'Sin filtro — todos los eventos del log.' },
                { label: 'Esta semana', desc: 'Lunes–domingo de la semana actual.' },
                { label: 'Semana anterior', desc: 'Lunes–domingo de la semana pasada.' },
                {
                  label: 'Elegir semana',
                  desc: 'Abre un picker de semana. Muestra el rango seleccionado (ej. "3–9 mar").',
                },
                {
                  label: '📅 Día específico',
                  desc: 'Abre un picker de fecha. Filtra exactamente ese día.',
                },
              ].map((f) => (
                <div key={f.label} className="help-modal__filter-row">
                  <code className="help-modal__filter-label">{f.label}</code>
                  <span className="help-modal__filter-desc">{f.desc}</span>
                </div>
              ))}
            </div>
            <p className="help-modal__note">
              Todos los KPIs, gráficos, diagnóstico y tablas respetan el filtro de fecha activo.
            </p>
          </section>

          {/* CATÁLOGO DE CÓDIGOS */}
          <section className="help-modal__section">
            <h3 className="help-modal__section-title">Catálogo de códigos</h3>
            <p className="help-modal__intro-text">
              Cada código puede tener <strong>descripción</strong>, <strong>severidad</strong> y un{' '}
              <strong>link de solución SDS</strong>. Cuando agregás un link, el backend descarga y
              guarda el contenido de la página — así podés verlo aunque el link HP expire.
            </p>
            <ul className="help-modal__list">
              <li>
                Hacé click en cualquier <strong>código subrayado</strong> en la tabla de incidentes
                para editar su entrada en el catálogo.
              </li>
              <li>
                Si el análisis detecta <strong>códigos nuevos</strong> (no están en el catálogo),
                aparece una sección para agregarlos uno a uno o ignorarlos.
              </li>
              <li>
                El botón <strong>"Ver solución"</strong> en la tabla de incidentes abre el contenido
                guardado sin necesidad de acceder a internet.
              </li>
            </ul>
          </section>

          {/* INCIDENTES GUARDADOS */}
          <section className="help-modal__section">
            <h3 className="help-modal__section-title">Incidentes guardados y comparación</h3>
            <ul className="help-modal__list">
              <li>
                <strong>Guardar incidente</strong> — guarda un snapshot del análisis actual (nombre
                + equipo opcional). Útil como línea base.
              </li>
              <li>
                <strong>Comparar</strong> — desde el detalle de un snapshot guardado, pegás un log
                nuevo y la app determina si el estado <em>mejoró</em>, está <em>estable</em> o{' '}
                <em>empeoró</em> respecto al baseline.
              </li>
              <li>
                <strong>Evolución por equipo</strong> — en la lista de guardados, si un equipo tiene
                3 o más snapshots se genera un gráfico de línea con la evolución de errores y
                advertencias a lo largo del tiempo.
              </li>
            </ul>
          </section>

          {/* FORMATO DE LOG */}
          <section className="help-modal__section">
            <h3 className="help-modal__section-title">Formato de log esperado</h3>
            <pre className="help-modal__code-block">
              {`Tipo      Código     Fecha       Hora      Contador  Firmware
Error     53.B0.02   14-mar-2024 10:30:45  12345     v5.3.0
Warning   10.00.02   14-mar-2024 10:31:12  12346     v5.3.0`}
            </pre>
            <p className="help-modal__note">
              El parser acepta tabs o espacios múltiples como separador, fechas con meses en español
              y una línea de encabezado opcional.
            </p>
          </section>
        </div>

        <div className="log-modal__actions">
          <button
            type="button"
            className="dashboard__btn dashboard__btn--primary"
            onClick={onClose}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}
