import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url } from '../utils'
import { renderPage } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/basic`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    extends: [fileURLToPath(new URL(`../fixtures/layers/layer-pages-custom-src-dir`, import.meta.url))],
    i18n: {
      defaultLocale: 'en',
      customRoutes: 'config',
      pages: {
        'category/[slug]': false,
        history: {
          fr: false
        },
        'about/index': {
          fr: '/about-fr'
        },
        'blog/index': {
          en: '/news'
        },
        'blog/article': {
          en: '/news/article'
        }
      },
      detectBrowserLanguage: false
    }
  }
})

test('can access to custom route path', async () => {
  const { page } = await renderPage('/')

  // click `fr` switching link
  await page.locator('#lang-switcher-with-nuxt-link .switch-to-fr').clickNavigate()
  await page.waitForURL(url('/fr'))

  // page path
  expect(JSON.parse(await page.locator('#home-use-async-data').innerText())).toMatchObject({
    aboutPath: '/fr/about-fr'
  })

  // navigate to about page for `fr`
  await page.locator('#link-about').clickNavigate()
  await page.waitForURL(url('/fr/about-fr'))

  expect(await page.locator('#about-header').innerText()).toEqual('À propos')
  expect(await page.locator('#lang-switcher-current-locale code').innerText()).toEqual('fr')
  await page.waitForURL(url('/fr/about-fr'))
})

test('can access to custom nested route path', async () => {
  const { page } = await renderPage('/')

  // navigate to blog index page
  await page.locator('#link-blog').clickNavigate()
  await page.waitForURL(url('/news'))

  // navigate to blog article page
  await page.locator('#link-blog-article').clickNavigate()
  await page.waitForURL(url('/news/article'))
})

test('can not access to pick route path', async () => {
  const { page } = await renderPage('/')

  // click `fr` switching link
  await page.locator('#lang-switcher-with-nuxt-link .switch-to-fr').clickNavigate()
  await page.waitForURL(url('/fr'))

  // disable href with <NuxtLink>
  expect(await page.locator('#link-history').getAttribute('href')).toBe(null)

  // disable direct url access
  let res: Awaited<ReturnType<typeof page.goto>> | (Error & { status: () => number }) | null = null
  try {
    res = await page.goto(url('/fr/history'))
  } catch (error: unknown) {
    res = error as Error & { status: () => number }
  }
  // 404
  expect(res!.status()).toBe(404) // eslint-disable-line @typescript-eslint/no-non-null-assertion
})

test('can not access to disable route path', async () => {
  const { page } = await renderPage('/')

  // click `fr` switching link
  await page.locator('#lang-switcher-with-nuxt-link .switch-to-fr').clickNavigate()
  await page.waitForURL(url('/fr'))

  // disable href with <NuxtLink>
  expect(await page.locator('#link-category').getAttribute('href')).toBe(null)

  // disable direct url access
  let res: Awaited<ReturnType<typeof page.goto>> | (Error & { status: () => number }) | null = null
  try {
    res = await page.goto(url('/fr/category/test'))
  } catch (error: unknown) {
    res = error as Error & { status: () => number }
  }
  // 404
  expect(res!.status()).toBe(404) // eslint-disable-line @typescript-eslint/no-non-null-assertion
})

test('#3076 - layer with custom `srcDir`', async () => {
  const { page } = await renderPage('/custom-layer/custom')

  await page.click(`#custom-page-lang-switcher-with-nuxt-link .switch-to-fr`)
  await page.waitForURL(url('/fr/custom-layer-french/custom'))
})
