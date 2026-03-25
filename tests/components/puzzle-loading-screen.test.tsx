import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PuzzleLoadingScreen } from '@/components/game/puzzle-loading-screen'
import type { LoadingAttempt } from '@/components/game/loading-helpers'

const loadingAttempts: LoadingAttempt[] = [
  {
    attempt: 1,
    rows: ['RPG', 'Horror', 'PS1'],
    cols: ['Sony', 'Action', '1990s'],
    intersections: [
      {
        label: 'RPG x Sony',
        status: 'failed',
        validOptionCount: 0,
      },
    ],
    rejectedMessage: 'Rejected after the first pass.',
  },
  {
    attempt: 2,
    rows: ['Platform', 'Open world', 'NES'],
    cols: ['Capcom', 'Action', '1980s'],
    intersections: [
      {
        label: 'Platform x Capcom',
        status: 'passed',
      },
      {
        label: 'Open world x Action',
        status: 'passed',
        validOptionCount: 27,
      },
      {
        label: 'NES x 1980s',
        status: 'pending',
      },
    ],
  },
]

describe('PuzzleLoadingScreen', () => {
  it('renders daily mode copy without progress chrome', () => {
    render(
      <PuzzleLoadingScreen
        mode="daily"
        loadingStage="Checking cache"
        loadingProgress={5}
        loadingAttempts={[]}
      />
    )

    expect(screen.getByText('Daily Puzzle')).toBeInTheDocument()
    expect(screen.getByText("Checking for today's puzzle...")).toBeInTheDocument()
    expect(screen.queryByText(/% complete/)).not.toBeInTheDocument()
    expect(screen.queryByText('Attempt Notes')).not.toBeInTheDocument()
  })

  it('renders practice attempt notes and shows OK before exact metadata counts arrive', () => {
    render(
      <PuzzleLoadingScreen
        mode="practice"
        loadingStage="Validating intersections"
        loadingProgress={52}
        loadingAttempts={loadingAttempts}
      />
    )

    expect(screen.getByText('Building Grid')).toBeInTheDocument()
    expect(
      screen.getByText('Generating a fresh practice puzzle and sanity-checking each intersection.')
    ).toBeInTheDocument()
    expect(screen.getByText('52% complete')).toBeInTheDocument()
    expect(screen.getByText('Rejected Intersections')).toBeInTheDocument()
    expect(screen.getByText('RPG x Sony (0)')).toBeInTheDocument()
    expect(screen.getByText('Attempt 2')).toBeInTheDocument()
    expect(screen.getByText('Platform x Capcom')).toBeInTheDocument()
    expect(screen.getByText('OK')).toBeInTheDocument()
    expect(screen.getByText('27')).toBeInTheDocument()
    expect(screen.getByText('...')).toBeInTheDocument()
  })

  it('renders versus-specific copy', () => {
    render(
      <PuzzleLoadingScreen
        mode="versus"
        loadingStage="Picking families"
        loadingProgress={18}
        loadingAttempts={[]}
      />
    )

    expect(screen.getByText('Setting Up Match')).toBeInTheDocument()
    expect(
      screen.getByText('Building a local head-to-head board and validating each intersection.')
    ).toBeInTheDocument()
  })
})
