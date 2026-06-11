import { useCallback } from 'react'

export interface ToastMessage {
  id: string
  text: string
  type: 'success' | 'warning' | 'error' | 'info'
}

type ToastListener = (message: ToastMessage) => void
const listeners = new Set<ToastListener>()

export function addToastListener(listener: ToastListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useToast() {
  const show = useCallback((text: string, type: ToastMessage['type'] = 'info') => {
    const message: ToastMessage = {
      id: Math.random().toString(36).substring(2, 9),
      text,
      type,
    }
    listeners.forEach((listener) => listener(message))
  }, [])

  const showSuccess = useCallback((text: string) => show(text, 'success'), [show])
  const showWarning = useCallback((text: string) => show(text, 'warning'), [show])
  const showError = useCallback((text: string) => show(text, 'error'), [show])
  const showInfo = useCallback((text: string) => show(text, 'info'), [show])

  return {
    showSuccess,
    showWarning,
    showError,
    showInfo,
  }
}
