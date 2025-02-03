import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { $fetch, setup } from '../utils'
import { getDom, gotoPath, renderPage, waitForURL } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/basic_usage`, import.meta.url)),
  browser: true,
  // prerender: true,
  // overrides
  nuxtConfig: {
    runtimeConfig: {
      public: {
        i18n: {
          baseUrl: ''
        }
      }
    },
    i18n: {
      experimental: {
        switchLocalePathLinkSSR: true
      }
    }
  }
})

describe('experimental.switchLocalePathLinkSSR', async () => {
  test('dynamic parameters render and update reactively client-side', async () => {
    const { page } = await renderPage('/products/big-chair')

    expect(await page.locator('#switch-locale-path-link-nl').getAttribute('href')).toEqual('/nl/products/grote-stoel')

    await gotoPath(page, '/nl/products/rode-mok')
    expect(await page.locator('#switch-locale-path-link-en').getAttribute('href')).toEqual('/products/red-mug')

    // Translated params are not lost on query changes
    await page.locator('#params-add-query').click()
    await waitForURL(page, '/nl/products/rode-mok?test=123')
    expect(await page.locator('#switch-locale-path-link-en').getAttribute('href')).toEqual('/products/red-mug?test=123')

    await page.locator('#params-remove-query').click()
    await waitForURL(page, '/nl/products/rode-mok')
    expect(await page.locator('#switch-locale-path-link-en').getAttribute('href')).toEqual('/products/red-mug')
  })

  test('dynamic parameters rendered correctly during SSR', async () => {
    // head tags - alt links are updated server side
    const product1Html = await $fetch('/products/big-chair')
    const product1Dom = getDom(product1Html)
    expect(product1Dom.querySelector('#i18n-alt-nl').href).toEqual('/nl/products/grote-stoel')
    expect(product1Dom.querySelector('#switch-locale-path-link-nl').href).toEqual('/nl/products/grote-stoel')

    const product2Html = await $fetch('/nl/products/rode-mok')
    const product2dom = getDom(product2Html)
    expect(product2dom.querySelector('#i18n-alt-en').href).toEqual('/products/red-mug')
    expect(product2dom.querySelector('#switch-locale-path-link-en').href).toEqual('/products/red-mug')
  })

  test('encode localized path to prevent XSS', async () => {
    const url = `/experimental//"><script>console.log('xss')</script><`

    const html = await $fetch(url)
    const dom = getDom(html)

    // the localized should be the same as encoded
    expect(dom.querySelector('#slp-xss a').href).toEqual(encodeURI('/nl' + url))
  })
})
