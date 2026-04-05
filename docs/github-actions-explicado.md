# Cómo funciona el CI en GitHub Actions

## ¿Qué es GitHub Actions?

Es el sistema de automatización integrado en GitHub. Cuando subís código, GitHub lee los archivos `.yml` dentro de `.github/workflows/` y ejecuta las instrucciones que encuentre ahí — sin que tengas que hacer nada manual.

En este proyecto hay un solo workflow: `.github/workflows/ci.yml`.

---

## ¿Cuándo se activa?

```yaml
on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]
```

Se activa en dos situaciones:
- Cuando hacés un **push directo** a `main` (o `master`)
- Cuando abrís o actualizás un **Pull Request** que apunta a `main`

En la práctica, como `main` tiene protección de branch (requiere PR), casi siempre se activa por la segunda vía — cuando abrís un PR.

---

## ¿Qué hace exactamente?

El workflow tiene **dos jobs que corren en paralelo**, cada uno en una máquina virtual limpia de Ubuntu.

### Job 1 — Frontend

```
Checkout → Node 20 → npm ci → lint → typecheck → test → build
```

| Paso | Qué hace |
|------|----------|
| **Checkout** | Descarga el código del repo en la máquina virtual |
| **Setup Node** | Instala Node.js versión 20 |
| **Install dependencies** | `cd frontend && npm ci` — instala exactamente lo que dice `package-lock.json` |
| **Lint** | ESLint — detecta errores de código y malas prácticas |
| **Typecheck** | `tsc --noEmit` — verifica que TypeScript no tenga errores de tipos |
| **Test** | Vitest — corre los 70 tests del frontend |
| **Build** | `vite build` — compila el proyecto completo para verificar que no haya errores de build |

### Job 2 — Backend

```
Checkout → Python 3.11 → pip install → pytest
```

| Paso | Qué hace |
|------|----------|
| **Checkout** | Descarga el código |
| **Setup Python** | Instala Python 3.11 |
| **Install dependencies** | `pip install -r backend/requirements.txt` |
| **Test** | `pytest backend/tests/ -v` — corre los 49 tests del backend |

---

## ¿Por qué no necesita base de datos ni API key?

El backend tiene un mecanismo de **fallback JSON**: si PostgreSQL no está disponible, usa archivos locales en `backend/data/`. Los tests aprovechan esto — no necesitan `DB_URL` ni secretos de GitHub. Es una decisión intencional de diseño.

---

## ¿Qué es el "cache"?

```yaml
cache: 'npm'
cache-dependency-path: 'frontend/package-lock.json'
```

GitHub guarda una copia de `node_modules` y de los paquetes de pip entre ejecuciones. Si `package-lock.json` no cambió, reutiliza el cache en lugar de volver a descargar todo. Esto hace que los runs sean mucho más rápidos (segundos en vez de minutos).

---

## ¿Qué son los "status checks"?

Cuando el PR #2 mostró "2 of 2 required status checks", se refería exactamente a estos dos jobs:
- `Frontend (lint + typecheck + test + build)`
- `Backend (pytest)`

La protección de branch en GitHub está configurada para **bloquear el merge** si alguno falla. Así se garantiza que nada roto entre a `main`.

---

## ¿Qué son las "actions" y las versiones @v6?

Cada `uses: actions/checkout@v6` es una **action**: un bloque de código reutilizable publicado en GitHub Marketplace. El `@v6` es la versión.

Las que usa este proyecto:

| Action | Para qué sirve |
|--------|---------------|
| `actions/checkout@v6` | Descarga el código del repo en la máquina |
| `actions/setup-node@v6` | Instala Node.js con soporte de cache |
| `actions/setup-python@v6` | Instala Python con soporte de cache |

Se actualizaron de `@v4`/`@v5` a `@v6` porque la versión nueva tiene soporte nativo para Node 24 y mejoras de performance.

---

## Flujo completo de un PR

```
1. Abrís un PR en GitHub
        ↓
2. GitHub detecta el evento "pull_request"
        ↓
3. Lanza dos máquinas virtuales Ubuntu en paralelo
        ↓
4. Job Frontend: lint + typecheck + test + build  ─┐
   Job Backend: pytest                             ─┘ (corren simultáneo)
        ↓
5. Ambos pasan → aparece ✅ en el PR → podés mergear
   Alguno falla → aparece ❌ → el merge queda bloqueado
```

---

## ¿Dónde ver los logs de cada ejecución?

En GitHub: **Actions** (tab superior del repo) → seleccionás el run → expandís cualquier paso para ver la salida completa.

También desde la terminal:
```bash
gh run list          # últimos runs
gh run view <id>     # detalle de un run específico
```
