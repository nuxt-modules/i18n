import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, $fetch, fetch } from '../utils'

describe('lazy loading (dev mode + app directory)', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/lazy`, import.meta.url)),
    dev: true
  })

  test('(#4049) dynamic locale files are loaded during dev SSR', async () => {
    const html: string = await $fetch('/en-GB')
    // dynamic `.js` locale file fetching `/api/en-GB`
    expect(html).toContain('Profile1')
    // static `.ts` locale file
    expect(html).toContain('Profile2')
    // dynamic locale file using `useRuntimeConfig`
    expect(html).toContain('runtime-config-value')
  })

  test('(#4171) `useI18n()` outside of a component explains the alternative', async () => {
    const res = await fetch('/en-GB?useI18n', { headers: { accept: 'application/json' } })
    const error = await res.json()
    expect(error.message).toContain('use `useNuxtApp().$i18n` instead')
    expect(error.message).toMatch(/while running route middleware `.*middleware\/use-i18n\.global\.ts`/)
    // trace starts at the caller
    expect(error.stack[1]).toContain('middleware/use-i18n.global.ts')
  })
})
