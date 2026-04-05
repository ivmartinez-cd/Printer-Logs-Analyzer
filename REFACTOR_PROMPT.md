Prompt: Refactor de DashboardPage.tsx — extracción de componentes presentacionales

Contexto
Soy el desarrollador de HP Logs Analyzer. El proyecto ya pasó por varias rondas de refactor:

Los hooks useAnalysis, useModals, useExportPdf y useDateFilter ya están extraídos y funcionando.
Hay 35 tests de frontend (vitest) y 49 de backend (pytest) que deben seguir pasando.
Linting con ESLint flat config, Prettier y tsc --noEmit están configurados.
El backend ya está modularizado (auth y content_fetcher en archivos separados).

Lo que queda pendiente: frontend/src/pages/DashboardPage.tsx tiene ~1160 líneas y mezcla orquestación con mucho JSX y lógica de presentación. La tarea es extraer los componentes visuales a archivos separados, sin cambiar comportamiento, en 5 commits independientes.
Leé el CLAUDE.md del proyecto antes de empezar para tener el contexto completo de decisiones técnicas y bugs resueltos que NO debés repetir.

Principios guía — leer antes de escribir código

Un paso = un commit independiente. Cada commit debe compilar, pasar lint, typecheck, todos los tests y no cambiar comportamiento visible.
No cambies comportamiento, solo movés código. Nada de "ya que estoy, agrego tal feature" ni "aprovecho y arreglo esto otro". Eso después.
TypeScript strict tiene que seguir pasando. Si algo no tipa después de mover, entendé por qué — no castees con any.
No rompas los bugs ya resueltos. Revisá la sección "Bugs resueltos — no repetir" del CLAUDE.md. En particular:

La key estable ${evt.code}-${evt.timestamp} en la tabla de eventos.
La actualización de inc.sds_link e inc.sds_solution_content a nivel incidente en handleSaveCodeToCatalog.
Los useMemo con dependencias correctas (no los rompas al mover cálculos).
El import dinámico de jsPDF y html2canvas en useExportPdf (no los pases a import estático sin querer).


Después de cada commit, corré obligatoriamente:

bash   npm run lint
   npm run typecheck
   npm run test:frontend
   cd frontend && npm run build
Los 4 deben pasar. Si alguno falla, NO pases al siguiente paso — arreglalo primero o revertí el commit.
6. No uses git push. Solo commits locales. Yo decido cuándo pushear.
7. Usá mensajes de commit claros en español: refactor(dashboard): extraer KpiCards a componente propio.

Plan de refactor — 5 pasos en orden
Paso 1 — KpiCards.tsx 🟢 Riesgo bajo
Objetivo: Extraer los 4 KPI cards (Estado de errores, Incidencias Activas, Último error crítico, Eventos Registrados) a frontend/src/components/KpiCards.tsx.
Props:
typescriptinterface KpiCardsProps {
  filteredEvents: EnrichedEvent[];
  filteredIncidents: Incident[];
  lastErrorEvent: EnrichedEvent | null;
}
Qué hacer:

Crear frontend/src/components/KpiCards.tsx con la sección .kpis completa.
Mover las clases CSS necesarias si están en DashboardPage específicas — si están en index.css global, dejarlas ahí.
En DashboardPage.tsx, reemplazar el bloque por <KpiCards filteredEvents={...} filteredIncidents={...} lastErrorEvent={...} />.
El ref kpisRef usado por useExportPdf debe seguir funcionando — pasalo como prop si es necesario (ver paso 5), o por ahora envolvé el componente con un <div ref={kpisRef}> desde afuera.

Verificación manual: Pegar un log → ver que los 4 cards muestren los mismos números que antes con distintos filtros de fecha.
Commit: refactor(dashboard): extraer KpiCards a componente propio

Paso 2 — VolumeChart.tsx y TopCodesChart.tsx 🟢 Riesgo bajo
Objetivo: Extraer los dos gráficos a componentes separados en frontend/src/components/.
Por qué separados: TopCodesChart necesita forwardRef para que useExportPdf pueda capturarlo con html2canvas. VolumeChart no necesita ref.
Props:
typescriptinterface VolumeChartProps {
  volumeData: VolumePoint[];      // usar el tipo ya existente
  title: string;                   // ej. "Eventos por hora" o "3 mar – 9 mar"
}

interface TopCodesChartProps {
  topCodes: TopCodeRow[];          // usar el tipo ya existente
}
// TopCodesChart se exporta con React.forwardRef<HTMLDivElement, TopCodesChartProps>
Qué hacer:

Crear ambos archivos.
Mover los imports de recharts (AreaChart, BarChart, XAxis, etc.) — chequear que el chunk vendor-charts en vite.config.ts siga funcionando después del build.
TopCodesChart se exporta con forwardRef para que el ref del PDF se siga aplicando.
En DashboardPage, reemplazar los bloques: <VolumeChart volumeData={volumeData} title={...} /> y <TopCodesChart ref={barChartRef} topCodes={topCodes} />.

Verificación manual:

Los dos gráficos se ven idénticos a antes.
Filtro de fecha cambia el VolumeChart correctamente (respeta el título con rango).
Exportar PDF funciona y el BarChart aparece en el PDF.
npm run build genera el chunk vendor-charts separado (no lo inline).

Commit: refactor(dashboard): extraer VolumeChart y TopCodesChart

Paso 3 — IncidentsTable.tsx 🟡 Riesgo medio
Objetivo: Extraer la tabla de incidentes completa a frontend/src/components/IncidentsTable.tsx.
Qué incluye:

Filtros por severidad (ERROR/WARNING/INFO).
Búsqueda por texto.
Sort por columna (asc/desc).
Expansión de fila para ver detalle.
Botón "Código" (columna) que abre el modal de edición del catálogo.
Botón "Ver solución" (nivel fila).
"ver más / ver menos" para mensajes >80 chars (con estado expandedMsgs: Set<string>).

Props:
typescriptinterface IncidentsTableProps {
  incidents: Incident[];                              // ya filtrados por fecha desde afuera
  onEditCode: (code: string) => void;                 // abre AddCodeToCatalogModal
  onViewSolution: (incident: Incident) => void;       // abre SolutionContentModal
}
// Exportar con forwardRef<HTMLDivElement, IncidentsTableProps> para el ref de PDF export
Estado interno del componente (NO subirlo a DashboardPage):

severityFilter
searchText
sortColumn, sortDirection
expandedRows: Set<string>
expandedMsgs: Set<string>

Cuidado con:

NO romper la key ${inc.id}-${idx}-msg para expandedMsgs.
NO romper el flujo del botón "Código" → onEditCode(inc.code) → setEditCodeInitial en DashboardPage → abrir modal.
NO romper el ref del tableRef usado por useExportPdf.

Verificación manual:

Filtrar por ERROR/WARNING/INFO funciona.
Buscar funciona.
Sort asc/desc funciona.
Expandir fila muestra detalle.
Click en código abre modal de edición del catálogo.
Click en "Ver solución" abre el modal con contenido.
Mensajes >80 chars muestran "ver más" y expanden correctamente.
PDF export incluye la tabla.

Commit: refactor(dashboard): extraer IncidentsTable a componente propio

Paso 4 — EventsTable.tsx 🟡 Riesgo medio
Objetivo: Extraer la tabla "Eventos del período" a frontend/src/components/EventsTable.tsx.
Props:
typescriptinterface EventsTableProps {
  events: EnrichedEvent[];  // ya filtrados por fecha desde afuera
}
Estado interno (dentro del componente):

Toggle de colapsar/expandir (inicia en false — expandido por defecto, bug resuelto).
Filtros y sort.

Cuidado con:

El título es "Eventos del período", NO "Últimos errores registrados" (bug resuelto).
La key DEBE ser ${evt.code}-${evt.timestamp}, NO el índice (bug resuelto — causaba reconciliación mala de React).
El state eventsTableCollapsed arranca en useState(false) (expandido).

Verificación manual:

Tabla aparece expandida por defecto.
Toggle colapsar/expandir funciona.
Filtrar eventos funciona y no hay glitches visuales (si aparecen, es bug de keys).
Título dice "Eventos del período".

Commit: refactor(dashboard): extraer EventsTable a componente propio

Paso 5 — DashboardHeader.tsx 🟢 Riesgo bajo
Objetivo: Extraer el header del dashboard a frontend/src/components/DashboardHeader.tsx.
Qué incluye:

Ícono SVG de impresora + título "HP Logs Analyzer".
logFileName a la derecha del título (si existe).
<LiveClock /> (NO duplicar en subheader — bug resuelto).
<DbStatusBadge />.
Botones de acción: "Incidentes guardados", "Analizar otro log", "Guardar incidente", "Exportar PDF" (este último solo si hay result activo).

Props:
typescriptinterface DashboardHeaderProps {
  logFileName: string | null;
  healthStatus: HealthStatus | null;
  hasResult: boolean;                // controla visibilidad del botón "Exportar PDF"
  exporting: boolean;                // estado del useExportPdf
  onOpenSavedList: () => void;
  onAnalyzeNew: () => void;
  onSaveIncident: () => void;
  onExportPdf: () => void;
}
Cuidado con:

El <LiveClock> NO debe aparecer en el subheader de filtros (bug resuelto — reloj duplicado).
El botón "Exportar PDF" solo aparece cuando hasResult === true.
Los botones del header tienen padding: 10px 20px y font-size: 0.875rem uniformes (documentado en CLAUDE.md).

Verificación manual:

Header se ve idéntico a antes en las vistas dashboard, saved-list y saved-detail.
Reloj aparece una sola vez (no duplicado).
Botón "Exportar PDF" aparece/desaparece según haya resultado o no.
DbStatusBadge sigue mostrando 🟢/🔴 correctamente.

Commit: refactor(dashboard): extraer DashboardHeader a componente propio

Estructura final esperada
Después de los 5 pasos, DashboardPage.tsx debería quedar en ~350-450 líneas con algo parecido a:
tsxexport function DashboardPage(props: DashboardPageProps) {
  const analysis = useAnalysis();
  const modals = useModals();
  const dateFilter = useDateFilter();
  const exportPdf = useExportPdf({ logFileName: analysis.logFileName });

  const filteredEvents = useMemo(
    () => filterEventsByDate(analysis.result?.events ?? [], dateFilter.activeFilter),
    [analysis.result, dateFilter.activeFilter]
  );
  const filteredIncidents = useMemo(...);
  const lastErrorEvent = useMemo(...);
  const volumeData = useMemo(() => bucketEventsByHour(filteredEvents), [filteredEvents]);
  const topCodes = useMemo(() => getTopIncidentsForChart(filteredIncidents), [filteredIncidents]);

  // viewMode switch: dashboard | saved-list | saved-detail
  if (viewMode === 'saved-list') return <SavedAnalysisList ... />;
  if (viewMode === 'saved-detail') return <SavedAnalysisDetail ... />;

  return (
    <div className="dashboard">
      <DashboardHeader
        logFileName={analysis.logFileName}
        healthStatus={props.healthStatus}
        hasResult={!!analysis.result}
        exporting={exportPdf.exporting}
        onOpenSavedList={() => setViewMode('saved-list')}
        onAnalyzeNew={analysis.clearResult}
        onSaveIncident={modals.openSaveIncident}
        onExportPdf={exportPdf.exportPdf}
      />

      <DateFilterBar {...dateFilter} />

      <div ref={exportPdf.kpisRef}>
        <KpiCards
          filteredEvents={filteredEvents}
          filteredIncidents={filteredIncidents}
          lastErrorEvent={lastErrorEvent}
        />
      </div>

      <div ref={exportPdf.diagnosticRef}>
        <DiagnosticPanel events={filteredEvents} />
      </div>

      <VolumeChart volumeData={volumeData} title={...} />
      <TopCodesChart ref={exportPdf.barChartRef} topCodes={topCodes} />

      <IncidentsTable
        ref={exportPdf.incidentsTableRef}
        incidents={filteredIncidents}
        onEditCode={(code) => modals.openEditCode(code)}
        onViewSolution={(inc) => modals.openSolutionContent(inc)}
      />

      <EventsTable events={filteredEvents} />

      {/* Modales (siguen acá porque viven en el árbol del dashboard) */}
      {modals.logPasteOpen && <LogPasteModal ... />}
      {modals.sdsModalOpen && <SDSIncidentModal ... />}
      {/* ... resto de modales */}
    </div>
  );
}

Checklist final — después del paso 5
Antes de declarar el refactor terminado, verificá:

 npm run lint pasa sin warnings ni errores.
 npm run typecheck pasa.
 npm run test:frontend pasa los 35 tests.
 npm run test:backend pasa los 49 tests (no deberían haberse tocado, pero confirmá).
 cd frontend && npm run build genera el bundle sin errores y mantiene los chunks vendor-react y vendor-charts separados.
 DashboardPage.tsx tiene menos de 500 líneas.
 Flujo end-to-end manual funcionando:

Abrir la app → bienvenida con badge de DB.
Pegar log → análisis → modal SDS → commit → dashboard.
Filtrar por fecha (todo / semana / día).
Click en código de incidente → modal de edición → guardar → botón "Ver solución" actualizado sin recargar.
Expandir fila de incidente → ver mensaje completo con "ver más".
Exportar PDF → descarga correctamente con todas las secciones.
Ir a "Incidentes guardados" → abrir uno → comparar con log nuevo → ver tendencia.


 5 commits en el log de git, uno por cada paso, con mensajes en español.
 Actualizar CLAUDE.md si alguna descripción de componente quedó desactualizada.


Si algo falla

Si un test se rompe: probablemente moviste algo que el test importaba de DashboardPage. Los tests de useDateFilter y SDS matching no deberían tocarse, pero si aparecen imports rotos, revertí y reintentá.
Si el build de Vite falla: suele ser por un import no usado o un tipo opcional mal. Leé el error completo, no lo ignores.
Si hay un comportamiento visual roto: revisá que hayas copiado TODAS las clases CSS del JSX original. Las clases largas como .dashboard__kpi--error son fáciles de olvidar.
Si te trabás en un paso: revertí el commit de ese paso (git reset --hard HEAD~1) y preguntame antes de forzar nada.


Importante

NO cambies la lógica de los hooks existentes (useAnalysis, useModals, useExportPdf, useDateFilter). Si necesitás algo nuevo de ellos, preguntame antes.
NO agregues nuevas features. Esto es refactor puro.
NO toques el backend.
NO toques los tests existentes (salvo que se rompa un import y haya que actualizarlo).
NO hagas git push.

Arrancá leyendo CLAUDE.md y después empezá por el Paso 1.