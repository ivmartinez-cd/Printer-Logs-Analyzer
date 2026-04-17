import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Calendar } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import { es } from 'date-fns/locale'
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
  subMonths,
  subDays,
} from 'date-fns'
import 'react-day-picker/dist/style.css'
import type { DateFilter } from '../hooks/useDateFilter'

// NOTE: para la próxima iteración — integrar en DashboardPage como reemplazo de DateFilterBar

interface DateRangePickerProps {
  activeFilter: DateFilter
  minDate?: Date
  maxDate?: Date
  onChange: (filter: DateFilter) => void
}

// ── Helpers de rango (weekStartsOn: 1 = lunes, para matchear useDateFilter) ──

const FMT = 'yyyy-MM-dd'

function getTodayRange(): { start: string; end: string } {
  const today = new Date()
  const s = format(today, FMT)
  return { start: s, end: s }
}

function getThisWeekRange(): { start: string; end: string } {
  const now = new Date()
  return {
    start: format(startOfWeek(now, { weekStartsOn: 1 }), FMT),
    end: format(endOfWeek(now, { weekStartsOn: 1 }), FMT),
  }
}

function getLastWeekRange(): { start: string; end: string } {
  const lastWeek = subWeeks(new Date(), 1)
  return {
    start: format(startOfWeek(lastWeek, { weekStartsOn: 1 }), FMT),
    end: format(endOfWeek(lastWeek, { weekStartsOn: 1 }), FMT),
  }
}

function getThisMonthRange(): { start: string; end: string } {
  const now = new Date()
  return {
    start: format(startOfMonth(now), FMT),
    end: format(endOfMonth(now), FMT),
  }
}

function getLastMonthRange(): { start: string; end: string } {
  const lastMonth = subMonths(new Date(), 1)
  return {
    start: format(startOfMonth(lastMonth), FMT),
    end: format(endOfMonth(lastMonth), FMT),
  }
}

function getLastNDaysRange(n: number): { start: string; end: string } {
  const today = new Date()
  return {
    start: format(subDays(today, n - 1), FMT),
    end: format(today, FMT),
  }
}

// ── Label del botón principal ──

function filterLabel(filter: DateFilter): string {
  if (!filter) return 'Todo el período'
  if (typeof filter === 'string') {
    const [y, m, d] = filter.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }
  const fmtShort = (s: string) => {
    const [y, m, d] = s.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }
  return `${fmtShort(filter.start)} – ${fmtShort(filter.end)}`
}

// ── Tipo interno para el selector de DayPicker ──

interface DayRange {
  from?: Date
  to?: Date
}

export function DateRangePicker({ activeFilter, minDate, maxDate, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  // Estado temporal del DayPicker — se descarta si se cierra sin aplicar
  const [tempRange, setTempRange] = useState<DayRange>({})
  const [popoverPos, setPopoverPos] = useState<{ top: number; right: number } | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setPopoverPos({
      top: rect.bottom + window.scrollY + 8,
      right: window.innerWidth - rect.right,
    })
  }, [])

  // Actualizar posición cuando se abre y al resize/scroll
  useEffect(() => {
    if (!open) return
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, updatePosition])

  // Cerrar con Escape o click afuera sin aplicar cambios
  useEffect(() => {
    if (!open) return

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        setTempRange({})
      }
    }

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setOpen(false)
        setTempRange({})
      }
    }

    document.addEventListener('keydown', handleKey)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  function applyPreset(range: { start: string; end: string } | null) {
    onChange(range)
    setOpen(false)
    setTempRange({})
  }

  function applyCalendar() {
    if (!tempRange.from) return
    const start = format(tempRange.from, FMT)
    const end = tempRange.to ? format(tempRange.to, FMT) : start
    // Si start === end lo tratamos como filtro de día único (string)
    onChange(start === end ? start : { start, end })
    setOpen(false)
    setTempRange({})
  }

  function cancelCalendar() {
    setOpen(false)
    setTempRange({})
  }

  const presets: Array<{ label: string; action: () => void }> = [
    { label: 'Todo el período', action: () => applyPreset(null) },
    { label: 'Hoy', action: () => applyPreset(getTodayRange()) },
    { label: 'Esta semana', action: () => applyPreset(getThisWeekRange()) },
    { label: 'Semana anterior', action: () => applyPreset(getLastWeekRange()) },
    { label: 'Este mes', action: () => applyPreset(getThisMonthRange()) },
    { label: 'Mes anterior', action: () => applyPreset(getLastMonthRange()) },
    { label: 'Últimos 7 días', action: () => applyPreset(getLastNDaysRange(7)) },
    { label: 'Últimos 30 días', action: () => applyPreset(getLastNDaysRange(30)) },
  ]

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={triggerRef}
        type="button"
        className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold text-white hover:bg-white/10 hover:border-hp-blue-vibrant transition-all shadow-premium-sm"
        onClick={() => { updatePosition(); setOpen((v) => !v) }}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Calendar className="text-hp-blue-vibrant" size={14} aria-hidden="true" />
        <span>{filterLabel(activeFilter)}</span>
      </button>

      {open && popoverPos && createPortal(
        <div
          ref={popoverRef}
          style={{ position: 'absolute', top: popoverPos.top, right: popoverPos.right, zIndex: 9999 }}
          className="bg-hp-darker/98 backdrop-blur-2xl border border-glass-border rounded-[1.5rem] shadow-premium-md p-5 min-w-[560px] animate-scale-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex gap-8">
            {/* Columna izquierda: presets */}
            <div className="flex flex-col gap-1.5 min-w-[170px] border-r border-white/10 pr-6">
              {presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  className="date-range-picker__preset-button"
                  onClick={p.action}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Columna derecha: DayPicker + footer */}
            <div className="date-range-picker__calendar-wrapper">
              <div className="calendar-custom-wrapper">
                <DayPicker
                  mode="range"
                  locale={es}
                  selected={tempRange.from ? { from: tempRange.from, to: tempRange.to } : undefined}
                  onSelect={(range) => setTempRange(range ?? {})}
                  fromDate={minDate}
                  toDate={maxDate}
                />
              </div>
              <div className="date-range-picker__footer">
                <button
                  type="button"
                  className="date-range-picker__cancel-button"
                  onClick={cancelCalendar}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="date-range-picker__apply-button"
                  onClick={applyCalendar}
                  disabled={!tempRange.from}
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
