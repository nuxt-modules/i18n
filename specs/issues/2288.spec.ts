import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { URL } from 'node:url'
import { setup, url, createPage } from '../utils'

describe('#2288', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/2288`, import.meta.url))
  })

  test('change route with setLocale', async () => {
    const home = url('/')
    const page = await createPage()
    await page.goto(home)

    // goto to `/en/about`
    await page.locator('#about-en').click()
    await page.waitForTimeout(10)
    expect(await page.url().endsWith('/en/about')).toBe(true)

    // change to `ar`
    await page.locator('#ar').click()
    await page.waitForTimeout(10)
    expect(await page.url().endsWith('/about')).toBe(true)

    // change to `en`
    await page.locator('#en').click()
    await page.waitForTimeout(10)
    expect(await page.url().endsWith('/en/about')).toBe(true)

    // goto to `/ar/example`
    await page.locator('#example-ar').click()
    await page.waitForTimeout(10)
    expect(await page.url().endsWith('/ar/example')).toBe(true)

    // goto to `/en/example`
    await page.locator('#example-en').click()
    await page.waitForTimeout(10)
    expect(await page.url().endsWith('/en/example')).toBe(true)
  })
})
