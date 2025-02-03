import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url } from '../utils'
import { renderPage, waitForURL } from '../helper'

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
  const { page } = await renderPage('/')

  await page.locator('#link-history').click()
  await waitForURL(page, '/our-history')

  expect(await page.url()).include('/our-history')

  await page.goBack()
  await waitForURL(page, '/')
  await page.locator('#lang-switcher-with-nuxt-link a').click()
  await waitForURL(page, '/fr')

  await page.locator('#link-history').click()
  await waitForURL(page, '/fr/notre-histoire')

  expect(await page.url()).include('/fr/notre-histoire')
})

test('can access to custom dynamic route path', async () => {
  const { page } = await renderPage('/')

  await page.locator('#link-products').click()
  await waitForURL(page, '/products/foo')

  expect(await page.url()).include('/products/foo')

  await page.goBack()
  await waitForURL(page, '/')
  await page.locator('#lang-switcher-with-nuxt-link a').click()
  await waitForURL(page, '/fr')

  await page.locator('#link-products').click()
  await waitForURL(page, encodeURI('/fr/produits/foo'))

  expect(await page.url()).include(encodeURI('/fr/produits/foo'))
})

test('can not access to pick route path', async () => {
  const { page } = await renderPage('/')

  // click `fr` switching link
  await page.locator('#lang-switcher-with-nuxt-link a').click()
  await waitForURL(page, '/fr')

  // pick href with <NuxtLink>
  expect(await page.locator('#link-ignore-pick').getAttribute('href')).toBe('/fr/ignore-routes/pick')
})

test('can not access to disable route path', async () => {
  const { page } = await renderPage('/')

  // click `fr` switching link
  await page.locator('#lang-switcher-with-nuxt-link a').click()
  await waitForURL(page, '/fr')

  // disable href with <NuxtLink>
  expect(await page.locator('#link-ignore-disable').getAttribute('href')).toBe(null)

  // disable direct url access
  let res: Awaited<ReturnType<typeof page.goto>> | (Error & { status: () => number }) | null = null
  try {
    // attempting to goto /fr/disable instead of /fr/ignore-routes/disable since
    // that route has a catch all that would succeed
    res = await page.goto(url('/fr/disable'))
  } catch (error: unknown) {
    res = error as Error & { status: () => number }
  }

  // 404
  expect(res!.status()).toBe(404) // eslint-disable-line @typescript-eslint/no-non-null-assertion
})
