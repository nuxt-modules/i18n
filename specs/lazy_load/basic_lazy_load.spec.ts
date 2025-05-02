import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, $fetch } from '../utils'
import { waitForMs, renderPage, getDom, localeLoaderHelpers, waitForLocaleRequest } from '../helper'
import { Page } from 'playwright-core'

describe('basic lazy loading', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/lazy`, import.meta.url)),
    browser: true,
    nuxtConfig: {
      _i18nTest: true
    }
  })

  test('dynamic locale files are not cached', async () => {
    const { page } = await renderPage('/nl')

    // capture dynamicTime - simulates changing api response
    const dynamicTime = await page.locator('#dynamic-time').innerText()

    await page.click('#lang-switcher-with-nuxt-link-fr')
    await page.waitForURL(url('/fr'))
    expect(await page.locator('#dynamic-time').innerText()).toEqual('Not dynamic')

    // dynamicTime depends on passage of some time
    await page.waitForTimeout(1)

    // dynamicTime does not match captured dynamicTime
    await page.click('#lang-switcher-with-nuxt-link-nl')
    await page.waitForURL(url('/nl'))
    expect(await page.locator('#dynamic-time').innerText()).to.not.equal(dynamicTime)
  })

  // test.skip('locales are fetched on demand', async () => {
  //   const home = url('/')
  //   const { page, requests } = await renderPage(home)

  //   const setFromRequests = () => [...new Set(requests)].filter(x => x.includes('lazy-locale-'))

  //   // only default locales are fetched (en)
  //   await page.goto(home)
  //   expect(setFromRequests().filter(locale => locale.includes('fr') || locale.includes('nl'))).toHaveLength(0)

  //   // wait for request after navigation
  //   const localeRequestFr = page.waitForRequest(/lazy-locale-fr/)
  //   await page.click('#lang-switcher-with-nuxt-link-fr')
  //   await localeRequestFr

  //   // `fr` locale has been fetched
  //   expect(setFromRequests().filter(locale => locale.includes('fr'))).toHaveLength(1)

  //   // wait for request after navigation
  //   const localeRequestNl = page.waitForRequest(/lazy-locale-module-nl/)
  //   await page.click('#lang-switcher-with-nuxt-link-nl')
  //   await localeRequestNl

  //   // `nl` (module) locale has been fetched
  //   expect(setFromRequests().filter(locale => locale.includes('nl'))).toHaveLength(1)
  // })

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
      const request = waitForLocaleRequest(page, locale)
      await page.click(selector)
      expect((await request).headers()['cache-control']).toEqual('no-cache')
    }

    await clickAndAssertNoCache(page, '#lang-switcher-with-nuxt-link-en-GB', 'en-GB')
    await clickAndAssertNoCache(page, '#lang-switcher-with-nuxt-link-fr', 'fr')
    await clickAndAssertNoCache(page, '#lang-switcher-with-nuxt-link-en-GB', 'en-GB')
    await clickAndAssertNoCache(page, '#lang-switcher-with-nuxt-link-fr', 'fr')
  })

  test('manually loaded messages can be used in translations', async () => {
    const { page } = await renderPage('/manual-load')

    expect(await page.locator('#welcome-english').innerText()).toEqual('Welcome!')
    expect(await page.locator('#welcome-dutch').innerText()).toEqual('Welkom!')
  })

  test('(#3359) runtime config accessible in locale function', async () => {
    const { page } = await renderPage('/')

    // wait for request after navigation
    // const localeRequestNl = page.waitForRequest(/runtime-config-translation/)
    await page.click('#lang-switcher-with-nuxt-link-en-GB')
    // await localeRequestNl
    // await updated text
    await page.waitForFunction(
      () => document.querySelector('#runtime-config-key')?.textContent === 'runtime-config-value',
      {},
      { timeout: 5000 }
    )
    expect(await page.locator('#runtime-config-key').innerText()).toEqual('runtime-config-value')

    // trigger server-side locale loading
    const html = await $fetch('/en-GB')
    const dom = getDom(html)
    const runtimeText = dom.querySelector('#runtime-config-key')!.textContent!
    expect(runtimeText).toEqual('runtime-config-value')
  })
})
