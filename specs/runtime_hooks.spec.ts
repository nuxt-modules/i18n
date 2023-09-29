import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from './utils'
import { getText } from './helper'

await setup({
  rootDir: fileURLToPath(new URL(`./fixtures/runtime_hook`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    plugins: [fileURLToPath(new URL(`./fixtures/plugins/i18nHooks.ts`, import.meta.url))],
    i18n: { defaultLocale: 'en' }
  }
})

describe('beforeLocaleSwitch / localeSwitched', () => {
  test('<NuxtLink>', async () => {
    const home = url('/')
    const page = await createPage()
    const messages: string[] = []
    page.on('console', msg => messages.push(msg.text()))
    await page.goto(home)

    // click `fr` lang switch link
    await page.locator('#lang-switcher-with-nuxt-link a').click()
    // click `en` lang switch link
    await page.locator('#lang-switcher-with-nuxt-link a').click()

    expect(messages.find(m => m.includes('onBeforeLanguageSwitch en fr true'))).toBeTruthy()
    expect(messages.find(m => m.includes('onLanguageSwitched en fr'))).toBeTruthy()
    expect(messages.find(m => m.includes('onBeforeLanguageSwitch fr en false'))).toBeTruthy()

    // current locale
    expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')

    // navigate to about page
    await page.locator('#link-about').click()
    await page.waitForURL('**/fr/about')

    // navigate to home page
    await page.locator('#link-home').click()
    await page.waitForURL('**/fr')
  })

  test('setLocale', async () => {
    const home = url('/')
    const page = await createPage()
    const messages: string[] = []
    page.on('console', msg => messages.push(msg.text()))
    await page.goto(home)

    // click `fr` lang switch link
    await page.locator('#set-locale-link-fr').click()
    // click `en` lang switch link
    await page.locator('#set-locale-link-en').click()

    expect(messages.find(m => m.includes('onBeforeLanguageSwitch en fr true'))).toBeTruthy()
    expect(messages.find(m => m.includes('onLanguageSwitched en fr'))).toBeTruthy()
    expect(messages.find(m => m.includes('onBeforeLanguageSwitch fr en false'))).toBeTruthy()

    // current locale
    expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')
  })
})
