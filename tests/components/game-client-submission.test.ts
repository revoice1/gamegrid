import { describe, expect, it, vi } from 'vitest'
import {
  buildDailyStatsPayload,
  buildGuessLookupRequest,
  buildGuessSubmissionRequest,
  buildLegacySessionHeaders,
  getPostGuessCompletionEffects,
  getPostGuessState,
  lookupGuessDetails,
  postDailyStats,
  shouldUnlockRealStinker,
  submitGuessSelection,
} from '@/components/game/game-client-submission'
import type { CellGuess, Game, Puzzle } from '@/lib/types'

const puzzle: Puzzle = {
  id: 'test-puzzle',
  date: null,
  is_daily: false,
  created_at: '2026-03-25T00:00:00.000Z',
  row_categories: [{ type: 'genre', id: 'rpg', name: 'RPG' }],
  col_categories: [{ type: 'platform', id: 'ps1', name: 'PlayStation (Original)' }],
}

const correctGuess: CellGuess = {
  gameId: 7,
  gameName: 'Test Game',
  gameImage: 'https://example.com/cover.png',
  isCorrect: true,
}

const game: Game = {
  id: 7,
  name: 'Test Game',
  slug: 'test-game',
  gameUrl: 'https://example.com/test-game',
  background_image: 'https://example.com/cover.png',
  released: '1997-01-31',
  metacritic: 41,
  genres: [],
  platforms: [],
}

describe('game client submission helpers', () => {
  it('builds lookup and submission request bodies for the guess API', () => {
    const rowCategory = { type: 'genre' as const, id: 'rpg', name: 'RPG' }
    const colCategory = { type: 'platform' as const, id: 'ps1', name: 'PlayStation (Original)' }

    expect(
      buildGuessLookupRequest({
        gameId: 7,
        rowCategory,
        colCategory,
      })
    ).toEqual({
      gameId: 7,
      rowCategory,
      colCategory,
      lookupOnly: true,
    })

    expect(
      buildGuessSubmissionRequest({
        puzzleId: 'test-puzzle',
        cellIndex: 0,
        gameId: 7,
        gameName: 'Test Game',
        gameImage: 'https://example.com/cover.png',
        rowCategory,
        colCategory,
        isDaily: false,
      })
    ).toEqual({
      puzzleId: 'test-puzzle',
      cellIndex: 0,
      gameId: 7,
      gameName: 'Test Game',
      gameImage: 'https://example.com/cover.png',
      rowCategory,
      colCategory,
      isDaily: false,
    })
  })

  it('builds the temporary legacy-session migration header only when a session id exists', () => {
    expect(buildLegacySessionHeaders('session-1')).toEqual({
      'x-gamegrid-legacy-session': 'session-1',
    })
    expect(buildLegacySessionHeaders('')).toBeUndefined()
    expect(buildLegacySessionHeaders(undefined)).toBeUndefined()
  })

  it('posts lookup and submission requests through the shared guess transport', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      json: async () => ({ valid: true, game: { slug: 'test-game' } }),
    })
    const rowCategory = { type: 'genre' as const, id: 'rpg', name: 'RPG' }
    const colCategory = { type: 'platform' as const, id: 'ps1', name: 'PlayStation (Original)' }

    await lookupGuessDetails(fetchImpl as typeof fetch, {
      gameId: 7,
      rowCategory,
      colCategory,
    })
    await submitGuessSelection(fetchImpl as typeof fetch, {
      puzzleId: 'test-puzzle',
      cellIndex: 0,
      gameId: 7,
      gameName: 'Test Game',
      gameImage: 'https://example.com/cover.png',
      rowCategory,
      colCategory,
      isDaily: true,
    })

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      '/api/guess',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: 7,
          rowCategory,
          colCategory,
          lookupOnly: true,
        }),
      })
    )
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      '/api/guess',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          puzzleId: 'test-puzzle',
          cellIndex: 0,
          gameId: 7,
          gameName: 'Test Game',
          gameImage: 'https://example.com/cover.png',
          rowCategory,
          colCategory,
          isDaily: true,
        }),
      })
    )
  })

  it('derives post-guess board state and persisted state', () => {
    expect(
      getPostGuessState({
        mode: 'practice',
        puzzle,
        guesses: Array(9).fill(null),
        selectedCell: 0,
        guessesRemaining: 4,
        newGuess: correctGuess,
      })
    ).toEqual({
      nextGuesses: [correctGuess, null, null, null, null, null, null, null, null],
      nextGuessesRemaining: 3,
      isComplete: false,
      finalScore: null,
      persistedState: {
        puzzleId: 'test-puzzle',
        puzzle,
        guesses: [
          {
            gameId: 7,
            gameName: 'Test Game',
            gameImage: 'https://example.com/cover.png',
            isCorrect: true,
          },
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
        ],
        guessesRemaining: 3,
        isComplete: false,
      },
    })
  })

  it('derives completion effects for daily, practice, and versus boards', () => {
    expect(
      getPostGuessCompletionEffects({
        mode: 'daily',
        isComplete: true,
        finalScore: 9,
      })
    ).toEqual({
      shouldUnlockPerfectGrid: true,
      shouldPostDailyStats: true,
      shouldShowResults: true,
    })

    expect(
      getPostGuessCompletionEffects({
        mode: 'practice',
        isComplete: true,
        finalScore: 7,
      })
    ).toEqual({
      shouldUnlockPerfectGrid: false,
      shouldPostDailyStats: false,
      shouldShowResults: true,
    })

    expect(
      getPostGuessCompletionEffects({
        mode: 'versus',
        isComplete: true,
        finalScore: 5,
      })
    ).toEqual({
      shouldUnlockPerfectGrid: false,
      shouldPostDailyStats: false,
      shouldShowResults: false,
    })
  })

  it('builds and posts the daily stats payload', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true })
    const payload = buildDailyStatsPayload({
      puzzleId: 'test-puzzle',
      score: 8,
    })

    expect(payload).toEqual({
      puzzleId: 'test-puzzle',
      score: 8,
      rarityScore: 0,
    })

    await postDailyStats(fetchImpl as typeof fetch, payload)

    expect(fetchImpl).toHaveBeenCalledWith('/api/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  })

  it('flags sub-50 games as real stinkers', () => {
    expect(shouldUnlockRealStinker(game)).toBe(true)
    expect(shouldUnlockRealStinker({ ...game, metacritic: 50 })).toBe(false)
    expect(shouldUnlockRealStinker({ ...game, metacritic: null })).toBe(false)
  })
})
