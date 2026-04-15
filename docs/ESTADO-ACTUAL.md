# Estado actual de la aplicación — HP Logs Analyzer

Documento que describe qué hace la app hoy y cómo está implementado.

Última actualización: 2026-04-15 (Deep Linking, Resolución Automática de Modelo por Serial)

---

## 1. Qué hace la app

Herramienta web interna para analizar logs de impresoras HP. El sistema permite identificar un equipo mediante su número de serie, auto-detectar su modelo, extraer sus logs del portal SDS y generar un análisis completo de incidentes, consumibles y diagnóstico AI.

**Nuevas Capacidades de Flujo:**
- **Deep Linking**: Acceso directo vía URL `https://.../SERIALNUMBER`. La app detecta el serial en la ruta, resuelve el modelo y extrae los logs automáticamente.
- **Resolución Automática**: Al buscar un serial en el portal SDS, el sistema extrae el nombre del modelo y busca la mejor coincidencia en el catálogo local.

**Flujo del usuario:**
1. **Acceso Directo**: Entrar con el Número de Serie en la URL (recomendado para técnicos).
2. **Identificación Manual** (LogPasteModal):
   - Ingresar Número de Serie: habilita el botón "Analizar" inmediatamente.
   - El modelo se vuelve opcional si hay un serial (se resuelve automáticamente).
3. **Obtención de Logs**:
   - **Extracción Totalmente Automática**: Si solo hay serial, la app hace Login -> Search -> Resolve Model -> Fetch Logs -> Analyze.
   - **Pegado Manual**: Como alternativa, se pueden seguir pegando logs directamente si ya se disponen de ellos.
4. Analizar: Se ejecutan `POST /parser/preview` y `POST /parser/validate`.
5. Ver KPIs, Diagnóstico con IA, Insight SDS en vivo, Estado de consumibles y reportes profesionales.

---

## 2. Arquitectura general

Monorepo con estructura organizada:

```
Printer-Logs-Analyzer/
├── package.json              # Scripts raíz (177 tests be, 146 tests fe)
├── dev.cmd                   # Script de arranque rápido (Windows)
├── backend/
│   ├── interface/api.py      # FastAPI — todos los endpoints (incl. /sds/extract-logs)
│   ├── domain/entities.py    # Modelos Pydantic
│   ├── application/
│   │   ├── parsers/log_parser.py
│   │   └── services/
│   │       ├── sds_web_service.py # NUEVO: Extracción automatizada SDS
│   │       ├── analysis_service.py
│   │       ├── insight_service.py # Alertas en vivo
│   │       └── ...
│   ├── infrastructure/
│   │   ├── database.py       # SQL + Fallback
│   │   └── repositories/
│   └── tests/                # pytest — 177 tests
├── frontend/
│   ├── src/pages/DashboardPage.tsx
│   ├── src/components/       # LogPasteModal (refactorizado), tablas, etc.
│   └── src/__tests__/        # vitest — 146 tests
├── docs/                     # Documentación y assets
├── scripts/                  # POCs y utilitarios
└── samples/                  # logs y archivos de prueba
```

---

## 3. Backend

### 3.1 Servicios Críticos

- **SdsWebService**: Servicio especializado para automatizar el login en el portal HP SDS, buscar el equipo por serial y extraer el HTML de eventos, convirtiéndolo a formato TSV.
- **LogParser**: Normaliza espacios y maneja fechas en español.
- **InsightService**: Consulta APIs oficiales del portal SDS para alertas en tiempo real.
- **AiDiagnosisService**: Genera reportes estructurados usando Claude Haiku.

### 3.2 Persistencia y Fallback

La aplicación usa PostgreSQL con un pool de conexiones con pre-ping. Si la base de datos no está disponible (ej. por inactividad de Neon), la app cambia automáticamente a **Modo Fallback** usando archivos JSON locales situados en `backend/data/`.

---

## 4. Frontend

### 4.1 Componentes Principales

- **LogPasteModal**: UI dual para pegar logs o extraerlos por número de serie.
- **ExecutiveSummary**: Generador de resumen ejecutivo para reportes PDF.
- **Paneles Colapsables**: `AIDiagnosticPanel`, `InsightAlertsPanel`, `SDSIncidentPanel`, `ConsumableWarningsPanel`. Todos comparten el shell de UI `.collapsible-panel`.
- **Exportar PDF**: Generación de reportes A4 profesionales con fidelidad visual completa.

### 4.2 Pruebas

Se mantiene un alto nivel de cobertura:
- **Backend (Pytest)**: 177 pruebas verificando lógica de parsing, servicios y endpoints.
- **Frontend (Vitest)**: 146 pruebas cubriendo componentes principales y hooks con `happy-dom`.
