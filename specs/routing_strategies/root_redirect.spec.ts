import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, fetch } from '../utils'
import { setServerRuntimeConfig, startServerWithRuntimeConfig } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/basic`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      strategy: 'prefix',
      defaultLocale: 'en',
      // configure `rootDirect` to object so it can be overwritten by `runtimeConfig`
      rootRedirect: { path: 'about', statusCode: 302 },
      detectBrowserLanguage: false
    }
  }
})

describe('rootRedirect', async () => {
  test('can redirect to rootRedirect option path', async () => {
    await startServerWithRuntimeConfig(
      {
        public: {
          i18n: {
            rootRedirect: 'fr'
          }
        }
      },
      true
    )

    const res = await fetch('/')
    expect(res.url).toBe(url('/fr'))
  })
  test('keeps query params when redirecting', async () => {
    await startServerWithRuntimeConfig(
      {
        public: {
          i18n: {
            rootRedirect: 'fr'
          }
        }
      },
      true
    )
    const res = await fetch('/?foo=bar')
    expect(res.url).toBe(url('/fr?foo=bar'))
  })

  test('(#2758) `statusCode` in `rootRedirect` should work with strategy "prefix"', async () => {
    await startServerWithRuntimeConfig(
      {
        public: {
          i18n: {
            rootRedirect: { statusCode: 418, path: 'test-route' }
          }
        }
      },
      true
    )

    const res = await fetch(url('/'))
    expect(res.status).toEqual(418)
    expect(res.headers.get('location')).toEqual('/en/test-route')
  })
})
