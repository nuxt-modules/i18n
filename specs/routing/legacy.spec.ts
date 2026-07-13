import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { gotoPath, renderPage } from '../helper'
import { setup } from '../utils'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/routing`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      vueI18n: 'i18n-legacy.config.ts'
    }
  }
})

/**
 * Smoke test for vue-i18n legacy API mode — the module reads locale state
 * through the `VueI18n` instance instead of a `Composer` (see `getI18nTarget`
 * in src/runtime/compatibility.ts). Routing behavior itself is unit tested
 * against the routing context (test/kit.test.ts, test/custom-routes.test.ts).
 */
describe('vue-i18n legacy API mode', () => {
  it('initializes the plugin and provides working routing composables', async () => {
    const { page } = await renderPage('/en')

    expect(await page.locator('#switch-locale-path .en').innerText()).toEqual('/en')
    expect(await page.locator('#switch-locale-path .ja').innerText()).toEqual('/ja')
    expect(await page.locator('#locale-path .about').innerText()).toEqual('/en/about')

    // locale switch updates state through the legacy instance
    await gotoPath(page, '/ja/about')
    expect(await page.locator('#switch-locale-path .en').innerText()).toEqual('/en/about')
    expect(await page.locator('#switch-locale-path .ja').innerText()).toEqual('/ja/about')
  })
})
