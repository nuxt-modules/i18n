import { test, describe, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup } from '../utils'
import { getText, renderPage } from '../helper'

describe('#2094', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/2094`, import.meta.url)),
    browser: true
  })

  test('vue-i18n messages are loaded from config exported as variable', async () => {
    const { page } = await renderPage('/')

    expect(await getText(page, '#render')).toEqual('こんにちは,'.repeat(10))
  })
})
