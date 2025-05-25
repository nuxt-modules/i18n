import { describe, test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url } from '../utils'
import { renderPage } from '../helper'

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
    expect(await page.locator('#home-header').innerText()).toMatch('Homepage')
    expect(await page.locator('title').innerText()).toMatch('Homepage')
    expect(await page.locator('#link-about').innerText()).toMatch('About us')

    // lang switcher rendering
    expect(await page.locator('#lang-switcher-with-nuxt-link .switch-to-fr').innerText()).toMatch('Français')
    expect(await page.locator('#set-locale-link-fr').innerText()).toMatch('Français')

    // page path
    expect(JSON.parse(await page.locator('#home-use-async-data').innerText())).toMatchObject({ aboutPath: '/about' })
    expect(await page.getAttribute('#lang-switcher-with-nuxt-link .switch-to-fr', 'href')).toMatch('/fr')

    // current locale
    expect(await page.locator('#lang-switcher-current-locale').innerText()).toMatch('en')
  })

  test('can access to prefix locale : /en', async () => {
    const { page } = await renderPage('/en')

    // `en` rendering
    expect(await page.locator('#home-header').innerText()).toMatch('Homepage')
    expect(await page.locator('title').innerText()).toMatch('Homepage')
    expect(await page.locator('#link-about').innerText()).toMatch('About us')

    // lang switcher rendering
    expect(await page.locator('#lang-switcher-with-nuxt-link .switch-to-fr').innerText()).toMatch('Français')
    expect(await page.locator('#set-locale-link-fr').innerText()).toMatch('Français')

    // page path
    expect(JSON.parse(await page.locator('#home-use-async-data').innerText())).toMatchObject({ aboutPath: '/about' })
    expect(await page.getAttribute('#lang-switcher-with-nuxt-link .switch-to-fr', 'href')).toMatch('/fr')

    // current locale
    expect(await page.locator('#lang-switcher-current-locale').innerText()).toMatch('en')
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
    expect(await page.getAttribute('#lang-switcher-with-nuxt-link a', 'href')).toEqual('/')

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
    const { page } = await renderPage('/')

    // click `fr` lang switch link with NuxtLink
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
    expect(await page.getAttribute('#lang-switcher-with-nuxt-link a', 'href')).toEqual('/')

    // current locale
    expect(await page.locator('#lang-switcher-current-locale code').innerText()).toEqual('fr')

    // click `en` and `fr` lang switch link with setLocale
    await page.locator('#set-locale-link-en').clickNavigate()
    await page.waitForURL(url('/'))
    expect(await page.locator('title').innerText()).toEqual('Homepage')

    await page.locator('#set-locale-link-fr').clickNavigate()
    await page.waitForURL(url('/fr'))
    expect(await page.locator('title').innerText()).toEqual('Accueil')
  })

  test('(#2226) navigation works while `locale === defaultLocale`', async () => {
    const { page } = await renderPage(url('/'))

    await page.locator('#lang-switcher-with-nuxt-link .switch-to-fr').clickNavigate()
    expect(await page.locator('#lang-switcher-default-locale').innerText()).include(`Default Locale: en`)
    expect(await page.locator('#lang-switcher-current-locale').innerText()).include(`Current Locale: fr`)

    await page.locator('#link-about').clickNavigate()
    await page.waitForURL(url('/fr/about'))
    expect(await page.locator('#about-header').innerText()).include(`À propos`)

    await page.locator('#link-home').clickNavigate()
    await page.waitForURL(url('/fr'))
    expect(await page.locator('#home-header').innerText()).toEqual('Accueil')

    await page.locator('#lang-switcher-with-nuxt-link .switch-to-en').clickNavigate()
    expect(await page.locator('#lang-switcher-default-locale').innerText()).include(`Default Locale: en`)
    expect(await page.locator('#lang-switcher-current-locale').innerText()).include(`Current Locale: en`)

    await page.locator('#link-about').clickNavigate()
    await page.waitForURL(url('/about'))
    expect(await page.locator('#about-header').innerText()).include(`About us`)
  })
})
