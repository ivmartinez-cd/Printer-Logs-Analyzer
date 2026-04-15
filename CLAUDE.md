# CLAUDE.md

Guidance for Claude Code when working in this repository.

---

## Estilo de Comunicación
- **Brevedad Extrema:** Responde de forma concisa.
- **Foco en Acción:** Prioriza información técnica y preguntas/pedidos al usuario.
- **Ahorro de Tokens:** Evita explicaciones largas a menos que se soliciten explícitamente.

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

### Lint, tests y typecheck

```bash
# Desde la raíz
npm run lint           # ESLint en frontend/src
npm run typecheck      # tsc --noEmit en frontend
npm run format         # Prettier --write src (frontend)
npm run test:frontend  # vitest run (146 pruebas - happy-dom)
npm run test:backend   # pytest backend/tests/ -v (177 pruebas)
```

---

## Arquitectura

Monorepo: React/TypeScript frontend + Python/FastAPI backend, conectados por REST.

```
Printer-Logs-Analyzer/
├── package.json                  # Scripts root (dev, lint, typecheck, test:*)
├── dev.cmd                       # Script de arranque rápido (Windows)
├── docs/                         # Documentación y assets
│   ├── assets/                   # Imágenes y PDFs
│   ├── CHANGELOG.md              # Historial de versiones y hitos
│   └── ESTADO-ACTUAL.md          # Situación técnica detallada
├── samples/                      # Logs de muestra (TSV), HTML de portales, CSVs
├── scripts/                      # POCs, batch files y utilitarios de extracción
├── backend/
│   ├── main.py                   # Entrypoint uvicorn local
│   ├── requirements.txt
│   ├── interface/
│   │   ├── api.py                # FastAPI app, /sds/extract-logs + todos los endpoints
│   │   └── auth.py               # Dependencia auth por API key
│   ├── domain/entities.py        # Pydantic models (Event, Incident, ...)
│   ├── application/
│   │   ├── parsers/log_parser.py # Parser TSV/espacios con soporte español
│   │   └── services/
│   │       ├── sds_web_service.py    # Servicio CORE: extracción SDS automatizada
│   │       ├── analysis_service.py
│   │       ├── ai_diagnosis_service.py
│   │       ├── compare_service.py
│   │       ├── cpmd_extractor.py
│   │       ├── cpmd_ingest.py
│   │       ├── cpmd_parser.py
│   │       ├── insight_service.py    # Portal API (JWT + Consumibles REALES)
│   │       └── pdf_extraction_service.py
│   ├── infrastructure/
│   │   ├── config.py             # Settings (SDS_WEB_*, DB_URL, etc.)
│   │   ├── content_fetcher.py    # validate_ssrf_url + fetch_solution_content
│   │   ├── database.py           # psycopg2 con pool y fallback automático
│   │   ├── fallback/error_codes_seed.json
│   │   └── repositories/
│   │       ├── error_code_repository.py
│   │       ├── error_solution_repository.py
│   │       ├── printer_model_repository.py
│   │       └── saved_analysis_repository.py
│   ├── migrations/               # SQL y data (incl. carga_cpmd_626xx.sql)
│   └── tests/                    # 177 pruebas (pytest)
└── frontend/
    ├── .prettierrc               # Reglas de formato
    ├── vite.config.ts            # manualChunks optimizados
    ├── src/
    │   ├── pages/DashboardPage.tsx
    │   ├── components/
    │   │   ├── LogPasteModal.tsx     # Refactorizado: UI de carga/extracción
    │   │   └── ...
    │   ├── hooks/
    │   │   ├── useDateFilter.ts
    │   │   ├── useAnalysis.ts
    │   │   └── ...
    │   ├── services/api.ts       # Cliente HTTP tipado
    │   └── contexts/ToastContext.tsx
    └── src/__tests__/            # 146 pruebas (vitest + happy-dom)
```

---

## Backend

### Domain models (`domain/entities.py`)

Todos los modelos son Pydantic con `model_config = {"frozen": True}`.

**Event:** `type` (ERROR|WARNING|INFO), `code`, `timestamp`, `counter`, `firmware`, `help_reference`

**EnrichedEvent(Event):** extiende con `code_severity`, `code_description`, `code_solution_url`, `code_solution_content`. Es el tipo que circula en toda la capa de aplicación e `Incident.events`.

**Incident:** `id` (`"{code}-{start_time.isoformat()}"`), `code`, `classification`, `severity`, `severity_weight`, `occurrences`, `start_time`, `end_time`, `counter_range`, `events: List[EnrichedEvent]`, `sds_link`, `sds_solution_content`

**RealtimeConsumable:** `type`, `description`, `sku`, `percentLeft`, `pagesLeft`, `daysLeft`. Datos obtenidos directamente de la API de HP Insight, sin cálculos locales.

**ExtractSdsLogsResponse:** Incluye `logs_text` y `realtime_consumables`. Es el resultado de la extracción automatizada.

### Parser (`application/parsers/log_parser.py`)

Formato de entrada: TSV o espacios múltiples (normaliza `\s{2,}` → `\t`). Soporta meses en español.

### SDS Web Service (`application/services/sds_web_service.py`)

**SERVICIO CRÍTICO**: Maneja el login automatizado al portal HP SDS, búsqueda de dispositivos por serial y extracción del HTML de eventos. Convierte el HTML crudo a TSV compatible con el parser interno.

### Analysis service (`application/services/analysis_service.py`)

Agrupa por código, calcula severidades y extrae URLs de soluciones del catálogo.

### DB fallback (offline / firewall corporativo)

Switch automático a JSON local (`backend/data/`) cuando PostgreSQL no está disponible. `threading.Lock()` evita race conditions.

---

## Frontend

### DashboardPage.tsx

Orquesta vistas y hooks. Flujo: `LogPasteModal` (Carga/Extracción) → Confirmación → Dashboard Principal.

### LogPasteModal.tsx

Componente especializado que permite al usuario o bien pegar el log manualmente o ingresar un serial para **extracción automática**.

### useExportPdf.ts

Genera reportes PDF profesionales alineados al Executive Summary y paneles colapsados (si están generados). Fuerza modo Light para legibilidad.

---

## Decisiones técnicas importantes

- **`vite-env.d.ts` en Prettier ignore:** Prettier elimina la directiva `/// <reference>` y rompe `tsc -b`. Mantenlo siempre en `.prettierignore`.
- **`--reload-dir .` en uvicorn:** Obligatorio en Windows para detectar cambios.
- **`taskkill` antes de uvicorn:** Crucial para liberar el puerto 8000 en reinicios rápidos.

---

## Calidad y Prevención de Errores (Checklist)

Para evitar errores de build en Vercel o regresiones, siempre verifica:

1. **Frontend Typecheck:** Ejecuta `npm run typecheck` en la raíz antes de commitear cualquier cambio en `.ts` o `.tsx`.
2. **Backend Tests:** Ejecuta `npm run test:backend` (pytest) antes de commitear cambios en la lógica de servicios.
3. **Duplicidad de Código:** Al usar herramientas de edición automática, verifica que no existan `imports` duplicados (especialmente en `SDSIncidentPanel.tsx`).
4. **Propiedades de Componentes:** Si cambias la definición de una interfaz en `types/api.ts`, busca todas las referencias en los componentes para asegurar que las `props` coincidan.
5. **Vercel Builds:** Si un cambio afecta el build, revisa que no haya props obsoletas pasando a componentes (como el viejo `consumableWarnings`).
