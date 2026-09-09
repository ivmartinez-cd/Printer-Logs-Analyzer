interface SpinnerProps {
  size?: number
  className?: string
}

/** Círculo giratorio genérico — usar en vez de reinventar un spinner por componente. */
export function Spinner({ size = 20, className = '' }: SpinnerProps) {
  return (
    <span
      className={`spinner ${className}`}
      style={{ width: size, height: size, borderWidth: Math.max(2, Math.round(size / 10)) }}
      role="status"
      aria-label="Cargando"
    />
  )
}

interface LoadingStateProps {
  text?: string
  size?: number
  className?: string
}

/** Patrón "spinner + texto" para reemplazar los distintos "Cargando..." sueltos. */
export function LoadingState({ text = 'Cargando...', size = 18, className = '' }: LoadingStateProps) {
  return (
    <div className={`loading-state ${className}`}>
      <Spinner size={size} />
      <span>{text}</span>
    </div>
  )
}
