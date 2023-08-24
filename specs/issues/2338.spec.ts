import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from '../utils'
import { getData } from '../helper'

describe('#2338', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/2338`, import.meta.url))
  })

  test('should be extened API', async () => {
    const home = url('/')
    const page = await createPage()
    await page.goto(home)

    const globalData = await getData(page, '#global')
    expect(globalData.code).toEqual('nl')
    const localeData = await getData(page, '#local')
    expect(localeData.code).toEqual('nl')
  })
})
