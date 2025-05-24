import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { $fetch, setup, url } from '../utils'
import { getDom, renderPage } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/basic_usage`, import.meta.url)),
  browser: true,
  // prerender: true,
  // overrides
  nuxtConfig: {
    i18n: {
      experimental: {
        strictSeo: true
      }
    }
  }
})

describe('experimental.strictSeo', async () => {
  test('dynamic parameters rendered correctly during SSR', async () => {
    const { page } = await renderPage('/')
    await page.goto(url('/products/big-chair'))
    expect(await page.locator('link[data-hid=i18n-alt-nl]').getAttribute('href')).toEqual(
      'http://localhost:3000/nl/products/grote-stoel'
    )
    expect(await page.locator('#switch-locale-path-link-nl').getAttribute('href')).toEqual('/nl/products/grote-stoel')
    expect(
      await page.evaluate(() =>
        Array.from(document.querySelectorAll(`[rel="alternate"]`)).map(
          x => x.getAttribute('hreflang') + ' ' + x.getAttribute('href')
        )
      )
    ).toMatchInlineSnapshot(`
      [
        "x-default http://localhost:3000/products/big-chair",
        "en http://localhost:3000/products/big-chair",
        "fr http://localhost:3000/fr/products/french-chair",
        "ja http://localhost:3000/ja/products/japanese-chair",
        "ja-JP http://localhost:3000/ja/products/japanese-chair",
        "nl http://localhost:3000/nl/products/grote-stoel",
        "nl-NL http://localhost:3000/nl/products/grote-stoel",
      ]
    `)

    await page.goto(url('/nl/products/rode-mok'))
    expect(await page.locator('link[data-hid=i18n-alt-en]').getAttribute('href')).toEqual(
      'http://localhost:3000/products/red-mug'
    )
    expect(await page.locator('#switch-locale-path-link-en').getAttribute('href')).toEqual('/products/red-mug')
    expect(await page.locator('#switch-locale-path-link-ja[data-i18n-disabled]').getAttribute('href')).toEqual('#')
    expect(
      await page.evaluate(() =>
        Array.from(document.querySelectorAll(`[rel="alternate"]`)).map(
          x => x.getAttribute('hreflang') + ' ' + x.getAttribute('href')
        )
      )
    ).toMatchInlineSnapshot(`
      [
        "x-default http://localhost:3000/products/red-mug",
        "en http://localhost:3000/products/red-mug",
        "fr http://localhost:3000/fr/products/french-mug",
        "nl http://localhost:3000/nl/products/rode-mok",
        "nl-NL http://localhost:3000/nl/products/rode-mok",
      ]
    `)
  })
})
