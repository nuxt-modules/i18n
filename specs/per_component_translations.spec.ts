import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from './utils'
import { getText, waitForTransition } from './helper'

await setup({
  rootDir: fileURLToPath(new URL(`./fixtures/component`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      defaultLocale: 'en'
    }
  }
})

test('i18n custom block', async () => {
  const home = url('/')
  const page = await createPage()
  await page.goto(home)

  // click `fr` lang switch with `<NuxtLink>`
  await page.locator('#lang-switcher-with-nuxt-link a').click()
  await waitForTransition(page)

  // go to category page
  await page.locator('#link-category').click()
  await waitForTransition(page)

  expect(await getText(page, '#per-component-hello')).toMatch('Bonjour!')

  // click `en` lang switch with `<NuxtLink>`
  await page.locator('#lang-switcher-with-nuxt-link a').click()
  await waitForTransition(page)

  expect(await getText(page, '#per-component-hello')).toMatch('Hello!')
})
