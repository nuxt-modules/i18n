import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

import { $fetch, setup } from '../utils'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/lazy`, import.meta.url)),
  nuxtConfig: {
    i18n: {
      // stripping would blank every locale the rendered page did not use, hiding what is asserted
      experimental: { preload: true, stripMessagesPayload: false },
      // `de` holds message functions, which `devalue` cannot carry
      locales: [{ code: 'de', language: 'de-DE', file: 'lazy-locale-de.ts', name: 'Deutsch' }]
    }
  }
})

const payloadOf = (html: string) => /data-nuxt-i18n="[^"]*">([\s\S]*?)<\/script>/.exec(html)?.[1]

describe('experimental.preload', () => {
  test('attaches the messages payload during SSR', async () => {
    const payload = payloadOf(await $fetch('/'))
    expect(payload).toContain('Homepage')
    expect(payload).toContain('Accueil')
  })

  test('(#3880) a locale holding message functions does not cost the others their payload', async () => {
    // serializing `de` used to throw and drop the whole script, not just that locale - it is left
    // out deliberately instead, since the client loads it from its own chunk
    const payload = payloadOf(await $fetch('/de'))
    expect(payload).toContain('Homepage')
    expect(payload).not.toContain('Startseite')
  })

  test('the locale behind message functions still renders', async () => {
    expect(await $fetch('/de')).toContain('Startseite')
  })
})
