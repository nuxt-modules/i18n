import { test, describe, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup } from '../utils'
import { getText, gotoPath, renderPage } from '../helper'

describe('#2132', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/2132`, import.meta.url)),
    browser: true
  })

  test('should be work redirectOn "no prefix"', async () => {
    const { page } = await renderPage('/', { locale: 'ja' })

    expect(await getText(page, '#msg')).toEqual('日本語のメッセージ')

    await gotoPath(page, '/en')
    expect(await getText(page, '#msg')).toEqual('English message')
  })
})
