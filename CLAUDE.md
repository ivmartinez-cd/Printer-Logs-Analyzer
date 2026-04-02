# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev              # Run frontend + backend concurrently
npm run dev:frontend     # Frontend only (Vite on port 5173)
npm run dev:backend      # Backend only (Uvicorn on port 8000 with --reload)
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
uvicorn interface.api:app --reload
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
- **`infrastructure/database.py`** — psycopg2 connection pool to PostgreSQL (Neon)
- **`infrastructure/repositories/`** — Repository pattern for `error_codes` and `saved_analyses`
- **`infrastructure/config.py`** — Reads `.env` via python-dotenv; exposes `Settings`
- **`migrations/`** — 4 SQL migrations (run manually); last is `004_create_saved_analyses.sql`

### Frontend (`frontend/src/`)

- **`pages/DashboardPage.tsx`** — Main UI: log upload, analysis display, saved analysis management
- **`services/api.ts`** — Fetch-based HTTP client, injects `x-api-key` header, typed responses
- **`types/api.ts`** — TypeScript interfaces mirroring backend Pydantic models
- **`contexts/ToastContext.tsx`** — Global toast notifications via React Context
- **`components/`** — Modals, panels, and UI widgets used by DashboardPage

### Data flow

1. Frontend POSTs raw TSV log text to `/parser/preview`
2. Backend parses → enriches events from `error_codes` DB table → runs `AnalysisService`
3. Response: `{ events[], incidents[], global_severity, errors[] }`
4. Frontend renders charts (Recharts) and incident tables
5. User can save a snapshot (`/saved-analyses`) and later compare new logs against it

### Key API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/parser/preview` | Parse + analyze logs (main flow) |
| POST | `/parser/validate` | Validate only, no analysis |
| POST | `/error-codes/upsert` | Add/update error code in catalog |
| POST | `/saved-analyses` | Save analysis snapshot |
| GET | `/saved-analyses` | List snapshots |
| POST | `/saved-analyses/{id}/compare` | Compare new logs vs. saved snapshot |

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
VITE_API_URL=http://localhost:8000
```
