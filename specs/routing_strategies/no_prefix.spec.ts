import { describe, test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from '../utils'
import { getText, getData } from '../helper'

import type { Response } from 'playwright'

describe('strategy: no_prefix', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/routing_no_prefix`, import.meta.url)),
    browser: true,
    // overrides
    nuxtConfig: {
      i18n: {
        strategy: 'no_prefix',
        defaultLocale: 'en'
      }
    }
  })

  test('cannot access with locale prefix: /ja', async () => {
    const home = url('/ja')
    const page = await createPage()
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
    const home = url('/')
    const page = await createPage()
    await page.goto(home)

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
    await page.waitForTimeout(100)

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
})
