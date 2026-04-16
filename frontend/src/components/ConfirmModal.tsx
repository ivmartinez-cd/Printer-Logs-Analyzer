export interface ConfirmModalProps {
  /** Título del modal */
  title: string
  /** Mensaje o contenido principal */
  message: string
  /** Etiqueta del botón de confirmar (ej. "Borrar", "Aceptar") */
  confirmLabel: string
  /** Etiqueta del botón de cancelar */
  cancelLabel?: string
  /** Acción al confirmar */
  onConfirm: () => void | Promise<void>
  /** Acción al cancelar o cerrar */
  onCancel: () => void
  /** Si está en curso una acción async (deshabilita botones) */
  loading?: boolean
}

export function ConfirmModal({
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmModalProps) {
  async function handleConfirm() {
    await onConfirm()
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-hp-dark/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="glass-card w-full max-w-sm shadow-premium-glow animate-scale-in overflow-hidden border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
          <h2 className="font-display font-bold text-lg text-white m-0 tracking-tight">{title}</h2>
          <button 
            type="button" 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all focus:outline-none" 
            onClick={onCancel}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-slate-300 leading-relaxed font-medium">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="p-6 bg-white/5 border-t border-white/5 flex justify-end gap-3">
          <button
            type="button"
            className="px-6 py-2 rounded-full bg-slate-800 text-white font-bold text-[11px] uppercase tracking-widest hover:bg-slate-700 transition-all border border-white/5"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`px-8 py-2 rounded-full font-bold text-[11px] uppercase tracking-widest transition-all shadow-premium-sm hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 ${
              confirmLabel.toLowerCase().includes('borrar') || confirmLabel.toLowerCase().includes('eliminar') 
              ? 'bg-accent-rose text-white hover:shadow-[0_0_15px_rgba(244,63,94,0.4)]' 
              : 'bg-hp-blue-vibrant text-white hover:shadow-premium-glow'
            }`}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Procesando...</span>
              </div>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
