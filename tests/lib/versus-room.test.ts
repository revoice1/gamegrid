import { describe, expect, it } from 'vitest'
import {
  getOnlineVersusRoleAssignments,
  getOnlineVersusSnapshotRoleAssignments,
  isOnlineVersusSnapshot,
  type VersusRoom,
} from '@/lib/versus-room'

describe('versus-room helpers', () => {
  it('returns snapshot role assignments when present', () => {
    const state: VersusRoom['state_data'] = {
      puzzleId: 'p1',
      guesses: Array(9).fill(null),
      guessesRemaining: 9,
      currentPlayer: 'x',
      winner: null,
      stealableCell: null,
      pendingFinalSteal: null,
      objectionsUsed: { x: 0, o: 0 },
      turnDeadlineAt: null,
      turnDurationSeconds: null,
      roleAssignments: {
        xSessionId: 'session-x',
        oSessionId: 'session-o',
      },
    }

    expect(getOnlineVersusSnapshotRoleAssignments(state)).toEqual({
      xSessionId: 'session-x',
      oSessionId: 'session-o',
    })
  })

  it('falls back to host and guest when role assignments are absent', () => {
    expect(getOnlineVersusRoleAssignments(null, 'host-session', 'guest-session')).toEqual({
      xSessionId: 'host-session',
      oSessionId: 'guest-session',
    })
  })

  it('distinguishes a role-assignment-only state from a full snapshot', () => {
    const state: VersusRoom['state_data'] = {
      roleAssignments: {
        xSessionId: 'session-x',
        oSessionId: 'session-o',
      },
    }

    expect(isOnlineVersusSnapshot(state)).toBe(false)
    expect(getOnlineVersusSnapshotRoleAssignments(state)).toEqual({
      xSessionId: 'session-x',
      oSessionId: 'session-o',
    })
  })
})
