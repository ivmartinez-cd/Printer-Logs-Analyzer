# Estado actual de la aplicación — HP Logs Analyzer

Documento que describe qué hace la app hoy y cómo está implementado.

Última actualización: 2026-04-16 (Diagnóstico IA ejecutivo · Docker · Modularización API · Pipeline CPMD híbrido)

---

## 1. Qué hace la app

Herramienta web interna para analizar logs de impresoras HP. El sistema permite identificar un equipo por número de serie, auto-detectar su modelo, extraer sus logs del portal SDS y generar un análisis completo: incidentes, consumibles, diagnóstico IA y reportes ejecutivos.

### Flujos soportados

| Flujo | Descripción |
|-------|-------------|
| **Deep Link** | `https://.../SERIALNUMBER` → la app detecta serial en URL, resuelve modelo y extrae logs automáticamente |
| **Extracción automática** | Ingresar serial en el modal → Login SDS → Search → Resolve Model → Fetch Logs → Analyze |
| **Log manual** | Seleccionar modelo + pegar log → Analizar |

### Capacidades principales

1. **Parser de logs HP** — TSV o texto con espacios múltiples, fechas en español.
2. **Extracción SDS automatizada** — login, búsqueda por serial, conversión HTML→TSV.
3. **Resolución automática de modelo** — detecta el nombre del modelo desde SDS y busca coincidencia en el catálogo.
4. **Integración Insight API HP** — alertas activas, consumibles en tiempo real, contadores/metros del dispositivo.
5. **Diagnóstico IA (Claude Opus 4.6)** — JSON estructurado: `{diagnostico, acciones[], prioridad, impacto}` con prompt caching.
6. **Catálogo de modelos y consumibles** — carga desde PDF Service Cost Data con extracción IA.
7. **Pipeline CPMD híbrido** — regex de alta confianza + Claude como fallback para ingerir manuales de servicio.
8. **Soluciones técnicas en catálogo** — pasos de reparación y FRUs por código de error desde el CPMD.
9. **SDS Engineering Incident** — match automático por tokens/keywords con comodín `z` hex.
10. **Estado de consumibles** — desde catálogo CPMD (% desgaste) y desde Insight API (% real).
11. **Resumen Ejecutivo** — panel para reportes profesionales con KPIs y severidad global.
12. **Exportación PDF A4** — modo Light, todos los paneles, sin elementos de UI innecesarios.
13. **Incidentes guardados** — snapshots con comparación temporal y gráfico de tendencia.
14. **Modo offline** — fallback automático a JSON local si PostgreSQL no está disponible.

---

## 2. Arquitectura general

```
Printer-Logs-Analyzer/
├── package.json              # Scripts raíz (177 tests be, 146 tests fe)
├── dev.cmd                   # Script de arranque rápido (Windows)
├── docker-compose.yml        # Contenedores backend (8000) + frontend (5173)
├── backend/
│   ├── interface/
│   │   ├── api.py            # FastAPI factory — routers, middleware, CORS, rate limiting
│   │   ├── auth.py           # x-api-key header auth
│   │   ├── deps.py           # Inyección de dependencias
│   │   ├── exception_handlers.py
│   │   ├── rate_limiter.py   # slowapi
│   │   ├── utils.py          # enrich_events_with_catalog, normalize_log_text
│   │   └── routers/          # analysis | sds | ai | saved_analysis | printers | error_codes
│   ├── domain/entities.py    # Pydantic models (Event, EnrichedEvent, Incident, …)
│   ├── application/
│   │   ├── parsers/log_parser.py
│   │   └── services/
│   │       ├── sds_web_service.py          # SDS login + extracción
│   │       ├── insight_service.py          # API HP Insight
│   │       ├── ai_diagnosis_service.py     # Claude Opus 4.6 + JSON estructurado
│   │       ├── analysis_service.py
│   │       ├── compare_service.py
│   │       ├── cpmd_extractor.py
│   │       ├── cpmd_ingest.py              # Pipeline híbrido (regex + LLM)
│   │       ├── cpmd_parser.py
│   │       ├── cpmd_structured_extractor.py
│   │       └── pdf_extraction_service.py
│   ├── infrastructure/
│   │   ├── config.py
│   │   ├── database.py       # psycopg2 pool + fallback automático
│   │   ├── content_fetcher.py
│   │   ├── fallback/         # error_codes_seed.json
│   │   └── repositories/     # BaseRepository + 4 implementaciones
│   ├── migrations/           # SQL 001–007 + carga_cpmd_626xx.sql
│   └── tests/                # 19 suites pytest
├── frontend/
│   ├── Dockerfile
│   └── src/
│       ├── pages/DashboardPage.tsx    # Orquestador + deep linking
│       ├── components/                # 28 componentes
│       ├── hooks/                     # useAnalysis, useDateFilter, useExportPdf, useInsightData, useModals
│       ├── services/api.ts            # Cliente HTTP tipado
│       └── __tests__/                 # vitest + happy-dom
├── docs/                     # Documentación técnica y assets
├── scripts/                  # POCs, utilitarios y batch files
└── samples/                  # Logs y archivos de prueba
```

---

## 3. Backend

### 3.1 Routers modulares

| Router | Prefijo | Endpoints clave |
|--------|---------|-----------------|
| `analysis.py` | `/parser` | `POST /preview`, `POST /validate` |
| `sds.py` | — | `GET /sds/resolve-device`, `POST /sds/extract-logs`, `GET /insight/devices/{serial}/alerts`, `GET /insight/devices/{serial}/meters` |
| `ai.py` | `/analysis` | `POST /ai-diagnose` (rate: 5/min) |
| `saved_analysis.py` | `/saved-analyses` | CRUD + `POST /{id}/compare` |
| `printers.py` | — | `GET /printer-models`, `POST /upload-pdf`, `POST /models/{id}/cpmd`, `GET /models/{id}/error-solutions/{code}` |
| `error_codes.py` | `/error-codes` | `POST /upsert` y consultas |

### 3.2 Servicios críticos

- **SdsWebService**: Login automatizado al portal HP SDS, búsqueda por serial, extracción HTML→TSV. Timeout: 25 segundos.
- **InsightService**: consulta APIs oficiales HP (`get_device_info`, `get_device_alerts`, `get_device_consumables`, `get_device_meters`). JWT + API Key/Secret.
- **AiDiagnosisService**: Claude Opus 4.6 con prompt caching. Retorna JSON estructurado `{diagnostico, acciones[], prioridad, impacto}`. Fallback robusto si el modelo rompe el formato.
- **CpmdIngest**: pipeline híbrido (regex → LLM). Upsert por hash CPMD para idempotencia.
- **LogParser**: normaliza `\s{2,}` → `\t`, soporta meses en español.
- **AnalysisService**: agrupa eventos por código, calcula severidades, extrae URLs del catálogo.

### 3.3 Persistencia y fallback

PostgreSQL via psycopg2 con pool de conexiones y pre-ping. Si la BD no responde, todos los repositories cambian automáticamente a **Modo Fallback** usando archivos JSON en `backend/data/`. `threading.Lock()` previene race conditions.

**BaseRepository**: patrón genérico en `infrastructure/repositories/base_repository.py`. Todos los repos lo extienden.

---

## 4. Frontend

### 4.1 Componentes principales (28 total)

| Componente | Rol |
|------------|-----|
| `LogPasteModal` | UI dual: pegar log manual o extracción automática por serial |
| `AIDiagnosticPanel` | Panel ejecutivo IA con badges de prioridad y acciones |
| `ExecutiveSummary` | Resumen ejecutivo para reportes PDF |
| `InsightAlertsPanel` | Alertas vivas del portal HP |
| `SDSIncidentPanel` | Engineering Incident match |
| `ConsumableWarningsPanel` | Estado de consumibles (CPMD + Insight) |
| `IncidentsTable` | Tabla con sort, búsqueda, expand y edición del catálogo |
| `IncidentsChart` | AreaChart volumen + BarChart top 10 |
| `KPICards` | 4 KPIs principales |
| `HelpModal` | Guía de uso completa |
| `DateRangePicker` | Filtro de fechas con presets y rango custom |
| `SavedAnalysisList` / `Detail` | Lista y detalle de snapshots guardados |
| `SolutionContentModal` | Visor de solución técnica del catálogo |
| `AddCodeToCatalogModal` | Agregar/editar código en el catálogo |
| `AddPrinterModelModal` | Selector de modelo + carga PDF |
| `UploadCpmdModal` | Subida de CPMD para un modelo |

### 4.2 Hooks

| Hook | Rol |
|------|-----|
| `useAnalysis` | Orquesta llamadas API (preview + validate) y estado del análisis |
| `useDateFilter` | Filtro de fechas con presets y rango custom |
| `useExportPdf` | PDF A4 en modo Light con todos los paneles |
| `useInsightData` | Datos Insight en tiempo real por serial |
| `useModals` | Estado de apertura de modales |

### 4.3 Deep Linking

`DashboardPage.tsx` detecta el segmento de URL `/:serial`, llama a `GET /sds/resolve-device` para obtener el modelo y device_id, luego ejecuta la extracción automática completa. URL canonical: `https://printer-logs-analyzer.vercel.app/CNXXXXXXXX`.

### 4.4 Pruebas

- **Backend (Pytest):** 19 suites, cobertura de parsers, servicios, endpoints y repositorios.
- **Frontend (Vitest):** happy-dom, cobertura de componentes principales y hooks.
