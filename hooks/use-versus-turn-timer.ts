import { useEffect, useEffectEvent, type MutableRefObject } from 'react'
import { getNextPlayer, type TicTacToePlayer } from '@/components/game/game-client-versus-helpers'
import {
  startFinalStealHeartbeatLoop,
  stopFinalStealHeartbeatLoop,
} from '@/components/game/game-client-runtime-helpers'

interface PendingFinalStealLike {
  defender: TicTacToePlayer
  cellIndex: number
}

interface UseVersusTurnTimerOptions {
  isVersusMode: boolean
  isLoading: boolean
  loadedPuzzleMode: 'daily' | 'practice' | 'versus' | null
  puzzleId: string | null
  currentPlayer: TicTacToePlayer
  winner: TicTacToePlayer | 'draw' | null
  versusTimerOption: number | 'none'
  turnTimeLeft: number | null
  pendingFinalSteal: PendingFinalStealLike | null
  animationsEnabled: boolean
  audioEnabled: boolean
  activeTurnTimerKeyRef: MutableRefObject<string | null>
  setTurnTimeLeft: (value: number | null | ((current: number | null) => number | null)) => void
  onTurnExpired: (nextPlayer: TicTacToePlayer) => void
}

export function useVersusTurnTimer({
  isVersusMode,
  isLoading,
  loadedPuzzleMode,
  puzzleId,
  currentPlayer,
  winner,
  versusTimerOption,
  turnTimeLeft,
  pendingFinalSteal,
  animationsEnabled,
  audioEnabled,
  activeTurnTimerKeyRef,
  setTurnTimeLeft,
  onTurnExpired,
}: UseVersusTurnTimerOptions) {
  const onTurnExpiredEvent = useEffectEvent(onTurnExpired)

  useEffect(() => {
    const cueKey = pendingFinalSteal
      ? `${pendingFinalSteal.defender}:${pendingFinalSteal.cellIndex}`
      : null

    if (!cueKey || !animationsEnabled || !audioEnabled) {
      stopFinalStealHeartbeatLoop()
      return
    }

    startFinalStealHeartbeatLoop()

    return () => {
      stopFinalStealHeartbeatLoop()
    }
  }, [audioEnabled, animationsEnabled, pendingFinalSteal])

  useEffect(() => {
    if (!isVersusMode || winner) {
      stopFinalStealHeartbeatLoop()
      return
    }
  }, [isVersusMode, winner])

  useEffect(() => {
    const isVersusBoardReady =
      isVersusMode && !isLoading && loadedPuzzleMode === 'versus' && puzzleId !== null

    if (!isVersusBoardReady || winner || versusTimerOption === 'none') {
      activeTurnTimerKeyRef.current = null
      setTurnTimeLeft(null)
      return
    }

    const turnTimerKey = `${puzzleId}:${currentPlayer}`
    if (activeTurnTimerKeyRef.current === turnTimerKey) {
      return
    }

    activeTurnTimerKeyRef.current = turnTimerKey
    setTurnTimeLeft(versusTimerOption)
  }, [
    activeTurnTimerKeyRef,
    currentPlayer,
    isLoading,
    isVersusMode,
    loadedPuzzleMode,
    puzzleId,
    setTurnTimeLeft,
    versusTimerOption,
    winner,
  ])

  useEffect(() => {
    if (!isVersusMode || winner || turnTimeLeft === null) {
      return
    }

    if (turnTimeLeft <= 0) {
      onTurnExpiredEvent(getNextPlayer(currentPlayer))
      return
    }

    const timer = window.setTimeout(() => {
      setTurnTimeLeft((current) => (current === null ? null : current - 1))
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [currentPlayer, isVersusMode, setTurnTimeLeft, turnTimeLeft, winner])
}
