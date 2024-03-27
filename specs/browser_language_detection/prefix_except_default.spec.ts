import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url } from '../utils'
import { getText, renderPage, startServerWithRuntimeConfig } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/basic`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      strategy: 'prefix_except_default',
      detectBrowserLanguage: {
        useCookie: true,
        redirectOn: 'root',
        alwaysRedirect: true
      }
    }
  }
})

test('(#2262) redirect with browser cookie with `alwaysRedirect: true`', async () => {
  const restore = await startServerWithRuntimeConfig({
    public: {
      i18n: {
        detectBrowserLanguage: {
          useCookie: true,
          redirectOn: 'root',
          alwaysRedirect: true
        }
      }
    }
  })
  const { page } = await renderPage('/', { locale: 'en' })
  const ctx = page.context()

  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('en')
  expect(await ctx.cookies()).toMatchObject([{ name: 'i18n_redirected', value: 'en' }])

  // change to `fr`
  await page.locator('#nuxt-locale-link-fr').click()
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')
  expect(await ctx.cookies()).toMatchObject([{ name: 'i18n_redirected', value: 'fr' }])

  // direct access to root `/`
  await page.goto(url('/'))
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')
  expect(page.url().endsWith('/fr'))

  // change to `en`
  await page.locator('#nuxt-locale-link-en').click()
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('en')
  expect(await ctx.cookies()).toMatchObject([{ name: 'i18n_redirected', value: 'en' }])

  await restore()
})
