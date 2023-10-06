import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url } from '../utils'
import { getText, getData, renderPage, waitForURL } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/basic`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
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
      }
    }
  }
})

test('can access to custom route path', async () => {
  const { page } = await renderPage('/')

  // click `fr` switching link
  await page.locator('#lang-switcher-with-nuxt-link a').click()
  await waitForURL(page, '/fr')

  // page path
  expect(await getData(page, '#home-use-async-data')).toMatchObject({ aboutPath: '/fr/about-fr' })

  // navigate to about page for `fr`
  await page.locator('#link-about').click()
  await waitForURL(page, '/fr/about-fr')

  expect(await getText(page, '#about-header')).toEqual('À propos')
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')
  expect(await page.url()).include('/fr/about-fr')
})

test('can access to custom nested route path', async () => {
  const { page } = await renderPage('/')

  // navigate to blog index page
  await page.locator('#link-blog').click()
  await waitForURL(page, '/news')

  expect(await page.url()).include('/news')

  // navigate to blog article page
  await page.locator('#link-blog-article').click()
  await waitForURL(page, '/news/article')

  expect(await page.url()).include('/news/article')
})

test('can not access to pick route path', async () => {
  const { page } = await renderPage('/')

  // click `fr` switching link
  await page.locator('#lang-switcher-with-nuxt-link a').click()
  await waitForURL(page, '/fr')

  // disalbe href with <NuxtLink>
  expect(await page.locator('#link-history').getAttribute('href')).toBe(null)

  // disalbe direct url access
  let res: Response | (Error & { status: () => number }) | null = null
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
  await page.locator('#lang-switcher-with-nuxt-link a').click()
  await waitForURL(page, '/fr')

  // disalbe href with <NuxtLink>
  expect(await page.locator('#link-category').getAttribute('href')).toBe(null)

  // disalbe direct url access
  let res: Response | (Error & { status: () => number }) | null = null
  try {
    res = await page.goto(url('/fr/category/test'))
  } catch (error: unknown) {
    res = error as Error & { status: () => number }
  }
  // 404
  expect(res!.status()).toBe(404) // eslint-disable-line @typescript-eslint/no-non-null-assertion
})
