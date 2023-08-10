import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { URL } from 'node:url'
import { setup, url, createPage } from '../utils'
import { getText } from '../helper'

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
    expect(await getText(page, '#route-path')).toEqual('/en/about')

    // change to `ar`
    await page.locator('#ar').click()
    expect(await getText(page, '#route-path')).toEqual('/about')

    // change to `en`
    await page.locator('#en').click()
    expect(await getText(page, '#route-path')).toEqual('/en/about')

    // goto to `/ar/example`
    await page.locator('#ar-example').click()
    expect(await getText(page, '#route-path')).toEqual('/example')

    // change to `en`
    await page.locator('#en').click()
    expect(await getText(page, '#route-path')).toEqual('/en/example')
  })
})
