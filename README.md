# HP Logs Analyzer

![CI](https://github.com/ivmartinez-cd/Printer-Logs-Analyzer/actions/workflows/ci.yml/badge.svg)
![Tests](https://img.shields.io/badge/tests-373%20passing-brightgreen)
![TypeScript](https://img.shields.io/badge/typescript-strict-blue)
![Docker](https://img.shields.io/badge/docker-ready-blue)

Herramienta web profesional para el análisis de logs de impresoras HP. Identificación por número de serie, resolución automática de modelo, extracción SDS, diagnóstico con IA y gestión de flota para mantenimiento preventivo.

## Características principales

- **Análisis Profundo con IA** — Diagnósticos estructurados mediante Claude, con pasos de acción priorizados e impacto operativo.
- **Gestión de Flota (Avisos)** — Sistema de monitoreo de flota completa con sincronización en segundo plano y detección de alertas críticas.
- **Parser de Logs HP** — Soporte multiformato (TSV, portales) y normalización inteligente de logs.
- **Extracción Automática SDS** — Extracción directa desde el portal HP SDS sin intervención manual.
- **Integración Insight API** — Datos de consumibles, contadores y alertas en tiempo real.
- **Reportes Ejecutivos PDF** — Exportación de reportes A4 de alta fidelidad para clientes.
- **Catálogo de Soluciones CPMD** — Integración de manuales de servicio para obtener soluciones técnicas directas por código de error.

---

## Arquitectura

Monorepo organizado bajo estándares profesionales de mantenibilidad.

```
Printer-Logs-Analyzer/
├── backend/
│   ├── application/
│   │   └── services/       # sds, insight, maintenance, ai_diagnosis
│   ├── domain/             # Entities y modelos Pydantic
│   ├── infrastructure/     # database, repositories, config
│   ├── interface/          # FastAPI, routers, schemas
│   ├── migrations/         # Esquemas SQL versionados
│   ├── scripts/            # run_migrations.py robusto
│   └── tests/              # 186 tests pytest
├── frontend/
│   ├── src/
│   │   ├── components/     # Agrupados por: Analysis, Monitor, Parser, UI, Maintenance
│   │   ├── pages/          # DashboardPage, AvisosPage
│   │   ├── hooks/          # useAnalysis, useExportPdf, useDateFilter
│   │   ├── store/          # Zustand global state
│   │   └── services/       # Cliente API tipado
│   └── src/__tests__/      # 172 tests vitest
├── scripts/                # internal/ y poc/ utilidades
├── samples/                # Archivos de muestra y logs
└── docs/                   # Documentación técnica y visión
```

---

## Instalación y Uso

### Requisitos
- Node.js 18+
- Python 3.10+
- Docker (opcional para entorno completo)

### Inicio Rápido (Windows)
```bash
# Instalar dependencias y arrancar dev mode
npm install
npm run dev
```

### Base de Datos
Para inicializar o actualizar las tablas:
```bash
python backend/scripts/run_migrations.py
```

---

## Calidad y Estabilidad
El proyecto mantiene una política de **Zero-Failure**.

- **Frontend Tests**: 187 tests pasados (Vitest + Happy DOM).
- **Backend Tests**: 186 tests pasados (Pytest).
- **Type Checking**: Strict TypeScript en todo el frontend.
- **Linting**: Ruff (Python) y ESLint (React).

---

## API — Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/parser/preview` | Análisis y enriquecimiento de logs |
| GET | `/sds/resolve-device` | Resolución de modelo por serial |
| POST | `/maintenance/check-now` | Inicia sync de flota en background |
| GET | `/maintenance/sync-status/{id}` | Polling de estado de sincronización |
| POST | `/analysis/ai-diagnose` | Diagnóstico ejecutivo con IA |

---

**Producción:** [Vercel (Frontend)](https://printer-logs-analyzer.vercel.app) · [Render (Backend)](https://printer-logs-analyzer.onrender.com)
