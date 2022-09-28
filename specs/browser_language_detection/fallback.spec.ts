import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from '@nuxt/test-utils'
import { getText } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/basic`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      strategy: 'no_prefix',
      defaultLocale: 'en',
      detectBrowserLanguage: {
        useCookie: false,
        fallbackLocale: 'fr'
      }
    }
  }
})

test('fallback', async () => {
  const home = url('/')
  const page = await createPage(undefined, { locale: 'ja' }) // set browser locale
  await page.goto(home)

  // detect fallback locale with navigator language
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')
})
