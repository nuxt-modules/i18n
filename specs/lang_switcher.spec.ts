import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from '@nuxt/test-utils'
import { getText, getData } from './helper'

await setup({
  rootDir: fileURLToPath(new URL(`./fixtures/switcher`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      defaultLocale: 'en'
    }
  }
})

test('<NuxtLink>', async () => {
  const home = url('/')
  const page = await createPage()
  await page.goto(home)

  // click `fr` lang switch with `<NuxtLink>`
  await page.locator('#lang-switcher-with-nuxt-link a').click()
  await page.waitForTimeout(2000)

  // `fr` rendering
  expect(await getText(page, '#home-header')).toMatch('Accueil')
  expect(await getText(page, '#link-about')).toMatch('À propos')

  // lang switcher rendering
  expect(await getText(page, '#lang-switcher-with-nuxt-link a')).toMatch('English')
  expect(await getText(page, '#set-locale-link-en')).toMatch('English')

  // page path
  expect(await getData(page, '#home-use-async-data')).toMatchObject({ aboutPath: '/fr/about' })
  expect(await page.getAttribute('#lang-switcher-with-nuxt-link a', 'href')).toMatch('/')

  // current locale
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')
})

test('setLocale', async () => {
  const home = url('/fr')
  const page = await createPage()
  await page.goto(home)

  // click `en` lang switch with `setLocale`
  await page.locator('#lang-switcher-with-set-locale a').click()
  await page.waitForTimeout(2000)

  // `en` rendering
  expect(await getText(page, '#home-header')).toMatch('Homepage')
  expect(await getText(page, '#link-about')).toMatch('About us')

  // lang switcher rendering
  expect(await getText(page, '#lang-switcher-with-nuxt-link a')).toMatch('Français')
  expect(await getText(page, '#set-locale-link-fr')).toMatch('Français')

  // page path
  expect(await getData(page, '#home-use-async-data')).toMatchObject({ aboutPath: '/about' })
  expect(await page.getAttribute('#lang-switcher-with-nuxt-link a', 'href')).toMatch('/fr')

  // current locale
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('en')
})

test.todo('wait for page transition', async () => {
  const home = url('/')
  const page = await createPage()
  await page.goto(home)

  // click `fr` lang switch with `<NuxtLink>`
  await page.locator('#lang-switcher-with-nuxt-link a').click()
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('en')
  await page.waitForTimeout(2000)
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')

  // click `en` lang switch with `setLocale`
  await page.locator('#lang-switcher-with-set-locale a').click()
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')
  await page.waitForTimeout(2000)
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('en')
})

test.todo('dynamic route parameter')
