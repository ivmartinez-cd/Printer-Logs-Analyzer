import { useState, useRef } from 'react'
import { Portal } from '../ui/Portal'
import { Upload, FileText, Loader2 } from 'lucide-react'
import { uploadCpmdPdf, API_BASE } from '../../services/api'

interface CpmdUploadModalProps {
  modelFamily: string
  onClose: () => void
  onUploaded: (pdfUrl: string) => void
}

export function CpmdUploadModal({ modelFamily, onClose, onUploaded }: CpmdUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [keywords, setKeywords] = useState(modelFamily)
  const [label, setLabel] = useState(`CPMD - ${modelFamily}`)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const result = await uploadCpmdPdf(file, keywords, label)
      onUploaded(`${API_BASE}${result.url}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al subir el PDF')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Portal>
      <div className="log-modal-overlay" role="dialog" aria-modal="true" style={{ zIndex: 11000 }}>
        <div className="log-modal" style={{ maxWidth: '480px', width: '90%' }}>
          <div className="log-modal__header">
            <h2 className="log-modal__title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Upload size={18} />
              Subir Manual CPMD
            </h2>
            <button type="button" className="log-modal__close" onClick={onClose}>×</button>
          </div>

          <div className="log-modal__body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
              No hay manual CPMD para <strong>{modelFamily}</strong>. Subí el PDF para que quede disponible.
            </p>

            <div
              onClick={() => inputRef.current?.click()}
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: '8px',
                padding: '24px',
                textAlign: 'center',
                cursor: 'pointer',
                background: file ? 'rgba(59,130,246,0.05)' : 'transparent',
                transition: 'background 0.2s',
              }}
            >
              {file ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <FileText size={18} className="text-blue-400" />
                  <span style={{ fontSize: '13px', color: '#fff' }}>{file.name}</span>
                  <span style={{ fontSize: '11px', color: '#6b7280' }}>({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                </div>
              ) : (
                <div style={{ color: '#6b7280', fontSize: '13px' }}>
                  Click para seleccionar un archivo PDF
                </div>
              )}
              <input
                ref={inputRef}
                type="file"
                accept=".pdf"
                style={{ display: 'none' }}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 500 }}>Keywords (separados por coma)</label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="M607, E60075, ..."
                style={{
                  padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)',
                  background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '13px',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 500 }}>Etiqueta</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                style={{
                  padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)',
                  background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '13px',
                }}
              />
            </div>

            {error && <p style={{ margin: 0, fontSize: '12px', color: '#ef4444' }}>{error}</p>}
          </div>

          <div className="log-modal__actions" style={{ padding: '16px 24px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" className="log-modal__btn-secondary" onClick={onClose} disabled={uploading}>
              Cancelar
            </button>
            <button
              type="button"
              className="dashboard__btn dashboard__btn--vibrant"
              onClick={handleUpload}
              disabled={!file || !keywords.trim() || uploading}
              style={{ padding: '8px 24px' }}
            >
              {uploading ? <><Loader2 size={14} className="animate-spin" style={{ marginRight: '6px' }} /> Subiendo...</> : 'Subir PDF'}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
