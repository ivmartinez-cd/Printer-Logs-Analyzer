# AGENTS.md

Guidance for Codex when working in this repository.

---

## Estilo de Comunicación
- **Brevedad Extrema:** Respuestas cortas. Prioriza código o pasos de acción. Solo leo la parte donde pides algo (para ahorrar tokens).
- **Mínimo de tokens:** Usar la menor cantidad de tokens posible. Evitar texto innecesario.
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
npm run dev:backend      # Uvicorn en 0.0.0.0:8001 (mata procesos viejos automáticamente)
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
uvicorn interface.api:app --reload --reload-dir . --host 0.0.0.0 --port 8001
```

`--reload-dir .` es obligatorio en Windows para que hot-reload funcione.

### Docker

```bash
# Servidores (desde la raíz)
docker compose up -d           # Arrancar en background
docker compose up -d --build   # Re-build total (recomendado tras cambios en Dockerfile)
docker compose down            # Apagar todo
docker compose logs -f         # Ver logs en tiempo real

# Backend:  http://localhost:8001 (Health: /health)
# Frontend: http://localhost:5173
```

### Base de Datos (Mantenimiento)

```bash
# Inicializar esquema (tablas) desde la raíz (usa el script de migraciones robusto)
python backend/scripts/run_migrations.py

# Si estás dentro de docker:
docker exec printer-logs-analyzer-backend-1 python backend/scripts/run_migrations.py
```

### Lint, tests y typecheck

```bash
# Desde la raíz
npm run lint           # ESLint en frontend/src
npm run typecheck      # tsc --noEmit en frontend
npm run format         # Prettier --write src (frontend)
npm run test:frontend  # vitest run (happy-dom)
npm run test:backend   # PYTHONPATH=. pytest backend/tests/ -v

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
├── samples/                      # Logs de muestra (TSV) y HTML de portales
├── scratch/                      # Scripts temporales y archivos de debug
├── scripts/                      # Utilidades categorizadas
│   ├── internal/                 # Scripts de mantenimiento interno
│   └── poc/                      # Pruebas de concepto y experimentos
├── backend/
│   ├── main.py                   # Entrypoint uvicorn local
│   ├── requirements.txt
│   ├── ruff.toml                 # Configuración Ruff (linting Python)
│   ├── interface/
│   │   ├── api.py                # FastAPI factory
│   │   ├── routers/
│   │   │   ├── analysis.py       # POST /parser/preview + /parser/validate
│   │   │   ├── sds.py            # SDS extraction + Insight API
│   │   │   ├── ai.py             # POST /analysis/ai-diagnose
│   │   │   ├── maintenance.py    # POST /check-now + GET /sync-status/{job_id}
│   │   │   └── ...
│   │   └── schemas/              # Pydantic I/O schemas
│   ├── domain/entities.py        # Modelos Pydantic (Event, Incident, ...)
│   ├── application/
│   │   └── services/
│   │       ├── sds_web_service.py      # Extracción automatizada SDS
│   │       ├── insight_service.py      # API Insight HP
│   │       ├── maintenance_service.py   # Gestión de sincronización y mails
│   │       └── ...
│   ├── infrastructure/
│   │   ├── database.py           # psycopg2 con fallback automático
│   │   └── repositories/         # Capa de persistencia
│   ├── scripts/
│   │   └── run_migrations.py     # Sistema de migraciones robusto
│   ├── migrations/               # SQL 001–005
│   └── tests/                    # 186 tests pytest
└── frontend/
    ├── src/
        ├── pages/
        │   ├── DashboardPage.tsx # Orquestador principal
        │   └── AvisosPage.tsx    # Gestión de flota y alertas
        ├── components/           # Organizado por feature
        │   ├── Analysis/         # AIDiagnosticPanel, ExecutiveSummary, ...
        │   ├── Monitor/          # MonitorDashboard, KPICards, Charts, ...
        │   ├── Parser/           # EventsTable, IncidentsTable, ...
        │   ├── UI/               # Common components (Header, Toast, Skeleton, ...)
        │   └── Maintenance/      # AvisosSidebar, RuleCard, ...
        ├── hooks/                # useAnalysis, useExportPdf, useDateFilter, ...
        ├── store/                # useAnalysisStore, useUIStore (Zustand)
        └── __tests__/            # 172 tests vitest
```

---

## Backend

### Domain models (`domain/entities.py`)
Todos los modelos son Pydantic con `model_config = {"frozen": True}`.
**Event, EnrichedEvent, Incident, RealtimeConsumable, ExtractSdsLogsResponse.**

### Maintenance Service (`application/services/maintenance_service.py`)
Gestiona la sincronización de toda la flota de clientes. 
- `sync_and_check_all`: Ejecuta sincronización en paralelo con `threading.Lock`.
- Tracking en memoria via `_sync_jobs` para polling desde el frontend.
- Envío de mails solo si se solicita explícitamente (`send_mail=True`).

### DB fallback (offline)
Switch automático a JSON local (`backend/data/`) cuando PostgreSQL no está disponible.

---

## Frontend

### Componentes (Agrupación por Feature)
- **Analysis**: Paneles de diagnóstico IA y resúmenes ejecutivos.
- **Monitor**: Dashboards de flota, gráficos de tendencia y KPIs.
- **Parser**: Visualización de eventos de log y gestión de soluciones técnicas.
- **UI**: Componentes genéricos y de diseño global.
- **Maintenance**: Reglas de alertas, sidebar de avisos y configuración.

### State Management (Zustand)
- `useAnalysisStore`: Estado del análisis actual, modo de vista, cliente seleccionado.
- `useUIStore`: Control de modales y estados globales de interfaz.

---

## Decisiones técnicas importantes
- **Casing de Carpeta UI:** Usar siempre `ui` (minúsculas) para evitar conflictos en Windows.
- **`--reload-dir .` en uvicorn:** Obligatorio en Windows.
- **Migration Runner:** Usar `python backend/scripts/run_migrations.py` — tiene seguimiento de estado en la tabla `schema_migrations`.
- **Zero-Failure Policy:** `npm run typecheck` + `test:backend` + `test:frontend` antes de cada commit.
