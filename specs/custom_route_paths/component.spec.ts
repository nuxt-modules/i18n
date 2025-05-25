import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url } from '../utils'
import { renderPage } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/basic`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      defaultLocale: 'en',
      customRoutes: 'page',
      detectBrowserLanguage: false
    }
  }
})

test('can access to custom route path', async () => {
  const { page } = await renderPage('/')

  await page.locator('#link-history').clickNavigate()
  await page.waitForURL(url('/our-history'))

  await page.goBackNavigate()
  await page.waitForURL(url('/'))

  await page.locator('#lang-switcher-with-nuxt-link .switch-to-fr').clickNavigate()
  await page.waitForURL(url('/fr'))

  await page.locator('#link-history').clickNavigate()
  await page.waitForURL(url('/fr/notre-histoire'))
})

test('can access to custom dynamic route path', async () => {
  const { page } = await renderPage('/')

  await page.locator('#link-products').clickNavigate()
  await page.waitForURL(url('/products/foo'))

  await page.goBackNavigate()
  await page.waitForURL(url('/'))

  await page.locator('#lang-switcher-with-nuxt-link .switch-to-fr').clickNavigate()
  await page.waitForURL(url('/fr'))

  await page.locator('#link-products').clickNavigate()
  await page.waitForURL(encodeURI(url('/fr/produits/foo')))
})

test('can not access to pick route path', async () => {
  const { page } = await renderPage('/')

  // click `fr` switching link
  await page.locator('#lang-switcher-with-nuxt-link .switch-to-fr').clickNavigate()
  await page.waitForURL(url('/fr'))

  // pick href with <NuxtLink>
  expect(await page.locator('#link-ignore-pick').getAttribute('href')).toBe('/fr/ignore-routes/pick')
})

test('can not access to disable route path', async () => {
  const { page } = await renderPage('/')

  // click `fr` switching link
  await page.locator('#lang-switcher-with-nuxt-link .switch-to-fr').clickNavigate()
  await page.waitForURL(url('/fr'))

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
