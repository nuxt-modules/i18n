import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from '../utils'
import { getText } from '../helper'

describe('#2315', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/2315`, import.meta.url))
  })

  test('locale scope', async () => {
    const home = url('/')
    const page = await createPage()
    await page.goto(home)

    expect(await getText(page, '#msg')).toEqual('Hello, local!')
  })
})
