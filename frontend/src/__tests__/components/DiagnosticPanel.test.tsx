// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DiagnosticPanel } from '../../components/DiagnosticPanel'
import { mockEvent } from '../fixtures/events'

afterEach(cleanup)

// Helpers para crear timestamps espaciados
function ts(base: string, offsetMinutes: number): string {
  const d = new Date(base)
  d.setMinutes(d.getMinutes() + offsetMinutes)
  return d.toISOString().slice(0, 19) // sin 'Z' para consistencia con mockEvent
}

describe('DiagnosticPanel', () => {
  it('sin eventos muestra la regla "Saludable" en verde', () => {
    render(<DiagnosticPanel events={[]} />)
    expect(screen.getByText(/Sin patrones de alerta detectados/)).toBeInTheDocument()
    expect(screen.getByText('🟢 Sin acción necesaria')).toBeInTheDocument()
  })

  it('Regla 1 — Problema dominante: un código concentra >50% de los ERRORs', () => {
    const events = [
      ...Array.from({ length: 10 }, () =>
        mockEvent({ type: 'ERROR', code: '53.B0.02', code_description: 'Fuser error' })
      ),
      ...Array.from({ length: 2 }, () =>
        mockEvent({ type: 'ERROR', code: '49.00.00', code_description: 'Other error' })
      ),
    ]
    render(<DiagnosticPanel events={events} />)
    // La alerta de problema dominante usa el texto "Problema principal"
    const alerts = document.querySelectorAll('.diagnostic-panel__alert')
    const dominantAlert = Array.from(alerts).find((a) => a.textContent?.includes('Problema principal'))
    expect(dominantAlert).toBeTruthy()
    expect(dominantAlert?.textContent).toMatch(/53\.B0\.02/)
  })

  it('Regla 2 — Ráfaga: 5+ eventos del mismo código en 30 min', () => {
    const base = '2024-03-14T10:00:00'
    const events = Array.from({ length: 6 }, (_, i) =>
      mockEvent({
        type: 'ERROR',
        code: '53.B0.02',
        code_description: 'Fuser error',
        timestamp: ts(base, i * 4), // cada 4 min — 6 eventos en 20 min
      })
    )
    render(<DiagnosticPanel events={events} />)
    expect(screen.getByText(/ráfaga|generaron|eventos/i)).toBeInTheDocument()
  })

  it('Regla 3 — Escalamiento: 2ª mitad tiene >2× ERRORs que la 1ª mitad', () => {
    const base = '2024-03-14T08:00:00'
    const events = [
      // 2 ERRORs en la primera hora
      mockEvent({ type: 'ERROR', code: '53.B0.02', timestamp: ts(base, 0) }),
      mockEvent({ type: 'ERROR', code: '53.B0.02', timestamp: ts(base, 30) }),
      // 6 ERRORs en la segunda hora
      mockEvent({ type: 'ERROR', code: '53.B0.02', timestamp: ts(base, 61) }),
      mockEvent({ type: 'ERROR', code: '53.B0.02', timestamp: ts(base, 70) }),
      mockEvent({ type: 'ERROR', code: '53.B0.02', timestamp: ts(base, 80) }),
      mockEvent({ type: 'ERROR', code: '53.B0.02', timestamp: ts(base, 90) }),
      mockEvent({ type: 'ERROR', code: '53.B0.02', timestamp: ts(base, 100) }),
      mockEvent({ type: 'ERROR', code: '53.B0.02', timestamp: ts(base, 110) }),
    ]
    render(<DiagnosticPanel events={events} />)
    const alerts = document.querySelectorAll('.diagnostic-panel__alert')
    const escalationAlert = Array.from(alerts).find((a) => a.textContent?.includes('escalando'))
    expect(escalationAlert).toBeTruthy()
    expect(escalationAlert?.textContent).toMatch(/53\.B0\.02/)
  })

  it('Regla 3 ignora WARNING e INFO — solo cuenta ERRORs', () => {
    const base = '2024-03-14T08:00:00'
    const events = [
      // 2 ERRORs en la primera mitad
      mockEvent({ type: 'ERROR', code: '53.B0.02', timestamp: ts(base, 0) }),
      mockEvent({ type: 'ERROR', code: '53.B0.02', timestamp: ts(base, 30) }),
      // 6 WARNINGs en la segunda mitad — no deben disparar la regla
      mockEvent({ type: 'WARNING', code: '49.00.00', timestamp: ts(base, 61) }),
      mockEvent({ type: 'WARNING', code: '49.00.00', timestamp: ts(base, 70) }),
      mockEvent({ type: 'WARNING', code: '49.00.00', timestamp: ts(base, 80) }),
      mockEvent({ type: 'WARNING', code: '49.00.00', timestamp: ts(base, 90) }),
      mockEvent({ type: 'WARNING', code: '49.00.00', timestamp: ts(base, 100) }),
      mockEvent({ type: 'WARNING', code: '49.00.00', timestamp: ts(base, 110) }),
    ]
    render(<DiagnosticPanel events={events} />)
    expect(screen.queryByText(/escalando/i)).not.toBeInTheDocument()
  })

  it('Regla 4 — Firmware detectado por code_description, no por prefijo de código', () => {
    // Bug resuelto: antes usaba code.startsWith('49.') — ahora usa code_description
    const events = [
      mockEvent({
        type: 'ERROR',
        code: 'XX.00.00', // código sin prefijo '49.'
        code_description: 'firmware update recommended',
      }),
    ]
    render(<DiagnosticPanel events={events} />)
    const alerts = document.querySelectorAll('.diagnostic-panel__alert')
    const firmwareAlert = Array.from(alerts).find((a) => a.textContent?.includes('firmware'))
    expect(firmwareAlert).toBeTruthy()
  })

  it('Regla 5 — Múltiples bandejas detectadas por code_description', () => {
    const events = [
      mockEvent({ type: 'ERROR', code: 'TRY-001', code_description: 'Paper tray 1 error' }),
      mockEvent({ type: 'ERROR', code: 'TRY-002', code_description: 'Paper tray 2 error' }),
    ]
    render(<DiagnosticPanel events={events} />)
    expect(screen.getByText(/bandejas/i)).toBeInTheDocument()
  })

  it('Regla 5 ignora WARNING/INFO con "tray" en descripción — no dispara falso positivo', () => {
    // Bug resuelto: antes las reglas incluían WARNING/INFO causando falsos positivos
    const events = [
      mockEvent({ type: 'WARNING', code: 'TRY-001', code_description: 'Paper tray 1 warning' }),
      mockEvent({ type: 'WARNING', code: 'TRY-002', code_description: 'Paper tray 2 warning' }),
    ]
    render(<DiagnosticPanel events={events} />)
    expect(screen.queryByText(/bandejas/i)).not.toBeInTheDocument()
  })

  it('Recomendación "Visita técnica" cuando hay dominant + burst + escalation', () => {
    // Necesitamos disparar las 3 reglas: dominante, ráfaga y escalamiento
    const base = '2024-03-14T08:00:00'
    const events = [
      // 2 ERRORs en primera mitad para escalamiento
      mockEvent({ type: 'ERROR', code: '53.B0.02', code_description: 'Fuser', timestamp: ts(base, 0) }),
      mockEvent({ type: 'ERROR', code: '53.B0.02', code_description: 'Fuser', timestamp: ts(base, 20) }),
      // 6 ERRORs juntos para ráfaga + escalamiento + dominante
      mockEvent({ type: 'ERROR', code: '53.B0.02', code_description: 'Fuser', timestamp: ts(base, 61) }),
      mockEvent({ type: 'ERROR', code: '53.B0.02', code_description: 'Fuser', timestamp: ts(base, 65) }),
      mockEvent({ type: 'ERROR', code: '53.B0.02', code_description: 'Fuser', timestamp: ts(base, 69) }),
      mockEvent({ type: 'ERROR', code: '53.B0.02', code_description: 'Fuser', timestamp: ts(base, 73) }),
      mockEvent({ type: 'ERROR', code: '53.B0.02', code_description: 'Fuser', timestamp: ts(base, 77) }),
      mockEvent({ type: 'ERROR', code: '53.B0.02', code_description: 'Fuser', timestamp: ts(base, 81) }),
    ]
    render(<DiagnosticPanel events={events} />)
    expect(screen.getByText('🔴 Visita técnica recomendada')).toBeInTheDocument()
  })

  it('Recomendación "Sin acción necesaria" cuando no hay alertas', () => {
    render(<DiagnosticPanel events={[]} />)
    expect(screen.getByText('🟢 Sin acción necesaria')).toBeInTheDocument()
  })

  it('máximo 5 alertas visibles aunque se disparen más', () => {
    // Crear condiciones para disparar múltiples alertas
    const base = '2024-03-14T08:00:00'
    const events = [
      // Dominante
      ...Array.from({ length: 10 }, () =>
        mockEvent({ type: 'ERROR', code: '53.B0.02', code_description: 'Fuser', timestamp: ts(base, 0) })
      ),
      // Ráfaga
      ...Array.from({ length: 6 }, (_, i) =>
        mockEvent({ type: 'ERROR', code: '53.B0.02', code_description: 'Fuser', timestamp: ts(base, i * 4) })
      ),
      // Firmware
      mockEvent({ type: 'ERROR', code: 'XX.00.00', code_description: 'firmware update', timestamp: ts(base, 60) }),
      // Bandejas
      mockEvent({ type: 'ERROR', code: 'TRY-001', code_description: 'tray 1 error', timestamp: ts(base, 61) }),
      mockEvent({ type: 'ERROR', code: 'TRY-002', code_description: 'tray 2 error', timestamp: ts(base, 62) }),
    ]
    render(<DiagnosticPanel events={events} />)
    const alertItems = document.querySelectorAll('.diagnostic-panel__alert')
    expect(alertItems.length).toBeLessThanOrEqual(5)
  })

  it('el panel puede colapsarse y expandirse', async () => {
    const user = userEvent.setup()
    render(<DiagnosticPanel events={[]} />)

    // Inicialmente expandido
    expect(screen.getByText(/Sin patrones de alerta/)).toBeInTheDocument()

    // Colapsar
    await user.click(screen.getByRole('button', { name: /Diagnóstico automático/ }))
    expect(screen.queryByText(/Sin patrones de alerta/)).not.toBeInTheDocument()

    // Expandir de nuevo
    await user.click(screen.getByRole('button', { name: /Diagnóstico automático/ }))
    expect(screen.getByText(/Sin patrones de alerta/)).toBeInTheDocument()
  })
})
