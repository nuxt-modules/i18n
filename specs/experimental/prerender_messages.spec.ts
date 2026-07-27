import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

import { setup, useTestContext } from '../utils'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/lazy`, import.meta.url)),
  nuxtConfig: {
    i18n: {
      experimental: { prerenderMessages: true },
      // `de` holds message functions, the fixture's `en-GB` runs `defineI18nLocale` loaders
      locales: [{ code: 'de', language: 'de-DE', file: 'lazy-locale-de.ts', name: 'Deutsch' }]
    }
  }
})

describe('experimental.prerenderMessages', () => {
  test('bakes a messages file only for the locales the endpoint can deliver', () => {
    const messagesDir = join(useTestContext().nuxt!.options.nitro.output!.dir!, 'public/_i18n')
    // `_i18n/<hash>/<locale>/messages.json`
    const prerendered = readdirSync(messagesDir).flatMap(hash => readdirSync(join(messagesDir, hash)))

    // `en-GB` and `nl` run loaders (`nl` even returns `new Date()`) so a baked file would freeze
    // them, and `de` would lose its message functions - all three keep using their loaders
    expect(prerendered.sort()).toEqual(['en', 'fr'])
  })
})
