import { describe, expect, it } from 'vitest'
import {
  buildOverruledObjectionToastDescription,
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

  it('uses the Gemini rationale when building the overruled objection toast', () => {
    expect(
      buildOverruledObjectionToastDescription(
        'The game fits first-person, but it was not published by Square Enix.',
        'X loses the turn.'
      )
    ).toBe('The game fits first-person, but it was not published by Square Enix. X loses the turn.')
  })

  it('normalizes trailing punctuation on the Gemini rationale', () => {
    expect(
      buildOverruledObjectionToastDescription(
        'The app rejection is probably correct!!!',
        'X loses the turn.'
      )
    ).toBe('The app rejection is probably correct. X loses the turn.')
  })

  it('falls back to the generic overruled copy when Gemini gives no rationale', () => {
    expect(buildOverruledObjectionToastDescription(null, 'X loses the turn.')).toBe(
      'Judge Gemini overruled the objection. X loses the turn.'
    )
  })

  it('treats whitespace-only Gemini rationale the same as no rationale', () => {
    expect(buildOverruledObjectionToastDescription('   ', 'X loses the turn.')).toBe(
      'Judge Gemini overruled the objection. X loses the turn.'
    )
  })

  it('treats missing Gemini rationale the same as no rationale', () => {
    expect(buildOverruledObjectionToastDescription(undefined, 'X loses the turn.')).toBe(
      'Judge Gemini overruled the objection. X loses the turn.'
    )
  })
})
