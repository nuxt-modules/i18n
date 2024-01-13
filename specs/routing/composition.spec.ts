import { fileURLToPath } from 'node:url'
import { describe, it } from 'vitest'

import { setup } from '../utils'
import { localeLocationTests, localeRouteTests, switchLocalePathTests } from './routing-tests'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/routing`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      customRoutes: 'config',
      pages: {
        // 'categories/[id]': {
        //   en: 'categories/english',
        //   ja: 'categories/japanese'
        // }
        // '[...pathMatch]': {
        //   en: { pathMatch: 'not-found-english' },
        //   ja: { pathMatch: 'not-found-japanese' }
        // }
      }
    }
  }
})

describe('localeRoute', async () => {
  it('should work', async () => {
    await localeRouteTests()
  })
})

describe('localeLocation', async () => {
  it('should work', async () => {
    await localeLocationTests()
  })
})

describe('switchLocalePath', async () => {
  it('should work', async () => {
    await switchLocalePathTests()
  })
})
