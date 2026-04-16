import { useState, useEffect } from 'react'
import type { ErrorCodeUpsertBody } from '../types/api'

export interface AddCodeToCatalogModalProps {
  code: string
  initialDescription: string
  initialSeverity: string
  initialSolutionUrl?: string
  title?: string
  submitLabel?: string
  onSave: (body: ErrorCodeUpsertBody) => void | Promise<void>
  onClose: () => void
  saving: boolean
}

const SEVERITY_OPTIONS = [
  { value: 'INFO', label: 'Info' },
  { value: 'WARNING', label: 'Advertencia' },
  { value: 'ERROR', label: 'Error' },
]

export function AddCodeToCatalogModal({
  code,
  initialDescription,
  initialSeverity,
  initialSolutionUrl = '',
  title = 'Catalogar Código de Error',
  submitLabel = 'Actualizar Base de Datos',
  onSave,
  onClose,
  saving,
}: AddCodeToCatalogModalProps) {
  const [description, setDescription] = useState(initialDescription)
  const [solutionUrl, setSolutionUrl] = useState(initialSolutionUrl)
  const [severity, setSeverity] = useState(initialSeverity)

  useEffect(() => {
    setDescription(initialDescription)
    setSeverity(initialSeverity)
    setSolutionUrl(initialSolutionUrl)
  }, [code, initialDescription, initialSeverity, initialSolutionUrl])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      code,
      severity: severity || null,
      description: description.trim() || null,
      solution_url: solutionUrl.trim() || null,
    })
  }

  const sev = severity.toUpperCase()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-hp-dark/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="glass-card w-full max-w-lg flex flex-col shadow-premium-glow animate-scale-in border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5 font-display">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-hp-blue-vibrant mb-1">Curación de Inteligencia</span>
            <h2 className="font-bold text-xl text-white m-0">{title}</h2>
          </div>
          <button 
            type="button" 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all" 
            onClick={onClose}
            disabled={saving}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-6">
             <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500" htmlFor="add-code-code">Identificador</label>
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-hp-blue-vibrant font-display font-bold text-lg select-none">
                   {code}
                </div>
             </div>
             <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500" htmlFor="add-code-severity">Severidad</label>
                <select
                  id="add-code-severity"
                  className={`w-full p-3 bg-hp-dark/60 border rounded-xl text-sm font-bold appearance-none cursor-pointer transition-all ${
                    sev === 'ERROR' ? 'border-accent-rose/30 text-accent-rose focus:border-accent-rose' : 
                    sev === 'WARNING' ? 'border-accent-amber/30 text-accent-amber focus:border-accent-amber' : 
                    'border-hp-blue-vibrant/30 text-hp-blue-vibrant focus:border-hp-blue-vibrant'
                  }`}
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  disabled={saving}
                >
                  {SEVERITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
             </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500" htmlFor="add-code-description">Definición Técnica</label>
            <textarea
              id="add-code-description"
              className="w-full p-4 bg-hp-dark/40 border border-white/10 rounded-2xl text-sm text-white placeholder:text-slate-600 focus:border-hp-blue-vibrant outline-none resize-none transition-all scrollbar-premium"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describa el significado exacto de este código..."
              disabled={saving}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500" htmlFor="add-code-solution-url">Documentación de Solución (URL)</label>
            <div className="relative">
               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔗</span>
               <input
                id="add-code-solution-url"
                type="url"
                className="w-full pl-10 pr-4 py-3 bg-hp-dark/40 border border-white/10 rounded-xl text-sm text-slate-300 placeholder:text-slate-600 focus:border-hp-blue-vibrant outline-none transition-all"
                value={solutionUrl}
                onChange={(e) => setSolutionUrl(e.target.value)}
                placeholder="https://support.hp.com/..."
                disabled={saving}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <button
              type="submit"
              className="flex-1 py-4 bg-hp-blue-vibrant text-white font-display font-bold text-sm uppercase tracking-widest rounded-2xl shadow-premium-glow hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
              disabled={saving}
            >
              {saving ? (
                <div className="flex items-center justify-center gap-2">
                   <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                   Sincronizando...
                </div>
              ) : submitLabel}
            </button>
            <button
              type="button"
              className="px-6 py-4 bg-white/5 text-slate-400 font-bold text-sm uppercase tracking-widest rounded-2xl hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
