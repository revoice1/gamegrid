import { describe, expect, it } from 'vitest'
import {
  hasRestorableVersusState,
  shouldForegroundOnlineVersusSession,
} from '@/components/game/game-client-online-helpers'

describe('game client online helpers', () => {
  it('keeps online versus in the foreground only when the user is actively in or entering it', () => {
    expect(
      shouldForegroundOnlineVersusSession({
        mode: 'versus',
        showOnlineLobby: false,
        isResumingOnlineVersus: false,
      })
    ).toBe(true)

    expect(
      shouldForegroundOnlineVersusSession({
        mode: 'daily',
        showOnlineLobby: true,
        isResumingOnlineVersus: false,
      })
    ).toBe(true)

    expect(
      shouldForegroundOnlineVersusSession({
        mode: 'daily',
        showOnlineLobby: false,
        isResumingOnlineVersus: true,
      })
    ).toBe(true)

    expect(
      shouldForegroundOnlineVersusSession({
        mode: 'practice',
        showOnlineLobby: false,
        isResumingOnlineVersus: false,
      })
    ).toBe(false)
  })

  it('treats a live online room as restorable versus state even without a saved puzzle snapshot', () => {
    expect(
      hasRestorableVersusState({
        hasSavedVersusPuzzle: true,
        hasOnlineRoom: false,
      })
    ).toBe(true)

    expect(
      hasRestorableVersusState({
        hasSavedVersusPuzzle: false,
        hasOnlineRoom: true,
      })
    ).toBe(true)

    expect(
      hasRestorableVersusState({
        hasSavedVersusPuzzle: false,
        hasOnlineRoom: false,
      })
    ).toBe(false)
  })
})
