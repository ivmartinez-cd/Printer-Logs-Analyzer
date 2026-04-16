# CLAUDE.md

Guidance for Claude Code when working in this repository.

---

## Estilo de Comunicación
- **Brevedad Extrema:** Respuestas cortas. Prioriza código o pasos de acción. Solo leo la parte donde pides algo (para ahorrar tokens).
- **Calidad ante todo (OBLIGATORIO):** Ejecutar `npm run typecheck` y los tests pertinentes (`test:frontend` / `test:backend`) después de **CADA** cambio y antes de cada commit. No subir código con errores.
- **Sin Resúmenes:** No volver a resumir contenido de artefactos generados.

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

### Docker

```bash
# Desde la raíz del repo
docker compose up --build

# Backend:  http://localhost:8000
# Frontend: http://localhost:5173
```

### Lint, tests y typecheck

```bash
# Desde la raíz
npm run lint           # ESLint en frontend/src
npm run typecheck      # tsc --noEmit en frontend
npm run format         # Prettier --write src (frontend)
npm run test:frontend  # vitest run (happy-dom)
npm run test:backend   # pytest backend/tests/ -v

# Linting Python
ruff check backend
ruff check backend --fix
```

---

## Arquitectura

Monorepo: React/TypeScript frontend + Python/FastAPI backend, conectados por REST.

```
Printer-Logs-Analyzer/
├── package.json                  # Scripts root (dev, lint, typecheck, test:*)
├── dev.cmd                       # Script de arranque rápido (Windows)
├── docker-compose.yml            # Orquesta backend + frontend en contenedores
├── docs/                         # Documentación y assets
│   ├── CHANGELOG.md              # Historial de versiones y hitos
│   ├── ESTADO-ACTUAL.md          # Situación técnica detallada
│   ├── vision.md                 # Visión del producto
│   ├── deploy.md                 # Guía de deploy (Vercel + Render)
│   └── git-workflow.md           # Convenciones de branching
├── samples/                      # Logs de muestra (TSV), HTML de portales, CSVs
├── scripts/                      # POCs, batch files y utilitarios de extracción
├── backend/
│   ├── main.py                   # Entrypoint uvicorn local
│   ├── requirements.txt
│   ├── ruff.toml                 # Configuración Ruff (linting Python)
│   ├── Dockerfile
│   ├── interface/
│   │   ├── api.py                # FastAPI factory — orquesta routers y middleware
│   │   ├── auth.py               # Dependencia auth por API key (x-api-key header)
│   │   ├── deps.py               # Inyección de dependencias (repos, servicios)
│   │   ├── exception_handlers.py # Handlers globales de error
│   │   ├── rate_limiter.py       # slowapi limiter
│   │   ├── utils.py              # Helpers (enrich_events, normalize_log_text)
│   │   ├── routers/
│   │   │   ├── analysis.py       # POST /parser/preview + /parser/validate
│   │   │   ├── sds.py            # GET /sds/resolve-device, POST /sds/extract-logs, GET /insight/*
│   │   │   ├── ai.py             # POST /analysis/ai-diagnose (rate: 5/min)
│   │   │   ├── saved_analysis.py # CRUD /saved-analyses + /compare
│   │   │   ├── printers.py       # /printer-models, /upload-pdf, /models/{id}/cpmd
│   │   │   └── error_codes.py    # /error-codes/upsert y consultas
│   │   └── schemas/              # Pydantic I/O schemas por dominio
│   ├── domain/entities.py        # Modelos Pydantic (Event, EnrichedEvent, Incident, …)
│   ├── application/
│   │   ├── parsers/log_parser.py # Parser TSV/espacios con soporte de meses en español
│   │   └── services/
│   │       ├── sds_web_service.py          # CORE: login SDS, búsqueda y extracción HTML→TSV
│   │       ├── insight_service.py          # API Insight HP (alertas, consumibles, contadores)
│   │       ├── ai_diagnosis_service.py     # Claude Opus 4.6 — JSON estructurado + prompt caching
│   │       ├── analysis_service.py         # Agrupación por código, severidades, URLs catálogo
│   │       ├── compare_service.py          # Tendencia mejoró/estable/empeoró
│   │       ├── cpmd_extractor.py           # Extractor regex de bloques CPMD
│   │       ├── cpmd_ingest.py              # Pipeline híbrido: regex + LLM fallback
│   │       ├── cpmd_parser.py              # Parser de secciones CPMD
│   │       ├── cpmd_structured_extractor.py
│   │       └── pdf_extraction_service.py   # Extracción Service Cost Data desde PDF
│   ├── infrastructure/
│   │   ├── config.py             # Settings (SDS_WEB_*, DB_URL, ANTHROPIC_API_KEY, etc.)
│   │   ├── content_fetcher.py    # validate_ssrf_url + fetch_solution_content
│   │   ├── database.py           # psycopg2 con pool, pre-ping y fallback automático
│   │   ├── fallback/             # error_codes_seed.json para modo offline
│   │   └── repositories/
│   │       ├── base_repository.py          # BaseRepository genérico
│   │       ├── error_code_repository.py
│   │       ├── error_solution_repository.py
│   │       ├── printer_model_repository.py
│   │       └── saved_analysis_repository.py
│   ├── migrations/               # SQL 001–007 + carga_cpmd_626xx.sql + printer_models.json
│   └── tests/                    # 19 suites pytest (análisis, parsers, endpoints, repos)
└── frontend/
    ├── Dockerfile
    ├── vite.config.ts            # manualChunks optimizados
    ├── vitest.config.ts          # happy-dom
    ├── .prettierrc               # Reglas de formato
    └── src/
        ├── pages/DashboardPage.tsx        # Orquestador principal (deep linking, flujo completo)
        ├── components/                    # 28 componentes
        │   ├── LogPasteModal.tsx          # UI dual: pegar log o extraer por serial
        │   ├── AIDiagnosticPanel.tsx      # Panel ejecutivo IA (JSON estructurado)
        │   ├── ExecutiveSummary.tsx       # Resumen ejecutivo para PDF
        │   ├── InsightAlertsPanel.tsx     # Alertas vivas del portal
        │   ├── SDSIncidentPanel.tsx       # Engineering Incident match
        │   ├── ConsumableWarningsPanel.tsx
        │   ├── IncidentsTable.tsx
        │   ├── IncidentsChart.tsx
        │   ├── KPICards.tsx
        │   ├── HelpModal.tsx
        │   └── ...
        ├── hooks/
        │   ├── useAnalysis.ts            # Orquesta llamadas API y estado de análisis
        │   ├── useDateFilter.ts          # Filtro de fechas con presets
        │   ├── useExportPdf.ts           # Generación PDF A4 en modo Light
        │   ├── useInsightData.ts         # Datos Insight en tiempo real
        │   └── useModals.ts
        ├── services/api.ts               # Cliente HTTP tipado (todos los endpoints)
        ├── store/                        # Estado global (Zustand o Context)
        ├── types/                        # TypeScript interfaces de dominio
        └── contexts/ToastContext.tsx
```

---

## Backend

### Domain models (`domain/entities.py`)

Todos los modelos son Pydantic con `model_config = {"frozen": True}`.

**Event:** `type` (ERROR|WARNING|INFO), `code`, `timestamp`, `counter`, `firmware`, `help_reference`

**EnrichedEvent(Event):** extiende con `code_severity`, `code_description`, `code_solution_url`, `code_solution_content`. Es el tipo que circula en toda la capa de aplicación.

**Incident:** `id` (`"{code}-{start_time.isoformat()}"`), `code`, `classification`, `severity`, `severity_weight`, `occurrences`, `start_time`, `end_time`, `counter_range`, `events: List[EnrichedEvent]`, `sds_link`, `sds_solution_content`

**RealtimeConsumable:** `type`, `description`, `sku`, `percentLeft`, `pagesLeft`, `daysLeft`. Datos directos de Insight HP.

**ExtractSdsLogsResponse:** `serial`, `device_id`, `model_name_sds`, `firmware`, `suggested_model_id`, `has_cpmd`, `logs_text`, `event_count`, `realtime_consumables`.

**ResolveDeviceResponse:** `serial`, `device_id`, `model_name_sds`, `firmware`, `suggested_model_id`, `suggested_model_name`, `has_cpmd`.

### Parser (`application/parsers/log_parser.py`)

Formato de entrada: TSV o espacios múltiples (normaliza `\s{2,}` → `\t`). Soporta meses en español.

### SDS Web Service (`application/services/sds_web_service.py`)

**SERVICIO CRÍTICO**: Login automatizado al portal HP SDS, búsqueda por serial y extracción del HTML de eventos. Convierte HTML → TSV compatible con el parser.

### Insight Service (`application/services/insight_service.py`)

Consulta la API oficial HP Insight para: `get_device_info`, `get_device_alerts`, `get_device_consumables`, `get_device_meters`. Usa JWT + API Key/Secret.

### AI Diagnosis Service (`application/services/ai_diagnosis_service.py`)

- **Modelo:** `claude-opus-4-6`
- **Precios (Abril 2026):** input $15/M, output $75/M, cache write $18.75/M, cache read $1.50/M
- Usa **prompt caching** (`cache_control: ephemeral`) sobre el system prompt.
- Retorna **JSON estructurado:** `{diagnostico, acciones[], prioridad, impacto}`
- Fallback robusto: strip markdown fences + extracción regex si el modelo no devuelve JSON puro.

### CPMD Pipeline (`application/services/cpmd_ingest.py`)

Pipeline híbrido para ingerir manuales de servicio:
1. **regex de alta confianza** — extrae bloques estructurados sin costo IA
2. **LLM fallback** — Claude solo para bloques ambiguos
3. Upsert por hash para evitar duplicados

### DB fallback (offline / firewall corporativo)

Switch automático a JSON local (`backend/data/`) cuando PostgreSQL no está disponible. `threading.Lock()` evita race conditions.

---

## Frontend

### DashboardPage.tsx

Orquesta estado global y flujo completo. Gestiona deep linking vía URL `/:serial`. Flujo: `LogPasteModal` → Confirmación → Dashboard principal.

### Deep Linking

Acceso directo: `https://printer-logs-analyzer.vercel.app/CNXXXXXXXX`. La app detecta el serial en la ruta, llama a `GET /sds/resolve-device`, resuelve el modelo y extrae los logs automáticamente.

### LogPasteModal.tsx

UI dual con dos tabs:
1. **Pegar log manualmente** — área de texto + selector de modelo.
2. **Extracción automática** — ingresás el serial, el sistema hace Login → Search → Resolve → Fetch → Analyze.

El modelo es opcional cuando hay serial (se resuelve automáticamente desde SDS).

### AIDiagnosticPanel.tsx

Panel ejecutivo colapsable. Renderiza el JSON estructurado del backend con badges de prioridad (`alta/media/baja`) y lista de acciones numeradas.

### useExportPdf.ts

Genera reportes PDF A4 profesionales. Fuerza modo Light, oculta filtros y botones de expansión, incluye todos los paneles generados (ExecutiveSummary, KPIs, IA, gráficos, tabla).

---

## Decisiones técnicas importantes

- **`vite-env.d.ts` en Prettier ignore:** Prettier elimina la directiva `/// <reference>` y rompe `tsc -b`. Mantenlo siempre en `.prettierignore`.
- **`--reload-dir .` en uvicorn:** Obligatorio en Windows para detectar cambios en subdirectorios.
- **`taskkill` antes de uvicorn:** Crucial para liberar el puerto 8000 en reinicios rápidos en Windows.
- **Rate limits:** AI diagnose: 5/min. Insight alerts: 30/min. Insight meters: 20/min. Parser: 60/min.
- **CORS:** Solo permite `https://printer-logs-analyzer.vercel.app`, `localhost:5173` y `localhost:5174`.
- **BaseRepository:** Patrón genérico en `infrastructure/repositories/base_repository.py`. Todos los repos lo extienden.
- **Fallback prioridad:** Si PostgreSQL no responde en el pool pre-ping, todos los repos usan JSON local automáticamente.

---

## Lineamientos de Diseño Ejecutivo (Premium)

- **Aesthetics:** Glassmorphism (`backdrop-filter: blur(12px)`), gradientes 135deg, bordes sutiles.
- **DB Connection Badge:**
  - **Conectando (Naranja):** `.db-status-badge--connecting` (`#fbbf24`) + spinner.
  - **Conectada (Verde):** `#4ade80`.
  - **Offline (Rojo):** `#f87171`.
- **Botones Ejecutivos:** Usar siempre `.dashboard__btn--executive` para acciones principales en la landing.
- **Typography:** system-ui con jerarquía clara y pesos semibold para títulos técnicos.
- **AI Panel:** Badges de prioridad coloreados (rojo/amarillo/verde), layout de tarjeta premium.

### Mandato de Estabilidad (Zero-Failure Policy)

Verificar después de **cada** cambio antes de commit:

1. **Frontend Typecheck:** `npm run typecheck` — si falla, Vercel deploy falla.
2. **Backend Tests:** `npm run test:backend` (pytest).
3. **Frontend Tests:** `npm run test:frontend` (vitest).
4. **Linting Python:** `ruff check backend`.
5. **Consistencia de Props:** Si cambiás una interfaz en `types/`, buscá todas las referencias. No dejar props obsoletas.
