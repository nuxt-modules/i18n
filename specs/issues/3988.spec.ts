import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { fetch, setup, url } from '../utils'
import { renderPage } from '../helper'

describe('#3988', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/3988`, import.meta.url)),
    browser: true,
    prerender: true
  })

  test('avoids hydration mismatch when browser detection redirects from prerendered root', async () => {
    const response = await fetch('/')
    expect(await response.text()).toContain('window.location.replace(')

    const { page, consoleLogs, pageErrors } = await renderPage('/', { locale: 'en' })

    await page.waitForURL(url('/en'))

    expect(await page.locator('#translated-heading').innerText()).toEqual('English heading')
    expect(await page.locator('#translated-heading-v-text').innerText()).toEqual('English heading')
    expect(await page.locator('#translated-heading-v-html').innerText()).toEqual('English heading')
    expect(await page.getAttribute('#translated-placeholder', 'placeholder')).toEqual('English heading')
    expect(await page.locator('#current-locale').innerText()).toEqual('en')
    expect(await page.getAttribute('#localized-home-link', 'href')).toEqual('/en')
    expect(await page.getAttribute('#localized-home-link-locale', 'href')).toEqual('/en')
    expect(pageErrors).toEqual([])
    expect(
      consoleLogs.some(log =>
        log.type === 'warning' && /hydration|mismatch/i.test(log.text)
      )
    ).toBe(false)
  })
})
