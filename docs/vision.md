# Guía de Uso — HP Logs Analyzer

Guía completa de las funcionalidades y flujos de la aplicación.

---

## 1. Análisis de Logs Individuales

### Extracción Automática por Serial (Recomendado)
Hacé click en **"Pegar logs HP"** y usá la pestaña **"Extracción Automática"**:
1. Ingresá el **Número de Serie** del equipo.
2. El sistema resolverá automáticamente el modelo desde SDS.
3. Se descargarán los logs, se parsearán y se mostrarán en el Dashboard.

### Dashboard de Análisis
- **KPIs**: Resumen de errores, tasa de falla por página y último error crítico.
- **🤖 Diagnóstico con IA**: Claude genera un análisis técnico con acciones priorizadas.
- **🔧 Soluciones Técnicas**: Hacé click en cualquier código para ver pasos de reparación (CPMD) y manuales SDS.
- **📊 Gráficos**: Tendencia de errores y volumen temporal.
- **📑 Exportación PDF**: Generá un reporte ejecutivo A4 listo para enviar al cliente.

---

## 2. Gestión de Flota (Módulo de Avisos)

Este módulo permite monitorear el estado de múltiples equipos y clientes de forma centralizada.

### Sincronización de Flota
1. Accedé a la página de **Avisos** desde el header.
2. Hacé click en **"Sincronizar ahora"**:
   *   El sistema iniciará una tarea en segundo plano que recorre todos los clientes configurados.
   *   Podés ver el progreso en tiempo real (`Procesando X de Y dispositivos`).
   *   La sincronización extrae contadores, alertas y logs recientes para detectar problemas.

### Detección de Alertas Críticas
El sistema aplica reglas automáticas para detectar:
- Errores de fusor, ITB o láser.
- Consumibles por encima del 100% de su vida útil.
- Equipos con alta tasa de errores en los últimos 7 días.

### Notificaciones
Podés configurar el sistema para enviar mails automáticos a los clientes o generar avisos internos para el equipo técnico.

---

## 3. Catálogo y Configuración

### Carga de Modelos (PDF)
Si un modelo no existe, podés cargarlo subiendo el **Service Cost Data** original en PDF. La IA extraerá automáticamente:
- Familia de modelo.
- Part numbers de consumibles.
- Vida útil estimada de cada componente.

### Ingesta de CPMD
Subí los manuales de servicio (CPMD) en PDF para alimentar el catálogo de soluciones. Esto permite que el sistema muestre pasos de reparación exactos para cada código de error detectado.

---

## 4. Modo Offline y Resiliencia
La app está diseñada para funcionar incluso si la base de datos principal falla, activando un modo **"Offline"** que utiliza semillas de datos locales (JSON) para mantener la operatividad básica de análisis.
