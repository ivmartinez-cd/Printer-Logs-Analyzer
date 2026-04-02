# HP Printer Logs Analyzer

Primer paso del MVP para un sistema modular de análisis de logs de impresoras HP.

## Estructura del proyecto

- **`backend/`**: Servidor (API y lógica). Incluye:
  - `application/`: Servicios y parsers (LogParser, AnalysisService).
  - `config/`: Configuración estática (p. ej. `default.json`).
  - `domain/`: Entidades (Event, Incident, AnalysisResult).
  - `infrastructure/`: Configuración env, BD y repositorios.
  - `interface/`: API FastAPI y endpoints.
  - `migrations/`: SQL de esquema (PostgreSQL/Neon).
  - `scripts/`: Herramientas CLI (p. ej. `run_parser.py`).
  - `main.py`, `requirements.txt`.
- **`frontend/`**: App React/Vite.
- **`docs/`**: Documentación (visión, PowerShell, auditoría).
- **`samples/`**: Logs y bodies de ejemplo (`hp_log.txt`, `request.json`).
- **`snapshots/`**: Versiones de configuración (respaldo).

## Requisitos del sistema

- **Python 3.11+**
- **Node.js 18+**
- **PostgreSQL** (local o instancia en la nube como [Neon](https://neon.tech))

## Requisitos iniciales

1. **Crear y activar el entorno virtual**
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```
2. **Instalar dependencias del backend**
   ```powershell
   pip install -r backend/requirements.txt
   ```
3. **Configurar variables de entorno**
   - Copiar el archivo `.env` (provisto por el equipo) a la **raíz del proyecto**.
   - El frontend no necesita configuración adicional: usa `http://localhost:8000` por defecto.

## Setup backend y base de datos

4. **Crear la base de datos**
   - En Neon (o tu instancia PostgreSQL): crear una base de datos y anotar la URL de conexión.
   - Usar esa URL en `.env` como `DB_URL` (formato `postgresql://user:password@host:port/dbname`).

5. **Aplicar migraciones**
   - Ejecutar todos los archivos SQL en orden (sustituir `<CONNECTION_STRING>` por tu `DB_URL` de `.env`):
   ```powershell
   psql "<CONNECTION_STRING>" -f backend/migrations/001_init.sql
   psql "<CONNECTION_STRING>" -f backend/migrations/002_add_rules_and_rule_tags.sql
   psql "<CONNECTION_STRING>" -f backend/migrations/003_create_error_codes.sql
   psql "<CONNECTION_STRING>" -f backend/migrations/004_create_saved_analyses.sql
   ```
   - O ejecutar cada archivo en orden en el cliente SQL de Neon/PostgreSQL.

## Uso del parser

El parser acepta archivos TSV oficiales de HP (separador TAB) con las columnas:

`Tipo de evento | Código de evento | Fecha de evento | N.º total de impresiones | Versión firmware | Ayuda`

Ejecute la utilidad CLI desde la raíz del proyecto (el backend carga el entorno desde la raíz):

```powershell
cd backend
python scripts/run_parser.py ../samples/hp_log.txt
```

El parser normaliza los tipos (`Error/Warning/Info` → `ERROR/WARNING/INFO`) y registra errores no fatales sin detener la ejecución.

## Motor de reglas y configuración

- La configuración activa vive en PostgreSQL (`config_versions`) y se gestiona vía API:
  - `GET /config` → versión activa + JSON completo.
  - `PUT /config` → valida, versiona, audita (requiere `x-user-id` además del `x-api-key`).
  - `GET /config/history` → historial con diff resumido.
- Cada regla debe incluir `code`, `classification`, `description`, `resolution`, `recency_window`, `X`, `Y`, `counter_max_jump`, `severity_weight`, `enabled` y `tags`.
- La ventana de recencia global proviene del JSON (`defaults.recency_window`) y, si falta, se usa `RECENCY_WINDOW`.
- Se generan snapshots planos por versión en `snapshots/config_versions` para respaldo fuera de la base.

## Ejecutar todo el stack (recomendado)

Desde la **raíz del repo**, con el venv de Python activado y Node instalado:

```bash
npm install        # Instala concurrently (raíz) + todas las deps del frontend automáticamente
npm run dev
```

Arranca a la vez el frontend (Vite) y la API (Uvicorn). Cada uno en su proceso, con salida etiquetada `fe` y `be`.

Comandos por separado:

- Frontend: `npm run dev:frontend` o `cd frontend && npm run dev`
- Backend: `npm run dev:backend` (ejecuta Uvicorn desde `backend/`)

## Ejecutar solo la API (backend)

Desde la raíz del proyecto:

```powershell
npm run dev:backend
```

O manualmente, entrando en `backend/` y arrancando Uvicorn:

```powershell
cd backend
uvicorn interface.api:app --reload
```

La API expone:
- `GET /health`: verificación rápida.
- `POST /parser/preview`: recibe `{ "logs": "..." }`, requiere `x-api-key`, devuelve `{ events, incidents, global_severity, errors }`.

## Próximos pasos sugeridos

- Añadir reglas de correlación en `backend/application/` que construyan Incident a partir de eventos.
- Persistir snapshots/incident reports (p. ej. con `backend/infrastructure/database.py`).
- Ampliar métricas y monitoreo reutilizando la estructura modular ya creada.
