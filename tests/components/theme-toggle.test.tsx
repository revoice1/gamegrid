import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeToggle } from '@/components/theme-toggle'

vi.mock('next-themes', () => ({
  useTheme: () => ({
    resolvedTheme: 'dark',
    setTheme: vi.fn(),
  }),
}))

describe('ThemeToggle', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('shows changelog and feedback links in the settings panel', () => {
    render(<ThemeToggle />)

    fireEvent.click(screen.getByRole('button', { name: 'Open settings' }))

    expect(screen.getByText('Feedback')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Changelog' })).toHaveAttribute('href', '/changelog')
    expect(screen.getByRole('link', { name: 'Report Bug' })).toHaveAttribute(
      'href',
      expect.stringContaining('bug_report.yml')
    )
    expect(screen.getByRole('link', { name: 'Request Feature' })).toHaveAttribute(
      'href',
      expect.stringContaining('feature_request.yml')
    )
  })
})
