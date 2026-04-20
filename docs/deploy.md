# Despliegue de Producción (Render + Vercel)

Esta guía detalla los pasos para desplegar el Printer-Logs-Analyzer en entornos de producción y la configuración de variables necesaria.

## Variables de Entorno Requeridas

| Variable | Requerida | Descripción | Ejemplo |
|----------|-----------|-------------|---------|
| `DB_URL` | ✅ SÍ | String de conexión a PostgreSQL (Neon) | `postgresql://user:pass@host:5432/db` |
| `ANTHROPIC_API_KEY` | ❌ No | API key de Anthropic para diagnóstico con IA | `sk-ant-api03-...` |
| `SDS_WEB_USERNAME` | ❌ No | Usuario del portal HP SDS (para extracción automática) | `your-username` |
| `SDS_WEB_PASSWORD` | ❌ No | Contraseña del portal HP SDS | `your-password` |
| `INSIGHT_PORTAL_URL` | ❌ No | URL base de la API HP Insight | `https://hp-sds-latam.insightportal.net` |
| `INSIGHT_API_KEY` | ❌ No | API key de HP Insight | `...` |
| `INSIGHT_API_SECRET` | ❌ No | API secret de HP Insight | `...` |
| `API_KEY` | ❌ No | API key interna de la aplicación (default: "dev") | `dev` |

## Despliegue en Render (Backend + DB)

1. **Crear base de datos PostgreSQL:**
   - Render Dashboard → Databases → **Create new database**.
   - Nombre: `printer-logs-db`.
   - Copiar la **External Database URL** para usarla como `DB_URL`.

2. **Crear servicio Web Backend:**
   - New Web Service → Conectar repositorio GitHub.
   - **Build Command:** `pip install -r backend/requirements.txt && npm run lint && npm run typecheck && npm run test:backend`
   - **Start Command:** `uvicorn backend.interface.api:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables:** Configurar todas las variables listadas en la tabla superior (puedes basarte en `.env.example`).

## Despliegue en Vercel (Frontend)

1. **Crear nuevo proyecto:**
   - Importar repositorio desde GitHub.
   - **Framework Preset:** Vite.
   - **Build Command:** `npm run build`.
   - **Output Directory:** `frontend/dist`.
2. **Environment Variables:**
   - `VITE_API_BASE`: URL de tu servicio de Render (ej: `https://printer-logs-analyzer.onrender.com`).
   - `VITE_API_KEY`: El mismo valor de `API_KEY` configurado en el backend.

## Ejecución con Docker (Local)

Para probar el entorno de producción de forma local:

```bash
# 1. Copiar plantilla de variables
cp .env.example .env

# 2. Editar .env con tus credenciales reales

# 3. Compilar e iniciar contenedores
docker compose up --build

# Endpoints locales:
# Backend:  http://localhost:8000
# Frontend: http://localhost:5173
```

---

## Verificaciones Post-Deploy

- **Healthcheck:** Acceder a `https://tu-backend.onrender.com/health`.
- **Documentación API:** Acceder a `https://tu-backend.onrender.com/docs` (Swagger).
- **Tests CI:** Verificar que todos los checks de GitHub Actions estén en verde.
