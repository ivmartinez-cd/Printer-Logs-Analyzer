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

`npm run dev:backend` ya incluye `taskkill` antes de arrancar uvicorn. Si el servidor responde con código viejo, matar manualmente y reiniciar.

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

`--reload-dir .` es obligatorio en Windows para que hot-reload funcione.

### Lint, tests y typecheck

```bash
# Desde la raíz
npm run lint           # ESLint en frontend/src
npm run typecheck      # tsc --noEmit en frontend
npm run format         # Prettier --write src (frontend)
npm run test:frontend  # vitest run (80 tests)
npm run test:backend   # pytest backend/tests/ -v (78 tests)
```

---

## Arquitectura

Monorepo: React/TypeScript frontend + Python/FastAPI backend, conectados por REST.

```
Printer-Logs-Analyzer/
├── package.json                  # Scripts root (dev, lint, typecheck, test:*)
├── docs/                         # Documentación
├── samples/                      # hp_log.txt, request.json
├── backend/
│   ├── main.py                   # Entrypoint uvicorn local
│   ├── requirements.txt
│   ├── interface/
│   │   ├── api.py                # FastAPI app, todos los endpoints
│   │   └── auth.py               # Dependencia auth por API key
│   ├── domain/entities.py        # Pydantic models
│   ├── application/
│   │   ├── parsers/log_parser.py
│   │   └── services/
│   │       ├── analysis_service.py
│   │       ├── compare_service.py
│   │       └── consumable_warning_service.py
│   ├── infrastructure/
│   │   ├── config.py             # Settings desde .env
│   │   ├── content_fetcher.py    # validate_ssrf_url + fetch_solution_content
│   │   ├── database.py           # psycopg2, timeout 5s, DatabaseUnavailableError
│   │   ├── fallback/error_codes_seed.json
│   │   └── repositories/
│   │       ├── error_code_repository.py
│   │       └── saved_analysis_repository.py
│   ├── migrations/               # 5 migraciones SQL (correr manualmente)
│   └── data/                     # Gitignored — JSON local en modo fallback
└── frontend/
    ├── .prettierrc               # singleQuote, semi:false, printWidth 100
    ├── .prettierignore           # Incluye src/vite-env.d.ts — no editar
    ├── eslint.config.js
    ├── vite.config.ts            # manualChunks: vendor-react, vendor-charts
    ├── vitest.config.ts          # environment: node; setupFiles jest-dom
    ├── src/
    │   ├── pages/DashboardPage.tsx
    │   ├── components/
    │   ├── hooks/
    │   │   ├── useDateFilter.ts
    │   │   ├── useAnalysis.ts
    │   │   ├── useModals.ts
    │   │   └── useExportPdf.ts
    │   ├── services/api.ts
    │   ├── types/api.ts
    │   └── contexts/ToastContext.tsx
    └── src/__tests__/            # fixtures/, components/ (jsdom), hooks (node)
```

---

## Backend

### Domain models (`domain/entities.py`)

Todos los modelos son Pydantic con `model_config = {"frozen": True}`.

**Event:** `type` (ERROR|WARNING|INFO), `code`, `timestamp`, `counter`, `firmware`, `help_reference`

**EnrichedEvent(Event):** extiende con `code_severity`, `code_description`, `code_solution_url`, `code_solution_content`. Es el tipo que circula en toda la capa de aplicación e `Incident.events`.

**Incident:** `id` (`"{code}-{start_time.isoformat()}"`), `code`, `classification`, `severity`, `severity_weight`, `occurrences`, `start_time`, `end_time`, `counter_range`, `events: List[EnrichedEvent]`, `sds_link`, `sds_solution_content`

**AnalysisResult:** `incidents`, `global_severity`, `created_at`, `metadata`

**ConsumableWarning:** `part_number`, `description`, `category`, `life_pages`, `current_counter`, `usage_pct`, `status` (`"ok"|"warning"|"replace"`), `matched_codes`. Status thresholds: ≥100% → replace, ≥80% → warning, <80% → ok.

### Parser (`application/parsers/log_parser.py`)

Formato de entrada: TSV o espacios múltiples.

Decisiones clave:
- **Normaliza `\s{2,}` → `\t`** antes de parsear — logs HP usan espacios en vez de tabs
- **Meses en español** (`ene→jan`, `mar→mar`, etc.) antes de `strptime`
- Candidato a header: primeras 3 líneas no vacías (`non_empty_count <= 3`) — tolera líneas en blanco al inicio
- Tolerante a errores: líneas malformadas en `ParserError` sin detener el parse
- Retorna `ParserReport` con `events` y `errors`

**Sin caché de preview** — eliminado deliberadamente (causaba respuestas con código viejo tras hot-reload).

### Analysis service (`application/services/analysis_service.py`)

- Ordena por timestamp, agrupa por código → un `Incident` por código
- Severity: máximo de sus eventos (ERROR=3 > WARNING=2 > INFO=1)
- `sds_link`/`sds_solution_content`: del primer evento con `code_solution_url`
- `global_severity`: máximo de todos los eventos

### Consumable warning service (`application/services/consumable_warning_service.py`)

`compute_consumable_warnings(events, consumables, max_counter)` — returns `List[ConsumableWarning]` sorted by status (`replace` → `warning` → `ok`), then `usage_pct` desc. Excludes:
- `category == "toner"` — page counter doesn't reflect toner wear.
- ADF rollers (`ADF_DESCRIPTION_PATTERNS`: `"adf"`, `"document feeder"`, `"automatic document feeder"`, case-insensitive) — page counter counts prints, not ADF cycles.
- 110V components (`VOLTAGE_EXCLUSION_PATTERNS`: `"110v"`) — only 220V is used in Argentina.

Both groups are checked by `_is_excluded_by_description(description)`. Code patterns support `z` wildcard (any hex digit). Called from `/parser/preview` when `model_id` is present; failures are logged and skipped without breaking analysis.

### Compare service (`application/services/compare_service.py`)

Retorna `"mejoro"` | `"estable"` | `"empeoro"` (sin tildes — fuente de verdad del backend).

- **empeoro**: ERROR nuevo, ERROR existente +≥3 ocurrencias, total ERRORs +≥20%, o transición 0→N errores
- **mejoro**: desapareció al menos un ERROR, total ERRORs bajó, sin ERRORs nuevos
- **estable**: cualquier otro caso

### Infraestructura

**`auth.py`** — valida header `x-api-key`. HTTP 401 si falta o incorrecta.

**`content_fetcher.py`:**
- `validate_ssrf_url(url)` — requiere `https`, hostname presente, IP no privada/reservada (10.x, 172.16–31.x, 192.168.x, 127.x, 169.254.x). HTTP 422 si falla. Lecturas de `parsed.scheme`/`parsed.hostname` dentro del `try` (lanza `ValueError` con URLs malformadas).
- `async fetch_solution_content(url)` — `httpx.AsyncClient`, BeautifulSoup, `bleach.clean(tags=[], strip=True)`. Límite 50 KB.

**`database.py`** — `ThreadedConnectionPool` (min=1, max=5), lazy init. Lanza `DatabaseUnavailableError` en timeout/fallo/pool exhausto.

**Repositorios:**
- `ErrorCodeRepository` — `ErrorCode`: `id, code, severity, description, solution_url, solution_content, created_at, updated_at`
- `SavedAnalysisRepository` — `SavedAnalysisSnapshot`: `id (UUID), name, equipment_identifier, incidents (List[dict]), global_severity, created_at`
- Ambos usan `threading.Lock()` (`_local_write_lock`) para serializar el ciclo read-modify-write del JSON de fallback.

### DB fallback (offline / firewall corporativo)

Switch automático cuando PostgreSQL no está disponible:
- `error_codes`: lee de `fallback/error_codes_seed.json`; upserts → `data/error_codes_local.json`
- `saved_analyses`: CRUD → `data/saved_analyses_local.json`
- `GET /health` reporta `"db_mode": "local_fallback"`

### API endpoints (`interface/api.py`)

Todos excepto `/health` requieren `x-api-key`. Sin key → HTTP 401. Logs hasta 2M caracteres.

| Método | Ruta | Propósito |
|--------|------|-----------|
| GET | `/health` | Health probe; retorna `db_mode`, `db_available` |
| POST | `/parser/preview` | Parse + análisis + enriquecimiento desde catálogo |
| POST | `/parser/validate` | Valida formato, detecta códigos nuevos |
| POST | `/error-codes/upsert` | Crear/actualizar código; fetchea `solution_content` async |
| POST | `/saved-analyses` | Guardar snapshot |
| GET | `/saved-analyses` | Listar snapshots |
| GET | `/saved-analyses/{id}` | Obtener snapshot |
| DELETE | `/saved-analyses/{id}` | Eliminar snapshot |
| POST | `/saved-analyses/{id}/compare` | Comparar logs vs snapshot |

**CORS:** `printer-logs-analyzer.vercel.app`, `localhost:5173/5174`, `127.0.0.1:5173/5174`

**Rate limiting** (slowapi, in-memory, por IP):
- `/parser/preview`: 60/min
- `/parser/validate`: 60/min
- `/error-codes/upsert`: 30/min

### Migraciones SQL (`backend/migrations/`)

Correr manualmente. Las 5 primeras están ejecutadas en producción (Neon). La 006 está pendiente de correr.

| Archivo | Contenido |
|---------|-----------|
| `001_init.sql` | `config_versions`, `audit_log`, `rules`, `rule_tags` (legacy, no usadas) |
| `002_add_rules_and_rule_tags.sql` | Continuación de 001 |
| `003_create_error_codes.sql` | Tabla `error_codes` con UNIQUE(code) |
| `004_create_saved_analyses.sql` | Tabla `saved_analyses` con JSONB para incidents |
| `005_add_solution_content.sql` | `ALTER TABLE error_codes ADD COLUMN solution_content TEXT` |
| `006_create_printer_models.sql` | Tablas `printer_models`, `printer_consumables`, `consumable_related_codes`; `ALTER TABLE saved_analyses ADD COLUMN model_id UUID` |

### Variables de entorno (dev local)

**Backend (`.env` en raíz):** `DB_URL=postgresql://...`, `API_KEY=...`

**Frontend (`frontend/.env`):** `VITE_API_BASE=http://localhost:8000`, `VITE_API_KEY=...`

---

## Frontend

### DashboardPage.tsx

Orquesta vistas (`dashboard` | `saved-list` | `saved-detail`) y hooks. Flujo principal:

1. "Pegar logs y analizar" → abre `LogPasteModal`
2. `handleAnalyze()` → `Promise.all([POST /parser/preview, POST /parser/validate])`
3. Respuesta en `pendingResult` / `pendingCodesNew`
4. Modal `ConfirmModal` "¿Agregar incidente SDS?" → `SDSIncidentModal` o directo
5. `commitPendingResult()` mueve `pendingResult` → `result`, muestra dashboard
6. Render: `<KPICards>` → `<AIDiagnosticPanel>` → `<SDSIncidentPanel>` → `<ConsumableWarningsPanel>` → `<IncidentsChart>` → `<TopErrorsChart>` → `<IncidentsTable>` → `<EventsTable>`

Post-upsert de código: actualizar `result` directamente (sin re-fetch). Actualizar `events[]`, `incidents[].events[]`, `incidents[].sds_link` e `incidents[].sds_solution_content` — el botón "Ver solución" lee nivel incidente, no nivel evento.

### Hooks

- **`useAnalysis`** — estado y handlers del flujo: `loading`, `result`, `pendingResult`, `codesNew`, `handleAnalyze`, `commitPendingResult`, `handleSaveCodeToCatalog`, `handleSaveIncident`
- **`useModals`** — 11 estados de modales: `logModalOpen`, `sdsPreModalOpen`, `sdsModalOpen`, `sdsIncident`, `addCodeModalCode`, `editCodeInitial`, `saveIncidentModalOpen`, `compareModalOpen`, `deleteConfirm`, `solutionModal`, `helpModalOpen`
- **`useDateFilter`** — `DateFilter = null | "YYYY-MM-DD" | { start, end }`. Funciones puras exportadas: `filterEventsByDate`, `filterIncidentsByDate`, `getWeekRange`, `weekInputToRange`, `formatWeekRange`, `formatDayFilter`, `getDateRangeFromEvents`, `formatDateTime`
- **`useExportPdf`** — PDF A4 con html2canvas (scale 2) + jsPDF (lazy import); refs para AIDiagnosticPanel (si ya fue generado), KPIs, BarChart, tabla de incidentes

### Componentes (`frontend/src/components/`)

| Componente | Propósito |
|------------|-----------|
| `DashboardHeader.tsx` | Header: logo, logFileName, botones de acción, LiveClock, DbStatusBadge |
| `KPICards.tsx` | 4 KPIs: errores/warnings/info, incidencias activas, último error, tasa de errores |
| `IncidentsTable.tsx` | Tabla incidentes; sort/filtro interno; recibe `IncidentRow[]` ya filtrados por fecha |
| `EventsTable.tsx` | Tabla eventos colapsable; **arranca colapsada**; sort/filtro interno; recibe `ApiEvent[]` ya filtrados |
| `IncidentsChart.tsx` | AreaChart eventos/hora con toggles de severidad |
| `TopErrorsChart.tsx` | BarChart top 10 códigos de error coloreado por severidad |
| `AddCodeToCatalogModal.tsx` | Form agregar/editar código del catálogo |
| `SaveIncidentModal.tsx` | Form guardar análisis con nombre y equipment_identifier |
| `SDSIncidentModal.tsx` | Pegar SDS; parsea texto → SdsIncidentData |
| `SDSIncidentPanel.tsx` | Muestra SDS y match vs incidentes del log; **arranca colapsado**; posición: entre AIDiagnosticPanel y ConsumableWarningsPanel; acepta `consumableWarnings?` para mostrar sección "Verificar historial de consumibles" cuando hay solapamiento de códigos |
| `ConsumableWarningsPanel.tsx` | "Estado de consumibles" — tabla con texto introductorio de aviso; **arranca colapsada**; solo se renderiza si `warnings.length > 0`; posición: entre SDSIncidentPanel y gráficos; excluye toners y ADF |
| `ConfirmModal.tsx` | Modal de confirmación genérico |
| `AIDiagnosticPanel.tsx` | Diagnóstico con IA; arranca colapsado, llama a `/analysis/ai-diagnose` on demand |
| `DateRangePicker.tsx` | Picker de rango de fechas con presets (hoy, semana, mes, N días) y DayPicker interactivo; popover alineado a `right: 0` para no salirse del viewport |
| `SavedAnalysisList.tsx` | Lista análisis guardados con búsqueda y evolución por equipo |
| `EquipmentTimeline.tsx` | LineChart evolución de errores por equipo entre snapshots |
| `SavedAnalysisDetail.tsx` | Detalle snapshot con tabla de incidentes y comparación |
| `SolutionContentModal.tsx` | Muestra contenido de solución guardado; link al URL |
| `HelpModal.tsx` | Ayuda estática con 6 secciones |
| `Toast.tsx` | Renderer de notificaciones (consume ToastContext) |

**Match SDS vs Log (`SDSIncidentPanel`):** usa `event_context` como código primario y `more_info` (separado por `or`) como secundarios. El campo `code` interno SDS no interviene. Cada token se despacha por `sdsTokenMatchesIncident`:
- **Numérico** (contiene `.`): `incidentCodeMatchesSds` con wildcard `z` (`53.B0.0z` → `53.B0.01`…`53.B0.0F`).
- **Mensaje** (sin `.`): `normalizeForMessageMatch` (minúsculas + strip espacios/guiones/underscores) sobre el token y sobre `incident.classification`, luego `includes()`. Ej. `"ReplaceTrayPickRollers"` coincide con `"Replace Tray Pick Rollers"`.

Status `'general'` solo se emite cuando **ambos** `event_context` y `more_info` están vacíos/sin tokens parseables — si `event_context` está vacío pero `more_info` tiene tokens, se intenta el match normal.

### AIDiagnosticPanel

- Arranca **colapsado** (`collapsed: true`). Header-button con chevron (`▶` / `▼ rotado`) hace toggle.
- Al expandir muestra CTA → loading → diagnosis o error, según estado actual.
- Llama a `POST /analysis/ai-diagnose` on demand (botón "Generar análisis con IA").
- El diagnóstico se parsea en secciones `DIAGNÓSTICO / ACCIÓN / PRIORIDAD`; fallback a `<pre>` crudo.
- `collapsed` es independiente del resto del estado: colapsar/expandir no resetea el diagnóstico ya generado.
- Resetea `diagnosis` y `error` cuando cambia `result` (nuevo log analizado).
- El PDF exporta el panel solo si el diagnóstico ya fue generado (detecta `.ai-diagnostic-panel__diagnosis` como descendiente).

### Cliente HTTP (`services/api.ts`)

- `API_BASE`: `VITE_API_URL` → `VITE_API_BASE` → `http://localhost:8000`
- `API_KEY`: `VITE_API_KEY` → `dev`
- `apiFetch()` aplica `AbortSignal.timeout(30s)`; health pings usan 10s; `TimeoutError` → mensaje en español

### Tipos (`types/api.ts`)

`Event`, `EnrichedEvent`, `Incident`, `ParseLogsResponse` (includes `consumable_warnings: ConsumableWarning[]`), `ValidateLogsResponse`, `ErrorCodeUpsertBody`, `SavedAnalysisIncidentItem`, `SavedAnalysisSummary`, `SavedAnalysisFull`, `CompareDiff`, `CompareResponse`, `ConsumableWarning`

`CompareDiff.tendencia`: `'mejoro' | 'estable' | 'empeoro'` (sin tildes — espeja exactamente el backend).

### Prettier

`.prettierrc`: `singleQuote: true`, `semi: false`, `tabWidth: 2`, `trailingComma: "es5"`, `printWidth: 100`

`.prettierignore` incluye `src/vite-env.d.ts` — **no eliminar nunca**. Si Prettier vacía ese archivo, `tsc -b` falla con errores de `ImportMeta.env` y `./index.css`.

### Tests de componentes

- Cada archivo de test declara `// @vitest-environment jsdom` como primera línea
- `afterEach(cleanup)` explícito en cada archivo (auto-cleanup no activo en todos los entornos vitest)
- Preferir `getByRole` o `querySelector` sobre `getByText` (evita matches en padre e hijo)
- `fixtures/events.ts`: `mockEvent`, `mockIncident`, `mockIncidentRow`, `mockEvents`, `mockIncidents`

---

## Decisiones técnicas importantes

**Parser — espacios:** logs HP usan espacios múltiples en vez de tabs. Normalizar `\s{2,}` → `\t` es el primer paso; sin esto nada parsea.

**Parser — meses en español:** timestamps como `14-mar-2024`. Dict de reemplazo antes de `strptime`.

**`solution_content` en DB:** links HP tienen tokens que expiran. Se fetchea el HTML al guardar el código. Frontend puede mostrar contenido aunque el link esté vencido.

**DB fallback:** switch automático a JSON local cuando PostgreSQL no está disponible. Sin intervención manual. Threading lock evita race conditions en escrituras concurrentes.

**SSRF validation:** `validate_ssrf_url` en `content_fetcher.py`. Rechaza scheme no-https, IPs privadas/reservadas. Lecturas de `parsed.scheme`/`parsed.hostname` dentro del `try` para capturar `ValueError` de URLs malformadas.

**Contrato de tendencia:** backend retorna `"mejoro"` | `"estable"` | `"empeoro"` sin tildes. `types/api.ts` debe espejarlo exactamente — si no, los comparadores nunca matchean en runtime.

**`vite-env.d.ts` en Prettier ignore:** Prettier elimina la directiva `/// <reference>` y rompe `tsc -b`. El archivo debe estar siempre en `.prettierignore`.

**`--reload-dir .` en uvicorn:** En Windows, uvicorn con `--reload` sin `--reload-dir` no detecta cambios. Es obligatorio.

**`taskkill` antes de uvicorn:** procesos Python en Windows no siempre liberan el puerto 8000. Sin `taskkill`, el nuevo servidor no arranca o arranca en el proceso viejo.

---

## Deploy

Deploy: Vercel (frontend) + Render (backend). Ver `docs/deploy.md`.

## Deuda técnica conocida

- Las tablas `config_versions`, `rules`, `rule_tags` existen en DB pero no se usan (legacy de v1) — no se eliminan para no correr DDL destructivo en producción.
