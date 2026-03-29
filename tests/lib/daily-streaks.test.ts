import { describe, expect, it } from 'vitest'
import { buildDailyStreakSummary } from '@/lib/daily-streaks'

describe('buildDailyStreakSummary', () => {
  it('computes current and best streaks for consecutive daily completions', () => {
    expect(
      buildDailyStreakSummary(
        [
          { date: '2026-03-24', score: 7 },
          { date: '2026-03-25', score: 9 },
          { date: '2026-03-26', score: 8 },
          { date: '2026-03-28', score: 9 },
        ],
        '2026-03-28'
      )
    ).toEqual({
      currentStreak: 1,
      bestStreak: 3,
      completedCount: 4,
      perfectCount: 2,
    })
  })

  it('keeps a streak alive through yesterday when today is unfinished', () => {
    expect(
      buildDailyStreakSummary(
        [
          { date: '2026-03-24', score: 6 },
          { date: '2026-03-25', score: 7 },
          { date: '2026-03-26', score: 8 },
          { date: '2026-03-27', score: 9 },
        ],
        '2026-03-28'
      )
    ).toEqual({
      currentStreak: 4,
      bestStreak: 4,
      completedCount: 4,
      perfectCount: 1,
    })
  })

  it('drops the current streak to zero after a gap while preserving the best streak', () => {
    expect(
      buildDailyStreakSummary(
        [
          { date: '2026-03-20', score: 9 },
          { date: '2026-03-21', score: 9 },
          { date: '2026-03-24', score: 5 },
        ],
        '2026-03-28'
      )
    ).toEqual({
      currentStreak: 0,
      bestStreak: 2,
      completedCount: 3,
      perfectCount: 2,
    })
  })
})
