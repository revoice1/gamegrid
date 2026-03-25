import { expect, type Page } from '@playwright/test'

export const fakePuzzle = {
  id: 'test-puzzle',
  date: new Date().toISOString().slice(0, 10),
  is_daily: true,
  created_at: new Date().toISOString(),
  row_categories: [
    { type: 'genre', id: 'genre-rpg', name: 'RPG' },
    { type: 'genre', id: 'genre-action', name: 'Action' },
    { type: 'genre', id: 'genre-platformer', name: 'Platformer' },
  ],
  col_categories: [
    { type: 'platform', id: 'platform-pc', name: 'PC' },
    { type: 'decade', id: 'decade-2000s', name: '2000s' },
    { type: 'game_mode', id: 'mode-single', name: 'Single player' },
  ],
  cell_metadata: Array.from({ length: 9 }, (_, cellIndex) => ({
    cellIndex,
    validOptionCount: 120 + cellIndex,
    difficulty: 'fair',
    difficultyLabel: 'Fair',
  })),
}

export const fakeSearchResult = {
  id: 101,
  name: 'World of Warcraft',
  slug: 'world-of-warcraft',
  background_image: null,
  released: '2004-11-23',
  metacritic: 93,
  genres: [{ id: 1, name: 'Role-playing (RPG)', slug: 'role-playing-rpg' }],
  platforms: [{ platform: { id: 6, name: 'PC (Microsoft Windows)', slug: 'pc' } }],
}

export async function resetStorage(page: Page) {
  const seededDailyState = {
    puzzleId: fakePuzzle.id,
    puzzle: fakePuzzle,
    guesses: Array(9).fill(null),
    guessesRemaining: 9,
    isComplete: false,
    date: new Date().toISOString().slice(0, 10),
  }

  await page.route('**/api/puzzle-stream?*', async (route) => {
    const url = route.request().url()
    const mode = new URL(url).searchParams.get('mode')

    if (mode !== 'daily') {
      await route.fallback()
      return
    }

    await route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
      body:
        [
          `data: ${JSON.stringify({ type: 'progress', pct: 20, message: 'Preparing daily board...' })}`,
          '',
          `data: ${JSON.stringify({ type: 'puzzle', puzzle: fakePuzzle })}`,
          '',
        ].join('\n') + '\n',
    })
  })

  await page.goto('/')
  await page.evaluate((dailyState) => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    window.localStorage.setItem('gamegrid_daily_state', JSON.stringify(dailyState))
  }, seededDailyState)
  await page.reload()
}

export async function seedDailyPuzzle(page: Page) {
  const payload = {
    puzzleId: fakePuzzle.id,
    puzzle: fakePuzzle,
    guesses: Array(9).fill(null),
    guessesRemaining: 9,
    isComplete: false,
    date: new Date().toISOString().slice(0, 10),
  }

  await page.addInitScript((state) => {
    window.localStorage.setItem('gamegrid_daily_state', JSON.stringify(state))
  }, payload)
}

export async function seedAchievements(page: Page, achievementIds: string[]) {
  await page.addInitScript((ids) => {
    window.localStorage.setItem('gamegrid_achievements', JSON.stringify(ids))
  }, achievementIds)
}

export async function seedStorageValue(page: Page, key: string, value: unknown) {
  await page.addInitScript(
    ([storageKey, storageValue]) => {
      window.localStorage.setItem(storageKey, JSON.stringify(storageValue))
    },
    [key, value] as const
  )
}

export async function seedSessionValue(page: Page, key: string, value: unknown) {
  await page.addInitScript(
    ([storageKey, storageValue]) => {
      window.sessionStorage.setItem(storageKey, JSON.stringify(storageValue))
    },
    [key, value] as const
  )
}

export function buildCompletedGuesses() {
  return Array.from({ length: 9 }, (_, index) => ({
    gameId: index + 1,
    gameName: `Game ${index + 1}`,
    gameImage: null,
    isCorrect: true,
  }))
}

export async function openSettings(page: Page) {
  await page.getByRole('button', { name: 'Open settings' }).click()
  await expect(page.getByText('Settings')).toBeVisible()
}

export async function setTheme(page: Page, theme: 'light' | 'dark') {
  await openSettings(page)

  const switchToThemeLabel = theme === 'light' ? 'Switch to light mode' : 'Switch to dark mode'
  const oppositeThemeLabel = theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'

  const themeToggle = page.getByRole('button', { name: switchToThemeLabel })
  if (await themeToggle.isVisible().catch(() => false)) {
    await themeToggle.click()
  }

  await expect(page.getByRole('button', { name: oppositeThemeLabel })).toBeVisible()
  await expect
    .poll(async () => {
      return page.evaluate(() => document.documentElement.classList.contains('light'))
    })
    .toBe(theme === 'light')

  await page.getByRole('button', { name: 'Open settings' }).click()
}

export async function mockPuzzleStream(page: Page, puzzle: typeof fakePuzzle) {
  await page.route('**/api/puzzle-stream?*', async (route) => {
    const url = route.request().url()
    const mode = new URL(url).searchParams.get('mode')

    if (mode !== 'daily' && mode !== 'practice' && mode !== 'versus') {
      await route.fallback()
      return
    }

    await route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
      body:
        [
          `data: ${JSON.stringify({ type: 'progress', pct: 20, message: `Preparing ${mode} board...` })}`,
          '',
          `data: ${JSON.stringify({ type: 'puzzle', puzzle: { ...puzzle, id: `${mode}-puzzle`, is_daily: mode === 'daily', date: mode === 'daily' ? puzzle.date : null } })}`,
          '',
        ].join('\n') + '\n',
    })
  })
}
