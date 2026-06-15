export const formatYMD = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export type DateSelection = string | { start: string; end: string }

/** Convierte una selección de fecha en un rango de timestamps [startTs, endTs]. */
export const parseDateRange = (selection: DateSelection): { startTs: number; endTs: number } => {
  if (typeof selection === 'string') {
    const [y, m, d] = selection.split('-').map(Number)
    return {
      startTs: new Date(y, m - 1, d, 0, 0, 0, 0).getTime(),
      endTs: new Date(y, m - 1, d, 23, 59, 59, 999).getTime(),
    }
  }
  const [sy, sm, sd] = selection.start.split('-').map(Number)
  const [ey, em, ed] = selection.end.split('-').map(Number)
  return {
    startTs: new Date(sy, sm - 1, sd, 0, 0, 0, 0).getTime(),
    endTs: new Date(ey, em - 1, ed, 23, 59, 59, 999).getTime(),
  }
}
