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
      strategy: 'no_prefix',
      detectBrowserLanguage: {
        useCookie: false
      }
    }
  }
})

test('detection with browser', async () => {
  const home = url('/')
  const page = await createPage(undefined, { locale: 'fr' }) // set browser locale
  await page.goto(home)

  // detect locale from navigator language
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')

  // click `en` lang switch link
  await page.locator('#set-locale-link-en').click()
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('en')

  // navigate to blog/article
  await page.goto(url('/blog/article'))

  // locale in blog/article
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')

  // navigate with home
  await page.goto(url('/'))

  // locale in home
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')

  // click `en` lang switch link
  await page.locator('#set-locale-link-en').click()
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('en')
})
