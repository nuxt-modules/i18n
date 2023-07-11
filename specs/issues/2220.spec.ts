import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, createPage, url } from '../utils'
import { getText } from '../helper'

describe('#2220', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/2220`, import.meta.url))
  })

  test('message-compiler work on server-side', async () => {
    const home = url('/')
    const page = await createPage()
    await page.goto(home)

    expect(await getText(page, '#app')).include('PROD [ "Test" ]')
    expect(await getText(page, '#app')).include(`yeah! it's finally working in prod too`)
  })
})
