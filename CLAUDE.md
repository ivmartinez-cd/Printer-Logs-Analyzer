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

No hay comandos de lint ni tests — no existe suite de tests todavía.

---

## Arquitectura

Monorepo: React/TypeScript frontend + Python/FastAPI backend, conectados por REST.

```
Printer-Logs-Analyzer/
├── .env                          # Variables de entorno (DB_URL, API_KEY, etc.)
├── package.json                  # Scripts root (dev, dev:frontend, dev:backend)
├── backend/
│   ├── interface/api.py          # FastAPI app, todos los endpoints
│   ├── domain/entities.py        # Pydantic models (Event, Incident, AnalysisResult)
│   ├── application/
│   │   ├── parsers/log_parser.py         # Parser TSV/espacios con soporte español
│   │   └── services/
│   │       ├── analysis_service.py       # Agrupa eventos por código → Incident
│   │       └── compare_service.py        # Compara dos snapshots → tendencia
│   ├── infrastructure/
│   │   ├── config.py                     # Settings desde .env (Pydantic)
│   │   ├── database.py                   # psycopg2, timeout 5s, DatabaseUnavailableError
│   │   ├── fallback/error_codes_seed.json  # Catálogo bundled (read-only)
│   │   └── repositories/
│   │       ├── error_code_repository.py      # CRUD error_codes (DB + JSON fallback)
│   │       └── saved_analysis_repository.py  # CRUD saved_analyses (DB + JSON fallback)
│   ├── migrations/               # 5 migraciones SQL (correr manualmente)
│   ├── data/                     # Gitignored — JSON local en modo fallback
│   └── requirements.txt          # fastapi, uvicorn, psycopg2-binary, httpx, beautifulsoup4, etc.
└── frontend/
    ├── src/
    │   ├── pages/DashboardPage.tsx   # UI principal (~2000 líneas, componente monolítico)
    │   ├── components/               # Modales y paneles
    │   ├── services/api.ts           # Cliente HTTP typed, inyecta x-api-key
    │   ├── types/api.ts              # Interfaces TS que espejean los modelos Pydantic
    │   └── contexts/ToastContext.tsx # Notificaciones globales
    └── package.json                  # React 18.3, Recharts 2.13, Vite 5.4
```

---

## Backend

### Domain models (`domain/entities.py`)

Todos los modelos son Pydantic con `model_config = {"frozen": True}`.

**Event:**
- `type`: `ERROR | WARNING | INFO`
- `code`: string (ej. `53.B0.02`)
- `timestamp`: datetime
- `counter`: int
- `firmware`: str | None
- `help_reference`: str | None
- `code_severity`, `code_description`, `code_solution_url`, `code_solution_content`: del catálogo

**Incident:**
- `id`: `"{code}-{start_time.isoformat()}"`
- `code`, `classification` (del catálogo o el código), `severity`, `severity_weight`
- `occurrences`, `start_time`, `end_time`, `counter_range`, `events`
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

**CORS** — orígenes permitidos: `localhost:5173`, `127.0.0.1:5173`, `localhost:5174`, `127.0.0.1:5174`.

**Fetch de contenido SDS** (`/error-codes/upsert`): cuando se provee `solution_url`, el backend fetchea el HTML de la página con `httpx` (timeout 15 s, límite 50 KB), lo extrae con `BeautifulSoup`, y lo guarda en `solution_content`. Esto permite mostrar el contenido aunque el link HP expire.

**Límites:** logs hasta 2 millones de caracteres.

### DB fallback (offline / firewall corporativo)

Cuando PostgreSQL no está disponible, la app continúa funcionando:

- `Database.connect()` lanza `DatabaseUnavailableError` en cualquier `OperationalError` (timeout 5 s)
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

**Backend (`.env` en raíz):**
```
DB_URL=postgresql://...     # Neon/PostgreSQL
API_KEY=...                 # Simple auth (mismo valor en VITE_API_KEY)
RECENCY_WINDOW=3600         # Declarado en Settings pero no usado activamente
MAX_CONCURRENT_ANALYSIS=5   # Declarado en Settings pero no usado activamente
ANALYSIS_TIMEOUT=30         # Declarado en Settings pero no usado activamente
```

**Frontend (`frontend/.env`):**
```
VITE_API_KEY=dev
VITE_API_BASE=http://localhost:8000    # También acepta VITE_API_URL (compatibilidad)
```

---

## Frontend

### DashboardPage.tsx (página única)

Componente monolítico (~2000 líneas). Contiene toda la lógica de UI.

**Vistas:** controladas por `viewMode`: `dashboard` | `saved-list` | `saved-detail`

**Flujo principal:**
1. Usuario pega logs o sube archivo en `LogPasteModal`
2. `handleAnalyze()` → `POST /parser/preview` + `POST /parser/validate`
3. Respuesta: `{ events[], incidents[], global_severity, errors[] }`
4. Render: AreaChart (eventos/hora), BarChart (top 10 códigos), tabla incidents, tabla events

**Filtros y sorting:**
- Incidents: filtro por severidad, búsqueda por texto, sort por columna (asc/desc)
- Events: ídem
- Filtro por fecha: selección de día filtra events e incidents al rango de ese día

**Helpers importantes:**
- `getIncidentTableRows(incidents, events, selectedDate)` → `IncidentRow[]` — derivado de `result`, no memoizado
- `filterIncidentsByDate`, `filterEventsByDate`, `getWindowForDate`
- `bucketEventsByHour` → datos para AreaChart
- `getTopIncidentsForChart` → top N para BarChart

**Actualización de estado post-upsert** (`handleSaveCodeToCatalog`):
Después de un upsert exitoso, se actualiza `result` directamente (sin re-fetch):
- `result.events[].code_solution_url` y `code_solution_content` para eventos con el mismo `code`
- `result.incidents[].events[]` ídem
- `result.incidents[].sds_link` y `sds_solution_content` para incidentes con el mismo `code` (crítico para el botón "Ver solución" de la fila del incidente)

El botón "Ver solución" en la tabla de incidentes lee `inc.sds_solution_content` (nivel incidente), no `inc.events[].code_solution_content`. Si solo se actualiza uno, el botón no re-renderiza.

### Componentes (`frontend/src/components/`)

| Componente | Propósito |
|------------|-----------|
| `AddCodeToCatalogModal.tsx` | Form para agregar/editar código: severity, description, solution_url |
| `SaveIncidentModal.tsx` | Form para guardar análisis: name + equipment_identifier opcional |
| `SDSIncidentModal.tsx` | Textarea para pegar incident SDS; parsea texto → `SdsIncidentData` |
| `SDSIncidentPanel.tsx` | Muestra data SDS parseada; calcula match SDS vs incidentes del log |
| `ConfirmModal.tsx` | Modal de confirmación genérico |
| `SolutionContentModal.tsx` | Muestra contenido HTML de solución guardado; link al URL (puede estar vencido) |
| `Toast.tsx` | Renderer de notificaciones (consume ToastContext) |

### Cliente HTTP (`services/api.ts`)

- `API_BASE`: `VITE_API_URL` → `VITE_API_BASE` → `http://localhost:8000`
- `API_KEY`: `VITE_API_KEY` → `dev`
- Header siempre inyectado: `x-api-key`
- Error handling: extrae `detail` del JSON de error si está disponible

### Tipos (`types/api.ts`)

Espejo de los modelos Pydantic del backend. Interfaces principales:
`Event`, `Incident`, `ParseLogsResponse`, `ValidateLogsResponse`, `ErrorCodeUpsertBody`,
`SavedAnalysisIncidentItem`, `SavedAnalysisSummary`, `SavedAnalysisFull`,
`CompareDiff`, `CompareResponse`

### Build

`vite.config.ts` usa `manualChunks`:
- `vendor-react` — React core
- `vendor-charts` — Recharts (grande; chunk separado para caché eficiente)
- `index` — código de la app

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

---

## Deuda técnica conocida

- `DashboardPage.tsx` es un componente monolítico de ~2000 líneas — debería dividirse
- `RECENCY_WINDOW`, `MAX_CONCURRENT_ANALYSIS`, `ANALYSIS_TIMEOUT` están en `Settings` pero no se usan
- Las tablas `config_versions`, `rules`, `rule_tags` existen en DB pero no se usan (legacy de v1)
- No hay tests
- No hay linting configurado
