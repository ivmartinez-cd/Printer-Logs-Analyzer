# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev              # Run frontend + backend concurrently
npm run dev:frontend     # Frontend only (Vite on port 5173 or 5174 if 5173 is taken)
npm run dev:backend      # Backend only (Uvicorn on port 8000, binds 0.0.0.0)
```

### Frontend
```bash
cd frontend
npm run build            # TypeScript compile + Vite build → dist/
npm run preview          # Preview production build
```

### Backend (manual)
```bash
cd backend
uvicorn interface.api:app --reload --host 0.0.0.0
```

There are no lint or test commands — no test suite exists yet.

## Architecture

Monorepo with a React/TypeScript frontend and a Python/FastAPI backend, connected via REST.

### Backend (`backend/`)

Follows Clean Architecture:

- **`interface/api.py`** — FastAPI app, all endpoints defined here
- **`domain/entities.py`** — Pydantic models: `Event`, `Incident`, `AnalysisResult`
- **`application/parsers/log_parser.py`** — TSV log parser; returns `ParserReport`
- **`application/services/analysis_service.py`** — Groups events by error code into `Incident` objects
- **`application/services/compare_service.py`** — Computes trends between two analysis snapshots
- **`infrastructure/database.py`** — psycopg2 connection to PostgreSQL (Neon); exposes `Database`, `DatabaseUnavailableError`
- **`infrastructure/repositories/`** — Repository pattern for `error_codes` and `saved_analyses`; both repositories fall back to local JSON when DB is unreachable
- **`infrastructure/fallback/error_codes_seed.json`** — bundled read-only catalog of all known error codes (used as fallback source)
- **`infrastructure/config.py`** — Reads `.env` via python-dotenv; exposes `Settings`
- **`migrations/`** — 4 SQL migrations (run manually); last is `004_create_saved_analyses.sql`
- **`data/`** — gitignored runtime directory; holds `error_codes_local.json` and `saved_analyses_local.json` when in fallback mode

### Frontend (`frontend/src/`)

- **`pages/DashboardPage.tsx`** — Main UI: log upload, analysis display, saved analysis management
- **`services/api.ts`** — Fetch-based HTTP client, injects `x-api-key` header, typed responses
- **`types/api.ts`** — TypeScript interfaces mirroring backend Pydantic models
- **`contexts/ToastContext.tsx`** — Global toast notifications via React Context
- **`components/`** — Modals, panels, and UI widgets used by DashboardPage

### Data flow

1. Frontend POSTs raw TSV log text to `/parser/preview`
2. Backend parses → enriches events from `error_codes` (DB or local fallback) → runs `AnalysisService`
3. Response: `{ events[], incidents[], global_severity, errors[] }`
4. Frontend renders charts (Recharts) and incident tables
5. User can save a snapshot (`/saved-analyses`) and later compare new logs against it

### Key API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Health probe; includes `db_mode` (`postgres` \| `local_fallback`) and `db_available` |
| POST | `/parser/preview` | Parse + analyze logs (main flow) |
| POST | `/parser/validate` | Validate only, no analysis |
| POST | `/error-codes/upsert` | Add/update error code in catalog |
| POST | `/saved-analyses` | Save analysis snapshot |
| GET | `/saved-analyses` | List snapshots |
| GET | `/saved-analyses/{id}` | Get full snapshot |
| DELETE | `/saved-analyses/{id}` | Delete snapshot |
| POST | `/saved-analyses/{id}/compare` | Compare new logs vs. saved snapshot |

All endpoints except `/health` require the `x-api-key` header. Missing or wrong key returns HTTP 401.

### CORS

Allowed origins (configured in `interface/api.py`):
- `http://localhost:5173` / `http://127.0.0.1:5173`
- `http://localhost:5174` / `http://127.0.0.1:5174` (Vite fallback port when 5173 is taken)

To add a new origin, update the `allow_origins` list in the `CORSMiddleware` call in `api.py`.

### DB fallback (offline / corporate firewall)

When PostgreSQL is unreachable the app continues working automatically:

- `DatabaseUnavailableError` is raised by `Database.connect()` on any `psycopg2.OperationalError` (5 s timeout).
- Both repositories catch it and switch to local JSON files under `backend/data/`.
- `error_codes`: reads from `infrastructure/fallback/error_codes_seed.json` (bundled); upserts write to `backend/data/error_codes_local.json`.
- `saved_analyses`: full CRUD against `backend/data/saved_analyses_local.json`.
- `GET /health` reports `"db_mode": "local_fallback"` so you can detect the state at a glance.

### Environment variables

Backend (`.env`):
```
DB_URL=postgresql://...
API_KEY=...
RECENCY_WINDOW=3600
MAX_CONCURRENT_ANALYSIS=5
ANALYSIS_TIMEOUT=30
```

Frontend (`frontend/.env`):
```
VITE_API_KEY=dev
VITE_API_BASE=http://localhost:8000
```

### Frontend build notes

`vite.config.js` uses `manualChunks` to split the bundle:
- `vendor-react` — React core
- `vendor-charts` — Recharts (large; cached separately)
- `index` — app code (~48 KB gzip vs. 572 KB before splitting)

## Mejoras UI pendientes

### Alta prioridad
- Gráfico Issue Volume: eje X con demasiadas etiquetas, ilegible
- Top Errors: barras sin distinción de color por severidad (ERROR/WARNING/INFO)
- Título "Issue Volume (todo el log)" mezcla español e inglés

### Media prioridad
- Columna Clasificación en tabla demasiado ancha
- Filas de tabla sin hover state visible
- Botón Editar sin consistencia visual con Ver solución

### Baja prioridad
- KPI "Impacted Printers" sigue en inglés
- Header podría mostrar nombre del archivo analizado
