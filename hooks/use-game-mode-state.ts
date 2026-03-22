import { useState } from 'react'
import type { GameMode } from '@/lib/types'

export function useGameModeState() {
  const [mode, setMode] = useState<GameMode>('daily')
  const [loadedPuzzleMode, setLoadedPuzzleMode] = useState<GameMode | null>(null)

  return {
    mode,
    setMode,
    loadedPuzzleMode,
    setLoadedPuzzleMode,
  }
}
