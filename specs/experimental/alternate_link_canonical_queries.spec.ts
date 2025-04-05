import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { $fetch, setup } from '../utils'
import { getDom } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/basic_usage`, import.meta.url)),
  browser: true,
  // prerender: true,
  // overrides
  nuxtConfig: {
    i18n: {
      experimental: {
        alternateLinkCanonicalQueries: false
      }
    }
  }
})

describe('experimental.alternateLinkCanonicalQueries', async () => {
  test('respects `experimental.alternateLinkCanonicalQueries: false`', async () => {
    // head tags - alt links are updated server side
    const product1Html = await $fetch('/products/big-chair?test=123&canonical=123')
    const product1Dom = getDom(product1Html)
    expect(product1Dom.querySelector('#i18n-alt-nl')?.getAttribute('href')).toEqual(
      'http://localhost:3000/nl/products/grote-stoel?test=123&canonical=123'
    )
    expect(product1Dom.querySelector('#switch-locale-path-link-nl')?.getAttribute('href')).toEqual(
      '/nl/products/grote-stoel?test=123&canonical=123'
    )

    const product2Html = await $fetch('/nl/products/rode-mok?test=123&canonical=123')
    const product2dom = getDom(product2Html)
    expect(product2dom.querySelector('#i18n-alt-en')?.getAttribute('href')).toEqual(
      'http://localhost:3000/products/red-mug?test=123&canonical=123'
    )
    expect(product2dom.querySelector('#switch-locale-path-link-en')?.getAttribute('href')).toEqual(
      '/products/red-mug?test=123&canonical=123'
    )
  })
})
