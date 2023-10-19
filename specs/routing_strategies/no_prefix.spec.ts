import { describe, test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url } from '../utils'
import { getText, getData, renderPage, waitForURL, gotoPath } from '../helper'

import type { Response } from 'playwright'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/basic`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      strategy: 'no_prefix',
      defaultLocale: 'en'
    }
  }
})

describe('strategy: no_prefix', async () => {
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
    expect(await getText(page, '#lang-switcher-with-nuxt-link a')).toEqual('Français')
    expect(await getText(page, '#set-locale-link-fr')).toEqual('Français')

    // page path
    expect(await getData(page, '#home-use-async-data')).toMatchObject({ aboutPath: '/about' })
    expect(await page.getAttribute('#lang-switcher-with-nuxt-link a', 'href')).toEqual('/')

    // current locale
    expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('en')

    /**
     * change locale to `fr`
     */

    // click `fr` lang switch link (`setLocale`)
    await page.locator('#lang-switcher-with-set-locale a').click()
    await waitForURL(page, '/')

    // `fr` rendering
    expect(await getText(page, '#home-header')).toEqual('Accueil')
    expect(await getText(page, '#link-about')).toEqual('À propos')

    // lang switcher rendering
    expect(await getText(page, '#lang-switcher-with-nuxt-link a')).toEqual('English')
    expect(await getText(page, '#set-locale-link-en')).toEqual('English')

    // page path
    expect(await getData(page, '#home-use-async-data')).toMatchObject({ aboutPath: '/about' })
    expect(await page.getAttribute('#lang-switcher-with-nuxt-link a', 'href')).toEqual('/')

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
})
