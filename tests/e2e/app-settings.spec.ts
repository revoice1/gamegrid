import { expect, test } from '@playwright/test'
import {
  fakePuzzle,
  openSettings,
  resetStorage,
  seedDailyPuzzle,
  seedStorageValue,
} from './test-helpers'

test('home loads and settings can open', async ({ page }) => {
  await resetStorage(page)
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'GameGrid' })).toBeVisible()

  await page.getByRole('button', { name: 'Open settings' }).click()

  await expect(page.getByText('Settings')).toBeVisible()
  await expect(page.getByText('Confirm Picks')).toBeVisible()
  await expect(page.getByText('Theme')).toBeVisible()
})

test('confirm picks setting persists after reload', async ({ page }) => {
  await resetStorage(page)
  await page.goto('/')

  await page.getByRole('button', { name: 'Open settings' }).click()

  await expect
    .poll(async () => {
      return page.evaluate(() => window.localStorage.getItem('gamegrid_search_confirm'))
    })
    .toBe(null)

  await page.reload()
  await page.getByRole('button', { name: 'Open settings' }).click()

  await expect
    .poll(async () => {
      return page.evaluate(() => window.localStorage.getItem('gamegrid_search_confirm'))
    })
    .toBe(null)
  await expect(page.getByText('Ask before submitting')).toBeVisible()
  await expect
    .poll(async () => {
      return page
        .getByRole('button', { name: /search confirmation/i })
        .first()
        .getAttribute('aria-label')
    })
    .toBe('Turn off search confirmation')
})

test('animations setting persists and disables root animation mode', async ({ page }) => {
  await resetStorage(page)
  await page.goto('/')

  await openSettings(page)
  await expect(page.getByText('Animations')).toBeVisible()
  await expect(page.getByText('Show effects and pulses')).toBeVisible()

  await page.getByRole('button', { name: 'Turn off animations' }).click()

  await expect
    .poll(async () => {
      return page.evaluate(() => window.localStorage.getItem('gamegrid_animations'))
    })
    .toBe('false')
  await expect
    .poll(async () => {
      return page.evaluate(() => document.documentElement.dataset.gamegridAnimations)
    })
    .toBe('off')
})

test('versus alarms setting only appears in versus settings', async ({ page }) => {
  await resetStorage(page)
  await page.goto('/')

  await openSettings(page)
  await expect(page.getByText('Versus Alarms')).toHaveCount(0)

  await page.getByRole('button', { name: 'Open settings' }).click()
  await page.getByRole('button', { name: 'Versus' }).click()
  await expect(page.getByText('Versus Mode')).toBeVisible()

  await openSettings(page)
  await expect(page.getByText('Versus Alarms')).toBeVisible()
  await expect(page.getByText('Show timer and threat alarms')).toBeVisible()
})

test('turning versus alarms off changes the board alarm pill to off', async ({ page }) => {
  await resetStorage(page)
  await seedStorageValue(page, 'gamegrid_versus_state', {
    puzzleId: 'versus-alarm-toggle',
    puzzle: { ...fakePuzzle, id: 'versus-alarm-toggle', is_daily: false, date: null },
    guesses: [
      { gameId: 1, gameName: 'X1', gameImage: null, isCorrect: true, owner: 'x' },
      { gameId: 2, gameName: 'X2', gameImage: null, isCorrect: true, owner: 'x' },
      { gameId: 3, gameName: 'O3', gameImage: null, isCorrect: true, owner: 'o' },
      ...Array(6).fill(null),
    ],
    guessesRemaining: 9,
    isComplete: false,
    currentPlayer: 'x',
    stealableCell: 2,
    winner: null,
    pendingFinalSteal: null,
    versusCategoryFilters: {},
    versusStealRule: 'lower',
    versusTimerOption: 'none',
    turnTimeLeft: null,
  })

  await page.goto('/')
  await page.getByRole('button', { name: 'Versus' }).click()

  await openSettings(page)
  await page.getByRole('button', { name: 'Turn off versus alarms' }).click()
  await page.getByRole('button', { name: 'Open settings' }).click()

  await expect(page.getByTitle('Versus alarms are disabled in settings')).toContainText('OFF')
})

test('reduced motion mode still supports the animation hooks', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await seedDailyPuzzle(page)
  await page.goto('/')

  await expect
    .poll(async () => {
      return page.evaluate(() => Boolean(window.__gameGridDev))
    })
    .toBe(true)

  await page.evaluate(() => {
    window.__gameGridDev?.triggerPerfectCelebration()
  })
  await expect(page.getByTestId('perfect-grid-celebration')).toBeVisible()

  await page.evaluate(() => {
    window.__gameGridDev?.triggerStealShowdown({
      successful: true,
      attackerScore: 72,
      defenderScore: 85,
    })
  })
  await expect(page.getByTestId('steal-showdown-overlay')).toBeVisible()
})
