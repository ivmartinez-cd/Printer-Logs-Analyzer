# Estado actual de la aplicación — HP Logs Analyzer

Documento que describe qué hace la app hoy y cómo está implementado (sin modelos de impresora; flujo pegar → validar → analizar → dashboard).

---

## 1. Qué hace la app

- **Objetivo:** Herramienta web interna para analizar logs de impresoras HP: pegar el log, ver incidentes agrupados por código, severidad, enlaces de solución y eventos detallados.
- **Flujo del usuario:**
  1. Pegar el texto del log en un modal.
  2. Pulsar «Analizar». La app valida y parsea el log y detecta códigos que no están en el catálogo. Si hay códigos nuevos, solo se muestra la sección para agregarlos al catálogo; el resto del dashboard (KPIs, gráficos, tablas) se muestra cuando ya no queden códigos nuevos pendientes.
  3. Ver KPIs, gráficos y tablas (incidencias y eventos), con filtros por fecha, severidad y búsqueda.
  4. Opcional: agregar o editar códigos en el catálogo (descripción, severidad, URL de solución).

No hay selector de modelo de impresora; el análisis es genérico para logs HP en el formato soportado.

---

## 2. Arquitectura general

- **Backend:** Python, FastAPI, en `backend/`. Expone API REST protegida por cabecera `x-api-key`. Carga `.env` desde la raíz del repo.
- **Frontend:** React + Vite + TypeScript en `frontend/`. Consume la API y muestra el dashboard.
- **Base de datos:** PostgreSQL (p. ej. Neon). Se usa para el **catálogo de códigos de error** (`error_codes`). Los resultados de cada análisis no se persisten (MVP en memoria/cache).

---

## 3. Backend — qué hace y cómo

### 3.1 Entrada y configuración

- **Punto de entrada:** `backend/main.py` arranca Uvicorn con `interface.api:app`.
- **Configuración:** `backend/infrastructure/config.py` lee variables de entorno (`DB_URL`, `API_KEY`, `RECENCY_WINDOW`, etc.) y carga el `.env` desde la **raíz del proyecto** (no desde `backend/`).

### 3.2 Parsing de logs

- **Responsable:** `backend/application/parsers/log_parser.py` (`LogParser`).
- **Formato esperado:** Líneas con columnas (TAB o espacios): tipo de evento, código, fecha y hora, contador, firmware, ayuda/mensaje. Formato de fecha: `DD-MMM-YYYY HH:mm:ss`.
- **Comportamiento:**
  - Si una línea tiene menos de 6 columnas con TAB, se intenta parsear como columnas separadas por espacios (fecha y hora como dos tokens que se unen).
  - La primera línea se considera cabecera si contiene palabras clave (tipo, código, fecha, etc.) y se omite.
  - Las líneas que no se pueden parsear se registran como errores no fatales (no detienen el proceso) y se devuelven en la respuesta.
- **Salida:** `ParserReport` con lista de `Event` (dominio) y lista de `ParserError` (número de línea, línea cruda, motivo).

### 3.3 Análisis (incidencias)

- **Responsable:** `backend/application/services/analysis_service.py` (`AnalysisService`).
- **Lógica:**
  - Recibe la lista de `Event` ya enriquecida con datos del catálogo.
  - Agrupa por `code`. Por cada código genera un **Incident** con: primera y última vez, severidad máxima del grupo, número de ocurrencias, clasificación (usa la descripción del catálogo si existe) y `sds_link` (URL de solución del catálogo si existe).
  - Calcula una severidad global del log (máxima entre todos los eventos).
- No se usan reglas configurables (X, Y, ventanas) en el estado actual; solo agrupación por código y enriquecimiento desde el catálogo.

### 3.4 Catálogo de códigos (BD)

- **Tabla:** `error_codes` (ver `backend/migrations/003_create_error_codes.sql`): `id`, `code` (único), `severity`, `description`, `solution_url`, `created_at`, `updated_at`.
- **Repositorio:** `backend/infrastructure/repositories/error_code_repository.py`. Métodos:
  - `get_by_codes(codes)`: devuelve un mapa `code → ErrorCode` para los códigos que existen en la BD.
  - `upsert(code, severity, description, solution_url)`: inserta o actualiza por `code` (ON CONFLICT), devuelve la fila guardada.
- El backend **enriquece** cada evento con `code_severity`, `code_description` y `code_solution_url` a partir de este catálogo antes de pasar los eventos al análisis.

### 3.5 API (endpoints)

- **GET /health:** Comprueba que la API está viva; devuelve `status` y `recency_window` (config).
- **POST /parser/preview** (body: `{ "logs": "..." }`):
  - Autenticación: cabecera `x-api-key`.
  - Parsea el texto con `LogParser`, obtiene códigos únicos, consulta el catálogo, enriquece eventos, ejecuta `AnalysisService.analyze()` y devuelve eventos, incidencias, severidad global y errores de parseo.
  - Cache en memoria: si el cuerpo del log (hash SHA256) es el mismo que la petición anterior, devuelve la respuesta cacheada sin volver a parsear ni a BD.
- **POST /parser/validate** (body: `{ "logs": "..." }`):
  - Parsea el log y consulta el catálogo para determinar qué códigos detectados **no** están en la BD. Devuelve `total_lines`, `codes_detected`, `codes_new` y errores de parseo. No devuelve eventos ni incidencias.
- **POST /error-codes/upsert** (body: `code`, opcionales `severity`, `description`, `solution_url`):
  - Inserta o actualiza un código en `error_codes` e invalida la cache de preview para que el siguiente análisis use el catálogo actualizado.
  - Devuelve la fila guardada (id, code, severity, description, solution_url, created_at, updated_at).

---

## 4. Frontend — qué hace y cómo

### 4.1 Punto de entrada y estado

- **Página principal:** `frontend/src/pages/DashboardPage.tsx`. Contiene el flujo completo: bienvenida, modal de pegado, dashboard con KPIs, gráficos y tablas.
- **Estado relevante:** resultado del análisis (`result`: eventos e incidencias), códigos nuevos detectados (`codesNew`), fecha seleccionada para filtro (`selectedDate`), filtros de severidad y búsqueda para cada tabla, ordenación, IDs de incidencias expandidas, modales (pegar log, agregar/editar código).

### 4.2 Flujo de análisis

1. El usuario abre el modal «Pegar logs HP» y escribe o pega el log.
2. Al pulsar «Analizar» se llama a `handleAnalyze(logText)`:
   - Se llama en paralelo (o secuencial) a `previewLogs(logText)` y `validateLogs(logText)`.
   - Con la respuesta de `preview` se actualiza `result` (eventos e incidencias).
   - Con la respuesta de `validate` se actualiza `codesNew` (códigos que no están en el catálogo).
   - Si hay `codesNew.length > 0`, solo se muestra la sección de «códigos nuevos»; el bloque de KPIs, gráficos y tablas se renderiza solo cuando `codesNew.length === 0` (tras agregar los códigos al catálogo o si no había ninguno nuevo).
   - Toasts de éxito o error según el resultado.
3. El modal de pegado se cierra tras un análisis exitoso.

### 4.3 Dashboard (con resultado)

- **Header:** Título, botón «Analizar otro log», fecha/hora actual.
- **Banner de errores de parseo:** Si `result.errors.length > 0`, se muestra cuántas líneas se omitieron.
- **Sección de códigos nuevos:** Si `codesNew.length > 0`, lista de códigos con botón «Agregar al catálogo» por código; al pulsar se abre el modal de catálogo con código y descripción rellenados desde el primer evento que tenga ese código.
- **Filtro de fecha:** Selector de fecha (calendario) con rango min/max derivado de los eventos, más botón «Todo» para ver todo el log.
- **KPIs:** Tarjetas con total de incidentes, severidad máxima, códigos únicos y eventos en la ventana filtrada; colores según severidad.
- **Diagnóstico con IA:** Panel colapsado por defecto (`AIDiagnosticPanel`). Al expandirlo el usuario puede generar un diagnóstico llamando a `/analysis/ai-diagnose`; muestra secciones DIAGNÓSTICO / ACCIÓN / PRIORIDAD. El diagnóstico generado se preserva al colapsar/expandir.
- **Gráficos:** Issue volume por hora (área) y top 5 códigos (barras), ambos respetando la fecha seleccionada.
- **Tabla Incidencias:** Filas con código, clasificación, severidad, ocurrencias, primera/última vez, solución (enlace si existe) y botón «Editar». Filas expandibles: al expandir se muestra una fila de encabezados (Fecha y hora, Contador, Δ, Firmware, Mensaje/Ayuda) y las filas de cada evento del grupo con esos datos.
- **Tabla Recent Printer Errors:** Sección colapsable, **colapsada por defecto**, con eventos recientes (timestamp, código, severidad, mensaje, etc.) con filtros por severidad y búsqueda, y ordenación por columnas.
- **Filtros y ordenación:** Ambas tablas tienen filtro por severidad y caja de búsqueda (código/clasificación o código/mensaje), y cabeceras ordenables.

### 4.4 Catálogo (agregar / editar código)

- **Modal:** `frontend/src/components/AddCodeToCatalogModal.tsx`. Campos: código (solo lectura al editar), severidad (select), descripción, URL de solución. Se usa tanto para «Agregar al catálogo» (código nuevo) como para «Editar» desde una fila de incidencia.
- Al guardar se llama a `upsertErrorCode(body)`. Si es alta de código nuevo, se quita el código de `codesNew` para que desaparezca de la lista de pendientes. Toasts de éxito o error.

### 4.5 Servicios y tipos

- **API:** `frontend/src/services/api.ts` — `previewLogs`, `validateLogs`, `upsertErrorCode`. Base URL y API key desde `VITE_API_URL` y `VITE_API_KEY` (por defecto `http://localhost:8000` y valor por defecto si no hay env).
- **Tipos:** `frontend/src/types/api.ts` — interfaces para respuestas de parse/preview, validate, eventos, incidencias y body de upsert de código.

### 4.6 Estilos y UX

- Estilos globales y por componente en `frontend/src/index.css` (incluye tablas, modales, toasts, filtros, filas expandibles).
- Toasts globales vía `ToastContext` y componente `Toast`; se usan para éxito, advertencia y error.

---

## 5. Persistencia y datos

- **Persistido:** Catálogo `error_codes` y snapshots `saved_analyses` en PostgreSQL (Neon). Las migraciones están en `backend/migrations/` (001–006). La 006 agrega `printer_models`, `printer_consumables` y `consumable_related_codes`, y la columna `model_id` en `saved_analyses` — pendiente de correr en Neon.
- **No persistido:** Resultado de cada análisis (eventos e incidencias). Cada petición de preview se calcula desde el log enviado.

---

## 6. Cómo ejecutarla

- **Raíz del proyecto:** `.env` en la raíz con `DB_URL` y `API_KEY` (y opcionales). Backend lee ese `.env`.
- **Un solo comando:** Desde la raíz, `npm run dev` arranca frontend (Vite) y backend (Uvicorn con `cd backend && uvicorn interface.api:app --reload`).
- **Por separado:** `npm run dev:frontend` y `npm run dev:backend`; dependencias: `pip install -r backend/requirements.txt`, `npm install` en frontend (o desde raíz con `npm run dev` que usa el monorepo).

---

## 7. Resumen rápido

| Área            | Qué hace                                                                 | Dónde / cómo                                           |
|-----------------|---------------------------------------------------------------------------|--------------------------------------------------------|
| Parsing         | Convierte texto de log HP en eventos (y errores de línea)                | `LogParser` en backend; TAB o espacios; fecha DD-MMM-YYYY |
| Catálogo        | Guarda y consulta códigos con severidad, descripción y URL de solución    | PostgreSQL `error_codes`; `ErrorCodeRepository`        |
| Análisis        | Agrupa eventos por código y genera incidencias con severidad y enlaces    | `AnalysisService` en backend                           |
| API             | Preview (parse + enriquecer + analizar), validate (códigos nuevos), upsert código | FastAPI en `backend/interface/api.py`; auth `x-api-key` |
| UI              | Pegar log, analizar, ver dashboard, filtrar, expandir, agregar/editar código | React en `DashboardPage.tsx` y modales                 |
| Modelos         | Tablas DB creadas (migración 006); integración en backend/frontend pendiente | `printer_models`, `printer_consumables`, `consumable_related_codes` |

Este documento refleja el estado actual del código y puede actualizarse cuando cambien flujos o componentes.
