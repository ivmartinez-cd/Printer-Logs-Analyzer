import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

export type ToastType = 'success' | 'warning' | 'error'

export interface ToastItem {
  id: string
  type: ToastType
  message: string
}

interface ToastActions {
  showSuccess: (message: string) => void
  showWarning: (message: string) => void
  showError: (message: string) => void
  removeToast: (id: string) => void
}

interface ToastState {
  toasts: ToastItem[]
}

// Two contexts:
//  - Actions: stable identity across renders (safe to put in useCallback/useEffect deps)
//  - State: mutable toasts array (only components rendering the list subscribe)
const ToastActionsContext = createContext<ToastActions | null>(null)
const ToastStateContext = createContext<ToastState | null>(null)

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

  // Stable object — identity only changes if any of the callbacks change (they don't).
  const actions = useMemo<ToastActions>(
    () => ({ showSuccess, showWarning, showError, removeToast }),
    [showSuccess, showWarning, showError, removeToast]
  )
  // Mutable object — changes when toasts change. Only consumed by components
  // that render the list (e.g. <Toast />).
  const state = useMemo<ToastState>(() => ({ toasts }), [toasts])

  return (
    <ToastActionsContext.Provider value={actions}>
      <ToastStateContext.Provider value={state}>{children}</ToastStateContext.Provider>
    </ToastActionsContext.Provider>
  )
}

/**
 * Returns toast ACTIONS (stable identity). Safe to list in useCallback/useEffect deps —
 * consumers that only trigger toasts will NOT re-render when a toast is added/removed.
 */
export function useToast(): ToastActions {
  const ctx = useContext(ToastActionsContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

/**
 * Returns the current toast list. Subscribes to toast add/remove — use only in
 * the component that renders the toast UI.
 */
export function useToastList(): ToastItem[] {
  const ctx = useContext(ToastStateContext)
  if (!ctx) throw new Error('useToastList must be used within ToastProvider')
  return ctx.toasts
}
