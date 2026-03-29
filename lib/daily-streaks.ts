export interface DailyCompletionSummaryRecord {
  date: string
  score: number | null
}

export interface DailyStreakSummary {
  currentStreak: number
  bestStreak: number
  completedCount: number
  perfectCount: number
}

function addUtcDays(date: string, days: number): string {
  const utcDate = new Date(`${date}T00:00:00.000Z`)
  utcDate.setUTCDate(utcDate.getUTCDate() + days)
  return utcDate.toISOString().slice(0, 10)
}

function getCurrentStreakAnchor(completedDates: string[], today: string): string | null {
  if (completedDates.length === 0) {
    return null
  }

  const latestDate = completedDates[completedDates.length - 1]
  if (latestDate === today || latestDate === addUtcDays(today, -1)) {
    return latestDate
  }

  return null
}

export function buildDailyStreakSummary(
  records: DailyCompletionSummaryRecord[],
  today: string = new Date().toISOString().slice(0, 10)
): DailyStreakSummary {
  const uniqueByDate = new Map<string, number | null>()
  for (const record of records) {
    if (!record.date) continue
    uniqueByDate.set(record.date, record.score)
  }

  const completedDates = Array.from(uniqueByDate.keys()).sort()
  const completedCount = completedDates.length
  const perfectCount = Array.from(uniqueByDate.values()).filter((score) => score === 9).length

  let bestStreak = 0
  let runningBest = 0
  let previousDate: string | null = null

  for (const date of completedDates) {
    runningBest = previousDate && addUtcDays(previousDate, 1) === date ? runningBest + 1 : 1
    bestStreak = Math.max(bestStreak, runningBest)
    previousDate = date
  }

  const anchor = getCurrentStreakAnchor(completedDates, today)
  let currentStreak = 0

  if (anchor) {
    let cursor = anchor
    while (uniqueByDate.has(cursor)) {
      currentStreak += 1
      cursor = addUtcDays(cursor, -1)
    }
  }

  return {
    currentStreak,
    bestStreak,
    completedCount,
    perfectCount,
  }
}
