import { X } from 'lucide-react'
import { Portal } from './Portal'

interface HelpModalProps {
  onClose: () => void
}

export function HelpModal({ onClose }: HelpModalProps) {
  return (
    <Portal>
      <div
        className="log-modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-modal-title"
      >
        <div className="log-modal maintenance-modal--wide">
          <div className="hiw-header">
            <div className="dashboard__subheader-title-group">
              <h2 id="help-modal-title" className="log-modal__title">
                ¿Cómo funciona HP Logs Analyzer?
              </h2>
              <p className="dashboard__subheader-meta">Guía de arquitectura y capacidades del sistema</p>
            </div>
            <button type="button" className="hiw-close-btn" onClick={onClose} aria-label="Cerrar">
              <X size={24} />
            </button>
          </div>

          <div className="hiw-body">
            {/* FLUJO DE ANÁLISIS */}
            <section className="hiw-section hiw-section--direct">
              <div className="hiw-step-number">1</div>
              <div className="hiw-step-content">
                <h4>Flujo de Análisis</h4>
                <p>El sistema soporta tres métodos principales para procesar la información:</p>
                <div className="help-modal__flow-list">
                  <div className="flow-item">
                    <strong>Opción 1 — Deep Link:</strong> Ingresa directamente vía URL con el serial. La app resuelve el modelo y extrae logs de HP SDS automáticamente.
                  </div>
                  <div className="flow-item">
                    <strong>Opción 2 — Extracción Automática:</strong> Ingresa el serial en el modal inicial para un flujo completo de Login → Extracción → Análisis.
                  </div>
                  <div className="flow-item">
                    <strong>Opción 3 — Log Manual:</strong> Pega el contenido crudo. El sistema detecta la identidad del equipo automáticamente.
                  </div>
                </div>
                <div className="hiw-callout">
                  El backend parsea cada línea, agrupa eventos por código formando <strong>incidentes</strong> y los enriquece con el catálogo CPMD.
                </div>
              </div>
            </section>

            {/* Panel de KPIs */}
            <section className="hiw-section hiw-section--formula">
              <div className="hiw-step-number">2</div>
              <div className="hiw-step-content">
                <h4>Panel de KPIs Inteligentes</h4>
                <p>Métricas clave para entender la salud del dispositivo de un vistazo:</p>
                <div className="help-modal__kpi-grid">
                  <div className="help-modal__kpi-card">
                    <h5>Estado de Errores</h5>
                    <p>Conteo de incidentes críticos, advertencias e informativos.</p>
                  </div>
                  <div className="help-modal__kpi-card">
                    <h5>Tasa de Errores</h5>
                    <p>Frecuencia basada en páginas: <code>Errores / (Contador Máx - Mín)</code>.</p>
                  </div>
                  <div className="help-modal__kpi-card">
                    <h5>Último Crítico</h5>
                    <p>Identificación inmediata del evento ERROR más reciente.</p>
                  </div>
                  <div className="help-modal__kpi-card">
                    <h5>Incidencias Activas</h5>
                    <p>Total de grupos de códigos detectados en el período.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Diagnóstico con IA */}
            <section className="hiw-section hiw-section--incident">
              <div className="hiw-step-number">3</div>
              <div className="hiw-step-content">
                <h4>Diagnóstico Ejecutivo (IA)</h4>
                <p>Utiliza <strong>Claude 3.5 Opus</strong> para procesar correlaciones temporales, consumibles y alertas.</p>
                <ul className="help-modal__premium-list">
                  <li><strong>Diagnóstico:</strong> Causa raíz técnica en formato conciso.</li>
                  <li><strong>Acciones:</strong> Pasos accionables priorizados para el técnico.</li>
                  <li><strong>Impacto:</strong> Consecuencia operativa real del problema.</li>
                </ul>
              </div>
            </section>

            {/* Consumibles e Insight */}
            <section className="hiw-section hiw-section--alert">
              <div className="hiw-step-number">4</div>
              <div className="hiw-step-content">
                <h4>Consumibles y Alertas Insight</h4>
                <p>Sincronización en tiempo real con la API oficial de HP Insight.</p>
                <div className="hiw-callout">
                  Compara la vida útil teórica (CPMD) contra el estado real reportado por el portal para detectar discrepancias.
                </div>
              </div>
            </section>

            {/* Exportación */}
            <section className="hiw-section hiw-section--close">
              <div className="hiw-step-number">5</div>
              <div className="hiw-step-content">
                <h4>Reporte Ejecutivo PDF</h4>
                <p>Genera un documento A4 profesional, optimizado para impresión, que incluye el resumen ejecutivo, diagnósticos de IA y la tabla de incidentes completa.</p>
              </div>
            </section>
          </div>

          <div className="log-modal__actions" style={{ padding: '24px 40px' }}>
            <button
              type="button"
              className="dashboard__btn dashboard__btn--primary vibrant"
              onClick={onClose}
            >
              Entendido, ¡vamos allá!
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
