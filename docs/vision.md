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

### Diagnóstico con IA

Panel violeta colapsado debajo de los KPIs. Al expandirlo, hacé click en **"Generar análisis con IA"** para que Claude Haiku procese los incidentes y devuelva un diagnóstico estructurado en tres secciones: **DIAGNÓSTICO / ACCIÓN / PRIORIDAD**.

### SDS Engineering Incident

Panel colapsado que muestra los campos del SDS cargado y el resultado del match contra el log (Coincide / Parcial / No coincide / General). El match soporta tres fuentes:
- **Contexto evento** — código numérico primario, ej. `60.00.02`.
- **Más información** — tokens adicionales separados por "or", numéricos o de mensaje.
- **Campo Código** — si es CamelCase sin dígitos (ej. `ReplaceTrayPickRollers`), se tokeniza por CamelCase, se extraen keywords significativas (`["tray","pick","roller"]`) y se busca al menos 1 en la clasificación del incidente. IDs internos con dígitos (ej. `TriageInput2`) y stopwords sueltas (ej. `Replace`) quedan excluidos.

Para match numérico: wildcard `z` cubre cualquier dígito hex (`53.B0.0z` → `53.B0.01`…`53.B0.0F`).

Si hay consumibles con códigos relacionados al SDS, aparece la sección **"Verificar historial de consumibles"** con part number, vida útil y estado.

### Estado de consumibles

Panel colapsado. Aparece solo si el modelo tiene consumibles con códigos presentes en el log. Muestra una tabla con categoría, descripción, part number, vida útil estimada, contador actual, % de uso y estado:

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

## Catálogo de códigos

Hacé click en cualquier **código subrayado** en la tabla de incidentes para agregar o editar su descripción, severidad y URL de solución. El backend descarga y guarda el HTML de la página SDS — podés verlo aunque el link de HP expire.

---

## Incidentes guardados

El botón **"Guardar incidente"** en el header guarda un snapshot del análisis actual (nombre + equipment identifier opcional). Desde **"Incidentes guardados"** podés:
- Re-abrir snapshots anteriores.
- Comparar un snapshot contra el log actual y ver la tendencia: **mejoró / estable / empeoró**.
- Si un equipo tiene 3 o más snapshots, se genera un gráfico de línea con la evolución de errores a lo largo del tiempo.

---

## Exportar PDF

El botón **"Exportar PDF"** genera un PDF A4 con: Diagnóstico IA (si fue generado), KPIs, gráfico de errores frecuentes y tabla de incidencias.
