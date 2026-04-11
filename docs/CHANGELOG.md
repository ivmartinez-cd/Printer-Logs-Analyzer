# CHANGELOG — Bugs resueltos y features históricas

Historial extraído de CLAUDE.md. Para guía activa del repo, ver CLAUDE.md.

---

**Fix: conexiones idle cerradas por Neon causan OperationalError/InterfaceError en producción**
- Neon cierra conexiones del pool cuando están idle, y al reusarlas se obtenía `psycopg2.OperationalError: SSL connection has been closed unexpectedly` o `InterfaceError: connection already closed`.
- Fix en `database.py`: `connect()` ahora hace un **pre-ping** (`SELECT 1`) sobre cada conexión obtenida del pool antes de cederla al caller. Si el ping falla, descarta la conexión (`putconn(conn, close=True)`) y reintenta hasta 3 veces.
- `rollback()` y `putconn()` del bloque finally están envueltos en `try/except` para no propagar `InterfaceError` cuando la conexión ya estaba cerrada al momento de la excepción.
- Diferencia respecto al comportamiento anterior: `psycopg2.pool.PoolError` (pool exhausto) sigue levantando `DatabaseUnavailableError` inmediatamente sin reintentar; solo las conexiones muertas se reintentan.
- Los repositorios siguen haciendo `commit()` explícito — `connect()` no auto-commitea.

---

**HelpModal: reescritura completa con estado actual de la app**
- 11 secciones en orden de aparición en pantalla: Flujo de análisis, KPIs, Diagnóstico con IA, SDS Engineering Incident, Advertencias de consumibles, Filtros de fecha, Gráficos, Tablas, Catálogo de códigos, Incidentes guardados, Exportar PDF.
- Eliminadas referencias a flujo viejo (sin modelo) y a filtros de fecha por botones discretos.
- Documentado el sufijo `z` como comodín hex en el match SDS, los presets del DateRangePicker y los thresholds de estado de consumibles.

---

**Feat: toggles ERROR / WARNING / INFO activos por default en TopErrorsChart**
- `activeTypes` inicializado con `new Set(['ERROR', 'WARNING', 'INFO'])` — los tres tipos visibles al cargar.
- Antes arrancaba con los tres desactivados, mostrando la barra vacía hasta que el usuario los activaba manualmente.

---

**Perf: extractor de PDF de modelos cambia de Sonnet a Haiku**
- `POST /printer-models/upload-pdf`: el prompt de extracción de modelos y consumibles ahora usa `claude-haiku-4-5-20251001` en lugar de `claude-sonnet-4-6`.
- Reduce costo por extracción sin impacto observable en calidad del parseo estructurado.
- `max_tokens` subido a 16 000 para acomodar PDFs con muchos modelos.

---

**Fix: `/health` referenciaba `settings.recency_window` inexistente**
- `Settings` no tiene campo `recency_window`; la referencia lanzaba `AttributeError` en producción.
- Fix: eliminar la línea; `/health` ya no incluye ese campo en la respuesta.

---

**Fase 4: consumable warnings — backend y panel frontend**
- Nuevo servicio `consumable_warning_service.py`: `compute_consumable_warnings(events, consumables, max_counter)` — devuelve `List[ConsumableWarning]` ordenada por `usage_pct` desc. Solo incluye consumibles con al menos un código de log matcheado. Soporta wildcard `z` en patrones de código.
- Thresholds: ≥100% → `replace`, ≥80% → `warning`, <80% → `ok`.
- `POST /parser/preview` llama al servicio cuando `model_id` está presente; fallos se loguean sin romper el análisis.
- Nuevo campo `consumable_warnings: ConsumableWarning[]` en `ParseLogsResponse`.
- Nuevo componente `ConsumableWarningsPanel.tsx`: tabla con categoría, descripción, part number, vida útil, contador actual, % de uso y badge de estado. Arranca colapsado. Solo se renderiza si `warnings.length > 0`. Posición: entre `SDSIncidentPanel` y los gráficos.
- `SDSIncidentPanel` recibe `consumableWarnings?` y muestra sección "Verificar cambio de consumible" cuando hay solapamiento de códigos SDS con consumibles en estado `replace`.
- Nuevos tipos `ConsumableWarning` en `types/api.ts`.
- 148 tests en `test_consumable_warning_service.py`.

---

**Fase 3: selector de modelo de impresora en el modal de análisis**
- `LogPasteModal` (en `DashboardPage.tsx`) muestra un `<select>` de modelos cargado desde `GET /printer-models`. El textarea y el botón "Analizar" están deshabilitados hasta seleccionar un modelo.
- Botón "+ Cargar nuevo modelo (PDF)" abre el nuevo `AddPrinterModelModal`.
- `AddPrinterModelModal`: sube un PDF a `POST /printer-models/upload-pdf` (timeout 90 s), valida tipo y tamaño (≤10 MB) en cliente, muestra spinner durante el procesamiento con IA.
- Al completarse el upload, se re-fetcha la lista de modelos y se auto-selecciona el primer modelo creado.
- `previewLogs(logs, modelId?)` incluye `model_id` en el body.
- Nuevos tipos: `PrinterModel`, `UploadPdfResponse` en `types/api.ts`.
- Nuevas funciones API: `listPrinterModels`, `uploadPrinterModelPdf` en `services/api.ts`.
- Nuevos estilos: `.log-modal__model-*`, `.add-printer-model-modal__*` en `index.css`.

---

**Backend: endpoints de modelos de impresora y upload de PDF**
- `GET /printer-models`: lista todos los modelos disponibles.
- `POST /printer-models/upload-pdf`: recibe un PDF multipart, lo extrae con Claude (Haiku), persiste `printer_models` + `printer_consumables` + `consumable_related_codes` y devuelve los modelos creados.
- `PrinterModelRepository` con soporte fallback JSON.

---

**Migración 006: soporte de modelos de impresora y consumibles**
- Nuevas tablas: `printer_models` (un submodelo por fila, con `ampv` y `engine_life_pages`), `printer_consumables` (por modelo, con `life_pages`, `mttr_minutes`, `voltage`, `category`), `consumable_related_codes` (patrones de código con soporte wildcard `z`).
- `ALTER TABLE saved_analyses ADD COLUMN model_id UUID` (nullable, FK a `printer_models`). Compatible con análisis existentes.
- Todas las tablas con `IF NOT EXISTS` — migración idempotente.

---

**Refactor: eliminar DiagnosticPanel (reglas fijas) y dejar solo AIDiagnosticPanel**
- `DiagnosticPanel.tsx` y su test eliminados. `diagnosticRef` eliminado de `useExportPdf`.
- `AIDiagnosticPanel` ocupa el lugar entre KPIs y gráficos. CSS `.diagnostic-panel*` eliminado de `index.css`.

**Feature: EventsTable arranca colapsada por defecto**
- `isCollapsed` inicializado en `true`. El toggle del header sigue funcionando igual.
- Tests de `EventsTable.test.tsx` actualizados: estado inicial colapsado, tests que necesitan contenido visible hacen click al toggle antes de interactuar.

**Feature: AIDiagnosticPanel arranca colapsado por defecto**
- Estado `collapsed: true` con header-button toggle. Chevron `▶` rota 90° al expandir.
- Todo el contenido (CTA / loading / diagnosis / error) se oculta mientras `collapsed === true`.
- El diagnóstico ya generado se preserva al colapsar/expandir (estado independiente).

---

**Bug: parser no procesaba ninguna línea**
- Causa: logs copiados del portal HP tienen espacios múltiples en lugar de tabs.
- Fix: normalizar `\s{2,}` → `\t` al inicio del pipeline.

**Bug: servidor respondía con resultados viejos tras cambio de código**
- Causa: caché en memoria de `/parser/preview` + `--reload` de uvicorn no siempre invalida el módulo.
- Fix: eliminar caché completamente + agregar `--reload-dir .`.

**Bug: botón "Ver solución" no se actualizaba tras upsert sin recargar**
- Causa: `handleSaveCodeToCatalog` actualizaba `inc.events[].code_solution_content` pero el botón lee `inc.sds_solution_content` (nivel incidente).
- Fix: también actualizar `inc.sds_link` e `inc.sds_solution_content` en el `setResult` post-upsert.

**Bug: `solution_content` no se guardaba al agregar link por primera vez**
- Causa: el fetch de contenido solo ocurría en la lógica de "editar".
- Fix: unificar el path de upsert para siempre fetchear si hay `solution_url` y no hay contenido previo.

**Bug: crash del servidor en Windows al imprimir logs con cp1252**
- Causa: prints de debug con caracteres Unicode en Python con encoding cp1252.
- Fix: eliminar todos los prints de debug del parser y api.py.

**Bug: match SDS vs Log no funcionaba**
- Causa: `getSdsCodeForMatch` usaba `more_info ?? code` (ej. `TriageInput2`), identificador interno SDS.
- Fix: `getSdsCodesForMatch` usa `event_context` como primario y parsea `more_info` con `or` como separador.

**Bug: build de Vercel fallaba por prop `incidents` no usada en `DiagnosticPanel`**
- Causa: `runDiagnostics` declaraba `incidents: ApiIncident[]` pero todas las reglas operan sobre `events`.
- Fix: eliminar `incidents` de la firma, props y call site.

**Bug: SDS sin `event_context` mostraba "❌ No coincide"**
- Causa: `computeSdsVsLog` no distinguía entre "sin código" y "código que no matchea".
- Fix: `hasEventContext(sds)` detecta `event_context` vacío/null/`"—"` → retorna `status: 'general'`.

**Bug: DiagnosticPanel usaba prefijos de código hardcodeados para firmware y bandejas**
- Causa: Regla 4 usaba `code.startsWith('49.')`, Regla 5 usaba regex de prefijos específicos HP.
- Fix: Regla 4 usa `code_description?.includes('firmware')`, Regla 5 busca `"tray"`/`"bandeja"` en descripción.

**Bug: Reglas 3 y 5 de DiagnosticPanel incluían WARNING/INFO causando falsos positivos**
- Causa: no filtraban por tipo antes de evaluar.
- Fix: ambas reglas filtran `type.toUpperCase() === 'ERROR'` exclusivamente.

**Bug: re-render de DashboardPage cada segundo por useLiveTime**
- Causa: `useLiveTime` en DashboardPage llamaba `setState` cada 1s forzando re-render completo.
- Fix: reemplazar por componente `LiveClock` aislado; cálculos pesados en `useMemo`.

**Perf: previewLogs y validateLogs se ejecutaban secuencialmente**
- Fix: `Promise.all([previewLogs(logText), validateLogs(logText).catch(...)])`.

**Bug: SSRF en `/error-codes/upsert`**
- Causa: `solution_url` pasada directamente a `httpx.get()` sin validar.
- Fix: `_validate_ssrf_url(url)` antes del fetch; HTTP 422 si falla.

**Bug: build Vercel fallaba — `now` no definido en header de saved-detail**
- Causa: refactorización `useLiveTime` → `LiveClock` dejó un `<time dateTime={now.toISOString()}>` sin migrar.
- Fix: reemplazar por `<LiveClock className="dashboard__datetime" short />`.

**Bug: "El servidor está iniciando…" aparecía siempre a los 5s**
- Causa: `slowWarning` setTimeout se activaba en cada `loading=true`.
- Fix: `serverWasCold = true` solo si el ping inicial a `/health` tardó > 3s.

**Bug: contrato de tendencia desalineado backend/frontend**
- Causa: `types/api.ts` tipaba `'mejoró' | 'igual' | 'peor'`; backend retorna `'mejoro' | 'estable' | 'empeoro'`.
- Fix: actualizar `CompareDiff.tendencia` para espejarlo exactamente.

**Feature: botón "Ignorar y ver resultados" en sección de códigos nuevos**
- Fix: botón que llama `setCodesNew([])` para mostrar dashboard sin gestionar los códigos detectados.

**Bug: `/parser/preview` sin límite de tamaño de payload**
- Fix: agregar `if len(payload.logs) > MAX_LOGS_LENGTH: raise HTTPException(400)`.

**Perf: `_fetch_solution_content` bloqueaba el worker de uvicorn**
- Causa: `httpx.get()` síncrono.
- Fix: `async def` + `httpx.AsyncClient` + `await`.

**Bug: reloj duplicado en header y subheader**
- Fix: eliminar `<LiveClock>` del subheader; queda solo en header principal.

**Bug: tabla de eventos usaba índice como key**
- Fix: `key={\`${evt.code}-${evt.timestamp}\`}`.

**Feature: botón × para cerrar toasts manualmente**
- Fix: `removeToast` en `ToastContextValue`; botón `<button class="toast__close">` por toast.

**Fix: tabla de eventos colapsada por defecto y con nombre confuso**
- Fix: `useState(false)`; título "Eventos del período".

**Feature: expandir mensaje completo en detalle de incidente**
- Fix: estado `expandedMsgs: Set<string>` en DashboardPage; botón "ver más"/"ver menos".

**Bug: stack overflow en `getWindowForDate` y `getDateRangeFromEvents`**
- Causa: `Math.min(...times)` con miles de elementos.
- Fix: `times.reduce((a, b) => Math.min(a, b))`.

**Perf: sort redundante en `analysis_service.py`**
- Causa: `group_sorted = sorted(group, ...)` redundante (ya ordenados globalmente).
- Fix: usar `group` directamente.

**Bug: race condition en escritura del JSON de fallback**
- Fix: `threading.Lock()` (`_local_write_lock`) en ambos repos serializa read-modify-write.

**Bug: fetches del frontend sin timeout**
- Fix: `apiFetch()` con `AbortSignal.timeout(30_000)`; health con 10s.

**Bug: `compare_service` no detectaba transición 0→N errores como "empeoró"**
- Fix: check explícito `if total_saved_errors == 0 and total_current_errors > 0: return "empeoro"`.

**Bug: header del log no se detectaba si comenzaba con línea en blanco**
- Fix: `non_empty_count <= 3` como candidato a header (tolera hasta 2 líneas en blanco iniciales).

**Bug: `db_ms` calculado incorrectamente en `/parser/validate`**
- Fix: `t_db_start = time.perf_counter()` justo antes de `get_by_codes`.

**Fix: validación URL con IPv6 malformado causaba 500**
- Fix: lecturas de `parsed.scheme`/`parsed.hostname` dentro del `try` block.

**Fix: sanitizar HTML con bleach antes de guardar en DB**
- Fix: `bleach.clean(cleaned, tags=[], attributes={}, strip=True)` en `_fetch_solution_content`.

**Bug: Prettier vaciaba `vite-env.d.ts` rompiendo `tsc -b`**
- Fix: agregar `src/vite-env.d.ts` a `frontend/.prettierignore`.
