# Plan de Integración: CDS Web Service (wsAyC)

Este documento detalla las posibilidades de integración con el servicio web interno de CDS (`https://wsg.cdsisa.com.ar/wsAyC_server.php`) para enriquecer el Monitor de Flota y el diagnóstico de incidentes.

## Análisis del Servicio (SOAP + JSON)
El servicio utiliza protocolo SOAP, pero encapsula la respuesta real como un **JSON string** dentro de una etiqueta XML `<Respuesta>`. Esto facilita la integración con nuestro backend en Python.

### Métodos Clave Encontrados en WSDL

| Método | Propósito | Aplicación en nuestra App |
| :--- | :--- | :--- |
| `getMachineBySerial` | Busca el ID de máquina por S/N. | **Vínculo crítico**: Conecta una impresora del monitor con su ficha en CDS. |
| `getMachineIncidents` | Lista incidentes de una máquina. | Muestra el historial de tickets directamente en el Mini-Análisis. |
| `getIncidentByNumber` | Detalle completo de un incidente. | Muestra estado, técnico asignado y notas técnicas. |
| `getBitacora` | Historial de pasos de un ticket. | Visualiza la "hoja de ruta" de la reparación. |
| `getMachineCounters` | Lectura de contadores oficiales. | Compara métricas de logs con contadores de facturación. |
| `persistNewIncident` | Crea un nuevo incidente. | Permite abrir tickets automáticamente ante errores críticos. |

---

## Ideas de Implementación (Fase Posterior)

### 1. Panel de "Estado de Gestión"
En el `MonitorDashboard.tsx`, expandir la fila de la impresora para incluir una sección de **CDS Sync**:
- Icono de ticket (🟢/🔴) indicando si hay un incidente abierto.
- Link directo al sistema de gestión interno si está disponible.

### 2. Diagnóstico Aumentado (IA + Historial)
Al generar un diagnóstico con IA, incluir como contexto los últimos 3 incidentes cerrados de esa máquina para saber si es una falla recurrente que ya tuvo intervenciones previas.

### 3. Sugerencia de Repuestos
Utilizar `getArticleReplacements` para que, cuando HP reporte un error de "Fuser Jam", la App sugiera exactamente el número de parte (Part Number) que CDS tiene catalogado para ese modelo.

---

## Próximos Pasos Técnicos
- [ ] Validar conectividad desde el contenedor de `backend` hacia `wsg.cdsisa.com.ar`.
- [ ] Crear un `CDSService` en el backend para manejar las envolventes SOAP.
- [ ] Implementar caché para las consultas por Número de Serie.
