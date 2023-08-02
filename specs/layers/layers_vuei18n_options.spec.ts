import { describe, test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from '../utils'
import { getText } from '../helper'

describe('nuxt layers vuei18n options', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/layer_consumer`, import.meta.url)),
    browser: true
  })

  test('layer vueI18n options provides `nl` message', async () => {
    const home = url('/')
    const page = await createPage(undefined) // set browser locale
    await page.goto(home)

    expect(await getText(page, '#layer-message')).toEqual('Bedankt!')
  })
})
