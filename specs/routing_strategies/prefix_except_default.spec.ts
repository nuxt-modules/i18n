import { describe, test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from '@nuxt/test-utils'
import { getText, getData } from '../helper'

import type { Response } from 'playwright'

describe('default strategy: prefix_except_default', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/basic`, import.meta.url)),
    // dev: true,
    browser: true,
    // overrides
    nuxtConfig: {
      i18n: {
        defaultLocale: 'en'
      }
    }
  })

  test('can access to no prefix locale (defaultLocale: en): /', async () => {
    const home = url('/')
    const page = await createPage()
    await page.goto(home)

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
    const home = url('/fr')
    const page = await createPage()
    await page.goto(home)

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

  test('reactivity', async () => {
    const home = url('/')
    const page = await createPage()
    await page.goto(home)

    // click `fr` lang switch link with NuxtLink
    await page.locator('#lang-switcher-with-nuxt-link a').click()

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
    await page.waitForTimeout(1000)
    await page.locator('#set-locale-link-fr').click()
    await page.waitForTimeout(1000)

    // navigation URL
    expect(await page.url()).toEqual(url('/fr'))
  })
})
