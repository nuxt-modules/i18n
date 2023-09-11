import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from './utils'
import { getText, getData } from './helper'

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
  const home = url('/')
  const page = await createPage()
  await page.goto(home)

  // click `fr` lang switch with `<NuxtLink>`
  await page.locator('#lang-switcher-with-nuxt-link a').click()
  await page.waitForTimeout(1000)

  // `fr` rendering
  expect(await getText(page, '#home-header')).toMatch('Accueil')
  expect(await getText(page, '#link-about')).toMatch('À propos')

  // lang switcher rendering
  expect(await getText(page, '#lang-switcher-with-nuxt-link a')).toMatch('English')
  expect(await getText(page, '#set-locale-link-en')).toMatch('English')

  // click `en` lang switch with `setLocale`
  await page.locator('#set-locale-link-en').click()
  await page.waitForTimeout(1000)

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
  const home = url('/?foo=123')
  const page = await createPage()
  await page.goto(home)
  await page.waitForTimeout(1000)
  expect(page.url()).include('/?foo=123')

  await page.locator('#lang-switcher-with-nuxt-link a').click()
  await page.waitForTimeout(1000)
  expect(page.url()).include('/fr?foo=123')
})

describe('dynamic route parameter', () => {
  test('basic', async () => {
    const home = url('/')
    const page = await createPage()
    await page.goto(home)

    // go to dynamic route page
    await page.locator('#link-post').click()
    await page.waitForTimeout(1000)

    // click `fr` lang switch with `<NuxtLink>`
    await page.locator('#lang-switcher-with-nuxt-link a').click()
    await page.waitForTimeout(1000)
    expect(await getText(page, '#post-id')).toMatch('mon-article')
    expect(await page.url()).include('mon-article')
  })

  test('catch all', async () => {
    const notFound = url('/foo/bar')
    const page = await createPage()
    await page.goto(notFound)

    // click `fr` lang switch with `<NuxtLink>`
    await page.locator('#lang-switcher-with-nuxt-link a').click()
    await page.waitForTimeout(1000)
    expect(await getText(page, '#catch-all-id')).toMatch('mon-article/xyz')
    expect(await page.url()).include('mon-article/xyz')
  })
})

test('wait for page transition', async () => {
  const home = url('/')
  const page = await createPage()
  await page.goto(home)

  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('en')

  // click `fr` lang switching
  await page.locator('#lang-switcher-with-nuxt-link a').click()
  await page.waitForTimeout(3000)
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')

  // click `en` lang switching
  await page.locator('#lang-switcher-with-nuxt-link a').click()
  await page.waitForTimeout(3000)
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('en')
})
