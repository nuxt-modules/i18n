import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from '../utils'
import { getText, getData } from '../helper'

describe('basic', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/lazy`, import.meta.url)),
    browser: true,
    // overrides
    nuxtConfig: {
      i18n: {
        experimental: {
          jsTsFormatResource: true
        },
        precompile: {
          strictMessage: false
        },
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
            code: 'en-GB',
            iso: 'en-GB',
            files: ['en.json', 'en-GB.js', 'en-GB.ts'],
            name: 'English (UK)'
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
    expect(await getText(page, '#home-header')).toEqual('Homepage')
    expect(await getText(page, 'title')).toEqual('Homepage')
    expect(await getText(page, '#link-about')).toEqual('About us')

    // lang switcher rendering
    expect(await getText(page, '#set-locale-link-fr')).toEqual('Français')

    // page path
    expect(await getData(page, '#home-use-async-data')).toMatchObject({ aboutPath: '/about' })

    // current locale
    expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('en')

    // html tag `lang` attriute with iso code
    expect(await page.getAttribute('html', 'lang')).toEqual('en-US')
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
    expect(await getText(page, '#set-locale-link-en')).toEqual('English')

    // page path
    expect(await getData(page, '#home-use-async-data')).toMatchObject({ aboutPath: '/fr/about' })

    // current locale
    expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')

    // html tag `lang` attriute with iso code
    expect(await page.getAttribute('html', 'lang')).toEqual('fr-FR')
  })

  test('mutiple lazy loading', async () => {
    const home = url('/en-GB')
    const page = await createPage()
    await page.goto(home)

    // `en` base rendering
    expect(await getText(page, '#home-header')).toEqual('Homepage')
    expect(await getText(page, 'title')).toEqual('Homepage')
    expect(await getText(page, '#link-about')).toEqual('About us')

    expect(await getText(page, '#profile-js')).toEqual('Profile1')
    expect(await getText(page, '#profile-ts')).toEqual('Profile2')
  })
})
