import { createContext, useCallback, useContext, useRef, useState } from 'react'

export type ToastType = 'success' | 'warning' | 'error'

export interface ToastItem {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  toasts: ToastItem[]
  showSuccess: (message: string) => void
  showWarning: (message: string) => void
  showError: (message: string) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const AUTO_DISMISS_MS = 5000

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timeoutRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    if (timeoutRefs.current[id]) {
      clearTimeout(timeoutRefs.current[id])
      delete timeoutRefs.current[id]
    }
  }, [])

  const addToast = useCallback(
    (type: ToastType, message: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      const item: ToastItem = { id, type, message }
      setToasts((prev) => [...prev, item])
      const timeoutId = setTimeout(() => removeToast(id), AUTO_DISMISS_MS)
      timeoutRefs.current[id] = timeoutId
    },
    [removeToast]
  )

  const showSuccess = useCallback((message: string) => addToast('success', message), [addToast])
  const showWarning = useCallback((message: string) => addToast('warning', message), [addToast])
  const showError = useCallback((message: string) => addToast('error', message), [addToast])

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showSuccess,
        showWarning,
        showError,
        removeToast,
      }}
    >
      {children}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
