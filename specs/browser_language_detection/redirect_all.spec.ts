import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from '../utils'
import { getText } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/basic`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      strategy: 'prefix_except_default',
      detectBrowserLanguage: {
        redirectOn: 'all'
      }
    }
  }
})

test('redirectOn: all', async () => {
  const blog = url('/blog/article')
  const page = await createPage(undefined, { locale: 'fr' }) // set browser locale
  await page.goto(blog)

  // detect locale from navigator language
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')

  // click `en` lang switch link
  await page.locator('#set-locale-link-en').click()
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('en')

  // navigate to home
  await page.goto(url('/'))
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('en')
})
