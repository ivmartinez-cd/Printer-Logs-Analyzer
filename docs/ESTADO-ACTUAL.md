# Estado actual de la aplicación — HP Logs Analyzer

Documento que describe qué hace la app hoy y cómo está implementado.

Última actualización: 2026-04-13 (Integración Insight SDS, unificación visual, fix modales)

---

## 1. Qué hace la app

Herramienta web interna para analizar logs de impresoras HP: seleccionar modelo, pegar el log, ver incidentes agrupados por código, advertencias de consumibles, diagnóstico con IA, SDS match y eventos detallados.

**Flujo del usuario:**
1. Abrir modal "Pegar logs HP" y **seleccionar el modelo de impresora** (obligatorio). Si el modelo no está, hacer click en "+ Cargar nuevo modelo (PDF)" y subir el PDF del Service Cost Data oficial — los modelos y consumibles se extraen con IA (Claude Haiku).
2. Pegar el log y pulsar "Analizar". Se ejecutan en paralelo `POST /parser/preview` y `POST /parser/validate`.
3. Si hay **códigos nuevos** (no en catálogo), aparece la sección para agregarlos uno a uno o ignorarlos.
4. Opcional: agregar un **SDS Engineering Incident** u observar el Troubleshooting de pasos oficiales y FRUs si el el modelo cuenta con la ingesta y extracción del **CPMD** oficial (Control Panel Message Document).
5. **Insight SDS (Real-time)**: El panel de alertas del portal SDS consulta en vivo el estado y el historial de alertas del dispositivo si se ingresó el número de serie.
6. Ver KPIs, Diagnóstico con IA, SDS panel, Estado de consumibles, gráficos, tablas y contenido enriquecido — todo filtrable.

---

## 2. Arquitectura general

Monorepo: frontend React/TypeScript (`frontend/`) + backend Python/FastAPI (`backend/`) conectados por REST.

```
Printer-Logs-Analyzer/
├── package.json                  # Scripts raíz (dev, lint, typecheck, test:*)
├── backend/
│   ├── interface/api.py          # FastAPI — todos los endpoints
│   ├── interface/auth.py         # Autenticación x-api-key
│   ├── domain/entities.py        # Pydantic models (Event, Incident, ConsumableWarning…)
│   ├── application/
│   │   ├── parsers/log_parser.py
│   │   └── services/
│   │       ├── analysis_service.py
│   │       ├── compare_service.py
│   │       ├── consumable_warning_service.py
│   │       └── insight_service.py
│   ├── infrastructure/
│   │   ├── config.py
│   │   ├── content_fetcher.py
│   │   ├── database.py
│   │   ├── fallback/error_codes_seed.json
│   │   └── repositories/
│   │       ├── error_code_repository.py
│   │       ├── saved_analysis_repository.py
│   │       └── printer_model_repository.py
│   ├── migrations/               # 6 migraciones SQL (001–005 ejecutadas; 006 pendiente en Neon)
│   └── tests/                    # pytest — 78 tests
└── frontend/
    ├── src/pages/DashboardPage.tsx
    ├── src/components/           # Ver tabla de componentes más abajo
    ├── src/hooks/                # useAnalysis, useModals, useDateFilter, useExportPdf
    ├── src/services/api.ts
    ├── src/types/api.ts
    └── src/__tests__/            # vitest — 93 tests
```

---

## 3. Backend

### 3.1 Parsing

`LogParser` en `application/parsers/log_parser.py`. Normaliza `\s{2,}` → `\t` antes de parsear. Soporta meses en español. Tolera hasta 2 líneas en blanco antes del header. Líneas malformadas → `ParserError` sin detener el proceso.

### 3.2 Análisis

`AnalysisService` agrupa por código → un `Incident` por código. Severity: máximo de eventos. `global_severity`: máximo de todos.

### 3.3 Consumable warnings

`compute_consumable_warnings(events, consumables, max_counter)` en `consumable_warning_service.py`. Retorna `List[ConsumableWarning]` ordenada por status (`replace` → `warning` → `ok`) y luego `usage_pct` desc.

**Exclusiones:** se omiten toners (`category == "toner"`), rodillos ADF (descripción contiene "adf", "document feeder" o "automatic document feeder", case-insensitive) y consumibles 110V (descripción contiene "110v"). El contador de páginas no mide el desgaste de toners y ADF; los consumibles 110V no aplican en Argentina (solo 220V). Constantes `ADF_DESCRIPTION_PATTERNS` y `VOLTAGE_EXCLUSION_PATTERNS` al inicio del módulo. La función `_is_excluded_by_description` chequea ambos grupos.

Thresholds: ≥100% → `replace`, ≥80% → `warning`, <80% → `ok`. Patrones de código soportan wildcard `z` (cualquier dígito hex). El panel es aviso para verificar historial — no orden de reemplazo.

### 3.4 Modelos de impresora y CPMD

- `GET /printer-models` — lista modelos disponibles. (incluye bandera de disponibilidad bool has_cpmd).
- `POST /printer-models/upload-pdf` — recibe PDF multipart, extrae modelos y consumibles con Claude Haiku (`max_tokens=16000`), persiste en DB.
- `POST /models/{id}/cpmd` — endpoint de Ingesta para extraer soluciones de fallos (pasos técnicos de solución, causas y refacciones FRU) de un CPMD referenciado por modelo.
- Script de CLI `ingest_cpmd`: Para saltar el límite de timeout del Render (30 segs gratuitos), se puede cargar extracciones CPMD procesadas por AI mediante CLI tools locales.

### 3.5 Diagnóstico con IA

`POST /analysis/ai-diagnose` — recibe incidentes, llama a Claude Haiku, retorna diagnóstico estructurado en secciones DIAGNÓSTICO / ACCIÓN / PRIORIDAD.

### 3.6 Integración Insight SDS

`insight_service.py` en `application/services/`. Maneja autenticación JWT (con caché de 23h) y consulta de `/alerts/current` e `/history`. Proxy seguro para evitar exponer credenciales en el cliente.

### 3.7 Comparación de snapshots

`compare_service.py` retorna `"mejoro"` | `"estable"` | `"empeoro"` (sin tildes).

### 3.8 API endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Estado del servidor y modo de BD |
| POST | `/parser/preview` | Parse + análisis + enriquecimiento + consumable warnings |
| POST | `/parser/validate` | Detecta códigos nuevos sin analizar |
| POST | `/error-codes/upsert` | Crear/actualizar código en catálogo |
| GET | `/printer-models` | Lista modelos de impresora |
| POST | `/printer-models/upload-pdf` | Extraer modelos de un PDF con IA |
| POST | `/models/{id}/cpmd` | Ingestar de forma estructurada via AI los pasos de troubleshooting en un pdf oficial CPMD |
| GET | `/models/{model_id}/error-solutions/{code}` | Recuperar pasos / causa de error CPMD especifico |
| POST | `/analysis/ai-diagnose` | Diagnóstico con Claude Haiku |
| POST | `/saved-analyses` | Guardar snapshot |
| GET | `/saved-analyses` | Listar snapshots |
| GET | `/saved-analyses/{id}` | Detalle de snapshot |
| DELETE | `/saved-analyses/{id}` | Eliminar snapshot |
| POST | `/saved-analyses/{id}/compare` | Comparar log nuevo vs snapshot |
| GET | `/insight/devices/{serial}/alerts` | Proxy de alertas SDS en tiempo real |

Rate limiting (slowapi, por IP): preview y validate → 60/min; upsert → 30/min.

### 3.9 DB fallback

Switch automático a JSON local cuando PostgreSQL no está disponible. `threading.Lock()` evita race conditions. `/health` reporta `db_mode: "local_fallback"`.

### 3.10 Resiliencia de conexiones (Neon idle timeout)

`database.py` → `connect()` hace un **pre-ping** (`SELECT 1`) sobre cada conexión obtenida del pool antes de cederla al caller. Si la conexión fue cerrada por Neon durante idle, se descarta (`putconn(close=True)`) y se reintenta hasta 3 veces. `psycopg2.pool.PoolError` (pool exhausto) lanza `DatabaseUnavailableError` de inmediato sin reintentar. `rollback()` y `putconn()` en el finally están guardados con `try/except` para no propagar `InterfaceError` cuando la conexión ya estaba muerta.

---

## 4. Frontend

### 4.1 Orden de paneles en el dashboard

1. `DashboardHeader` — logo, logFileName, botones de acción, LiveClock, DbStatusBadge
2. `KPICards` — 4 KPIs: errores/warnings/info, incidencias activas, último error, tasa de errores
3. `AIDiagnosticPanel` — panel con acento violeta, colapsado por default, diagnóstico on demand
4. `InsightAlertsPanel` — panel con acento azul/celeste (SDS Portal), colapsado por default; requiere Serial Number
5. `SDSIncidentPanel` — panel con acento azul, colapsado por default; sección "Verificar historial de consumibles" si hay overlap con consumibles
6. `ConsumableWarningsPanel` ("Estado de consumibles") — panel con acento ámbar/rojo, colapsado, solo si `warnings.length > 0`
7. `DateRangePicker` — botón + popover con 8 presets y calendario de rango libre
8. `IncidentsChart` — AreaChart eventos/hora con toggles de severidad
9. `TopErrorsChart` — BarChart top 10 códigos; toggles ERROR/WARNING/INFO (los 3 activos por default)
10. `IncidentsTable` — agrupada por código, expandible, sort, filtro, búsqueda
11. `EventsTable` — colapsada por default, todos los eventos crudos

### 4.2 Componentes

| Componente | Propósito |
|------------|-----------|
| `DashboardHeader.tsx` | Header principal con acciones |
| `KPICards.tsx` | 4 KPIs de salud del log |
| `AIDiagnosticPanel.tsx` | Diagnóstico IA colapsado; llama a `/analysis/ai-diagnose` on demand |
| `InsightAlertsPanel.tsx` | Alertas en tiempo real desde el portal SDS; requiere Serial Number |
| `SDSIncidentPanel.tsx` | Match SDS vs log; sección "Verificar historial de consumibles" si hay overlap con consumibles (prop `consumableWarnings?`) |
| `ConsumableWarningsPanel.tsx` | "Estado de consumibles" — tabla con texto introductorio; solo si hay warnings; colapsado; acento ámbar o rojo si hay `replace` |
| `DateRangePicker.tsx` | Picker unificado con presets y rango libre; popover alineado a la derecha |
| `IncidentsChart.tsx` | AreaChart por hora con toggles de severidad y tooltip con códigos |
| `TopErrorsChart.tsx` | BarChart top 10 códigos; tres toggles activos por default |
| `IncidentsTable.tsx` | Tabla principal de incidencias expandibles |
| `EventsTable.tsx` | Eventos crudos, colapsada por default |
| `AddCodeToCatalogModal.tsx` | Agregar/editar código del catálogo |
| `AddPrinterModelModal.tsx` | Subir PDF de Service Cost Data para extraer modelos con IA |
| `UploadCpmdModal.tsx` | Modal con UI de form para subir un archivo Manual CPMD que complemente un modelo de impresoras |
| `SaveIncidentModal.tsx` | Guardar snapshot con nombre y equipment identifier |
| `SDSIncidentModal.tsx` | Pegar SDS y parsear → SdsIncidentData |
| `SavedAnalysisList.tsx` | Lista de snapshots con búsqueda y evolución por equipo |
| `EquipmentTimeline.tsx` | LineChart evolución de errores por equipo |
| `SavedAnalysisDetail.tsx` | Detalle de snapshot y comparación |
| `SolutionContentModal.tsx` | Muestra contenido de solución refactorizado a formato Tabs (Pestaña SDS y Pestaña CPMD). |
| `HelpModal.tsx` | Ayuda con 9 secciones en orden de aparición en pantalla |
| `ConfirmModal.tsx` | Modal de confirmación genérico |
| `Toast.tsx` | Renderer de notificaciones (consume ToastContext) |

**Comportamiento de modales:** todos los modales se cierran exclusivamente con el botón `×` o los botones "Cancelar" / "Cerrar" / "Entendido". El click en el overlay exterior no cierra el modal.

### 4.3 Paneles colapsables — shell unificado

Los paneles colapsables comparten la clase CSS `.collapsible-panel` definida en `index.css`. El color del borde izquierdo varía por modificador:

| Panel | Clase | Color |
|-------|-------|-------|
| Diagnóstico con IA | `collapsible-panel--ai` | Violeta `#8b5cf6` |
| Insight SDS | `collapsible-panel--insight` | Celeste `#0ea5e9` |
| SDS Engineering Incident | `collapsible-panel--sds` | Azul `#3b82f6` |
| Estado de consumibles (sin alertas críticas) | `collapsible-panel--consumable` | Ámbar `#d97706` |
| Estado de consumibles (hay `replace`) | `collapsible-panel--alert` | Rojo `#ef4444` |

Clases comunes: `__header` (botón toggle), `__title`, `__chevron` + `__chevron--expanded` (rotación CSS 90°), `__body` (padding del contenido).

### 4.4 Hooks

| Hook | Responsabilidad |
|------|----------------|
| `useAnalysis` | Estado y handlers: `loading`, `result`, `pendingResult`, `codesNew`, `handleAnalyze`, `commitPendingResult`, `handleSaveCodeToCatalog`, `handleSaveIncident` |
| `useModals` | 11 estados de modales |
| `useDateFilter` | `DateFilter = null \| "YYYY-MM-DD" \| { start, end }`. Funciones puras: `filterEventsByDate`, `filterIncidentsByDate`, `getWeekRange`, etc. |
| `useExportPdf` | PDF A4 con html2canvas + jsPDF; exporta AI panel (si generado), KPIs, BarChart, tabla |

### 4.5 Flujo de análisis

1. `LogPasteModal` en `DashboardPage`: selección de modelo (obligatorio) + textarea + botón "Analizar".
2. `handleAnalyze()` → `Promise.all([POST /parser/preview, POST /parser/validate])`.
3. Respuesta en `pendingResult` / `pendingCodesNew`.
4. `ConfirmModal` "¿Agregar incidente SDS?" → `SDSIncidentModal` o directo.
5. `commitPendingResult()` mueve `pendingResult` → `result`, muestra dashboard.

### 4.6 DateRangePicker

Reemplazó a `DateFilterBar`. Un solo botón que abre un popover con:
- 8 presets: Todo el período, Hoy, Esta semana, Semana anterior, Este mes, Mes anterior, Últimos 7 días, Últimos 30 días.
- Calendario interactivo para rango libre (click en dos días → "Aplicar").
- Cancelar o click fuera descarta sin cambiar el filtro activo.
- Popover alineado a `right: 0` para no salirse del viewport.

### 4.7 SDS match

`SDSIncidentPanel` usa tres fuentes de tokens para el match:
1. `event_context` — código primario (ej. `"60.00.02"`).
2. `more_info` — tokens separados por `" or "` (ej. `"60.00.02 or 60.01.02"`).
3. `sds.code` — incluido cuando es un identificador CamelCase sin puntos ni dígitos y produce ≥1 keyword significativa (ej. `"ReplaceTrayPickRollers"`). Excluye IDs internos con números (ej. `"TriageInput2"`) y tokens de solo stopwords.

Cada token se despacha por `sdsTokenMatchesIncident`:

- **Código numérico** (token contiene `.`): `incidentCodeMatchesSds` con wildcard `z`. Ej. `53.B0.0z` coincide con `53.B0.01`…`53.B0.0F`.
- **Identificador de mensaje** (token sin `.`): `extractSdsKeywords(token)` tokeniza por CamelCase → lowercase → singular básico → descarta `SDS_STOPWORDS`. Si al menos `MIN_KEYWORD_MATCHES = 1` keyword aparece en la `classification` del incidente (normalizada sin espacios/guiones), es match. Ej. `"ReplaceTrayPickRollers"` → keywords `["tray","pick","roller"]` → coincide con `"Tray Z feed roller at end of life."`.

`SDS_STOPWORDS`: `replace`, `check`, `clean`, `verify`, `reset`, `the`, `a`.

Status `'general'` solo cuando los tres campos (`event_context`, `more_info`, `sds.code`) están vacíos o no producen tokens válidos.

---

## 5. Persistencia

| Qué | Dónde | Estado |
|-----|-------|--------|
| Catálogo de códigos | PostgreSQL `error_codes` | Activo |
| Snapshots guardados | PostgreSQL `saved_analyses` | Activo |
| Modelos de impresora | PostgreSQL `printer_models`, `printer_consumables`, `consumable_related_codes` | Migración 006 pendiente en Neon |
| Contenido HTML de soluciones | Columna `solution_content` en `error_codes` | Activo |

Fallback automático a JSON local en `backend/data/` cuando PostgreSQL no está disponible.

---

## 6. Tests

| Suite | Herramienta | Tests |
|-------|-------------|-------|
| Frontend (hooks + componentes) | vitest | 93 |
| Backend | pytest | 78 |

Frontend: `vitest.config.ts` con `environment: node`; tests de componentes declaran `// @vitest-environment jsdom`. Backend: tests en `backend/tests/`; sin `DB_URL` → fallback JSON automático.

---

## 7. Migraciones SQL

| Archivo | Contenido | Estado en Neon |
|---------|-----------|---------------|
| `001_init.sql` | Tablas legacy (`config_versions`, `audit_log`, `rules`, `rule_tags`) | Ejecutada |
| `002_add_rules_and_rule_tags.sql` | Continuación de 001 | Ejecutada |
| `003_create_error_codes.sql` | Tabla `error_codes` con UNIQUE(code) | Ejecutada |
| `004_create_saved_analyses.sql` | Tabla `saved_analyses` con JSONB | Ejecutada |
| `005_add_solution_content.sql` | `ALTER TABLE error_codes ADD COLUMN solution_content TEXT` | Ejecutada |
| `006_create_printer_models.sql` | `printer_models`, `printer_consumables`, `consumable_related_codes`; `ALTER TABLE saved_analyses ADD COLUMN model_id UUID` | Pendiente |
| `007_create_error_solutions.sql` | Esquema CPMD solutions | Pendiente |

---

## 8. Resumen rápido

| Área | Estado actual |
|------|--------------|
| Parsing logs | Estable — normalización espacios, meses español, tolerancia a blank lines |
| Modelos de impresora | Fase 4 completa — selector obligatorio, upload PDF con Haiku, banderas has_cpmd globales |
| CPMD (Troubleshooting) | Modal disponible, ingest CLI script, refactor backend para parsing vía tags semánticos LLM (claude-haiku) y separación lógica a Tabs con Componentes dedicados |
| Estado de consumibles | Activo — `ConsumableWarningsPanel` (excluye toners, ADF y 110V); badges orientados a historial |
| Diagnóstico con IA | Activo — `AIDiagnosticPanel` colapsado, Claude Haiku, secciones DIAGNÓSTICO/ACCIÓN/PRIORIDAD |
| SDS Engineering Incident | Activo — match numérico (wildcard `z`), por mensaje (normalizado) y por keywords CamelCase desde `sds.code`; tres fuentes de tokens |
| Integración Insight SDS | Activo — alertas en tiempo real (activas/historia) vía proxy seguro; requiere Serial Number |
| Paneles colapsables | Unificados — shell `.collapsible-panel` compartido; color por modificador (`--ai`, `--sds`, `--consumable`, `--alert`, `--insight`) |
| Modales | Correcto — solo se cierran con botón explícito; overlay no cierra |
| Filtros de fecha | DateRangePicker — 8 presets + rango libre con calendario |
| Gráficos | IncidentsChart (AreaChart) + TopErrorsChart (BarChart top 10, toggles activos por default) |
| Catálogo de códigos | Activo — upsert con fetch de HTML, fallback si link expira |
| Incidentes guardados | Activo — snapshots, comparación (mejoró/estable/empeoró), evolución por equipo |
| Exportar PDF | Activo — AI panel (si generado), KPIs, BarChart, tabla de incidencias |
| DB fallback | Activo — JSON local automático cuando PostgreSQL no disponible |
| Deploy | Vercel (frontend) + Render (backend) + Neon (PostgreSQL) |
