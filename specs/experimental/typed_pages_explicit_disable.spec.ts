import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { access } from 'node:fs/promises'
import { setup } from '../utils'

const rootDir = fileURLToPath(new URL(`../fixtures/basic_usage`, import.meta.url))
await setup({
  rootDir,
  browser: false,
  // overrides
  nuxtConfig: {
    experimental: {
      typedPages: true,
    },
    i18n: {
      experimental: {
        typedPages: false,
      },
    },
  },
})

describe('`experimental.typedPages` explicitly disabled', async () => {
  test('does not generate types', async () => {
    const typedRouterDtsFile = resolve(rootDir, '.nuxt/___experimental_typed_pages_explicit_disable_spec_ts/types/typed-router-i18n.d.ts')
    await expect(access(typedRouterDtsFile)).rejects.toThrowError()
  })
})
