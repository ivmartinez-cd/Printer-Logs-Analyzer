# Deuda Técnica - Abril 2026

## 1. Persistencia de Diagnóstico IA (Módulo AI)

**Estado:** Implementación técnica completada pero validación pendiente en entorno runtime.

**Contexto:**
Se implementó la lógica de auto-guardado en el endpoint `/analysis/ai-diagnose` para que cada diagnóstico generado por Claude 3.5 Sonnet se guarde automáticamente en la tabla `saved_analyses` de PostgreSQL.

**Pendientes / Riesgos:**
- **Validación Final:** Aunque se corrigieron errores de acceso a atributos (`body.metadata.serial_number`) y se actualizaron los esquemas del frontend para pasar la identidad del equipo (Serial y Modelo), las consultas directas a la base de datos después del rebuild mostraron `0 rows`.
- **Posibles Causas:** Es probable que el frontend necesite un refresco total de caché para cargar los nuevos servicios de API que incluyen los metadatos, o que el flujo de extracción desde SDS no esté inyectando el serial correctamente en el estado del componente antes de llamar a la IA.
- **Acción requerida:** Realizar una sesión de debugging "end-to-end" verificando el payload exacto que llega al backend en el Network Tab del navegador.

## 2. Acumulación de Historial de Navegación [RESUELTO]

**Estado:** Corregido mediante el uso de `replaceState`.

**Contexto:**
Anteriormente, cada búsqueda de número de serie usaba `pushState`, lo que generaba una pila de historial excesiva.

**Solución aplicada:**
Se implementó una lógica en `DashboardPage.tsx` que utiliza `window.history.replaceState` cuando el usuario ya se encuentra en la vista de Dashboard y simplemente cambia de equipo. Esto mantiene la URL actualizada para deep-linking pero evita contaminar el historial del navegador con múltiples búsquedas consecutivas.


**Archivos involucrados:**
- `backend/interface/routers/ai.py` (Lógica de auto-save)
- `backend/interface/schemas/ai.py` (Esquema de metadatos)
- `frontend/src/services/api.ts` (Función `aiDiagnose`)
- `frontend/src/components/AIDiagnosticPanel.tsx` (Componente visual)
