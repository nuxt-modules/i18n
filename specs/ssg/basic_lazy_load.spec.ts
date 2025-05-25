import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url } from '../utils'
import { getLocalesMessageKeyCount, renderPage, waitForLocaleFileNetwork, waitForLocaleSwitch } from '../helper'
import { Page } from 'playwright-core'

describe('basic lazy loading', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/lazy`, import.meta.url)),
    browser: true,
    prerender: true,
    nuxtConfig: {
      runtimeConfig: {
        public: {
          // disables fetching localized messages from server route
          noServer: true
        }
      }
    }
  })

  test('dynamic locale files are not cached', async () => {
    const { page } = await renderPage('/nl')

    // capture dynamicTime - simulates changing api response
    const dynamicTime = await page.locator('#dynamic-time').innerText()

    await page.click('#nuxt-locale-link-fr')
    await page.waitForURL(url('/fr'))
    expect(await page.locator('#dynamic-time').innerText()).toEqual('Not dynamic')

    // dynamicTime depends on passage of some time
    await page.waitForTimeout(1)

    // dynamicTime does not match captured dynamicTime
    await page.click('#nuxt-locale-link-nl')
    await page.waitForURL(url('/nl'))
    expect(await page.locator('#dynamic-time').innerText()).to.not.equal(dynamicTime)
  })

  test('locales are fetched on demand', async () => {
    const home = url('/')
    const { page } = await renderPage(home)

    // `en` present on initial load
    expect(await getLocalesMessageKeyCount(page)).toMatchInlineSnapshot(`
      {
        "en": 7,
      }
    `)

    // navigate and wait for locale file request
    await Promise.all([
      waitForLocaleFileNetwork(page, 'lazy-locale-fr.js', 'response'),
      page.click('#nuxt-locale-link-fr')
    ])

    // `fr` locale has been fetched
    expect(await getLocalesMessageKeyCount(page)).toMatchInlineSnapshot(`
      {
        "en": 7,
        "fr": 5,
      }
    `)

    // navigate and wait for locale file request
    await Promise.all([
      waitForLocaleFileNetwork(page, 'lazy-locale-module-nl.js', 'response'),
      page.click('#nuxt-locale-link-nl')
    ])

    // `nl` (module) locale has been fetched
    expect(await getLocalesMessageKeyCount(page)).toMatchInlineSnapshot(`
      {
        "en": 7,
        "fr": 5,
        "nl": 3,
      }
    `)
  })

  test('can access to no prefix locale (en): /', async () => {
    const { page } = await renderPage('/')

    // `en` rendering
    expect(await page.locator('#home-header').innerText()).toEqual('Homepage')
    expect(await page.locator('title').innerText()).toEqual('Homepage')
    expect(await page.locator('#link-about').innerText()).toEqual('About us')

    // lang switcher rendering
    expect(await page.locator('#set-locale-link-fr').innerText()).toEqual('Français')

    // page path
    expect(JSON.parse(await page.locator('#home-use-async-data').innerText())).toMatchObject({ aboutPath: '/about' })

    // current locale
    expect(await page.locator('#lang-switcher-current-locale code').innerText()).toEqual('en')

    // html tag `lang` attribute with language code
    expect(await page.getAttribute('html', 'lang')).toEqual('en-US')
  })

  test('can access to prefix locale: /fr', async () => {
    const { page } = await renderPage('/fr')

    // `fr` rendering
    expect(await page.locator('#home-header').innerText()).toEqual('Accueil')
    expect(await page.locator('title').innerText()).toEqual('Accueil')
    expect(await page.locator('#link-about').innerText()).toEqual('À propos')

    // lang switcher rendering
    expect(await page.locator('#set-locale-link-en').innerText()).toEqual('English')

    // page path
    expect(JSON.parse(await page.locator('#home-use-async-data').innerText())).toMatchObject({ aboutPath: '/fr/about' })

    // current locale
    expect(await page.locator('#lang-switcher-current-locale code').innerText()).toEqual('fr')

    // html tag `lang` attribute with language code
    expect(await page.getAttribute('html', 'lang')).toEqual('fr-FR')
  })

  test('multiple lazy loading', async () => {
    const { page } = await renderPage('/en-GB')

    // `en` base rendering
    expect(await page.locator('#home-header').innerText()).toEqual('Homepage')
    expect(await page.locator('title').innerText()).toEqual('Homepage')
    expect(await page.locator('#link-about').innerText()).toEqual('About us')

    expect(await page.locator('#profile-js').innerText()).toEqual('Profile1')
    expect(await page.locator('#profile-ts').innerText()).toEqual('Profile2')
  })

  test('files with cache disabled bypass caching', async () => {
    const { page, consoleLogs } = await renderPage('/')

    await Promise.all([waitForLocaleSwitch(page), page.click('#nuxt-locale-link-en-GB')])
    expect(consoleLogs.filter(x => x.text.includes('loading en-GB'))).toHaveLength(1)

    await Promise.all([waitForLocaleSwitch(page), page.click('#nuxt-locale-link-fr')])
    expect(consoleLogs.filter(x => x.text.includes('loading en-GB'))).toHaveLength(1)

    await Promise.all([waitForLocaleSwitch(page), page.click('#nuxt-locale-link-en-GB')])
    expect(consoleLogs.filter(x => x.text.includes('loading en-GB'))).toHaveLength(2)
  })

  test('manually loaded messages can be used in translations', async () => {
    const { page } = await renderPage('/manual-load')

    expect(await page.locator('#welcome-english').innerText()).toEqual('Welcome!')
    expect(await page.locator('#welcome-dutch').innerText()).toEqual('Welkom!')
  })
})
