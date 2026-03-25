import { useEffect, useEffectEvent } from 'react'

interface TimedOverlay {
  durationMs: number
}

export function useTimedOverlayDismiss<TOverlay extends TimedOverlay>(
  activeOverlay: TOverlay | null,
  clearOverlay: () => void
) {
  const clearOverlayEvent = useEffectEvent(clearOverlay)

  useEffect(() => {
    if (!activeOverlay) {
      return
    }

    const timer = window.setTimeout(() => {
      clearOverlayEvent()
    }, activeOverlay.durationMs)

    return () => window.clearTimeout(timer)
  }, [activeOverlay])
}
