import { test, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup } from '@nuxt/test-utils'

describe.skip('#1721', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/1721`, import.meta.url)),
    browser: true,
    // overrides
    nuxtConfig: {
      _generate: true
    }
  })

  test('should be occured hydrate miss match', async () => {
    // TODO:
    //  if @nuxt/test-utils supports prerender build testing, we can test it.
    //
  })
})
