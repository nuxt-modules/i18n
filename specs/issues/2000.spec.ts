import { test, describe, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, createPage, url } from '../utils'
import { getText } from '../helper'

describe('#2000', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/2000`, import.meta.url)),
    browser: true
    // prerender: true
  })

  test('should be loaded vue-i18n messages', async () => {
    const home = url('/')
    const page = await createPage()
    await page.goto(home)

    expect(await getText(page, '#render')).toEqual('hello, '.repeat(8 * 1024 * 500))
  })
})
