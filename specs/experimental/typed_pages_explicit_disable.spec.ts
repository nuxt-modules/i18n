import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url } from '../utils'
import fs from 'node:fs/promises'
// import { exec } from 'tinyexec'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/basic_usage`, import.meta.url)),
  browser: false,
  // build: false,
  // server: false,
  // overrides
  nuxtConfig: {
    // _prepare: true,
    experimental: {
      typedPages: true
    },
    i18n: {
      experimental: {
        typedPages: false
      }
    }
  }
})

describe('`experimental.typedPages` explicitly disabled', async () => {
  test('does not generate types', async () => {
    await expect(
      fs.access(
        fileURLToPath(
          new URL(
            `../fixtures/basic_usage/.nuxt/___experimental_typed_pages_explicit_disable_spec_ts/types/typed-router-i18n.d.ts`,
            import.meta.url
          )
        )
      )
    ).rejects.toThrowError()
  })
})
