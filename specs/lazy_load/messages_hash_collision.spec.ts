import { fileURLToPath } from 'node:url'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'

import { setup, fetch, useTestContext } from '../utils'

// `cacheLifetime` enables the messages.json HTTP cache (`__I18N_CACHE__`, see `isCacheEnabled`
// in src/bundler.ts). `locales` is overridden (arrays replace rather than merge) to a plain
// `en`/`en-US` pair - see the cacheability comment in the test body for why
await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/lazy`, import.meta.url)),
  nuxtConfig: {
    i18n: {
      experimental: {
        cacheLifetime: 60
      },
      locales: [
        { code: 'en', file: 'lazy-locale-en.json' },
        { code: 'en-US', file: 'lazy-locale-en.json' }
      ]
    }
  }
})

// the endpoint rejects any `:hash` that isn't the build's own content hash for the locale, so
// read the real one straight out of the built server instead of hardcoding it, which would go
// stale the moment the fixture's locale files change
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

describe('(security) messages.json cache key collision', () => {
  test('a hash colliding across the locale/hash join cannot read another locale\'s cache entry', async () => {
    const hash = findLocaleHash('en-US')

    // populate the `en-US` cache entry with a legitimate request
    const legit = await fetch(`/_i18n/${hash}/en-US/messages.json`)
    expect(legit.status).toBe(200)

    // guard against a vacuous test: if `__I18N_CACHE__` were compiled out, `maxAge` would be `-1`
    // (see `_messagesHandlerCached`) and every request would hit validation directly regardless of
    // whether the fix's reordering is in place. A positive `max-age` confirms it's compiled in
    const maxAge = Number(/max-age=(-?\d+)/.exec(legit.headers.get('cache-control') ?? '')?.[1])
    expect(maxAge).toBeGreaterThan(0)

    // the other way this could be vacuous: `shouldBypassCache` (routes/messages.ts) skips the
    // cache per locale, so an uncacheable locale can never populate an entry either. `en`/`en-US`
    // above are plain single-file locales with no `cache: false` (unlike the fixture's own
    // `en-GB`, which shares a file with `runtime-config-translation.js` and the module marks
    // uncacheable), so both are cacheable by construction - confirmed by running this exact
    // assertion against the pre-fix handler, where it fails with 200 instead of 404, proving the
    // collision really does read a cache entry rather than reaching validation on its own

    // `en` is a prefix of `en-US` followed by `-`, so this request computes the exact same cache
    // key as the legitimate one above: ['en', `US-${hash}`].join('-') === ['en-US', hash].join('-')
    const colliding = await fetch(`/_i18n/US-${hash}/en/messages.json`)
    expect(colliding.status).toBe(404)
  })
})
