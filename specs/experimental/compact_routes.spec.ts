import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { renderPage } from '../helper'
import { setup, url } from '../utils'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/routing`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      defaultLocale: 'en',
      strategy: 'prefix_except_default',
      experimental: {
        compactRoutes: true
      }
    }
  }
})

describe('compact routes `<NuxtPage>` keys', () => {
  it('keeps nested parent mounted across child navigation on non-default locale', async () => {
    const { page } = await renderPage('/ja/foo/bar')

    await page.locator('#counter').click()
    await page.locator('#counter').click()
    expect(await page.locator('#counter').innerText()).toEqual('parent state: 2')

    await page.locator('#to-baz').clickNavigate()
    await page.waitForURL(url('/ja/foo/baz'))

    expect(await page.locator('#child').innerText()).toEqual('child: baz')
    // parent state survives — the parent page was not remounted
    expect(await page.locator('#counter').innerText()).toEqual('parent state: 2')
  })

  it('remounts the page when the locale param changes within a compact route', async () => {
    const { page } = await renderPage('/ja/foo/bar')

    await page.locator('#counter').click()
    expect(await page.locator('#counter').innerText()).toEqual('parent state: 1')

    await page.locator('#to-fr').clickNavigate()
    await page.waitForURL(url('/fr/foo/bar'))

    // state reset — locale change remounts so transitions can trigger
    expect(await page.locator('#counter').innerText()).toEqual('parent state: 0')
  })
})
