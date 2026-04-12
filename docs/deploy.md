# Deploy y CI

## URLs de producción

| Servicio | URL |
|----------|-----|
| Frontend (Vercel) | `https://printer-logs-analyzer.vercel.app` |
| Backend (Render) | `https://printer-logs-analyzer.onrender.com` |

## Variables de entorno en producción

**Render (backend):**

| Variable | Descripción | Requerida para |
|----------|-------------|----------------|
| `DB_URL` | Connection string de Neon PostgreSQL | Todo |
| `API_KEY` | Clave compartida con el frontend | Todo |
| `ENV` | Setear a `production` | Logs de advertencia |
| `ANTHROPIC_API_KEY` | API key de Anthropic (Claude) | CPMD ingest (`POST /models/{id}/cpmd`) y diagnóstico AI |

Si `API_KEY` no está seteada, el backend usa `"dev"` como fallback. Con `ENV=production` loguea un WARNING al arrancar.

Si `ANTHROPIC_API_KEY` no está seteada, los endpoints `/models/{id}/cpmd` y `/analysis/ai-diagnose` devuelven HTTP 503. El resto del backend funciona normalmente.

### Límite de tiempo en Render (CPMD ingest)

El endpoint `POST /models/{id}/cpmd` es bloqueante y puede tardar **5–10 minutos** por CPMD (~250 llamadas secuenciales a Haiku). El plan gratuito de Render tiene un timeout de request de 30 segundos. Para usar este endpoint en producción se requiere al menos el plan **Starter** de Render (sin timeout de request) o configurar un worker separado.

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
