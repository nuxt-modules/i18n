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
      strategy: 'no_prefix',
      detectBrowserLanguage: false
    }
  }
})

test('disable', async () => {
  const { page } = await renderPage('/', { locale: 'en' })
  const ctx = await page.context()

  // click `fr` lang switch link
  await page.locator('#set-locale-link-fr').click()
  expect(await ctx.cookies()).toMatchObject([])

  // navigate to about
  await gotoPath(page, '/about')

  // set default locale
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('en')

  // click `fr` lang switch link
  await page.locator('#set-locale-link-fr').click()

  // navigate with home link
  await page.locator('#link-home').click()

  // set default locale
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')
})
