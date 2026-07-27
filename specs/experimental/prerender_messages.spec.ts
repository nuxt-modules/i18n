import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

import { setup, useTestContext } from '../utils'

// its own fixture: this build prerenders, and sharing a rootDir with the specs that run alongside
// it made the build directory race on windows
await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/prerender_messages`, import.meta.url))
})

describe('experimental.prerenderMessages', () => {
  test('bakes a messages file only for the locales the endpoint can deliver', () => {
    const messagesDir = join(useTestContext().nuxt!.options.nitro.output!.dir!, 'public/_i18n')
    // `_i18n/<hash>/<locale>/messages.json`
    const prerendered = readdirSync(messagesDir).flatMap(hash => readdirSync(join(messagesDir, hash)))

    // `dyn` runs a loader so a baked file would freeze it, and `fn` would lose its message
    // function - both keep loading through their loaders instead
    expect(prerendered.sort()).toEqual(['en'])
  })
})
