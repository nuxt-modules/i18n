import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from './utils'
import { getText, getData } from './helper'

await setup({
  rootDir: fileURLToPath(new URL(`./fixtures/fallback`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {}
  }
})

test('fallback to target lang', async () => {
  const home = url('/')
  const page = await createPage()
  await page.goto(home)

  // `en` rendering
  expect(await getText(page, '#home-header')).toEqual('Homepage')
  expect(await getText(page, 'title')).toEqual('Homepage')
  expect(await getText(page, '#link-about')).toEqual('About us')

  // click `ja` lang switch with `<NuxtLink>`
  await page.locator('#lang-switcher-with-nuxt-link-ja a').click()
  await page.waitForURL('**/ja')

  // fallback to en content translation
  expect(await getText(page, '#home-header')).toEqual('Homepage')
  expect(await getText(page, 'title')).toEqual('Homepage')
  expect(await getText(page, '#link-about')).toEqual('About us')

  // page path
  expect(await getData(page, '#home-use-async-data')).toMatchObject({ aboutPath: '/ja/about' })

  // current locale
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('ja')
})
