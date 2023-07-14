import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, createPage, url } from '../utils'
import { getText } from '../helper'

describe('#2226', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/2226`, import.meta.url))
  })

  test('navigate on `prefix_and_default`', async () => {
    const home = url('/')
    const page = await createPage()
    await page.goto(home)

    await page.locator('#lang-switch').click()
    expect(await getText(page, '#default-locale')).include(`Default locale: false`)

    await page.locator('#goto-about').click()
    expect(await getText(page, '#content')).include(`This is about page. To home page`)

    await page.locator('#goto-index').click()
    expect(await getText(page, '#content')).include(`This is home page. To about pag`)

    await page.locator('#lang-switch').click()
    await page.locator('#goto-about').click()
    expect(await getText(page, '#content')).include(`This is about page. To home page`)
    // expect((await page.url()).endsWith('en')).toBe(true)
    // expect(await getText(page, '#app')).include('PROD [ "Test" ]')
    // expect(await getText(page, '#app')).include(`yeah! it's finally working in prod too`)
  })
})
