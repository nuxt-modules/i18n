import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url } from '../utils'
import { getHeadSnapshot, renderPage } from '../helper'

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
    expect(await page.locator('#switch-locale-path-link-nl').getAttribute('href')).toEqual('/nl/products/grote-stoel')
    expect(await getHeadSnapshot(page)).toMatchInlineSnapshot(`
      "HTML:
        lang: en
        dir: ltr
      Link:
        canonical: http://localhost:3000/products/big-chair
        alternate[x-default]: http://localhost:3000/products/big-chair
        alternate[en]: http://localhost:3000/products/big-chair
        alternate[fr]: http://localhost:3000/fr/products/french-chair
        alternate[ja]: http://localhost:3000/ja/products/japanese-chair
        alternate[ja-JP]: http://localhost:3000/ja/products/japanese-chair
        alternate[nl]: http://localhost:3000/nl/products/grote-stoel
        alternate[nl-NL]: http://localhost:3000/nl/products/grote-stoel
      Meta:
        og:url: http://localhost:3000/products/big-chair
        og:locale: en
        og:locale:alternate: fr, ja, ja_JP, nl, nl_NL"
    `)

    await page.goto(url('/nl/products/rode-mok'))
    expect(await page.locator('#switch-locale-path-link-en').getAttribute('href')).toEqual('/products/red-mug')
    expect(await page.locator('#switch-locale-path-link-ja[data-i18n-disabled]').getAttribute('href')).toEqual('#')
    expect(await getHeadSnapshot(page)).toMatchInlineSnapshot(`
      "HTML:
        lang: nl-NL
        dir: ltr
      Link:
        canonical: http://localhost:3000/nl/products/rode-mok
        alternate[x-default]: http://localhost:3000/products/red-mug
        alternate[en]: http://localhost:3000/products/red-mug
        alternate[fr]: http://localhost:3000/fr/products/french-mug
        alternate[nl]: http://localhost:3000/nl/products/rode-mok
        alternate[nl-NL]: http://localhost:3000/nl/products/rode-mok
      Meta:
        og:url: http://localhost:3000/nl/products/rode-mok
        og:locale: nl_NL
        og:locale:alternate: en, fr, nl"
    `)
  })
})
