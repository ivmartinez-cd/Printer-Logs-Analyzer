import { DbStatusBadge } from '../DbStatusBadge'
import type { HealthStatus } from '../../services/api'
import type { SavedAnalysisSummary } from '../../types/api'

import { useTranslation } from 'react-i18next'

interface WelcomeViewProps {
  healthStatus: HealthStatus | null
  onAnalyzeNew: () => void
  onViewSaved: () => void
  onHelp: () => void
}

export function WelcomeView({ 
  healthStatus, 
  onAnalyzeNew, 
  onViewSaved, 
  onHelp 
}: WelcomeViewProps) {
  const { t } = useTranslation()

  return (
    <div className="glass-card max-w-3xl w-full mx-auto my-auto p-1 md:p-1.5 rounded-[2rem] shadow-premium-md animate-fade-in-up overflow-hidden">
      <div className="bg-hp-dark-surface/40 backdrop-blur-2xl p-6 md:p-10 rounded-[1.8rem] flex flex-col items-center gap-8">
        
        <header className="w-full flex items-center justify-between pb-6 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="bg-hp-blue/10 p-2.5 rounded-xl border border-hp-blue/20">
              <svg
                className="w-7 h-7 text-hp-blue-vibrant"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-white m-0">
              {t('welcome.title')}
            </h1>
          </div>
          <DbStatusBadge status={healthStatus} />
        </header>

        <section className="w-full flex flex-col gap-8">
          <div className="space-y-3 text-center md:text-left">
            <p className="text-xl leading-relaxed text-slate-300 font-medium max-w-2xl">
              {t('welcome.tagline')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <button
              type="button"
              className="flex-1 dashboard__btn bg-hp-blue-vibrant hover:bg-hp-blue text-white shadow-premium-glow hover:shadow-hp-blue/40 transition-all duration-300 px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 group"
              onClick={onAnalyzeNew}
            >
              <span className="text-lg">✨</span>
              {t('welcome.cta_new')}
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14m-7-7l7 7-7 7" />
              </svg>
            </button>
            <button
              type="button"
              className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-slate-200 px-8 py-4 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-md"
              onClick={onViewSaved}
            >
              <span>📂</span>
              {t('welcome.cta_saved')}
            </button>
          </div>

          <div className="pt-8 border-t border-white/5">
            <span className="block text-xs font-bold uppercase tracking-widest text-hp-blue/60 mb-6">
              {t('welcome.capabilities')}
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FeatureItem 
                icon="📊" 
                title={t('welcome.feat_kpi_title')} 
                desc={t('welcome.feat_kpi_desc')} 
              />
              <FeatureItem 
                icon="⚡" 
                title={t('welcome.feat_hw_title')} 
                desc={t('welcome.feat_hw_desc')} 
              />
              <FeatureItem 
                icon="🧠" 
                title={t('welcome.feat_ai_title')} 
                desc={t('welcome.feat_ai_desc')} 
              />
              <FeatureItem 
                icon="📁" 
                title={t('welcome.feat_kb_title')} 
                desc={t('welcome.feat_kb_desc')} 
              />
            </div>
          </div>
        </section>

        <button
          type="button"
          className="text-slate-500 hover:text-hp-blue-vibrant text-sm font-medium transition-colors flex items-center gap-2 group"
          onClick={onHelp}
        >
          <span className="opacity-70 group-hover:opacity-100 transition-opacity">❓</span>
          {t('welcome.cta_guide')}
        </button>
      </div>
    </div>
  )
}

function FeatureItem({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="group p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] hover:border-hp-blue/20 transition-all duration-300">
      <div className="flex items-start gap-4">
        <span className="text-2xl grayscale group-hover:grayscale-0 transition-all duration-500 shrink-0">{icon}</span>
        <div className="flex flex-col gap-1">
          <strong className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">
            {title}
          </strong>
          <p className="text-xs leading-relaxed text-slate-500 group-hover:text-slate-400 transition-colors">
            {desc}
          </p>
        </div>
      </div>
    </div>
  )
}
