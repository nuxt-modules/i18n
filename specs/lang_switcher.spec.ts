import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup } from './utils'
import { getText, getData, waitForTransition, renderPage, waitForURL } from './helper'

await setup({
  rootDir: fileURLToPath(new URL(`./fixtures/switcher`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      defaultLocale: 'en',
      dynamicRouteParams: true
    }
  }
})

test('switching', async () => {
  const { page } = await renderPage('/')

  // click `fr` lang switch with `<NuxtLink>`
  await page.locator('#lang-switcher-with-nuxt-link a').click()
  await waitForTransition(page)
  await waitForURL(page, '/fr')

  // `fr` rendering
  expect(await getText(page, '#home-header')).toMatch('Accueil')
  expect(await getText(page, '#link-about')).toMatch('À propos')

  // lang switcher rendering
  expect(await getText(page, '#lang-switcher-with-nuxt-link a')).toMatch('English')
  expect(await getText(page, '#set-locale-link-en')).toMatch('English')

  // click `en` lang switch with `setLocale`
  await page.locator('#set-locale-link-en').click()
  await waitForTransition(page)
  await waitForURL(page, '/')

  // page path
  expect(await getData(page, '#home-use-async-data')).toMatchObject({
    aboutPath: '/about',
    aboutTranslation: 'About us'
  })
  expect(await page.getAttribute('#lang-switcher-with-nuxt-link a', 'href')).toMatch('/')

  // current locale
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('en')
})

test('retains query parameters', async () => {
  const { page } = await renderPage('/?foo=123')
  expect(page.url()).include('/?foo=123')

  await page.locator('#lang-switcher-with-nuxt-link a').click()
  await waitForTransition(page)
  await waitForURL(page, '/fr?foo=123')
  expect(page.url()).include('/fr?foo=123')
})

describe('dynamic route parameter', () => {
  test('basic', async () => {
    const { page } = await renderPage('/')

    // go to dynamic route page
    await page.locator('#link-post').click()
    await waitForTransition(page)
    await waitForURL(page, '/post/id')

    // click `fr` lang switch with `<NuxtLink>`
    await page.locator('#lang-switcher-with-nuxt-link a').click()
    await waitForTransition(page)
    await waitForURL(page, '/fr/post/mon-article')
    expect(await getText(page, '#post-id')).toMatch('mon-article')
    expect(await page.url()).include('mon-article')
  })

  test('catch all', async () => {
    const { page } = await renderPage('/foo/bar')

    // click `fr` lang switch with `<NuxtLink>`
    await page.locator('#lang-switcher-with-nuxt-link a').click()
    await waitForTransition(page)
    await waitForURL(page, '/fr/mon-article/xyz')
    expect(await getText(page, '#catch-all-id')).toMatch('mon-article/xyz')
    expect(await page.url()).include('mon-article/xyz')
  })
})

test('wait for page transition', async () => {
  const { page } = await renderPage('/')

  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('en')

  // click `fr` lang switching
  await page.locator('#lang-switcher-with-nuxt-link a').click()
  await waitForTransition(page)
  await waitForURL(page, '/fr')
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')

  // click `en` lang switching
  await page.locator('#lang-switcher-with-nuxt-link a').click()
  await waitForTransition(page)
  await waitForURL(page, '/')
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('en')
})

test('i18n custom block', async () => {
  const { page } = await renderPage('/')

  // click `fr` lang switch with `<NuxtLink>`
  await page.locator('#lang-switcher-with-nuxt-link a').click()
  await waitForTransition(page)

  // go to category page
  await page.locator('#link-category').click()
  await waitForTransition(page)

  expect(await getText(page, '#per-component-hello')).toMatch('Bonjour!')

  // click `en` lang switch with `<NuxtLink>`
  await page.locator('#lang-switcher-with-nuxt-link a').click()
  await waitForTransition(page)

  expect(await getText(page, '#per-component-hello')).toMatch('Hello!')
})
