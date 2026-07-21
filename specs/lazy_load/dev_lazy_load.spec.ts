import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, $fetch } from '../utils'

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
})
