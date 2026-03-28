import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { VersusObjectionModal } from '@/components/game/versus-objection-modal'
import type { Category, CellGuess } from '@/lib/types'

const rowCategory: Category = {
  type: 'perspective',
  id: 'perspective-first-person',
  name: 'First person',
}

const colCategory: Category = {
  type: 'company',
  id: 'company-square-enix',
  name: 'Square Enix',
}

describe('VersusObjectionModal', () => {
  it('shows only review details without full metadata leakage', () => {
    const guess: CellGuess = {
      gameId: 359,
      gameName: 'Final Fantasy XV',
      gameImage: null,
      isCorrect: false,
      matchedRow: false,
      matchedCol: true,
      released: '2016-11-29',
      metacritic: 79,
      gameUrl: 'https://www.igdb.com/games/final-fantasy-xv',
      genres: ['Role-playing (RPG)'],
      platforms: ['PlayStation 4'],
      objectionUsed: false,
      objectionVerdict: null,
      objectionExplanation: null,
    }

    render(
      <VersusObjectionModal
        isOpen
        onClose={() => {}}
        guess={guess}
        rowCategory={rowCategory}
        colCategory={colCategory}
        onObjection={() => {}}
      />
    )

    expect(screen.getByText('Objection')).toBeInTheDocument()
    expect(screen.getByText('First person')).toBeInTheDocument()
    expect(screen.getByText('Square Enix')).toBeInTheDocument()
    expect(screen.queryByText('Metacritic')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /view on igdb/i })).not.toBeInTheDocument()
    expect(screen.queryByText('Platforms')).not.toBeInTheDocument()
    expect(screen.queryByText('Genres')).not.toBeInTheDocument()
  })

  it('shows the locked verdict on the objection button after review', () => {
    const guess: CellGuess = {
      gameId: 359,
      gameName: 'Final Fantasy XV',
      gameImage: null,
      isCorrect: true,
      matchedRow: true,
      matchedCol: true,
      objectionUsed: true,
      objectionVerdict: 'sustained',
      objectionExplanation: 'Royal Edition adds the needed mode.',
      objectionOriginalMatchedRow: false,
      objectionOriginalMatchedCol: true,
    }

    render(
      <VersusObjectionModal
        isOpen
        onClose={() => {}}
        guess={guess}
        rowCategory={rowCategory}
        colCategory={colCategory}
        objectionVerdict="sustained"
        objectionExplanation={guess.objectionExplanation}
        objectionDisabled
      />
    )

    expect(screen.getByRole('button', { name: 'Objection sustained' })).toBeDisabled()
  })

  it('shows objections off when review is unavailable for this match', () => {
    const guess: CellGuess = {
      gameId: 359,
      gameName: 'Final Fantasy XV',
      gameImage: null,
      isCorrect: false,
      matchedRow: false,
      matchedCol: true,
      objectionUsed: false,
      objectionVerdict: null,
      objectionExplanation: null,
    }

    render(
      <VersusObjectionModal
        isOpen
        onClose={() => {}}
        guess={guess}
        rowCategory={rowCategory}
        colCategory={colCategory}
        onObjection={() => {}}
        objectionDisabled
        objectionDisabledLabel="Objections off"
      />
    )

    expect(screen.getByRole('button', { name: 'Objections off' })).toBeDisabled()
  })
})
