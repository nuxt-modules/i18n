import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { $fetch, setup } from '../utils'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/basic`, import.meta.url)),
  // exercises `nuxt generate` — the original bug caused prerender to fail
  prerender: true,
  // overrides
  nuxtConfig: {
    i18n: {
      detectBrowserLanguage: {
        redirectOn: 'no prefix'
      }
    }
  }
})

describe('#3929 - route groups with `detectBrowserLanguage.redirectOn: "no prefix"` during prerender', () => {
  test('prerenders pages inside a route group', async () => {
    const html = await $fetch('/foo')
    expect(html).toContain('Foo (group)')
  })

  test('prerenders pages inside nested route groups', async () => {
    const html = await $fetch('/bar')
    expect(html).toContain('Bar (group/nested)')
  })

  test('prerenders localized pages inside route groups', async () => {
    const fooFr = await $fetch('/fr/foo')
    expect(fooFr).toContain('Foo (group)')

    const barFr = await $fetch('/fr/bar')
    expect(barFr).toContain('Bar (group/nested)')
  })
})
