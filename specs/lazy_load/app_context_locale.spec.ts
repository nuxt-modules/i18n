import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

import { setup, $fetch } from '../utils'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/lazy`, import.meta.url)),
  nuxtConfig: {
    i18n: {
      locales: [
        {
          code: 'ap',
          language: 'en-AU',
          name: 'App context',
          files: ['lazy-locale-en.json', 'app-context-translation.ts']
        }
      ]
    }
  }
})

describe('(#3940) a locale file that needs the Nuxt app', () => {
  test('produces its messages during SSR instead of failing in nitro', async () => {
    const html = await $fetch('/ap')
    expect(html).toContain('app-context-only:runtime-config-value')
  })

  test('is not among the loaders the messages endpoint runs', async () => {
    // the handler resolves the locale from the route, any `:hash` segment reaches it
    const messages = await $fetch<Record<string, Record<string, unknown>>>('/_i18n/test/ap/messages.json')

    // the locale's other file is still served from there, the one needing the app is left out
    expect(messages.ap).toHaveProperty('home', 'Homepage')
    expect(messages.ap).not.toHaveProperty('runtimeConfigKey')
  })
})
