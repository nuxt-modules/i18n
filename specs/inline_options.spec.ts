import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from './utils'
// import { getText, getData } from './helper'

describe('inline options are handled correctly', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`./fixtures/inline_options`, import.meta.url)),
    browser: true
  })

  test('inline options are handled correctly', async () => {
    const home = url('/')
    const page = await createPage()
    page.goto(home)

    // Inline options provide `en` locale
    expect(await page.locator('#lang-switcher-with-nuxt-link .switch-to-en').getAttribute('href')).toEqual('/')

    // `i18n` options provides `ja` locale
    expect(await page.locator('#lang-switcher-with-nuxt-link .switch-to-ja').getAttribute('href')).toEqual('/ja')

    // I18n module provides `fr` and `nl` locales and are resolved using `langDir` from inline options
    expect(await page.locator('#lang-switcher-with-nuxt-link .switch-to-fr').getAttribute('href')).toEqual('/fr')
    expect(await page.locator('#lang-switcher-with-nuxt-link .switch-to-nl').getAttribute('href')).toEqual('/nl')
  })
})
