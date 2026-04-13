# Cómo usar HP Logs Analyzer

Guía de uso de la app en su estado actual.

---

## Flujo principal

### 1. Seleccionar modelo y pegar el log

Hacé click en **"Pegar logs HP"** en el header. En el modal:

1. **Seleccioná el modelo de impresora** del listado. Si el modelo no está, hacé click en **"+ Cargar nuevo modelo (PDF)"** y subí el PDF del Service Cost Data oficial de HP — los modelos y consumibles se extraen automáticamente con IA (Claude Haiku).
2. **Pegá el log** en el área de texto.
3. Hacé click en **"Analizar"**.

### 2. Códigos nuevos (opcional)

Si el log tiene códigos que no están en el catálogo, aparece una sección con la lista. Podés agregarlos uno a uno (descripción, severidad, URL de solución) o ignorarlos y continuar directo al dashboard.

### 3. SDS Engineering Incident (opcional)

El sistema pregunta si querés agregar un incidente SDS. Si tenés uno, pegá el texto en el modal — se parsea automáticamente y hace match contra los códigos del log.

---

## El dashboard

### KPIs

Cuatro métricas en la parte superior:
- **Estado de errores** — conteo de incidentes ERROR / WARNING / INFO dentro del filtro de fecha activo.
- **Incidencias activas** — total de grupos de código en el período filtrado.
- **Último error crítico** — código y timestamp del ERROR más reciente.
- **Tasa de errores** — frecuencia: "1 error c/N pág.", calculado como ERRORs ÷ (contador máx − contador mín).

### 🤖 Diagnóstico con IA

Panel con acento violeta, colapsado debajo de los KPIs. Al expandirlo, hacé click en **"Generar análisis con IA"** para que Claude Haiku procese los incidentes y devuelva un diagnóstico estructurado en tres secciones: **DIAGNÓSTICO / ACCIÓN / PRIORIDAD**.

### 🔧 SDS Engineering Incident

Panel con acento azul, colapsado. Muestra los campos del SDS cargado y el resultado del match contra el log (Coincide / Parcial / No coincide / General). El match soporta tres fuentes de tokens:

- **Contexto del evento** (`event_context`) — código primario, ej. `"60.00.02"`.
- **Más información** (`more_info`) — tokens separados por `" or "`, ej. `"60.00.02 or 60.01.02"`.
- **Código SDS** (`Código`) — si es un identificador CamelCase significativo, ej. `"ReplaceTrayPickRollers"`.

Y dos modalidades de comparación:
- **Código numérico** (contiene `.`) — match exacto o por prefijo con wildcard `z`. Ej. `53.B0.0z` coincide con `53.B0.01` … `53.B0.0F`.
- **Identificador de mensaje** (sin `.`) — se extraen keywords CamelCase filtrando stopwords (`replace`, `check`, `clean`, etc.). Alcanza con 1 keyword en la clasificación del incidente. Ej. `"ReplaceTrayPickRollers"` → keywords `tray`, `pick`, `roller` → coincide con `"Tray Z feed roller at end of life."`.

Si hay consumibles con códigos relacionados al SDS, aparece la sección **"Verificar historial de consumibles"** con part number, vida útil y estado.

### ⚙️ Estado de consumibles

Panel colapsado con acento ámbar (o rojo si hay componentes en estado crítico). Aparece solo si el modelo tiene consumibles con códigos presentes en el log. Muestra una tabla con categoría, descripción, part number, vida útil estimada, contador actual, % de uso y estado:

- **Sin alertas** — uso < 80% de la vida útil.
- **Próximo a revisar** — uso entre 80% y 99%.
- **Revisar historial** — uso ≥ 100%. Es un aviso para verificar cuándo fue el último reemplazo, no una orden de cambio inmediato.

Se excluyen los tóners, rodillos ADF y consumibles 110V. Motivo: el contador de páginas no mide el desgaste de toners y ADF; los consumibles 110V no aplican en Argentina (solo se usa 220V).

### Filtros de fecha

Botón único en el header que abre un popover con 8 presets (Hoy, Esta semana, Semana anterior, Este mes, Mes anterior, Últimos 7 días, Últimos 30 días, Todo el período) y un calendario interactivo para rango libre. Todos los KPIs, gráficos y tablas respetan el filtro activo.

### Gráficos

- **Volumen de incidencias** — AreaChart de eventos por hora con toggles de severidad. Tooltip muestra los códigos del bucket.
- **Errores más frecuentes** — BarChart top 10 códigos, coloreado por severidad. Tres toggles activos por default.

### Tablas

- **Incidencias** — agrupadas por código. Sort por columna, filtro de severidad, búsqueda por texto. Cada fila es expandible para ver los eventos individuales.
- **Eventos del período** — tabla colapsada con todos los eventos crudos. Sort y búsqueda.

---

## Soluciones Oficiales y CPMD (Control Panel Message Document)

Hacé click en cualquier **código subrayado** en la tabla de incidentes para visualizar la solución al error. Esta ventana modal ahora agrupa la información técnica a través de pestañas:

- **Pestaña SDS (Catálogo)**: Si el código cuenta con una URL vinculada, verás el HTML de la página de Smart Device Services descargado por nuestra base. Éste puede leerse aunque el link de HP haya caducado. Desde aquí podés también agregar un nuevo error al catálogo u editarlo.
- **Pestaña CPMD (Troubleshooting)**: Si el modelo diagnóstico de la impresora seleccionada tiene un documento CPMD ingerido, esta pestaña detallará las causas, los pasos de solución para el técnico en formato de lista y las refacciones FRU relacionadas. Esta información es extraída inteligentemente mediante IA a partir de los diagramas lógicos de la documentación oficial HP CPMD.

Mapear PDFs de CPMD a los modelos es un proceso sencillo (Hacé click en `Agregar CPMD` junto al selector de modelos de impresora para ingestar uno nuevo globalmente con Claude Haiku).

---

## Incidentes guardados

El botón **"Guardar incidente"** en el header guarda un snapshot del análisis actual (nombre + equipment identifier opcional). Desde **"Incidentes guardados"** podés:
- Re-abrir snapshots anteriores.
- Comparar un snapshot contra el log actual y ver la tendencia: **mejoró / estable / empeoró**.
- Si un equipo tiene 3 o más snapshots, se genera un gráfico de línea con la evolución de errores a lo largo del tiempo.

---

## Exportar PDF Profesional

El botón **"Exportar PDF"** genera un reporte A4 de nivel ejecutivo de alta fidelidad (Light Mode) que incluye:
- **Resumen Ejecutivo**: Salud general del equipo, detalle de códigos críticos y plan de acción sugerido.
- **Diagnóstico IA**: Solo si fue generado previamente en el dashboard.
- **KPIs de Salud**: Resumen de severidad y tasa de errores.
- **Gráficos de Tendencia**: Top de errores más frecuentes.
- **Detalle Técnico**: Tablas de incidentes completas, con soporte para rebanado automático en múltiples páginas si son muy extensas.
