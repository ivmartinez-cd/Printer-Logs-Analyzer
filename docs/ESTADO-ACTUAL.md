# Estado actual de la aplicación — HP Logs Analyzer

Última actualización: 2026-04-23 (Modularización de Dashboard · Limpieza de Deuda Técnica UI)

---

## 1. Capacidades Actuales

### Módulos Principales
1.  **Análisis de Logs Individuales**:
    *   Carga manual o extracción automática via número de serie (Login SDS → Fetch).
    *   Agrupación inteligente de eventos en incidentes.
    *   Diagnóstico con IA (Claude Opus 4.6) estructurado.
    *   Match con soluciones técnicas del catálogo (CPMD).
2.  **Monitoreo de Flota (Módulo de Avisos)**:
    *   Sincronización en segundo plano de toda la flota de clientes.
    *   Tracking de progreso en tiempo real con polling.
    *   Sistema de reglas para detección de alertas críticas.
    *   Gestión de notificaciones por mail (Manual/Automática).
3.  **Catálogo y Datos**:
    *   Persistencia en PostgreSQL (Neon/Docker) con fallback a JSON.
    *   Sistema de migraciones con tracking de estado (`schema_migrations`).
    *   Pipeline híbrido de ingesta de manuales de servicio.

### Verificación de Calidad
*   **Total Tests**: 373 tests pasando (187 Frontend, 186 Backend).
*   **Cobertura**: Alta cobertura en servicios críticos (SDS, IA, Parsers, Repositories).
*   **UI/UX**: Diseño Premium con Glassmorphism, Responsive y modo de exportación PDF optimizado.

---

## 2. Arquitectura de Archivos (Estructura Profesional)

```
Printer-Logs-Analyzer/
├── backend/
│   ├── interface/          # Routers (analysis, sds, ai, maintenance, ...)
│   ├── application/        # Servicios (sds, insight, maintenance, ai_diagnosis)
│   ├── domain/             # Entidades Pydantic (Event, Incident, ...)
│   ├── infrastructure/     # Repositories (Postgres/Fallback), database, config
│   ├── migrations/         # Archivos SQL 001-005
│   └── scripts/            # run_migrations.py (Entrypoint de migraciones)
├── frontend/
│   ├── src/
│   │   ├── components/     # Categorizados: Analysis, Monitor, Parser, UI, Maintenance
│   │   ├── pages/          # DashboardPage, AvisosPage
│   │   ├── store/          # Zustand (useAnalysisStore, useUIStore)
│   │   ├── hooks/          # useAnalysis, useExportPdf, useDateFilter, ...
│   │   └── services/       # Cliente API Axios tipado
├── scripts/
│   ├── internal/           # Utilidades de mantenimiento y extracción batch
│   └── poc/                # Experimentos y pruebas de concepto
├── samples/                # Archivos de log y HTML de muestra
└── scratch/                # Espacio de trabajo temporal y debug
```

---

## 3. Estado Técnico del Backend

### Servicios de Sincronización
El backend ahora soporta tareas de larga duración en segundo plano para la sincronización de flota. Usa un tracker en memoria para informar el progreso al frontend (`processed/total`) y previene condiciones de carrera mediante `threading.Lock`.

### Persistencia Robusta
El sistema de migraciones asegura que las tablas se creen correctamente en cualquier entorno (Docker o Local). La tabla `schema_migrations` evita que se ejecuten scripts ya aplicados.

---

## 4. Estado Técnico del Frontend

### Organización de Componentes
Se ha eliminado el desorden en `src/components`. Los componentes están agrupados por dominio de negocio:
*   **Analysis**: Todo lo relacionado con el resultado del análisis de un log específico.
*   **Monitor**: Gráficos, KPIs y vistas de estado general.
*   **Parser**: Tablas y herramientas de visualización de datos crudos.
*   **UI**: Componentes de layout y diseño compartido (Header, Toast, Skeleton).
*   **Maintenance**: Componentes específicos del flujo de avisos y flota.

### Gestión de Estado
Se utiliza **Zustand** para separar la lógica de la vista, permitiendo una navegación fluida entre el Dashboard de análisis y la página de Avisos de flota sin perder contexto.

### Modularización del Dashboard
Se ha completado la descomposición del componente "God" `DashboardPage.tsx` en sub-componentes especializados dentro de `src/components/Dashboard/`. Esto mejora la mantenibilidad, reduce la complejidad ciclomática y facilita el testing unitario de las vistas de análisis.

