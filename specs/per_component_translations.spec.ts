import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from './utils'
import { getText } from './helper'

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
  await page.waitForTimeout(1000)

  // go to category page
  await page.locator('#link-category').click()
  await page.waitForTimeout(1000)

  expect(await getText(page, '#per-component-hello')).toMatch('Bonjour!')

  // click `en` lang switch with `<NuxtLink>`
  await page.locator('#lang-switcher-with-nuxt-link a').click()
  await page.waitForTimeout(1000)

  expect(await getText(page, '#per-component-hello')).toMatch('Hello!')
})
