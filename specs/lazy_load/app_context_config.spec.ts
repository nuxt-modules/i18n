import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

import { setup, $fetch } from '../utils'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/lazy`, import.meta.url)),
  nuxtConfig: {
    i18n: {
      vueI18n: 'app-context-i18n.config'
    }
  }
})

describe('(#4150) a vue-i18n config that needs the Nuxt app', () => {
  test('leaves the server context intact instead of failing in nitro', async () => {
    const messages = await $fetch<Record<string, Record<string, unknown>>>('/_i18n/test/en/messages.json')

    expect(messages.en).toHaveProperty('home', 'Homepage')
  })

  test('is applied by the app during SSR, where its composables resolve', async () => {
    const html = await $fetch('/app-context-config')

    expect(html).toMatch(/<span id="request-host">127\.0\.0\.1:\d+<\/span>/)
  })
})
