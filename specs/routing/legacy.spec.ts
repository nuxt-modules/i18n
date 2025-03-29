import { fileURLToPath } from 'node:url'
import { describe, it } from 'vitest'

import { setup } from '../utils'
import { localeRouteTests, switchLocalePathTests } from './routing-tests'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/routing`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      vueI18n: 'i18n-legacy.config.ts',
      customRoutes: 'config',
      pages: {}
    }
  }
})

describe('localeRoute', async () => {
  it('should work', async () => {
    await localeRouteTests()
  })
})

describe('switchLocalePath', async () => {
  it('should work', async () => {
    await switchLocalePathTests()
  })
})
