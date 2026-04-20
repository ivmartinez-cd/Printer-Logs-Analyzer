# Deuda Técnica - Abril 2026

## 1. Persistencia de Diagnóstico IA (Módulo AI)

**Estado:** Implementación técnica completada pero validación pendiente en entorno runtime.

**Contexto:**
Se implementó la lógica de auto-guardado en el endpoint `/analysis/ai-diagnose` para que cada diagnóstico generado por Claude 3.5 Sonnet se guarde automáticamente en la tabla `saved_analyses` de PostgreSQL.

**Pendientes / Riesgos:**
- **Validación Final:** Aunque se corrigieron errores de acceso a atributos (`body.metadata.serial_number`) y se actualizaron los esquemas del frontend para pasar la identidad del equipo (Serial y Modelo), las consultas directas a la base de datos después del rebuild mostraron `0 rows`.
- **Posibles Causas:** Es probable que el frontend necesite un refresco total de caché para cargar los nuevos servicios de API que incluyen los metadatos, o que el flujo de extracción desde SDS no esté inyectando el serial correctamente en el estado del componente antes de llamar a la IA.
- **Acción requerida:** Realizar una sesión de debugging "end-to-end" verificando el payload exacto que llega al backend en el Network Tab del navegador.

## 2. Acumulación de Historial de Navegación

**Estado:** Comportamiento de "pushState" genera una pila de historial profunda.

**Contexto:**
Actualmente, cada vez que se realiza una búsqueda de número de serie, el sistema utiliza `pushState` para actualizar la URL sin recargar la página. Esto facilita el deep-linking pero genera un efecto secundario en la navegación:
- Si un usuario busca 5 seriales seguidos, el historial del navegador guarda 5 entradas (`/SN1`, `/SN2`, etc.).
- Al intentar volver "atrás" desde una vista secundaria (como la lista de incidentes guardados), el usuario debe retroceder por cada una de las búsquedas realizadas individualmente antes de llegar a la pantalla de bienvenida limpia.

**Pendientes / Riesgos:**
- **UX Frustrante:** Obliga a múltiples clicks para salir de un flujo de análisis.
- **Acción requerida:** Evaluar el uso de `replaceState` en lugar de `pushState` para navegaciones consecutivas del mismo tipo (ej: si ya estoy en un dashboard de serial, reemplazar la entrada actual en lugar de empujar una nueva).

**Archivos involucrados:**
- `backend/interface/routers/ai.py` (Lógica de auto-save)
- `backend/interface/schemas/ai.py` (Esquema de metadatos)
- `frontend/src/services/api.ts` (Función `aiDiagnose`)
- `frontend/src/components/AIDiagnosticPanel.tsx` (Componente visual)
