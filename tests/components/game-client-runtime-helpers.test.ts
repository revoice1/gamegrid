import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  buildMissReason,
  getInitialVersusRecord,
  hasNonEmptyFilters,
  saveVersusRecord,
  VERSUS_RECORD_KEY,
} from '@/components/game/game-client-runtime-helpers'

describe('game client runtime helpers', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('detects whether any custom filters are active', () => {
    expect(
      hasNonEmptyFilters({
        company: [],
        platform: [],
      })
    ).toBe(false)

    expect(
      hasNonEmptyFilters({
        company: ['nintendo'],
        platform: [],
      })
    ).toBe(true)
  })

  it('builds clear miss reasons for row and column mismatches', () => {
    const row = { type: 'genre' as const, id: 'rpg', name: 'RPG' }
    const col = { type: 'platform' as const, id: 'ps1', name: 'PlayStation (Original)' }

    expect(buildMissReason(row, col, false, true)).toBe("didn't match RPG")
    expect(buildMissReason(row, col, true, false)).toBe("didn't match PlayStation (Original)")
    expect(buildMissReason(row, col, false, false)).toBe(
      "didn't match RPG or didn't match PlayStation (Original)"
    )
    expect(buildMissReason(row, col, undefined, undefined)).toBe(
      "didn't match RPG x PlayStation (Original)"
    )
  })

  it('loads and saves the versus record through session storage', () => {
    expect(getInitialVersusRecord()).toEqual({ xWins: 0, oWins: 0 })

    saveVersusRecord({ xWins: 3, oWins: 2 })

    expect(sessionStorage.getItem(VERSUS_RECORD_KEY)).toBe(JSON.stringify({ xWins: 3, oWins: 2 }))
    expect(getInitialVersusRecord()).toEqual({ xWins: 3, oWins: 2 })
  })

  it('falls back safely when stored versus record data is invalid', () => {
    sessionStorage.setItem(VERSUS_RECORD_KEY, '{bad json')

    expect(getInitialVersusRecord()).toEqual({ xWins: 0, oWins: 0 })
  })
})
