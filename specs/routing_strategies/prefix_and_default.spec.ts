import { describe, test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url } from '../utils'
import { getText, getData, renderPage, waitForURL } from '../helper'

import type { Response } from 'playwright-core'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/basic`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      strategy: 'prefix_and_default',
      defaultLocale: 'en',
      detectBrowserLanguage: false
    }
  }
})

describe('strategy: prefix_and_default', async () => {
  test('can access to no prefix locale (defaultLocale: en): /', async () => {
    const { page } = await renderPage('/')

    // `en` rendering
    expect(await getText(page, '#home-header')).toMatch('Homepage')
    expect(await getText(page, 'title')).toMatch('Homepage')
    expect(await getText(page, '#link-about')).toMatch('About us')

    // lang switcher rendering
    expect(await getText(page, '#lang-switcher-with-nuxt-link a')).toMatch('Français')
    expect(await getText(page, '#set-locale-link-fr')).toMatch('Français')

    // page path
    expect(await getData(page, '#home-use-async-data')).toMatchObject({ aboutPath: '/about' })
    expect(await page.getAttribute('#lang-switcher-with-nuxt-link a', 'href')).toMatch('/fr')

    // current locale
    expect(await getText(page, '#lang-switcher-current-locale')).toMatch('en')
  })

  test('can access to prefix locale : /en', async () => {
    const { page } = await renderPage('/en')

    // `en` rendering
    expect(await getText(page, '#home-header')).toMatch('Homepage')
    expect(await getText(page, 'title')).toMatch('Homepage')
    expect(await getText(page, '#link-about')).toMatch('About us')

    // lang switcher rendering
    expect(await getText(page, '#lang-switcher-with-nuxt-link a')).toMatch('Français')
    expect(await getText(page, '#set-locale-link-fr')).toMatch('Français')

    // page path
    expect(await getData(page, '#home-use-async-data')).toMatchObject({ aboutPath: '/about' })
    expect(await page.getAttribute('#lang-switcher-with-nuxt-link a', 'href')).toMatch('/fr')

    // current locale
    expect(await getText(page, '#lang-switcher-current-locale')).toMatch('en')
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
    expect(await getText(page, 'title')).toEqual('Homepage')

    await page.locator('#set-locale-link-fr').click()
    await waitForURL(page, '/fr')
    expect(await getText(page, 'title')).toEqual('Accueil')

    // navigation URL
    expect(await page.url()).toEqual(url('/fr'))
  })

  test('(#2226) navigation works while `locale === defaultLocale`', async () => {
    const { page } = await renderPage(url('/'))

    await page.locator('#lang-switcher-with-nuxt-link a').click()
    expect(await getText(page, '#lang-switcher-default-locale')).include(`Default Locale: en`)
    expect(await getText(page, '#lang-switcher-current-locale')).include(`Current Locale: fr`)

    await page.locator('#link-about').click()
    await waitForURL(page, '/fr/about')
    expect(await getText(page, '#about-header')).include(`À propos`)

    await page.locator('#link-home').click()
    await waitForURL(page, '/fr')
    expect(await getText(page, '#home-header')).toEqual('Accueil')

    await page.locator('#lang-switcher-with-nuxt-link a').click()
    expect(await getText(page, '#lang-switcher-default-locale')).include(`Default Locale: en`)
    expect(await getText(page, '#lang-switcher-current-locale')).include(`Current Locale: en`)

    await page.locator('#link-about').click()
    await waitForURL(page, '/about')
    expect(await getText(page, '#about-header')).include(`About us`)
  })
})
