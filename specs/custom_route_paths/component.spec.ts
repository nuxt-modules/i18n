import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from '../utils'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/custom_route_paths_component`, import.meta.url)),
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
  await page.waitForURL('**/blog-us')

  expect(await page.url()).include('/blog-us')

  await page.goBack()
  await page.waitForURL('**/')
  await page.locator('#lang-switcher-with-nuxt-link a').click()
  await page.waitForURL('**/fr')

  await page.locator('#link-blog').click()
  await page.waitForURL('**/fr/a-blog')

  expect(await page.url()).include('/fr/a-blog')
})

test('can access to custom dynamic route path', async () => {
  const home = url('/')
  const page = await createPage()
  await page.goto(home)

  await page.locator('#link-category').click()
  await page.waitForURL('**/categories/foo')

  expect(await page.url()).include('/categories/foo')

  await page.goBack()
  await page.waitForURL('**/')
  await page.locator('#lang-switcher-with-nuxt-link a').click()
  await page.waitForURL('**/fr')

  await page.locator('#link-category').click()
  await page.waitForURL('**' + encodeURI('/fr/catégories/foo'))

  expect(await page.url()).include(encodeURI('/fr/catégories/foo'))
})
