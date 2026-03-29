export type VersusEventPlayer = 'x' | 'o'

export type VersusEventRecord =
  | {
      type: 'claim'
      player: VersusEventPlayer
      cellIndex: number
      gameName: string
      viaObjection: boolean
    }
  | {
      type: 'objection'
      player: VersusEventPlayer
      cellIndex: number
      gameName: string
      verdict: 'sustained' | 'overruled'
      onSteal: boolean
    }
  | {
      type: 'steal'
      player: VersusEventPlayer
      cellIndex: number
      gameName: string
      successful: boolean
      viaObjection: boolean
      hadShowdownScores: boolean
      finalSteal: boolean
      attackingScore: number | null
      defendingGameName: string | null
      defendingScore: number | null
    }

export interface VersusEventSummary {
  claims: number
  correctedClaims: number
  objections: number
  sustainedObjections: number
  overruledObjections: number
  stealAttempts: number
  successfulSteals: number
  failedSteals: number
  finalStealAttempts: number
  showdownReveals: number
}

export function buildVersusEventSummary(eventLog: VersusEventRecord[]): VersusEventSummary {
  return eventLog.reduce<VersusEventSummary>(
    (summary, event) => {
      if (event.type === 'claim') {
        summary.claims += 1
        if (event.viaObjection) {
          summary.correctedClaims += 1
        }
        return summary
      }

      if (event.type === 'objection') {
        summary.objections += 1
        if (event.verdict === 'sustained') {
          summary.sustainedObjections += 1
        } else {
          summary.overruledObjections += 1
        }
        return summary
      }

      summary.stealAttempts += 1
      if (event.successful) {
        summary.successfulSteals += 1
      } else {
        summary.failedSteals += 1
      }
      if (event.finalSteal) {
        summary.finalStealAttempts += 1
      }
      if (event.hadShowdownScores) {
        summary.showdownReveals += 1
      }
      return summary
    },
    {
      claims: 0,
      correctedClaims: 0,
      objections: 0,
      sustainedObjections: 0,
      overruledObjections: 0,
      stealAttempts: 0,
      successfulSteals: 0,
      failedSteals: 0,
      finalStealAttempts: 0,
      showdownReveals: 0,
    }
  )
}
