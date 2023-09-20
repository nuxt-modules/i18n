import { test, describe, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, createPage, url } from '../utils'
import { getText } from '../helper'

describe('#2151', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/2151`, import.meta.url)),
    browser: true
  })

  test('should load resources with `autoImport` disabled', async () => {
    const home = url('/')
    const page = await createPage(undefined, { locale: 'ja' }) // set browser locale

    await page.goto(home)
    expect(await getText(page, '#msg')).toEqual('日本語のメッセージ')

    await page.goto(url('/en'))
    expect(await getText(page, '#msg')).toEqual('English message')
  })
})
