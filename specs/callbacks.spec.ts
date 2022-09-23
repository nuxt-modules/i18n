import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from '@nuxt/test-utils'
import { getText } from './helper'

await setup({
  rootDir: fileURLToPath(new URL(`./fixtures/basic`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      defaultLocale: 'en',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onBeforeLanguageSwitch: (oldLocale: string, newLocale: string, initialSetup: boolean, context: any) => {
        console.log('onBeforeLanguageSwitch', oldLocale, newLocale, initialSetup, context)
        if (newLocale === 'en') {
          return 'fr'
        }
      },
      onLanguageSwitched: (oldLocale: string, newLocale: string) => {
        console.log('onLanguageSwitched', oldLocale, newLocale)
      }
    }
  }
})

test('onBeforeLanguageSwitch / onLanguageSwitched', async () => {
  const home = url('/')
  const page = await createPage()
  const messages: string[] = []
  page.on('console', msg => messages.push(msg.text()))
  await page.goto(home)

  // click `fr` lang switch link
  await page.locator('#lang-switcher-with-nuxt-link a').click()
  // click `en` lang switch link
  await page.locator('#lang-switcher-with-nuxt-link a').click()

  expect(messages[0]).include('onBeforeLanguageSwitch en fr true')
  expect(messages[1]).include('onLanguageSwitched en fr')
  expect(messages[2]).include('onBeforeLanguageSwitch fr en false')

  // current locale
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')

  // navigate to about page
  await page.locator('#link-about').click()
  await page.waitForTimeout(1000)

  // navigate to home page
  await page.locator('#link-home').click()
  await page.waitForTimeout(1000)

  // check onLanguageSwitched call duplication
  expect(messages.length).toEqual(3)
})
