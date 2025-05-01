import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url } from '../utils'
import { renderPage, waitForLocaleSwitch } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/basic`, import.meta.url)),
  browser: true,
  prerender: true,
  // overrides
  nuxtConfig: {
    i18n: {
      strategy: 'no_prefix',
      detectBrowserLanguage: {
        useCookie: true,
        cookieKey: 'my_custom_cookie_name',
        redirectOn: 'root',
        cookieCrossOrigin: true,
        cookieSecure: true
      }
    }
  }
})

test('does not reset cookie no refresh', async () => {
  const { page } = await renderPage('/', { locale: 'en' })
  const ctx = await page.context()
  expect(await ctx.cookies()).toMatchObject([
    { name: 'my_custom_cookie_name', value: 'en', secure: true, sameSite: 'None' }
  ])

  // click `fr` lang switch link
  await Promise.all([waitForLocaleSwitch(page), page.locator('#set-locale-link-fr').click()])
  expect(await ctx.cookies()).toMatchObject([
    { name: 'my_custom_cookie_name', value: 'fr', secure: true, sameSite: 'None' }
  ])

  await page.reload()
  await page.waitForURL(url('/'))

  expect(await ctx.cookies()).toMatchObject([
    { name: 'my_custom_cookie_name', value: 'fr', secure: true, sameSite: 'None' }
  ])
})
