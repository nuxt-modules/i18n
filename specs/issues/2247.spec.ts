import { test, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, createPage, url } from '../utils'

describe('#2247', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/2247`, import.meta.url))
  })

  test('navigate on `prefix_and_default`', async () => {
    const page = await createPage('/')

    await page.locator('#root-en').click()
    await page.waitForURL(url('/en'))

    await page.locator('#root').click()
    await page.waitForURL(url('/'))

    await page.locator('#about-en').click()
    await page.waitForURL(url('/en/about'))

    await page.locator('#root').click()
    await page.waitForURL(url('/'))

    await page.locator('#about').click()
    await page.waitForURL(url('/about'))

    await page.locator('#about-ar').click()
    await page.waitForURL(url('/ar/about'))

    await page.locator('#root').click()
    await page.waitForURL(url('/'))

    await page.locator('#example-ar').click()
    await page.waitForURL(url('/ar/example'))

    await page.locator('#about-ar').click()
    await page.waitForURL(url('/ar/about'))

    await page.locator('#root').click()
    await page.waitForURL(url('/'))
  })
})
