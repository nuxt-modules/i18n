import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup } from './utils'
import { getText, renderPage, waitForURL } from './helper'

await setup({
  rootDir: fileURLToPath(new URL(`./fixtures/basic`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    plugins: [fileURLToPath(new URL(`./fixtures/plugins/i18nHooks.ts`, import.meta.url))],
    i18n: { defaultLocale: 'en' }
  }
})

describe('beforeLocaleSwitch / localeSwitched', () => {
  test('<NuxtLink>', async () => {
    const { page, consoleLogs } = await renderPage('/')

    // click `fr` lang switch link
    await page.locator('#lang-switcher-with-nuxt-link a').click()
    // click `en` lang switch link
    await page.locator('#lang-switcher-with-nuxt-link a').click()

    expect(consoleLogs.find(log => log.text.includes('onBeforeLanguageSwitch en fr true'))).toBeTruthy()
    expect(consoleLogs.find(log => log.text.includes('onBeforeLanguageSwitch fr en false'))).toBeTruthy()
    expect(consoleLogs.find(log => log.text.includes('onLanguageSwitched en fr'))).toBeTruthy()

    // current locale
    expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')

    // navigate to about page
    await page.locator('#link-about').click()
    await waitForURL(page, '/fr/about')

    // navigate to home page
    await page.locator('#link-home').click()
    await waitForURL(page, '/fr')
  })

  test('setLocale', async () => {
    const { page, consoleLogs } = await renderPage('/')

    // click `fr` lang switch link
    await page.locator('#set-locale-link-fr').click()
    // click `en` lang switch link
    await page.locator('#set-locale-link-en').click()

    expect(consoleLogs.find(log => log.text.includes('onBeforeLanguageSwitch en fr true'))).toBeTruthy()
    expect(consoleLogs.find(log => log.text.includes('onLanguageSwitched en fr'))).toBeTruthy()
    expect(consoleLogs.find(log => log.text.includes('onBeforeLanguageSwitch fr en false'))).toBeTruthy()

    // current locale
    expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')
  })
})
