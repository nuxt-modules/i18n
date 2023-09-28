import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from '../utils'
import { getText } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/browser_language_detection/cookie`, import.meta.url)),
  browser: true,
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

test('detection with cookie', async () => {
  const home = url('/')
  const page = await createPage(undefined, { locale: 'en' })
  await page.goto(home)
  const ctx = await page.context()
  // click `fr` lang switch link
  await page.locator('#set-locale-link-fr').click()
  expect(await ctx.cookies()).toMatchObject([
    { name: 'my_custom_cookie_name', value: 'fr', secure: true, sameSite: 'None' }
  ])

  // navigate to about
  await page.goto(url('/about'))
  // detect locale from persisted cookie
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')
  // navigate with home link
  await page.locator('#link-home').click()

  // locale in home
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')

  // click `fr` lang switch link
  await page.locator('#set-locale-link-en').click()
  expect(await ctx.cookies()).toMatchObject([{ name: 'my_custom_cookie_name', value: 'en' }])
})
