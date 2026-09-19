export function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

function prevWeekKey(weekKey: string): string {
  const [yearStr, wStr] = weekKey.split('-W')
  const year = parseInt(yearStr)
  const week = parseInt(wStr)
  if (week > 1) return `${year}-W${String(week - 1).padStart(2, '0')}`
  // Dec 28 is always in the last ISO week of the previous year
  return isoWeekKey(new Date(Date.UTC(year - 1, 11, 28)))
}

export function computeStreak(logDates: string[]): number {
  if (!logDates.length) return 0
  const weekKeys = new Set(logDates.map(d => isoWeekKey(new Date(d))))
  const sorted = Array.from(weekKeys).sort().reverse()
  let streak = 1
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === prevWeekKey(sorted[i - 1])) streak++
    else break
  }
  return streak
}
