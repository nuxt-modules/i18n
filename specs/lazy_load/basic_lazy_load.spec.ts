import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, $fetch } from '../utils'
import { renderPage, getDom, waitForLocaleNetwork, getLocalesMessageKeyCount } from '../helper'
import { Page } from 'playwright-core'

describe('basic lazy loading', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/lazy`, import.meta.url)),
    browser: true
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
    await Promise.all([waitForLocaleNetwork(page, 'fr', 'response'), page.click('#nuxt-locale-link-fr')])

    // `fr` locale has been fetched
    expect(await getLocalesMessageKeyCount(page)).toMatchInlineSnapshot(`
      {
        "en": 7,
        "fr": 5,
      }
    `)

    // navigate and wait for locale file request
    await Promise.all([waitForLocaleNetwork(page, 'nl', 'response'), page.click('#nuxt-locale-link-nl')])

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
    const { page } = await renderPage('/')

    async function clickAndAssertNoCache(page: Page, selector: string, locale: string) {
      const request = waitForLocaleNetwork(page, locale, 'request')
      await page.click(selector)
      expect((await request).headers()['cache-control']).toEqual('no-cache')
    }

    await clickAndAssertNoCache(page, '#nuxt-locale-link-en-GB', 'en-GB')
    await clickAndAssertNoCache(page, '#nuxt-locale-link-fr', 'fr')
    await clickAndAssertNoCache(page, '#nuxt-locale-link-en-GB', 'en-GB')
    await clickAndAssertNoCache(page, '#nuxt-locale-link-fr', 'fr')
  })

  test('manually loaded messages can be used in translations', async () => {
    const { page } = await renderPage('/manual-load')

    expect(await page.locator('#welcome-english').innerText()).toEqual('Welcome!')
    expect(await page.locator('#welcome-dutch').innerText()).toEqual('Welkom!')
  })

  test('(#3359) runtime config accessible in locale function', async () => {
    const { page } = await renderPage('/')

    // check initial text value before translation has been loaded
    expect(await page.locator('#runtime-config-key').textContent()).toEqual('runtimeConfigKey')

    await Promise.all([waitForLocaleNetwork(page, 'en-GB', 'response'), page.click('#nuxt-locale-link-en-GB')])

    // check text value after translation has been loaded
    expect(await page.locator('#runtime-config-key').textContent()).toEqual('runtime-config-value')

    // trigger server-side locale loading
    const html = await $fetch('/en-GB')
    const runtimeText = getDom(html).querySelector('#runtime-config-key')!.textContent!
    expect(runtimeText).toEqual('runtime-config-value')
  })
})
