import React from 'react'
import type { DateFilter } from '../hooks/useDateFilter'
import {
  getWeekRange,
  formatWeekRange,
  formatDayFilter,
  weekInputToRange,
} from '../hooks/useDateFilter'

interface DateFilterBarProps {
  logFileName: string | null
  activeFilter: DateFilter
  selectedDate: string | null
  selectedWeekRange: { start: string; end: string } | null
  dateRange: { minDate: string; maxDate: string } | null
  weekPickerOpen: boolean
  setWeekPickerOpen: React.Dispatch<React.SetStateAction<boolean>>
  weekPickerRef: React.RefObject<HTMLDivElement>
  dayPickerOpen: boolean
  setDayPickerOpen: React.Dispatch<React.SetStateAction<boolean>>
  dayPickerRef: React.RefObject<HTMLDivElement>
  setSelectedDate: (d: string | null) => void
  setSelectedWeekRange: (r: { start: string; end: string } | null) => void
}

export function DateFilterBar({
  logFileName,
  activeFilter,
  selectedDate,
  selectedWeekRange,
  dateRange,
  weekPickerOpen,
  setWeekPickerOpen,
  weekPickerRef,
  dayPickerOpen,
  setDayPickerOpen,
  dayPickerRef,
  setSelectedDate,
  setSelectedWeekRange,
}: DateFilterBarProps) {
  const thisWeekStart = getWeekRange(new Date()).start
  // eslint-disable-next-line react-hooks/purity
  const prevWeekStart = getWeekRange(new Date(Date.now() - 7 * 86400000)).start
  const isCustomWeek =
    selectedWeekRange !== null &&
    selectedWeekRange.start !== thisWeekStart &&
    selectedWeekRange.start !== prevWeekStart

  return (
    <div className="dashboard__subheader">
      <span className="dashboard__subheader-title">
        Panel de errores{logFileName ? ` · ${logFileName}` : ''}
      </span>
      <div className="dashboard__subheader-actions">
        <label className="dashboard__day-filter-label">Ver datos:</label>
        <div className="date-filter-group">
          <button
            type="button"
            className={`dashboard__btn dashboard__btn--secondary dashboard__btn--todo${activeFilter === null ? ' dashboard__btn--todo-active' : ''}`}
            onClick={() => {
              setSelectedDate(null)
              setSelectedWeekRange(null)
            }}
          >
            Todo
          </button>
          <button
            type="button"
            className={`dashboard__btn dashboard__btn--secondary dashboard__btn--todo${selectedWeekRange?.start === thisWeekStart ? ' dashboard__btn--todo-active' : ''}`}
            onClick={() => {
              setSelectedDate(null)
              setSelectedWeekRange(getWeekRange(new Date()))
            }}
          >
            Esta semana
          </button>
          <button
            type="button"
            className={`dashboard__btn dashboard__btn--secondary dashboard__btn--todo${selectedWeekRange?.start === prevWeekStart ? ' dashboard__btn--todo-active' : ''}`}
            onClick={() => {
              setSelectedDate(null)
              setSelectedWeekRange(getWeekRange(new Date(Date.now() - 7 * 86400000)))
            }}
          >
            Semana anterior
          </button>

          {/* Picker de semana con popover */}
          <div className="date-filter-picker-wrap" ref={weekPickerRef}>
            <button
              type="button"
              className={`dashboard__btn dashboard__btn--secondary dashboard__btn--todo${isCustomWeek ? ' dashboard__btn--todo-active' : ''}`}
              onClick={() => setWeekPickerOpen((o) => !o)}
              title="Elegir una semana específica"
            >
              {isCustomWeek && selectedWeekRange
                ? formatWeekRange(selectedWeekRange)
                : 'Elegir semana ▾'}
            </button>
            {weekPickerOpen && (
              <div className="date-filter-popover">
                <span className="date-filter-popover__label">Seleccioná una semana</span>
                <input
                  type="week"
                  className="dashboard__date-input"
                  onChange={(e) => {
                    if (!e.target.value) return
                    setSelectedDate(null)
                    setSelectedWeekRange(weekInputToRange(e.target.value))
                    setWeekPickerOpen(false)
                  }}
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* Picker de día con popover — dentro del grupo */}
          <div className="date-filter-picker-wrap" ref={dayPickerRef}>
            <button
              type="button"
              className={`dashboard__btn dashboard__btn--secondary dashboard__btn--todo${selectedDate !== null ? ' dashboard__btn--todo-active' : ''}`}
              onClick={() => setDayPickerOpen((o) => !o)}
              title="Filtrar por día específico"
            >
              {selectedDate !== null ? formatDayFilter(selectedDate) : '📅'}
            </button>
            {dayPickerOpen && (
              <div className="date-filter-popover">
                <span className="date-filter-popover__label">Seleccioná un día</span>
                <input
                  type="date"
                  className="dashboard__date-input"
                  min={dateRange?.minDate}
                  max={dateRange?.maxDate}
                  value={selectedDate ?? ''}
                  onChange={(e) => {
                    setSelectedWeekRange(null)
                    setSelectedDate(e.target.value || null)
                    setDayPickerOpen(false)
                  }}
                  autoFocus
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
