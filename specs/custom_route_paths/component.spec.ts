import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from '../utils'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/basic`, import.meta.url)),
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

  await page.locator('#link-history').click()
  await page.waitForURL('**/our-history')

  expect(await page.url()).include('/our-history')

  await page.goBack()
  await page.waitForURL('**/')
  await page.locator('#lang-switcher-with-nuxt-link a').click()
  await page.waitForURL('**/fr')

  await page.locator('#link-history').click()
  await page.waitForURL('**/fr/notre-histoire')

  expect(await page.url()).include('/fr/notre-histoire')
})

test('can access to custom dynamic route path', async () => {
  const home = url('/')
  const page = await createPage()
  await page.goto(home)

  await page.locator('#link-products').click()
  await page.waitForURL('**/products/foo')

  expect(await page.url()).include('/products/foo')

  await page.goBack()
  await page.waitForURL('**/')
  await page.locator('#lang-switcher-with-nuxt-link a').click()
  await page.waitForURL('**/fr')

  await page.locator('#link-products').click()
  await page.waitForURL('**' + encodeURI('/fr/produits/foo'))

  expect(await page.url()).include(encodeURI('/fr/produits/foo'))
})

test('can not access to pick route path', async () => {
  const home = url('/')
  const page = await createPage()
  await page.goto(home)

  // click `fr` switching link
  await page.locator('#lang-switcher-with-nuxt-link a').click()
  await page.waitForURL('**/fr')

  // pick href with <NuxtLink>
  expect(await page.locator('#link-ignore-pick').getAttribute('href')).toBe('/fr/ignore-routes/pick')
})

test('can not access to disable route path', async () => {
  const home = url('/')
  const page = await createPage()
  await page.goto(home)

  // click `fr` switching link
  await page.locator('#lang-switcher-with-nuxt-link a').click()
  await page.waitForURL('**/fr')

  // disalbe href with <NuxtLink>
  expect(await page.locator('#link-ignore-disable').getAttribute('href')).toBe(null)

  // disalbe direct url access
  let res: Response | (Error & { status: () => number }) | null = null
  try {
    res = await page.goto(url('/fr/ignore-routes/disable'))
  } catch (error: unknown) {
    res = error as Error & { status: () => number }
  }
  // 404
  expect(res!.status()).toBe(404) // eslint-disable-line @typescript-eslint/no-non-null-assertion
})
