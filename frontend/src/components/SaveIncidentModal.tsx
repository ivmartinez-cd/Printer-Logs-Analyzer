import React, { useState } from 'react'

export interface SaveIncidentModalProps {
  onSave: (name: string, equipmentIdentifier: string | null) => void | Promise<void>
  onClose: () => void
  saving: boolean
}

export function SaveIncidentModal({ onSave, onClose, saving }: SaveIncidentModalProps) {
  const [name, setName] = useState('')
  const [equipment, setEquipment] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return
    onSave(trimmedName, equipment.trim() || null)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-hp-dark/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="glass-card w-full max-w-md shadow-premium-glow animate-scale-in overflow-hidden border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-hp-blue-vibrant mb-1">Archivo de Diagnóstico</span>
            <h2 className="font-display font-bold text-xl text-white m-0">Guardar <span className="text-hp-blue-vibrant">Incidente</span></h2>
          </div>
          <button 
            type="button" 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all focus:outline-none" 
            onClick={onClose}
            disabled={saving}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500" htmlFor="save-incident-name">
              Identificador del Análisis <span className="text-accent-rose">*</span>
            </label>
            <input
              id="save-incident-name"
              type="text"
              className="w-full bg-hp-dark/60 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white placeholder:text-slate-600 focus:ring-1 focus:ring-hp-blue-vibrant focus:border-hp-blue-vibrant outline-none transition-all hover:bg-white/5"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Análisis Crítico - Planta Norte"
              required
              disabled={saving}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500" htmlFor="save-incident-equipment">
              Serial / Modelo del Equipo <span className="text-slate-600">(Opcional)</span>
            </label>
            <input
              id="save-incident-equipment"
              type="text"
              className="w-full bg-hp-dark/60 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white placeholder:text-slate-600 focus:ring-1 focus:ring-hp-blue-vibrant focus:border-hp-blue-vibrant outline-none transition-all hover:bg-white/5"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              placeholder="Ej: CNNCQ520HG"
              disabled={saving}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="px-6 py-2.5 rounded-full bg-slate-800 text-white font-bold text-[11px] uppercase tracking-widest hover:bg-slate-700 transition-all border border-white/5"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-10 py-2.5 rounded-full bg-hp-blue-vibrant text-white font-bold text-[11px] uppercase tracking-widest hover:shadow-premium-glow hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 min-w-[120px]"
              disabled={saving || !name.trim()}
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Archivando...</span>
                </div>
              ) : (
                'Archivar Registro'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
