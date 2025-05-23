import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { URL } from 'node:url'
import { setup, url, createPage } from '../utils'

describe('#2288', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/2288`, import.meta.url))
  })

  // TODO: Fix setLocale
  test('change route with setLocale', async () => {
    const home = url('/')
    const page = await createPage()
    await page.goto(home)

    // goto to `/en/about`
    await page.locator('#about-en').clickNavigate()
    await page.waitForURL(url('/en/about'))
    expect(await page.url().endsWith('/en/about')).toBe(true)

    // change to `ar`
    await page.locator('#ar').clickNavigate()
    await page.waitForURL(url('/about'))
    expect(await page.url().endsWith('/about')).toBe(true)

    // change to `en`
    await page.locator('#en').clickNavigate()
    await page.waitForURL(url('/en/about'))
    expect(await page.url().endsWith('/en/about')).toBe(true)

    // goto to `/ar/example`
    await page.locator('#example-ar').clickNavigate()
    await page.waitForURL(url('/ar/example'))
    expect(await page.url().endsWith('/ar/example')).toBe(true)

    // goto to `/en/example`
    await page.locator('#example-en').clickNavigate()
    await page.waitForURL(url('/en/example'))
    expect(await page.url().endsWith('/en/example')).toBe(true)
  })
})
