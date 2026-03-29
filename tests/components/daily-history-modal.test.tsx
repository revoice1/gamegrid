import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DailyHistoryModal } from '@/components/game/daily-history-modal'

describe('DailyHistoryModal', () => {
  it('shows an empty state when there are no archived boards yet', () => {
    render(
      <DailyHistoryModal
        isOpen
        onClose={() => {}}
        entries={[]}
        onSelect={() => {}}
        isLoading={false}
      />
    )

    expect(screen.getByText('Daily Archive')).toBeInTheDocument()
    expect(screen.getByText('No archived dailies yet.')).toBeInTheDocument()
  })

  it('renders archived boards in a calendar and selects one when clicked', () => {
    const onSelect = vi.fn()

    render(
      <DailyHistoryModal
        isOpen
        onClose={() => {}}
        onSelect={onSelect}
        currentDate="2026-03-28"
        entries={[
          {
            id: 'daily-2026-03-28',
            date: '2026-03-28',
          },
          {
            id: 'daily-2026-03-27',
            date: '2026-03-27',
            isCompleted: true,
            guessCount: 9,
          },
          {
            id: 'daily-2026-03-26',
            date: '2026-03-26',
            guessCount: 3,
          },
          {
            id: 'daily-2026-02-14',
            date: '2026-02-14',
          },
        ]}
      />
    )

    expect(screen.getByText('March 2026')).toBeInTheDocument()
    expect(screen.getByText('February 2026')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('In Progress')).toBeInTheDocument()
    expect(screen.getByText('Not Started')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Open marks the board you have loaded right now. Today marks the real current daily.'
    )
    expect(screen.getByRole('button', { name: '2026-03-28, Current board' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2026-03-27, Completed' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2026-03-26, In progress' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2026-02-14, Not started' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '2026-03-27, Completed' }))
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'daily-2026-03-27',
        date: '2026-03-27',
      })
    )
  })
})
