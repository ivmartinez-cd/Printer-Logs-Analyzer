# Visión general de la app

Una app web profesional interna que:

- analiza logs HP
- detecta incidentes automáticamente
- clasifica severidad
- recomienda acción
- permite ajustar reglas

Orientada a uso operativo real.

## Flujo principal (usuario)

1. pegar log
2. validar códigos
3. analizar
4. ver dashboard
5. editar reglas si hace falta

Todo en una sola experiencia.

## Pantalla 1 — Input

- Área pegar log (multiline, soporta TAB, logs largos)
- Validación previa: total líneas, códigos detectados, advertencia códigos nuevos. Si hay código nuevo: bloquea análisis y abre formulario.

## Pantalla 2 — Dashboard principal

- **KPIs:** total incidentes, severidad máxima, códigos únicos, eventos en recency window (rojo = crítico, amarillo = monitorear, azul = informativo)
- **Timeline:** línea tiempo horizontal, eventos dentro/fuera ventana, colores por severidad
- **Tabla incidencias:** código, clasificación, cantidad, ventana, contador, recomendación; expandible, ordenar, paginar
- **Tabla eventos:** filtrar, ordenar, buscar; tooltip con código, fecha, contador, firmware, ayuda

## Filtros y búsqueda

- Severidad, código, texto, contador, recency (combinables)
- Búsqueda en código, ayuda, descripción; resaltar coincidencias

## Exportaciones

- PDF completo, CSV completo, CSV solo críticos (listo para Excel)

## Edición de reglas

- Botón “editar regla” desde incidente
- Modal: clasificación, resolución, X, Y, counter_max_jump, severity_weight, tags; validación en vivo, confirmación, toast
- Código nuevo: detecta → pide completar → guarda → analiza

## Historial

- Cambios, versiones, usuario

## UX requerida

- Dark mode, responsive, tooltips, toasts, reset filtros

## Backend

- Analizar un log por vez; no persistir incidents aún (MVP); usar JSON reglas

## Seguridad

- API key, validación de inputs

## Nivel esperado

Herramienta interna seria, estable, rápida y clara.
