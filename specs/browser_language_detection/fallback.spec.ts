import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup } from '../utils'
import { getText, renderPage } from '../helper'

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
  const { page } = await renderPage('/', { locale: 'ja' })

  // detect fallback locale with navigator language
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')
})
