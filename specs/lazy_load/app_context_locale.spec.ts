import { fileURLToPath } from 'node:url'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'

import { setup, $fetch, useTestContext } from '../utils'

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

// the endpoint rejects any `:hash` that isn't the build's own content hash for the locale (see
// `computeLocaleHashes` in `src/utils.ts`), so read the real one straight out of the built server
// instead of hardcoding it, which would go stale the moment the fixture's locale files change
function findLocaleHash(locale: string) {
  const chunksDir = join(useTestContext().nuxt!.options.nitro!.output!.dir!, 'server/chunks')
  const pattern = new RegExp(`"${locale}":\\s*"([a-f0-9]+)"`)

  for (const name of readdirSync(chunksDir, { recursive: true }) as string[]) {
    if (!name.endsWith('.mjs')) continue
    const match = pattern.exec(readFileSync(join(chunksDir, name), 'utf-8'))
    if (match) return match[1]!
  }

  throw new Error(`Could not find the build's content hash for locale '${locale}'`)
}

describe('(#3940) a locale file that needs the Nuxt app', () => {
  test('produces its messages during SSR instead of failing in nitro', async () => {
    const html = await $fetch('/ap')
    expect(html).toContain('app-context-only:runtime-config-value')
  })

  test('is not among the loaders the messages endpoint runs', async () => {
    const messages = await $fetch<Record<string, Record<string, unknown>>>(
      `/_i18n/${findLocaleHash('ap')}/ap/messages.json`
    )

    // the locale's other file is still served from there, the one needing the app is left out
    expect(messages.ap).toHaveProperty('home', 'Homepage')
    expect(messages.ap).not.toHaveProperty('runtimeConfigKey')
  })
})
