import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from '../../utils'
import { getText } from '../../helper'

await setup({
  rootDir: fileURLToPath(
    new URL(`../../fixtures/browser_language_detection/always_redirect/prefix_and_default_all`, import.meta.url)
  ),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      strategy: 'prefix_and_default',
      detectBrowserLanguage: {
        alwaysRedirect: true,
        redirectOn: 'all'
      }
    }
  }
})

test('alwaysRedirect: all', async () => {
  const blog = url('/blog/article')
  const page = await createPage(undefined, { locale: 'en' }) // set browser locale
  await page.goto(blog)

  // detect locale from navigator language
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('en')

  // click `fr` lang switch link
  await page.locator('#set-locale-link-fr').click()
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')

  // go to `en` home page
  await page.goto(blog)
  expect(page.url().endsWith('/fr/blog/article'))
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')
})
