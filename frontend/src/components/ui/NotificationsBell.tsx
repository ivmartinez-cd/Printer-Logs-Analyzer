import { useEffect, useRef, useState, useCallback } from 'react'
import { Bell, CheckCheck, Loader2, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../services/api'
import type { AppNotification, NotificationStatus } from '../../types/api'
import { formatDateTime } from '../../hooks/useDateFilter'

const POLL_INTERVAL_MS = 30_000

const STATUS_META: Record<NotificationStatus, { color: string; icon: typeof Bell }> = {
  in_progress: { color: '#38bdf8', icon: Loader2 },
  success: { color: '#34d399', icon: CheckCircle2 },
  warning: { color: '#fbbf24', icon: AlertTriangle },
  error: { color: '#f87171', icon: XCircle },
}

export function NotificationsBell() {
  const [items, setItems] = useState<AppNotification[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await getNotifications(signal)
      setItems(res.notifications)
      setUnread(res.unread_count)
    } catch {
      /* offline / transient: keep previous state */
    }
  }, [])

  useEffect(() => {
    const ctrl = new AbortController()
    // load() only updates state asynchronously (after the fetch resolves), so it
    // is safe here despite the set-state-in-effect heuristic.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(ctrl.signal)
    const timer = setInterval(() => load(), POLL_INTERVAL_MS)
    return () => {
      ctrl.abort()
      clearInterval(timer)
    }
  }, [load])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  async function handleOpen() {
    const next = !open
    setOpen(next)
    if (next) await load()
  }

  async function handleItemClick(n: AppNotification) {
    if (n.is_read) return
    setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, is_read: true } : i)))
    setUnread((u) => Math.max(0, u - 1))
    try {
      await markNotificationRead(n.id)
    } catch {
      /* will re-sync on next poll */
    }
  }

  async function handleMarkAll() {
    setItems((prev) => prev.map((i) => ({ ...i, is_read: true })))
    setUnread(0)
    try {
      await markAllNotificationsRead()
    } catch {
      /* will re-sync on next poll */
    }
  }

  return (
    <div ref={containerRef} style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9000 }}>
      <button
        type="button"
        onClick={handleOpen}
        aria-label={`Notificaciones${unread > 0 ? ` (${unread} sin leer)` : ''}`}
        style={{
          position: 'relative',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'rgba(15, 23, 42, 0.9)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(8px)',
          color: '#e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
        }}
      >
        <Bell size={20} />
        {unread > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              minWidth: '18px',
              height: '18px',
              padding: '0 4px',
              borderRadius: '9px',
              background: '#ef4444',
              color: '#fff',
              fontSize: '0.7rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #0f172a',
            }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            bottom: '60px',
            right: 0,
            width: '360px',
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: '70vh',
            overflowY: 'auto',
            background: '#0f172a',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              position: 'sticky',
              top: 0,
              background: '#0f172a',
            }}
          >
            <span style={{ fontWeight: 700, color: '#f8fafc' }}>Notificaciones</span>
            {items.some((i) => !i.is_read) && (
              <button
                type="button"
                onClick={handleMarkAll}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'none',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <CheckCheck size={14} /> Marcar todas
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <p style={{ padding: '24px 16px', textAlign: 'center', color: '#64748b', margin: 0 }}>
              No hay notificaciones.
            </p>
          ) : (
            items.map((n) => {
              const meta = STATUS_META[n.status] ?? STATUS_META.in_progress
              const Icon = meta.icon
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleItemClick(n)}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 16px',
                    background: n.is_read ? 'transparent' : 'rgba(56,189,248,0.06)',
                    border: 'none',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    cursor: 'pointer',
                  }}
                >
                  <Icon
                    size={18}
                    color={meta.color}
                    className={n.status === 'in_progress' ? 'animate-spin' : ''}
                    style={{ flexShrink: 0, marginTop: '2px' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '8px',
                        alignItems: 'baseline',
                      }}
                    >
                      <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.9rem' }}>
                        {n.title}
                      </span>
                      {!n.is_read && (
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#38bdf8',
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </div>
                    <p style={{ margin: '2px 0 0 0', color: '#cbd5e1', fontSize: '0.82rem', lineHeight: 1.4 }}>
                      {n.message}
                    </p>
                    <span style={{ color: '#64748b', fontSize: '0.72rem' }}>
                      {formatDateTime(n.updated_at)}
                    </span>
                  </div>
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
