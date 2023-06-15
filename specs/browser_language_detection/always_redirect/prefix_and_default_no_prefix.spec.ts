import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from '../../utils'
import { getText } from '../../helper'

await setup({
  rootDir: fileURLToPath(
    new URL(`../../fixtures/browser_language_detection/always_redirect/prefix_and_default_no_prefix`, import.meta.url)
  ),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      strategy: 'prefix_and_default',
      detectBrowserLanguage: {
        alwaysRedirect: true,
        redirectOn: 'no prefix'
      }
    }
  }
})

test('alwaysRedirect: no prefix', async () => {
  const page = await createPage(undefined, { locale: 'en' }) // set browser locale
  await page.goto(url('/about'))

  // detect locale from navigator language
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('en')

  // click `fr` lang switch with nutlink
  await page.locator('#set-locale-link-fr').click()
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')

  // go to `blog/article` page
  await page.goto(url('/blog/article'))
  expect(page.url().endsWith('/fr/about'))
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')

  // go to `/about` page
  await page.goto(url('/about'))
  expect(page.url().endsWith('/fr/about'))
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')
})
