import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from '@nuxt/test-utils'
import { getText, getData } from './helper'

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
  expect(await getText(page, '#lang-switcher-with-nuxt-link a')).toEqual('English')
  expect(await getText(page, '#set-locale-link-en')).toEqual('English')

  // page path
  expect(await getData(page, '#home-use-async-data')).toMatchObject({ aboutPath: '/fr/about' })
  expect(await page.getAttribute('#lang-switcher-with-nuxt-link a', 'href')).toEqual('/')

  // current locale
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')

  // html tag `lang` attriute with iso code
  expect(await page.getAttribute('html', 'lang')).toEqual('fr-FR')
})
