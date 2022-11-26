import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from '@nuxt/test-utils'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/head`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      defaultLocale: 'en',
      customRoutes: 'page'
    }
  }
})

test('can access to custom route path', async () => {
  const home = url('/')
  const page = await createPage()
  await page.goto(home)

  await page.locator('#link-blog').click()
  await page.waitForTimeout(500)

  expect(await page.url()).include('/blog-us')

  await page.goBack()
  await page.locator('#lang-switcher-with-nuxt-link a').click()

  await page.locator('#link-blog').click()
  await page.waitForTimeout(100)

  expect(await page.url()).include('/fr/a-blog')
})

test('can access to custom dynamic route path', async () => {
  const home = url('/')
  const page = await createPage()
  await page.goto(home)

  await page.locator('#link-category').click()
  await page.waitForTimeout(100)

  expect(await page.url()).include('/categories/foo')

  await page.goBack()
  await page.locator('#lang-switcher-with-nuxt-link a').click()

  await page.locator('#link-category').click()
  await page.waitForTimeout(100)

  expect(await page.url()).include(encodeURI('/fr/catégories/foo'))
})
