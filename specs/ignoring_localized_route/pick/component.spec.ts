import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from '../../utils'

await setup({
  rootDir: fileURLToPath(new URL(`../../fixtures/ignore_pick_component`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      defaultLocale: 'en',
      customRoutes: 'page'
    }
  }
})

test('can not access to pick route path', async () => {
  const home = url('/')
  const page = await createPage()
  await page.goto(home)

  // click `fr` switching link
  await page.locator('#lang-switcher-with-nuxt-link a').click()
  await page.waitForTimeout(100)

  // pick href with <NuxtLink>
  expect(await page.locator('#link-ignore-pick').getAttribute('href')).toBe('/fr/ignore-routes/pick')
})
