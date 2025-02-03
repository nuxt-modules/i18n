import { describe, test, expect, beforeEach } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, fetch } from '../utils'
import { getText, getData, renderPage, waitForURL, startServerWithRuntimeConfig, gotoPath } from '../helper'

import type { Response } from 'playwright-core'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/basic`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      strategy: 'prefix',
      defaultLocale: 'en',
      // fixture uses `false` which cannot be overwritten using runtimeConfig
      detectBrowserLanguage: {}
    }
  }
})

describe('strategy: prefix', async () => {
  beforeEach(async () => {
    // use original fixture `detectBrowserLanguage` value as default for tests, overwrite here needed
    await startServerWithRuntimeConfig({
      public: {
        i18n: { detectBrowserLanguage: false }
      }
    })
  })

  test.each([
    ['/', '/en'],
    ['/about', '/en/about'],
    ['/category/foo', '/en/category/foo']
  ])('cannot access unprefixed url: %s', async (pathUrl, destination) => {
    const res = await fetch(pathUrl, { redirect: 'manual' })
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe(destination)
  })

  test('can access to prefix locale: /en', async () => {
    const { page } = await renderPage('/en')

    // `en` rendering
    expect(await getText(page, '#home-header')).toEqual('Homepage')
    expect(await getText(page, 'title')).toEqual('Homepage')
    expect(await getText(page, '#link-about')).toEqual('About us')

    // lang switcher rendering
    expect(await getText(page, '#lang-switcher-with-nuxt-link a')).toEqual('Français')
    expect(await getText(page, '#set-locale-link-fr')).toEqual('Français')

    // page path
    expect(await getData(page, '#home-use-async-data')).toMatchObject({ aboutPath: '/en/about' })
    expect(await getText(page, '#route-path')).toEqual('route: /en')
    expect(await page.getAttribute('#lang-switcher-with-nuxt-link a', 'href')).toEqual('/fr')

    // current locale
    expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('en')
  })

  test('can access to prefix locale: /fr', async () => {
    const { page } = await renderPage('/fr')

    // `fr` rendering
    expect(await getText(page, '#home-header')).toEqual('Accueil')
    expect(await getText(page, 'title')).toEqual('Accueil')
    expect(await getText(page, '#link-about')).toEqual('À propos')

    // lang switcher rendering
    expect(await getText(page, '#lang-switcher-with-nuxt-link a')).toEqual('English')
    expect(await getText(page, '#set-locale-link-en')).toEqual('English')

    // page path
    expect(await getData(page, '#home-use-async-data')).toMatchObject({ aboutPath: '/fr/about' })
    expect(await getText(page, '#route-path')).toEqual('route: /fr')
    expect(await page.getAttribute('#lang-switcher-with-nuxt-link a', 'href')).toEqual('/en')

    // current locale
    expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')
  })

  test('cannot access to not defined locale: /ja', async () => {
    const home = url('/ja')
    const { page } = await renderPage(home)
    let res: Response | (Error & { status: () => number }) | null = null
    try {
      res = await page.goto(home)
    } catch (error: unknown) {
      res = error as Error & { status: () => number }
    }
    // 404
    expect(res!.status()).toBe(404) // eslint-disable-line @typescript-eslint/no-non-null-assertion
  })

  test('reactivity', async () => {
    const { page } = await renderPage('/en')

    // click `fr` lang switch link
    await page.locator('#lang-switcher-with-nuxt-link a').click()
    await waitForURL(page, '/fr')

    // `fr` rendering
    expect(await getText(page, '#home-header')).toEqual('Accueil')
    expect(await getText(page, 'title')).toEqual('Accueil')
    expect(await getText(page, '#link-about')).toEqual('À propos')

    // lang switcher rendering
    expect(await getText(page, '#lang-switcher-with-nuxt-link a')).toEqual('English')
    expect(await getText(page, '#set-locale-link-en')).toEqual('English')

    // page path
    expect(await getData(page, '#home-use-async-data')).toMatchObject({ aboutPath: '/fr/about' })
    expect(await getText(page, '#route-path')).toEqual('route: /fr')
    expect(await page.getAttribute('#lang-switcher-with-nuxt-link a', 'href')).toEqual('/en')

    // current locale
    expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')
  })

  test('(#1889) navigation to page with `defineI18nRoute(false)`', async () => {
    const restore = await startServerWithRuntimeConfig({
      public: {
        i18n: {
          detectBrowserLanguage: {
            useCookie: true,
            alwaysRedirect: false,
            redirectOn: 'root'
          }
        }
      }
    })

    const { page } = await renderPage('/', { locale: 'en' })
    await waitForURL(page, '/en')

    // switch 'fr' locale
    await page.locator('#lang-switcher-with-set-locale a').click()
    await waitForURL(page, '/fr')
    expect(await getText(page, '#home-header')).toEqual('Accueil')

    // navigate to disabled route
    await page.locator('#link-define-i18n-route-false').click()
    await waitForURL(page, '/define-i18n-route-false')

    expect(await getText(page, '#disable-route-text')).toEqual('Page with disabled localized route')

    // back to home
    await page.locator('#goto-home').click()
    expect(await getText(page, '#home-header')).toEqual('Accueil')

    // does not redirect to prefixed route for routes with disabled localization
    await page.goto(url('/ignore-routes/disable'))
    await waitForURL(page, '/ignore-routes/disable')

    await restore()
  })

  test('should not transform `defineI18nRoute()` inside template', async () => {
    const { page } = await renderPage('/', { locale: 'en' })
    await waitForURL(page, '/en')

    expect(await getText(page, '#link-define-i18n-route-false')).toEqual('go to defineI18nRoute(false)')
  })

  test("(#2132) should redirect on root url with `redirectOn: 'no prefix'`", async () => {
    const restore = await startServerWithRuntimeConfig({
      public: {
        i18n: {
          detectBrowserLanguage: {
            useCookie: true,
            cookieSecure: true,
            fallbackLocale: 'en',
            redirectOn: 'no prefix'
          }
        }
      }
    })

    const { page } = await renderPage('/', { locale: 'fr' })
    expect(await getText(page, '#home-header')).toEqual('Accueil')

    await gotoPath(page, '/en')
    expect(await getText(page, '#home-header')).toEqual('Homepage')

    await restore()
  })

  test('(#2020) pass query parameter', async () => {
    const { page } = await renderPage('/')

    expect(await getText(page, '#issue-2020-existing')).toBe('/en/test-route?foo=bar')
    expect(await getText(page, '#issue-2020-nonexistent')).toBe('/i-dont-exist?foo=bar')
  })
})
