# Fase 4: Estandarización e Infraestructura

Esta fase se centra en profesionalizar el entorno de desarrollo y asegurar la escalabilidad del backend mediante patrones de diseño y herramientas de calidad de código.

## 1. Estandarización de Python (Ruff)
*   **Objetivo**: Sustituir linters dispersos por una herramienta única y ultrarrápida.
*   **Acciones**:
    *   Instalar `ruff`.
    *   Configurar `ruff.toml` con reglas estrictas (incluyendo `I` para imports y `B` para bugbear).
    *   Formatear todo el backend y corregir warnings automáticos.

## 2. Repositorios Genéricos (Backend)
*   **Objetivo**: Eliminar el código repetitivo en `repositories/`.
*   **Acciones**:
    *   Crear un `BaseRepository` genérico que maneje las operaciones CRUD básicas (get, get_all, create, delete).
    *   Refactorizar `ErrorSolutionRepository` y `PrinterModelRepository` para heredar de la base.
    *   Asegurar que las excepciones personalizadas de la Fase 2 se lancen correctamente desde la capa de datos.

## 3. Dockerización
*   **Objetivo**: "Funciona en mi máquina" -> "Funciona en todas partes".
*   **Acciones**:
    *   `Dockerfile` (Backend): Imagen multi-stage optimizada para Python 3.11.
    *   `Dockerfile` (Frontend): Imagen multi-stage con Nginx para servir los assets estáticos.
    *   `docker-compose.yml`: Orquestación de Backend, Frontend y base de datos (PostgreSQL/SQLite) para entorno local.

## 4. Estandarización de Documentación API
*   **Objetivo**: Documentación interactiva impecable.
*   **Acciones**:
    *   Anotar todos los routers de FastAPI con `responses`, `tags` y `summary`.
    *   Asegurar que los esquemas Pydantic tengan ejemplos (`examples`) útiles en Swagger.

## 5. CI/CD Base
*   **Objetivo**: Automatizar la validación.
*   **Acciones**:
    *   Crear `.github/workflows/verify.yml` para correr `pytest`, `npm test` y `ruff` en cada Push/PR.
