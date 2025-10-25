import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, createPage, url } from '../utils'

describe('#2247', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/2247`, import.meta.url)),
  })

  test('navigate on `prefix_and_default`', async () => {
    const home = url('/')
    const page = await createPage()
    await page.goto(home)
    const routePath = page.locator('#route-path')

    await page.locator('#root-en').click()
    await page.waitForURL(url('/en'))
    expect(await routePath.innerText()).include('/en')

    await page.locator('#root').click()
    await page.waitForURL(url('/'))
    expect(await routePath.innerText()).include('/')

    await page.locator('#about-en').click()
    await page.waitForURL(url('/en/about'))
    expect(await routePath.innerText()).include('/en/about')

    await page.locator('#root').click()
    await page.waitForURL(url('/'))
    expect(await routePath.innerText()).include('/')

    await page.locator('#about').click()
    await page.waitForURL(url('/about'))
    expect(await routePath.innerText()).include('/about')

    await page.locator('#about-ar').click()
    await page.waitForURL(url('/ar/about'))
    expect(await routePath.innerText()).include('/ar/about')

    await page.locator('#root').click()
    await page.waitForURL(url('/'))
    expect(await routePath.innerText()).include('/')

    await page.locator('#example-ar').click()
    await page.waitForURL(url('/ar/example'))
    expect(await routePath.innerText()).include('/ar/example')

    await page.locator('#about-ar').click()
    await page.waitForURL(url('/ar/about'))
    expect(await routePath.innerText()).include('/ar/about')

    await page.locator('#root').click()
    await page.waitForURL(url('/'))
    expect(await routePath.innerText()).include('/')
  })
})
