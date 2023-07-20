import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, createPage, url } from '../utils'
import { getText } from '../helper'

describe('#2247', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/2247`, import.meta.url))
  })

  test('navigate on `prefix_and_default`', async () => {
    const home = url('/')
    const page = await createPage()
    await page.goto(home)

    await page.locator('#root-en').click()
    expect(await getText(page, '#route-path')).include('/en')

    await page.locator('#root').click()
    expect(await getText(page, '#route-path')).include('/')

    await page.locator('#about-en').click()
    expect(await getText(page, '#route-path')).include('/en/about')

    await page.locator('#root').click()
    expect(await getText(page, '#route-path')).include('/')

    await page.locator('#about').click()
    expect(await getText(page, '#route-path')).include('/about')

    await page.locator('#about-ar').click()
    expect(await getText(page, '#route-path')).include('/ar/about')

    await page.locator('#root').click()
    expect(await getText(page, '#route-path')).include('/')

    await page.locator('#example-ar').click()
    expect(await getText(page, '#route-path')).include('/ar/example')

    await page.locator('#about-ar').click()
    expect(await getText(page, '#route-path')).include('/ar/about')

    await page.locator('#root').click()
    expect(await getText(page, '#route-path')).include('/')
  })
})
