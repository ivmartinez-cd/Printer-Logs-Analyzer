import { useToast } from '../contexts/ToastContext'

export function ToastContainer() {
  const { toasts } = useToast()
  if (toasts.length === 0) return null
  return (
    <div className="toast-container" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast--${t.type}`}
          role="alert"
        >
          <span className="toast__message">{t.message}</span>
        </div>
      ))}
    </div>
  )
}
