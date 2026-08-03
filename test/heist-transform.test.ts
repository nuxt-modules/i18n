import { describe, expect, test } from 'vitest'
import { HeistPlugin } from '../src/transform/heist'

const ctx = {
  distDir: '/project/dist',
  resolver: {
    resolve: (...paths: string[]) => paths.join('/'),
  },
} as any

function getPlugin() {
  return HeistPlugin({ sourcemap: false }, ctx, {
    options: { rootDir: '/project' },
  } as any).raw({}, { framework: 'rollup' } as any) as any
}

describe('HeistPlugin', () => {
  test('replaces Nuxt runtime config with the Nitro compatibility import', async () => {
    const plugin = getPlugin()
    const result = await plugin.transform.handler(
      `import { useRuntimeConfig } from '#imports'
export const config = useRuntimeConfig as () => unknown`,
      '/project/dist/runtime/shared/utils.mjs',
    )

    expect(result.code).toContain(`from '#internal/i18n-nitro.mjs'`)
    expect(result.code).not.toContain(`from '#imports'`)
  })

  test.each([
    {
      name: 'combined',
      source: `import { useNuxtApp, useRuntimeConfig } from '#imports'`,
      expectedInternal: `import { useRuntimeConfig } from '#internal/i18n-nitro.mjs'`,
      expectedRemaining: `import { useNuxtApp } from '#imports'`,
    },
    {
      name: 'multiline',
      source: `import {
  useNuxtApp,
  useRuntimeConfig,
} from '#imports'`,
      expectedInternal: `import { useRuntimeConfig } from '#internal/i18n-nitro.mjs'`,
      expectedRemaining: `import { useNuxtApp } from '#imports'`,
    },
    {
      name: 'aliased',
      source: `import { useRuntimeConfig as getRuntimeConfig } from '#imports'`,
      expectedInternal: `import { useRuntimeConfig as getRuntimeConfig } from '#internal/i18n-nitro.mjs'`,
      expectedRemaining: undefined,
    },
    {
      name: 'combined aliases',
      source: `import { useRuntimeConfig, useRuntimeConfig as getRuntimeConfig } from '#imports'`,
      expectedInternal: `import { useRuntimeConfig, useRuntimeConfig as getRuntimeConfig } from '#internal/i18n-nitro.mjs'`,
      expectedRemaining: undefined,
    },
  ])('rewrites a $name runtime config import', async ({ source, expectedInternal, expectedRemaining }) => {
    const plugin = getPlugin()
    const result = await plugin.transform.handler(source, '/project/dist/runtime/shared/utils.mjs')

    expect(result.code).toContain(expectedInternal)
    if (expectedRemaining) {
      expect(result.code).toContain(expectedRemaining)
    } else {
      expect(result.code).not.toContain(`from '#imports'`)
    }
  })

  test('replaces the app H3 template in the server build', async () => {
    const plugin = getPlugin()
    const result = await plugin.transform.handler(
      `import { getRequestURL } from '#build/i18n-h3.mjs'`,
      '/project/dist/runtime/shared/detection.mjs',
    )

    expect(result.code).toContain(`from '#internal/i18n-nitro.mjs'`)
  })
})
