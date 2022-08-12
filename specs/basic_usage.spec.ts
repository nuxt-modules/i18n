import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from '@nuxt/test-utils'
import { getText } from './helper'

await setup({
  rootDir: fileURLToPath(new URL(`./fixtures/basic_usage`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      locales: ['en', 'fr'],
      defaultLocale: 'en'
    }
  }
})

test('basic usage', async () => {
  const home = url('/')
  const page = await createPage()
  await page.goto(home)

  // vue-i18n using
  expect(await getText(page, '#vue-i18n-usage p')).toEqual('Welcome')

  // URL path localizing with `useLocalePath`
  expect(await page.locator('#locale-path-usages .name a').getAttribute('href')).toEqual('/')
  expect(await page.locator('#locale-path-usages .path a').getAttribute('href')).toEqual('/')
  expect(await page.locator('#locale-path-usages .named-with-locale a').getAttribute('href')).toEqual('/')
  expect(await page.locator('#locale-path-usages .nest-path a').getAttribute('href')).toEqual('/user/profile')
  expect(await page.locator('#locale-path-usages .nest-named a').getAttribute('href')).toEqual('/user/profile')
  expect(await page.locator('#locale-path-usages .object-with-named a').getAttribute('href')).toEqual(
    '/category/nintendo'
  )
  expect(await page.locator('#locale-path-usages .omit-named-in-object a').getAttribute('href')).toEqual('/')

  // Language switching path localizing with `useSwitchLocalePath`
  expect(await page.locator('#switch-locale-path-usages .switch-to-en a').getAttribute('href')).toEqual('/')
  expect(await page.locator('#switch-locale-path-usages .switch-to-fr a').getAttribute('href')).toEqual('/fr')

  // URL path with Route object with `useLocaleRoute`
  const button = await page.locator('#locale-route-usages button')
  await button.click()
  await page.waitForTimeout(100)
  expect(await getText(page, '#profile-page')).toEqual('This is profile page')
})
