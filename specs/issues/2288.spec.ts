import { test,  describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { URL } from 'node:url'
import { setup, url, createPage } from '../utils'

describe('#2288', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/2288`, import.meta.url))
  })

  test('change route with setLocale', async () => {
    const page = await createPage('/')

    await page.locator('#about-en').click()
    await page.waitForURL(url('/en/about'))

    await page.locator('#ar').click()
    await page.waitForURL(url('/about'))

    await page.locator('#en').click()
    await page.waitForURL(url('/en/about'))

    await page.locator('#example-ar').click()
    await page.waitForURL(url('/ar/example'))

    await page.locator('#example-en').click()
    await page.waitForURL(url('/en/example'))
  })
})
