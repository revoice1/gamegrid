import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useTimedOverlayDismiss } from '@/hooks/use-timed-overlay-dismiss'

describe('useTimedOverlayDismiss', () => {
  it('clears the active overlay after its duration', () => {
    vi.useFakeTimers()

    try {
      const clearOverlay = vi.fn()

      renderHook(() =>
        useTimedOverlayDismiss(
          {
            durationMs: 900,
          },
          clearOverlay
        )
      )

      expect(clearOverlay).not.toHaveBeenCalled()

      vi.advanceTimersByTime(899)
      expect(clearOverlay).not.toHaveBeenCalled()

      vi.advanceTimersByTime(1)
      expect(clearOverlay).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('does not restart the dismissal timer just because the clear callback identity changes', () => {
    vi.useFakeTimers()

    try {
      const firstClearOverlay = vi.fn()
      const secondClearOverlay = vi.fn()
      const activeOverlay = { durationMs: 900 }

      const { rerender } = renderHook(
        ({
          activeOverlay,
          clearOverlay,
        }: {
          activeOverlay: { durationMs: number } | null
          clearOverlay: () => void
        }) => useTimedOverlayDismiss(activeOverlay, clearOverlay),
        {
          initialProps: {
            activeOverlay,
            clearOverlay: firstClearOverlay,
          },
        }
      )

      vi.advanceTimersByTime(450)

      rerender({
        activeOverlay,
        clearOverlay: secondClearOverlay,
      })

      vi.advanceTimersByTime(449)
      expect(firstClearOverlay).not.toHaveBeenCalled()
      expect(secondClearOverlay).not.toHaveBeenCalled()

      vi.advanceTimersByTime(1)
      expect(firstClearOverlay).not.toHaveBeenCalled()
      expect(secondClearOverlay).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })
})
