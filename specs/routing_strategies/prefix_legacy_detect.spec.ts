import { describe, test, expect, beforeEach } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, fetch } from '../utils'
import { startServerWithRuntimeConfig } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/basic`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      strategy: 'prefix',
      defaultLocale: 'en',
      experimental: {
        nitroContextDetection: false
      }
    }
  }
})

describe('strategy: prefix (legacy detect)', async () => {
  beforeEach(async () => {
    // use original fixture `detectBrowserLanguage` value as default for tests, overwrite here needed
    await startServerWithRuntimeConfig(
      {
        public: {
          i18n: { detectBrowserLanguage: false }
        }
      },
      true
    )
  })

  test('cannot access unprefixed urls', async () => {
    const redirectUrls = [
      ['/', '/en'],
      ['/about', '/en/about'],
      ['/category/foo', '/en/category/foo']
    ]
    for (const [pathUrl, destination] of redirectUrls) {
      const res = await fetch(pathUrl, { redirect: 'manual' })
      expect(res.status).toBe(302)
      expect(res.headers.get('location')).toBe(destination)
    }
  })
})
