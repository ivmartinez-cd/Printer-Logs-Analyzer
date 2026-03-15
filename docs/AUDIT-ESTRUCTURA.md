# Auditoría y reorganización del árbol del repositorio

Resumen de cambios aplicados y sugerencias de limpieza.

---

## Cambios realizados

### Carpetas y archivos creados / movidos

| Antes | Después | Motivo |
|-------|---------|--------|
| `hp_log.txt` (raíz) | `samples/hp_log.txt` | Los datos de prueba van en `samples/` para no ensuciar la raíz. |
| `request.json` (raíz) | `samples/request.json` | Body de ejemplo para la API; mismo criterio. |
| `vision.txt` (raíz) | `docs/vision.md` | Documentación de producto en `docs/` y formato Markdown. |
| `config.json` (raíz) | `config/default.json` | Configuración estática en una carpeta dedicada. |

### Archivos eliminados

- **`frontend/src/pages/DashboardPage.css`**: Solo contenía un comentario; los estilos están en `index.css`. Se eliminó el archivo y la importación en `DashboardPage.tsx`.

### Actualización de documentación

- **README.md**: Estructura del proyecto ampliada (`config/`, `docs/`, `migrations/`, `samples/`, `snapshots/`). Referencias a `config.json` y al parser actualizadas a `config/default.json` y `samples/hp_log.txt`.

### Reorganización backend / frontend

- Se creó la carpeta **`backend/`** y se movió dentro todo el código del servidor: `application/`, `config/`, `domain/`, `infrastructure/`, `interface/`, `migrations/`, `scripts/`, `main.py` y `requirements.txt`.
- La raíz queda con **`backend/`** y **`frontend/** como las dos carpetas principales del proyecto.
- **`.env`** se mantiene en la raíz; `backend/infrastructure/config.py` carga el `.env` desde la raíz del repo.
- **package.json**: el script `dev:backend` ejecuta `cd backend && uvicorn interface.api:app --reload` para que los imports sigan siendo `application.*`, `domain.*`, etc.

---

## Árbol actual (resumido)

```
Printer-Logs-Analyzer/
├── .env.example
├── .gitignore
├── README.md
├── package.json         # Scripts dev (concurrently)
├── dev.cmd
│
├── backend/             # Servidor (API + lógica)
│   ├── application/     # LogParser, AnalysisService
│   ├── config/          # default.json
│   ├── domain/          # entities.py
│   ├── infrastructure/  # config.py, database.py, repositories/
│   ├── interface/       # api.py
│   ├── migrations/      # SQL (PostgreSQL/Neon)
│   ├── scripts/         # run_parser.py, etc.
│   ├── main.py
│   └── requirements.txt
│
├── frontend/            # React + Vite
│   └── src/
│       ├── components/
│       ├── contexts/
│       ├── pages/
│       ├── services/
│       ├── styles/
│       └── types/
│
├── docs/                # Documentación
│   ├── AUDIT-ESTRUCTURA.md
│   ├── powershell-execution-policy.md
│   └── vision.md
│
├── samples/             # Datos de prueba
│   ├── hp_log.txt
│   └── request.json
│
└── snapshots/           # Versiones de config (respaldo)
    └── config_versions/
```

---

## Limpieza posterior (código sin uso y referencias a scripts inexistentes)

### Archivos eliminados

- **`infrastructure/json_config_loader.py`**: sin referencias; pensado para scripts de seed/update que no existen.

- **`infrastructure/json_config_validator.py`**: sin referencias; validación de JSON de reglas no usada.

- **`infrastructure/snapshots.py`**  
  `SnapshotStore` no se usa en la aplicación ni en los scripts; el README lo menciona como “próximo paso”.  
Referencias a scripts inexistentes (`seed_config.py`, `update_config.py`) eliminadas del README.

---

La carpeta `snapshots/config_versions/` se mantiene como respaldo de versiones de configuración.
