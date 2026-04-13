interface HelpModalProps {
  onClose: () => void
}

export function HelpModal({ onClose }: HelpModalProps) {
  return (
    <div
      className="log-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
    >
      <div className="log-modal help-modal">
        <div className="log-modal__header">
          <h2 id="help-modal-title" className="log-modal__title">
            ¿Cómo funciona HP Logs Analyzer?
          </h2>
          <button type="button" className="log-modal__close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <div className="help-modal__body">
          {/* FLUJO DE ANÁLISIS */}
          <section className="help-modal__section">
            <h3 className="help-modal__section-title">Flujo de análisis</h3>
            <ol className="help-modal__steps">
              <li>
                En el modal "Pegar logs HP", <strong>seleccioná el modelo de impresora</strong> del
                listado. Si el modelo no aparece, hacé click en{' '}
                <strong>"+ Cargar nuevo modelo (PDF)"</strong> y subí el PDF del Service Cost Data
                oficial de HP — los modelos y consumibles se extraen automáticamente con IA.
              </li>
              <li>
                <strong>Pegá el log</strong> en el área de texto y hacé click en{' '}
                <strong>"Analizar"</strong>.
              </li>
              <li>
                El backend parsea cada línea, agrupa los eventos por código formando incidentes, y
                los enriquece con el catálogo de códigos.
              </li>
              <li>
                Opcional: agregar un <strong>SDS Engineering Incident</strong> para hacer match
                contra los códigos del log.
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
                <span className="help-modal__kpi-label">Tasa de errores</span>
                <span className="help-modal__kpi-desc">
                  Frecuencia de errores en función de las páginas impresas:{' '}
                  <em>"1 error c/N pág."</em> Calculado como{' '}
                  <em>ERRORs ÷ (contador máx − contador mín)</em> del período. Muestra "—" si el
                  log no incluye datos de contador.
                </span>
              </div>
            </div>
          </section>

          {/* DIAGNÓSTICO CON IA */}
          <section className="help-modal__section">
            <h3 className="help-modal__section-title">Diagnóstico con IA</h3>
            <p className="help-modal__intro-text">
              Panel violeta colapsado por defecto, debajo de los KPIs. Al expandirlo, hacé click en{' '}
              <strong>"Generar análisis con IA"</strong> para que Claude Haiku procese los incidentes
              y devuelva un diagnóstico estructurado en tres secciones:{' '}
              <strong>DIAGNÓSTICO / ACCIÓN / PRIORIDAD</strong>.
            </p>
            <p className="help-modal__note">
              El diagnóstico considera correlaciones temporales entre eventos, causalidad probable y
              da una recomendación accionable. Colapsar el panel no resetea el diagnóstico ya
              generado.
            </p>
          </section>

          {/* SDS ENGINEERING INCIDENT */}
          <section className="help-modal__section">
            <h3 className="help-modal__section-title">SDS Engineering Incident</h3>
            <p className="help-modal__intro-text">
              Panel colapsado debajo del Diagnóstico con IA. Permite cargar manualmente un incidente
              SDS y hacer match contra los códigos del log.
            </p>
            <ul className="help-modal__list">
              <li>
                El match usa <code>event_context</code> como código primario y{' '}
                <code>more_info</code> como secundarios. Soporta sufijo <code>z</code> como comodín
                hex (ej. <code>53.B0.0z</code> coincide con <code>53.B0.01</code>,{' '}
                <code>53.B0.0A</code>, etc.).
              </li>
              <li>
                Si el SDS coincide con un código que indica reemplazo de consumible, se muestra una
                sección extra <strong>"Verificar cambio de consumible"</strong> con el part number,
                vida útil y contador actual.
              </li>
            </ul>
          </section>

          {/* ESTADO DE CONSUMIBLES */}
          <section className="help-modal__section">
            <h3 className="help-modal__section-title">Estado de consumibles</h3>
            <p className="help-modal__intro-text">
              Panel colapsado debajo del SDS. Aparece solo si el modelo cargado tiene consumibles
              (rollers, fusers, maintenance kits, etc.) con códigos del log asociados.
            </p>
            <p className="help-modal__note">
              <strong>Qué se muestra y qué no:</strong> se excluyen los tóners y los rodillos del
              ADF (Automatic Document Feeder) porque el contador de páginas impresas no refleja su
              desgaste real. Solo se incluyen componentes cuyo ciclo de vida está directamente
              vinculado al contador de la impresora.
            </p>
            <ul className="help-modal__list">
              <li>
                Tabla con: categoría, descripción, part number, vida útil estimada, contador actual,
                % de uso y estado.
              </li>
              <li>
                <strong>Verde "Sin alertas"</strong>: uso por debajo del 80% de la vida útil.
              </li>
              <li>
                <strong>Amarillo "Próximo a revisar"</strong>: uso entre 80% y 99%.
              </li>
              <li>
                <strong>Rojo "Revisar historial"</strong>: el contador supera el 100% de la vida
                útil documentada. Esto es un aviso para verificar en el historial del equipo cuándo
                fue el último reemplazo — no una orden de cambio inmediato.
              </li>
              <li>
                Los patrones de código soportan el comodín <code>z</code> (cualquier dígito hex):
                por ejemplo, <code>53.B0.0z</code> coincide con <code>53.B0.01</code>,{' '}
                <code>53.B0.0A</code>, etc.
              </li>
            </ul>
          </section>

          {/* FILTROS DE FECHA */}
          <section className="help-modal__section">
            <h3 className="help-modal__section-title">Filtros de fecha</h3>
            <p className="help-modal__intro-text">
              Botón único con calendario y presets en un popover. Todos los KPIs, gráficos y tablas
              respetan el filtro activo.
            </p>
            <div className="help-modal__filter-list">
              {[
                { label: 'Todo el período', desc: 'Sin filtro — todos los eventos del log.' },
                { label: 'Hoy', desc: 'Solo eventos del día actual.' },
                { label: 'Esta semana', desc: 'Lunes–domingo de la semana actual.' },
                { label: 'Semana anterior', desc: 'Lunes–domingo de la semana pasada.' },
                { label: 'Este mes', desc: 'Del primer al último día del mes actual.' },
                { label: 'Mes anterior', desc: 'Del primer al último día del mes pasado.' },
                { label: 'Últimos 7 días', desc: 'Ventana móvil de los últimos 7 días.' },
                { label: 'Últimos 30 días', desc: 'Ventana móvil de los últimos 30 días.' },
              ].map((f) => (
                <div key={f.label} className="help-modal__filter-row">
                  <code className="help-modal__filter-label">{f.label}</code>
                  <span className="help-modal__filter-desc">{f.desc}</span>
                </div>
              ))}
            </div>
            <p className="help-modal__note">
              Selección custom: hacé click en dos días del calendario para definir un rango libre,
              después "Aplicar". Cancelar o click afuera descarta la selección sin cambiar el filtro
              activo.
            </p>
          </section>

          {/* GRÁFICOS */}
          <section className="help-modal__section">
            <h3 className="help-modal__section-title">Gráficos</h3>
            <ul className="help-modal__list">
              <li>
                <strong>Volumen de incidencias:</strong> AreaChart por hora con toggles de
                severidad. El tooltip muestra los códigos de error específicos del bucket.
              </li>
              <li>
                <strong>Errores más frecuentes:</strong> BarChart con top 10 códigos. Toggles ERROR
                / WARNING / INFO (los 3 activos por default). Las barras se colorean según
                severidad.
              </li>
            </ul>
          </section>

          {/* TABLAS */}
          <section className="help-modal__section">
            <h3 className="help-modal__section-title">Tablas</h3>
            <ul className="help-modal__list">
              <li>
                <strong>Incidencias:</strong> agrupadas por código, con sort, búsqueda, filtro por
                severidad y expand de cada incidencia para ver sus eventos.
              </li>
              <li>
                <strong>Eventos del período:</strong> tabla colapsada por defecto con todos los
                eventos crudos del filtro activo, ordenable y con búsqueda.
              </li>
            </ul>
          </section>

          {/* CATÁLOGO DE CÓDIGOS */}
          <section className="help-modal__section">
            <h3 className="help-modal__section-title">Catálogo de códigos de error</h3>
            <ul className="help-modal__list">
              <li>
                Hacé click en cualquier <strong>código subrayado</strong> en la tabla de incidentes
                o en "Editar" para agregar o modificar la descripción, severidad y URL de solución.
              </li>
              <li>
                Cuando agregás un link, el backend descarga y guarda el contenido HTML — así podés
                verlo aunque el link de HP expire.
              </li>
              <li>
                Si el análisis detecta <strong>códigos nuevos</strong> (no están en el catálogo),
                aparece una sección para agregarlos uno a uno o ignorarlos.
              </li>
            </ul>
          </section>

          {/* INCIDENTES GUARDADOS */}
          <section className="help-modal__section">
            <h3 className="help-modal__section-title">Incidentes guardados</h3>
            <ul className="help-modal__list">
              <li>
                El botón <strong>"Guardar incidente"</strong> en el header guarda un snapshot del
                análisis actual con nombre y equipment identifier opcional. Útil como línea base.
              </li>
              <li>
                <strong>"Incidentes guardados"</strong> muestra la lista, permite re-abrirlos y
                compararlos contra logs nuevos para ver tendencia:{' '}
                <em>mejoró / estable / empeoró</em>.
              </li>
              <li>
                Si un equipo tiene 3 o más snapshots se genera un gráfico de línea con la evolución
                de errores y advertencias a lo largo del tiempo.
              </li>
            </ul>
          </section>

          {/* EXPORTAR PDF */}
          <section className="help-modal__section">
            <h3 className="help-modal__section-title">Exportar PDF</h3>
            <p className="help-modal__intro-text">
              El botón <strong>"Exportar PDF"</strong> en el header genera un PDF A4 con el
              Diagnóstico IA (si fue generado), KPIs, gráfico de errores frecuentes y tabla de
              incidencias.
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
