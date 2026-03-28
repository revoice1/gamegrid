import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { VersusSetupModal, type VersusCategoryFilters } from '@/components/game/versus-setup-modal'
import { CURATED_VERSUS_CATEGORY_FAMILIES } from '@/lib/versus-category-options'

const companyFamily = CURATED_VERSUS_CATEGORY_FAMILIES.find((family) => family.key === 'company')

if (!companyFamily) {
  throw new Error('Missing company family for versus setup modal tests.')
}

function renderModal(options?: {
  filters?: VersusCategoryFilters
  stealRule?: 'off' | 'lower' | 'higher'
  objectionRule?: 'off' | 'one' | 'three'
  timerOption?: 'none' | 20 | 60 | 120 | 300
  disableDraws?: boolean
}) {
  return render(
    <VersusSetupModal
      isOpen
      onClose={() => {}}
      mode="versus"
      filters={options?.filters ?? {}}
      stealRule={options?.stealRule ?? 'lower'}
      timerOption={options?.timerOption ?? 'none'}
      disableDraws={options?.disableDraws ?? false}
      objectionRule={options?.objectionRule ?? 'off'}
      onApply={() => {}}
    />
  )
}

describe('VersusSetupModal', () => {
  it('shows Check All for families that default some fun categories off', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByRole('button', { name: /Categories/i }))
    await user.click(screen.getByRole('button', { name: /Companies/i }))

    const companiesHeading = screen.getByText('Companies')
    const companiesSection = companiesHeading.closest('section')

    expect(companiesSection).not.toBeNull()
    expect(within(companiesSection!).getByText('10 of 16 enabled')).toBeInTheDocument()
    expect(within(companiesSection!).getByRole('button', { name: 'Check All' })).toBeInTheDocument()
  })

  it('marks Rules as custom when any versus rule differs from the defaults', async () => {
    const user = userEvent.setup()
    renderModal({
      stealRule: 'off',
      objectionRule: 'one',
      timerOption: 60,
      disableDraws: true,
    })

    await user.click(screen.getByRole('button', { name: /Rules/i }))

    expect(screen.getByText('Custom')).toBeInTheDocument()
  })

  it('marks Categories as custom when a family differs from its default selection even if all are enabled', async () => {
    const user = userEvent.setup()
    renderModal({
      filters: {
        company: companyFamily.categories.map((category) => category.id),
      },
    })

    await user.click(screen.getByRole('button', { name: /Categories/i }))
    await user.click(screen.getByRole('button', { name: /Companies/i }))

    const companiesHeading = screen.getByText('Companies')
    const companiesSection = companiesHeading.closest('section')

    expect(screen.getByText('Custom')).toBeInTheDocument()
    expect(companiesSection).not.toBeNull()
    expect(within(companiesSection!).getByText('All 16 enabled')).toBeInTheDocument()
    expect(
      within(companiesSection!).queryByRole('button', { name: 'Check All' })
    ).not.toBeInTheDocument()
  })
})
