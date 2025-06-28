import { test, expect, describe, beforeEach } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, fetch } from '../utils'
import { renderPage, setServerRuntimeConfig, startServerWithRuntimeConfig } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/basic`, import.meta.url)),
  browser: true,
  nuxtConfig: {
    i18n: {
      strategy: 'prefix',
      defaultLocale: 'en',
      detectBrowserLanguage: false,
      rootRedirect: { statusCode: 418, path: 'test-route' },
      redirectStatusCode: 307,
      experimental: {
        nitroContextDetection: false
      }
    }
  }
})

describe('redirectStatusCode', () => {
  test('uses custom status code', async () => {
    const res = await fetch('/about', { redirect: 'manual' })
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toEqual('/en/about')
  })

  test('does not affect root redirect option', async () => {
    const rootRes = await fetch('/', { redirect: 'manual' })
    expect(rootRes.status).toEqual(418)
    expect(rootRes.headers.get('location')).toEqual('/en/test-route')
  })
})
