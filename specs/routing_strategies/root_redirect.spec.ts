import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, fetch } from '../utils'
import { startServerWithRuntimeConfig } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/basic`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      strategy: 'prefix',
      defaultLocale: 'en',
      // configure `rootDirect` to object so it can be overwritten by `runtimeConfig`
      rootRedirect: { path: 'about', statusCode: 302 }
    }
  }
})

describe('rootRedirect', async () => {
  test('can redirect to rootRedirect option path', async () => {
    const restore = await startServerWithRuntimeConfig({
      public: {
        i18n: {
          rootRedirect: 'fr'
        }
      }
    })

    const res = await fetch('/')
    expect(res.url).toBe(url('/fr'))

    await restore()
  })

  test('(#2758) `statusCode` in `rootRedirect` should work with strategy "prefix"', async () => {
    const restore = await startServerWithRuntimeConfig({
      public: {
        i18n: {
          rootRedirect: { statusCode: 418, path: 'test-route' }
        }
      }
    })

    const res = await fetch(url('/'))
    expect(res.status).toEqual(418)
    expect(res.headers.get('location')).toEqual('/en/test-route')

    await restore()
  })
})
