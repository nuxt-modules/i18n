import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup } from './utils'
import { renderPage } from './helper'

await setup({
  rootDir: fileURLToPath(new URL(`./fixtures/basic`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      bundle: {
        onlyLocales: 'en'
      },
      detectBrowserLanguage: false
    }
  }
})

test('leave only English locale', async () => {
  const { page } = await renderPage('/')

  const locales = await page.locator('#configured-locales-list li')

  expect(await locales.count()).toEqual(1)
  expect(await page.locator('#configured-locales-list li').innerText()).toMatch('en')
})
