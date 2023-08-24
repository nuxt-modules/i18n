import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from '../utils'
import { getText } from '../helper'

describe('#2334', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/2334`, import.meta.url))
  })

  test('should not redirect loop, when use no_prefix and ssr: false', async () => {
    const home = url('/')
    const page = await createPage()
    await page.goto(home)

    expect(await getText(page, '#top')).toEqual('Foo')
  })
})
