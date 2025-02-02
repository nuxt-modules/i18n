import { describe, test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url } from '../utils'
import { getText, getData, assetLocaleHead, renderPage, waitForURL } from '../helper'

import type { Response } from 'playwright-core'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/basic`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      defaultLocale: 'en',
      defaultDirection: 'auto'
    }
  }
})

describe('default strategy: prefix_except_default', async () => {
  test('can access to no prefix locale (defaultLocale: en): /', async () => {
    const { page } = await renderPage('/')

    // `en` rendering
    expect(await getText(page, '#home-header')).toEqual('Homepage')
    expect(await getText(page, 'title')).toEqual('Homepage')
    expect(await getText(page, '#link-about')).toEqual('About us')

    // lang switcher rendering
    expect(await getText(page, '#lang-switcher-with-nuxt-link a')).toEqual('Français')
    expect(await getText(page, '#set-locale-link-fr')).toEqual('Français')

    // page path
    expect(await getData(page, '#home-use-async-data')).toMatchObject({ aboutPath: '/about' })
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
    expect(await page.getAttribute('#lang-switcher-with-nuxt-link a', 'href')).toEqual('/')

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
    const { page } = await renderPage('/')

    // click `fr` lang switch link with NuxtLink
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
    expect(await page.getAttribute('#lang-switcher-with-nuxt-link a', 'href')).toEqual('/')

    // current locale
    expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')

    // click `en` and `fr` lang switch link with setLocale
    await page.locator('#set-locale-link-en').click()
    await waitForURL(page, '/')
    await page.locator('#set-locale-link-fr').click()
    await waitForURL(page, '/fr')

    // navigation URL
    expect(await page.url()).toEqual(url('/fr'))
  })

  test('render with useHead', async () => {
    const { page } = await renderPage('/')

    /**
     * default locale
     */

    // title tag
    expect(await getText(page, 'title')).toMatch('Homepage')

    // html tag `lang` attribute
    expect(await page.getAttribute('html', 'lang')).toMatch('en')

    // html tag `dir` attribute
    expect(await page.getAttribute('html', 'dir')).toMatch('auto')

    // rendering link tag and meta tag in head tag
    await assetLocaleHead(page, '#home-use-locale-head')

    /**
     * change locale
     */

    // click `fr` lang switch link
    await page.locator('#lang-switcher-with-nuxt-link a').click()
    await waitForURL(page, '/fr')

    // title tag
    expect(await getText(page, 'title')).toMatch('Accueil')

    // html tag `lang` attribute
    expect(await page.getAttribute('html', 'lang')).toMatch('fr-FR')

    // rendering link tag and meta tag in head tag
    await assetLocaleHead(page, '#home-use-locale-head')
  })

  test('(#3330) locale detected server-side', async () => {
    const { page } = await renderPage('/')

    // @ts-expect-error runtime evaluation
    const detectPathDefault = await page.evaluate(() => window.useNuxtApp().payload.serverDetectedLocale)
    expect(detectPathDefault).toEqual('en')

    await page.goto(url('/fr'))
    // @ts-expect-error runtime evaluation
    const detectPathFr = await page.evaluate(() => window.useNuxtApp().payload.serverDetectedLocale)
    expect(detectPathFr).toEqual('fr')
  })
})
