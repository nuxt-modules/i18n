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
        compactRoutes: true,
        preserveScrollOnLocaleSwitch: true
      }
    }
  }
})

describe('compact routes `<NuxtPage>` keys', () => {
  it('keeps nested parent mounted across child navigation on non-default locale', async () => {
    const { page } = await renderPage('/ja/foo/bar')

    await page.locator('#counter').click()
    await page.locator('#counter').click()
    await expect.poll(() => page.locator('#counter').innerText()).toEqual('parent state: 2')

    await page.locator('#to-baz').clickNavigate()
    await page.waitForURL(url('/ja/foo/baz'))

    await expect.poll(() => page.locator('#child').innerText()).toEqual('child: baz')
    // parent state survives — the parent page was not remounted
    await expect.poll(() => page.locator('#counter').innerText()).toEqual('parent state: 2')
  })

  it('remounts the page when the locale param changes within a compact route', async () => {
    const { page } = await renderPage('/ja/foo/bar')

    await page.locator('#counter').click()
    await expect.poll(() => page.locator('#counter').innerText()).toEqual('parent state: 1')

    await page.locator('#to-fr').clickNavigate()
    await page.waitForURL(url('/fr/foo/bar'))

    // state reset — locale change remounts so transitions can trigger
    await expect.poll(() => page.locator('#counter').innerText()).toEqual('parent state: 0')
  })
})

describe('`preserveScrollOnLocaleSwitch`', () => {
  it('keeps the scroll position when switching locale, not when changing page', async () => {
    const { page } = await renderPage('/ja/foo/bar')
    // tall enough to scroll, with the links fixed so clicking them does not scroll the page
    await page.addStyleTag({ content: 'body { min-height: 5000px } nav { position: fixed; top: 0 }' })
    const scrollY = () => page.evaluate(() => window.scrollY)

    await page.evaluate(() => window.scrollTo(0, 500))
    await page.locator('#to-fr').clickNavigate()
    await page.waitForURL(url('/fr/foo/bar'))
    // scrolling follows the navigation, give it the time to not happen
    await page.waitForTimeout(300)
    expect(await scrollY()).toBe(500)

    await page.locator('#to-baz').clickNavigate()
    await page.waitForURL(url('/fr/foo/baz'))
    await expect.poll(scrollY).toBe(0)
  })
})
