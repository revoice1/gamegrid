import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useVersusTurnTimer } from '@/hooks/use-versus-turn-timer'

describe('useVersusTurnTimer', () => {
  it('starts a fresh timer when a versus board becomes ready', () => {
    const activeTurnTimerKeyRef = { current: null as string | null }
    const setTurnTimeLeft = vi.fn()

    renderHook(() =>
      useVersusTurnTimer({
        isVersusMode: true,
        isLoading: false,
        loadedPuzzleMode: 'versus',
        puzzleId: 'versus-puzzle',
        currentPlayer: 'x',
        winner: null,
        versusTimerOption: 20,
        turnTimeLeft: null,
        pendingFinalSteal: null,
        animationsEnabled: true,
        alarmsEnabled: true,
        activeTurnTimerKeyRef,
        setTurnTimeLeft,
        onTurnExpired: vi.fn(),
      })
    )

    expect(activeTurnTimerKeyRef.current).toBe('versus-puzzle:x')
    expect(setTurnTimeLeft).toHaveBeenCalledWith(20)
  })

  it('notifies when the turn timer has already expired', () => {
    const activeTurnTimerKeyRef = { current: 'versus-puzzle:x' as string | null }
    const onTurnExpired = vi.fn()

    renderHook(() =>
      useVersusTurnTimer({
        isVersusMode: true,
        isLoading: false,
        loadedPuzzleMode: 'versus',
        puzzleId: 'versus-puzzle',
        currentPlayer: 'x',
        winner: null,
        versusTimerOption: 20,
        turnTimeLeft: 0,
        pendingFinalSteal: null,
        animationsEnabled: true,
        alarmsEnabled: true,
        activeTurnTimerKeyRef,
        setTurnTimeLeft: vi.fn(),
        onTurnExpired,
      })
    )

    expect(onTurnExpired).toHaveBeenCalledWith('o')
  })

  it('keeps counting down across rerenders with a new onTurnExpired callback identity', () => {
    vi.useFakeTimers()

    try {
      const activeTurnTimerKeyRef = { current: 'versus-puzzle:x' as string | null }
      const setTurnTimeLeft = vi.fn()
      const firstOnTurnExpired = vi.fn()
      const secondOnTurnExpired = vi.fn()

      const { rerender } = renderHook(
        ({
          turnTimeLeft,
          onTurnExpired,
        }: {
          turnTimeLeft: number | null
          onTurnExpired: (nextPlayer: 'x' | 'o') => void
        }) =>
          useVersusTurnTimer({
            isVersusMode: true,
            isLoading: false,
            loadedPuzzleMode: 'versus',
            puzzleId: 'versus-puzzle',
            currentPlayer: 'x',
            winner: null,
            versusTimerOption: 20,
            turnTimeLeft,
            pendingFinalSteal: null,
            animationsEnabled: true,
            alarmsEnabled: true,
            activeTurnTimerKeyRef,
            setTurnTimeLeft,
            onTurnExpired,
          }),
        {
          initialProps: {
            turnTimeLeft: 20,
            onTurnExpired: firstOnTurnExpired,
          },
        }
      )

      act(() => {
        vi.advanceTimersByTime(500)
      })

      rerender({
        turnTimeLeft: 20,
        onTurnExpired: secondOnTurnExpired,
      })

      act(() => {
        vi.advanceTimersByTime(500)
      })

      expect(setTurnTimeLeft).toHaveBeenCalledWith(expect.any(Function))
      expect(firstOnTurnExpired).not.toHaveBeenCalled()
      expect(secondOnTurnExpired).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })
})
