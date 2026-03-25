import { buildPersistedGuessSnapshot, type GuessLookupResult } from './game-client-helpers'
import type { Category, CellGuess, Game, Puzzle } from '@/lib/types'

type FetchLike = typeof fetch

export interface GuessSubmissionResult extends GuessLookupResult {
  duplicate?: boolean
}

export interface GuessLookupRequest {
  gameId: number
  rowCategory: Category
  colCategory: Category
}

export interface GuessSubmissionRequest {
  puzzleId: string
  cellIndex: number
  gameId: number
  gameName: string
  gameImage: string | null
  sessionId: string
  rowCategory: Category
  colCategory: Category
  isDaily: boolean
}

export function buildGuessLookupRequest(request: GuessLookupRequest) {
  return {
    gameId: request.gameId,
    rowCategory: request.rowCategory,
    colCategory: request.colCategory,
    lookupOnly: true,
  }
}

export function buildGuessSubmissionRequest(request: GuessSubmissionRequest) {
  return {
    puzzleId: request.puzzleId,
    cellIndex: request.cellIndex,
    gameId: request.gameId,
    gameName: request.gameName,
    gameImage: request.gameImage,
    sessionId: request.sessionId,
    rowCategory: request.rowCategory,
    colCategory: request.colCategory,
    isDaily: request.isDaily,
  }
}

async function postGuessRequest(
  fetchImpl: FetchLike,
  body: unknown
): Promise<GuessSubmissionResult> {
  const response = await fetchImpl('/api/guess', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return response.json() as Promise<GuessSubmissionResult>
}

export async function lookupGuessDetails(fetchImpl: FetchLike, request: GuessLookupRequest) {
  return postGuessRequest(fetchImpl, buildGuessLookupRequest(request))
}

export async function submitGuessSelection(fetchImpl: FetchLike, request: GuessSubmissionRequest) {
  return postGuessRequest(fetchImpl, buildGuessSubmissionRequest(request))
}

export function getPostGuessState(options: {
  mode: 'daily' | 'practice' | 'versus'
  puzzle: Puzzle
  guesses: Array<CellGuess | null>
  selectedCell: number
  guessesRemaining: number
  newGuess: CellGuess
}) {
  const { mode, puzzle, guesses, selectedCell, guessesRemaining, newGuess } = options
  const nextGuesses = [...guesses]
  nextGuesses[selectedCell] = newGuess
  const nextGuessesRemaining = mode === 'versus' ? guessesRemaining : guessesRemaining - 1
  const boardFilled = nextGuesses.every((guess) => guess !== null)
  const isComplete = nextGuessesRemaining === 0 || boardFilled
  const finalScore = isComplete ? nextGuesses.filter((guess) => guess?.isCorrect).length : null

  return {
    nextGuesses,
    nextGuessesRemaining,
    isComplete,
    finalScore,
    persistedState:
      mode === 'versus'
        ? null
        : {
            puzzleId: puzzle.id,
            puzzle,
            guesses: buildPersistedGuessSnapshot(nextGuesses),
            guessesRemaining: nextGuessesRemaining,
            isComplete,
          },
  }
}

export function buildDailyStatsPayload(options: {
  puzzleId: string
  sessionId: string
  score: number
}) {
  return {
    puzzleId: options.puzzleId,
    sessionId: options.sessionId,
    score: options.score,
    rarityScore: 0,
  }
}

export async function postDailyStats(
  fetchImpl: FetchLike,
  payload: ReturnType<typeof buildDailyStatsPayload>
) {
  return fetchImpl('/api/stats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function getPostGuessCompletionEffects(options: {
  mode: 'daily' | 'practice' | 'versus'
  isComplete: boolean
  finalScore: number | null
}) {
  const { mode, isComplete, finalScore } = options

  return {
    shouldUnlockPerfectGrid: isComplete && finalScore === 9,
    shouldPostDailyStats: mode === 'daily' && isComplete && finalScore !== null,
    shouldShowResults: mode !== 'versus' && isComplete && finalScore !== null,
  }
}

export function shouldUnlockRealStinker(game: Game): boolean {
  return game.metacritic !== null && game.metacritic < 50
}
