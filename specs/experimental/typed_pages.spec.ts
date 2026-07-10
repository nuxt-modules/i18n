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
  const buildDir = resolve(rootDir, '.nuxt/___experimental_typed_pages_spec_ts')

  test('generates route types', async () => {
    const typedRouterDts = readFileSync(resolve(buildDir, 'types/typed-router-i18n.d.ts'), 'utf-8')

    // Check for the interface definition
    expect(typedRouterDts).toMatch(/export interface RouteNamedMapI18n \{/)
    // Check for the route definition (accommodates both single-line and multi-line formatting)
    expect(typedRouterDts).toMatch(/'category-slug':\s*RouteRecordInfo<\s*'category-slug',\s*'\/category\/:slug\(\)',\s*\{\s*slug:\s*ParamValue<true>\s*\},\s*\{\s*slug:\s*ParamValue<false>\s*\}/)

    // All occurrences must be renamed, or the interface merges with the one
    // from Nuxt's typed-router.d.ts and pollutes `RouteMap` (#3962)
    expect(typedRouterDts).not.toMatch(/\bRouteNamedMap\b/)
    expect(typedRouterDts).not.toMatch(/\b_RouteFileInfoMap\b/)
  })

  test('vue-router augmentation resolves its type references', async () => {
    const pluginDts = readFileSync(resolve(buildDir, 'types/i18n-plugin.d.ts'), 'utf-8')

    // Names used inside the `declare module 'vue-router'` block resolve against the file
    // scope, not the augmented module; without these imports `skipLibCheck` silently turns
    // the augmentation types into `any`, disabling route narrowing entirely (#3962)
    for (const name of pluginDts.matchAll(/\b(TypesConfig|RouteMapGeneric|RouteLocation\w*(?:Generic|TypedList))\b/g)) {
      expect(pluginDts).toMatch(new RegExp(`import type \\{[^}]*\\b${name[1]}\\b[^}]*\\} from 'vue-router'`, 's'))
    }
    // removed in vue-router v5
    expect(pluginDts).not.toContain('_LiteralUnion')

    // narrowing itself is asserted by the `typed_routes` fixture, part of `test:types`
  })
})
