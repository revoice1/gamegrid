import { expect, test } from '@playwright/test'
import { EASTER_EGGS } from '@/lib/easter-eggs'
import { seedDailyPuzzle, setTheme } from './test-helpers'

test('dev hooks can trigger animation overlays for visual and perf passes', async ({ page }) => {
  await seedDailyPuzzle(page)
  await page.goto('/')
  await expect
    .poll(async () => {
      return page.evaluate(() => Boolean(window.__gameGridDev))
    })
    .toBe(true)

  await page.evaluate(() => {
    window.__gameGridDev?.triggerEasterEgg(986)
  })
  await expect(page.getByTestId('easter-egg-celebration')).toBeVisible()

  await page.evaluate(() => {
    window.__gameGridDev?.triggerPerfectCelebration()
  })
  await expect(page.getByTestId('perfect-grid-celebration')).toBeVisible()

  await page.evaluate(() => {
    window.__gameGridDev?.triggerStealShowdown({
      successful: false,
      attackerScore: 77,
      defenderScore: 81,
    })
  })
  await expect(page.getByTestId('steal-showdown-overlay')).toBeVisible()

  await page.evaluate(() => {
    window.__gameGridDev?.triggerStealMiss()
  })
  await expect(page.getByTestId('steal-miss-splash')).toBeVisible()
})

test('animation matrix cycles through easter eggs and showdown states', async ({ page }) => {
  await seedDailyPuzzle(page)
  await page.goto('/')

  await expect
    .poll(async () => {
      return page.evaluate(() => Boolean(window.__gameGridDev))
    })
    .toBe(true)

  for (const theme of ['light', 'dark'] as const) {
    await setTheme(page, theme)

    for (const easterEgg of EASTER_EGGS) {
      const triggerGameId = easterEgg.triggerGameIds[0]

      const triggered = await page.evaluate((gameId) => {
        return window.__gameGridDev?.triggerEasterEgg(gameId) ?? false
      }, triggerGameId)

      expect(triggered).toBe(true)
      await expect(page.getByTestId('easter-egg-celebration')).toBeVisible()
      await page.waitForTimeout(180)
    }

    await page.evaluate(() => {
      window.__gameGridDev?.triggerPerfectCelebration()
    })
    await expect(page.getByTestId('perfect-grid-celebration')).toBeVisible()
    await page.waitForTimeout(220)

    await page.evaluate(() => {
      window.__gameGridDev?.triggerStealShowdown({
        successful: true,
        attackerScore: 71,
        defenderScore: 84,
      })
    })
    await expect(page.getByTestId('steal-showdown-overlay')).toBeVisible()
    await page.waitForTimeout(250)

    await page.evaluate(() => {
      window.__gameGridDev?.triggerStealShowdown({
        successful: false,
        attackerScore: 88,
        defenderScore: 81,
      })
    })
    await expect(page.getByTestId('steal-showdown-overlay')).toBeVisible()
    await page.waitForTimeout(250)

    await page.evaluate(() => {
      window.__gameGridDev?.triggerStealMiss()
    })
    await expect(page.getByTestId('steal-miss-splash')).toBeVisible()
    await page.waitForTimeout(250)
  }
})
