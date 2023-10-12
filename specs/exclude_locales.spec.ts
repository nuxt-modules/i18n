import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from './utils'
import { getText } from './helper'

await setup({
  rootDir: fileURLToPath(new URL(`./fixtures/locale_codes`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      bundle: {
        onlyLocales: 'en'
      }
    }
  }
})

test('leave only English locale', async () => {
  const home = url('/')
  const page = await createPage()
  await page.goto(home)

  const locales = await page.locator('li')

  expect(await locales.count()).toEqual(1)
  expect(await getText(page, 'li')).toMatch('en')
})
