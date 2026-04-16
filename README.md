# HP Logs Analyzer

![CI](https://github.com/ivmartinez-cd/Printer-Logs-Analyzer/actions/workflows/ci.yml/badge.svg)

Herramienta web interna para analizar logs de impresoras HP. Identificás un equipo por número de serie, la app resuelve el modelo, extrae los logs del portal HP SDS automáticamente, y genera un análisis completo: incidentes por código, KPIs, diagnóstico con IA, consumibles en tiempo real, gráficos y exportación a PDF ejecutivo.

**Producción:** frontend en [Vercel](https://printer-logs-analyzer.vercel.app) · backend en [Render](https://printer-logs-analyzer.onrender.com)

---

## Características principales

- **Parser de logs HP** — acepta formato TSV o texto copiado del portal (espacios múltiples). Soporta fechas en español (`ene`, `feb`, `mar`…).
- **Extracción automática SDS** — extrae logs directamente desde el portal HP SDS mediante el número de serie. El backend gestiona login, búsqueda y conversión de HTML a TSV.
- **Deep Linking** — acceso directo vía `https://.../SERIALNUMBER`. La app detecta el serial en la URL, resuelve el modelo y extrae los logs automáticamente.
- **Resolución automática de modelo** — al extraer por serial, el backend detecta el nombre del modelo desde SDS y busca la mejor coincidencia en el catálogo local.
- **Integración Insight API HP** — alertas del dispositivo en tiempo real (consumibles, contadores, historial del último mes) directamente en el dashboard.
- **Diagnóstico con IA** — panel ejecutivo que llama a **Claude Opus 4.6** on demand; devuelve JSON estructurado: diagnóstico, acciones priorizadas e impacto operativo.
- **Catálogo de modelos y consumibles** — carga de nuevos modelos subiendo el PDF Service Cost Data oficial (extracción automática con Claude).
- **Ingesta CPMD (Service Manual)** — pipeline híbrido: regex de alta confianza + LLM como fallback para extraer soluciones técnicas con pasos y FRUs.
- **Estado de consumibles** — tabla con categoría, part number, vida útil y contador. Excluye tóners y ADFs. Alerta roja en estado crítico (>100%).
- **SDS Engineering Incident** — match automático contra incidentes del log mediante tokens y keywords. Soporta comodín `z` hex.
- **Resumen Ejecutivo** — panel inteligente con KPIs, severidad global y análisis listo para reportes.
- **Exportación a PDF** — reporte A4 de alta fidelidad en modo Light, incluyendo todos los paneles generados.
- **Incidentes guardados** — snapshots del análisis con comparación temporal y gráfico de tendencia.
- **Modo offline** — fallback automático a JSON local si PostgreSQL no está disponible.

---

## Arquitectura

Monorepo con frontend React/TypeScript y backend Python/FastAPI conectados por REST.

```
Printer-Logs-Analyzer/
├── package.json              # Scripts raíz (dev, lint, typecheck, test:*)
├── dev.cmd                   # Script de arranque rápido (Windows)
├── docker-compose.yml        # Contenedores backend + frontend
├── backend/
│   ├── main.py               # Entrypoint uvicorn local
│   ├── requirements.txt
│   ├── ruff.toml             # Configuración linting Python
│   ├── Dockerfile
│   ├── interface/
│   │   ├── api.py            # FastAPI factory — orquesta todos los routers
│   │   ├── auth.py           # Autenticación x-api-key
│   │   ├── routers/          # analysis, sds, ai, saved_analysis, printers, error_codes
│   │   └── schemas/          # Pydantic I/O schemas por router
│   ├── domain/entities.py    # Modelos Pydantic (Event, Incident, EnrichedEvent, …)
│   ├── application/
│   │   ├── parsers/log_parser.py
│   │   └── services/
│   │       ├── sds_web_service.py        # Extracción automatizada SDS
│   │       ├── insight_service.py        # API Insight HP (alertas + consumibles)
│   │       ├── ai_diagnosis_service.py   # Claude Opus 4.6 (JSON estructurado)
│   │       ├── analysis_service.py
│   │       ├── compare_service.py
│   │       ├── cpmd_extractor.py         # Extractor regex de CPMD
│   │       ├── cpmd_ingest.py            # Pipeline híbrido (regex + LLM)
│   │       ├── cpmd_parser.py
│   │       ├── cpmd_structured_extractor.py
│   │       ├── insight_service.py
│   │       └── pdf_extraction_service.py
│   ├── infrastructure/
│   │   ├── config.py         # Settings (env vars)
│   │   ├── database.py       # psycopg2 con pool y fallback automático
│   │   ├── content_fetcher.py
│   │   ├── fallback/         # JSON seed para modo offline
│   │   └── repositories/     # base, error_code, error_solution, printer_model, saved_analysis
│   ├── migrations/           # SQL (001–007) + carga_cpmd_626xx.sql
│   └── tests/                # pytest — 19 suites de tests
├── frontend/
│   ├── Dockerfile
│   ├── src/
│   │   ├── pages/DashboardPage.tsx       # Orquestador principal
│   │   ├── components/                   # 28 componentes
│   │   ├── hooks/                        # useAnalysis, useDateFilter, useExportPdf, …
│   │   ├── services/api.ts               # Cliente HTTP tipado
│   │   └── contexts/ToastContext.tsx
│   └── src/__tests__/                    # vitest — happy-dom
├── docs/                     # Documentación técnica, CHANGELOG, ESTADO-ACTUAL
├── scripts/                  # POCs, utilitarios y batch files de extracción
└── samples/                  # Logs de muestra (TSV), HTML portales, CSVs
```

---

## API — endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Estado del servidor y modo de BD |
| POST | `/parser/preview` | Parse + análisis + enriquecimiento de logs |
| POST | `/parser/validate` | Detecta códigos nuevos sin analizar |
| POST | `/error-codes/upsert` | Crea o actualiza un código en el catálogo |
| GET | `/printer-models` | Lista modelos con flag `has_cpmd` |
| POST | `/printer-models/upload-pdf` | Carga PDF Service Cost Data (extracción con IA) |
| POST | `/models/{id}/cpmd` | Ingesta CPMD (Service Manual) para un modelo |
| GET | `/models/{id}/error-solutions/{code}` | Solución técnica con pasos y FRUs |
| GET | `/sds/resolve-device?serial=` | Resuelve modelo y device_id por número de serie |
| POST | `/sds/extract-logs` | Extrae logs del portal SDS por serial |
| POST | `/analysis/ai-diagnose` | Diagnóstico con Claude Opus 4.6 (rate limit: 5/min) |
| POST | `/saved-analyses` | Guarda un snapshot de análisis |
| GET | `/saved-analyses` | Lista snapshots guardados |
| GET | `/saved-analyses/{id}` | Detalle de un snapshot |
| DELETE | `/saved-analyses/{id}` | Elimina un snapshot |
| POST | `/saved-analyses/{id}/compare` | Compara snapshot con nuevo log |
| GET | `/insight/devices/{serial}/alerts` | Alertas vivas e historial del portal SDS |
| GET | `/insight/devices/{serial}/meters` | Contadores/metros del dispositivo |

---

## Setup local

Consultar [CLAUDE.md](./CLAUDE.md) para los comandos de instalación y arranque.
Consultar [docs/ESTADO-ACTUAL.md](./docs/ESTADO-ACTUAL.md) para el flujo técnico detallado.

### Docker (alternativa)

```bash
docker compose up --build
# Backend: http://localhost:8000
# Frontend: http://localhost:5173
```
