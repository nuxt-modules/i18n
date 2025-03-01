import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, useTestContext } from '../utils'
import { getText, getData, waitForMs, renderPage, waitForURL, localeLoaderHelpers } from '../helper'

describe('basic lazy loading', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/lazy-without-server`, import.meta.url)),
    browser: true,
    prerender: true,
    nuxtConfig: {
      i18n: {
        debug: true
      }
    }
  })

  test('dynamic locale files are not cached', async () => {
    const { page } = await renderPage('/nl')

    // capture dynamicTime - simulates changing api response
    const dynamicTime = await getText(page, '#dynamic-time')

    await page.click('#lang-switcher-with-nuxt-link-fr')
    await waitForURL(page, '/fr')
    expect(await getText(page, '#dynamic-time')).toEqual('Not dynamic')

    // dynamicTime depends on passage of some time
    await waitForMs(100)

    // dynamicTime does not match captured dynamicTime
    await page.click('#lang-switcher-with-nuxt-link-nl')
    await waitForURL(page, '/nl')
    expect(await getText(page, '#dynamic-time')).to.not.equal(dynamicTime)
  })

  test('locales are fetched on demand', async () => {
    const home = url('/')
    const { page, requests } = await renderPage(home)

    const setFromRequests = () => [...new Set(requests)].filter(x => x.includes('lazy-locale-'))

    // only default locales are fetched (en)
    await page.goto(home)
    expect(setFromRequests().filter(locale => locale.includes('fr') || locale.includes('nl'))).toHaveLength(0)

    // wait for request after navigation
    const localeRequestFr = page.waitForRequest(/lazy-locale-fr/)
    await page.click('#lang-switcher-with-nuxt-link-fr')
    await localeRequestFr

    // `fr` locale has been fetched
    expect(setFromRequests().filter(locale => locale.includes('fr'))).toHaveLength(1)

    // wait for request after navigation
    const localeRequestNl = page.waitForRequest(/lazy-locale-module-nl/)
    await page.click('#lang-switcher-with-nuxt-link-nl')
    await localeRequestNl

    // `nl` (module) locale has been fetched
    expect(setFromRequests().filter(locale => locale.includes('nl'))).toHaveLength(1)
  })

  test('can access to no prefix locale (en): /', async () => {
    const { page } = await renderPage('/')

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

    // html tag `lang` attribute with language code
    expect(await page.getAttribute('html', 'lang')).toEqual('en-US')
  })

  test('can access to prefix locale: /fr', async () => {
    const { page } = await renderPage('/fr')

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

    // html tag `lang` attribute with language code
    expect(await page.getAttribute('html', 'lang')).toEqual('fr-FR')
  })

  test('multiple lazy loading', async () => {
    const { page } = await renderPage('/en-GB')

    // `en` base rendering
    expect(await getText(page, '#home-header')).toEqual('Homepage')
    expect(await getText(page, 'title')).toEqual('Homepage')
    expect(await getText(page, '#link-about')).toEqual('About us')

    expect(await getText(page, '#profile-js')).toEqual('Profile1')
    expect(await getText(page, '#profile-ts')).toEqual('Profile2')
  })

  test('files with cache disabled bypass caching', async () => {
    const { page, consoleLogs: logs } = await renderPage('/')

    const { findKey } = await localeLoaderHelpers()

    await page.click('#lang-switcher-with-nuxt-link-en-GB')
    expect(logs.filter(log => log.text.includes(`${findKey('en-GB', 'js')} bypassing cache!`))).toHaveLength(1)

    await page.click('#lang-switcher-with-nuxt-link-fr')
    expect(logs.filter(log => log.text.includes(`${findKey('fr', 'json5')} bypassing cache!`))).toHaveLength(1)

    await page.click('#lang-switcher-with-nuxt-link-en-GB')
    expect(logs.filter(log => log.text.includes(`${findKey('en-GB', 'js')} bypassing cache!`))).toHaveLength(2)

    await page.click('#lang-switcher-with-nuxt-link-fr')
    expect(logs.filter(log => log.text.includes(`${findKey('fr', 'json5')} bypassing cache!`))).toHaveLength(2)
  })

  test('manually loaded messages can be used in translations', async () => {
    const { page } = await renderPage('/manual-load')

    expect(await getText(page, '#welcome-english')).toEqual('Welcome!')
    expect(await getText(page, '#welcome-dutch')).toEqual('Welkom!')
  })
})
