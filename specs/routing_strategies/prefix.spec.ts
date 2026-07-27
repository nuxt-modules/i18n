import { describe, test, expect, beforeEach } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, fetch } from '../utils'
import { renderPage, setServerRuntimeConfig, gotoPath, startServerWithRuntimeConfig } from '../helper'

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
    await startServerWithRuntimeConfig(
      {
        public: {
          i18n: { detectBrowserLanguage: false }
        }
      },
      true
    )
  })

  test('cannot access unprefixed urls', async () => {
    const redirectUrls = [['/', '/en']]
    for (const [pathUrl, destination] of redirectUrls) {
      const res = await fetch(pathUrl, { redirect: 'manual' })
      expect(res.status).toBe(302)
      expect(res.headers.get('location')).toBe(destination)
    }

    const notFoundUrls = [
      ['/about', '/en/about'],
      ['/category/foo', '/en/category/foo']
    ]
    for (const [pathUrl, _destination] of notFoundUrls) {
      const res = await fetch(pathUrl, { redirect: 'manual' })
      expect(res.status).toBe(404)
      expect(res.headers.get('location')).toBe(null)
    }
  })

  test('can access to prefix locale: /en', async () => {
    const { page } = await renderPage('/en')

    // `en` rendering
    await expect.poll(() => page.locator('#home-header').innerText()).toEqual('Homepage')
    await expect.poll(() => page.locator('title').innerText()).toEqual('Homepage')
    await expect.poll(() => page.locator('#link-about').innerText()).toEqual('About us')

    // lang switcher rendering
    await expect.poll(() => page.locator('#lang-switcher-with-nuxt-link .switch-to-fr').innerText()).toEqual('Français')
    await expect.poll(() => page.locator('#set-locale-link-fr').innerText()).toEqual('Français')

    // page path
    expect(JSON.parse(await page.locator('#home-use-async-data').innerText())).toMatchObject({ aboutPath: '/en/about' })
    await expect.poll(() => page.locator('#route-path').innerText()).toEqual('route: /en')
    await expect.poll(() => page.getAttribute('#lang-switcher-with-nuxt-link .switch-to-fr', 'href')).toEqual('/fr')

    // current locale
    await expect.poll(() => page.locator('#lang-switcher-current-locale code').innerText()).toEqual('en')
  })

  test('can access to prefix locale: /fr', async () => {
    const { page } = await renderPage('/fr')

    // `fr` rendering
    await expect.poll(() => page.locator('#home-header').innerText()).toEqual('Accueil')
    await expect.poll(() => page.locator('title').innerText()).toEqual('Accueil')
    await expect.poll(() => page.locator('#link-about').innerText()).toEqual('À propos')

    // lang switcher rendering
    await expect.poll(() => page.locator('#lang-switcher-with-nuxt-link .switch-to-en').innerText()).toEqual('English')
    await expect.poll(() => page.locator('#set-locale-link-en').innerText()).toEqual('English')

    // page path
    expect(JSON.parse(await page.locator('#home-use-async-data').innerText())).toMatchObject({ aboutPath: '/fr/about' })
    await expect.poll(() => page.locator('#route-path').innerText()).toEqual('route: /fr')
    await expect.poll(() => page.getAttribute('#lang-switcher-with-nuxt-link .switch-to-en', 'href')).toEqual('/en')

    // current locale
    await expect.poll(() => page.locator('#lang-switcher-current-locale code').innerText()).toEqual('fr')
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
    await expect.poll(() => page.locator('#home-header').innerText()).toEqual('Accueil')
    await expect.poll(() => page.locator('title').innerText()).toEqual('Accueil')
    await expect.poll(() => page.locator('#link-about').innerText()).toEqual('À propos')

    // lang switcher rendering
    await expect.poll(() => page.locator('#lang-switcher-with-nuxt-link .switch-to-en').innerText()).toEqual('English')
    await expect.poll(() => page.locator('#set-locale-link-en').innerText()).toEqual('English')

    // page path
    expect(JSON.parse(await page.locator('#home-use-async-data').innerText())).toMatchObject({ aboutPath: '/fr/about' })
    await expect.poll(() => page.locator('#route-path').innerText()).toEqual('route: /fr')
    await expect.poll(() => page.getAttribute('#lang-switcher-with-nuxt-link .switch-to-en', 'href')).toEqual('/en')

    // current locale
    await expect.poll(() => page.locator('#lang-switcher-current-locale code').innerText()).toEqual('fr')
  })

  test('(#1889) navigation to page with `defineI18nRoute(false)`', async () => {
    await startServerWithRuntimeConfig(
      {
        public: {
          i18n: {
            detectBrowserLanguage: {
              useCookie: true,
              alwaysRedirect: false,
              redirectOn: 'root'
            }
          }
        }
      },
      true
    )

    const { page } = await renderPage('/', { locale: 'en' })
    await page.waitForURL(url('/en'))

    // switch 'fr' locale
    await page.locator('#lang-switcher-with-nuxt-link .switch-to-fr').clickNavigate()
    await page.waitForURL(url('/fr'))
    await expect.poll(() => page.locator('#home-header').innerText()).toEqual('Accueil')

    // navigate to disabled route
    await page.locator('#link-define-i18n-route-false').clickNavigate()
    await page.waitForURL(url('/define-i18n-route-false'))

    await expect.poll(() => page.locator('#disable-route-text').innerText()).toEqual('Page with disabled localized route')

    // back to home
    await page.locator('#goto-home').clickNavigate()
    await expect.poll(() => page.locator('#home-header').innerText()).toEqual('Accueil')

    // does not redirect to prefixed route for routes with disabled localization
    await page.goto(url('/ignore-routes/disable'))
    await page.waitForURL(url('/ignore-routes/disable'))
  })

  test("(#3987) initial load of route with disabled localization does not redirect with `redirectOn: 'no prefix'`", async () => {
    await startServerWithRuntimeConfig(
      {
        public: {
          i18n: {
            detectBrowserLanguage: {
              useCookie: false,
              redirectOn: 'no prefix'
            }
          }
        }
      },
      true
    )

    // `/ignore-routes/disable` is shadowed by the localized catch-all `ignore-routes/[...catch].vue`,
    // which used to give the client-side detection a resolvable localized destination
    const { page } = await renderPage('/ignore-routes/disable', { locale: 'fr' })
    // detection redirect is delayed until hydration, give it time to (not) happen
    await page.waitForTimeout(500)
    expect(page.url()).toBe(url('/ignore-routes/disable'))
    await expect.poll(() => page.locator('p').innerText()).toEqual('ignore localized route disable test')
  })

  test("(#3910) SSR request for a route with disabled localization reaches the page with `redirectOn: 'no prefix'`", async () => {
    await startServerWithRuntimeConfig(
      {
        public: {
          i18n: {
            detectBrowserLanguage: {
              useCookie: true,
              redirectOn: 'no prefix'
            }
          }
        }
      },
      true
    )

    const res = await fetch(url('/ignore-routes/disable'))

    expect(res.status).toBe(200)
    expect(new URL(res.url).pathname).toBe('/ignore-routes/disable')
    expect(await res.text()).toContain('ignore localized route disable test')
  })

  test("(#3842) server routes are not redirected with `redirectOn: 'no prefix'`", async () => {
    await startServerWithRuntimeConfig(
      {
        public: {
          i18n: {
            detectBrowserLanguage: {
              useCookie: true,
              redirectOn: 'no prefix'
            }
          }
        }
      },
      true
    )

    const res = await fetch(url('/ignore-routes/data'))

    expect(res.redirected).toBe(false)
    expect(await res.json()).toEqual({ message: 'Hello from test endpoint!' })
  })

  test('should not transform `defineI18nRoute()` inside template', async () => {
    const { page } = await renderPage('/', { locale: 'en' })
    await page.waitForURL(url('/en'))

    await expect.poll(() => page.locator('#link-define-i18n-route-false').innerText()).toEqual('go to defineI18nRoute(false)')
  })

  test("(#2132) should redirect on root url with `redirectOn: 'no prefix'`", async () => {
    await startServerWithRuntimeConfig(
      {
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
      },
      true
    )

    const { page } = await renderPage('/', { locale: 'fr' })
    await expect.poll(() => page.locator('#home-header').innerText()).toEqual('Accueil')

    await gotoPath(page, '/en')
    await expect.poll(() => page.locator('#home-header').innerText()).toEqual('Homepage')
  })

  test('(#2020) pass query parameter', async () => {
    const { page } = await renderPage('/')

    await expect.poll(() => page.locator('#issue-2020-existing').innerText()).toBe('/en/test-route?foo=bar')
    await expect.poll(() => page.locator('#issue-2020-nonexistent').innerText()).toBe('/i-dont-exist?foo=bar')
  })
  test('should keep query params when redirecting', async () => {
    await startServerWithRuntimeConfig(
      {
        public: {
          i18n: {
            detectBrowserLanguage: false
          }
        }
      },
      true
    )

    const res = await fetch('/?foo=bar')
    expect(res.url).toBe(url('/en?foo=bar'))
  })
})
