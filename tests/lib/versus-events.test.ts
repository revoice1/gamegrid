import { describe, expect, it } from 'vitest'
import { buildVersusEventSummary, type VersusEventRecord } from '@/lib/versus-events'

describe('buildVersusEventSummary', () => {
  it('counts claims, objections, steals, and showdown reveals from the event log', () => {
    const eventLog: VersusEventRecord[] = [
      { type: 'claim', player: 'x', cellIndex: 0, gameName: 'Alpha', viaObjection: false },
      { type: 'claim', player: 'o', cellIndex: 1, gameName: 'Bravo', viaObjection: true },
      {
        type: 'objection',
        player: 'o',
        cellIndex: 1,
        gameName: 'Bravo',
        verdict: 'sustained',
        onSteal: false,
      },
      {
        type: 'steal',
        player: 'x',
        cellIndex: 1,
        gameName: 'Charlie',
        successful: true,
        viaObjection: false,
        hadShowdownScores: true,
        finalSteal: false,
        attackingScore: 88,
        defendingGameName: 'Bravo',
        defendingScore: 81,
      },
      {
        type: 'steal',
        player: 'o',
        cellIndex: 2,
        gameName: 'Delta',
        successful: false,
        viaObjection: true,
        hadShowdownScores: false,
        finalSteal: true,
        attackingScore: null,
        defendingGameName: 'Echo',
        defendingScore: null,
      },
      {
        type: 'objection',
        player: 'o',
        cellIndex: 2,
        gameName: 'Delta',
        verdict: 'overruled',
        onSteal: true,
      },
    ]

    expect(buildVersusEventSummary(eventLog)).toEqual({
      claims: 2,
      correctedClaims: 1,
      objections: 2,
      sustainedObjections: 1,
      overruledObjections: 1,
      stealAttempts: 2,
      successfulSteals: 1,
      failedSteals: 1,
      finalStealAttempts: 1,
      showdownReveals: 1,
    })
  })
})
