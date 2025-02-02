import { describe, test, expect, beforeAll } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url } from '../utils'
import {
  getText,
  getData,
  renderPage,
  waitForURL,
  gotoPath,
  startServerWithRuntimeConfig,
  assetLocaleHead
} from '../helper'

import type { Response } from 'playwright-core'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/basic`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    extends: [fileURLToPath(new URL(`../fixtures/layers/layer-locale-arabic`, import.meta.url))],
    i18n: {
      strategy: 'no_prefix',
      defaultLocale: 'en',
      defaultDirection: 'auto',
      detectBrowserLanguage: {}
    }
  }
})

describe('strategy: no_prefix', async () => {
  beforeAll(async () => {
    await startServerWithRuntimeConfig({
      public: {
        i18n: { detectBrowserLanguage: false }
      }
    })
  })

  test('cannot access with locale prefix: /ja', async () => {
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

  test('locale change with reactivity', async () => {
    const { page } = await renderPage('/')

    /**
     * default locale `en`
     */

    // `en` rendering
    expect(await getText(page, '#home-header')).toEqual('Homepage')
    expect(await getText(page, '#link-about')).toEqual('About us')

    // lang switcher rendering
    expect(await getText(page, '#nuxt-locale-link-fr')).toEqual('Français')
    expect(await getText(page, '#set-locale-link-fr')).toEqual('Français')

    // page path
    expect(await getData(page, '#home-use-async-data')).toMatchObject({ aboutPath: '/about' })
    expect(await page.getAttribute('#nuxt-locale-link-fr', 'href')).toEqual('/')

    // current locale
    expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('en')

    /**
     * change locale to `fr`
     */

    // click `fr` lang switch link (`setLocale`)
    await page.locator('#set-locale-link-fr').click()
    await waitForURL(page, '/')

    // `fr` rendering
    expect(await getText(page, '#home-header')).toEqual('Accueil')
    expect(await getText(page, '#link-about')).toEqual('À propos')

    // lang switcher rendering
    expect(await getText(page, '#nuxt-locale-link-en')).toEqual('English')
    expect(await getText(page, '#set-locale-link-en')).toEqual('English')

    // page path
    expect(await getData(page, '#home-use-async-data')).toMatchObject({ aboutPath: '/about' })
    expect(await page.getAttribute('#nuxt-locale-link-en', 'href')).toEqual('/')

    // current locale
    expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')
  })

  test('(#2493) should navigate from url with and without trailing slash', async () => {
    const { page } = await renderPage('/category/nested/')

    await page.locator('#return-home-link').click()
    await waitForURL(page, '/')

    expect(page.url()).toEqual(url('/'))

    await gotoPath(page, '/category/nested')

    await page.locator('#return-home-link').click()
    await waitForURL(page, '/')

    expect(page.url()).toEqual(url('/'))
  })

  test('(#2554) should not throw an error when using `setLocale` from plugin', async () => {
    const { page } = await renderPage('/')

    const res1 = await page.goto(url('/?pluginSetLocale=fr'))
    expect(res1?.ok()).toBeTruthy()
    expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')

    const res2 = await page.goto(url('/?pluginSetLocale=en'))
    expect(res2?.ok()).toBeTruthy()
    expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('en')
  })

  test('(#2473) should respect `detectBrowserLanguage`', async () => {
    await startServerWithRuntimeConfig({
      public: {
        i18n: {
          detectBrowserLanguage: {
            // fallback to defaultLocale
            fallbackLocale: 'en'
          }
        }
      }
    })
    const { page } = await renderPage('/', { locale: 'fr' })

    expect(await getText(page, '#home-header')).toEqual(`Accueil`)

    // change page
    await page.locator('#link-about').click()
    await waitForURL(page, '/about')
    expect(await getText(page, '#about-header')).toEqual(`À propos`)

    // one more change page
    await page.locator('#link-home').click()
    expect(await getText(page, '#home-header')).toEqual(`Accueil`)
  })

  test('render with useHead', async () => {
    const { page } = await renderPage('/')

    // title tag
    expect(await getText(page, 'title')).toMatch('Homepage')

    // html tag `lang` and `dir` attributes
    expect(await page.getAttribute('html', 'lang')).toMatch('en')
    expect(await page.getAttribute('html', 'dir')).toMatch('auto')

    // rendering link tag and meta tag in head tag
    await assetLocaleHead(page, '#home-use-locale-head')

    // click `ar` lang switch link
    await page.locator('#set-locale-link-ar').click()
    await page.waitForFunction(() => document.querySelector('title')?.textContent === 'Homepage (Arabic)')

    // title tag
    expect(await getText(page, 'title')).toMatch('Homepage (Arabic)')

    // html tag `lang` and `dir` attributes
    expect(await page.getAttribute('html', 'lang')).toMatch('ar')
    expect(await page.getAttribute('html', 'dir')).toMatch('rtl')

    // rendering link tag and meta tag in head tag
    await assetLocaleHead(page, '#home-use-locale-head')
  })
})
