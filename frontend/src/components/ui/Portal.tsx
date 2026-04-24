import { ReactNode, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface PortalProps {
  children: ReactNode
}

export function Portal({ children }: PortalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) return null

  const target = document.getElementById('modal-root') || document.body
  return createPortal(children, target)
}
