import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GridCell } from '@/components/game/grid-cell'
import type { CellGuess } from '@/lib/types'

function buildGuess(overrides?: Partial<CellGuess>): CellGuess {
  return {
    gameId: 1,
    gameName: 'Test Game',
    gameImage: null,
    isCorrect: true,
    stealRating: 88,
    stealRatingCount: 4321,
    showdownScoreRevealed: true,
    ...overrides,
  }
}

describe('GridCell showdown badge', () => {
  it('shows review count for revealed showdown values when the reviews rule is active', () => {
    render(
      <GridCell
        index={0}
        guess={buildGuess()}
        isSelected={false}
        isDisabled={false}
        stealRule="fewer_reviews"
        onClick={() => {}}
      />
    )

    expect(screen.getByText('4321')).toBeInTheDocument()
    expect(screen.queryByText('88')).not.toBeInTheDocument()
  })

  it('shows rating score for revealed showdown values when rating rules are active', () => {
    render(
      <GridCell
        index={0}
        guess={buildGuess()}
        isSelected={false}
        isDisabled={false}
        stealRule="higher"
        onClick={() => {}}
      />
    )

    expect(screen.getByText('88')).toBeInTheDocument()
    expect(screen.queryByText('4321')).not.toBeInTheDocument()
  })
})
