import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url } from '../utils'
import { renderPage } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/basic_usage`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      experimental: {
        strictSeo: {
          canonicalQueries: ['page']
        }
      }
    }
  }
})

describe('experimental.strictSeo object form', async () => {
  test('canonical link keeps queries listed in `canonicalQueries`', async () => {
    const { page } = await renderPage('/post/my-post?page=2&foo=bar')

    expect(await page.locator('link[rel=canonical]').getAttribute('href')).toEqual(
      'http://localhost:3000/post/my-post?page=2'
    )
    expect(await page.locator('link[rel=alternate][hreflang=fr]').getAttribute('href')).toEqual(
      'http://localhost:3000/fr/post/mon-article?page=2'
    )

    await page.goto(url('/post/my-post?foo=bar'))
    expect(await page.locator('link[rel=canonical]').getAttribute('href')).toEqual(
      'http://localhost:3000/post/my-post'
    )
  })

  test('`useSetI18nParams` seo attributes override the global `canonicalQueries`', async () => {
    // the products page passes `{ canonicalQueries: ['canonical'] }` explicitly
    const { page } = await renderPage('/products/big-chair?page=2&canonical=1')

    expect(await page.locator('link[rel=canonical]').getAttribute('href')).toEqual(
      'http://localhost:3000/products/big-chair?canonical=1'
    )
  })
})
