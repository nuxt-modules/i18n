import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup } from '../utils'
import { getText, gotoPath, renderPage, startServerWithRuntimeConfig } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/basic`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      // debug: true,
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
  await startServerWithRuntimeConfig({
    public: {
      i18n: {
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
  const { page } = await renderPage('/', { locale: 'en' })
  const ctx = await page.context()
  expect(await ctx.cookies()).toMatchObject([
    { name: 'my_custom_cookie_name', value: 'en', secure: true, sameSite: 'None' }
  ])

  // click `fr` lang switch link
  await page.locator('#set-locale-link-fr').click()
  expect(await ctx.cookies()).toMatchObject([
    { name: 'my_custom_cookie_name', value: 'fr', secure: true, sameSite: 'None' }
  ])

  // navigate to about
  await gotoPath(page, '/about')
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

test('detection with cookie - overwrite unknown locale', async () => {
  await startServerWithRuntimeConfig({
    public: {
      i18n: {
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
  const { page } = await renderPage('/', { locale: 'en' })
  const ctx = page.context()
  await page.locator('#set-locale-link-fr').click()

  const localeCookie = (await ctx.cookies()).find(x => x.name === 'my_custom_cookie_name')
  expect([localeCookie]).toMatchObject([{ name: 'my_custom_cookie_name', value: 'fr', secure: true, sameSite: 'None' }])

  // update locale cookie to non-existent locale
  localeCookie!.value = 'unknown_locale'
  await ctx.addCookies([localeCookie!])
  expect(await ctx.cookies()).toMatchObject([
    { name: 'my_custom_cookie_name', value: 'unknown_locale', secure: true, sameSite: 'None' }
  ])

  // unknown locale cookie is overwritten to default locale
  await gotoPath(page, '/')
  expect(await ctx.cookies()).toMatchObject([
    { name: 'my_custom_cookie_name', value: 'en', secure: true, sameSite: 'None' }
  ])
})

// browser
test('detection with browser', async () => {
  await startServerWithRuntimeConfig({
    public: {
      i18n: {
        detectBrowserLanguage: {
          useCookie: false
        }
      }
    }
  })
  const { page } = await renderPage('/', { locale: 'fr' })

  // detect locale from navigator language
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')

  // click `en` lang switch link
  await page.locator('#set-locale-link-en').click()
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('en')

  // navigate to blog/article
  await gotoPath(page, '/blog/article')

  // locale in blog/article
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')

  // navigate with home
  await gotoPath(page, '/')

  // locale in home
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')

  // click `en` lang switch link
  await page.locator('#set-locale-link-en').click()
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('en')
})

// disable
test('disable', async () => {
  await startServerWithRuntimeConfig({
    public: {
      i18n: {
        detectBrowserLanguage: false
      }
    }
  })

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

test('fallback', async () => {
  await startServerWithRuntimeConfig({
    public: {
      i18n: {
        detectBrowserLanguage: {
          useCookie: false,
          fallbackLocale: 'fr'
        }
      }
    }
  })
  const { page } = await renderPage('/', { locale: 'ja' })

  // detect fallback locale with navigator language
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')
})
