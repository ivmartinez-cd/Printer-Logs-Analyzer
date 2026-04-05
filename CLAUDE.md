# CLAUDE.md

Guidance for Claude Code when working in this repository.

---

## Commands

### Development

```bash
# Matar procesos Python colgados ANTES de arrancar (Windows crítico)
taskkill /F /IM python.exe

# Arrancar frontend + backend juntos
npm run dev

# Por separado
npm run dev:frontend     # Vite en puerto 5173 (5174 si 5173 está ocupado)
npm run dev:backend      # Uvicorn en 0.0.0.0:8000 (mata procesos viejos automáticamente)
```

`npm run dev:backend` ya incluye `taskkill` antes de arrancar uvicorn. Aun así, si el servidor responde con código viejo después de un cambio, matar manualmente y reiniciar.

### Frontend

```bash
cd frontend
npm run build    # TypeScript compile + Vite build → dist/
npm run preview  # Preview del build de producción
```

### Backend (manual)

```bash
cd backend
uvicorn interface.api:app --reload --reload-dir . --host 0.0.0.0
```

`--reload-dir .` es necesario en Windows para que hot-reload funcione correctamente.

### Lint, tests y typecheck

```bash
# Desde la raíz
npm run lint           # ESLint en frontend/src
npm run typecheck      # tsc --noEmit en frontend
npm run format         # Prettier --write src (frontend)
npm run test:frontend  # vitest run (35 tests)
npm run test:backend   # pytest backend/tests/ -v (49 tests)
```

---

## Arquitectura

Monorepo: React/TypeScript frontend + Python/FastAPI backend, conectados por REST.

```
Printer-Logs-Analyzer/
├── .editorconfig                 # Indent, charset, EOL para todos los editores
├── .env                          # Variables de entorno (DB_URL, API_KEY) — gitignored
├── .gitignore
├── package.json                  # Scripts root (dev, lint, typecheck, test:*)
├── docs/                         # Documentación del producto
│   ├── ESTADO-ACTUAL.md          # Descripción del estado actual de la app
│   ├── vision.md                 # Visión y roadmap del producto
│   └── powershell-execution-policy.md  # Guía para dev en Windows
├── samples/                      # Archivos de ejemplo para desarrollo/testing
│   ├── hp_log.txt                # Log real de HP para probar el parser
│   └── request.json              # Body JSON de ejemplo para la API
├── backend/
│   ├── main.py                   # Entrypoint uvicorn para correr localmente
│   ├── requirements.txt
│   ├── interface/
│   │   ├── api.py                # FastAPI app, todos los endpoints
│   │   └── auth.py               # Dependencia de autenticación por API key
│   ├── domain/
│   │   └── entities.py           # Pydantic models (Event, EnrichedEvent, Incident, AnalysisResult)
│   ├── application/
│   │   ├── parsers/log_parser.py         # Parser TSV/espacios con soporte español
│   │   └── services/
│   │       ├── analysis_service.py       # Agrupa eventos por código → Incident
│   │       └── compare_service.py        # Compara dos snapshots → tendencia
│   ├── infrastructure/
│   │   ├── config.py                     # Settings desde .env (Pydantic) — solo DB_URL y API_KEY
│   │   ├── content_fetcher.py            # validate_ssrf_url + fetch_solution_content (async)
│   │   ├── database.py                   # psycopg2, timeout 5s, DatabaseUnavailableError
│   │   ├── fallback/error_codes_seed.json  # Catálogo bundled (read-only)
│   │   └── repositories/
│   │       ├── error_code_repository.py      # CRUD error_codes (DB + JSON fallback)
│   │       └── saved_analysis_repository.py  # CRUD saved_analyses (DB + JSON fallback)
│   ├── scripts/
│   │   └── run_parser.py         # CLI helper para testear el parser localmente
│   ├── tests/                    # pytest — 49 tests (parser, services, repos fallback)
│   ├── migrations/               # 5 migraciones SQL (correr manualmente)
│   └── data/                     # Gitignored — JSON local en modo fallback
└── frontend/
    ├── .npmrc                    # legacy-peer-deps=true (ESLint peer dep compat)
    ├── .prettierrc               # Prettier: singleQuote, semi:false, printWidth 100
    ├── .prettierignore           # Excluye dist/, node_modules/, *.tsbuildinfo, vite-env.d.ts
    ├── eslint.config.js          # ESLint flat config (JS + TypeScript + react-hooks + eslint-config-prettier)
    ├── vite.config.ts            # Vite: plugin react, manualChunks
    ├── vitest.config.ts          # Vitest: environment node, tests en src/__tests__/
    ├── src/
    │   ├── pages/DashboardPage.tsx   # UI principal (~1160 líneas)
    │   ├── components/               # Modales, paneles, tablas y gráficos
    │   ├── hooks/
    │   │   ├── useDateFilter.ts      # Estado de filtro de fecha + helpers puros
    │   │   ├── useAnalysis.ts        # Estado y handlers de análisis (handleAnalyze, etc.)
    │   │   ├── useModals.ts          # Estado centralizado de los 11 modales
    │   │   └── useExportPdf.ts       # Lógica de exportar PDF + refs de secciones DOM
    │   ├── services/api.ts           # Cliente HTTP typed, inyecta x-api-key
    │   ├── types/api.ts              # Interfaces TS que espejean los modelos Pydantic
    │   └── contexts/ToastContext.tsx # Notificaciones globales
    ├── src/__tests__/            # vitest — 35 tests (useDateFilter, SDS matching)
    └── package.json              # React 18.3, Recharts 2.13, Vite 5.4, jsPDF 4.2, html2canvas 1.4, Prettier 3.8
```

---

## Backend

### Domain models (`domain/entities.py`)

Todos los modelos son Pydantic con `model_config = {"frozen": True}`.

**Event:** campos del log crudo
- `type`: `ERROR | WARNING | INFO`
- `code`: string (ej. `53.B0.02`)
- `timestamp`: datetime
- `counter`: int
- `firmware`: str | None
- `help_reference`: str | None

**EnrichedEvent(Event):** extiende `Event` con datos del catálogo
- `code_severity`, `code_description`, `code_solution_url`, `code_solution_content`
- Producido por `_enrich_events_with_catalog` en `api.py` antes del análisis
- Es el tipo que circula dentro de `Incident.events` y en toda la capa de aplicación

**Incident:**
- `id`: `"{code}-{start_time.isoformat()}"`
- `code`, `classification` (del catálogo o el código), `severity`, `severity_weight`
- `occurrences`, `start_time`, `end_time`, `counter_range`, `events: List[EnrichedEvent]`
- `sds_link`: primer `code_solution_url` del grupo de eventos
- `sds_solution_content`: primer `code_solution_content` del grupo (misma fuente)

**AnalysisResult:** `incidents`, `global_severity`, `created_at`, `metadata`

### Parser (`application/parsers/log_parser.py`)

**Formato de entrada:** TSV o espacios múltiples (el portal HP copia tabs como espacios).

```
type  code      date       time      counter  firmware  help_reference
Error 53.B0.02  14-mar-2024 10:30:45 12345   v5.3.0   Some help text
```

**Decisiones de implementación:**
- Normaliza espacios múltiples → tabs antes de parsear (crítico para logs copiados del portal HP)
- Acepta meses en español (`ene, feb, mar, abr, may, jun, jul, ago, sep, oct, nov, dic`) — los convierte a inglés para `strptime`
- Acepta horas de 1 dígito (`9:30` → `09:30`)
- Primera línea con palabras clave (`tipo`, `code`, `fecha`) se ignora como header
- Tolerante a errores: registra líneas malformadas en `ParserError` sin detener el parse
- Retorna `ParserReport` con `events` y `errors`

**No existe caché de preview** — fue eliminado deliberadamente porque causaba que el servidor respondiera con código viejo tras hot-reload.

### Analysis service (`application/services/analysis_service.py`)

- Ordena eventos por timestamp
- Agrupa por código → un `Incident` por código
- Severity por incidente: máximo de sus eventos (ERROR > WARNING > INFO; weights 3/2/1)
- `sds_link` y `sds_solution_content`: tomados del primer evento que tenga `code_solution_url`
- `global_severity`: máximo de todos los eventos

### Compare service (`application/services/compare_service.py`)

Lógica de tendencia entre snapshot guardado y análisis nuevo:

- **Empeoró**: aparece código ERROR nuevo, o código ERROR existente subió ≥3 ocurrencias, o total ERRORs subió ≥20%
- **Mejoró**: desapareció al menos un ERROR, total ERRORs bajó, no hay ERRORs nuevos
- **Estable**: cualquier otro caso

### Módulos de infraestructura extraídos

**`interface/auth.py`** — dependencia FastAPI que valida el header `x-api-key`. Importada en `api.py` como `Depends(authenticate)`. Lanza HTTP 401 si falta o es incorrecta.

**`infrastructure/content_fetcher.py`** — dos funciones:
- `validate_ssrf_url(url)` — valida scheme `https`, hostname presente, IP no privada/reservada. Lanza HTTP 422 si falla.
- `async fetch_solution_content(url)` — fetcha con `httpx.AsyncClient`, extrae texto con BeautifulSoup, sanitiza con `bleach.clean`. Retorna `str | None`. Límite 50 KB.

### API endpoints (`interface/api.py`)

Todos excepto `/health` requieren header `x-api-key`. Sin key o key incorrecta → HTTP 401.

| Método | Ruta | Propósito |
|--------|------|-----------|
| GET | `/health` | Health probe; incluye `db_mode` (`postgres` \| `local_fallback`) y `db_available` |
| POST | `/parser/preview` | Parse + análisis + enriquecimiento desde catálogo |
| POST | `/parser/validate` | Valida formato, detecta códigos nuevos, no analiza |
| POST | `/error-codes/upsert` | Crear/actualizar código en catálogo; fetchea y guarda contenido HTML de la URL |
| POST | `/saved-analyses` | Guardar snapshot de análisis |
| GET | `/saved-analyses` | Listar snapshots |
| GET | `/saved-analyses/{id}` | Obtener snapshot completo |
| DELETE | `/saved-analyses/{id}` | Eliminar snapshot |
| POST | `/saved-analyses/{id}/compare` | Comparar logs nuevos contra snapshot guardado |

**CORS** — orígenes permitidos: `https://printer-logs-analyzer.vercel.app`, `localhost:5173`, `127.0.0.1:5173`, `localhost:5174`, `127.0.0.1:5174`.

**Fetch de contenido SDS** (`/error-codes/upsert`): cuando se provee `solution_url`, el backend fetchea el HTML de la página con `httpx.AsyncClient` de forma asíncrona (timeout 15 s, límite 50 KB), lo extrae con `BeautifulSoup`, y lo guarda en `solution_content`. El endpoint y la función son `async` para no bloquear el worker de uvicorn durante el fetch. Esto permite mostrar el contenido aunque el link HP expire.

**Límites:** logs hasta 2 millones de caracteres.

**Rate limiting** — implementado con `slowapi==0.1.9` (in-memory, por IP):
- `POST /parser/preview`: 60 requests/minuto por IP
- `POST /parser/validate`: 60 requests/minuto por IP
- `POST /error-codes/upsert`: 30 requests/minuto por IP
- Respuesta al superar el límite: HTTP 429 con mensaje estándar de slowapi
- `limiter = Limiter(key_func=get_remote_address)` a nivel de módulo; `app.state.limiter` + `RateLimitExceeded` handler registrados en `get_app()`

### DB fallback (offline / firewall corporativo)

Cuando PostgreSQL no está disponible, la app continúa funcionando:

- `Database` usa `psycopg2.pool.ThreadedConnectionPool` (min=1, max=5); el pool se crea de forma lazy en el primer `connect()`. Cada `connect()` obtiene una conexión del pool y la devuelve al salir (no cierra el TCP).
- `Database.connect()` lanza `DatabaseUnavailableError` si el pool no puede inicializarse, si `getconn()` falla por `OperationalError` o por pool exhausto (`PoolError`), o si la BD está caída (timeout 5 s)
- Ambos repositorios capturan la excepción y cambian a JSON local bajo `backend/data/`
- `error_codes`: lee de `infrastructure/fallback/error_codes_seed.json`; upserts escriben a `backend/data/error_codes_local.json`
- `saved_analyses`: CRUD completo contra `backend/data/saved_analyses_local.json`
- `GET /health` reporta `"db_mode": "local_fallback"` para detectar el estado

### Repositorios

**ErrorCodeRepository** — `ErrorCode` dataclass: `id, code, severity, description, solution_url, solution_content, created_at, updated_at`

**SavedAnalysisRepository** — `SavedAnalysisSnapshot` dataclass: `id (UUID), name, equipment_identifier, incidents (List[dict]), global_severity, created_at`

### Migraciones SQL (`backend/migrations/`)

Correr manualmente contra PostgreSQL. Ejecutadas en orden:

| Archivo | Contenido |
|---------|-----------|
| `001_init.sql` | `config_versions`, `audit_log`, `rules`, `rule_tags` (legacy, no usadas) |
| `002_add_rules_and_rule_tags.sql` | Continuación de 001 |
| `003_create_error_codes.sql` | Tabla `error_codes` con UNIQUE(code) |
| `004_create_saved_analyses.sql` | Tabla `saved_analyses` con JSONB para incidents |
| `005_add_solution_content.sql` | `ALTER TABLE error_codes ADD COLUMN solution_content TEXT` |

**Todas las 5 están ejecutadas en el entorno de producción (Neon).**

### Variables de entorno

**Backend (`.env` en raíz — solo para dev local):**
```
DB_URL=postgresql://...     # Neon/PostgreSQL
API_KEY=...                 # Simple auth (mismo valor en VITE_API_KEY)
```

**Frontend (`frontend/.env` — solo para dev local):**
```
VITE_API_BASE=http://localhost:8000    # También acepta VITE_API_URL (compatibilidad)
VITE_API_KEY=...                       # Mismo valor que API_KEY del backend
```

---

## Frontend

### DashboardPage.tsx (página principal)

Componente principal (~950 líneas). Orquesta los sub-componentes y hooks; la lógica de análisis, modales, exportación PDF y filtrado de fecha viven en hooks separados. Las vistas `saved-list` y `saved-detail` y la barra de filtros de fecha viven en archivos separados.

**Vistas:** controladas por `viewMode`: `dashboard` | `saved-list` | `saved-detail`

**Header del dashboard (cuando hay `result` o se está en saved-list/saved-detail):**
- Muestra ícono de impresora SVG (mismo que en la pantalla de bienvenida) + título "HP Logs Analyzer"
- Si `logFileName` está disponible, se muestra a la derecha del título como `dashboard__file-name`
- `border-bottom` sutil + `padding-bottom: 20px` separan el header del contenido
- Botones ("Incidentes guardados", "Analizar otro log", "Guardar incidente", "Exportar PDF") tienen tamaño uniforme (`padding: 10px 20px`, `font-size: 0.875rem`) via `.dashboard__header-actions .dashboard__btn`
- "Exportar PDF" solo aparece cuando hay `result` activo; genera un PDF con jsPDF + html2canvas (carga lazy para no inflar el bundle inicial)

**Subheader "Panel de errores":**
- Muestra `Panel de errores · <logFileName>` cuando `logFileName` está disponible
- Contiene los controles de filtro de fecha

**Flujo principal:**
1. Usuario clickea "Pegar logs y analizar" → abre `LogPasteModal` directamente
2. `handleAnalyze()` → `POST /parser/preview` + `POST /parser/validate`
3. Respuesta guardada en `pendingResult` / `pendingCodesNew` (el dashboard todavía no se muestra)
4. Se abre modal `ConfirmModal` "¿Agregar incidente SDS?" con "Sí, agregar" / "No, continuar"
   - "Sí, agregar" → abre `SDSIncidentModal`; al completarlo (`onContinue`) o cerrarlo (`onClose`), se llama `commitPendingResult()` que mueve `pendingResult` → `result` y muestra el dashboard con `SDSIncidentPanel`
   - "No, continuar" (o click fuera) → `commitPendingResult()` directamente; el dashboard se muestra sin panel SDS
5. Render: `<KPICards>` → `<DiagnosticPanel>` → `<IncidentsChart>` (AreaChart) → `<TopErrorsChart>` (BarChart) → `<IncidentsTable>` → `<EventsTable>`
6. Nuevo análisis limpia `result`, `pendingResult`, `sdsIncident`

**Filtros y sorting:**
- Incidents: filtro por severidad, búsqueda por texto, sort por columna (asc/desc)
- Events: ídem
- Lista de análisis guardados (`saved-list`): búsqueda en tiempo real por `name` o `equipment_identifier` via `savedListSearch` — se limpia al navegar a la vista
- Filtro por fecha: cinco modos — "Todo", "Esta semana", "Semana anterior", "Elegir semana" (popover con `input[type="week"]`), "📅" día específico (popover con `input[type="date"]`) — todos dentro del mismo grupo de botones

**Filtro de fecha — estado y tipo:**
- `selectedDate: string | null` — día seleccionado ("YYYY-MM-DD") o null
- `selectedWeekRange: { start: string; end: string } | null` — semana lunes–domingo o null
- `weekPickerOpen: boolean` — controla el popover del picker de semana
- `dayPickerOpen: boolean` — controla el popover del picker de día
- `activeFilter: DateFilter` — computed: `selectedWeekRange ?? selectedDate`
- `DateFilter = string | { start: string; end: string } | null` — tipo unificado usado en todas las funciones de filtrado
- Seleccionar día limpia `selectedWeekRange`; seleccionar semana limpia `selectedDate`; "Todo" limpia ambos
- El título del gráfico muestra el rango de semana como `"3 mar – 9 mar"` (via `formatWeekRange`)

**Layout del selector de fecha (`.date-filter-group`):**
Los cinco botones van agrupados en un único bloque con borde exterior y divisores internos (sin bordes individuales). El botón activo tiene fondo azul translúcido + borde azul. No hay input suelto fuera del grupo.

**Botón "Elegir semana":**
- Abre un popover (`.date-filter-popover`) con `input[type="week"]` nativo del browser
- Al seleccionar, llama a `weekInputToRange(weekStr)` para convertir `"YYYY-Www"` → `{ start, end }`, luego cierra el popover
- Se activa (azul) cuando `selectedWeekRange` no coincide con "Esta semana" ni "Semana anterior"
- Cuando está activo muestra el rango: `"3 – 9 mar"` en lugar del texto fijo
- El popover se cierra al hacer click fuera (effect `mousedown` + `weekPickerRef`)

**Botón "📅" (día específico):**
- Quinto botón del grupo, integrado con el mismo estilo
- Abre un popover con `input[type="date"]` con `min`/`max` del rango del log
- Cuando activo muestra la fecha formateada: `"15 mar"` (via `formatDayFilter`)
- El popover se cierra al hacer click fuera (effect `mousedown` + `dayPickerRef`)

**KPIs (sección `.kpis`, 4 cards):**
1. **Estado de errores** — conteo `ERROR · WARNING · INFO` de incidentes filtrados
2. **Incidencias Activas** — `filteredIncidents.length`
3. **Último error crítico** — código del `Event` con `type=ERROR` más reciente en `filteredEvents`; muestra código en rojo + fecha/hora en el subtítulo; "Sin errores" en verde si no hay ningún ERROR
4. **Tasa de errores** — `ERRORs ÷ (max_contador − min_contador)` del período filtrado. Solo cuenta eventos `type=ERROR` (WARNING e INFO excluidos). Muestra `"1 c/N pág."` con subtítulo `"<código más frecuente> · N pág. en el período"`; `"Sin errores"` (verde) si no hay ERRORs; `"—"` si el log no tiene datos de contador suficientes (menos de 2 valores). El código ERROR más frecuente se determina contando frecuencias con `reduce` sobre los eventos ERROR. Usa `reduce` en lugar de spread para evitar stack overflow con logs grandes.

El KPI "Último error crítico" usa `filteredEvents` (respeta el filtro de fecha activo), no requiere endpoint nuevo.

**Helpers importantes:**
- `getIncidentTableRows(incidents, events, filter: DateFilter)` → `IncidentRow[]` — derivado de `result`, no memoizado
- `filterIncidentsByDate`, `filterEventsByDate`, `getWindowForDate` — todos aceptan `DateFilter`
- `getWeekRange(date)` → `{ start, end }` — calcula lunes–domingo de la semana de `date`
- `formatWeekRange(range)` → `"3 mar – 9 mar"` — formato legible del rango
- `weekInputToRange(weekStr)` → `{ start, end }` — convierte `"YYYY-Www"` (formato de `input[type="week"]`) a rango lunes–domingo usando ISO 8601
- `bucketEventsByHour` → datos para AreaChart
- `getTopIncidentsForChart` → top N para BarChart

**Actualización de estado post-upsert** (`handleSaveCodeToCatalog`):
Después de un upsert exitoso, se actualiza `result` directamente (sin re-fetch):
- `result.events[].code_solution_url` y `code_solution_content` para eventos con el mismo `code`
- `result.incidents[].events[]` ídem
- `result.incidents[].sds_link` y `sds_solution_content` para incidentes con el mismo `code` (crítico para el botón "Ver solución" de la fila del incidente)

El botón "Ver solución" en la tabla de incidentes lee `inc.sds_solution_content` (nivel incidente), no `inc.events[].code_solution_content`. Si solo se actualiza uno, el botón no re-renderiza.

**Columna "Código" en tabla de incidentes:** es un `<button class="dashboard-table__code-link">` que abre directamente el modal de edición del catálogo (`setEditCodeInitial`) para ese código. Mismo handler que el botón "Editar" al final de la fila.

**Modal de comparación** (`compareModalOpen`):
- Se abre desde `SavedAnalysisDetail` con `onCompare` — limpia `compareLogText` y `compareFileName`
- Igual que `LogPasteModal`, ofrece botón "Cargar archivo…" (input oculto + `compareFileInputRef`) y textarea para pegar texto
- Estado: `compareLogText`, `compareFileName`, `comparing`, `compareResult`
- Al confirmar → `POST /saved-analyses/{id}/compare` → setea `compareResult` y cierra el modal

**Exportar PDF** — hook `useExportPdf(logFileName)` (`hooks/useExportPdf.ts`):
- Devuelve `{ exportingPdf, handleExportPDF, kpisRef, diagnosticRef, barChartRef, incidentsTableRef }`
- Solo disponible cuando hay `result` activo
- Genera un PDF A4 con: encabezado (título + fecha + nombre de archivo), KPIs, DiagnosticPanel, gráfico de errores frecuentes (BarChart), tabla de incidencias
- Usa `useRef` en cada sección DOM y las captura con `html2canvas` (scale 2)
- jsPDF y html2canvas se importan de forma lazy (`await import(...)`) — no inflan el bundle inicial
- Si una sección capturada no cabe en la página actual de jsPDF, se agrega una página nueva automáticamente
- El nombre del PDF se deriva del `logFileName` (ej: `reporte-printer-log.pdf`)

### Hook `useAnalysis` (`frontend/src/hooks/useAnalysis.ts`)

Centraliza el estado y los handlers del flujo de análisis. Recibe setters de modales como parámetros para no acoplarse a `useModals`.

**Estado expuesto:** `loading`, `error`, `setError`, `result`, `pendingResult`, `codesNew`, `setCodesNew`, `savingCode`, `savingIncident`

**Handlers:** `handleAnalyze`, `commitPendingResult`, `handleSaveCodeToCatalog`, `handleSaveIncident`

`handleSaveCodeToCatalog` actualiza `result` directamente post-upsert (sin re-fetch): actualiza `events[]`, `incidents[].events[]`, y `incidents[].sds_link`/`sds_solution_content`.

### Hook `useModals` (`frontend/src/hooks/useModals.ts`)

Centraliza los 11 estados de modales: `logModalOpen`, `sdsPreModalOpen`, `sdsModalOpen`, `sdsIncident`, `addCodeModalCode`, `editCodeInitial`, `saveIncidentModalOpen`, `compareModalOpen`, `deleteConfirm`, `solutionModal`, `helpModalOpen`. Devuelve state + setters para cada uno.

### Hook `useDateFilter` (`frontend/src/hooks/useDateFilter.ts`)

Centraliza todo lo relacionado con el filtro de fecha:

- **Tipo `DateFilter`**: `null` (todo) | `"YYYY-MM-DD"` (día) | `{ start, end }` (semana)
- **Funciones puras exportadas**: `getWindowForDate`, `getWeekRange`, `formatWeekRange`, `weekInputToRange`, `formatDayFilter`, `getDateRangeFromEvents`, `filterEventsByDate`, `filterIncidentsByDate`, `formatDateTime`
- **Hook `useDateFilter()`**: devuelve `selectedDate`, `selectedWeekRange`, `activeFilter`, `weekPickerOpen/Ref`, `dayPickerOpen/Ref`, setters individuales y `reset()` — incluye los dos `useEffect` de click-outside

### Componentes (`frontend/src/components/`)

| Componente | Propósito |
|------------|-----------|
| `KPICards.tsx` | 4 cards de KPI: Estado de errores, Incidencias Activas, Último error crítico, Tasa de errores |
| `IncidentsTable.tsx` | Tabla de incidentes con expand/collapse de filas, sort, filtros, "ver más" en mensajes. Exporta tipo `IncidentRow`. |
| `EventsTable.tsx` | Tabla de eventos colapsable con filtro de severidad, búsqueda y sort |
| `IncidentsChart.tsx` | AreaChart de eventos/hora con toggles de severidad |
| `TopErrorsChart.tsx` | BarChart de top 10 códigos de error coloreado por severidad |
| `AddCodeToCatalogModal.tsx` | Form para agregar/editar código: severity, description, solution_url |
| `SaveIncidentModal.tsx` | Form para guardar análisis: name + equipment_identifier opcional |
| `SDSIncidentModal.tsx` | Textarea para pegar incident SDS; parsea texto → `SdsIncidentData` |
| `SDSIncidentPanel.tsx` | Muestra data SDS parseada; calcula match SDS vs incidentes del log usando `event_context` + `more_info` |
| `ConfirmModal.tsx` | Modal de confirmación genérico |
| `DiagnosticPanel.tsx` | Panel colapsable de diagnóstico automático basado en reglas; aparece entre KPIs y gráficos; recibe solo `filteredEvents` (respeta filtro de fecha) |
| `DateFilterBar.tsx` | Subheader con los 5 botones de filtro de fecha (Todo / Esta semana / Semana anterior / Elegir semana / 📅); recibe props del hook `useDateFilter` |
| `SavedAnalysisList.tsx` | Vista `saved-list`: tabla de análisis guardados con búsqueda; recibe callbacks `onBack`, `onOpen`, `onDelete`; muestra sección "Evolución por equipo" cuando hay grupos de 3+ snapshots con el mismo `equipment_identifier` |
| `EquipmentTimeline.tsx` | Panel colapsable por equipo: agrupa snapshots del mismo `equipment_identifier`, fetchea detalles en paralelo al expandir, renderiza LineChart (Recharts) con evolución de errores y advertencias entre snapshots |
| `SavedAnalysisDetail.tsx` | Vista `saved-detail`: tabla de incidentes del snapshot + bloque de comparación; maneja estado loading (sin `savedDetail`) y cargado |

**Lógica de match SDS vs Log (`SDSIncidentPanel.tsx`):**
- `getSdsCodesForMatch(sds)` devuelve un array de códigos a buscar en el log:
  1. `event_context` ("Contexto del código de evento") como código primario — ej. `60.00.02`
  2. Códigos en `more_info` ("Más información") separados por `or` — ej. `"60.00.02 or 60.01.02"` → `["60.00.02", "60.01.02"]`
- El campo `code` ("Código" interno SDS, ej. `TriageInput2`) **no se usa** para el match.
- Si **cualquiera** de esos códigos existe en los incidentes del log → `✔ Coincide`, mostrando los códigos encontrados + conteo de eventos.
- `incidentCodeMatchesSds` sigue soportando sufijo `z` para matching por prefijo (ej. `53.B0.0z` matchea `53.B0.01`, `53.B0.02`, etc.).
| `SolutionContentModal.tsx` | Muestra contenido HTML de solución guardado; link al URL (puede estar vencido) |
| `HelpModal.tsx` | Modal de ayuda con 6 secciones: flujo de análisis, KPIs, reglas del diagnóstico automático (con color por nivel), filtros de fecha, catálogo de códigos e incidentes guardados. Sin props de datos — todo el contenido es estático. Se abre con botón "¿Cómo funciona?" en bienvenida y botón "?" circular en el header principal. |
| `Toast.tsx` | Renderer de notificaciones (consume ToastContext) |

### DiagnosticPanel (`components/DiagnosticPanel.tsx`)

Panel colapsable (por defecto expandido) que aparece entre los KPIs y los gráficos. No llama a ninguna API — toda la lógica es cálculo puro en el frontend con `filteredEvents` (respeta el filtro de fecha activo). No recibe `incidents` — todas las reglas operan sobre eventos.

**Reglas implementadas (en orden de severidad):**

| # | Nombre | Condición | Nivel |
|---|--------|-----------|-------|
| 1 | Problema dominante | Un código ERROR concentra >50% del total de eventos de error | Rojo |
| 2 | Ráfaga | 5+ eventos del mismo código en una ventana de 30 minutos | Amarillo |
| 3 | Escalamiento | La 2ª mitad del período tiene >2× eventos ERROR que la 1ª mitad; muestra el código que más creció con conteo de primera vs segunda mitad | Rojo |
| 4 | Firmware | Algún evento tiene `code_description` que incluye `"firmware"` | Amarillo |
| 5 | Múltiples bandejas | 2+ códigos ERROR distintos con `code_description` que incluye `"tray"` o `"bandeja"` (WARNING/INFO ignorados) | Amarillo |
| 6 | Saludable | Ninguna de las reglas anteriores se disparó | Verde |

Las reglas 4 y 5 usan la descripción del catálogo (`code_description`) en vez de prefijos de código hardcodeados. Si un código no tiene descripción en DB, las reglas simplemente no se disparan para ese código.

Máximo 5 alertas visibles, ordenadas por severidad (error → warning → info → success). Si no hay alertas, siempre muestra la regla de "saludable".

**Sección "¿Qué hacer?" (`getRecommendation`):**

Aparece debajo de la lista de alertas (cuando el panel está expandido). Derivada de las alertas activas:

| Condición | Resultado |
|-----------|-----------|
| Hay alerta `dominant` **Y** al menos una `burst-*` **Y** alerta `escalation` | 🔴 Visita técnica recomendada |
| Hay alertas pero no se cumple la condición anterior | 🟡 Monitorear — revisar en 48hs |
| Solo alerta `healthy` (sin problemas) | 🟢 Sin acción necesaria |

### ErrorBoundary (`App.tsx`)

`ErrorBoundary` es un componente de clase que envuelve todo el árbol de la app. Si un error no manejado llega hasta aquí, muestra un mensaje amigable ("Algo salió mal. Por favor recargá la página.") con un botón que llama a `window.location.reload()`. Sin él, un crash deja la pantalla en blanco.

### Keep-alive y estado DB (`App.tsx`)

Al montar la app, se llama a `GET /health` via `getHealth()` y luego cada 8 minutos. Esto sirve para dos propósitos: prevenir que Render duerma el servidor, y obtener `db_available` / `db_mode` del health check. El resultado se guarda en `healthStatus: HealthStatus | null` y se pasa a `DashboardPage`.

`DashboardPage` renderiza un `<DbStatusBadge>` en todos los headers (bienvenida y principal). Muestra `🟢 DB conectada` (verde) si `db_available === true`, o `🔴 DB offline · modo local` (rojo) si `false`. El badge es `null` mientras no haya respuesta del servidor. `getHealth()` falla silenciosamente y retorna `null` en caso de error.

### Loading state durante cold start (`LogPasteModal`)

Cuando `loading` es `true`:
- El botón muestra spinner CSS + "Analizando log…"
- Si el servidor estaba frío al iniciar la app **y** el request tarda más de 3 s, aparece debajo: "El servidor está iniciando, por favor esperá…" (en amarillo)
- El mensaje desaparece al terminar (éxito o error)

`App.tsx` mide el tiempo del ping inicial a `/health` con `getHealth()`. Si tardó > 3 s, setea `serverWasCold = true` y se lo pasa a `DashboardPage` → `LogPasteModal`. El `useEffect` de `slowWarning` solo arma el `setTimeout` (3 s) cuando `serverWasCold` es `true`.

### Cliente HTTP (`services/api.ts`)

- `API_BASE`: `VITE_API_URL` → `VITE_API_BASE` → `http://localhost:8000`
- `API_KEY`: `VITE_API_KEY` → `dev`
- Header siempre inyectado: `x-api-key`
- Error handling: extrae `detail` del JSON de error si está disponible
- `getHealth()`: GET `/health`, retorna `HealthStatus | null` — usada para keep-alive + indicador DB
- `apiFetch()`: wrapper interno sobre `fetch` que aplica `AbortSignal.timeout(30 s)` automáticamente; si el caller pasa su propio `signal`, se combinan con `AbortSignal.any`. `TimeoutError` se traduce a mensaje de error en español. Los pings de health usan timeout propio de 10 s.

### Tipos (`types/api.ts`)

Espejo de los modelos Pydantic del backend. Interfaces principales:
`Event`, `EnrichedEvent` (extiende `Event` con campos del catálogo), `Incident`,
`ParseLogsResponse`, `ValidateLogsResponse`, `ErrorCodeUpsertBody`,
`SavedAnalysisIncidentItem`, `SavedAnalysisSummary`, `SavedAnalysisFull`,
`CompareDiff`, `CompareResponse`

`Incident.events` y `ParseLogsResponse.events` son `EnrichedEvent[]`. Los componentes y hooks usan `EnrichedEvent as ApiEvent`.

### Prettier

Configurado con `eslint-config-prettier` para desactivar las reglas de ESLint que conflictúan con el formateo.

- **`.prettierrc`**: `singleQuote: true`, `semi: false`, `tabWidth: 2`, `trailingComma: "es5"`, `printWidth: 100`, `arrowParens: "always"`
- **`.prettierignore`**: excluye `dist/`, `node_modules/`, `*.tsbuildinfo` y `src/vite-env.d.ts` (la directiva `/// <reference>` en ese archivo es eliminada por Prettier)
- **Scripts**: `npm run format` (write) y `npm run format:check` (CI) — ambos desde raíz o `frontend/`
- **Nota**: `src/vite-env.d.ts` debe estar en `.prettierignore` siempre. Si Prettier lo vacía, `tsc -b` falla con errores de `ImportMeta.env` y `./index.css`.

### Build

`vite.config.ts` usa `manualChunks`:
- `vendor-react` — React core
- `vendor-charts` — Recharts (grande; chunk separado para caché eficiente)
- `index` — código de la app

jsPDF y html2canvas se importan con `import()` dinámico dentro de `handleExportPDF` — no están en ningún chunk estático y solo se descargan cuando el usuario clickea "Exportar PDF".

---

## Decisiones técnicas importantes

**Parser — normalización de espacios:** El portal HP copia los logs con espacios múltiples en lugar de tabs. El primer paso del parser es normalizar `\s{2,}` → `\t`. Sin esto, ninguna línea parsea.

**Parser — meses en español:** Los logs HP tienen timestamps como `14-mar-2024`. `datetime.strptime` requiere inglés. La solución es un dict de reemplazo antes de parsear: `{"ene": "jan", "feb": "feb", "mar": "mar", ...}`.

**Sin caché de preview:** Existió una caché en memoria para `/parser/preview`. Fue eliminada porque causaba que el servidor respondiera con resultados de runs anteriores tras hot-reload, haciendo muy difícil debuggear el parser.

**`solution_content` en la DB:** Los links HP del catálogo de soluciones tienen tokens que expiran. Al guardar el código, se fetchea el HTML de la página y se guarda en `error_codes.solution_content`. El frontend puede mostrar el contenido aunque el link esté vencido (botón "Ver solución" sin ⚠).

**Fallback JSON:** Diseñado para entornos con firewall corporativo que bloquea Neon. No requiere intervención manual; el switch es automático y transparente.

**`--reload-dir .` en uvicorn:** En Windows, uvicorn con `--reload` sin `--reload-dir` no detecta cambios en archivos Python. Es obligatorio.

**`taskkill` antes de uvicorn:** Los procesos Python en Windows no siempre liberan el puerto 8000 al terminar `npm run dev`. Sin `taskkill`, el puerto queda ocupado y el nuevo servidor no arranca (o arranca en el proceso viejo sin el código nuevo).

---

## Bugs resueltos — no repetir

**Bug: parser no procesaba ninguna línea**
- Causa: logs copiados del portal HP tienen espacios múltiples en lugar de tabs. El parser esperaba tabs.
- Fix: normalizar `\s{2,}` → `\t` al inicio del pipeline, antes de splitear columnas.

**Bug: servidor respondía con resultados viejos tras cambio de código**
- Causa: caché en memoria de `/parser/preview` + `--reload` de uvicorn no siempre invalida el módulo.
- Fix: eliminar caché completamente + agregar `--reload-dir .`.

**Bug: botón "Ver solución" no se actualizaba tras upsert sin recargar**
- Causa: `handleSaveCodeToCatalog` actualizaba `inc.events[].code_solution_content` pero el botón de la fila del incidente lee `inc.sds_solution_content` (campo de nivel incidente).
- Fix: en el `setResult` post-upsert, también actualizar `inc.sds_link` e `inc.sds_solution_content` cuando `inc.code === body.code`.

**Bug: `solution_content` no se guardaba al agregar link por primera vez**
- Causa: el fetch de contenido sólo ocurría en la lógica de "editar", no en "crear".
- Fix: unificar el path de upsert para siempre fetchear si hay `solution_url` y no hay contenido previo.

**Bug: crash del servidor en Windows al imprimir logs con cp1252**
- Causa: prints de debug con caracteres Unicode en Python con encoding cp1252.
- Fix: eliminar todos los prints de debug del parser y api.py.

**Bug: match SDS vs Log no funcionaba — usaba campo "Código" interno en lugar del código del log**
- Causa: `getSdsCodeForMatch` usaba `more_info ?? code` (ej. `TriageInput2`), que es un identificador interno SDS sin relación con los códigos del log.
- Fix: reemplazar por `getSdsCodesForMatch` que usa `event_context` como primario y parsea `more_info` buscando múltiples códigos separados por `or`. El campo `code` ya no interviene en el matching.

**Bug: build de Vercel fallaba por prop `incidents` no usada en `DiagnosticPanel`**
- Causa: `runDiagnostics` declaraba `incidents: ApiIncident[]` como primer parámetro pero todas las reglas operan exclusivamente sobre `events`. TypeScript strict lo marca como error.
- Fix: eliminar `incidents` de la firma de `runDiagnostics`, de `DiagnosticPanelProps` y del call site en `DashboardPage`. También eliminar el import de `ApiIncident`.

**Bug: SDS sin `event_context` mostraba "❌ No coincide" en vez de mensaje apropiado**
- Causa: `computeSdsVsLog` trataba `sdsCodes.length === 0` como `no_match`, sin distinguir entre "no hay código" y "hay código pero no matchea".
- Fix: agregar `hasEventContext(sds)` que detecta `event_context` vacío/null/`"—"`. Cuando es falso, `computeSdsVsLog` retorna `status: 'general'` antes de intentar match. El render muestra `ℹ️ SDS de tipo general — sin código de evento específico` en azul, y los campos "Eventos relacionados" y "Último evento" muestran `—`. "Estado SDS" no cambia (depende de fecha, no del código).

**Bug: DiagnosticPanel usaba prefijos de código hardcodeados para firmware y bandejas**
- Causa: Regla 4 detectaba firmware por `code.startsWith('49.')` y Regla 5 detectaba bandejas por regex `/^60\.00\.\d+$/` — acoplado a patrones de código HP específicos que pueden no aplicar en todos los modelos.
- Fix: Regla 4 usa `code_description?.toLowerCase().includes('firmware')`; Regla 5 busca `"tray"` o `"bandeja"` en la descripción. Regla 2 (ráfaga) también usa la descripción del catálogo en el mensaje en vez del código crudo.

**Bug: DiagnosticPanel — Regla 3 (escalamiento) y Regla 5 (bandejas) incluían WARNING/INFO causando falsos positivos**
- Causa: Regla 3 contaba todos los eventos sin filtrar por tipo; Regla 5 también evaluaba WARNING e INFO con "tray"/"bandeja" en la descripción (ej. 53.A2.20, 53.A2.21).
- Fix: ambas reglas filtran exclusivamente eventos `type.toUpperCase() === 'ERROR'`. Regla 3 además identifica el código que más creció (mayor diferencia segunda−primera mitad) y lo muestra en el mensaje: `📈 El problema está escalando: [código] pasó de [N] a [M] eventos en la segunda mitad del período`. Regla 5 muestra los códigos específicos que dispararon la alerta.

**Bug: re-render de DashboardPage cada segundo por useLiveTime**
- Causa: `useLiveTime` era un custom hook usado directamente en `DashboardPage` que llamaba `setState` cada 1 s, forzando re-render completo del componente raíz — y recalculando `bucketEventsByHour`, `getTopIncidentsForChart`, `getIncidentTableRows` y `filterEventsByDate` en cada tick.
- Fix: reemplazar `useLiveTime` por componente `LiveClock` aislado (el ticker vive en su propio árbol). Envolver todos los cálculos pesados en `useMemo` con sus dependencias reales: `filteredEvents`, `filteredIncidents`, `dateRange`, `lastErrorEvent`, `volumeData`, `topCodes`, `incidentRowsBase`, `incidentRows`, `tableRows`.

**Perf: previewLogs y validateLogs se ejecutaban secuencialmente en handleAnalyze**
- Causa: `await previewLogs(logText)` seguido de `await validateLogs(logText)` — el segundo request no empezaba hasta que terminaba el primero, aunque son completamente independientes.
- Fix: `Promise.all([previewLogs(logText), validateLogs(logText).catch(...)])` — ambos requests se lanzan en paralelo; la latencia total del análisis es la del más lento en vez de la suma de ambos.

**Bug: `_fetch_solution_content` en api.py no validaba la URL antes de hacer GET (SSRF)**
- Causa: el endpoint `/error-codes/upsert` pasaba cualquier `solution_url` directamente a `httpx.get()` sin validar scheme ni destino — permitía fetch a IPs privadas, loopback, `http://`, `file://`, etc.
- Fix: `_validate_ssrf_url(url)` lanzada antes del fetch; rechaza con HTTP 422 si: scheme no es `https`, URL sin hostname, o hostname es IP literal en rangos privados/reservados (10.x, 172.16–31.x, 192.168.x, 127.x, 169.254.x). Usa `ipaddress` + `urllib.parse` de stdlib.

**Bug: build Vercel fallaba — `now` no definido en header de saved-detail**
- Causa: el header del saved-detail usaba `<time dateTime={now.toISOString()}>` con `now` inline, pero `now` solo existe dentro de `LiveClock`. Al refactorizar `useLiveTime` → `LiveClock`, este `<time>` inline quedó sin migrar.
- Fix: reemplazar el `<time>` inline por `<LiveClock className="dashboard__datetime" short />`, igual que el header del dashboard principal.

**Bug: "El servidor está iniciando…" aparecía siempre a los 5 s aunque el servidor estuviera caliente**
- Causa: `slowWarning` se activaba con un `setTimeout` de 5 s cada vez que `loading` era `true`, independientemente del estado real del servidor.
- Fix: `App.tsx` mide el tiempo del ping inicial a `/health` con `getHealth()`. Solo si tardó > 3 s se setea `serverWasCold = true`. `LogPasteModal` recibe esta prop y solo arma el timeout de `slowWarning` cuando es `true`. Texto del botón cambiado a "Analizando log…" sin mencionar el servidor.

**Bug: contrato de tendencia desalineado entre backend y frontend**
- Causa: el backend retorna `"mejoro"` | `"estable"` | `"empeoro"` (sin tildes), pero `types/api.ts` lo tipaba como `'mejoró' | 'igual' | 'peor'` — tres valores distintos que nunca podían matchear en runtime.
- Fix: actualizar `CompareDiff.tendencia` en `types/api.ts` a `'mejoro' | 'estable' | 'empeoro'` para que coincida exactamente con lo que el backend envía. El backend es la fuente de verdad.

**Feature: botón "Ignorar y ver resultados" en sección de códigos nuevos**
- Contexto: cuando el análisis detecta códigos desconocidos, el dashboard (Panel de errores, gráficos, tablas) queda oculto hasta que se gestionan todos los códigos nuevos.
- Fix: se agregó el botón al final de la sección `.dashboard__codes-new-section`. Al hacer click llama `setCodesNew([])`, que vacía el array y muestra el dashboard inmediatamente sin modificar el análisis ni los códigos detectados.

**Bug: /parser/preview no tenía límite de tamaño de payload**
- Causa: `/parser/validate` y `/saved-analyses/{id}/compare` verificaban `len(logs) > MAX_LOGS_LENGTH` y retornaban HTTP 400, pero `/parser/preview` no tenía ese check y aceptaba payloads de cualquier tamaño.
- Fix: agregar `if len(payload.logs) > MAX_LOGS_LENGTH: raise HTTPException(400)` al inicio de `parse_logs`, igual que en los otros dos endpoints.

**Perf: `_fetch_solution_content` bloqueaba el worker de uvicorn hasta 15 s**
- Causa: `_fetch_solution_content` usaba `httpx.get()` síncrono; durante el fetch HTTP el worker de uvicorn quedaba completamente bloqueado, sin poder atender ningún otro request.
- Fix: convertir a `async def _fetch_solution_content` con `httpx.AsyncClient` y `await client.get(...)`. El endpoint `/error-codes/upsert` también pasa a `async def` para poder hacer `await`. El event loop queda libre durante el fetch.

**Bug: reloj duplicado — aparecía en header principal y en subheader de filtros**
- Causa: `<LiveClock short />` estaba renderizado tanto en el header principal (`dashboard__datetime`) como al final del subheader de filtros de fecha.
- Fix: eliminar el `<LiveClock>` del subheader; queda solo en el header principal.

**Bug: tabla de eventos usaba índice como key causando bugs de reconciliación en React**
- Causa: `tableRows.map((evt, i) => <tr key={i}>)` — al filtrar eventos, React podía reutilizar nodos DOM incorrectos porque el índice no es estable.
- Fix: reemplazar por `key={\`${evt.code}-${evt.timestamp}\`}` — combinación estable y única para cada evento.

**Feature: botón × para cerrar toasts manualmente**
- Contexto: los toasts se cerraban solos a los 5 s pero no había forma de descartarlos antes.
- Fix: `removeToast` expuesta en `ToastContextValue`; `ToastContainer` renderiza un `<button class="toast__close">` por cada toast que llama a `removeToast(t.id)`. El `.toast` pasó a `display: flex` para alinear mensaje y botón; estilos `.toast__close` y `.toast__close:hover` agregados en `index.css`.

**Fix: tabla de eventos colapsada por defecto y con nombre confuso**
- Causa: `eventsTableCollapsed` arrancaba en `true` y el título era "Últimos errores registrados", pero la tabla contiene todos los eventos filtrados, no los últimos N.
- Fix: `useState(false)` para expandir por defecto; título cambiado a "Eventos del período".

**Feature: expandir mensaje completo en detalle de incidente**
- Contexto: la columna "Mensaje / Ayuda" en el detalle expandido de un incidente truncaba a 80 chars sin forma de ver el resto.
- Fix: cuando el texto supera 80 chars, se muestra truncado con tooltip nativo (`title` con el mensaje completo) y un botón "ver más" que expande el texto en la misma celda. Al expandir aparece "ver menos" para colapsar. Estado `expandedMsgs: Set<string>` en `DashboardPage`; key por `${inc.id}-${idx}-msg`. Estilos en `.dashboard-table__msg-toggle` (botón sin borde, texto azul 11px subrayado).

**Bug: stack overflow en `getWindowForDate` y `getDateRangeFromEvents` con miles de eventos**
- Causa: `Math.min(...times)` y `Math.max(...times)` usan spread sobre el array completo; con miles de elementos se supera el límite de argumentos del call stack y el proceso crashea.
- Fix: reemplazar por `times.reduce((a, b) => Math.min(a, b))` / `reduce((a, b) => Math.max(a, b))` en ambas funciones de `useDateFilter.ts`. El reduce itera sin expandir el stack.

**Perf: sort redundante en `analysis_service.py` dentro de cada grupo**
- Causa: `analyze()` ordena todos los eventos globalmente (`ordered = sorted(...)`) y luego los distribuye por código en `by_code`. Sin embargo, dentro del loop de grupos se volvía a hacer `group_sorted = sorted(group, ...)`, que era un no-op porque los eventos ya estaban en orden de inserción (timestamp ascendente).
- Fix: eliminar `group_sorted`; usar `group` directamente. Los accesos a `group[0]` / `group[-1]` y los iteradores son equivalentes con el orden garantizado por `ordered`.

**Bug: race condition en escritura del JSON de fallback**
- Causa: dos requests concurrentes de upsert/create/delete podían leer el archivo JSON, modificarlo en memoria y sobreescribirse mutuamente, perdiendo uno de los cambios.
- Fix: `threading.Lock()` a nivel de módulo (`_local_write_lock`) en `error_code_repository.py` y `saved_analysis_repository.py`. Serializa el ciclo read-modify-write completo en `_upsert_local`, `_create_local` y `_delete_local`.

**Bug: fetches del frontend sin timeout — requests colgados esperaban indefinidamente**
- Causa: todos los `fetch()` en `api.ts` no tenían timeout; si el servidor no respondía, el request quedaba pendiente para siempre sin mostrar error al usuario.
- Fix: `apiFetch()` wrapper interno que aplica `AbortSignal.timeout(30_000)` a cada request; si el caller pasa su propio `signal`, se combinan via `AbortSignal.any`. `DOMException { name: 'TimeoutError' }` se captura y se traduce a mensaje en español. Los pings de health usan timeout propio de 10 s.

**Bug: `compare_service` no detectaba transición de 0 a N errores como "empeoró"**
- Causa: la condición del 20% tenía guard `total_saved_errors > 0`, lo que impedía clasificar como "empeoró" cuando el snapshot base tenía 0 errores y el actual tenía 1+. El loop de `codigos_nuevos` cubría el caso de códigos completamente nuevos con ERROR, pero no el caso de un código preexistente (antes WARNING/INFO) que escala a ERROR.
- Fix: agregar check explícito `if total_saved_errors == 0 and total_current_errors > 0: return "empeoro"` antes de la condición del 20%.

**Bug: header del log no se detectaba si el texto pegado comenzaba con línea en blanco**
- Causa: `_parse_lines` pasaba `is_first_line=idx == 1` a `_parse_line`, donde `idx` es el número de línea raw. Si el usuario pegaba el log con una línea en blanco al inicio, el header caía en `idx=2` y `is_first_line=False`, generando un error de parse en lugar de ignorarlo.
- Fix: reemplazar el flag `is_first_line` por `is_candidate_header` basado en un contador `non_empty_count`. Las primeras 3 líneas no vacías se consideran candidatas a header (`non_empty_count <= 3`). Esto tolera hasta 2 líneas en blanco iniciales sin afectar logs válidos que empiezan antes de la línea 3.

**Bug: `db_ms` calculado incorrectamente en `/parser/validate`**
- Causa: en lugar de capturar `t_db_start = time.perf_counter()` antes de llamar a `get_by_codes`, se calculaba `db_ms` como `(time.perf_counter() - t_parse_start) * 1000 - parse_ms` — restando el tiempo de parse al tiempo acumulado desde `t_parse_start`, lo que da valores erróneos (especialmente si el parse es largo o la DB es rápida).
- Fix: introducir `t_db_start = time.perf_counter()` justo antes de `get_by_codes` y calcular `db_ms = int((time.perf_counter() - t_db_start) * 1000)`, igual que en `/parser/preview`.

**Fix: validación formato URL antes de fetch — string arbitrario causaba 500**
- Causa: `_validate_ssrf_url` accedía a `parsed.scheme` y `parsed.hostname` fuera del bloque `try/except`. `parsed.hostname` lanza `ValueError` para entradas malformadas (ej. IPv6 inválido `"https://[::1"`), que propagaba como HTTP 500.
- Fix: mover las lecturas de `parsed.scheme` y `parsed.hostname` dentro del `try` block. Cualquier error de parsing queda capturado y devuelve HTTP 422 "URL mal formada."

**Fix: sanitizar contenido HTML antes de guardarlo en DB (`_fetch_solution_content`)**
- Causa: `soup.get_text()` produce texto plano, pero si en el futuro se renderiza como HTML (ej. en `SolutionContentModal`), cualquier HTML residual podría ejecutarse como XSS.
- Fix: pasar el texto extraído por `bleach.clean(cleaned, tags=[], attributes={}, strip=True)` antes de devolver el contenido. `bleach` elimina cualquier etiqueta HTML que pudiera colarse. Nueva dependencia: `bleach==6.3.0` en `requirements.txt`.

**Bug: Prettier vaciaba `vite-env.d.ts` rompiendo el build con `tsc -b`**
- Causa: `prettier --write src` trataba la directiva `/// <reference types="vite/client" />` como comentario TS y la eliminaba al formatear. `tsc --noEmit` pasaba igual (usa modo de verificación sin composite), pero `tsc -b` (usado en `npm run build`) fallaba con `Property 'env' does not exist on type 'ImportMeta'` y `Cannot find module './index.css'`.
- Fix: agregar `src/vite-env.d.ts` a `frontend/.prettierignore`. El archivo nunca debe ser formateado por Prettier.

---

## Deploy en producción

### URLs

| Servicio | URL |
|----------|-----|
| Frontend (Vercel) | `https://printer-logs-analyzer.vercel.app` |
| Backend (Render) | `https://printer-logs-analyzer.onrender.com` |

### Variables de entorno en producción

**Render (backend)** — configurar en *Environment* del servicio:

| Variable | Descripción |
|----------|-------------|
| `DB_URL` | Connection string de Neon PostgreSQL |
| `API_KEY` | Clave compartida con el frontend |
| `ENV` | Setear a `production` en Render |

Si `API_KEY` no está seteada, el backend usa `"dev"` como fallback. Si además `ENV=production`, `from_env()` loguea un WARNING al arrancar: `⚠️ ADVERTENCIA: Usando API key por defecto 'dev' en producción`.

**Vercel (frontend)** — configurar en *Project Settings → Environment Variables*:

| Variable | Valor |
|----------|-------|
| `VITE_API_BASE` | `https://printer-logs-analyzer.onrender.com` |
| `VITE_API_KEY` | Mismo valor que `API_KEY` del backend |

Las variables `VITE_*` se embeben en el bundle en build-time; si se cambian en Vercel hay que hacer redeploy manual.

### Diferencias entre local y producción

| Aspecto | Local | Producción |
|---------|-------|-----------|
| Backend URL | `http://localhost:8000` | `https://printer-logs-analyzer.onrender.com` |
| Frontend URL | `http://localhost:5173` | `https://printer-logs-analyzer.vercel.app` |
| Vars de entorno | `.env` en raíz / `frontend/.env` | Dashboard de Render / Vercel |
| Hot-reload | Sí (uvicorn `--reload`) | No (proceso permanente) |
| DB fallback | Activo si sin red a Neon | Siempre conectado (Neon mismo datacenter) |
| CORS | localhost + Vercel | localhost + Vercel |

### Start command en Render

```
uvicorn backend.interface.api:app --host 0.0.0.0 --port $PORT
```

Sin `--reload` en producción. Render inyecta `$PORT` automáticamente.

---

## Deuda técnica conocida

- Las tablas `config_versions`, `rules`, `rule_tags` existen en DB pero no se usan (legacy de v1) — migraciones 001 y 002 las crean; no se eliminan para no correr DDL destructivo en producción
