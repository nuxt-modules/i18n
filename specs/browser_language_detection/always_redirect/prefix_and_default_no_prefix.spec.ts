import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from '@nuxt/test-utils'
import { getText } from '../../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../../fixtures/fallback`, import.meta.url)),
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
  const blog = url('/about')
  const page = await createPage(undefined, { locale: 'en' }) // set browser locale
  await page.goto(blog)

  // detect locale from navigator language
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('en')

  // click `fr` lang switch link
  await page.locator('#set-locale-link-fr').click()
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')

  // go to `en` home page
  await page.goto(url('/ja/about'))
  expect(page.url().endsWith('/ja/about'))
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('ja')

  await page.goto(url('/about'))
  expect(page.url().endsWith('/ja/about'))
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('ja')
})
