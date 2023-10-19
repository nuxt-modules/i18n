import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup } from '../utils'
import { getText, gotoPath, renderPage } from '../helper'

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
  const { page } = await renderPage('/blog/article', { locale: 'fr' })

  // detect locale from navigator language
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')

  // click `en` lang switch link
  await page.locator('#set-locale-link-en').click()
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('en')

  // navigate to home
  await gotoPath(page, '/')
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('en')
})
