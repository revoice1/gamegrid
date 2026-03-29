import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { VersusSummaryPanel } from '@/components/game/versus-summary-panel'
import type { CellGuess } from '@/lib/types'
import type { VersusEventRecord } from '@/lib/versus-events'

function makeGuess(owner: 'x' | 'o', overrides?: Partial<CellGuess>): CellGuess {
  return {
    gameId: Math.floor(Math.random() * 1000),
    gameName: `${owner.toUpperCase()} Game`,
    gameImage: null,
    isCorrect: true,
    owner,
    ...overrides,
  }
}

describe('VersusSummaryPanel', () => {
  it('summarizes a line win with rules and recap stats', () => {
    const eventLog: VersusEventRecord[] = [
      { type: 'claim', player: 'x', cellIndex: 0, gameName: 'X Game', viaObjection: false },
      { type: 'claim', player: 'x', cellIndex: 1, gameName: 'X Game', viaObjection: false },
      {
        type: 'objection',
        player: 'x',
        cellIndex: 1,
        gameName: 'X Game',
        verdict: 'sustained',
        onSteal: false,
      },
      { type: 'claim', player: 'x', cellIndex: 2, gameName: 'X Game', viaObjection: true },
      {
        type: 'steal',
        player: 'o',
        cellIndex: 3,
        gameName: 'O Game',
        successful: false,
        viaObjection: false,
        hadShowdownScores: true,
        finalSteal: false,
        attackingScore: 74,
        defendingGameName: 'X Defense',
        defendingScore: 81,
      },
      {
        type: 'objection',
        player: 'o',
        cellIndex: 3,
        gameName: 'O Game',
        verdict: 'overruled',
        onSteal: true,
      },
    ]

    render(
      <VersusSummaryPanel
        guesses={[
          makeGuess('x'),
          makeGuess('x', {
            objectionUsed: true,
            objectionVerdict: 'sustained',
          }),
          makeGuess('x'),
          makeGuess('o', {
            objectionUsed: true,
            objectionVerdict: 'overruled',
            showdownScoreRevealed: true,
          }),
          makeGuess('o'),
          null,
          null,
          null,
          null,
        ]}
        eventLog={eventLog}
        winner="x"
        stealRule="lower"
        timerOption={300}
        disableDraws={true}
        objectionRule="one"
        objectionsUsed={{ x: 1, o: 1 }}
      />
    )

    expect(screen.getByText('Match Summary')).toBeInTheDocument()
    expect(screen.getByText('X wins')).toBeInTheDocument()
    expect(screen.getByText('X closed out top row.')).toBeInTheDocument()
    expect(screen.getByText('Steals: Lower score')).toBeInTheDocument()
    expect(screen.getByText('Objections: 1 each')).toBeInTheDocument()
    expect(screen.getByText('Draws: Disabled')).toBeInTheDocument()
    expect(screen.getByText('Timer: 5 min')).toBeInTheDocument()
    expect(screen.getByText('Reviewed')).toBeInTheDocument()
    expect(screen.getByText('Score Reveals')).toBeInTheDocument()
    expect(screen.getByText('Steal attempts: 1')).toBeInTheDocument()
    expect(screen.getByText('Successful steals: 0')).toBeInTheDocument()
    expect(screen.getByText('Failed steals: 1')).toBeInTheDocument()
    expect(screen.getByText('Sustained: 1')).toBeInTheDocument()
    expect(screen.getByText('Overruled: 1')).toBeInTheDocument()
    expect(screen.getByText('All Picks')).toBeInTheDocument()
    expect(screen.getByText(/Cell 2 · Score No score · Sustained/i)).toBeInTheDocument()
    expect(screen.getByText(/Cell 4 · Score No score · Overruled · Revealed/i)).toBeInTheDocument()
  })

  it('summarizes a claim-count win when no line exists', () => {
    render(
      <VersusSummaryPanel
        guesses={[
          makeGuess('x'),
          makeGuess('o'),
          makeGuess('x'),
          makeGuess('x'),
          makeGuess('o'),
          makeGuess('o'),
          makeGuess('o'),
          makeGuess('x'),
          makeGuess('x'),
        ]}
        eventLog={[]}
        winner="x"
        stealRule="off"
        timerOption="none"
        disableDraws={true}
        objectionRule="off"
        objectionsUsed={{ x: 0, o: 0 }}
      />
    )

    expect(screen.getByText('X won on claimed cells, 5 to 4.')).toBeInTheDocument()
    expect(
      screen.getByText('No line was completed, so claimed cells decided the match.')
    ).toBeInTheDocument()
    expect(screen.getByText('Steals: Off')).toBeInTheDocument()
    expect(screen.getByText('Objections: Off')).toBeInTheDocument()
    expect(screen.getByText('Timer: Off')).toBeInTheDocument()
  })
})
