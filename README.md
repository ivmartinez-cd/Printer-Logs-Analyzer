# HP Logs Analyzer

![CI](https://github.com/ivmartinez-cd/Printer-Logs-Analyzer/actions/workflows/ci.yml/badge.svg)

Herramienta web para analizar logs de impresoras HP. Seleccionás el modelo, pegás el log exportado desde el portal HP, y la app parsea, agrupa por código de error, calcula severidades, advierte sobre consumibles y presenta KPIs, diagnóstico con IA, gráficos y tablas filtrables.

**Producción:** frontend en [Vercel](https://printer-logs-analyzer.vercel.app) · backend en [Render](https://printer-logs-analyzer.onrender.com)

---

## Características principales

- **Parser de logs HP** — acepta formato TSV o texto copiado del portal (espacios múltiples). Soporta fechas en español (`ene`, `feb`, `mar`…).
- **Extracción Automática SDS** — extrae logs directamente desde el portal HP SDS mediante el número de serie. El backend gestiona el login, la búsqueda y la conversión de HTML a TSV compatible.
- **Integración con Portal HP SDS Insight** — visualización de alertas del dispositivo en tiempo real directamente en el dashboard.
- **Modelos de impresora y consumibles** — carga de nuevos modelos subiendo el PDF de Service Cost Data oficial (extracción automática con Claude Haiku).
- **Estado de consumibles** — tabla con categoría, part number, vida útil y contador. Excluye toners y componentes 110V. Acenso rojo en estado crítico.
- **Diagnóstico con IA** — panel colapsado que llama a Claude Haiku on demand; devuelve DIAGNÓSTICO / ACCIÓN / PRIORIDAD.
- **SDS Engineering Incident** — match automático contra los incidentes del log mediante tokens y keywords.
- **Resumen Ejecutivo Interactivo** — nuevo panel inteligente para reportes profesionales.
- **Exportación a PDF** — reporte de alta fidelidad incluyendo todos los paneles generados.
- **Modo offline** — fallback a JSON local si PostgreSQL no está disponible.

---

## Arquitectura

Monorepo con frontend React/TypeScript y backend Python/FastAPI conectados por REST.

```
Printer-Logs-Analyzer/
├── package.json              # Scripts raíz (dev, lint, typecheck, test:*)
├── dev.cmd                   # Script de arranque rápido (Windows)
├── backend/
│   ├── interface/api.py      # FastAPI — todos los endpoints
│   ├── interface/auth.py     # Autenticación x-api-key
│   ├── domain/entities.py    # Modelos Pydantic
│   ├── application/
│   │   ├── parsers/log_parser.py
│   │   └── services/         # AnalysisService, SDSWebService, AI, Insight
│   ├── infrastructure/
│   │   ├── database.py       # SQL Pool y fallback
│   │   └── repositories/     # Persistencia
│   ├── migrations/           # Migraciones SQL
│   └── tests/                # pytest — 177 pruebas
├── frontend/
│   ├── src/pages/            # DashboardPage.tsx
│   ├── src/components/       # LogPasteModal, tablas, gráficos, etc.
│   └── src/__tests__/        # vitest — 146 pruebas (happy-dom)
├── docs/                     # Documentación técnica y assets
├── scripts/                  # POCs, utilitarios y scripts de extracción
└── samples/                  # Logs de muestra y archivos de prueba
```

---

## API — endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Estado del servidor y modo de BD |
| POST | `/parser/preview` | Parse + análisis + enriquecimiento |
| POST | `/parser/validate` | Detecta códigos nuevos sin analizar |
| POST | `/error-codes/upsert` | Crea o actualiza un código en el catálogo |
| POST | `/sds/extract-logs` | Extrae logs directamente del portal SDS por serial |
| GET | `/printer-models` | Lista modelos de impresora disponibles |
| POST | `/analysis/ai-diagnose` | Genera diagnóstico con Claude Haiku |
| POST | `/saved-analyses` | Guarda un snapshot de análisis |
| GET | `/saved-analyses` | Listar los snapshots guardados |
| GET | `/insight/devices/{serial}/alerts` | Alertas vivas e historial del portal SDS |

---

## Setup local

Consultar [CLAUDE.md](./CLAUDE.md) para los comandos de instalación y arranque.
Consultar [docs/ESTADO-ACTUAL.md](./docs/ESTADO-ACTUAL.md) para el detalle del flujo técnico.
