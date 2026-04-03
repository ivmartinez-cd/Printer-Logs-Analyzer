import { useState } from 'react'
import type { Event as ApiEvent } from '../types/api'

type AlertLevel = 'error' | 'warning' | 'info' | 'success'

type DiagnosticAlert = {
  key: string
  level: AlertLevel
  message: string
}

function truncateDescription(desc: string): string {
  const dotIdx = desc.indexOf('.')
  let shortened = dotIdx !== -1 ? desc.slice(0, dotIdx) : desc
  if (shortened.length > 50) {
    const words = shortened.split(' ')
    let result = ''
    for (const word of words) {
      if ((result + (result ? ' ' : '') + word).length > 50) break
      result += (result ? ' ' : '') + word
    }
    shortened = result + '...'
  }
  return shortened
}

function runDiagnostics(events: ApiEvent[]): DiagnosticAlert[] {
  const alerts: DiagnosticAlert[] = []

  const errorEvents = events.filter((e) => e.type.toUpperCase() === 'ERROR')
  const totalErrorOccurrences = errorEvents.length

  // REGLA 1 — Problema dominante: un código concentra >50% de todos los errores
  if (totalErrorOccurrences > 0) {
    const countByCode = new Map<string, { count: number; description: string | null }>()
    for (const evt of errorEvents) {
      const entry = countByCode.get(evt.code) ?? { count: 0, description: evt.code_description ?? null }
      countByCode.set(evt.code, { count: entry.count + 1, description: entry.description })
    }
    for (const [code, { count, description }] of countByCode) {
      const pct = Math.round((count / totalErrorOccurrences) * 100)
      if (pct > 50) {
        const descPart = description ? ` — ${description}` : ''
        alerts.push({
          key: 'dominant',
          level: 'error',
          message: `⚠️ Problema principal: ${code}${descPart} (${count} ocurrencias, ${pct}% del total de errores)`,
        })
        break
      }
    }
  }

  // REGLA 2 — Ráfaga: 5+ eventos del mismo código en < 30 minutos
  const BURST_COUNT = 5
  const BURST_WINDOW_MS = 30 * 60 * 1000
  const timesByCode = new Map<string, number[]>()
  const descByCode = new Map<string, string | null>()
  for (const evt of events) {
    const t = new Date(evt.timestamp).getTime()
    if (Number.isNaN(t)) continue
    const arr = timesByCode.get(evt.code) ?? []
    arr.push(t)
    timesByCode.set(evt.code, arr)
    if (!descByCode.has(evt.code)) descByCode.set(evt.code, evt.code_description ?? null)
  }
  for (const [code, times] of timesByCode) {
    const sorted = [...times].sort((a, b) => a - b)
    for (let i = 0; i <= sorted.length - BURST_COUNT; i++) {
      if (sorted[i + BURST_COUNT - 1] - sorted[i] < BURST_WINDOW_MS) {
        let windowCount = 0
        for (let j = i; j < sorted.length && sorted[j] - sorted[i] < BURST_WINDOW_MS; j++) windowCount++
        const windowStart = sorted[i]
        const windowEnd = sorted[i + windowCount - 1]
        const rawDesc = descByCode.get(code) ?? null
        const shortDesc = rawDesc ? truncateDescription(rawDesc) : code
        const d1 = new Date(windowStart)
        const d2 = new Date(windowEnd)
        const date = `${d1.getDate()}/${d1.getMonth() + 1}/${d1.getFullYear()}`
        const timeStart = `${String(d1.getHours()).padStart(2, '0')}:${String(d1.getMinutes()).padStart(2, '0')}`
        const timeEnd = `${String(d2.getHours()).padStart(2, '0')}:${String(d2.getMinutes()).padStart(2, '0')}`
        alerts.push({
          key: `burst-${code}`,
          level: 'warning',
          message: `⚡ El ${date} entre las ${timeStart} y las ${timeEnd} se generaron ${windowCount} eventos de '${shortDesc}' (${code})`,
        })
        break
      }
    }
  }

  // REGLA 3 — Escalamiento: segunda mitad del log tiene >2x errores que la primera
  const allTimestamps = events
    .map((e) => new Date(e.timestamp).getTime())
    .filter((t) => !Number.isNaN(t))
  if (allTimestamps.length >= 2) {
    const minT = Math.min(...allTimestamps)
    const maxT = Math.max(...allTimestamps)
    const midT = (minT + maxT) / 2
    const errorEvents = events.filter((e) => e.type.toUpperCase() === 'ERROR')
    const firstErrors = errorEvents.filter((e) => {
      const t = new Date(e.timestamp).getTime()
      return !Number.isNaN(t) && t < midT
    }).length
    const secondErrors = errorEvents.filter((e) => {
      const t = new Date(e.timestamp).getTime()
      return !Number.isNaN(t) && t >= midT
    }).length
    if (firstErrors > 0 && secondErrors > firstErrors * 2) {
      // Encontrar el código que más creció entre primera y segunda mitad
      const codes = [...new Set(errorEvents.map((e) => e.code))]
      let topCode = ''
      let topFirst = 0
      let topSecond = 0
      let topGrowth = 0
      for (const code of codes) {
        const f = errorEvents.filter((e) => {
          const t = new Date(e.timestamp).getTime()
          return e.code === code && !Number.isNaN(t) && t < midT
        }).length
        const s = errorEvents.filter((e) => {
          const t = new Date(e.timestamp).getTime()
          return e.code === code && !Number.isNaN(t) && t >= midT
        }).length
        const growth = s - f
        if (growth > topGrowth) {
          topGrowth = growth
          topCode = code
          topFirst = f
          topSecond = s
        }
      }
      const detail = topCode ? `: ${topCode} pasó de ${topFirst} a ${topSecond} eventos en la segunda mitad del período` : ''
      alerts.push({
        key: 'escalation',
        level: 'error',
        message: `📈 El problema está escalando${detail}`,
      })
    }
  }

  // REGLA 4 — Firmware: descripción contiene "firmware"
  const hasFirmwareErrors = events.some((e) => e.code_description?.toLowerCase().includes('firmware'))
  if (hasFirmwareErrors) {
    alerts.push({
      key: 'firmware',
      level: 'warning',
      message: `🔧 Se detectaron errores de firmware — considerar actualización de firmware del equipo`,
    })
  }

  // REGLA 5 — Múltiples bandejas: solo eventos ERROR con descripción que incluye "tray" o "bandeja", 2+ códigos distintos
  const trayErrorCodes = [
    ...new Set(
      events
        .filter((e) => {
          if (e.type.toUpperCase() !== 'ERROR') return false
          const d = e.code_description?.toLowerCase() ?? ''
          return d.includes('tray') || d.includes('bandeja')
        })
        .map((e) => e.code),
    ),
  ]
  if (trayErrorCodes.length >= 2) {
    alerts.push({
      key: 'trays',
      level: 'warning',
      message: `🗂️ Errores en múltiples bandejas detectados: ${trayErrorCodes.join(', ')} — posible problema en el mecanismo de alimentación general`,
    })
  }

  // REGLA 6 — Saludable: sin ninguna alerta
  if (alerts.length === 0) {
    alerts.push({
      key: 'healthy',
      level: 'success',
      message: `✅ Sin patrones de alerta detectados — el equipo opera dentro de parámetros normales`,
    })
  }

  // Ordenar por severidad y limitar a 5
  const order: Record<AlertLevel, number> = { error: 0, warning: 1, info: 2, success: 3 }
  return alerts.sort((a, b) => order[a.level] - order[b.level]).slice(0, 5)
}

interface DiagnosticPanelProps {
  events: ApiEvent[]
}

export function DiagnosticPanel({ events }: DiagnosticPanelProps) {
  const [collapsed, setCollapsed] = useState(false)
  const alerts = runDiagnostics(events)

  return (
    <div className="diagnostic-panel">
      <button
        type="button"
        className="diagnostic-panel__header"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
      >
        <span className="diagnostic-panel__title">🔍 Diagnóstico automático</span>
        <span className="diagnostic-panel__chevron" aria-hidden="true">
          {collapsed ? '▼' : '▲'}
        </span>
      </button>
      {!collapsed && (
        <ul className="diagnostic-panel__list">
          {alerts.map((alert) => (
            <li key={alert.key} className={`diagnostic-panel__alert diagnostic-panel__alert--${alert.level}`}>
              {alert.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
