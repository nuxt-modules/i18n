import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

import { setup, $fetch } from '../utils'

// `cacheLifetime` enables the message cache, which hands the same frozen message object to every request
await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/lazy`, import.meta.url)),
  nuxtConfig: {
    i18n: {
      vueI18n: 'flat-json-i18n.config',
      experimental: {
        cacheLifetime: 60
      },
      locales: [
        {
          code: 'fl',
          language: 'en-NZ',
          name: 'Flat keys',
          files: ['flat-keys.json']
        }
      ]
    }
  }
})

describe('cached messages with `flatJson`', () => {
  test('flat keys are translated on every request', async () => {
    // vue-i18n rewrites flat keys in place, which the cached messages reject
    for (let i = 0; i < 2; i++) {
      const html = await $fetch<string>('/fl/flat-json')

      expect(html).toContain('<span id="flat-key">Flat value</span>')
      expect(html).toContain('<span id="fallback-key">Welcome!</span>')
    }
  })

  test('the cached messages keep their flat keys', async () => {
    // the handler resolves the locale from the route, any `:hash` segment reaches it
    const messages = await $fetch<Record<string, Record<string, unknown>>>('/_i18n/test/fl/messages.json')

    expect(messages.fl).toHaveProperty(['flat.key'], 'Flat value')
    expect(messages.fl).not.toHaveProperty('flat')
  })
})
