import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url } from '../../utils'
import { getText, renderPage } from '../../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../../fixtures/basic`, import.meta.url)),
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
  const blog = '/blog/article'
  const { page } = await renderPage(blog, { locale: 'en' }) // set browser locale

  // detect locale from navigator language
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('en')

  // click `fr` lang switch link
  await page.locator('#set-locale-link-fr').click()
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')

  // go to `en` home page
  await page.goto(url(blog))
  expect(page.url().endsWith('/fr/blog/article'))
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')
})
