# HP Logs Analyzer

Herramienta web para analizar logs de impresoras HP. Parsea el archivo de log exportado desde el portal HP, agrupa eventos por código de error, calcula severidades y presenta KPIs, gráficos y tablas filtrables.

**Producción:** frontend en [Vercel](https://printer-logs-analyzer.vercel.app) · backend en [Render](https://printer-logs-analyzer.onrender.com)

---

## Características principales

- **Parser de logs HP** — acepta formato TSV o texto copiado del portal (espacios múltiples). Soporta fechas en español (`ene`, `feb`, `mar`…).
- **KPIs de severidad** — conteo de incidentes ERROR / WARNING / INFO y último error crítico.
- **Gráfico temporal** — volumen de eventos por hora con toggles de severidad.
- **Top 5 errores** — bar chart de los códigos con mayor ocurrencia, coloreado por severidad.
- **Tabla de incidentes** — sort por columna, filtro de severidad y búsqueda por texto.
- **Diagnóstico automático** — 6 reglas calculadas en el frontend (sin API):
  - Problema dominante, Escalamiento, Ráfaga, Firmware, Múltiples bandejas, Saludable.
  - Recomendación combinada: visita técnica / monitorear / sin acción.
- **Filtros de fecha** — Todo, Esta semana, Semana anterior, Elegir semana, Día específico.
- **Catálogo de códigos** — agrega descripción, severidad y link de solución SDS. El backend guarda el contenido de la página para verlo aunque el link expire.
- **Incidentes guardados** — guarda snapshots de análisis, compáralos con logs nuevos (tendencia: mejoró / estable / empeoró) y visualiza la evolución por equipo en un gráfico de línea.
- **Exportar PDF** — genera un PDF A4 con KPIs, diagnóstico, gráfico de errores y tabla de incidentes.
- **Modo offline** — si PostgreSQL no está disponible, la app opera con archivos JSON locales de forma transparente.

---

## Arquitectura

Monorepo con frontend React/TypeScript y backend Python/FastAPI conectados por REST.

```
Printer-Logs-Analyzer/
├── package.json              # Scripts raíz (dev, lint, typecheck, test:*)
├── backend/
│   ├── interface/api.py      # FastAPI — todos los endpoints
│   ├── interface/auth.py     # Autenticación por x-api-key
│   ├── domain/entities.py    # Modelos Pydantic (Event, Incident, AnalysisResult)
│   ├── application/
│   │   ├── parsers/          # Parser TSV/espacios con soporte español
│   │   └── services/         # AnalysisService, CompareService
│   ├── infrastructure/
│   │   ├── database.py       # psycopg2 con pool y fallback automático
│   │   ├── content_fetcher.py# Fetch y sanitización de contenido SDS
│   │   ├── fallback/         # Catálogo bundled (JSON read-only)
│   │   └── repositories/     # ErrorCodeRepository, SavedAnalysisRepository
│   ├── migrations/           # 5 migraciones SQL (ejecutar en orden)
│   └── tests/                # pytest — 49 tests
└── frontend/
    ├── src/pages/            # DashboardPage.tsx (página principal)
    ├── src/components/       # Modales, tablas, gráficos, paneles
    ├── src/hooks/            # useAnalysis, useModals, useDateFilter, useExportPdf
    ├── src/services/api.ts   # Cliente HTTP tipado
    └── src/__tests__/        # vitest — 35 tests
```

---

## Requisitos

- Python 3.11+
- Node.js 18+
- PostgreSQL (local o [Neon](https://neon.tech)) — opcional, la app funciona sin él

---

## Setup local

### 1. Clonar e instalar dependencias

```bash
git clone <repo-url>
cd Printer-Logs-Analyzer

# Entorno virtual Python
python -m venv .venv
source .venv/bin/activate        # Linux/Mac
# .\.venv\Scripts\Activate.ps1  # Windows PowerShell

pip install -r backend/requirements.txt

# Dependencias Node (raíz + frontend)
npm install
```

### 2. Variables de entorno

Crear `.env` en la raíz del proyecto:

```
DB_URL=postgresql://user:password@host:port/dbname
API_KEY=tu-clave-secreta
```

Crear `frontend/.env`:

```
VITE_API_BASE=http://localhost:8000
VITE_API_KEY=tu-clave-secreta
```

> Si omitís `DB_URL`, la app arranca en modo fallback con archivos JSON locales bajo `backend/data/`.

### 3. Migraciones (solo si usás PostgreSQL)

```bash
psql "$DB_URL" -f backend/migrations/001_init.sql
psql "$DB_URL" -f backend/migrations/002_add_rules_and_rule_tags.sql
psql "$DB_URL" -f backend/migrations/003_create_error_codes.sql
psql "$DB_URL" -f backend/migrations/004_create_saved_analyses.sql
psql "$DB_URL" -f backend/migrations/005_add_solution_content.sql
```

---

## Desarrollo

```bash
# Frontend + backend juntos
npm run dev

# Por separado
npm run dev:frontend   # Vite en puerto 5173
npm run dev:backend    # Uvicorn en 0.0.0.0:8000
```

> En Windows: `npm run dev:backend` ejecuta `taskkill` antes de arrancar para liberar el puerto 8000.

---

## Comandos útiles

```bash
npm run lint           # ESLint en frontend/src
npm run typecheck      # tsc --noEmit
npm run format         # Prettier --write src (frontend)
npm run test:frontend  # vitest run (35 tests)
npm run test:backend   # pytest backend/tests/ -v (49 tests)
```

---

## API — endpoints principales

Todos los endpoints (excepto `/health`) requieren el header `x-api-key`.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Estado del servidor y modo de BD (`postgres` \| `local_fallback`) |
| POST | `/parser/preview` | Parsea y analiza el log; enriquece con el catálogo |
| POST | `/parser/validate` | Detecta códigos nuevos sin analizar |
| POST | `/error-codes/upsert` | Crea o actualiza un código en el catálogo |
| POST | `/saved-analyses` | Guarda un snapshot de análisis |
| GET | `/saved-analyses` | Lista los snapshots guardados |
| GET | `/saved-analyses/{id}` | Detalle de un snapshot |
| DELETE | `/saved-analyses/{id}` | Elimina un snapshot |
| POST | `/saved-analyses/{id}/compare` | Compara logs nuevos contra un snapshot guardado |

---

## Deploy en producción

| Servicio | Plataforma | URL |
|----------|-----------|-----|
| Frontend | Vercel | `https://printer-logs-analyzer.vercel.app` |
| Backend | Render | `https://printer-logs-analyzer.onrender.com` |
| Base de datos | Neon (PostgreSQL) | — |

**Start command en Render:**
```
uvicorn backend.interface.api:app --host 0.0.0.0 --port $PORT
```

**Variables de entorno en Render:** `DB_URL`, `API_KEY`, `ENV=production`  
**Variables en Vercel:** `VITE_API_BASE`, `VITE_API_KEY`
