import { describe, test, expect, beforeEach } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, fetch } from '../utils'
import { renderPage, setServerRuntimeConfig, gotoPath } from '../helper'

import type { Response } from 'playwright-core'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/basic`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      strategy: 'prefix',
      defaultLocale: 'en'
    }
  }
})

describe('strategy: prefix', async () => {
  beforeEach(async () => {
    // use original fixture `detectBrowserLanguage` value as default for tests, overwrite here needed
    await setServerRuntimeConfig(
      {
        public: {
          i18n: { detectBrowserLanguage: false }
        }
      },
      true
    )
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
    expect(await page.locator('#home-header').innerText()).toEqual('Homepage')
    expect(await page.locator('title').innerText()).toEqual('Homepage')
    expect(await page.locator('#link-about').innerText()).toEqual('About us')

    // lang switcher rendering
    expect(await page.locator('#lang-switcher-with-nuxt-link .switch-to-fr').innerText()).toEqual('Français')
    expect(await page.locator('#set-locale-link-fr').innerText()).toEqual('Français')

    // page path
    expect(JSON.parse(await page.locator('#home-use-async-data').innerText())).toMatchObject({ aboutPath: '/en/about' })
    expect(await page.locator('#route-path').innerText()).toEqual('route: /en')
    expect(await page.getAttribute('#lang-switcher-with-nuxt-link .switch-to-fr', 'href')).toEqual('/fr')

    // current locale
    expect(await page.locator('#lang-switcher-current-locale code').innerText()).toEqual('en')
  })

  test('can access to prefix locale: /fr', async () => {
    const { page } = await renderPage('/fr')

    // `fr` rendering
    expect(await page.locator('#home-header').innerText()).toEqual('Accueil')
    expect(await page.locator('title').innerText()).toEqual('Accueil')
    expect(await page.locator('#link-about').innerText()).toEqual('À propos')

    // lang switcher rendering
    expect(await page.locator('#lang-switcher-with-nuxt-link .switch-to-en').innerText()).toEqual('English')
    expect(await page.locator('#set-locale-link-en').innerText()).toEqual('English')

    // page path
    expect(JSON.parse(await page.locator('#home-use-async-data').innerText())).toMatchObject({ aboutPath: '/fr/about' })
    expect(await page.locator('#route-path').innerText()).toEqual('route: /fr')
    expect(await page.getAttribute('#lang-switcher-with-nuxt-link .switch-to-en', 'href')).toEqual('/en')

    // current locale
    expect(await page.locator('#lang-switcher-current-locale code').innerText()).toEqual('fr')
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
    await page.locator('#lang-switcher-with-nuxt-link .switch-to-fr').clickNavigate()
    await page.waitForURL(url('/fr'))

    // `fr` rendering
    expect(await page.locator('#home-header').innerText()).toEqual('Accueil')
    expect(await page.locator('title').innerText()).toEqual('Accueil')
    expect(await page.locator('#link-about').innerText()).toEqual('À propos')

    // lang switcher rendering
    expect(await page.locator('#lang-switcher-with-nuxt-link .switch-to-en').innerText()).toEqual('English')
    expect(await page.locator('#set-locale-link-en').innerText()).toEqual('English')

    // page path
    expect(JSON.parse(await page.locator('#home-use-async-data').innerText())).toMatchObject({ aboutPath: '/fr/about' })
    expect(await page.locator('#route-path').innerText()).toEqual('route: /fr')
    expect(await page.getAttribute('#lang-switcher-with-nuxt-link .switch-to-en', 'href')).toEqual('/en')

    // current locale
    expect(await page.locator('#lang-switcher-current-locale code').innerText()).toEqual('fr')
  })

  test('(#1889) navigation to page with `defineI18nRoute(false)`', async () => {
    await setServerRuntimeConfig({
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
    await page.waitForURL(url('/en'))

    // switch 'fr' locale
    await page.locator('#lang-switcher-with-nuxt-link .switch-to-fr').clickNavigate()
    await page.waitForURL(url('/fr'))
    expect(await page.locator('#home-header').innerText()).toEqual('Accueil')

    // navigate to disabled route
    await page.locator('#link-define-i18n-route-false').clickNavigate()
    await page.waitForURL(url('/define-i18n-route-false'))

    expect(await page.locator('#disable-route-text').innerText()).toEqual('Page with disabled localized route')

    // back to home
    await page.locator('#goto-home').clickNavigate()
    expect(await page.locator('#home-header').innerText()).toEqual('Accueil')

    // does not redirect to prefixed route for routes with disabled localization
    await page.goto(url('/ignore-routes/disable'))
    await page.waitForURL(url('/ignore-routes/disable'))
  })

  test('should not transform `defineI18nRoute()` inside template', async () => {
    const { page } = await renderPage('/', { locale: 'en' })
    await page.waitForURL(url('/en'))

    expect(await page.locator('#link-define-i18n-route-false').innerText()).toEqual('go to defineI18nRoute(false)')
  })

  test("(#2132) should redirect on root url with `redirectOn: 'no prefix'`", async () => {
    await setServerRuntimeConfig({
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
    expect(await page.locator('#home-header').innerText()).toEqual('Accueil')

    await gotoPath(page, '/en')
    expect(await page.locator('#home-header').innerText()).toEqual('Homepage')
  })

  test('(#2020) pass query parameter', async () => {
    const { page } = await renderPage('/')

    expect(await page.locator('#issue-2020-existing').innerText()).toBe('/en/test-route?foo=bar')
    expect(await page.locator('#issue-2020-nonexistent').innerText()).toBe('/i-dont-exist?foo=bar')
  })
})
