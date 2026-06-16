# Despliegue de Producción (VM Google Cloud + Vercel)

Arquitectura actual. **No se usa Neon ni Render** (legado, descartado).

```
┌─────────────────────────┐         ┌──────────────────────────────────────────┐
│  Vercel                 │  HTTPS  │  VM Google Cloud  (34.63.48.46)            │
│  Frontend (Vite/React)  │ ──────► │  Docker Compose                            │
│  auto-deploy en `main`  │         │   ├── backend  → :8000  (FastAPI/uvicorn)  │
└─────────────────────────┘         │   └── db       → :5432  (Postgres 17)      │
                                     │  data/*.json  = fallback offline           │
                                     └──────────────────────────────────────────┘
```

## Infraestructura (dónde está todo)

| Componente | Ubicación |
|------------|-----------|
| **Frontend** | Vercel — proyecto `printer-logs-analyzer` (org `ivmartinezcd-8237s-projects`). Auto-deploy en push a `main`. |
| **Backend** | VM Google Cloud, contenedor `printer-logs-analyzer-backend-1` → `http://34.63.48.46:8000` |
| **Base de datos** | VM Google Cloud, contenedor `printer-logs-analyzer-db-1` (Postgres 17). Host interno `db:5432`. **Puerto 5432 NO expuesto al exterior** (firewall GCP). |
| **VM** | IP `34.63.48.46` · hostname `instance-20260529-143249` · proyecto en `/home/ivmartinez_cd/Printer-Logs-Analyzer` |
| **SSH** | `ssh -i ~/.ssh/google_compute_engine imartinez@34.63.48.46` (Docker requiere `sudo`) |

> En la misma VM convive otro proyecto: `helpdesk-backend` (`:8010`). No tocar.

## Variables de Entorno

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `DB_URL` | ✅ | Conexión Postgres. En la VM: `postgresql://printerapp:***@db:5432/printer_logs` (definido en `docker-compose.yml`). |
| `ANTHROPIC_API_KEY` | ❌ | API key Anthropic para diagnóstico IA. |
| `API_KEY` / `VITE_API_KEY` | ❌ | API key interna (backend / frontend). Deben coincidir. |
| `SDS_WEB_USERNAME` / `SDS_WEB_PASSWORD` | ❌ | Portal HP SDS (extracción automática de logs). |
| `INSIGHT_PORTAL_URL` / `INSIGHT_API_KEY` / `INSIGHT_API_SECRET` | ❌ | API HP Insight (alertas y consumibles en tiempo real). |
| `SMTP_*` / `MAINTENANCE_EMAILS_ENABLED` | ❌ | Envío de mails de mantenimiento (Brevo). |

Plantilla en `.env.example`. Si la DB no responde, el backend cae automáticamente a **JSON local** en `data/` (`saved_analyses_local.json`, `telemetry_events_local.json`).

## Despliegue automático (CI/CD)

Push/merge a **`main`** dispara **dos** despliegues en paralelo:

1. **Backend** → `.github/workflows/deploy.yml` (acción `appleboy/ssh-action`):
   ```bash
   cd /home/ivmartinez_cd/Printer-Logs-Analyzer
   git reset --hard && git clean -fd && git checkout main && git pull origin main
   sudo docker compose down backend
   sudo docker compose up -d --build backend
   sudo docker exec printer-logs-analyzer-backend-1 python backend/scripts/run_migrations.py || true
   ```
   ⚠️ **Solo rebuildea el backend.** No toca el frontend ni la DB.
2. **Frontend** → Vercel detecta el push a `main` y publica automáticamente.

> **Branch protection en `main`:** requiere CI en verde (`Backend pytest` + `Frontend lint+typecheck+test+build`). El auto-merge NO está habilitado: mergear el PR a mano una vez que pasan los checks. Pushear a una rama feature **no** despliega nada.

Secrets del workflow (en GitHub): `VM_IP`, `VM_USER`, `SSH_PRIVATE_KEY`.

## Operación manual en la VM

```bash
ssh -i ~/.ssh/google_compute_engine imartinez@34.63.48.46

cd /home/ivmartinez_cd/Printer-Logs-Analyzer       # (requiere el dueño ivmartinez_cd / sudo)
sudo docker ps                                       # estado de contenedores
sudo docker compose logs -f backend                  # logs backend
sudo docker compose up -d --build backend            # redeploy backend manual

# Consultar la DB (Postgres en contenedor):
sudo docker exec printer-logs-analyzer-db-1 psql -U printerapp -d printer_logs -c "SELECT count(*) FROM saved_analyses;"
```

## Desarrollo local

```bash
# Opción A: DB local en Docker (recomendado)
docker compose up -d db            # Postgres en localhost:5432 (mismas credenciales)
npm run dev                        # frontend (5173) + backend (8000)

# Opción B: contra la DB real de la VM, vía túnel SSH (5432 no está expuesto)
ssh -i ~/.ssh/google_compute_engine -L 5432:localhost:5432 imartinez@34.63.48.46
# ...y dejar DB_URL apuntando a localhost:5432

# Opción C: sin DB → el backend usa el fallback JSON en data/ automáticamente
```

## Verificaciones Post-Deploy

- **Backend health:** `http://34.63.48.46:8000/health`
- **Swagger:** `http://34.63.48.46:8000/docs`
- **Frontend:** deployment de Vercel en verde para el commit de `main`.
- **CI:** todos los checks de GitHub Actions en verde.
