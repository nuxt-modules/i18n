import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, createPage, url } from '../utils'

describe('#2247', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/2247`, import.meta.url))
  })

  test('navigate on `prefix_and_default`', async () => {
    const home = url('/')
    const page = await createPage()
    await page.goto(home)

    await page.locator('#root-en').clickNavigate()
    await page.waitForURL(url('/en'))
    expect(await page.locator('#route-path').innerText()).include('/en')

    await page.locator('#root').clickNavigate()
    await page.waitForURL(url('/'))
    expect(await page.locator('#route-path').innerText()).include('/')

    await page.locator('#about-en').clickNavigate()
    await page.waitForURL(url('/en/about'))
    expect(await page.locator('#route-path').innerText()).include('/en/about')

    await page.locator('#root').clickNavigate()
    await page.waitForURL(url('/'))
    expect(await page.locator('#route-path').innerText()).include('/')

    await page.locator('#about').clickNavigate()
    await page.waitForURL(url('/about'))
    expect(await page.locator('#route-path').innerText()).include('/about')

    await page.locator('#about-ar').clickNavigate()
    await page.waitForURL(url('/ar/about'))
    expect(await page.locator('#route-path').innerText()).include('/ar/about')

    await page.locator('#root').clickNavigate()
    await page.waitForURL(url('/'))
    expect(await page.locator('#route-path').innerText()).include('/')

    await page.locator('#example-ar').clickNavigate()
    await page.waitForURL(url('/ar/example'))
    expect(await page.locator('#route-path').innerText()).include('/ar/example')

    await page.locator('#about-ar').clickNavigate()
    await page.waitForURL(url('/ar/about'))
    expect(await page.locator('#route-path').innerText()).include('/ar/about')

    await page.locator('#root').clickNavigate()
    await page.waitForURL(url('/'))
    expect(await page.locator('#route-path').innerText()).include('/')
  })
})
