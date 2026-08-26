# Despliegue de Producción (Render + Neon + Vercel)

Arquitectura actual. **La VM de Google Cloud fue dada de baja** (dejó de responder y no se
mantuvo); tampoco se usa más la variante anterior con Postgres en Docker sobre esa VM.

```
┌─────────────────────────┐         ┌──────────────────────────┐      ┌──────────────────┐
│  Vercel                 │  HTTPS  │  Render                  │ TCP  │  Neon             │
│  Frontend (Vite/React)  │ ──────► │  Backend (FastAPI/uvicorn)│ ───► │  Postgres 17       │
│  auto-deploy en `main`  │         │  free tier, duerme a los  │      │  free tier         │
└─────────────────────────┘         │  15 min de inactividad    │      └──────────────────┘
                                     └──────────────────────────┘
```

## Infraestructura (dónde está todo)

| Componente | Ubicación |
|------------|-----------|
| **Frontend** | Vercel — proyecto `printer-logs-analyzer` (`https://printer-logs-analyzer-alpha.vercel.app`, cuenta nueva). Root Directory: `frontend`. Auto-deploy en push a `main`. |
| **Backend** | Render — `https://printer-logs-analyzer-st1l.onrender.com`, Web Service sobre `backend/Dockerfile` (Docker Build Context Directory: `backend`). Free tier: duerme tras 15 min sin tráfico, cold start ~50s. |
| **Base de datos** | Neon — Postgres 17 gestionado. `DB_URL` con `?sslmode=require&channel_binding=require` (endpoint `-pooler`). |

## Limitaciones aceptadas del free tier (ver plan de migración para el detalle completo)

- **Sin sync automático de flota ni snapshots SDS programados.** `ENABLE_SCHEDULER=false` en
  Render: el spin-down por inactividad rompe los jobs de `backend/application/scheduler.py`
  (sync cada 30 min, snapshots 08:00/20:00 UTC) de todas formas, así que se desactivan en vez de
  dejarlos correr de forma no confiable. Uso pensado: a demanda, no 24/7.
- **`DISABLE_LOCAL_FALLBACK=true` en Render.** En disco efímero, el fallback a JSON local
  (`data/*.json`) podía escribir datos que se pierden en el próximo redeploy sin avisar. Con esta
  variable, si Neon no responde el backend falla explícito en vez de degradar en silencio.
- **`POST /cpmd/upload` no persiste.** Los PDFs subidos en runtime se pierden en cada redeploy.
  Para agregar un manual nuevo: commitear el PDF a `data/cpmd/` + actualizar `manifest.json` +
  push. El script `scripts/upload-cpmd.sh` (hacía `scp` a la VM) quedó obsoleto.
- **Job tracker en memoria.** Si el servicio duerme durante un sync en curso, el polling de
  `/maintenance/sync-status/{id}` devuelve 404 en vez de continuar tras el redeploy.

## Variables de Entorno

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `DB_URL` | ✅ | Conexión a Neon Postgres, con `?sslmode=require`. |
| `API_KEY` / `VITE_API_KEY` | ✅ | API key interna (backend / frontend). Deben coincidir. **No usar el default `dev`**: el bundle del frontend es público, cualquiera con la URL de Render podría usar la API (incluye credenciales de portales HP y costo de Anthropic). |
| `ENABLE_SCHEDULER` | ❌ (default `true`) | Poner en `false` en Render. |
| `DISABLE_LOCAL_FALLBACK` | ❌ (default `false`) | Poner en `true` en Render. |
| `ANTHROPIC_API_KEY` | ❌ | API key Anthropic para diagnóstico IA. |
| `SDS_WEB_USERNAME` / `SDS_WEB_PASSWORD` | ❌ | Portal HP SDS (extracción automática de logs). |
| `INSIGHT_PORTAL_URL` / `INSIGHT_API_KEY` / `INSIGHT_API_SECRET` | ❌ | API HP Insight (alertas y consumibles en tiempo real). |
| `SMTP_*` / `MAINTENANCE_EMAILS_ENABLED` | ❌ | Envío de mails de mantenimiento (Brevo). |

Plantilla en `.env.example`.

## Despliegue

- **Backend** → Render hace auto-deploy en push a `main` (o el branch que se configure en el
  dashboard de Render), usando `backend/Dockerfile`. Las migraciones corren solas al arrancar
  el contenedor (`run_migrations.py` en el `CMD` del Dockerfile).
- **Frontend** → Vercel detecta el push a `main` y publica automáticamente. Variables de build:
  `VITE_API_URL` (URL HTTPS de Render) y `VITE_API_KEY` (igual a `API_KEY` del backend).

> El workflow anterior en `.github/workflows/deploy.yml` (deploy por SSH a la VM) quedó obsoleto
> y debería eliminarse o reemplazarse por un hook/webhook de Render si se quiere disparo manual.

## Desarrollo local

```bash
# Opción A: DB local en Docker (recomendado)
docker compose up -d db            # Postgres en localhost:5432 (mismas credenciales)
npm run dev                        # frontend (5173) + backend (8000)

# Opción B: contra Neon directamente
# Poner DB_URL apuntando a la connection string de Neon en .env

# Opción C: sin DB → el backend usa el fallback JSON en data/ automáticamente
# (dev local no setea DISABLE_LOCAL_FALLBACK, así que esto sigue funcionando)
```

## Verificaciones Post-Deploy

- **Backend health:** `https://<servicio>.onrender.com/health` — debe devolver
  `"db_mode": "postgres"`. Si devuelve `"local_fallback"`, la conexión a Neon está mal.
- **Swagger:** `https://<servicio>.onrender.com/docs`
- **Frontend:** deployment de Vercel en verde para el commit de `main`, y debe listar los
  análisis guardados migrados a Neon.
- **CI:** todos los checks de GitHub Actions en verde.
