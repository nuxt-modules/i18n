import { test, describe, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup } from '../utils'
import { getText, renderPage } from '../helper'

describe('#2000', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/2000`, import.meta.url)),
    browser: true
  })

  test('should be loaded vue-i18n messages', async () => {
    const { page } = await renderPage('/')

    expect(await getText(page, '#render')).toEqual('hello,'.repeat(8 * 500))
  })
})
