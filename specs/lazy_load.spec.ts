import { describe, test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from '@nuxt/test-utils'
import { getText, getData } from './helper'

describe('lazy load', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`./fixtures/lazy`, import.meta.url)),
    browser: true,
    // overrides
    nuxtConfig: {
      i18n: {
        defaultLocale: 'en',
        langDir: 'lang',
        lazy: true,
        locales: [
          {
            code: 'en',
            iso: 'en-US',
            file: 'en.json',
            name: 'English'
          },
          {
            code: 'fr',
            iso: 'fr-FR',
            file: 'fr.json5',
            name: 'Français'
          }
        ]
      }
    }
  })

  test('can access to no prefix locale (en): /', async () => {
    const home = url('/')
    const page = await createPage()
    await page.goto(home)

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

    // html tag `lang` attriute with iso code
    expect(await page.getAttribute('html', 'lang')).toMatch('en-US')
  })

  test('can access to prefix locale: /fr', async () => {
    const home = url('/fr')
    const page = await createPage()
    await page.goto(home)

    // `fr` rendering
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

    // html tag `lang` attriute with iso code
    expect(await page.getAttribute('html', 'lang')).toMatch('fr-FR')
  })
})
