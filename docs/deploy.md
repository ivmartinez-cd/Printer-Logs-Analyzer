# Deploy y CI

## URLs de producción

| Servicio | URL |
|----------|-----|
| Frontend (Vercel) | `https://printer-logs-analyzer.vercel.app` |
| Backend (Render) | `https://printer-logs-analyzer.onrender.com` |

## Variables de entorno en producción

**Render (backend):**

| Variable | Requerida | Descripción | Ejemplo |
|----------|-----------|-------------|---------|
| `DB_URL` | ✅ **SÍ** | Connection string de Neon PostgreSQL | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `API_KEY` | ❌ No | Clave compartida con el frontend (default: "dev") | `dev` |
| `ANTHROPIC_API_KEY` | ❌ No | API key de Anthropic (Claude) para diagnóstico IA | `sk-ant-api03-...` |
| `SDS_WEB_USERNAME` | ❌ No | Usuario portal HP SDS (para extracción automática de logs) | `your-username` |
| `SDS_WEB_PASSWORD` | ❌ No | Contraseña portal HP SDS | `your-password` |
| `INSIGHT_PORTAL_URL` | ❌ No | URL base del portal Insight HP | `https://hp-sds-latam.insightportal.net` |
| `INSIGHT_API_KEY` | ❌ No | Cliente API Key de Insight | `...` |
| `INSIGHT_API_SECRET` | ❌ No | Cliente API Secret de Insight | `...` |

**Comportamiento por variable:**
- `DB_URL`: **Crítica** — sin ella, el backend no inicia.
- `API_KEY`: Si no está, usa default `"dev"`. Cambiar en producción por seguridad.
- `ANTHROPIC_API_KEY`: Sin ella, `/analysis/ai-diagnose` devuelve HTTP 503. El resto del backend funciona.
- `SDS_WEB_*`: Sin ellas, la extracción automática por serial no funciona. Log manual sigue disponible.
- `INSIGHT_*`: Sin ellas, las alertas y consumibles en tiempo real no se cargan. El análisis base funciona.

**Vercel (frontend):**

| Variable | Valor |
|----------|-------|
| `VITE_API_BASE` | `https://printer-logs-analyzer.onrender.com` |
| `VITE_API_KEY` | Mismo valor que `API_KEY` del backend |

Las variables `VITE_*` se embeben en build-time; cambiarlas en Vercel requiere redeploy manual.

## Start command en Render

```
uvicorn backend.interface.api:app --host 0.0.0.0 --port $PORT
```

Sin `--reload` en producción.

## Diferencias local vs producción

| Aspecto | Local | Producción |
|---------|-------|-----------|
| Backend URL | `http://localhost:8000` | `https://printer-logs-analyzer.onrender.com` |
| Frontend URL | `http://localhost:5173` | `https://printer-logs-analyzer.vercel.app` |
| Vars de entorno | `.env` en raíz / `frontend/.env` | Dashboard de Render / Vercel |
| Hot-reload | Sí (uvicorn `--reload`) | No |
| DB fallback | Activo si sin red a Neon | Siempre conectado |

## Quick Start: Deploy en Render + Vercel

### 1. Preparar PostgreSQL en Render

1. Ir a [render.com](https://render.com)
2. Dashboard → New PostgreSQL database
3. Configurar:
   - **Name:** `printer-logs-analyzer-db`
   - **Region:** tu región (ej: Ohio)
   - **PostgreSQL Version:** 15 (o latest)
4. Copiar **External Database URL** → variable `DB_URL` en Render Web Service

### 2. Deploy Backend en Render

1. New Web Service → Connect GitHub repo
2. Configurar:
   - **Name:** `printer-logs-analyzer-backend`
   - **Runtime:** Python 3.11
   - **Build Command:** `pip install -r backend/requirements.txt && npm run typecheck && npm run test:backend`
   - **Start Command:** `uvicorn backend.interface.api:get_app --factory --host 0.0.0.0 --port $PORT`
3. Environment Variables → Agregar desde `.env.example`:
   ```
   DB_URL=postgresql://...
   ANTHROPIC_API_KEY=sk-ant-api03-...
   SDS_WEB_USERNAME=...
   SDS_WEB_PASSWORD=...
   INSIGHT_API_KEY=...
   INSIGHT_API_SECRET=...
   INSIGHT_PORTAL_URL=https://hp-sds-latam.insightportal.net
   ```
4. Deploy

### 3. Deploy Frontend en Vercel

1. Ir a [vercel.com](https://vercel.com)
2. New Project → Import GitHub repo
3. Configurar:
   - **Framework Preset:** Vite
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `frontend/dist`
4. Environment Variables:
   ```
   VITE_API_BASE=https://printer-logs-analyzer-backend.onrender.com
   VITE_API_KEY=dev (o el mismo que en Render)
   ```
5. Deploy

### 4. Verificar que todo funciona

- Frontend: https://your-frontend.vercel.app
- Backend Swagger: https://your-backend.onrender.com/docs
- Backend health: https://your-backend.onrender.com/health

---

## CI — GitHub Actions

Workflow en `.github/workflows/ci.yml`. Push y PR a `main`/`master`.

**Dos jobs paralelos en `ubuntu-latest`:**

| Job | Pasos |
|-----|-------|
| `frontend` | checkout → Node 20 → `cd frontend && npm ci` → lint → typecheck → test → build |
| `backend` | checkout → Python 3.11 → `pip install -r backend/requirements.txt` → pytest |

Notas:
- Actions en `@v6` (soporte Node 24).
- Cache activo: `frontend/package-lock.json` para npm, `backend/requirements.txt` para pip.
- Root `npm ci` omitido (scripts usan `--prefix frontend`).
- Backend sin `DB_URL` — tests usan fallback JSON automáticamente.
- No hay deploy automático en el workflow — Vercel y Render tienen sus propios auto-deploys.
