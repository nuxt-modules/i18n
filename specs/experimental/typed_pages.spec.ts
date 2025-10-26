import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
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
  },
})

// @see reference https://github.com/nuxt/nuxt/blob/c55db28542d29fd912889985780af70b4bb2ee2e/test/typed-router.test.ts
describe('`experimental.typedPages` undefined or enabled', async () => {
  test('generates route types', async () => {
    const typedRouterDtsFile = resolve(rootDir, '.nuxt/___experimental_typed_pages_spec_ts/types/typed-router-i18n.d.ts')
    const typedRouterDts = readFileSync(typedRouterDtsFile, 'utf-8')

    // Check for the interface definition
    expect(typedRouterDts).toMatch(/export interface RouteNamedMapI18n \{/)
    // Check for the route definition (accommodates both single-line and multi-line formatting)
    expect(typedRouterDts).toMatch(/'category-slug':\s*RouteRecordInfo<\s*'category-slug',\s*'\/category\/:slug\(\)',\s*\{\s*slug:\s*ParamValue<true>\s*\},\s*\{\s*slug:\s*ParamValue<false>\s*\}/)
  })
})
