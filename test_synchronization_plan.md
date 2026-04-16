# Plan de Sincronización de Tests - Fase 3: Modernización Premium

Tras la modernización estética integral del sistema hacia una arquitectura **Executive Glassmorphism** (Fase 3), la suite de tests automatizados requiere una sincronización de sus expectativas de contenido y estructura. Este documento detalla las acciones necesarias para estabilizar la suite de validación conservando el nuevo diseño de alta fidelidad.

## Resumen de Fallos Actuales
La suite de tests presenta 21 fallos debido a que las pruebas originales buscaban etiquetas, textos e iconos que ahora han sido sustituidos por términos más técnicos y profesionales (e.g., "Ingesta de Telemetría" en lugar de "Pegar logs").

## Tareas de Sincronización

### 1. Actualización de Selectores de Texto
Se deben actualizar las expectativas de `screen.getByText` en los siguientes archivos:
- **`WelcomeView.test.tsx`**: Sincronizar con los nuevos botones "✨ Analizar Nuevo" y "📂 Explorar Historial".
- **`DashboardHeader.test.tsx`**: Actualizar el título principal a "Monitor de Diagnóstico HP".
- **`UploadCpmdModal.test.tsx`**: Cambiar "Elegir PDF…" por "Elegir Archivo" e "Ingesta de Inteligencia".
- **`LogPasteModal.test.tsx`**: Actualizar a "Ingesta de Telemetría" y "Procesar Análisis".
- **`SolutionContentModal.test.tsx`**: Unificar las pestañas SCD/SDS según el nuevo diseño.

### 2. Sincronización de Estructura DOM
Dada la nueva jerarquía de capas (Glass Containers), algunos tests de navegación requieren:
- Actualizar selectores de botones que ahora contienen iconos o estructuras complejas.
- Verificar el montaje de los nuevos `glass-card` y sombras premium.

### 3. Validación de Flujos Críticos
Una vez actualizados los textos, se debe confirmar la integridad de:
- El flujo de carga de logs por consola.
- La visualización de la línea de tiempo de hardware.
- El despliegue de soluciones técnicas de la IA.

## Cronograma de Ejecución
1. **Fase A**: Corrección de tests de componentes base (Buttons, Badges, Headers).
2. **Fase B**: Sincronización de flujos de modales complejos (LogPaste, CPMD, SDS).
3. **Fase C**: Validación final de la suite completa (132+ tests).

---
*Este plan garantiza que la modernización estética no comprometa la robustez técnica del proyecto.*
