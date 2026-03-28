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

  it('renders archived boards and selects one when clicked', () => {
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
        ]}
      />
    )

    expect(screen.getByText('2026-03-28')).toBeInTheDocument()
    expect(screen.getByText('Current')).toBeInTheDocument()
    expect(screen.getByText('2026-03-27')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /2026-03-27/i }))
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'daily-2026-03-27',
        date: '2026-03-27',
      })
    )
  })
})
