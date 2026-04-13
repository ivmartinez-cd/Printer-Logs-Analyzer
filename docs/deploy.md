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
| `INSIGHT_PORTAL_URL` | URL base del portal Insight | Alertas SDS en tiempo real |
| `INSIGHT_API_KEY` | Cliente API Key de Insight | Alertas SDS en tiempo real |
| `INSIGHT_API_SECRET` | Cliente API Secret de Insight | Alertas SDS en tiempo real |

Si `API_KEY` no está seteada, el backend usa `"dev"` como fallback. Con `ENV=production` loguea un WARNING al arrancar.

Si `ANTHROPIC_API_KEY` no está seteada, los endpoints `/models/{id}/cpmd` y `/analysis/ai-diagnose` devuelven HTTP 503. El resto del backend funciona normalmente.

### Límite de tiempo en Render (CPMD ingest)

El endpoint `POST /models/{id}/cpmd` es bloqueante y puede tardar **5–10 minutos** por CPMD (~250 llamadas secuenciales a Haiku). El plan gratuito de Render tiene un timeout de request de 30 segundos. Para usar este endpoint en producción se requiere al menos el plan **Starter** de Render (sin timeout de request) o configurar un worker separado.

> **Workaround actual:** usar el script CLI `ingest_cpmd` desde la máquina local (ver sección "Carga de CPMDs" más abajo).

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

## Carga de CPMDs

El endpoint `POST /models/{id}/cpmd` no funciona en Render free por timeout (5–10 min por CPMD). Para cargar CPMDs en producción, usar el script CLI desde la máquina local:

```bash
export DB_URL="<connection string de Neon producción>"
export ANTHROPIC_API_KEY="<tu key>"

# Verificar primero (no llama a Haiku ni escribe en DB)
python -m backend.scripts.ingest_cpmd --model-id <uuid> --pdf ./modelo.pdf --dry-run

# Procesar
python -m backend.scripts.ingest_cpmd --model-id <uuid> --pdf ./modelo.pdf
```

El script loguea progreso cada 25 bloques y al terminar imprime:

```
✓ CPMD procesado para modelo <uuid>

  Hash:        <sha256>
  Bloques:     250
  Extraídos:   247
  Fallidos:    3
  Tiempo:      342.5s
  Costo aprox: $0.4446 USD
```

Tarda 5–10 minutos por CPMD. Costo aprox: **$0.45 USD por modelo**.

El UUID del modelo se obtiene del listado en la UI o con:
```sql
SELECT id, model_name FROM printer_models ORDER BY model_name;
```

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
