import { describe, test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from '@nuxt/test-utils-edge'
import { getText, getData } from '../helper'

import type { Response } from 'playwright'

describe('routing and strategies', () => {
  describe('default strategy: prefix_except_default', async () => {
    await setup({
      rootDir: fileURLToPath(new URL(`../fixtures/nuxt3/basic`, import.meta.url)),
      dev: true,
      browser: true
      /*
      nuxtConfig: {
        i18n: {
          defaultLocale: 'en' // override default locale
        }
      }
      */
    })

    test('can access to no prefix locale (defaultLocale: en): /', async () => {
      const home = url('/')
      const page = await createPage()
      await page.goto(home)

      // en rendering
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

      // seo
      expect(await page.getAttribute('html', 'lang')).toMatch('en')
    })

    test('can access to prefix locale: /fr', async () => {
      const home = url('/fr')
      const page = await createPage()
      await page.goto(home)

      // fr rendering
      expect(await getText(page, '#home-header')).toMatch('Accueil')
      expect(await getText(page, 'title')).toMatch('Accueil')
      expect(await getText(page, '#link-about')).toMatch('À propos')

      // lang switcher rendering
      expect(await getText(page, '#lang-switcher-with-nuxt-link a')).toMatch('English')
      expect(await getText(page, '#set-locale-link-en')).toMatch('English')

      // page path
      expect(await getData(page, '#home-use-async-data')).toMatchObject({ aboutPath: '/fr/about' })
      expect(await page.getAttribute('#lang-switcher-with-nuxt-link a', 'href')).toMatch('/')

      // current locale
      expect(await getText(page, '#lang-switcher-current-locale')).toMatch('fr')

      // seo
      expect(await page.getAttribute('html', 'lang')).toMatch('fr')
    })

    test('can not access to not defined locale: /ja', async () => {
      const home = url('/ja')
      const page = await createPage()
      let res: Response | (Error & { status: () => number }) | null = null
      try {
        res = await page.goto(home)
      } catch (error: unknown) {
        res = error as Error & { status: () => number }
      }
      // 404
      expect(res!.status()).toBe(404)
    })
  })

  describe.todo('strategy: prefix_and_default')
  describe.todo('strategy: prefix')
  describe.todo('strategy: no_prefix')
})
