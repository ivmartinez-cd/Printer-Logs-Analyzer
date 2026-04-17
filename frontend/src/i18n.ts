import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

const resources = {
  en: {
    translation: {
      welcome: {
        title: 'HP Logs Analyzer',
        tagline: 'Advanced technical analysis of HP logs with intelligent error detection and real-time hardware status.',
        cta_new: 'Start New Analysis',
        cta_saved: 'View Saved Logs',
        cta_guide: 'Usage Guide',
        capabilities: 'System Capabilities',
        feat_kpi_title: 'Severity KPIs',
        feat_kpi_desc: 'Accurate categorization of Errors, Warnings, and Info.',
        feat_hw_title: 'Real-Time Hardware',
        feat_hw_desc: 'Consumables, fusers and kits status via HP Insight API.',
        feat_ai_title: 'AI Diagnosis',
        feat_ai_desc: 'Semantic analysis and automatic repair recommendations.',
        feat_kb_title: 'Knowledge Base',
        feat_kb_desc: 'Direct access to manuals (CPMD) and historical solutions.'
      },
      dashboard: {
        error_panel: 'Error Panel',
        db_connected: 'DB Connected',
        db_offline: 'DB Offline · Local Mode',
        connecting: 'Connecting to server...'
      }
    }
  },
  es: {
    translation: {
      welcome: {
        title: 'Monitor de Diagnóstico HP',
        tagline: 'Análisis técnico avanzado de logs HP con detección inteligente de errores y estado de hardware en tiempo real.',
        cta_new: 'Analizar Nuevo',
        cta_saved: 'Explorar Historial',
        cta_guide: 'Guía de Uso',
        capabilities: 'Capacidades del Sistema',
        feat_kpi_title: 'KPIs de Severidad',
        feat_kpi_desc: 'Categorización precisa de Errores, Warnings e Información.',
        feat_hw_title: 'Hardware Real-Time',
        feat_hw_desc: 'Estado de consumibles, fusores y kits vía HP Insight API.',
        feat_ai_title: 'Diagnóstico con IA',
        feat_ai_desc: 'Análisis semántico y recomendaciones de reparación automáticas.',
        feat_kb_title: 'Base de Conocimiento',
        feat_kb_desc: 'Acceso directo a manuales (CPMD) y soluciones históricas.'
      },
      dashboard: {
        error_panel: 'Panel de errores',
        db_connected: 'DB conectada',
        db_offline: 'DB offline · modo local',
        connecting: 'Conectando al servidor...'
      },
      header: {
        history: 'Historial',
        new_analysis: 'Nuevo Análisis',
        save: 'Guardar',
        sds: 'SDS',
        export_pdf: 'Exportar PDF',
        generating: 'Generando...',
        help: 'Ayuda'
      }
    }
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false
    }
  })

export default i18n
