# HP Printer Logs Analyzer

Primer paso del MVP para un sistema modular de análisis de logs de impresoras HP.

## Estructura del proyecto

- `domain/`: Entidades inmutables (Event, Incident, AnalysisResult).
- `application/`: Servicios y parsers (por ahora LogParser y AnalysisService).
- `infrastructure/`: Configuración, acceso a BD y manejo de snapshots.
- `interface/`: FastAPI + endpoints públicos.
- `scripts/`: Herramientas CLI (parser manual).
- `samples/`: Logs de ejemplo para pruebas rápidas.

## Requisitos iniciales

1. **Crear y activar el entorno virtual**
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```
2. **Instalar dependencias**
   ```powershell
   pip install -r requirements.txt
   ```
3. **Configurar variables de entorno**
   - Duplique el archivo `.env.example` → `.env` y actualice los valores:
     - `DB_URL`: cadena de conexión Neon/PostgreSQL.
     - `API_KEY`: clave para la cabecera `x-api-key`.
     - `RECENCY_WINDOW`: ventana (segundos) para análisis recientes.
     - `MAX_CONCURRENT_ANALYSIS`: cantidad de análisis simultáneos permitidos.
     - `ANALYSIS_TIMEOUT`: límite (segundos) por análisis.

## Setup backend y base de datos

4. **Crear la base de datos**
   - En Neon (o tu instancia PostgreSQL): crear una base de datos y anotar la URL de conexión.
   - Usar esa URL en `.env` como `DB_URL` (formato `postgresql://user:password@host:port/dbname`).

5. **Aplicar migraciones**
   - Ejecutar el SQL de inicialización contra la base (sustituir `<CONNECTION_STRING>` por tu `DB_URL` de `.env`):
   ```powershell
   psql "<CONNECTION_STRING>" -f migrations/001_init.sql
   ```
   - O abrir `migrations/001_init.sql` en el cliente SQL de Neon/PostgreSQL y ejecutarlo manualmente.

6. **Ejecutar el seed inicial**
   - Inserta la configuración por defecto desde `config.json` como versión 1. Si ya existe configuración, no hace nada.
   ```powershell
   python scripts/seed_config.py
   ```
   - Asegurarse de ejecutar desde la raíz del proyecto (donde está `config.json`).

## Uso del parser

El parser acepta archivos TSV oficiales de HP (separador TAB) con las columnas:

`Tipo de evento | Código de evento | Fecha de evento | N.º total de impresiones | Versión firmware | Ayuda`

Ejecute la utilidad CLI para validar un archivo (usa `samples/example.log` como ejemplo real):

```powershell
python scripts/run_parser.py samples/example.log
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

## Ejecutar la API con FastAPI

Inicie el servidor de desarrollo con Uvicorn:

```powershell
uvicorn interface.api:app --reload
```

La API expone:
- `GET /health`: verificación rápida.
- `POST /parser/preview`: recibe `{ "logs": "..." }`, requiere `x-api-key`, devuelve `{ events, incidents, global_severity, errors }`.

## Próximos pasos sugeridos

- Añadir reglas de correlación en `application/` que construyan Incident a partir de eventos.
- Persistir snapshots/incident reports usando `infrastructure/snapshots.py` e `infrastructure/database.py`.
- Ampliar métricas y monitoreo reutilizando la estructura modular ya creada.
