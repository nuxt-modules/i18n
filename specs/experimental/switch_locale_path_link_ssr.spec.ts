import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { $fetch, setup } from '../utils'
import { getDom, gotoPath, renderPage, startServerWithRuntimeConfig, waitForURL } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/basic_usage`, import.meta.url)),
  browser: true,
  // prerender: true,
  // overrides
  nuxtConfig: {
    runtimeConfig: {
      public: {
        i18n: {
          baseUrl: '',
          alternateLinkCanonicalQueries: false
        }
      }
    },
    i18n: {
      experimental: {
        alternateLinkCanonicalQueries: false
      }
    }
  }
})

describe('experimental.switchLocalePathLinkSSR', async () => {
  test('respects `experimental.alternateLinkCanonicalQueries`', async () => {
    const restore = await startServerWithRuntimeConfig({
      public: {
        i18n: {
          experimental: {
            alternateLinkCanonicalQueries: true
          }
        }
      }
    })

    // head tags - alt links are updated server side
    const product1Html = await $fetch('/products/big-chair?test=123&canonical=123')
    const product1Dom = getDom(product1Html)
    expect(product1Dom.querySelector('#i18n-alt-nl').href).toEqual('/nl/products/grote-stoel?canonical=123')
    expect(product1Dom.querySelector('#switch-locale-path-link-nl').href).toEqual(
      '/nl/products/grote-stoel?test=123&canonical=123'
    )

    const product2Html = await $fetch('/nl/products/rode-mok?test=123&canonical=123')
    const product2dom = getDom(product2Html)
    expect(product2dom.querySelector('#i18n-alt-en').href).toEqual('/products/red-mug?canonical=123')
    expect(product2dom.querySelector('#switch-locale-path-link-en').href).toEqual(
      '/products/red-mug?test=123&canonical=123'
    )
    await restore()
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
